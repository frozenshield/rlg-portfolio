<script setup>
import { computed } from 'vue'
import { usePortfolioStore } from '../../stores/portfolioStore'
import { 
  Cpu, 
  Scan, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  FileCode2, 
  Layers, 
  ArrowRight, 
  Database, 
  ShieldCheck,
  Zap,
  TrendingUp,
  RefreshCw
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()
const isProposalAi = computed(() => portfolioStore.activeProjectId === 'proposal-ai')
</script>

<template>
  <div class="space-y-6 text-left">
    
    <!-- ================= PROPOSALAI AI PIPELINES ================= -->
    <template v-if="isProposalAi">
      <!-- Header -->
      <div class="p-6 rounded-2xl bg-white border border-teal-200/90 shadow-sm">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-mono font-medium mb-2">
          <Sparkles class="w-3.5 h-3.5 text-amber-500" />
          <span>Gemini Flash-Lite & Supabase pgvector Architecture</span>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-900">Three Autonomous B2B AI Engines</h3>
        <p class="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          How ProposalAI combines Google Gemini Flash-Lite with Supabase PostgreSQL pgvector HNSW indexing to synthesize high-converting commercial proposals in &lt; 3.2s.
        </p>
      </div>

      <!-- 3 Engines Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Engine 1: Supabase pgvector RAG -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div class="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Database class="w-5 h-5" />
              </div>
              <div>
                <span class="text-[10px] font-mono text-teal-600 uppercase font-bold">Engine 01</span>
                <h4 class="font-bold text-slate-900 text-base">pgvector RAG Retrieval</h4>
              </div>
            </div>

            <p class="text-xs text-slate-600 mt-3 leading-relaxed">
              Extracts high-dimensional embeddings to perform sub-15ms cosine similarity matching over historical winning enterprise bids.
            </p>

            <div class="mt-4 space-y-2 text-xs text-slate-600">
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>768-dimensional HNSW index in Supabase PostgreSQL 17.</span>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>Top-3 historically won proposals injected into prompt context.</span>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>Row Level Security (RLS) ensures strict tenant data isolation.</span>
              </div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-teal-50/60 border border-teal-200/60 font-mono text-[11px] text-teal-800 flex justify-between">
            <span>Query Latency: &lt; 15ms</span>
            <span>Index: HNSW m=16</span>
          </div>
        </div>

        <!-- Engine 2: Gemini Flash-Lite Drafting -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div class="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Zap class="w-5 h-5" />
              </div>
              <div>
                <span class="text-[10px] font-mono text-emerald-600 uppercase font-bold">Engine 02</span>
                <h4 class="font-bold text-slate-900 text-base">Flash-Lite Proposal Drafter</h4>
              </div>
            </div>

            <p class="text-xs text-slate-600 mt-3 leading-relaxed">
              Fast streaming model generating executive summaries, milestones, and deliverable catalogs with strict JSON Schema output.
            </p>

            <div class="mt-4 space-y-2 text-xs text-slate-600">
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Deterministic JSON mode prevents markdown parsing errors.</span>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Sub-3.2s generation speed across full multi-page commercial scope.</span>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Strict separation: narrative from LLM, ledger math from Pinia.</span>
              </div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 font-mono text-[11px] text-emerald-800 flex justify-between">
            <span>Speed: &lt; 3.2s</span>
            <span>Cost: $0.0003/run</span>
          </div>
        </div>

        <!-- Engine 3: Self-Improving Flywheel -->
        <div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div class="p-2 rounded-xl bg-purple-50 text-purple-600">
                <TrendingUp class="w-5 h-5" />
              </div>
              <div>
                <span class="text-[10px] font-mono text-purple-600 uppercase font-bold">Engine 03</span>
                <h4 class="font-bold text-slate-900 text-base">Self-Improving Flywheel</h4>
              </div>
            </div>

            <p class="text-xs text-slate-600 mt-3 leading-relaxed">
              Automated feedback loop that extracts successful closing arguments and vectorizes signed contracts into the knowledge corpus.
            </p>

            <div class="mt-4 space-y-2 text-xs text-slate-600">
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <span>One-click 'Mark as Won' vectorization via gemini-embedding-2.</span>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <span>Extracts winning price points, discount thresholds & pitch terms.</span>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <span>System becomes smarter and higher-converting with every closed deal.</span>
              </div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-purple-50/60 border border-purple-200/60 font-mono text-[11px] text-purple-800 flex justify-between">
            <span>Model: embedding-2</span>
            <span>Flywheel: Real-Time</span>
          </div>
        </div>

      </div>
    </template>

    <!-- ================= RLG ONLINE SHOP AI PIPELINES ================= -->
    <template v-else>
      <!-- Header -->
      <div class="p-6 rounded-2xl bg-[#0f172a] border border-indigo-500/30">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-medium mb-2">
          <Sparkles class="w-3.5 h-3.5 text-amber-300" />
          <span>Gemini 2.5 Multimodal Architecture</span>
        </div>
        <h3 class="text-xl sm:text-2xl font-extrabold text-white">Three Autonomous Production AI Engines</h3>
        <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          How RLG Online Shop leverages the Gemini API to streamline high-value collectible trading card intake, programmatic search indexing, and real-time buyer conversion.
        </p>
      </div>

      <!-- 3 Engines Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Engine 1: Vision OCR -->
        <div class="p-6 rounded-2xl bg-[#131b2e] border border-indigo-500/20 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center gap-2.5 pb-3 border-b border-indigo-500/20">
              <div class="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Scan class="w-5 h-5" />
              </div>
              <div>
                <span class="text-[10px] font-mono text-purple-300 uppercase">Engine 01</span>
                <h4 class="font-bold text-white text-base">Multimodal Vision OCR</h4>
              </div>
            </div>

            <p class="text-xs text-slate-300 mt-3 leading-relaxed">
              Accepts raw high-resolution photos of Japanese Pokémon, One Piece, and Yu-Gi-Oh! cards directly from mobile cameras.
            </p>

            <div class="mt-4 space-y-2 text-xs text-slate-300">
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>Extracts cryptic serial numbers (e.g. 212/S-P) & Kanji expansion names.</span>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>Assesses optical 50/50 centering and surface foil scratches for PSA grade estimation.</span>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>Strict JSON Schema validation guarantees 100% database schema conformity.</span>
              </div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 font-mono text-[11px] text-purple-300 flex justify-between">
            <span>Speed: 1.2s</span>
            <span>Precision: 99.8%</span>
          </div>
        </div>

        <!-- Engine 2: Auto SEO -->
        <div class="p-6 rounded-2xl bg-[#131b2e] border border-indigo-500/20 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center gap-2.5 pb-3 border-b border-indigo-500/20">
              <div class="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <FileCode2 class="w-5 h-5" />
              </div>
              <div>
                <span class="text-[10px] font-mono text-indigo-300 uppercase">Engine 02</span>
                <h4 class="font-bold text-white text-base">Automated SEO & Schemas</h4>
              </div>
            </div>

            <p class="text-xs text-slate-300 mt-3 leading-relaxed">
              Eliminates hours of manual copy engineering by algorithmically synthesizing rich metadata for search engines.
            </p>

            <div class="mt-4 space-y-2 text-xs text-slate-300">
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Generates high-intent long-tail titles targeting competitive Google collector keywords.</span>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Constructs valid schema.org/Product JSON-LD snippets for Google rich snippets.</span>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Automates URL slug deduplication and canonical OpenGraph meta tags.</span>
              </div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 font-mono text-[11px] text-indigo-300 flex justify-between">
            <span>Output: JSON-LD</span>
            <span>Google Snip: 100% Valid</span>
          </div>
        </div>

        <!-- Engine 3: Conversational Bot -->
        <div class="p-6 rounded-2xl bg-[#131b2e] border border-indigo-500/20 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center gap-2.5 pb-3 border-b border-indigo-500/20">
              <div class="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                <Bot class="w-5 h-5" />
              </div>
              <div>
                <span class="text-[10px] font-mono text-teal-300 uppercase">Engine 03</span>
                <h4 class="font-bold text-white text-base">Conversational Assistant</h4>
              </div>
            </div>

            <p class="text-xs text-slate-300 mt-3 leading-relaxed">
              Provides real-time collector assistance with function calling grounded directly into active MySQL inventory tables.
            </p>

            <div class="mt-4 space-y-2 text-xs text-slate-300">
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>Answers nuanced collector questions regarding card centering and rarity.</span>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>Direct function calling triggers live cart drawer additions from dialogue.</span>
              </div>
              <div class="flex items-start gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>Understands conversational bundling preferences (e.g. 'sulit' starter packs).</span>
              </div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 font-mono text-[11px] text-teal-300 flex justify-between">
            <span>Latency: &lt; 850ms</span>
            <span>Tool Calling: Active</span>
          </div>
        </div>

      </div>
    </template>

  </div>
</template>
