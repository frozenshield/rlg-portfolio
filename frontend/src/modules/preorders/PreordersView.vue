<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { resolveApiUrl } from '@/shared/utils/api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useWalletStore } from '@/modules/wallet/wallet.store';

const router = useRouter();
const authStore = useAuthStore();
const walletStore = useWalletStore();

interface PreorderDropItem {
  id: number;
  title: string;
  series_name: string;
  description: string | null;
  image_url: string | null;
  release_date: string;
  preorder_closes_at: string | null;
  full_price: number;
  deposit_price: number;
  allocation_limit: number;
  reserved_count: number;
  status: 'open' | 'closed' | 'sold_out';
}

const drops = ref<PreorderDropItem[]>([]);
const isLoading = ref(true);
const isReserving = ref(false);
const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null);

// Modal state
const selectedDrop = ref<PreorderDropItem | null>(null);
const reserveQuantity = ref(1);
const reservePaymentTier = ref<'deposit' | 'full_payment'>('deposit');
const isModalOpen = ref(false);

const fetchDrops = async () => {
  isLoading.value = true;
  errorMsg.value = null;
  try {
    const res = await fetch(resolveApiUrl('/preorders'));
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      drops.value = json.data;
    }
  } catch (e: any) {
    errorMsg.value = 'Failed to load pre-order drop calendar.';
  } finally {
    isLoading.value = false;
  }
};

const openReserveModal = (drop: PreorderDropItem) => {
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal('Please sign in to reserve spots in the Pre-Order Drop Calendar.');
    return;
  }
  selectedDrop.value = drop;
  reserveQuantity.value = 1;
  reservePaymentTier.value = 'deposit';
  isModalOpen.value = true;
};

const calculateTotal = computed(() => {
  if (!selectedDrop.value) return 0;
  const unitCost =
    reservePaymentTier.value === 'deposit'
      ? Number(selectedDrop.value.deposit_price)
      : Number(selectedDrop.value.full_price);
  return unitCost * reserveQuantity.value;
});

const handleConfirmReservation = async () => {
  if (!selectedDrop.value) return;

  const cost = calculateTotal.value;
  if ((walletStore.availableBalance || 0) < cost) {
    errorMsg.value = `Insufficient digital wallet float (Required: ₱${cost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}). Please top up your wallet.`;
    return;
  }

  isReserving.value = true;
  errorMsg.value = null;
  successMsg.value = null;

  try {
    const res = await fetch(resolveApiUrl(`/gacha/preorders/${selectedDrop.value.id}/reserve`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${authStore.token}`,
        'X-User-Id': String(authStore.currentUser?.id || ''),
      },
      body: JSON.stringify({
        quantity: reserveQuantity.value,
        payment_tier: reservePaymentTier.value,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to complete pre-order reservation.');
    }

    successMsg.value = `Pre-order confirmed for "${selectedDrop.value.title}"! Deducted ₱${cost.toLocaleString('en-PH', { minimumFractionDigits: 2 })} from your wallet float.`;
    isModalOpen.value = false;
    await Promise.all([fetchDrops(), walletStore.fetchWalletSummary()]);
  } catch (e: any) {
    errorMsg.value = e.message || 'Could not process pre-order.';
  } finally {
    isReserving.value = false;
  }
};

onMounted(() => {
  fetchDrops();
  if (authStore.isAuthenticated) {
    walletStore.fetchWalletSummary();
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#070b13] text-white py-8 sm:py-12 font-display">
    <div class="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <!-- Header Banner -->
      <div class="relative rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-10 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div class="space-y-2 max-w-2xl text-center md:text-left z-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/30">
            <span>📅</span>
            <span>Official Release Calendar &amp; Early Allocations</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Pre-Order Drop Calendar
          </h1>
          <p class="text-sm text-slate-300 leading-relaxed">
            Lock in guaranteed manufacturer-sealed TCG booster boxes, Japanese high-class packs, Bandai Gunpla kits, and anime figures before they hit the open market.
          </p>
        </div>

        <!-- Wallet Mini Widget -->
        <div class="z-10 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shrink-0 shadow-xl">
          <div class="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-2xl">
            💳
          </div>
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Available Wallet Float
            </div>
            <div class="text-xl font-mono font-black text-amber-300">
              ₱{{ Number(authStore.isAuthenticated ? (walletStore.availableBalance || 0) : 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </div>
            <button
              v-if="!authStore.isAuthenticated"
              type="button"
              class="text-[11px] font-black text-amber-400 hover:text-amber-300 underline cursor-pointer mt-0.5"
              @click="authStore.openAuthModal('Please sign in to top up your wallet.')"
            >
              Sign In to Fund Pre-Orders &rarr;
            </button>
            <router-link
              v-else
              to="/wallet"
              class="text-[11px] font-black text-amber-400 hover:text-amber-300 underline cursor-pointer mt-0.5 inline-block"
            >
              + Top Up Digital Wallet &rarr;
            </router-link>
          </div>
        </div>
      </div>

      <!-- Feedback Alerts -->
      <div v-if="successMsg" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-bold flex items-center justify-between">
        <span>✓ {{ successMsg }}</span>
        <button type="button" class="text-slate-400 hover:text-white" @click="successMsg = null">✕</button>
      </div>

      <div v-if="errorMsg" class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-bold flex items-center justify-between">
        <span>✕ {{ errorMsg }}</span>
        <button type="button" class="text-slate-400 hover:text-white" @click="errorMsg = null">✕</button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="py-20 text-center space-y-3">
        <div class="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-slate-400 text-sm font-semibold">Loading upcoming set drops...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="drops.length === 0" class="bg-slate-900/60 rounded-3xl border border-slate-800 p-12 text-center space-y-3">
        <span class="text-4xl">📅</span>
        <h3 class="text-lg font-bold text-white">No Upcoming Pre-Orders Scheduled</h3>
        <p class="text-xs text-slate-400">Check back soon for new Pokémon, One Piece, and Gunpla product waves.</p>
      </div>

      <!-- Preorder Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="drop in drops"
          :key="drop.id"
          class="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-300 group hover:-translate-y-1"
        >
          <div>
            <!-- Image / Status Banner -->
            <div class="relative h-60 w-full bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
              <img
                :src="drop.image_url || '/images/slabs/umbreon-vmax-slab.png'"
                :alt="drop.title"
                class="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xl"
                @error="(e) => ((e.target as HTMLImageElement).src = '/images/slabs/umbreon-vmax-slab.png')"
              />
              <div class="absolute top-3 left-3 flex items-center gap-2">
                <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/90 backdrop-blur-md border border-slate-700 text-amber-300">
                  🗓️ Release: {{ drop.release_date }}
                </span>
              </div>
              <div class="absolute top-3 right-3">
                <span
                  class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-md"
                  :class="
                    drop.status === 'open'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  "
                >
                  {{ drop.status === 'open' ? 'Open for Deposit' : drop.status.toUpperCase() }}
                </span>
              </div>
            </div>

            <!-- Card Content -->
            <div class="p-6 space-y-4">
              <div>
                <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {{ drop.series_name }}
                </span>
                <h3 class="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                  {{ drop.title }}
                </h3>
              </div>

              <p class="text-xs text-slate-400 leading-relaxed line-clamp-3">
                {{ drop.description || 'Pre-order this official release with secured distributor allocation.' }}
              </p>

              <!-- Allocation Progress Bar -->
              <div class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between text-xs font-bold">
                  <span class="text-slate-400">Reserved Spots:</span>
                  <span class="text-amber-300 font-mono">
                    {{ drop.reserved_count }} / {{ drop.allocation_limit }} ({{ Math.max(0, drop.allocation_limit - drop.reserved_count) }} Left)
                  </span>
                </div>
                <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                    :style="{ width: `${Math.min(100, (drop.reserved_count / (drop.allocation_limit || 1)) * 100)}%` }"
                  ></div>
                </div>
              </div>

              <!-- Price Box -->
              <div class="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div>
                  <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Full Retail Price
                  </div>
                  <div class="text-sm font-mono font-black text-white">
                    ₱{{ Number(drop.full_price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                  </div>
                </div>
                <div>
                  <div class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Deposit Option (30%)
                  </div>
                  <div class="text-sm font-mono font-black text-emerald-300">
                    ₱{{ Number(drop.deposit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div class="p-6 pt-0">
            <button
              type="button"
              :disabled="drop.status !== 'open' || drop.reserved_count >= drop.allocation_limit"
              class="w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="
                drop.status === 'open' && drop.reserved_count < drop.allocation_limit
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-500'
              "
              @click="openReserveModal(drop)"
            >
              <span>{{ drop.reserved_count >= drop.allocation_limit ? 'Sold Out' : '🔒 Reserve Pre-Order' }}</span>
              <span v-if="drop.reserved_count < drop.allocation_limit">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reservation Modal -->
    <teleport to="body">
      <div
        v-if="isModalOpen && selectedDrop"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-display"
      >
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Pre-Order Allocation</span>
              <h3 class="text-lg font-black text-white">Reserve Guaranteed Spot</h3>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer text-xs"
              @click="isModalOpen = false"
            >
              ✕
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <!-- Item preview -->
            <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <img
                :src="selectedDrop.image_url || '/images/slabs/umbreon-vmax-slab.png'"
                :alt="selectedDrop.title"
                class="w-12 h-12 object-contain rounded-lg bg-slate-900 p-1 shrink-0"
              />
              <div class="min-w-0 flex-1">
                <div class="font-bold text-white truncate">{{ selectedDrop.title }}</div>
                <div class="text-[10px] text-slate-400">Release Date: {{ selectedDrop.release_date }}</div>
              </div>
            </div>

            <!-- Payment tier choice -->
            <div>
              <label class="block font-bold text-slate-300 mb-2">Select Payment Option:</label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  class="p-3 rounded-2xl border text-left cursor-pointer transition-all"
                  :class="
                    reservePaymentTier === 'deposit'
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-xs'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  "
                  @click="reservePaymentTier = 'deposit'"
                >
                  <div class="font-black text-amber-300">Lock-In Deposit</div>
                  <div class="text-sm font-mono font-black mt-1">
                    ₱{{ Number(selectedDrop.deposit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">Pay remaining balance upon set arrival</div>
                </button>

                <button
                  type="button"
                  class="p-3 rounded-2xl border text-left cursor-pointer transition-all"
                  :class="
                    reservePaymentTier === 'full_payment'
                      ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-xs'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  "
                  @click="reservePaymentTier = 'full_payment'"
                >
                  <div class="font-black text-indigo-300">Full Payment</div>
                  <div class="text-sm font-mono font-black mt-1">
                    ₱{{ Number(selectedDrop.full_price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">Auto-ships on day of release</div>
                </button>
              </div>
            </div>

            <!-- Quantity selector -->
            <div>
              <label class="block font-bold text-slate-300 mb-1.5">Quantity:</label>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                  @click="reserveQuantity = Math.max(1, reserveQuantity - 1)"
                >
                  -
                </button>
                <span class="w-12 text-center font-mono font-bold text-base text-white">
                  {{ reserveQuantity }}
                </span>
                <button
                  type="button"
                  class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                  @click="reserveQuantity = Math.min(10, reserveQuantity + 1)"
                >
                  +
                </button>
              </div>
            </div>

            <!-- Total Summary & Wallet check -->
            <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-400">Total Deduction (Wallet Float):</span>
                <span class="text-base font-mono font-black text-amber-300">
                  ₱{{ calculateTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Your Wallet Balance:</span>
                <span
                  class="font-mono font-bold"
                  :class="(walletStore.availableBalance || 0) >= calculateTotal ? 'text-emerald-400' : 'text-rose-400'"
                >
                  ₱{{ Number(walletStore.availableBalance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button
                type="button"
                class="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                @click="isModalOpen = false"
              >
                Cancel
              </button>
              <button
                type="button"
                :disabled="isReserving || (walletStore.availableBalance || 0) < calculateTotal"
                class="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                @click="handleConfirmReservation"
              >
                <span v-if="isReserving" class="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>{{ isReserving ? 'Processing...' : 'Confirm Reservation' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

