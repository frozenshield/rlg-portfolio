<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuctionStore } from '../auction.store';
import { useAuthStore } from '@/modules/auth/auth.store';
import type { CustomerBiddingPaymentRecord, AuctionListItem } from '../types';

const router = useRouter();
const auctionStore = useAuctionStore();
const authStore = useAuthStore();

type TabType = 'favorites' | 'bids' | 'won';
const activeTab = ref<TabType>('won');

const currentTime = ref(Date.now());
let timerInterval: any = null;

// Checkout Payment Modal State
const isPaymentModalOpen = ref(false);
const selectedPaymentRecord = ref<CustomerBiddingPaymentRecord | null>(null);
const paymentMethod = ref('gcash');
const shippingName = ref('');
const shippingPhone = ref('');
const shippingAddress = ref('');
const shippingCity = ref('Metro Manila');
const shippingPostalCode = ref('1000');
const shippingNotes = ref('');
const paymentReference = ref('');
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null);

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = { type, message };
  setTimeout(() => {
    notification.value = null;
  }, 4000);
};

const formatPrice = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Live countdown calculator
const getRemainingTime = (endTimeIso?: string) => {
  if (!endTimeIso) return 'Ended';
  const diff = new Date(endTimeIso).getTime() - currentTime.value;
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

// Open payment checkout modal
const openPaymentModal = (record: CustomerBiddingPaymentRecord) => {
  selectedPaymentRecord.value = record;
  paymentMethod.value = 'gcash';
  paymentReference.value = '';
  shippingName.value = authStore.currentUser?.name || '';
  shippingPhone.value = authStore.currentUser?.phone || '';
  shippingAddress.value = '';
  shippingNotes.value = '';
  isPaymentModalOpen.value = true;
};

// Submit Payment Checkout
const submitPayment = async () => {
  if (!selectedPaymentRecord.value) return;

  if (!shippingName.value.trim() || !shippingPhone.value.trim() || !shippingAddress.value.trim()) {
    showToast('Please fill out all recipient shipping details.', 'error');
    return;
  }

  try {
    await auctionStore.checkoutAuctionPayment(selectedPaymentRecord.value.id, {
      payment_method: paymentMethod.value,
      shipping_name: shippingName.value.trim(),
      shipping_phone: shippingPhone.value.trim(),
      shipping_address: shippingAddress.value.trim(),
      shipping_city: shippingCity.value,
      shipping_postal_code: shippingPostalCode.value,
      shipping_notes: shippingNotes.value.trim(),
      payment_reference: paymentReference.value.trim() || undefined,
    });
    isPaymentModalOpen.value = false;
    showToast('Payment confirmed! Your won lot is now queued for packaging and shipping.');
  } catch (err: any) {
    showToast(err.message || 'Payment submission failed.', 'error');
  }
};

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.replace('/login');
    return;
  }

  timerInterval = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);

  await Promise.all([
    auctionStore.fetchWonAuctions(),
    auctionStore.fetchFavorites(),
    auctionStore.fetchUserBids(),
  ]);

  // Set default tab based on where user has records
  if (auctionStore.userWonPayments.length > 0) {
    activeTab.value = 'won';
  } else if (auctionStore.userFavorites.length > 0) {
    activeTab.value = 'favorites';
  } else {
    activeTab.value = 'bids';
  }
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
    <!-- Notification Toast -->
    <div
      v-if="notification"
      class="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold transition-all transform animate-bounce"
      :class="
        notification.type === 'success'
          ? 'bg-emerald-900/90 text-emerald-100 border-emerald-500/50 backdrop-blur-md'
          : 'bg-red-900/90 text-red-100 border-red-500/50 backdrop-blur-md'
      "
    >
      <span>{{ notification.type === 'success' ? '✓' : '⚠️' }}</span>
      <span>{{ notification.message }}</span>
    </div>

    <div class="max-w-6xl mx-auto space-y-8">
      <!-- Breadcrumb and Headline -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            <router-link to="/auctions" class="hover:underline flex items-center gap-1">
              <span>← Back to Auction Arena</span>
            </router-link>
            <span>•</span>
            <span>Collector Portal</span>
          </div>
          <h1 class="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>🔨</span>
            <span>My Auctions &amp; Bids Hub</span>
          </h1>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">
            Track lots you've won, monitor active bid wars, and view your favorited watchlists.
          </p>
        </div>

        <router-link
          to="/auctions"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-md self-start sm:self-auto"
        >
          <span>Browse Live Arena</span>
          <span>→</span>
        </router-link>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center p-1 bg-slate-900 rounded-2xl border border-slate-800 gap-1 overflow-x-auto">
        <button
          type="button"
          @click="activeTab = 'won'"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          :class="
            activeTab === 'won'
              ? 'bg-amber-400 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          "
        >
          <span>🏆</span>
          <span>Won Auctions &amp; Payments</span>
          <span
            v-if="auctionStore.userWonPayments.length > 0"
            class="px-2 py-0.5 rounded-full text-[10px] font-black"
            :class="activeTab === 'won' ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'"
          >
            {{ auctionStore.userWonPayments.length }}
          </span>
        </button>

        <button
          type="button"
          @click="activeTab = 'favorites'"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          :class="
            activeTab === 'favorites'
              ? 'bg-amber-400 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          "
        >
          <span>❤️</span>
          <span>Watchlist &amp; Favorites</span>
          <span
            v-if="auctionStore.userFavorites.length > 0"
            class="px-2 py-0.5 rounded-full text-[10px] font-black"
            :class="activeTab === 'favorites' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'"
          >
            {{ auctionStore.userFavorites.length }}
          </span>
        </button>

        <button
          type="button"
          @click="activeTab = 'bids'"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          :class="
            activeTab === 'bids'
              ? 'bg-amber-400 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          "
        >
          <span>⚡</span>
          <span>My Active Bids</span>
          <span
            v-if="auctionStore.userBidsList.length > 0"
            class="px-2 py-0.5 rounded-full text-[10px] font-black"
            :class="activeTab === 'bids' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'"
          >
            {{ auctionStore.userBidsList.length }}
          </span>
        </button>
      </div>

      <!-- TAB 1: WON AUCTIONS & PAYMENT PROCESS -->
      <div v-if="activeTab === 'won'" class="space-y-6">
        <div v-if="auctionStore.isLoading && auctionStore.userWonPayments.length === 0" class="py-16 text-center text-slate-400">
          <div class="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-xs font-bold uppercase tracking-wider">Syncing won auction records...</p>
        </div>

        <div
          v-else-if="auctionStore.userWonPayments.length === 0"
          class="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800 space-y-4 max-w-md mx-auto"
        >
          <span class="text-4xl">🏆</span>
          <h3 class="text-base font-bold text-white">No won auctions yet</h3>
          <p class="text-xs text-slate-400">
            When you hold the highest bid when a timer expires, your won lot will appear here for payment checkout and tracking.
          </p>
          <router-link
            to="/auctions"
            class="inline-block px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-colors"
          >
            Join Live Auctions
          </router-link>
        </div>

        <!-- Won Items List -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="payment in auctionStore.userWonPayments"
            :key="payment.id"
            class="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-xl flex flex-col justify-between"
          >
            <!-- Card Header -->
            <div class="p-5 flex gap-4">
              <div class="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0">
                <img
                  :src="payment.auction?.primary_image_url || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400'"
                  :alt="payment.auction?.item_name || 'Won Lot'"
                  class="w-full h-full object-cover"
                />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[10px] font-mono font-bold text-amber-400">
                    LOT #{{ payment.auction_id }} • WON
                  </span>
                  <!-- Status Pill -->
                  <span
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    :class="
                      payment.payment_status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : payment.payment_status === 'processing'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    "
                  >
                    {{ payment.payment_status === 'paid' ? 'Paid &amp; Processing' : 'Awaiting Payment' }}
                  </span>
                </div>

                <h3 class="text-sm font-bold text-white truncate mt-1">
                  {{ payment.auction?.item_name || 'Auction Item' }}
                </h3>

                <div class="mt-2 text-xs">
                  <span class="text-slate-400">Winning Price: </span>
                  <span class="text-base font-black font-mono text-emerald-400">
                    {{ formatPrice(payment.winning_amount) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Fulfillment & Logistics Step Progress -->
            <div class="px-5 py-3 bg-slate-950/60 border-t border-slate-800/80 text-xs space-y-2">
              <div class="flex items-center justify-between text-[11px] text-slate-400">
                <span>Fulfillment Stage:</span>
                <span class="font-bold capitalize text-slate-200">
                  {{ payment.fulfillment_status.replace('_', ' ') }}
                </span>
              </div>

              <div v-if="payment.tracking_number" class="flex items-center justify-between text-[11px] text-indigo-300">
                <span>Tracking Number:</span>
                <span class="font-mono font-bold">{{ payment.tracking_number }} ({{ payment.courier || 'LBC' }})</span>
              </div>

              <div v-if="payment.deadline_at && payment.payment_status !== 'paid'" class="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                <span>⏳ Settlement Deadline:</span>
                <span>{{ new Date(payment.deadline_at).toLocaleString() }}</span>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
              <router-link
                :to="`/auctions/${payment.auction_id}`"
                class="text-xs text-slate-400 hover:text-white transition-colors"
              >
                View Arena Details ↗
              </router-link>

              <button
                v-if="payment.payment_status !== 'paid'"
                type="button"
                @click="openPaymentModal(payment)"
                class="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                💳 Pay &amp; Confirm Shipping
              </button>

              <span
                v-else
                class="text-xs font-bold text-emerald-400 flex items-center gap-1.5"
              >
                <span>✓ Order Paid</span>
                <span class="text-[10px] text-slate-500 font-mono">
                  ({{ payment.payment_reference || 'Confirmed' }})
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: WATCHLIST & FAVORITES -->
      <div v-else-if="activeTab === 'favorites'" class="space-y-6">
        <div v-if="auctionStore.isLoading && auctionStore.userFavorites.length === 0" class="py-16 text-center text-slate-400">
          <div class="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-xs font-bold uppercase tracking-wider">Loading saved watchlists...</p>
        </div>

        <div
          v-else-if="auctionStore.userFavorites.length === 0"
          class="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800 space-y-4 max-w-md mx-auto"
        >
          <span class="text-4xl">🤍</span>
          <h3 class="text-base font-bold text-white">Your watchlist is empty</h3>
          <p class="text-xs text-slate-400">
            Click the heart button on any auction lot to pin it here so you never miss out on bidding wars.
          </p>
          <router-link
            to="/auctions"
            class="inline-block px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-colors"
          >
            Explore Live Lots
          </router-link>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="item in auctionStore.userFavorites"
            :key="item.id"
            class="bg-slate-900/90 rounded-3xl border border-slate-800 hover:border-amber-400/40 transition-all overflow-hidden flex flex-col justify-between shadow-lg"
          >
            <div class="relative aspect-4/3 bg-slate-950 overflow-hidden flex items-center justify-center p-3">
              <img
                :src="item.primary_image_url || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600'"
                :alt="item.item_name"
                class="w-full h-full object-contain rounded-2xl"
              />
              <button
                type="button"
                @click="auctionStore.toggleFavorite(item.id)"
                class="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/85 hover:bg-slate-900 border border-slate-700 flex items-center justify-center text-sm shadow cursor-pointer"
                title="Remove from favorites"
              >
                ❤️
              </button>
              <div class="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-slate-950/85 text-[11px] font-mono font-bold text-amber-300 border border-amber-500/30">
                ⏳ {{ getRemainingTime(item.end_time) }}
              </div>
            </div>

            <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <span class="text-[10px] font-mono font-bold text-slate-400 block mb-1">LOT #{{ item.id }}</span>
                <h3 class="text-sm font-bold text-white line-clamp-2">{{ item.item_name }}</h3>
              </div>

              <div class="pt-3 border-t border-slate-800 flex items-end justify-between">
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-400 block">Current Price</span>
                  <span class="text-lg font-black font-mono text-amber-400">{{ formatPrice(item.current_price) }}</span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] uppercase font-bold text-slate-400 block">Next Valid</span>
                  <span class="text-xs font-mono font-bold text-slate-300">{{ formatPrice(item.min_next_bid) }}</span>
                </div>
              </div>

              <router-link
                :to="`/auctions/${item.id}`"
                class="w-full py-2.5 px-4 rounded-xl text-center text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow"
              >
                Enter Bidding Arena →
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: MY ACTIVE BIDS -->
      <div v-else-if="activeTab === 'bids'" class="space-y-6">
        <div v-if="auctionStore.isLoading && auctionStore.userBidsList.length === 0" class="py-16 text-center text-slate-400">
          <div class="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-xs font-bold uppercase tracking-wider">Syncing your active bids...</p>
        </div>

        <div
          v-else-if="auctionStore.userBidsList.length === 0"
          class="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800 space-y-4 max-w-md mx-auto"
        >
          <span class="text-4xl">⚡</span>
          <h3 class="text-base font-bold text-white">No active bids placed</h3>
          <p class="text-xs text-slate-400">
            You haven't participated in any auctions yet. Enter the Arena and place a Quick Bid or Proxy Auto-Bid!
          </p>
          <router-link
            to="/auctions"
            class="inline-block px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-colors"
          >
            Find a Lot to Bid On
          </router-link>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="b in auctionStore.userBidsList"
            :key="b.auction.id"
            class="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0">
                <img
                  :src="b.auction.primary_image_url || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=300'"
                  :alt="b.auction.item_name"
                  class="w-full h-full object-cover"
                />
              </div>
              <div>
                <span class="text-[10px] font-mono font-bold text-slate-400">LOT #{{ b.auction.id }}</span>
                <h4 class="text-sm font-bold text-white line-clamp-1">{{ b.auction.item_name }}</h4>
                <div class="flex items-center gap-3 mt-1 text-xs">
                  <span class="text-slate-400">Your Highest Bid: <strong class="font-mono text-slate-200">{{ formatPrice(b.user_highest_bid) }}</strong></span>
                  <span class="text-slate-500">•</span>
                  <span class="text-slate-400">Current Highest: <strong class="font-mono text-amber-400">{{ formatPrice(b.current_price) }}</strong></span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div>
                <span
                  v-if="b.is_winning && !b.is_ended"
                  class="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                >
                  <span>👑</span>
                  <span>Highest Bidder</span>
                </span>
                <span
                  v-else-if="!b.is_winning && !b.is_ended"
                  class="px-2.5 py-1 rounded-full text-[11px] font-black bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 animate-pulse"
                >
                  <span>⚠️</span>
                  <span>You've been outbid</span>
                </span>
                <span
                  v-else
                  class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400"
                >
                  Auction Ended
                </span>
              </div>

              <router-link
                :to="`/auctions/${b.auction.id}`"
                class="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow"
              >
                Arena →
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- WON AUCTION PAYMENT CHECKOUT MODAL -->
    <div
      v-if="isPaymentModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
        <!-- Header -->
        <div class="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-black text-white flex items-center gap-2">
              <span>💳</span>
              <span>Checkout Won Auction Lot</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">
              Lot #{{ selectedPaymentRecord?.auction_id }} • {{ selectedPaymentRecord?.auction?.item_name }}
            </p>
          </div>
          <button
            type="button"
            @click="isPaymentModalOpen = false"
            class="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <!-- Body Form -->
        <div class="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <!-- Order Summary Box -->
          <div class="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span class="text-[11px] uppercase tracking-wider text-slate-400 block font-bold">Total Amount Due</span>
              <span class="text-2xl font-black font-mono text-emerald-400">
                {{ formatPrice(selectedPaymentRecord?.winning_amount) }}
              </span>
            </div>
            <div class="text-right text-xs text-slate-400">
              <span>Includes Collector Guarantee</span>
            </div>
          </div>

          <!-- Payment Method Selection -->
          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Payment Method *
            </label>
            <div class="grid grid-cols-3 gap-2 text-xs font-bold">
              <button
                type="button"
                @click="paymentMethod = 'gcash'"
                class="py-3 px-2 rounded-xl border flex flex-col items-center gap-1 transition-all"
                :class="
                  paymentMethod === 'gcash'
                    ? 'bg-blue-900/30 border-blue-500 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                "
              >
                <span>📱</span>
                <span>GCash</span>
              </button>
              <button
                type="button"
                @click="paymentMethod = 'maya'"
                class="py-3 px-2 rounded-xl border flex flex-col items-center gap-1 transition-all"
                :class="
                  paymentMethod === 'maya'
                    ? 'bg-emerald-900/30 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                "
              >
                <span>💚</span>
                <span>Maya</span>
              </button>
              <button
                type="button"
                @click="paymentMethod = 'card'"
                class="py-3 px-2 rounded-xl border flex flex-col items-center gap-1 transition-all"
                :class="
                  paymentMethod === 'card'
                    ? 'bg-amber-900/30 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                "
              >
                <span>💳</span>
                <span>Credit/Debit</span>
              </button>
            </div>
          </div>

          <!-- Payment Reference Number (if e-wallet) -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Payment Reference / Transaction ID (Optional)
            </label>
            <input
              v-model="paymentReference"
              type="text"
              placeholder="e.g. 100293847581 or Leave blank for auto reference"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <!-- Shipping Details Section -->
          <div class="space-y-3 pt-3 border-t border-slate-800">
            <h4 class="text-xs font-black uppercase tracking-wider text-amber-400">
              Delivery &amp; Packaging Address
            </h4>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-400 mb-1">Recipient Name *</label>
                <input
                  v-model="shippingName"
                  type="text"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-400 mb-1">Phone Number *</label>
                <input
                  v-model="shippingPhone"
                  type="text"
                  placeholder="0917..."
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-400 mb-1">Street Address / Unit / Bldg *</label>
              <textarea
                v-model="shippingAddress"
                rows="2"
                placeholder="Complete delivery address..."
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-400 mb-1">City / Municipality</label>
                <input
                  v-model="shippingCity"
                  type="text"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-400 mb-1">Postal Code</label>
                <input
                  v-model="shippingPostalCode"
                  type="text"
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-400 mb-1">Courier Packaging Notes (Optional)</label>
              <input
                v-model="shippingNotes"
                type="text"
                placeholder="e.g. Extra bubble wrap for slab grading box"
                class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="isPaymentModalOpen = false"
            class="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitPayment"
            :disabled="auctionStore.isSubmitting"
            class="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-950/40 disabled:opacity-50 transition-all cursor-pointer"
          >
            {{ auctionStore.isSubmitting ? 'Confirming Payment...' : 'Confirm & Settle Payment' }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
