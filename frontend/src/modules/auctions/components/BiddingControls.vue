<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuctionStore } from '../auction.store';
import { useAuthStore } from '../../auth/auth.store';
import type { AuctionDetail } from '../types';

const props = defineProps<{
  auction: AuctionDetail;
}>();

const emit = defineEmits<{
  (e: 'bid-placed'): void;
}>();

const router = useRouter();
const auctionStore = useAuctionStore();
const authStore = useAuthStore();

const activeTab = ref<'quick' | 'proxy'>('quick');
const customProxyAmount = ref<number>(
  Math.max(props.auction.min_next_bid + 500, props.auction.min_next_bid)
);
const confirmBuyItNow = ref(false);

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
const userWalletBalance = computed(() => Number(props.auction.userWalletBalance ?? 0));
const hasInsufficientQuickBalance = computed(() => {
  return authStore.isAuthenticated && userWalletBalance.value < quickBidAmount.value;
});
const hasInsufficientProxyBalance = computed(() => {
  return authStore.isAuthenticated && userWalletBalance.value < customProxyAmount.value;
});

const formatNumber = (val: number) => {
  return Number(val || 0).toLocaleString('en-PH');
};

const handleQuickBid = async () => {
  if (isWinning.value || isEnded.value) return;

  if (!authStore.isAuthenticated) {
    openAuth();
    return;
  }

  if (hasInsufficientQuickBalance.value) {
    auctionStore.errorMessage = `Insufficient wallet balance (Available: ₱${formatNumber(userWalletBalance.value)}, Required: ₱${formatNumber(quickBidAmount.value)}). Please top up your wallet first.`;
    router.push('/wallet');
    return;
  }

  try {
    await auctionStore.placeQuickBid(props.auction.id, quickBidAmount.value);
    emit('bid-placed');
  } catch {
    // Error is set in store
  }
};

const handleProxySubmit = async () => {
  if (isWinning.value || isEnded.value) return;

  if (!authStore.isAuthenticated) {
    openAuth();
    return;
  }

  if (customProxyAmount.value < props.auction.min_next_bid) {
    auctionStore.errorMessage = `Max proxy amount must be at least ₱${formatNumber(props.auction.min_next_bid)}.`;
    return;
  }

  if (hasInsufficientProxyBalance.value) {
    auctionStore.errorMessage = `Insufficient wallet balance for Proxy Cap (Available: ₱${formatNumber(userWalletBalance.value)}, Required: ₱${formatNumber(customProxyAmount.value)}). Please top up your wallet first.`;
    router.push('/wallet');
    return;
  }

  try {
    await auctionStore.setProxyBid(props.auction.id, customProxyAmount.value);
    emit('bid-placed');
  } catch {
    // Error is set in store
  }
};

const handleBuyItNow = async () => {
  if (isEnded.value) return;

  if (!authStore.isAuthenticated) {
    openAuth();
    return;
  }

  const buyNowPrice = Number(props.auction.buy_it_now_price ?? 0);
  if (userWalletBalance.value < buyNowPrice) {
    auctionStore.errorMessage = `Insufficient wallet balance for Buy It Now (Available: ₱${formatNumber(userWalletBalance.value)}, Required: ₱${formatNumber(buyNowPrice)}). Please top up your wallet first.`;
    router.push('/wallet');
    return;
  }

  try {
    await auctionStore.buyItNow(props.auction.id);
    confirmBuyItNow.value = false;
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
    <!-- Reserve Price Status + Anti-Snipe Popcorn Badge Bar -->
    <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80 text-xs">
      <div class="flex items-center gap-2">
        <span
          v-if="auction.has_reserve"
          class="px-2.5 py-1 rounded-full font-black text-[11px] border flex items-center gap-1.5"
          :class="
            auction.is_reserve_met
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          "
        >
          <span>{{ auction.is_reserve_met ? '✓ Reserve Price Met' : '🔒 Reserve Not Yet Met' }}</span>
        </span>
        <span
          v-else
          class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]"
        >
          ✓ No Hidden Reserve
        </span>

        <span
          class="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold text-[11px]"
          title="Popcorn Anti-Snipe timer automatically extends the auction when a bid is placed in the final minutes"
        >
          🍿 Anti-Snipe Active
          <template v-if="auction.extensions_count && auction.extensions_count > 0">
            ({{ auction.extensions_count }}x extended)
          </template>
        </span>
      </div>

      <!-- User Wallet Balance Shortcut -->
      <button
        type="button"
        class="px-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
        @click="router.push('/wallet')"
      >
        <span>💳 Wallet:</span>
        <span class="font-mono font-black text-amber-400">
          ₱{{ formatNumber(auction.userWalletBalance ?? 0) }}
        </span>
        <span v-if="auction.userHeldBalance && auction.userHeldBalance > 0" class="text-slate-400 font-mono">
          (🔒 ₱{{ formatNumber(auction.userHeldBalance) }} held)
        </span>
      </button>
    </div>

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
              Your previous bid hold was automatically released back to your Wallet. Increase your bid to reclaim the lead!
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

    <!-- BUY IT NOW INSTANT BUYOUT BANNER (When enabled and current_price < buy_it_now_price) -->
    <div
      v-if="auction.can_buy_it_now && auction.buy_it_now_price && !isEnded"
      class="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-950 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3"
    >
      <div>
        <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
          ⚡ Instant Buyout Available
        </span>
        <p class="text-sm font-black text-white">
          Buy It Now for <span class="font-mono text-emerald-300">₱{{ formatNumber(auction.buy_it_now_price) }}</span>
        </p>
        <p class="text-[11px] text-slate-300">
          Instantly closes the auction, wins the lot immediately, and releases all competing bid holds.
        </p>
      </div>

      <div v-if="!confirmBuyItNow">
        <button
          type="button"
          :disabled="auctionStore.isSubmitting"
          class="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
          @click="confirmBuyItNow = true"
        >
          ⚡ Buy It Now (₱{{ formatNumber(auction.buy_it_now_price) }})
        </button>
      </div>
      <div v-else class="flex items-center gap-2">
        <button
          type="button"
          :disabled="auctionStore.isSubmitting"
          class="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs cursor-pointer"
          @click="handleBuyItNow"
        >
          ✓ Confirm Instant Purchase
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
          @click="confirmBuyItNow = false"
        >
          Cancel
        </button>
      </div>
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
        <span>🤖 Auto-Bid (Proxy Cap)</span>
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

      <!-- Insufficient Balance Prompt Card -->
      <div
        v-if="hasInsufficientQuickBalance && !isWinning && !isEnded"
        class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs"
      >
        <div class="space-y-0.5">
          <p class="font-bold text-amber-300">Wallet balance required to bid</p>
          <p class="text-[11px] text-slate-300">
            Available: <span class="font-mono text-white">₱{{ formatNumber(userWalletBalance) }}</span> (Needs ₱{{ formatNumber(quickBidAmount) }})
          </p>
        </div>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-md transition-all"
          @click="router.push('/wallet')"
        >
          + Top Up Wallet
        </button>
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
        Bids place an escrow hold via <code>WalletService-&gt;holdFunds()</code> and automatically refund outbid users via <code>releaseFunds()</code>.
      </p>
    </div>

    <!-- Tab 2: Auto-Bid (Proxy) -->
    <div v-else class="space-y-3 pt-1">
      <div>
        <label class="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
          <span>Set Your Maximum Proxy Cap</span>
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

      <!-- Insufficient Balance Prompt Card for Proxy -->
      <div
        v-if="hasInsufficientProxyBalance && !isWinning && !isEnded"
        class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs"
      >
        <div class="space-y-0.5">
          <p class="font-bold text-amber-300">Wallet balance required for Proxy Cap</p>
          <p class="text-[11px] text-slate-300">
            Available: <span class="font-mono text-white">₱{{ formatNumber(userWalletBalance) }}</span> (Cap: ₱{{ formatNumber(customProxyAmount) }})
          </p>
        </div>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-md transition-all"
          @click="router.push('/wallet')"
        >
          + Top Up Wallet
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
          <span>Set Max Auto-Bid Cap (₱{{ formatNumber(customProxyAmount) }})</span>
          <span>🤖</span>
        </template>
      </button>

      <!-- Explanation Box -->
      <div class="p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <p class="font-bold text-slate-300 flex items-center gap-1.5">
          <span>🛡️</span>
          <span>How Proxy Auto-Bidding &amp; Escrow Works:</span>
        </p>
        <p class="leading-relaxed">
          Enter your maximum secret ceiling. The engine incrementally outbids competitors by ₱{{ formatNumber(auction.bid_increment) }} up to your cap, holding your cap in escrow and immediately releasing it if another collector exceeds your maximum.
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
