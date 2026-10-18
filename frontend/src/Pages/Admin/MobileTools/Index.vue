<template>
  <div class="space-y-6 pb-8">
    <!-- Module Header & Sub-Navigation -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1816]/80 backdrop-blur-md p-5 rounded-2xl border border-amber-500/20 shadow-lg"
    >
      <div class="flex items-center gap-3.5">
        <div
          class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0"
        >
          <Smartphone :size="24" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight">
              Mobile Tools
            </h1>
            <span
              class="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-black text-amber-300 uppercase tracking-widest"
            >
              Phase 1
            </span>
          </div>
          <p class="text-xs sm:text-sm text-gray-400 mt-0.5">
            High-throughput field utilities for physical card capture, auto-cropping, and direct Google Drive batch ingestion.
          </p>
        </div>
      </div>

      <!-- Tool Sub-Navigation Tabs -->
      <div class="flex items-center gap-2 bg-[#0f0e0d] p-1.5 rounded-xl border border-gray-800 self-start md:self-auto">
        <button
          v-for="tab in tools"
          :key="tab.id"
          type="button"
          @click="activeTool = tab.id"
          :class="[
            'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all',
            activeTool === tab.id
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60',
          ]"
        >
          <component :is="tab.icon" :size="15" />
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.badge"
            class="px-1.5 py-0.2 rounded bg-black/30 text-[9px] font-black uppercase tracking-wider"
          >
            {{ tab.badge }}
          </span>
        </button>
      </div>
    </div>

    <!-- Active Tool View -->
    <div v-if="activeTool === 'scanner'">
      <FastBatchScanner />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Smartphone, ScanLine } from 'lucide-vue-next';
import FastBatchScanner from '@/Components/MobileTools/FastBatchScanner.vue';

const activeTool = ref<'scanner'>('scanner');

const tools = [
  {
    id: 'scanner' as const,
    label: 'Rapid-Fire Batch Card Scanner',
    icon: ScanLine,
    badge: '63:88 Auto-Crop',
  },
];
</script>

