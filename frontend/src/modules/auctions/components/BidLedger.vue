<script setup lang="ts">
import type { BidRecord } from '../types';

defineProps<{
  bids: BidRecord[];
}>();

const formatCurrency = (val: number) => {
  return Number(val || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
</script>

<template>
  <div class="bg-slate-900/95 rounded-3xl border border-slate-800 p-5 shadow-xl space-y-3">
    <!-- Ledger Header -->
    <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
      <div class="flex items-center gap-2">
        <span class="text-base">📜</span>
        <h3 class="text-xs font-black uppercase tracking-wider text-slate-300">
          Live Bid Ledger (The Feed)
        </h3>
      </div>
      <span class="text-[11px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
        {{ bids.length }} {{ bids.length === 1 ? 'Bid' : 'Bids' }}
      </span>
    </div>

    <!-- Empty State -->
    <div v-if="bids.length === 0" class="py-8 text-center text-slate-400 text-xs">
      <span class="text-2xl block mb-1">🏁</span>
      <span>No bids placed yet. Be the first to place an opening bid!</span>
    </div>

    <!-- Scrollable Animated Bid History Feed -->
    <div v-else class="overflow-y-auto max-h-64 pr-1 space-y-2 custom-scrollbar">
      <TransitionGroup name="bid-slide" tag="div" class="space-y-2">
        <div
          v-for="(bid, index) in bids"
          :key="bid.id"
          class="p-3 rounded-2xl flex items-center justify-between gap-3 transition-all duration-300 border"
          :class="[
            index === 0
              ? 'bg-amber-400/10 border-amber-400/30 text-white shadow-xs'
              : 'bg-slate-950/70 border-slate-800/60 text-slate-300 hover:border-slate-700',
          ]"
        >
          <!-- Left: Rank / Crown + Masked Username + Badge -->
          <div class="flex items-center gap-2.5 min-w-0">
            <span
              class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              :class="[
                index === 0
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400',
              ]"
            >
              {{ index === 0 ? '👑' : `#${bids.length - index}` }}
            </span>

            <div class="truncate">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-extrabold font-mono text-slate-200 truncate">
                  {{ bid.masked_username }}
                </span>
                <span
                  v-if="bid.is_proxy"
                  class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 border border-slate-700"
                  title="Auto-placed by proxy engine"
                >
                  Auto
                </span>
              </div>
              <span class="text-[10px] text-slate-400 block sm:hidden">
                {{ bid.created_at_human }}
              </span>
            </div>
          </div>

          <!-- Right: Price + Relative Timestamp -->
          <div class="text-right shrink-0">
            <span
              class="text-xs sm:text-sm font-black font-mono block"
              :class="index === 0 ? 'text-amber-400' : 'text-slate-100'"
            >
              ₱{{ formatCurrency(bid.amount) }}
            </span>
            <span class="text-[10px] text-slate-400 hidden sm:block">
              {{ bid.created_at_human }}
            </span>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.bid-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.bid-slide-leave-active {
  transition: all 0.25s ease;
}
.bid-slide-enter-from {
  opacity: 0;
  transform: translateY(-16px) scale(0.97);
}
.bid-slide-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Custom scrollbar styling */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.6);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(51, 65, 85, 0.8);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 1);
}
</style>
