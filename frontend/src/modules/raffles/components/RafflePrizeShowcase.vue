<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  itemName: string;
  itemImage: string;
  gradeBadge?: string;
  retailValue: number;
  slotPrice: number;
  takenSlotsCount: number;
  totalSlots: number;
  status: 'open' | 'drawing' | 'completed';
}>();

const cardContainerRef = ref<HTMLElement | null>(null);
const isHovering = ref(false);
const rotateX = ref(0);
const rotateY = ref(0);
const glareX = ref(50);
const glareY = ref(50);
const holoAngle = ref(125);

const handleMouseMove = (e: MouseEvent) => {
  if (!cardContainerRef.value) return;
  const rect = cardContainerRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const pctX = Math.max(0, Math.min(100, (x / rect.width) * 100));
  const pctY = Math.max(0, Math.min(100, (y / rect.height) * 100));

  // Tilt between -18deg and +18deg
  rotateY.value = Number((((pctX - 50) / 50) * 18).toFixed(2));
  rotateX.value = Number((((50 - pctY) / 50) * 18).toFixed(2));
  glareX.value = Math.round(pctX);
  glareY.value = Math.round(pctY);
  holoAngle.value = Math.round(110 + (pctX - 50) * 1.1);
};

const handleMouseEnter = () => {
  isHovering.value = true;
};

const handleMouseLeave = () => {
  isHovering.value = false;
  rotateX.value = 0;
  rotateY.value = 0;
  glareX.value = 50;
  glareY.value = 50;
};

const progressPct = computed(() => {
  if (!props.totalSlots) return 0;
  return Math.min(100, Math.round((props.takenSlotsCount / props.totalSlots) * 100));
});

const formatCurrency = (val: number) => {
  return Number(val || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
</script>

<template>
  <div class="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
    <!-- Ambient Backlight Glow -->
    <div
      class="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-gradient-to-br from-amber-400/20 via-fuchsia-500/15 to-indigo-500/20 blur-3xl"
    ></div>

    <!-- Top Cert & Status Header -->
    <div class="relative z-10 flex items-center justify-between gap-2">
      <span
        class="px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-[10px] font-mono font-black text-amber-300 uppercase tracking-widest"
      >
        🏆 {{ gradeBadge || 'PSA 10 GEM MINT' }}
      </span>
      <span
        class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5"
        :class="
          status === 'open'
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
            : status === 'drawing'
            ? 'bg-amber-500/20 text-amber-300 border-amber-400 animate-pulse'
            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
        "
      >
        <span
          v-if="status === 'open'"
          class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"
        ></span>
        <span>
          {{
            status === 'open'
              ? 'Slots Open'
              : status === 'drawing'
              ? '🎲 Drawing Live!'
              : '✓ Draw Completed'
          }}
        </span>
      </span>
    </div>

    <!-- 3D HOLOGRAPHIC FLOATING SLAB STAGE -->
    <div
      ref="cardContainerRef"
      class="relative z-10 py-4 flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
      style="perspective: 1200px"
      @mousemove="handleMouseMove"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div
        class="relative w-64 sm:w-72 aspect-[3/4.2] rounded-3xl p-4 bg-gradient-to-b from-slate-800/90 via-slate-950 to-slate-900 border-2 border-amber-400/60 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(251,191,36,0.22)] transition-transform duration-150 ease-out flex flex-col items-center justify-center overflow-hidden"
        :class="!isHovering ? 'animate-float-slab' : ''"
        :style="{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovering ? 1.04 : 1}, ${isHovering ? 1.04 : 1}, 1)`,
          transformStyle: 'preserve-3d',
        }"
      >
        <!-- Inner Acrylic Bevel Frame -->
        <div
          class="pointer-events-none absolute inset-2 rounded-2xl border border-white/20 shadow-inner"
        ></div>

        <!-- Prize Slab Artwork (Levitating in Z-space) -->
        <img
          :src="itemImage"
          :alt="itemName"
          class="relative z-10 w-full h-full object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.9)] transition-transform duration-150"
          :style="{
            transform: isHovering ? 'translateZ(36px)' : 'translateZ(18px)',
          }"
        />

        <!-- Dynamic Rainbow Holographic Foil Overlay (mix-blend-color-dodge) -->
        <div
          class="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
          :style="{
            opacity: isHovering ? 0.68 : 0.28,
            mixBlendMode: 'color-dodge',
            background: `linear-gradient(${holoAngle}deg,
              transparent 10%,
              rgba(255, 0, 128, 0.45) 25%,
              rgba(255, 204, 0, 0.5) 40%,
              rgba(0, 255, 180, 0.45) 55%,
              rgba(0, 140, 255, 0.5) 70%,
              rgba(180, 0, 255, 0.45) 85%,
              transparent 95%)`,
            backgroundSize: '220% 220%',
            backgroundPosition: `${glareX}% ${glareY}%`,
          }"
        ></div>

        <!-- Specular Radial Light Glare Following Cursor -->
        <div
          class="pointer-events-none absolute inset-0 z-30 transition-opacity duration-200"
          :style="{
            opacity: isHovering ? 0.85 : 0.2,
            mixBlendMode: 'overlay',
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.85) 0%, rgba(251,191,36,0.28) 28%, transparent 65%)`,
          }"
        ></div>

        <!-- Bottom Interactive Tilt Hint -->
        <div
          class="pointer-events-none absolute bottom-3 inset-x-4 z-30 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/15 text-[10px] font-bold text-amber-300 text-center"
        >
          ✨ Move cursor to tilt 3D Holographic Slab
        </div>
      </div>
    </div>

    <!-- Prize Title & Valuation Breakdown -->
    <div class="relative z-10 space-y-4">
      <div>
        <span class="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
          Grand Raffle Grail Prize
        </span>
        <h2 class="text-lg sm:text-xl font-black text-white leading-snug mt-0.5">
          {{ itemName }}
        </h2>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">Estimated Slab Value</span>
          <span class="text-base font-mono font-black text-emerald-400">
            ₱{{ formatCurrency(retailValue) }}
          </span>
        </div>
        <div class="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/30">
          <span class="text-[10px] uppercase font-bold text-amber-300 block">Entry Cost / Slot</span>
          <span class="text-base font-mono font-black text-amber-400">
            ₱{{ formatCurrency(slotPrice) }}
          </span>
        </div>
      </div>

      <!-- Slot Fill Progress Bar -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-xs font-bold">
          <span class="text-slate-300">
            Slots Claimed:
            <strong class="font-mono text-amber-400">{{ takenSlotsCount }} / {{ totalSlots }}</strong>
          </span>
          <span class="font-mono text-emerald-400">{{ progressPct }}% Filled</span>
        </div>
        <div class="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
          <div
            class="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-fuchsia-500 transition-all duration-500"
            :style="{ width: `${progressPct}%` }"
          ></div>
        </div>
        <p class="text-[11px] text-slate-400">
          ⚡ Automatic live Number Roulette triggers immediately when Slot
          <strong class="text-white">{{ totalSlots }}/{{ totalSlots }}</strong> is purchased!
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes floatSlab {
  0%,
  100% {
    transform: translateY(0px) rotateX(2deg) rotateY(-4deg);
  }
  50% {
    transform: translateY(-8px) rotateX(-2deg) rotateY(4deg);
  }
}
.animate-float-slab {
  animation: floatSlab 4.5s ease-in-out infinite;
}
</style>

