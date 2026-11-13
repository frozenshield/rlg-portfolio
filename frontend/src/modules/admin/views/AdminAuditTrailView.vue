<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { resolveApiUrl } from '@/shared/utils/api';

interface AuditLog {
  id: number;
  admin_user_id: number | null;
  admin_name: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  audit_note: string;
  before_state: Record<string, any> | null;
  after_state: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

interface Stats {
  total_logs: number;
  creates: number;
  updates: number;
  deletes: number;
  wallet_actions: number;
}

const logs = ref<AuditLog[]>([]);
const stats = ref<Stats>({
  total_logs: 0,
  creates: 0,
  updates: 0,
  deletes: 0,
  wallet_actions: 0,
});
const availableActions = ref<string[]>([]);
const availableTargets = ref<string[]>([]);

const isLoading = ref(false);
const searchQuery = ref('');
const selectedAction = ref('all');
const selectedTarget = ref('all');
const dateFrom = ref('');
const dateTo = ref('');

const currentPage = ref(1);
const lastPage = ref(1);
const totalRecords = ref(0);
const perPage = ref(25);

// Inspect Diff Modal State
const selectedLogForDiff = ref<AuditLog | null>(null);
const isDiffModalOpen = ref(false);
const copiedId = ref<string | null>(null);

const fetchAuditLogs = async (page = 1) => {
  isLoading.value = true;
  currentPage.value = page;

  try {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage.value),
    });

    if (searchQuery.value.trim()) params.append('search', searchQuery.value.trim());
    if (selectedAction.value !== 'all') params.append('action', selectedAction.value);
    if (selectedTarget.value !== 'all') params.append('target_type', selectedTarget.value);
    if (dateFrom.value) params.append('date_from', dateFrom.value);
    if (dateTo.value) params.append('date_to', dateTo.value);

    const res = await fetch(resolveApiUrl(`/admin/audit-logs?${params.toString()}`));
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        logs.value = json.data || [];
        stats.value = json.stats || stats.value;
        currentPage.value = json.pagination?.current_page || 1;
        lastPage.value = json.pagination?.last_page || 1;
        totalRecords.value = json.pagination?.total || 0;
        availableActions.value = json.filters?.actions || [];
        availableTargets.value = json.filters?.target_types || [];
      }
    }
  } catch (err) {
    console.error('[AuditTrail] Failed to load audit logs', err);
  } finally {
    isLoading.value = false;
  }
};

const openDiffModal = (log: AuditLog) => {
  selectedLogForDiff.value = log;
  isDiffModalOpen.value = true;
};

const closeDiffModal = () => {
  selectedLogForDiff.value = null;
  isDiffModalOpen.value = false;
};

const copyTargetId = async (id: string | null) => {
  if (!id) return;
  try {
    await navigator.clipboard.writeText(id);
    copiedId.value = id;
    setTimeout(() => {
      copiedId.value = null;
    }, 2000);
  } catch (e) {
    console.warn('Failed to copy', e);
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedAction.value = 'all';
  selectedTarget.value = 'all';
  dateFrom.value = '';
  dateTo.value = '';
  fetchAuditLogs(1);
};

const getActionColor = (action: string) => {
  const act = action.toLowerCase();
  if (act.includes('create') || act.includes('approve')) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  }
  if (act.includes('delete') || act.includes('reject')) {
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }
  if (act.includes('update') || act.includes('review') || act.includes('adjust')) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }
  return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
};

const formatDate = (isoString: string) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

onMounted(() => {
  fetchAuditLogs(1);
});
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header Banner -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
          <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          RLG Enterprise Security & Compliance
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight flex items-center gap-3">
          <span>📜</span> System Audit Trails & Activity Logs
        </h1>
        <p class="text-xs text-slate-400 mt-1 max-w-2xl">
          High-fidelity immutable audit trails tracking all administrative mutations across Products, Orders, Customer Accounts, Raffles, Digital Vault & Wallet Escrows.
        </p>
      </div>

      <button
        type="button"
        @click="fetchAuditLogs(currentPage)"
        :disabled="isLoading"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
      >
        <span :class="{'animate-spin': isLoading}">🔄</span>
        <span>Refresh Logs</span>
      </button>
    </div>

    <!-- Quick Telemetry Stats Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div class="bg-slate-900 border border-slate-800/80 p-4 rounded-xl shadow-xs">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Operations</span>
        <div class="text-2xl font-black text-white mt-1">{{ stats.total_logs.toLocaleString() }}</div>
        <span class="text-[10px] text-slate-500 mt-1 block">Logged mutations</span>
      </div>
      <div class="bg-slate-900 border border-slate-800/80 p-4 rounded-xl shadow-xs">
        <span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Creations (Insert)</span>
        <div class="text-2xl font-black text-emerald-400 mt-1">{{ stats.creates.toLocaleString() }}</div>
        <span class="text-[10px] text-slate-500 mt-1 block">New entities added</span>
      </div>
      <div class="bg-slate-900 border border-slate-800/80 p-4 rounded-xl shadow-xs">
        <span class="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Modifications</span>
        <div class="text-2xl font-black text-amber-400 mt-1">{{ stats.updates.toLocaleString() }}</div>
        <span class="text-[10px] text-slate-500 mt-1 block">State updates & edits</span>
      </div>
      <div class="bg-slate-900 border border-slate-800/80 p-4 rounded-xl shadow-xs">
        <span class="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">Deletions (Purge)</span>
        <div class="text-2xl font-black text-rose-400 mt-1">{{ stats.deletes.toLocaleString() }}</div>
        <span class="text-[10px] text-slate-500 mt-1 block">Removed records</span>
      </div>
      <div class="bg-slate-900 border border-slate-800/80 p-4 rounded-xl shadow-xs col-span-2 sm:col-span-1">
        <span class="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">Wallet & Escrow</span>
        <div class="text-2xl font-black text-indigo-400 mt-1">{{ stats.wallet_actions.toLocaleString() }}</div>
        <span class="text-[10px] text-slate-500 mt-1 block">Financial ledger actions</span>
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Search -->
        <div>
          <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Search Notes / Actors / IDs</label>
          <div class="relative">
            <input
              type="text"
              v-model="searchQuery"
              @keyup.enter="fetchAuditLogs(1)"
              placeholder="e.g. #42, ORD-, 192.168, Admin..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''; fetchAuditLogs(1)"
              class="absolute right-2.5 top-2.5 text-slate-500 hover:text-white text-xs cursor-pointer"
            >✕</button>
          </div>
        </div>

        <!-- Action Filter -->
        <div>
          <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Action Filter</label>
          <select
            v-model="selectedAction"
            @change="fetchAuditLogs(1)"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Actions</option>
            <option value="create">create (Entity Created)</option>
            <option value="update">update (Entity Modified)</option>
            <option value="delete">delete (Entity Deleted)</option>
            <option value="reject_top_up">reject_top_up</option>
            <option value="approve_top_up">approve_top_up</option>
            <option value="withdrawal_review">withdrawal_review</option>
            <option value="delete_top_up">delete_top_up</option>
            <option value="delete_withdrawal">delete_withdrawal</option>
            <option v-for="act in availableActions.filter(a => !['create','update','delete','reject_top_up','approve_top_up','withdrawal_review','delete_top_up','delete_withdrawal'].includes(a))" :key="act" :value="act">
              {{ act }}
            </option>
          </select>
        </div>

        <!-- Target Type Filter -->
        <div>
          <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Module / Entity</label>
          <select
            v-model="selectedTarget"
            @change="fetchAuditLogs(1)"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Entity Types</option>
            <option value="Product">Product</option>
            <option value="CustomerOrder">CustomerOrder</option>
            <option value="User">User Account</option>
            <option value="Auction">Auction</option>
            <option value="Raffle">Live Slot Raffle</option>
            <option value="BoxBreak">Live Box Break</option>
            <option value="PreorderDrop">Pre-Order Drop</option>
            <option value="DigitalVaultShipping">Digital Vault Shipping</option>
            <option value="wallet_transaction">Wallet Transaction</option>
            <option value="withdrawal_request">Withdrawal Request</option>
            <option v-for="tgt in availableTargets.filter(t => !['Product','CustomerOrder','User','Auction','Raffle','BoxBreak','PreorderDrop','DigitalVaultShipping','wallet_transaction','withdrawal_request'].includes(t))" :key="tgt" :value="tgt">
              {{ tgt }}
            </option>
          </select>
        </div>

        <!-- Date Range Filter & Action -->
        <div class="flex items-end gap-2">
          <div class="flex-1">
            <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Date Range</label>
            <input
              type="date"
              v-model="dateFrom"
              @change="fetchAuditLogs(1)"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="button"
            @click="resetFilters"
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
          >
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 text-[10px]">
            <tr>
              <th class="py-3 px-4">Timestamp</th>
              <th class="py-3 px-4">Staff / Actor</th>
              <th class="py-3 px-4">Action</th>
              <th class="py-3 px-4">Target Entity</th>
              <th class="py-3 px-4">Audit Note & Context</th>
              <th class="py-3 px-4">IP Address</th>
              <th class="py-3 px-4 text-right">State Diff</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-if="isLoading && logs.length === 0">
              <td colspan="7" class="py-12 text-center text-slate-500 font-bold">
                <span class="inline-block animate-spin mr-2">🔄</span> Loading audit records...
              </td>
            </tr>
            <tr v-else-if="logs.length === 0">
              <td colspan="7" class="py-12 text-center text-slate-500">
                <span class="text-3xl block mb-2">🛡️</span>
                No audit log records found matching the active filters.
              </td>
            </tr>
            <tr
              v-for="log in logs"
              :key="log.id"
              class="hover:bg-slate-800/40 transition-colors"
            >
              <!-- Timestamp -->
              <td class="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                {{ formatDate(log.created_at) }}
              </td>

              <!-- Staff / Actor -->
              <td class="py-3 px-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300">
                    {{ (log.admin_name || 'A')[0].toUpperCase() }}
                  </div>
                  <div>
                    <span class="font-bold text-white block">{{ log.admin_name || 'System' }}</span>
                    <span v-if="log.admin_user_id" class="text-[10px] text-slate-500 block">ID #{{ log.admin_user_id }}</span>
                  </div>
                </div>
              </td>

              <!-- Action -->
              <td class="py-3 px-4 whitespace-nowrap">
                <span
                  class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
                  :class="getActionColor(log.action_type)"
                >
                  {{ log.action_type }}
                </span>
              </td>

              <!-- Target Entity -->
              <td class="py-3 px-4 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <span class="font-bold text-slate-200">{{ log.target_type || '—' }}</span>
                  <button
                    v-if="log.target_id"
                    type="button"
                    @click="copyTargetId(log.target_id)"
                    class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    title="Click to copy ID"
                  >
                    #{{ log.target_id.length > 12 ? log.target_id.slice(0, 10) + '...' : log.target_id }}
                    <span v-if="copiedId === log.target_id" class="text-emerald-400 text-[9px] ml-1">✓</span>
                  </button>
                </div>
              </td>

              <!-- Audit Note -->
              <td class="py-3 px-4 max-w-xs truncate" :title="log.audit_note">
                <span class="text-slate-300">{{ log.audit_note }}</span>
              </td>

              <!-- IP Address -->
              <td class="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                {{ log.ip_address || '127.0.0.1' }}
              </td>

              <!-- State Diff / Inspector -->
              <td class="py-3 px-4 whitespace-nowrap text-right">
                <button
                  type="button"
                  @click="openDiffModal(log)"
                  :disabled="!log.before_state && !log.after_state"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  :class="log.before_state || log.after_state ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs' : 'bg-slate-800 text-slate-600 cursor-not-allowed'"
                >
                  <span>🔍</span>
                  <span>Inspect</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
        <div>
          Showing page <span class="font-bold text-white">{{ currentPage }}</span> of <span class="font-bold text-white">{{ lastPage }}</span> (Total {{ totalRecords.toLocaleString() }} records)
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="fetchAuditLogs(currentPage - 1)"
            :disabled="currentPage <= 1 || isLoading"
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold transition-all text-xs"
          >
            ← Previous
          </button>
          <span class="px-2 font-mono text-slate-500">{{ currentPage }} / {{ lastPage }}</span>
          <button
            type="button"
            @click="fetchAuditLogs(currentPage + 1)"
            :disabled="currentPage >= lastPage || isLoading"
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold transition-all text-xs"
          >
            Next →
          </button>
        </div>
      </div>
    </div>

    <!-- State Diff Inspector Modal -->
    <div
      v-if="isDiffModalOpen && selectedLogForDiff"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      @click.self="closeDiffModal"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div>
            <div class="flex items-center gap-2">
              <span
                class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border"
                :class="getActionColor(selectedLogForDiff.action_type)"
              >
                {{ selectedLogForDiff.action_type }}
              </span>
              <h3 class="text-base font-black text-white">
                Audit Record #{{ selectedLogForDiff.id }} — {{ selectedLogForDiff.target_type }} #{{ selectedLogForDiff.target_id }}
              </h3>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Performed by <span class="font-bold text-white">{{ selectedLogForDiff.admin_name }}</span> at {{ formatDate(selectedLogForDiff.created_at) }}
            </p>
          </div>
          <button
            type="button"
            @click="closeDiffModal"
            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Modal Body: Before & After Diff -->
        <div class="p-6 overflow-y-auto space-y-4">
          <!-- Audit Note -->
          <div class="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Execution Summary</span>
            <p class="text-xs text-slate-200 font-mono">{{ selectedLogForDiff.audit_note }}</p>
          </div>

          <!-- Dual Column JSON Diff -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Before State -->
            <div class="space-y-1.5">
              <span class="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>◀</span> Previous State (Before)
              </span>
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-3.5 max-h-72 overflow-y-auto font-mono text-[11px] text-slate-300">
                <pre v-if="selectedLogForDiff.before_state" class="whitespace-pre-wrap">{{ JSON.stringify(selectedLogForDiff.before_state, null, 2) }}</pre>
                <span v-else class="text-slate-600 italic">None (Newly created record)</span>
              </div>
            </div>

            <!-- After State -->
            <div class="space-y-1.5">
              <span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>▶</span> Applied State (After)
              </span>
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-3.5 max-h-72 overflow-y-auto font-mono text-[11px] text-slate-300">
                <pre v-if="selectedLogForDiff.after_state" class="whitespace-pre-wrap">{{ JSON.stringify(selectedLogForDiff.after_state, null, 2) }}</pre>
                <span v-else class="text-slate-600 italic">None (Record purged from database)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            @click="closeDiffModal"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
