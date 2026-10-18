<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuctionStore } from '@/modules/auctions/auction.store';
import { useCatalogStore } from '@/modules/catalog/catalog.store';
import type { AuctionListItem, BidRecord } from '@/modules/auctions/types';
import type { ToyProduct } from '@/shared/types/toy.types';
import { resolveApiUrl, resolveStorageUrl } from '@/shared/utils/api';

const router = useRouter();
const auctionStore = useAuctionStore();
const catalogStore = useCatalogStore();

// UI States
const isModalOpen = ref(false);
const isLedgerModalOpen = ref(false);
const selectedAuctionForLedger = ref<AuctionListItem | null>(null);
const ledgerBids = ref<BidRecord[]>([]);
const isLedgerLoading = ref(false);

const activeFilter = ref<'all' | 'active' | 'ended' | 'cancelled'>('all');
const searchQuery = ref('');
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null);

// Form State
const productMode = ref<'inventory' | 'custom'>('inventory');
const selectedProductId = ref<string | number>('');
const itemName = ref('');
const description = ref('');
const startingPrice = ref<number>(500);
const bidIncrement = ref<number>(50);
const endTime = ref('');
const imageUrl = ref('');
const selectedImageFile = ref<File | null>(null);
const imagePreviewUrl = ref<string>('');

// AutoVision AI Assist State
const isAnalyzingWithAi = ref(false);
const autoFillWithAi = ref(true);
const aiStatusMessage = ref('');
const aiError = ref('');
const aiSuccess = ref('');
const isDraggingOver = ref(false);
const auctionFileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  auctionFileInput.value?.click();
};

// Format currency
const formatPrice = (val: number | string | undefined | null) => {
  const num = Number(val) || 0;
  return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Quick Date/Time presets
const setEndTimePreset = (hours: number) => {
  const target = new Date(Date.now() + hours * 60 * 60 * 1000);
  // Format for datetime-local: YYYY-MM-DDTHH:mm
  const localIso = new Date(target.getTime() - target.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  endTime.value = localIso;
};

// Set default end time to +24 hours
const initDefaultEndTime = () => {
  setEndTimePreset(24);
};

// Computed remaining time string from endTime
const estimatedDurationText = computed(() => {
  if (!endTime.value) return '';
  const diff = new Date(endTime.value).getTime() - Date.now();
  if (diff <= 0) return 'End time is in the past! Please select a future time.';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `Runs for ${days}d ${remHours}h ${mins}m from now`;
  }
  return `Runs for ${hours}h ${mins}m from now`;
});

// Watch product selection to prefill form
const handleProductSelect = () => {
  if (!selectedProductId.value) return;
  const prod = catalogStore.toys.find((p) => String(p.id) === String(selectedProductId.value));
  if (prod) {
    itemName.value = prod.name;
    description.value = prod.description || `${prod.name} - Collector's grade auction item. Condition: Near Mint.`;
    // Suggest 70% of base price as initial starting bid, rounded to nearest 50
    const suggested = Math.max(50, Math.round((prod.price * 0.7) / 50) * 50);
    startingPrice.value = suggested;
    imageUrl.value = prod.imageUrl;
    imagePreviewUrl.value = prod.imageUrl;
    selectedImageFile.value = null;
  }
};

/**
 * Execute AutoVision AI image inspection to auto-fill bidding title & description
 */
const runAiAnalysis = async (source: File | string) => {
  isAnalyzingWithAi.value = true;
  aiError.value = '';
  aiSuccess.value = '';
  aiStatusMessage.value = 'AutoVision AI is inspecting the image to detect item name and collector description...';

  try {
    const formData = new FormData();
    if (source instanceof File) {
      formData.append('image', source);
    } else {
      formData.append('image_url', source);
    }

    const response = await fetch(resolveApiUrl('/ai/analyze-product-image'), {
      method: 'POST',
      body: formData,
    });

    const res = await response.json();
    if (!response.ok || !res.success) {
      throw new Error(res.message || 'Failed to analyze image with AutoVision AI.');
    }

    const data = res.data;
    if (data.title) {
      itemName.value = data.title;
    }
    if (data.description) {
      description.value = data.description;
    }

    aiSuccess.value = `AutoVision AI populated bidding details for: "${data.title || 'Item'}"`;
    showToast('✨ AutoVision AI populated bidding name & description!', 'success');
  } catch (err: any) {
    console.warn('AutoVision AI error:', err);
    aiError.value = err.message || 'AutoVision AI could not analyze the image.';
    showToast(err.message || 'AutoVision AI could not analyze image.', 'error');
  } finally {
    isAnalyzingWithAi.value = false;
  }
};

// Handle file input upload
const handleFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    selectedImageFile.value = file;
    imagePreviewUrl.value = URL.createObjectURL(file);
    imageUrl.value = '';

    if (autoFillWithAi.value) {
      await runAiAnalysis(file);
    }
  }
};

// Handle Drag and Drop
const handleDrop = async (e: DragEvent) => {
  isDraggingOver.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0];
    selectedImageFile.value = file;
    imagePreviewUrl.value = URL.createObjectURL(file);
    imageUrl.value = '';

    if (autoFillWithAi.value) {
      await runAiAnalysis(file);
    }
  }
};

// Manual / Re-analyze button trigger
const triggerReanalyzeAi = async () => {
  if (selectedImageFile.value) {
    await runAiAnalysis(selectedImageFile.value);
  } else if (imageUrl.value.trim()) {
    await runAiAnalysis(imageUrl.value.trim());
  } else {
    showToast('Please upload or provide an image first to analyze.', 'error');
  }
};

// Analyze direct URL with AI
const analyzeUrlWithAi = async () => {
  if (!imageUrl.value.trim()) return;
  const url = imageUrl.value.trim();
  imagePreviewUrl.value = url;
  selectedImageFile.value = null;
  if (autoFillWithAi.value) {
    await runAiAnalysis(url);
  }
};

// Show notification
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = { type, message };
  setTimeout(() => {
    notification.value = null;
  }, 4000);
};

// Open Create Modal
const openCreateModal = () => {
  itemName.value = '';
  description.value = '';
  startingPrice.value = 500;
  bidIncrement.value = 50;
  selectedProductId.value = '';
  imageUrl.value = '';
  imagePreviewUrl.value = '';
  selectedImageFile.value = null;
  aiError.value = '';
  aiSuccess.value = '';
  isAnalyzingWithAi.value = false;
  initDefaultEndTime();
  isModalOpen.value = true;
};

// Submit New Auction
const submitCreateAuction = async () => {
  if (!itemName.value.trim()) {
    showToast('Please enter or select a product item name.', 'error');
    return;
  }
  if (!startingPrice.value || startingPrice.value <= 0) {
    showToast('Please set a valid starting price.', 'error');
    return;
  }
  if (!endTime.value) {
    showToast('Please select when the auction will end.', 'error');
    return;
  }
  if (new Date(endTime.value).getTime() <= Date.now()) {
    showToast('The end date and time must be in the future.', 'error');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('item_name', itemName.value.trim());
    formData.append('description', description.value.trim());
    formData.append('starting_price', String(startingPrice.value));
    formData.append('bid_increment', String(bidIncrement.value || 50));
    formData.append('end_time', new Date(endTime.value).toISOString());

    if (selectedImageFile.value) {
      formData.append('image', selectedImageFile.value);
    } else if (imageUrl.value.trim()) {
      formData.append('image_url', imageUrl.value.trim());
    }

    await auctionStore.createAuction(formData);
    isModalOpen.value = false;
    showToast(`Auction lot "${itemName.value}" is now live!`);
  } catch (err: any) {
    showToast(err.message || 'Failed to create auction.', 'error');
  }
};

// View Bids Ledger for Auction
const openLedgerModal = async (auctionItem: AuctionListItem) => {
  selectedAuctionForLedger.value = auctionItem;
  isLedgerModalOpen.value = true;
  isLedgerLoading.value = true;
  try {
    const res = await fetch(resolveApiUrl(`/auctions/${auctionItem.id}`));
    const json = await res.json();
    if (json.success && json.data) {
      ledgerBids.value = json.data.bids || [];
    }
  } catch {
    ledgerBids.value = [];
  } finally {
    isLedgerLoading.value = false;
  }
};

// End Auction Early
const handleEndEarly = async (item: AuctionListItem) => {
  if (!confirm(`Are you sure you want to end auction Lot #${item.id} "${item.item_name}" immediately?`)) {
    return;
  }
  try {
    await auctionStore.updateAuctionStatus(item.id, 'ended');
    showToast(`Auction Lot #${item.id} has ended.`);
  } catch (err: any) {
    showToast(err.message || 'Could not end auction.', 'error');
  }
};

// Cancel Auction
const handleCancelAuction = async (item: AuctionListItem) => {
  if (!confirm(`Are you sure you want to cancel Lot #${item.id}? This will invalidate all active bids.`)) {
    return;
  }
  try {
    await auctionStore.updateAuctionStatus(item.id, 'cancelled');
    showToast(`Auction Lot #${item.id} has been cancelled.`);
  } catch (err: any) {
    showToast(err.message || 'Could not cancel auction.', 'error');
  }
};

// Delete Auction
const handleDeleteAuction = async (item: AuctionListItem) => {
  if (!confirm(`Delete Lot #${item.id} permanently? This cannot be undone.`)) {
    return;
  }
  try {
    await auctionStore.deleteAuction(item.id);
    showToast(`Auction Lot #${item.id} deleted.`);
  } catch (err: any) {
    showToast(err.message || 'Could not delete auction.', 'error');
  }
};

// Filtered Auctions
const filteredAuctions = computed(() => {
  let list = auctionStore.auctions;

  if (activeFilter.value === 'active') {
    list = list.filter((a) => a.status === 'active' && !a.is_ended && new Date(a.end_time).getTime() > Date.now());
  } else if (activeFilter.value === 'ended') {
    list = list.filter((a) => a.status === 'ended' || a.is_ended || new Date(a.end_time).getTime() <= Date.now());
  } else if (activeFilter.value === 'cancelled') {
    list = list.filter((a) => a.status === 'cancelled');
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (a) =>
        (a.item_name ? String(a.item_name).toLowerCase() : "").includes(q) ||
        String(a.id).includes(q) ||
        (a.description ? String(a.description).toLowerCase() : "").includes(q)
    );
  }

  return list;
});

// Summary Metrics
const metrics = computed(() => {
  const all = auctionStore.auctions;
  const active = all.filter((a) => a.status === 'active' && new Date(a.end_time).getTime() > Date.now());
  const ended = all.filter((a) => a.status === 'ended' || new Date(a.end_time).getTime() <= Date.now());
  const totalBids = all.reduce((sum, a) => sum + (a.bids_count || 0), 0);
  const highestCurrentPrice = all.reduce((max, a) => Math.max(max, a.current_price || 0), 0);

  return {
    totalLots: all.length,
    activeLots: active.length,
    endedLots: ended.length,
    totalBids,
    highestPrice: highestCurrentPrice,
  };
});

onMounted(async () => {
  initDefaultEndTime();
  await auctionStore.fetchAuctions('all');
  if (catalogStore.toys.length === 0) {
    catalogStore.fetchProducts();
  }
});
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Notification Toast -->
    <div
      v-if="notification"
      class="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold transition-all transform animate-bounce"
      :class="
        notification.type === 'success'
          ? 'bg-emerald-900/90 text-emerald-100 border-emerald-500/50 backdrop-blur-md'
          : 'bg-red-900/90 text-red-100 border-red-500/50 backdrop-blur-md'
      "
    >
      <span>{{ notification.type === 'success' ? '✓' : '⚠️' }}</span>
      <span>{{ notification.message }}</span>
    </div>

    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900/70 border border-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div>
        <div class="flex items-center gap-3">
          <span class="text-3xl">🔨</span>
          <div>
            <h1 class="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Auctions & Bidding Arena
              <span class="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Pessimistic DB Locks
              </span>
            </h1>
            <p class="text-sm text-gray-400 mt-1">
              Create product auction lots, configure starting amounts, end timestamps, and monitor live bids in real-time.
            </p>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
        <a
          href="/auctions"
          target="_blank"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold text-gray-300 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 transition-colors shadow-sm flex-1 sm:flex-initial"
        >
          <span>Live Arena ↗</span>
        </a>
        <button
          @click="openCreateModal"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-900/30 active:scale-95 flex-1 sm:flex-initial cursor-pointer"
        >
          <span>＋</span>
          <span>Launch Auction</span>
        </button>
      </div>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 shadow-sm">
        <div class="text-xs font-bold uppercase tracking-wider text-gray-400">Total Lots</div>
        <div class="mt-2 text-3xl font-black text-white">{{ metrics.totalLots }}</div>
        <div class="mt-1 text-xs text-gray-500">Registered auction catalog</div>
      </div>

      <div class="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div class="absolute top-3 right-3 flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        </div>
        <div class="text-xs font-bold uppercase tracking-wider text-emerald-400">Active Now</div>
        <div class="mt-2 text-3xl font-black text-emerald-400">{{ metrics.activeLots }}</div>
        <div class="mt-1 text-xs text-gray-400">Accepting live & proxy bids</div>
      </div>

      <div class="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 shadow-sm">
        <div class="text-xs font-bold uppercase tracking-wider text-indigo-400">Bids Placed</div>
        <div class="mt-2 text-3xl font-black text-indigo-300">{{ metrics.totalBids }}</div>
        <div class="mt-1 text-xs text-gray-400">Immutable ledger transactions</div>
      </div>

      <div class="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 shadow-sm">
        <div class="text-xs font-bold uppercase tracking-wider text-amber-400">Top Current Price</div>
        <div class="mt-2 text-2xl font-black text-amber-300">{{ formatPrice(metrics.highestPrice) }}</div>
        <div class="mt-1 text-xs text-gray-400">Highest active lot bid</div>
      </div>
    </div>

    <!-- Filter and Search Bar -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/40 border border-gray-800/80 p-3.5 rounded-2xl">
      <div class="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800 w-full sm:w-auto overflow-x-auto no-scrollbar">
        <button
          @click="activeFilter = 'all'"
          class="px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[38px] cursor-pointer"
          :class="activeFilter === 'all' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'"
        >
          All ({{ metrics.totalLots }})
        </button>
        <button
          @click="activeFilter = 'active'"
          class="px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[38px] cursor-pointer"
          :class="activeFilter === 'active' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30' : 'text-gray-400 hover:text-white'"
        >
          Active ({{ metrics.activeLots }})
        </button>
        <button
          @click="activeFilter = 'ended'"
          class="px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[38px] cursor-pointer"
          :class="activeFilter === 'ended' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'"
        >
          Ended ({{ metrics.endedLots }})
        </button>
        <button
          @click="activeFilter = 'cancelled'"
          class="px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[38px] cursor-pointer"
          :class="activeFilter === 'cancelled' ? 'bg-red-900/30 text-red-300 border border-red-500/30' : 'text-gray-400 hover:text-white'"
        >
          Cancelled
        </button>
      </div>

      <div class="relative w-full sm:w-72">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by lot # or title..."
          class="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 pl-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[44px]"
        />
        <span class="absolute left-3 top-3.5 text-gray-500 text-xs">🔍</span>
      </div>
    </div>

    <!-- Auctions Table / List -->
    <div class="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
      <div v-if="auctionStore.isLoading" class="p-12 text-center text-gray-400">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3"></div>
        <p class="text-sm font-semibold">Loading live auction registry...</p>
      </div>

      <div v-else-if="filteredAuctions.length === 0" class="p-12 text-center">
        <span class="text-4xl">🏷️</span>
        <h3 class="text-base font-bold text-white mt-3">No auctions found</h3>
        <p class="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No auction lots match your current filter. Launch a new auction using the button above.
        </p>
        <button
          @click="openCreateModal"
          class="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
        >
          ＋ Launch First Auction
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-950/80 border-b border-gray-800 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <th class="py-3.5 px-4">Lot # & Product</th>
              <th class="py-3.5 px-4">Starting Price</th>
              <th class="py-3.5 px-4">Current Price</th>
              <th class="py-3.5 px-4">Bids & Ledger</th>
              <th class="py-3.5 px-4">Auction End Time</th>
              <th class="py-3.5 px-4">Status</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800/60 text-sm">
            <tr
              v-for="item in filteredAuctions"
              :key="item.id"
              class="hover:bg-gray-800/40 transition-colors group"
            >
              <!-- Lot & Product -->
              <td class="py-4 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-14 h-14 rounded-xl overflow-hidden bg-gray-950 border border-gray-800 flex-shrink-0 relative">
                    <img
                      :src="item.primary_image_url || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=200'"
                      :alt="item.item_name"
                      class="w-full h-full object-cover"
                    />
                    <span class="absolute bottom-0 right-0 bg-black/80 text-[9px] font-black text-gray-300 px-1 rounded-tl">
                      #{{ item.id }}
                    </span>
                  </div>
                  <div>
                    <a
                      :href="`/auctions/${item.id}`"
                      target="_blank"
                      class="font-bold text-white hover:text-emerald-400 transition-colors line-clamp-1 group-hover:underline"
                    >
                      {{ item.item_name }}
                    </a>
                    <p class="text-xs text-gray-400 line-clamp-1 mt-0.5">
                      {{ item.description || 'Exclusive collectible item' }}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-[10px] text-gray-500 font-mono">
                        Increment: {{ formatPrice(item.bid_increment || 50) }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Starting Price -->
              <td class="py-4 px-4 font-mono text-gray-300 text-xs">
                {{ formatPrice(item.starting_price) }}
              </td>

              <!-- Current Price -->
              <td class="py-4 px-4">
                <div class="font-mono font-black text-base text-emerald-400">
                  {{ formatPrice(item.current_price) }}
                </div>
                <div v-if="item.highest_bid" class="text-[10px] text-gray-400 mt-0.5">
                  Leader: <span class="text-gray-300 font-semibold">{{ item.highest_bid.masked_username }}</span>
                </div>
                <div v-else class="text-[10px] text-gray-500 italic">No bids yet</div>
              </td>

              <!-- Bids & Ledger -->
              <td class="py-4 px-4">
                <button
                  @click="openLedgerModal(item)"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors"
                >
                  <span>📜</span>
                  <span>{{ item.bids_count || 0 }} bids</span>
                </button>
              </td>

              <!-- End Time -->
              <td class="py-4 px-4">
                <div class="text-xs text-gray-300 font-medium">
                  {{ new Date(item.end_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                </div>
                <div
                  v-if="item.status === 'active' && new Date(item.end_time).getTime() > Date.now()"
                  class="text-[10px] font-bold mt-0.5"
                  :class="
                    new Date(item.end_time).getTime() - Date.now() < 300000
                      ? 'text-red-400 animate-pulse'
                      : 'text-emerald-400'
                  "
                >
                  {{
                    new Date(item.end_time).getTime() - Date.now() < 300000
                      ? '⚠️ < 5m (Anti-Sniping)'
                      : 'Live Running'
                  }}
                </div>
                <div v-else class="text-[10px] text-gray-500 mt-0.5">
                  Ended
                </div>
              </td>

              <!-- Status -->
              <td class="py-4 px-4">
                <span
                  v-if="item.status === 'active' && new Date(item.end_time).getTime() > Date.now()"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Active
                </span>
                <span
                  v-else-if="item.status === 'cancelled'"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30"
                >
                  Cancelled
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-800 text-gray-400 border border-gray-700"
                >
                  Ended
                </span>
              </td>

              <!-- Actions -->
              <td class="py-4 px-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <a
                    :href="`/auctions/${item.id}`"
                    target="_blank"
                    title="View in Customer Arena"
                    class="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-gray-800 transition-colors"
                  >
                    ↗ Arena
                  </a>

                  <button
                    v-if="item.status === 'active' && new Date(item.end_time).getTime() > Date.now()"
                    @click="handleEndEarly(item)"
                    title="End Auction Now"
                    class="px-2 py-1 rounded text-xs font-semibold text-amber-400 hover:bg-amber-950/40 border border-amber-800/40 transition-colors"
                  >
                    End
                  </button>

                  <button
                    v-if="item.status === 'active'"
                    @click="handleCancelAuction(item)"
                    title="Cancel Auction"
                    class="px-2 py-1 rounded text-xs font-semibold text-red-400 hover:bg-red-950/40 border border-red-800/40 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    @click="handleDeleteAuction(item)"
                    title="Delete Lot"
                    class="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- CREATE AUCTION MODAL -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div
        class="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 transition-all"
      >
        <!-- Modal Header -->
        <div class="p-6 bg-gradient-to-r from-gray-900 via-gray-850 to-gray-900 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-black text-white flex items-center gap-2">
              <span>🔨</span>
              Launch Product Auction Lot
            </h2>
            <p class="text-xs text-gray-400 mt-1">
              Select product, configure desired starting price, increment, and ending countdown.
            </p>
          </div>
          <button
            @click="isModalOpen = false"
            class="w-11 h-11 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors text-sm font-bold cursor-pointer"
            aria-label="Close auction creation modal"
          >
            ✕
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <!-- AI Success Alert -->
          <div
            v-if="aiSuccess"
            class="p-3.5 bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-semibold rounded-2xl flex items-center justify-between shadow-md"
          >
            <div class="flex items-center gap-2">
              <span class="text-base">✨</span>
              <span>{{ aiSuccess }}</span>
            </div>
            <button
              type="button"
              class="text-emerald-400 hover:text-white text-xs font-bold px-1"
              @click="aiSuccess = ''"
            >
              ✕
            </button>
          </div>

          <!-- AI Error Alert -->
          <div
            v-if="aiError"
            class="p-3.5 bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-semibold rounded-2xl flex items-center justify-between shadow-md"
          >
            <div class="flex items-center gap-2">
              <span class="text-base">⚠️</span>
              <span>{{ aiError }}</span>
            </div>
            <button
              type="button"
              class="text-rose-400 hover:text-white text-xs font-bold px-1"
              @click="aiError = ''"
            >
              ✕
            </button>
          </div>

          <!-- AI Analyzing In-Progress Banner -->
          <div
            v-if="isAnalyzingWithAi"
            class="p-4 bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-gray-900 border border-emerald-500/60 rounded-2xl shadow-lg flex items-center gap-3 animate-pulse"
          >
            <div class="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
            <div>
              <p class="font-black text-xs text-emerald-300 flex items-center gap-1.5">
                AutoVision AI is inspecting the image...
                <span class="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold">Gemini Vision</span>
              </p>
              <p class="text-[11px] text-gray-300 mt-0.5 font-normal">
                {{ aiStatusMessage }}
              </p>
            </div>
          </div>

          <!-- AutoVision AI Toggle Banner -->
          <div
            class="flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-gray-900 rounded-2xl border border-emerald-500/30 shadow-xs"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl">✨</span>
              <div>
                <p class="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                  AutoVision AI Assist
                  <span class="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold">Auto-Fill</span>
                </p>
                <p class="text-[11px] text-gray-400">
                  Auto-fill bidding item name &amp; collector description on image upload
                </p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer select-none">
              <input
                v-model="autoFillWithAi"
                type="checkbox"
                class="sr-only peer"
              />
              <div
                class="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"
              ></div>
            </label>
          </div>

          <!-- Selection Mode -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Auction Source
            </label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                @click="productMode = 'inventory'"
                class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold transition-all"
                :class="
                  productMode === 'inventory'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800'
                "
              >
                <span>📦</span>
                <span>Select from Store Inventory</span>
              </button>
              <button
                type="button"
                @click="productMode = 'custom'"
                class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold transition-all"
                :class="
                  productMode === 'custom'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800'
                "
              >
                <span>✨</span>
                <span>Custom Collectible / Exclusive</span>
              </button>
            </div>
          </div>

          <!-- Product Picker from Inventory -->
          <div v-if="productMode === 'inventory'" class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-400">
              Select Product from Catalog *
            </label>
            <select
              v-model="selectedProductId"
              @change="handleProductSelect"
              class="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="" disabled>-- Choose a product from inventory --</option>
              <option
                v-for="prod in catalogStore.toys"
                :key="prod.id"
                :value="prod.id"
              >
                {{ prod.name }} (MSRP {{ formatPrice(prod.price) }}) - Stock: {{ prod.stock || 0 }}
              </option>
            </select>
          </div>

          <!-- Item Name -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold uppercase tracking-wider text-gray-400">
                Lot Item Title *
              </label>
              <span
                v-if="isAnalyzingWithAi"
                class="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 animate-pulse"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                AutoVision AI detecting...
              </span>
            </div>
            <input
              v-model="itemName"
              type="text"
              :placeholder="isAnalyzingWithAi ? 'AutoVision AI is detecting lot title...' : 'e.g. 1999 Base Set Charizard Holo 1st Edition PSA 9'"
              class="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-gray-600 transition-all"
              :class="{ 'border-emerald-500/60 ring-1 ring-emerald-500/40 bg-emerald-950/20': isAnalyzingWithAi }"
            />
          </div>

          <!-- Item Description -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold uppercase tracking-wider text-gray-400">
                Collector Description &amp; Provenance
              </label>
              <span
                v-if="isAnalyzingWithAi"
                class="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 animate-pulse"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                AutoVision AI drafting...
              </span>
            </div>
            <textarea
              v-model="description"
              rows="3"
              :placeholder="isAnalyzingWithAi ? 'AutoVision AI is compiling collector description from image...' : 'Describe condition, grading certificate, authenticity, or collector details...'"
              class="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-gray-600 resize-none transition-all"
              :class="{ 'border-emerald-500/60 ring-1 ring-emerald-500/40 bg-emerald-950/20': isAnalyzingWithAi }"
            ></textarea>
          </div>

          <!-- Pricing Configuration (Starting Price & Increment) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-950/60 p-4 rounded-2xl border border-gray-800">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
                Desired Starting Price (₱ PHP) *
              </label>
              <div class="relative">
                <span class="absolute left-3.5 top-2.5 text-gray-400 font-bold">₱</span>
                <input
                  v-model.number="startingPrice"
                  type="number"
                  min="1"
                  step="50"
                  class="w-full bg-gray-900 border border-gray-700 rounded-xl pl-8 pr-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <p class="text-[11px] text-gray-500 mt-1">Bidding opens at this minimum floor.</p>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
                <span>Bid Increment (₱ PHP)</span>
                <span class="text-[10px] text-emerald-400 font-mono">Strict 50 PHP Rule</span>
              </label>
              <div class="relative">
                <span class="absolute left-3.5 top-2.5 text-gray-400 font-bold">₱</span>
                <input
                  v-model.number="bidIncrement"
                  type="number"
                  min="50"
                  step="50"
                  class="w-full bg-gray-900 border border-gray-700 rounded-xl pl-8 pr-4 py-2.5 text-base font-bold text-gray-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <p class="text-[11px] text-gray-500 mt-1">Default 50 PHP per counter-bid.</p>
            </div>
          </div>

          <!-- Ending Date & Time (Anti-Sniping Engine) -->
          <div class="space-y-3 bg-gray-950/60 p-4 rounded-2xl border border-gray-800">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold uppercase tracking-wider text-amber-400">
                End Date & Time *
              </label>
              <span class="text-xs text-amber-300 font-medium">
                {{ estimatedDurationText }}
              </span>
            </div>

            <input
              v-model="endTime"
              type="datetime-local"
              class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />

            <!-- Presets -->
            <div>
              <div class="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Quick Duration Presets:
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="setEndTimePreset(3)"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                >
                  +3 Hours (Flash)
                </button>
                <button
                  type="button"
                  @click="setEndTimePreset(12)"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                >
                  +12 Hours
                </button>
                <button
                  type="button"
                  @click="setEndTimePreset(24)"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-900/40 hover:bg-emerald-800/40 text-emerald-300 border border-emerald-700/50 transition-colors"
                >
                  +24 Hours (1 Day)
                </button>
                <button
                  type="button"
                  @click="setEndTimePreset(72)"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  @click="setEndTimePreset(168)"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                >
                  +7 Days (1 Week)
                </button>
              </div>
            </div>

            <!-- Anti sniping notice -->
            <div class="flex items-start gap-2 bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-3 text-xs text-indigo-300">
              <span class="text-base leading-none">🛡️</span>
              <p>
                <strong>Anti-Sniping Engine:</strong> If a bid is received in the final 5 minutes of the auction, the ending time is automatically extended by 5 minutes.
              </p>
            </div>
          </div>

          <!-- Product Image Upload / URL with AutoVision Dropzone -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold uppercase tracking-wider text-gray-400">
                Product Image &amp; AutoVision Trigger
              </label>
              <span v-if="autoFillWithAi" class="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <span>✨</span> Auto-fills title &amp; description
              </span>
            </div>

            <!-- Hidden File Input -->
            <input
              ref="auctionFileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/jpg"
              class="hidden"
              @change="handleFileChange"
            />

            <!-- Drag & Drop / Upload Box -->
            <div
              class="p-5 border-2 border-dashed rounded-2xl text-center space-y-3 transition-all cursor-pointer relative"
              :class="[
                isDraggingOver
                  ? 'border-emerald-500 bg-emerald-950/40 scale-[0.99]'
                  : 'border-gray-800 hover:border-emerald-500/60 bg-gray-950/70',
                isAnalyzingWithAi ? 'opacity-70 pointer-events-none' : '',
              ]"
              @dragover.prevent="isDraggingOver = true"
              @dragleave.prevent="isDraggingOver = false"
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
            >
              <div v-if="imagePreviewUrl" class="flex flex-col sm:flex-row items-center justify-center gap-4 py-1" @click.stop>
                <div class="w-24 h-24 rounded-2xl overflow-hidden bg-black border border-gray-700 flex-shrink-0 relative group shadow-lg">
                  <img :src="resolveStorageUrl(imagePreviewUrl)" alt="Preview" class="w-full h-full object-cover" />
                  <button
                    type="button"
                    @click="imagePreviewUrl = ''; imageUrl = ''; selectedImageFile = null;"
                    class="absolute inset-0 bg-black/75 text-rose-300 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity"
                    title="Remove Photo"
                  >
                    Remove ✕
                  </button>
                </div>

                <div class="text-left space-y-2">
                  <div>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ Image Ready for Auction
                    </span>
                    <p class="text-xs text-gray-300 font-medium mt-1 truncate max-w-xs">
                      {{ selectedImageFile ? selectedImageFile.name : (imageUrl || 'Direct image link') }}
                    </p>
                  </div>

                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      @click="triggerReanalyzeAi"
                      :disabled="isAnalyzingWithAi"
                      class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <span v-if="isAnalyzingWithAi" class="animate-spin text-[10px]">⏳</span>
                      <span v-else>✨</span>
                      <span>{{ isAnalyzingWithAi ? 'Analyzing...' : 'Re-analyze with AutoVision' }}</span>
                    </button>

                    <button
                      type="button"
                      @click="triggerFileInput"
                      class="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              </div>

              <div v-else>
                <div class="w-12 h-12 mx-auto rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-xs">
                  📸
                </div>
                <div class="mt-2">
                  <p class="text-xs font-bold text-gray-200">
                    <span class="text-emerald-400 underline font-black">Click to upload item photo</span> or drag &amp; drop here
                  </p>
                  <p class="text-[11px] text-gray-400 mt-0.5">
                    PNG, JPG, WEBP &bull; AutoVision AI automatically detects lot name &amp; description
                  </p>
                </div>
              </div>

              <!-- Direct URL Fallback -->
              <div class="pt-2 max-w-md mx-auto" @click.stop>
                <div class="flex items-center gap-2">
                  <input
                    v-model="imageUrl"
                    type="url"
                    placeholder="Or paste direct image URL (https://...)"
                    class="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    @keyup.enter="analyzeUrlWithAi"
                  />
                  <button
                    type="button"
                    @click="analyzeUrlWithAi"
                    :disabled="isAnalyzingWithAi || !imageUrl.trim()"
                    class="px-3 py-2 rounded-xl bg-gray-800 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                    title="Load URL and analyze with AutoVision AI"
                  >
                    <span>Use URL</span>
                    <span v-if="autoFillWithAi">✨</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-6 bg-gray-950 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="isModalOpen = false"
            class="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitCreateAuction"
            :disabled="auctionStore.isSubmitting"
            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/40 disabled:opacity-50 transition-all active:scale-95"
          >
            <span v-if="auctionStore.isSubmitting" class="animate-spin">⏳</span>
            <span>{{ auctionStore.isSubmitting ? 'Launching Auction...' : 'Launch Live Auction' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- BID LEDGER MODAL -->
    <div
      v-if="isLedgerModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div class="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div class="p-5 bg-gray-950 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 class="text-base font-black text-white flex items-center gap-2">
              <span>📜</span>
              Bid Ledger - Lot #{{ selectedAuctionForLedger?.id }}
            </h3>
            <p class="text-xs text-gray-400 mt-0.5 line-clamp-1">
              {{ selectedAuctionForLedger?.item_name }}
            </p>
          </div>
          <button
            @click="isLedgerModalOpen = false"
            class="w-11 h-11 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
            aria-label="Close bid ledger modal"
          >
            ✕
          </button>
        </div>

        <div class="p-5 flex-1 overflow-y-auto">
          <div v-if="isLedgerLoading" class="text-center py-8 text-gray-400 text-xs">
            Loading ledger...
          </div>
          <div v-else-if="ledgerBids.length === 0" class="text-center py-8 text-gray-400 text-xs">
            No bids have been recorded yet for this auction lot.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(b, idx) in ledgerBids"
              :key="b.id"
              class="flex items-center justify-between p-3 rounded-xl border text-xs"
              :class="
                idx === 0
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                  : 'bg-gray-950/60 border-gray-800 text-gray-300'
              "
            >
              <div class="flex items-center gap-2">
                <span v-if="idx === 0" class="text-sm">👑</span>
                <div>
                  <div class="font-bold">
                    {{ b.masked_username }}
                    <span
                      v-if="b.is_proxy"
                      class="ml-1 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50"
                    >
                      Proxy Auto
                    </span>
                  </div>
                  <div class="text-[10px] text-gray-500 font-mono mt-0.5">
                    {{ new Date(b.created_at).toLocaleString() }}
                  </div>
                </div>
              </div>
              <div class="font-mono font-black text-sm text-right" :class="idx === 0 ? 'text-emerald-400' : 'text-gray-200'">
                {{ formatPrice(b.amount) }}
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-gray-950 border-t border-gray-800 flex justify-end">
          <button
            @click="isLedgerModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
