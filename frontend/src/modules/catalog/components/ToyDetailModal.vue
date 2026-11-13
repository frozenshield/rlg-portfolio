<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { ToyProduct } from "@/shared/types/toy.types";
import { TCG_SERIES_DATA } from "@/shared/constants/categories.data";
import { formatCurrency, formatAgeGroup } from "@/shared/utils/currency.util";
import { formatProductDescription } from "@/shared/utils/descriptionFormatter";
import { mapApiProductToToy } from "@/shared/utils/productMapper";
import { resolveStorageUrl } from "@/shared/utils/api";
import { useCartStore } from "@/modules/cart/cart.store";
import { useWishlistStore } from "@/modules/wishlist/wishlist.store";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useRouter } from "vue-router";
import BaseBadge from "@/shared/components/BaseBadge.vue";
import BaseRating from "@/shared/components/BaseRating.vue";
import BaseButton from "@/shared/components/BaseButton.vue";

interface Props {
  toy: ToyProduct | null;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const authStore = useAuthStore();
const router = useRouter();

const isVipProduct = computed(() => {
  if (!props.toy) return false;
  const t = props.toy as any;
  if (t.isPromotion || t.is_promotion || t.isVip || t.is_vip) return true;
  if (t.tags && Array.isArray(t.tags) && t.tags.some((tag: string) => typeof tag === 'string' && tag.toLowerCase().includes('vip'))) {
    return true;
  }
  if (typeof t.tags === 'string' && t.tags.toLowerCase().includes('vip')) return true;
  if (typeof t.category === 'string' && t.category.toLowerCase().includes('vip')) return true;
  return false;
});

const isUserVip = computed(() => {
  return Boolean(authStore.currentUser?.is_vip || (authStore.currentUser as any)?.customer_profile?.is_vip);
});

const handleGoToVip = () => {
  emit('close');
  router.push('/vip');
};

const quantity = ref(1);
const activeImage = ref("");

// Magnifying Glass Hover Zoom State
const isZooming = ref(false);
const zoomX = ref(50);
const zoomY = ref(50);
const lensX = ref(0);
const lensY = ref(0);
const isLightboxOpen = ref(false);
const isLightboxZooming = ref(false);
const lightboxZoomX = ref(50);
const lightboxZoomY = ref(50);

const handleLightboxMouseMove = (e: MouseEvent) => {
  const container = e.currentTarget as HTMLElement;
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  lightboxZoomX.value = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
  lightboxZoomY.value = Math.max(0, Math.min(100, Math.round((y / rect.height) * 100)));
};

const handleImageMouseMove = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
  zoomX.value = Number((relX * 100).toFixed(2));
  zoomY.value = Number((relY * 100).toFixed(2));
  lensX.value = e.clientX - rect.left;
  lensY.value = e.clientY - rect.top;
};

const handleImageMouseEnter = () => {
  isZooming.value = true;
};

const handleImageMouseLeave = () => {
  isZooming.value = false;
  zoomX.value = 50;
  zoomY.value = 50;
};

watch(
  () => props.isOpen,
  (val) => {
    if (val && props.toy) {
      quantity.value = props.toy.stock > 0 ? 1 : 0;
      activeImage.value = props.toy.imageUrl || "";
      isZooming.value = false;
    }
  },
);

const tcgInfo = computed(() => {
  if (props.toy?.category === "tcg" && props.toy.tcgSeries) {
    return TCG_SERIES_DATA.find((s) => s.id === props.toy?.tcgSeries);
  }
  return null;
});

const currentImage = computed(() => {
  if (activeImage.value) return activeImage.value;
  return props.toy?.imageUrl || "";
});

const formattedDescription = computed(() => {
  return formatProductDescription(props.toy?.description);
});

const incrementQty = () => {
  if (props.toy && quantity.value < props.toy.stock) {
    quantity.value++;
  }
};

const decrementQty = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const handleAddToCart = () => {
  if (props.toy && props.toy.stock > 0) {
    if (isVipProduct.value && !isUserVip.value) {
      handleGoToVip();
      return;
    }
    cartStore.addItem(props.toy, quantity.value);
    emit("close");
  }
};

const handleToggleWishlist = () => {
  if (props.toy) {
    wishlistStore.toggleFavorite(props.toy.id);
  }
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "Verified Buyer";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recent";
  }
};

// Frequently Bought Together Bundles
const activeBundle = ref<any>(null);

const bundleOriginalTotal = computed(() => {
  if (!activeBundle.value) return 0;
  if (activeBundle.value.original_total_price && Number(activeBundle.value.original_total_price) > 0) {
    return Number(activeBundle.value.original_total_price);
  }
  const primaryPrice = Number(props.toy?.price || activeBundle.value.primary_product?.price || 0);
  const companionsTotal = Array.isArray(activeBundle.value.bundled_products)
    ? activeBundle.value.bundled_products.reduce((s: number, c: any) => s + Number(c.price || 0), 0)
    : 0;
  return Number((primaryPrice + companionsTotal).toFixed(2));
});

const bundleComboPrice = computed(() => {
  if (!activeBundle.value) return 0;
  if (activeBundle.value.combo_price && Number(activeBundle.value.combo_price) > 0) {
    return Number(activeBundle.value.combo_price);
  }
  const orig = bundleOriginalTotal.value;
  const pct = Math.min(100, Math.max(0, Number(activeBundle.value.discount_percentage || 0)));
  return Number(Math.max(0, orig * (1 - pct / 100)).toFixed(2));
});

const fetchProductBundle = async (productId: number | string) => {
  try {
    const res = await fetch(`/api/product-bundles?primary_product_id=${productId}&active_only=true`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        activeBundle.value = json.data[0];
        return;
      }
    }
  } catch (e) {
    console.warn("Could not fetch product bundle", e);
  }
  activeBundle.value = null;
};

watch(
  () => props.toy,
  (newToy) => {
    if (newToy?.id) {
      fetchProductBundle(newToy.id);
    } else {
      activeBundle.value = null;
    }
  },
  { immediate: true },
);

const handleAddBundleToCart = () => {
  if (!props.toy) return;
  cartStore.addItem(props.toy, 1);
  if (activeBundle.value && Array.isArray(activeBundle.value.bundled_products)) {
    for (const comp of activeBundle.value.bundled_products) {
      cartStore.addItem(mapApiProductToToy(comp), 1);
    }
  }
  emit("close");
  cartStore.isDrawerOpen = true;
};
</script>

<template>
  <teleport to="body">
    <transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen && toy"
        class="storefront-theme-shell product-catalog-modal fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto font-display"
        @click="emit('close')"
      >
        <div
          class="catalog-modal-card bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-800 transform transition-all my-8 max-h-[92vh] overflow-y-auto text-slate-100 space-y-8"
          @click.stop
        >
          <!-- Close Button -->
          <button
            type="button"
            class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10 border border-slate-700"
            @click="emit('close')"
          >
            ✕
          </button>

          <!-- Top Grid: Product Details & Purchase Actions -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <!-- Left: Toy Image & Gallery with Magnifying Glass Hover Zoom -->
            <div class="space-y-3">
              <div
                class="aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative flex items-center justify-center p-3 cursor-zoom-in group/zoom"
                @mousemove="handleImageMouseMove"
                @mouseenter="handleImageMouseEnter"
                @mouseleave="handleImageMouseLeave"
                @click="isLightboxOpen = true"
              >
                <img
                  :src="currentImage"
                  :alt="toy.name"
                  class="max-w-full max-h-full object-contain transition-transform duration-150 ease-out"
                  :class="{ 'opacity-55 grayscale-[35%]': toy.stock <= 0 }"
                  :style="
                    isZooming
                      ? {
                          transform: 'scale(2.2)',
                          transformOrigin: `${zoomX}% ${zoomY}%`,
                        }
                      : {}
                  "
                />

                <!-- Floating Magnifying Glass Lens Ring on Hover -->
                <div
                  v-if="isZooming"
                  class="pointer-events-none absolute w-24 h-24 rounded-full border-2 border-amber-400/90 shadow-[0_0_20px_rgba(251,191,36,0.45)] bg-white/5 z-20 flex items-center justify-center"
                  :style="{
                    left: `${lensX - 48}px`,
                    top: `${lensY - 48}px`,
                  }"
                >
                  <span class="text-xs opacity-60">🔍</span>
                </div>

                <!-- Hover Hint Badge -->
                <div
                  v-if="!isZooming"
                  class="pointer-events-none absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/85 border border-slate-700 text-[10px] font-bold text-slate-300 flex items-center gap-1 shadow-sm"
                >
                  <span>🔍</span>
                  <span>Hover to Zoom / Click Fullscreen</span>
                </div>

                <div class="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none z-10">
                  <span
                    v-if="toy.isPromotion"
                    class="text-[10px] font-black px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-300 to-yellow-500 text-slate-950 uppercase tracking-wider shadow-md"
                  >
                    👑 VIP Exclusive
                  </span>
                  <span
                    v-if="toy.stock <= 0"
                    class="text-[10px] font-black px-2.5 py-1 rounded-md bg-rose-600 text-white uppercase tracking-wider shadow-md shadow-rose-600/40"
                  >
                    🚫 Sold Out
                  </span>
                  <span
                    v-else-if="toy.isBestSeller"
                    class="text-[10px] font-black px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 uppercase tracking-wider shadow-md shadow-amber-400/25"
                  >
                    🔥 Best Seller
                  </span>
                  <span
                    v-if="toy.discountPercent && toy.stock > 0"
                    class="text-[10px] font-bold px-2.5 py-1 rounded-md bg-rose-600 text-white uppercase tracking-wider shadow-sm"
                  >
                    -{{ toy.discountPercent }}% OFF
                  </span>
                </div>
              </div>

              <!-- Gallery thumbs if available -->
              <div
                v-if="toy.galleryImages && toy.galleryImages.length > 1"
                class="flex gap-2"
              >
                <img
                  v-for="(img, idx) in toy.galleryImages"
                  :key="idx"
                  :src="img"
                  class="w-14 h-14 rounded-xl object-contain p-1 border-2 cursor-pointer transition-all bg-slate-950"
                  :class="
                    currentImage === img
                      ? 'border-amber-400 scale-105'
                      : 'border-slate-800 opacity-70 hover:opacity-100'
                  "
                  @click="activeImage = img"
                />
              </div>
            </div>

            <!-- Right: Product Info & Actions -->
            <div class="space-y-4">
              <div>
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    v-if="tcgInfo"
                    class="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-md border border-indigo-500/30 bg-indigo-950/80 text-indigo-300 shadow-2xs"
                  >
                    <span>{{ tcgInfo.icon }}</span>
                    <span>{{ tcgInfo.name }}</span>
                  </span>
                  <span
                    v-else
                    class="text-xs font-bold text-indigo-400 uppercase tracking-wider"
                  >
                    {{ toy.brand }}
                  </span>
                  <BaseBadge variant="secondary" size="sm">
                    {{ formatAgeGroup(toy.ageGroup) }}
                  </BaseBadge>
                  <span
                    v-if="toy.condition"
                    class="inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 border border-slate-700 shadow-2xs"
                  >
                    <span>🏷️</span>
                    <span>{{ toy.condition }}</span>
                  </span>
                </div>

                <h2
                  class="text-xl sm:text-2xl font-black text-white leading-tight"
                >
                  {{ toy.name }}
                </h2>

                <div class="mt-2 flex items-center gap-2">
                  <template v-if="toy.rating && toy.rating > 0">
                    <span class="text-amber-400 text-sm font-black">
                      ★ {{ toy.rating.toFixed(1) }}
                    </span>
                    <span class="text-xs text-slate-400">
                      ({{ toy.reviewCount || 0 }} Reviews)
                    </span>
                  </template>
                  <template v-else>
                    <span class="text-xs text-slate-500 font-medium">
                      No customer reviews yet
                    </span>
                  </template>
                </div>
              </div>

              <!-- Price Box -->
              <div
                class="flex items-baseline gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800"
              >
                <span class="text-2xl font-black text-white font-mono">
                  {{ formatCurrency(toy.price) }}
                </span>
                <span
                  v-if="toy.originalPrice"
                  class="text-sm text-slate-500 line-through font-mono"
                >
                  {{ formatCurrency(toy.originalPrice) }}
                </span>
                <span
                  v-if="toy.stock > 0"
                  class="text-xs font-bold text-emerald-400 ml-auto"
                >
                  ✓ In Stock ({{ toy.stock }} available)
                </span>
                <span
                  v-else
                  class="text-xs font-bold text-rose-400 ml-auto bg-rose-950/70 px-2.5 py-1 rounded-md border border-rose-800"
                >
                  🚫 Sold Out
                </span>
              </div>

              <!-- Description with formatted HTML and icons -->
              <div
                class="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal space-y-1"
                v-html="formattedDescription"
              ></div>

              <!-- Key Features List -->
              <div v-if="toy.features && toy.features.length > 0">
                <h4
                  class="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                >
                  <span>✨</span>
                  <span>Collector Specifications:</span>
                </h4>
                <ul class="text-xs text-slate-400 space-y-1">
                  <li
                    v-for="(feat, i) in toy.features"
                    :key="i"
                    class="flex items-center gap-2"
                  >
                    <span class="text-indigo-400 font-bold">✓</span>
                    <span>{{ feat }}</span>
                  </li>
                </ul>
              </div>

              <!-- Quantity Selector & Add to Cart Action -->
              <!-- VIP Product Restriction Gate -->
              <div v-if="isVipProduct && !isUserVip" class="pt-2 space-y-2">
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    class="flex-1 py-3.5 px-6 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-400/25 border border-amber-300 active:scale-95 cursor-pointer text-center"
                    @click="handleGoToVip"
                  >
                    <span>👑 Be a VIP</span>
                  </button>

                  <button
                    type="button"
                    class="w-11 h-11 rounded-2xl border border-slate-700 bg-slate-950 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                    :title="
                      wishlistStore.isFavorite(toy.id)
                        ? 'Remove from Wishlist'
                        : 'Add to Wishlist'
                    "
                    @click="handleToggleWishlist"
                  >
                    <svg
                      class="w-5 h-5 transition-colors"
                      :class="
                        wishlistStore.isFavorite(toy.id)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-400'
                      "
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>
                <p class="text-[11px] text-amber-300/90 font-bold text-center">
                  🔒 Reserved for VIP Pro members. Click &quot;Be a VIP&quot; to unlock checkout privileges!
                </p>
              </div>

              <!-- Quantity Selector & Add to Cart Action -->
              <div v-else class="pt-2 flex items-center gap-3">
                <div
                  v-if="toy.stock > 0"
                  class="flex items-center border border-slate-700 rounded-2xl p-1 bg-slate-950"
                >
                  <button
                    type="button"
                    class="w-8 h-8 rounded-xl bg-slate-800 shadow-xs font-bold text-slate-200 hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="quantity <= 1"
                    @click="decrementQty"
                  >
                    -
                  </button>
                  <span class="w-10 text-center font-bold text-sm text-white">
                    {{ quantity }}
                  </span>
                  <button
                    type="button"
                    class="w-8 h-8 rounded-xl bg-slate-800 shadow-xs font-bold text-slate-200 hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="quantity >= toy.stock"
                    @click="incrementQty"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  class="flex-1 py-3 px-6 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                  :class="
                    toy.stock > 0
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/25 border border-amber-300 active:scale-95 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60 shadow-none'
                  "
                  :disabled="toy.stock <= 0"
                  @click="handleAddToCart"
                >
                  <svg
                    v-if="toy.stock > 0"
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <span>{{ toy.stock > 0 ? "Add to Cart" : "Sold Out" }}</span>
                </button>

                <button
                  type="button"
                  class="w-11 h-11 rounded-2xl border border-slate-700 bg-slate-950 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                  :title="
                    wishlistStore.isFavorite(toy.id)
                      ? 'Remove from Wishlist'
                      : 'Add to Wishlist'
                  "
                  @click="handleToggleWishlist"
                >
                  <svg
                    class="w-5 h-5 transition-colors"
                    :class="
                      wishlistStore.isFavorite(toy.id)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-400'
                    "
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>

              <!-- Frequently Bought Together Bundle Offer -->
              <div
                v-if="activeBundle && activeBundle.bundled_products && activeBundle.bundled_products.length > 0"
                class="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/40 space-y-3 shadow-lg"
              >
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                      <span>✨</span>
                      <span>{{ activeBundle.badge_text || 'Frequently Bought Together' }}</span>
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Save {{ activeBundle.discount_percentage }}%
                    </span>
                  </div>
                  <div class="flex items-baseline gap-1.5">
                    <span class="text-sm font-black text-emerald-400 font-mono">
                      {{ formatCurrency(bundleComboPrice) }}
                    </span>
                    <span class="text-[11px] text-slate-500 line-through font-mono">
                      {{ formatCurrency(bundleOriginalTotal) }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Main Product -->
                  <div class="flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <img
                      :src="resolveStorageUrl(currentImage) || 'https://images.pokemontcg.io/swsh7/215_hires.png'"
                      class="w-7 h-7 object-cover rounded-lg"
                      @error="(e: any) => { e.target.src = 'https://images.pokemontcg.io/swsh7/215_hires.png'; }"
                    />
                    <span class="font-bold text-slate-200 truncate max-w-[120px]">{{ toy.name }}</span>
                    <span class="text-amber-400 font-mono text-[11px] font-bold">{{ formatCurrency(toy.price) }}</span>
                  </div>
                  <span class="text-indigo-400 font-bold text-sm">+</span>
                  <!-- Companion Products -->
                  <div
                    v-for="comp in activeBundle.bundled_products"
                    :key="comp.id"
                    class="flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                  >
                    <img
                      :src="resolveStorageUrl(comp.image_url) || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=120'"
                      :alt="comp.name"
                      class="w-7 h-7 object-cover rounded-lg"
                      @error="(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=120'; }"
                    />
                    <span class="font-bold text-slate-200 truncate max-w-[130px]">{{ comp.name }}</span>
                    <span class="text-amber-400 font-mono text-[11px] font-bold">{{ formatCurrency(comp.price) }}</span>
                  </div>
                </div>

                <button
                  type="button"
                  class="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-98"
                  @click="handleAddBundleToCart"
                >
                  <span>🎁</span>
                  <span>Add Combo to Cart — {{ formatCurrency(bundleComboPrice) }} (Save {{ activeBundle.discount_percentage }}%)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- PRODUCT FULLSCREEN LIGHTBOX ZOOM MODAL -->
    <div
      v-if="isLightboxOpen && toy"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      @click="isLightboxOpen = false"
    >
      <div
        class="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative space-y-4"
        @click.stop
      >
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-lg">🔍</span>
            <h3 class="text-base font-extrabold text-white truncate max-w-lg">
              {{ toy.name }}
            </h3>
          </div>
          <button
            type="button"
            class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
            @click="isLightboxOpen = false"
          >
            ✕
          </button>
        </div>

        <div
          class="relative w-full h-[65vh] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center cursor-zoom-in select-none"
          @mousemove="handleLightboxMouseMove"
          @mouseenter="isLightboxZooming = true"
          @mouseleave="isLightboxZooming = false"
        >
          <img
            :src="currentImage"
            :alt="toy.name"
            class="max-w-full max-h-full object-contain transition-transform duration-100 ease-out"
            :style="
              isLightboxZooming
                ? {
                    transform: 'scale(2.6)',
                    transformOrigin: `${lightboxZoomX}% ${lightboxZoomY}%`,
                  }
                : {}
            "
          />
        </div>

        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>Move cursor to pan across fine product details &bull; Esc / Click outside to close</span>
          <a :href="currentImage" target="_blank" class="text-amber-400 hover:underline font-bold">
            Open Original Image ↗
          </a>
        </div>
      </div>
    </div>
  </teleport>
</template>
