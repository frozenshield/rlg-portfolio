<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { RaffleTicketSlot } from '../types';

const props = defineProps<{
  raffleName: string;
  raffleImage: string;
  winnerSlot: number;
  winnerName?: string | null;
  winnerAvatar?: string | null;
  tickets: RaffleTicketSlot[];
  currentUserId?: number | null;
}>();

const emit = defineEmits<{
  (e: 'draw-finished'): void;
  (e: 'replay'): void;
}>();

const stage = ref<'countdown' | 'spinning' | 'winner'>('countdown');
const countdownSeconds = ref(3);
const currentReelNumber = ref<number>(1);
const reelRibbon = ref<Array<{ slot: number; name: string; avatar: string }>>([]);
const ribbonOffsetPx = ref(0);
const confettiCanvasRef = ref<HTMLCanvasElement | null>(null);

let animFrameId: number | null = null;
let confettiFrameId: number | null = null;

const winningTicket = computed(() => {
  return (
    props.tickets.find((t) => Number(t.slot_number) === Number(props.winnerSlot)) || {
      slot_number: props.winnerSlot,
      user_id: 0,
      user_name: props.winnerName || 'Lucky Collector',
      user_avatar:
        props.winnerAvatar ||
        `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Slot${props.winnerSlot}`,
    }
  );
});

const isCurrentUserWinner = computed(() => {
  return Boolean(
    props.currentUserId &&
      winningTicket.value &&
      Number(winningTicket.value.user_id) === Number(props.currentUserId)
  );
});

// Build an 85-card roulette strip where index 72 is guaranteed to be the backend-provided winner_slot
const TARGET_INDEX = 72;
const CARD_WIDTH_PX = 128; // 116px card + 12px gap

const buildRouletteRibbon = () => {
  const pool =
    props.tickets.length > 0
      ? props.tickets
      : Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          raffle_id: 1,
          slot_number: i + 1,
          user_id: i + 1,
          user_name: `Collector #${i + 1}`,
          user_avatar: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Collector${i + 1}`,
          status: 'confirmed' as const,
        }));

  const items: Array<{ slot: number; name: string; avatar: string }> = [];
  for (let i = 0; i < 85; i++) {
    if (i === TARGET_INDEX) {
      items.push({
        slot: Number(props.winnerSlot),
        name: winningTicket.value.user_name,
        avatar: winningTicket.value.user_avatar,
      });
    } else {
      const randomTicket = pool[Math.floor(Math.random() * pool.length)];
      items.push({
        slot: Number(randomTicket.slot_number),
        name: randomTicket.user_name,
        avatar: randomTicket.user_avatar,
      });
    }
  }
  reelRibbon.value = items;
};

const launchConfettiCanvas = () => {
  const canvas = confettiCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 520;

  const colors = ['#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#a78bfa', '#f87171'];
  const particles = Array.from({ length: 130 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 160,
    y: canvas.height * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 14 - 4,
    size: Math.random() * 8 + 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * Math.PI * 2,
    vRot: (Math.random() - 0.5) * 0.25,
    gravity: 0.26,
  }));

  const renderConfetti = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.vRot;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    confettiFrameId = requestAnimationFrame(renderConfetti);
  };

  renderConfetti();
};

const startSpinSequence = () => {
  stage.value = 'countdown';
  countdownSeconds.value = 3;
  ribbonOffsetPx.value = 0;
  buildRouletteRibbon();

  const countdownTimer = setInterval(() => {
    countdownSeconds.value -= 1;
    if (countdownSeconds.value <= 0) {
      clearInterval(countdownTimer);
      runRouletteDeceleration();
    }
  }, 850);
};

const runRouletteDeceleration = () => {
  stage.value = 'spinning';
  const durationMs = 6200; // 6.2 seconds of high-tension deceleration
  const startTime = performance.now();
  const totalDistancePx = TARGET_INDEX * CARD_WIDTH_PX;

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);

    // Quintic ease-out for dramatic tension in the final few slots
    const eased = 1 - Math.pow(1 - progress, 5);
    ribbonOffsetPx.value = totalDistancePx * eased;

    const currentIdx = Math.min(
      reelRibbon.value.length - 1,
      Math.max(0, Math.round(ribbonOffsetPx.value / CARD_WIDTH_PX))
    );
    currentReelNumber.value = reelRibbon.value[currentIdx]?.slot || props.winnerSlot;

    if (progress < 1) {
      animFrameId = requestAnimationFrame(step);
    } else {
      currentReelNumber.value = props.winnerSlot;
      stage.value = 'winner';
      setTimeout(() => {
        launchConfettiCanvas();
      }, 60);
      emit('draw-finished');
    }
  };

  animFrameId = requestAnimationFrame(step);
};

onMounted(() => {
  startSpinSequence();
});

onBeforeUnmount(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (confettiFrameId) cancelAnimationFrame(confettiFrameId);
});
</script>

<template>
  <div class="relative bg-slate-900/95 border-2 border-amber-400/60 rounded-3xl p-6 sm:p-10 shadow-[0_0_70px_rgba(251,191,36,0.25)] overflow-hidden min-h-[480px] flex flex-col items-center justify-center text-center">
    <!-- Celebratory Confetti HTML5 Canvas Overlay -->
    <canvas
      ref="confettiCanvasRef"
      class="pointer-events-none absolute inset-0 w-full h-full z-30"
    ></canvas>

    <!-- STAGE 1: 100/100 LOCKED IN COUNTDOWN -->
    <div v-if="stage === 'countdown'" class="relative z-20 space-y-5 py-10">
      <span class="px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-black uppercase tracking-widest animate-pulse">
        🔥 100 / 100 Slots Claimed • WebSocket Draw Triggered
      </span>
      <h2 class="text-3xl sm:text-5xl font-black text-white">
        Live Grail Draw Starting In...
      </h2>
      <div class="w-28 h-28 mx-auto rounded-full bg-amber-400 text-slate-950 font-mono font-black text-5xl flex items-center justify-center shadow-[0_0_50px_rgba(251,191,36,0.8)] animate-bounce">
        {{ countdownSeconds }}
      </div>
      <p class="text-xs text-slate-300">
        Synchronizing all active viewers via Laravel Reverb / Echo WebSocket...
      </p>
    </div>

    <!-- STAGE 2: HIGH-TENSION NUMBER & AVATAR ROULETTE -->
    <div v-else-if="stage === 'spinning'" class="relative z-20 w-full space-y-6 py-4">
      <div class="space-y-1">
        <span class="text-xs font-black uppercase tracking-widest text-amber-400 block">
          🎲 High-Speed Number Roulette Decelerating...
        </span>
        <div class="text-4xl sm:text-6xl font-mono font-black text-white">
          SLOT #{{ String(currentReelNumber).padStart(2, '0') }}
        </div>
      </div>

      <!-- Horizontal Roulette Window -->
      <div class="relative w-full max-w-3xl mx-auto h-44 bg-slate-950 rounded-3xl border-2 border-amber-400/60 overflow-hidden flex items-center shadow-inner">
        <!-- Center Golden Laser Pointer Marker -->
        <div class="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-amber-400 z-30 shadow-[0_0_20px_#fbbf24]">
          <div class="w-5 h-5 -ml-2 -mt-1 rotate-45 bg-amber-400"></div>
        </div>

        <!-- Edge Vignette Gradients -->
        <div class="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-20"></div>
        <div class="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-20"></div>

        <!-- Moving Ribbon Track -->
        <div
          class="flex items-center gap-3 will-change-transform"
          :style="{
            transform: `translate3d(calc(50% - ${ribbonOffsetPx}px - 58px), 0, 0)`,
          }"
        >
          <div
            v-for="(entry, idx) in reelRibbon"
            :key="idx"
            class="w-[116px] h-32 shrink-0 rounded-2xl bg-slate-900 border border-slate-700 p-2.5 flex flex-col items-center justify-between"
          >
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-black text-xs">
              #{{ String(entry.slot).padStart(2, '0') }}
            </span>
            <img
              :src="entry.avatar"
              :alt="entry.name"
              class="w-12 h-12 rounded-full object-cover border-2 border-amber-400"
            />
            <span class="text-[10px] font-bold text-slate-200 truncate w-full">
              {{ entry.name }}
            </span>
          </div>
        </div>
      </div>

      <p class="text-xs text-slate-400 animate-pulse">
        Hold tight! Locking onto the cryptographically verified winning slot...
      </p>
    </div>

    <!-- STAGE 3: CELEBRATORY WINNER REVEAL -->
    <div v-else class="relative z-20 space-y-6 py-4 max-w-xl mx-auto">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest shadow-lg">
        <span>👑 Official Raffle Winner Crowned!</span>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-6 bg-slate-950/90 border-2 border-amber-400 rounded-3xl p-6 shadow-[0_0_45px_rgba(251,191,36,0.35)]">
        <div class="relative">
          <img
            :src="winningTicket.user_avatar"
            :alt="winningTicket.user_name"
            class="w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-xl"
          />
          <span class="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-xs shadow">
            SLOT #{{ String(winnerSlot).padStart(2, '0') }}
          </span>
        </div>

        <div class="text-center sm:text-left space-y-1">
          <span class="text-xs font-bold uppercase tracking-wider text-amber-300 block">
            Winning Collector
          </span>
          <h3 class="text-2xl sm:text-3xl font-black text-white">
            {{ winningTicket.user_name }}
            <span v-if="isCurrentUserWinner" class="text-emerald-400">(YOU!)</span>
          </h3>
          <p class="text-xs text-slate-300">
            Won <strong class="text-amber-300">{{ raffleName }}</strong> — automatically credited to Digital Collector Vault!
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          class="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer transition-colors"
          @click="startSpinSequence"
        >
          🔄 Replay Roulette Animation
        </button>
        <button
          type="button"
          class="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs cursor-pointer transition-colors"
          @click="emit('replay')"
        >
          🎯 Return to 10&times;10 Avatar Grid
        </button>
      </div>
    </div>
  </div>
</template>

