<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    endTime: string;
    bidsCount?: number;
  }>(),
  {
    bidsCount: 0,
  }
);

const emit = defineEmits<{
  (e: 'time-up'): void;
}>();

const now = ref(Date.now());
let timerInterval: any = null;
let hasEmittedTimeUp = false;

onMounted(() => {
  timerInterval = setInterval(() => {
    now.value = Date.now();
    if (diffInSeconds.value <= 0 && !hasEmittedTimeUp) {
      hasEmittedTimeUp = true;
      emit('time-up');
    }
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

const diffInSeconds = computed(() => {
  const target = new Date(props.endTime).getTime();
  const diff = Math.floor((target - now.value) / 1000);
  return Math.max(0, diff);
});

const isEnded = computed(() => diffInSeconds.value <= 0);

// Anti-sniping threshold (< 5 minutes / 300 seconds)
const isAntiSnipingActive = computed(() => {
  return diffInSeconds.value > 0 && diffInSeconds.value <= 300;
});

const days = computed(() => Math.floor(diffInSeconds.value / 86400));
const hours = computed(() => Math.floor((diffInSeconds.value % 86400) / 3600));
const minutes = computed(() => Math.floor((diffInSeconds.value % 3600) / 60));
const seconds = computed(() => diffInSeconds.value % 60);

const pad = (n: number) => String(n).padStart(2, '0');
</script>

<template>
  <div
    class="p-5 rounded-3xl border transition-all duration-300"
    :class="[
      isEnded
        ? 'bg-slate-900/60 border-slate-800'
        : isAntiSnipingActive
          ? 'bg-rose-950/30 border-rose-500/50 ring-2 ring-rose-500/30 shadow-lg shadow-rose-950/20'
          : 'bg-slate-900/90 border-slate-800',
    ]"
  >
    <!-- Header with Anti-sniping indicator badge -->
    <div class="flex items-center justify-between gap-2 mb-3">
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <span>⏱️</span>
        <span>{{ isEnded ? 'Auction Status' : 'Time Remaining' }}</span>
      </span>

      <span
        v-if="isEnded && bidsCount === 0"
        class="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
      >
        🔄 Resetting (No Bids Yet)
      </span>
      <span
        v-else-if="isEnded"
        class="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700"
      >
        Auction Closed
      </span>
      <span
        v-else-if="isAntiSnipingActive"
        class="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse flex items-center gap-1"
      >
        <span>⚡ Anti-Sniping Active (&lt; 5m)</span>
      </span>
      <span
        v-else
        class="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full"
      >
        Live Bidding
      </span>
    </div>

    <!-- Clock Digits Display -->
    <div v-if="!isEnded" class="grid grid-cols-4 gap-2 text-center">
      <!-- Days -->
      <div
        class="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center justify-center"
      >
        <span
          class="text-2xl sm:text-3xl font-black font-mono tracking-tight"
          :class="isAntiSnipingActive ? 'text-red-500 animate-pulse' : 'text-white'"
        >
          {{ pad(days) }}
        </span>
        <span class="text-[10px] uppercase font-bold text-slate-400">Days</span>
      </div>

      <!-- Hours -->
      <div
        class="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center justify-center"
      >
        <span
          class="text-2xl sm:text-3xl font-black font-mono tracking-tight"
          :class="isAntiSnipingActive ? 'text-red-500 animate-pulse' : 'text-white'"
        >
          {{ pad(hours) }}
        </span>
        <span class="text-[10px] uppercase font-bold text-slate-400">Hours</span>
      </div>

      <!-- Minutes -->
      <div
        class="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center justify-center"
      >
        <span
          class="text-2xl sm:text-3xl font-black font-mono tracking-tight"
          :class="isAntiSnipingActive ? 'text-red-500 animate-pulse' : 'text-white'"
        >
          {{ pad(minutes) }}
        </span>
        <span class="text-[10px] uppercase font-bold text-slate-400">Mins</span>
      </div>

      <!-- Seconds -->
      <div
        class="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center justify-center"
      >
        <span
          class="text-2xl sm:text-3xl font-black font-mono tracking-tight"
          :class="isAntiSnipingActive ? 'text-red-500 animate-pulse' : 'text-amber-400'"
        >
          {{ pad(seconds) }}
        </span>
        <span class="text-[10px] uppercase font-bold text-slate-400">Secs</span>
      </div>
    </div>

    <!-- Closed State -->
    <div v-else class="text-center py-3 bg-slate-950/80 rounded-2xl border border-slate-800">
      <p class="text-base font-extrabold text-slate-300">Bidding has concluded for this item</p>
      <p class="text-xs text-slate-400 mt-0.5">Final bid ledger archived into verified sales history.</p>
    </div>

    <!-- Helper Explanation -->
    <p v-if="isAntiSnipingActive && !isEnded" class="text-[11px] text-rose-300/90 font-medium mt-2 flex items-center gap-1.5">
      <span>🛡️</span>
      <span>Anti-Sniping is on: Bids placed in the final 5 minutes auto-extend the auction by 5 mins.</span>
    </p>
  </div>
</template>
