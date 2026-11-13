<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useCartStore } from "@/modules/cart/cart.store";
import { useWishlistStore } from "@/modules/wishlist/wishlist.store";
import { useCatalogStore } from "@/modules/catalog/catalog.store";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useWalletStore } from "@/modules/wallet/wallet.store";
import { TCG_SERIES_DATA } from "@/shared/constants/categories.data";
import { formatCurrency } from "../utils/currency.util";
import BaseBadge from "./BaseBadge.vue";
import BecomeProModal from "./BecomeProModal.vue";
import type { TcgSubCategory, ToyCategory } from "../types/toy.types";

const emit = defineEmits<{
  (e: "open-advisor"): void;
  (e: "open-auth"): void;
  (e: "open-profile"): void;
  (e: "open-settings"): void;
  (e: "logout"): void;
}>();

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const catalogStore = useCatalogStore();
const authStore = useAuthStore();
const walletStore = useWalletStore();

const isUserMenuOpen = ref(false);
// Mother Category 2nd-layer toggle (renders above the search bar when clicked)
const isMotherCategoryOpen = ref(false);
const isSecondLayerTcgOpen = ref(false);

onMounted(() => {
  if (authStore.isAuthenticated) {
    authStore.fetchCurrentUser();
  }
  walletStore.fetchWallet();
});

watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      authStore.fetchCurrentUser();
      walletStore.fetchWallet();
    }
  }
);

const handleSignOut = async () => {
  isUserMenuOpen.value = false;
  isMobileMenuOpen.value = false;
  await authStore.logout();
  emit("logout");
};

const localSearchText = ref("");
const searchCategory = ref<string>("all");
const isSearchFocused = ref(false);
const isSearchModalOpen = ref(false);
const isMobileMenuOpen = ref(false);
const isMobileTcgExpanded = ref(false);

// Active category label for the single Mother Category button

// ─── INSTANT NAVIGATION PREFETCH LOGIC ─────────────────────────────────────────
const prefetchMap: Record<string, () => Promise<any>> = {
  catalog: () => import("@/modules/catalog/ToyCatalogView.vue"),
  auctions: () => import("@/modules/auctions/views/AuctionsListView.vue"),
  raffles: () => import("@/modules/raffles/RaffleArenaView.vue"),
  gacha: () => import("@/modules/gacha/GachaVaultView.vue"),
  liveBreaks: () => import("@/modules/live-breaks/LiveBreaksView.vue"),
  preorders: () => import("@/modules/preorders/PreordersView.vue"),
  vip: () => import("@/modules/catalog/VipSubscriptionView.vue"),
  wallet: () => import("@/modules/wallet/WalletDashboardView.vue"),
  orders: () => import("@/modules/orders/CustomerOrdersView.vue"),
};

const prefetchRoute = (key: string) => {
  if (prefetchMap[key]) {
    prefetchMap[key]().catch(() => {});
  }
};

if (typeof window !== "undefined") {
  const idle = (window as any).requestIdleCallback || ((cb: Function) => setTimeout(cb, 1200));
  idle(() => {
    prefetchRoute("catalog");
    prefetchRoute("auctions");
    prefetchRoute("gacha");
    prefetchRoute("raffles");
  });
}

const activeCategoryLabel = computed(() => {
  const cat = catalogStore.selectedCategory;
  if (route.path !== "/catalog" || !cat || cat === "all") return "Categories";
  if (cat === "tcg") return "TCG Cards";
  if (cat === "gunpla") return "Gunpla";
  if (cat === "anime-figures") return "Anime Figures";
  if (cat === "anime-merchandise") return "Anime Merch";
  if (cat === "toys-plushies") return "Toys & Plushies";
  return "Categories";
});

// Background Scroll Locking when Mobile Drawer is Open
watch(isMobileMenuOpen, (isOpen) => {
  if (typeof document === "undefined") return;
  if (isOpen) {
    document.documentElement.classList.add("overflow-hidden");
    document.body.classList.add("overflow-hidden");
  } else {
    if (!document.querySelector("[data-chat-open='true']")) {
      document.documentElement.classList.remove("overflow-hidden");
      document.body.classList.remove("overflow-hidden");
    }
  }
});

// Auto-close menus and restore scrolling when navigating
watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false;
    isSearchModalOpen.value = false;
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("overflow-hidden");
      document.body.classList.remove("overflow-hidden");
    }
  },
);

onUnmounted(() => {
  if (typeof document !== "undefined") {
    if (!document.querySelector("[data-chat-open='true']")) {
      document.documentElement.classList.remove("overflow-hidden");
      document.body.classList.remove("overflow-hidden");
    }
  }
});

const openSearch = () => {
  isSearchModalOpen.value = true;
};

const closeSearch = () => {
  isSearchModalOpen.value = false;
};

const searchPreviewResults = computed(() => {
  if (!localSearchText.value.trim()) return [];
  const query = localSearchText.value.toLowerCase().trim();
  return catalogStore.toys
    .filter(
      (toy) =>
        toy.name.toLowerCase().includes(query) ||
        toy.category.includes(query) ||
        (toy.tcgSeries && toy.tcgSeries.toLowerCase().includes(query)) ||
        (toy.pokemonType && toy.pokemonType.toLowerCase().includes(query)),
    )
    .slice(0, 5);
});

const handleSearchSubmit = () => {
  if (!localSearchText.value.trim() && searchCategory.value === "all") return;
  catalogStore.setSearchQuery(localSearchText.value.trim());
  if (searchCategory.value === "vip") {
    router.push({
      path: "/vip",
      query: localSearchText.value.trim() ? { search: localSearchText.value.trim() } : {},
    });
    return;
  }
  if (searchCategory.value !== "all") {
    catalogStore.setCategory(searchCategory.value as ToyCategory);
  }
  isSearchFocused.value = false;
  isSearchModalOpen.value = false;
  isMobileMenuOpen.value = false;
  router.push({
    path: "/catalog",
    query: {
      search: localSearchText.value.trim() || undefined,
      category: searchCategory.value !== "all" ? searchCategory.value : undefined,
    },
  });
};

const handleSelectPreview = (toyId: string) => {
  const toy = catalogStore.toys.find((t) => t.id === toyId);
  if (toy) {
    catalogStore.openDetailModal(toy);
  }
  isSearchFocused.value = false;
  isSearchModalOpen.value = false;
  localSearchText.value = "";
};

const navigateToCategory = (cat: ToyCategory | "all") => {
  catalogStore.setCategory(cat);
  isMobileMenuOpen.value = false;
  isMotherCategoryOpen.value = false;
  isSecondLayerTcgOpen.value = false;
  router.push({
    path: "/catalog",
    query: cat === "all" ? {} : { category: cat },
  });
};

const navigateToTcgSeries = (seriesId: TcgSubCategory) => {
  catalogStore.setCategory("tcg");
  catalogStore.setTcgSeries(seriesId);
  isMobileMenuOpen.value = false;
  isMotherCategoryOpen.value = false;
  isSecondLayerTcgOpen.value = false;
  router.push({
    path: "/catalog",
    query: { category: "tcg", series: seriesId },
  });
};
</script>

<template>
  <!-- Top Flash Announcement Bar -->
  <div
    class="bg-[#060a12] text-slate-300 text-xs font-semibold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 border-b border-slate-800"
  >
    <span class="text-amber-400">⚡</span>
    <span
      >WELCOME TO RLG HOBBY SHOP • FREE DISPATCH ON ORDERS OVER ₱2,500 • USE
      CODE
      <span
        class="bg-indigo-950/80 text-amber-300 border border-indigo-500/40 px-2 py-0.5 rounded font-mono font-bold"
        >HOBBY10</span
      >
      FOR 10% OFF</span
    >
    <span class="text-amber-400">⚡</span>
  </div>

  <!-- Main Navbar -->
  <header
    class="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg transition-all font-display"
  >
    <div class="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
      <!-- =================================================================== -->
      <!-- ROW 1: Logo + Search + Wallet / Profile / Wishlist / Cart          -->
      <!-- =================================================================== -->
      <div class="flex items-center justify-between h-16 xl:h-20 gap-2 xl:gap-4 relative">
        <!-- Left: Logo & Shop Brand -->
        <div class="flex items-center flex-shrink-0 z-10">
          <router-link
            to="/"
            class="flex items-center gap-2.5 group select-none"
          >
            <img
              src="/logo.png"
              alt="RLG Online Shop Logo"
              class="h-9 xl:h-11 w-auto object-contain group-hover:scale-105 transition-transform duration-200 drop-shadow-md"
            />
            <div class="hidden sm:block">
              <div class="flex items-center gap-1.5">
                <span
                  class="text-base xl:text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition-colors whitespace-nowrap leading-tight"
                >
                  RLG <span class="text-amber-400">ONLINE SHOP</span>
                </span>
              </div>
              <p class="hidden 2xl:block text-[10px] text-slate-400 font-medium tracking-wide whitespace-nowrap leading-tight">
                TCG • Gunpla • Figures • Supplies
              </p>
            </div>
          </router-link>
        </div>

      <!-- =================================================================== -->
      <!-- CENTER (Row 1): Search Field with Category Dropdown                -->
      <!-- =================================================================== -->
      <div class="hidden lg:block relative z-40 flex-1 min-w-0 max-w-2xl mx-auto">
        <div
          class="flex items-center gap-2 bg-slate-900/95 hover:bg-slate-900 rounded-2xl border border-slate-700/80 hover:border-slate-600 p-1.5 shadow-lg focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all"
        >
          <!-- Customizable Category Dropdown -->
          <div class="relative shrink-0">
            <select
              v-model="searchCategory"
              aria-label="Filter search by category"
              class="appearance-none bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl pl-3 pr-8 py-2 border border-slate-700/60 focus:outline-none cursor-pointer transition-colors"
            >
              <option value="all">📁 All Categories</option>
              <option value="tcg">🃏 Pokémon TCG</option>
              <option value="onepiece">🏴‍☠️ One Piece TCG</option>
              <option value="gunpla">🤖 Bandai Gunpla</option>
              <option value="anime-figures">🥋 Anime Figures</option>
              <option value="anime-merchandise">🛡️ Anime Merch</option>
              <option value="toys-plushies">🧸 Toys &amp; Plushies</option>
              <option value="vip">👑 VIP Exclusives</option>
            </select>
            <div class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          <div class="h-5 w-px bg-slate-750 shrink-0"></div>

          <!-- Long Search Input Field -->
          <div class="relative flex-1 flex items-center">
            <span class="pl-2.5 text-slate-400 text-sm">🔍</span>
            <input
              v-model="localSearchText"
              type="text"
              aria-label="Search catalog items"
              placeholder="Search by card name, booster box, Gunpla scale, or figure character..."
              class="w-full bg-transparent text-white placeholder-slate-400 text-xs sm:text-sm px-3 py-1.5 focus:outline-none font-medium"
              @keyup.enter="handleSearchSubmit"
              @focus="isSearchFocused = true"
            />
            <button
              v-if="localSearchText"
              type="button"
              class="p-1 text-slate-400 hover:text-white text-xs cursor-pointer mr-1"
              title="Clear search"
              @click="localSearchText = ''"
            >
              ✕
            </button>
          </div>

          <!-- Search Action Button -->
          <button
            type="button"
            class="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 shrink-0 flex items-center gap-1.5"
            @click="handleSearchSubmit"
          >
            <span>Search</span>
            <span>&rarr;</span>
          </button>
        </div>

        <!-- Live Search Preview Popover -->
        <transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div
            v-if="isSearchFocused && searchPreviewResults.length > 0"
            class="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-slate-200 font-display space-y-1"
          >
            <div class="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800">
              <span>Quick Matches</span>
              <span class="text-amber-400">Press Enter for all results</span>
            </div>
            <button
              v-for="item in searchPreviewResults"
              :key="item.id"
              type="button"
              class="w-full text-left p-2 rounded-xl hover:bg-slate-800 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer group"
              @click="handleSelectPreview(item.id)"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <img
                  :src="item.imageUrl"
                  :alt="item.name"
                  class="w-8 h-8 rounded-lg object-contain bg-slate-950 border border-slate-800 shrink-0"
                />
                <div class="truncate">
                  <div class="font-bold text-white group-hover:text-amber-300 truncate">
                    {{ item.name }}
                  </div>
                  <div class="text-[10px] text-slate-400 capitalize">
                    {{ item.category }} &bull; {{ item.condition || 'Mint' }}
                  </div>
                </div>
              </div>
              <span class="font-black text-amber-400 shrink-0 font-mono">
                {{ formatCurrency(item.price) }}
              </span>
            </button>
          </div>
        </transition>
      </div>

        <!-- Right: Wallet Beside Profile + Collector Profile + Wishlist + Cart -->
        <div class="flex items-center gap-2 flex-shrink-0 justify-end z-20">
          <!-- DIGITAL WALLET BUTTON (Positioned directly beside the Profile!) -->
          <router-link
            v-if="authStore.isAuthenticated"
            to="/wallet"
            class="h-10 flex items-center gap-2 px-3 rounded-xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 hover:from-indigo-900/90 hover:to-slate-800 border border-indigo-500/50 hover:border-amber-400/60 transition-all cursor-pointer shadow-sm active:scale-95 group"
            active-class="!border-amber-400 ring-1 ring-amber-400/40"
            title="Open Collector Digital Wallet & Escrow Ledger"
          >
            <div
              class="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-xs group-hover:scale-105 transition-transform"
            >
              💳
            </div>
            <div class="text-left leading-tight">
              <div class="flex items-center gap-1">
                <span class="text-[11px] font-black text-white group-hover:text-amber-300 transition-colors">
                  Wallet
                </span>
                <span class="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <p class="text-[10px] font-mono font-extrabold text-amber-300 leading-none">
                ₱{{
                  Number(walletStore.availableBalance || 0).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }}
              </p>
            </div>
          </router-link>

          <!-- Unauthenticated Wallet Button: Always ₱0.00 & Prompts Sign In on Click -->
          <button
            v-else
            type="button"
            @click="emit('open-auth')"
            class="h-10 flex items-center gap-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/60 transition-all cursor-pointer shadow-sm active:scale-95 group"
            title="Sign In to access Collector Digital Wallet"
          >
            <div
              class="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs group-hover:scale-105 transition-transform text-slate-400"
            >
              💳
            </div>
            <div class="text-left leading-tight">
              <div class="flex items-center gap-1">
                <span class="text-[11px] font-black text-slate-300 group-hover:text-amber-300 transition-colors">
                  Wallet
                </span>
              </div>
              <p class="text-[10px] font-mono font-extrabold text-slate-400 leading-none">
                ₱0.00
              </p>
            </div>
          </button>

          <!-- Collector Account Avatar / Dropdown OR Sign-In Button -->
          <div class="relative hidden sm:flex items-center">
            <!-- If Logged In: Show Collector Avatar & Dropdown -->
            <div v-if="authStore.isAuthenticated" class="relative">
              <button
                type="button"
                class="h-10 flex items-center gap-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer shadow-sm active:scale-95 group"
                :class="
                  isUserMenuOpen ? 'border-amber-400/60 bg-slate-800' : ''
                "
                @click="isUserMenuOpen = !isUserMenuOpen"
              >
                <!-- Avatar circle with emerald online indicator -->
                <div class="relative">
                  <div
                    class="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-0.5 shadow-xs"
                  >
                    <div
                      class="w-full h-full rounded-[10px] bg-slate-900 overflow-hidden flex items-center justify-center text-xs font-black text-amber-300"
                    >
                      <img
                        v-if="authStore.currentUser.avatar"
                        :src="authStore.currentUser.avatar"
                        alt="Avatar"
                        class="w-full h-full object-cover"
                      />
                      <span v-else>{{
                        authStore.currentUser.name
                          ? authStore.currentUser.name.charAt(0).toUpperCase()
                          : "C"
                      }}</span>
                    </div>
                  </div>
                  <!-- Emerald Online Status Dot -->
                  <span
                    class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900"
                  ></span>
                </div>

                <div class="text-left hidden xl:block">
                  <div class="flex items-center gap-1.5">
                    <p
                      class="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1 max-w-[100px]"
                    >
                      {{ authStore.currentUser.name || "Collector" }}
                    </p>
                    <span
                      v-if="authStore.isVip"
                      class="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-xs flex items-center gap-0.5"
                      title="Gold VIP Pro Subscriber"
                    >
                      <span>👑</span>
                      <span>VIP</span>
                    </span>
                  </div>
                  <p
                    class="text-[9px] font-extrabold uppercase tracking-wider"
                    :class="authStore.isVip ? 'text-amber-400' : 'text-indigo-400'"
                  >
                    {{ authStore.isVip ? "Gold VIP Pro" : "Member" }}
                  </p>
                </div>

                <span
                  v-if="authStore.isVip"
                  class="xl:hidden px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-xs"
                >
                  👑 VIP
                </span>

                <!-- Dropdown Arrow -->
                <svg
                  class="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200"
                  :class="isUserMenuOpen ? 'rotate-180 text-amber-400' : ''"
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
              </button>

              <!-- Transparent Backdrop to close menu on click outside -->
              <div
                v-if="isUserMenuOpen"
                class="fixed inset-0 z-40"
                @click="isUserMenuOpen = false"
              ></div>

              <!-- Collector Account Dropdown Menu -->
              <transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 translate-y-1 scale-95"
                enter-to-class="opacity-100 translate-y-0 scale-100"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 translate-y-0 scale-100"
                leave-to-class="opacity-0 translate-y-1 scale-95"
              >
                <div
                  v-if="isUserMenuOpen"
                  class="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 font-display animate-scale-up text-slate-200"
                >
                  <!-- User Header Card -->
                  <div
                    class="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-1.5 flex items-center gap-3"
                  >
                    <div
                      class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-400 p-0.5 flex-shrink-0"
                    >
                      <div
                        class="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-sm font-black text-amber-300 overflow-hidden"
                      >
                        <img
                          v-if="authStore.currentUser.avatar"
                          :src="authStore.currentUser.avatar"
                          alt="Avatar"
                          class="w-full h-full object-cover"
                        />
                        <span v-else>{{
                          authStore.currentUser.name
                            ? authStore.currentUser.name.charAt(0).toUpperCase()
                            : "C"
                        }}</span>
                      </div>
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5">
                        <p class="text-xs font-bold text-white truncate">
                          {{ authStore.currentUser.name || "Collector" }}
                        </p>
                        <span
                          v-if="authStore.isVip"
                          class="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-black text-[9px] uppercase shrink-0"
                        >
                          👑 VIP
                        </span>
                      </div>
                      <p class="text-[10px] text-slate-400 truncate">
                        {{
                          authStore.currentUser.email ||
                          "collector@rlgshop.local"
                        }}
                      </p>
                      <span
                        v-if="authStore.isVip"
                        class="inline-block mt-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40"
                      >
                        Gold VIP Pro Member
                      </span>
                      <span
                        v-else
                        class="inline-block mt-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30"
                      >
                        Collector Account
                      </span>
                    </div>
                  </div>

                  <!-- Option: Become a Pro / VIP Vault -->
                  <button
                    type="button"
                    class="w-full flex items-center gap-2.5 px-3 py-2 mb-1 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/15 to-pink-500/15 border border-amber-400/40 text-amber-300 hover:from-amber-500/25 hover:to-pink-500/25 transition-all cursor-pointer"
                    @click="
                      isUserMenuOpen = false;
                      authStore.openProModal();
                    "
                  >
                    <span class="text-sm">👑</span>
                    <div class="text-left flex-1">
                      <div class="text-amber-300 font-black">
                        {{ authStore.isVip ? "VIP Pro Perks Active" : "Become a Pro — ₱999" }}
                      </div>
                      <div class="text-[10px] text-amber-200/70 font-normal">
                        Grader access + 4 Free Holo Cards
                      </div>
                    </div>
                  </button>

                  <!-- Option 1: Profile -->
                  <button
                    type="button"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer group"
                    @click="
                      isUserMenuOpen = false;
                      emit('open-profile');
                    "
                  >
                    <span
                      class="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform"
                    >
                      👤
                    </span>
                    <div class="text-left flex-1">
                      <div
                        class="text-white group-hover:text-amber-300 transition-colors"
                      >
                        Profile
                      </div>
                      <div class="text-[10px] text-slate-400 font-normal">
                        Edit personal &amp; shipping details
                      </div>
                    </div>
                    <span
                      class="text-xs text-slate-500 group-hover:text-amber-400"
                      >&rarr;</span
                    >
                  </button>

                  <!-- Option: Collector Digital Wallet -->
                  <router-link
                    to="/wallet"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer group"
                    @click="isUserMenuOpen = false"
                  >
                    <span
                      class="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform"
                    >
                      💳
                    </span>
                    <div class="text-left flex-1">
                      <div
                        class="text-white group-hover:text-amber-300 transition-colors flex items-center justify-between"
                      >
                        <div class="flex items-center gap-1.5">
                          <span>Digital Wallet</span>
                          <span
                            class="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          >
                            QR Ph
                          </span>
                        </div>
                        <span class="font-mono text-[11px] font-extrabold text-amber-300">
                          ₱{{
                            Number(walletStore.availableBalance || 0).toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          }}
                        </span>
                      </div>
                      <div class="text-[10px] text-slate-400 font-normal">
                        Top-up, bid escrow holds &amp; ledger
                      </div>
                    </div>
                    <span
                      class="text-xs text-slate-500 group-hover:text-amber-400"
                      >&rarr;</span
                    >
                  </router-link>

                  <!-- Option: 100-Slot Grail Raffles -->
                  <router-link
                    to="/raffles"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer group"
                    @click="isUserMenuOpen = false"
                  >
                    <span
                      class="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-500/20 text-amber-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform"
                    >
                      🎯
                    </span>
                    <div class="text-left flex-1">
                      <div
                        class="text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5"
                      >
                        <span>100-Slot Raffles</span>
                        <span
                          class="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        >
                          3D Grid
                        </span>
                      </div>
                      <div class="text-[10px] text-slate-400 font-normal">
                        Avatar grid &amp; live roulette draw
                      </div>
                    </div>
                    <span
                      class="text-xs text-slate-500 group-hover:text-amber-400"
                      >&rarr;</span
                    >
                  </router-link>

                  <!-- Option: Oripa Gacha & Digital Vault -->
                  <router-link
                    to="/gacha"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer group"
                    @click="isUserMenuOpen = false"
                  >
                    <span
                      class="w-7 h-7 rounded-lg bg-rose-950/60 border border-rose-500/20 text-rose-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform"
                    >
                      🎰
                    </span>
                    <div class="text-left flex-1">
                      <div
                        class="text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5"
                      >
                        <span>Oripa Gacha &amp; Vault</span>
                        <span
                          class="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        >
                          Breaks
                        </span>
                      </div>
                      <div class="text-[10px] text-slate-400 font-normal">
                        Mystery pulls, box breaks &amp; pre-orders
                      </div>
                    </div>
                    <span
                      class="text-xs text-slate-500 group-hover:text-amber-400"
                      >&rarr;</span
                    >
                  </router-link>

                  <!-- Option: Orders & Tracking -->
                  <router-link
                    to="/orders"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer group"
                    @click="isUserMenuOpen = false"
                  >
                    <span
                      class="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform"
                    >
                      📦
                    </span>
                    <div class="text-left flex-1">
                      <div
                        class="text-white group-hover:text-amber-300 transition-colors"
                      >
                        Orders &amp; Tracking
                      </div>
                      <div class="text-[10px] text-slate-400 font-normal">
                        Package status, history &amp; receipts
                      </div>
                    </div>
                    <span
                      class="text-xs text-slate-500 group-hover:text-amber-400"
                      >&rarr;</span
                    >
                  </router-link>

                  <!-- Option: Auctions & Bids Hub -->
                  <router-link
                    to="/profile/auctions"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer group"
                    @click="isUserMenuOpen = false"
                  >
                    <span
                      class="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-500/20 text-amber-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform"
                    >
                      🔨
                    </span>
                    <div class="text-left flex-1">
                      <div
                        class="text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5"
                      >
                        <span>Auctions &amp; Bids</span>
                        <span
                          class="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        >
                          Live
                        </span>
                      </div>
                      <div class="text-[10px] text-slate-400 font-normal">
                        Watchlist, active bids &amp; won payments
                      </div>
                    </div>
                    <span
                      class="text-xs text-slate-500 group-hover:text-amber-400"
                      >&rarr;</span
                    >
                  </router-link>

                  <!-- Option: Hobby Matcher Quiz -->
                  <button
                    type="button"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer group"
                    @click="
                      isUserMenuOpen = false;
                      emit('open-advisor');
                    "
                  >
                    <span
                      class="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform"
                    >
                      🎯
                    </span>
                    <div class="text-left flex-1">
                      <div
                        class="text-white group-hover:text-amber-300 transition-colors"
                      >
                        Hobby Matcher
                      </div>
                      <div class="text-[10px] text-slate-400 font-normal">
                        AI Gift Advisor &amp; Set Recommendation
                      </div>
                    </div>
                    <span
                      class="text-xs text-slate-500 group-hover:text-amber-400"
                      >&rarr;</span
                    >
                  </button>

                  <!-- Option 2: Setting -->
                  <button
                    type="button"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer group"
                    @click="
                      isUserMenuOpen = false;
                      emit('open-settings');
                    "
                  >
                    <span
                      class="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform"
                    >
                      ⚙️
                    </span>
                    <div class="text-left flex-1">
                      <div
                        class="text-white group-hover:text-amber-300 transition-colors"
                      >
                        Setting
                      </div>
                      <div class="text-[10px] text-slate-400 font-normal">
                        Theme appearance, security &amp; alerts
                      </div>
                    </div>
                    <span
                      class="text-xs text-slate-500 group-hover:text-amber-400"
                      >&rarr;</span
                    >
                  </button>

                  <div class="my-1 border-t border-slate-800"></div>

                  <!-- Option 3: Logout -->
                  <button
                    type="button"
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer group"
                    @click="handleSignOut"
                  >
                    <span
                      class="w-7 h-7 rounded-lg bg-rose-950/50 border border-rose-500/20 text-rose-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform"
                    >
                      🚪
                    </span>
                    <div class="text-left flex-1">
                      <div>Logout</div>
                      <div class="text-[10px] text-rose-400/70 font-normal">
                        Sign out of your session
                      </div>
                    </div>
                  </button>
                </div>
              </transition>
            </div>

            <!-- If Not Logged In: Sign In Button -->
            <button
              v-else
              type="button"
              class="h-10 px-3.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 hover:border-amber-400/60 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
              @click="emit('open-auth')"
            >
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path
                  d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
                />
              </svg>
              <span>Sign In</span>
            </button>
          </div>

          <!-- Wishlist Button -->
          <router-link
            to="/wishlist"
            class="relative h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/60 text-slate-300 hover:text-amber-400 transition-all"
            title="Saved Wishlist"
            aria-label="Collector Wishlist"
          >
            <svg
              class="w-5 h-5"
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
            <span
              v-if="wishlistStore.count > 0"
              class="absolute -top-1 -right-1 bg-indigo-600 text-white font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs animate-scale-up"
            >
              {{ wishlistStore.count }}
            </span>
          </router-link>

          <!-- Cart Trigger Button -->
          <button
            type="button"
            class="relative h-10 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 rounded-xl border border-slate-700/80 hover:border-amber-400/60 shadow-md transition-all active:scale-95 cursor-pointer font-bold"
            aria-label="View Shopping Cart"
            @click="cartStore.openDrawer"
          >
            <div class="relative">
              <svg
                class="w-4.5 h-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span
                v-if="cartStore.totalItemCount > 0"
                class="absolute -top-2 -right-2 bg-amber-400 text-slate-950 font-black text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md shadow-amber-400/30 border-2 border-slate-900"
              >
                {{ cartStore.totalItemCount }}
              </span>
            </div>
            <span
              class="hidden sm:inline text-xs font-black font-mono text-amber-300"
            >
              {{ formatCurrency(cartStore.subtotal) }}
            </span>
          </button>

          <!-- Mobile Hamburger Toggle -->
          <button
            type="button"
            class="xl:hidden p-2 rounded-2xl hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="!isMobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- ROW 2: Full-width navigation pills (own row, never overlaps logo/actions) -->
      <!-- =================================================================== -->
        <nav
          class="hidden xl:flex flex-wrap items-center justify-center gap-2 pb-3 text-xs font-bold text-slate-300 w-full"
        >
          <!-- All Products -->
          <router-link
            to="/catalog"
            @mouseenter="prefetchRoute('catalog')"
            @touchstart.passive="prefetchRoute('catalog')"
            class="group px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/80 hover:border-amber-400/50 transition-all duration-200 flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs shrink-0 hover:-translate-y-0.5"
            active-class="!bg-slate-800 !text-amber-300 !border-amber-400/70 font-black"
            @click="
              catalogStore.setCategory('all');
              isMotherCategoryOpen = false;
            "
          >
            <span class="font-bold">All Products</span>
          </router-link>

          <!-- 1 Mother Category Button -->
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl border transition-all duration-200 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 hover:-translate-y-0.5"
            :class="
              isMotherCategoryOpen ||
              (route.path === '/catalog' && catalogStore.selectedCategory !== 'all')
                ? 'bg-amber-400/15 text-amber-300 border-amber-400/50 shadow-sm shadow-amber-500/10'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border-slate-700/80 hover:border-amber-400/50'
            "
            @click="isMotherCategoryOpen = !isMotherCategoryOpen"
          >
            <span>🗂️</span>
            <span class="font-extrabold">{{ activeCategoryLabel }}</span>
            <svg
              class="w-3 h-3 transition-transform duration-200 text-amber-400"
              :class="isMotherCategoryOpen ? 'rotate-180' : ''"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Live Proxy Auctions -->
          <router-link
            to="/auctions"
            @mouseenter="prefetchRoute('auctions')"
            @touchstart.passive="prefetchRoute('auctions')"
            class="group px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/80 hover:border-amber-400/50 transition-all duration-200 flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs shrink-0 hover:-translate-y-0.5"
            active-class="!bg-slate-800 !text-amber-300 !border-amber-400/70 font-black"
          >
            <span class="inline-block transition-transform duration-200 group-hover:scale-125 group-hover:-rotate-12">⚡</span>
            <span class="font-bold">Auctions</span>
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </router-link>

          <!-- Live Slot -->
          <router-link
            to="/raffles"
            @mouseenter="prefetchRoute('raffles')"
            @touchstart.passive="prefetchRoute('raffles')"
            class="group px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/80 hover:border-amber-400/50 transition-all duration-200 flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs shrink-0 hover:-translate-y-0.5"
            active-class="!bg-slate-800 !text-amber-300 !border-amber-400/70 font-black"
          >
            <span class="inline-block transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12">🎯</span>
            <span class="font-bold">Live Slot</span>
            <span class="inline-block text-[9px] font-black uppercase px-1 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700">3D</span>
          </router-link>

          <!-- Oripa Mystery Gacha -->
          <router-link
            to="/gacha"
            @mouseenter="prefetchRoute('gacha')"
            @touchstart.passive="prefetchRoute('gacha')"
            class="group px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/80 hover:border-amber-400/50 transition-all duration-200 flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs shrink-0 hover:-translate-y-0.5"
            active-class="!bg-slate-800 !text-amber-300 !border-amber-400/70 font-black"
          >
            <span class="inline-block transition-transform duration-200 group-hover:scale-125 group-hover:rotate-6">🎰</span>
            <span class="font-bold">Gacha</span>
          </router-link>

          <!-- Live Box Breaks & Streaming -->
          <router-link
            to="/live-breaks"
            @mouseenter="prefetchRoute('liveBreaks')"
            @touchstart.passive="prefetchRoute('liveBreaks')"
            class="group px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/80 hover:border-amber-400/50 transition-all duration-200 flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs shrink-0 hover:-translate-y-0.5"
            active-class="!bg-slate-800 !text-amber-300 !border-amber-400/70 font-black"
          >
            <span class="inline-block transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12">📡</span>
            <span class="font-bold">Live Breaks</span>
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          </router-link>

          <!-- Pre-Orders & Drops Calendar -->
          <router-link
            to="/preorders"
            @mouseenter="prefetchRoute('preorders')"
            @touchstart.passive="prefetchRoute('preorders')"
            class="group px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/80 hover:border-amber-400/50 transition-all duration-200 flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs shrink-0 hover:-translate-y-0.5"
            active-class="!bg-slate-800 !text-amber-300 !border-amber-400/70 font-black"
          >
            <span class="inline-block transition-transform duration-200 group-hover:scale-125 group-hover:rotate-6">📅</span>
            <span class="font-bold">Pre-Orders</span>
          </router-link>

          <!-- VIP Exclusive Page Link -->
          <router-link
            to="/vip"
            @mouseenter="prefetchRoute('vip')"
            @touchstart.passive="prefetchRoute('vip')"
            class="group px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/80 hover:border-amber-400/50 transition-all duration-200 flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs shrink-0 hover:-translate-y-0.5"
            active-class="!bg-slate-800 !text-amber-300 !border-amber-400/70 font-black"
          >
            <span class="inline-block transition-transform duration-200 group-hover:scale-125 group-hover:-rotate-12">👑</span>
            <span class="font-black tracking-wide">VIP</span>
          </router-link>
        </nav>


      <!-- =================================================================== -->
      <!-- LAYER 2 (ABOVE SEARCH BAR): Appears when Mother Category is clicked -->
      <!-- =================================================================== -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="isMotherCategoryOpen"
          class="py-2.5 px-3 mb-2 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-2.5"
        >
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center flex-wrap gap-1.5 sm:gap-2">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2">
                Hobby Categories:
              </span>

              <!-- All Products Pill -->
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                :class="
                  catalogStore.selectedCategory === 'all' && route.path === '/catalog'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/70'
                "
                @click="navigateToCategory('all')"
              >
                <span>📁</span>
                <span>All Categories</span>
              </button>

              <!-- TCG Cards Pill (with Franchise Sub-Toggle) -->
              <div class="inline-flex items-center rounded-xl bg-slate-800/80 border border-slate-700/70 overflow-hidden">
                <button
                  type="button"
                  class="px-3 py-1.5 text-xs font-bold hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1.5"
                  :class="
                    catalogStore.selectedCategory === 'tcg'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'text-slate-200'
                  "
                  @click="navigateToCategory('tcg')"
                >
                  <span>🃏</span>
                  <span>TCG Cards</span>
                </button>
                <button
                  type="button"
                  class="px-2 py-1.5 text-[10px] font-black text-amber-400 hover:bg-slate-700/80 border-l border-slate-700/70 cursor-pointer flex items-center gap-1"
                  title="Choose TCG Franchise"
                  @click.stop="isSecondLayerTcgOpen = !isSecondLayerTcgOpen"
                >
                  <span>Sets</span>
                  <span :class="isSecondLayerTcgOpen ? 'rotate-180' : ''" class="inline-block transition-transform">▾</span>
                </button>
              </div>

              <!-- Gunpla Pill -->
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                :class="
                  catalogStore.selectedCategory === 'gunpla'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/70'
                "
                @click="navigateToCategory('gunpla')"
              >
                <span>🤖</span>
                <span>Gunpla &amp; Model Kits</span>
              </button>

              <!-- Anime Figures Pill -->
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                :class="
                  catalogStore.selectedCategory === 'anime-figures'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/70'
                "
                @click="navigateToCategory('anime-figures')"
              >
                <span>🥋</span>
                <span>Anime Figures</span>
              </button>

              <!-- Anime Merchandise Pill -->
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                :class="
                  catalogStore.selectedCategory === 'anime-merchandise'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/70'
                "
                @click="navigateToCategory('anime-merchandise')"
              >
                <span>🛡️</span>
                <span>Anime Merchandise</span>
              </button>

              <!-- Toys & Plushies Pill -->
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                :class="
                  catalogStore.selectedCategory === 'toys-plushies'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/70'
                "
                @click="navigateToCategory('toys-plushies')"
              >
                <span>🧸</span>
                <span>Toys &amp; Plushies</span>
              </button>
            </div>

            <button
              type="button"
              class="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              @click="isMotherCategoryOpen = false"
            >
              ✕ Close
            </button>
          </div>

          <!-- Optional TCG Franchises Sub-bar inside Layer 2 -->
          <div
            v-if="isSecondLayerTcgOpen"
            class="pt-2 border-t border-slate-800/80 flex items-center flex-wrap gap-1.5"
          >
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 px-2">
              TCG Franchises:
            </span>
            <button
              v-for="series in TCG_SERIES_DATA"
              :key="series.id"
              type="button"
              class="px-2.5 py-1 rounded-lg bg-slate-950/90 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-800 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              @click="navigateToTcgSeries(series.id)"
            >
              <span>{{ series.icon }}</span>
              <span>{{ series.name }}</span>
            </button>
          </div>
        </div>
      </transition>


      <!-- Backdrop for closing search popover on outside click -->
      <div
        v-if="isSearchFocused"
        class="fixed inset-0 z-30"
        @click="isSearchFocused = false"
      ></div>

      <!-- Mobile Dropdown Navigation -->
      <div
        v-if="isMobileMenuOpen"
        data-drawer-open="true"
        class="xl:hidden py-4 border-t border-slate-800/80 space-y-2.5 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain pb-28 [webkit-overflow-scrolling:touch]"
      >
        <!-- Functional Mobile Search Input Bar with Category Selector -->
        <div class="px-2 pb-2 space-y-1.5">
          <div class="relative">
            <select
              v-model="searchCategory"
              aria-label="Filter mobile search by category"
              class="w-full appearance-none bg-slate-900 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 border border-slate-700/80 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">📁 All Categories</option>
              <option value="tcg">🃏 Pokémon TCG</option>
              <option value="onepiece">🏴‍☠️ One Piece TCG</option>
              <option value="gunpla">🤖 Bandai Gunpla</option>
              <option value="anime-figures">🥋 Anime Figures</option>
              <option value="anime-merchandise">🛡️ Anime Merch</option>
              <option value="toys-plushies">🧸 Toys &amp; Plushies</option>
              <option value="vip">👑 VIP Exclusives</option>
            </select>
            <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
          <div class="relative flex items-center">
            <span
              class="absolute left-3.5 flex items-center pointer-events-none text-slate-400"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              id="mobile-search"
              v-model="localSearchText"
              type="text"
              aria-label="Search TCG cards, Gunpla, figures, supplies"
              placeholder="Search TCG cards, Gunpla, figures, sleeves..."
              class="w-full bg-slate-900/90 text-white placeholder-slate-400 text-xs sm:text-sm rounded-xl pl-10 pr-9 py-2.5 border border-slate-700/80 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              @keyup.enter="handleSearchSubmit"
            />
            <button
              v-if="localSearchText"
              type="button"
              class="absolute right-3 p-1 text-slate-400 hover:text-white text-xs cursor-pointer"
              title="Clear search"
              @click="localSearchText = ''"
            >
              ✕
            </button>
          </div>
        </div>

        <router-link
          to="/"
          class="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors"
          @click="isMobileMenuOpen = false"
        >
          Home
        </router-link>

        <router-link
          to="/catalog"
          class="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors"
          @click="isMobileMenuOpen = false"
        >
          All Products
        </router-link>

        <!-- Collector Ecosystem Quick Links in Mobile Drawer -->
        <div class="mx-2 grid grid-cols-1 gap-2 py-1">
          <router-link
            to="/raffles"
            class="px-4 py-2.5 rounded-xl text-sm font-black bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center justify-between transition-all"
            @click="isMobileMenuOpen = false"
          >
            <span class="flex items-center gap-2">
              <span>🎯</span>
              <span>100-Slot Grail Raffles</span>
            </span>
            <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
              3D Grid
            </span>
          </router-link>

          <router-link
            to="/gacha"
            class="px-4 py-2.5 rounded-xl text-sm font-black bg-rose-500/15 text-rose-300 border border-rose-500/40 flex items-center justify-between transition-all"
            @click="isMobileMenuOpen = false"
          >
            <span class="flex items-center gap-2">
              <span>🎰</span>
              <span>Oripa Gacha &amp; Box Breaks</span>
            </span>
            <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white">
              Vault
            </span>
          </router-link>

          <router-link
            to="/wallet"
            class="px-4 py-2.5 rounded-xl text-sm font-black bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 flex items-center justify-between transition-all"
            @click="isMobileMenuOpen = false"
          >
            <span class="flex items-center gap-2">
              <span>💳</span>
              <span>Collector Digital Wallet</span>
            </span>
            <span class="flex items-center gap-2">
              <span class="text-xs font-mono font-black text-amber-300">
                ₱{{
                  Number(walletStore.availableBalance || 0).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }}
              </span>
              <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                QR Ph
              </span>
            </span>
          </router-link>
        </div>

        <!-- VIP Exclusive Link in Mobile Drawer -->
        <router-link
          to="/vip"
          class="mx-2 px-4 py-2.5 rounded-xl text-sm font-black bg-gradient-to-r from-amber-400/20 via-yellow-500/15 to-pink-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-between transition-all"
          @click="isMobileMenuOpen = false"
        >
          <span class="flex items-center gap-2">
            <span>👑</span>
            <span>VIP Exclusive Drops</span>
          </span>
          <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
            VIP
          </span>
        </router-link>

        <!-- Collapsible Categories in Mobile Drawer -->
        <div
          class="bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80 space-y-2 mx-2 shadow-inner"
        >
          <button
            type="button"
            class="w-full text-[11px] font-extrabold uppercase text-amber-400 tracking-wider flex items-center justify-between cursor-pointer py-1"
            :aria-expanded="isMobileTcgExpanded"
            @click="isMobileTcgExpanded = !isMobileTcgExpanded"
          >
            <span class="flex items-center gap-2 text-xs font-bold text-slate-100 normal-case">
              <span>🗂️</span>
              <span>Categories &amp; TCG Franchises</span>
            </span>
            <span class="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold">
              <span>{{ isMobileTcgExpanded ? "Hide" : "Expand" }}</span>
              <svg
                class="w-4 h-4 transition-transform duration-200"
                :class="isMobileTcgExpanded ? 'rotate-180' : ''"
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

          <div v-if="isMobileTcgExpanded" class="space-y-2 pt-1.5 border-t border-slate-800/70">
            <button
              type="button"
              class="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-400/20 flex items-center justify-between border border-amber-500/30 bg-amber-500/10 transition-colors cursor-pointer"
              @click="navigateToCategory('tcg')"
            >
              <span class="flex items-center gap-2">
                <span class="text-sm">🃏</span>
                <span>All TCG Games</span>
              </span>
              <span class="text-amber-400 font-bold">&rarr;</span>
            </button>

            <div class="grid grid-cols-1 gap-1 pt-1 border-t border-slate-800/60">
              <button
                v-for="series in TCG_SERIES_DATA"
                :key="series.id"
                type="button"
                class="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                @click="navigateToTcgSeries(series.id)"
              >
                <span class="flex items-center gap-2">
                  <span>{{ series.icon }}</span>
                  <span>{{ series.name }}</span>
                </span>
                <span class="text-[10px] text-slate-400 font-mono">View &rarr;</span>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors cursor-pointer"
          @click="navigateToCategory('gunpla')"
        >
          🤖 Gunpla &amp; Model Kits
        </button>
        <button
          type="button"
          class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors cursor-pointer"
          @click="navigateToCategory('anime-figures')"
        >
          🥋 Anime Figures
        </button>
        <button
          type="button"
          class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors cursor-pointer"
          @click="navigateToCategory('anime-merchandise')"
        >
          🛡️ Anime Merchandise
        </button>
        <button
          type="button"
          class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors cursor-pointer"
          @click="navigateToCategory('toys-plushies')"
        >
          🧸 Toys &amp; Plushies
        </button>

        <router-link
          to="/auctions"
          class="block px-4 py-2.5 rounded-xl text-sm font-bold text-amber-400 hover:bg-slate-800/80 flex items-center justify-between transition-colors"
          @click="isMobileMenuOpen = false"
        >
          <span class="flex items-center gap-2">
            <span>⚡</span>
            <span>Collector Auctions</span>
          </span>
          <span
            class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          >
            Live
          </span>
        </router-link>

        <router-link
          to="/orders"
          class="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-800/80 flex items-center gap-2 transition-colors"
          @click="isMobileMenuOpen = false"
        >
          <span>📦</span>
          <span>Track My Order</span>
        </router-link>

        <router-link
          to="/wishlist"
          class="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-colors"
          @click="isMobileMenuOpen = false"
        >
          Collector Wishlist ({{ wishlistStore.count }})
        </router-link>

        <button
          type="button"
          class="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center gap-2 transition-colors"
          @click="
            () => {
              isMobileMenuOpen = false;
              emit('open-advisor');
            }
          "
        >
          <span>🎯</span>
          <span>Hobby Matcher</span>
        </button>

        <!-- Mobile Sign In / Collector Account Options -->
        <div class="pt-3 border-t border-slate-800 space-y-2">
          <div v-if="authStore.isAuthenticated" class="space-y-2">
            <!-- User card -->
            <div
              class="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3"
            >
              <div
                class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-400 p-0.5 flex-shrink-0"
              >
                <div
                  class="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center text-xs font-black text-amber-300 overflow-hidden"
                >
                  <img
                    v-if="authStore.currentUser.avatar"
                    :src="authStore.currentUser.avatar"
                    alt="Avatar"
                    class="w-full h-full object-cover"
                  />
                  <span v-else>{{
                    authStore.currentUser.name
                      ? authStore.currentUser.name.charAt(0).toUpperCase()
                      : "C"
                  }}</span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <p class="text-xs font-bold text-white truncate">
                    {{ authStore.currentUser.name || "Collector" }}
                  </p>
                  <span
                    v-if="authStore.isVip"
                    class="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-black text-[9px] uppercase shrink-0"
                  >
                    👑 VIP
                  </span>
                </div>
                <p class="text-[10px] text-slate-400 truncate">
                  {{ authStore.currentUser.email || "collector@rlgshop.local" }}
                </p>
              </div>
            </div>

            <!-- Profile Button -->
            <button
              type="button"
              class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer"
              @click="
                isMobileMenuOpen = false;
                emit('open-profile');
              "
            >
              <span class="flex items-center gap-2">
                <span>👤</span>
                <span>Profile</span>
              </span>
              <span class="text-slate-500">&rarr;</span>
            </button>

            <!-- Setting Button -->
            <button
              type="button"
              class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer"
              @click="
                isMobileMenuOpen = false;
                emit('open-settings');
              "
            >
              <span class="flex items-center gap-2">
                <span>⚙️</span>
                <span>Setting</span>
              </span>
              <span class="text-slate-500">&rarr;</span>
            </button>

            <!-- Logout Button -->
            <button
              type="button"
              class="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/30 border border-rose-500/20 cursor-pointer"
              @click="handleSignOut"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>

          <button
            v-else
            type="button"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-xs shadow-xs cursor-pointer active:scale-[0.98] transition-all border border-slate-700"
            @click="
              () => {
                isMobileMenuOpen = false;
                emit('open-auth');
              }
            "
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path
                d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
              />
            </svg>
            <span>Sign In / Create Account</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Global Quick Search Modal (Command Palette Style) -->
    <teleport to="body">
      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isSearchModalOpen"
          class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md"
          @click.self="closeSearch"
        >
          <div
            class="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-display animate-scale-up"
          >
            <!-- Search Input Header -->
            <div class="relative flex items-center p-4 border-b border-slate-800">
              <svg
                class="w-5 h-5 text-amber-400 absolute left-6 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                v-model="localSearchText"
                type="text"
                autofocus
                placeholder="Search Pokémon cards, Gunpla, figures, sets..."
                class="w-full bg-slate-950/80 text-white placeholder-slate-500 rounded-2xl pl-12 pr-12 py-3.5 text-sm font-medium border border-slate-700/80 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
                @keyup.enter="handleSearchSubmit"
                @keyup.esc="closeSearch"
              />
              <button
                type="button"
                class="absolute right-6 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                @click="closeSearch"
              >
                ✕
              </button>
            </div>

            <!-- Quick Suggestions / Hot Chips -->
            <div class="p-4 space-y-3">
              <div v-if="!localSearchText.trim()" class="space-y-2">
                <p
                  class="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider"
                >
                  Popular Searches
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="term in [
                      'Pokémon 151',
                      'One Piece OP-09',
                      'Gunpla RG',
                      'Hololive OCG',
                      'Gundam',
                      'Yu-Gi-Oh!',
                    ]"
                    :key="term"
                    type="button"
                    class="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-amber-400 hover:text-slate-950 text-xs font-bold text-slate-300 transition-colors cursor-pointer border border-slate-700/60"
                    @click="
                      localSearchText = term;
                      handleSearchSubmit();
                    "
                  >
                    🔍 {{ term }}
                  </button>
                </div>
              </div>

              <!-- Live Autocomplete Preview Results -->
              <div
                v-else-if="searchPreviewResults.length > 0"
                class="space-y-1.5"
              >
                <p
                  class="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider"
                >
                  Matching Collectibles:
                </p>
                <button
                  v-for="item in searchPreviewResults"
                  :key="item.id"
                  type="button"
                  class="w-full text-left flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer group"
                  @click="handleSelectPreview(item.id)"
                >
                  <img
                    :src="item.imageUrl"
                    :alt="item.name"
                    class="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800 group-hover:scale-105 transition-transform"
                  />
                  <div class="flex-1 min-w-0">
                    <p
                      class="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate"
                    >
                      {{ item.name }}
                    </p>
                    <p
                      class="text-[11px] text-amber-400 font-extrabold font-mono mt-0.5"
                    >
                      {{ formatCurrency(item.price) }}
                    </p>
                  </div>
                  <span
                    class="text-xs text-indigo-400 group-hover:translate-x-1 transition-transform"
                  >
                    View &rarr;
                  </span>
                </button>
              </div>

              <div v-else class="py-6 text-center text-xs text-slate-400">
                No products matching "{{ localSearchText }}"
              </div>
            </div>

            <!-- Footer Hint -->
            <div
              class="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400"
            >
              <span
                >Press
                <kbd
                  class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]"
                  >Enter</kbd
                >
                to view all results</span
              >
              <span
                >Press
                <kbd
                  class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]"
                  >ESC</kbd
                >
                to close</span
              >
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Global Become a Pro Modal (₱999) -->
    <BecomeProModal />
  </header>
</template>
