<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { resolveStorageUrl as resolveImageUrl } from "@/shared/utils/api";
import { useCatalogStore } from "@/modules/catalog/catalog.store";
import AdminProductUploadView from "./AdminProductUploadView.vue";

const catalogStore = useCatalogStore();

interface SalePercentageOption {
  id: number;
  value: number;
}

interface VipProductItem {
  id: number | string;
  name: string;
  sku: string;
  category: string;
  price: number;
  original_price: number | null;
  sale_percentage_id: number | null;
  sale_percentage?: { id: number; value: number } | null;
  is_promotion: boolean;
  stock: number;
  image_url: string;
}

interface SubscriberUser {
  id: number;
  name: string;
  email: string;
  is_vip: boolean;
  pro_subscribed_at: string | null;
  created_at: string;
}

const activeTab = ref<"vip-products" | "upload-vip" | "subscribers">("vip-products");

const salePercentages = ref<SalePercentageOption[]>(
  Array.from({ length: 100 }, (_, i) => ({ id: i + 1, value: i + 1 })),
);
const vipProducts = ref<VipProductItem[]>([]);
const allProducts = ref<VipProductItem[]>([]);
const subscribers = ref<SubscriberUser[]>([]);
const subscriberStats = ref({
  total_subscribers: 0,
  subscription_price: 999,
  estimated_revenue: 0,
});

const isLoading = ref(false);
const feedbackMessage = ref("");
const errorMessage = ref("");

// Upload VIP Product Form State
const newVipForm = ref({
  name: "",
  sku: "",
  category: "Pokémon TCG",
  originalPrice: 1000,
  salePercentageId: 20 as number | null,
  stock: 10,
  condition: "Mint (M)",
  rarity: "Ultra Rare",
  description: "",
  imageUrl: "",
});
const selectedImageFile = ref<File | null>(null);
const imagePreviewUrl = ref("");
const isSubmittingVip = ref(false);

// Product Selector Modal State
const isSelectorModalOpen = ref(false);
const selectorSearch = ref("");
const selectedProductIds = ref<number[]>([]);
const selectorSalePercentageId = ref<number>(15);
const isApplyingPromotion = ref(false);

const selectedPercentageValue = computed(() => {
  if (!newVipForm.value.salePercentageId) return 0;
  const found = salePercentages.value.find(
    (sp) => sp.id === Number(newVipForm.value.salePercentageId),
  );
  return found ? found.value : 0;
});

const computedDiscountedPrice = computed(() => {
  const base = Number(newVipForm.value.originalPrice) || 0;
  const pct = selectedPercentageValue.value;
  if (pct <= 0) return base;
  return Number(Math.max(0, base - base * (pct / 100)).toFixed(2));
});

const filteredSelectorProducts = computed(() => {
  const q = selectorSearch.value.trim().toLowerCase();
  if (!q) return allProducts.value;
  return allProducts.value.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)),
  );
});

const showFeedback = (msg: string) => {
  feedbackMessage.value = msg;
  errorMessage.value = "";
  setTimeout(() => {
    feedbackMessage.value = "";
  }, 4000);
};

const handleVipProductSaved = async () => {
  await fetchProducts();
  activeTab.value = "vip-products";
  showFeedback("✨ VIP Product published successfully and synchronized with the VIP storefront!");
};

const fetchSalePercentages = async () => {
  try {
    const res = await fetch("/api/sale-percentages");
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        salePercentages.value = json.data;
      }
    }
  } catch (e) {
    console.warn("Using default 1-100 sale percentages fallback", e);
  }
};

const fetchProducts = async () => {
  isLoading.value = true;
  try {
    const res = await fetch("/api/products?per_page=200");
    if (res.ok) {
      const json = await res.json();
      const rawList = Array.isArray(json.data) ? json.data : [];
      allProducts.value = rawList.map((p: any) => ({
        id: Number(p.id),
        name: p.name,
        sku: p.sku || `SKU-${p.id}`,
        category: p.category?.name || p.category || "Pokémon TCG",
        price: Number(p.price || 0),
        original_price: p.original_price ? Number(p.original_price) : null,
        sale_percentage_id: p.sale_percentage_id ? Number(p.sale_percentage_id) : null,
        sale_percentage: p.sale_percentage || null,
        is_promotion: Boolean(p.is_promotion),
        stock: Number(p.stock ?? 0),
        image_url: resolveImageUrl(p.image_url || p.imageUrl),
      }));
      vipProducts.value = allProducts.value.filter((p) => p.is_promotion);
    }
  } catch (e) {
    console.error("Failed to load products for Pro Subscription view", e);
  } finally {
    isLoading.value = false;
  }
};

const fetchSubscribers = async () => {
  try {
    const res = await fetch("/api/admin/pro-subscriptions");
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        subscribers.value = json.data.users || [];
        subscriberStats.value = {
          total_subscribers: json.data.total_subscribers ?? 0,
          subscription_price: json.data.subscription_price ?? 999,
          estimated_revenue: json.data.estimated_revenue ?? 0,
        };
      }
    }
  } catch (e) {
    console.error("Failed to fetch Pro subscribers", e);
  }
};

const handleImageSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  selectedImageFile.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);
};

const isAnalyzingAiVision = ref(false);

const handleAiVisionAnalyze = async () => {
  if (!selectedImageFile.value && !newVipForm.value.imageUrl.trim()) {
    errorMessage.value = "Please select an image file or enter an image URL first to analyze with AI Vision.";
    return;
  }

  isAnalyzingAiVision.value = true;
  errorMessage.value = "";

  try {
    const formData = new FormData();
    if (selectedImageFile.value) {
      formData.append("image", selectedImageFile.value);
    } else if (newVipForm.value.imageUrl.trim()) {
      formData.append("image_url", newVipForm.value.imageUrl.trim());
    }

    const res = await fetch("/api/ai/analyze-product-image", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    const json = await res.json();
    if (res.ok && json.data) {
      const data = json.data;
      if (data.description) {
        newVipForm.value.description = data.description;
      }
      if (data.name && (!newVipForm.value.name || newVipForm.value.name.trim() === "")) {
        newVipForm.value.name = data.name;
      }
      if (data.category) {
        newVipForm.value.category = data.category;
      }
      if (data.rarity) {
        newVipForm.value.rarity = data.rarity;
      }
      if (data.price && (!newVipForm.value.originalPrice || newVipForm.value.originalPrice === 1000)) {
        newVipForm.value.originalPrice = Number(data.price);
      }
      if (data.condition) {
        newVipForm.value.condition = data.condition;
      }

      showFeedback("✨ AI Vision successfully analyzed image and auto-populated the VIP description & specs!");
    } else {
      errorMessage.value = json.message || "AI Vision could not extract details from this image.";
    }
  } catch (e: any) {
    console.error("AI Vision analysis failed", e);
    errorMessage.value = "Failed to connect to AI Vision service.";
  } finally {
    isAnalyzingAiVision.value = false;
  }
};

const handleUploadVipProduct = async () => {
  errorMessage.value = "";
  if (!newVipForm.value.name.trim()) {
    errorMessage.value = "Please enter a product name.";
    return;
  }

  isSubmittingVip.value = true;
  try {
    const formData = new FormData();
    formData.append("name", newVipForm.value.name.trim());
    if (newVipForm.value.sku.trim()) {
      formData.append("sku", newVipForm.value.sku.trim());
    }
    formData.append("category", newVipForm.value.category);
    formData.append("price", String(newVipForm.value.originalPrice));
    formData.append("original_price", String(newVipForm.value.originalPrice));
    if (newVipForm.value.salePercentageId) {
      formData.append("sale_percentage_id", String(newVipForm.value.salePercentageId));
    }
    formData.append("is_promotion", "1");
    formData.append("stock", String(newVipForm.value.stock));
    formData.append("condition", newVipForm.value.condition);
    formData.append("rarity", newVipForm.value.rarity);
    formData.append(
      "description",
      newVipForm.value.description ||
        "Exclusive VIP / Pro Collector Release with special promotion pricing.",
    );

    if (selectedImageFile.value) {
      formData.append("image", selectedImageFile.value);
    } else if (newVipForm.value.imageUrl.trim()) {
      formData.append("image_url", newVipForm.value.imageUrl.trim());
    }

    const res = await fetch("/api/products/vip", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) {
      errorMessage.value = json?.message || "Failed to upload VIP product.";
      return;
    }

    showFeedback(
      `VIP Product "${newVipForm.value.name}" uploaded with ${selectedPercentageValue.value}% Pro discount!`,
    );
    newVipForm.value.name = "";
    newVipForm.value.sku = "";
    newVipForm.value.description = "";
    newVipForm.value.imageUrl = "";
    selectedImageFile.value = null;
    imagePreviewUrl.value = "";

    await fetchProducts();
    await catalogStore.fetchProducts();
    activeTab.value = "vip-products";
  } catch (e) {
    console.error("Failed to upload VIP product", e);
    errorMessage.value = "Network error while uploading VIP product.";
  } finally {
    isSubmittingVip.value = false;
  }
};

const openProductSelectorModal = () => {
  selectedProductIds.value = vipProducts.value.map((p) => Number(p.id));
  isSelectorModalOpen.value = true;
};

const toggleProductSelection = (id: number) => {
  const idx = selectedProductIds.value.indexOf(id);
  if (idx > -1) {
    selectedProductIds.value.splice(idx, 1);
  } else {
    selectedProductIds.value.push(id);
  }
};

const selectAllFiltered = () => {
  const ids = filteredSelectorProducts.value.map((p) => Number(p.id));
  const allSelected = ids.every((id) => selectedProductIds.value.includes(id));
  if (allSelected) {
    selectedProductIds.value = selectedProductIds.value.filter(
      (id) => !ids.includes(id),
    );
  } else {
    const merged = new Set([...selectedProductIds.value, ...ids]);
    selectedProductIds.value = Array.from(merged);
  }
};

const handleApplySelectedPromotion = async () => {
  if (selectedProductIds.value.length === 0) {
    errorMessage.value = "Please check at least one product to apply the promotion.";
    return;
  }

  isApplyingPromotion.value = true;
  try {
    const res = await fetch("/api/products/apply-promotion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        product_ids: selectedProductIds.value,
        sale_percentage_id: selectorSalePercentageId.value,
        is_promotion: true,
      }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      isSelectorModalOpen.value = false;
      showFeedback(
        json.message ||
          `Applied ${selectorSalePercentageId.value}% discount to ${selectedProductIds.value.length} selected VIP products!`,
      );
      await fetchProducts();
      await catalogStore.fetchProducts();
    } else {
      errorMessage.value = json?.message || "Failed to apply promotion.";
    }
  } catch (e) {
    console.error("Failed to apply promotion", e);
    errorMessage.value = "Server error while applying promotion.";
  } finally {
    isApplyingPromotion.value = false;
  }
};

const removeProductFromVip = async (product: VipProductItem) => {
  try {
    const res = await fetch("/api/products/apply-promotion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        product_ids: [Number(product.id)],
        sale_percentage_id: null,
        is_promotion: false,
      }),
    });
    if (res.ok) {
      showFeedback(`Removed "${product.name}" from VIP promotions & restored original price.`);
      await fetchProducts();
      await catalogStore.fetchProducts();
    }
  } catch (e) {
    console.error("Failed to remove VIP status", e);
  }
};

const toggleUserVipStatus = async (user: SubscriberUser) => {
  try {
    const res = await fetch(`/api/admin/pro-subscriptions/${user.id}/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ is_vip: !user.is_vip }),
    });
    if (res.ok) {
      user.is_vip = !user.is_vip;
      showFeedback(
        `${user.name} is now ${user.is_vip ? "a VIP Pro Subscriber 👑" : "a Standard Member"}.`,
      );
      await fetchSubscribers();
    }
  } catch (e) {
    console.error("Failed to toggle user VIP status", e);
  }
};

const formatCurrency = (val: number) =>
  `₱${Number(val || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

onMounted(() => {
  fetchSalePercentages();
  fetchProducts();
  fetchSubscribers();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div
      class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/15 via-pink-500/10 to-purple-500/15 p-6 rounded-2xl border border-amber-300/60 shadow-xs"
    >
      <div class="flex items-start gap-3.5">
        <div
          class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center text-2xl font-black shadow-md shrink-0"
        >
          👑
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pro Subscription &amp; VIP Command Center
            </h1>
            <span
              class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950"
            >
              ₱999 / Membership
            </span>
          </div>
          <p class="text-xs text-slate-600 mt-0.5">
            Upload VIP-exclusive products (`is_promotion = true`), apply `sale_percentage` (1%–100%) discounts via ID, and manage Pro subscribers.
          </p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          :class="
            activeTab === 'vip-products'
              ? 'bg-slate-900 text-amber-400 shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          "
          @click="activeTab = 'vip-products'"
        >
          👑 VIP Products ({{ vipProducts.length }})
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          :class="
            activeTab === 'upload-vip'
              ? 'bg-slate-900 text-amber-400 shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          "
          @click="activeTab = 'upload-vip'"
        >
          ➕ Upload VIP Product
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          :class="
            activeTab === 'subscribers'
              ? 'bg-slate-900 text-amber-400 shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          "
          @click="activeTab = 'subscribers'"
        >
          🎖️ Pro Subscribers ({{ subscriberStats.total_subscribers }})
        </button>
      </div>
    </div>

    <!-- Feedback / Error Alerts -->
    <div
      v-if="feedbackMessage"
      class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between"
    >
      <span>✅ {{ feedbackMessage }}</span>
      <button type="button" class="text-emerald-600 hover:text-emerald-900" @click="feedbackMessage = ''">✕</button>
    </div>
    <div
      v-if="errorMessage"
      class="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between"
    >
      <span>⚠️ {{ errorMessage }}</span>
      <button type="button" class="text-rose-600 hover:text-rose-900" @click="errorMessage = ''">✕</button>
    </div>

    <!-- KPI Summary Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          VIP Exclusive Catalog (`is_promotion`)
        </span>
        <p class="text-2xl font-black text-slate-900 mt-1">
          {{ vipProducts.length }} Products
        </p>
        <p class="text-[11px] text-amber-600 font-semibold mt-1">
          Displayed on `/vip` with Gold VIP Badge
        </p>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Active Pro Subscribers
        </span>
        <p class="text-2xl font-black text-slate-900 mt-1">
          {{ subscriberStats.total_subscribers }} Members
        </p>
        <p class="text-[11px] text-emerald-600 font-semibold mt-1">
          Est. Subscription Revenue: {{ formatCurrency(subscriberStats.estimated_revenue) }}
        </p>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          `sale_percentage` Lookup Table
        </span>
        <p class="text-2xl font-black text-slate-900 mt-1">
          {{ salePercentages.length }} Tiers (1%–100%)
        </p>
        <p class="text-[11px] text-indigo-600 font-semibold mt-1">
          Backend resolves discount via `sale_percentage_id`
        </p>
      </div>
    </div>

    <!-- TAB 1: VIP PRODUCTS LIST & PRODUCT SELECTOR TRIGGER -->
    <div v-if="activeTab === 'vip-products'" class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 class="text-base font-black text-slate-900">
            VIP &amp; Promotional Products (`is_promotion = true`)
          </h2>
          <p class="text-xs text-slate-500">
            Products listed here appear on the Storefront VIP Subscription page with a VIP badge and verified `sale_percentage` discount.
          </p>
        </div>
        <div class="flex items-center gap-2.5">
          <button
            type="button"
            class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            @click="openProductSelectorModal"
          >
            <span>☑️ Select Products for Promotion</span>
          </button>
          <button
            type="button"
            class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
            @click="activeTab = 'upload-vip'"
          >
            + Upload New VIP Item
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="py-12 text-center text-xs text-slate-400 font-semibold">
        Loading VIP products...
      </div>

      <div
        v-else-if="vipProducts.length === 0"
        class="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3"
      >
        <div class="text-3xl">👑</div>
        <p class="text-sm font-bold text-slate-800">No VIP / Promotional Products Yet</p>
        <p class="text-xs text-slate-500 max-w-md mx-auto">
          Upload a dedicated VIP product or click "Select Products for Promotion" to pick existing catalog items and assign a `sale_percentage` ID.
        </p>
        <div class="flex justify-center gap-2 pt-1">
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer"
            @click="openProductSelectorModal"
          >
            Select Existing Products
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
            @click="activeTab = 'upload-vip'"
          >
            Upload New VIP Product
          </button>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="item in vipProducts"
          :key="item.id"
          class="flex items-center gap-3.5 p-3.5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-white hover:shadow-md transition-all"
        >
          <div class="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
            <img
              :src="item.image_url"
              :alt="item.name"
              class="w-full h-full object-cover"
            />
            <span
              class="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] uppercase shadow-xs"
            >
              VIP
            </span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                {{
                  item.sale_percentage?.value
                    ? `-${item.sale_percentage.value}% (ID #${item.sale_percentage_id})`
                    : item.sale_percentage_id
                      ? `-${item.sale_percentage_id}% (ID #${item.sale_percentage_id})`
                      : "VIP Exclusive"
                }}
              </span>
              <span class="text-[10px] text-slate-400 font-mono truncate">{{ item.sku }}</span>
            </div>
            <h3 class="text-xs font-bold text-slate-900 truncate mt-1">
              {{ item.name }}
            </h3>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-sm font-black text-rose-600">
                {{ formatCurrency(item.price) }}
              </span>
              <span
                v-if="item.original_price && item.original_price > item.price"
                class="text-[11px] text-slate-400 line-through"
              >
                {{ formatCurrency(item.original_price) }}
              </span>
            </div>
          </div>

          <button
            type="button"
            title="Remove from VIP Promotion"
            class="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold cursor-pointer transition-colors"
            @click="removeProductFromVip(item)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- TAB 2: UPLOAD VIP / PRO PRODUCT (`POST /api/products/vip`) -->
    <div v-if="activeTab === 'upload-vip'" class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 max-w-3xl">
      <div class="pb-4 border-b border-slate-100 mb-5">
        <h2 class="text-base font-black text-slate-900">
          Upload New VIP / Pro Exclusive Product (`POST /api/products/vip`)
        </h2>
        <p class="text-xs text-slate-500">
          Automatically sets `is_promotion = true` and calculates the final price on the backend using the selected `sale_percentage` table ID.
        </p>
      </div>

      <form class="space-y-4 text-xs" @submit.prevent="handleUploadVipProduct">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold text-slate-800 mb-1">Product Name *</label>
            <input
              v-model="newVipForm.name"
              type="text"
              required
              placeholder="e.g. Pikachu VMAX Gold Box (VIP Exclusive)"
              class="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label class="block font-bold text-slate-800 mb-1">SKU (Optional)</label>
            <input
              v-model="newVipForm.sku"
              type="text"
              placeholder="Auto-generated if blank"
              class="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block font-bold text-slate-800 mb-1">Original Price (PHP ₱) *</label>
            <input
              v-model.number="newVipForm.originalPrice"
              type="number"
              min="1"
              step="0.01"
              required
              class="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-800 mb-1">
              Sale Percentage ID (`sale_percentage`) *
            </label>
            <select
              v-model.number="newVipForm.salePercentageId"
              class="w-full p-2.5 rounded-xl border border-amber-400 bg-amber-50/40 text-slate-900 font-bold focus:outline-none focus:border-amber-600"
            >
              <option :value="null">No Discount (0%)</option>
              <option
                v-for="sp in salePercentages"
                :key="sp.id"
                :value="sp.id"
              >
                ID #{{ sp.id }} — {{ sp.value }}% OFF
              </option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-800 mb-1">Computed VIP Price</label>
            <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-sm flex items-center justify-between">
              <span>{{ formatCurrency(computedDiscountedPrice) }}</span>
              <span class="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                -{{ selectedPercentageValue }}%
              </span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block font-bold text-slate-800 mb-1">Category</label>
            <input
              v-model="newVipForm.category"
              type="text"
              class="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
            />
          </div>
          <div>
            <label class="block font-bold text-slate-800 mb-1">Stock Quantity</label>
            <input
              v-model.number="newVipForm.stock"
              type="number"
              min="0"
              class="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
            />
          </div>
          <div>
            <label class="block font-bold text-slate-800 mb-1">Rarity</label>
            <input
              v-model="newVipForm.rarity"
              type="text"
              class="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
            />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block font-bold text-slate-800">Product Image Upload or URL</label>
            <button
              type="button"
              :disabled="isAnalyzingAiVision || (!selectedImageFile && !newVipForm.imageUrl.trim())"
              class="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
              @click="handleAiVisionAnalyze"
            >
              <span v-if="isAnalyzingAiVision" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-else>✨</span>
              <span>{{ isAnalyzingAiVision ? "AI Vision Analyzing..." : "AI Vision Auto-Fill" }}</span>
            </button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="file"
              accept="image/*"
              class="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs"
              @change="handleImageSelect"
            />
            <input
              v-model="newVipForm.imageUrl"
              type="text"
              placeholder="Or paste direct image URL..."
              class="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
            />
          </div>
          <div v-if="imagePreviewUrl || newVipForm.imageUrl" class="mt-2.5 p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <img
                :src="imagePreviewUrl || resolveImageUrl(newVipForm.imageUrl)"
                alt="VIP Preview"
                class="w-14 h-14 rounded-lg object-contain bg-white border border-slate-200 p-0.5"
              />
              <div>
                <span class="text-xs font-bold text-slate-900 block">Image Ready for Upload</span>
                <span class="text-[11px] text-purple-700 font-medium">Click "AI Vision Auto-Fill" to inspect image &amp; auto-populate description</span>
              </div>
            </div>
            <button
              type="button"
              :disabled="isAnalyzingAiVision"
              class="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
              @click="handleAiVisionAnalyze"
            >
              <span>{{ isAnalyzingAiVision ? "Scanning..." : "✨ Scan with AI" }}</span>
            </button>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block font-bold text-slate-800">Description</label>
            <button
              v-if="selectedImageFile || newVipForm.imageUrl"
              type="button"
              :disabled="isAnalyzingAiVision"
              class="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
              @click="handleAiVisionAnalyze"
            >
              <span>✨ Re-generate description via AI Vision</span>
            </button>
          </div>
          <textarea
            v-model="newVipForm.description"
            rows="3"
            placeholder="Describe why this item is a special VIP / Pro collector drop or click AI Vision to auto-generate..."
            class="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium"
          ></textarea>
        </div>

        <div class="pt-2 flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            @click="activeTab = 'vip-products'"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSubmittingVip"
            class="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black shadow-sm cursor-pointer"
          >
            {{ isSubmittingVip ? "Uploading VIP Product..." : "👑 Publish VIP Product" }}
          </button>
        </div>
      </form>
    </div>

    <!-- TAB 3: PRO SUBSCRIBERS DIRECTORY & PERKS -->
    <div v-if="activeTab === 'subscribers'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Perks Card -->
      <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-lg">
        <div class="flex items-center justify-between">
          <span class="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
            Pro Tier Plan
          </span>
          <span class="text-xl font-black text-amber-400">₱999.00</span>
        </div>
        <h3 class="text-lg font-black">Included "Become a Pro" Perks</h3>
        <ul class="space-y-2.5 text-xs text-slate-200">
          <li class="flex items-center gap-2">
            <span class="text-amber-400">✦</span> Free access to the grader feature
          </li>
          <li class="flex items-center gap-2">
            <span class="text-amber-400">✦</span> Free access with special promotion price
          </li>
          <li class="flex items-center gap-2">
            <span class="text-amber-400">✦</span> Free 1 random ex, V, vmax, vstar card
          </li>
          <li class="flex items-center gap-2">
            <span class="text-amber-400">✦</span> Free 1 25th Anniversary card
          </li>
          <li class="flex items-center gap-2">
            <span class="text-amber-400">✦</span> Free 1 Pokeball holo Card
          </li>
          <li class="flex items-center gap-2">
            <span class="text-amber-400">✦</span> Free 1 Mirror Holo Card
          </li>
        </ul>
      </div>

      <!-- Subscribers Table -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div>
          <h3 class="text-base font-black text-slate-900">Customer VIP / Pro Status</h3>
          <p class="text-xs text-slate-500">
            Subscribed members receive a Gold VIP badge next to their name in the storefront header.
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                <th class="py-2.5 px-3">Customer</th>
                <th class="py-2.5 px-3">Status</th>
                <th class="py-2.5 px-3">Subscribed Date</th>
                <th class="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="u in subscribers" :key="u.id" class="hover:bg-slate-50/80">
                <td class="py-3 px-3">
                  <p class="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{{ u.name }}</span>
                    <span
                      v-if="u.is_vip"
                      class="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[9px] uppercase"
                    >
                      👑 VIP
                    </span>
                  </p>
                  <p class="text-[11px] text-slate-500 font-mono">{{ u.email }}</p>
                </td>
                <td class="py-3 px-3">
                  <span
                    class="px-2.5 py-1 rounded-full text-[10px] font-bold"
                    :class="
                      u.is_vip
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    "
                  >
                    {{ u.is_vip ? "Pro Subscriber" : "Standard" }}
                  </span>
                </td>
                <td class="py-3 px-3 text-slate-500">
                  {{
                    u.pro_subscribed_at
                      ? new Date(u.pro_subscribed_at).toLocaleDateString()
                      : "—"
                  }}
                </td>
                <td class="py-3 px-3 text-right">
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer transition-colors"
                    :class="
                      u.is_vip
                        ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600'
                        : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                    "
                    @click="toggleUserVipStatus(u)"
                  >
                    {{ u.is_vip ? "Revoke VIP" : "Grant VIP" }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PRODUCT SELECTOR MODAL FOR PROMOTIONS -->
    <teleport to="body">
      <div
        v-if="isSelectorModalOpen"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
        <div
          class="bg-white text-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden [color-scheme:light]"
        >
          <!-- Modal Header -->
          <div class="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="text-base font-black text-slate-900">
                Select Products for Promotion &amp; VIP Discount
              </h3>
              <p class="text-xs text-slate-500">
                Check the specific products you want to promote. The selected discount from `sale_percentage` will only apply to checked products.
              </p>
            </div>
            <button
              type="button"
              class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              @click="isSelectorModalOpen = false"
            >
              ✕
            </button>
          </div>

          <!-- Controls Bar -->
          <div class="p-4 bg-slate-50 border-b border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div class="sm:col-span-1">
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Discount Tier (`sale_percentage` ID)
              </label>
              <select
                v-model.number="selectorSalePercentageId"
                class="w-full p-2 rounded-xl border border-amber-400 bg-white text-slate-900 text-xs font-bold"
              >
                <option
                  v-for="sp in salePercentages"
                  :key="sp.id"
                  :value="sp.id"
                >
                  ID #{{ sp.id }} — {{ sp.value }}% OFF
                </option>
              </select>
            </div>

            <div class="sm:col-span-2 flex items-end gap-2">
              <div class="flex-1">
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Search Catalog
                </label>
                <input
                  v-model="selectorSearch"
                  type="text"
                  placeholder="Search by product name or SKU..."
                  class="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                />
              </div>
              <button
                type="button"
                class="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer shrink-0"
                @click="selectAllFiltered"
              >
                Toggle All
              </button>
            </div>
          </div>

          <!-- Product Grid with Images and Checkboxes -->
          <div class="p-4 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh]">
            <label
              v-for="prod in filteredSelectorProducts"
              :key="prod.id"
              class="flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all select-none"
              :class="
                selectedProductIds.includes(Number(prod.id))
                  ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              "
            >
              <input
                type="checkbox"
                class="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
                :checked="selectedProductIds.includes(Number(prod.id))"
                @change="toggleProductSelection(Number(prod.id))"
              />
              <img
                :src="prod.image_url"
                :alt="prod.name"
                class="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
              />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-slate-900 truncate">
                  {{ prod.name }}
                </p>
                <div class="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span class="font-bold text-slate-800">
                    {{ formatCurrency(prod.original_price || prod.price) }}
                  </span>
                  <span>→</span>
                  <span class="font-black text-emerald-700">
                    {{
                      formatCurrency(
                        (prod.original_price || prod.price) *
                          (1 - selectorSalePercentageId / 100),
                      )
                    }}
                  </span>
                </div>
              </div>
            </label>
          </div>

          <!-- Modal Footer -->
          <div class="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
            <span class="text-xs font-bold text-slate-600">
              {{ selectedProductIds.length }} product(s) checked
            </span>
            <div class="flex items-center gap-2.5">
              <button
                type="button"
                class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                @click="isSelectorModalOpen = false"
              >
                Cancel
              </button>
              <button
                type="button"
                :disabled="isApplyingPromotion || selectedProductIds.length === 0"
                class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs cursor-pointer"
                @click="handleApplySelectedPromotion"
              >
                {{
                  isApplyingPromotion
                    ? "Applying..."
                    : `Apply ${selectorSalePercentageId}% OFF to ${selectedProductIds.length} Product(s)`
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>
