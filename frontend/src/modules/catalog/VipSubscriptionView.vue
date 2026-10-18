<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useCatalogStore } from "./catalog.store";
import { useAuthStore } from "@/modules/auth/auth.store";
import { mapApiProductToToy } from "@/shared/utils/productMapper";
import type { ToyProduct } from "@/shared/types/toy.types";
import ToyCard from "./components/ToyCard.vue";
import ToyDetailModal from "./components/ToyDetailModal.vue";
import BecomeProModal from "@/shared/components/BecomeProModal.vue";

const catalogStore = useCatalogStore();
const authStore = useAuthStore();

const vipApiProducts = ref<ToyProduct[]>([]);
const isLoadingVip = ref(false);
const searchQuery = ref("");
const selectedToy = ref<ToyProduct | null>(null);
const isDetailOpen = ref(false);
const isProModalVisible = ref(false);

const fetchVipProducts = async () => {
  isLoadingVip.value = true;
  try {
    const res = await fetch("/api/products?is_promotion=1&per_page=100");
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        vipApiProducts.value = json.data.map((item: any) => ({
          ...mapApiProductToToy(item),
          isPromotion: true,
        }));
      }
    }
  } catch (e) {
    console.warn("Could not fetch dedicated VIP products", e);
  } finally {
    isLoadingVip.value = false;
  }
};

const displayedVipProducts = computed(() => {
  let list: ToyProduct[] = [];
  if (vipApiProducts.value.length > 0) {
    list = vipApiProducts.value;
  } else {
    const fromStore = catalogStore.toys.filter((t) => t.isPromotion);
    list =
      fromStore.length > 0
        ? fromStore
        : catalogStore.toys.slice(0, 12).map((t) => ({
            ...t,
            isPromotion: true,
            discountPercent: t.discountPercent || 20,
            originalPrice: t.originalPrice || Number((t.price * 1.25).toFixed(2)),
          }));
  }

  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      (t.brand && t.brand.toLowerCase().includes(q)),
  );
});

const openDetailModal = (toy: ToyProduct) => {
  selectedToy.value = toy;
  isDetailOpen.value = true;
};

const openBecomePro = () => {
  isProModalVisible.value = true;
  authStore.openProModal();
};

onMounted(() => {
  fetchVipProducts();
  if (catalogStore.toys.length === 0) {
    catalogStore.fetchProducts();
  }
});
</script>

<template>
  <div class="min-h-screen py-8 font-display">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <!-- Clickable VIP Trigger Banner ("Become a Pro" Modal Trigger) -->
      <div
        role="button"
        tabindex="0"
        class="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-pink-950/90 to-amber-950 border-2 border-amber-400/70 p-6 sm:p-8 shadow-2xl cursor-pointer group transition-all hover:shadow-[0_20px_50px_-12px_rgba(251,191,36,0.4)]"
        @click="openBecomePro"
      >
        <div
          class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-400/20 blur-3xl pointer-events-none"
        ></div>
        <div
          class="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-pink-500/20 blur-3xl pointer-events-none"
        ></div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-3 max-w-2xl">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-sm"
              >
                <span>👑</span>
                <span>VIP Exclusive Vault</span>
              </span>
              <span
                v-if="authStore.isVip"
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold"
              >
                ✓ Gold VIP Member Active
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-200 text-xs font-bold vip-banner-badge"
              >
                🌸 Click Banner to Unlock Pro Perks
              </span>
            </div>

            <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight vip-banner-title">
              VIP &amp; Pro Collector Drops
            </h1>
            <p class="text-xs sm:text-sm text-pink-100/90 leading-relaxed font-medium vip-banner-desc">
              Every product on this page is a curated VIP-exclusive release (`is_promotion`) featuring special member markdowns, free AI Card Grader access, and 4 bonus holographic Pokémon cards with your ₱999 Pro Subscription.
            </p>
          </div>

          <div class="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center gap-3">
            <button
              type="button"
              class="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-pink-400 group-hover:from-amber-300 group-hover:to-pink-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
              @click.stop="openBecomePro"
            >
              <span>👑</span>
              <span>{{ authStore.isVip ? "View My Pro Perks (₱999)" : "Become a Pro — ₱999" }}</span>
            </button>
            <span class="text-[11px] text-amber-200/90 text-center font-semibold vip-banner-perk-hint">
              Includes 4 Free Holo Cards + Grader Access
            </span>
          </div>
        </div>
      </div>

      <!-- Filter / Search Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-amber-400/30">
        <div class="flex items-center gap-2">
          <span class="text-lg">👑</span>
          <div>
            <h2 class="text-sm font-black text-white">
              VIP Exclusive Catalog ({{ displayedVipProducts.length }} Items)
            </h2>
            <p class="text-[11px] text-slate-400">
              All items below carry the official Gold VIP badge and special promotion pricing.
            </p>
          </div>
        </div>

        <div class="w-full sm:w-72">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search VIP exclusive drops..."
            class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <!-- VIP Product Cards Grid -->
      <div v-if="isLoadingVip && displayedVipProducts.length === 0" class="py-16 text-center text-slate-400 text-sm font-bold">
        Loading VIP Exclusive Vault...
      </div>

      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5"
      >
        <ToyCard
          v-for="toy in displayedVipProducts"
          :key="toy.id"
          :toy="toy"
          :show-vip-badge="true"
          @quick-view="openDetailModal"
        />
      </div>
    </div>

    <!-- Product Detail Modal (with Magnifying Glass Hover Zoom) -->
    <ToyDetailModal
      :toy="selectedToy"
      :is-open="isDetailOpen"
      @close="isDetailOpen = false"
    />

    <!-- Become a Pro Modal (999 PHP) -->
    <BecomeProModal v-model="isProModalVisible" />
  </div>
</template>

