<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { resolveApiUrl, resolveStorageUrl } from '@/shared/utils/api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useAdminStore } from '../admin.store';

const authStore = useAuthStore();
const adminStore = useAdminStore();

const cleanSlabDummyUrl = (url?: string | null): string => {
  if (!url || url.startsWith('/images/slabs/')) return '';
  return url;
};

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const token = authStore.token || (adminStore as any).token;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ─── GACHA IMAGE UPLOADS & ADD PRIZE TIER MODAL ───────────────────────────────
const isUploadingImage = ref(false);
const isAddingPrizeTier = ref(false);
const isNewTierAiAnalyzing = ref(false);
const newTierFileInput = ref<HTMLInputElement | null>(null);

const newPrizeTierForm = ref<GachaItemDraft>({
  name: '',
  rarity: 'SSR',
  card_condition: 'PSA 10 GEM MINT',
  image_url: '',
  weight: 25,
  estimated_value: 5000,
  buyback_credit_value: 4000,
  stock_total: 5,
  stock_remaining: 5,
  is_grand_prize: false,
});

const uploadBannerImage = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);
  try {
    isUploadingImage.value = true;
    showToast('Uploading banner artwork...');
    const res = await fetch(resolveApiUrl('/admin/gacha/upload-image'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (res.ok && data.url) {
      bannerForm.value.image_url = data.url;
      showToast('Banner artwork uploaded successfully!');
    } else {
      showToast(data.message || 'Failed to upload image', 'error');
    }
  } catch (e: any) {
    showToast(e.message || 'Upload failed', 'error');
  } finally {
    isUploadingImage.value = false;
    input.value = '';
  }
};

const uploadItemImage = async (event: Event, index: number) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);
  try {
    isUploadingImage.value = true;
    showToast(`Uploading product image for tier #${index + 1}...`);
    const res = await fetch(resolveApiUrl('/admin/gacha/upload-image'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (res.ok && data.url) {
      bannerForm.value.items[index].image_url = data.url;
      showToast(`Product image uploaded for ${bannerForm.value.items[index].name || 'Prize Tier'}!`);
    } else {
      showToast(data.message || 'Failed to upload image', 'error');
    }
  } catch (e: any) {
    showToast(e.message || 'Upload failed', 'error');
  } finally {
    isUploadingImage.value = false;
    input.value = '';
  }
};

const uploadNewTierImage = async (event: Event, useAiVision = false) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];

  if (useAiVision) {
    isNewTierAiAnalyzing.value = true;
    try {
      const formData = new FormData();
      formData.append('image', file);
      showToast('Analyzing product photo with AI Vision...');
      const res = await fetch(resolveApiUrl('/ai/analyze-product-image'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const d = json.data;
        if (d.title) newPrizeTierForm.value.name = d.title;
        if (d.condition) newPrizeTierForm.value.card_condition = d.condition.toUpperCase();
        if (d.image_url) newPrizeTierForm.value.image_url = d.image_url;
        if (d.suggested_price && Number(d.suggested_price) > 0) {
          const val = Math.round(Number(d.suggested_price));
          newPrizeTierForm.value.estimated_value = val;
          newPrizeTierForm.value.buyback_credit_value = Math.round(val * 0.8);
        }
        showToast('Product image uploaded & details auto-populated via AI Vision!');
      } else {
        throw new Error(json.message || 'AI Vision failed, falling back to direct upload...');
      }
    } catch {
      // Fallback to direct image upload
      const fd = new FormData();
      fd.append('image', file);
      const r = await fetch(resolveApiUrl('/admin/gacha/upload-image'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: fd,
      });
      const d = await r.json();
      if (r.ok && d.url) {
        newPrizeTierForm.value.image_url = d.url;
        showToast('Product image uploaded!');
      }
    } finally {
      isNewTierAiAnalyzing.value = false;
      input.value = '';
    }
    return;
  }

  const formData = new FormData();
  formData.append('image', file);
  try {
    isUploadingImage.value = true;
    showToast('Uploading prize product image...');
    const res = await fetch(resolveApiUrl('/admin/gacha/upload-image'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (res.ok && data.url) {
      newPrizeTierForm.value.image_url = data.url;
      showToast('Prize product image uploaded successfully!');
    } else {
      showToast(data.message || 'Failed to upload image', 'error');
    }
  } catch (e: any) {
    showToast(e.message || 'Upload failed', 'error');
  } finally {
    isUploadingImage.value = false;
    input.value = '';
  }
};

const confirmAddPrizeTierItem = () => {
  if (!newPrizeTierForm.value.name.trim()) {
    showToast('Please enter a Prize Item Name.', 'error');
    return;
  }
  const est = Math.max(0, Number(newPrizeTierForm.value.estimated_value) || 0);
  const buyback =
    Number(newPrizeTierForm.value.buyback_credit_value) > 0
      ? Number(newPrizeTierForm.value.buyback_credit_value)
      : Math.round(est * 0.8);
  const stock = Math.max(1, Number(newPrizeTierForm.value.stock_remaining) || 1);

  bannerForm.value.items.push({
    name: newPrizeTierForm.value.name.trim(),
    rarity: newPrizeTierForm.value.rarity,
    card_condition: newPrizeTierForm.value.card_condition || 'PSA 10 GEM MINT',
    image_url: newPrizeTierForm.value.image_url,
    weight: Math.max(1, Number(newPrizeTierForm.value.weight) || 10),
    estimated_value: est,
    buyback_credit_value: buyback,
    stock_total: stock,
    stock_remaining: stock,
    is_grand_prize: ['SECRET_GRAIL', 'SSR'].includes(newPrizeTierForm.value.rarity),
  });

  showToast(`Added "${newPrizeTierForm.value.name}" to prize pool! Click "Save Gacha Banner & Live Weights" to publish.`);
  newPrizeTierForm.value = {
    name: '',
    rarity: 'SSR',
    card_condition: 'PSA 10 GEM MINT',
    image_url: '',
    weight: 25,
    estimated_value: 5000,
    buyback_credit_value: 4000,
    stock_total: 5,
    stock_remaining: 5,
    is_grand_prize: false,
  };
  isAddingPrizeTier.value = false;
};

// Top Tab Switcher: Gacha Oripa vs 100-Slot Raffles
const activeTab = ref<'gacha' | 'raffles' | 'vault'>('gacha');

// ─── DIGITAL VAULT PHYSICAL DISPATCHES MODULE ────────────────────────────────
const adminVaultShipments = ref<any[]>([]);
const adminCarriers = ref<any[]>([]);
const isVaultLoading = ref(false);
const vaultStatusFilter = ref('all');
const vaultSearchQuery = ref('');

const fetchAdminVaultShipments = async () => {
  isVaultLoading.value = true;
  try {
    let url = resolveApiUrl('/admin/vault/shipments?per_page=50');
    if (vaultStatusFilter.value !== 'all') {
      url += '&status=' + encodeURIComponent(vaultStatusFilter.value);
    }
    if (vaultSearchQuery.value.trim()) {
      url += '&search=' + encodeURIComponent(vaultSearchQuery.value.trim());
    }
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (res.ok) {
      const json = await res.json();
      adminVaultShipments.value = json.data || [];
    }
  } catch (e: any) {
    showToast('Failed to load vault shipments: ' + e.message, 'error');
  } finally {
    isVaultLoading.value = false;
  }
};

const fetchAdminCarriers = async () => {
  try {
    const res = await fetch(resolveApiUrl('/admin/shipping-carriers'), { headers: getAuthHeaders() });
    if (res.ok) {
      const json = await res.json();
      adminCarriers.value = json.data || json || [];
    }
  } catch {
    adminCarriers.value = [];
  }
};

const handleUpdateVaultShipment = async (shipment: any) => {
  try {
    const res = await fetch(resolveApiUrl('/admin/vault/shipments/' + shipment.id), {
      method: 'PATCH',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: shipment.status,
        ref_shipping_carrier_id: shipment.ref_shipping_carrier_id || null,
        tracking_number: shipment.tracking_number || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Update failed');
    }
    showToast('Shipment #' + shipment.id + ' (' + shipment.batch_code + ') updated to ' + shipment.status + '!', 'success');
    await fetchAdminVaultShipments();
  } catch (e: any) {
    showToast('Could not update shipment: ' + e.message, 'error');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GACHA PROBABILITY CONFIGURATOR STATE
// ─────────────────────────────────────────────────────────────────────────────
interface GachaItemDraft {
  id?: number;
  name: string;
  rarity: 'SECRET_GRAIL' | 'SSR' | 'SR' | 'R' | 'N';
  card_condition: string;
  image_url: string;
  weight: number;
  estimated_value: number;
  buyback_credit_value: number;
  stock_total: number;
  stock_remaining: number;
  is_grand_prize: boolean;
}

const gachaBanners = ref<any[]>([]);
const bannerForm = ref({
  id: null as number | null,
  name: 'Evolving Skies Grail Oripa Vault',
  series_tag: 'Pokémon TCG • PSA Graded Oripa',
  description: 'Authentic Japanese Oripa Mystery Pull featuring PSA 10 Moonbreon VMAX, Charizard VMAX & Rayquaza VMAX.',
  image_url: '',
  cost_per_pull: 350,
  multi_pull_count: 10,
  multi_pull_cost: 3150,
  is_active: true,
  items: [
    {
      name: 'PSA 10 Umbreon VMAX #215 (Alt Art Moonbreon)',
      rarity: 'SECRET_GRAIL',
      card_condition: 'PSA 10 GEM MINT',
      image_url: '',
      weight: 5,
      estimated_value: 68500,
      buyback_credit_value: 54800,
      stock_total: 2,
      stock_remaining: 2,
      is_grand_prize: true,
    },
  ] as GachaItemDraft[],
});

// Real-time Probability & EV Calculations
const totalGachaWeight = computed(() => {
  return bannerForm.value.items.reduce((sum, item) => sum + Math.max(0, Number(item.weight) || 0), 0);
});

const gachaItemsWithProbabilities = computed(() => {
  const total = totalGachaWeight.value;
  return bannerForm.value.items.map((item) => {
    const w = Math.max(0, Number(item.weight) || 0);
    const exactPercentage = total > 0 ? ((w / total) * 100).toFixed(2) : '0.00';
    return {
      ...item,
      exactPercentage,
      expectedValueContribution: total > 0 ? (w / total) * (Number(item.estimated_value) || 0) : 0,
    };
  });
});

const expectedValuePerPull = computed(() => {
  return gachaItemsWithProbabilities.value.reduce((acc, item) => acc + item.expectedValueContribution, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 100-SLOT RAFFLE MANAGEMENT & AI VISION AUTO-POPULATE STATE
// ─────────────────────────────────────────────────────────────────────────────
const rafflesList = ref<any[]>([]);
const isCreatingRaffle = ref(false);
const isAiAnalyzing = ref(false);
const aiAnalysisSuccess = ref<string | null>(null);

const raffleForm = ref({
  item_name: '',
  description: '',
  item_image: '',
  grade_badge: 'PSA 10 GEM MINT',
  retail_value: 68500,
  total_slots: 100,
  slot_price: 685,
});

const imageFileInput = ref<HTMLInputElement | null>(null);
const uploadedImagePreview = ref<string | null>(null);

// Shared UI Feedback
const isLoading = ref(false);
const isSubmitting = ref(false);
const toastMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);

const showToast = (text: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = { type, text };
  setTimeout(() => {
    toastMessage.value = null;
  }, 4000);
};

const formatCurrency = (val: number) => {
  return Number(val || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// API CALLS: GACHA
// ─────────────────────────────────────────────────────────────────────────────
const fetchAdminGachaBanners = async () => {
  try {
    const res = await fetch(resolveApiUrl('/gacha?include_inactive=1'), {
      headers: { Accept: 'application/json' },
    });
    const json = await res.json();
    if (json.success && json.data?.banners?.length > 0) {
      gachaBanners.value = json.data.banners;
      selectBannerToEdit(json.data.banners[0]);
    }
  } catch (e: any) {
    console.error('Failed to load gacha banners:', e);
  }
};

const selectBannerToEdit = (b: any) => {
  bannerForm.value = {
    id: b.id,
    name: b.name,
    series_tag: b.series_tag || 'Pokémon TCG',
    description: b.description || '',
    image_url: cleanSlabDummyUrl(b.image_url),
    cost_per_pull: Number(b.cost_per_pull || 350),
    multi_pull_count: Number(b.multi_pull_count || 10),
    multi_pull_cost: Number(b.multi_pull_cost || 3150),
    is_active: Boolean(b.is_active),
    items: (b.items || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      rarity: i.rarity || 'R',
      card_condition: i.card_condition || 'PSA 10 Gem Mint / NM',
      image_url: cleanSlabDummyUrl(i.image_url),
      weight: Number(i.weight || 100),
      estimated_value: Number(i.estimated_value || 500),
      buyback_credit_value: Number(i.buyback_credit_value || 400),
      stock_total: Number(i.stock_total || 50),
      stock_remaining: Number(i.stock_remaining || 50),
      is_grand_prize: Boolean(i.is_grand_prize),
    })),
  };
};

const startNewBannerDraft = () => {
  bannerForm.value = {
    id: null,
    name: 'New Mystery Oripa Banner',
    series_tag: 'Pokémon / One Piece TCG',
    description: 'Curated graded slabs and booster hits with transparent weighted pull rates.',
    image_url: '',
    cost_per_pull: 300,
    multi_pull_count: 10,
    multi_pull_cost: 2700,
    is_active: true,
    items: [
      {
        name: 'PSA 10 Chase Grail Slab',
        rarity: 'SECRET_GRAIL',
        card_condition: 'PSA 10 GEM MINT',
        image_url: '',
        weight: 10,
        estimated_value: 25000,
        buyback_credit_value: 20000,
        stock_total: 2,
        stock_remaining: 2,
        is_grand_prize: true,
      },
    ],
  };
};

const addGachaPoolRow = () => {
  isAddingPrizeTier.value = !isAddingPrizeTier.value;
};

const removeGachaPoolRow = (idx: number) => {
  if (bannerForm.value.items.length <= 1) return;
  bannerForm.value.items.splice(idx, 1);
};

const saveGachaBannerConfig = async () => {
  isSubmitting.value = true;
  try {
    const res = await fetch(resolveApiUrl('/admin/gacha/banners'), {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...bannerForm.value,
        admin_name: adminStore.currentAdmin?.name || 'Admin Staff',
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to save Gacha configuration.');
    }
    showToast(json.message || 'Gacha banner saved successfully!');
    await fetchAdminGachaBanners();
  } catch (e: any) {
    showToast(e.message || 'Save failed.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// API CALLS: 100-SLOT RAFFLES
// ─────────────────────────────────────────────────────────────────────────────
const fetchRaffles = async () => {
  isLoading.value = true;
  try {
    const res = await fetch(resolveApiUrl('/raffles'), {
      headers: { Accept: 'application/json' },
    });
    const json = await res.json();
    if (json.success && json.data) {
      rafflesList.value = json.data.raffles || [];
    }
  } catch (e: any) {
    showToast(e.message || 'Failed to load raffles list.', 'error');
  } finally {
    isLoading.value = false;
  }
};

// AI Vision: Trigger photo upload & Gemini auto-populate
const handlePhotoSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    uploadedImagePreview.value = URL.createObjectURL(file);
    triggerAiVisionAnalysis(file);
  }
};

const triggerAiVisionAnalysis = async (file: File) => {
  isAiAnalyzing.value = true;
  aiAnalysisSuccess.value = null;

  try {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(resolveApiUrl('/ai/analyze-product-image'), {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'AI Vision analysis could not identify the item.');
    }

    const data = json.data;
    
    // Auto-populate raffle form with high fidelity AI response
    raffleForm.value.item_name = data.title || raffleForm.value.item_name;
    raffleForm.value.description = data.description || raffleForm.value.description;
    
    if (data.image_url) {
      raffleForm.value.item_image = data.image_url;
      uploadedImagePreview.value = data.image_url;
    }

    // Set condition / grade badge
    if (data.condition) {
      raffleForm.value.grade_badge = `AUTHENTIC • ${data.condition.toUpperCase()}`;
    }

    // Auto-calculate slot price based on market estimated price / 100 slots
    if (data.suggested_price && Number(data.suggested_price) > 0) {
      const price = Math.round(Number(data.suggested_price));
      raffleForm.value.retail_value = price;
      raffleForm.value.slot_price = Math.max(1, Math.ceil(price / (raffleForm.value.total_slots || 100)));
    }

    aiAnalysisSuccess.value = `✨ AI Vision identified: "${data.title}" (Est. ₱${formatCurrency(raffleForm.value.retail_value)})`;
    showToast('Product auto-populated successfully using Gemini AI Vision!');
  } catch (err: any) {
    showToast(err.message || 'AI analysis failed.', 'error');
  } finally {
    isAiAnalyzing.value = false;
  }
};

const recalculateSlotPrice = () => {
  if (raffleForm.value.total_slots > 0 && raffleForm.value.retail_value > 0) {
    raffleForm.value.slot_price = Math.max(1, Math.ceil(raffleForm.value.retail_value / raffleForm.value.total_slots));
  }
};

const submitCreateRaffle = async () => {
  if (!raffleForm.value.item_name.trim()) {
    showToast('Please enter an item name for the raffle.', 'error');
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await fetch(resolveApiUrl('/raffles'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(raffleForm.value),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to create raffle.');
    }

    showToast(json.message || 'New Live Slot Grail Raffle launched!');
    isCreatingRaffle.value = false;
    // Reset form
    raffleForm.value = {
      item_name: '',
      description: '',
      item_image: '',
      grade_badge: 'PSA 10 GEM MINT',
      retail_value: 68500,
      total_slots: 100,
      slot_price: 685,
    };
    uploadedImagePreview.value = null;
    aiAnalysisSuccess.value = null;
    await fetchRaffles();
  } catch (e: any) {
    showToast(e.message || 'Failed to launch raffle.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

// Admin Test Trigger: Fast-fill slots & simulate draw
const simulateTestDraw = async (raffleId: number) => {
  if (!confirm('Run instant 100/100 slot fill and trigger the live number roulette draw?')) return;

  isSubmitting.value = true;
  try {
    const res = await fetch(resolveApiUrl(`/raffles/${raffleId}/simulate-draw`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Could not trigger test draw.');
    }
    showToast(json.message || 'Roulette draw triggered!');
    await fetchRaffles();
  } catch (e: any) {
    showToast(e.message || 'Test draw failed.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

// Remove/Delete Live Slot Raffle
const deleteRaffle = async (raffleId: number, raffleName: string) => {
  if (!confirm(`Are you sure you want to remove "${raffleName}"? Any purchased tickets will be automatically refunded to collectors.`)) {
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await fetch(resolveApiUrl(`/raffles/${raffleId}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Could not delete live slot raffle.');
    }
    showToast(json.message || 'Live Slot Raffle removed.');
    await fetchRaffles();
  } catch (e: any) {
    showToast(e.message || 'Failed to remove raffle.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  fetchAdminVaultShipments();
  fetchAdminCarriers();
  await Promise.all([fetchAdminGachaBanners(), fetchRaffles()]);
});
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 text-slate-100 bg-slate-950 min-h-full">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <span class="text-xs font-black uppercase tracking-widest text-amber-400">
          🎰 GAMIFIED COLLECTIBLES HUB
        </span>
        <h1 class="text-xl sm:text-2xl font-black text-white mt-0.5">
          Gacha Mystery Oripa &amp; Live Slot Raffles Manager
        </h1>
      </div>

      <!-- Top Tab Navigation -->
      <div class="flex flex-wrap gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2"
          :class="activeTab === 'gacha' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'"
          @click="activeTab = 'gacha'"
        >
          <span>🎴 Gacha Probability Configurator</span>
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2"
          :class="activeTab === 'raffles' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'"
          @click="activeTab = 'raffles'"
        >
          <span>🎟️ Live Slot Raffles &amp; AI Vision</span>
          <span
            v-if="rafflesList.length > 0"
            class="px-1.5 py-0.5 rounded-full text-[10px]"
            :class="activeTab === 'raffles' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'"
          >
            {{ rafflesList.length }}
          </span>
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2"
          :class="activeTab === 'vault' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'"
          @click="
            activeTab = 'vault';
            fetchAdminVaultShipments();
          "
        >
          <span>🏛️ Digital Vault Deliveries</span>
          <span
            v-if="adminVaultShipments.length > 0"
            class="px-1.5 py-0.5 rounded-full text-[10px]"
            :class="activeTab === 'vault' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'"
          >
            {{ adminVaultShipments.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Toast Feedback -->
    <div
      v-if="toastMessage"
      class="p-4 rounded-2xl border text-xs font-bold flex items-center justify-between"
      :class="
        toastMessage.type === 'success'
          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
      "
    >
      <span>{{ toastMessage.text }}</span>
      <button type="button" class="cursor-pointer" @click="toastMessage = null">✕</button>
    </div>

    <!-- ═════════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 1: GACHA PROBABILITY CONFIGURATOR (FULLY RESPONSIVE)                -->
    <!-- ═════════════════════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'gacha'" class="space-y-6">
      <!-- Existing Banners Selector + New Banner Button -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5">
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="b in gachaBanners"
            :key="b.id"
            type="button"
            class="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black border cursor-pointer transition-all truncate max-w-[240px]"
            :class="
              bannerForm.id === b.id
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            "
            @click="selectBannerToEdit(b)"
          >
            {{ b.name }}
          </button>
        </div>
        <button
          type="button"
          class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
          @click="startNewBannerDraft"
        >
          <span>+ Create New Gacha Banner</span>
        </button>
      </div>

      <!-- Banner Settings & Mathematical Summary -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="md:col-span-2">
            <label class="text-xs font-bold text-slate-300 block mb-1">Gacha Banner Title</label>
            <input
              v-model="bannerForm.name"
              type="text"
              class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold"
            />
          </div>
          <div class="md:col-span-2">
            <label class="text-xs font-bold text-slate-300 block mb-1">Banner Artwork / Pack Cover Image</label>
            <div class="flex items-center gap-2">
              <img
                v-if="bannerForm.image_url"
                :src="resolveStorageUrl(bannerForm.image_url)"
                class="w-10 h-10 object-contain rounded-lg bg-slate-950 border border-slate-800 shrink-0"
              />
              <div v-else class="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-xs shrink-0 text-slate-500">
                🎴
              </div>
              <input
                v-model="bannerForm.image_url"
                type="text"
                placeholder="Upload cover photo or paste Image URL"
                class="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
              <label class="px-3 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-black cursor-pointer border border-amber-400/40 shrink-0 flex items-center gap-1.5">
                <span>📸</span> Upload
                <input type="file" accept="image/*" class="hidden" @change="uploadBannerImage" />
              </label>
              <button
                v-if="bannerForm.image_url"
                type="button"
                class="px-2.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 text-xs font-bold cursor-pointer border border-rose-500/30 shrink-0"
                title="Remove Banner Image"
                @click="bannerForm.image_url = ''"
              >
                ✕
              </button>
            </div>
          </div>
          <div>
            <label class="text-xs font-bold text-slate-300 block mb-1">Single Pull Cost (₱ PHP)</label>
            <input
              v-model.number="bannerForm.cost_per_pull"
              type="number"
              min="1"
              class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-amber-400 font-mono font-black"
            />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-300 block mb-1">10x Multi-Pull Cost (₱ PHP)</label>
            <input
              v-model.number="bannerForm.multi_pull_cost"
              type="number"
              min="1"
              class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-emerald-400 font-mono font-black"
            />
          </div>
        </div>

        <!-- Real-time Probability Telemetry Bar (Responsive Grid) -->
        <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center text-xs">
          <div class="p-2 sm:p-0">
            <span class="text-slate-400 block text-[11px] uppercase">Total Pool Weight:</span>
            <strong class="font-mono text-amber-400 text-base sm:text-lg">{{ totalGachaWeight.toLocaleString() }}</strong>
          </div>
          <div class="p-2 sm:p-0">
            <span class="text-slate-400 block text-[11px] uppercase">Mathematical EV / Pull:</span>
            <strong class="font-mono text-emerald-400 text-base sm:text-lg">₱{{ formatCurrency(expectedValuePerPull) }}</strong>
          </div>
          <div class="p-2 sm:p-0">
            <span class="text-slate-400 block text-[11px] uppercase">Cumulative Probability:</span>
            <strong class="font-mono text-cyan-400 text-base sm:text-lg">100.00%</strong>
          </div>
          <div class="flex sm:justify-end">
            <button
              type="button"
              class="w-full sm:w-auto px-4 py-2.5 rounded-xl font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              :class="
                isAddingPrizeTier
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                  : 'bg-amber-400 text-slate-950 shadow-md hover:bg-amber-300'
              "
              @click="isAddingPrizeTier = !isAddingPrizeTier"
            >
              <span>{{ isAddingPrizeTier ? '✕ Close Prize Tier Form' : '+ Add Prize Tier Item (with Product Image)' }}</span>
            </button>
          </div>
        </div>

        <!-- ═════════════════════════════════════════════════════════════════ -->
        <!-- ADD NEW PRIZE TIER ITEM CREATOR FORM (WITH PRODUCT IMAGE UPLOAD)  -->
        <!-- ═════════════════════════════════════════════════════════════════ -->
        <div
          v-if="isAddingPrizeTier"
          class="p-5 sm:p-6 rounded-2xl bg-slate-950 border-2 border-amber-400/50 space-y-5 shadow-2xl animate-fade-in"
        >
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span class="text-[11px] font-black uppercase tracking-wider text-amber-400">
                📸 New Gacha Prize Tier Creator
              </span>
              <h3 class="text-base font-black text-white">
                Upload Product Image &amp; Configure Prize Tier Odds
              </h3>
            </div>
            <button
              type="button"
              class="text-xs font-bold text-slate-400 hover:text-white cursor-pointer px-2.5 py-1 rounded-lg bg-slate-900"
              @click="isAddingPrizeTier = false"
            >
              ✕ Close
            </button>
          </div>

          <!-- Product Image Upload Dropzone & Preview -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div
              class="md:col-span-7 border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-2xl p-5 text-center transition-all bg-slate-900/60 flex flex-col items-center justify-center space-y-3"
            >
              <div class="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-2xl">
                📸
              </div>
              <div class="space-y-0.5">
                <p class="text-xs font-bold text-white">Upload Product Image for this Prize Tier</p>
                <p class="text-[11px] text-slate-400">Supports PNG, JPG, WEBP graded slabs, singles &amp; sealed boxes</p>
              </div>
              <div class="flex flex-wrap items-center justify-center gap-2">
                <label class="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md inline-flex items-center gap-1.5">
                  <span>📁 Upload Product Image</span>
                  <input type="file" accept="image/*" class="hidden" @change="uploadNewTierImage($event, false)" />
                </label>
                <label class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer shadow-md inline-flex items-center gap-1.5">
                  <span v-if="isNewTierAiAnalyzing" class="animate-spin">🌀</span>
                  <span v-else>✨</span>
                  <span>{{ isNewTierAiAnalyzing ? 'AI Analyzing...' : 'Upload & Auto-Fill via AI Vision' }}</span>
                  <input type="file" accept="image/*" class="hidden" @change="uploadNewTierImage($event, true)" />
                </label>
              </div>
              <div class="w-full pt-1">
                <input
                  v-model="newPrizeTierForm.image_url"
                  type="text"
                  placeholder="Or paste direct Product Image URL here..."
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <!-- Live Image Preview Box -->
            <div class="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900 border border-slate-800 min-h-[190px] text-center">
              <div v-if="newPrizeTierForm.image_url" class="space-y-2">
                <img
                  :src="resolveStorageUrl(newPrizeTierForm.image_url)"
                  alt="Prize Preview"
                  class="h-36 mx-auto object-contain rounded-xl drop-shadow-lg"
                />
                <div class="flex items-center justify-center gap-2">
                  <span class="text-[11px] font-bold text-emerald-400">✓ Product Image Ready</span>
                  <button
                    type="button"
                    class="text-[11px] font-bold text-rose-400 hover:underline cursor-pointer"
                    @click="newPrizeTierForm.image_url = ''"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div v-else class="text-slate-500 text-xs space-y-1">
                <span class="text-3xl block">🃏</span>
                <p class="font-bold text-slate-400">No Product Image Selected Yet</p>
                <p class="text-[11px]">Upload a photo on the left to attach it to this prize tier</p>
              </div>
            </div>
          </div>

          <!-- Prize Tier Metadata Fields -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div class="sm:col-span-2">
              <label class="text-[11px] font-bold text-slate-300 block mb-1">Prize Item Name *</label>
              <input
                v-model="newPrizeTierForm.name"
                type="text"
                placeholder="e.g. PSA 10 Charizard VMAX #002"
                class="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-300 block mb-1">Rarity Tier</label>
              <select
                v-model="newPrizeTierForm.rarity"
                class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold"
              >
                <option value="SECRET_GRAIL">SECRET_GRAIL</option>
                <option value="SSR">SSR</option>
                <option value="SR">SR</option>
                <option value="R">R</option>
                <option value="N">N</option>
              </select>
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-300 block mb-1">Condition / Grade</label>
              <input
                v-model="newPrizeTierForm.card_condition"
                type="text"
                placeholder="PSA 10 GEM MINT"
                class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-semibold"
              />
            </div>
            <div>
              <label class="text-[11px] font-bold text-amber-300 block mb-1">Weight (RNG)</label>
              <input
                v-model.number="newPrizeTierForm.weight"
                type="number"
                min="1"
                class="w-full px-3 py-2 bg-slate-900 border border-amber-500/50 rounded-xl text-amber-300 font-mono font-black text-xs"
              />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-300 block mb-1">Est. Value (₱) &amp; Stock</label>
              <div class="grid grid-cols-2 gap-1.5">
                <input
                  v-model.number="newPrizeTierForm.estimated_value"
                  type="number"
                  min="0"
                  placeholder="₱ Value"
                  class="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                  @input="newPrizeTierForm.buyback_credit_value = Math.round((Number(newPrizeTierForm.estimated_value) || 0) * 0.8)"
                />
                <input
                  v-model.number="newPrizeTierForm.stock_remaining"
                  type="number"
                  min="1"
                  placeholder="Stock"
                  class="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              @click="isAddingPrizeTier = false"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg transition-all"
              @click="confirmAddPrizeTierItem"
            >
              ✓ Add Prize Tier to Pool
            </button>
          </div>
        </div>

        <!-- Desktop Tabular View (Large screens) -->
        <div class="hidden md:block overflow-x-auto rounded-2xl border border-slate-800">
          <table class="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr class="border-b border-slate-800 bg-slate-950/80 text-[11px] font-black uppercase text-slate-400">
                <th class="py-3 px-3">Prize Item Name</th>
                <th class="py-3 px-3 w-64">Product Image (Upload / URL)</th>
                <th class="py-3 px-3">Rarity Tier</th>
                <th class="py-3 px-3 w-28">Weight (RNG)</th>
                <th class="py-3 px-3 w-40">Real-Time Pull %</th>
                <th class="py-3 px-3 w-32">Est. Value (₱)</th>
                <th class="py-3 px-3 w-24">Stock</th>
                <th class="py-3 px-3 text-right">Remove</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/70 text-xs">
              <tr v-for="(item, idx) in bannerForm.items" :key="idx" class="hover:bg-slate-800/30">
                <td class="py-2.5 px-3">
                  <input
                    v-model="item.name"
                    type="text"
                    placeholder="Card Name"
                    class="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-semibold text-xs"
                  />
                </td>
                <td class="py-2.5 px-3">
                  <div class="flex items-center gap-2">
                    <img
                      v-if="item.image_url"
                      :src="resolveStorageUrl(item.image_url)"
                      class="w-10 h-10 rounded-lg object-contain bg-slate-950 border border-slate-700 shrink-0"
                    />
                    <div v-else class="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-xs shrink-0 text-slate-500">
                      🃏
                    </div>
                    <label
                      class="px-2.5 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-[11px] font-black cursor-pointer border border-amber-400/40 shrink-0 flex items-center gap-1"
                      title="Upload Product Image from Computer"
                    >
                      <span>📸</span>
                      <span>Upload</span>
                      <input type="file" accept="image/*" class="hidden" @change="uploadItemImage($event, idx)" />
                    </label>
                    <input
                      v-model="item.image_url"
                      type="text"
                      placeholder="Or Image URL"
                      class="w-24 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-white font-mono"
                    />
                    <button
                      v-if="item.image_url"
                      type="button"
                      class="px-1.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold cursor-pointer shrink-0"
                      title="Clear Product Image"
                      @click="item.image_url = ''"
                    >
                      ✕
                    </button>
                  </div>
                </td>
                <td class="py-2.5 px-3">
                  <select
                    v-model="item.rarity"
                    class="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                  >
                    <option value="SECRET_GRAIL">SECRET_GRAIL</option>
                    <option value="SSR">SSR</option>
                    <option value="SR">SR</option>
                    <option value="R">R</option>
                    <option value="N">N</option>
                  </select>
                </td>
                <td class="py-2.5 px-3">
                  <input
                    v-model.number="item.weight"
                    type="number"
                    min="1"
                    class="w-full px-2.5 py-1.5 bg-slate-950 border border-amber-500/50 rounded-lg text-amber-300 font-mono font-black"
                  />
                </td>
                <td class="py-2.5 px-3">
                  <div class="space-y-1">
                    <span class="font-mono font-black text-emerald-400 text-xs">
                      {{ gachaItemsWithProbabilities[idx]?.exactPercentage }}%
                    </span>
                    <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                        :style="{ width: `${Math.min(100, Number(gachaItemsWithProbabilities[idx]?.exactPercentage || 0))}%` }"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="py-2.5 px-3">
                  <input
                    v-model.number="item.estimated_value"
                    type="number"
                    min="0"
                    class="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </td>
                <td class="py-2.5 px-3">
                  <input
                    v-model.number="item.stock_remaining"
                    type="number"
                    min="0"
                    class="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                    @change="item.stock_total = Math.max(item.stock_total, item.stock_remaining)"
                  />
                </td>
                <td class="py-2.5 px-3 text-right">
                  <button
                    type="button"
                    class="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 font-bold cursor-pointer"
                    @click="removeGachaPoolRow(idx)"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile-Responsive Card View (Small screens) -->
        <div class="md:hidden space-y-4">
          <div
            v-for="(item, idx) in bannerForm.items"
            :key="idx"
            class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-black text-amber-400">Prize Tier #{{ idx + 1 }}</span>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold cursor-pointer"
                @click="removeGachaPoolRow(idx)"
              >
                ✕ Remove
              </button>
            </div>

            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Item Name</label>
              <input
                v-model="item.name"
                type="text"
                class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-semibold"
              />
            </div>

            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Prize Product Image</label>
              <div class="flex items-center gap-2">
                <img
                  v-if="item.image_url"
                  :src="resolveStorageUrl(item.image_url)"
                  class="w-10 h-10 rounded-lg object-contain bg-slate-900 border border-slate-700 shrink-0"
                />
                <div v-else class="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs shrink-0 text-slate-500">
                  🃏
                </div>
                <label class="px-3 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-black cursor-pointer border border-amber-400/40 shrink-0">
                  📸 Upload
                  <input type="file" accept="image/*" class="hidden" @change="uploadItemImage($event, idx)" />
                </label>
                <input
                  v-model="item.image_url"
                  type="text"
                  placeholder="Or Image URL"
                  class="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                />
                <button
                  v-if="item.image_url"
                  type="button"
                  class="px-2.5 py-2 rounded-xl bg-rose-500/15 text-rose-300 text-xs font-bold cursor-pointer"
                  @click="item.image_url = ''"
                >
                  ✕
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Rarity</label>
                <select
                  v-model="item.rarity"
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-bold"
                >
                  <option value="SECRET_GRAIL">SECRET_GRAIL</option>
                  <option value="SSR">SSR</option>
                  <option value="SR">SR</option>
                  <option value="R">R</option>
                  <option value="N">N</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-amber-300 uppercase block mb-1">Weight (RNG)</label>
                <input
                  v-model.number="item.weight"
                  type="number"
                  min="1"
                  class="w-full px-3 py-2 bg-slate-900 border border-amber-500/40 rounded-xl text-amber-300 font-mono font-bold text-xs"
                />
              </div>
            </div>

            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-400">Real-Time Pull Probability:</span>
                <span class="font-mono font-black text-emerald-400">{{ gachaItemsWithProbabilities[idx]?.exactPercentage }}%</span>
              </div>
              <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                  :style="{ width: `${Math.min(100, Number(gachaItemsWithProbabilities[idx]?.exactPercentage || 0))}%` }"
                ></div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Est. Value (₱)</label>
                <input
                  v-model.number="item.estimated_value"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                />
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Remaining Stock</label>
                <input
                  v-model.number="item.stock_remaining"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="button"
            :disabled="isSubmitting"
            class="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer transition-all"
            @click="saveGachaBannerConfig"
          >
            {{ isSubmitting ? 'Saving Live Weights...' : '💾 Save Gacha Banner & Live Weights' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═════════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 2: 100-SLOT RAFFLE ARENA & AI VISION AUTO-POPULATE                  -->
    <!-- ═════════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'raffles'" class="space-y-6">
      <!-- Create Raffle Trigger / Header -->
      <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <div>
          <h2 class="text-base font-black text-white flex items-center gap-2">
            <span>🎟️</span>
            <span>Live Slot Grail Raffles &amp; Number Roulette Management</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Launch collector raffles with photo uploading and Gemini AI Vision auto-population.
          </p>
        </div>

        <button
          type="button"
          class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all hover:scale-105"
          @click="isCreatingRaffle = !isCreatingRaffle"
        >
          {{ isCreatingRaffle ? '✕ Close Raffle Form' : '+ Launch Live Slot Raffle' }}
        </button>
      </div>

      <!-- CREATE RAFFLE FORM WITH AI VISION -->
      <div v-if="isCreatingRaffle" class="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
        <div class="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <span class="text-xs font-black uppercase text-amber-400 tracking-wider">✨ AI-Powered Raffle Creator</span>
            <h3 class="text-lg font-black text-white">Upload Prize Photo &amp; Auto-Populate Details</h3>
          </div>
          <span class="text-xs text-slate-400">Powered by Gemini 3.8 Vision</span>
        </div>

        <!-- AI Image Upload Dropzone -->
        <div class="space-y-3">
          <label class="text-xs font-bold text-slate-300 block">
            Prize Card / Figure Photo (Upload or Take Snapshot)
          </label>
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <!-- Dropzone / Picker (7 cols) -->
            <div
              class="md:col-span-7 border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-950/60 flex flex-col items-center justify-center space-y-3"
              @click="imageFileInput?.click()"
            >
              <input
                ref="imageFileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handlePhotoSelect"
              />
              <div class="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-2xl">
                <span>📸</span>
              </div>
              <div class="space-y-1">
                <p class="text-xs font-bold text-white">Click to upload prize image or drag &amp; drop</p>
                <p class="text-[11px] text-slate-400">Supports PNG, JPG, WEBP slabs up to 15MB</p>
              </div>
              <button
                type="button"
                :disabled="isAiAnalyzing"
                class="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md inline-flex items-center gap-1.5"
                @click.stop="imageFileInput?.click()"
              >
                <span v-if="isAiAnalyzing" class="animate-spin">🌀</span>
                <span v-else>✨</span>
                <span>{{ isAiAnalyzing ? 'Analyzing with AI Vision...' : 'Select Photo & Auto-Populate' }}</span>
              </button>
            </div>

            <!-- Preview Card (5 cols) -->
            <div class="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center min-h-[180px]">
              <div v-if="uploadedImagePreview" class="space-y-2">
                <img
                  :src="uploadedImagePreview"
                  alt="Prize Preview"
                  class="h-44 object-contain rounded-xl drop-shadow-xl mx-auto"
                />
                <span class="text-[11px] text-emerald-400 font-mono font-bold block">✓ Prize Image Loaded</span>
              </div>
              <div v-else class="text-slate-500 text-xs space-y-1">
                <span class="text-3xl block opacity-40">🖼️</span>
                <span>No prize image chosen yet</span>
              </div>
            </div>
          </div>

          <!-- AI Status banner -->
          <div
            v-if="aiAnalysisSuccess"
            class="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between"
          >
            <span>{{ aiAnalysisSuccess }}</span>
            <span class="text-[10px] uppercase font-black bg-emerald-500/20 px-2 py-0.5 rounded">Auto-Filled</span>
          </div>
        </div>

        <!-- Form Fields Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="sm:col-span-2">
            <label class="text-xs font-bold text-slate-300 block mb-1">Item Title *</label>
            <input
              v-model="raffleForm.item_name"
              type="text"
              placeholder="e.g. PSA 10 Umbreon VMAX #215 Alt Art Moonbreon"
              class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="text-xs font-bold text-slate-300 block mb-1">Grade / Condition Badge</label>
            <input
              v-model="raffleForm.grade_badge"
              type="text"
              placeholder="e.g. PSA 10 GEM MINT"
              class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-bold text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="text-xs font-bold text-slate-300 block mb-1">Total Slots</label>
            <input
              v-model.number="raffleForm.total_slots"
              type="number"
              min="10"
              max="500"
              class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-400"
              @input="recalculateSlotPrice"
            />
          </div>

          <div>
            <label class="text-xs font-bold text-slate-300 block mb-1">Retail Value (₱ PHP)</label>
            <input
              v-model.number="raffleForm.retail_value"
              type="number"
              min="100"
              class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-mono font-black text-xs focus:outline-none focus:border-amber-400"
              @input="recalculateSlotPrice"
            />
          </div>

          <div>
            <label class="text-xs font-bold text-slate-300 block mb-1">Slot Price (₱ PHP)</label>
            <input
              v-model.number="raffleForm.slot_price"
              type="number"
              min="1"
              class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 font-mono font-black text-xs focus:outline-none focus:border-amber-400"
            />
            <span class="text-[10px] text-slate-400 mt-1 block">
              Auto: ₱{{ formatCurrency(raffleForm.retail_value) }} ÷ {{ raffleForm.total_slots }} slots = ₱{{ raffleForm.slot_price }}/slot
            </span>
          </div>

          <div class="sm:col-span-2">
            <label class="text-xs font-bold text-slate-300 block mb-1">Prize Image URL</label>
            <input
              v-model="raffleForm.item_image"
              type="text"
              placeholder="/images/slabs/umbreon-vmax-slab.png or Cloudflare R2 link"
              class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 font-mono text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="sm:col-span-2 lg:col-span-4">
            <label class="text-xs font-bold text-slate-300 block mb-1">Raffle Description &amp; Terms</label>
            <textarea
              v-model="raffleForm.description"
              rows="3"
              placeholder="Explain shipping terms, grading certificate numbers, and live roulette mechanics..."
              class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-700"
            @click="isCreatingRaffle = false"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="isSubmitting"
            class="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-lg transition-all disabled:opacity-50"
            @click="submitCreateRaffle"
          >
            {{ isSubmitting ? 'Launching Raffle...' : '🚀 Launch Live Slot Raffle' }}
          </button>
        </div>
      </div>

      <!-- ACTIVE & CONCLUDED RAFFLES GRID -->
      <div class="space-y-4">
        <h3 class="text-base font-bold text-white flex items-center justify-between">
          <span>Active &amp; Concluded Raffles ({{ rafflesList.length }})</span>
          <button
            type="button"
            class="text-xs text-amber-400 hover:text-amber-300 cursor-pointer font-bold"
            @click="fetchRaffles"
          >
            🔄 Refresh List
          </button>
        </h3>

        <div v-if="rafflesList.length === 0" class="p-12 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-3xl">
          No raffles found. Click "+ Launch Live Slot Raffle" above to create one.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="raffle in rafflesList"
            :key="raffle.id"
            class="rounded-3xl bg-slate-900 border p-5 flex flex-col justify-between space-y-4 transition-all"
            :class="
              raffle.status === 'open'
                ? 'border-amber-400/40 hover:border-amber-400 shadow-lg'
                : raffle.status === 'drawing'
                ? 'border-fuchsia-500 animate-pulse'
                : 'border-slate-800 opacity-90'
            "
          >
            <!-- Badge & Status Header -->
            <div class="flex items-center justify-between gap-2">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-950 border border-slate-800 text-amber-300">
                {{ raffle.grade_badge || 'PSA 10' }}
              </span>
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase"
                :class="
                  raffle.status === 'open'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : raffle.status === 'drawing'
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                    : 'bg-slate-800 text-slate-400'
                "
              >
                {{ raffle.status === 'open' ? '🟢 Open for Claims' : raffle.status === 'drawing' ? '⚡ Live Drawing' : '✓ Concluded' }}
              </span>
            </div>

            <!-- Prize Visual & Title -->
            <div class="flex items-center gap-4">
              <div class="w-20 h-24 bg-slate-950 rounded-2xl border border-slate-800 p-2 flex items-center justify-center flex-shrink-0">
                <img
                  :src="raffle.item_image || '/images/slabs/umbreon-vmax-slab.png'"
                  :alt="raffle.item_name"
                  class="max-h-full object-contain drop-shadow"
                />
              </div>
              <div class="min-w-0 flex-1 space-y-1">
                <h4 class="text-xs font-black text-white line-clamp-2 leading-tight">
                  {{ raffle.item_name }}
                </h4>
                <p class="text-[11px] font-mono text-emerald-400 font-bold">
                  Value: ₱{{ formatCurrency(raffle.retail_value) }}
                </p>
                <p class="text-[10px] text-amber-300 font-mono">
                  ₱{{ formatCurrency(raffle.slot_price) }} / slot
                </p>
              </div>
            </div>

            <!-- Slot Claim Progress Bar -->
            <div class="space-y-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-400 text-[11px]">Slots Claimed:</span>
                <span class="font-mono font-black text-white">
                  {{ raffle.taken_slots_count || 0 }} / {{ raffle.total_slots || 100 }}
                </span>
              </div>
              <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                  :style="{ width: `${((raffle.taken_slots_count || 0) / (raffle.total_slots || 100)) * 100}%` }"
                ></div>
              </div>
              <div class="flex items-center justify-between text-[10px] text-slate-400">
                <span>{{ raffle.remaining_slots_count || 0 }} slots open</span>
                <span class="text-emerald-400 font-mono font-bold">
                  ₱{{ formatCurrency((raffle.taken_slots_count || 0) * raffle.slot_price) }} pooled
                </span>
              </div>
            </div>

            <!-- Winner details if completed -->
            <div v-if="raffle.winner_slot" class="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs">
              <span class="text-[10px] text-amber-400 font-black uppercase block">🎉 Winning Slot #{{ raffle.winner_slot }}</span>
              <p class="font-bold text-white text-[11px]">Winner: {{ raffle.winner_name || `User #${raffle.winner_user_id}` }}</p>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 pt-1">
              <button
                v-if="raffle.status === 'open'"
                type="button"
                class="flex-1 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-bold cursor-pointer transition-all"
                @click="simulateTestDraw(raffle.id)"
              >
                ⚡ Fast-Fill &amp; Draw
              </button>
              <a
                :href="`/raffles/${raffle.id}`"
                target="_blank"
                class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-center text-xs font-bold transition-all"
              >
                👁️ View Arena ↗
              </a>
              <button
                type="button"
                class="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                title="Remove Live Slot Raffle"
                @click="deleteRaffle(raffle.id, raffle.item_name)"
              >
                <span>🗑️</span>
                <span class="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- ═════════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 3: DIGITAL VAULT PHYSICAL DISPATCHES & COURIER FULFILLMENT         -->
    <!-- ═════════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'vault'" class="space-y-6">
      <!-- Control Bar: Status Filter & Search -->
      <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="st in ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']"
            :key="st"
            type="button"
            class="px-3.5 py-1.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer"
            :class="
              vaultStatusFilter === st
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
            "
            @click="
              vaultStatusFilter = st;
              fetchAdminVaultShipments();
            "
          >
            {{ st }}
          </button>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <input
            v-model="vaultSearchQuery"
            type="text"
            placeholder="Search batch code, tracking #, recipient, card..."
            class="px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 w-full sm:w-72 focus:outline-none focus:border-amber-400"
            @keyup.enter="fetchAdminVaultShipments"
          />
          <button
            type="button"
            class="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl cursor-pointer shadow-md"
            @click="fetchAdminVaultShipments"
          >
            Search
          </button>
        </div>
      </div>

      <!-- Shipments Table -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-black text-white">Vault Physical Fulfillment Requests</h3>
            <p class="text-xs text-slate-400">Manage physical dispatches of slabs won from Live Slot Raffles and pulled from Gacha Mystery Oripas.</p>
          </div>
          <span class="text-xs font-mono font-bold text-slate-400">
            {{ adminVaultShipments.length }} Record(s)
          </span>
        </div>

        <div v-if="isVaultLoading" class="py-12 text-center text-slate-400 text-xs font-bold">
          <div class="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading vault shipments...
        </div>

        <div v-else-if="adminVaultShipments.length === 0" class="py-12 text-center text-slate-400 text-xs">
          No vault shipment records found matching criteria.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-800 text-[10px] font-black uppercase text-slate-400">
                <th class="pb-3 px-2">Batch / ID</th>
                <th class="pb-3 px-2">Won Slab / Card</th>
                <th class="pb-3 px-2">Source</th>
                <th class="pb-3 px-2">Collector &amp; Recipient</th>
                <th class="pb-3 px-2">Carrier</th>
                <th class="pb-3 px-2">Waybill / Tracking #</th>
                <th class="pb-3 px-2">Status</th>
                <th class="pb-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr v-for="s in adminVaultShipments" :key="s.id" class="hover:bg-slate-950/40">
                <!-- Batch & ID -->
                <td class="py-3 px-2 whitespace-nowrap">
                  <span class="font-mono font-black text-amber-400 block">{{ s.batch_code }}</span>
                  <span class="text-[10px] text-slate-500">Shipment #{{ s.id }}</span>
                </td>

                <!-- Slab Item -->
                <td class="py-3 px-2">
                  <div class="flex items-center gap-2.5 min-w-[200px]">
                    <img
                      v-if="s.vault_item?.image_url"
                      :src="resolveStorageUrl(s.vault_item.image_url)"
                      class="w-9 h-11 object-contain rounded bg-slate-950 border border-slate-800 shrink-0"
                    />
                    <div class="truncate">
                      <div class="font-bold text-white truncate" :title="s.vault_item?.item_name">
                        {{ s.vault_item?.item_name || 'Graded Slab' }}
                      </div>
                      <div class="text-[10px] text-slate-400">
                        {{ s.vault_item?.card_condition }} • {{ s.vault_item?.rarity }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Source -->
                <td class="py-3 px-2 whitespace-nowrap">
                  <span
                    v-if="s.vault_item?.source === 'live_slot' || s.vault_item?.raffle_id"
                    class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  >
                    🎯 Live Slot
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  >
                    🎴 Gacha
                  </span>
                </td>

                <!-- Collector & Recipient -->
                <td class="py-3 px-2 min-w-[180px]">
                  <div class="font-bold text-white">{{ s.recipient_name }}</div>
                  <div class="text-[10px] text-slate-400 font-mono">{{ s.phone }}</div>
                  <div class="text-[10px] text-slate-500 truncate max-w-[220px]" :title="s.address">{{ s.address }}</div>
                </td>

                <!-- Carrier Dropdown -->
                <td class="py-3 px-2 whitespace-nowrap">
                  <select
                    v-model="s.ref_shipping_carrier_id"
                    class="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option :value="null">-- Select Carrier --</option>
                    <option v-for="c in adminCarriers" :key="c.id" :value="c.id">
                      {{ c.short_name || c.name }}
                    </option>
                  </select>
                </td>

                <!-- Tracking Number Input -->
                <td class="py-3 px-2 whitespace-nowrap">
                  <input
                    v-model="s.tracking_number"
                    type="text"
                    placeholder="Enter Waybill #"
                    class="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-36"
                  />
                </td>

                <!-- Status Dropdown -->
                <td class="py-3 px-2 whitespace-nowrap">
                  <select
                    v-model="s.status"
                    class="px-2.5 py-1.5 bg-slate-950 border rounded-lg text-xs font-bold focus:outline-none"
                    :class="{
                      'text-amber-400 border-amber-500/50': s.status === 'pending' || s.status === 'processing',
                      'text-indigo-300 border-indigo-500/50': s.status === 'shipped',
                      'text-emerald-400 border-emerald-500/50': s.status === 'delivered',
                      'text-rose-400 border-rose-500/50': s.status === 'cancelled',
                    }"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>

                <!-- Action -->
                <td class="py-3 px-2 whitespace-nowrap text-right">
                  <button
                    type="button"
                    class="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95"
                    @click="handleUpdateVaultShipment(s)"
                  >
                    Save
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

