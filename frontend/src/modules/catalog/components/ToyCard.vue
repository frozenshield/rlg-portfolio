<script setup lang="ts">
import { computed } from "vue";
import type { ToyProduct } from "@/shared/types/toy.types";
import { formatCurrency } from "@/shared/utils/currency.util";
import { useWishlistStore } from "@/modules/wishlist/wishlist.store";

interface Props {
  toy: ToyProduct;
  showVipBadge?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "quick-view", toy: ToyProduct): void;
}>();

const wishlistStore = useWishlistStore();

const handleToggleWishlist = () => {
  wishlistStore.toggleFavorite(props.toy.id);
};

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  if (!target || target.dataset.fallbackApplied) return;
  target.dataset.fallbackApplied = "true";

  if (props.toy.category === "gunpla") {
    target.src =
      "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=80";
  } else if (props.toy.category === "anime-figures") {
    target.src =
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80";
  } else {
    target.src =
      "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600&auto=format&fit=crop&q=80";
  }
};
</script>

<template>
  <div
    class="bg-slate-900/95 rounded-lg sm:rounded-xl p-1 sm:p-1.5 border border-slate-800 hover:border-amber-400/50 flex flex-col justify-between relative group font-display transition-all duration-200 cursor-pointer overflow-hidden select-none shadow-sm hover:shadow-md"
    @click="emit('quick-view', toy)"
  >
    <!-- Top Image Container: Square Aspect Ratio & Subtle Rounded Corners -->
    <div
      class="relative w-full aspect-square rounded-md overflow-hidden bg-slate-950/40 flex items-center justify-center shrink-0"
    >
      <img
        :src="toy.imageUrl"
        :alt="toy.name"
        class="max-w-full max-h-full object-contain p-1 rounded-md group-hover:scale-105 transition-transform duration-300 ease-out"
        :class="{ 'opacity-50 grayscale-[40%]': toy.stock <= 0 }"
        loading="lazy"
        @error="handleImageError"
      />

      <!-- Sold Out Overlay Ribbon (Doorzo / Mercari style) -->
      <div
        v-if="toy.stock <= 0"
        class="absolute inset-0 bg-black/60 flex items-center justify-center z-10 p-1 pointer-events-none"
      >
        <span
          class="bg-rose-600/95 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow"
        >
          Sold Out
        </span>
      </div>

      <!-- Floating Micro-Badges Top Left -->
      <div
        v-else
        class="absolute top-1 left-1 flex flex-col gap-1 z-10 pointer-events-none"
      >
        <!-- Distinct VIP Badge -->
        <span
          v-if="showVipBadge || toy.isPromotion"
          class="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm border border-amber-200/80"
        >
          <span>👑</span>
          <span>VIP</span>
        </span>

        <!-- Best Seller Badge (with flame icon 🔥) -->
        <span
          v-if="toy.isBestSeller"
          class="bg-amber-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs"
        >
          <span>🔥</span>
          <span>Best Seller</span>
        </span>

        <!-- Discount percentage badge -->
        <span
          v-if="toy.discountPercent"
          class="bg-rose-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs"
        >
          -{{ toy.discountPercent }}%
        </span>

        <!-- Top Picks Indicator -->
        <span
          v-if="toy.isFeatured && !toy.isBestSeller"
          class="bg-indigo-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5"
        >
          <span>✨</span>
          <span>Top Pick</span>
        </span>

        <!-- New Release Indicator -->
        <span
          v-if="toy.isNewArrival && !toy.isBestSeller && !toy.isFeatured"
          class="bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5"
        >
          <span>🚀</span>
          <span>New</span>
        </span>
      </div>

      <!-- Floating Wishlist Heart Icon Top-Right -->
      <button
        type="button"
        class="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-950/70 hover:bg-slate-900 backdrop-blur-xs flex items-center justify-center text-slate-300 hover:text-amber-400 transition-transform active:scale-90 z-10 cursor-pointer border border-white/10"
        :title="
          wishlistStore.isFavorite(toy.id)
            ? 'Remove from Wishlist'
            : 'Add to Wishlist'
        "
        @click.stop="handleToggleWishlist"
      >
        <svg
          class="w-3.5 h-3.5 transition-colors"
          :class="
            wishlistStore.isFavorite(toy.id)
              ? 'text-amber-400 fill-amber-400'
              : ''
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

    <!-- Card Body: Minimal Padding & Dense Typography -->
    <div class="pt-1.5 pb-0.5 px-0.5 flex flex-col justify-between flex-1 gap-1">
      <!-- Title: Dense text-xs with truncate -->
      <h3
        class="text-xs font-semibold text-slate-100 truncate leading-tight group-hover:text-amber-300 transition-colors"
        :title="toy.name"
      >
        {{ toy.name }}
      </h3>

      <!-- Price & Secondary Details -->
      <div class="mt-auto pt-0.5">
        <div class="flex items-baseline gap-1 flex-wrap">
          <span class="text-xs font-bold text-amber-300 font-mono tracking-tight">
            {{ formatCurrency(toy.price) }}
          </span>
          <span
            v-if="toy.originalPrice"
            class="text-[10px] text-gray-400 line-through font-mono"
          >
            {{ formatCurrency(toy.originalPrice) }}
          </span>
        </div>

        <!-- Secondary Details: Sub-text for condition/stock/rating -->
        <div class="flex items-center justify-between text-[10px] text-gray-400 mt-0.5 font-medium leading-none">
          <span class="truncate max-w-[70px]">
            {{ toy.condition || (toy.category === 'tcg' ? 'Near Mint' : 'Brand New') }}
          </span>
          <span
            v-if="toy.stock > 0 && toy.rating > 0"
            class="text-[10px] text-amber-400 font-medium shrink-0 flex items-center gap-0.5"
            :title="`${toy.rating.toFixed(1)} stars (${toy.reviewCount || 0} reviews)`"
          >
            ★ {{ Number(toy.rating).toFixed(1) }}
          </span>
          <span
            v-else-if="toy.stock > 0"
            class="text-[10px] text-slate-500 font-medium shrink-0"
            title="No customer reviews yet"
          >
            No reviews
          </span>
          <span
            v-else
            class="text-[10px] text-rose-400 font-bold shrink-0"
          >
            Sold Out
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
