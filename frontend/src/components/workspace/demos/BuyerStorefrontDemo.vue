<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '../../../stores/inventoryStore'
import { useCartStore } from '../../../stores/cartStore'
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
  Tag
} from 'lucide-vue-next'

const inventoryStore = useInventoryStore()
const cartStore = useCartStore()

const activeCategory = ref('All')
const categories = ['All', 'Singles', 'Booster Boxes', 'Mystery Bundles']

const filteredProducts = computed(() => {
  if (activeCategory.value === 'All') {
    return inventoryStore.products
  }
  return inventoryStore.products.filter(p => p.category === activeCategory.value)
})
</script>

<template>
  <div class="space-y-6 text-left relative">
    <!-- Storefront Announcement Banner -->
    <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
          <Sparkles class="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-white text-base sm:text-lg">RLG Japanese Collectibles Storefront</h3>
            <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Live Mock Store
            </span>
          </div>
          <p class="text-xs text-slate-300 mt-0.5">
            Authentic Tokyo imported Pokémon, One Piece & Yu-Gi-Oh! cards with instant Pinia reactive cart state.
          </p>
        </div>
      </div>

      <!-- Cart Button in banner -->
      <button
        @click="cartStore.toggleCart"
        class="relative px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all shrink-0"
      >
        <ShoppingBag class="w-4 h-4" />
        <span>View Cart</span>
        <span class="px-1.5 py-0.5 rounded-full bg-white text-indigo-700 font-mono text-[11px] font-bold">
          {{ cartStore.itemCount }}
        </span>
      </button>
    </div>

    <!-- Category Filters & Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-2">
      <div class="flex items-center gap-1.5 p-1 bg-[#131b2e] rounded-xl border border-indigo-500/20 text-xs">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="activeCategory = cat"
          :class="[
            'px-3.5 py-1.5 rounded-lg transition-all font-semibold',
            activeCategory === cat 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'text-slate-400 hover:text-white'
          ]"
        >
          {{ cat }}
        </button>
      </div>

      <div class="text-xs text-slate-400 font-mono flex items-center gap-2">
        <span>Showing {{ filteredProducts.length }} items</span>
        <span class="text-indigo-400">|</span>
        <span class="text-emerald-400 flex items-center gap-1">
          <ShieldCheck class="w-3.5 h-3.5" /> 100% Authenticity Verified
        </span>
      </div>
    </div>

    <!-- Collectibles Product Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="group rounded-2xl bg-[#0f172a] border border-indigo-500/20 hover:border-indigo-400/50 p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between"
      >
        <div>
          <!-- Card Image & Badge Overlay -->
          <div class="relative w-full h-64 rounded-xl overflow-hidden bg-slate-950 mb-4 border border-indigo-500/20">
            <img 
              :src="product.image" 
              :alt="product.name" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />

            <!-- Hot / Rarity Pill -->
            <div class="absolute top-2.5 left-2.5 flex flex-col gap-1">
              <span 
                v-if="product.isHot" 
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs shadow-xs"
              >
                <Flame class="w-3 h-3 text-amber-300" /> Hot Pick
              </span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-black/70 text-indigo-300 text-[10px] font-mono border border-indigo-500/30 backdrop-blur-xs">
                {{ product.rarity }}
              </span>
            </div>

            <!-- Condition Grade Pill -->
            <div class="absolute bottom-2.5 left-2.5">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 backdrop-blur-xs">
                <CheckCircle2 class="w-3 h-3 text-emerald-400" /> {{ product.condition }}
              </span>
            </div>
          </div>

          <!-- Product Meta Info -->
          <div>
            <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
              <span>{{ product.set }}</span>
              <span class="text-indigo-400 font-semibold">{{ product.cardNumber }}</span>
            </div>

            <h4 class="font-bold text-white text-sm sm:text-base group-hover:text-indigo-300 transition-colors line-clamp-1">
              {{ product.name }}
            </h4>

            <p v-if="product.japaneseName" class="text-xs text-slate-400 font-sans mt-0.5">
              {{ product.japaneseName }}
            </p>

            <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
              {{ product.description }}
            </p>
          </div>
        </div>

        <!-- Price & Add to Cart -->
        <div class="mt-4 pt-3 border-t border-indigo-500/20 flex items-center justify-between">
          <div>
            <span class="text-[10px] text-slate-400 font-mono block">Direct Tokyo Price</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-lg font-extrabold text-white">${{ product.price.toFixed(2) }}</span>
              <span class="text-[10px] text-slate-500 font-mono">≈ ¥{{ product.jpyPrice ? product.jpyPrice.toLocaleString() : (product.price * 150).toFixed(0) }}</span>
            </div>
          </div>

          <button
            @click="cartStore.addToCart(product)"
            class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
          >
            <Plus class="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Embedded Cart Drawer -->
    <CartDrawer />

    <!-- Embedded Floating AI Chatbot Widget -->
    <AiChatbotWidget />
  </div>
</template>

