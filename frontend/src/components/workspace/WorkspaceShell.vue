<script setup>
import { computed } from 'vue'
import { usePortfolioStore } from '../../stores/portfolioStore'
import { rlgProjectData, proposalAiProjectData } from '../../data/projectsData'
import WorkspaceSidebar from './WorkspaceSidebar.vue'
import WorkspaceTopBar from './WorkspaceTopBar.vue'
import SlideDeckViewer from './SlideDeckViewer.vue'
import DeviceSimulatorFrame from './demos/DeviceSimulatorFrame.vue'
import AdminPanelDemo from './demos/AdminPanelDemo.vue'
import BuyerStorefrontDemo from './demos/BuyerStorefrontDemo.vue'
import ProposalAiDemo from './demos/ProposalAiDemo.vue'
import DeploymentView from './DeploymentView.vue'
import AiPipelinesView from './AiPipelinesView.vue'
import ArchitectureView from './ArchitectureView.vue'
import TechStackView from './TechStackView.vue'

import { 
  Layers, 
  Cpu, 
  Smartphone, 
  ShieldCheck, 
  ExternalLink,
  Store,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  BookOpen,
  FolderGit2,
  Scan,
  Compass,
  Monitor,
  Tablet,
  Zap,
  BarChart3,
  TrendingUp,
  Database,
  CreditCard,
  FileText
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()

const isProposalAi = computed(() => portfolioStore.activeProjectId === 'proposal-ai')

const rlgMetricCards = [
  {
    tag: 'FULL-STACK ARCHITECTURE',
    title: 'Laravel',
    subtitle: 'Laravel, Vue 3, Inertia.js',
    icon: Layers,
    color: 'text-indigo-400'
  },
  {
    tag: 'AI-POWERED PIPELINES',
    title: '3 Active Engines',
    subtitle: '(Vision, SEO, Chat)',
    icon: Cpu,
    color: 'text-purple-400'
  },
  {
    tag: 'MOBILE FIRST (PWA)',
    title: 'Offline ready',
    subtitle: '& responsive',
    icon: Smartphone,
    color: 'text-teal-400'
  },
  {
    tag: 'SECURE OAUTH',
    title: 'Google Auth',
    subtitle: 'Google Auth & token-based',
    icon: ShieldCheck,
    color: 'text-sky-400'
  }
]

const proposalAiMetricCards = [
  {
    tag: 'AI PROPOSAL DRAFTING',
    title: 'Gemini Flash-Lite',
    subtitle: '3.5 & Pro Models',
    icon: Sparkles,
    color: 'text-teal-600'
  },
  {
    tag: 'VECTOR SEARCH (RAG)',
    title: 'Supabase',
    subtitle: 'PostgreSQL pgvector (768-dim)',
    icon: Zap,
    color: 'text-emerald-600'
  },
  {
    tag: 'SUBTOTAL & MARGINS',
    title: 'Real-time ledger',
    subtitle: 'recalculations via Pinia',
    icon: BarChart3,
    color: 'text-teal-600'
  },
  {
    tag: 'LEARNING FLYWHEEL',
    title: 'Store "won" bids',
    subtitle: 'automatically for RAG',
    icon: TrendingUp,
    color: 'text-purple-600'
  }
]

const activeMetricCards = computed(() => {
  return isProposalAi.value ? proposalAiMetricCards : rlgMetricCards
})
</script>

<template>
  <div 
    :class="[
      'h-screen w-full flex flex-col md:flex-row overflow-hidden antialiased relative',
      isProposalAi ? 'bg-[#f1f5f9] text-slate-800' : 'bg-[#090d16] text-slate-100 selection:bg-indigo-500 selection:text-white'
    ]"
  >
    
    <!-- Mobile Backdrop for Workspace Sidebar -->
    <Transition name="fade">
      <div 
        v-if="portfolioStore.isWorkspaceSidebarOpen"
        @click="portfolioStore.closeWorkspaceSidebar"
        class="fixed inset-0 bg-black/75 z-40 md:hidden backdrop-blur-xs transition-opacity"
      />
    </Transition>

    <!-- Left Navigation Sidebar -->
    <WorkspaceSidebar 
      :class="[
        'transition-transform duration-200 ease-in-out md:translate-x-0',
        portfolioStore.isWorkspaceSidebarOpen 
          ? 'fixed inset-y-0 left-0 z-50 flex shadow-2xl' 
          : 'fixed inset-y-0 left-0 -translate-x-full z-50 md:static md:flex'
      ]"
    />

    <!-- Main Content Area -->
    <div 
      :class="[
        'flex-1 flex flex-col min-w-0 h-full overflow-hidden',
        isProposalAi ? 'bg-[#f8fafc]' : 'bg-[#090d16]'
      ]"
    >
      <!-- Top Navigation & Status Bar -->
      <WorkspaceTopBar class="shrink-0" />

      <!-- Scrollable View Body -->
      <main class="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto overflow-x-hidden max-w-full w-full mx-auto space-y-6 min-w-0">
        
        <!-- ================= OVERVIEW & METRICS VIEW ================= -->
        <div v-if="portfolioStore.activeWorkspaceTab === 'overview'" class="space-y-8 text-left">
          
          <!-- ProposalAI Overview Header -->
          <template v-if="isProposalAi">
            <div class="space-y-1">
              <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white font-black text-base shadow-sm">
                  P
                </span>
                <span>ProposalAI Dashboard</span>
              </h1>
              <p class="text-sm text-slate-500 font-medium">
                Enterprise B2B AI Proposal Generator with Supabase PostgreSQL pgvector RAG
              </p>
            </div>

            <!-- Top 4 Feature / Metric Cards in Light Enterprise Theme -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                v-for="(card, cIdx) in proposalAiMetricCards" 
                :key="cIdx"
                class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-400/60 transition-all duration-200 shadow-sm"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                    {{ card.tag }}
                  </span>
                  <component :is="card.icon" :class="['w-4 h-4', card.color]" />
                </div>
                <div class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {{ card.title }}
                </div>
                <p class="text-xs text-slate-500 mt-1">
                  {{ card.subtitle }}
                </p>
              </div>
            </div>

            <!-- Middle Presentation Deck & Talk Tracks for ProposalAI -->
            <div class="space-y-3">
              <SlideDeckViewer />
            </div>

            <!-- Bottom 4 Feature Cards (ProposalAI) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                @click="portfolioStore.setWorkspaceTab('architecture')"
                class="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all flex items-center justify-between group shadow-xs"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-bold text-xs">
                    LV
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-teal-700 transition-colors">
                      Laravel 11 & Vue 3
                    </h4>
                    <span class="text-[11px] text-slate-500">Inertia Monorepo</span>
                  </div>
                </div>
                <span class="text-slate-400 group-hover:text-teal-600 text-xs">→</span>
              </button>

              <button 
                @click="portfolioStore.setWorkspaceTab('ai')"
                class="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all flex items-center justify-between group shadow-xs"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold text-xs">
                    AI
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-teal-700 transition-colors">
                      Gemini Flash-Lite
                    </h4>
                    <span class="text-[11px] text-slate-500">Prompt + Top-3 RAG</span>
                  </div>
                </div>
                <span class="text-slate-400 group-hover:text-teal-600 text-xs">→</span>
              </button>

              <button 
                @click="portfolioStore.setWorkspaceTab('infra')"
                class="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all flex items-center justify-between group shadow-xs"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center font-bold text-xs">
                    DB
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-teal-700 transition-colors">
                      Supabase pgvector
                    </h4>
                    <span class="text-[11px] text-slate-500">PostgreSQL 17 HNSW</span>
                  </div>
                </div>
                <span class="text-slate-400 group-hover:text-teal-600 text-xs">→</span>
              </button>

              <button 
                @click="portfolioStore.setWorkspaceTab('demos')"
                class="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all flex items-center justify-between group shadow-xs"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    $
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-teal-700 transition-colors">
                      Stripe & PayMongo
                    </h4>
                    <span class="text-[11px] text-slate-500">Quota Gating</span>
                  </div>
                </div>
                <span class="text-slate-400 group-hover:text-teal-600 text-xs">→</span>
              </button>
            </div>

            <!-- Quick Launch Live Studio Banner with Device Presets -->
            <div class="p-6 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-4 text-white shadow-lg">
              <div class="space-y-1">
                <span class="text-xs font-mono uppercase tracking-widest text-purple-400 font-semibold">Live Proposal Studio &amp; Directory</span>
                <h3 class="text-lg font-bold text-white">Experience ProposalAI across Desktop, Tablet, and Mobile Phone</h3>
                <p class="text-xs text-slate-300">
                  Inspect authentic views: Proposals Directory, Executive Dashboard, Client Accounts, and Services Catalog across 1440px PC, 1024px Tablet, and 390px Native Phone.
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button 
                  @click="portfolioStore.setWorkspaceTab('demos'); portfolioStore.setDevice('desktop')"
                  class="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
                >
                  <Monitor class="w-3.5 h-3.5" />
                  <span>PC (1440px)</span>
                </button>

                <button 
                  @click="portfolioStore.setWorkspaceTab('demos'); portfolioStore.setDevice('tablet')"
                  class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
                >
                  <Tablet class="w-3.5 h-3.5" />
                  <span>Tablet (1024px)</span>
                </button>

                <button 
                  @click="portfolioStore.setWorkspaceTab('demos'); portfolioStore.setDevice('mobile')"
                  class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
                >
                  <Smartphone class="w-3.5 h-3.5 text-amber-300" />
                  <span>Phone (390px)</span>
                </button>
              </div>
            </div>
          </template>

          <!-- RLG Online Shop Overview Header -->
          <template v-else>
            <!-- Workspace Hero Title matching Reference Screenshot -->
            <div class="space-y-1">
              <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0 border border-white/20">
                  <img src="/rlg-logo.png" alt="RLG Online Shop Logo" class="w-full h-full object-contain" />
                </div>
                <span>RLG Online Shop Dashboard</span>
              </h1>
              <p class="text-sm text-slate-400 font-normal">
                Full-stack monorepo featuring multimodal AI automation
              </p>
            </div>

            <!-- Top 4 Feature / Metric Cards matching Reference Screenshot -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                v-for="(card, cIdx) in rlgMetricCards" 
                :key="cIdx"
                class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#131b2e] to-[#0f172a] border border-indigo-500/20 hover:border-indigo-400/40 transition-all duration-200 shadow-lg shadow-black/20"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                    {{ card.tag }}
                  </span>
                  <component :is="card.icon" :class="['w-4 h-4', card.color]" />
                </div>
                <div class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {{ card.title }}
                </div>
                <p class="text-xs text-slate-400 mt-1">
                  {{ card.subtitle }}
                </p>
              </div>
            </div>

            <!-- Middle Presentation Deck & Talk Tracks (Matching Reference Screenshot) -->
            <div class="space-y-3">
              <SlideDeckViewer />
            </div>

            <!-- Bottom 4 Feature Cards (Laravel & Vue 3, NotebookLM, Google Antigravity, Multimodal AI) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                @click="portfolioStore.setWorkspaceTab('architecture')"
                class="p-4 rounded-2xl bg-[#131b2e] hover:bg-[#18223a] border border-indigo-500/20 hover:border-indigo-400/40 text-left transition-all flex items-center justify-between group"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-xs">
                    LV
                  </div>
                  <div>
                    <h4 class="font-bold text-white text-xs sm:text-sm group-hover:text-indigo-300 transition-colors">
                      Laravel & Vue 3
                    </h4>
                    <span class="text-[11px] text-slate-400">Monorepo Bridge</span>
                  </div>
                </div>
                <span class="text-slate-500 group-hover:text-indigo-400 text-xs">→</span>
              </button>

              <button 
                @click="portfolioStore.setWorkspaceTab('slides')"
                class="p-4 rounded-2xl bg-[#131b2e] hover:bg-[#18223a] border border-indigo-500/20 hover:border-indigo-400/40 text-left transition-all flex items-center justify-between group"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                    NL
                  </div>
                  <div>
                    <h4 class="font-bold text-white text-xs sm:text-sm group-hover:text-indigo-300 transition-colors">
                      NotebookLM Slides
                    </h4>
                    <span class="text-[11px] text-slate-400">8 Curated Slides</span>
                  </div>
                </div>
                <span class="text-slate-500 group-hover:text-indigo-400 text-xs">→</span>
              </button>

              <button 
                @click="portfolioStore.setWorkspaceTab('architecture')"
                class="p-4 rounded-2xl bg-[#131b2e] hover:bg-[#18223a] border border-indigo-500/20 hover:border-indigo-400/40 text-left transition-all flex items-center justify-between group"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                    AG
                  </div>
                  <div>
                    <h4 class="font-bold text-white text-xs sm:text-sm group-hover:text-indigo-300 transition-colors">
                      Google Antigravity
                    </h4>
                    <span class="text-[11px] text-slate-400">Autonomous Agents</span>
                  </div>
                </div>
                <span class="text-slate-500 group-hover:text-indigo-400 text-xs">→</span>
              </button>

              <button 
                @click="portfolioStore.setWorkspaceTab('ai')"
                class="p-4 rounded-2xl bg-[#131b2e] hover:bg-[#18223a] border border-indigo-500/20 hover:border-indigo-400/40 text-left transition-all flex items-center justify-between group"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                    AI
                  </div>
                  <div>
                    <h4 class="font-bold text-white text-xs sm:text-sm group-hover:text-indigo-300 transition-colors">
                      Multimodal AI (Vision)
                    </h4>
                    <span class="text-[11px] text-slate-400">Gemini OCR Engine</span>
                  </div>
                </div>
                <span class="text-slate-500 group-hover:text-indigo-400 text-xs">→</span>
              </button>
            </div>

            <!-- Quick Launch Interactive Demos Banner with Desktop vs Mobile Phone triggers -->
            <div class="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div class="space-y-1">
                <span class="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">Hands-On Evaluation</span>
                <h3 class="text-lg font-bold text-white">Experience Live Demos with Device Resolution Switcher</h3>
                <p class="text-xs text-slate-300">
                  Inspect actual views from the <code class="text-indigo-400">rlgshop</code> repository in Desktop (1440px), Tablet (1024px), or realistic Smartphone Frame (390px).
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  @click="portfolioStore.setWorkspaceTab('demos'); portfolioStore.setDemoMode('admin'); portfolioStore.setDevice('desktop')"
                  class="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Monitor class="w-3.5 h-3.5" />
                  <span>Admin (Desktop)</span>
                </button>

                <button
                  @click="portfolioStore.setWorkspaceTab('demos'); portfolioStore.setDemoMode('storefront'); portfolioStore.setDevice('mobile')"
                  class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Smartphone class="w-3.5 h-3.5 text-amber-300" />
                  <span>Storefront (Mobile Phone)</span>
                </button>
              </div>
            </div>
          </template>

        </div>

        <!-- ================= PRESENTATION DECK TAB ================= -->
        <div v-else-if="portfolioStore.activeWorkspaceTab === 'slides'" class="space-y-6">
          <SlideDeckViewer />
        </div>

        <!-- ================= INTERACTIVE DEMOS TAB ================= -->
        <div v-else-if="portfolioStore.activeWorkspaceTab === 'demos'" class="space-y-6">
          <template v-if="isProposalAi">
            <ProposalAiDemo />
          </template>
          <template v-else>
            <DeviceSimulatorFrame>
              <Transition mode="out-in" name="fade">
                <component 
                  :is="portfolioStore.activeDemoMode === 'admin' ? AdminPanelDemo : BuyerStorefrontDemo" 
                />
              </Transition>
            </DeviceSimulatorFrame>
          </template>
        </div>

        <!-- ================= INFRASTRUCTURE TAB ================= -->
        <div v-else-if="portfolioStore.activeWorkspaceTab === 'infra'" class="space-y-6">
          <DeploymentView />
        </div>

        <!-- ================= AI PIPELINES TAB ================= -->
        <div v-else-if="portfolioStore.activeWorkspaceTab === 'ai'" class="space-y-6">
          <AiPipelinesView />
        </div>

        <!-- ================= ARCHITECTURE TAB ================= -->
        <div v-else-if="portfolioStore.activeWorkspaceTab === 'architecture'" class="space-y-6">
          <ArchitectureView />
        </div>

        <!-- ================= TECH STACK TAB ================= -->
        <div v-else-if="portfolioStore.activeWorkspaceTab === 'tech'" class="space-y-6">
          <TechStackView />
        </div>

      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
