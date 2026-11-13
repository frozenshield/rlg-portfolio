<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useCatalogStore } from "../catalog/catalog.store";
import HeroBanner from "./components/HeroBanner.vue";
import SlidableBanner from "./components/SlidableBanner.vue";
import CategoryPills from "./components/CategoryPills.vue";
import PromotionalBanner from "./components/PromotionalBanner.vue";
import ToyCard from "../catalog/components/ToyCard.vue";
import ToyDetailModal from "../catalog/components/ToyDetailModal.vue";
import type { ToyProduct } from "@/shared/types/toy.types";
import { useCmsStore } from "@/modules/cms/cms.store";
import { useAuctionStore } from "@/modules/auctions/auction.store";
import { useAuthStore } from "@/modules/auth/auth.store";
import type { AuctionListItem } from "@/modules/auctions/types";
import { formatCurrency } from "@/shared/utils/currency.util";
import { resolveApiUrl, resolveStorageUrl } from "@/shared/utils/api";

const emit = defineEmits<{
  (e: "open-advisor"): void;
}>();

const router = useRouter();
const catalogStore = useCatalogStore();
const cmsStore = useCmsStore();
const auctionStore = useAuctionStore();
const authStore = useAuthStore();

interface StoreReview {
  id: number;
  user_id: number;
  product_id: number;
  stars: number;
  message: string;
  image?: string | null;
  staff_reply?: string | null;
  user?: {
    name?: string;
    email?: string;
    customer_profile?: { segment?: string };
  };
  product?: { name?: string; image_url?: string };
  staff?: { name?: string };
  created_at?: string;
}

const liveReviews = ref<StoreReview[]>([]);
const isReviewsLoading = ref(false);

const fetchLiveReviews = async () => {
  isReviewsLoading.value = true;
  try {
    const res = await fetch("/api/customer-reviews");
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        liveReviews.value = json.data;
      } else {
        liveReviews.value = [];
      }
    }
  } catch (e) {
    console.warn("Could not fetch live reviews for home page", e);
  } finally {
    isReviewsLoading.value = false;
  }
};

const showAllReviews = ref(false);
const showAllBlogs = ref(false);

const allReviews = computed<StoreReview[]>(() => {
  return liveReviews.value;
});

const displayedReviews = computed<StoreReview[]>(() => {
  if (showAllReviews.value) {
    return allReviews.value;
  }
  return allReviews.value.slice(0, 3);
});

const displayedBlogs = computed(() => {
  if (showAllBlogs.value) {
    return cmsStore.publishedBlogs;
  }
  return cmsStore.publishedBlogs.slice(0, 4);
});

const activeGachaBanners = ref<any[]>([]);
const displayedGachaBanners = computed(() => activeGachaBanners.value.slice(0, 2));
const showBackToTop = ref(false);

const handleScroll = () => {
  if (typeof window !== "undefined") {
    showBackToTop.value = window.scrollY > 350;
  }
};

const scrollToTop = () => {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const fetchHomeGacha = async () => {
  try {
    const res = await fetch(resolveApiUrl("/gacha"));
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.banners) {
        activeGachaBanners.value = json.data.banners;
      }
    }
  } catch (e) {
    console.warn("Could not load storefront gacha:", e);
  }
};

onMounted(() => {
  fetchHomeGacha();
  catalogStore.fetchProducts(true);
  fetchLiveReviews();
  cmsStore.fetchCmsData();
  auctionStore.fetchAuctions("active");
  if (typeof window !== "undefined") {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("scroll", handleScroll);
  }
});

const activeBids = computed<AuctionListItem[]>(() => {
  return auctionStore.auctions.filter(
    (item) => !item.is_ended && item.status === "active",
  );
});

const displayedBids = computed<AuctionListItem[]>(() => {
  return activeBids.value.slice(0, 4);
});

const getAuctionCountdown = (endTimeStr: string, bidsCount: number = 0) => {
  if (!endTimeStr) return "Ending soon";
  const end = new Date(endTimeStr).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) {
    if (bidsCount === 0) {
      return "Auto-Resetting...";
    }
    return "Ended";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m ${seconds}s left`;
};

// Layer 1: Best Selling Collectibles (Always fills up to 10 items for a full 2x5 grid)
const bestSellingToys = computed<ToyProduct[]>(() => {
  const explicit = catalogStore.toys.filter((t) => t.isBestSeller);
  if (explicit.length >= 10) {
    return explicit.slice(0, 10);
  }
  const explicitIds = new Set(explicit.map((t) => t.id));
  const fallback = catalogStore.toys
    .filter((t) => !explicitIds.has(t.id))
    .slice()
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0) || (b.rating || 0) - (a.rating || 0));
  return [...explicit, ...fallback].slice(0, 10);
});

// Layer 2: Top Picks / Staff Favorites
const topPicksToys = computed<ToyProduct[]>(() => {
  const bestSellerIds = new Set(bestSellingToys.value.map((t) => t.id));
  const featuredDistinct = catalogStore.toys.filter(
    (t) => t.isFeatured && !bestSellerIds.has(t.id),
  );
  if (featuredDistinct.length >= 10) {
    return featuredDistinct.slice(0, 10);
  }
  return catalogStore.toys
    .filter(
      (t) => (t.isFeatured || (t.rating > 0 && t.rating >= 4.0)) && !bestSellerIds.has(t.id),
    )
    .slice(0, 10);
});

// Layer 3: New Releases & Fresh Arrivals
const newReleasesToys = computed<ToyProduct[]>(() => {
  const newArrivals = catalogStore.toys.filter((t) => t.isNewArrival);
  if (newArrivals.length >= 10) {
    return newArrivals.slice(0, 10);
  }
  return catalogStore.toys.slice().reverse().slice(0, 10);
});

// Layer 4: TCG Cards Spotlight
const tcgToys = computed<ToyProduct[]>(() => {
  return catalogStore.toys.filter((t) => t.category === "tcg").slice(0, 10);
});

// Layer 5: Gunpla & Mecha Model Kits
const gunplaToys = computed<ToyProduct[]>(() => {
  const kits = catalogStore.toys.filter((t) => t.category === "gunpla");
  if (kits.length >= 10) return kits.slice(0, 10);
  return kits;
});

// Layer 6: Anime Figures & Scale Statues
const animeFigureToys = computed<ToyProduct[]>(() => {
  const figs = catalogStore.toys.filter((t) => t.category === "anime-figures");
  if (figs.length >= 10) return figs.slice(0, 10);
  return figs;
});

// Layer 7: Anime Merchandise & Goods
const animeMerchToys = computed<ToyProduct[]>(() => {
  const merch = catalogStore.toys.filter(
    (t) => t.category === "anime-merchandise" || t.category === "toys-plushies"
  );
  if (merch.length >= 10) return merch.slice(0, 10);
  return merch;
});

const handleQuickView = (toy: ToyProduct) => {
  catalogStore.openDetailModal(toy);
};

const goToCatalog = (
  filterType?: "bestseller" | "toppicks" | "newest" | "tcg" | "gunpla" | "anime-figures" | "anime-merchandise",
) => {
  catalogStore.resetFilters();
  if (filterType === "newest") {
    catalogStore.sortBy = "newest";
  } else if (filterType === "toppicks") {
    catalogStore.sortBy = "rating";
  } else if (filterType === "tcg") {
    catalogStore.setCategory("tcg");
  } else if (filterType === "gunpla") {
    catalogStore.setCategory("gunpla");
  } else if (filterType === "anime-figures") {
    catalogStore.setCategory("anime-figures");
  } else if (filterType === "anime-merchandise") {
    catalogStore.setCategory("anime-merchandise");
  }
  router.push("/catalog");
};
</script>

<template>
  <div
    class="min-h-screen py-6 sm:py-8 space-y-12 sm:space-y-16 font-display text-slate-100"
  >
    <div
      class="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16"
    >
      <!-- 1. Hero Banner Headline -->
      <HeroBanner @open-advisor="emit('open-advisor')" />

      <!-- 2. Category Explorer (Doorzo style horizontal icons on mobile, rich cards on desktop) -->
      <CategoryPills />

      <!-- 2.5 Interactive Collector Ecosystem Arena (Raffles, Oripa Gacha, Live Proxy Auctions & Digital Wallet) -->
      <section class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-widest mb-1.5">
              <span>⚡ Live Collector Ecosystem</span>
              <span>•</span>
              <span>Powered by Digital Wallet Escrow</span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Interactive Grail Arenas &amp; Digital Vault
            </h2>
          </div>
          <router-link
            to="/wallet"
            class="text-xs font-black text-indigo-300 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
          >
            <span>💳 Open Collector Wallet &amp; Ledger</span>
            <span>&rarr;</span>
          </router-link>
        </div>

        <!-- MOBILE VIEW (Doorzo Style Icon Grid for Chrome & Android App) -->
        <div class="md:hidden py-1">
          <div class="grid grid-cols-4 gap-2 text-center items-start">
            <!-- Icon 1: Raffles -->
            <router-link
              to="/raffles"
              class="flex flex-col items-center justify-start group cursor-pointer focus:outline-none transition-transform active:scale-95 py-1"
            >
              <div class="w-13 h-13 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-2xl shadow-sm transition-all duration-200 group-hover:scale-105 relative">
                <span>🎯</span>
                <span class="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-black bg-amber-400 text-slate-950 uppercase">10x10</span>
              </div>
              <span class="text-[11px] font-bold text-slate-200 group-hover:text-amber-400 mt-1.5 leading-tight line-clamp-2 px-0.5 tracking-tight">
                100-Slot Raffle
              </span>
            </router-link>

            <!-- Icon 2: Oripa Gacha -->
            <router-link
              to="/gacha"
              class="flex flex-col items-center justify-start group cursor-pointer focus:outline-none transition-transform active:scale-95 py-1"
            >
              <div class="w-13 h-13 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center text-2xl shadow-sm transition-all duration-200 group-hover:scale-105 relative">
                <span>🎰</span>
                <span class="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-black bg-rose-500 text-white uppercase">Oripa</span>
              </div>
              <span class="text-[11px] font-bold text-slate-200 group-hover:text-rose-400 mt-1.5 leading-tight line-clamp-2 px-0.5 tracking-tight">
                Oripa Gacha
              </span>
            </router-link>

            <!-- Icon 3: Proxy Auctions -->
            <router-link
              to="/auctions"
              class="flex flex-col items-center justify-start group cursor-pointer focus:outline-none transition-transform active:scale-95 py-1"
            >
              <div class="w-13 h-13 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-2xl shadow-sm transition-all duration-200 group-hover:scale-105 relative">
                <span>⚡</span>
                <span class="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-black bg-emerald-500 text-slate-950 uppercase">Live</span>
              </div>
              <span class="text-[11px] font-bold text-slate-200 group-hover:text-emerald-400 mt-1.5 leading-tight line-clamp-2 px-0.5 tracking-tight">
                Proxy Auctions
              </span>
            </router-link>

            <!-- Icon 4: Digital Wallet -->
            <router-link
              to="/wallet"
              class="flex flex-col items-center justify-start group cursor-pointer focus:outline-none transition-transform active:scale-95 py-1"
            >
              <div class="w-13 h-13 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-2xl shadow-sm transition-all duration-200 group-hover:scale-105 relative">
                <span>💳</span>
                <span class="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[8px] font-black bg-indigo-500 text-white uppercase">Vault</span>
              </div>
              <span class="text-[11px] font-bold text-slate-200 group-hover:text-indigo-400 mt-1.5 leading-tight line-clamp-2 px-0.5 tracking-tight">
                Digital Wallet
              </span>
            </router-link>
          </div>
        </div>

        <!-- DESKTOP VIEW: 4 Interactive 3D Feature Cards with Dynamic Hover Aura -->
        <div class="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Card 1: 100-Slot Grail Raffle -->
          <router-link
            to="/raffles"
            class="group relative rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-950 border border-amber-500/30 hover:border-amber-400 transition-all duration-300 shadow-lg hover:shadow-[0_16px_40px_-8px_rgba(251,191,36,0.35)] hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between overflow-hidden"
          >
            <!-- Ambient Glow Aura on Hover -->
            <div class="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent blur-xs"></div>
            <!-- Shimmer Light Sweep on Hover -->
            <div class="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-amber-400/15 to-transparent"></div>

            <div class="space-y-2.5 relative z-10">
              <div class="flex items-center justify-between">
                <span class="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-xl group-hover:scale-120 group-hover:rotate-6 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all duration-300">
                  🎯
                </span>
                <span class="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm group-hover:scale-105 transition-transform">
                  10x10 Grid
                </span>
              </div>
              <h3 class="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                100-Slot Grail Raffle
              </h3>
              <p class="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                3D holographic PSA slab showcase, live collector avatar grid, and automatic 100/100 roulette draw.
              </p>
            </div>
            <div class="pt-4 mt-4 border-t border-slate-800/80 relative z-10 flex items-center justify-between text-xs font-black text-amber-400 group-hover:text-amber-300">
              <span class="group-hover:tracking-wide transition-all">Claim Glowing Slots</span>
              <span class="group-hover:translate-x-2 group-hover:scale-125 transition-transform duration-300">&rarr;</span>
            </div>
          </router-link>

          <!-- Card 2: Oripa Mystery Vault & Box Breaks -->
          <router-link
            to="/gacha"
            class="group relative rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-rose-950/30 to-slate-950 border border-rose-500/30 hover:border-rose-400 transition-all duration-300 shadow-lg hover:shadow-[0_16px_40px_-8px_rgba(244,63,94,0.35)] hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between overflow-hidden"
          >
            <!-- Ambient Glow Aura on Hover -->
            <div class="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-rose-500/20 via-pink-500/10 to-transparent blur-xs"></div>
            <!-- Shimmer Light Sweep on Hover -->
            <div class="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-rose-400/15 to-transparent"></div>

            <div class="space-y-2.5 relative z-10">
              <div class="flex items-center justify-between">
                <span class="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-xl group-hover:scale-120 group-hover:rotate-6 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all duration-300">
                  🎰
                </span>
                <span class="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm group-hover:scale-105 transition-transform">
                  Oripa &amp; Breaks
                </span>
              </div>
              <h3 class="text-base font-black text-white group-hover:text-rose-300 transition-colors">
                Oripa Gacha &amp; Box Breaks
              </h3>
              <p class="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                Swipe-to-rip mystery foil packs, live box break tier slots, pre-order calendar, and Digital Vault storage.
              </p>
            </div>
            <div class="pt-4 mt-4 border-t border-slate-800/80 relative z-10 flex items-center justify-between text-xs font-black text-rose-400 group-hover:text-rose-300">
              <span class="group-hover:tracking-wide transition-all">Rip Mystery Packs</span>
              <span class="group-hover:translate-x-2 group-hover:scale-125 transition-transform duration-300">&rarr;</span>
            </div>
          </router-link>

          <!-- Card 3: Advanced Proxy Auctions -->
          <router-link
            to="/auctions"
            class="group relative rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-950 border border-emerald-500/30 hover:border-emerald-400 transition-all duration-300 shadow-lg hover:shadow-[0_16px_40px_-8px_rgba(16,185,129,0.35)] hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between overflow-hidden"
          >
            <!-- Ambient Glow Aura on Hover -->
            <div class="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent blur-xs"></div>
            <!-- Shimmer Light Sweep on Hover -->
            <div class="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent"></div>

            <div class="space-y-2.5 relative z-10">
              <div class="flex items-center justify-between">
                <span class="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-xl group-hover:scale-120 group-hover:rotate-6 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-300">
                  ⚡
                </span>
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 group-hover:scale-105 transition-transform">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Proxy
                </span>
              </div>
              <h3 class="text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                Collector Proxy Auctions
              </h3>
              <p class="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                Set your maximum proxy bid cap, protected by anti-snipe popcorn timers, Buy It Now, and reserve validation.
              </p>
            </div>
            <div class="pt-4 mt-4 border-t border-slate-800/80 relative z-10 flex items-center justify-between text-xs font-black text-emerald-400 group-hover:text-emerald-300">
              <span class="group-hover:tracking-wide transition-all">Enter Bidding Arena</span>
              <span class="group-hover:translate-x-2 group-hover:scale-125 transition-transform duration-300">&rarr;</span>
            </div>
          </router-link>

          <!-- Card 4: Collector Digital Wallet -->
          <router-link
            to="/wallet"
            class="group relative rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-950 border border-indigo-500/30 hover:border-indigo-400 transition-all duration-300 shadow-lg hover:shadow-[0_16px_40px_-8px_rgba(99,102,241,0.35)] hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between overflow-hidden"
          >
            <!-- Ambient Glow Aura on Hover -->
            <div class="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-indigo-500/20 via-sky-500/10 to-transparent blur-xs"></div>
            <!-- Shimmer Light Sweep on Hover -->
            <div class="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-indigo-400/15 to-transparent"></div>

            <div class="space-y-2.5 relative z-10">
              <div class="flex items-center justify-between">
                <span class="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center text-xl group-hover:scale-120 group-hover:rotate-6 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-300">
                  💳
                </span>
                <span class="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm group-hover:scale-105 transition-transform">
                  QR Ph
                </span>
              </div>
              <h3 class="text-base font-black text-white group-hover:text-indigo-300 transition-colors">
                Digital Wallet &amp; Escrow
              </h3>
              <p class="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                Instant GCash/Maya top-ups, live available vs. escrow-held bid balance, and color-coded transaction ledger.
              </p>
            </div>
            <div class="pt-4 mt-4 border-t border-slate-800/80 relative z-10 flex items-center justify-between text-xs font-black text-indigo-400 group-hover:text-indigo-300">
              <span class="group-hover:tracking-wide transition-all">Manage Wallet Funds</span>
              <span class="group-hover:translate-x-2 group-hover:scale-125 transition-transform duration-300">&rarr;</span>
            </div>
          </router-link>
        </div>
      </section>

      <!-- 2.75 Live Mystery Oripa Gacha Vault Showcase -->
      <section v-if="activeGachaBanners.length > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xl shadow-xs">
              🎰
            </span>
            <div>
              <h2 class="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Mystery Oripa Pulls</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-sm">
                  LIVE VAULT
                </span>
              </h2>
              <p class="text-xs text-slate-400">
                Transparent weighted odds, PSA 10 slabs &amp; instant digital vault storage.
              </p>
            </div>
          </div>
          <router-link
            to="/gacha"
            class="hidden sm:flex items-center gap-1.5 text-xs font-black text-rose-400 hover:text-rose-300 transition-colors"
          >
            <span>View All Oripa Drops</span>
            <span>&rarr;</span>
          </router-link>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:gap-4">
          <div
            v-for="banner in activeGachaBanners"
            :key="banner.id"
            class="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-950 border border-rose-500/30 p-3 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center gap-3 sm:gap-5 justify-between group hover:border-rose-400 transition-all hover:shadow-[0_16px_40px_-10px_rgba(244,63,94,0.3)]"
          >
            <div class="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto text-center sm:text-left">
              <!-- Foil Pack Artwork or Holographic Icon -->
              <div class="w-16 h-22 sm:w-24 sm:h-32 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-950 via-slate-900 to-amber-950 border border-amber-400/40 p-1.5 sm:p-2 flex flex-col items-center justify-center text-center shrink-0 shadow-lg group-hover:scale-105 transition-transform overflow-hidden mx-auto sm:mx-0">
                <img
                  v-if="banner.image_url"
                  :src="resolveStorageUrl(banner.image_url)"
                  :alt="banner.name"
                  class="w-full h-full object-contain"
                />
          
                <div v-else class="space-y-1">
                  <span class="text-3xl sm:text-4xl">🎰</span>
                  <p class="text-[8px] font-black text-amber-300 uppercase tracking-tighter">Oripa Pack</p>
                </div>
              </div>

              <div class="space-y-2 min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {{ banner.series_tag || 'Pokémon TCG' }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">
                    {{ banner.total_remaining_cards }} Cards Left
                  </span>
                </div>
                <h3 class="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors truncate">
                  {{ banner.name }}
                </h3>
                <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {{ banner.description || 'Rare Japanese Oripa with top Chase PSA 10 slabs, alternate arts, and guaranteed fair RNG weights.' }}
                </p>
                <div class="flex items-center gap-3 pt-1">
                  <div>
                    <p class="text-[10px] uppercase font-bold text-slate-400">Single Pull</p>
                    <p class="text-sm font-black text-amber-400 font-mono">{{ formatCurrency(banner.cost_per_pull) }}</p>
                  </div>
                  <div class="h-6 w-px bg-slate-800"></div>
                  <div>
                    <p class="text-[10px] uppercase font-bold text-slate-400">{{ banner.multi_pull_count }}x Multi</p>
                    <p class="text-sm font-black text-white font-mono">{{ formatCurrency(banner.multi_pull_cost) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="w-full sm:w-auto shrink-0 flex sm:flex-col gap-2 mt-1 sm:mt-0">
              <router-link
                :to="`/gacha?bannerId=${banner.id}`"
                class="w-full sm:w-36 py-2 sm:py-3 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-[11px] sm:text-xs uppercase tracking-wider text-center shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>⚡ Rip Packs</span>
              </router-link>
            </div>
          </div>
        </div>
        <!-- Link to Oripa Drops Page if extra banners exist -->
        <div v-if="activeGachaBanners.length > 2" class="flex justify-center pt-2">
          <router-link
            to="/gacha"
            class="px-5 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-rose-500/30 hover:border-rose-400 text-rose-300 text-xs font-bold transition-all shadow-md flex items-center gap-2 group"
          >
            <span>🎰</span>
            <span>View +{{ activeGachaBanners.length - 2 }} More Mystery Oripa Drops on Oripa Drops Page</span>
            <span class="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </router-link>
        </div>
      </section>

      <!-- 3. Slidable Promotional Banners (Applicable both in web and mobile) -->
      <SlidableBanner />

      <!-- 3.5 VIP Pro Subscription Trigger Banner ("Become a Pro" for 999 PHP) -->
      <div
        role="button"
        tabindex="0"
        class="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-pink-950/85 to-amber-950 border-2 border-amber-400/60 p-5 sm:p-7 shadow-xl cursor-pointer group transition-all hover:border-amber-300 hover:shadow-[0_15px_45px_-10px_rgba(251,191,36,0.35)]"
        @click="authStore.openProModal()"
      >
        <div
          class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div class="space-y-1.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider"
              >
                👑 VIP Pro Pass • ₱999
              </span>
              <span class="text-[11px] font-bold text-pink-300">
                🌸 Free Grader Access + 4 Bonus Holo Cards Included!
              </span>
            </div>
            <h3 class="text-lg sm:text-2xl font-black text-white tracking-tight">
              Become a <span class="text-amber-400">Pro Collector</span> — Unlock Exclusive VIP Prices &amp; Free Holo Cards
            </h3>
            <p class="text-xs text-slate-300">
              Click this VIP banner to claim Free Grader Access, special promotion pricing, 1 random ex/V/VMAX/VSTAR, 1 25th Anniversary, 1 Pokéball Holo &amp; 1 Mirror Holo card!
            </p>
          </div>

          <div class="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              class="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-pink-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md cursor-pointer transition-transform group-hover:scale-105"
              @click.stop="authStore.openProModal()"
            >
              👑 Become a Pro (₱999)
            </button>
            <button
              type="button"
              class="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 cursor-pointer transition-colors"
              @click.stop="router.push('/vip')"
            >
              VIP Vault &rarr;
            </button>
          </div>
        </div>
      </div>

      <!-- 3. LAYER: Best Selling Collectibles -->
      <section class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="text-xl">🔥</span>
              <h2
                class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              >
                Best Selling
              </h2>
              <span
                class="hidden sm:inline-flex text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30"
              >
                High Demand
              </span>
            </div>
            <p class="text-xs text-slate-400 font-medium mt-1">
              Top-selling collector favorites, sealed boxes, and fan-voted
              grails
            </p>
          </div>

          <button
            type="button"
            class="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            @click="goToCatalog('bestseller')"
          >
            <span>See All Best Sellers</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
          <ToyCard
            v-for="(toy, idx) in bestSellingToys"
            :key="toy.id"
            :toy="toy"
            :eager="idx < 6"
            :class="{ '!hidden md:!flex': idx >= 6 }"
            @quick-view="handleQuickView"
          />
    
        </div>
      </section>

      <!-- 4. LAYER: Top Picks & Staff Favorites -->
      <section class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="text-xl">✨</span>
              <h2
                class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              >
                Top Picks
              </h2>
              <span
                class="hidden sm:inline-flex text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-500/30"
              >
                Staff Curated
              </span>
            </div>
            <p class="text-xs text-slate-400 font-medium mt-1">
              Hand-picked gems, premium collectibles, and essential hobbyist
              grails
            </p>
          </div>

          <button
            type="button"
            class="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            @click="goToCatalog('toppicks')"
          >
            <span>Explore Top Picks</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
          <ToyCard
            v-for="(toy, idx) in topPicksToys"
            :key="toy.id"
            :toy="toy"
            :eager="idx < 3"
            :class="{ '!hidden md:!flex': idx >= 6 }"
            @quick-view="handleQuickView"
          />
    
        </div>
      </section>

      <!-- 5. LAYER: Flash Sale / Collector Promo Banner -->
      <PromotionalBanner />

      <!-- 6. LAYER: New Releases & Fresh Arrivals -->
      <section class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="text-xl">🚀</span>
              <h2
                class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              >
                New Release
              </h2>
              <span
                class="hidden sm:inline-flex text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/30"
              >
                Just Landed
              </span>
            </div>
            <p class="text-xs text-slate-400 font-medium mt-1">
              Fresh shipments from Japan &amp; official distributors — latest
              card sets &amp; first-run model kits
            </p>
          </div>

          <button
            type="button"
            class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            @click="goToCatalog('newest')"
          >
            <span>View All New Releases</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
          <ToyCard
            v-for="(toy, idx) in newReleasesToys"
            :key="toy.id"
            :toy="toy"
            :class="{ '!hidden md:!flex': idx >= 6 }"
            @quick-view="handleQuickView"
          />
    
        </div>
      </section>

      <!-- 7. LAYER: TCG & Trading Cards Spotlight -->
      <section class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="text-xl">🃏</span>
              <h2
                class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              >
                Trading Card Games (TCG) Spotlight
              </h2>
              <span
                class="hidden sm:inline-flex text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-500/30"
              >
                Factory Sealed
              </span>
            </div>
            <p class="text-xs text-slate-400 font-medium mt-1">
              Factory-sealed Pokémon, One Piece, Yu-Gi-Oh! and Weiß Schwarz
              booster boxes &amp; ETBs
            </p>
          </div>

          <button
            type="button"
            class="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            @click="goToCatalog('tcg')"
          >
            <span>Explore All TCG</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
          <ToyCard
            v-for="(toy, idx) in tcgToys"
            :key="toy.id"
            :toy="toy"
            :class="{ '!hidden md:!flex': idx >= 6 }"
            @quick-view="handleQuickView"
          />
    
        </div>
      </section>

      <!-- 8. LAYER: Gunpla & Mecha Model Kits -->
      <section v-if="gunplaToys.length > 0" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="text-xl">🤖</span>
              <h2
                class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              >
                Gunpla &amp; Mecha Model Kits
              </h2>
              <span
                class="hidden sm:inline-flex text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-950/70 text-sky-300 border border-sky-500/30"
              >
                Authentic Bandai Spirits
              </span>
            </div>
            <p class="text-xs text-slate-400 font-medium mt-1">
              Authentic Bandai Spirits RG, MG, HG, PG Gundams &amp; precision Japanese model kits
            </p>
          </div>

          <button
            type="button"
            class="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            @click="goToCatalog('gunpla')"
          >
            <span>Explore Gunpla</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
          <ToyCard
            v-for="(toy, idx) in gunplaToys"
            :key="toy.id"
            :toy="toy"
            :class="{ '!hidden md:!flex': idx >= 6 }"
            @quick-view="handleQuickView"
          />
    
        </div>
      </section>

      <!-- 9. LAYER: Anime Figures & Scale Statues -->
      <section v-if="animeFigureToys.length > 0" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="text-xl">⚡</span>
              <h2
                class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              >
                Anime Figures &amp; Scale Statues
              </h2>
              <span
                class="hidden sm:inline-flex text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-950/70 text-rose-300 border border-rose-500/30"
              >
                Authentic GSC &amp; MegaHouse
              </span>
            </div>
            <p class="text-xs text-slate-400 font-medium mt-1">
              Scale statues, Nendoroids, Pop Up Parade, Figma &amp; collector prize figures
            </p>
          </div>

          <button
            type="button"
            class="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            @click="goToCatalog('anime-figures')"
          >
            <span>Explore Anime Figures</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
          <ToyCard
            v-for="(toy, idx) in animeFigureToys"
            :key="toy.id"
            :toy="toy"
            :class="{ '!hidden md:!flex': idx >= 6 }"
            @quick-view="handleQuickView"
          />
    
        </div>
      </section>

      <!-- 10. LAYER: Anime Merchandise & Goods -->
      <section v-if="animeMerchToys.length > 0" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="text-xl">🎁</span>
              <h2
                class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              >
                Anime Merchandise &amp; Goods
              </h2>
              <span
                class="hidden sm:inline-flex text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/30"
              >
                Official Japanese Goods
              </span>
            </div>
            <p class="text-xs text-slate-400 font-medium mt-1">
              Authentic acrylic stands, keychains, tapestries, pin badges, plushies &amp; anime goods
            </p>
          </div>

          <button
            type="button"
            class="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            @click="goToCatalog('anime-merchandise')"
          >
            <span>Explore Anime Merch</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
          <ToyCard
            v-for="(toy, idx) in animeMerchToys"
            :key="toy.id"
            :toy="toy"
            :class="{ '!hidden md:!flex': idx >= 6 }"
            @quick-view="handleQuickView"
          />
    
        </div>
      </section>

      <!-- 7. LAYER: Verified Collector Reviews Section -->
      <section
        v-if="allReviews.length > 0"
        class="bg-slate-900/60 rounded-3xl p-8 sm:p-12 border border-indigo-500/20 shadow-xl space-y-6 backdrop-blur-md"
      >
        <div
          class="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4"
        >
          <div class="space-y-1 text-left">
            <span
              class="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-500/30 inline-block"
            >
              Verified Hobbyist Reviews
            </span>
            <h3 class="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Trusted by 10,000+ Collectors &amp; Builders
            </h3>
            <p class="text-xs text-slate-400">
              Read authentic reviews from card players, model kit builders, and
              anime enthusiasts
            </p>
          </div>

          <!-- Header See More Link -->
          <button
            v-if="allReviews.length > 3"
            type="button"
            class="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors flex-shrink-0"
            @click="showAllReviews = !showAllReviews"
          >
            <span>{{
              showAllReviews
                ? "Show Less"
                : `See More Reviews (${allReviews.length})`
            }}</span>
            <span>{{ showAllReviews ? "▴" : "→" }}</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <!-- Real Reviews from customer_review DB Table -->
          <div
            v-for="(rev, idx) in displayedReviews"
            :key="rev.id"
            class="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 shadow-md space-y-3 flex flex-col justify-between"
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex text-amber-400 text-sm tracking-wider">
                  {{ "★".repeat(rev.stars) }}{{ "☆".repeat(5 - rev.stars) }}
                </div>
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                >
                  Verified Buyer
                </span>
              </div>

              <!-- Product Reviewed Pill -->
              <p
                v-if="rev.product?.name"
                class="text-[11px] font-bold text-indigo-300 truncate"
              >
                Item: {{ rev.product.name }}
              </p>

              <!-- Review Message -->
              <p class="text-xs text-slate-300 leading-relaxed font-medium">
                "{{ rev.message }}"
              </p>

              <!-- Photo Attachment if available -->
              <div v-if="rev.image" class="pt-1">
                <img
                  :src="rev.image"
                  alt="Customer Review Photo"
                  width="64"
                  height="64"
                  decoding="async"
                  loading="lazy"
                  class="w-16 h-16 rounded-xl object-contain bg-slate-900 border border-slate-700 p-1"
          
              </div>

              <!-- Staff Reply Badge & Text -->
              <div
                v-if="rev.staff_reply"
                class="mt-2 p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-[11px] space-y-1"
              >
                <div
                  class="font-extrabold text-[10px] text-indigo-300 uppercase tracking-wider flex items-center gap-1"
                >
                  <span>💬</span>
                  <span>Staff Response:</span>
                </div>
                <p class="text-slate-300 text-[11px] italic">
                  "{{ rev.staff_reply }}"
                </p>
              </div>
            </div>

            <!-- Customer Avatar & Name -->
            <div
              class="flex items-center gap-2.5 pt-2 border-t border-slate-800/80 mt-auto"
            >
              <span
                class="w-8 h-8 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center justify-center flex-shrink-0"
              >
                {{
                  rev.user?.name
                    ? rev.user.name.slice(0, 2).toUpperCase()
                    : "CO"
                }}
              </span>
              <div class="min-w-0">
                <h5 class="text-xs font-bold text-white truncate">
                  {{ rev.user?.name || "Collector" }}
                </h5>
                <p class="text-[10px] text-slate-400">
                  {{
                    rev.user?.customer_profile?.segment
                      ? `${rev.user.customer_profile.segment} Member`
                      : "Verified Collector"
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom See More Action -->
        <div v-if="allReviews.length > 3" class="pt-2 text-center">
          <button
            type="button"
            class="px-6 py-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-900 text-amber-400 hover:text-amber-300 border border-indigo-500/30 hover:border-amber-400/50 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer inline-flex items-center gap-2"
            @click="showAllReviews = !showAllReviews"
          >
            <span>{{
              showAllReviews
                ? "Show Less Reviews"
                : `See More Reviews (${allReviews.length - 3} more)`
            }}</span>
            <span>{{ showAllReviews ? "▴" : "↓" }}</span>
          </button>
        </div>
      </section>

      <!-- 8. LAYER: Hobby Guides & Collector Articles (Dynamic from CMS) -->
      <section v-if="cmsStore.publishedBlogs.length > 0" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="text-xl">✍️</span>
              <h2
                class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              >
                Hobby Guides &amp; Articles
              </h2>
              <span
                class="hidden sm:inline-flex text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-500/30"
              >
                Community Journal
              </span>
            </div>
            <p class="text-xs text-slate-400 font-medium mt-1">
              Tournament meta breakdowns, modeling build tips, and preservation
              guides from our team
            </p>
          </div>

          <!-- Header See More Link -->
          <button
            v-if="cmsStore.publishedBlogs.length > 4"
            type="button"
            class="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors flex-shrink-0"
            @click="showAllBlogs = !showAllBlogs"
          >
            <span>{{
              showAllBlogs
                ? "Show Less"
                : `See More Articles (${cmsStore.publishedBlogs.length})`
            }}</span>
            <span>{{ showAllBlogs ? "▴" : "→" }}</span>
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          <div
            v-for="post in displayedBlogs"
            :key="post.id"
            class="bg-slate-900/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 border border-slate-800 hover:border-indigo-500/50 shadow-xl shadow-black/40 hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
            @click="cmsStore.openBlogModal(post)"
          >
            <div class="space-y-2 sm:space-y-3">
              <div class="flex items-center justify-between text-xs gap-1">
                <span
                  class="text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 truncate"
                >
                  {{ post.category }}
                </span>
                <span class="text-slate-500 font-mono text-[9px] sm:text-[11px] shrink-0">{{
                  post.date
                }}</span>
              </div>

              <h3
                class="text-xs sm:text-base font-black text-white group-hover:text-amber-400 transition-colors leading-snug line-clamp-2"
              >
                {{ post.title }}
              </h3>

              <p class="text-[11px] sm:text-xs text-slate-400 leading-relaxed line-clamp-2">
                {{ post.summary }}
              </p>
            </div>

            <div
              class="pt-2.5 sm:pt-4 border-t border-slate-800/80 mt-3 sm:mt-4 flex items-center justify-between text-[10px] sm:text-xs"
            >
              <span class="text-slate-400 font-medium truncate max-w-[65%]"
                >By <strong class="text-slate-200">{{ post.author }}</strong></span
              >
              <span
                class="text-indigo-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5 sm:gap-1 shrink-0"
              >
                Read &rarr;
              </span>
            </div>
          </div>
        </div>

        <!-- Bottom See More Action -->
        <div v-if="cmsStore.publishedBlogs.length > 4" class="pt-2 text-center">
          <button
            type="button"
            class="px-6 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 text-amber-400 hover:text-amber-300 border border-slate-700/80 hover:border-amber-400/40 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer inline-flex items-center gap-2"
            @click="showAllBlogs = !showAllBlogs"
          >
            <span>{{
              showAllBlogs
                ? "Show Less Articles"
                : `See More Articles (${cmsStore.publishedBlogs.length - 4} more)`
            }}</span>
            <span>{{ showAllBlogs ? "▴" : "↓" }}</span>
          </button>
        </div>
      </section>

      <!-- 9. LAYER: Active Bidding / Auctions Section -->
      <section v-if="activeBids.length > 0" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="text-xl">🔨</span>
              <h2
                class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
              >
                Live Collector Auctions
              </h2>
              <span
                class="hidden sm:inline-flex text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/30 animate-pulse"
              >
                Active Bidding
              </span>
            </div>
            <p class="text-xs text-slate-400 font-medium mt-1">
              Live competitive bidding on rare sealed cards, graded slabs, and holy grail figures
            </p>
          </div>

          <!-- Header View All Link (if > 4) -->
          <router-link
            v-if="activeBids.length > 4"
            to="/auctions"
            class="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>View All Auctions ({{ activeBids.length }})</span>
            <span>&rarr;</span>
          </router-link>
        </div>

        <!-- Auction Items Grid: 2 columns on mobile, 4 columns on tablet/desktop -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div
            v-for="bid in displayedBids"
            :key="bid.id"
            class="bg-slate-900/95 rounded-xl p-2 border border-slate-800 hover:border-amber-400/50 flex flex-col justify-between group font-display transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/60"
            @click="router.push(`/auctions/${bid.id}`)"
          >
            <!-- Thumbnail Image with Live Countdown & Bid Count -->
            <div
              class="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-950/40 flex items-center justify-center mb-2"
            >
              <img
                :src="bid.primary_image_url || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600'"
                :alt="bid.item_name"
                width="280"
                height="280"
                decoding="async"
                class="w-full h-full object-contain p-1 rounded-md group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
        

              <!-- Live Indicator Top-Left -->
              <div class="absolute top-1.5 left-1.5 flex items-center gap-1">
                <span
                  class="bg-rose-600/95 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-sm"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  <span>Live</span>
                </span>
              </div>

              <!-- Time Remaining Badge Bottom-Left -->
              <div
                class="absolute bottom-1.5 left-1.5 bg-slate-950/85 backdrop-blur-xs text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1 shadow"
              >
                <span>⏳</span>
                <span>{{ getAuctionCountdown(bid.end_time, bid.bids_count || 0) }}</span>
              </div>

              <!-- Bid Count Badge Top-Right -->
              <div
                class="absolute top-1.5 right-1.5 bg-slate-950/80 backdrop-blur-xs text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-slate-700/60"
              >
                {{ bid.bids_count || 0 }} {{ (bid.bids_count || 0) === 1 ? 'bid' : 'bids' }}
              </div>
            </div>

            <!-- Card Body -->
            <div class="flex-1 flex flex-col justify-between space-y-1.5">
              <h3
                class="text-xs font-semibold text-slate-100 truncate group-hover:text-amber-300 transition-colors"
                :title="bid.item_name"
              >
                {{ bid.item_name }}
              </h3>

              <div class="pt-1 border-t border-slate-800/80 flex items-baseline justify-between">
                <div>
                  <span class="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
                    {{ (bid.bids_count || 0) === 0 ? 'Starting Bid' : 'Current Bid' }}
                  </span>
                  <span class="text-xs sm:text-sm font-extrabold text-amber-300 font-mono">
                    {{ formatCurrency(Number(bid.current_price) > 0 ? bid.current_price : (bid.starting_price || 0)) }}
                  </span>
                </div>
                <div class="text-right">
                  <span class="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
                    Min Next
                  </span>
                  <span class="text-[11px] font-bold text-slate-300 font-mono">
                    {{
                      formatCurrency(
                        (bid.bids_count || 0) === 0
                          ? (Number(bid.current_price) > 0 ? bid.current_price : (bid.starting_price || 0))
                          : (bid.min_next_bid || (Number(bid.current_price || bid.starting_price || 0) + (Number(bid.bid_increment) || 50)))
                      )
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Prominent "View All Auctions" Button if > 4 -->
        <div v-if="activeBids.length > 4" class="pt-2 text-center">
          <router-link
            to="/auctions"
            class="px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-400/20 active:scale-95 inline-flex items-center gap-2 border border-amber-300"
          >
            <span>View All Auctions ({{ activeBids.length }})</span>
            <span>&rarr;</span>
          </router-link>
        </div>
      </section>

      <!-- Quick View Modal -->
      <ToyDetailModal
        :toy="catalogStore.selectedToyForModal"
        :is-open="catalogStore.isDetailModalOpen"
        @close="catalogStore.closeDetailModal"
      />


      <!-- Floating Double Arrow "Back to Top" Button -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-90"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-4 scale-90"
      >
        <button
          v-show="showBackToTop"
          type="button"
          aria-label="Back to top"
          title="Back to top"
          class="fixed bottom-6 left-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/90 hover:bg-amber-400 text-amber-400 hover:text-slate-950 border border-amber-400/40 hover:border-amber-400 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group"
          @click="scrollToTop"
        >
          <svg class="w-5 h-5 -mb-2.5 transform group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          <svg class="w-5 h-5 transform group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </transition>

    </div>
  </div>
</template>


