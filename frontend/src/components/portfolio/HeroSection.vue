<script setup>
import { usePortfolioStore } from '../../stores/portfolioStore'
import { developerBio } from '../../data/projectsData'
import { 
  Sparkles, 
  Terminal, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  Cpu,
  Globe2
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()
</script>

<template>
  <section id="about" class="relative pt-12 pb-16 overflow-hidden">
    <!-- Animated ambient glowing blobs -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-200/50 via-purple-200/40 to-pink-100/30 blur-3xl -z-10 rounded-full pointer-events-none animate-pulse-slow" />
    <div class="absolute -top-10 right-10 w-72 h-72 bg-cyan-200/40 blur-3xl -z-10 rounded-full pointer-events-none" />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col items-center text-center max-w-4xl mx-auto">
        
        <!-- Availability status badge -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold tracking-wide shadow-xs mb-6 hover:bg-emerald-100/70 transition-colors">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {{ developerBio.availability }}
        </div>

        <!-- Main Headline -->
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
          Engineering High-Performance
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Monorepos & Multimodal AI
          </span>
          Platforms
        </h1>

        <!-- Subtitle Bio -->
        <p class="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-3xl font-normal">
          Senior Frontend Engineer & Creative UI Architect specializing in 
          <span class="font-semibold text-slate-900">Vue 3 (Composition API)</span>, 
          <span class="font-semibold text-slate-900">Laravel 11 service layer backends</span>, 
          and production-grade <span class="font-semibold text-slate-900">Gemini Vision AI automation</span>.
        </p>

        <!-- Action Buttons -->
        <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button 
            @click="portfolioStore.openWorkspace('rlg-online-shop', 'overview')"
            class="px-6 py-3.5 rounded-xl bg-slate-950 text-white font-semibold text-sm shadow-xl shadow-slate-950/20 hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2.5 group"
          >
            <Sparkles class="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Launch RLG Project Workspace</span>
            <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <a 
            href="#skills-matrix"
            class="px-6 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2"
          >
            <Terminal class="w-4 h-4 text-slate-500" />
            <span>Inspect Tech Matrix</span>
          </a>

          <a 
            href="https://rlgonlineshop.com"
            target="_blank"
            rel="noopener noreferrer"
            class="px-5 py-3.5 rounded-xl bg-indigo-50/70 text-indigo-700 font-semibold text-sm border border-indigo-200/80 hover:bg-indigo-100 transition-all flex items-center gap-2"
          >
            <Globe2 class="w-4 h-4 text-indigo-600" />
            <span>Visit rlgonlineshop.com</span>
            <ExternalLink class="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>

        <!-- Metric Cards -->
        <div class="mt-12 w-full grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div class="bg-white/90 p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all">
            <div class="flex items-center gap-2 text-indigo-600 mb-1">
              <Layers class="w-4 h-4" />
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Architecture</span>
            </div>
            <div class="text-xl sm:text-2xl font-bold text-slate-900">Laravel & Vue 3</div>
            <p class="text-xs text-slate-500 mt-0.5">Clean Service Layer Monorepo</p>
          </div>

          <div class="bg-white/90 p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all">
            <div class="flex items-center gap-2 text-purple-600 mb-1">
              <Cpu class="w-4 h-4" />
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Automation</span>
            </div>
            <div class="text-xl sm:text-2xl font-bold text-slate-900">3 Live Pipelines</div>
            <p class="text-xs text-slate-500 mt-0.5">Gemini Vision OCR, SEO & Chat</p>
          </div>

          <div class="bg-white/90 p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all">
            <div class="flex items-center gap-2 text-sky-600 mb-1">
              <Globe2 class="w-4 h-4" />
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Deployment</span>
            </div>
            <div class="text-xl sm:text-2xl font-bold text-slate-900">Railway Cloud</div>
            <p class="text-xs text-slate-500 mt-0.5">Custom Namecheap DNS</p>
          </div>

          <div class="bg-white/90 p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all">
            <div class="flex items-center gap-2 text-emerald-600 mb-1">
              <Zap class="w-4 h-4" />
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Performance</span>
            </div>
            <div class="text-xl sm:text-2xl font-bold text-slate-900">98+ Score</div>
            <p class="text-xs text-slate-500 mt-0.5">PWA & Edge CDN Optimized</p>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

