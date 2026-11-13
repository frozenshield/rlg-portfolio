<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RaffleTicketSlot } from '../types';

const props = defineProps<{
  totalSlots: number;
  slotPrice: number;
  tickets: RaffleTicketSlot[];
  currentUserId?: number | null;
  winnerSlot?: number | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select-slot', slotNumber: number): void;
}>();

const filterMode = ref<'all' | 'available' | 'mine'>('all');

// Map slot_number (1..100) -> ticket object for O(1) lookup
const ticketBySlotMap = computed(() => {
  const map = new Map<number, RaffleTicketSlot>();
  for (const t of props.tickets || []) {
    map.set(Number(t.slot_number), t);
  }
  return map;
});

const myOwnedSlotsCount = computed(() => {
  if (!props.currentUserId) return 0;
  return (props.tickets || []).filter((t) => Number(t.user_id) === Number(props.currentUserId)).length;
});

const availableSlotsCount = computed(() => {
  return Math.max(0, (props.totalSlots || 100) - (props.tickets?.length || 0));
});

const slotsArray = computed(() => {
  const total = props.totalSlots || 100;
  return Array.from({ length: total }, (_, idx) => {
    const num = idx + 1;
    const ticket = ticketBySlotMap.value.get(num) || null;
    const isOwnedByMe = Boolean(
      ticket && props.currentUserId && Number(ticket.user_id) === Number(props.currentUserId)
    );
    const isWinner = Boolean(props.winnerSlot && Number(props.winnerSlot) === num);
    return {
      slotNumber: num,
      ticket,
      isAvailable: !ticket,
      isOwnedByMe,
      isTakenByOther: Boolean(ticket && !isOwnedByMe),
      isWinner,
    };
  });
});

const pickRandomAvailableSlot = () => {
  const openSlots = slotsArray.value.filter((s) => s.isAvailable);
  if (openSlots.length === 0) return;
  const randomPick = openSlots[Math.floor(Math.random() * openSlots.length)];
  if (randomPick) {
    emit('select-slot', randomPick.slotNumber);
  }
};
</script>

<template>
  <div class="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
    <!-- Top Legend & Quick Lucky Pick Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
      <div>
        <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
          <span>🎯</span>
          <span>Interactive 10&times;10 Collector Avatar Board (Slots 1&ndash;{{ totalSlots }})</span>
        </h3>
        <p class="text-xs text-slate-400 mt-0.5">
          Click any glowing green tile to claim that lucky number with 1-click Wallet checkout.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          :disabled="disabled || availableSlotsCount === 0"
          class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-40 transition-all flex items-center gap-1.5"
          @click="pickRandomAvailableSlot"
        >
          <span>🍀</span>
          <span>Pick Lucky Random Slot</span>
        </button>
      </div>
    </div>

    <!-- Color-Coded Status Legend & Filter Pills -->
    <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-3.5 rounded-md bg-emerald-500/20 border border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></span>
          <span class="text-slate-300 font-bold">
            Available ({{ availableSlotsCount }})
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse"></span>
          <span class="text-amber-300 font-black">
            Owned by You ({{ myOwnedSlotsCount }})
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3.5 h-3.5 rounded-full bg-slate-700 border border-slate-500"></span>
          <span class="text-slate-400 font-semibold">
            Taken by Collector ({{ (tickets?.length || 0) - myOwnedSlotsCount }})
          </span>
        </div>
      </div>

      <!-- Filter View Toggle -->
      <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
          :class="filterMode === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'"
          @click="filterMode = 'all'"
        >
          All 100
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
          :class="filterMode === 'available' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'"
          @click="filterMode = 'available'"
        >
          Open Only
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
          :class="filterMode === 'mine' ? 'bg-amber-400/20 text-amber-300' : 'text-slate-400 hover:text-white'"
          @click="filterMode = 'mine'"
        >
          My Slots
        </button>
      </div>
    </div>

    <!-- 10x10 INTERACTIVE AVATAR GRID -->
    <div class="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5 select-none">
      <div
        v-for="slot in slotsArray"
        :key="slot.slotNumber"
        class="relative aspect-square group"
        :class="[
          filterMode === 'available' && !slot.isAvailable ? 'opacity-20 pointer-events-none' : '',
          filterMode === 'mine' && !slot.isOwnedByMe ? 'opacity-20 pointer-events-none' : '',
        ]"
      >
        <!-- CASE 1: AVAILABLE SLOT (Glowing Green Clickable Tile with Slot Number) -->
        <button
          v-if="slot.isAvailable"
          type="button"
          :disabled="disabled"
          class="w-full h-full rounded-2xl bg-emerald-950/40 hover:bg-emerald-500/25 border border-emerald-500/40 hover:border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(52,211,153,0.55)] flex flex-col items-center justify-center transition-all duration-150 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          @click="emit('select-slot', slot.slotNumber)"
        >
          <span class="font-mono font-black text-xs sm:text-sm text-emerald-300 group-hover:text-white">
            {{ String(slot.slotNumber).padStart(2, '0') }}
          </span>
          <span class="text-[8px] font-bold uppercase tracking-tighter text-emerald-400/70 group-hover:text-emerald-200 hidden sm:block">
            OPEN
          </span>
        </button>

        <!-- CASE 2: TAKEN SLOT (Removes Number & Dynamically Renders Purchasing User's Avatar) -->
        <div
          v-else-if="slot.ticket"
          class="w-full h-full rounded-2xl p-1 flex items-center justify-center relative transition-all duration-200"
          :class="[
            slot.isWinner
              ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-rose-500 ring-4 ring-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.95)] scale-105 z-20'
              : slot.isOwnedByMe
              ? 'bg-amber-500/20 border-2 border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.65)] animate-pulse-gold'
              : 'bg-slate-950/90 border border-slate-800/90 opacity-75 hover:opacity-100',
          ]"
        >
          <!-- Purchasing User's Avatar (w-full h-full rounded-full object-cover border-2) -->
          <img
            :src="slot.ticket.user_avatar"
            :alt="slot.ticket.user_name"
            class="w-full h-full rounded-full object-cover border-2 transition-transform duration-200 group-hover:scale-105"
            :class="
              slot.isOwnedByMe
                ? 'border-amber-300'
                : 'border-slate-600 grayscale-[35%] group-hover:grayscale-0'
            "
          />

          <!-- Small Corner Slot Badge on Hover or Winner Crown -->
          <span
            v-if="slot.isWinner"
            class="absolute -top-2 -right-1 text-sm drop-shadow"
          >
            👑
          </span>
          <span
            v-else-if="slot.isOwnedByMe"
            class="absolute -bottom-1 right-0 px-1 rounded bg-amber-400 text-slate-950 font-mono font-black text-[8px] leading-tight shadow"
          >
            YOU
          </span>

          <!-- Smooth Hover Tooltip Displaying the User's Name & Slot Number -->
          <div
            class="pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform translate-y-1 group-hover:translate-y-0 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 px-2.5 py-1.5 rounded-xl bg-slate-950/95 border border-slate-700 shadow-xl whitespace-nowrap text-center"
          >
            <p class="text-[10px] font-black text-white">
              {{ slot.ticket.user_name }}
              <span v-if="slot.isOwnedByMe" class="text-amber-400">(You)</span>
            </p>
            <p class="text-[9px] font-mono text-amber-300">
              Slot #{{ slot.slotNumber }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulseGold {
  0%,
  100% {
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.45);
  }
  50% {
    box-shadow: 0 0 24px rgba(251, 191, 36, 0.85);
  }
}
.animate-pulse-gold {
  animation: pulseGold 2s ease-in-out infinite;
}
</style>
