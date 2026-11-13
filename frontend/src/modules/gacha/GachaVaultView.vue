<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useWalletStore } from '@/modules/wallet/wallet.store';
import { resolveApiUrl, resolveStorageUrl } from '@/shared/utils/api';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const walletStore = useWalletStore();

const activeMainTab = ref<'gacha' | 'vault' | 'breaks' | 'preorders'>('gacha');

const banners = ref<any[]>([]);
const selectedBannerId = ref<number | null>(null);
const boxBreaks = ref<any[]>([]);
const preorderDrops = ref<any[]>([]);
const digitalVault = ref<any[]>([]);
const walletBalance = computed<number>(() => {
  return authStore.isAuthenticated ? Number(walletStore.walletBalance || 0) : 0;
});
const heldBalance = ref<number>(0);

const isLoading = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Interactive Gacha Mystery Pack Click / Swipe Reveal Sequence State
const isRevealModalOpen = ref(false);
const revealStage = ref<'sealed' | 'charging' | 'ripping' | 'revealed'>('sealed');
const swipeProgress = ref<number>(0);
const isDraggingRip = ref(false);
const dragStartX = ref(0);
const pulledCards = ref<any[]>([]);
const activeRevealCardIndex = ref(0);

// Physical Shipment Request Modal State
const shippingVaultItem = ref<any | null>(null);
const isBulkShippingModalOpen = ref(false);
const selectedVaultItemIds = ref<number[]>([]);
const vaultSubTab = ref<'inventory' | 'tracking'>('inventory');
const vaultShipments = ref<any[]>([]);
const shippingCarriers = ref<any[]>([]);
const selectedCarrierId = ref<number | null>(null);
const standardShippingFee = ref<number>(100.00);

const shipRecipient = ref('');
const shipPhone = ref('');
const shipAddress = ref('');

const selectedBanner = computed(() => {
  return banners.value.find((b) => b.id === selectedBannerId.value) || banners.value[0] || null;
});

const currentRevealedCard = computed(() => {
  return pulledCards.value[activeRevealCardIndex.value] || null;
});

const eligibleVaultItems = computed(() => {
  return digitalVault.value.filter((i) => i.status === 'in_vault');
});

const selectedItemsToShip = computed(() => {
  if (shippingVaultItem.value) {
    return [shippingVaultItem.value];
  }
  return digitalVault.value.filter((i) => selectedVaultItemIds.value.includes(i.id));
});

const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`;
  }
  if (authStore.isAuthenticated && authStore.currentUser) {
    if (authStore.currentUser.id && authStore.currentUser.email !== 'collector@rlgshop.local') {
      headers['X-User-Id'] = String(authStore.currentUser.id);
    }
    if (authStore.currentUser.email && authStore.currentUser.email !== 'collector@rlgshop.local') {
      headers['X-User-Email'] = String(authStore.currentUser.email);
    }
  }
  return headers;
};

const formatCurrency = (val: number) => {
  return Number(val || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getRarityTheme = (rarity: string) => {
  switch (rarity) {
    case 'SECRET_GRAIL':
      return {
        badge: 'bg-gradient-to-r from-amber-300 via-rose-400 to-purple-500 text-slate-950 font-black',
        border: 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.45)]',
        glow: 'from-amber-400/30 via-fuchsia-500/20 to-indigo-600/30',
        label: '👑 SECRET GRAIL (PSA 10)',
      };
    case 'SSR':
      return {
        badge: 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black',
        border: 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)]',
        glow: 'from-amber-500/25 to-rose-500/20',
        label: '🔥 SSR ULTRA HIT',
      };
    case 'SR':
      return {
        badge: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/40',
        border: 'border-fuchsia-500/50',
        glow: 'from-fuchsia-500/20 to-indigo-500/15',
        label: '✨ SR SUPER RARE',
      };
    case 'R':
      return {
        badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40',
        border: 'border-cyan-500/40',
        glow: 'from-cyan-500/15 to-slate-900',
        label: '💎 R HOLO RARE',
      };
    default:
      return {
        badge: 'bg-slate-800 text-slate-300 border border-slate-700',
        border: 'border-slate-700',
        glow: 'from-slate-800/40 to-slate-950',
        label: '🃏 STANDARD PACK HIT',
      };
  }
};

const fetchGachaEcosystem = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const res = await fetch(resolveApiUrl('/gacha'), {
      headers: getHeaders(),
    });
    const json = await res.json();
    if (json.success && json.data) {
      banners.value = json.data.banners || [];
      if (!selectedBannerId.value && banners.value.length > 0) {
        selectedBannerId.value = banners.value[0].id;
      }
      boxBreaks.value = json.data.box_breaks || [];
      preorderDrops.value = json.data.preorder_drops || [];
      digitalVault.value = json.data.digital_vault || [];
      if (authStore.isAuthenticated && json.data.wallet_balance !== undefined) {
        const inc = Number(json.data.wallet_balance);
        if (inc > 0 || walletStore.walletBalance === 0) {
          walletStore.walletBalance = inc;
        }
      }
      heldBalance.value = Number(json.data.held_balance || 0);
    }
  } catch (e: any) {
    errorMessage.value = e.message || 'Failed to load Gacha & Collectibles arena.';
  } finally {
    isLoading.value = false;
  }
};

// Trigger Server-Side Weighted Pull + Launch Interactive Pack Rip Sequence
const handleExecutePull = async (pullCount: 1 | 10) => {
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal('Please sign in or create an account to open Gacha mystery packs.');
    return;
  }
  if (!selectedBanner.value || isSubmitting.value) return;

  isSubmitting.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const res = await fetch(resolveApiUrl(`/gacha/banners/${selectedBanner.value.id}/pull`), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ pull_count: pullCount }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const msg =
        json.errors?.wallet?.[0] ||
        json.errors?.banner?.[0] ||
        json.message ||
        'Could not execute Gacha pull.';
      throw new Error(msg);
    }

    pulledCards.value = json.data.pulls || [];
    if (json.data.wallet_balance !== undefined) {
      walletStore.walletBalance = Number(json.data.wallet_balance);
    }
    activeRevealCardIndex.value = 0;
    swipeProgress.value = 0;
    revealStage.value = 'sealed';
    isRevealModalOpen.value = true;

    await fetchGachaEcosystem();
  } catch (e: any) {
    errorMessage.value = e.message || 'Gacha pull failed.';
  } finally {
    isSubmitting.value = false;
  }
};

// Pack Swipe / Click Tear Mechanics
const startPackDrag = (e: MouseEvent | TouchEvent) => {
  if (revealStage.value === 'revealed') return;
  isDraggingRip.value = true;
  revealStage.value = 'charging';
  dragStartX.value = 'touches' in e ? e.touches[0].clientX : e.clientX;
};

const onPackDragMove = (e: MouseEvent | TouchEvent) => {
  if (!isDraggingRip.value || revealStage.value === 'revealed') return;
  const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const delta = Math.max(0, currentX - dragStartX.value);
  swipeProgress.value = Math.min(100, Math.round((delta / 220) * 100));
  if (swipeProgress.value >= 92) {
    completePackRip();
  }
};

const endPackDrag = () => {
  if (!isDraggingRip.value) return;
  isDraggingRip.value = false;
  if (swipeProgress.value < 92 && revealStage.value !== 'revealed') {
    swipeProgress.value = 0;
    revealStage.value = 'sealed';
  }
};

const completePackRip = () => {
  isDraggingRip.value = false;
  swipeProgress.value = 100;
  revealStage.value = 'ripping';
  setTimeout(() => {
    revealStage.value = 'revealed';
  }, 550);
};

// Fetch user digital vault items (both Gacha and Live Slot wins)
const fetchVaultItems = async () => {
  if (!authStore.isAuthenticated) return;
  try {
    const res = await fetch(resolveApiUrl('/vault/items'), {
      headers: getHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        digitalVault.value = json.data;
      }
    }
  } catch {
    // fallback gracefully to ecosystem vault list
  }
};

// Fetch customer vault batch shipments & carrier tracking
const fetchVaultShipments = async () => {
  if (!authStore.isAuthenticated) return;
  try {
    const res = await fetch(resolveApiUrl('/vault/shipments'), {
      headers: getHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        vaultShipments.value = json.data;
      }
    }
  } catch {
    vaultShipments.value = [];
  }
};

// Fetch shipping config (active carriers and standard fee)
const fetchShippingConfig = async () => {
  try {
    const res = await fetch(resolveApiUrl('/vault/shipping-config'), {
      headers: getHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.carriers) {
        shippingCarriers.value = json.carriers;
        if (!selectedCarrierId.value && json.carriers.length > 0) {
          selectedCarrierId.value = json.carriers[0].id;
        }
      }
      if (json.standard_shipping_fee !== undefined) {
        standardShippingFee.value = Number(json.standard_shipping_fee);
      }
    }
  } catch {
    // defaults
  }
};

// Selection helpers for bulk shipping
const toggleSelectVaultItem = (id: number) => {
  const idx = selectedVaultItemIds.value.indexOf(id);
  if (idx > -1) {
    selectedVaultItemIds.value.splice(idx, 1);
  } else {
    selectedVaultItemIds.value.push(id);
  }
};

const toggleSelectAllEligible = () => {
  const eligibleIds = eligibleVaultItems.value.map((i) => i.id);
  if (selectedVaultItemIds.value.length === eligibleIds.length && eligibleIds.length > 0) {
    selectedVaultItemIds.value = [];
  } else {
    selectedVaultItemIds.value = eligibleIds;
  }
};

const openSingleShippingModal = (item: any) => {
  shippingVaultItem.value = item;
  selectedVaultItemIds.value = [item.id];
  isBulkShippingModalOpen.value = true;
};

const openBulkShippingModal = () => {
  if (selectedVaultItemIds.value.length === 0) return;
  shippingVaultItem.value = null;
  isBulkShippingModalOpen.value = true;
};

// Request Physical Shipment (Bulk or Single) with Wallet Balance Deduction
const handleRequestBulkShipment = async () => {
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal('Please sign in to request physical delivery.');
    return;
  }

  const itemIds = selectedItemsToShip.value.map((i) => i.id);
  if (itemIds.length === 0) {
    errorMessage.value = 'Please select at least one vault item to ship.';
    return;
  }

  if (walletBalance.value < standardShippingFee.value) {
    errorMessage.value = `Insufficient wallet balance for shipping fee (Available: ₱${formatCurrency(walletBalance.value)}, Required: ₱${formatCurrency(standardShippingFee.value)}). Please top up your wallet.`;
    return;
  }

  if (!shipRecipient.value || !shipPhone.value || !shipAddress.value) {
    errorMessage.value = 'Please fill out recipient name, phone number, and complete delivery address.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;
  try {
    const res = await fetch(resolveApiUrl('/vault/ship'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        item_ids: itemIds,
        recipient_name: shipRecipient.value,
        phone: shipPhone.value,
        address: shipAddress.value,
        ref_shipping_carrier_id: selectedCarrierId.value || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      const msg =
        json.errors?.wallet?.[0] ||
        json.errors?.item_ids?.[0] ||
        json.message ||
        'Fulfillment dispatch failed.';
      throw new Error(msg);
    }

    successMessage.value = json.message || `Physical shipment of ${itemIds.length} item(s) dispatched successfully!`;
    isBulkShippingModalOpen.value = false;
    shippingVaultItem.value = null;
    selectedVaultItemIds.value = [];

    if (json.wallet_balance !== undefined) {
      walletStore.walletBalance = Number(json.wallet_balance);
    } else {
      walletStore.fetchWalletSummary();
    }

    await fetchVaultItems();
    await fetchVaultShipments();
    vaultSubTab.value = 'tracking';
  } catch (e: any) {
    errorMessage.value = e.message;
  } finally {
    isSubmitting.value = false;
  }
};

// Buy Live Box Break Tier Slot
const handleBuyBreakSlot = async (slot: any) => {
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal('Please sign in or create an account to claim box break spots.');
    return;
  }
  isSubmitting.value = true;
  errorMessage.value = null;
  try {
    const res = await fetch(resolveApiUrl(`/gacha/box-breaks/slots/${slot.id}/buy`), {
      method: 'POST',
      headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const msg = json.errors?.wallet?.[0] || json.errors?.slot?.[0] || json.message || 'Failed to buy slot.';
      throw new Error(msg);
    }
    successMessage.value = json.message;
    await fetchGachaEcosystem();
  } catch (e: any) {
    errorMessage.value = e.message;
  } finally {
    isSubmitting.value = false;
  }
};

// Reserve Pre-Order Drop
const handleReservePreorder = async (drop: any, paymentTier: 'deposit' | 'full_payment') => {
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal('Please sign in or create an account to reserve upcoming product drops.');
    return;
  }
  isSubmitting.value = true;
  errorMessage.value = null;
  try {
    const res = await fetch(resolveApiUrl(`/gacha/preorders/${drop.id}/reserve`), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        quantity: 1,
        payment_tier: paymentTier,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const msg = json.errors?.wallet?.[0] || json.errors?.preorder?.[0] || json.message || 'Failed to reserve pre-order.';
      throw new Error(msg);
    }
    successMessage.value = json.message;
    await fetchGachaEcosystem();
  } catch (e: any) {
    errorMessage.value = e.message;
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  if (route.query.tab === 'vault' || route.query.tab === 'shipments') {
    activeMainTab.value = 'vault';
    if (route.query.tab === 'shipments' || route.query.subtab === 'tracking') {
      vaultSubTab.value = 'tracking';
    }
  }

  await fetchGachaEcosystem();
  if (authStore.isAuthenticated) {
    walletStore.fetchWalletSummary();
    await fetchVaultItems();
    await fetchVaultShipments();
  }
  await fetchGachaEcosystem();
  await fetchShippingConfig();

  if (route.query.bannerId) {
    const targetId = Number(route.query.bannerId);
    if (banners.value.some((b) => b.id === targetId)) {
      selectedBannerId.value = targetId;
    }
  }

  if (authStore.currentUser?.name) {
    shipRecipient.value = authStore.currentUser.name;
  }
});
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-[1400px] w-full mx-auto space-y-8">
      <!-- Top Header & Live Wallet Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
        <div>
          <div class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400">
            <span>✨ Japanese Oripa Mystery Vault • Verified Odds & Vault Delivery</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Gacha Mystery Packs &amp; Collector Vault
          </h1>
        </div>

        <!-- Wallet Balance Pill + Top-Up Shortcut -->
        <div class="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-2.5 pr-4">
          <div class="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-lg">
            💳
          </div>
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Available Wallet</span>
            <span class="font-mono font-black text-amber-400 text-sm">₱{{ formatCurrency(walletBalance) }}</span>
          </div>
          <button
            type="button"
            class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer transition-colors"
            @click="router.push('/raffles')"
          >
            🎯 Live Slot Raffles
          </button>
          <button
            type="button"
            class="ml-2 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer transition-colors"
            @click="if (!authStore.isAuthenticated) { authStore.openAuthModal('Please sign in or create an account to top up your wallet.'); } else { router.push('/wallet'); }"
          >
            + Top Up
          </button>
        </div>
      </div>

      <!-- Feedback Alerts -->
      <div
        v-if="successMessage"
        class="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between"
      >
        <span>✓ {{ successMessage }}</span>
        <button type="button" class="cursor-pointer" @click="successMessage = null">✕</button>
      </div>
      <div
        v-if="errorMessage"
        class="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between"
      >
        <span>⚠️ {{ errorMessage }}</span>
        <button type="button" class="cursor-pointer" @click="errorMessage = null">✕</button>
      </div>

      <!-- Mode Switcher Tabs -->
      <div class="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        <button
          type="button"
          class="py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2"
          :class="activeMainTab === 'gacha' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'"
          @click="activeMainTab = 'gacha'"
        >
          <span>🎴 Weighted Gacha Oripa</span>
        </button>
        <button
          type="button"
          class="py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2"
          :class="activeMainTab === 'vault' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'"
          @click="activeMainTab = 'vault'"
        >
          <span>🏛️ My Digital Vault ({{ digitalVault.filter((i) => i.status === 'in_vault').length }})</span>
        </button>
      </div>

      <!-- =================================================================== -->
      <!-- TAB 1: WEIGHTED GACHA MYSTERY BANNERS                               -->
      <!-- =================================================================== -->
      <div v-if="activeMainTab === 'gacha' && selectedBanner" class="space-y-8">
        <!-- Available Oripa Mystery Drops Grid -->
        <div v-if="banners.length > 1" class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>🎰</span>
              <span>Select Oripa Mystery Drop ({{ banners.length }} Live Banners)</span>
            </span>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div
              v-for="b in banners"
              :key="b.id"
              class="relative rounded-2xl p-4 border transition-all cursor-pointer flex items-center gap-4 group"
              :class="
                selectedBanner.id === b.id
                  ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-400 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              "
              @click="selectedBannerId = b.id"
            >
              <!-- Pack Cover / Icon -->
              <div class="w-14 h-18 rounded-xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                <img
                  v-if="b.image_url"
                  :src="resolveStorageUrl(b.image_url)"
                  :alt="b.name"
                  class="w-full h-full object-contain"
                />
                <span v-else class="text-2xl">🎰</span>
              </div>

              <div class="min-w-0 flex-1 space-y-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-slate-800 text-rose-300">
                    {{ b.series_tag || 'Pokémon TCG' }}
                  </span>
                  <span class="text-[9px] text-slate-500 font-mono">
                    {{ b.total_remaining_cards }} Left
                  </span>
                </div>
                <h4 class="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                  {{ b.name }}
                </h4>
                <div class="flex items-center gap-2 text-xs">
                  <span class="font-black text-amber-400 font-mono">₱{{ formatCurrency(b.cost_per_pull) }}</span>
                  <span class="text-[10px] text-slate-500">/ pull</span>
                </div>
              </div>

              <!-- Selected Indicator -->
              <div v-if="selectedBanner.id === b.id" class="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_#fbbf24]"></div>
            </div>
          </div>
        </div>

        <!-- Active Gacha Machine Stage -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <!-- Left: 3D Mystery Foil Pack Preview (5 cols) -->
          <div class="lg:col-span-5 flex flex-col items-center text-center space-y-4">
            <div class="relative group cursor-pointer" @click="handleExecutePull(1)">
              <div class="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-400/30 via-fuchsia-500/30 to-indigo-500/30 blur-2xl group-hover:opacity-100 opacity-75 transition-opacity"></div>
              <div class="relative w-64 h-80 rounded-3xl bg-slate-950 border-2 border-amber-400/60 shadow-2xl p-4 flex flex-col items-center justify-between overflow-hidden transform group-hover:scale-105 group-hover:-rotate-1 transition-all duration-300">
                <span class="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] font-black text-amber-300 uppercase tracking-widest">
                  {{ selectedBanner.series_tag }}
                </span>
                <img
                  v-if="selectedBanner.image_url"
                  :src="resolveStorageUrl(selectedBanner.image_url)"
                  :alt="selectedBanner.name"
                  class="w-44 h-52 object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]"
                />
                <div
                  v-else
                  class="w-44 h-52 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-fuchsia-950/60 border border-amber-400/30 flex flex-col items-center justify-center p-4 text-center space-y-2 shadow-inner"
                >
                  <span class="text-5xl">🎰</span>
                  <span class="text-xs font-black text-amber-300 uppercase tracking-wider">Mystery Oripa Foil Pack</span>
                </div>
                <span class="text-[11px] font-black text-white uppercase tracking-wider">
                  ⚡ Click to Rip Mystery Pack
                </span>
              </div>
            </div>
            <p class="text-xs text-slate-400">
              Remaining Cards in Pool: <strong class="text-amber-400 font-mono">{{ selectedBanner.total_remaining_cards }}</strong> • Server-Side Weighted RNG
            </p>
          </div>

          <!-- Right: Banner Info & Instant Wallet Pull Controls (7 cols) -->
          <div class="lg:col-span-7 space-y-6">
            <div class="space-y-2">
              <span class="px-3 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-black uppercase">
                Verified Oripa Probability Pool
              </span>
              <h2 class="text-2xl sm:text-4xl font-black text-white leading-tight">
                {{ selectedBanner.name }}
              </h2>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {{ selectedBanner.description }}
              </p>
            </div>

            <!-- Pull Action Buttons -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                :disabled="isSubmitting"
                class="p-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-left shadow-xl shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-between"
                @click="handleExecutePull(1)"
              >
                <div>
                  <span class="text-[10px] uppercase tracking-wider block opacity-80">Single Mystery Pack</span>
                  <span class="text-lg font-black block">Rip 1x Pack</span>
                </div>
                <span class="px-3 py-1.5 rounded-xl bg-slate-950/90 text-amber-300 font-mono text-sm font-black">
                  ₱{{ formatCurrency(selectedBanner.cost_per_pull) }}
                </span>
              </button>

              <button
                type="button"
                :disabled="isSubmitting"
                class="p-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-black text-left shadow-xl shadow-fuchsia-500/20 border border-fuchsia-400/40 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-between"
                @click="handleExecutePull(10)"
              >
                <div>
                  <span class="text-[10px] uppercase tracking-wider text-amber-300 block">Multi-Bundle Discount</span>
                  <span class="text-lg font-black block">Rip {{ selectedBanner.multi_pull_count }}x Packs</span>
                </div>
                <span class="px-3 py-1.5 rounded-xl bg-slate-950/90 text-amber-300 font-mono text-sm font-black">
                  ₱{{ formatCurrency(selectedBanner.multi_pull_cost) }}
                </span>
              </button>
            </div>

            <!-- Real-time Transparency Odds Summary -->
            <div class="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>🎯 Live Weighted Pull Probabilities (Total Weight: {{ selectedBanner.total_weight }})</span>
                <span class="text-emerald-400">Instant Digital Vault Delivery</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <div
                  v-for="item in selectedBanner.items"
                  :key="item.id"
                  class="p-2.5 rounded-xl bg-slate-900 border border-slate-800/90 flex items-center justify-between text-xs"
                >
                  <span class="font-bold text-slate-200 truncate pr-2">{{ item.rarity }}</span>
                  <span class="font-mono font-black text-amber-400">{{ item.probability_pct }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Prize Pool Showcase Grid -->
        <div class="space-y-4">
          <h3 class="text-lg font-black text-white flex items-center gap-2">
            <span>🏆</span>
            <span>Banner Chase Cards &amp; Live Odds Breakdown</span>
          </h3>
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            <div
              v-for="item in selectedBanner.items"
              :key="item.id"
              class="rounded-3xl bg-slate-900/90 border p-5 flex flex-col justify-between space-y-4 transition-all hover:-translate-y-1"
              :class="getRarityTheme(item.rarity).border"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider" :class="getRarityTheme(item.rarity).badge">
                  {{ getRarityTheme(item.rarity).label }}
                </span>
                <span class="font-mono text-xs font-black text-amber-300">
                  {{ item.probability_pct }}% Chance
                </span>
              </div>

              <div class="h-44 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center p-3">
                <img
                  v-if="item.image_url"
                  :src="resolveStorageUrl(item.image_url)"
                  :alt="item.name"
                  class="max-h-full max-w-full object-contain"
                />
                <div v-else class="flex flex-col items-center justify-center text-slate-500 space-y-1.5">
                  <span class="text-3xl">🃏</span>
                  <span class="text-[10px] font-bold uppercase tracking-wider">No Card Image</span>
                </div>
              </div>

              <div class="space-y-2">
                <h4 class="text-sm font-black text-white leading-snug">{{ item.name }}</h4>
                <p class="text-[11px] text-slate-400">{{ item.card_condition }}</p>
                <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span class="text-[10px] text-slate-400 block">Vault Buyback Credit</span>
                    <span class="font-mono font-bold text-emerald-400">₱{{ formatCurrency(item.buyback_credit_value) }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] text-slate-400 block">Pool Stock</span>
                    <span class="font-mono font-bold text-slate-200">{{ item.stock_remaining }} / {{ item.stock_total }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State Skeleton -->
      <div v-else-if="activeMainTab === 'gacha' && isLoading && !selectedBanner" class="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div class="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mx-auto"></div>
        <h3 class="text-base font-black text-white">Loading Mystery Oripa Vault...</h3>
        <p class="text-xs text-slate-400">Retrieving verified probability odds and grand prize slabs.</p>
      </div>

      <div v-else-if="activeMainTab === 'gacha' && !selectedBanner" class="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
        <span class="text-5xl">🎰</span>
        <h3 class="text-base font-black text-white">No Active Mystery Oripa Banners</h3>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">
          Our vault masters are curating the next batch of PSA 10 slabs. Check back shortly or explore live auctions!
        </p>
      </div>

      <!-- =================================================================== -->
      <!-- TAB 2: UNIFIED DIGITAL VAULT (GACHA ORIPA + LIVE SLOT RAFFLE WINS)  -->
      <!-- =================================================================== -->
      <div v-else-if="activeMainTab === 'vault'" class="space-y-6">
        <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div>
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 mb-1">
              <span>🏛️ Unified Collector Vault</span>
              <span>•</span>
              <span>Gacha Mystery Pulls &amp; Live Slot Raffle Wins</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-white">My Digital Vault &amp; Physical Dispatches</h2>
            <p class="text-xs text-slate-400 mt-1 max-w-2xl">
              All graded slabs won from Live Slot Raffles and pulled from Gacha Mystery Oripas are securely held here. Dispatch individual slabs or bulk ship batches straight to your door with real-time courier tracking.
            </p>
          </div>

          <!-- Vault Sub-tabs: Collection vs Tracking -->
          <div class="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2"
              :class="vaultSubTab === 'inventory' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'"
              @click="vaultSubTab = 'inventory'"
            >
              <span>📦 Vault Collection</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px]" :class="vaultSubTab === 'inventory' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'">
                {{ eligibleVaultItems.length }}
              </span>
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2"
              :class="vaultSubTab === 'tracking' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'"
              @click="vaultSubTab = 'tracking'"
            >
              <span>🚚 Delivery Tracking</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px]" :class="vaultSubTab === 'tracking' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'">
                {{ vaultShipments.length }}
              </span>
            </button>
          </div>
        </div>

        <!-- ── SUB-TAB 1: VAULT INVENTORY & BULK SHIPPING ──────────────────── -->
        <div v-if="vaultSubTab === 'inventory'" class="space-y-6">
          <!-- Bulk Action Bar -->
          <div
            v-if="eligibleVaultItems.length > 0"
            class="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4"
          >
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  class="w-4 h-4 rounded text-amber-400 bg-slate-950 border-slate-700 focus:ring-amber-400 focus:ring-offset-slate-900"
                  :checked="selectedVaultItemIds.length === eligibleVaultItems.length && eligibleVaultItems.length > 0"
                  @change="toggleSelectAllEligible"
                />
                <span>Select All Eligible ({{ eligibleVaultItems.length }})</span>
              </label>

              <span v-if="selectedVaultItemIds.length > 0" class="text-xs text-amber-400 font-bold">
                • {{ selectedVaultItemIds.length }} item(s) selected
              </span>
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                :disabled="selectedVaultItemIds.length === 0"
                class="px-5 py-2.5 rounded-xl font-black text-xs cursor-pointer transition-all shadow-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                :class="selectedVaultItemIds.length > 0 ? 'bg-amber-400 hover:bg-amber-300 text-slate-950' : 'bg-slate-800 text-slate-400'"
                @click="openBulkShippingModal"
              >
                <span>📦 Bulk Ship Selected</span>
                <span v-if="selectedVaultItemIds.length > 0" class="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 font-mono text-[10px]">
                  {{ selectedVaultItemIds.length }}
                </span>
              </button>
            </div>
          </div>

          <!-- Empty Vault State -->
          <div v-if="digitalVault.length === 0" class="p-12 bg-slate-900 rounded-3xl border border-slate-800 text-center space-y-3">
            <span class="text-4xl block">🏛️</span>
            <h3 class="text-base font-black text-white">Your Digital Vault is Empty</h3>
            <p class="text-xs text-slate-400">
              Win a Live Slot Raffle or rip a Gacha Mystery Pack to store authenticated graded slabs in your digital vault.
            </p>
            <div class="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                class="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                @click="router.push('/raffles')"
              >
                🎯 Join Live Slot Raffles
              </button>
              <button
                type="button"
                class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer border border-slate-700"
                @click="activeMainTab = 'gacha'"
              >
                🎴 Rip Gacha Oripa Packs
              </button>
            </div>
          </div>

          <!-- Slabs Grid -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div
              v-for="entry in digitalVault"
              :key="entry.id"
              class="rounded-3xl bg-slate-900 border p-5 flex flex-col justify-between space-y-4 transition-all"
              :class="
                selectedVaultItemIds.includes(entry.id)
                  ? 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/50'
                  : 'border-slate-800 hover:border-slate-700'
              "
            >
              <!-- Card Top Header (Source + Rarity + Checkbox) -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <!-- Source Pill -->
                  <span
                    v-if="entry.source === 'live_slot' || entry.raffle_id"
                    class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1"
                  >
                    <span>🎯</span> Live Slot Win
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1"
                  >
                    <span>🎴</span> Gacha Oripa
                  </span>

                  <!-- Rarity Pill -->
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black" :class="getRarityTheme(entry.rarity).badge">
                    {{ entry.rarity }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <span
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    :class="
                      entry.status === 'in_vault'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : entry.status === 'shipping_requested'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : entry.status === 'shipped'
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400'
                    "
                  >
                    {{ entry.status.replace(/_/g, ' ') }}
                  </span>

                  <input
                    v-if="entry.status === 'in_vault'"
                    type="checkbox"
                    aria-label="Select item for bulk shipping"
                    class="w-4 h-4 rounded text-amber-400 bg-slate-950 border-slate-700 focus:ring-amber-400 cursor-pointer"
                    :checked="selectedVaultItemIds.includes(entry.id)"
                    @click.stop="toggleSelectVaultItem(entry.id)"
                  />
                </div>
              </div>

              <!-- Slab Image Container -->
              <div class="h-44 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center p-3 relative group">
                <img
                  v-if="entry.image_url"
                  :src="resolveStorageUrl(entry.image_url)"
                  :alt="entry.item_name"
                  class="max-h-full object-contain group-hover:scale-105 transition-transform duration-200"
                />
                <div v-else class="flex flex-col items-center justify-center text-slate-500 space-y-1">
                  <span class="text-3xl">🃏</span>
                  <span class="text-[10px] font-bold uppercase tracking-wider">Vault Slab</span>
                </div>

                <span
                  v-if="entry.tracking_number"
                  class="absolute bottom-2 left-2 right-2 text-center text-[10px] font-mono bg-indigo-950/90 text-indigo-300 border border-indigo-500/30 rounded-lg py-1 px-2 truncate"
                >
                  Tracking: {{ entry.tracking_number }}
                </span>
              </div>

              <!-- Details -->
              <div class="space-y-1">
                <h4 class="text-sm font-black text-white leading-snug">{{ entry.item_name }}</h4>
                <div class="flex items-center justify-between text-xs pt-1">
                  <p class="text-[11px] text-slate-400">{{ entry.card_condition }}</p>
                  <span class="font-mono font-bold text-amber-400 text-xs">
                    Est. ₱{{ formatCurrency(entry.estimated_value) }}
                  </span>
                </div>
              </div>

              <!-- Single Ship Physical Action (Retain Physical Delivery Only) -->
              <div class="pt-2 border-t border-slate-800">
                <button
                  v-if="entry.status === 'in_vault'"
                  type="button"
                  class="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5"
                  @click="openSingleShippingModal(entry)"
                >
                  <span>📦</span>
                  <span>Ship Physical Delivery</span>
                </button>
                <div
                  v-else
                  class="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-[11px] font-bold text-slate-400"
                >
                  <span v-if="entry.status === 'shipping_requested'">🚚 Processing for Dispatch</span>
                  <span v-else-if="entry.status === 'shipped'">✈️ In Transit with Courier</span>
                  <span v-else>✓ Delivered</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── SUB-TAB 2: DISPATCHED DELIVERIES & REAL-TIME TRACKING ────────── -->
        <div v-else-if="vaultSubTab === 'tracking'" class="space-y-6">
          <div v-if="vaultShipments.length === 0" class="p-12 bg-slate-900 rounded-3xl border border-slate-800 text-center space-y-3">
            <span class="text-4xl block">🚚</span>
            <h3 class="text-base font-black text-white">No Physical Deliveries Yet</h3>
            <p class="text-xs text-slate-400">
              When you request physical shipping for slabs in your vault, your batch orders and courier tracking numbers appear here.
            </p>
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
              @click="vaultSubTab = 'inventory'"
            >
              View Vault Collection
            </button>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="batch in vaultShipments"
              :key="batch.batch_code"
              class="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl"
            >
              <!-- Batch Header Bar -->
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-black text-amber-400 tracking-wider">
                      {{ batch.batch_code }}
                    </span>
                    <span
                      class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      :class="
                        batch.status === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : batch.status === 'shipped'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      "
                    >
                      {{ batch.status }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">
                    Requested on {{ new Date(batch.created_at).toLocaleDateString() }} • {{ batch.items_count }} slab(s) in package
                  </p>
                </div>

                <!-- Courier Pill & Tracking Number -->
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    v-if="batch.carrier"
                    class="px-3 py-1 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>🚚</span>
                    <span>{{ batch.carrier.name }}</span>
                  </span>

                  <div v-if="batch.tracking_number" class="flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/40 rounded-xl px-3 py-1 text-xs">
                    <span class="text-[10px] uppercase text-indigo-300 font-bold">Waybill:</span>
                    <span class="font-mono font-black text-white">{{ batch.tracking_number }}</span>
                    <a
                      v-if="batch.tracking_url"
                      :href="batch.tracking_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-amber-400 hover:text-amber-300 underline font-bold text-[11px]"
                    >
                      Track &rarr;
                    </a>
                  </div>
                  <span v-else class="text-xs text-slate-500 font-mono italic">
                    Awaiting Waybill Generation
                  </span>
                </div>
              </div>

              <!-- Recipient & Destination Preview -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <div>
                  <span class="text-[10px] text-slate-400 font-bold block">Recipient:</span>
                  <span class="text-white font-bold">{{ batch.recipient_name }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 font-bold block">Contact:</span>
                  <span class="text-white font-mono">{{ batch.phone }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 font-bold block">Destination Address:</span>
                  <span class="text-slate-300 truncate block" :title="batch.address">{{ batch.address }}</span>
                </div>
              </div>

              <!-- Slabs inside this batch -->
              <div class="space-y-2">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Package Contents:
                </span>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div
                    v-for="item in batch.items"
                    :key="item.id"
                    class="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-950 border border-slate-800"
                  >
                    <img
                      v-if="item.vault_item?.image_url"
                      :src="resolveStorageUrl(item.vault_item.image_url)"
                      :alt="item.vault_item?.item_name"
                      class="w-12 h-14 object-contain rounded-lg bg-slate-900 border border-slate-800 shrink-0"
                    />
                    <div class="min-w-0 flex-1">
                      <div class="text-xs font-bold text-white truncate">
                        {{ item.vault_item?.item_name || 'Graded Slab' }}
                      </div>
                      <div class="text-[10px] text-slate-400">
                        {{ item.vault_item?.card_condition || 'PSA 10 GEM MINT' }}
                      </div>
                      <span
                        v-if="item.vault_item?.source === 'live_slot'"
                        class="text-[9px] text-rose-300 font-bold"
                      >
                        🎯 Live Slot Win
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ===================================================================== -->
    <!-- INTERACTIVE GACHA MYSTERY PACK SWIPE / CLICK REVEAL MODAL             -->
    <!-- ===================================================================== -->
    <teleport to="body">
      <div
        v-if="isRevealModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl select-none"
        @mousemove="onPackDragMove"
        @mouseup="endPackDrag"
        @touchmove="onPackDragMove"
        @touchend="endPackDrag"
      >
        <div class="max-w-lg w-full text-center space-y-6">
          <!-- STAGE 1-3: SEALED / SWIPE TO RIP FOIL PACK -->
          <div v-if="revealStage !== 'revealed'" class="space-y-6">
            <div class="space-y-1">
              <span class="text-xs font-black uppercase tracking-widest text-amber-400 block">
                Interactive Pack Opening Ceremony
              </span>
              <h3 class="text-2xl font-black text-white">
                Swipe Across Tear Strip or Click Pack to Rip!
              </h3>
            </div>

            <!-- Interactive Pack Container -->
            <div
              class="relative w-72 h-96 mx-auto rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border-2 border-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.35)] p-6 flex flex-col items-center justify-between overflow-hidden cursor-pointer transition-transform duration-300"
              :class="[
                revealStage === 'charging' ? 'scale-105 animate-pulse' : '',
                revealStage === 'ripping' ? 'scale-125 opacity-0 transition-all duration-500' : '',
              ]"
              @mousedown="startPackDrag"
              @touchstart="startPackDrag"
              @click="completePackRip"
            >
              <!-- Top Foil Tear Strip -->
              <div class="w-full relative py-2 border-b-2 border-dashed border-amber-300/70">
                <div
                  class="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-500 transition-all duration-75 rounded-full opacity-80"
                  :style="{ width: `${swipeProgress}%` }"
                ></div>
                <span class="relative z-10 text-[10px] font-black uppercase tracking-widest text-amber-200">
                  ✂️ SWIPE OR CLICK TO TEAR FOIL ({{ swipeProgress }}%)
                </span>
              </div>

              <img
                v-if="selectedBanner?.image_url"
                :src="resolveStorageUrl(selectedBanner.image_url)"
                class="w-44 h-56 object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
              />
              <div
                v-else
                class="w-44 h-56 rounded-2xl bg-slate-950/80 border border-amber-400/30 flex flex-col items-center justify-center p-4 text-center space-y-2"
              >
                <span class="text-5xl">🎰</span>
                <span class="text-xs font-black text-amber-300 uppercase">Mystery Pack</span>
              </div>

              <span class="px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
                ⚡ Tap Anywhere for Instant Reveal
              </span>
            </div>
          </div>

          <!-- STAGE 4: THE BIG HOLOGRAPHIC REVEAL -->
          <div v-else-if="currentRevealedCard" class="space-y-6 animate-fade-in">
            <div class="space-y-1">
              <span
                class="inline-block px-4 py-1 rounded-full text-xs uppercase tracking-widest shadow-lg"
                :class="getRarityTheme(currentRevealedCard.rarity).badge"
              >
                {{ getRarityTheme(currentRevealedCard.rarity).label }}
              </span>
              <h3 class="text-2xl font-black text-white mt-2">
                {{ currentRevealedCard.name }}
              </h3>
              <p class="text-xs text-slate-300">
                {{ currentRevealedCard.card_condition }} • Pull Odds: {{ currentRevealedCard.pull_probability_pct }}%
              </p>
            </div>

            <!-- Revealed Card Showcase -->
            <div
              class="relative w-72 h-96 mx-auto rounded-3xl bg-gradient-to-br p-6 border-2 flex flex-col items-center justify-center"
              :class="[
                getRarityTheme(currentRevealedCard.rarity).glow,
                getRarityTheme(currentRevealedCard.rarity).border,
              ]"
            >
              <img
                v-if="currentRevealedCard.image_url"
                :src="resolveStorageUrl(currentRevealedCard.image_url)"
                :alt="currentRevealedCard.name"
                class="max-h-full max-w-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
              />
              <div v-else class="flex flex-col items-center justify-center text-slate-400 space-y-2">
                <span class="text-5xl">🃏</span>
                <span class="text-xs font-black text-white">{{ currentRevealedCard.name }}</span>
              </div>
            </div>

            <!-- Multi-Pull Navigation or Close -->
            <div class="flex items-center justify-center gap-3">
              <button
                v-if="activeRevealCardIndex < pulledCards.length - 1"
                type="button"
                class="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
                @click="activeRevealCardIndex++"
              >
                Next Pulled Card ({{ activeRevealCardIndex + 2 }} / {{ pulledCards.length }}) &rarr;
              </button>
              <button
                type="button"
                class="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs cursor-pointer"
                @click="
                  isRevealModalOpen = false;
                  activeMainTab = 'vault';
                "
              >
                🏛️ View in My Digital Vault
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- PHYSICAL FULFILLMENT & BULK DISPATCH SHIPPING MODAL -->
    <teleport to="body">
      <div
        v-if="isBulkShippingModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        @click="isBulkShippingModalOpen = false"
      >
        <div
          class="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                Vault Physical Dispatch
              </span>
              <h3 class="text-base sm:text-lg font-black text-white">
                Request Physical Delivery ({{ selectedItemsToShip.length }} Slabs)
              </h3>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              @click="isBulkShippingModalOpen = false"
            >
              ✕
            </button>
          </div>

          <!-- Items in this Shipment Preview -->
          <div class="space-y-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Items included in this package:
            </span>
            <div class="max-h-36 overflow-y-auto space-y-2 p-2 bg-slate-950 rounded-2xl border border-slate-800">
              <div
                v-for="item in selectedItemsToShip"
                :key="item.id"
                class="flex items-center gap-3 p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80"
              >
                <img
                  v-if="item.image_url"
                  :src="resolveStorageUrl(item.image_url)"
                  :alt="item.item_name"
                  class="w-8 h-10 object-contain rounded bg-slate-950 shrink-0"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-bold text-white truncate">{{ item.item_name }}</p>
                  <p class="text-[10px] text-slate-400">{{ item.card_condition }} • {{ item.rarity }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Courier Selection -->
          <div>
            <label class="font-bold text-slate-300 block mb-1 text-xs">Preferred Courier Service</label>
            <select
              v-model="selectedCarrierId"
              class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-amber-400"
            >
              <option v-for="carrier in shippingCarriers" :key="carrier.id" :value="carrier.id">
                🚚 {{ carrier.name }} ({{ carrier.short_name }})
              </option>
            </select>
          </div>

          <!-- Recipient Form Fields -->
          <div class="space-y-3 text-xs">
            <div>
              <label class="font-bold text-slate-300 block mb-1">Recipient Full Name</label>
              <input
                v-model="shipRecipient"
                type="text"
                placeholder="Full name as shown on valid ID"
                class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label class="font-bold text-slate-300 block mb-1">Contact Mobile Number</label>
              <input
                v-model="shipPhone"
                type="text"
                placeholder="0917XXXXXXX"
                class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label class="font-bold text-slate-300 block mb-1">Complete Delivery Address</label>
              <textarea
                v-model="shipAddress"
                rows="2"
                placeholder="House/Unit #, Street, Barangay, City, Province, Postal Code"
                class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              ></textarea>
            </div>
          </div>

          <!-- Shipping Fee Payment & Wallet Deduction Notice -->
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div class="flex items-center justify-between text-slate-300">
              <span>Standard Packaging &amp; Shipping Fee:</span>
              <span class="font-mono font-bold text-white">₱{{ formatCurrency(standardShippingFee) }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-300">
              <span>Your Available Wallet Balance:</span>
              <span class="font-mono font-bold text-amber-400">₱{{ formatCurrency(walletBalance) }}</span>
            </div>
            <div class="pt-2 border-t border-slate-800 flex items-center justify-between font-bold">
              <span class="text-slate-400">Balance After Deduction:</span>
              <span
                class="font-mono"
                :class="walletBalance >= standardShippingFee ? 'text-emerald-400' : 'text-rose-400'"
              >
                ₱{{ formatCurrency(Math.max(0, walletBalance - standardShippingFee)) }}
              </span>
            </div>

            <!-- Insufficient Wallet Alert -->
            <div
              v-if="walletBalance < standardShippingFee"
              class="pt-2 text-rose-400 font-bold flex items-center justify-between"
            >
              <span>⚠️ Insufficient wallet balance for shipping fee.</span>
              <button
                type="button"
                class="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-xs cursor-pointer"
                @click="router.push('/wallet')"
              >
                + Top Up Wallet
              </button>
            </div>
          </div>

          <!-- Submit Action -->
          <button
            type="button"
            :disabled="isSubmitting || !shipRecipient || !shipPhone || !shipAddress || walletBalance < standardShippingFee"
            class="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-lg transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            @click="handleRequestBulkShipment"
          >
            <span>📦</span>
            <span>Confirm &amp; Deduct ₱{{ formatCurrency(standardShippingFee) }} from Wallet</span>
          </button>
        </div>
      </div>
    </teleport>
  </main>
</template>


