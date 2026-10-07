<script setup>
import { usePortfolioStore } from '../../stores/portfolioStore'
import { Sparkles, ArrowRight, Github, ExternalLink } from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-slate-200/80 transition-all">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Brand Logo -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
          <span class="text-xl tracking-tighter">R</span>
        </div>
        <div>
          <span class="font-bold text-slate-900 tracking-tight text-base sm:text-lg flex items-center gap-1.5">
            RLG Architect
            <span class="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Senior UI / AI
            </span>
          </span>
          <p class="text-[11px] text-slate-500 hidden sm:block">Frontend Engineer & Full-Stack Monorepo Architect</p>
        </div>
      </div>

      <!-- Navigation links -->
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <button @click="scrollTo('about')" class="hover:text-indigo-600 transition-colors">About</button>
        <button @click="scrollTo('project-rlg')" class="hover:text-indigo-600 transition-colors">RLG Project</button>
        <button @click="scrollTo('skills-matrix')" class="hover:text-indigo-600 transition-colors">Tech Matrix</button>
        <button @click="scrollTo('architecture')" class="hover:text-indigo-600 transition-colors">Architecture</button>
        <button @click="scrollTo('contact')" class="hover:text-indigo-600 transition-colors">Contact</button>
      </nav>

      <!-- Action buttons -->
      <div class="flex items-center gap-2 sm:gap-3">
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noopener noreferrer"
          class="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="GitHub Profile"
        >
          <Github class="w-5 h-5" />
        </a>

        <!-- Launch Project Workspace Primary Button -->
        <button 
          @click="portfolioStore.openWorkspace('rlg-online-shop', 'overview')"
          class="relative group overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
        >
          <span class="relative z-10 flex items-center gap-1.5">
            <Sparkles class="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Launch RLG Workspace</span>
            <ArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
          <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </div>
    </div>
  </header>
</template>

