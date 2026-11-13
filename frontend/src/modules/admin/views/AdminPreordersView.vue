<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { resolveApiUrl } from "@/shared/utils/api";
import { useAuthStore } from "@/modules/auth/auth.store";

interface PreorderReservation {
  id: number;
  preorder_drop_id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  quantity: number;
  payment_type: "full" | "deposit";
  amount_paid: number;
  status: "reserved" | "confirmed" | "cancelled" | "fulfilled";
  notes?: string;
  created_at: string;
}

interface PreorderDrop {
  id: number;
  title: string;
  series_name?: string;
  description?: string;
  image_url?: string;
  release_date?: string;
  cutoff_date?: string;
  full_price: number;
  deposit_price: number;
  allocation_limit: number;
  allocated_count: number;
  status: "open" | "closed" | "sold_out";
  created_at?: string;
  reservations?: PreorderReservation[];
}

const authStore = useAuthStore();
const isLoading = ref(true);
const isSaving = ref(false);
const preorders = ref<PreorderDrop[]>([]);
const searchQuery = ref("");
const statusFilter = ref<string>("all");
const viewMode = ref<"table" | "cards">("table");

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "TBD";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// Modals
const isEditModalOpen = ref(false);
const editingDrop = ref<Partial<PreorderDrop>>({
  title: "",
  series_name: "Pokémon TCG",
  description: "",
  image_url: "",
  release_date: "",
  cutoff_date: "",
  full_price: 3200,
  deposit_price: 500,
  allocation_limit: 50,
  status: "open",
});

const isReservationsModalOpen = ref(false);
const selectedDropForReservations = ref<PreorderDrop | null>(null);

// Image Upload State for Preorder Drop Covers
const isUploadingImage = ref(false);
const imageUploadError = ref("");
const preorderFileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  preorderFileInput.value?.click();
};

const handlePreorderImageUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    imageUploadError.value = "Please select a valid image file (PNG, JPG, WEBP).";
    return;
  }

  isUploadingImage.value = true;
  imageUploadError.value = "";

  try {
    const formData = new FormData();
    formData.append("image", file);

    const token = authStore.token || localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
    const res = await fetch(resolveApiUrl("/api/admin/preorders/upload-image"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await res.json();
    if (res.ok && data.success && data.url) {
      editingDrop.value.image_url = data.url;
      showFeedback("Cover image uploaded successfully!");
    } else {
      imageUploadError.value = data.message || "Failed to upload image.";
    }
  } catch (err: any) {
    imageUploadError.value = err.message || "Network error uploading image.";
  } finally {
    isUploadingImage.value = false;
    if (target) target.value = "";
  }
};

const feedbackMessage = ref<{ type: "success" | "error"; text: string } | null>(null);

const showFeedback = (text: string, type: "success" | "error" = "success") => {
  feedbackMessage.value = { text, type };
  setTimeout(() => {
    feedbackMessage.value = null;
  }, 4000);
};

const getAuthHeaders = () => {
  const token = authStore.token || localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

// Fetch Preorder Drops
const fetchPreorders = async () => {
  isLoading.value = true;
  try {
    const res = await fetch(resolveApiUrl("/api/admin/preorders"), {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      preorders.value = data.data || [];
    } else {
      showFeedback("Failed to load pre-orders", "error");
    }
  } catch (err: any) {
    showFeedback(err?.message || "Network error loading preorders", "error");
  } finally {
    isLoading.value = false;
  }
};

// Filtered preorders
const filteredPreorders = computed(() => {
  return preorders.value.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (d.series_name && d.series_name.toLowerCase().includes(searchQuery.value.toLowerCase()));
    const matchesStatus = statusFilter.value === "all" || d.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

// Summary Stats
const stats = computed(() => {
  const total = preorders.value.length;
  const openCount = preorders.value.filter((d) => d.status === "open").length;
  const totalAllocated = preorders.value.reduce(
    (acc, d) => acc + (d.allocated_count ?? (d as any).reserved_count ?? 0),
    0
  );
  const totalValue = preorders.value.reduce(
    (acc, d) => acc + (d.allocated_count ?? (d as any).reserved_count ?? 0) * Number(d.full_price || 0),
    0
  );
  return { total, openCount, totalAllocated, totalValue };
});

// Create / Edit Drop
const openCreateModal = () => {
  editingDrop.value = {
    title: "",
    series_name: "Pokémon Scarlet & Violet",
    description: "Official English Booster Box • 36 Packs Guaranteed Sealed with Factory Hologram",
    image_url: "",
    release_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    cutoff_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    full_price: 3200,
    deposit_price: 500,
    allocation_limit: 60,
    status: "open",
  };
  isEditModalOpen.value = true;
};

const openEditModal = (drop: PreorderDrop) => {
  editingDrop.value = { ...drop };
  isEditModalOpen.value = true;
};

const saveDrop = async () => {
  if (!editingDrop.value.title) {
    showFeedback("Please enter a title for the drop", "error");
    return;
  }
  isSaving.value = true;
  try {
    const isUpdating = !!editingDrop.value.id;
    const url = isUpdating
      ? resolveApiUrl(`/api/admin/preorders/${editingDrop.value.id}`)
      : resolveApiUrl("/api/admin/preorders");

    const method = isUpdating ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(editingDrop.value),
    });

    if (res.ok) {
      showFeedback(isUpdating ? "Pre-order drop updated!" : "New pre-order drop scheduled!");
      isEditModalOpen.value = false;
      await fetchPreorders();
    } else {
      const err = await res.json();
      showFeedback(err?.message || "Failed to save pre-order drop", "error");
    }
  } catch (err: any) {
    showFeedback(err?.message || "Network error", "error");
  } finally {
    isSaving.value = false;
  }
};

// 1-Click Status Quick Switcher
const updateStatus = async (d: PreorderDrop, newStatus: "open" | "closed" | "sold_out") => {
  try {
    const res = await fetch(resolveApiUrl(`/api/admin/preorders/${d.id}/status`), {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      d.status = newStatus;
      showFeedback(`Drop status switched to ${newStatus.toUpperCase()}`);
    } else {
      showFeedback("Failed to update status", "error");
    }
  } catch (err: any) {
    showFeedback(err?.message || "Network error", "error");
  }
};

// Delete Drop
const deleteDrop = async (d: PreorderDrop) => {
  if (!confirm(`Are you sure you want to delete preorder drop "${d.title}"?`)) return;
  try {
    const res = await fetch(resolveApiUrl(`/api/admin/preorders/${d.id}`), {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      showFeedback("Pre-order drop deleted successfully");
      await fetchPreorders();
    } else {
      showFeedback("Failed to delete pre-order drop", "error");
    }
  } catch (err: any) {
    showFeedback(err?.message || "Network error", "error");
  }
};

// Open Reservations Inspector
const openReservations = (d: PreorderDrop) => {
  selectedDropForReservations.value = d;
  isReservationsModalOpen.value = true;
};

onMounted(() => {
  fetchPreorders();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Feedback Toast -->
    <div
      v-if="feedbackMessage"
      class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-3 backdrop-blur-md transition-all animate-bounce"
      :class="
        feedbackMessage.type === 'success'
          ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
          : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
      "
    >
      <span>{{ feedbackMessage.type === "success" ? "✅" : "⚠️" }}</span>
      <span>{{ feedbackMessage.text }}</span>
    </div>

    <!-- Header Section -->
    <div
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-slate-800 shadow-xl"
    >
      <div>
        <div class="flex items-center gap-2">
          <span class="text-2xl">📅</span>
          <h1 class="text-2xl font-black text-white tracking-wide">
            Pre-Order Drops &amp; Allocation Hub
          </h1>
          <span
            v-if="stats.openCount > 0"
            class="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
          >
            {{ stats.openCount }} ACTIVE DROPS
          </span>
        </div>
        <p class="text-sm text-slate-400 mt-1">
          Schedule upcoming TCG sets, manage reservation quotas, deposit vs full-payment allocations, and track collector pre-orders.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="fetchPreorders"
          class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition font-bold text-sm flex items-center gap-2"
        >
          <span>🔄</span> Refresh
        </button>
        <button
          type="button"
          @click="openCreateModal"
          class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-2"
        >
          <span>+</span> New Pre-Order Drop
        </button>
      </div>
    </div>

    <!-- Summary Metrics -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <p class="text-xs font-bold text-slate-400">Total Pre-Orders</p>
        <p class="text-2xl font-black text-white mt-1">{{ stats.total }}</p>
      </div>
      <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <p class="text-xs font-bold text-slate-400">Open For Booking</p>
        <p class="text-2xl font-black text-emerald-400 mt-1">{{ stats.openCount }}</p>
      </div>
      <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <p class="text-xs font-bold text-slate-400">Allocations Claimed</p>
        <p class="text-2xl font-black text-amber-400 mt-1">{{ stats.totalAllocated }} Units</p>
      </div>
      <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <p class="text-xs font-bold text-slate-400">Committed Value</p>
        <p class="text-2xl font-black text-indigo-400 mt-1">
          ₱{{ stats.totalValue.toLocaleString("en-PH", { minimumFractionDigits: 2 }) }}
        </p>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="relative w-full sm:w-80">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by title or series..."
          class="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:border-amber-400 focus:outline-none"
        />
        <span class="absolute left-3 top-2.5 text-slate-500">🔍</span>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 justify-between sm:justify-end">
        <div class="flex items-center gap-1.5">
          <button
            v-for="st in ['all', 'open', 'closed', 'sold_out']"
            :key="st"
            @click="statusFilter = st"
            class="px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all border shrink-0"
            :class="
              statusFilter === st
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            "
          >
            {{ st === "all" ? "All Drops" : st.replace("_", " ") }}
          </button>
        </div>

        <!-- View Mode Switcher (Table vs Cards) -->
        <div class="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            @click="viewMode = 'table'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            :class="viewMode === 'table' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'"
            title="Switch to Table View"
          >
            <span>📊</span>
            <span>Table</span>
          </button>
          <button
            type="button"
            @click="viewMode = 'cards'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            :class="viewMode === 'cards' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'"
            title="Switch to Card Grid"
          >
            <span>🎴</span>
            <span>Cards</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Drops Grid -->
    <div v-if="isLoading" class="text-center py-20 text-slate-500">
      <div class="animate-spin text-4xl mb-3">📅</div>
      <p class="text-sm font-bold">Loading pre-order calendar drops...</p>
    </div>

    <div
      v-else-if="filteredPreorders.length === 0"
      class="text-center py-16 px-4 rounded-3xl bg-slate-900/50 border border-slate-800"
    >
      <span class="text-5xl">📅</span>
      <h3 class="text-lg font-bold text-white mt-3">No Pre-Orders Scheduled</h3>
      <p class="text-sm text-slate-400 mt-1">
        Publish your first upcoming TCG drop to let collectors reserve with a deposit or full payment.
      </p>
      <button
        type="button"
        @click="openCreateModal"
        class="mt-4 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition"
      >
        + New Pre-Order Drop
      </button>
    </div>

    <!-- TABLE VIEW -->
    <div v-else-if="viewMode === 'table'" class="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-black text-[10px] tracking-wider">
              <th class="p-4">Drop Item &amp; Series</th>
              <th class="p-4">Release Schedule</th>
              <th class="p-4">Pricing</th>
              <th class="p-4 min-w-[200px]">Allocation Quota</th>
              <th class="p-4">Status Quick-Switch</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr
              v-for="d in filteredPreorders"
              :key="d.id"
              class="hover:bg-slate-800/40 transition-colors"
            >
              <!-- Item & Series -->
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <img
                    :src="d.image_url || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=700&auto=format&fit=crop&q=80'"
                    :alt="d.title"
                    class="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div>
                    <span class="inline-block text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      {{ d.series_name || 'Official TCG' }}
                    </span>
                    <h4 class="font-black text-white text-xs leading-snug line-clamp-1 max-w-[240px]">
                      {{ d.title }}
                    </h4>
                    <p v-if="d.description" class="text-[10px] text-slate-400 line-clamp-1 max-w-[240px]">
                      {{ d.description }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Release Date -->
              <td class="p-4 whitespace-nowrap">
                <div class="space-y-0.5">
                  <span class="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-950 text-amber-300 border border-amber-400/30 inline-flex items-center gap-1">
                    <span>🗓️</span> {{ formatDate(d.release_date) }}
                  </span>
                  <span v-if="d.cutoff_date" class="block text-[10px] text-slate-500">
                    Cut-off: {{ formatDate(d.cutoff_date) }}
                  </span>
                </div>
              </td>

              <!-- Pricing -->
              <td class="p-4 whitespace-nowrap">
                <div class="space-y-0.5">
                  <div class="text-xs font-black text-white">
                    ₱{{ Number(d.full_price).toLocaleString("en-PH") }}
                    <span class="text-[10px] text-slate-400 font-normal">Full</span>
                  </div>
                  <div class="text-[11px] font-bold text-amber-400">
                    ₱{{ Number(d.deposit_price).toLocaleString("en-PH") }}
                    <span class="text-[9px] text-slate-400 font-normal">Min Deposit</span>
                  </div>
                </div>
              </td>

              <!-- Allocation Progress Bar -->
              <td class="p-4">
                <div class="space-y-1.5">
                  <div class="flex justify-between text-[11px] font-bold">
                    <span class="text-slate-300">
                      <span class="text-amber-400 font-black">{{ d.allocated_count ?? (d as any).reserved_count ?? 0 }}</span> / {{ d.allocation_limit }} Units
                    </span>
                    <span class="text-slate-400 text-[10px]">
                      {{ Math.max(0, d.allocation_limit - (d.allocated_count ?? (d as any).reserved_count ?? 0)) }} Left
                    </span>
                  </div>
                  <div class="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                      :style="{
                        width: `${Math.min(100, (((d.allocated_count ?? (d as any).reserved_count ?? 0)) / (d.allocation_limit || 1)) * 100)}%`,
                      }"
                    ></div>
                  </div>
                </div>
              </td>

              <!-- Status Quick-Switch -->
              <td class="p-4 whitespace-nowrap">
                <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 inline-flex">
                  <button
                    v-for="st in ['open', 'sold_out', 'closed']"
                    :key="st"
                    type="button"
                    @click="updateStatus(d, st as any)"
                    class="px-2 py-0.5 rounded-lg text-[10px] font-black capitalize transition-all"
                    :class="
                      d.status === st
                        ? st === 'open'
                          ? 'bg-emerald-500 text-slate-950 shadow-xs'
                          : st === 'sold_out'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-300'
                    "
                  >
                    {{ st === 'sold_out' ? 'Sold Out' : st }}
                  </button>
                </div>
              </td>

              <!-- Actions -->
              <td class="p-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="openReservations(d)"
                    class="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition inline-flex items-center gap-1"
                    title="View Customer Reservations"
                  >
                    <span>📋</span>
                    <span>Reservations ({{ d.reservations?.length || d.allocated_count || (d as any).reserved_count || 0 }})</span>
                  </button>
                  <button
                    type="button"
                    @click="openEditModal(d)"
                    class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
                    title="Edit Pre-Order"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    @click="deleteDrop(d)"
                    class="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition"
                    title="Delete Pre-Order Drop"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CARDS GRID VIEW -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="d in filteredPreorders"
        :key="d.id"
        class="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition overflow-hidden shadow-lg flex flex-col justify-between"
      >
        <!-- Header Image & Badges -->
        <div class="relative h-44 bg-slate-950 overflow-hidden border-b border-slate-800">
          <img
            :src="d.image_url || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=700&auto=format&fit=crop&q=80'"
            :alt="d.title"
            class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>

          <!-- Status Ribbon -->
          <div class="absolute top-3 left-3 flex items-center gap-1.5">
            <span
              v-if="d.status === 'open'"
              class="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md"
            >
              ● ACCEPTING ORDERS
            </span>
            <span
              v-else-if="d.status === 'sold_out'"
              class="px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md"
            >
              SOLD OUT
            </span>
            <span
              v-else
              class="px-2.5 py-1 rounded-full text-xs font-black bg-slate-800 text-slate-400 border border-slate-700 backdrop-blur-md"
            >
              CLOSED
            </span>
          </div>

          <!-- Release Date Badge -->
          <div class="absolute bottom-3 left-3">
            <span class="px-2.5 py-1 rounded-lg text-[11px] font-black bg-slate-950/80 text-amber-300 border border-amber-400/30 backdrop-blur-md">
              🗓️ Release: {{ formatDate(d.release_date) }}
            </span>
          </div>
        </div>

        <!-- Details -->
        <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <p class="text-xs font-bold text-amber-400">{{ d.series_name || "Official TCG Set" }}</p>
            <h3 class="text-base font-black text-white mt-1 leading-snug">
              {{ d.title }}
            </h3>
            <p v-if="d.description" class="text-xs text-slate-400 mt-1 line-clamp-2">
              {{ d.description }}
            </p>

            <!-- Pricing Box -->
            <div class="grid grid-cols-2 gap-2 mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase">Full Price</p>
                <p class="text-sm font-black text-white">
                  ₱{{ Number(d.full_price).toLocaleString("en-PH") }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase">Deposit Min</p>
                <p class="text-sm font-black text-amber-400">
                  ₱{{ Number(d.deposit_price).toLocaleString("en-PH") }}
                </p>
              </div>
            </div>

            <!-- Allocation Limit Bar -->
            <div class="mt-3">
              <div class="flex justify-between text-xs font-bold mb-1">
                <span class="text-slate-300">
                  Allocated:
                  <span class="text-amber-400">{{ d.allocated_count || 0 }}</span> / {{ d.allocation_limit }}
                </span>
                <span class="text-slate-400">
                  {{ Math.max(0, d.allocation_limit - (d.allocated_count || 0)) }} Left
                </span>
              </div>
              <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                  :style="{
                    width: `${Math.min(100, ((d.allocated_count || 0) / (d.allocation_limit || 1)) * 100)}%`,
                  }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons & 1-Click Status -->
          <div class="pt-3 border-t border-slate-800/80 space-y-3">
            <!-- 1-Click Status Toggles -->
            <div class="flex items-center justify-between gap-1">
              <span class="text-[11px] font-bold text-slate-400">Status:</span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  @click="updateStatus(d, 'open')"
                  class="px-2 py-0.5 rounded text-[11px] font-bold border transition"
                  :class="
                    d.status === 'open'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  "
                >
                  Open
                </button>
                <button
                  type="button"
                  @click="updateStatus(d, 'sold_out')"
                  class="px-2 py-0.5 rounded text-[11px] font-bold border transition"
                  :class="
                    d.status === 'sold_out'
                      ? 'bg-rose-500 text-white border-rose-400 font-black'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  "
                >
                  Sold Out
                </button>
                <button
                  type="button"
                  @click="updateStatus(d, 'closed')"
                  class="px-2 py-0.5 rounded text-[11px] font-bold border transition"
                  :class="
                    d.status === 'closed'
                      ? 'bg-slate-700 text-white border-slate-600 font-black'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  "
                >
                  Closed
                </button>
              </div>
            </div>

            <!-- Operations: Inspect Reservations, Edit, Delete -->
            <div class="flex items-center justify-between gap-2">
              <button
                type="button"
                @click="openReservations(d)"
                class="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>📋</span> Reservations ({{ d.reservations?.length || d.allocated_count || 0 }})
              </button>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="openEditModal(d)"
                  class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  @click="deleteDrop(d)"
                  class="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CREATE / EDIT MODAL -->
    <div
      v-if="isEditModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        class="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 my-8"
      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">📅</span>
            <h2 class="text-lg font-black text-white">
              {{ editingDrop.id ? "Edit Pre-Order Drop" : "New Pre-Order Drop Schedule" }}
            </h2>
          </div>
          <button
            type="button"
            @click="isEditModalOpen = false"
            class="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Title -->
          <div class="md:col-span-2 space-y-1">
            <label class="text-xs font-bold text-slate-300">Drop Title *</label>
            <input
              v-model="editingDrop.title"
              type="text"
              placeholder="e.g. Pokémon Scarlet & Violet: Surging Sparks Booster Box"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Series Name -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">TCG Series / Franchise</label>
            <input
              v-model="editingDrop.series_name"
              type="text"
              placeholder="e.g. Pokémon TCG"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Cover Image Upload -->
          <div class="md:col-span-2 space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-300">Pre-Order Cover Image</label>
              <span v-if="editingDrop.image_url" class="text-[11px] text-emerald-400 font-bold">✓ Image attached</span>
            </div>

            <!-- Hidden File Input -->
            <input
              ref="preorderFileInput"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              class="hidden"
              @change="handlePreorderImageUpload"
            />

            <!-- Preview & Action Box -->
            <div
              v-if="editingDrop.image_url"
              class="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-between p-3 gap-4"
            >
              <div class="flex items-center gap-3 min-w-0">
                <img
                  :src="editingDrop.image_url"
                  alt="Cover preview"
                  class="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                />
                <div class="min-w-0 text-left">
                  <p class="text-xs font-bold text-white truncate max-w-xs">{{ editingDrop.title || 'Pre-order product cover' }}</p>
                  <p class="text-[10px] text-slate-400 truncate max-w-xs">{{ editingDrop.image_url }}</p>
                  <span class="text-[10px] text-emerald-400 font-semibold">Ready for drop schedule</span>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  @click="triggerFileInput"
                  :disabled="isUploadingImage"
                  class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  {{ isUploadingImage ? 'Uploading...' : 'Replace' }}
                </button>
                <button
                  type="button"
                  @click="editingDrop.image_url = ''"
                  class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition cursor-pointer"
                  title="Remove image"
                >
                  🗑️
                </button>
              </div>
            </div>

            <!-- Upload Drop Zone (when no image selected) -->
            <div
              v-else
              @click="triggerFileInput"
              class="border-2 border-dashed border-slate-800 hover:border-amber-400/60 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-6 text-center cursor-pointer transition space-y-2 group"
            >
              <div class="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto text-xl group-hover:scale-110 transition">
                📷
              </div>
              <div>
                <p class="text-xs font-bold text-white">
                  {{ isUploadingImage ? 'Uploading cover image...' : 'Click to upload pre-order cover image' }}
                </p>
                <p class="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, or WEBP (Max 15MB)</p>
              </div>
              <div v-if="isUploadingImage" class="w-32 mx-auto bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-amber-400 h-full w-full animate-pulse"></div>
              </div>
            </div>

            <p v-if="imageUploadError" class="text-xs text-rose-400 font-semibold">
              ⚠️ {{ imageUploadError }}
            </p>
          </div>

          <!-- Full Price -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Full Price (₱ PHP)</label>
            <input
              v-model.number="editingDrop.full_price"
              type="number"
              min="0"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Deposit Price -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Deposit Min (₱ PHP)</label>
            <input
              v-model.number="editingDrop.deposit_price"
              type="number"
              min="0"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Allocation Limit -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Total Allocation Limit</label>
            <input
              v-model.number="editingDrop.allocation_limit"
              type="number"
              min="1"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Status -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Status</label>
            <select
              v-model="editingDrop.status"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            >
              <option value="open">Open (Accepting Pre-Orders)</option>
              <option value="sold_out">Sold Out</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <!-- Release Date -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Official Release Date</label>
            <input
              v-model="editingDrop.release_date"
              type="date"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Cutoff Date -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Pre-Order Cutoff Date</label>
            <input
              v-model="editingDrop.cutoff_date"
              type="date"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>

          <!-- Description -->
          <div class="md:col-span-2 space-y-1">
            <label class="text-xs font-bold text-slate-300">Description / Collector Perks</label>
            <textarea
              v-model="editingDrop.description"
              rows="3"
              placeholder="Factory sealed booster boxes with promotional bonus card..."
              class="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            @click="isEditModalOpen = false"
            class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="saveDrop"
            :disabled="isSaving"
            class="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20"
          >
            {{ isSaving ? "Saving..." : editingDrop.id ? "Update Drop" : "Schedule Drop" }}
          </button>
        </div>
      </div>
    </div>

    <!-- RESERVATIONS INSPECTION DRAWER -->
    <div
      v-if="isReservationsModalOpen && selectedDropForReservations"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        class="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col"
      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div>
            <h2 class="text-lg font-black text-white flex items-center gap-2">
              <span>📋</span> Collector Reservations: {{ selectedDropForReservations.title }}
            </h2>
            <p class="text-xs text-slate-400">
              Allocated {{ selectedDropForReservations.allocated_count || 0 }} / {{ selectedDropForReservations.allocation_limit }} units.
            </p>
          </div>
          <button
            type="button"
            @click="isReservationsModalOpen = false"
            class="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto space-y-2 pr-1">
          <div
            v-if="!selectedDropForReservations.reservations || selectedDropForReservations.reservations.length === 0"
            class="text-center py-10 text-slate-500 text-xs"
          >
            No reservations registered yet for this drop.
          </div>

          <div
            v-for="r in selectedDropForReservations.reservations"
            :key="r.id"
            class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-white">{{ r.user_name || 'Collector #' + r.user_id }}</span>
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-black uppercase"
                  :class="
                    r.payment_type === 'full'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  "
                >
                  {{ r.payment_type }} Paid
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">
                Qty: <span class="font-bold text-white">{{ r.quantity }}</span> • Paid:
                <span class="font-bold text-amber-300">₱{{ Number(r.amount_paid).toLocaleString("en-PH") }}</span>
                <span class="text-slate-500 ml-2">({{ new Date(r.created_at).toLocaleDateString() }})</span>
              </p>
            </div>

            <div>
              <span
                class="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase"
              >
                {{ r.status }}
              </span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-800 shrink-0 text-right">
          <button
            type="button"
            @click="isReservationsModalOpen = false"
            class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
