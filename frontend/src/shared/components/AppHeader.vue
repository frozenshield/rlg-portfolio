<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useCartStore } from "@/modules/cart/cart.store";
import { useWishlistStore } from "@/modules/wishlist/wishlist.store";
import { useCatalogStore } from "@/modules/catalog/catalog.store";
import { useAuthStore } from "@/modules/auth/auth.store";
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

const isUserMenuOpen = ref(false);

onMounted(() => {
  if (authStore.isAuthenticated) {
    authStore.fetchCurrentUser();
  }
});

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
const isTcgDropdownOpen = ref(false);
const isMobileTcgExpanded = ref(false);

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

// Auto-close menu and restore scrolling when navigating
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
  isTcgDropdownOpen.value = false;
  router.push({
    path: "/catalog",
    query: cat === "all" ? {} : { category: cat },
  });
};

const navigateToTcgSeries = (seriesId: TcgSubCategory) => {
  catalogStore.setCategory("tcg");
  catalogStore.setTcgSeries(seriesId);
  isMobileMenuOpen.value = false;
  isTcgDropdownOpen.value = false;
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
    <div class="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20 gap-3 xl:gap-6 relative">
        <!-- Left: Logo & Shop Brand (Flex-shrink-0 to guarantee no squishing) -->
        <div class="flex items-center flex-shrink-0 z-10">
          <router-link
            to="/"
            class="flex items-center gap-3 group select-none"
          >
            <img
              src="/logo.png"
              alt="RLG Online Shop Logo"
              class="h-10 xl:h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-200 drop-shadow-md"
            />
            <div class="hidden sm:block">
              <div class="flex items-center gap-2">
                <span
                  class="text-base xl:text-xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors whitespace-nowrap"
                >
                  RLG <span class="text-amber-400">ONLINE SHOP</span>
                </span>
              </div>
              <p class="text-[10px] xl:text-[11px] text-slate-400 font-medium tracking-wide whitespace-nowrap">
                TCG • Gunpla • Figures • Supplies
              </p>
            </div>
          </router-link>
        </div>

        <!-- Center: Desktop Navigation Links (Dynamically centered with balanced margins, hidden below xl to prevent overlap) -->
        <nav
          class="hidden xl:flex items-center justify-center gap-1 xl:gap-1.5 2xl:gap-2 text-xs xl:text-sm font-bold text-slate-300 flex-1 min-w-0 px-2"
        >
          <router-link
            to="/catalog"
            class="px-2.5 py-1.5 rounded-xl hover:text-amber-400 hover:bg-slate-800/40 transition-colors whitespace-nowrap"
            active-class="text-amber-400 bg-slate-800/80 border border-amber-400/30"
            @click="catalogStore.setCategory('all')"
          >
            <span>All<span class="hidden 2xl:inline"> Products</span></span>
          </router-link>

          <!-- TCG Dropdown Menu -->
          <div
            class="relative"
            @mouseenter="isTcgDropdownOpen = true"
            @mouseleave="isTcgDropdownOpen = false"
          >
            <button
              type="button"
              class="px-2.5 py-1.5 rounded-xl hover:text-amber-400 hover:bg-slate-800/40 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              :class="
                catalogStore.selectedCategory === 'tcg'
                  ? 'text-amber-400 bg-slate-800/80 border border-amber-400/30'
                  : ''
              "
              @click="navigateToCategory('tcg')"
            >
              <span>🃏 TCG<span class="hidden 2xl:inline"> Cards</span></span>
              <svg
                class="w-3.5 h-3.5 transition-transform"
                :class="isTcgDropdownOpen ? 'rotate-180' : ''"
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

            <!-- TCG Dropdown Popover -->
            <transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div
                v-if="isTcgDropdownOpen"
                class="absolute top-full left-0 w-64 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-2 space-y-1 z-50 font-display text-slate-200"
              >
                <div
                  class="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800"
                >
                  Select TCG Franchise:
                </div>
                <button
                  type="button"
                  class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center justify-between text-xs font-bold text-white transition-colors cursor-pointer"
                  @click="navigateToCategory('tcg')"
                >
                  <span class="flex items-center gap-2">
                    <span>🃏</span>
                    <span>All TCG Games</span>
                  </span>
                  <span class="text-[10px] text-amber-400 font-bold"
                    >&rarr;</span
                  >
                </button>
                <button
                  v-for="series in TCG_SERIES_DATA"
                  :key="series.id"
                  type="button"
                  class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
                  @click="navigateToTcgSeries(series.id)"
                >
                  <span class="flex items-center gap-2">
                    <span>{{ series.icon }}</span>
                    <span>{{ series.name }}</span>
                  </span>
                  <span class="text-[10px] text-indigo-400">Browse</span>
                </button>
              </div>
            </transition>
          </div>

          <!-- Gunpla Button -->
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-xl hover:text-amber-400 hover:bg-slate-800/40 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
            :class="
              catalogStore.selectedCategory === 'gunpla'
                ? 'text-amber-400 bg-slate-800/80 border border-amber-400/30'
                : ''
            "
            @click="navigateToCategory('gunpla')"
          >
            <span>🤖 Gunpla</span>
          </button>

          <!-- Anime Figures Button -->
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-xl hover:text-amber-400 hover:bg-slate-800/40 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
            :class="
              catalogStore.selectedCategory === 'anime-figures'
                ? 'text-amber-400 bg-slate-800/80 border border-amber-400/30'
                : ''
            "
            @click="navigateToCategory('anime-figures')"
          >
            <span>🥋 <span class="hidden 2xl:inline">Anime </span>Figures</span>
          </button>

          <!-- Anime Merchandise Button -->
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-xl hover:text-amber-400 hover:bg-slate-800/40 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
            :class="
              catalogStore.selectedCategory === 'anime-merchandise'
                ? 'text-amber-400 bg-slate-800/80 border border-amber-400/30'
                : ''
            "
            @click="navigateToCategory('anime-merchandise')"
          >
            <span>🛡️ <span class="hidden 2xl:inline">Anime </span>Merch<span class="hidden 2xl:inline">andise</span></span>
          </button>

          <!-- Toys & Plushies Button -->
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-xl hover:text-amber-400 hover:bg-slate-800/40 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
            :class="
              catalogStore.selectedCategory === 'toys-plushies'
                ? 'text-amber-400 bg-slate-800/80 border border-amber-400/30'
                : ''
            "
            @click="navigateToCategory('toys-plushies')"
          >
            <span>🧸 <span class="hidden 2xl:inline">Toys &amp; </span>Plushies</span>
          </button>

          <!-- Live Auctions Button -->
          <router-link
            to="/auctions"
            class="px-2.5 py-1.5 rounded-xl hover:text-amber-400 hover:bg-slate-800/40 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
            active-class="text-amber-400 bg-slate-800/80 border border-amber-400/30"
          >
            <span>⚡ Auctions</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </router-link>

          <!-- VIP Exclusive Page Link -->
          <router-link
            to="/vip"
            class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400/20 via-yellow-500/15 to-pink-500/20 hover:from-amber-400/30 hover:to-pink-500/30 text-amber-300 border border-amber-400/40 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
            active-class="from-amber-400/40 to-pink-500/40 text-amber-200 border-amber-400 ring-1 ring-amber-400/50"
          >
            <span>👑</span>
            <span class="font-black tracking-wide">VIP</span>
          </router-link>
        </nav>

        <!-- Right: Actions (Collector Profile, Wishlist & Cart) -->
        <div class="flex items-center gap-2 sm:gap-2.5 xl:gap-3 flex-shrink-0 justify-end z-10">

          <!-- Collector Account Avatar / Dropdown OR Sign-In Button -->
          <div class="relative hidden sm:flex items-center">
            <!-- If Logged In: Show Collector Avatar & Dropdown -->
            <div v-if="authStore.isAuthenticated" class="relative">
              <button
                type="button"
                class="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer shadow-sm active:scale-95 group"
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
                    <!-- Gold VIP Badge Next to Profile Name -->
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

                <!-- Compact Gold VIP Badge on medium screens where text is hidden -->
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

            <!-- If Not Logged In: Sign In Button (matches image) -->
            <button
              v-else
              type="button"
              class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
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
            class="relative p-2.5 rounded-2xl hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
            title="Saved Wishlist"
            aria-label="Collector Wishlist"
          >
            <svg
              class="w-6 h-6"
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
              class="absolute -top-1 -right-1 bg-indigo-600 text-white font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-scale-up"
            >
              {{ wishlistStore.count }}
            </span>
          </router-link>

          <!-- Cart Trigger Button (10% High-Contrast Accent on Counter Badge) -->
          <button
            type="button"
            class="relative flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 sm:px-4 py-2.5 rounded-2xl border border-slate-700 shadow-md transition-all active:scale-95 cursor-pointer font-bold"
            aria-label="View Shopping Cart"
            @click="cartStore.openDrawer"
          >
            <div class="relative">
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span
                v-if="cartStore.totalItemCount > 0"
                class="absolute -top-2.5 -right-2.5 bg-amber-400 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-amber-400/30 border-2 border-slate-900"
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

      <!-- Long Search Field with Customizable Category Dropdown (Aligned in the middle) -->
      <div class="mt-2.5 pb-2.5 hidden sm:block relative max-w-2xl mx-auto w-full">
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
        class="lg:hidden py-4 border-t border-slate-800/80 space-y-2.5 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain pb-28 [webkit-overflow-scrolling:touch]"
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

        <!-- Collapsible TCG Subcategories in Mobile Drawer (Hidden by default until dropdown arrow is clicked) -->
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
              <span>🃏</span>
              <span>Trading Card Games (TCG)</span>
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
            <!-- All TCG Games Dedicated Route Button -->
            <button
              type="button"
              class="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-400/20 flex items-center justify-between border border-amber-500/30 bg-amber-500/10 transition-colors cursor-pointer"
              @click="navigateToCategory('tcg')"
            >
              <span class="flex items-center gap-2">
                <span class="text-sm">🗂️</span>
                <span>All TCG Games (All Products)</span>
              </span>
              <span class="text-amber-400 font-bold">&rarr;</span>
            </button>

            <!-- TCG Series List -->
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
