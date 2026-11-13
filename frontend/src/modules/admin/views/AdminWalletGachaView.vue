<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { resolveApiUrl } from '@/shared/utils/api';
import { useAdminStore } from '../admin.store';

const adminStore = useAdminStore();

const activeTab = ref<'wallets' | 'topups' | 'gacha' | 'audit'>('wallets');

// Wallet Oversight State
const searchQuery = ref('');
const usersList = ref<any[]>([]);
const pendingTopups = ref<any[]>([]);
const auditLogs = ref<any[]>([]);
const metrics = ref({
  total_available_float: 0,
  total_held_escrow: 0,
  pending_topups_count: 0,
  pending_topups_amount: 0,
});

// Manual Wallet Adjustment Modal State
const isAdjustModalOpen = ref(false);
const selectedUserForAdjustment = ref<any | null>(null);
const adjustmentType = ref<'credit' | 'debit'>('credit');
const adjustmentAmount = ref<number>(500);
const adjustmentAuditNote = ref<string>('');

// Withdrawal Review Modal State
const selectedWithdrawal = ref<any | null>(null);
const withdrawalReviewDecision = ref<'approved' | 'rejected'>('approved');
const withdrawalReviewNote = ref<string>('');

// Gacha Configurator State (Dynamic Form + Real-time Computed Probability %)
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
  image_url: '/images/slabs/umbreon-vmax-slab.png',
  cost_per_pull: 350,
  multi_pull_count: 10,
  multi_pull_cost: 3150,
  is_active: true,
  items: [
    {
      name: 'PSA 10 Umbreon VMAX #215 (Alt Art Moonbreon)',
      rarity: 'SECRET_GRAIL',
      card_condition: 'PSA 10 GEM MINT',
      image_url: '/images/slabs/umbreon-vmax-slab.png',
      weight: 5,
      estimated_value: 68500,
      buyback_credit_value: 54800,
      stock_total: 2,
      stock_remaining: 2,
      is_grand_prize: true,
    },
    {
      name: 'PSA 10 Charizard VMAX #002 Shiny Starter',
      rarity: 'SSR',
      card_condition: 'PSA 10 GEM MINT',
      image_url: '/images/slabs/charizard-vmax-slab.png',
      weight: 20,
      estimated_value: 18500,
      buyback_credit_value: 14800,
      stock_total: 5,
      stock_remaining: 5,
      is_grand_prize: true,
    },
    {
      name: 'PSA 10 Rayquaza VMAX #218 Evolving Skies Alt Art',
      rarity: 'SSR',
      card_condition: 'PSA 10 GEM MINT',
      image_url: '/images/slabs/rayquaza-vmax-slab.png',
      weight: 25,
      estimated_value: 24000,
      buyback_credit_value: 19200,
      stock_total: 4,
      stock_remaining: 4,
      is_grand_prize: false,
    },
    {
      name: 'Pokémon Card 151 (SV2a) Japanese SAR Full Art Hit',
      rarity: 'SR',
      card_condition: 'Near Mint (NM)',
      image_url: '/images/slabs/charizard-vmax-slab.png',
      weight: 150,
      estimated_value: 1850,
      buyback_credit_value: 1480,
      stock_total: 30,
      stock_remaining: 30,
      is_grand_prize: false,
    },
    {
      name: 'Sealed Japanese Booster Pack + Double Holo Foil',
      rarity: 'N',
      card_condition: 'Factory Sealed',
      image_url: '/images/slabs/rayquaza-vmax-slab.png',
      weight: 800,
      estimated_value: 280,
      buyback_credit_value: 220,
      stock_total: 200,
      stock_remaining: 200,
      is_grand_prize: false,
    },
  ] as GachaItemDraft[],
});

/**
 * Reactive computed property that calculates and displays the exact percentage chance
 * of pulling each item in real-time based on total weights.
 */
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

const fetchAdminWalletData = async () => {
  isLoading.value = true;
  try {
    const res = await fetch(
      resolveApiUrl(`/admin/wallet/overview?search=${encodeURIComponent(searchQuery.value)}`),
      { headers: { Accept: 'application/json' } }
    );
    const json = await res.json();
    if (json.success && json.data) {
      usersList.value = json.data.users || [];
      pendingTopups.value = json.data.pending_topups || [];
      auditLogs.value = json.data.audit_logs || [];
      metrics.value = json.data.metrics || metrics.value;
    }
  } catch (e: any) {
    showToast(e.message || 'Failed to load wallet overview.', 'error');
  } finally {
    isLoading.value = false;
  }
};

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
  } catch {
  }
};

const selectBannerToEdit = (b: any) => {
  bannerForm.value = {
    id: b.id,
    name: b.name,
    series_tag: b.series_tag || 'Pokémon TCG',
    description: b.description || '',
    image_url: b.image_url || '/images/slabs/umbreon-vmax-slab.png',
    cost_per_pull: Number(b.cost_per_pull || 350),
    multi_pull_count: Number(b.multi_pull_count || 10),
    multi_pull_cost: Number(b.multi_pull_cost || 3150),
    is_active: Boolean(b.is_active),
    items: (b.items || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      rarity: i.rarity || 'R',
      card_condition: i.card_condition || 'PSA 10 Gem Mint / NM',
      image_url: i.image_url || '/images/slabs/umbreon-vmax-slab.png',
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
    image_url: '/images/slabs/charizard-vmax-slab.png',
    cost_per_pull: 300,
    multi_pull_count: 10,
    multi_pull_cost: 2700,
    is_active: true,
    items: [
      {
        name: 'PSA 10 Chase Grail Slab',
        rarity: 'SECRET_GRAIL',
        card_condition: 'PSA 10 GEM MINT',
        image_url: '/images/slabs/charizard-vmax-slab.png',
        weight: 10,
        estimated_value: 25000,
        buyback_credit_value: 20000,
        stock_total: 2,
        stock_remaining: 2,
        is_grand_prize: true,
      },
      {
        name: 'Standard Art Rare / Holo Bundle',
        rarity: 'R',
        card_condition: 'Near Mint',
        image_url: '/images/slabs/umbreon-vmax-slab.png',
        weight: 990,
        estimated_value: 250,
        buyback_credit_value: 200,
        stock_total: 100,
        stock_remaining: 100,
        is_grand_prize: false,
      },
    ],
  };
};

const addGachaPoolRow = () => {
  bannerForm.value.items.push({
    name: 'New Gacha Prize Item',
    rarity: 'SR',
    card_condition: 'Near Mint (NM)',
    image_url: '/images/slabs/rayquaza-vmax-slab.png',
    weight: 50,
    estimated_value: 1200,
    buyback_credit_value: 960,
    stock_total: 20,
    stock_remaining: 20,
    is_grand_prize: false,
  });
};

const removeGachaPoolRow = (idx: number) => {
  if (bannerForm.value.items.length <= 1) return;
  bannerForm.value.items.splice(idx, 1);
};

// Open Manual Adjustment Modal
const openAdjustmentModal = (user: any) => {
  selectedUserForAdjustment.value = user;
  adjustmentType.value = 'credit';
  adjustmentAmount.value = 500;
  adjustmentAuditNote.value = '';
  isAdjustModalOpen.value = true;
};

const submitManualAdjustment = async () => {
  if (!selectedUserForAdjustment.value) return;
  if (adjustmentAuditNote.value.trim().length < 5) {
    showToast('A detailed audit note (min 5 chars) is mandatory for manual wallet adjustments.', 'error');
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await fetch(resolveApiUrl('/admin/wallet/adjust'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        user_id: selectedUserForAdjustment.value.id,
        adjustment_type: adjustmentType.value,
        amount: adjustmentAmount.value,
        audit_note: adjustmentAuditNote.value.trim(),
        admin_name: adminStore.currentAdmin?.name || 'Admin Staff',
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Adjustment failed.');
    }
    showToast(json.message);
    isAdjustModalOpen.value = false;
    await fetchAdminWalletData();
  } catch (e: any) {
    showToast(e.message || 'Adjustment failed.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const approveTopupRequest = async (topup: any) => {
  if (!confirm(`Are you sure you want to approve and credit ₱${formatCurrency(topup.amount)} to ${topup.user?.name || 'this collector'}?`)) {
    return;
  }
  isSubmitting.value = true;
  try {
    const res = await fetch(resolveApiUrl(`/admin/wallet/topups/${topup.id}/approve`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        admin_name: adminStore.currentAdmin?.name || 'Admin Chief',
        audit_note: `Manual admin verification of ₱${topup.amount} payment via ${topup.description || 'QR Ph / Bank'}`,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Approval failed.');
    }
    showToast(json.message);
    await fetchAdminWalletData();
  } catch (e: any) {
    showToast(e.message || 'Could not approve top-up.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const rejectTopupRequest = async (topup: any) => {
  const note = prompt('Please enter a rejection reason note for the audit log:', 'Payment unverified or cancelled by customer');
  if (!note) return;

  isSubmitting.value = true;
  try {
    const res = await fetch(resolveApiUrl(`/admin/wallet/topups/${topup.id}/reject`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        admin_name: adminStore.currentAdmin?.name || 'Admin Chief',
        audit_note: note,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Rejection failed.');
    }
    showToast(json.message);
    await fetchAdminWalletData();
  } catch (e: any) {
    showToast(e.message || 'Could not reject top-up.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const saveGachaBannerConfig = async () => {
  isSubmitting.value = true;
  try {
    const res = await fetch(resolveApiUrl('/admin/gacha/banners'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        ...bannerForm.value,
        admin_name: adminStore.currentAdmin?.name || 'Admin Staff',
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to save Gacha configuration.');
    }
    showToast(json.message);
    await fetchAdminGachaBanners();
    await fetchAdminWalletData();
  } catch (e: any) {
    showToast(e.message || 'Save failed.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchAdminWalletData(), fetchAdminGachaBanners()]);
});
</script>

<template>
  <div class="p-6 space-y-6 text-slate-100 bg-slate-950 min-h-full">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <span class="text-xs font-black uppercase tracking-widest text-amber-400">
          🛡️ Admin Control Panel Oversight
        </span>
        <h1 class="text-2xl font-black text-white mt-0.5">
          Wallet Ledger, Top-Up Approvals &amp; Gacha Configurator
        </h1>
      </div>

      <!-- Tab Switcher -->
      <div class="flex flex-wrap gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
          :class="activeTab === 'wallets' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'"
          @click="activeTab = 'wallets'"
        >
          💳 User Wallet Balances
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'topups' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'"
          @click="activeTab = 'topups'"
        >
          <span>⚡ Top-Up Approvals</span>
          <span
            v-if="pendingTopups.length > 0"
            class="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-black"
          >
            {{ pendingTopups.length }}
          </span>
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
          :class="activeTab === 'gacha' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'"
          @click="activeTab = 'gacha'"
        >
          🎴 Gacha Probability Configurator
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
          :class="activeTab === 'audit' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'"
          @click="activeTab = 'audit'"
        >
          📜 Admin Audit Trail
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

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <span class="text-[11px] font-bold uppercase text-slate-400 block">Total Available Wallet Float</span>
        <span class="text-2xl font-mono font-black text-emerald-400 mt-1 block">
          ₱{{ formatCurrency(metrics.total_available_float) }}
        </span>
      </div>
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <span class="text-[11px] font-bold uppercase text-slate-400 block">Total Held Bid Escrow</span>
        <span class="text-2xl font-mono font-black text-amber-400 mt-1 block">
          🔒 ₱{{ formatCurrency(metrics.total_held_escrow) }}
        </span>
      </div>
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <span class="text-[11px] font-bold uppercase text-slate-400 block">Pending Top-Up Queue</span>
        <span class="text-2xl font-mono font-black text-rose-400 mt-1 block">
          {{ pendingTopups.length }} Awaiting
        </span>
      </div>
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <span class="text-[11px] font-bold uppercase text-slate-400 block">Pending Top-Up Volume</span>
        <span class="text-2xl font-mono font-black text-white mt-1 block">
          ₱{{ formatCurrency(pendingTopups.reduce((sum, t) => sum + Number(t.amount || 0), 0)) }}
        </span>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- TAB 1: USER WALLET BALANCES & MANUAL ADJUSTMENT                     -->
    <!-- =================================================================== -->
    <div v-if="activeTab === 'wallets'" class="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h2 class="text-base font-black text-white">Collector Wallet Balances Data Table</h2>
        <div class="flex items-center gap-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search collector name or email..."
            class="px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            @keyup.enter="fetchAdminWalletData"
          />
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
            @click="fetchAdminWalletData"
          >
            Search
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-800 text-[11px] font-black uppercase text-slate-400">
              <th class="py-3 px-4">Collector</th>
              <th class="py-3 px-4">Email</th>
              <th class="py-3 px-4 text-right">Available Balance</th>
              <th class="py-3 px-4 text-right">Held Bid Escrow</th>
              <th class="py-3 px-4 text-center">Ledger Entries</th>
              <th class="py-3 px-4 text-right">Oversight Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/70 text-xs">
            <tr v-for="u in usersList" :key="u.id" class="hover:bg-slate-800/40">
              <td class="py-3.5 px-4 font-bold text-white">
                {{ u.name }}
                <span v-if="u.is_vip" class="ml-1 px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px]">VIP</span>
              </td>
              <td class="py-3.5 px-4 text-slate-300">{{ u.email }}</td>
              <td class="py-3.5 px-4 text-right font-mono font-black text-emerald-400">
                ₱{{ formatCurrency(u.wallet_balance) }}
              </td>
              <td class="py-3.5 px-4 text-right font-mono font-bold text-amber-300">
                ₱{{ formatCurrency(u.held_balance) }}
              </td>
              <td class="py-3.5 px-4 text-center font-mono text-slate-300">
                {{ u.wallet_transactions_count }}
              </td>
              <td class="py-3.5 px-4 text-right">
                <button
                  type="button"
                  class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                  @click="openAdjustmentModal(u)"
                >
                  ⚖️ Manual Adjustment
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- TAB 2: TOP-UP APPROVALS REVIEW QUEUE                                -->
    <!-- =================================================================== -->
    <div v-else-if="activeTab === 'topups'" class="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-black text-white">Collector Top-Up Approvals Queue</h2>
          <p class="text-xs text-slate-400">Review pending QR Ph &amp; direct bank deposits awaiting verification before crediting spendable balance.</p>
        </div>
        <button
          type="button"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
          @click="fetchAdminWalletData"
        >
          🔄 Refresh Queue
        </button>
      </div>

      <div v-if="pendingTopups.length === 0" class="py-12 text-center text-slate-400 text-xs">
        ✓ No pending top-up requests in queue. All collector deposits are reviewed!
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-800 text-[11px] font-black uppercase text-slate-400">
              <th class="py-3 px-4">TX ID</th>
              <th class="py-3 px-4">Collector</th>
              <th class="py-3 px-4">Payment Channel &amp; Reference</th>
              <th class="py-3 px-4 text-right">Amount</th>
              <th class="py-3 px-4 text-center">Status</th>
              <th class="py-3 px-4 text-right">Oversight Decision</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/70 text-xs">
            <tr v-for="t in pendingTopups" :key="t.id" class="hover:bg-slate-800/30">
              <td class="py-3.5 px-4 font-mono text-slate-400">#{{ t.id }}</td>
              <td class="py-3.5 px-4">
                <span class="font-bold text-white block">{{ t.user?.name || ('User #' + t.user_id) }}</span>
                <span class="text-[11px] text-slate-400">{{ t.user?.email || '—' }}</span>
              </td>
              <td class="py-3.5 px-4">
                <p class="font-bold text-amber-300">{{ t.description || 'Top-Up Request' }}</p>
                <span class="text-[10px] font-mono text-slate-400">REF: {{ t.reference_id || `TX-${t.id}` }}</span>
              </td>
              <td class="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                ₱{{ formatCurrency(t.amount) }}
              </td>
              <td class="py-3.5 px-4 text-center">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Awaiting Review
                </span>
              </td>
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    :disabled="isSubmitting"
                    class="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-md flex items-center gap-1 disabled:opacity-50"
                    @click="approveTopupRequest(t)"
                  >
                    <span>✓ Approve &amp; Credit</span>
                  </button>
                  <button
                    type="button"
                    :disabled="isSubmitting"
                    class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-50"
                    @click="rejectTopupRequest(t)"
                  >
                    <span>✕ Reject</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- TAB 3: DYNAMIC GACHA CONFIGURATOR WITH REACTIVE PROBABILITY %       -->
    <!-- =================================================================== -->
    <div v-else-if="activeTab === 'gacha'" class="space-y-6">
      <!-- Existing Banners Selector + New Banner Button -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-3xl p-5">
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="b in gachaBanners"
            :key="b.id"
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-black border cursor-pointer"
            :class="
              bannerForm.id === b.id
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-slate-950 text-slate-300 border-slate-800'
            "
            @click="selectBannerToEdit(b)"
          >
            {{ b.name }}
          </button>
        </div>
        <button
          type="button"
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer"
          @click="startNewBannerDraft"
        >
          + Create New Gacha Banner
        </button>
      </div>

      <!-- Banner Settings & Real-Time Mathematical Summary -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="md:col-span-2">
            <label class="text-xs font-bold text-slate-300 block mb-1">Gacha Banner Title</label>
            <input
              v-model="bannerForm.name"
              type="text"
              class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-bold"
            />
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

        <!-- Real-time Probability Telemetry Bar -->
        <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span class="text-slate-400">Total Pool Weight:</span>
            <strong class="ml-1.5 font-mono text-amber-400 text-sm">{{ totalGachaWeight.toLocaleString() }}</strong>
          </div>
          <div>
            <span class="text-slate-400">Mathematical Expected Value (EV) / Pull:</span>
            <strong class="ml-1.5 font-mono text-emerald-400 text-sm">₱{{ formatCurrency(expectedValuePerPull) }}</strong>
          </div>
          <div>
            <span class="text-slate-400">Cumulative Probability Check:</span>
            <strong class="ml-1.5 font-mono text-cyan-400 text-sm">100.00%</strong>
          </div>
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black cursor-pointer"
            @click="addGachaPoolRow"
          >
            + Add Prize Tier Item
          </button>
        </div>

        <!-- Dynamic Weighted Items Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-800 text-[11px] font-black uppercase text-slate-400">
                <th class="py-2.5 px-3">Prize Item Name</th>
                <th class="py-2.5 px-3">Rarity Tier</th>
                <th class="py-2.5 px-3">Weight (RNG)</th>
                <th class="py-2.5 px-3">Real-Time Pull %</th>
                <th class="py-2.5 px-3">Est. Value (₱)</th>
                <th class="py-2.5 px-3">Stock</th>
                <th class="py-2.5 px-3 text-right">Remove</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/70 text-xs">
              <tr v-for="(item, idx) in bannerForm.items" :key="idx">
                <td class="py-3 px-3">
                  <input
                    v-model="item.name"
                    type="text"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-semibold"
                  />
                </td>
                <td class="py-3 px-3">
                  <select
                    v-model="item.rarity"
                    class="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                  >
                    <option value="SECRET_GRAIL">SECRET_GRAIL</option>
                    <option value="SSR">SSR</option>
                    <option value="SR">SR</option>
                    <option value="R">R</option>
                    <option value="N">N</option>
                  </select>
                </td>
                <td class="py-3 px-3 w-32">
                  <input
                    v-model.number="item.weight"
                    type="number"
                    min="1"
                    class="w-full px-3 py-2 bg-slate-950 border border-amber-500/50 rounded-lg text-amber-300 font-mono font-black"
                  />
                </td>
                <td class="py-3 px-3 w-44">
                  <div class="space-y-1">
                    <span class="font-mono font-black text-emerald-400 text-sm">
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
                <td class="py-3 px-3 w-32">
                  <input
                    v-model.number="item.estimated_value"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </td>
                <td class="py-3 px-3 w-28">
                  <input
                    v-model.number="item.stock_remaining"
                    type="number"
                    min="0"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                    @change="item.stock_total = Math.max(item.stock_total, item.stock_remaining)"
                  />
                </td>
                <td class="py-3 px-3 text-right">
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

        <div class="flex justify-end">
          <button
            type="button"
            :disabled="isSubmitting"
            class="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
            @click="saveGachaBannerConfig"
          >
            {{ isSubmitting ? 'Saving Banner...' : '💾 Save Gacha Banner & Live Weights' }}
          </button>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- TAB 4: IMMUTABLE ADMIN AUDIT LOGS                                   -->
    <!-- =================================================================== -->
    <div v-else-if="activeTab === 'audit'" class="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
      <h2 class="text-base font-black text-white">Immutable Admin Oversight Audit Log</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-800 text-[11px] font-black uppercase text-slate-400">
              <th class="py-3 px-4">Action</th>
              <th class="py-3 px-4">Admin</th>
              <th class="py-3 px-4">Mandatory Audit Note</th>
              <th class="py-3 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/70 text-xs">
            <tr v-for="log in auditLogs" :key="log.id">
              <td class="py-3 px-4 font-mono font-bold text-amber-300 uppercase">{{ log.action_type }}</td>
              <td class="py-3 px-4 font-bold text-white">{{ log.admin_name }}</td>
              <td class="py-3 px-4 text-slate-300">{{ log.audit_note }}</td>
              <td class="py-3 px-4 text-right text-slate-400">{{ new Date(log.created_at).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MANUAL WALLET ADJUSTMENT MODAL -->
    <teleport to="body">
      <div
        v-if="isAdjustModalOpen && selectedUserForAdjustment"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click="isAdjustModalOpen = false"
      >
        <div
          class="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl"
          @click.stop
        >
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-black text-white">
              Manual Wallet Adjustment — {{ selectedUserForAdjustment.name }}
            </h3>
            <button type="button" class="text-slate-400 hover:text-white cursor-pointer" @click="isAdjustModalOpen = false">✕</button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="py-2.5 rounded-xl font-black cursor-pointer border"
                :class="
                  adjustmentType === 'credit'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                "
                @click="adjustmentType = 'credit'"
              >
                + Credit Balance
              </button>
              <button
                type="button"
                class="py-2.5 rounded-xl font-black cursor-pointer border"
                :class="
                  adjustmentType === 'debit'
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                "
                @click="adjustmentType = 'debit'"
              >
                - Debit Balance
              </button>
            </div>

            <div>
              <label class="font-bold text-slate-300 block mb-1">Adjustment Amount (₱ PHP)</label>
              <input
                v-model.number="adjustmentAmount"
                type="number"
                min="1"
                class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
              />
            </div>

            <div>
              <label class="font-bold text-amber-300 block mb-1">Mandatory Audit Note *</label>
              <textarea
                v-model="adjustmentAuditNote"
                rows="3"
                placeholder="Explain the exact reason for this manual balance adjustment (required for compliance)..."
                class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
              ></textarea>
            </div>
          </div>

          <button
            type="button"
            :disabled="isSubmitting || adjustmentAuditNote.trim().length < 5"
            class="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer disabled:opacity-50"
            @click="submitManualAdjustment"
          >
            {{ isSubmitting ? 'Executing Adjustment...' : 'Confirm & Record Audit Adjustment' }}
          </button>
        </div>
      </div>
    </teleport>

    <!-- WITHDRAWAL REVIEW CONFIRMATION MODAL -->
    <teleport to="body">
      <div
        v-if="false"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click="selectedWithdrawal = null"
      >
        <div
          class="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl"
          @click.stop
        >
          <h3 class="text-base font-black text-white">
            {{ withdrawalReviewDecision === 'approved' ? 'Approve' : 'Reject' }} Withdrawal #{{ selectedWithdrawal.id }}
          </h3>
          <p class="text-xs text-slate-300">
            Amount: <strong class="font-mono text-amber-300">₱{{ formatCurrency(selectedWithdrawal.amount) }}</strong> via {{ selectedWithdrawal.payout_method }}
          </p>
          <div>
            <label class="text-xs font-bold text-slate-300 block mb-1">Audit / Transfer Reference Note *</label>
            <textarea
              v-model="withdrawalReviewNote"
              rows="3"
              class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            ></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" class="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 cursor-pointer" @click="selectedWithdrawal = null">
              Cancel
            </button>
            <button
              type="button"
              :disabled="isSubmitting"
              class="px-5 py-2 rounded-xl font-black text-xs cursor-pointer"
              :class="withdrawalReviewDecision === 'approved' ? 'bg-emerald-400 text-slate-950' : 'bg-rose-600 text-white'"
              @click="submitWithdrawalReview"
            >
              Confirm {{ withdrawalReviewDecision === 'approved' ? 'Approval' : 'Rejection' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

