<script setup>
import { computed } from 'vue'
import { usePortfolioStore } from '../../stores/portfolioStore'
import { 
  LayoutGrid, 
  Tv, 
  Store, 
  Layers, 
  Cpu, 
  Network, 
  Server,
  Github, 
  ExternalLink, 
  ArrowLeft,
  Sparkles,
  Database,
  FileText,
  CreditCard,
  X
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()

const rlgNavItems = [
  { id: 'overview', label: 'Overview & Metrics', icon: LayoutGrid },
  { id: 'slides', label: 'Presentation Deck', icon: Tv, badge: '8 Slides' },
  { id: 'demos', label: 'Interactive Demos', icon: Store, badge: 'Live UI' },
  { id: 'tech', label: 'Tech Stack & Tooling', icon: Layers },
  { id: 'ai', label: 'AI Vision Pipelines', icon: Cpu, badge: 'Vision OCR' },
  { id: 'architecture', label: 'Architecture & Monorepo', icon: Network },
  { id: 'infra', label: 'Infrastructure & Deployment', icon: Server, badge: 'Railway' }
]

const proposalAiNavItems = [
  { id: 'overview', label: 'Overview & Analytics', icon: LayoutGrid },
  { id: 'slides', label: 'Presentation Deck', icon: Tv, badge: '8 Slides' },
  { id: 'demos', label: 'Live Proposal Studio', icon: FileText, badge: 'Live Demo' },
  { id: 'tech', label: 'Tech Stack & Tooling', icon: Layers },
  { id: 'ai', label: 'pgvector RAG Pipelines', icon: Database, badge: 'Gemini' },
  { id: 'architecture', label: 'Clean Architecture & Tests', icon: Network },
  { id: 'infra', label: 'Vercel & Supabase Cloud', icon: Server, badge: 'Vercel' }
]

const currentNavItems = computed(() => {
  return portfolioStore.activeProjectId === 'proposal-ai' ? proposalAiNavItems : rlgNavItems
})
</script>

<template>
  <aside class="w-60 lg:w-64 shrink-0 bg-[#090d16] border-r border-indigo-500/20 flex flex-col justify-between h-full overflow-y-auto text-slate-300">
    <!-- Top Branding & Navigation -->
    <div class="p-4 space-y-6">
      
      <!-- Brand Logo Header -->
      <div class="flex items-center justify-between px-2 py-1">
        
        <!-- ProposalAI Branding -->
        <div v-if="portfolioStore.activeProjectId === 'proposal-ai'" class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1px] shadow-lg shadow-teal-500/20">
            <div class="w-full h-full bg-[#090d16] rounded-xl flex items-center justify-center">
              <span class="font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                P
              </span>
            </div>
          </div>
          <div>
            <h2 class="text-base font-extrabold text-white tracking-wider flex items-center gap-1.5 leading-none">
              ProposalAI
            </h2>
            <span class="text-[10px] uppercase font-mono tracking-widest text-teal-400 block mt-1">
              ENTERPRISE B2B
            </span>
          </div>
        </div>

        <!-- RLG Shop Branding -->
        <div v-else class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 p-[1px] shadow-lg shadow-indigo-500/20">
            <div class="w-full h-full bg-[#090d16] rounded-xl flex items-center justify-center">
              <span class="font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                R
              </span>
            </div>
          </div>
          <div>
            <h2 class="text-base font-extrabold text-white tracking-wider flex items-center gap-1.5 leading-none">
              RLG SHOP
            </h2>
            <span class="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mt-1">
              PORTFOLIO
            </span>
          </div>
        </div>

        <!-- Mobile Close Button -->
        <button 
          @click="portfolioStore.closeWorkspaceSidebar"
          class="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Navigation"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Navigation links -->
      <nav class="space-y-1">
        <button
          v-for="item in currentNavItems"
          :key="item.id"
          @click="portfolioStore.setWorkspaceTab(item.id)"
          :class="[
            'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group',
            portfolioStore.activeWorkspaceTab === item.id
              ? (portfolioStore.activeProjectId === 'proposal-ai'
                  ? 'bg-gradient-to-r from-teal-600/30 to-emerald-600/20 text-white border border-teal-500/40 shadow-sm shadow-teal-500/20 font-semibold'
                  : 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white border border-indigo-500/40 shadow-sm shadow-indigo-500/20 font-semibold')
              : 'text-slate-400 hover:text-white hover:bg-[#131b2e]/60'
          ]"
        >
          <div class="flex items-center gap-3 truncate">
            <component 
              :is="item.icon" 
              :class="[
                'w-4 h-4 transition-colors shrink-0',
                portfolioStore.activeWorkspaceTab === item.id 
                  ? (portfolioStore.activeProjectId === 'proposal-ai' ? 'text-teal-400' : 'text-indigo-400')
                  : 'text-slate-500 group-hover:text-slate-300'
              ]" 
            />
            <span class="truncate">{{ item.label }}</span>
          </div>

          <!-- Optional Item Badge -->
          <span 
            v-if="item.badge"
            :class="[
              'text-[9px] px-1.5 py-0.5 rounded font-mono',
              portfolioStore.activeWorkspaceTab === item.id 
                ? (portfolioStore.activeProjectId === 'proposal-ai' ? 'bg-teal-500/30 text-teal-200 border border-teal-400/30' : 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30')
                : 'bg-slate-800 text-slate-400'
            ]"
          >
            {{ item.badge }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Bottom Actions: GitHub, Live Demo & Back -->
    <div class="p-4 border-t border-indigo-500/20 space-y-2 bg-[#090d16]">
      <a 
        :href="portfolioStore.activeProject.githubUrl || 'https://github.com'" 
        target="_blank" 
        rel="noopener noreferrer"
        class="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#131b2e] hover:bg-[#18223a] text-slate-300 hover:text-white text-xs font-medium border border-indigo-500/20 transition-colors"
      >
        <Github class="w-4 h-4" />
        <span>GitHub Repository</span>
      </a>

      <!-- Direct Live Link -->
      <a 
        v-if="portfolioStore.activeProjectId === 'proposal-ai'"
        href="https://proposal-ai.vercel.app" 
        target="_blank" 
        rel="noopener noreferrer"
        class="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-950/80 to-emerald-950/80 hover:from-teal-900/80 hover:to-emerald-900/80 text-teal-300 border border-teal-500/40 text-xs font-semibold transition-all shadow-xs"
      >
        <span>Live App (Vercel Deploy)</span>
        <ExternalLink class="w-3.5 h-3.5 opacity-80" />
      </a>
      <a 
        v-else
        href="https://rlgonlineshop.com" 
        target="_blank" 
        rel="noopener noreferrer"
        class="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 hover:from-emerald-900/80 hover:to-teal-900/80 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all shadow-xs"
      >
        <span>Live Site (rlgonlineshop.com)</span>
        <ExternalLink class="w-3.5 h-3.5 opacity-80" />
      </a>

      <!-- Back / Close to Outer Portfolio -->
      <button 
        @click="portfolioStore.closeWorkspace"
        class="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors border border-slate-800"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Exit to Main Portfolio</span>
      </button>
    </div>
  </aside>
</template>
