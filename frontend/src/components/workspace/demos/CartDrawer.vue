<script setup>
import { ref } from 'vue'
import { useCartStore } from '../../../stores/cartStore'
import { usePortfolioStore } from '../../../stores/portfolioStore'
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Tag
} from 'lucide-vue-next'

const cartStore = useCartStore()
const portfolioStore = usePortfolioStore()
const promoInput = ref('')
const promoMessage = ref('')
const isPromoSuccess = ref(false)

function formatPrice(usdPrice) {
  if (portfolioStore.currency === 'PHP') {
    const phpVal = Math.round(usdPrice * 56.5)
    return `₱${phpVal.toLocaleString()}`
  }
  return `$${usdPrice.toFixed(2)}`
}

function handleApplyPromo() {
  if (!promoInput.value) return
  const res = cartStore.applyPromo(promoInput.value)
  isPromoSuccess.value = res.success
  promoMessage.value = res.message
  setTimeout(() => {
    promoMessage.value = ''
  }, 3500)
}
</script>

<template>
  <div>
    <!-- Backdrop -->
    <div 
      v-if="cartStore.isCartOpen" 
      @click="cartStore.toggleCart"
      class="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 transition-opacity"
    />

    <!-- Slide-over Drawer -->
    <aside 
      :class="[
        'fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#090d16] border-l border-indigo-500/30 z-50 shadow-2xl flex flex-col justify-between transition-transform duration-300 text-left',
        cartStore.isCartOpen ? 'translate-x-0' : 'translate-x-full'
      ]"
    >
      <!-- Cart Header -->
      <div class="p-5 border-b border-indigo-500/20 flex items-center justify-between bg-[#0f172a]">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <ShoppingBag class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-white text-base">Your Card Vault</h3>
            <span class="text-xs text-slate-400">{{ cartStore.itemCount }} item{{ cartStore.itemCount === 1 ? '' : 's' }} in cart</span>
          </div>
        </div>

        <button 
          @click="cartStore.toggleCart" 
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Cart Item List -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4">
        <!-- Success Checkout State -->
        <div v-if="cartStore.checkoutSuccess" class="p-6 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 class="w-7 h-7" />
          </div>
          <h4 class="font-bold text-white text-lg">Order Confirmed!</h4>
          <p class="text-xs text-emerald-200">
            Thank you! Your Japanese collectible cards are prepared with top-loaders & bubble wrap. Simulated order completed.
          </p>
        </div>

        <!-- Empty Cart State -->
        <div v-else-if="cartStore.items.length === 0" class="py-16 text-center text-slate-500 space-y-3">
          <ShoppingBag class="w-12 h-12 mx-auto text-slate-600" />
          <h4 class="text-sm font-semibold text-slate-300">Your cart is empty</h4>
          <p class="text-xs text-slate-500 max-w-xs mx-auto">
            Explore the trading cards below and add your favorite Japanese singles or mystery bundles.
          </p>
        </div>

        <!-- Items list -->
        <div 
          v-else 
          v-for="item in cartStore.items" 
          :key="item.id"
          class="p-3.5 rounded-xl bg-[#131b2e] border border-indigo-500/20 flex gap-3.5 items-center justify-between"
        >
          <img 
            :src="item.image" 
            :alt="item.name" 
            class="w-14 h-18 object-cover rounded-lg border border-indigo-500/30 shrink-0" 
          />

          <div class="flex-1 min-w-0 pr-2">
            <h5 class="text-xs font-bold text-white truncate">{{ item.name }}</h5>
            <span class="text-[10px] text-emerald-400 block mt-0.5">{{ item.condition }}</span>
            <div class="text-xs font-bold text-white mt-1">
              {{ formatPrice(item.price) }}
            </div>

            <!-- Qty controls -->
            <div class="flex items-center gap-2 mt-2">
              <button 
                @click="cartStore.updateQuantity(item.id, -1)"
                class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
              >
                <Minus class="w-3 h-3" />
              </button>
              <span class="text-xs font-mono text-white px-1">{{ item.quantity }}</span>
              <button 
                @click="cartStore.updateQuantity(item.id, 1)"
                class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
              >
                <Plus class="w-3 h-3" />
              </button>
            </div>
          </div>

          <button 
            @click="cartStore.removeFromCart(item.id)" 
            class="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors self-start"
            title="Remove item"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Cart Footer / Totals & Checkout -->
      <div v-if="cartStore.items.length > 0" class="p-5 border-t border-indigo-500/20 bg-[#0f172a] space-y-4">
        <!-- Promo code input -->
        <div class="flex gap-2">
          <input 
            v-model="promoInput"
            type="text" 
            placeholder="Promo code: Try HOBBY10 or GUNPLA20" 
            class="flex-1 bg-[#131b2e] border border-indigo-500/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 uppercase focus:outline-none focus:border-indigo-400"
          />
          <button 
            @click="handleApplyPromo"
            class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
          >
            Apply
          </button>
        </div>

        <div v-if="promoMessage" :class="['text-xs font-medium', isPromoSuccess ? 'text-emerald-400' : 'text-rose-400']">
          {{ promoMessage }}
        </div>

        <!-- Breakdown -->
        <div class="space-y-1.5 text-xs text-slate-300">
          <div class="flex justify-between">
            <span class="text-slate-400">Subtotal:</span>
            <span>{{ formatPrice(cartStore.subtotal) }}</span>
          </div>
          <div v-if="cartStore.discountPercent > 0" class="flex justify-between text-emerald-400">
            <span>Discount ({{ cartStore.discountPercent }}%):</span>
            <span>-{{ formatPrice(cartStore.discountAmount) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Insured Shipping:</span>
            <span>{{ cartStore.shipping === 0 ? 'FREE' : formatPrice(cartStore.shipping) }}</span>
          </div>
          <div class="pt-2 border-t border-indigo-500/20 flex justify-between font-bold text-sm text-white">
            <span>Total Amount:</span>
            <span class="text-emerald-400 text-base">{{ formatPrice(cartStore.total) }}</span>
          </div>
        </div>

        <!-- Checkout Action Button -->
        <button 
          @click="cartStore.checkout"
          :disabled="cartStore.isCheckingOut"
          class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles class="w-4 h-4 text-amber-300" />
          <span>{{ cartStore.isCheckingOut ? 'Securing Transaction...' : 'Instant Checkout (Simulated)' }}</span>
          <ArrowRight class="w-4 h-4" />
        </button>

        <div class="flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Japanese Authenticity Guarantee • Tracked Courier</span>
        </div>
      </div>
    </aside>
  </div>
</template>

