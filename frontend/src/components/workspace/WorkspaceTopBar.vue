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
  Menu
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
      <span class="text-slate-400 hidden sm:inline">RLG Shop</span>
      <ChevronRight class="w-3 h-3 text-slate-600 hidden sm:inline" />
      <span class="text-white font-semibold flex items-center gap-1.5">
        {{ tabDisplayNames[portfolioStore.activeWorkspaceTab] || 'Overview' }}
      </span>
    </div>

    <!-- Center: Global Search Bar -->
    <div class="hidden md:flex items-center flex-1 max-w-xs mx-4">
      <div class="relative w-full">
        <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          v-model="portfolioStore.searchQuery"
          type="text" 
          placeholder="Search components, AI logs, API..." 
          class="w-full bg-[#131b2e]/90 border border-indigo-500/20 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
        />
      </div>
    </div>

    <!-- Right: Badges, Status Pills & Profile -->
    <div class="flex items-center gap-2 sm:gap-3">
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

      <!-- AI Services Live Pill matching reference image -->
      <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0d2218] border border-emerald-500/40 text-emerald-300 text-xs font-medium">
        <span>AI Services: Online</span>
        <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse"></span>
      </div>

      <!-- Presenter Profile Avatar -->
      <div class="flex items-center gap-2 pl-2 border-l border-indigo-500/20">
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-sm">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" 
            alt="Lead UI Architect" 
            class="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  </header>
</template>

