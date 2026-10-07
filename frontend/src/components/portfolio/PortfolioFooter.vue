<script setup>
import { usePortfolioStore } from '../../stores/portfolioStore'
import { Sparkles, Github, ExternalLink, Heart } from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()
</script>

<template>
  <footer class="mt-20 border-t border-slate-200/80 bg-white/60 backdrop-blur-xs py-12 text-slate-500 text-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
          R
        </div>
        <div>
          <span class="font-bold text-slate-900 text-sm">RLG Portfolio</span>
          <p class="text-[11px] text-slate-400">Senior Frontend Engineer & Creative UI Architect</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-6">
        <button 
          @click="portfolioStore.openWorkspace('rlg-online-shop', 'overview')" 
          class="hover:text-indigo-600 transition-colors font-medium"
        >
          RLG Online Shop Workspace
        </button>
        <a 
          href="https://rlgonlineshop.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="hover:text-indigo-600 transition-colors font-medium flex items-center gap-1"
        >
          <span>Production Shop</span>
          <ExternalLink class="w-3 h-3" />
        </a>
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="hover:text-indigo-600 transition-colors font-medium flex items-center gap-1"
        >
          <span>GitHub</span>
          <Github class="w-3 h-3" />
        </a>
      </div>

      <div class="text-[11px] text-slate-400">
        © 2026 RLG. Crafted with Vue 3, Tailwind CSS & Vite.
      </div>
    </div>
  </footer>
</template>

