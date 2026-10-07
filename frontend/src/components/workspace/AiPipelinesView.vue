<script setup>
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
  ShieldCheck
} from 'lucide-vue-next'
</script>

<template>
  <div class="space-y-6 text-left">
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
              <span>Constructs valid <code class="text-indigo-400">schema.org/Product</code> JSON-LD snippets for Google rich snippets.</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle2 class="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>Automates URL slug deduplication and canonical OpenGraph meta tags.</span>
            </div>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 font-mono text-[11px] text-indigo-300 flex justify-between">
          <span>Search Indexing: Instant</span>
          <span>Schema: JSON-LD</span>
        </div>
      </div>

      <!-- Engine 3: Conversational Chatbot -->
      <div class="p-6 rounded-2xl bg-[#131b2e] border border-indigo-500/20 flex flex-col justify-between space-y-4">
        <div>
          <div class="flex items-center gap-2.5 pb-3 border-b border-indigo-500/20">
            <div class="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Bot class="w-5 h-5" />
            </div>
            <div>
              <span class="text-[10px] font-mono text-cyan-300 uppercase">Engine 03</span>
              <h4 class="font-bold text-white text-base">Conversational Assistant</h4>
            </div>
          </div>

          <p class="text-xs text-slate-300 mt-3 leading-relaxed">
            Live shopping advisor embedded in the storefront with knowledge of real-time inventory, pricing, and bundle rules.
          </p>

          <div class="mt-4 space-y-2 text-xs text-slate-300">
            <div class="flex items-start gap-2">
              <CheckCircle2 class="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>Function calling architecture triggers real-time Pinia cart additions from chat text.</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle2 class="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>Understands collector nuances: centering, PSA 10 thresholds, and Japanese print runs.</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle2 class="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>Recommends highest-value mystery bundles and handles order tracking FAQs.</span>
            </div>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 font-mono text-[11px] text-cyan-300 flex justify-between">
          <span>Response Latency: &lt;450ms</span>
          <span>Cart Hooks: Pinia</span>
        </div>
      </div>

    </div>

    <!-- Structured JSON Schema Code Demonstration -->
    <div class="p-6 rounded-2xl bg-[#090d16] border border-indigo-500/30 space-y-3 font-mono text-xs">
      <div class="flex items-center justify-between pb-3 border-b border-indigo-500/20 text-slate-400 text-[11px]">
        <div class="flex items-center gap-2">
          <Database class="w-4 h-4 text-purple-400" />
          <span>Gemini Vision Strict Response Schema (Laravel Service Layer)</span>
        </div>
        <span class="text-emerald-400">Validated with JsonSchemaValidator</span>
      </div>

      <pre class="text-[11px] text-slate-300 bg-slate-950 p-4 rounded-xl overflow-x-auto leading-relaxed"><code>$response = $gemini->withSchema([
    'type' => 'object',
    'properties' => [
        'item_title'    => ['type' => 'string'],
        'japanese_name' => ['type' => 'string'],
        'card_number'   => ['type' => 'string'],
        'set_series'    => ['type' => 'string'],
        'rarity'        => ['type' => 'string'],
        'condition_grade' => ['type' => 'string', 'enum' => ['Gem Mint 10', 'Near Mint', 'Light Play']],
        'estimated_usd' => ['type' => 'number'],
        'centering_score' => ['type' => 'string']
    ],
    'required' => ['item_title', 'card_number', 'set_series', 'condition_grade']
])->generateContent([$imageBlob, $intakePrompt]);</code></pre>
    </div>
  </div>
</template>

