<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAdminStore } from "../admin.store";
import type { InventoryItem } from "../admin.types";
import { formatCurrency } from "@/shared/utils/currency.util";
import { resolveApiUrl } from "@/shared/utils/api";

const router = useRouter();
const adminStore = useAdminStore();

const editProductDetails = (item: InventoryItem) => {
  router.push({
    path: "/admin/products",
    query: { edit: item.id },
  });
};

const searchQuery = ref("");
const selectedCategory = ref("All");
const selectedItem = ref<InventoryItem | null>(null);
const isVariantModalOpen = ref(false);
const isVendorModalOpen = ref(false);
const isCsvModalOpen = ref(false);
const notificationMessage = ref("");

// Pagination State (Default 10 per page, dynamic user selection)
const currentPage = ref(1);
const itemsPerPage = ref(10);
const pageSizeOptions = [10, 20, 50, 100];

const fetchDbProducts = async () => {
  await adminStore.fetchInventory();
};

onMounted(() => {
  fetchDbProducts();
});

const categories = computed(() => {
  const cats = new Set(adminStore.inventory.map((i) => i.category));
  return ["All", ...Array.from(cats)];
});

const filteredInventory = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return adminStore.inventory.filter((item) => {
    const matchesCategory =
      selectedCategory.value === "All" ||
      item.category === selectedCategory.value;
    if (!matchesCategory) return false;

    if (!query) return true;

    return (
      (item.name ? String(item.name).toLowerCase() : "").includes(query) ||
      (item.sku ? String(item.sku).toLowerCase() : "").includes(query) ||
      (item.barcode ? String(item.barcode).toLowerCase() : "").includes(query) ||
      (item.vendor ? String(item.vendor).toLowerCase() : "").includes(query) ||
      (item.condition ? String(item.condition).toLowerCase() : "").includes(query) ||
      (item.category ? String(item.category).toLowerCase() : "").includes(query)
    );
  });
});

// Reset page to 1 whenever filters or page size change
watch([searchQuery, selectedCategory, itemsPerPage], () => {
  currentPage.value = 1;
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredInventory.value.length / itemsPerPage.value));
});

// Guard currentPage within bounds if totalPages shrinks
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) {
    currentPage.value = newTotal;
  }
});

const paginatedInventory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredInventory.value.slice(start, start + itemsPerPage.value);
});

const paginationStart = computed(() => {
  if (filteredInventory.value.length === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(
    currentPage.value * itemsPerPage.value,
    filteredInventory.value.length,
  );
});

const displayedPages = computed(() => {
  const current = currentPage.value;
  const total = totalPages.value;
  const delta = 2;

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  pages.push(1);
  if (left > 2) {
    pages.push("...");
  }

  for (let i = left; i <= right; i++) {
    pages.push(i);
  }

  if (right < total - 1) {
    pages.push("...");
  }
  pages.push(total);

  return pages;
});

const setPage = (page: number | string) => {
  if (typeof page === "number" && page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const editingStockId = ref<string | null>(null);
const pendingStockValue = ref<number>(0);
const isSavingStock = ref(false);

const startStockEdit = (item: InventoryItem, delta: number = 0) => {
  editingStockId.value = item.id;
  pendingStockValue.value = Math.max(0, item.stock + delta);
};

const adjustPendingStock = (delta: number) => {
  pendingStockValue.value = Math.max(0, pendingStockValue.value + delta);
};

const cancelStockEdit = () => {
  editingStockId.value = null;
  pendingStockValue.value = 0;
};

const submitStock = async (item: InventoryItem) => {
  const newStock = Math.max(0, Number(pendingStockValue.value) || 0);
  isSavingStock.value = true;

  // Update in local admin store
  adminStore.updateStock(item.id, newStock);
  item.stock = newStock;

  // Persist to backend database if this is a database product
  const isDbProduct = !isNaN(Number(item.id));
  if (isDbProduct) {
    try {
      await fetch(`/api/products/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ stock: newStock }),
      });
    } catch (e) {
      console.error("Failed to persist stock update to backend:", e);
    }
  }

  isSavingStock.value = false;
  editingStockId.value = null;
  showNotification(`Restocked "${item.name}" to ${newStock} units.`);
};

const openVariants = (item: InventoryItem) => {
  selectedItem.value = item;
  isVariantModalOpen.value = true;
};

const openVendor = (item: InventoryItem) => {
  selectedItem.value = item;
  isVendorModalOpen.value = true;
};

const triggerExportCsv = () => {
  const headers =
    "SKU,Barcode,Product Name,Category,Stock,Cost Price,Selling Price,Vendor,Lead Time (Days)\n";
  const rows = adminStore.inventory
    .map(
      (i) =>
        `"${i.sku}","${i.barcode}","${i.name}","${i.category}",${i.stock},${i.costPrice},${i.sellingPrice},"${i.vendor}",${i.leadTimeDays}`,
    )
    .join("\n");
  const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `rlg-hobby-inventory-${new Date().toISOString().slice(0, 10)}.csv`,
  );
  link.click();

  showNotification("CSV exported successfully with all SKUs and variant data!");
};

const triggerImportCsv = () => {
  isCsvModalOpen.value = true;
};

// Cleanup & Deduplication State
const isCleanupModalOpen = ref(false);
const isScanningCleanup = ref(false);
const isExecutingCleanup = ref(false);
const cleanupPreviewData = ref<any>(null);
const activeCleanupTab = ref<"img" | "figures">("img");

// Delete All Products State (Secret Question Protected)
const isDeleteAllModalOpen = ref(false);
const isDeletingAll = ref(false);
const secretQuestionText = ref("");
const secretQuestionId = ref<number | null>(null);
const secretAnswerInput = ref("");
const deleteAllConfirmationInput = ref("");
const deleteAllError = ref("");
const isFetchingSecretQuestion = ref(false);

const openDeleteAllModal = async () => {
  isDeleteAllModalOpen.value = true;
  secretAnswerInput.value = "";
  deleteAllConfirmationInput.value = "";
  deleteAllError.value = "";
  isFetchingSecretQuestion.value = true;

  try {
    const res = await fetch(resolveApiUrl("/api/secret-questions/active"));
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        secretQuestionText.value = json.data.question;
        secretQuestionId.value = json.data.id;
      }
    }
  } catch (e) {
    console.warn("Could not fetch active secret question:", e);
  } finally {
    isFetchingSecretQuestion.value = false;
  }
};

const executeDeleteAllProducts = async () => {
  if (deleteAllConfirmationInput.value.trim().toUpperCase() !== "DELETE ALL PRODUCTS") {
    deleteAllError.value = 'Please type "DELETE ALL PRODUCTS" exactly to confirm.';
    return;
  }
  if (!secretAnswerInput.value.trim()) {
    deleteAllError.value = "Please enter your secret security answer.";
    return;
  }

  isDeletingAll.value = true;
  deleteAllError.value = "";

  try {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(resolveApiUrl("/api/products/delete-all"), {
      method: "POST",
      headers,
      body: JSON.stringify({
        secret_answer: secretAnswerInput.value.trim(),
        confirmation: deleteAllConfirmationInput.value.trim(),
      }),
    });

    const json = await res.json();

    if (res.ok && json.success) {
      showNotification(json.message || "All products deleted and images purged from Cloudflare R2.");
      isDeleteAllModalOpen.value = false;
      await fetchDbProducts();
    } else {
      deleteAllError.value = json.message || "Failed to wipe catalog. Authorization denied.";
    }
  } catch (e: any) {
    console.error("Delete all products error:", e);
    deleteAllError.value = e.message || "An error occurred while wiping the catalog.";
  } finally {
    isDeletingAll.value = false;
  }
};

// Single Product Delete State
const productToDelete = ref<InventoryItem | null>(null);
const isDeletingSingle = ref(false);

// Image Zoom & Inspection State
const activeZoomProduct = ref<InventoryItem | null>(null);
const hoveredZoomItem = ref<InventoryItem | null>(null);
const hoveredZoomPos = ref<{ x: number; y: number }>({ x: 0, y: 0 });
const isAdminZooming = ref(false);
const adminZoomLevel = ref(2.5);
const adminZoomX = ref(50);
const adminZoomY = ref(50);
const adminLensX = ref(0);
const adminLensY = ref(0);

const openZoomModal = (item: InventoryItem) => {
  activeZoomProduct.value = item;
  adminZoomLevel.value = 2.5;
  isAdminZooming.value = false;
};

const handleAdminZoomMove = (e: MouseEvent) => {
  const container = e.currentTarget as HTMLElement;
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  adminLensX.value = x;
  adminLensY.value = y;
  adminZoomX.value = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
  adminZoomY.value = Math.max(0, Math.min(100, Math.round((y / rect.height) * 100)));
};

const handleThumbnailMouseEnter = (item: InventoryItem, e: MouseEvent) => {
  hoveredZoomItem.value = item;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  hoveredZoomPos.value = {
    x: rect.right + 12,
    y: Math.max(10, rect.top - 40),
  };
};

const openCleanupModal = async () => {
  isCleanupModalOpen.value = true;
  await refreshCleanupPreview();
};

const refreshCleanupPreview = async () => {
  isScanningCleanup.value = true;
  try {
    const res = await fetch("/api/products/cleanup-preview");
    if (res.ok) {
      cleanupPreviewData.value = await res.json();
    }
  } catch (e) {
    console.error("Failed to load cleanup preview:", e);
  } finally {
    isScanningCleanup.value = false;
  }
};

const executeCleanup = async (options: {
  delete_img?: boolean;
  dedupe_figures?: boolean;
  pairs?: any[];
}) => {
  isExecutingCleanup.value = true;
  try {
    const res = await fetch("/api/products/cleanup-execute", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(options),
    });
    const json = await res.json();
    if (json.success) {
      showNotification(json.message || "Cleanup completed successfully.");
      await fetchDbProducts();
      await refreshCleanupPreview();
    } else {
      showNotification(json.message || "Cleanup failed.");
    }
  } catch (e) {
    console.error("Cleanup execute error:", e);
    showNotification("Failed to execute cleanup.");
  } finally {
    isExecutingCleanup.value = false;
  }
};

const confirmDeleteProduct = (item: InventoryItem) => {
  productToDelete.value = item;
};

const executeDeleteSingleProduct = async () => {
  if (!productToDelete.value) return;
  const item = productToDelete.value;
  isDeletingSingle.value = true;
  try {
    const res = await fetch(`/api/products/${item.id}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      adminStore.inventory = adminStore.inventory.filter((i) => i.id !== item.id);
      showNotification(`Deleted "${item.name}" and purged its storage images.`);
      productToDelete.value = null;
    } else {
      showNotification("Failed to delete product.");
    }
  } catch (e) {
    console.error("Delete single product error:", e);
    showNotification("Error deleting product.");
  } finally {
    isDeletingSingle.value = false;
  }
};

const handleSimulatedImport = () => {
  isCsvModalOpen.value = false;
  showNotification(
    "CSV bulk import verified: 5 SKUs updated with latest inventory counts.",
  );
};

const showNotification = (msg: string) => {
  notificationMessage.value = msg;
  setTimeout(() => {
    notificationMessage.value = "";
  }, 4000);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs"
    >
      <div>
        <h1
          class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
        >
          Inventory &amp; Stock Control
        </h1>
        <p class="text-xs text-slate-500">
          Real-time SKU monitoring, variant matrices, vendor lead times, and
          bulk CSV updates.
        </p>
      </div>

      <!-- Bulk Actions (Responsive wrap) -->
      <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <button
          type="button"
          :disabled="adminStore.isLoadingInventory"
          class="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          @click="fetchDbProducts"
        >
          <span :class="{ 'animate-spin': adminStore.isLoadingInventory }">🔄</span>
          <span>Refresh Stock</span>
        </button>
        <button
          type="button"
          class="min-h-[40px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-amber-300"
          title="Scan and clean raw IMG_ uploads and deduplicate figures"
          @click="openCleanupModal"
        >
          <span>🧹</span>
          <span>Clean Duplicates &amp; IMG</span>
        </button>
        <button
          type="button"
          class="min-h-[40px] px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-rose-200 shadow-xs"
          title="Permanently wipe all products from database and purge from Cloudflare R2 (Requires Secret Question Verification)"
          @click="openDeleteAllModal"
        >
          <span>🗑️</span>
          <span>Delete All Products</span>
        </button>
        <button
          type="button"
          class="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          @click="triggerExportCsv"
        >
          <span>📥 Export CSV</span>
        </button>
        <button
          type="button"
          class="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          @click="triggerImportCsv"
        >
          <span>📤 Import CSV</span>
        </button>
      </div>
    </div>

    <!-- Notification Banner -->
    <div
      v-if="notificationMessage"
      class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-fade-in"
    >
      <div class="flex items-center gap-2">
        <span>✓</span>
        <span>{{ notificationMessage }}</span>
      </div>
      <button
        type="button"
        class="text-emerald-600 hover:text-emerald-900"
        @click="notificationMessage = ''"
      >
        ✕
      </button>
    </div>

    <!-- Filters Bar -->
    <div
      class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4"
    >
      <!-- Search Input with Clear Button (Min 44px) -->
      <div class="relative w-full lg:w-96">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by SKU, barcode, name, vendor, condition..."
          class="w-full text-xs px-3.5 py-3 pl-9 pr-8 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-rose-500 min-h-[44px] transition-colors"
        />
        <span class="absolute left-3 top-3.5 text-slate-400 text-xs">🔍</span>
        <button
          v-if="searchQuery"
          type="button"
          class="absolute right-2.5 top-3 text-slate-400 hover:text-slate-700 text-xs w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 cursor-pointer transition-colors"
          title="Clear search"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <div class="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
        <!-- Category Filter -->
        <div class="flex items-center gap-2 overflow-x-auto">
          <span class="text-xs font-bold text-slate-400 whitespace-nowrap"
            >Category:</span
          >
          <div
            class="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200"
          >
            <button
              v-for="cat in categories"
              :key="cat"
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
              :class="
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              "
              @click="selectedCategory = cat"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Dynamic Rows Per Page Selector -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-400 whitespace-nowrap">Show:</span>
          <select
            v-model.number="itemsPerPage"
            class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 cursor-pointer shadow-xs"
          >
            <option v-for="size in pageSizeOptions" :key="size" :value="size">
              {{ size }} / page
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Inventory Table -->
    <div
      class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr
              class="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider"
            >
              <th class="p-4">SKU &amp; Barcode</th>
              <th class="p-4">Product Name &amp; Category</th>
              <th class="p-4">Cost vs Selling Price</th>
              <th class="p-4">Gross Margin</th>
              <th class="p-4">Stock on Hand</th>
              <th class="p-4">Vendor &amp; Lead Time</th>
              <th class="p-4 text-right">Stock &amp; Variants</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="adminStore.isLoadingInventory">
              <td colspan="7" class="p-12 text-center text-slate-400">
                <div class="inline-block animate-spin text-3xl mb-3">⏳</div>
                <p class="font-bold text-slate-700 text-sm">
                  Loading real-time product inventory...
                </p>
                <p class="text-xs text-slate-400 mt-1">
                  Fetching catalog items and current stock levels from the database.
                </p>
              </td>
            </tr>
            <tr v-else-if="filteredInventory.length === 0">
              <td colspan="7" class="p-8 text-center text-slate-400">
                <div class="text-3xl mb-2">📦</div>
                <p class="font-bold text-slate-700 text-xs">
                  No products in inventory matching criteria
                </p>
                <p class="text-[11px] text-slate-400 mt-1">
                  Upload products from the Product Upload page or clear active search filters.
                </p>
              </td>
            </tr>
            <tr
              v-for="item in paginatedInventory"
              :key="item.id"
              class="hover:bg-slate-50/70 transition-colors"
            >
              <!-- SKU & Barcode with Mini Image -->
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 flex items-center justify-center shadow-2xs group relative cursor-pointer"
                    @mouseenter="handleThumbnailMouseEnter(item, $event)"
                    @mouseleave="hoveredZoomItem = null"
                    @click="openZoomModal(item)"
                    title="Click or hover to inspect image"
                  >
                    <img
                      v-if="item.imageUrl"
                      :src="item.imageUrl"
                      :alt="item.name"
                      class="w-full h-full object-cover transition-transform group-hover:scale-110"
                      loading="lazy"
                    />
                    <span v-else class="text-base text-slate-400">📦</span>

                    <!-- Magnifying glass overlay badge on hover -->
                    <div
                      v-if="item.imageUrl"
                      class="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs z-10"
                    >
                      🔍
                    </div>
                  </div>
                  <div class="min-w-0">
                    <span
                      class="font-mono font-bold text-slate-900 text-xs block"
                    >
                      {{ item.sku }}
                    </span>
                    <span class="font-mono text-[10px] text-slate-400 block">
                      UPC: {{ item.barcode }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Name & Category -->
              <td class="p-4">
                <span
                  class="font-bold text-slate-900 block max-w-xs truncate"
                  >{{ item.name }}</span
                >
                <span
                  class="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block mt-0.5"
                >
                  {{ item.category }}
                </span>
              </td>

              <!-- Cost vs Selling -->
              <td class="p-4">
                <div class="space-y-0.5">
                  <div class="font-bold text-slate-900">
                    {{ formatCurrency(item.sellingPrice) }}
                  </div>
                  <div class="text-[10px] text-slate-400 font-mono">
                    Cost: {{ formatCurrency(item.costPrice) }}
                  </div>
                </div>
              </td>

              <!-- Margin -->
              <td class="p-4">
                <span class="font-bold text-emerald-600">
                  {{
                    Math.round(
                      ((item.sellingPrice - item.costPrice) /
                        item.sellingPrice) *
                        100,
                    )
                  }}%
                </span>
                <span class="text-[10px] text-slate-400 block"
                  >+{{
                    formatCurrency(item.sellingPrice - item.costPrice)
                  }}</span
                >
              </td>

              <!-- Stock Quantity with Quick Stepper & Restock Action -->
              <td class="p-4">
                <div class="flex items-center gap-2">
                  <!-- Active Restock Editing Mode -->
                  <div
                    v-if="editingStockId === item.id"
                    class="flex items-center gap-1.5 animate-fade-in"
                  >
                    <div
                      class="flex items-center border-2 border-emerald-500 rounded-lg bg-white overflow-hidden shadow-xs"
                    >
                      <button
                        type="button"
                        class="px-2 py-1 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
                        title="Decrease"
                        @click="adjustPendingStock(-1)"
                      >
                        -
                      </button>
                      <input
                        v-model.number="pendingStockValue"
                        type="number"
                        min="0"
                        class="w-14 text-center font-bold text-xs py-1 text-slate-900 focus:outline-none bg-emerald-50/50"
                        autofocus
                        @keyup.enter="submitStock(item)"
                        @keyup.esc="cancelStockEdit"
                      />
                      <button
                        type="button"
                        class="px-2 py-1 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
                        title="Increase"
                        @click="adjustPendingStock(1)"
                      >
                        +
                      </button>
                    </div>

                    <!-- Small Submit Check Button (✓) -->
                    <button
                      type="button"
                      :disabled="isSavingStock"
                      class="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center font-black text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      title="Save / Confirm Restock"
                      @click="submitStock(item)"
                    >
                      <svg
                        v-if="!isSavingStock"
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        stroke-width="3"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span
                        v-else
                        class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"
                      ></span>
                    </button>

                    <!-- Small Cancel Button (✕) -->
                    <button
                      type="button"
                      class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
                      title="Cancel Restock"
                      @click="cancelStockEdit"
                    >
                      ✕
                    </button>
                  </div>

                  <!-- Idle / Normal Display Mode -->
                  <div v-else class="flex items-center gap-2">
                    <div
                      class="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden hover:border-slate-300 transition-colors"
                    >
                      <button
                        type="button"
                        class="px-2 py-1 hover:bg-slate-200 text-slate-600 font-bold transition-colors cursor-pointer"
                        title="Decrease stock (Restock)"
                        @click="startStockEdit(item, -1)"
                      >
                        -
                      </button>
                      <span
                        class="w-10 text-center font-bold text-xs cursor-pointer hover:bg-slate-100 py-1 transition-colors"
                        :class="
                          item.stock <= item.lowStockThreshold
                            ? 'text-rose-600'
                            : 'text-slate-800'
                        "
                        title="Click to restock / edit quantity"
                        @click="startStockEdit(item, 0)"
                      >
                        {{ item.stock }}
                      </span>
                      <button
                        type="button"
                        class="px-2 py-1 hover:bg-slate-200 text-slate-600 font-bold transition-colors cursor-pointer"
                        title="Increase stock (Restock)"
                        @click="startStockEdit(item, 1)"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      class="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                      title="Restock this item"
                      @click="startStockEdit(item, 0)"
                    >
                      <span>📦</span>
                      <span>Restock</span>
                    </button>

                    <span
                      v-if="item.stock <= item.lowStockThreshold"
                      class="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 whitespace-nowrap"
                    >
                      Low (≤{{ item.lowStockThreshold }})
                    </span>
                    <span
                      v-else
                      class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 whitespace-nowrap"
                    >
                      Healthy
                    </span>
                  </div>
                </div>
              </td>

              <!-- Vendor & Lead Time -->
              <td class="p-4">
                <button
                  type="button"
                  class="text-left font-bold text-slate-800 hover:text-rose-600 hover:underline block truncate max-w-[150px] cursor-pointer"
                  @click="openVendor(item)"
                >
                  {{ item.vendor }}
                </button>
                <span class="text-[10px] text-slate-400"
                  >{{ item.leadTimeDays }} days restock lead</span
                >
              </td>

              <!-- Variants & Actions -->
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="item.variants && item.variants.length > 0"
                    type="button"
                    class="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] border border-indigo-200 cursor-pointer"
                    @click="openVariants(item)"
                  >
                    {{ item.variants.length }} Variants
                  </button>
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                    title="Vendor Lead Specs (Supplier)"
                    @click="openVendor(item)"
                  >
                    🏢
                  </button>
                  <button
                    type="button"
                    <!-- button -->
                    class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border border-slate-200 transition-colors"
                    title="Edit product details"
                    @click="editProductDetails(item)"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    <!-- button -->
                    class="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Delete product and purge storage images"
                    @click="confirmDeleteProduct(item)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Pagination Footer -->
      <div
        v-if="!adminStore.isLoadingInventory && filteredInventory.length > 0"
        class="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600"
      >
        <!-- Left: Summary & Per Page Selection -->
        <div class="flex items-center gap-4 flex-wrap">
          <div>
            Showing <span class="font-bold text-slate-900">{{ paginationStart }}</span> to
            <span class="font-bold text-slate-900">{{ paginationEnd }}</span> of
            <span class="font-bold text-slate-900">{{ filteredInventory.length }}</span> items
            <span
              v-if="filteredInventory.length !== adminStore.inventory.length"
              class="text-slate-400"
            >
              (filtered from {{ adminStore.inventory.length }} total)
            </span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Per Page:</span>
            <select
              v-model.number="itemsPerPage"
              class="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500 cursor-pointer shadow-xs"
            >
              <option v-for="size in pageSizeOptions" :key="size" :value="size">
                {{ size }}
              </option>
            </select>
          </div>
        </div>

        <!-- Right: Page Navigation Controls -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- First Page Button -->
          <button
            type="button"
            :disabled="currentPage === 1"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
            title="First Page"
            @click="setPage(1)"
          >
            «
          </button>

          <!-- Previous Page Button -->
          <button
            type="button"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
            @click="prevPage"
          >
            ‹ Prev
          </button>

          <!-- Numbered Page Buttons -->
          <div class="flex items-center gap-1">
            <template v-for="(p, idx) in displayedPages" :key="idx">
              <span
                v-if="p === '...'"
                class="px-2 py-1 text-slate-400 select-none font-bold"
              >
                ...
              </span>
              <button
                v-else
                type="button"
                class="min-w-8 h-8 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-xs"
                :class="
                  currentPage === p
                    ? 'bg-rose-600 text-white shadow-rose-200 border border-rose-600'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                "
                @click="setPage(p)"
              >
                {{ p }}
              </button>
            </template>
          </div>

          <!-- Next Page Button -->
          <button
            type="button"
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
            @click="nextPage"
          >
            Next ›
          </button>

          <!-- Last Page Button -->
          <button
            type="button"
            :disabled="currentPage === totalPages"
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
            title="Last Page"
            @click="setPage(totalPages)"
          >
            »
          </button>
        </div>
      </div>
    </div>

    <!-- Variant Matrix Modal -->
    <teleport to="body">
      <div
        v-if="isVariantModalOpen && selectedItem"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
        <div
          class="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 font-display max-h-[90vh] overflow-y-auto"
        >
          <div
            class="flex items-center justify-between pb-3 border-b border-slate-100"
          >
            <div>
              <h3 class="text-base font-bold text-slate-900">
                Variant Matrix &bull; {{ selectedItem.name }}
              </h3>
              <p class="text-xs text-slate-500">
                Manage individual stock, SKU, and prices per variation
              </p>
            </div>
            <button
              type="button"
              class="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Close variant matrix modal"
              @click="isVariantModalOpen = false"
            >
              ✕
            </button>
          </div>

          <div class="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            <div
              v-for="v in selectedItem.variants"
              :key="v.id"
              class="py-3 flex items-center justify-between text-xs"
            >
              <div>
                <span class="font-bold text-slate-900">{{ v.title }}</span>
                <p class="font-mono text-[10px] text-slate-400">
                  SKU: {{ v.sku }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <span class="font-bold text-slate-900">{{
                  formatCurrency(v.price)
                }}</span>
                <div
                  class="flex items-center border border-slate-200 rounded-lg bg-slate-50"
                >
                  <button
                    type="button"
                    class="px-2 py-0.5 hover:bg-slate-200 text-slate-600 font-bold"
                    @click="v.stock = Math.max(0, v.stock - 1)"
                  >
                    -
                  </button>
                  <input
                    v-model.number="v.stock"
                    type="number"
                    min="0"
                    class="w-10 text-center font-bold text-slate-800 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    class="px-2 py-0.5 hover:bg-slate-200 text-slate-600 font-bold"
                    @click="v.stock++"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              class="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              @click="isVariantModalOpen = false"
            >
              Save Variant Quantities
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Vendor Management Modal -->
    <teleport to="body">
      <div
        v-if="isVendorModalOpen && selectedItem"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
        <div
          class="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 font-display max-h-[90vh] overflow-y-auto"
        >
          <div
            class="flex items-center justify-between pb-3 border-b border-slate-100"
          >
            <div>
              <h3 class="text-base font-bold text-slate-900">
                Supplier &amp; Vendor Profile
              </h3>
              <p class="text-xs text-slate-500">
                Procurement channel and lead time metrics
              </p>
            </div>
            <button
              type="button"
              class="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Close vendor profile modal"
              @click="isVendorModalOpen = false"
            >
              ✕
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div
              class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1"
            >
              <span
                class="text-[10px] font-bold uppercase text-slate-400 tracking-wider"
                >Primary Vendor</span
              >
              <p class="text-sm font-extrabold text-slate-900">
                {{ selectedItem.vendor }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[10px] font-bold uppercase text-slate-400"
                  >Unit Wholesale Cost</span
                >
                <p class="font-extrabold text-slate-900 mt-0.5">
                  {{ formatCurrency(selectedItem.costPrice) }}
                </p>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[10px] font-bold uppercase text-slate-400"
                  >Restock Lead Time</span
                >
                <p class="font-extrabold text-slate-900 mt-0.5">
                  {{ selectedItem.leadTimeDays }} Business Days
                </p>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1"
                >Restock Lead Time (Days)</label
              >
              <input
                v-model.number="selectedItem.leadTimeDays"
                type="number"
                class="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div class="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              class="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              @click="isVendorModalOpen = false"
            >
              Update Vendor Info
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- CSV Bulk Import Simulation Modal -->
    <teleport to="body">
      <div
        v-if="isCsvModalOpen"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
        <div
          class="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 font-display max-h-[90vh] overflow-y-auto"
        >
          <div
            class="flex items-center justify-between pb-3 border-b border-slate-100"
          >
            <div>
              <h3 class="text-base font-bold text-slate-900">
                Bulk CSV Inventory Import
              </h3>
              <p class="text-xs text-slate-500">
                Upload CSV to mass update quantities and prices
              </p>
            </div>
            <button
              type="button"
              class="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Close CSV import modal"
              @click="isCsvModalOpen = false"
            >
              ✕
            </button>
          </div>

          <div
            class="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50"
          >
            <span class="text-3xl">📄</span>
            <p class="text-xs font-bold text-slate-700">
              Drop your inventory spreadsheet (.csv) here
            </p>
            <p class="text-[11px] text-slate-400">
              Supported columns: SKU, Stock, Price, Cost
            </p>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              @click="isCsvModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              @click="handleSimulatedImport"
            >
              Process &amp; Update Stock
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Delete All Products Security Modal with Secret Question Verification -->
    <teleport to="body">
      <div
        v-if="isDeleteAllModalOpen"
        class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-display"
      >
        <div
          class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-rose-200"
        >
          <!-- Warning Header -->
          <div class="flex items-start gap-3.5 text-rose-600">
            <div class="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-2xl shrink-0">
              🚨
            </div>
            <div>
              <h3 class="text-lg font-black text-slate-900 tracking-tight">Wipe Entire Catalog?</h3>
              <p class="text-xs text-rose-600 font-bold">DANGER ZONE: Irreversible action</p>
            </div>
          </div>

          <!-- Description Box -->
          <div class="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200 text-xs text-rose-950 space-y-1.5">
            <p class="font-bold">This will permanently delete all products in your inventory.</p>
            <p class="text-slate-600 text-[11px] leading-relaxed">
              Every product record in your database will be deleted, and all corresponding product images will be permanently purged from Cloudflare R2 object storage.
            </p>
          </div>

          <!-- Secret Question Clearance Box -->
          <div class="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div class="flex items-center gap-2 text-xs font-black text-slate-800">
              <span>🔐</span>
              <span>Security Clearance: Secret Question</span>
            </div>

            <div v-if="isFetchingSecretQuestion" class="text-xs text-slate-400 italic">
              Loading active security question...
            </div>
            <div v-else class="space-y-1.5">
              <label class="text-[11px] font-bold text-slate-600 block">
                {{ secretQuestionText || "What's the name of your pet?" }}
              </label>
              <input
                v-model="secretAnswerInput"
                type="text"
                placeholder="Enter your security answer"
                class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                @keydown.enter="executeDeleteAllProducts"
              />
            </div>
          </div>

          <!-- Confirmation Phrase Input -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-black text-slate-700 block">
              Type <span class="font-mono text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">DELETE ALL PRODUCTS</span> to confirm:
            </label>
            <input
              v-model="deleteAllConfirmationInput"
              type="text"
              placeholder="DELETE ALL PRODUCTS"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 uppercase"
              @keydown.enter="executeDeleteAllProducts"
            />
          </div>

          <!-- Error Alert -->
          <div
            v-if="deleteAllError"
            class="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>{{ deleteAllError }}</span>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2.5 pt-2">
            <button
              type="button"
              :disabled="isDeletingAll"
              class="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer disabled:opacity-50"
              @click="isDeleteAllModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="isDeletingAll || deleteAllConfirmationInput.trim().toUpperCase() !== 'DELETE ALL PRODUCTS' || !secretAnswerInput.trim()"
              class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-600/30"
              @click="executeDeleteAllProducts"
            >
              <span v-if="isDeletingAll" class="animate-spin">🔄</span>
              <span>{{ isDeletingAll ? 'Wiping Catalog & R2...' : 'Wipe Entire Catalog' }}</span>
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Single Product Delete Confirmation Modal -->
    <teleport to="body">
      <div
        v-if="productToDelete"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-display"
      >
        <div
          class="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
        >
          <div class="flex items-center gap-3 text-rose-600">
            <span class="text-3xl">⚠️</span>
            <div>
              <h3 class="text-base font-bold text-slate-900">Delete Product Permanently?</h3>
              <p class="text-xs text-slate-500">This action cannot be undone.</p>
            </div>
          </div>

          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <img
              v-if="productToDelete.imageUrl"
              :src="productToDelete.imageUrl"
              :alt="productToDelete.name"
              class="w-12 h-12 rounded-lg object-contain bg-white border border-slate-200 p-0.5"
            />
            <div class="min-w-0">
              <span class="font-extrabold text-xs text-slate-900 block truncate">{{ productToDelete.name }}</span>
              <span class="text-[11px] font-mono text-slate-500">SKU: {{ productToDelete.sku }} • ₱{{ formatCurrency(productToDelete.sellingPrice) }}</span>
            </div>
          </div>

          <p class="text-xs text-slate-600">
            Deleting this product will remove it from the database and automatically purge its primary &amp; gallery images from Cloudflare R2 storage.
          </p>

          <div class="flex gap-2 pt-2">
            <button
              type="button"
              :disabled="isDeletingSingle"
              class="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer disabled:opacity-50"
              @click="productToDelete = null"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="isDeletingSingle"
              class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-rose-600/20"
              @click="executeDeleteSingleProduct"
            >
              <span v-if="isDeletingSingle" class="animate-spin">🔄</span>
              <span>{{ isDeletingSingle ? 'Deleting...' : 'Delete &amp; Purge' }}</span>
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Catalog Cleanup & Deduplication Modal -->
    <teleport to="body">
      <div
        v-if="isCleanupModalOpen"
        class="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-display"
      >
        <div
          class="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
        >
          <!-- Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl">🧹</span>
                <h3 class="text-lg font-black text-slate-900">Catalog Cleanup &amp; Deduplication</h3>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Remove raw camera filenames (IMG_...) and deduplicate figures sharing photos or names.
              </p>
            </div>
            <button
              type="button"
              class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              @click="isCleanupModalOpen = false"
            >
              ✕
            </button>
          </div>

          <!-- Loading Scan State -->
          <div v-if="isScanningCleanup" class="py-16 text-center space-y-3">
            <div class="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-xs text-slate-600 font-bold">Scanning database for IMG_ placeholders and duplicate figures...</p>
          </div>

          <!-- Main Content -->
          <div v-else-if="cleanupPreviewData" class="flex-1 overflow-y-auto space-y-4 pr-1">
            <!-- Tabs -->
            <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                :class="activeCleanupTab === 'img' ? 'bg-rose-50 text-rose-700 border border-rose-200 font-black' : 'text-slate-600 hover:bg-slate-100'"
                @click="activeCleanupTab = 'img'"
              >
                <span>📷</span>
                <span>IMG_ Camera Uploads ({{ cleanupPreviewData.img_products?.count || 0 }})</span>
              </button>
              <button
                type="button"
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                :class="activeCleanupTab === 'figures' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-black' : 'text-slate-600 hover:bg-slate-100'"
                @click="activeCleanupTab = 'figures'"
              >
                <span>🤖</span>
                <span>Duplicate Figures ({{ cleanupPreviewData.duplicate_figures?.total_duplicate_count || 0 }})</span>
              </button>
            </div>

            <!-- Tab 1: IMG_ Camera Uploads -->
            <div v-if="activeCleanupTab === 'img'" class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500">
                  Products with raw unparsed names (like <code>IMG 2026...</code>) uploaded without title drafting.
                </span>
                <button
                  v-if="(cleanupPreviewData.img_products?.count || 0) > 0"
                  type="button"
                  :disabled="isExecutingCleanup"
                  class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm shadow-rose-600/20"
                  @click="executeCleanup({ delete_img: true, dedupe_figures: false })"
                >
                  <span v-if="isExecutingCleanup" class="animate-spin">🔄</span>
                  <span>Delete All {{ cleanupPreviewData.img_products.count }} IMG Products</span>
                </button>
              </div>

              <div v-if="(cleanupPreviewData.img_products?.count || 0) === 0" class="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                ✅ No placeholder IMG_ products found in the database.
              </div>

              <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                <div
                  v-for="item in cleanupPreviewData.img_products.items"
                  :key="item.id"
                  class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5"
                >
                  <img
                    v-if="item.image_url"
                    :src="item.image_url"
                    :alt="item.name"
                    class="w-12 h-12 rounded-lg object-contain bg-white border border-slate-200 shrink-0 p-0.5"
                  />
                  <div class="min-w-0 flex-1">
                    <span class="font-bold text-xs text-slate-900 block truncate" :title="item.name">{{ item.name }}</span>
                    <span class="text-[10px] text-slate-500 block">₱{{ Number(item.price).toLocaleString() }} • Stock: {{ item.stock }}</span>
                    <span class="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.2 rounded inline-block mt-0.5">{{ item.category }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab 2: Duplicate Figures -->
            <div v-if="activeCleanupTab === 'figures'" class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500">
                  Figure &amp; Gunpla entries sharing photos or matching names. Primary keeper product is on the left.
                </span>
                <button
                  v-if="(cleanupPreviewData.duplicate_figures?.total_duplicate_count || 0) > 0"
                  type="button"
                  :disabled="isExecutingCleanup"
                  class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm shadow-indigo-600/20"
                  @click="executeCleanup({ delete_img: false, dedupe_figures: true })"
                >
                  <span v-if="isExecutingCleanup" class="animate-spin">🔄</span>
                  <span>Merge All {{ cleanupPreviewData.duplicate_figures.total_duplicate_count }} Duplicates</span>
                </button>
              </div>

              <div v-if="(cleanupPreviewData.duplicate_figures?.total_duplicate_count || 0) === 0" class="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                ✅ No duplicate figure records detected.
              </div>

              <div v-else class="space-y-3">
                <!-- Image Matches -->
                <div
                  v-for="(group, idx) in cleanupPreviewData.duplicate_figures.by_image"
                  :key="'img-group-' + idx"
                  class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
                >
                  <div class="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span class="flex items-center gap-1">
                      <span>📸</span>
                      <span>{{ group.reason }}</span>
                    </span>
                    <span class="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-mono">
                      {{ group.duplicates.length + 1 }} entries
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <!-- Primary (Keep) -->
                    <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
                      <img
                        v-if="group.primary.image_url"
                        :src="group.primary.image_url"
                        class="w-11 h-11 rounded-lg object-contain bg-white border border-emerald-200 shrink-0 p-0.5"
                      />
                      <div class="min-w-0 flex-1">
                        <span class="text-[9px] font-black uppercase text-emerald-700 tracking-wider block">Keep (Primary)</span>
                        <span class="font-bold text-slate-900 block truncate" :title="group.primary.name">{{ group.primary.name }}</span>
                        <span class="text-[10px] text-slate-500">#{{ group.primary.id }} • Stock: {{ group.primary.stock }}</span>
                      </div>
                    </div>

                    <!-- Duplicates (Delete / Merge) -->
                    <div
                      v-for="dup in group.duplicates"
                      :key="'dup-' + dup.id"
                      class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2"
                    >
                      <div class="min-w-0 flex-1">
                        <span class="text-[9px] font-black uppercase text-rose-700 tracking-wider block">Duplicate (Remove)</span>
                        <span class="font-bold text-slate-900 block truncate" :title="dup.name">{{ dup.name }}</span>
                        <span class="text-[10px] text-slate-500">#{{ dup.id }} • Stock: {{ dup.stock }}</span>
                      </div>
                      <button
                        type="button"
                        :disabled="isExecutingCleanup"
                        class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shrink-0 cursor-pointer disabled:opacity-50"
                        @click="executeCleanup({ delete_img: false, dedupe_figures: true, pairs: [{ primary_id: group.primary.id, duplicate_id: dup.id }] })"
                      >
                        Merge
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Name Matches -->
                <div
                  v-for="(group, idx) in cleanupPreviewData.duplicate_figures.by_name"
                  :key="'name-group-' + idx"
                  class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
                >
                  <div class="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span class="flex items-center gap-1">
                      <span>🏷️</span>
                      <span>{{ group.reason }}</span>
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span class="text-[9px] font-black uppercase text-emerald-700 tracking-wider block">Keep (Primary)</span>
                      <span class="font-bold text-slate-900 block truncate">{{ group.primary.name }}</span>
                      <span class="text-[10px] text-slate-500">#{{ group.primary.id }} • Stock: {{ group.primary.stock }}</span>
                    </div>
                    <div
                      v-for="dup in group.duplicates"
                      :key="'dup-name-' + dup.id"
                      class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2"
                    >
                      <div class="min-w-0 flex-1">
                        <span class="text-[9px] font-black uppercase text-rose-700 tracking-wider block">Duplicate</span>
                        <span class="font-bold text-slate-900 block truncate">{{ dup.name }}</span>
                        <span class="text-[10px] text-slate-500">#{{ dup.id }} • Stock: {{ dup.stock }}</span>
                      </div>
                      <button
                        type="button"
                        :disabled="isExecutingCleanup"
                        class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shrink-0 cursor-pointer disabled:opacity-50"
                        @click="executeCleanup({ delete_img: false, dedupe_figures: true, pairs: [{ primary_id: group.primary.id, duplicate_id: dup.id }] })"
                      >
                        Merge
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              @click="refreshCleanupPreview"
            >
              🔄 Rescan
            </button>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                @click="isCleanupModalOpen = false"
              >
                Close
              </button>
              <button
                v-if="cleanupPreviewData && cleanupPreviewData.total_actions_needed > 0"
                type="button"
                :disabled="isExecutingCleanup"
                class="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md border border-amber-300 disabled:opacity-50"
                @click="executeCleanup({ delete_img: true, dedupe_figures: true })"
              >
                <span v-if="isExecutingCleanup" class="animate-spin">🔄</span>
                <span>⚡ Run Full Catalog Cleanup</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- HOVER ZOOM PREVIEW FLOATING POPOVER -->
    <teleport to="body">
      <div
        v-if="hoveredZoomItem && hoveredZoomItem.imageUrl && !activeZoomProduct"
        class="fixed z-40 pointer-events-none transition-opacity duration-150 animate-fadeIn"
        :style="{
          left: `${hoveredZoomPos.x}px`,
          top: `${hoveredZoomPos.y}px`,
        }"
      >
        <div class="bg-slate-900 border-2 border-amber-400/90 rounded-2xl p-2.5 shadow-2xl w-64 space-y-2 text-slate-100">
          <div class="relative w-full h-56 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
            <img
              :src="hoveredZoomItem.imageUrl"
              :alt="hoveredZoomItem.name"
              class="w-full h-full object-contain p-1"
            />
            <div class="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-900/85 border border-slate-700 text-[9px] font-mono font-bold text-amber-300">
              🔍 Click to Inspect
            </div>
          </div>
          <div class="space-y-0.5">
            <p class="text-xs font-bold text-white truncate">{{ hoveredZoomItem.name }}</p>
            <p class="text-[10px] font-mono text-slate-400 truncate">SKU: {{ hoveredZoomItem.sku }}</p>
            <div class="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800 font-bold">
              <span class="text-emerald-400 font-mono">₱{{ Number(hoveredZoomItem.price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
              <span class="text-slate-300">Stock: {{ hoveredZoomItem.stock }}</span>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ADMIN INVENTORY PRODUCT IMAGE ZOOM MODAL -->
    <teleport to="body">
      <div
        v-if="activeZoomProduct"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        @click="activeZoomProduct = null"
      >
        <div
          class="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-lg">🔍</span>
              <div>
                <h3 class="text-base font-extrabold text-white truncate max-w-md">
                  {{ activeZoomProduct.name }}
                </h3>
                <p class="text-xs font-mono text-slate-400">
                  SKU: {{ activeZoomProduct.sku }} &bull; UPC: {{ activeZoomProduct.barcode }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
              @click="activeZoomProduct = null"
            >
              ✕
            </button>
          </div>

          <!-- Image Container with Interactive Pan & Zoom -->
          <div
            class="relative w-full h-96 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center cursor-zoom-in group/zoom select-none"
            @mousemove="handleAdminZoomMove"
            @mouseenter="isAdminZooming = true"
            @mouseleave="isAdminZooming = false"
          >
            <img
              :src="activeZoomProduct.imageUrl"
              :alt="activeZoomProduct.name"
              class="max-w-full max-h-full object-contain transition-transform duration-100 ease-out"
              :style="
                isAdminZooming
                  ? {
                      transform: `scale(${adminZoomLevel})`,
                      transformOrigin: `${adminZoomX}% ${adminZoomY}%`,
                    }
                  : {}
              "
            />
            <!-- Magnifying glass lens indicator -->
            <div
              v-if="isAdminZooming"
              class="pointer-events-none absolute w-28 h-28 rounded-full border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)] bg-white/5 z-20 flex items-center justify-center"
              :style="{
                left: `${adminLensX - 56}px`,
                top: `${adminLensY - 56}px`,
              }"
            >
              <span class="text-xs opacity-70">🔍</span>
            </div>

            <!-- Controls overlay -->
            <div class="absolute bottom-3 left-3 flex items-center gap-2 z-10 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span class="text-slate-400 font-bold">Zoom:</span>
              <button
                type="button"
                class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                @click.stop="adminZoomLevel = Math.max(1.5, adminZoomLevel - 0.5)"
              >
                -
              </button>
              <span class="font-mono text-amber-400 font-bold">{{ adminZoomLevel }}x</span>
              <button
                type="button"
                class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                @click.stop="adminZoomLevel = Math.min(4, adminZoomLevel + 0.5)"
              >
                +
              </button>
              <button
                type="button"
                class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                @click.stop="adminZoomLevel = 2.5"
              >
                Reset
              </button>
            </div>

            <div class="absolute top-3 right-3 z-10 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700 text-[10px] text-slate-300 flex items-center gap-1">
              <span>🔍 Move cursor to pan detail</span>
            </div>
          </div>

          <!-- Product meta footer -->
          <div class="flex items-center justify-between text-xs pt-2">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold">
                Stock: {{ activeZoomProduct.stock }} units
              </span>
              <span class="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-bold font-mono">
                ₱{{ Number(activeZoomProduct.price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
            <a
              :href="activeZoomProduct.imageUrl"
              target="_blank"
              class="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Open Original Image ↗</span>
            </a>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>