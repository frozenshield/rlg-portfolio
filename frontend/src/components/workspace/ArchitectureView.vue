<script setup>
import { computed } from 'vue'
import { usePortfolioStore } from '../../stores/portfolioStore'
import { 
  Network, 
  GitFork, 
  Layers, 
  CheckCircle2, 
  Workflow, 
  ShieldCheck, 
  Terminal, 
  Code2, 
  Cpu, 
  ArrowRight,
  Database,
  FileCheck
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()
const isProposalAi = computed(() => portfolioStore.activeProjectId === 'proposal-ai')
</script>

<template>
  <div class="space-y-6 text-left">
    
    <!-- ================= PROPOSALAI ARCHITECTURE ================= -->
    <template v-if="isProposalAi">
      <!-- Header -->
      <div class="p-6 rounded-2xl bg-white border border-teal-200/90 shadow-sm">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-mono font-medium mb-2">
          <Network class="w-3.5 h-3.5 text-teal-600" />
          <span>Clean Architecture & Testing Strategy</span>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-900">Domain Services, Form Requests & Vitest/Pest Verification</h3>
        <p class="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          Engineered for strict separation of concerns: mathematical precision handled deterministically by Pinia and Laravel, whilst creative narrative is delegated to Gemini and grounded via pgvector.
        </p>
      </div>

      <!-- Architecture Pillars -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Backend Clean Architecture -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div class="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Layers class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-base">Backend: Laravel 11 Domain Services</h4>
              <span class="text-xs text-slate-400">Isolated Business Logic & Middleware Quotas</span>
            </div>
          </div>

          <div class="space-y-3 text-xs text-slate-600">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span class="font-bold text-teal-800">1. Strict Form Requests</span>
              <p class="text-slate-500 text-[11px]">Validates CRM dossier inputs, deliverable quantity arrays, and 1,000 char prompt directives before hitting any business logic.</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span class="font-bold text-teal-800">2. GenerateProposalService & PgVectorSearchService</span>
              <p class="text-slate-500 text-[11px]">Queries Supabase PostgreSQL via HNSW cosine distance, hydrates context, and invokes Gemini Flash-Lite with schema contracts.</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span class="font-bold text-teal-800">3. Stripe & PayMongo Quota Middleware</span>
              <p class="text-slate-500 text-[11px]">Enforces free tier limits (5 proposals/month) with atomic database counters and 402 Payment Required interception.</p>
            </div>
          </div>
        </div>

        <!-- Testing & Quality Assurance -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div class="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <FileCheck class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-slate-900 text-base">Testing Suite: 15 Tests / 70 Assertions</h4>
              <span class="text-xs text-slate-400">Pest PHP & Vitest Automated Pipeline</span>
            </div>
          </div>

          <div class="space-y-3 text-xs text-slate-600">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span class="font-bold text-emerald-800">1. Financial Ledger Unit Tests (Vitest)</span>
              <p class="text-slate-500 text-[11px]">Verifies rounding precision, volume discount tiers, and 12% VAT calculations down to exact cent bounds.</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span class="font-bold text-emerald-800">2. RAG Cosine Fallback Tests (Pest)</span>
              <p class="text-slate-500 text-[11px]">Ensures that when vector similarity returns zero matches, the generator falls back gracefully to industry prompt templates.</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span class="font-bold text-emerald-800">3. Playwright E2E Integration</span>
              <p class="text-slate-500 text-[11px]">Full client flow: preset selection ➔ Gemini generation ➔ invoice inspection ➔ Mark as Won vectorization.</p>
            </div>
          </div>
        </div>

      </div>
    </template>

    <!-- ================= RLG ONLINE SHOP ARCHITECTURE ================= -->
    <template v-else>
      <!-- Header -->
      <div class="p-6 rounded-2xl bg-[#0f172a] border border-indigo-500/30">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-medium mb-2">
          <Network class="w-3.5 h-3.5 text-indigo-400" />
          <span>Monorepo Architecture & Code Quality</span>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-white">Full-Stack Design Patterns & Agentic Workflows</h3>
        <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Structured according to enterprise separation of concerns, strict type-safety across PHP 8.3 & TypeScript, and accelerated by Google Antigravity & Google Jules workflows.
        </p>
      </div>

      <!-- Architecture Pillars -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Backend Layer -->
        <div class="p-6 rounded-2xl bg-[#131b2e] border border-indigo-500/20 space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-indigo-500/20">
            <div class="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Layers class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-white text-base">Backend: Laravel 11 Service Layer</h4>
              <span class="text-xs text-slate-400">Decoupled from HTTP Controllers</span>
            </div>
          </div>

          <div class="space-y-3 text-xs text-slate-300">
            <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-1">
              <span class="font-bold text-rose-300">1. Form Requests Validation</span>
              <p class="text-slate-400 text-[11px]">Strict input sanitization before hitting business layers. Zero dirty data permitted.</p>
            </div>
            <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-1">
              <span class="font-bold text-rose-300">2. Service Layer Orchestration</span>
              <p class="text-slate-400 text-[11px]"><code class="text-indigo-300">ProductIntakeService</code> and <code class="text-indigo-300">GeminiVisionService</code> contain isolated transactional logic with idempotency keys.</p>
            </div>
            <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-1">
              <span class="font-bold text-rose-300">3. Inertia.js Seamless Monolith</span>
              <p class="text-slate-400 text-[11px]">Shared server-driven props without needing separate Swagger synchronizers or duplicated client routes.</p>
            </div>
          </div>
        </div>

        <!-- Autonomous Agentic DevOps -->
        <div class="p-6 rounded-2xl bg-[#131b2e] border border-indigo-500/20 space-y-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-indigo-500/20">
            <div class="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Workflow class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-white text-base">Autonomous Tooling: Antigravity & Jules</h4>
              <span class="text-xs text-slate-400">Multi-Agent Development Pipeline</span>
            </div>
          </div>

          <div class="space-y-3 text-xs text-slate-300">
            <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-1">
              <span class="font-bold text-amber-300">1. Google Antigravity Agent Swarms</span>
              <p class="text-slate-400 text-[11px]">Scaffolds components, generates Vitest assertions, and executes complex refactor plans in parallel.</p>
            </div>
            <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-1">
              <span class="font-bold text-amber-300">2. Google Jules Asynchronous PR Audits</span>
              <p class="text-slate-400 text-[11px]">Autonomous PR reviewer running regression checks, security audits, and type verification prior to merge.</p>
            </div>
            <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-1">
              <span class="font-bold text-amber-300">3. Playwright E2E Automated Regressions</span>
              <p class="text-slate-400 text-[11px]">Validates checkout funnels across multi-device emulators to guarantee 0 checkout drops.</p>
            </div>
          </div>
        </div>

      </div>
    </template>

  </div>
</template>
