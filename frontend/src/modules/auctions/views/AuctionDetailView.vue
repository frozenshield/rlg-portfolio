<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuctionStore } from '../auction.store';
import { useAuthStore } from '@/modules/auth/auth.store';
import { resolveStorageUrl } from '@/shared/utils/api';
import LivePriceTicker from '../components/LivePriceTicker.vue';
import CountdownTimer from '../components/CountdownTimer.vue';
import BiddingControls from '../components/BiddingControls.vue';
import BidLedger from '../components/BidLedger.vue';

const route = useRoute();
const router = useRouter();
const auctionStore = useAuctionStore();
const authStore = useAuthStore();

const activeImageIndex = ref(0);

const handleToggleFavorite = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }
  if (auction.value) {
    await auctionStore.toggleFavorite(auction.value.id);
  }
};

const auctionId = computed(() => Number(route.params.id));
const auction = computed(() => auctionStore.auction);
const bids = computed(() => auctionStore.bids);

onMounted(async () => {
  if (auctionId.value) {
    await auctionStore.fetchAuction(auctionId.value);
    auctionStore.listenForBids(auctionId.value);
  }
});

onUnmounted(() => {
  auctionStore.stopListeningForBids();
});

const activeImageUrl = computed(() => {
  if (!auction.value) return '';
  let raw = '';
  if (auction.value.images && auction.value.images.length > 0) {
    raw = auction.value.images[activeImageIndex.value]?.url || auction.value.images[0].url;
  } else {
    raw = auction.value.primary_image_url || '';
  }
  return resolveStorageUrl(raw);
});

// Magnifying Glass Zoom & Lightbox State
const isZooming = ref(false);
const zoomX = ref(50);
const zoomY = ref(50);
const lensX = ref(0);
const lensY = ref(0);
const isLightboxOpen = ref(false);
const isLightboxZooming = ref(false);
const lightboxZoomX = ref(50);
const lightboxZoomY = ref(50);

const handleImageMouseMove = (e: MouseEvent) => {
  const container = e.currentTarget as HTMLElement;
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  lensX.value = x;
  lensY.value = y;
  zoomX.value = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
  zoomY.value = Math.max(0, Math.min(100, Math.round((y / rect.height) * 100)));
};

const handleLightboxMouseMove = (e: MouseEvent) => {
  const container = e.currentTarget as HTMLElement;
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  lightboxZoomX.value = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
  lightboxZoomY.value = Math.max(0, Math.min(100, Math.round((y / rect.height) * 100)));
};
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-[1400px] w-full mx-auto space-y-6">
      <!-- Breadcrumbs & Navigation -->
      <nav class="flex items-center justify-between text-xs font-semibold text-slate-400">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1"
            @click="router.push('/auctions')"
          >
            <span>←</span>
            <span>All Auctions</span>
          </button>
          <span>/</span>
          <span class="text-slate-300 truncate max-w-xs">{{ auction?.item_name || 'Auction Details' }}</span>
        </div>

        <span
          v-if="auction && !auction.is_ended"
          class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1.5"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Live Session Active</span>
        </span>
      </nav>

      <!-- Loading State -->
      <div v-if="auctionStore.isLoading && !auction" class="py-24 text-center space-y-3">
        <div class="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Connecting to Auction Arena &amp; Syncing Ledger...
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="auctionStore.errorMessage && !auction"
        class="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800 space-y-4 max-w-md mx-auto"
      >
        <span class="text-4xl">⚠️</span>
        <h3 class="text-lg font-bold text-white">Auction Unavailable</h3>
        <p class="text-xs text-slate-400">{{ auctionStore.errorMessage }}</p>
        <button
          type="button"
          class="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          @click="router.push('/auctions')"
        >
          Return to Auctions Arena
        </button>
      </div>

      <!-- THE ARENA (Product & Bidding Core) -->
      <div v-else-if="auction" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- LEFT COLUMN (5 cols): Product Gallery & Specs -->
        <div class="lg:col-span-5 space-y-4">
          <!-- Main Hero Image with Magnifying Glass Zoom -->
          <div
            class="relative bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl aspect-square flex items-center justify-center p-4 cursor-zoom-in group/zoom select-none"
            @mousemove="handleImageMouseMove"
            @mouseenter="isZooming = true"
            @mouseleave="isZooming = false"
            @click="isLightboxOpen = true"
          >
            <img
              :src="activeImageUrl"
              :alt="auction.item_name"
              class="w-full h-full object-contain rounded-2xl transition-transform duration-100 ease-out"
              :style="
                isZooming
                  ? {
                      transform: 'scale(2.3)',
                      transformOrigin: `${zoomX}% ${zoomY}%`,
                    }
                  : {}
              "
            />

            <!-- Floating Magnifying Glass Lens Ring on Hover -->
            <div
              v-if="isZooming"
              class="pointer-events-none absolute w-28 h-28 rounded-full border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)] bg-white/5 z-20 flex items-center justify-center"
              :style="{
                left: `${lensX - 56}px`,
                top: `${lensY - 56}px`,
              }"
            >
              <span class="text-xs opacity-70">🔍</span>
            </div>

            <!-- Hover Hint Pill Bottom-Left -->
            <div
              v-if="!isZooming"
              class="pointer-events-none absolute bottom-4 left-4 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[10px] font-bold text-slate-300 flex items-center gap-1 shadow-sm"
            >
              <span>🔍</span>
              <span>Hover to Zoom / Click for Fullscreen</span>
            </div>

            <!-- Top Left Tag: Lot / Authentic Badge -->
            <div class="absolute top-4 left-4 flex flex-col gap-1.5">
              <span class="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[11px] font-mono font-bold text-amber-400">
                LOT #{{ auction.id }}
              </span>
              <span class="px-3 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                ✓ Authentic Guaranteed
              </span>
            </div>

            <!-- Top Right: Favorite Button -->
            <button
              type="button"
              @click="handleToggleFavorite"
              class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-950/85 hover:bg-slate-900 backdrop-blur-md border border-slate-700/80 flex items-center justify-center transition-all transform hover:scale-110 active:scale-90 shadow-lg cursor-pointer z-10"
              :title="auction.is_favorited ? 'Remove from favorites' : 'Add to favorite watchlist'"
            >
              <span class="text-base select-none">
                {{ auction.is_favorited ? '❤️' : '🤍' }}
              </span>
            </button>

            <!-- Total Bids Count Floating Pill -->
            <div class="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-slate-800 text-[11px] font-bold text-slate-300">
              🔥 {{ auction.total_bids }} {{ auction.total_bids === 1 ? 'total bid' : 'total bids' }}
            </div>
          </div>

          <!-- Thumbnails Selector -->
          <div
            v-if="auction.images && auction.images.length > 1"
            class="flex items-center gap-3 overflow-x-auto pb-1"
          >
            <button
              v-for="(img, idx) in auction.images"
              :key="img.id"
              type="button"
              class="w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all p-1 bg-slate-900 cursor-pointer shrink-0"
              :class="[
                activeImageIndex === idx
                  ? 'border-amber-400 ring-2 ring-amber-400/20'
                  : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100',
              ]"
              @click="activeImageIndex = idx"
            >
              <img :src="resolveStorageUrl(img.url)" class="w-full h-full object-cover rounded-xl" />
            </button>
          </div>

          <!-- Description Box -->
          <div class="p-6 bg-slate-900/80 rounded-3xl border border-slate-800/80 space-y-3">
            <h3 class="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>📋</span>
              <span>Collector Item Description</span>
            </h3>
            <p class="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {{ auction.description || 'No additional condition notes provided for this lot.' }}
            </p>

            <div class="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Starting Price</span>
                <span class="font-mono font-bold text-slate-200">₱{{ auction.starting_price.toLocaleString() }}</span>
              </div>
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Minimum Increment</span>
                <span class="font-mono font-bold text-slate-200">+₱{{ auction.bid_increment }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN (7 cols): The Real-Time Arena -->
        <div class="lg:col-span-7 space-y-5">
          <!-- Won Auction Claim Banner -->
          <div
            v-if="auction.winning_payment"
            class="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 to-yellow-950/80 border border-amber-500/50 shadow-xl space-y-2 animate-bounce-subtle"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-amber-300 font-black text-sm">
                <span class="text-xl">👑</span>
                <span>Congratulations! You Won This Auction Lot!</span>
              </div>
              <span
                class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                :class="
                  auction.winning_payment.payment_status === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                "
              >
                {{ auction.winning_payment.payment_status === 'paid' ? 'Paid / In Fulfillment' : 'Payment Awaiting' }}
              </span>
            </div>
            <p class="text-xs text-slate-300">
              Your winning bid was settled at <strong class="text-amber-300 font-mono text-sm">₱{{ auction.winning_payment.winning_amount.toLocaleString() }}</strong>. Please complete settlement to initiate dispatch.
            </p>
            <router-link
              to="/profile/auctions"
              class="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-md"
            >
              <span>Pay &amp; Finalize Shipping Delivery</span>
              <span>&rarr;</span>
            </router-link>
          </div>

          <!-- Item Title & Lot Headline -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <span>RLG Collectibles Exclusive Auction</span>
              <span>•</span>
              <span class="font-mono">Pessimistic Concurrency</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {{ auction.item_name }}
            </h1>
          </div>

          <!-- 1. The Real-Time Hero Section (LivePriceTicker + CountdownTimer) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LivePriceTicker
              :current-price="auction.current_price"
              :bid-increment="auction.bid_increment"
            />
            <CountdownTimer
              :end-time="auction.end_time"
              :bids-count="bids.length"
              @time-up="handleAuctionTimeUp"
            />
          </div>

          <!-- 2. The Bidding Controls (Quick Bid vs Auto-Bid Tabs) -->
          <BiddingControls
            :auction="auction"
            @bid-placed="auctionStore.fetchAuction(auction.id)"
          />

          <!-- 3. The Live Bid Ledger (The Feed) -->
          <BidLedger :bids="bids" />
        </div>
      </div>
    </div>

    <!-- FULLSCREEN IMAGE LIGHTBOX MODAL -->
    <teleport to="body">
      <div
        v-if="isLightboxOpen && auction"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        @click="isLightboxOpen = false"
      >
        <div
          class="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative space-y-4"
          @click.stop
        >
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-lg">🔍</span>
              <h3 class="text-base font-extrabold text-white truncate max-w-lg">
                {{ auction.item_name }} (Lot #{{ auction.id }})
              </h3>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
              @click="isLightboxOpen = false"
            >
              ✕
            </button>
          </div>

          <div
            class="relative w-full h-[65vh] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center cursor-zoom-in"
            @mousemove="handleLightboxMouseMove"
            @mouseenter="isLightboxZooming = true"
            @mouseleave="isLightboxZooming = false"
          >
            <img
              :src="activeImageUrl"
              :alt="auction.item_name"
              class="max-w-full max-h-full object-contain transition-transform duration-100 ease-out"
              :style="
                isLightboxZooming
                  ? {
                      transform: 'scale(2.6)',
                      transformOrigin: `${lightboxZoomX}% ${lightboxZoomY}%`,
                    }
                  : {}
              "
            />
          </div>

          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>Move cursor over image to inspect foil, corners, and fine card details</span>
            <a :href="activeImageUrl" target="_blank" class="text-amber-400 hover:underline font-bold">
              Open Original Image ↗
            </a>
          </div>
        </div>
      </div>
    </teleport>
  </main>
</template>
