<script setup>
import { ref, nextTick } from 'vue'
import { useCartStore } from '../../../stores/cartStore'
import { useInventoryStore } from '../../../stores/inventoryStore'
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  ShoppingBag, 
  CheckCircle2, 
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-vue-next'

const cartStore = useCartStore()
const inventoryStore = useInventoryStore()

const isOpen = ref(false)
const inputMessage = ref('')
const isTyping = ref(false)
const chatContainer = ref(null)

const quickPrompts = [
  'Check card condition & PSA 10',
  'Show Pokémon Sulit bundles',
  'Track order & shipping status',
  'Ask about Japanese authenticity'
]

const messages = ref([
  {
    id: 1,
    sender: 'bot',
    text: 'Konnichiwa! ⚡ I am your RLG Shop Multimodal AI Assistant. Looking for rare Japanese Pokémon singles, One Piece Manga cards, or Sulit God Pack mystery bundles?',
    suggestedProducts: [
      { id: 'prod-1', name: 'Charizard VSTAR SAR s12a', price: 89.99 }
    ]
  }
])

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    scrollToBottom()
  }
}

async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

async function sendPrompt(promptText) {
  if (!promptText || isTyping.value) return

  // Push user message
  messages.value.push({
    id: Date.now(),
    sender: 'user',
    text: promptText
  })

  inputMessage.value = ''
  scrollToBottom()
  isTyping.value = true

  await new Promise(r => setTimeout(r, 900))

  let replyText = ''
  let products = []

  const lower = promptText.toLowerCase()
  if (lower.includes('condition') || lower.includes('psa')) {
    replyText = 'All Japanese singles on RLG Shop are optical-verified via Gemini Vision OCR before grading. We guarantee near-mint to gem-mint centering, clean holographic foil with no binder dings, and ship with ultra-clear sleeves & magnetic cases.'
    products = [
      { id: 'prod-1', name: 'Charizard VSTAR SAR (#212/S-P)', price: 89.99 },
      { id: 'prod-2', name: 'Pikachu Illustrator Promo', price: 249.50 }
    ]
  } else if (lower.includes('sulit') || lower.includes('bundle') || lower.includes('mystery')) {
    replyText = 'Our Pokémon "Sulit" Japanese Mystery Pack ($45) is our most popular tier! It is guaranteed to contain at least 1 Japanese Special Art Rare (SAR) plus 2 Art Rares (AR). High hit rates!'
    products = [
      { id: 'prod-5', name: 'Pokémon Sulit God Pack Mystery Bundle', price: 45.00 }
    ]
  } else if (lower.includes('track') || lower.includes('shipping')) {
    replyText = 'Orders ship within 24 hours from Manila with DHL Express & LBC tracking. Orders over $150 qualify for free insured express delivery.'
  } else {
    replyText = `Great question! RLG Online Shop sources directly from official Tokyo Pokémon Centers and Bandai distributors. Here is a top-trending item from our live inventory:`
    products = [
      { id: 'prod-4', name: 'Manga Shanks Super Parallel OP01-120', price: 520.00 }
    ]
  }

  messages.value.push({
    id: Date.now() + 1,
    sender: 'bot',
    text: replyText,
    suggestedProducts: products
  })

  isTyping.value = false
  scrollToBottom()
}

function addSuggestedProduct(prodId) {
  const prod = inventoryStore.products.find(p => p.id === prodId)
  if (prod) {
    cartStore.addToCart(prod)
  }
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-40 text-left">
    <!-- Floating Trigger Button -->
    <button
      v-if="!isOpen"
      @click="toggleChat"
      class="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all duration-300"
    >
      <div class="relative">
        <Bot class="w-5 h-5 text-white" />
        <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-700 animate-pulse"></span>
      </div>
      <span>RLG AI Assistant</span>
      <Sparkles class="w-4 h-4 text-amber-300" />
    </button>

    <!-- Expanded Chat Window -->
    <div
      v-else
      class="w-[90vw] sm:w-[380px] h-[520px] rounded-2xl bg-[#090d16] border border-indigo-500/30 shadow-2xl flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Chat Header -->
      <div class="p-4 bg-gradient-to-r from-[#0f172a] to-[#131b2e] border-b border-indigo-500/20 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <Bot class="w-4 h-4" />
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h4 class="text-xs font-bold text-white">RLG Shop AI Advisor</h4>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <span class="text-[10px] text-indigo-300 font-mono">Gemini Multimodal Powered</span>
          </div>
        </div>

        <button 
          @click="toggleChat" 
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Messages Stream -->
      <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#090d16]">
        <div 
          v-for="msg in messages" 
          :key="msg.id"
          :class="['flex flex-col', msg.sender === 'user' ? 'items-end' : 'items-start']"
        >
          <div 
            :class="[
              'max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm',
              msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-[#131b2e] text-slate-200 border border-indigo-500/20 rounded-bl-none'
            ]"
          >
            <p>{{ msg.text }}</p>

            <!-- Embedded Product Recommendation Cards -->
            <div v-if="msg.suggestedProducts && msg.suggestedProducts.length" class="mt-2.5 pt-2 border-t border-indigo-500/20 space-y-2">
              <div 
                v-for="prod in msg.suggestedProducts" 
                :key="prod.id"
                class="p-2 rounded-lg bg-[#090d16] border border-indigo-500/30 flex items-center justify-between gap-2"
              >
                <div class="truncate">
                  <span class="font-bold text-white text-[11px] block truncate">{{ prod.name }}</span>
                  <span class="text-emerald-400 font-mono text-[10px]">${{ prod.price.toFixed(2) }}</span>
                </div>
                <button 
                  @click="addSuggestedProduct(prod.id)"
                  class="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] shrink-0 flex items-center gap-1 transition-colors"
                >
                  <ShoppingBag class="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="isTyping" class="flex items-center gap-1.5 p-2 rounded-xl bg-[#131b2e] border border-indigo-500/20 w-fit text-slate-400 text-xs">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
          <span class="text-[10px] text-slate-400 font-mono ml-1">RLG AI searching catalog...</span>
        </div>
      </div>

      <!-- Quick Prompt Chips -->
      <div class="px-3 py-2 bg-[#0c1220] border-t border-indigo-500/10 flex gap-1.5 overflow-x-auto text-[10px]">
        <button
          v-for="(prompt, qIdx) in quickPrompts"
          :key="qIdx"
          @click="sendPrompt(prompt)"
          class="shrink-0 px-2.5 py-1 rounded-full bg-[#131b2e] hover:bg-indigo-950/80 text-indigo-300 hover:text-white border border-indigo-500/30 transition-colors"
        >
          {{ prompt }}
        </button>
      </div>

      <!-- Input box -->
      <form @submit.prevent="sendPrompt(inputMessage)" class="p-3 bg-[#0f172a] border-t border-indigo-500/20 flex gap-2">
        <input 
          v-model="inputMessage"
          type="text" 
          placeholder="Ask about cards, condition, sets..." 
          class="flex-1 bg-[#131b2e] border border-indigo-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
        />
        <button 
          type="submit"
          :disabled="!inputMessage.trim() || isTyping"
          class="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
        >
          <Send class="w-4 h-4" />
        </button>
      </form>
    </div>
  </div>
</template>

