<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useWalletStore } from '@/modules/wallet/wallet.store';
import { resolveApiUrl } from '@/shared/utils/api';
import RafflePrizeShowcase from './components/RafflePrizeShowcase.vue';
import RaffleAvatarGrid from './components/RaffleAvatarGrid.vue';
import type { RaffleTicketSlot } from './types';
import RaffleDrawSequence from './components/RaffleDrawSequence.vue';

const router = useRouter();
const authStore = useAuthStore();
const walletStore = useWalletStore();

interface RaffleData {
  id: number;
  item_name: string;
  description?: string;
  item_image: string;
  grade_badge?: string;
  retail_value: number;
  total_slots: number;
  slot_price: number;
  taken_slots_count: number;
  remaining_slots_count: number;
  status: 'open' | 'drawing' | 'completed';
  winner_slot?: number | null;
  winner_user_id?: number | null;
  winner_name?: string | null;
  winner_avatar?: string | null;
  tickets: RaffleTicketSlot[];
}

const raffles = ref<RaffleData[]>([]);
const activeRaffleId = ref<number | null>(null);
const currentUserId = ref<number | null>(null);

const isLoading = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// 1-Click Purchase Confirmation Modal State
const selectedSlotToBuy = ref<number | null>(null);
const modalErrorMessage = ref<string | null>(null);

// Live Draw Roulette Minigame View State (triggered automatically via WebSocket or when 100/100 slot is purchased)
const isDrawMinigameVisible = ref(false);

let activeEchoChannel: any = null;
let pollInterval: any = null;

// Synchronized real wallet balance strictly tied to authenticated session
const walletBalance = computed<number>(() => {
  return authStore.isAuthenticated ? Number(walletStore.walletBalance || 0) : 0;
});

const activeRaffle = computed<RaffleData | null>(() => {
  return raffles.value.find((r) => r.id === activeRaffleId.value) || raffles.value[0] || null;
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

const fetchRaffles = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const res = await fetch(resolveApiUrl('/raffles'), {
      headers: getHeaders(),
    });
    const json = await res.json();
    if (json.success && json.data) {
      raffles.value = json.data.raffles || [];
      if (authStore.isAuthenticated && json.data.wallet_balance !== undefined) {
        const inc = Number(json.data.wallet_balance);
        if (inc > 0 || walletStore.walletBalance === 0) {
          walletStore.walletBalance = inc;
        }
      }
      currentUserId.value = authStore.isAuthenticated
        ? (json.data.current_user_id || authStore.currentUser?.id || null)
        : null;

      if (!activeRaffleId.value && raffles.value.length > 0) {
        activeRaffleId.value = raffles.value[0].id;
        setupRealtimeRaffleListener(raffles.value[0].id);
      }
    }
  } catch (e: any) {
    errorMessage.value = e.message || 'Unable to load Gamified Slot Raffles.';
  } finally {
    isLoading.value = false;
  }
};

const selectRaffle = (raffle: RaffleData) => {
  activeRaffleId.value = raffle.id;
  isDrawMinigameVisible.value = raffle.status === 'drawing';
  setupRealtimeRaffleListener(raffle.id);
};

// WebSocket (Laravel Reverb / Echo) + Smart Poll Listener for Live Slot & Draw Broadcasts
const setupRealtimeRaffleListener = (raffleId: number) => {
  stopRealtimeRaffleListener();

  if (typeof window !== 'undefined' && window.Echo) {
    try {
      const channelName = `raffle.${raffleId}`;
      activeEchoChannel = window.Echo.channel(channelName);

      const onEvent = (payload: any) => {
        if (!activeRaffle.value || Number(payload.raffle_id) !== Number(activeRaffle.value.id)) return;

        if (payload.ticket) {
          const exists = activeRaffle.value.tickets.some(
            (t) => Number(t.slot_number) === Number(payload.ticket.slot_number)
          );
          if (!exists) {
            activeRaffle.value.tickets.push(payload.ticket);
            activeRaffle.value.taken_slots_count = activeRaffle.value.tickets.length;
            activeRaffle.value.remaining_slots_count = Math.max(
              0,
              activeRaffle.value.total_slots - activeRaffle.value.tickets.length
            );
          }
        }

        if (payload.is_draw_triggered || payload.status === 'drawing') {
          activeRaffle.value.status = 'drawing';
          activeRaffle.value.winner_slot = payload.winner_slot;
          activeRaffle.value.winner_user_id = payload.winner_user_id;
          activeRaffle.value.winner_name = payload.winner_name;
          activeRaffle.value.winner_avatar = payload.winner_avatar;
          isDrawMinigameVisible.value = true;
        }
      };

      activeEchoChannel.listen('.RaffleDrawTriggered', onEvent);
      activeEchoChannel.listen('RaffleDrawTriggered', onEvent);
    } catch {
      // Echo fallback
    }
  }

  // Poll every 4 seconds so multi-tab / multi-viewer sessions stay in sync even without Reverb daemon
  pollInterval = setInterval(async () => {
    if (!activeRaffleId.value || isSubmitting.value) return;
    try {
      const res = await fetch(resolveApiUrl(`/raffles/${activeRaffleId.value}`), {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data?.raffle) {
        const updated = json.data.raffle as RaffleData;
        const idx = raffles.value.findIndex((r) => r.id === updated.id);
        if (idx !== -1) {
          const prevStatus = raffles.value[idx].status;
          raffles.value[idx] = updated;
          if (
            prevStatus === 'open' &&
            (updated.status === 'drawing' || (updated.status === 'completed' && updated.winner_slot))
          ) {
            isDrawMinigameVisible.value = true;
          }
        }
      }
    } catch {
    }
  }, 4000);
};

const stopRealtimeRaffleListener = () => {
  if (activeEchoChannel && typeof window !== 'undefined' && window.Echo && activeRaffleId.value) {
    try {
      window.Echo.leaveChannel(`raffle.${activeRaffleId.value}`);
    } catch {}
    activeEchoChannel = null;
  }
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

// Open 1-Click Purchase Confirmation Modal with Strict Auth Enforcement
const handleSelectSlot = (slotNumber: number) => {
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal('Please sign in or create an account to claim lucky slots and join the live raffle draw.');
    return;
  }
  errorMessage.value = null;
  modalErrorMessage.value = null;
  selectedSlotToBuy.value = slotNumber;
};

// Confirm 1-Click Slot Purchase via Digital Wallet
const confirmSlotPurchase = async () => {
  if (!activeRaffle.value || selectedSlotToBuy.value === null || isSubmitting.value) return;

  if (!authStore.isAuthenticated) {
    authStore.openAuthModal('Please sign in to proceed with this raffle purchase.');
    selectedSlotToBuy.value = null;
    return;
  }

  const slotNumber = selectedSlotToBuy.value;
  isSubmitting.value = true;
  modalErrorMessage.value = null;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const res = await fetch(resolveApiUrl(`/raffles/${activeRaffle.value.id}/purchase-slot`), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ slot_number: slotNumber }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const msg =
        json.errors?.slot_number?.[0] ||
        json.errors?.wallet?.[0] ||
        json.message ||
        'Could not purchase slot.';
      throw new Error(msg);
    }

    selectedSlotToBuy.value = null;
    successMessage.value = json.message;
    if (json.data?.wallet_balance !== undefined) {
      walletStore.walletBalance = Number(json.data.wallet_balance);
    } else {
      walletStore.fetchWalletSummary();
    }

    const updatedRaffle = json.data.raffle as RaffleData;
    const idx = raffles.value.findIndex((r) => r.id === updatedRaffle.id);
    if (idx !== -1) {
      raffles.value[idx] = updatedRaffle;
    }

    // If this was slot 100/100, immediately launch the Number Roulette Draw Sequence!
    if (json.data.is_draw_triggered || updatedRaffle.status === 'drawing') {
      isDrawMinigameVisible.value = true;
    }
  } catch (e: any) {
    modalErrorMessage.value = e.message || 'Slot purchase failed.';
    errorMessage.value = e.message || 'Slot purchase failed.';
  } finally {
    isSubmitting.value = false;
  }
};

const handleGoToWalletTopUp = () => {
  selectedSlotToBuy.value = null;
  router.push('/wallet');
};

// Demo / Admin Helper: Fill Remaining Open Slots (100/100) & Trigger Live Roulette Draw
const handleSimulateFullDraw = async () => {
  if (!activeRaffle.value || isSubmitting.value) return;
  isSubmitting.value = true;
  errorMessage.value = null;
  try {
    const res = await fetch(resolveApiUrl(`/raffles/${activeRaffle.value.id}/simulate-draw`), {
      method: 'POST',
      headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Could not trigger draw.');
    }
    const updatedRaffle = json.data.raffle as RaffleData;
    const idx = raffles.value.findIndex((r) => r.id === updatedRaffle.id);
    if (idx !== -1) {
      raffles.value[idx] = updatedRaffle;
    }
    isDrawMinigameVisible.value = true;
  } catch (e: any) {
    errorMessage.value = e.message;
  } finally {
    isSubmitting.value = false;
  }
};

const handleFinalizeDrawFinished = async () => {
  if (!activeRaffle.value) return;
  try {
    const res = await fetch(resolveApiUrl(`/raffles/${activeRaffle.value.id}/finalize-draw`), {
      method: 'POST',
      headers: getHeaders(),
    });
    const json = await res.json();
    if (json.success && json.data) {
      const idx = raffles.value.findIndex((r) => r.id === json.data.id);
      if (idx !== -1) {
        raffles.value[idx] = json.data;
      }
    }
  } catch {
  }
};

onMounted(async () => {
  if (authStore.isAuthenticated) {
    walletStore.fetchWalletSummary();
  }
  await fetchRaffles();
});

onBeforeUnmount(() => {
  stopRealtimeRaffleListener();
});
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-[1400px] w-full mx-auto space-y-8">
      <!-- Top Header & Live Collector Wallet Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400">
            <span>🎟️ Gamified 10&times;10 Collector Raffle Arena</span>
            <span>•</span>
            <span>Pessimistic Slot Lock + Reverb Live Roulette</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            PSA 10 Grail Slot Raffles (Live Slot Arena)
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Wallet Balance Pill (Strictly Real Synchronized Balance) -->
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
              class="ml-2 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer transition-colors"
              @click="router.push('/wallet')"
            >
              + Top Up
            </button>
          </div>
          <!-- Digital Vault Shortcut Button -->
          <router-link
            to="/gacha?tab=vault"
            class="h-14 px-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/60 text-slate-200 transition-all flex items-center gap-3 cursor-pointer shadow-sm group select-none"
            title="Open Digital Collector Vault to view and ship won slabs"
          >
            <div class="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
              🏛️
            </div>
            <div class="text-left">
              <span class="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Digital Vault</span>
              <span class="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">Won Slabs</span>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Raffle Switcher Tabs + Instant Draw Demo Trigger -->
      <div v-if="raffles.length > 0" class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="r in raffles"
            :key="r.id"
            type="button"
            class="px-4 py-2.5 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center gap-2"
            :class="
              activeRaffle?.id === r.id
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            "
            @click="selectRaffle(r)"
          >
            <span>🎟️ Lot #{{ r.id }}: {{ r.item_name.slice(0, 32) }}...</span>
            <span class="px-2 py-0.5 rounded-full bg-slate-950/80 text-amber-300 font-mono text-[10px]">
              {{ r.taken_slots_count }}/{{ r.total_slots }}
            </span>
          </button>
        </div>

        <div v-if="activeRaffle" class="flex items-center gap-2">
          <button
            v-if="activeRaffle.winner_slot && !isDrawMinigameVisible"
            type="button"
            class="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer shadow-lg"
            @click="isDrawMinigameVisible = true"
          >
            🎬 Watch Winner Roulette Draw (Slot #{{ activeRaffle.winner_slot }})
          </button>
          <button
            v-if="authStore.isAdmin"
            type="button"
            :disabled="isSubmitting"
            class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white border border-fuchsia-400/40 font-black text-xs cursor-pointer shadow-lg transition-all"
            title="Fills all remaining slots to 100/100 and triggers the WebSocket Number Roulette Draw"
            @click="handleSimulateFullDraw"
          >
            ⚡ Fill 100/100 &amp; Trigger Live Roulette Draw
          </button>
        </div>
      </div>

      <!-- Status Feedback Banners -->
      <div
        v-if="successMessage"
        class="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between"
      >
        <span>✓ {{ successMessage }}</span>
        <button type="button" class="cursor-pointer" @click="successMessage = null">✕</button>
      </div>
      <div
        v-if="errorMessage && !selectedSlotToBuy"
        class="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between"
      >
        <span>⚠️ {{ errorMessage }}</span>
        <button type="button" class="cursor-pointer" @click="errorMessage = null">✕</button>
      </div>

      <!-- MAIN ARENA: 3D HOLOGRAPHIC PRIZE SHOWCASE (Left 4 cols) + 10x10 AVATAR GRID OR DRAW SEQUENCE (Right 8 cols) -->
      <div v-if="activeRaffle" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left 4 Columns: 3D Floating Holographic Prize Showcase -->
        <div class="lg:col-span-4 lg:sticky lg:top-6">
          <RafflePrizeShowcase
            :item-name="activeRaffle.item_name"
            :item-image="activeRaffle.item_image"
            :grade-badge="activeRaffle.grade_badge"
            :retail-value="activeRaffle.retail_value"
            :slot-price="activeRaffle.slot_price"
            :taken-slots-count="activeRaffle.taken_slots_count"
            :total-slots="activeRaffle.total_slots"
            :status="activeRaffle.status"
          />
        </div>

        <!-- Right 8 Columns: Either the WebSocket Draw Roulette Minigame OR the 10x10 Avatar Grid -->
        <div class="lg:col-span-8">
          <Transition mode="out-in" name="fade">
            <RaffleDrawSequence
              v-if="isDrawMinigameVisible && activeRaffle.winner_slot"
              :raffle-name="activeRaffle.item_name"
              :raffle-image="activeRaffle.item_image"
              :winner-slot="activeRaffle.winner_slot"
              :winner-name="activeRaffle.winner_name"
              :winner-avatar="activeRaffle.winner_avatar"
              :tickets="activeRaffle.tickets"
              :current-user-id="currentUserId"
              @draw-finished="handleFinalizeDrawFinished"
              @replay="isDrawMinigameVisible = false"
            />

            <RaffleAvatarGrid
              v-else
              :total-slots="activeRaffle.total_slots"
              :slot-price="activeRaffle.slot_price"
              :tickets="activeRaffle.tickets"
              :current-user-id="currentUserId"
              :winner-slot="activeRaffle.winner_slot"
              :disabled="activeRaffle.status !== 'open' || isSubmitting"
              @select-slot="handleSelectSlot"
            />
          </Transition>
        </div>
      </div>
    </div>

    <!-- 1-CLICK SLOT PURCHASE CONFIRMATION MODAL (With Integrated Mobile Error & Top-Up Action) -->
    <teleport to="body">
      <div
        v-if="selectedSlotToBuy !== null && activeRaffle"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        @click="selectedSlotToBuy = null"
      >
        <div
          class="max-w-md w-full bg-slate-900 border-2 rounded-3xl p-6 space-y-5 shadow-2xl transition-all"
          :class="walletBalance < activeRaffle.slot_price ? 'border-amber-400/60 shadow-[0_0_50px_rgba(251,191,36,0.2)]' : 'border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.25)]'"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2.5">
              <span
                class="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-sm border"
                :class="walletBalance < activeRaffle.slot_price ? 'bg-amber-500/20 border-amber-400/50 text-amber-300' : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'"
              >
                #{{ String(selectedSlotToBuy).padStart(2, '0') }}
              </span>
              <div>
                <span
                  class="text-[10px] font-black uppercase tracking-widest block"
                  :class="walletBalance < activeRaffle.slot_price ? 'text-amber-400' : 'text-emerald-400'"
                >
                  1-Click Wallet Slot Lock
                </span>
                <h3 class="text-base font-black text-white">
                  Claim Lucky Slot #{{ selectedSlotToBuy }}
                </h3>
              </div>
            </div>
            <button
              type="button"
              class="text-slate-400 hover:text-white cursor-pointer w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center transition-colors"
              @click="selectedSlotToBuy = null"
            >
              ✕
            </button>
          </div>

          <!-- Prominent In-Modal Error & Top-Up Prompt (Fully Visible on Mobile & Chrome) -->
          <div
            v-if="modalErrorMessage || walletBalance < activeRaffle.slot_price"
            class="p-4 rounded-2xl border space-y-3"
            :class="walletBalance < activeRaffle.slot_price ? 'bg-amber-500/10 border-amber-400/40 text-amber-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-300'"
          >
            <div class="flex items-start gap-2.5">
              <span class="text-lg shrink-0">⚠️</span>
              <div class="space-y-1">
                <p class="font-bold text-xs leading-snug">
                  {{ modalErrorMessage || 'Insufficient Wallet Balance' }}
                </p>
                <p class="text-[11px] text-slate-300 font-medium">
                  Slot #{{ selectedSlotToBuy }} requires <strong>₱{{ formatCurrency(activeRaffle.slot_price) }}</strong>. Your current available balance is <strong class="font-mono text-amber-300">₱{{ formatCurrency(walletBalance) }}</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 cursor-pointer active:scale-95"
              @click="handleGoToWalletTopUp"
            >
              <span>⚡ Top Up Wallet Now (+₱{{ formatCurrency(Math.max(0, activeRaffle.slot_price - walletBalance)) }} needed)</span>
            </button>
          </div>

          <!-- Deduction Summary Card -->
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Raffle Grail Item:</span>
              <span class="font-bold text-white truncate max-w-[210px]">{{ activeRaffle.item_name }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Selected Board Coordinate:</span>
              <span class="font-mono font-black text-emerald-400">Slot #{{ selectedSlotToBuy }} / {{ activeRaffle.total_slots }}</span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-slate-800">
              <span class="text-slate-300 font-bold">Instant Wallet Deduction:</span>
              <span class="font-mono font-black text-base text-amber-400">
                -₱{{ formatCurrency(activeRaffle.slot_price) }}
              </span>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-400">Current Wallet Balance:</span>
              <span
                class="font-mono font-bold"
                :class="walletBalance < activeRaffle.slot_price ? 'text-rose-400' : 'text-slate-200'"
              >
                ₱{{ formatCurrency(walletBalance) }}
              </span>
            </div>
          </div>

          <!-- Modal Action Controls -->
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              @click="selectedSlotToBuy = null"
            >
              Cancel
            </button>

            <!-- If insufficient, let user use/top-up wallet directly; otherwise confirm slot -->
            <button
              v-if="walletBalance < activeRaffle.slot_price"
              type="button"
              class="py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95"
              @click="handleGoToWalletTopUp"
            >
              <span>⚡ Top Up &amp; Use Wallet</span>
            </button>
            <button
              v-else
              type="button"
              :disabled="isSubmitting"
              class="py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
              @click="confirmSlotPurchase"
            >
              {{ isSubmitting ? 'Locking Slot...' : `⚡ Confirm & Pay ₱${formatCurrency(activeRaffle.slot_price)}` }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </main>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>

