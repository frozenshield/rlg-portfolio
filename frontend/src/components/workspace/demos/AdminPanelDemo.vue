<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '../../../stores/inventoryStore'
import { usePortfolioStore } from '../../../stores/portfolioStore'
import { 
  Scan, 
  Sparkles, 
  Upload, 
  Layers, 
  DollarSign, 
  Package, 
  CheckCircle2, 
  FileCode2, 
  Copy, 
  Check, 
  Plus, 
  Trash2,
  TrendingUp,
  Activity,
  Tag,
  AlertCircle,
  Clock,
  Truck,
  ShieldCheck,
  Search,
  Filter,
  Menu,
  X
} from 'lucide-vue-next'

const inventoryStore = useInventoryStore()
const portfolioStore = usePortfolioStore()

const isMobile = computed(() => portfolioStore.activeDevice === 'mobile')

const activeAdminTab = ref('dashboard') // 'dashboard' | 'intake' | 'orders'
const timeframe = ref('today') // 'today' | 'week' | 'month'
const copiedSchema = ref(false)
const showPublishSuccess = ref(false)
const isMobileNavOpen = ref(false)

const metricsData = computed(() => {
  if (timeframe.value === 'today') {
    return {
      revenue: '₱84,250.00 ($1,490.00)',
      orders: '18 Orders',
      aov: '₱4,680.00',
      label: 'Today (Live Streams Active)',
      trend: '+24.5%'
    }
  } else if (timeframe.value === 'week') {
    return {
      revenue: '₱592,000.00 ($10,480.00)',
      orders: '142 Orders',
      aov: '₱4,169.00',
      label: 'Last 7 Days',
      trend: '+18.2%'
    }
  } else {
    return {
      revenue: '₱1,284,500.00 ($22,800.00)',
      orders: '310 Orders',
      aov: '₱4,143.00',
      label: 'This Month (October 2026)',
      trend: '+31.8%'
    }
  }
})

// Simulated live orders queue based on rlgshop schema
const liveOrders = ref([
  {
    id: 'ORD-9821',
    customer: 'Kenji Takahashi',
    items: 'Charizard VSTAR SAR #212/S-P (x1)',
    amount: '₱5,200.00',
    status: 'Paid',
    courier: 'DHL Express (Tokyo)',
    time: '12 mins ago'
  },
  {
    id: 'ORD-9820',
    customer: 'Miguel Santos',
    items: 'Pokémon Sulit God Pack Bundle (x2)',
    amount: '₱4,950.00',
    status: 'In Transit',
    courier: 'LBC Tracked Express',
    time: '45 mins ago'
  },
  {
    id: 'ORD-9819',
    customer: 'Sarah Jenkins',
    items: 'One Piece OP-01 Romance Dawn Booster (x1)',
    amount: '₱10,500.00',
    status: 'Processing',
    courier: 'FedEx Priority',
    time: '1 hr ago'
  }
])

function copySchema() {
  if (!inventoryStore.intakeForm.schemaJson) return
  navigator.clipboard.writeText(inventoryStore.intakeForm.schemaJson)
  copiedSchema.value = true
  setTimeout(() => {
    copiedSchema.value = false
  }, 2000)
}

function handlePublish() {
  const success = inventoryStore.publishProduct()
  if (success) {
    showPublishSuccess.value = true
    setTimeout(() => {
      showPublishSuccess.value = false
    }, 3000)
  }
}
</script>

<template>
  <div class="space-y-4 text-left">
    <!-- Admin Navigation & Timeframe Header matching rlgshop AdminLayout.vue -->
    <div class="p-4 sm:p-5 rounded-2xl bg-[#090d16] border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-500/40 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          Live Store Telemetry &bull; {{ metricsData.label }}
        </div>
        <h2 class="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Executive Command Center
          <span class="text-xs font-mono font-normal text-slate-400 hidden sm:inline">| RLG Shop v2.4</span>
        </h2>
      </div>

      <!-- Timeframe Toggle from rlgshop AdminDashboardView.vue -->
      <div class="flex items-center gap-1 p-1 bg-[#131b2e] rounded-xl border border-indigo-500/20 text-xs font-bold">
        <button
          @click="timeframe = 'today'"
          :class="[
            'px-2.5 py-1 rounded-lg transition-all',
            timeframe === 'today' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
          ]"
        >
          Today
        </button>
        <button
          @click="timeframe = 'week'"
          :class="[
            'px-2.5 py-1 rounded-lg transition-all',
            timeframe === 'week' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
          ]"
        >
          Week
        </button>
        <button
          @click="timeframe = 'month'"
          :class="[
            'px-2.5 py-1 rounded-lg transition-all',
            timeframe === 'month' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
          ]"
        >
          Month
        </button>
      </div>
    </div>

    <!-- Sub-tab Navigation (Command Center, AI Vision Intake, Orders Queue) -->
    <div class="flex items-center gap-2 border-b border-indigo-500/20 pb-2 text-xs font-semibold overflow-x-auto">
      <button
        @click="activeAdminTab = 'dashboard'"
        :class="[
          'px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0',
          activeAdminTab === 'dashboard' 
            ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' 
            : 'text-slate-400 hover:text-white'
        ]"
      >
        <Activity class="w-3.5 h-3.5" />
        <span>Command Center</span>
      </button>

      <button
        @click="activeAdminTab = 'intake'"
        :class="[
          'px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0',
          activeAdminTab === 'intake' 
            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' 
            : 'text-slate-400 hover:text-white'
        ]"
      >
        <Scan class="w-3.5 h-3.5" />
        <span>AI Vision Intake Engine</span>
        <span class="text-[9px] px-1 py-0.2 rounded bg-purple-500/40 text-purple-200">Gemini</span>
      </button>

      <button
        @click="activeAdminTab = 'orders'"
        :class="[
          'px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shrink-0',
          activeAdminTab === 'orders' 
            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' 
            : 'text-slate-400 hover:text-white'
        ]"
      >
        <Truck class="w-3.5 h-3.5" />
        <span>Orders & Fulfillment</span>
        <span class="text-[9px] px-1 py-0.2 rounded bg-emerald-500/40 text-emerald-200">3 New</span>
      </button>
    </div>

    <!-- ================= TAB 1: COMMAND CENTER METRICS ================= -->
    <div v-if="activeAdminTab === 'dashboard'" class="space-y-4">
      <!-- 4 Quick Telemetry Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="p-3.5 rounded-xl bg-[#131b2e] border border-indigo-500/20">
          <span class="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Net Revenue</span>
          <div class="text-base sm:text-xl font-extrabold text-white mt-1">{{ metricsData.revenue }}</div>
          <span class="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
            <TrendingUp class="w-3 h-3" /> {{ metricsData.trend }} vs previous
          </span>
        </div>

        <div class="p-3.5 rounded-xl bg-[#131b2e] border border-indigo-500/20">
          <span class="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Volume</span>
          <div class="text-base sm:text-xl font-extrabold text-white mt-1">{{ metricsData.orders }}</div>
          <span class="text-[10px] text-purple-400 block mt-1">100% Fulfillment Rate</span>
        </div>

        <div class="p-3.5 rounded-xl bg-[#131b2e] border border-indigo-500/20">
          <span class="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Average Order (AOV)</span>
          <div class="text-base sm:text-xl font-extrabold text-white mt-1">{{ metricsData.aov }}</div>
          <span class="text-[10px] text-cyan-400 block mt-1">Singles & Slabs</span>
        </div>

        <div class="p-3.5 rounded-xl bg-[#131b2e] border border-indigo-500/20">
          <span class="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Inventory Vault</span>
          <div class="text-base sm:text-xl font-extrabold text-white mt-1">{{ inventoryStore.products.length }} Listed</div>
          <span class="text-[10px] text-emerald-400 block mt-1">99.8% AI Precision</span>
        </div>
      </div>

      <!-- Live Recent Orders Preview Table -->
      <div class="p-4 rounded-xl bg-[#0f172a] border border-indigo-500/20">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-indigo-500/20">
          <h4 class="font-bold text-white text-xs sm:text-sm">Recent Order Dispatches</h4>
          <span class="text-[11px] text-slate-400 font-mono">Live Courier Sync</span>
        </div>

        <div class="space-y-2">
          <div 
            v-for="order in liveOrders" 
            :key="order.id"
            class="p-2.5 rounded-lg bg-[#131b2e] border border-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-indigo-400 font-bold">{{ order.id }}</span>
                <span class="font-bold text-white">{{ order.customer }}</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">{{ order.items }}</p>
            </div>

            <div class="flex items-center justify-between sm:justify-end gap-3">
              <span class="font-mono font-bold text-white">{{ order.amount }}</span>
              <span 
                :class="[
                  'text-[10px] font-mono px-2 py-0.5 rounded-full border',
                  order.status === 'Paid' 
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                    : order.status === 'In Transit'
                    ? 'bg-sky-950/80 text-sky-300 border-sky-500/40'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                ]"
              >
                {{ order.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= TAB 2: AI VISION INTAKE ENGINE ================= -->
    <div v-else-if="activeAdminTab === 'intake'" class="space-y-4">
      <div class="p-4 sm:p-6 rounded-2xl bg-[#0f172a] border border-indigo-500/30">
        <div class="pb-3 mb-4 border-b border-indigo-500/20">
          <h3 class="text-base font-bold text-white">Multimodal Gemini Vision OCR Intake</h3>
          <p class="text-xs text-slate-400 mt-0.5">Automated image-to-form fulfillment for Japanese Pokémon, One Piece & Yu-Gi-Oh! cards</p>
        </div>

        <!-- Sample card selector chips -->
        <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Select sample card to simulate camera scan:
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <button
            v-for="(preset, pIdx) in inventoryStore.sampleCardPresets"
            :key="pIdx"
            @click="inventoryStore.triggerAiVisionIntake(pIdx)"
            :disabled="inventoryStore.isAnalyzing"
            class="p-2.5 rounded-xl bg-[#131b2e] hover:bg-[#18223a] border border-indigo-500/20 text-left transition-all flex items-center gap-2.5 group disabled:opacity-50"
          >
            <img :src="preset.image" :alt="preset.label" class="w-10 h-12 object-cover rounded-md shrink-0" />
            <div class="truncate">
              <span class="text-xs font-bold text-white block truncate">{{ preset.label }}</span>
              <span class="text-[10px] text-indigo-400">Scan OCR →</span>
            </div>
          </button>
        </div>

        <!-- Scanning progress bar -->
        <div v-if="inventoryStore.isAnalyzing" class="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 mb-4 space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-indigo-300 font-mono flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              {{ inventoryStore.analysisStep }}
            </span>
            <span class="text-white font-mono font-bold">{{ inventoryStore.analysisProgress }}%</span>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              class="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-300"
              :style="{ width: `${inventoryStore.analysisProgress}%` }"
            />
          </div>
        </div>

        <!-- Form fields -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="text-[10px] font-mono text-slate-400 block mb-1">Item Title</label>
            <input 
              v-model="inventoryStore.intakeForm.name"
              type="text" 
              placeholder="Card name..." 
              class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label class="text-[10px] font-mono text-slate-400 block mb-1">Japanese Kana / Romaji</label>
            <input 
              v-model="inventoryStore.intakeForm.japaneseName"
              type="text" 
              placeholder="Japanese Kana..." 
              class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label class="text-[10px] font-mono text-slate-400 block mb-1">Expansion Set</label>
            <input 
              v-model="inventoryStore.intakeForm.set"
              type="text" 
              placeholder="e.g. VSTAR Universe s12a" 
              class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label class="text-[10px] font-mono text-slate-400 block mb-1">Card Serial / Number</label>
            <input 
              v-model="inventoryStore.intakeForm.cardNumber"
              type="text" 
              placeholder="e.g. 212/S-P SAR" 
              class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label class="text-[10px] font-mono text-slate-400 block mb-1">Condition Grade</label>
            <input 
              v-model="inventoryStore.intakeForm.condition"
              type="text" 
              placeholder="Gem Mint 10 (Ungraded)" 
              class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label class="text-[10px] font-mono text-slate-400 block mb-1">Price ($ USD)</label>
            <input 
              v-model="inventoryStore.intakeForm.price"
              type="number" 
              placeholder="Price USD..." 
              class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <!-- Action buttons -->
        <div class="mt-4 flex flex-wrap gap-2 pt-2 border-t border-indigo-500/20">
          <button
            @click="inventoryStore.generateSeoMetadata"
            :disabled="!inventoryStore.intakeForm.name || inventoryStore.isGeneratingSeo"
            class="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>Generate SEO Schema</span>
          </button>

          <button
            @click="handlePublish"
            :disabled="!inventoryStore.intakeForm.name"
            class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Publish Product</span>
          </button>
        </div>

        <div v-if="showPublishSuccess" class="mt-3 p-2 rounded-lg bg-emerald-950 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4" />
          <span>Product added to live catalog!</span>
        </div>
      </div>
    </div>

    <!-- ================= TAB 3: ORDERS & FULFILLMENT ================= -->
    <div v-else-if="activeAdminTab === 'orders'" class="space-y-4">
      <div class="p-4 sm:p-5 rounded-2xl bg-[#0f172a] border border-indigo-500/30">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-indigo-500/20">
          <h3 class="text-sm sm:text-base font-bold text-white">Live Courier Dispatch Queue</h3>
          <span class="text-xs font-mono text-emerald-400">DHL & LBC Integrated</span>
        </div>

        <div class="space-y-2.5">
          <div 
            v-for="order in liveOrders" 
            :key="order.id"
            class="p-3 rounded-xl bg-[#131b2e] border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div class="space-y-0.5">
              <div class="flex items-center gap-2">
                <span class="font-bold text-white">{{ order.customer }}</span>
                <span class="text-slate-500 font-mono">{{ order.id }}</span>
              </div>
              <p class="text-slate-300">{{ order.items }}</p>
              <div class="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Courier: {{ order.courier }}</span>
                <span>•</span>
                <span>{{ order.time }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between sm:justify-end gap-3">
              <span class="font-mono font-bold text-emerald-400 text-sm">{{ order.amount }}</span>
              <button class="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs">
                Print Airway Bill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
