<script setup lang="ts">
import { ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    currentPrice: number;
    bidIncrement?: number;
    currencySymbol?: string;
  }>(),
  {
    bidIncrement: 50,
    currencySymbol: '₱',
  }
);

const isFlashing = ref(false);
let flashTimeout: any = null;

watch(
  () => props.currentPrice,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      isFlashing.value = true;
      if (flashTimeout) clearTimeout(flashTimeout);
      flashTimeout = setTimeout(() => {
        isFlashing.value = false;
      }, 700);
    }
  }
);

const formatCurrency = (val: number) => {
  return Number(val || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
</script>

<template>
  <div
    class="relative p-5 rounded-3xl border transition-all duration-500 overflow-hidden"
    :class="[
      isFlashing
        ? 'bg-emerald-500/15 border-emerald-400 ring-4 ring-emerald-400/25 shadow-lg shadow-emerald-500/10'
        : 'bg-slate-900/90 border-slate-800 shadow-md',
    ]"
  >
    <!-- Live Pulse Dot Indicator -->
    <div class="flex items-center justify-between gap-3 mb-2">
      <span class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <span class="relative flex h-2.5 w-2.5">
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            :class="isFlashing ? 'bg-emerald-400' : 'bg-amber-400'"
          ></span>
          <span
            class="relative inline-flex rounded-full h-2.5 w-2.5"
            :class="isFlashing ? 'bg-emerald-400' : 'bg-amber-400'"
          ></span>
        </span>
        <span>Current Bid Price</span>
      </span>

      <span
        v-if="isFlashing"
        class="text-[11px] font-black text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 animate-bounce"
      >
        ⚡ New Highest Bid!
      </span>
      <span v-else class="text-[11px] font-medium text-slate-400">
        Increment: +{{ currencySymbol }}{{ bidIncrement }}
      </span>
    </div>

    <!-- Live Animated Price Typography -->
    <div class="flex items-baseline gap-2">
      <span class="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
        {{ currencySymbol }}
      </span>
      <Transition mode="out-in" name="price-flip">
        <h2
          :key="currentPrice"
          class="text-4xl sm:text-5xl font-black tracking-tight font-mono transition-colors duration-300"
          :class="isFlashing ? 'text-emerald-400 scale-[1.02]' : 'text-white'"
        >
          {{ formatCurrency(currentPrice) }}
        </h2>
      </Transition>
    </div>

    <p class="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
      <span class="text-slate-500">🔒</span>
      <span>Secured by pessimistic database locks with microsecond ledger verification.</span>
    </p>
  </div>
</template>

<style scoped>
.price-flip-enter-active,
.price-flip-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.price-flip-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}
.price-flip-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}
</style>
