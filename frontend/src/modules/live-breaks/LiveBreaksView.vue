<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { resolveApiUrl } from '@/shared/utils/api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useWalletStore } from '@/modules/wallet/wallet.store';

const authStore = useAuthStore();
const walletStore = useWalletStore();

interface BreakSlotItem {
  id: number;
  box_break_id: number;
  slot_name: string;
  tier_badge: string;
  price: number;
  buyer_user_id: number | null;
  status: string;
  purchased_at: string | null;
  buyer?: {
    id: number;
    name: string;
  } | null;
}

interface BoxBreakItem {
  id: number;
  title: string;
  set_name: string;
  description: string | null;
  image_url: string | null;
  stream_url: string | null;
  status: 'upcoming' | 'live' | 'completed';
  scheduled_live_at: string | null;
  slots?: BreakSlotItem[];
}

const breaks = ref<BoxBreakItem[]>([]);
const selectedBreak = ref<BoxBreakItem | null>(null);
const isLoading = ref(true);
const isClaiming = ref(false);
const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null);

const activeStreamBreak = computed(() => {
  return selectedBreak.value || breaks.value.find((b) => b.status === 'live') || breaks.value[0] || null;
});

// Converts standard YouTube or Twitch watch URLs into embeddable iframe URLs
const embedStreamUrl = computed(() => {
  const url = activeStreamBreak.value?.stream_url;
  if (!url) return null;

  // YouTube match: youtube.com/watch?v=ID or youtu.be/ID
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=0&rel=0`;
  }

  // Twitch channel match: twitch.tv/CHANNEL
  const twitchMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
  if (twitchMatch && twitchMatch[1]) {
    const parentDomain = window.location.hostname;
    return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${parentDomain}`;
  }

  // If already embed URL
  if (url.includes('/embed/')) {
    return url;
  }

  return url;
});

const fetchBreaks = async () => {
  isLoading.value = true;
  errorMsg.value = null;
  try {
    const res = await fetch(resolveApiUrl('/box-breaks'));
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      breaks.value = json.data;
      if (!selectedBreak.value && breaks.value.length > 0) {
        selectedBreak.value = breaks.value.find((b) => b.status === 'live') || breaks.value[0];
      }
    }
  } catch (e: any) {
    errorMsg.value = 'Failed to load live box breaks.';
  } finally {
    isLoading.value = false;
  }
};

const handleClaimSlot = async (slot: BreakSlotItem) => {
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal('Please sign in to claim spots in Live Box Breaks.');
    return;
  }

  const cost = Number(slot.price);
  if ((walletStore.availableBalance || 0) < cost) {
    errorMsg.value = `Insufficient wallet float to claim "${slot.slot_name}". Please top up your digital wallet.`;
    return;
  }

  if (!confirm(`Claim spot "${slot.slot_name}" for ₱${cost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}?`)) {
    return;
  }

  isClaiming.value = true;
  errorMsg.value = null;
  successMsg.value = null;

  try {
    const res = await fetch(resolveApiUrl(`/gacha/box-breaks/slots/${slot.id}/buy`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${authStore.token}`,
        'X-User-Id': String(authStore.currentUser?.id || ''),
      },
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to claim box break spot.');
    }

    successMsg.value = `Spot claimed: "${slot.slot_name}"! Check your Digital Vault upon live stream rip & ship completion.`;
    await Promise.all([fetchBreaks(), walletStore.fetchWalletSummary()]);
  } catch (e: any) {
    errorMsg.value = e.message || 'Could not claim spot.';
  } finally {
    isClaiming.value = false;
  }
};

onMounted(() => {
  fetchBreaks();
  if (authStore.isAuthenticated) {
    walletStore.fetchWalletSummary();
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#070b13] text-white py-8 sm:py-12 font-display">
    <div class="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <!-- Header Banner -->
      <div class="flex flex-col md:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
        <div class="space-y-2 text-center md:text-left">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black uppercase tracking-wider border border-rose-500/30">
            <span class="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            <span>Live HD Rip &amp; Ship Broadcast Studio</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Live Box Breaks &amp; Streaming
          </h1>
          <p class="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Watch our master break team open factory-sealed Pokémon and One Piece booster cases live. Claim your elemental spot or VIP tier, and all pulled cards are sleeved, top-loaded, and shipped to your door!
          </p>
        </div>

        <!-- Wallet float mini widget -->
        <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shrink-0 shadow-xl">
          <div class="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-2xl">
            💳
          </div>
          <div>
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Available Wallet Float
            </div>
            <div class="text-xl font-mono font-black text-amber-300">
              ₱{{ Number(authStore.isAuthenticated ? (walletStore.availableBalance || 0) : 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </div>
            <button
              v-if="!authStore.isAuthenticated"
              type="button"
              class="text-[11px] font-black text-amber-400 hover:text-amber-300 underline cursor-pointer mt-0.5"
              @click="authStore.openAuthModal('Please sign in to participate in Box Breaks.')"
            >
              Sign In to Claim Spots &rarr;
            </button>
            <router-link
              v-else
              to="/wallet"
              class="text-[11px] font-black text-amber-400 hover:text-amber-300 underline cursor-pointer mt-0.5 inline-block"
            >
              + Top Up Digital Wallet &rarr;
            </router-link>
          </div>
        </div>
      </div>

      <!-- Feedback Alerts -->
      <div v-if="successMsg" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-bold flex items-center justify-between">
        <span>✓ {{ successMsg }}</span>
        <button type="button" class="text-slate-400 hover:text-white" @click="successMsg = null">✕</button>
      </div>

      <div v-if="errorMsg" class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-bold flex items-center justify-between">
        <span>✕ {{ errorMsg }}</span>
        <button type="button" class="text-slate-400 hover:text-white" @click="errorMsg = null">✕</button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="py-20 text-center space-y-3">
        <div class="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-slate-400 text-sm font-semibold">Connecting to live break studio...</p>
      </div>

      <!-- Main Streaming & Spot Management Area -->
      <div v-else-if="activeStreamBreak" class="space-y-8">
        <!-- Interactive Live Video Stream Player (16:9) -->
        <div class="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
          <div class="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span
                class="px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-2 border"
                :class="
                  activeStreamBreak.status === 'live'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                "
              >
                <span
                  class="w-2.5 h-2.5 rounded-full"
                  :class="activeStreamBreak.status === 'live' ? 'bg-rose-500 animate-ping' : 'bg-indigo-400'"
                ></span>
                <span>{{ activeStreamBreak.status === 'live' ? 'LIVE NOW' : 'UPCOMING STREAM' }}</span>
              </span>
              <h2 class="text-sm sm:text-base font-black text-white truncate max-w-xl">
                {{ activeStreamBreak.title }}
              </h2>
            </div>

            <!-- Set Tag -->
            <span class="text-xs font-bold text-amber-400 px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/20">
              {{ activeStreamBreak.set_name }}
            </span>
          </div>

          <!-- Video Frame / Embed -->
          <div class="relative w-full aspect-video bg-black flex items-center justify-center">
            <iframe
              v-if="embedStreamUrl"
              :src="embedStreamUrl"
              class="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
            <div v-else class="text-center p-8 space-y-3">
              <span class="text-5xl">📡</span>
              <h3 class="text-lg font-bold text-white">Stream is setting up</h3>
              <p class="text-xs text-slate-400 max-w-md mx-auto">
                Our break master is preparing the studio cameras and sealed cases. Claim your spots below before broadcast starts!
              </p>
            </div>
          </div>
        </div>

        <!-- Available Tier Spots for this Break -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-black text-white flex items-center gap-2">
                <span>🎯</span>
                <span>Claim Live Break Tier Spots</span>
              </h3>
              <p class="text-xs text-slate-400">
                Choose an elemental type, trainer, or chase spot. Every pull from this category is yours!
              </p>
            </div>
            <span class="text-xs font-mono font-bold text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {{ (activeStreamBreak.slots || []).filter((s) => !s.buyer_user_id).length }} Spots Available
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="slot in activeStreamBreak.slots || []"
              :key="slot.id"
              class="rounded-2xl border p-4.5 space-y-3 transition-all duration-200"
              :class="
                slot.buyer_user_id
                  ? 'bg-slate-950/60 border-slate-800/60 opacity-60'
                  : 'bg-slate-900/90 border-slate-700/80 hover:border-amber-400/60 shadow-lg'
              "
            >
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {{ slot.tier_badge }}
                </span>
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  :class="slot.buyer_user_id ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'"
                >
                  {{ slot.buyer_user_id ? 'CLAIMED' : 'OPEN' }}
                </span>
              </div>

              <div>
                <h4 class="text-xs font-bold text-white line-clamp-2">
                  {{ slot.slot_name }}
                </h4>
                <div class="text-base font-mono font-black text-amber-300 mt-1">
                  ₱{{ Number(slot.price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                </div>
              </div>

              <div v-if="slot.buyer" class="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                Claimed by: <span class="text-white font-bold">{{ slot.buyer.name }}</span>
              </div>

              <button
                v-else
                type="button"
                :disabled="isClaiming"
                class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
                @click="handleClaimSlot(slot)"
              >
                Claim This Spot &rarr;
              </button>
            </div>
          </div>
        </div>

        <!-- Other Scheduled Breaks Selector -->
        <div v-if="breaks.length > 1" class="pt-6 border-t border-slate-800 space-y-4">
          <h3 class="text-base font-bold text-slate-300">Other Scheduled Box Breaks:</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              v-for="b in breaks"
              :key="b.id"
              type="button"
              class="p-4 rounded-2xl border text-left transition-all cursor-pointer"
              :class="
                selectedBreak?.id === b.id
                  ? 'bg-slate-900 border-amber-400 shadow-lg'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              "
              @click="selectedBreak = b"
            >
              <div class="text-xs font-black text-white truncate">{{ b.title }}</div>
              <div class="text-[11px] text-slate-400 mt-1">{{ b.set_name }}</div>
              <span
                class="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-black uppercase"
                :class="b.status === 'live' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'"
              >
                {{ b.status.toUpperCase() }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

