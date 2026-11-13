<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuctionStore } from '../auction.store';
import { useAuthStore } from '@/modules/auth/auth.store';
import { resolveStorageUrl } from '@/shared/utils/api';
import type { AuctionListItem } from '../types';

const router = useRouter();
const auctionStore = useAuctionStore();
const authStore = useAuthStore();

const activeFilter = ref<'all' | 'active' | 'ended'>('all');
const currentTime = ref(Date.now());
let timerInterval: any = null;

onMounted(() => {
  auctionStore.fetchAuctions(activeFilter.value);
  timerInterval = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

const handleFilterChange = (filter: 'all' | 'active' | 'ended') => {
  activeFilter.value = filter;
  auctionStore.fetchAuctions(filter);
};

const formatPrice = (val: number | string | null | undefined) => {
  const num = typeof val === 'number' ? val : parseFloat(String(val ?? 0));
  return Number(!isNaN(num) ? num : 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getRemainingTimeData = (endTimeIso: string, bidsCount: number = 0) => {
  const diff = new Date(endTimeIso).getTime() - currentTime.value;
  if (diff <= 0) {
    if (bidsCount === 0) {
      return { isEnded: false, text: '🔄 Resetting Timer...', isAntiSniping: false };
    }
    return { isEnded: true, text: 'Auction Closed', isAntiSniping: false };
  }

  const isAntiSniping = diff < 300000; // Under 5 minutes threshold
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    formatted = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  } else {
    formatted = `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }

  return {
    isEnded: false,
    text: formatted,
    isAntiSniping,
  };
};

const handleToggleFavorite = async (item: AuctionListItem) => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }
  await auctionStore.toggleFavorite(item.id);
};
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
    <div class="max-w-[1400px] w-full mx-auto space-y-8">
      <!-- Header & Headline -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            <span>⚡ Real-Time Trading Post</span>
            <span>•</span>
            <span>Auto-Proxy Bidding + Popcorn Anti-Snipe</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Collector Auction Arena
          </h1>
          <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Live competitive bidding for certified authentic cards, booster boxes, and rare scale figures. Protected by wallet escrow holds, proxy max-caps, and anti-sniping timers.
          </p>
        </div>

        <!-- Right Side: Ecosystem Links + Filter Pills -->
        <div class="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <router-link
            to="/wallet"
            class="px-3.5 py-2 rounded-xl text-xs font-black bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all"
          >
            <span>💳</span>
            <span>Digital Wallet</span>
          </router-link>

          <router-link
            to="/raffles"
            class="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all"
          >
            <span>🎯</span>
            <span>100-Slot Raffles</span>
          </router-link>

          <router-link
            to="/gacha"
            class="px-3.5 py-2 rounded-xl text-xs font-black bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-all"
          >
            <span>🎰</span>
            <span>Oripa Gacha &amp; Breaks</span>
          </router-link>

          <router-link
            to="/profile/auctions"
            class="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <span>🔨</span>
            <span>My Bids &amp; Watchlist</span>
          </router-link>

          <div class="flex items-center p-1 bg-slate-900 rounded-2xl border border-slate-800 gap-1">
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              :class="[
                activeFilter === 'all'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white',
              ]"
              @click="handleFilterChange('all')"
            >
              All Lots
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              :class="[
                activeFilter === 'active'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white',
              ]"
              @click="handleFilterChange('active')"
            >
              🔥 Active Only
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              :class="[
                activeFilter === 'ended'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white',
              ]"
              @click="handleFilterChange('ended')"
            >
              Archived
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="auctionStore.isLoading && auctionStore.auctions.length === 0" class="py-20 text-center space-y-3">
        <div class="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Live Auction Lots...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="auctionStore.auctions.length === 0"
        class="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800 space-y-4 max-w-md mx-auto"
      >
        <span class="text-4xl">🏷️</span>
        <h3 class="text-lg font-bold text-white">No Auctions in this category</h3>
        <p class="text-xs text-slate-400">Check back soon for new sealed booster boxes and grail figure listings.</p>
        <button
          type="button"
          class="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer hover:bg-amber-300 transition-colors"
          @click="handleFilterChange('all')"
        >
          View All Auctions
        </button>
      </div>

      <!-- Auction Cards Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="item in auctionStore.auctions"
          :key="item.id"
          class="bg-slate-900/90 hover:bg-slate-900 rounded-3xl border border-slate-800 hover:border-amber-400/50 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-amber-500/5"
          @click="router.push(`/auctions/${item.id}`)"
        >
          <!-- Thumbnail Image & Live Countdown -->
          <div class="relative aspect-4/3 bg-slate-950 overflow-hidden flex items-center justify-center p-4">
            <img
              :src="resolveStorageUrl(item.primary_image_url) || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=800'"
              :alt="item.item_name"
              width="400"
              height="300"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500"
            />

            <!-- Top Left: Live Status Pill + Reserve Status -->
            <div class="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
              <span
                v-if="!item.is_ended && !getRemainingTimeData(item.end_time).isEnded"
                class="px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase flex items-center gap-1.5 shadow-sm"
              >
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Bidding</span>
              </span>
              <span
                v-else
                class="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-slate-400 border border-slate-700 text-[10px] font-bold uppercase"
              >
                Closed
              </span>

              <span
                v-if="item.has_reserve"
                class="px-2 py-0.5 rounded-full backdrop-blur-md text-[9px] font-black uppercase border"
                :class="
                  item.is_reserve_met
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                "
              >
                {{ item.is_reserve_met ? '✓ Reserve Met' : '🔒 Reserve Active' }}
              </span>
            </div>

            <!-- Top Right: Favorite / Watchlist Button -->
            <button
              type="button"
              @click.stop="handleToggleFavorite(item)"
              class="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/85 hover:bg-slate-900 backdrop-blur-md border border-slate-700/80 flex items-center justify-center transition-all transform hover:scale-110 active:scale-90 shadow-lg cursor-pointer z-10"
              :title="item.is_favorited ? 'Remove from favorites' : 'Add to favorite watchlist'"
            >
              <span class="text-sm select-none">
                {{ item.is_favorited ? '❤️' : '🤍' }}
              </span>
            </button>

            <!-- Bottom Left: Prominent Live Countdown Timer Pill -->
            <div class="absolute bottom-3 left-3">
              <div
                v-if="!item.is_ended && !getRemainingTimeData(item.end_time, item.bids_count).isEnded"
                class="px-2.5 py-1 rounded-xl backdrop-blur-md text-xs font-mono font-black flex items-center gap-1.5 shadow-lg border"
                :class="
                  getRemainingTimeData(item.end_time, item.bids_count).isAntiSniping
                    ? 'bg-red-950/90 text-red-400 border-red-500/60 animate-pulse'
                    : 'bg-slate-950/85 text-amber-300 border-amber-500/30'
                "
              >
                <span>⏳</span>
                <span>{{ getRemainingTimeData(item.end_time, item.bids_count).text }}</span>
                <span
                  v-if="getRemainingTimeData(item.end_time, item.bids_count).isAntiSniping"
                  class="text-[9px] px-1 py-0.2 rounded bg-red-500/30 text-red-200 font-sans uppercase font-extrabold"
                >
                  Anti-Sniping
                </span>
              </div>
              <div
                v-else
                class="px-2.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md text-xs font-mono font-bold text-slate-400 border border-slate-700"
              >
                🏁 Closed
              </div>
            </div>

            <!-- Bottom Right: Bids Count -->
            <div class="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md text-[11px] font-bold text-slate-300 border border-slate-800">
              🔥 {{ item.bids_count }} {{ item.bids_count === 1 ? 'bid' : 'bids' }}
            </div>
          </div>

          <!-- Body -->
          <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-[10px] font-mono font-bold text-slate-400">
                  LOT #{{ item.id }}
                </span>
                <span
                  v-if="item.buy_it_now_price"
                  class="text-[10px] font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg"
                >
                  ⚡ Buyout ₱{{ formatPrice(item.buy_it_now_price) }}
                </span>
              </div>
              <h3 class="text-base font-extrabold text-white line-clamp-2 group-hover:text-amber-400 transition-colors leading-snug">
                {{ item.item_name }}
              </h3>
            </div>

            <!-- Prices & Next Bid -->
            <div class="pt-3 border-t border-slate-800/80 flex items-end justify-between">
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400 block">
                  {{ (item.bids_count || 0) === 0 ? 'Starting Bid' : 'Current Highest' }}
                </span>
                <span class="text-xl font-black font-mono text-amber-400">
                  ₱{{ formatPrice(Number(item.current_price) > 0 ? item.current_price : (item.starting_price || 0)) }}
                </span>
              </div>
              <div class="text-right">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Min Next</span>
                <span class="text-xs font-mono font-bold text-slate-300">
                  ₱{{ formatPrice((item.bids_count || 0) === 0 ? (Number(item.current_price) > 0 ? item.current_price : (item.starting_price || 0)) : item.min_next_bid) }}
                </span>
              </div>
            </div>

            <!-- Action Button -->
            <button
              type="button"
              class="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              :class="[
                item.is_ended
                  ? 'bg-slate-800 text-slate-400 hover:text-white'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 group-hover:from-amber-300 group-hover:to-amber-400 text-slate-950 font-black shadow-md',
              ]"
            >
              <span>{{ item.is_ended ? 'View Closed Ledger' : 'Enter Bidding Arena' }}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
