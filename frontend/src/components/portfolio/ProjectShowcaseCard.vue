<script setup>
import { usePortfolioStore } from '../../stores/portfolioStore'
import { rlgProjectData } from '../../data/projectsData'
import { 
  ExternalLink, 
  Sparkles, 
  Layers, 
  Cpu, 
  Smartphone, 
  ShieldCheck, 
  ArrowRight,
  Tv,
  Store,
  Terminal,
  Server,
  Scan
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()
</script>

<template>
  <div id="project-rlg" class="bento-card overflow-hidden border-indigo-200/90 shadow-md hover:shadow-2xl transition-all duration-300">
    <!-- Top Bar with status & external badges -->
    <div class="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-500/20 text-white flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm shadow-sm">
          R
        </div>
        <div>
          <span class="text-xs uppercase tracking-widest text-indigo-300 font-semibold">Flagship Project</span>
          <h3 class="font-bold text-white text-base sm:text-lg flex items-center gap-2">
            RLG Online Shop
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Live in Production
            </span>
          </h3>
        </div>
      </div>

      <!-- Live production link & host badges -->
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <a 
          href="https://rlgonlineshop.com" 
          target="_blank" 
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900/80 transition-colors font-medium shadow-xs"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Production: rlgonlineshop.com</span>
          <ExternalLink class="w-3.5 h-3.5 opacity-80" />
        </a>

        <span class="px-2.5 py-1 rounded-full bg-indigo-900/60 text-indigo-200 border border-indigo-500/30 font-medium">
          Railway Deployed
        </span>
        <span class="px-2.5 py-1 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/30 font-medium">
          Namecheap DNS
        </span>
      </div>
    </div>

    <!-- Main Card Body -->
    <div class="p-6 sm:p-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        <!-- Left Column: Description & Feature Matrix -->
        <div class="lg:col-span-7 space-y-6">
          <div>
            <h4 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Full-Stack Monorepo Featuring Multimodal AI Automation
            </h4>
            <p class="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              {{ rlgProjectData.shortSummary }}
            </p>
          </div>

          <!-- Feature Metric Pills -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Backend</span>
              <span class="font-bold text-slate-900 text-sm">Laravel 11</span>
              <span class="text-[11px] text-slate-500 block">Service Layer</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Frontend</span>
              <span class="font-bold text-slate-900 text-sm">Vue 3 + Pinia</span>
              <span class="text-[11px] text-slate-500 block">Inertia.js SPA</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Engine</span>
              <span class="font-bold text-slate-900 text-sm">Gemini Vision</span>
              <span class="text-[11px] text-slate-500 block">Card OCR + SEO</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Infra</span>
              <span class="font-bold text-slate-900 text-sm">Railway Cloud</span>
              <span class="text-[11px] text-slate-500 block">Custom Apex DNS</span>
            </div>
          </div>

          <!-- Quick Jump Workspace Action Chips -->
          <div>
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2.5">
              Direct Workspace Modules:
            </span>
            <div class="flex flex-wrap gap-2">
              <button 
                @click="portfolioStore.openWorkspace('rlg-online-shop', 'overview')"
                class="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200/80 flex items-center gap-1.5 transition-colors"
              >
                <Layers class="w-3.5 h-3.5" />
                <span>Overview & Metrics</span>
              </button>
              <button 
                @click="portfolioStore.openWorkspace('rlg-online-shop', 'slides')"
                class="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200/80 flex items-center gap-1.5 transition-colors"
              >
                <Tv class="w-3.5 h-3.5" />
                <span>Presentation Deck (8 Slides)</span>
              </button>
              <button 
                @click="portfolioStore.openWorkspace('rlg-online-shop', 'demos')"
                class="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200/80 flex items-center gap-1.5 transition-colors"
              >
                <Store class="w-3.5 h-3.5" />
                <span>Admin & Storefront Demos</span>
              </button>
              <button 
                @click="portfolioStore.openWorkspace('rlg-online-shop', 'ai')"
                class="px-3 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold border border-pink-200/80 flex items-center gap-1.5 transition-colors"
              >
                <Scan class="w-3.5 h-3.5" />
                <span>AI Vision OCR Deep Dive</span>
              </button>
            </div>
          </div>

          <!-- Primary Launch Button -->
          <div class="pt-2 flex flex-wrap items-center gap-3">
            <button 
              @click="portfolioStore.openWorkspace('rlg-online-shop', 'overview')"
              class="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2.5"
            >
              <Sparkles class="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Explore RLG Online Shop Workspace</span>
              <ArrowRight class="w-4 h-4" />
            </button>

            <a 
              href="https://rlgonlineshop.com"
              target="_blank"
              rel="noopener noreferrer"
              class="px-5 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <span>Direct Live Store</span>
              <ExternalLink class="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>

        <!-- Right Column: Interactive Dark Workspace Teaser Preview -->
        <div class="lg:col-span-5">
          <div 
            @click="portfolioStore.openWorkspace('rlg-online-shop', 'overview')"
            class="relative group cursor-pointer rounded-2xl overflow-hidden bg-[#090d16] border border-indigo-500/30 shadow-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:border-indigo-400/60"
          >
            <!-- Glowing ambient hover effect -->
            <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />

            <!-- Dark mock workspace card -->
            <div class="relative z-10 space-y-3">
              <!-- Mock Header -->
              <div class="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                <div class="flex items-center gap-2">
                  <div class="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div class="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span class="text-[10px] text-slate-400 font-mono ml-2">rlg-workspace:dark</span>
                </div>
                <span class="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  AI: Online 🟢
                </span>
              </div>

              <!-- Mock Title -->
              <div class="text-left">
                <span class="text-[11px] text-indigo-400 font-mono">WORKSPACE SHELL</span>
                <div class="text-white font-bold text-sm">RLG Online Shop Dashboard</div>
                <div class="text-[11px] text-slate-400">Full-stack monorepo featuring multimodal AI</div>
              </div>

              <!-- Mini cards row preview -->
              <div class="grid grid-cols-2 gap-2 text-left">
                <div class="p-2.5 rounded-lg bg-[#131b2e] border border-indigo-500/20">
                  <span class="text-[9px] text-indigo-300 font-bold uppercase block">Architecture</span>
                  <span class="text-xs font-bold text-white block">Laravel 11</span>
                  <span class="text-[10px] text-slate-400 block">Vue 3 + Inertia</span>
                </div>
                <div class="p-2.5 rounded-lg bg-[#131b2e] border border-indigo-500/20">
                  <span class="text-[9px] text-purple-300 font-bold uppercase block">AI Pipeline</span>
                  <span class="text-xs font-bold text-white block">3 Active Engines</span>
                  <span class="text-[10px] text-slate-400 block">Vision, SEO, Chat</span>
                </div>
              </div>

              <!-- Mini Slide Deck Preview Mock -->
              <div class="p-3 rounded-xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 text-left relative overflow-hidden">
                <div class="text-[10px] text-indigo-300 font-mono mb-1">NOTEBOOKLM SLIDES</div>
                <div class="text-xs font-semibold text-white truncate">Slide 1: Executive Overview & Product Architecture</div>
                <div class="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Interactive Deck & Talk Tracks</span>
                  <span class="text-indigo-400 font-mono font-bold">Slide 1 of 8 →</span>
                </div>
              </div>

              <!-- Hover overlay callout -->
              <div class="pt-1 flex items-center justify-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 gap-1.5">
                <span>Click to launch full interactive dashboard</span>
                <ArrowRight class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

