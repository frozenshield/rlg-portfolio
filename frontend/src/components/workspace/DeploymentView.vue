<script setup>
import { computed } from 'vue'
import { usePortfolioStore } from '../../stores/portfolioStore'
import { 
  Server, 
  Globe2, 
  CheckCircle2, 
  ExternalLink, 
  Radio, 
  Terminal, 
  ShieldCheck, 
  Layers, 
  Zap, 
  ArrowRight, 
  Cpu,
  Database,
  CreditCard
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()
const isProposalAi = computed(() => portfolioStore.activeProjectId === 'proposal-ai')
</script>

<template>
  <div class="space-y-6 text-left">
    
    <!-- ================= PROPOSALAI DEPLOYMENT TOPOLOGY ================= -->
    <template v-if="isProposalAi">
      <!-- Header -->
      <div class="p-6 rounded-2xl bg-white border border-teal-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-mono font-medium mb-2">
            <Radio class="w-3.5 h-3.5 animate-pulse text-emerald-500" />
            <span>Vercel Edge Cloud & Supabase: Production Ready</span>
          </div>
          <h3 class="text-xl sm:text-2xl font-extrabold text-slate-900">Vercel Serverless & Supabase pgvector Architecture</h3>
          <p class="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Modern serverless B2B architecture combining Vercel's global edge network with Supabase PostgreSQL 17 vector storage and dual payment rails (Stripe + PayMongo).
          </p>
        </div>

        <a 
          href="https://proposal-ai.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-600/25 transition-all shrink-0"
        >
          <span>Vercel Deployment</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </a>
      </div>

      <!-- 2 Column Topology Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Vercel Edge Architecture -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div class="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Globe2 class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-base">Vercel Edge Platform</h4>
              <span class="text-xs text-slate-400">Serverless Functions & Instant Global CDN</span>
            </div>
          </div>

          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span class="font-bold text-slate-800">Edge Middleware</span>
                <p class="text-slate-500 text-[11px]">Tenant quota validation and authentication token gate</p>
              </div>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-teal-50 text-teal-700 border border-teal-200 font-bold">&lt; 12ms</span>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span class="font-bold text-slate-800">Serverless Generation Function</span>
                <p class="text-slate-500 text-[11px]">Gemini Flash-Lite API gateway with streaming SSE response</p>
              </div>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">Node 20.x</span>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span class="font-bold text-slate-800">Automated Git Rollouts</span>
                <p class="text-slate-500 text-[11px]">Instant preview environments on pull request creation</p>
              </div>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700 font-bold">Zero Downtime</span>
            </div>
          </div>
        </div>

        <!-- Supabase Database & Payment Rails -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div class="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Database class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-base">Supabase & Payment Infrastructure</h4>
              <span class="text-xs text-slate-400">PostgreSQL 17, pgvector & Webhook Gateway</span>
            </div>
          </div>

          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span class="font-bold text-slate-800">PostgreSQL 17 + pgvector</span>
                <p class="text-slate-500 text-[11px]">768-dim HNSW vector cosine similarity table `won_pitches`</p>
              </div>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-sky-50 text-sky-700 border border-sky-200 font-bold">Managed Cloud</span>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span class="font-bold text-slate-800">Stripe Cashier & PayMongo</span>
                <p class="text-slate-500 text-[11px]">Global credit cards + Southeast Asian eWallets (GCash, Maya)</p>
              </div>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">Idempotent</span>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span class="font-bold text-slate-800">Row Level Security (RLS)</span>
                <p class="text-slate-500 text-[11px]">Multi-tenant isolation verified by automated policy test suite</p>
              </div>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">Enforced</span>
            </div>
          </div>
        </div>

      </div>
    </template>

    <!-- ================= RLG ONLINE SHOP DEPLOYMENT TOPOLOGY ================= -->
    <template v-else>
      <!-- Header -->
      <div class="p-6 rounded-2xl bg-[#0f172a] border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium mb-2">
            <Radio class="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Production Infrastructure: 99.98% Healthy</span>
          </div>
          <h3 class="text-xl sm:text-2xl font-extrabold text-white">Railway Cloud Platform & Namecheap DNS Routing</h3>
          <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Multi-service container runtime deployed with automated GitHub CI/CD webhooks, Redis job queues, and apex domain DNS orchestration for <code class="text-indigo-400 font-mono">rlgonlineshop.com</code>.
          </p>
        </div>

        <a 
          href="https://rlgonlineshop.com"
          target="_blank"
          rel="noopener noreferrer"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all shrink-0"
        >
          <span>Inspect Live Production</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </a>
      </div>

      <!-- 2 Column Topology Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Railway Container Architecture -->
        <div class="p-6 rounded-2xl bg-[#131b2e] border border-indigo-500/20 space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-indigo-500/20">
            <div class="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Server class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-white text-base">Railway Cloud Services</h4>
              <span class="text-xs text-slate-400">Automated Nixpack Multi-Container Environment</span>
            </div>
          </div>

          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 flex items-center justify-between">
              <div>
                <span class="font-bold text-white">Service 1: Laravel Web & REST API</span>
                <p class="text-slate-400 text-[11px]">Nixpack container, PHP 8.3-FPM + Nginx</p>
              </div>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">Healthy</span>
            </div>

            <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 flex items-center justify-between">
              <div>
                <span class="font-bold text-white">Service 2: MySQL 8.0 Database</span>
                <p class="text-slate-400 text-[11px]">Managed volume with daily snapshots</p>
              </div>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">Persistent</span>
            </div>

            <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 flex items-center justify-between">
              <div>
                <span class="font-bold text-white">Service 3: Redis In-Memory Worker</span>
                <p class="text-slate-400 text-[11px]">Asynchronous queue worker for AI jobs</p>
              </div>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-purple-950 text-purple-400 border border-purple-500/30">Active</span>
            </div>
          </div>
        </div>

        <!-- Namecheap DNS & Edge Routing -->
        <div class="p-6 rounded-2xl bg-[#131b2e] border border-indigo-500/20 space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-indigo-500/20">
            <div class="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Globe2 class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-white text-base">Namecheap DNS Configuration</h4>
              <span class="text-xs text-slate-400">Zone File Records for rlgonlineshop.com</span>
            </div>
          </div>

          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 flex items-center justify-between">
              <div>
                <span class="font-bold text-white">Apex A-Record (@)</span>
                <p class="text-slate-400 text-[11px]">Points directly to Railway edge gateway</p>
              </div>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300">TTL 300</span>
            </div>

            <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 flex items-center justify-between">
              <div>
                <span class="font-bold text-white">CNAME Record (www)</span>
                <p class="text-slate-400 text-[11px]">Proxies www alias to rlgonlineshop.com</p>
              </div>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300">Active</span>
            </div>

            <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 flex items-center justify-between">
              <div>
                <span class="font-bold text-white">Edge SSL / Let's Encrypt TLS</span>
                <p class="text-slate-400 text-[11px]">Automated 90-day certificate rotation</p>
              </div>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">Auto TLS</span>
            </div>
          </div>
        </div>

      </div>
    </template>

  </div>
</template>
