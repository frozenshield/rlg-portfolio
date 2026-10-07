<script setup>
import { ref } from 'vue'
import { useInventoryStore } from '../../../stores/inventoryStore'
import { 
  Scan, 
  Sparkles, 
  Upload, 
  Layers, 
  DollarSign, 
  Package, 
  CheckCircle2, 
  FileCode2, 
  Copy, 
  Check, 
  Plus, 
  Trash2,
  TrendingUp,
  Activity,
  Tag,
  AlertCircle
} from 'lucide-vue-next'

const inventoryStore = useInventoryStore()
const copiedSchema = ref(false)
const showPublishSuccess = ref(false)

function copySchema() {
  if (!inventoryStore.intakeForm.schemaJson) return
  navigator.clipboard.writeText(inventoryStore.intakeForm.schemaJson)
  copiedSchema.value = true
  setTimeout(() => {
    copiedSchema.value = false
  }, 2000)
}

function handlePublish() {
  const success = inventoryStore.publishProduct()
  if (success) {
    showPublishSuccess.value = true
    setTimeout(() => {
      showPublishSuccess.value = false
    }, 3000)
  }
}
</script>

<template>
  <div class="space-y-6 text-left">
    <!-- Quick Metrics Bar -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-4 rounded-xl bg-[#131b2e] border border-indigo-500/20 flex items-center justify-between">
        <div>
          <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Total GMV Sales</span>
          <span class="text-xl sm:text-2xl font-bold text-white block mt-0.5">$128,450.00</span>
          <span class="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
            <TrendingUp class="w-3 h-3" /> +18.4% this month
          </span>
        </div>
        <div class="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
          <DollarSign class="w-5 h-5" />
        </div>
      </div>

      <div class="p-4 rounded-xl bg-[#131b2e] border border-indigo-500/20 flex items-center justify-between">
        <div>
          <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Active Inventory</span>
          <span class="text-xl sm:text-2xl font-bold text-white block mt-0.5">{{ inventoryStore.products.length }} Items</span>
          <span class="text-[11px] text-indigo-400 block mt-1">Japanese TCG & Slabs</span>
        </div>
        <div class="p-3 rounded-xl bg-purple-500/10 text-purple-400">
          <Package class="w-5 h-5" />
        </div>
      </div>

      <div class="p-4 rounded-xl bg-[#131b2e] border border-indigo-500/20 flex items-center justify-between">
        <div>
          <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">AI Ingestion Throughput</span>
          <span class="text-xl sm:text-2xl font-bold text-white block mt-0.5">1.2s avg</span>
          <span class="text-[11px] text-emerald-400 block mt-1">99.8% OCR Precision</span>
        </div>
        <div class="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
          <Activity class="w-5 h-5" />
        </div>
      </div>

      <div class="p-4 rounded-xl bg-[#131b2e] border border-indigo-500/20 flex items-center justify-between">
        <div>
          <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Automated SEO</span>
          <span class="text-xl sm:text-2xl font-bold text-white block mt-0.5">100% Synced</span>
          <span class="text-[11px] text-purple-400 block mt-1">JSON-LD Microdata</span>
        </div>
        <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
          <Sparkles class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- AI Inventory Intake Engine Box -->
    <div class="p-6 rounded-2xl bg-[#0f172a] border border-indigo-500/30 relative overflow-hidden shadow-xl">
      <!-- Glow effect -->
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-indigo-500/20">
        <div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-medium mb-1">
            <Scan class="w-3.5 h-3.5" />
            <span>Multimodal Vision Intake Engine</span>
          </div>
          <h3 class="text-lg font-bold text-white">Simulated Gemini Vision OCR & Product Fulfillment</h3>
        </div>
        <span class="text-xs text-slate-400 font-mono">
          Endpoint: <code class="text-indigo-400">POST /api/v1/ai/vision-intake</code>
        </span>
      </div>

      <!-- Preset Selector chips -->
      <div class="mb-6">
        <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Step 1: Select a sample collectible card to test instant AI optical recognition:
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            v-for="(preset, pIdx) in inventoryStore.sampleCardPresets"
            :key="pIdx"
            @click="inventoryStore.triggerAiVisionIntake(pIdx)"
            :disabled="inventoryStore.isAnalyzing"
            class="p-3 rounded-xl bg-[#131b2e] hover:bg-[#18223a] border border-indigo-500/20 hover:border-indigo-400/50 text-left transition-all flex items-center gap-3 group disabled:opacity-50"
          >
            <img 
              :src="preset.image" 
              :alt="preset.label" 
              class="w-12 h-14 object-cover rounded-lg border border-indigo-400/30 shadow-xs shrink-0 group-hover:scale-105 transition-transform" 
            />
            <div class="truncate">
              <span class="text-xs font-bold text-white block truncate">{{ preset.label }}</span>
              <span class="text-[11px] text-indigo-400 block mt-0.5">Test Vision Scan →</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Scanning Status Bar -->
      <div v-if="inventoryStore.isAnalyzing" class="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 mb-6 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-indigo-300 font-mono flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            {{ inventoryStore.analysisStep }}
          </span>
          <span class="text-white font-mono font-bold">{{ inventoryStore.analysisProgress }}%</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div 
            class="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-full transition-all duration-300"
            :style="{ width: `${inventoryStore.analysisProgress}%` }"
          />
        </div>
      </div>

      <!-- Intake Form Grid (Auto-populated by AI) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left: Image Preview & Scan Box -->
        <div class="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-[#131b2e] border border-indigo-500/20 text-center relative overflow-hidden min-h-[280px]">
          <div v-if="inventoryStore.selectedImagePreview" class="relative group">
            <img 
              :src="inventoryStore.selectedImagePreview" 
              alt="Scan preview" 
              class="w-48 h-64 object-cover rounded-xl border border-indigo-500/40 shadow-xl"
            />
            <!-- Laser scan line animation overlay -->
            <div v-if="inventoryStore.isAnalyzing" class="absolute inset-x-0 h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-scan" />
            <span class="absolute bottom-2 left-2 text-[10px] bg-black/80 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/40">
              Optical Centering: 50/50
            </span>
          </div>

          <div v-else class="text-slate-500 flex flex-col items-center justify-center py-8">
            <Upload class="w-10 h-10 mb-2 text-indigo-400/60" />
            <span class="text-xs font-semibold text-slate-300">No Image Selected</span>
            <span class="text-[11px] text-slate-500 mt-1">Select one of the sample cards above</span>
          </div>
        </div>

        <!-- Right: Extracted Fields -->
        <div class="lg:col-span-8 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] font-mono text-slate-400 block mb-1">Extracted Item Title</label>
              <input 
                v-model="inventoryStore.intakeForm.name"
                type="text" 
                placeholder="Item name will appear here..." 
                class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label class="text-[11px] font-mono text-slate-400 block mb-1">Japanese Kana / Romaji</label>
              <input 
                v-model="inventoryStore.intakeForm.japaneseName"
                type="text" 
                placeholder="Japanese name..." 
                class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label class="text-[11px] font-mono text-slate-400 block mb-1">Expansion Set / Series</label>
              <input 
                v-model="inventoryStore.intakeForm.set"
                type="text" 
                placeholder="Set name..." 
                class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label class="text-[11px] font-mono text-slate-400 block mb-1">Card Serial Number</label>
              <input 
                v-model="inventoryStore.intakeForm.cardNumber"
                type="text" 
                placeholder="e.g. 212/S-P SAR" 
                class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label class="text-[11px] font-mono text-slate-400 block mb-1">Rarity Classification</label>
              <input 
                v-model="inventoryStore.intakeForm.rarity"
                type="text" 
                placeholder="e.g. Special Art Rare (SAR)" 
                class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label class="text-[11px] font-mono text-slate-400 block mb-1">Condition Grade (AI Visual)</label>
              <input 
                v-model="inventoryStore.intakeForm.condition"
                type="text" 
                placeholder="e.g. Gem Mint 10 (Ungraded)" 
                class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-emerald-400 font-semibold focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label class="text-[11px] font-mono text-slate-400 block mb-1">Retail Price ($ USD)</label>
              <input 
                v-model="inventoryStore.intakeForm.price"
                type="number" 
                placeholder="Price..." 
                class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label class="text-[11px] font-mono text-slate-400 block mb-1">Category</label>
              <select 
                v-model="inventoryStore.intakeForm.category"
                class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              >
                <option value="Singles">Singles</option>
                <option value="Booster Boxes">Booster Boxes</option>
                <option value="Mystery Bundles">Mystery Bundles</option>
              </select>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="text-[11px] font-mono text-slate-400 block mb-1">Listing Description</label>
            <textarea 
              v-model="inventoryStore.intakeForm.description"
              rows="2"
              placeholder="Card description..." 
              class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-400"
            />
          </div>

          <!-- SEO & Schema Generation Toolbar -->
          <div class="pt-2 flex flex-wrap items-center gap-3">
            <button
              @click="inventoryStore.generateSeoMetadata"
              :disabled="!inventoryStore.intakeForm.name || inventoryStore.isGeneratingSeo"
              class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              <Sparkles class="w-4 h-4 text-amber-300" />
              <span>{{ inventoryStore.isGeneratingSeo ? 'Generating Schema...' : 'One-Click: Generate SEO & JSON-LD Schema' }}</span>
            </button>

            <button
              @click="handlePublish"
              :disabled="!inventoryStore.intakeForm.name"
              class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              <Plus class="w-4 h-4" />
              <span>Publish to Live Inventory</span>
            </button>
          </div>

          <!-- Publish feedback toast -->
          <div v-if="showPublishSuccess" class="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4" />
            <span>Card successfully published to live catalog! Switch to Buyer Storefront to view it.</span>
          </div>

          <!-- JSON-LD Preview Drawer -->
          <div v-if="inventoryStore.intakeForm.schemaJson" class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/30 space-y-2 mt-4">
            <div class="flex items-center justify-between text-xs">
              <span class="text-indigo-300 font-mono flex items-center gap-1.5">
                <FileCode2 class="w-4 h-4 text-purple-400" />
                Structured JSON-LD Product Schema
              </span>
              <button 
                @click="copySchema" 
                class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
              >
                <component :is="copiedSchema ? Check : Copy" class="w-3 h-3 text-emerald-400" />
                <span>{{ copiedSchema ? 'Copied' : 'Copy JSON-LD' }}</span>
              </button>
            </div>
            <pre class="text-[10px] font-mono text-emerald-400 bg-slate-950 p-3 rounded-lg overflow-x-auto max-h-36"><code>{{ inventoryStore.intakeForm.schemaJson }}</code></pre>
          </div>

        </div>
      </div>
    </div>

    <!-- Product Table -->
    <div class="p-6 rounded-2xl bg-[#0f172a] border border-indigo-500/30 overflow-hidden shadow-xl">
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-indigo-500/20">
        <div>
          <h4 class="font-bold text-white text-base">Active Store Inventory ({{ inventoryStore.products.length }} Listings)</h4>
          <p class="text-xs text-slate-400 mt-0.5">Real-time database records synchronized across Laravel service layer</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="text-slate-400 font-mono uppercase text-[10px] border-b border-indigo-500/20 bg-[#131b2e]/60">
            <tr>
              <th class="py-3 px-3">Item / Image</th>
              <th class="py-3 px-3">Set & Serial</th>
              <th class="py-3 px-3">Condition</th>
              <th class="py-3 px-3">Price</th>
              <th class="py-3 px-3">Stock</th>
              <th class="py-3 px-3">Status</th>
              <th class="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-indigo-500/10">
            <tr 
              v-for="product in inventoryStore.products" 
              :key="product.id"
              class="hover:bg-[#131b2e]/40 transition-colors"
            >
              <td class="py-3 px-3">
                <div class="flex items-center gap-3">
                  <img :src="product.image" :alt="product.name" class="w-9 h-11 object-cover rounded-md border border-indigo-500/20" />
                  <div>
                    <span class="font-semibold text-white block">{{ product.name }}</span>
                    <span class="text-[10px] text-slate-400 block">{{ product.japaneseName }}</span>
                  </div>
                </div>
              </td>
              <td class="py-3 px-3 text-slate-300 font-mono text-[11px]">
                <div>{{ product.set }}</div>
                <div class="text-indigo-400 text-[10px]">{{ product.cardNumber }}</div>
              </td>
              <td class="py-3 px-3">
                <span class="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
                  {{ product.condition }}
                </span>
              </td>
              <td class="py-3 px-3 font-bold text-white">
                ${{ product.price.toFixed(2) }}
              </td>
              <td class="py-3 px-3 text-slate-300 font-mono">
                {{ product.stock }} units
              </td>
              <td class="py-3 px-3">
                <span class="px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 text-[10px] font-medium">
                  {{ product.status }}
                </span>
              </td>
              <td class="py-3 px-3 text-right">
                <button 
                  @click="inventoryStore.deleteProduct(product.id)"
                  class="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                  title="Remove item"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

