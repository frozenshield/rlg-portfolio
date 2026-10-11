<script setup>
import { usePortfolioStore } from '../../stores/portfolioStore'
import { 
  Search, 
  ExternalLink, 
  Radio, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Menu,
  Database,
  Layers
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()

const tabDisplayNames = {
  overview: 'Overview & Metrics',
  slides: 'Presentation Deck (NotebookLM)',
  demos: 'Interactive Live Demos',
  infra: 'Infrastructure & Deployment',
  tech: 'Tech Stack & Tooling',
  ai: 'AI Pipelines Deep Dive',
  architecture: 'Architecture & Code Quality'
}
</script>

<template>
  <header class="h-16 px-3 sm:px-6 border-b border-indigo-500/20 bg-[#090d16]/90 backdrop-blur-md flex items-center justify-between gap-3 sticky top-0 z-30 shrink-0">
    <!-- Left: Breadcrumb Navigation + Mobile Sidebar Toggle -->
    <div class="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-400">
      <!-- Mobile sidebar toggle -->
      <button 
        @click="portfolioStore.toggleWorkspaceSidebar"
        class="md:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        title="Toggle Workspace Menu"
      >
        <Menu class="w-4 h-4" />
      </button>

      <button 
        @click="portfolioStore.closeWorkspace" 
        class="hover:text-indigo-400 transition-colors flex items-center gap-1 font-medium text-slate-300"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Main Portfolio</span>
      </button>
      <ChevronRight class="w-3 h-3 text-slate-600" />
      <span class="text-slate-400 hidden sm:inline font-medium">
        {{ portfolioStore.activeProjectId === 'proposal-ai' ? 'ProposalAI' : 'RLG Shop' }}
      </span>
      <ChevronRight class="w-3 h-3 text-slate-600 hidden sm:inline" />
      <span class="text-white font-semibold flex items-center gap-1.5">
        {{ tabDisplayNames[portfolioStore.activeWorkspaceTab] || 'Overview' }}
      </span>
    </div>

    <!-- Center: Project Switcher Pill & Search -->
    <div class="hidden md:flex items-center gap-3 flex-1 max-w-md mx-2">
      <!-- Project Switcher Segmented Control -->
      <div class="flex items-center bg-[#131b2e] border border-slate-700/60 rounded-xl p-0.5 shadow-xs shrink-0">
        <button 
          @click="portfolioStore.switchProject('rlg-online-shop')"
          :class="[
            'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
            portfolioStore.activeProjectId === 'rlg-online-shop' 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'text-slate-400 hover:text-white'
          ]"
        >
          <span>RLG Shop</span>
        </button>

        <button 
          @click="portfolioStore.switchProject('proposal-ai')"
          :class="[
            'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
            portfolioStore.activeProjectId === 'proposal-ai' 
              ? 'bg-teal-600 text-white shadow-xs' 
              : 'text-slate-400 hover:text-white'
          ]"
        >
          <Sparkles class="w-3 h-3 text-amber-300" />
          <span>ProposalAI</span>
        </button>
      </div>

      <!-- Global Search Bar -->
      <div class="relative w-full">
        <Search class="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          v-model="portfolioStore.searchQuery"
          type="text" 
          placeholder="Search modules, slides, code..." 
          class="w-full bg-[#131b2e]/90 border border-indigo-500/20 rounded-full pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
        />
      </div>
    </div>

    <!-- Right: Badges, Status Pills & Profile -->
    <div class="flex items-center gap-2 sm:gap-3">
      
      <!-- ================= RLG PROJECT BADGES ================= -->
      <template v-if="portfolioStore.activeProjectId === 'rlg-online-shop'">
        <!-- Live Production URL button -->
        <a 
          href="https://rlgonlineshop.com"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-medium hover:bg-emerald-900/80 transition-colors"
          title="Direct link to production shop"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Production: rlgonlineshop.com</span>
          <ExternalLink class="w-3 h-3 opacity-70" />
        </a>

        <!-- Railway Badge -->
        <span class="hidden xl:inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium">
          Railway Deployed
        </span>

        <!-- AI Services Live Pill -->
        <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0d2218] border border-emerald-500/40 text-emerald-300 text-xs font-medium">
          <span>AI Services: Online</span>
          <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse"></span>
        </div>
      </template>

      <!-- ================= PROPOSALAI PROJECT BADGES ================= -->
      <template v-else>
        <!-- Vercel Deploy URL button -->
        <a 
          href="https://proposal-ai.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          class="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/70 border border-teal-500/40 text-teal-300 text-xs font-medium hover:bg-teal-900/80 transition-colors"
          title="Vercel Edge Cloud Deployment"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Vercel Edge Deploy</span>
          <ExternalLink class="w-3 h-3 opacity-70" />
        </a>

        <!-- Supabase pgvector Badge -->
        <span class="hidden xl:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-950/60 border border-sky-500/30 text-sky-300 text-[11px] font-medium">
          <Database class="w-3 h-3 text-sky-400" />
          <span>pgvector: Connected</span>
        </span>

        <!-- AI Services Active Pill (matching reference image) -->
        <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0d2218] border border-emerald-500/40 text-emerald-300 text-xs font-medium">
          <span>AI Services Active</span>
          <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse"></span>
        </div>
      </template>

      <!-- Presenter Profile Avatar (matching reference image) -->
      <div class="flex items-center gap-2 pl-2 border-l border-slate-700/60">
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 border border-teal-400/40 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-sm">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" 
            alt="Lead Architect" 
            class="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  </header>
</template>
