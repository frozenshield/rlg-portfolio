<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import type { ToyProduct } from "@/shared/types/toy.types";
import { formatCurrency } from "@/shared/utils/currency.util";
import { useWishlistStore } from "@/modules/wishlist/wishlist.store";

interface Props {
  toy: ToyProduct;
  showVipBadge?: boolean;
  eager?: boolean;
  priority?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showVipBadge: false,
  eager: false,
  priority: false,
});

const emit = defineEmits<{
  (e: "quick-view", toy: ToyProduct): void;
}>();

const wishlistStore = useWishlistStore();

// Interactive 3D Hover & Flashing Light States
const isHovered = ref(false);
const tilt = reactive({
  rotateX: 0,
  rotateY: 0,
  glareX: 50,
  glareY: 50,
  normX: 0,
  normY: 0,
});

// Category-specific neon visual theme (matching CategoryPills 3D showcase)
const categoryTheme = computed(() => {
  switch (props.toy.category) {
    case "tcg":
      return {
        borderHover: "hover:border-indigo-400/85",
        glowShadow: "hover:shadow-[0_14px_34px_-6px_rgba(99,102,241,0.55)]",
        auraGradient: "from-indigo-600/30 via-purple-600/15 to-amber-500/25",
        beamColor: "rgba(129, 140, 248, 0.5)",
        flashColor: "rgba(251, 191, 36, 0.75)",
        stageRing: "border-indigo-400/50 bg-indigo-500/20",
        pillClass: "bg-indigo-950/90 text-amber-300 border-indigo-400/50",
      };
    case "gunpla":
      return {
        borderHover: "hover:border-cyan-400/85",
        glowShadow: "hover:shadow-[0_14px_34px_-6px_rgba(6,182,212,0.55)]",
        auraGradient: "from-sky-500/30 via-cyan-500/15 to-blue-600/25",
        beamColor: "rgba(56, 189, 248, 0.5)",
        flashColor: "rgba(34, 211, 238, 0.8)",
        stageRing: "border-cyan-400/50 bg-cyan-500/20",
        pillClass: "bg-sky-950/90 text-cyan-300 border-cyan-400/50",
      };
    case "anime-figures":
      return {
        borderHover: "hover:border-rose-400/85",
        glowShadow: "hover:shadow-[0_14px_34px_-6px_rgba(244,63,94,0.55)]",
        auraGradient: "from-rose-600/30 via-red-500/15 to-amber-500/25",
        beamColor: "rgba(251, 113, 133, 0.5)",
        flashColor: "rgba(253, 164, 175, 0.8)",
        stageRing: "border-rose-400/50 bg-rose-500/20",
        pillClass: "bg-rose-950/90 text-rose-200 border-rose-400/50",
      };
    case "anime-merchandise":
      return {
        borderHover: "hover:border-amber-400/85",
        glowShadow: "hover:shadow-[0_14px_34px_-6px_rgba(245,158,11,0.55)]",
        auraGradient: "from-amber-500/30 via-yellow-500/15 to-orange-500/25",
        beamColor: "rgba(251, 191, 36, 0.5)",
        flashColor: "rgba(253, 224, 71, 0.85)",
        stageRing: "border-amber-400/50 bg-amber-500/20",
        pillClass: "bg-amber-950/90 text-amber-300 border-amber-400/50",
      };
    case "toys-plushies":
    default:
      return {
        borderHover: "hover:border-pink-400/85",
        glowShadow: "hover:shadow-[0_14px_34px_-6px_rgba(236,72,153,0.55)]",
        auraGradient: "from-pink-500/30 via-fuchsia-500/15 to-purple-500/25",
        beamColor: "rgba(244, 114, 182, 0.5)",
        flashColor: "rgba(249, 168, 212, 0.85)",
        stageRing: "border-pink-400/50 bg-pink-500/20",
        pillClass: "bg-pink-950/90 text-pink-200 border-pink-400/50",
      };
  }
});

const handleMouseEnter = () => {
  isHovered.value = true;
};

const handleMouseMove = (e: MouseEvent) => {
  const el = e.currentTarget as HTMLElement;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const pctX = Math.max(0, Math.min(100, (x / rect.width) * 100));
  const pctY = Math.max(0, Math.min(100, (y / rect.height) * 100));

  const normX = (x / rect.width - 0.5) * 2; // -1 to 1
  const normY = (y / rect.height - 0.5) * 2; // -1 to 1

  tilt.rotateX = Number((-normY * 10).toFixed(2));
  tilt.rotateY = Number((normX * 12).toFixed(2));
  tilt.glareX = Math.round(pctX);
  tilt.glareY = Math.round(pctY);
  tilt.normX = Number(normX.toFixed(2));
  tilt.normY = Number(normY.toFixed(2));
};

const handleMouseLeave = () => {
  isHovered.value = false;
  tilt.rotateX = 0;
  tilt.rotateY = 0;
  tilt.glareX = 50;
  tilt.glareY = 50;
  tilt.normX = 0;
  tilt.normY = 0;
};

const card3DStyle = computed(() => {
  if (!isHovered.value) {
    return {
      transform: "perspective(950px) rotateX(0deg) rotateY(0deg) translateZ(0px)",
      transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
    };
  }
  return {
    transform: `perspective(950px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateY(-5px) scale3d(1.025, 1.025, 1.025)`,
    transition: "transform 0.1s ease-out",
  };
});

const productImage3DStyle = computed(() => {
  if (!isHovered.value) {
    return {
      transform: "translate3d(0px, 0px, 0px) scale(1)",
      transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
    };
  }
  const px = tilt.normX * 7;
  const py = tilt.normY * 5;
  return {
    transform: `translate3d(${px}px, ${-4 + py}px, 28px) rotateY(${tilt.normX * 12}deg) rotateX(${-tilt.normY * 8}deg) scale(1.12)`,
    transition: "transform 0.12s ease-out",
  };
});

const handleToggleWishlist = () => {
  wishlistStore.toggleFavorite(props.toy.id);
};

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  if (!target || target.dataset.fallbackApplied === "true") {
    if (target) target.onerror = null;
    return;
  }
  target.dataset.fallbackApplied = "true";
  target.onerror = null;

  if (props.toy.category === "gunpla") {
    target.src =
      "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=80";
  } else if (props.toy.category === "anime-figures") {
    target.src =
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80";
  } else {
    target.src =
      "https://images.pokemontcg.io/swsh7/215_hires.png";
  }
};
</script>

<template>
  <div
    class="bg-slate-900/95 rounded-lg sm:rounded-xl p-1 sm:p-1.5 border border-slate-800 flex flex-col justify-between relative group font-display cursor-pointer select-none shadow-sm hover:z-20"
    :class="[categoryTheme.borderHover, categoryTheme.glowShadow]"
    :style="card3DStyle"
    @mouseenter="handleMouseEnter"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @click="emit('quick-view', toy)"
  >
    <!-- Clipped Inner FX Layer: Flashing Holographic Beam & Cursor Spotlight -->
    <div class="absolute inset-0 rounded-lg sm:rounded-xl overflow-hidden pointer-events-none z-0">
      <!-- Category Ambient Gradient Aura on Hover -->
      <div
        class="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        :class="categoryTheme.auraGradient"
      ></div>

      <!-- Dynamic Cursor-Tracking Radial Flashlight Glare -->
      <div
        v-if="isHovered"
        class="absolute inset-0 transition-opacity duration-150"
        :style="{
          background: `radial-gradient(160px circle at ${tilt.glareX}% ${tilt.glareY}%, ${categoryTheme.beamColor}, transparent 75%)`,
        }"
      ></div>

      <!-- Flashing Diagonal Holographic Light Sweep -->
      <div
        class="toy-holo-sweep absolute -inset-full pointer-events-none opacity-0 group-hover:opacity-100"
        :style="{
          background: `linear-gradient(115deg, transparent 36%, ${categoryTheme.beamColor} 46%, ${categoryTheme.flashColor} 50%, ${categoryTheme.beamColor} 54%, transparent 64%)`,
        }"
      ></div>
    </div>

    <!-- Top Image Container: 3D Floating Product Stage -->
    <div
      class="relative z-10 w-full aspect-square rounded-md bg-slate-950/75 group-hover:bg-slate-950/50 border border-transparent group-hover:border-white/15 transition-colors flex items-center justify-center shrink-0 overflow-hidden"
      style="transform-style: preserve-3d; perspective: 600px"
    >
      <!-- Cyber Grid Floor inside Image Stage -->
      <div
        class="absolute inset-x-0 bottom-0 h-2/3 opacity-0 group-hover:opacity-45 transition-opacity duration-300 pointer-events-none toy-cyber-grid"
      ></div>

      <!-- Glowing 3D Pedestal Ring on Hover -->
      <div
        class="absolute bottom-1.5 w-3/5 h-4 rounded-full border blur-[0.5px] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 pointer-events-none"
        :class="categoryTheme.stageRing"
        style="transform: rotateX(74deg)"
      ></div>

      <!-- Vertical Spotlight Pillar on Hover -->
      <div
        class="absolute inset-x-6 top-1 bottom-1 rounded-full opacity-0 group-hover:opacity-35 blur-md transition-opacity duration-300 pointer-events-none"
        :style="{
          background: `linear-gradient(to top, ${categoryTheme.flashColor}, transparent)`,
        }"
      ></div>

      <!-- 3D Floating & Tilting Product Image Wrapper -->
      <div
        class="relative w-full h-full flex items-center justify-center p-1"
        style="transform-style: preserve-3d"
        :style="productImage3DStyle"
      >
        <img
          :src="toy.imageUrl"
          :alt="toy.name"
          width="280"
          height="280"
          :loading="eager || priority ? 'eager' : 'lazy'"
          :fetchpriority="eager || priority ? 'high' : 'auto'"
          decoding="async"
          class="w-full h-full object-contain rounded-md drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)] group-hover:drop-shadow-[0_14px_20px_rgba(0,0,0,0.85)] transition-all duration-300"
          :class="{ 'opacity-50 grayscale-[40%]': toy.stock <= 0 }"
          @error="handleImageError"
        />

        <!-- Flashing Foil Glare Streak Across Product on Hover -->
        <div
          class="toy-product-flash absolute inset-1 rounded-md pointer-events-none opacity-0 group-hover:opacity-100"
        ></div>
      </div>

      <!-- Sold Out Overlay Ribbon (Doorzo / Mercari style) -->
      <div
        v-if="toy.stock <= 0"
        class="absolute inset-0 bg-black/60 flex items-center justify-center z-20 p-1 pointer-events-none"
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
        class="absolute top-1 left-1 flex flex-col gap-1 z-20 pointer-events-none"
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
        class="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-950/75 hover:bg-slate-900 backdrop-blur-xs flex items-center justify-center text-slate-300 hover:text-amber-400 transition-transform active:scale-90 z-20 cursor-pointer border border-white/15"
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

      <!-- Interactive 3D Hover Action Pill at Bottom of Stage -->
      <div
        v-if="toy.stock > 0"
        class="absolute bottom-1 inset-x-1.5 flex items-center justify-center pointer-events-none z-20 opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
      >
        <span
          class="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border backdrop-blur-md shadow-md flex items-center gap-1"
          :class="categoryTheme.pillClass"
        >
          <span>✨</span>
          <span>Inspect 3D View</span>
        </span>
      </div>
    </div>

    <!-- Card Body: Minimal Padding & Dense Typography with 3D Elevation -->
    <div
      class="relative z-10 pt-1.5 pb-0.5 px-0.5 flex flex-col justify-between flex-1 gap-1"
      style="transform: translateZ(14px)"
    >
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
        <div class="flex items-center justify-between text-[10px] text-gray-400 group-hover:text-slate-300 mt-0.5 font-medium leading-none transition-colors">
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
            class="text-[10px] text-slate-500 group-hover:text-slate-400 font-medium shrink-0"
            title="No customer reviews yet"
          >
            In Stock
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

<style scoped>
/* Cyber perspective floor grid inside product image stage */
.toy-cyber-grid {
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.16) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.16) 1px, transparent 1px);
  background-size: 14px 14px;
  mask-image: linear-gradient(to top, rgba(0, 0, 0, 1) 15%, transparent 95%);
}

/* Continuous flashing holographic light sweep across the product card on hover */
@keyframes toyHoloSweep {
  0% {
    transform: translate3d(-45%, -45%, 0) rotate(12deg);
  }
  50% {
    transform: translate3d(45%, 45%, 0) rotate(12deg);
  }
  100% {
    transform: translate3d(-45%, -45%, 0) rotate(12deg);
  }
}

.group:hover .toy-holo-sweep {
  animation: toyHoloSweep 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

/* Flashing foil shimmer across the floating 3D product image */
@keyframes toyProductFlash {
  0% {
    transform: translateX(-140%) skewX(-25deg);
  }
  45%,
  100% {
    transform: translateX(180%) skewX(-25deg);
  }
}

.toy-product-flash {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.42),
    rgba(251, 191, 36, 0.3),
    transparent
  );
  animation: toyProductFlash 2s ease-in-out infinite;
}
</style>
