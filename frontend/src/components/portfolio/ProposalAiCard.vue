<script setup>
import { usePortfolioStore } from '../../stores/portfolioStore'
import { proposalAiProjectData } from '../../data/projectsData'
import { 
  ExternalLink, 
  Sparkles, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  ArrowRight, 
  Tv, 
  FileText, 
  Layers, 
  Database, 
  CreditCard,
  CheckCircle2,
  Cpu,
  Globe
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()
</script>

<template>
  <div id="project-proposal-ai" class="bento-card overflow-hidden border-teal-200/90 shadow-md hover:shadow-2xl transition-all duration-300">
    <!-- Top Bar with status & external badges -->
    <div class="px-6 py-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border-b border-teal-500/20 text-white flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center font-bold text-sm text-white shadow-sm">
          P
        </div>
        <div>
          <span class="text-xs uppercase tracking-widest text-teal-300 font-semibold">Enterprise B2B Project</span>
          <h3 class="font-bold text-white text-base sm:text-lg flex items-center gap-2">
            ProposalAI
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Production Ready
            </span>
          </h3>
        </div>
      </div>

      <!-- Live production link & host badges -->
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <a 
          href="https://proposal-ai.vercel.app" 
          target="_blank" 
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/80 text-teal-300 border border-teal-500/50 hover:bg-teal-900/80 transition-colors font-medium shadow-xs"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Vercel Deploy</span>
          <ExternalLink class="w-3.5 h-3.5 opacity-80" />
        </a>

        <span class="px-2.5 py-1 rounded-full bg-sky-950/70 text-sky-200 border border-sky-500/30 font-medium">
          Supabase pgvector
        </span>
        <span class="px-2.5 py-1 rounded-full bg-purple-950/70 text-purple-200 border border-purple-500/30 font-medium">
          Stripe & PayMongo
        </span>
      </div>
    </div>

    <!-- Main Card Body -->
    <div class="p-6 sm:p-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        <!-- Left Column: Description & Feature Matrix -->
        <div class="lg:col-span-7 space-y-6 text-left">
          <div>
            <h4 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Enterprise B2B AI Proposal Generator with Supabase RAG
            </h4>
            <p class="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              {{ proposalAiProjectData.shortSummary }}
            </p>
          </div>

          <!-- Feature Metric Pills -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Backend</span>
              <span class="font-bold text-slate-900 text-sm">Laravel 11</span>
              <span class="text-[11px] text-slate-500 block">Clean Architecture</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vector RAG</span>
              <span class="font-bold text-slate-900 text-sm">pgvector</span>
              <span class="text-[11px] text-slate-500 block">768-dim Supabase</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Models</span>
              <span class="font-bold text-slate-900 text-sm">Gemini Flash-Lite</span>
              <span class="text-[11px] text-slate-500 block">3.5 & 2.5 Pro</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monetization</span>
              <span class="font-bold text-slate-900 text-sm">Stripe / PayMongo</span>
              <span class="text-[11px] text-slate-500 block">Freemium Quotas</span>
            </div>
          </div>

          <!-- Quick Jump Workspace Action Chips -->
          <div>
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2.5">
              Direct Workspace Modules:
            </span>
            <div class="flex flex-wrap gap-2">
              <button 
                @click="portfolioStore.openProject('proposal-ai', 'overview')"
                class="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold border border-teal-200/80 flex items-center gap-1.5 transition-colors"
              >
                <Layers class="w-3.5 h-3.5" />
                <span>Overview & Dashboard</span>
              </button>
              <button 
                @click="portfolioStore.openProject('proposal-ai', 'slides')"
                class="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200/80 flex items-center gap-1.5 transition-colors"
              >
                <Tv class="w-3.5 h-3.5" />
                <span>Presentation Deck (8 Slides)</span>
              </button>
              <button 
                @click="portfolioStore.openProject('proposal-ai', 'demos')"
                class="px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs font-semibold border border-cyan-200/80 flex items-center gap-1.5 transition-colors"
              >
                <FileText class="w-3.5 h-3.5" />
                <span>Live Proposal Builder & Canvas</span>
              </button>
              <button 
                @click="portfolioStore.openProject('proposal-ai', 'ai')"
                class="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200/80 flex items-center gap-1.5 transition-colors"
              >
                <Database class="w-3.5 h-3.5" />
                <span>Supabase pgvector RAG Flow</span>
              </button>
            </div>
          </div>

          <!-- Primary Launch Button -->
          <div class="pt-2 flex flex-wrap items-center gap-3">
            <button 
              @click="portfolioStore.openProject('proposal-ai', 'overview')"
              class="px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2.5"
            >
              <Sparkles class="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Explore Architecture & Demo</span>
              <ArrowRight class="w-4 h-4" />
            </button>

            <a 
              href="https://proposal-ai.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              class="px-5 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <span>Vercel Production App</span>
              <ExternalLink class="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>

        <!-- Right Column: Interactive Light Enterprise Teaser Preview (Matching reference screenshot) -->
        <div class="lg:col-span-5">
          <div 
            @click="portfolioStore.openProject('proposal-ai', 'overview')"
            class="relative group cursor-pointer rounded-2xl overflow-hidden bg-white border border-teal-300/80 shadow-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:border-teal-500"
          >
            <!-- Glowing ambient hover effect -->
            <div class="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-2xl blur-lg opacity-15 group-hover:opacity-30 transition-opacity" />

            <!-- Clean Light Enterprise Mock Preview -->
            <div class="relative z-10 space-y-3">
              <!-- Mock Header -->
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <div class="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div class="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div class="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span class="text-[10px] text-slate-500 font-mono ml-2">proposal-ai:light</span>
                </div>
                <span class="text-[10px] text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  AI: Active 🟢
                </span>
              </div>

              <!-- Mock Title -->
              <div class="text-left">
                <span class="text-[11px] text-teal-600 font-mono">ENTERPRISE SAAS</span>
                <div class="text-slate-900 font-extrabold text-sm">ProposalAI Dashboard</div>
                <div class="text-[11px] text-slate-500">Autonomous B2B proposal drafting & pgvector RAG</div>
              </div>

              <!-- Mini cards row preview -->
              <div class="grid grid-cols-2 gap-2 text-left">
                <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span class="text-[9px] text-teal-600 font-bold uppercase block">RAG Vector</span>
                  <span class="text-xs font-bold text-slate-800 block">Supabase</span>
                  <span class="text-[10px] text-slate-500 block">PostgreSQL pgvector</span>
                </div>
                <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span class="text-[9px] text-emerald-600 font-bold uppercase block">Ledger Math</span>
                  <span class="text-xs font-bold text-slate-800 block">Real-time</span>
                  <span class="text-[10px] text-slate-500 block">Pinia calculations</span>
                </div>
              </div>

              <!-- Mini Proposal Studio Canvas Mock -->
              <div class="p-3 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 text-left relative overflow-hidden">
                <div class="text-[10px] text-teal-700 font-mono mb-1">DUAL-COLUMN STUDIO</div>
                <div class="text-xs font-semibold text-slate-800 truncate">Live Proposal Builder & Canvas</div>
                <div class="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Gemini Flash-Lite Draft Preview</span>
                  <span class="text-teal-700 font-mono font-bold">&lt; 3.2s Speed →</span>
                </div>
              </div>

              <!-- Hover overlay callout -->
              <div class="pt-1 flex items-center justify-center text-xs font-semibold text-teal-700 group-hover:text-teal-800 gap-1.5">
                <span>Launch ProposalAI Studio & Canvas</span>
                <ArrowRight class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

