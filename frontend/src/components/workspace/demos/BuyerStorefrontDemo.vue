<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '../../../stores/inventoryStore'
import { useCartStore } from '../../../stores/cartStore'
import { usePortfolioStore } from '../../../stores/portfolioStore'
import CartDrawer from './CartDrawer.vue'
import AiChatbotWidget from './AiChatbotWidget.vue'
import { 
  ShoppingBag, 
  Sparkles, 
  Filter, 
  CheckCircle2, 
  Plus, 
  ExternalLink,
  Flame,
  ShieldCheck,
  Zap,
  Tag,
  Search,
  Home,
  Compass,
  Heart,
  User,
  ArrowRight
} from 'lucide-vue-next'

const inventoryStore = useInventoryStore()
const cartStore = useCartStore()
const portfolioStore = usePortfolioStore()

const isMobile = computed(() => portfolioStore.activeDevice === 'mobile')

const activeCategory = ref('All')
// Authentic categories directly from rlgshop/CategoryPills.vue
const categories = [
  'All', 
  'Pokémon TCG', 
  'One Piece TCG', 
  'Mystery God Packs', 
  'Booster Boxes', 
  'Single Cards',
  'Gunpla & Figures'
]

const searchQuery = ref('')

const filteredProducts = computed(() => {
  let list = inventoryStore.products
  if (activeCategory.value !== 'All') {
    if (activeCategory.value === 'Pokémon TCG') {
      list = list.filter(p => p.name.includes('Charizard') || p.name.includes('Pikachu') || p.name.includes('Pokémon'))
    } else if (activeCategory.value === 'One Piece TCG') {
      list = list.filter(p => p.name.includes('One Piece') || p.name.includes('Shanks'))
    } else if (activeCategory.value === 'Mystery God Packs') {
      list = list.filter(p => p.category === 'Mystery Bundles')
    } else if (activeCategory.value === 'Booster Boxes') {
      list = list.filter(p => p.category === 'Booster Boxes')
    } else if (activeCategory.value === 'Single Cards') {
      list = list.filter(p => p.category === 'Singles')
    }
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  }
  return list
})

function formatPrice(usdPrice) {
  if (portfolioStore.currency === 'PHP') {
    const phpVal = Math.round(usdPrice * 56.5)
    return `₱${phpVal.toLocaleString()}`
  }
  return `$${usdPrice.toFixed(2)}`
}
</script>

<template>
  <div class="space-y-4 text-left relative">
    
    <!-- Top Announcement Bar from rlgshop -->
    <div class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/20 text-[11px] text-indigo-200 flex items-center justify-between">
      <div class="flex items-center gap-1.5 truncate">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
        <span class="truncate">RLG HOBBY SHOP • OFFICIAL TOKYO IMPORTS VAULT • FREE SHIPPING OVER ₱3,500</span>
      </div>
      <!-- Currency Switcher Toggle -->
      <button 
        @click="portfolioStore.toggleCurrency"
        class="ml-2 px-2 py-0.5 rounded bg-indigo-900/60 hover:bg-indigo-800 text-white font-mono text-[10px] font-bold border border-indigo-500/30 shrink-0 transition-colors"
        title="Toggle Currency"
      >
        {{ portfolioStore.currency }}
      </button>
    </div>

    <!-- Storefront Navigation Bar -->
    <div class="p-3 sm:p-4 rounded-2xl bg-[#0f172a] border border-indigo-500/20 flex items-center justify-between gap-3 shadow-md">
      <!-- Store Brand -->
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm">
          R
        </div>
        <div>
          <h2 class="font-bold text-white text-sm sm:text-base leading-none">RLG Online Shop</h2>
          <span class="text-[10px] font-mono text-indigo-400">Trading Cards & Collectibles</span>
        </div>
      </div>

      <!-- Search Input (Hidden on extra small mobile screens) -->
      <div class="hidden sm:flex flex-1 max-w-xs mx-2">
        <div class="relative w-full">
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search Pokémon, One Piece..." 
            class="w-full bg-[#131b2e] border border-indigo-500/20 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      <!-- Cart Button in Storefront -->
      <button
        @click="cartStore.toggleCart"
        class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shrink-0"
      >
        <ShoppingBag class="w-4 h-4" />
        <span class="hidden sm:inline">Cart</span>
        <span class="px-1.5 py-0.2 rounded-full bg-white text-indigo-700 font-mono text-[10px] font-bold">
          {{ cartStore.itemCount }}
        </span>
      </button>
    </div>

    <!-- Authentic Hero Banner from rlgshop/HeroBanner.vue -->
    <div class="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-[#131b2e] via-[#0f172a] to-[#090d16] border border-indigo-500/30 relative overflow-hidden">
      <!-- Ambient glow -->
      <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-500/10 blur-2xl rounded-full pointer-events-none" />

      <div class="max-w-xl space-y-2 relative z-10">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-medium">
          <Sparkles class="w-3 h-3 text-amber-300" />
          <span>RLG HOBBY SHOP • OFFICIAL IMPORTS VAULT</span>
        </div>

        <h3 class="text-lg sm:text-2xl font-extrabold text-white leading-tight">
          Build, Collect & Battle. Your Premier Hobby Store.
        </h3>

        <p class="text-xs text-slate-300 leading-relaxed">
          Discover factory-sealed Trading Card Game booster boxes, authentic Japanese cards, and mystery God Packs — shipped securely across the Philippines.
        </p>

        <div class="pt-2 flex items-center gap-2">
          <button 
            @click="activeCategory = 'All'"
            class="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>Explore All Products</span>
            <ArrowRight class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Category Pills from rlgshop/CategoryPills.vue -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
      <button
        v-for="cat in categories"
        :key="cat"
        @click="activeCategory = cat"
        :class="[
          'px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0',
          activeCategory === cat 
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
            : 'bg-[#131b2e] text-slate-300 hover:text-white border border-indigo-500/20'
        ]"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Collectibles Grid (Responsive for Mobile and Desktop) -->
    <div 
      :class="[
        'grid gap-3 sm:gap-4',
        isMobile ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      ]"
    >
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="group rounded-2xl bg-[#0f172a] border border-indigo-500/20 hover:border-indigo-400/50 p-3 transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
      >
        <div>
          <!-- Card Image Container -->
          <div :class="['relative rounded-xl overflow-hidden bg-slate-950 mb-3 border border-indigo-500/20', isMobile ? 'h-36' : 'h-52']">
            <img 
              :src="product.image" 
              :alt="product.name" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />

            <!-- Hot Badge -->
            <div class="absolute top-2 left-2 flex flex-col gap-1">
              <span v-if="product.isHot" class="px-1.5 py-0.5 rounded-full bg-rose-600/90 text-white text-[9px] font-bold">
                HOT
              </span>
            </div>

            <!-- Condition Pill -->
            <div class="absolute bottom-1.5 left-1.5 right-1.5 truncate">
              <span class="px-1.5 py-0.5 rounded-full bg-black/80 text-emerald-400 text-[9px] font-mono border border-emerald-500/40 truncate block">
                {{ product.condition }}
              </span>
            </div>
          </div>

          <!-- Product Details -->
          <div>
            <div class="text-[10px] font-mono text-slate-400 truncate">{{ product.set }}</div>
            <h4 class="font-bold text-white text-xs sm:text-sm line-clamp-1 group-hover:text-indigo-300 transition-colors">
              {{ product.name }}
            </h4>
            <span v-if="product.japaneseName" class="text-[10px] text-slate-400 block truncate">
              {{ product.japaneseName }}
            </span>
          </div>
        </div>

        <!-- Pricing & Add to Cart -->
        <div class="mt-3 pt-2 border-t border-indigo-500/20 flex items-center justify-between gap-1">
          <div>
            <span class="text-xs sm:text-sm font-extrabold text-white block">
              {{ formatPrice(product.price) }}
            </span>
            <span class="text-[9px] text-slate-500 font-mono block">
              Stock: {{ product.stock }}
            </span>
          </div>

          <button
            @click="cartStore.addToCart(product)"
            class="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-sm"
          >
            <Plus class="w-3.5 h-3.5" />
            <span :class="isMobile ? 'hidden' : 'inline'">Add</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Mobile App Navigation Bar (Only in Mobile Frame mode) matching PWA / Capacitor! -->
    <div 
      v-if="isMobile" 
      class="sticky bottom-0 inset-x-0 -mx-3 -mb-3 bg-[#090d16]/95 backdrop-blur-md border-t border-indigo-500/20 py-2 px-4 flex items-center justify-around text-slate-400 text-[10px] font-medium z-30"
    >
      <button class="flex flex-col items-center gap-0.5 text-indigo-400">
        <Home class="w-4 h-4" />
        <span>Home</span>
      </button>
      <button class="flex flex-col items-center gap-0.5 hover:text-white">
        <Compass class="w-4 h-4" />
        <span>Catalog</span>
      </button>
      <button class="flex flex-col items-center gap-0.5 hover:text-white">
        <Flame class="w-4 h-4" />
        <span>Hot Deals</span>
      </button>
      <button @click="cartStore.toggleCart" class="flex flex-col items-center gap-0.5 hover:text-white relative">
        <ShoppingBag class="w-4 h-4" />
        <span class="absolute -top-1 right-1 w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>Cart</span>
      </button>
      <button class="flex flex-col items-center gap-0.5 hover:text-white">
        <User class="w-4 h-4" />
        <span>Profile</span>
      </button>
    </div>

    <!-- Embedded Cart Drawer -->
    <CartDrawer />

    <!-- Embedded Floating AI Chatbot Widget -->
    <AiChatbotWidget />
  </div>
</template>
