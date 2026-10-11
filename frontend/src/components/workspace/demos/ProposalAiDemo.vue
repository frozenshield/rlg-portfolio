<script setup>
import { ref, computed, reactive } from 'vue'
import { proposalAiProjectData } from '../../../data/projectsData'
import { 
  Sparkles, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  CreditCard, 
  Copy, 
  Check, 
  ExternalLink,
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  FileText,
  DollarSign,
  Briefcase,
  ChevronDown,
  X
} from 'lucide-vue-next'

const presets = proposalAiProjectData.demoPresets
const selectedPresetId = ref('acme-corp')

// Active form state initialized from preset
const selectedPreset = computed(() => {
  return presets.find(p => p.id === selectedPresetId.value) || presets[0]
})

const clientForm = reactive({
  clientName: presets[0].clientName,
  email: presets[0].email,
  firstName: presets[0].firstName,
  lastName: presets[0].lastName,
  directive: presets[0].directive
})

const deliverables = ref(JSON.parse(JSON.stringify(presets[0].deliverables)))

function applyPreset(presetId) {
  selectedPresetId.value = presetId
  const preset = presets.find(p => p.id === presetId)
  if (preset) {
    clientForm.clientName = preset.clientName
    clientForm.email = preset.email
    clientForm.firstName = preset.firstName
    clientForm.lastName = preset.lastName
    clientForm.directive = preset.directive
    deliverables.value = JSON.parse(JSON.stringify(preset.deliverables))
    triggerAiGeneration()
  }
}

// Deliverables manipulation
function addDeliverable() {
  deliverables.value.push({
    name: 'Custom Domain Technical Enablement & Training',
    unitPrice: 2400,
    qty: 1,
    discount: 5
  })
}

function removeDeliverable(index) {
  if (deliverables.value.length > 1) {
    deliverables.value.splice(index, 1)
  }
}

// Reactive Financial Ledger Math (Pinia-style deterministic math)
const ledger = computed(() => {
  let subtotal = 0
  let totalDiscount = 0

  deliverables.value.forEach(item => {
    const rawTotal = (item.unitPrice || 0) * (item.qty || 1)
    const discountAmount = rawTotal * ((item.discount || 0) / 100)
    subtotal += rawTotal
    totalDiscount += discountAmount
  })

  const discountedSubtotal = subtotal - totalDiscount
  const taxRate = 0.12 // 12% standard enterprise VAT
  const tax = discountedSubtotal * taxRate
  const grandTotal = discountedSubtotal + tax

  return {
    subtotal,
    totalDiscount,
    discountedSubtotal,
    tax,
    grandTotal
  }
})

// AI Generation States
const isGenerating = ref(false)
const generationStep = ref(3)
const generationTime = ref('2.8s')
const hasGenerated = ref(true)

function triggerAiGeneration() {
  isGenerating.value = true
  generationStep.value = 1

  setTimeout(() => {
    generationStep.value = 2
  }, 700)

  setTimeout(() => {
    generationStep.value = 3
  }, 1400)

  setTimeout(() => {
    isGenerating.value = false
    hasGenerated.value = true
  }, 2200)
}

// Vector Flywheel Toast Notification
const showFlywheelToast = ref(false)
const toastMessage = ref('')

function markAsWonAndVectorize() {
  toastMessage.value = `Deal marked as WON! Chunks embedded via gemini-embedding-2 and stored in Supabase pgvector table 'won_pitches' (768-dim HNSW). Future pitches will rank this winning scope!`
  showFlywheelToast.value = true
  setTimeout(() => {
    showFlywheelToast.value = false
  }, 5000)
}

// Upgrade Modal State (Stripe & PayMongo)
const isUpgradeModalOpen = ref(false)
const paymentProvider = ref('stripe') // 'stripe' | 'paymongo'

const quotaUsed = ref(3)
const quotaLimit = ref(5)
const quotaPercent = computed(() => (quotaUsed.value / quotaLimit.value) * 100)
</script>

<template>
  <div class="w-full bg-[#f8fafc] text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6 rounded-2xl border border-slate-200/90 shadow-sm text-left">
    
    <!-- Flywheel Toast Notification -->
    <Transition name="slide-down">
      <div 
        v-if="showFlywheelToast" 
        class="fixed top-6 right-6 z-50 max-w-md p-4 rounded-xl bg-slate-900 text-white shadow-2xl border border-teal-500/40 flex items-start gap-3"
      >
        <div class="p-2 rounded-lg bg-teal-500/20 text-teal-400 shrink-0">
          <TrendingUp class="w-5 h-5" />
        </div>
        <div class="space-y-1">
          <h4 class="text-xs font-bold uppercase tracking-wider text-teal-300">Self-Improving RAG Flywheel</h4>
          <p class="text-xs text-slate-200 leading-relaxed">{{ toastMessage }}</p>
        </div>
        <button @click="showFlywheelToast = false" class="text-slate-400 hover:text-white ml-auto">
          <X class="w-4 h-4" />
        </button>
      </div>
    </Transition>

    <!-- TOP DASHBOARD HEADER (Matching reference image) -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white font-black text-base shadow-sm">
            P
          </span>
          <span>ProposalAI Dashboard</span>
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Enterprise B2B AI Proposal Generator
        </p>
      </div>

      <!-- Free Tier Quotas Pill with Progress Bar -->
      <div class="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3 sm:px-4 sm:py-2.5 flex flex-col justify-between min-w-[240px] shadow-xs">
        <div class="flex items-center justify-between gap-3 text-xs">
          <span class="font-bold text-slate-800 flex items-center gap-1.5">
            Free Tier Quotas: {{ quotaUsed }}/{{ quotaLimit }} Proposals used
          </span>
          <AlertTriangle class="w-4 h-4 text-amber-500 shrink-0" />
        </div>
        <!-- Progress Bar -->
        <div class="w-full bg-slate-200/80 h-1.5 rounded-full mt-2 overflow-hidden">
          <div 
            class="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-300" 
            :style="{ width: `${quotaPercent}%` }"
          />
        </div>
        <div class="mt-2 flex items-center justify-between">
          <span class="text-[10px] text-slate-500">2 proposals remaining</span>
          <button 
            @click="isUpgradeModalOpen = true"
            class="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline underline-offset-2"
          >
            Upgrade Tier →
          </button>
        </div>
      </div>
    </div>

    <!-- 4 KEY STAT / METRIC CARDS (Matching reference image) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- Card 1: AI Proposal Drafting -->
      <div class="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-teal-500/40 transition-all">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
            AI PROPOSAL DRAFTING
          </span>
          <Sparkles class="w-4 h-4 text-teal-500" />
        </div>
        <div class="text-base sm:text-lg font-extrabold text-slate-900">
          Gemini Flash-Lite
        </div>
        <div class="text-xs text-slate-500 font-medium mt-0.5">
          3.5 & Pro Models
        </div>
      </div>

      <!-- Card 2: Vector Search (RAG) -->
      <div class="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-500/40 transition-all">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
            VECTOR SEARCH (RAG)
          </span>
          <Zap class="w-4 h-4 text-emerald-500" />
        </div>
        <div class="text-base sm:text-lg font-extrabold text-slate-900">
          Supabase
        </div>
        <div class="text-xs text-slate-500 font-medium mt-0.5">
          PostgreSQL pgvector (768-dim)
        </div>
      </div>

      <!-- Card 3: Subtotal & Margins -->
      <div class="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-teal-500/40 transition-all">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
            SUBTOTAL & MARGINS
          </span>
          <BarChart3 class="w-4 h-4 text-teal-500" />
        </div>
        <div class="text-base sm:text-lg font-extrabold text-slate-900">
          Real-time ledger
        </div>
        <div class="text-xs text-slate-500 font-medium mt-0.5">
          recalculations via Pinia
        </div>
      </div>

      <!-- Card 4: Learning Flywheel -->
      <div class="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-purple-500/40 transition-all">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
            LEARNING FLYWHEEL
          </span>
          <TrendingUp class="w-4 h-4 text-purple-500" />
        </div>
        <div class="text-base sm:text-lg font-extrabold text-slate-900">
          Store "won" bids
        </div>
        <div class="text-xs text-slate-500 font-medium mt-0.5">
          automatically for RAG
        </div>
      </div>

    </div>

    <!-- DUAL-COLUMN LIVE STUDIO (Matching reference image) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- ================= COLUMN 1: LIVE PROPOSAL BUILDER & CANVAS ================= -->
      <div class="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5">
        
        <!-- Header & Preset Selector -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span class="text-[10px] font-mono font-bold tracking-wider uppercase text-teal-700">
              NEW PROPOSAL:
            </span>
            <h2 class="text-lg font-extrabold text-slate-900">
              {{ selectedPreset.name }}
            </h2>
          </div>

          <div class="flex items-center gap-2">
            <select 
              v-model="selectedPresetId"
              @change="applyPreset(selectedPresetId)"
              class="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-1 focus:ring-teal-500 focus:outline-none"
            >
              <option v-for="p in presets" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>

            <button 
              @click="triggerAiGeneration"
              class="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              Edit Builder
            </button>
          </div>
        </div>

        <!-- Section 1: Client Intel & CRM Dossier -->
        <div class="space-y-3">
          <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Briefcase class="w-3.5 h-3.5 text-teal-600" />
            <span>Client Intel & CRM Dossier</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label class="text-[11px] font-semibold text-slate-500 block mb-1">Client name</label>
              <input 
                v-model="clientForm.clientName"
                type="text" 
                placeholder="Client organization"
                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-500 block mb-1">Email</label>
              <input 
                v-model="clientForm.email"
                type="email" 
                placeholder="contact@company.com"
                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-500 block mb-1">First name</label>
              <input 
                v-model="clientForm.firstName"
                type="text" 
                placeholder="First name"
                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-500 block mb-1">Last name</label>
              <input 
                v-model="clientForm.lastName"
                type="text" 
                placeholder="Last name"
                class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Section 2: Catalog Deliverables (Quantity, Cost, Discount %) -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Catalog Deliverables (Quantity, Cost, Discount %)
            </span>
            <button 
              @click="addDeliverable"
              class="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>+ Add Items</span>
            </button>
          </div>

          <!-- Deliverables Table / Rows -->
          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div 
              v-for="(item, idx) in deliverables" 
              :key="idx"
              class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-12 gap-2 items-center text-xs"
            >
              <!-- Deliverable Name -->
              <div class="col-span-5 sm:col-span-6">
                <input 
                  v-model="item.name"
                  type="text"
                  class="w-full bg-transparent font-medium text-slate-800 focus:outline-none truncate"
                />
              </div>

              <!-- Cost -->
              <div class="col-span-3 sm:col-span-2">
                <div class="relative">
                  <span class="absolute left-1.5 top-1 text-slate-400 text-[10px]">$</span>
                  <input 
                    v-model.number="item.unitPrice"
                    type="number"
                    class="w-full bg-white border border-slate-200 rounded px-1.5 pl-4 py-0.5 text-right font-mono text-[11px] font-semibold text-slate-800"
                  />
                </div>
              </div>

              <!-- Qty & Discount -->
              <div class="col-span-3 sm:col-span-3 flex items-center justify-end gap-1.5">
                <div class="flex items-center border border-slate-200 rounded bg-white overflow-hidden">
                  <button 
                    @click="item.qty > 1 && item.qty--"
                    class="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 font-mono text-[10px]"
                  >-</button>
                  <span class="px-1.5 font-mono text-[11px] font-bold">{{ item.qty }}</span>
                  <button 
                    @click="item.qty++"
                    class="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 font-mono text-[10px]"
                  >+</button>
                </div>
                
                <span class="text-[10px] text-slate-400 font-mono">-{{ item.discount }}%</span>
              </div>

              <!-- Remove -->
              <div class="col-span-1 text-right">
                <button 
                  @click="removeDeliverable(idx)"
                  class="text-slate-400 hover:text-red-500 p-0.5"
                  title="Remove item"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Real-Time Reactive Ledger Summary (Pinia Math) -->
          <div class="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 text-xs space-y-1.5">
            <div class="flex justify-between text-slate-600">
              <span>Catalog Subtotal:</span>
              <span class="font-mono font-medium">${{ ledger.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="flex justify-between text-teal-700">
              <span>Volume Discount Curve:</span>
              <span class="font-mono font-medium">-${{ ledger.totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Standard Enterprise VAT (12%):</span>
              <span class="font-mono font-medium">+${{ ledger.tax.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-teal-200/60 text-sm">
              <span>Deterministic Grand Total:</span>
              <span class="font-mono text-teal-800">${{ ledger.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>
        </div>

        <!-- Section 3: Strategic Directives Prompt Field (1000 char max) -->
        <div class="space-y-2 pt-2">
          <div class="flex items-center justify-between text-xs">
            <label class="font-bold text-slate-700 uppercase tracking-wider">
              Strategic Directives Prompt Field (1000 char max)
            </label>
            <span class="text-[11px] font-mono text-slate-400">
              {{ clientForm.directive.length }}/1000
            </span>
          </div>

          <textarea 
            v-model="clientForm.directive"
            rows="3"
            maxlength="1000"
            placeholder="Net strategic directives prompt field"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed focus:bg-white focus:ring-1 focus:ring-teal-500 focus:outline-none font-sans resize-none"
          />
        </div>

        <!-- Primary Generation Trigger Button -->
        <button 
          @click="triggerAiGeneration"
          :disabled="isGenerating"
          class="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm shadow-md shadow-teal-700/20 flex items-center justify-center gap-2.5 transition-all disabled:opacity-70"
        >
          <Sparkles class="w-4 h-4 text-amber-300" :class="{ 'animate-spin': isGenerating }" />
          <span>{{ isGenerating ? 'Synthesizing with Gemini Flash-Lite & pgvector...' : 'Generate AI Proposal with Gemini' }}</span>
        </button>

      </div>

      <!-- ================= COLUMN 2: DOCUMENT LIVE CANVAS & DRAFT PREVIEW ================= -->
      <div class="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5 relative overflow-hidden">
        
        <!-- Header & Action Button -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span class="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-700">
              CANVAS LIVE VIEW
            </span>
            <h3 class="text-base sm:text-lg font-extrabold text-slate-900">
              Document Live Canvas & Draft Preview
            </h3>
          </div>

          <button 
            @click="markAsWonAndVectorize"
            class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <CheckCircle2 class="w-3.5 h-3.5" />
            <span>Edit Draft / Mark as Won & Vectorize</span>
          </button>
        </div>

        <!-- GENERATING SHIMMER STATE (When active) -->
        <div v-if="isGenerating" class="space-y-4 py-8 animate-pulse text-center">
          <div class="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-3">
            <RefreshCw class="w-6 h-6 animate-spin" />
          </div>
          <div class="space-y-1">
            <h4 class="text-sm font-bold text-slate-800">
              AI Generation Shimmer/Progress State
            </h4>
            <p class="text-xs text-slate-500">
              Grounding prompt with Top-3 won pitches from Supabase PostgreSQL pgvector...
            </p>
          </div>

          <!-- Progress Shimmer Bar -->
          <div class="w-3/4 mx-auto bg-slate-100 h-2 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full animate-progress" />
          </div>

          <!-- Shimmer Content Blocks -->
          <div class="space-y-2 pt-4 px-4 text-left">
            <div class="h-4 bg-slate-200/80 rounded w-1/3"></div>
            <div class="h-3 bg-slate-200/60 rounded w-full"></div>
            <div class="h-3 bg-slate-200/60 rounded w-5/6"></div>
            <div class="h-3 bg-slate-200/60 rounded w-4/6"></div>
          </div>
        </div>

        <!-- RENDERED PROPOSAL PREVIEW (Matching reference image) -->
        <div v-else class="space-y-5 text-left text-xs">
          
          <!-- Section 1: Executive Summary -->
          <div class="space-y-2">
            <h4 class="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <span>Executive Summary</span>
              <span class="text-[10px] font-mono text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded font-normal">
                Personalized Scope
              </span>
            </h4>
            <p class="text-slate-600 leading-relaxed text-justify">
              This proposal provides {{ clientForm.clientName }} with a turnkey, enterprise-grade technological framework designed to address existing operational friction. Grounded in strategic directives for {{ selectedPreset.industry }}, our solution guarantees a measurable ROI within the first six months, backed by zero-downtime cutover architecture and continuous PostgreSQL resilience.
            </p>
            <p class="text-slate-600 leading-relaxed text-justify">
              "{{ clientForm.directive }}"
            </p>
          </div>

          <!-- Section 2: Milestone Timeline (Visual Node Stepper Diagram) -->
          <div class="space-y-2 pt-2">
            <h4 class="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-1">
              Milestone Timeline
            </h4>
            
            <div class="py-3 px-2 bg-slate-50 rounded-xl border border-slate-200/70">
              <div class="flex items-center justify-between relative">
                <!-- Connecting Line -->
                <div class="absolute left-6 right-6 top-3 h-0.5 bg-teal-200 z-0"></div>

                <!-- Node 1 -->
                <div class="relative z-10 flex flex-col items-center text-center space-y-1">
                  <div class="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                    1
                  </div>
                  <span class="text-[10px] font-bold text-slate-700">Sprint 0</span>
                  <span class="text-[9px] text-slate-400">Architecture Review</span>
                </div>

                <!-- Node 2 -->
                <div class="relative z-10 flex flex-col items-center text-center space-y-1">
                  <div class="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                    2
                  </div>
                  <span class="text-[10px] font-bold text-slate-700">Phase 1</span>
                  <span class="text-[9px] text-slate-400">Core Migration</span>
                </div>

                <!-- Node 3 -->
                <div class="relative z-10 flex flex-col items-center text-center space-y-1">
                  <div class="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                    3
                  </div>
                  <span class="text-[10px] font-bold text-slate-700">Phase 2</span>
                  <span class="text-[9px] text-slate-400">RAG Vectorization</span>
                </div>

                <!-- Node 4 -->
                <div class="relative z-10 flex flex-col items-center text-center space-y-1">
                  <div class="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                    ✓
                  </div>
                  <span class="text-[10px] font-bold text-slate-700">Phase 3</span>
                  <span class="text-[9px] text-slate-400">SLA Handover</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Dynamic Pricing Tables (Matching reference screenshot) -->
          <div class="space-y-2 pt-2">
            <h4 class="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between">
              <span>Dynamic Pricing Tables</span>
              <span class="text-[10px] font-mono text-slate-400">USD Currency</span>
            </h4>

            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-100/80 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th class="py-2 px-3">Item #</th>
                    <th class="py-2 px-3">Description</th>
                    <th class="py-2 px-3 text-right">Cost</th>
                    <th class="py-2 px-3 text-right">Discount</th>
                    <th class="py-2 px-3 text-right">Pricing</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr v-for="(item, idx) in deliverables" :key="idx" class="hover:bg-slate-50/50">
                    <td class="py-2 px-3 font-bold text-slate-400">{{ idx + 1 }}</td>
                    <td class="py-2 px-3 font-sans font-medium text-slate-800">{{ item.name }}</td>
                    <td class="py-2 px-3 text-right text-slate-600">${{ (item.unitPrice * item.qty).toLocaleString() }}</td>
                    <td class="py-2 px-3 text-right text-teal-600">{{ item.discount }}%</td>
                    <td class="py-2 px-3 text-right font-bold text-slate-900">
                      ${{ ((item.unitPrice * item.qty) * (1 - item.discount / 100)).toLocaleString() }}
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                  <tr>
                    <td colspan="4" class="py-2.5 px-3 text-right text-slate-700">Total Draft Scope:</td>
                    <td class="py-2.5 px-3 text-right font-mono text-teal-800 font-extrabold">
                      ${{ ledger.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Floating Overlaid / Inset Summary Box (Matching reference screenshot) -->
          <div class="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-2 shadow-lg">
            <div class="flex items-center justify-between text-xs pb-1.5 border-b border-slate-700">
              <span class="font-bold flex items-center gap-1.5 text-teal-300">
                <Sparkles class="w-3.5 h-3.5" />
                <span>AI Generation Shimmer/Progress State</span>
              </span>
              <span class="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                Completed in {{ generationTime }}
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono pt-1">
              <div>
                <span class="text-slate-400 block">Subtotal:</span>
                <span class="font-bold text-white">${{ ledger.subtotal.toLocaleString() }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Discount:</span>
                <span class="font-bold text-teal-400">-${{ ledger.totalDiscount.toLocaleString() }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">VAT (12%):</span>
                <span class="font-bold text-slate-300">+${{ ledger.tax.toLocaleString() }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Vectorized:</span>
                <span class="font-bold text-purple-300">768-dim</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- BOTTOM TECH BADGES ROW (Matching reference screenshot) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
      
      <!-- Badge 1: Laravel 11 & Vue 3 + Inertia.js -->
      <div class="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
          <Layers class="w-5 h-5" />
        </div>
        <div>
          <h4 class="font-bold text-slate-900 text-xs sm:text-sm">
            Laravel 11 & Vue 3
          </h4>
          <span class="text-[11px] text-slate-500">+ Inertia.js Monorepo</span>
        </div>
      </div>

      <!-- Badge 2: Gemini AI & Embeddings v2 -->
      <div class="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
          <Sparkles class="w-5 h-5" />
        </div>
        <div>
          <h4 class="font-bold text-slate-900 text-xs sm:text-sm">
            Gemini AI & Embeddings
          </h4>
          <span class="text-[11px] text-slate-500">gemini-embedding-2</span>
        </div>
      </div>

      <!-- Badge 3: pgvector Vector Store (Supabase) -->
      <div class="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center font-bold text-xs shrink-0">
          <Database class="w-5 h-5" />
        </div>
        <div>
          <h4 class="font-bold text-slate-900 text-xs sm:text-sm">
            pgvector Vector Store
          </h4>
          <span class="text-[11px] text-slate-500">Supabase PostgreSQL 17</span>
        </div>
      </div>

      <!-- Badge 4: Stripe & PayMongo subscription gating -->
      <div class="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3 cursor-pointer hover:border-teal-500/40 transition-colors" @click="isUpgradeModalOpen = true">
        <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
          <CreditCard class="w-5 h-5" />
        </div>
        <div>
          <h4 class="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1">
            <span>Stripe & PayMongo</span>
          </h4>
          <span class="text-[11px] text-slate-500">Subscription Quota Gating</span>
        </div>
      </div>

    </div>

    <!-- STRIPE & PAYMONGO UPGRADE CHECKOUT MODAL -->
    <Transition name="fade">
      <div 
        v-if="isUpgradeModalOpen"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="isUpgradeModalOpen = false"
      >
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-left">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-600">
                PROPOSALAI SUBSCRIPTION GATING
              </span>
              <h3 class="text-xl font-extrabold text-slate-900">
                Upgrade Proposal Quotas
              </h3>
            </div>
            <button @click="isUpgradeModalOpen = false" class="text-slate-400 hover:text-slate-600 p-1">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Plan Selection -->
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="p-3.5 rounded-xl border-2 border-teal-600 bg-teal-50/40 space-y-1">
              <div class="flex justify-between font-bold text-slate-900">
                <span>Pro Tier</span>
                <span class="text-teal-700">$49/mo</span>
              </div>
              <p class="text-[11px] text-slate-500">50 AI proposals/month + 768-dim Supabase RAG flywheel indexing.</p>
            </div>
            <div class="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 space-y-1">
              <div class="flex justify-between font-bold text-slate-900">
                <span>Enterprise</span>
                <span class="text-slate-700">$199/mo</span>
              </div>
              <p class="text-[11px] text-slate-500">Unlimited proposals, custom CRM webhooks & SLA guarantee.</p>
            </div>
          </div>

          <!-- Payment Rails Tabs (Stripe vs PayMongo) -->
          <div class="space-y-3">
            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Select Payment Gateway:
            </span>
            <div class="grid grid-cols-2 gap-2">
              <button 
                @click="paymentProvider = 'stripe'"
                :class="[
                  'py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all',
                  paymentProvider === 'stripe' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                ]"
              >
                <span>Stripe Cashier (Global)</span>
              </button>

              <button 
                @click="paymentProvider = 'paymongo'"
                :class="[
                  'py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all',
                  paymentProvider === 'paymongo' 
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                ]"
              >
                <span>PayMongo (GCash/Cards)</span>
              </button>
            </div>

            <!-- Simulated Payment Form -->
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div v-if="paymentProvider === 'stripe'">
                <label class="text-[11px] text-slate-500 block mb-1">Card Number (Stripe Test Mode)</label>
                <input 
                  type="text" 
                  value="4242 •••• •••• 4242" 
                  disabled
                  class="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-700"
                />
              </div>
              <div v-else>
                <label class="text-[11px] text-slate-500 block mb-1">PayMongo eWallet / Bank Rails</label>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1 bg-white border border-slate-200 rounded font-bold text-emerald-700">GCash</span>
                  <span class="px-2 py-1 bg-white border border-slate-200 rounded font-bold text-teal-700">Maya</span>
                  <span class="px-2 py-1 bg-white border border-slate-200 rounded font-bold text-blue-700">Credit Card</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            @click="isUpgradeModalOpen = false; quotaLimit = 50; quotaUsed = 3"
            class="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            Confirm & Upgrade Subscription ($49.00 / mo)
          </button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
@keyframes progress {
  0% { width: 0%; }
  50% { width: 75%; }
  100% { width: 100%; }
}
.animate-progress {
  animation: progress 2.2s infinite ease-in-out;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

