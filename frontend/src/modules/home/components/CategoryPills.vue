<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import {
  CATEGORIES_DATA,
  TCG_SERIES_DATA,
} from "@/shared/constants/categories.data";
import { useCatalogStore } from "@/modules/catalog/catalog.store";
import type { ToyCategory, TcgSubCategory, ToyProduct } from "@/shared/types/toy.types";
import { formatCurrency } from "@/shared/utils/currency.util";

const router = useRouter();
const catalogStore = useCatalogStore();
const isTcgHovered = ref(false);
const hoveredCategory = ref<ToyCategory | null>(null);

// Per-card 3D tilt & flashing light coordinates
interface CardTiltState {
  rotateX: number;
  rotateY: number;
  glareX: number;
  glareY: number;
  normX: number;
  normY: number;
  flashTrigger: number;
}

const cardTilts = reactive<Record<string, CardTiltState>>({
  tcg: { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, normX: 0, normY: 0, flashTrigger: 0 },
  gunpla: { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, normX: 0, normY: 0, flashTrigger: 0 },
  "anime-figures": { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, normX: 0, normY: 0, flashTrigger: 0 },
  "anime-merchandise": { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, normX: 0, normY: 0, flashTrigger: 0 },
  "toys-plushies": { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, normX: 0, normY: 0, flashTrigger: 0 },
});

// Active spotlight product index per category (cycles automatically while hovering)
const activeProductIndex = reactive<Record<string, number>>({
  tcg: 0,
  gunpla: 0,
  "anime-figures": 0,
  "anime-merchandise": 0,
  "toys-plushies": 0,
});

let cycleInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  cycleInterval = setInterval(() => {
    if (hoveredCategory.value) {
      const catId = hoveredCategory.value;
      const prods = getCategoryProducts(catId);
      if (prods.length > 1) {
        activeProductIndex[catId] = ((activeProductIndex[catId] || 0) + 1) % prods.length;
      }
    }
  }, 1900);
});

onBeforeUnmount(() => {
  if (cycleInterval) clearInterval(cycleInterval);
});

// Curated fallback showcase items if a category has fewer than 3 live products loaded
const FALLBACK_SHOWCASE: Record<ToyCategory, Partial<ToyProduct>[]> = {
  tcg: [
    {
      id: "fb-tcg-1",
      name: "Pokémon 151 Booster Box JP",
      price: 6800,
      category: "tcg",
      imageUrl: "https://images.pokemontcg.io/sv3pt5/199_hires.png",
    },
    {
      id: "fb-tcg-2",
      name: "Umbreon VMAX Alt Art #215",
      price: 48500,
      category: "tcg",
      imageUrl: "https://images.pokemontcg.io/swsh7/215_hires.png",
    },
    {
      id: "fb-tcg-3",
      name: "Charizard ex SAR #201",
      price: 12900,
      category: "tcg",
      imageUrl: "https://images.pokemontcg.io/sv3pt5/201_hires.png",
    },
  ],
  gunpla: [
    {
      id: "fb-gunpla-1",
      name: "MGEX 1/100 Strike Freedom Gundam",
      price: 9450,
      category: "gunpla",
      imageUrl: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=500&auto=format&fit=crop&q=80",
    },
    {
      id: "fb-gunpla-2",
      name: "RG 1/144 Hi-Nu Gundam RX-93-v2",
      price: 3250,
      category: "gunpla",
      imageUrl: "https://images.unsplash.com/photo-1589254065878-42c9da997008?w=500&auto=format&fit=crop&q=80",
    },
    {
      id: "fb-gunpla-3",
      name: "HG 1/144 Gundam Aerial Rebuild",
      price: 1450,
      category: "gunpla",
      imageUrl: "https://images.unsplash.com/photo-1563207153-f403bf289096?w=500&auto=format&fit=crop&q=80",
    },
  ],
  "anime-figures": [
    {
      id: "fb-fig-1",
      name: "1/7 Scale Satoru Gojo Shibuya Ver.",
      price: 11200,
      category: "anime-figures",
      imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80",
    },
    {
      id: "fb-fig-2",
      name: "Gear 5 Monkey D. Luffy Battle Statue",
      price: 8900,
      category: "anime-figures",
      imageUrl: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=500&auto=format&fit=crop&q=80",
    },
    {
      id: "fb-fig-3",
      name: "Nendoroid Frieren Beyond Journey's End",
      price: 3400,
      category: "anime-figures",
      imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80",
    },
  ],
  "anime-merchandise": [
    {
      id: "fb-merch-1",
      name: "Die-Cast Replica Master Ball Collector Set",
      price: 5400,
      category: "anime-merchandise",
      imageUrl: "https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=500&auto=format&fit=crop&q=80",
    },
    {
      id: "fb-merch-2",
      name: "Hololive Official Acrylic Standee Collection",
      price: 1650,
      category: "anime-merchandise",
      imageUrl: "https://images.pokemontcg.io/swsh7/215_hires.png",
    },
    {
      id: "fb-merch-3",
      name: "Pokémon Center Elite Trainer Deck Vault",
      price: 2350,
      category: "anime-merchandise",
      imageUrl: "https://images.unsplash.com/photo-1609372332255-611485350f25?w=500&auto=format&fit=crop&q=80",
    },
  ],
  "toys-plushies": [
    {
      id: "fb-plush-1",
      name: "Jumbo Sleeping Snorlax Poké Plush 50cm",
      price: 2950,
      category: "toys-plushies",
      imageUrl: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=500&auto=format&fit=crop&q=80",
    },
    {
      id: "fb-plush-2",
      name: "Pikachu & Eevee Sakura Festival Plush Pair",
      price: 1890,
      category: "toys-plushies",
      imageUrl: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&auto=format&fit=crop&q=80",
    },
    {
      id: "fb-plush-3",
      name: "Gengar Fluffy Dream Nesoberi Cushion",
      price: 2150,
      category: "toys-plushies",
      imageUrl: "https://images.unsplash.com/photo-1530325553241-4f6e7690cf36?w=500&auto=format&fit=crop&q=80",
    },
  ],
};

const getCategoryProducts = (catId: ToyCategory): ToyProduct[] => {
  const realMatches = catalogStore.toys.filter((t) => t.category === catId && t.imageUrl);
  if (realMatches.length >= 3) {
    return realMatches.slice(0, 4);
  }
  const fallbacks = (FALLBACK_SHOWCASE[catId] || []) as ToyProduct[];
  const combined = [...realMatches];
  for (const fb of fallbacks) {
    if (combined.length >= 3) break;
    combined.push(fb);
  }
  return combined;
};

const getCategoryLiveCount = (catId: ToyCategory): number => {
  const count = catalogStore.toys.filter((t) => t.category === catId).length;
  return count > 0 ? count : 12;
};

// Category-specific neon visual themes
const getCategoryTheme = (catId: ToyCategory) => {
  switch (catId) {
    case "tcg":
      return {
        borderHover: "group-hover:border-indigo-400/80",
        glowShadow: "group-hover:shadow-[0_20px_50px_-10px_rgba(99,102,241,0.55)]",
        auraGradient: "from-indigo-600/35 via-purple-600/20 to-amber-500/30",
        beamColor: "rgba(129, 140, 248, 0.55)",
        flashColor: "rgba(251, 191, 36, 0.75)",
        badgeBg: "bg-indigo-950/90 text-indigo-300 border-indigo-500/40 group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-amber-500 group-hover:text-slate-950 group-hover:border-amber-300",
        iconBox: "bg-indigo-950/80 border-indigo-500/40 group-hover:border-amber-400/80 group-hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]",
        accentText: "text-amber-400",
        stageRing: "border-indigo-400/40 bg-indigo-500/15",
      };
    case "gunpla":
      return {
        borderHover: "group-hover:border-cyan-400/80",
        glowShadow: "group-hover:shadow-[0_20px_50px_-10px_rgba(6,182,212,0.55)]",
        auraGradient: "from-sky-500/35 via-cyan-500/20 to-blue-600/30",
        beamColor: "rgba(56, 189, 248, 0.55)",
        flashColor: "rgba(34, 211, 238, 0.8)",
        badgeBg: "bg-sky-950/90 text-sky-300 border-sky-500/40 group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-500 group-hover:text-slate-950 group-hover:border-cyan-200",
        iconBox: "bg-sky-950/80 border-sky-500/40 group-hover:border-cyan-300/80 group-hover:shadow-[0_0_25px_rgba(34,211,238,0.55)]",
        accentText: "text-cyan-400",
        stageRing: "border-cyan-400/40 bg-cyan-500/15",
      };
    case "anime-figures":
      return {
        borderHover: "group-hover:border-rose-400/80",
        glowShadow: "group-hover:shadow-[0_20px_50px_-10px_rgba(244,63,94,0.55)]",
        auraGradient: "from-rose-600/35 via-red-500/20 to-amber-500/30",
        beamColor: "rgba(251, 113, 133, 0.55)",
        flashColor: "rgba(253, 164, 175, 0.8)",
        badgeBg: "bg-rose-950/90 text-rose-300 border-rose-500/40 group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-amber-500 group-hover:text-white group-hover:border-rose-300",
        iconBox: "bg-rose-950/80 border-rose-500/40 group-hover:border-rose-400/80 group-hover:shadow-[0_0_25px_rgba(244,63,94,0.55)]",
        accentText: "text-rose-400",
        stageRing: "border-rose-400/40 bg-rose-500/15",
      };
    case "anime-merchandise":
      return {
        borderHover: "group-hover:border-amber-400/80",
        glowShadow: "group-hover:shadow-[0_20px_50px_-10px_rgba(245,158,11,0.55)]",
        auraGradient: "from-amber-500/35 via-yellow-500/20 to-orange-500/30",
        beamColor: "rgba(251, 191, 36, 0.55)",
        flashColor: "rgba(253, 224, 71, 0.85)",
        badgeBg: "bg-amber-950/90 text-amber-300 border-amber-500/40 group-hover:bg-gradient-to-r group-hover:from-amber-400 group-hover:to-yellow-300 group-hover:text-slate-950 group-hover:border-yellow-200",
        iconBox: "bg-amber-950/80 border-amber-500/40 group-hover:border-amber-300/80 group-hover:shadow-[0_0_25px_rgba(251,191,36,0.55)]",
        accentText: "text-amber-400",
        stageRing: "border-amber-400/40 bg-amber-500/15",
      };
    case "toys-plushies":
    default:
      return {
        borderHover: "group-hover:border-pink-400/80",
        glowShadow: "group-hover:shadow-[0_20px_50px_-10px_rgba(236,72,153,0.55)]",
        auraGradient: "from-pink-500/35 via-fuchsia-500/20 to-purple-500/30",
        beamColor: "rgba(244, 114, 182, 0.55)",
        flashColor: "rgba(249, 168, 212, 0.85)",
        badgeBg: "bg-pink-950/90 text-pink-300 border-pink-500/40 group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-fuchsia-400 group-hover:text-white group-hover:border-pink-200",
        iconBox: "bg-pink-950/80 border-pink-500/40 group-hover:border-pink-300/80 group-hover:shadow-[0_0_25px_rgba(236,72,153,0.55)]",
        accentText: "text-pink-400",
        stageRing: "border-pink-400/40 bg-pink-500/15",
      };
  }
};

const handleCardMouseEnter = (catId: ToyCategory) => {
  hoveredCategory.value = catId;
  const state = cardTilts[catId];
  if (state) {
    state.flashTrigger += 1;
  }
};

const handleCardMouseMove = (e: MouseEvent, catId: ToyCategory) => {
  const el = e.currentTarget as HTMLElement;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const pctX = Math.max(0, Math.min(100, (x / rect.width) * 100));
  const pctY = Math.max(0, Math.min(100, (y / rect.height) * 100));

  const normX = (x / rect.width - 0.5) * 2; // -1 to 1
  const normY = (y / rect.height - 0.5) * 2; // -1 to 1

  const state = cardTilts[catId];
  if (state) {
    state.rotateX = Number((-normY * 9).toFixed(2));
    state.rotateY = Number((normX * 11).toFixed(2));
    state.glareX = Math.round(pctX);
    state.glareY = Math.round(pctY);
    state.normX = Number(normX.toFixed(2));
    state.normY = Number(normY.toFixed(2));
  }
};

const handleCardMouseLeave = (catId: ToyCategory) => {
  if (hoveredCategory.value === catId) {
    hoveredCategory.value = null;
  }
  const state = cardTilts[catId];
  if (state) {
    state.rotateX = 0;
    state.rotateY = 0;
    state.glareX = 50;
    state.glareY = 50;
    state.normX = 0;
    state.normY = 0;
  }
};

const getCard3DStyle = (catId: ToyCategory) => {
  const state = cardTilts[catId];
  const isHovered = hoveredCategory.value === catId;
  if (!state || !isHovered) {
    return {
      transform: "perspective(1100px) rotateX(0deg) rotateY(0deg) translateZ(0px)",
      transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
    };
  }
  return {
    transform: `perspective(1100px) rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg) translateY(-6px) scale3d(1.02, 1.02, 1.02)`,
    transition: "transform 0.12s ease-out",
  };
};

// Compute 3D floating coordinates for each product card inside the category stage
const getFloatingProductStyle = (catId: ToyCategory, idx: number, total: number) => {
  const isHovered = hoveredCategory.value === catId;
  const state = cardTilts[catId] || { normX: 0, normY: 0 };
  const activeIdx = activeProductIndex[catId] || 0;

  // Relative slot: 0 = center spotlight, 1 = right wing, 2 = left wing
  const relSlot = (idx - activeIdx + total) % total;

  if (!isHovered) {
    // At rest: neat 3D layered stack
    if (relSlot === 0) {
      return {
        transform: "translate3d(0px, 0px, 18px) rotateZ(0deg) scale(1)",
        zIndex: 30,
        opacity: 1,
      };
    } else if (relSlot === 1) {
      return {
        transform: "translate3d(26px, 6px, 6px) rotateZ(8deg) scale(0.86)",
        zIndex: 20,
        opacity: 0.72,
      };
    } else {
      return {
        transform: "translate3d(-26px, 6px, 6px) rotateZ(-8deg) scale(0.86)",
        zIndex: 15,
        opacity: 0.72,
      };
    }
  }

  // Hovered: Dynamic 3D fan-out + cursor parallax + floating elevation!
  const px = state.normX * 12;
  const py = state.normY * 8;

  if (relSlot === 0) {
    // Center Hero Spotlight floating forward in 3D
    return {
      transform: `translate3d(${px * 0.9}px, ${-8 + py * 0.7}px, 55px) rotateY(${state.normX * 14}deg) rotateX(${-state.normY * 10}deg) scale(1.16)`,
      zIndex: 35,
      opacity: 1,
    };
  } else if (relSlot === 1) {
    // Right Wing orbiting in 3D
    return {
      transform: `translate3d(${54 + px * 0.55}px, ${4 - py * 0.4}px, 28px) rotateZ(13deg) rotateY(-16deg) scale(0.92)`,
      zIndex: 25,
      opacity: 0.92,
    };
  } else if (relSlot === 2) {
    // Left Wing orbiting in 3D
    return {
      transform: `translate3d(${-54 + px * 0.55}px, ${4 - py * 0.4}px, 28px) rotateZ(-13deg) rotateY(16deg) scale(0.92)`,
      zIndex: 24,
      opacity: 0.92,
    };
  } else {
    // 4th card tucked behind
    return {
      transform: `translate3d(0px, 14px, 5px) scale(0.75)`,
      zIndex: 10,
      opacity: 0,
    };
  }
};

const handleProductPreviewClick = (e: Event, prod: ToyProduct, catId: ToyCategory) => {
  e.stopPropagation();
  // If it's a real catalog product, open the Quick View modal; otherwise navigate to the category
  const isReal = catalogStore.toys.some((t) => t.id === prod.id);
  if (isReal) {
    catalogStore.openDetailModal(prod);
  } else {
    handleCategoryClick(catId);
  }
};

const cycleCategoryProduct = (e: Event, catId: ToyCategory, idx: number) => {
  e.stopPropagation();
  activeProductIndex[catId] = idx;
};

const handlePreviewImageError = (e: Event, catId: ToyCategory) => {
  const target = e.target as HTMLImageElement;
  if (!target || target.dataset.fallbackApplied === "true") return;
  target.dataset.fallbackApplied = "true";
  const fb = FALLBACK_SHOWCASE[catId]?.[0]?.imageUrl;
  if (fb) target.src = fb;
};

const handleCategoryClick = (catId: ToyCategory) => {
  catalogStore.setCategory(catId);
  router.push("/catalog");
};

const handleTcgSeriesClick = (e: Event, seriesId: TcgSubCategory) => {
  e.stopPropagation();
  catalogStore.setTcgSeries(seriesId);
  router.push("/catalog");
};

const getMobileCategoryName = (catId: ToyCategory) => {
  switch (catId) {
    case "tcg":
      return "TCG Cards";
    case "gunpla":
      return "Gunpla";
    case "anime-figures":
      return "Figures";
    case "anime-merchandise":
      return "Merch";
    case "toys-plushies":
      return "Plushies";
    default:
      return "Category";
  }
};

const getMobileCategoryStyle = (catId: ToyCategory) => {
  switch (catId) {
    case "tcg":
      return "bg-blue-600/20 border-blue-500/40 text-blue-400";
    case "gunpla":
      return "bg-sky-600/20 border-sky-500/40 text-sky-400";
    case "anime-figures":
      return "bg-red-600/20 border-red-500/40 text-red-400";
    case "anime-merchandise":
      return "bg-amber-600/20 border-amber-500/40 text-amber-400";
    case "toys-plushies":
      return "bg-pink-600/20 border-pink-500/40 text-pink-400";
    default:
      return "bg-slate-800 border-slate-700 text-slate-300";
  }
};
</script>

<template>
  <div class="space-y-4 font-display">
    <!-- Header: Shop by Hobby Category (Common to Mobile & Desktop) -->
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2.5">
          <h2
            class="text-lg sm:text-2xl font-extrabold text-white tracking-tight"
          >
            Shop by Hobby Category
          </h2>
          <span
            class="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-400/30"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span>3D Holo Hover Showcase</span>
          </span>
        </div>
        <p class="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
          Explore Trading Card Games, Japanese Model Kits, Scale Figures &amp;
          Supplies — hover any category to inspect live 3D collectibles
        </p>
      </div>
      <router-link
        to="/catalog"
        class="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
      >
        <span class="hidden sm:inline">View All Categories</span>
        <span class="sm:hidden">All &rarr;</span>
        <span class="hidden sm:inline">&rarr;</span>
      </router-link>
    </div>

    <!-- MOBILE VIEW (Doorzo Style): 5 Horizontal Categories with Icon & Name -->
    <div class="md:hidden py-1">
      <div class="grid grid-cols-5 gap-1 text-center items-start">
        <button
          v-for="cat in CATEGORIES_DATA"
          :key="cat.id"
          type="button"
          class="flex flex-col items-center justify-start group cursor-pointer focus:outline-none transition-transform active:scale-95 py-1"
          @click="handleCategoryClick(cat.id)"
        >
          <!-- Doorzo-style Icon Pill / Squircle -->
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border transition-all duration-200 group-hover:scale-105"
            :class="getMobileCategoryStyle(cat.id)"
          >
            <span>{{ cat.icon }}</span>
          </div>

          <!-- Category Name Label Underneath -->
          <span
            class="text-[10.5px] font-bold text-slate-200 group-hover:text-amber-400 mt-1.5 leading-tight line-clamp-2 px-0.5 tracking-tight"
          >
            {{ getMobileCategoryName(cat.id) }}
          </span>
        </button>
      </div>
    </div>

    <!-- DESKTOP VIEW: Interactive 3D Holo & Flashing Light Category Showcase -->
    <div class="hidden md:block">
      <div
        class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 items-stretch"
      >
        <div
          v-for="cat in CATEGORIES_DATA"
          :key="cat.id"
          class="relative rounded-3xl p-5 bg-slate-900/90 border border-slate-800/90 shadow-lg flex flex-col justify-between cursor-pointer group select-none backdrop-blur-md"
          :class="[
            getCategoryTheme(cat.id).borderHover,
            getCategoryTheme(cat.id).glowShadow,
            cat.id === 'tcg' ? 'overflow-visible z-30' : 'overflow-visible z-10 hover:z-20',
          ]"
          :style="getCard3DStyle(cat.id)"
          @mouseenter="handleCardMouseEnter(cat.id)"
          @mousemove="(e) => handleCardMouseMove(e, cat.id)"
          @mouseleave="handleCardMouseLeave(cat.id)"
          @click="handleCategoryClick(cat.id)"
        >
          <!-- CLIPPED INNER FX LAYER: Flashing Light Sweep, Cursor Spotlight & Neon Grid -->
          <div class="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
            <!-- Category Ambient Gradient Aura on Hover -->
            <div
              class="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              :class="getCategoryTheme(cat.id).auraGradient"
            ></div>

            <!-- Perspective Cyber Grid Floor -->
            <div
              class="absolute inset-x-0 bottom-0 h-40 opacity-15 group-hover:opacity-45 transition-opacity duration-500 category-cyber-grid"
            ></div>

            <!-- Dynamic Cursor-Tracking Radial Flashlight Glare -->
            <div
              v-if="hoveredCategory === cat.id"
              class="absolute inset-0 transition-opacity duration-200"
              :style="{
                background: `radial-gradient(240px circle at ${cardTilts[cat.id]?.glareX ?? 50}% ${cardTilts[cat.id]?.glareY ?? 50}%, ${getCategoryTheme(cat.id).beamColor}, transparent 75%)`,
              }"
            ></div>

            <!-- Flashing Diagonal Holographic Light Beam Sweep -->
            <div
              class="holo-flash-sweep absolute -inset-full pointer-events-none opacity-0 group-hover:opacity-100"
              :style="{
                background: `linear-gradient(115deg, transparent 35%, ${getCategoryTheme(cat.id).beamColor} 46%, ${getCategoryTheme(cat.id).flashColor} 50%, ${getCategoryTheme(cat.id).beamColor} 54%, transparent 65%)`,
              }"
            ></div>

            <!-- Secondary Pulsing Strobe Rim Light -->
            <div
              class="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-2xl opacity-0 group-hover:opacity-70 transition-all duration-500 group-hover:scale-125"
              :style="{ background: getCategoryTheme(cat.id).flashColor }"
            ></div>
          </div>

          <!-- TOP BAR: 3D Floating Icon & Live Explore Badge -->
          <div class="relative z-10 flex items-start justify-between mb-3" style="transform: translateZ(24px)">
            <div
              class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 border shadow-inner relative overflow-hidden"
              :class="getCategoryTheme(cat.id).iconBox"
            >
              <span class="relative z-10 drop-shadow">{{ cat.icon }}</span>
              <!-- Icon mini flash shimmer -->
              <span
                class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              ></span>
            </div>

            <div class="flex flex-col items-end gap-1">
              <span
                class="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border transition-all duration-300 shadow-sm"
                :class="getCategoryTheme(cat.id).badgeBg"
              >
                Explore &rarr;
              </span>
              <span class="text-[9px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                {{ getCategoryLiveCount(cat.id) }} Collectibles
              </span>
            </div>
          </div>

          <!-- 3D FLOATING & MOVING PRODUCTS STAGE -->
          <div
            class="relative z-10 my-2 h-36 rounded-2xl border border-slate-800/80 bg-slate-950/75 group-hover:bg-slate-950/50 group-hover:border-white/20 transition-all duration-300 flex flex-col items-center justify-center overflow-visible"
            style="transform-style: preserve-3d; perspective: 800px"
          >
            <!-- Glowing Pedestal Ring inside Stage -->
            <div
              class="absolute bottom-2.5 w-28 h-6 rounded-full border blur-[1px] transition-all duration-500 group-hover:w-36 group-hover:scale-110 pointer-events-none"
              :class="getCategoryTheme(cat.id).stageRing"
              style="transform: rotateX(72deg)"
            ></div>

            <!-- Vertical Light Pillar on Hover -->
            <div
              class="absolute inset-x-8 top-1 bottom-2 rounded-full opacity-0 group-hover:opacity-45 blur-md transition-opacity duration-500 pointer-events-none"
              :style="{
                background: `linear-gradient(to top, ${getCategoryTheme(cat.id).flashColor}, transparent)`,
              }"
            ></div>

            <!-- Floating 3D Product Cards -->
            <div
              class="relative w-full h-full flex items-center justify-center"
              style="transform-style: preserve-3d"
            >
              <div
                v-for="(prod, pIdx) in getCategoryProducts(cat.id)"
                :key="prod.id || pIdx"
                class="absolute w-20 h-24 rounded-xl bg-slate-900/95 border border-white/15 group-hover:border-amber-300/70 p-1.5 shadow-xl transition-all duration-500 ease-out flex flex-col items-center justify-between overflow-hidden hover:!scale-125"
                :style="getFloatingProductStyle(cat.id, pIdx, getCategoryProducts(cat.id).length)"
                :title="`Click to inspect: ${prod.name}`"
                @click="(e) => handleProductPreviewClick(e, prod, cat.id)"
              >
                <!-- Flashing Holo Foil Glare across each floating product -->
                <div
                  class="product-card-flash absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                ></div>

                <div class="w-full h-14 rounded-lg bg-slate-950/90 flex items-center justify-center overflow-hidden p-0.5">
                  <img
                    :src="prod.imageUrl"
                    :alt="prod.name"
                    loading="lazy"
                    class="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                    @error="(e) => handlePreviewImageError(e, cat.id)"
                  />
                </div>

                <div class="w-full text-center truncate px-0.5">
                  <p class="text-[8px] font-bold text-slate-200 truncate leading-tight">
                    {{ prod.name }}
                  </p>
                  <p
                    class="text-[8px] font-black leading-tight"
                    :class="getCategoryTheme(cat.id).accentText"
                  >
                    {{ formatCurrency(prod.price || 1990) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Interactive Product Switcher Dots + Active Product Ticker on Hover -->
            <div
              class="absolute -bottom-2.5 inset-x-3 flex items-center justify-between px-2 py-0.5 rounded-full bg-slate-900/95 border border-slate-700/80 shadow-md z-40 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300"
              @click.stop
            >
              <span class="text-[9px] font-bold text-slate-200 truncate max-w-[115px]">
                ✨ {{ getCategoryProducts(cat.id)[activeProductIndex[cat.id] || 0]?.name }}
              </span>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  v-for="(prod, dIdx) in getCategoryProducts(cat.id)"
                  :key="dIdx"
                  type="button"
                  class="w-2 h-2 rounded-full transition-all cursor-pointer"
                  :class="
                    (activeProductIndex[cat.id] || 0) === dIdx
                      ? 'bg-amber-400 scale-125'
                      : 'bg-slate-600 hover:bg-slate-400'
                  "
                  :aria-label="`Show product ${dIdx + 1}`"
                  @click="(e) => cycleCategoryProduct(e, cat.id, dIdx)"
                ></button>
              </div>
            </div>
          </div>

          <!-- INFO & TCG SUB-MENU -->
          <div class="relative z-10 space-y-1.5 mt-3" style="transform: translateZ(20px)">
            <h3
              class="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors tracking-tight"
            >
              {{ cat.name }}
            </h3>
            <p class="text-[11px] text-slate-400 group-hover:text-slate-300 font-medium leading-relaxed line-clamp-3 transition-colors">
              {{ cat.description }}
            </p>

            <!-- TCG Subcategories Hover Link & Floating Menu -->
            <div
              v-if="cat.id === 'tcg'"
              class="relative pt-1.5"
              @mouseenter="isTcgHovered = true"
              @mouseleave="isTcgHovered = false"
            >
              <button
                type="button"
                class="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 hover:text-white border border-indigo-500/40 hover:border-amber-400/60 flex items-center justify-between transition-all cursor-pointer shadow-sm"
                @click.stop="isTcgHovered = !isTcgHovered"
              >
                <span class="flex items-center gap-1.5">
                  <span>🃏</span>
                  <span>Select TCG Game</span>
                </span>
                <span
                  class="text-[10px] text-amber-400 font-extrabold flex items-center gap-1"
                >
                  <span>9 Franchises</span>
                  <svg
                    class="w-3.5 h-3.5 transition-transform"
                    :class="isTcgHovered ? 'rotate-180' : ''"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </button>

              <!-- Floating Hover Popover -->
              <transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 translate-y-1 scale-95"
                enter-to-class="opacity-100 translate-y-0 scale-100"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 translate-y-0 scale-100"
                leave-to-class="opacity-0 translate-y-1 scale-95"
              >
                <div
                  v-if="isTcgHovered"
                  class="absolute left-0 top-full pt-1.5 w-72 sm:w-80 z-50"
                  @click.stop
                >
                  <div
                    class="bg-slate-900/98 backdrop-blur-xl rounded-2xl p-2.5 border border-slate-700 shadow-2xl shadow-black/80 space-y-1 font-display"
                  >
                    <div
                      class="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between"
                    >
                      <span>TCG Franchise Selector</span>
                      <span class="text-amber-400 font-bold">9 Series</span>
                    </div>
                    <div
                      class="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar"
                    >
                      <button
                        v-for="series in TCG_SERIES_DATA"
                        :key="series.id"
                        type="button"
                        class="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer group/series"
                        @click="(e) => handleTcgSeriesClick(e, series.id)"
                      >
                        <div class="flex items-center gap-2.5 min-w-0">
                          <span class="text-base">{{ series.icon }}</span>
                          <div class="truncate">
                            <p
                              class="font-bold text-white group-hover/series:text-amber-300 transition-colors"
                            >
                              {{ series.name }}
                            </p>
                            <p
                              class="text-[10px] text-slate-400 font-normal truncate"
                            >
                              {{ series.shortName }} • Booster Boxes &amp; Packs
                            </p>
                          </div>
                        </div>
                        <span
                          class="text-xs text-slate-500 group-hover/series:text-amber-400 group-hover/series:translate-x-0.5 transition-all"
                          >&rarr;</span
                        >
                      </button>
                    </div>
                    <div
                      class="pt-1.5 border-t border-slate-800 px-2 flex justify-between items-center text-[10px] text-slate-400"
                    >
                      <span>Click franchise to filter</span>
                      <span
                        class="text-amber-400 font-bold hover:underline cursor-pointer"
                        @click="handleCategoryClick('tcg')"
                      >
                        All TCG &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <!-- BOTTOM BAR HIGHLIGHT -->
          <div
            class="relative z-10 mt-4 pt-3 border-t border-slate-800/90 group-hover:border-white/15 flex items-center justify-between text-xs font-medium text-slate-500 group-hover:text-slate-200 transition-colors"
            style="transform: translateZ(16px)"
          >
            <span class="flex items-center gap-1 text-[11px]">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:animate-ping"></span>
              <span>Official Sealed</span>
            </span>
            <span
              class="font-extrabold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              :class="getCategoryTheme(cat.id).accentText"
            >
              <span>Shop {{ cat.name.split(" ")[0] }}</span>
              <span>&rarr;</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Cyber perspective floor grid inside category cards */
.category-cyber-grid {
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.14) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.14) 1px, transparent 1px);
  background-size: 18px 18px;
  mask-image: linear-gradient(to top, rgba(0, 0, 0, 1) 15%, transparent 95%);
}

/* Continuous flashing holographic light sweep when hovering category card */
@keyframes holoFlashSweep {
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

.group:hover .holo-flash-sweep {
  animation: holoFlashSweep 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

/* Flashing foil reflection across each floating 3D product card */
@keyframes productCardFlash {
  0% {
    transform: translateX(-140%) skewX(-25deg);
  }
  45%,
  100% {
    transform: translateX(180%) skewX(-25deg);
  }
}

.product-card-flash {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.45),
    rgba(251, 191, 36, 0.35),
    transparent
  );
  animation: productCardFlash 2.1s ease-in-out infinite;
}
</style>
