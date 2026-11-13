<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { resolveApiUrl, resolveStorageUrl } from '@/shared/utils/api';
import { useAdminStore } from '../admin.store';

const adminStore = useAdminStore();

const activeTab = ref<'topups' | 'wallets' | 'withdrawals' | 'audit'>('topups');

// Wallet Oversight State
const searchQuery = ref('');
const usersList = ref<any[]>([]);
const pendingTopUpsList = ref<any[]>([]);
const withdrawalsList = ref<any[]>([]);
const auditLogs = ref<any[]>([]);
const metrics = ref({
  total_available_float: 0,
  total_held_escrow: 0,
  pending_withdrawals_count: 0,
  pending_withdrawals_amount: 0,
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

// Top-Up Review & Proof Zoom Modal State
const selectedTopUpForApproval = ref<any | null>(null);
const selectedTopUpForRejection = ref<any | null>(null);
const topUpRejectionReason = ref<string>('');
const zoomedProofUrl = ref<string | null>(null);

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
      pendingTopUpsList.value = json.data.pending_topups || [];
      withdrawalsList.value = json.data.withdrawals || [];
      auditLogs.value = json.data.audit_logs || [];
      metrics.value = json.data.metrics || metrics.value;
    }
  } catch (e: any) {
    showToast(e.message || 'Failed to load wallet overview.', 'error');
  } finally {
    isLoading.value = false;
  }
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

// Top-Up Approval Actions
const confirmApproveTopUp = async () => {
  if (!selectedTopUpForApproval.value) return;
  isSubmitting.value = true;
  try {
    const res = await fetch(
      resolveApiUrl(`/admin/wallet/top-ups/${selectedTopUpForApproval.value.id}/approve`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          admin_note: `Manual QR verified and approved by ${adminStore.currentAdmin?.name || 'Admin'}`,
        }),
      }
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Approval failed.');
    }
    showToast(json.message);
    selectedTopUpForApproval.value = null;
    await fetchAdminWalletData();
  } catch (e: any) {
    showToast(e.message || 'Failed to approve top-up.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const confirmRejectTopUp = async () => {
  if (!selectedTopUpForRejection.value) return;
  isSubmitting.value = true;
  try {
    const res = await fetch(
      resolveApiUrl(`/admin/wallet/top-ups/${selectedTopUpForRejection.value.id}/reject`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          reason: topUpRejectionReason.value.trim() || 'Payment could not be verified or invalid reference number',
        }),
      }
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Rejection failed.');
    }
    showToast(json.message);
    selectedTopUpForRejection.value = null;
    topUpRejectionReason.value = '';
    await fetchAdminWalletData();
  } catch (e: any) {
    showToast(e.message || 'Failed to reject top-up.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const deleteTopUpRequest = async (tx: any) => {
  if (!confirm(`Are you sure you want to delete top-up record #${tx.id}?`)) return;
  try {
    const res = await fetch(resolveApiUrl(`/admin/wallet/top-ups/${tx.id}`), {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Delete failed.');
    showToast(json.message);
    await fetchAdminWalletData();
  } catch (e: any) {
    showToast(e.message || 'Failed to delete top-up record.', 'error');
  }
};

// Withdrawal Review Actions
const submitWithdrawalReview = async () => {
  if (!selectedWithdrawal.value) return;
  if (withdrawalReviewNote.value.trim().length < 3) {
    showToast('Please enter a review note for this payout decision.', 'error');
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await fetch(
      resolveApiUrl(`/admin/wallet/withdrawals/${selectedWithdrawal.value.id}/review`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          decision: withdrawalReviewDecision.value,
          review_note: withdrawalReviewNote.value.trim(),
          admin_name: adminStore.currentAdmin?.name || 'Admin Staff',
        }),
      }
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Review failed.');
    }
    showToast(json.message);
    selectedWithdrawal.value = null;
    await fetchAdminWalletData();
  } catch (e: any) {
    showToast(e.message || 'Could not process withdrawal.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const getMerchantBadge = (tx: any) => {
  const m = tx.metadata?.merchant || tx.reference_type;
  switch (m) {
    case 'maribank':
      return { label: 'MariBank', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
    case 'gotyme':
      return { label: 'GoTyme', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
    case 'gcash':
      return { label: 'GCash', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' };
    case 'maya':
      return { label: 'Maya', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    case 'paymongo_qrph':
      return { label: 'Instant QR Ph', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    default:
      return { label: 'Manual QR', color: 'bg-slate-700 text-slate-200 border-slate-600' };
  }
};

onMounted(async () => {
  await fetchAdminWalletData();
});
</script>

<template>
  <div class="p-6 space-y-6 text-slate-100 bg-slate-950 min-h-full">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400">
          <span>🛡️ ADMIN CONTROL PANEL OVERSIGHT</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          Wallet Ledger, Top-Up Approvals &amp; Withdrawal Queue
        </h1>
      </div>

      <button
        type="button"
        class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
        @click="fetchAdminWalletData"
      >
        <span :class="isLoading ? 'animate-spin' : ''">🔄</span>
        <span>Refresh Ledger</span>
      </button>
    </div>

    <!-- Toast Notification -->
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

    <!-- 4 High-Level Financial Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
          Total Available Wallet Float
        </span>
        <div class="text-2xl font-black font-mono text-emerald-400">
          ₱{{ formatCurrency(metrics.total_available_float) }}
        </div>
        <span class="text-[10px] text-slate-400 mt-1 block">Sum of all spendable user balances</span>
      </div>

      <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
          Total Held Bid Escrow
        </span>
        <div class="text-2xl font-black font-mono text-amber-300">
          🔒 ₱{{ formatCurrency(metrics.total_held_escrow) }}
        </div>
        <span class="text-[10px] text-slate-400 mt-1 block">Locked in live active auction lots</span>
      </div>

      <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Pending Top-Up Approvals
          </span>
          <span
            v-if="metrics.pending_topups_count > 0"
            class="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] animate-pulse"
          >
            Action Req.
          </span>
        </div>
        <div class="text-2xl font-black font-mono text-amber-400">
          {{ metrics.pending_topups_count }} Requests
        </div>
        <span class="text-[10px] text-slate-400 mt-1 block">
          ₱{{ formatCurrency(metrics.pending_topups_amount) }} volume
        </span>
      </div>

      <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
          Pending Withdrawal Payouts
        </span>
        <div class="text-2xl font-black font-mono text-rose-400">
          {{ metrics.pending_withdrawals_count }} Requests
        </div>
        <span class="text-[10px] text-slate-400 mt-1 block">
          ₱{{ formatCurrency(metrics.pending_withdrawals_amount) }} volume
        </span>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
      <!-- Tab 1: Top-Up Approvals -->
      <button
        type="button"
        class="px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
        :class="
          activeTab === 'topups'
            ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-900'
        "
        @click="activeTab = 'topups'"
      >
        <span>⚡ Top-Up Approvals</span>
        <span
          v-if="pendingTopUpsList.length > 0"
          class="px-2 py-0.5 rounded-full text-[10px] font-black"
          :class="activeTab === 'topups' ? 'bg-slate-950 text-amber-300' : 'bg-amber-400 text-slate-950'"
        >
          {{ pendingTopUpsList.length }}
        </span>
      </button>

      <!-- Tab 2: User Balances -->
      <button
        type="button"
        class="px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
        :class="
          activeTab === 'wallets'
            ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-900'
        "
        @click="activeTab = 'wallets'"
      >
        <span>👥 User Wallet Balances</span>
      </button>

      <!-- Tab 3: Withdrawal Queue -->
      <button
        type="button"
        class="px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
        :class="
          activeTab === 'withdrawals'
            ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-900'
        "
        @click="activeTab = 'withdrawals'"
      >
        <span>🏦 Withdrawal Queue</span>
        <span
          v-if="metrics.pending_withdrawals_count > 0"
          class="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black"
        >
          {{ metrics.pending_withdrawals_count }}
        </span>
      </button>

      <!-- Tab 4: Audit Trail -->
      <button
        type="button"
        class="px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2"
        :class="
          activeTab === 'audit'
            ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-900'
        "
        @click="activeTab = 'audit'"
      >
        <span>📜 Admin Audit Trail</span>
      </button>
    </div>

    <!-- ─── TAB 1: PENDING TOP-UP APPROVALS ──────────────────────────────────── -->
    <div v-if="activeTab === 'topups'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span>⚡</span>
            <span>Manual Transfer Verification &amp; Crediting Queue</span>
          </h2>
          <p class="text-xs text-slate-400">
            MariBank, GoTyme, GCash, and Maya transfers submitted by collectors. Verify receipt and reference number before approving.
          </p>
        </div>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
        <table class="w-full text-left text-xs">
          <thead class="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/80 border-b border-slate-800">
            <tr>
              <th class="py-3 px-4">User Details</th>
              <th class="py-3 px-4">Payment Channel</th>
              <th class="py-3 px-4 text-right">Top-Up Amount</th>
              <th class="py-3 px-4">Reference No. &amp; Sender</th>
              <th class="py-3 px-4 text-center">Receipt Proof</th>
              <th class="py-3 px-4 text-right">Submitted At</th>
              <th class="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-if="pendingTopUpsList.length === 0">
              <td colspan="7" class="py-12 text-center text-slate-400 font-medium">
                🎉 No pending manual top-ups! All transfer requests have been processed.
              </td>
            </tr>
            <tr v-for="tx in pendingTopUpsList" :key="tx.id" class="hover:bg-slate-800/30 transition-colors">
              <td class="py-3.5 px-4">
                <p class="font-bold text-slate-100">{{ tx.user?.name || `User #${tx.user_id}` }}</p>
                <p class="text-[11px] text-slate-400">{{ tx.user?.email || 'N/A' }}</p>
              </td>
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span
                  class="px-2.5 py-1 rounded-full text-[10px] font-black border"
                  :class="getMerchantBadge(tx).color"
                >
                  {{ getMerchantBadge(tx).label }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm whitespace-nowrap">
                ₱{{ formatCurrency(tx.amount) }}
              </td>
              <td class="py-3.5 px-4">
                <span class="font-mono font-bold text-white block">
                  {{ tx.reference_id || tx.metadata?.reference_number || 'N/A' }}
                </span>
                <span class="text-[10px] text-slate-400 block">
                  Sender: {{ tx.metadata?.sender_name || 'Not specified' }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-center">
                <div v-if="tx.metadata?.proof_image_url" class="inline-flex items-center gap-2">
                  <img
                    :src="resolveStorageUrl(tx.metadata.proof_image_url)"
                    alt="Receipt thumbnail"
                    class="w-9 h-9 object-cover rounded-lg border border-slate-700 cursor-pointer hover:scale-105 transition-transform"
                    @click="zoomedProofUrl = resolveStorageUrl(tx.metadata.proof_image_url)"
                  />
                  <button
                    type="button"
                    class="px-2 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-[10px] font-bold text-indigo-300 transition-all cursor-pointer inline-flex items-center gap-1"
                    @click="zoomedProofUrl = resolveStorageUrl(tx.metadata.proof_image_url)"
                  >
                    <span>🔍</span>
                    <span>Zoom</span>
                  </button>
                </div>
                <span v-else class="text-[11px] text-slate-500 italic">No Image</span>
              </td>
              <td class="py-3.5 px-4 text-right text-slate-400 font-mono whitespace-nowrap">
                {{ new Date(tx.created_at).toLocaleString() }}
              </td>
              <td class="py-3.5 px-4 text-right whitespace-nowrap">
                <div class="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-sm"
                    @click="selectedTopUpForApproval = tx"
                  >
                    ✓ Approve &amp; Credit
                  </button>
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                    @click="selectedTopUpForRejection = tx"
                  >
                    ✕ Reject
                  </button>
                  <button
                    type="button"
                    class="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/80 text-xs font-bold transition-all cursor-pointer"
                    title="Delete Top-Up Record"
                    @click="deleteTopUpRequest(tx)"
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

    <!-- ─── TAB 2: USER WALLET BALANCES ──────────────────────────────────────── -->
    <div v-if="activeTab === 'wallets'" class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span>👥</span>
            <span>Collector Wallet Balances</span>
          </h2>
          <p class="text-xs text-slate-400">All registered users with available spendable float and held bid escrow.</p>
        </div>

        <div class="relative w-72">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search collector name or email..."
            class="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
            @keyup.enter="fetchAdminWalletData"
          />
        </div>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
        <table class="w-full text-left text-xs">
          <thead class="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/80 border-b border-slate-800">
            <tr>
              <th class="py-3 px-4">User</th>
              <th class="py-3 px-4">Tier / Type</th>
              <th class="py-3 px-4 text-right">Available Float</th>
              <th class="py-3 px-4 text-right">Held Bid Escrow</th>
              <th class="py-3 px-4 text-right">Total Equity</th>
              <th class="py-3 px-4 text-center">Tx Count</th>
              <th class="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-for="user in usersList" :key="user.id" class="hover:bg-slate-800/30 transition-colors">
              <td class="py-3.5 px-4">
                <p class="font-bold text-slate-100">{{ user.name }}</p>
                <p class="text-[11px] text-slate-400">{{ user.email }}</p>
              </td>
              <td class="py-3.5 px-4">
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                  :class="user.is_vip ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'"
                >
                  {{ user.is_vip ? '👑 PRO VIP' : user.user_type || 'STANDARD' }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                ₱{{ formatCurrency(user.wallet_balance) }}
              </td>
              <td class="py-3.5 px-4 text-right font-mono font-bold text-amber-300">
                ₱{{ formatCurrency(user.held_balance) }}
              </td>
              <td class="py-3.5 px-4 text-right font-mono font-bold text-white">
                ₱{{ formatCurrency((user.wallet_balance || 0) + (user.held_balance || 0)) }}
              </td>
              <td class="py-3.5 px-4 text-center font-mono text-slate-400">
                {{ user.wallet_transactions_count || 0 }}
              </td>
              <td class="py-3.5 px-4 text-right">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                  @click="openAdjustmentModal(user)"
                >
                  ⚙️ Adjust
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── TAB 3: WITHDRAWAL QUEUE ─────────────────────────────────────────── -->
    <div v-if="activeTab === 'withdrawals'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span>🏦</span>
            <span>Collector Withdrawal Queue</span>
          </h2>
          <p class="text-xs text-slate-400">Payout requests held in escrow awaiting manual disbursement via InstaPay/PESONet.</p>
        </div>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
        <table class="w-full text-left text-xs">
          <thead class="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/80 border-b border-slate-800">
            <tr>
              <th class="py-3 px-4">User</th>
              <th class="py-3 px-4 text-right">Amount</th>
              <th class="py-3 px-4">Channel</th>
              <th class="py-3 px-4">Account Details</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-right">Requested</th>
              <th class="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-if="withdrawalsList.length === 0">
              <td colspan="7" class="py-12 text-center text-slate-400 font-medium">
                No withdrawal requests found.
              </td>
            </tr>
            <tr v-for="w in withdrawalsList" :key="w.id" class="hover:bg-slate-800/30 transition-colors">
              <td class="py-3.5 px-4 font-bold text-slate-100">{{ w.user?.name || `User #${w.user_id}` }}</td>
              <td class="py-3.5 px-4 text-right font-mono font-black text-rose-400 text-sm">
                ₱{{ formatCurrency(w.amount) }}
              </td>
              <td class="py-3.5 px-4 font-bold text-slate-300">{{ w.payout_method }}</td>
              <td class="py-3.5 px-4">
                <span class="font-bold text-white block">{{ w.account_name }}</span>
                <span class="font-mono text-slate-400 text-[11px] block">{{ w.account_number }}</span>
              </td>
              <td class="py-3.5 px-4">
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border"
                  :class="
                    w.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                      : w.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  "
                >
                  {{ w.status }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right text-slate-400 font-mono whitespace-nowrap">
                {{ new Date(w.created_at).toLocaleString() }}
              </td>
              <td class="py-3.5 px-4 text-right whitespace-nowrap">
                <button
                  v-if="w.status === 'pending'"
                  type="button"
                  class="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-sm"
                  @click="selectedWithdrawal = w; withdrawalReviewDecision = 'approved'; withdrawalReviewNote = 'Payout processed via InstaPay';"
                >
                  Review
                </button>
                <span v-else class="text-[11px] text-slate-500 italic">Settled</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── TAB 4: ADMIN AUDIT TRAIL ─────────────────────────────────────────── -->
    <div v-if="activeTab === 'audit'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span>📜</span>
            <span>Immutable Admin Action Audit Trail</span>
          </h2>
          <p class="text-xs text-slate-400">All administrative ledger modifications, top-up approvals, and payout audits.</p>
        </div>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
        <table class="w-full text-left text-xs">
          <thead class="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/80 border-b border-slate-800">
            <tr>
              <th class="py-3 px-4">Timestamp</th>
              <th class="py-3 px-4">Admin Actor</th>
              <th class="py-3 px-4">Action Type</th>
              <th class="py-3 px-4">Target</th>
              <th class="py-3 px-4">Audit Note / Reason</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-mono">
            <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-slate-800/30 transition-colors">
              <td class="py-3 px-4 text-slate-400 whitespace-nowrap">{{ new Date(log.created_at).toLocaleString() }}</td>
              <td class="py-3 px-4 font-bold text-amber-300">{{ log.admin_name }}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-[10px] uppercase font-bold">
                  {{ log.action_type }}
                </span>
              </td>
              <td class="py-3 px-4 text-slate-300 font-bold">
                {{ log.target_type }} #{{ log.target_id }}
              </td>
              <td class="py-3 px-4 font-sans text-slate-300">{{ log.audit_note }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── MODAL 1: MANUAL ADJUSTMENT ───────────────────────────────────────── -->
    <teleport to="body">
      <div
        v-if="isAdjustModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click="isAdjustModalOpen = false"
      >
        <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5" @click.stop>
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-lg font-black text-white">Manual Wallet Adjustment</h3>
            <button type="button" class="text-slate-400 hover:text-white cursor-pointer" @click="isAdjustModalOpen = false">✕</button>
          </div>

          <div class="p-3 bg-slate-950 rounded-2xl text-xs space-y-1">
            <span class="text-slate-400">Target User:</span>
            <p class="font-bold text-white">{{ selectedUserForAdjustment?.name }} ({{ selectedUserForAdjustment?.email }})</p>
            <p class="text-[11px] font-mono text-emerald-400">
              Current Available: ₱{{ formatCurrency(selectedUserForAdjustment?.wallet_balance) }}
            </p>
          </div>

          <div class="space-y-3">
            <div>
              <label class="text-xs font-bold text-slate-300 block mb-1">Adjustment Type</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer"
                  :class="adjustmentType === 'credit' ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400' : 'bg-slate-950 text-slate-300 border-slate-800'"
                  @click="adjustmentType = 'credit'"
                >
                  + Credit Funds
                </button>
                <button
                  type="button"
                  class="py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer"
                  :class="adjustmentType === 'debit' ? 'bg-rose-500 text-white font-black border-rose-400' : 'bg-slate-950 text-slate-300 border-slate-800'"
                  @click="adjustmentType = 'debit'"
                >
                  - Debit Funds
                </button>
              </div>
            </div>

            <div>
              <label class="text-xs font-bold text-slate-300 block mb-1">Amount (PHP)</label>
              <input
                v-model.number="adjustmentAmount"
                type="number"
                min="0.01"
                step="50"
                class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label class="text-xs font-bold text-slate-300 block mb-1">Mandatory Audit Note / Justification</label>
              <textarea
                v-model="adjustmentAuditNote"
                rows="3"
                placeholder="e.g. Compensation for damaged booster pack or manual bank wire deposit confirmation"
                class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              @click="isAdjustModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="isSubmitting || adjustmentAmount <= 0 || adjustmentAuditNote.trim().length < 5"
              class="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer disabled:opacity-50"
              @click="submitManualAdjustment"
            >
              Commit Adjustment
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ─── MODAL 2: APPROVE TOP-UP CONFIRMATION ─────────────────────────────── -->
    <teleport to="body">
      <div
        v-if="selectedTopUpForApproval"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click="selectedTopUpForApproval = null"
      >
        <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5" @click.stop>
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-lg font-black text-white">Confirm Top-Up Approval</h3>
            <button type="button" class="text-slate-400 hover:text-white cursor-pointer" @click="selectedTopUpForApproval = null">✕</button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="p-3 bg-slate-950 rounded-2xl space-y-1.5">
              <p class="text-slate-400">User: <span class="font-bold text-white">{{ selectedTopUpForApproval.user?.name }}</span></p>
              <p class="text-slate-400">Payment Channel: <span class="font-bold text-amber-300 uppercase">{{ selectedTopUpForApproval.metadata?.merchant || selectedTopUpForApproval.reference_type }}</span></p>
              <p class="text-slate-400">Reference No: <span class="font-mono font-bold text-white">{{ selectedTopUpForApproval.reference_id }}</span></p>
              <p class="text-slate-400 text-sm mt-2">
                Amount to Credit: <span class="font-mono font-black text-emerald-400 text-base">₱{{ formatCurrency(selectedTopUpForApproval.amount) }}</span>
              </p>
            </div>

            <p class="text-slate-300 text-[11px]">
              Clicking Confirm will immediately credit <span class="text-emerald-400 font-bold">₱{{ formatCurrency(selectedTopUpForApproval.amount) }}</span> to this user's available wallet balance.
            </p>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              @click="selectedTopUpForApproval = null"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="isSubmitting"
              class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer disabled:opacity-50"
              @click="confirmApproveTopUp"
            >
              Confirm &amp; Credit Funds
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ─── MODAL 3: REJECT TOP-UP ───────────────────────────────────────────── -->
    <teleport to="body">
      <div
        v-if="selectedTopUpForRejection"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click="selectedTopUpForRejection = null"
      >
        <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5" @click.stop>
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-lg font-black text-rose-400">Reject Top-Up Request</h3>
            <button type="button" class="text-slate-400 hover:text-white cursor-pointer" @click="selectedTopUpForRejection = null">✕</button>
          </div>

          <div class="space-y-3">
            <p class="text-xs text-slate-300">
              Rejecting request #{{ selectedTopUpForRejection.id }} for <span class="font-bold text-white">{{ selectedTopUpForRejection.user?.name }}</span> (₱{{ formatCurrency(selectedTopUpForRejection.amount) }}).
            </p>

            <div>
              <label class="text-xs font-bold text-slate-300 block mb-1">Reason for Rejection</label>
              <textarea
                v-model="topUpRejectionReason"
                rows="3"
                placeholder="e.g. Invalid reference number, duplicate submission, or payment receipt screenshot was unreadable"
                class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-400"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              @click="selectedTopUpForRejection = null"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="isSubmitting"
              class="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs cursor-pointer disabled:opacity-50"
              @click="confirmRejectTopUp"
            >
              Reject Top-Up
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ─── MODAL 4: WITHDRAWAL REVIEW ───────────────────────────────────────── -->
    <teleport to="body">
      <div
        v-if="selectedWithdrawal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click="selectedWithdrawal = null"
      >
        <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5" @click.stop>
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-lg font-black text-white">Review Payout Request</h3>
            <button type="button" class="text-slate-400 hover:text-white cursor-pointer" @click="selectedWithdrawal = null">✕</button>
          </div>

          <div class="p-3 bg-slate-950 rounded-2xl text-xs space-y-1.5">
            <p class="text-slate-400">User: <span class="font-bold text-white">{{ selectedWithdrawal.user?.name }}</span></p>
            <p class="text-slate-400">Payout Channel: <span class="font-bold text-white">{{ selectedWithdrawal.payout_method }}</span></p>
            <p class="text-slate-400">Account: <span class="font-bold text-white">{{ selectedWithdrawal.account_name }} ({{ selectedWithdrawal.account_number }})</span></p>
            <p class="text-slate-400 text-sm mt-2">
              Amount: <span class="font-mono font-black text-rose-400 text-base">₱{{ formatCurrency(selectedWithdrawal.amount) }}</span>
            </p>
          </div>

          <div class="space-y-3">
            <div>
              <label class="text-xs font-bold text-slate-300 block mb-1">Decision</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer"
                  :class="withdrawalReviewDecision === 'approved' ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400' : 'bg-slate-950 text-slate-300 border-slate-800'"
                  @click="withdrawalReviewDecision = 'approved'"
                >
                  ✓ Approve &amp; Disbursed
                </button>
                <button
                  type="button"
                  class="py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer"
                  :class="withdrawalReviewDecision === 'rejected' ? 'bg-rose-500 text-white font-black border-rose-400' : 'bg-slate-950 text-slate-300 border-slate-800'"
                  @click="withdrawalReviewDecision = 'rejected'"
                >
                  ✕ Reject Payout
                </button>
              </div>
            </div>

            <div>
              <label class="text-xs font-bold text-slate-300 block mb-1">Review Note / Reference</label>
              <textarea
                v-model="withdrawalReviewNote"
                rows="3"
                placeholder="e.g. InstaPay Ref #849201948 or reason for rejection"
                class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              @click="selectedWithdrawal = null"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="isSubmitting || withdrawalReviewNote.trim().length < 3"
              class="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer disabled:opacity-50"
              @click="submitWithdrawalReview"
            >
              Commit Decision
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ─── MODAL 5: ZOOM PROOF IMAGE ────────────────────────────────────────── -->
    <teleport to="body">
      <div
        v-if="zoomedProofUrl"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        @click="zoomedProofUrl = null"
      >
        <div class="relative max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-hidden flex flex-col items-center" @click.stop>
          <div class="w-full flex items-center justify-between pb-3 border-b border-slate-800">
            <span class="text-xs font-bold text-white">Payment Receipt Proof</span>
            <button type="button" class="text-slate-400 hover:text-white cursor-pointer" @click="zoomedProofUrl = null">✕</button>
          </div>
          <div class="p-2 overflow-auto max-h-[75vh] flex flex-col items-center">
            <img :src="resolveStorageUrl(zoomedProofUrl)" alt="Receipt Screenshot" class="rounded-xl max-w-full max-h-[65vh] h-auto object-contain shadow-2xl border border-slate-700" />
            <a
              :href="resolveStorageUrl(zoomedProofUrl)"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-3 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🔗</span>
              <span>Open Original Full Resolution</span>
            </a>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

