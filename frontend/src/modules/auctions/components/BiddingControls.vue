<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAuctionStore } from '../auction.store';
import { useAuthStore } from '../../auth/auth.store';
import type { AuctionDetail } from '../types';

const props = defineProps<{
  auction: AuctionDetail;
}>();

const emit = defineEmits<{
  (e: 'bid-placed'): void;
}>();

const auctionStore = useAuctionStore();
const authStore = useAuthStore();

const activeTab = ref<'quick' | 'proxy'>('quick');
const customProxyAmount = ref<number>(
  Math.max(props.auction.min_next_bid + 500, props.auction.min_next_bid)
);

// Keep suggested proxy amount updated as current price updates
watch(
  () => props.auction.min_next_bid,
  (newMin) => {
    if (customProxyAmount.value < newMin) {
      customProxyAmount.value = newMin + 500;
    }
  }
);

const isWinning = computed(() => props.auction.currentUserBidStatus === 'winning');
const isOutbid = computed(() => props.auction.currentUserBidStatus === 'outbid');
const isEnded = computed(() => props.auction.is_ended || props.auction.status !== 'active');

const quickBidAmount = computed(() => props.auction.min_next_bid);

const formatNumber = (val: number) => {
  return Number(val || 0).toLocaleString('en-PH');
};

const handleQuickBid = async () => {
  if (isWinning.value || isEnded.value) return;

  try {
    await auctionStore.placeQuickBid(props.auction.id, quickBidAmount.value);
    emit('bid-placed');
  } catch {
    // Error is set in store
  }
};

const handleProxySubmit = async () => {
  if (isWinning.value || isEnded.value) return;

  if (customProxyAmount.value < props.auction.min_next_bid) {
    auctionStore.errorMessage = `Max proxy amount must be at least ₱${formatNumber(props.auction.min_next_bid)}.`;
    return;
  }

  try {
    await auctionStore.setProxyBid(props.auction.id, customProxyAmount.value);
    emit('bid-placed');
  } catch {
    // Error is set in store
  }
};

const openAuth = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  }
};
</script>

<template>
  <div class="p-6 bg-slate-900/95 rounded-3xl border border-slate-800 shadow-xl space-y-4">
    <!-- Highest Bidder Status Banners -->
    <Transition mode="out-in" name="fade">
      <!-- 1. Winning Banner -->
      <div
        v-if="isWinning"
        class="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/10"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl animate-bounce">👑</span>
          <div>
            <p class="text-sm font-black text-white">You are currently the highest bidder!</p>
            <p class="text-xs text-emerald-400/90 font-medium">
              Your bid of ₱{{ formatNumber(auction.current_price) }} is currently in the lead.
              <span v-if="auction.userProxyBid && auction.userProxyBid.status === 'active'">
                (Proxy active up to ₱{{ formatNumber(auction.userProxyBid.max_amount) }})
              </span>
            </p>
          </div>
        </div>
        <span class="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
          Winning
        </span>
      </div>

      <!-- 2. Outbid Banner -->
      <div
        v-else-if="isOutbid"
        class="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center justify-between gap-3 animate-pulse shadow-lg shadow-rose-500/10"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚠️</span>
          <div>
            <p class="text-sm font-black text-white">You have been outbid!</p>
            <p class="text-xs text-rose-300/90 font-medium">
              Another collector has overtaken your bid. Increase your bid to reclaim the lead!
            </p>
          </div>
        </div>
        <span class="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
          Outbid
        </span>
      </div>
    </Transition>

    <!-- Error / Success Alert Messages -->
    <div
      v-if="auctionStore.errorMessage"
      class="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2"
    >
      <div class="flex items-center gap-2">
        <span>❌</span>
        <span class="font-bold">{{ auctionStore.errorMessage }}</span>
      </div>
      <button
        type="button"
        class="text-rose-400 hover:text-white text-xs cursor-pointer font-bold px-1"
        @click="auctionStore.errorMessage = null"
      >
        ✕
      </button>
    </div>

    <div
      v-if="auctionStore.successMessage"
      class="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2"
    >
      <div class="flex items-center gap-2">
        <span>✓</span>
        <span class="font-bold">{{ auctionStore.successMessage }}</span>
      </div>
      <button
        type="button"
        class="text-emerald-400 hover:text-white text-xs cursor-pointer font-bold px-1"
        @click="auctionStore.successMessage = null"
      >
        ✕
      </button>
    </div>

    <!-- Guest / Login Prompt Banner if not authenticated -->
    <div
      v-if="!authStore.isAuthenticated"
      class="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs"
    >
      <div class="flex items-center gap-2.5">
        <span class="text-lg">🔒</span>
        <span class="text-slate-300">
          Bidding requires a collector account. Sign in to place quick bids or set auto-limits.
        </span>
      </div>
      <button
        type="button"
        class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-md"
        @click="openAuth"
      >
        Sign In
      </button>
    </div>

    <!-- Bidding Tabs Switcher -->
    <div class="flex p-1 bg-slate-950 rounded-2xl border border-slate-800/90 gap-1">
      <button
        type="button"
        class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        :class="[
          activeTab === 'quick'
            ? 'bg-amber-400 text-slate-950 font-black shadow-md'
            : 'text-slate-400 hover:text-white',
        ]"
        @click="activeTab = 'quick'"
      >
        <span>⚡ Quick Bid (Manual)</span>
      </button>

      <button
        type="button"
        class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        :class="[
          activeTab === 'proxy'
            ? 'bg-indigo-600 text-white font-black shadow-md'
            : 'text-slate-400 hover:text-white',
        ]"
        @click="activeTab = 'proxy'"
      >
        <span>🤖 Auto-Bid (Proxy)</span>
        <span
          v-if="auction.userProxyBid && auction.userProxyBid.status === 'active'"
          class="w-2 h-2 rounded-full bg-emerald-400"
        ></span>
      </button>
    </div>

    <!-- Tab 1: Quick Bid (Manual) -->
    <div v-if="activeTab === 'quick'" class="space-y-3 pt-1">
      <div class="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Next valid minimum bid:</span>
        <span class="font-mono font-bold text-amber-400">₱{{ formatNumber(quickBidAmount) }}</span>
      </div>

      <button
        type="button"
        :disabled="isWinning || isEnded || auctionStore.isSubmitting"
        class="w-full py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        :class="[
          isWinning
            ? 'bg-slate-800 text-slate-400 border border-slate-700'
            : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20 active:scale-[0.99]',
        ]"
        @click="handleQuickBid"
      >
        <span v-if="auctionStore.isSubmitting" class="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
        <template v-else-if="isWinning">
          <span>👑 Highest Bidder</span>
        </template>
        <template v-else-if="isEnded">
          <span>Auction Ended</span>
        </template>
        <template v-else>
          <span>Place Bid for ₱{{ formatNumber(quickBidAmount) }}</span>
          <span>⚡</span>
        </template>
      </button>

      <p class="text-[11px] text-center text-slate-400">
        Strict ₱50 PHP minimum increment. Bids are verified and permanently recorded on the immutable ledger.
      </p>
    </div>

    <!-- Tab 2: Auto-Bid (Proxy) -->
    <div v-else class="space-y-3 pt-1">
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
          <span>Set Your Maximum Limit</span>
          <span class="text-slate-400 text-[11px] font-normal">Min: ₱{{ formatNumber(quickBidAmount) }}</span>
        </label>
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold font-mono">
            ₱
          </span>
          <input
            v-model.number="customProxyAmount"
            type="number"
            :step="50"
            :min="quickBidAmount"
            :disabled="isEnded || auctionStore.isSubmitting"
            placeholder="e.g. 15000"
            class="w-full pl-9 pr-4 py-3 bg-slate-950 text-white font-mono text-base font-bold rounded-2xl border border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      <!-- Quick Preset Increment Buttons -->
      <div class="flex items-center gap-2">
        <button
          v-for="preset in [500, 1000, 2500, 5000]"
          :key="preset"
          type="button"
          class="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-xl transition-colors cursor-pointer border border-slate-700/60"
          @click="customProxyAmount = quickBidAmount + preset"
        >
          +₱{{ preset }}
        </button>
      </div>

      <button
        type="button"
        :disabled="isEnded || auctionStore.isSubmitting"
        class="w-full py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/25 active:scale-[0.99]"
        @click="handleProxySubmit"
      >
        <span v-if="auctionStore.isSubmitting" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <template v-else-if="isEnded">
          <span>Auction Ended</span>
        </template>
        <template v-else>
          <span>Set Max Auto-Bid (₱{{ formatNumber(customProxyAmount) }})</span>
          <span>🤖</span>
        </template>
      </button>

      <!-- Explanation Box -->
      <div class="p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <p class="font-bold text-slate-300 flex items-center gap-1.5">
          <span>🛡️</span>
          <span>How Proxy Auto-Bidding Works:</span>
        </p>
        <p class="leading-relaxed">
          Type your maximum secret ceiling. Our system will bid on your behalf in minimum ₱50 increments whenever another user bids, stopping as soon as you win or your limit is reached.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
