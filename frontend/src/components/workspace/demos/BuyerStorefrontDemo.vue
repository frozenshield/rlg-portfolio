<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCartStore } from '../../../stores/cartStore'
import { usePortfolioStore } from '../../../stores/portfolioStore'
import CartDrawer from './CartDrawer.vue'
import { 
  ShoppingBag, 
  Sparkles, 
  Heart, 
  Search, 
  Menu, 
  X, 
  Plus, 
  ArrowRight, 
  Check, 
  Flame, 
  ShieldCheck, 
  Zap, 
  MessageSquare,
  Bot,
  Send,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Truck,
  Star
} from 'lucide-vue-next'

const cartStore = useCartStore()
const portfolioStore = usePortfolioStore()

const isMobile = computed(() => portfolioStore.activeDevice === 'mobile')
const isTablet = computed(() => portfolioStore.activeDevice === 'tablet')

// UI States
const isSearchOpen = ref(false)
const searchQuery = ref('')
const isMobileMenuOpen = ref(false)
const isQuickViewOpen = ref(false)
const selectedProduct = ref(null)
const isAiChatOpen = ref(false)
const isStaffChatOpen = ref(false)
const showAikoTooltip = ref(true)
const isHobbyMatcherOpen = ref(false)

// Wishlist Set
const wishlist = ref(new Set(['prod-1', 'prod-4']))

function toggleWishlist(id) {
  if (wishlist.value.has(id)) {
    wishlist.value.delete(id)
  } else {
    wishlist.value.add(id)
  }
}

function isWishlisted(id) {
  return wishlist.value.has(id)
}

// Currency Formatter
function formatPrice(phpPrice) {
  if (portfolioStore.currency === 'USD') {
    const usdVal = phpPrice / 56.5
    return `$${usdVal.toFixed(2)}`
  }
  return `₱${Number(phpPrice).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Doorzo-Style 5 Horizontal Categories
const categories = [
  { id: 'tcg', name: 'TCG Cards', icon: '🃏', style: 'bg-blue-600/20 border-blue-500/40 text-blue-400' },
  { id: 'gunpla', name: 'Gunpla', icon: '🤖', style: 'bg-sky-600/20 border-sky-500/40 text-sky-400' },
  { id: 'figures', name: 'Figures', icon: '⚡', style: 'bg-red-600/20 border-red-500/40 text-red-400' },
  { id: 'merch', name: 'Merch', icon: '🎁', style: 'bg-amber-600/20 border-amber-500/40 text-amber-400' },
  { id: 'plushies', name: 'Plushies', icon: '🧸', style: 'bg-pink-600/20 border-pink-500/40 text-pink-400' }
]

const activeCategoryFilter = ref('all')

function handleCategoryClick(catId) {
  activeCategoryFilter.value = activeCategoryFilter.value === catId ? 'all' : catId
}

// Promotional Slidable Banners
const slides = [
  {
    id: 'raffle',
    image: '/images/banners/banner-raffle.jpg',
    title: 'Invite Your Friends Win Big in Our Lucky Raffle!'
  },
  {
    id: 'shipping',
    image: '/images/banners/banner-shipping.jpg',
    title: 'Fast & Secure Dispatch - Handled with Care'
  },
  {
    id: 'fb-prizes',
    image: '/images/banners/banner-fb-prizes.jpg',
    title: 'Follow Us on Facebook - Surprise Weekly Giveaways'
  }
]
const currentSlide = ref(0)
let slideInterval = null

onMounted(() => {
  slideInterval = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % slides.length
  }, 4500)
})

onUnmounted(() => {
  if (slideInterval) clearInterval(slideInterval)
})

// Layer 1: Best Selling Products (Matching Screenshot 5)
const bestSellingProducts = ref([
  {
    id: 'bs-1',
    name: 'Pokemon TCG Bunnelby Shiny (S4a)',
    price: 150.00,
    origPrice: 173.00,
    discountPercent: 15,
    isBestSeller: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 8,
    category: 'tcg',
    image: '/storage/products/0Wb34Nm2V7UO9oSiB8LJ7XgCpPhtb3wNFV2KlAGw.png'
  },
  {
    id: 'bs-2',
    name: 'Boltund Shiny V (S4a 311/190)',
    price: 250.00,
    origPrice: 288.00,
    discountPercent: 15,
    isBestSeller: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 5,
    category: 'tcg',
    image: '/storage/products/25EjAOVQHiF8J5b4cqtsdJKLCjfv4mE3I4LEgCJo.png'
  },
  {
    id: 'bs-3',
    name: 'Pokemon TCG Bisharp Shiny (S4a)',
    price: 120.00,
    origPrice: 138.00,
    discountPercent: 15,
    isBestSeller: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 12,
    category: 'tcg',
    image: '/storage/products/2hKHz5gqFTfnYk9blD4AnQQA73CDgP3RA2o2YCl7.png'
  },
  {
    id: 'bs-4',
    name: 'Pokémon TCG - Arctovish Shiny',
    price: 150.00,
    origPrice: 173.00,
    discountPercent: 15,
    isBestSeller: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 7,
    category: 'tcg',
    image: '/storage/products/68UKr6TrMaHHND8ZyQDsCs6466yDYnWemDEIM4jz.png'
  },
  {
    id: 'bs-5',
    name: 'Pokémon TCG Applin Shiny',
    price: 120.00,
    origPrice: 138.00,
    discountPercent: 15,
    isBestSeller: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 9,
    category: 'tcg',
    image: '/storage/products/7uYQKfPYb0gLwh1zawKskbB2HeXhdFGVmGSWsds6.png'
  },
  {
    id: 'bs-6',
    name: 'Annihilape ex Shiny (sv4a)',
    price: 250.00,
    origPrice: 288.00,
    discountPercent: 15,
    isBestSeller: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 4,
    category: 'tcg',
    image: '/storage/products/AJSibjIckfbjRc6wTWIMbkWi1P1IwhD4Jsla4NEE.png'
  }
])

// Layer 2: Top Picks (Matching Screenshot 3)
const topPicksProducts = ref([
  {
    id: 'tp-1',
    name: 'Drifblim (Shiny / S4a 242/190)',
    price: 250.00,
    origPrice: 288.00,
    discountPercent: 15,
    isTopPick: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 6,
    category: 'tcg',
    image: '/storage/products/Aswglt6vA7NegrJ08eaH2rNvT4J10zoFmdaFUtzA.png'
  },
  {
    id: 'tp-2',
    name: 'Pokemon Card Gengar Holo Foil',
    price: 150.00,
    origPrice: 173.00,
    discountPercent: 15,
    isTopPick: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 3,
    category: 'tcg',
    image: '/storage/products/bTV6XywdD1Yi3VrMIASHaLU9Qn7dzmyCYgB7ui4f.png'
  },
  {
    id: 'tp-3',
    name: 'Doduo Shiny - SV4a Shiny Treasure',
    price: 120.00,
    origPrice: 138.00,
    discountPercent: 15,
    isTopPick: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 14,
    category: 'tcg',
    image: '/storage/products/ETOFi4lTEFyvW8slHZxfbiblrtgd7S0TNdZ7lsnv.png'
  },
  {
    id: 'tp-4',
    name: 'Pokemon TCG Dartrix Shiny S4a',
    price: 150.00,
    origPrice: 173.00,
    discountPercent: 15,
    isTopPick: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 5,
    category: 'tcg',
    image: '/storage/products/KqY1HizLo23rOhMAURz9ceKL5vL0ZqzORijAm0ZQ.png'
  },
  {
    id: 'tp-5',
    name: 'Cyclizar Shiny Secret SV4a',
    price: 180.00,
    origPrice: 207.00,
    discountPercent: 15,
    isTopPick: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 8,
    category: 'tcg',
    image: '/storage/products/ruNqPFJtP9Zpdh1n8S0gI8tuClx8fe41h3XxE8Ae.png'
  },
  {
    id: 'tp-6',
    name: 'Pokemon Card Japanese Raichu AR',
    price: 150.00,
    origPrice: 173.00,
    discountPercent: 15,
    isTopPick: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 4,
    category: 'tcg',
    image: '/storage/products/rzLkpBRMYianeE5tTUqYkNwUPmynptvp9ilLN9GK.png'
  }
])

// Layer 3: TCG Spotlight (Matching Screenshot 1 & 2)
const tcgSpotlightProducts = ref([
  {
    id: 'tcg-1',
    name: 'Pokémon TCG Frosmoth Shiny S4a',
    price: 250.00,
    origPrice: 288.00,
    discountPercent: 15,
    isTopPick: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 5,
    category: 'tcg',
    image: '/storage/products/S0ovGIsIj0qdpoSjGm868MkWp6aGZxl4xAQmcYDl.png'
  },
  {
    id: 'tcg-2',
    name: 'Pokémon TCG Flapple Shiny S4a',
    price: 250.00,
    origPrice: 288.00,
    discountPercent: 15,
    isTopPick: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 7,
    category: 'tcg',
    image: '/storage/products/ThNIzrPBGnuKNqDWUXPfxVUkBAKiqF83ojoxkbuR.png'
  },
  {
    id: 'tcg-3',
    name: 'Abomasnow (Shiny S4a 209/190)',
    price: 250.00,
    origPrice: 288.00,
    discountPercent: 15,
    isTopPick: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 6,
    category: 'tcg',
    image: '/storage/products/UH1tPUsjZDfjkGH76LeqGuEfJSX8JX7VEgn4sAUr.png'
  },
  {
    id: 'tcg-4',
    name: 'Pokémon TCG Japanese Jolteon VMAX',
    price: 250.00,
    origPrice: 288.00,
    discountPercent: 15,
    isTopPick: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 3,
    category: 'tcg',
    image: '/storage/products/W2nXQDYDa5EPtP8Jwdku5eNHgYm86waWXwNRMMz7.png'
  },
  {
    id: 'tcg-5',
    name: 'Drifblim (Shiny / S4a 242/190)',
    price: 250.00,
    origPrice: 288.00,
    discountPercent: 15,
    isTopPick: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 6,
    category: 'tcg',
    image: '/storage/products/Aswglt6vA7NegrJ08eaH2rNvT4J10zoFmdaFUtzA.png'
  },
  {
    id: 'tcg-6',
    name: 'Pokemon Card Gengar Holo Foil',
    price: 150.00,
    origPrice: 173.00,
    discountPercent: 15,
    isTopPick: true,
    condition: 'Near Mint',
    rating: 4.8,
    stock: 4,
    category: 'tcg',
    image: '/storage/products/bTV6XywdD1Yi3VrMIASHaLU9Qn7dzmyCYgB7ui4f.png'
  }
])

// Layer 4: Gunpla & Scale Figures (Matching Screenshot 1 & 2)
const gunplaProducts = ref([
  {
    id: 'gn-1',
    name: 'RG 1/144 Hi-Nu Gundam Bandai Spirits',
    price: 2850.00,
    origPrice: 3200.00,
    discountPercent: 11,
    isBestSeller: true,
    condition: 'Brand New',
    rating: 4.9,
    stock: 3,
    category: 'gunpla',
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'gn-2',
    name: 'MGEX 1/100 Strike Freedom Gundam',
    price: 7500.00,
    origPrice: 8500.00,
    discountPercent: 12,
    isTopPick: true,
    condition: 'Brand New',
    rating: 5.0,
    stock: 2,
    category: 'gunpla',
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'gn-3',
    name: 'Good Smile Company Anime Scale Statue',
    price: 4950.00,
    origPrice: 5500.00,
    discountPercent: 10,
    isNew: true,
    condition: 'Brand New',
    rating: 4.8,
    stock: 5,
    category: 'figures',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80'
  }
])

// Quick View Handler
function handleProductClick(product) {
  selectedProduct.value = product
  isQuickViewOpen.value = true
}

function addToCartFromCard(product, e) {
  if (e) e.stopPropagation()
  cartStore.addToCart({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price / 56.5, // cart store stores USD normalized
    image: product.image,
    condition: product.condition
  })
}

// Interactive Aiko AI Chat in Storefront
const aiInputText = ref('')
const isAiTyping = ref(false)
const aiChatMessages = ref([
  {
    id: 1,
    role: 'assistant',
    text: "Kon'nichiwa, Trainer! ⚡ I am Aiko, your RLG Hobby Concierge. Looking for Japanese Pokémon singles, One Piece booster boxes, Gunpla kits, or active discount codes? Ask me anything!",
    time: 'Just now'
  }
])

const quickAiPrompts = [
  'Check card condition & authenticity',
  'What active coupons can I use?',
  'Do you have Pokémon S4a shiny cards?',
  'Minimum spend for free delivery?'
]

function sendAiMessage(prompt) {
  const text = prompt || aiInputText.value
  if (!text.trim() || isAiTyping.value) return

  aiChatMessages.value.push({
    id: Date.now(),
    role: 'user',
    text: text,
    time: 'Now'
  })
  aiInputText.value = ''
  isAiTyping.value = true

  setTimeout(() => {
    let reply = ''
    const q = text.toLowerCase()
    if (q.includes('coupon') || q.includes('code') || q.includes('promo')) {
      reply = '⚡ You can use code HOBBY10 at checkout for 10% OFF all orders, or GUNPLA20 for 20% OFF Gunpla drops! Free dispatch is automatic for orders over ₱2,500.'
    } else if (q.includes('condition') || q.includes('authentic') || q.includes('mint')) {
      reply = '🛡️ Every Japanese card in our vault is optical-verified via Gemini Multimodal Vision OCR. We guarantee 100% Near Mint/Gem Mint condition with zero binder dings and pack-fresh holo centering.'
    } else if (q.includes('s4a') || q.includes('shiny') || q.includes('pokemon')) {
      reply = '🃏 We have active stock of S4a Shiny Star V and SV4a Shiny Treasure singles including Bunnelby, Boltund V, Bisharp, and Annihilape ex starting from only ₱120!'
    } else if (q.includes('free') || q.includes('shipping') || q.includes('delivery')) {
      reply = '🚚 We offer Free Dispatch nationwide across the Philippines for orders over ₱2,500! Standard metro deliveries arrive within 24-48 hours.'
    } else {
      reply = 'Arigatō for your inquiry! Our Tokyo warehouse dispatches weekly imports. Feel free to browse our Best Selling and TCG Spotlight sections, or click any card for immediate checkout.'
    }

    aiChatMessages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: reply,
      time: 'Just now'
    })
    isAiTyping.value = false
  }, 800)
}

// Staff Support Modal
const staffSubject = ref('Order & Delivery Tracking')
const staffMessage = ref('')
const staffSentSuccess = ref(false)

function sendStaffTicket() {
  if (!staffMessage.value.trim()) return
  staffSentSuccess.value = true
  setTimeout(() => {
    staffSentSuccess.value = false
    staffMessage.value = ''
    isStaffChatOpen.value = false
  }, 2000)
}

function applyCouponCode() {
  cartStore.applyPromo('HOBBY10')
  cartStore.toggleCart()
}

// Desktop & Tablet Storefront State & Pagination
const desktopNavCategories = [
  { id: 'all', name: 'All Collectibles', icon: '🔥', badge: '18' },
  { id: 'tcg', name: 'Pokémon TCG', icon: '🃏', badge: '12' },
  { id: 'gunpla', name: 'Bandai Gunpla', icon: '🤖', badge: '3' },
  { id: 'figures', name: 'Scale Figures', icon: '⚡', badge: '1' }
]

const activeCategoryName = computed(() => {
  switch (activeCategoryFilter.value) {
    case 'tcg': return 'Pokémon TCG'
    case 'gunpla': return 'Bandai Gunpla'
    case 'figures': return 'Scale Figures'
    case 'wishlist': return 'Saved Wishlist'
    default: return 'All Collectibles'
  }
})

const desktopPage = ref(0)
const desktopItemsPerPage = computed(() => isTablet.value ? 3 : 4)

const filteredList = computed(() => {
  let list = [
    ...bestSellingProducts.value, 
    ...topPicksProducts.value, 
    ...tcgSpotlightProducts.value, 
    ...gunplaProducts.value
  ]
  const map = new Map()
  list.forEach(item => {
    if (!map.has(item.id)) map.set(item.id, item)
  })
  let deduped = Array.from(map.values())

  if (activeCategoryFilter.value === 'wishlist') {
    deduped = deduped.filter(p => wishlist.value.has(p.id))
  } else if (activeCategoryFilter.value !== 'all') {
    deduped = deduped.filter(p => p.category === activeCategoryFilter.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    deduped = deduped.filter(p => p.name.toLowerCase().includes(q))
  }
  return deduped
})

const totalDesktopPages = computed(() => {
  return Math.ceil(filteredList.value.length / desktopItemsPerPage.value) || 1
})

const paginatedDesktopProducts = computed(() => {
  const start = desktopPage.value * desktopItemsPerPage.value
  return filteredList.value.slice(start, start + desktopItemsPerPage.value)
})

function nextDesktopPage() {
  if (desktopPage.value < totalDesktopPages.value - 1) {
    desktopPage.value++
  } else {
    desktopPage.value = 0
  }
}

function prevDesktopPage() {
  if (desktopPage.value > 0) {
    desktopPage.value--
  } else {
    desktopPage.value = totalDesktopPages.value - 1
  }
}

function selectCategoryDesktop(catId) {
  activeCategoryFilter.value = catId
  desktopPage.value = 0
}
</script>

<template>
  <div 
    :class="[
      'text-slate-100 rounded-xl overflow-hidden text-left font-sans shadow-inner relative select-none',
      isMobile ? 'flex flex-col w-full space-y-4 pb-20' : 'flex flex-col w-full bg-[#050813]'
    ]"
  >
    <!-- ================= MOBILE APP STOREFRONT (Capacitor PWA Viewport) ================= -->
    <template v-if="isMobile">
      <!-- ================= 1. TOP FLASH ANNOUNCEMENT BAR (MATCHES SCREENSHOT 4) ================= -->
    <div class="bg-[#060a12] text-slate-300 text-[10px] sm:text-xs font-semibold py-1.5 px-3 text-center tracking-wide flex items-center justify-between gap-1.5 border-b border-slate-800 rounded-xl">
      <div class="flex items-center justify-center gap-1.5 truncate flex-1">
        <span class="text-amber-400 shrink-0">⚡</span>
        <span class="truncate">
          WELCOME TO RLG HOBBY SHOP • FREE DISPATCH ON ORDERS OVER ₱2,500 • USE CODE 
          <span class="bg-indigo-950/80 text-amber-300 border border-indigo-500/40 px-1.5 py-0.5 rounded font-mono font-bold text-[9px] sm:text-[10px]">
            HOBBY10
          </span> 
          FOR 10% OFF
        </span>
        <span class="text-amber-400 shrink-0">⚡</span>
      </div>

      <!-- Currency Switcher Badge -->
      <button 
        @click="portfolioStore.toggleCurrency"
        class="px-2 py-0.5 rounded bg-indigo-900/60 hover:bg-indigo-800 text-white font-mono text-[9px] font-bold border border-indigo-500/30 shrink-0 transition-colors"
        title="Toggle Currency"
      >
        {{ portfolioStore.currency }}
      </button>
    </div>

    <!-- ================= 2. MOBILE APP NAVBAR (MATCHES SCREENSHOT 4) ================= -->
    <header class="p-2 sm:p-3 rounded-2xl bg-[#090d16]/95 backdrop-blur-md border border-slate-800/80 flex items-center justify-between gap-2 shadow-lg">
      <!-- Left: Official RLG Online Shop Logo -->
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
          <img 
            src="/logo.png" 
            alt="RLG Online Shop" 
            class="max-w-full max-h-full object-contain"
          />
        </div>
        <div class="hidden sm:block">
          <div class="font-black text-white text-sm leading-tight">
            RLG <span class="text-amber-400">ONLINE SHOP</span>
          </div>
          <div class="text-[9px] text-slate-400 font-medium">TCG • Gunpla • Figures</div>
        </div>
      </div>

      <!-- Right: Action Icons (Search, Wishlist, Cart, Hamburger Menu) -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- Search Button -->
        <button
          @click="isSearchOpen = !isSearchOpen"
          type="button"
          class="w-9 h-9 flex items-center justify-center rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-amber-400 transition-all cursor-pointer shadow-xs active:scale-95"
          title="Search products..."
        >
          <Search class="w-4 h-4 text-slate-300" />
        </button>

        <!-- Wishlist Button -->
        <button
          type="button"
          class="w-9 h-9 relative flex items-center justify-center rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-amber-400 transition-all cursor-pointer shadow-xs active:scale-95"
          title="Wishlist"
        >
          <Heart class="w-4 h-4" :class="wishlist.size > 0 ? 'text-rose-400 fill-rose-400' : 'text-slate-300'" />
          <span 
            v-if="wishlist.size > 0"
            class="absolute -top-1 -right-1 bg-indigo-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
          >
            {{ wishlist.size }}
          </span>
        </button>

        <!-- Cart Trigger Button with Total Count -->
        <button
          @click="cartStore.toggleCart"
          type="button"
          class="w-9 h-9 relative flex items-center justify-center rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white transition-all cursor-pointer shadow-xs active:scale-95"
          title="View Shopping Cart"
        >
          <ShoppingBag class="w-4 h-4 text-slate-200" />
          <span 
            v-if="cartStore.itemCount > 0"
            class="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md shadow-amber-400/30 border border-slate-900"
          >
            {{ cartStore.itemCount }}
          </span>
        </button>

        <!-- Mobile Hamburger Toggle -->
        <button
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          type="button"
          class="w-9 h-9 flex items-center justify-center rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-all cursor-pointer shadow-xs active:scale-95"
          title="Toggle Navigation Menu"
        >
          <Menu class="w-4 h-4 text-slate-300" />
        </button>
      </div>
    </header>

    <!-- Expandable Search Input -->
    <div v-if="isSearchOpen" class="p-2 bg-slate-900/90 rounded-xl border border-indigo-500/30 animate-in fade-in duration-150">
      <div class="relative w-full">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search Pokémon cards, Shiny Star V, Gunpla..."
          class="w-full bg-[#131b2e] border border-indigo-500/20 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          autofocus
        />
        <button 
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Expandable Hamburger Navigation Menu -->
    <div v-if="isMobileMenuOpen" class="p-3 bg-[#090d16] rounded-2xl border border-indigo-500/30 shadow-2xl space-y-2 text-xs animate-in fade-in duration-200">
      <div class="font-bold text-slate-400 text-[10px] uppercase tracking-wider px-2">Navigation Links</div>
      <div class="grid grid-cols-2 gap-1.5">
        <button @click="activeCategoryFilter = 'all'; isMobileMenuOpen = false" class="p-2 rounded-xl bg-slate-900/80 text-left font-semibold text-slate-200 hover:text-amber-300 flex items-center justify-between">
          <span>🏠 Home Store</span>
          <span>&rarr;</span>
        </button>
        <button @click="activeCategoryFilter = 'tcg'; isMobileMenuOpen = false" class="p-2 rounded-xl bg-slate-900/80 text-left font-semibold text-slate-200 hover:text-amber-300 flex items-center justify-between">
          <span>🃏 TCG Cards</span>
          <span>&rarr;</span>
        </button>
        <button @click="activeCategoryFilter = 'gunpla'; isMobileMenuOpen = false" class="p-2 rounded-xl bg-slate-900/80 text-left font-semibold text-slate-200 hover:text-amber-300 flex items-center justify-between">
          <span>🤖 Bandai Gunpla</span>
          <span>&rarr;</span>
        </button>
        <button @click="activeCategoryFilter = 'figures'; isMobileMenuOpen = false" class="p-2 rounded-xl bg-slate-900/80 text-left font-semibold text-slate-200 hover:text-amber-300 flex items-center justify-between">
          <span>⚡ Scale Figures</span>
          <span>&rarr;</span>
        </button>
      </div>
      <div class="pt-2 border-t border-slate-800 flex items-center justify-between px-1 text-[11px] text-slate-400">
        <span>Production Domain:</span>
        <a href="https://rlgonlineshop.com" target="_blank" class="text-amber-400 font-bold hover:underline">rlgonlineshop.com &nearr;</a>
      </div>
    </div>

    <!-- ================= 3. HERO BANNER (MATCHES SCREENSHOT 4) ================= -->
    <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl border border-indigo-500/20 p-5 sm:p-8">
      <!-- Ambient Glows -->
      <div class="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-violet-600/15 blur-3xl pointer-events-none"></div>

      <div class="relative z-10 space-y-4 text-center sm:text-left">
        <!-- Badge -->
        <div class="inline-flex items-center gap-1.5 bg-indigo-950/70 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30 shadow-xs">
          <Sparkles class="w-3 h-3 text-amber-300" />
          <span>RLG HOBBY SHOP • OFFICIAL IMPORTS VAULT</span>
        </div>

        <!-- Headline -->
        <h1 class="text-xl sm:text-3xl font-black tracking-tight leading-[1.2] text-white">
          Build, Collect & Battle. <br />
          <span class="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            Your Premier Hobby Store.
          </span>
        </h1>

        <!-- Subtitle -->
        <p class="text-xs text-slate-300 leading-relaxed max-w-xl mx-auto sm:mx-0">
          Discover factory-sealed Trading Card Game booster boxes, authentic Japanese Bandai Gunpla kits, detailed anime scale figures, and premium card sleeves — shipped securely across the Philippines.
        </p>

        <!-- CTA Buttons (Exact Yellow Pill & Dark Pill) -->
        <div class="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2.5 pt-1">
          <!-- Primary Yellow Pill CTA -->
          <button
            @click="activeCategoryFilter = 'all'"
            type="button"
            class="w-full sm:w-auto px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/25 border border-amber-300 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Explore All Products</span>
            <span>&rarr;</span>
          </button>

          <!-- Secondary Dark Pill CTA (Hobby Matcher) -->
          <button
            @click="isHobbyMatcherOpen = true"
            type="button"
            class="w-full sm:w-auto px-6 py-3 rounded-full bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700 shadow-sm"
          >
            <span>🎯</span>
            <span>Hobby Matcher</span>
          </button>
        </div>

        <!-- Trust Badges & Rating -->
        <div class="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-5 text-[11px] font-semibold text-slate-400">
          <div class="flex items-center gap-1.5">
            <span class="text-amber-400">⭐</span>
            <span class="text-slate-200 font-bold">4.9 / 5</span>
            <span class="text-slate-400">(10,000+ Hobbyists)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-indigo-400">🛡️</span>
            <span>100% Factory Sealed & Mint</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-amber-400">⚡</span>
            <span>Fast PH Dispatch</span>
          </div>
        </div>

        <!-- Pokémon Card Fan Feature Visual (Matching Screenshot 4) -->
        <div class="pt-2 relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900/60 max-h-48 sm:max-h-56">
          <img 
            src="https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=700&auto=format&fit=crop&q=80" 
            alt="Japanese Pokemon Cards Vault"
            class="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500"
          />
          <!-- Floating Badge on Visual -->
          <div class="absolute top-2.5 left-2.5 bg-slate-900/95 backdrop-blur-md text-white rounded-xl px-2.5 py-1.5 shadow-xl border border-slate-700 flex items-center gap-2">
            <span class="text-base">🃏</span>
            <div class="text-left">
              <p class="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">Trading Cards</p>
              <p class="text-[10px] font-bold text-rose-400 leading-tight">Factory Sealed TCG</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 4. DOORZO-STYLE 5 HORIZONTAL CATEGORIES (MATCHES SCREENSHOT 5) ================= -->
    <section class="py-1">
      <div class="grid grid-cols-5 gap-1.5 text-center items-start">
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          @click="handleCategoryClick(cat.id)"
          class="flex flex-col items-center justify-start group cursor-pointer focus:outline-none transition-transform active:scale-95 py-1"
        >
          <!-- Doorzo Squircle Icon Button -->
          <div
            :class="[
              'w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border transition-all duration-200 group-hover:scale-105',
              cat.style,
              activeCategoryFilter === cat.id ? 'ring-2 ring-amber-400 scale-105 shadow-md shadow-amber-400/20' : ''
            ]"
          >
            <span>{{ cat.icon }}</span>
          </div>
          <span 
            :class="[
              'text-[10px] mt-1 font-bold truncate max-w-full block transition-colors',
              activeCategoryFilter === cat.id ? 'text-amber-400' : 'text-slate-300 group-hover:text-white'
            ]"
          >
            {{ cat.name }}
          </span>
        </button>
      </div>
    </section>

    <!-- ================= 5. SLIDABLE PROMOTIONAL BANNER CARD (MATCHES SCREENSHOT 5) ================= -->
    <section class="relative rounded-2xl overflow-hidden border border-indigo-500/30 shadow-xl group">
      <div class="relative aspect-[21/9] sm:aspect-[24/9] w-full bg-slate-950 flex items-center justify-center">
        <img 
          :src="slides[currentSlide].image" 
          :alt="slides[currentSlide].title" 
          class="w-full h-full object-cover transition-opacity duration-300"
        />
        <!-- Slide pagination dots (Matching Screenshot 5) -->
        <div class="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 z-20">
          <button 
            v-for="(s, idx) in slides" 
            :key="s.id"
            @click="currentSlide = idx"
            :class="[
              'transition-all duration-200',
              currentSlide === idx ? 'w-6 h-2 rounded-full bg-amber-400' : 'w-2 h-2 rounded-full bg-white/40'
            ]"
            :title="s.title"
          />
        </div>
      </div>
    </section>

    <!-- ================= 6. 🔥 BEST SELLING SECTION (MATCHES SCREENSHOT 5) ================= -->
    <section class="space-y-3">
      <!-- Section Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-1.5">
            <span class="text-lg">🔥</span>
            <h2 class="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
              Best Selling
            </h2>
          </div>
          <p class="text-[10px] sm:text-xs text-slate-400 font-medium">
            Top-selling collector favorites, sealed boxes, and fan-voted grails
          </p>
        </div>

        <button 
          @click="activeCategoryFilter = 'all'"
          class="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>See All Best Sellers</span>
          <span>&rarr;</span>
        </button>
      </div>

      <!-- 3-Column Dense Grid of ToyCards (Matches Screenshot 5 exactly) -->
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="product in bestSellingProducts"
          :key="product.id"
          @click="handleProductClick(product)"
          class="bg-slate-900/95 rounded-lg p-1 sm:p-1.5 border border-slate-800 hover:border-amber-400/50 flex flex-col justify-between relative group transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-md select-none"
        >
          <!-- Top Image Container with Badges -->
          <div class="relative w-full aspect-square rounded-md overflow-hidden bg-slate-950/40 flex items-center justify-center shrink-0">
            <img 
              :src="product.image" 
              :alt="product.name" 
              class="max-w-full max-h-full object-contain p-1 rounded-md group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />

            <!-- Badges Top-Left: Best Seller + Discount -->
            <div class="absolute top-1 left-1 flex flex-col gap-1 z-10 pointer-events-none">
              <span class="bg-amber-500/90 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-xs">
                <span>🔥</span>
                <span>Best Seller</span>
              </span>
              <span class="bg-rose-600/90 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                -{{ product.discountPercent }}%
              </span>
            </div>

            <!-- Heart Wishlist Icon Top-Right -->
            <button
              @click.stop="toggleWishlist(product.id)"
              type="button"
              class="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-950/70 hover:bg-slate-900 backdrop-blur-xs flex items-center justify-center text-slate-300 hover:text-amber-400 transition-transform active:scale-90 z-10 cursor-pointer border border-white/10"
              title="Add to Wishlist"
            >
              <Heart 
                class="w-3.5 h-3.5 transition-colors" 
                :class="isWishlisted(product.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'"
              />
            </button>
          </div>

          <!-- Card Body -->
          <div class="pt-1.5 pb-0.5 px-0.5 flex flex-col justify-between flex-1 gap-0.5">
            <!-- Title -->
            <h3 class="text-[11px] font-semibold text-slate-100 truncate leading-tight group-hover:text-amber-300 transition-colors">
              {{ product.name }}
            </h3>

            <!-- Price & Secondary Details -->
            <div class="mt-auto pt-0.5">
              <div class="flex items-baseline gap-1 flex-wrap">
                <span class="text-xs font-bold text-amber-300 font-mono tracking-tight">
                  {{ formatPrice(product.price) }}
                </span>
                <span class="text-[9px] text-gray-400 line-through font-mono">
                  {{ formatPrice(product.origPrice) }}
                </span>
              </div>

              <!-- Secondary Details: Near Mint & Rating -->
              <div class="flex items-center justify-between text-[9px] text-gray-400 mt-0.5 font-medium leading-none">
                <span class="truncate max-w-[65px]">{{ product.condition }}</span>
                <span class="text-emerald-400/90 font-medium shrink-0">
                  ★ {{ product.rating.toFixed(1) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 7. ✨ TOP PICKS SECTION (MATCHES SCREENSHOT 3) ================= -->
    <section class="space-y-3">
      <!-- Section Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-1.5">
            <span class="text-lg">✨</span>
            <h2 class="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
              Top Picks
            </h2>
          </div>
          <p class="text-[10px] sm:text-xs text-slate-400 font-medium">
            Hand-picked gems, premium collectibles, and essential hobbyist grails
          </p>
        </div>

        <button 
          @click="activeCategoryFilter = 'all'"
          class="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Explore Top Picks</span>
          <span>&rarr;</span>
        </button>
      </div>

      <!-- 3-Column Dense Grid of Top Pick ToyCards (Matches Screenshot 3) -->
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="product in topPicksProducts"
          :key="product.id"
          @click="handleProductClick(product)"
          class="bg-slate-900/95 rounded-lg p-1 sm:p-1.5 border border-slate-800 hover:border-amber-400/50 flex flex-col justify-between relative group transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-md select-none"
        >
          <!-- Top Image Container with Badges -->
          <div class="relative w-full aspect-square rounded-md overflow-hidden bg-slate-950/40 flex items-center justify-center shrink-0">
            <img 
              :src="product.image" 
              :alt="product.name" 
              class="max-w-full max-h-full object-contain p-1 rounded-md group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />

            <!-- Badges Top-Left: Top Pick + Discount -->
            <div class="absolute top-1 left-1 flex flex-col gap-1 z-10 pointer-events-none">
              <span class="bg-rose-600/90 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                -{{ product.discountPercent }}%
              </span>
              <span class="bg-indigo-600/90 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs flex items-center gap-0.5">
                <span>✨</span>
                <span>Top Pick</span>
              </span>
            </div>

            <!-- Heart Wishlist Icon Top-Right -->
            <button
              @click.stop="toggleWishlist(product.id)"
              type="button"
              class="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-950/70 hover:bg-slate-900 backdrop-blur-xs flex items-center justify-center text-slate-300 hover:text-amber-400 transition-transform active:scale-90 z-10 cursor-pointer border border-white/10"
              title="Add to Wishlist"
            >
              <Heart 
                class="w-3.5 h-3.5 transition-colors" 
                :class="isWishlisted(product.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'"
              />
            </button>
          </div>

          <!-- Card Body -->
          <div class="pt-1.5 pb-0.5 px-0.5 flex flex-col justify-between flex-1 gap-0.5">
            <h3 class="text-[11px] font-semibold text-slate-100 truncate leading-tight group-hover:text-indigo-300 transition-colors">
              {{ product.name }}
            </h3>

            <!-- Price & Secondary Details -->
            <div class="mt-auto pt-0.5">
              <div class="flex items-baseline gap-1 flex-wrap">
                <span class="text-xs font-bold text-amber-300 font-mono tracking-tight">
                  {{ formatPrice(product.price) }}
                </span>
                <span class="text-[9px] text-gray-400 line-through font-mono">
                  {{ formatPrice(product.origPrice) }}
                </span>
              </div>

              <div class="flex items-center justify-between text-[9px] text-gray-400 mt-0.5 font-medium leading-none">
                <span class="truncate max-w-[65px]">{{ product.condition }}</span>
                <span class="text-emerald-400/90 font-medium shrink-0">
                  ★ {{ product.rating.toFixed(1) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 8. COLLECTOR WELCOME COUPON ⚡ BANNER (MATCHES SCREENSHOT 3) ================= -->
    <section class="rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-900 text-white p-5 sm:p-8 shadow-2xl border border-indigo-500/30 text-center space-y-3">
      <!-- Badge -->
      <div>
        <span class="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm inline-block">
          COLLECTOR WELCOME COUPON ⚡
        </span>
      </div>

      <h3 class="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
        Level Up Your Collection: 10% – 20% Off Drops!
      </h3>

      <p class="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
        Apply collector code <span class="text-amber-300 font-bold font-mono">HOBBY10</span> or <span class="text-amber-300 font-bold font-mono">GUNPLA20</span> at checkout on all orders!
      </p>

      <div class="pt-1">
        <button
          @click="applyCouponCode"
          type="button"
          class="px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/25 border border-amber-300 transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
        >
          <span>Shop Deals Now</span>
          <span>&rarr;</span>
        </button>
      </div>
    </section>

    <!-- ================= 9. 🚀 NEW RELEASE SECTION (MATCHES SCREENSHOT 3 BOTTOM) ================= -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <span class="text-lg">🚀</span>
          <h2 class="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
            New Release
          </h2>
        </div>
        <button 
          @click="activeCategoryFilter = 'all'"
          class="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>View All</span>
          <span>&rarr;</span>
        </button>
      </div>
    </section>

    <!-- ================= 10. 🃏 TCG CARDS SPOTLIGHT SECTION (MATCHES SCREENSHOT 1 & 2) ================= -->
    <section class="space-y-3">
      <!-- Section Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-1.5">
            <span class="text-lg">🃏</span>
            <h2 class="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
              Trading Card Games (TCG) Spotlight
            </h2>
          </div>
          <p class="text-[10px] sm:text-xs text-slate-400 font-medium">
            Factory-sealed Pokémon, One Piece, Yu-Gi-Oh! and Weiß Schwarz booster boxes &amp; ETBs
          </p>
        </div>

        <button 
          @click="activeCategoryFilter = 'tcg'"
          class="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Explore All TCG</span>
          <span>&rarr;</span>
        </button>
      </div>

      <!-- 3-Column Dense Grid of TCG Cards (Matches Screenshot 1 & 2) -->
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="product in tcgSpotlightProducts"
          :key="product.id"
          @click="handleProductClick(product)"
          class="bg-slate-900/95 rounded-lg p-1 sm:p-1.5 border border-slate-800 hover:border-amber-400/50 flex flex-col justify-between relative group transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-md select-none"
        >
          <div class="relative w-full aspect-square rounded-md overflow-hidden bg-slate-950/40 flex items-center justify-center shrink-0">
            <img 
              :src="product.image" 
              :alt="product.name" 
              class="max-w-full max-h-full object-contain p-1 rounded-md group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />

            <!-- Badges -->
            <div class="absolute top-1 left-1 flex flex-col gap-1 z-10 pointer-events-none">
              <span class="bg-rose-600/90 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                -{{ product.discountPercent }}%
              </span>
              <span class="bg-indigo-600/90 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs flex items-center gap-0.5">
                <span>✨</span>
                <span>Top Pick</span>
              </span>
            </div>

            <!-- Heart Wishlist -->
            <button
              @click.stop="toggleWishlist(product.id)"
              type="button"
              class="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-950/70 hover:bg-slate-900 backdrop-blur-xs flex items-center justify-center text-slate-300 hover:text-amber-400 transition-transform active:scale-90 z-10 cursor-pointer border border-white/10"
            >
              <Heart 
                class="w-3.5 h-3.5 transition-colors" 
                :class="isWishlisted(product.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'"
              />
            </button>
          </div>

          <div class="pt-1.5 pb-0.5 px-0.5 flex flex-col justify-between flex-1 gap-0.5">
            <h3 class="text-[11px] font-semibold text-slate-100 truncate leading-tight group-hover:text-amber-300 transition-colors">
              {{ product.name }}
            </h3>

            <div class="mt-auto pt-0.5">
              <div class="flex items-baseline gap-1 flex-wrap">
                <span class="text-xs font-bold text-amber-300 font-mono tracking-tight">
                  {{ formatPrice(product.price) }}
                </span>
                <span class="text-[9px] text-gray-400 line-through font-mono">
                  {{ formatPrice(product.origPrice) }}
                </span>
              </div>

              <div class="flex items-center justify-between text-[9px] text-gray-400 mt-0.5 font-medium leading-none">
                <span class="truncate max-w-[65px]">{{ product.condition }}</span>
                <span class="text-emerald-400/90 font-medium shrink-0">
                  ★ {{ product.rating.toFixed(1) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 11. 🤖 GUNPLA & SCALE FIGURES SECTION (MATCHES SCREENSHOT 1 & 2) ================= -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-1.5">
            <span class="text-lg">🤖</span>
            <h2 class="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
              Gunpla Model Kits &amp; Scale Figures
            </h2>
          </div>
          <p class="text-[10px] sm:text-xs text-slate-400 font-medium">
            Authentic Bandai Spirits RG, MG, HG Gundams &amp; Good Smile Company scale statues
          </p>
        </div>

        <button 
          @click="activeCategoryFilter = 'gunpla'"
          class="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Explore Gunpla &amp; Figures</span>
          <span>&rarr;</span>
        </button>
      </div>

      <!-- 3-Column Dense Grid of Gunpla & Figures -->
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="product in gunplaProducts"
          :key="product.id"
          @click="handleProductClick(product)"
          class="bg-slate-900/95 rounded-lg p-1 sm:p-1.5 border border-slate-800 hover:border-amber-400/50 flex flex-col justify-between relative group transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-md select-none"
        >
          <div class="relative w-full aspect-square rounded-md overflow-hidden bg-slate-950/40 flex items-center justify-center shrink-0">
            <img 
              :src="product.image" 
              :alt="product.name" 
              class="max-w-full max-h-full object-cover p-0.5 rounded-md group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />

            <div class="absolute top-1 left-1 flex flex-col gap-1 z-10 pointer-events-none">
              <span v-if="product.isBestSeller" class="bg-amber-500/90 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-xs">
                <span>🔥</span>
                <span>Best Seller</span>
              </span>
              <span v-else-if="product.isTopPick" class="bg-indigo-600/90 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs flex items-center gap-0.5">
                <span>✨</span>
                <span>Top Pick</span>
              </span>
              <span v-else class="bg-emerald-600/90 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                🚀 New
              </span>
            </div>
          </div>

          <div class="pt-1.5 pb-0.5 px-0.5 flex flex-col justify-between flex-1 gap-0.5">
            <h3 class="text-[11px] font-semibold text-slate-100 truncate leading-tight group-hover:text-amber-300 transition-colors">
              {{ product.name }}
            </h3>

            <div class="mt-auto pt-0.5">
              <div class="flex items-baseline gap-1 flex-wrap">
                <span class="text-xs font-bold text-amber-300 font-mono tracking-tight">
                  {{ formatPrice(product.price) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-[9px] text-gray-400 mt-0.5 font-medium leading-none">
                <span class="truncate max-w-[65px]">{{ product.condition }}</span>
                <span class="text-emerald-400/90 font-medium shrink-0">
                  ★ {{ product.rating.toFixed(1) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= 12. ✍️ HOBBY GUIDES & ARTICLES SECTION (MATCHES SCREENSHOT 1 & 2) ================= -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-1.5">
            <span class="text-lg">✍️</span>
            <h2 class="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
              Hobby Guides &amp; Articles
            </h2>
          </div>
          <p class="text-[10px] sm:text-xs text-slate-400 font-medium">
            Tournament meta breakdowns, modeling build tips, and preservation guides from our team
          </p>
        </div>
      </div>

      <!-- Guide Article Card (Matches Screenshot 1 & 2) -->
      <div class="p-3.5 rounded-2xl bg-[#0f172a] border border-indigo-500/20 hover:border-indigo-400/40 transition-all flex flex-col gap-2">
        <div class="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span class="text-indigo-400 font-bold">01 // TCG VAULT</span>
          <span class="text-slate-500">2026-09-20</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded-md bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold">
            TCG STRATEGY
          </span>
          <h4 class="font-bold text-white text-xs sm:text-sm line-clamp-1">
            How to Spot Authentic Japanese Pokémon Cards &amp; S-P Promos
          </h4>
        </div>
        <p class="text-[11px] text-slate-300 line-clamp-2">
          Comprehensive visual verification protocol: analyzing card weight, rosette printing patterns, holographic foil texturing, and optical centering tolerances.
        </p>
      </div>
    </section>

    <!-- ================= 12B. TRUST PILLARS & STOREFOOTER (MATCHES SCREENSHOT 1) ================= -->
    <!-- 4 White Trust Feature Cards (2x2 Grid) -->
    <section class="grid grid-cols-2 gap-2.5 pt-2">
      <!-- Feature 1: Fast Nationwide Shipping -->
      <div class="bg-white text-slate-800 p-3.5 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between space-y-2">
        <div class="text-2xl">🚚</div>
        <div>
          <h4 class="font-extrabold text-xs text-slate-900 leading-tight">Fast Nationwide Shipping</h4>
          <p class="text-[10px] text-slate-500 mt-0.5 leading-snug">Free delivery on orders over ₱2,500</p>
        </div>
      </div>

      <!-- Feature 2: 100% Authentic Imports -->
      <div class="bg-white text-slate-800 p-3.5 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between space-y-2">
        <div class="text-2xl">🛡️</div>
        <div>
          <h4 class="font-extrabold text-xs text-slate-900 leading-tight">100% Authentic Imports</h4>
          <p class="text-[10px] text-slate-500 mt-0.5 leading-snug">Official Bandai, Pokémon &amp; Good Smile</p>
        </div>
      </div>

      <!-- Feature 3: Collector-Grade Packaging -->
      <div class="bg-white text-slate-800 p-3.5 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between space-y-2">
        <div class="text-2xl">📦</div>
        <div>
          <h4 class="font-extrabold text-xs text-slate-900 leading-tight">Collector-Grade Packaging</h4>
          <p class="text-[10px] text-slate-500 mt-0.5 leading-snug">Double-boxed with corner protectors</p>
        </div>
      </div>

      <!-- Feature 4: Collector Guarantee -->
      <div class="bg-white text-slate-800 p-3.5 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between space-y-2">
        <div class="text-2xl">🤝</div>
        <div>
          <h4 class="font-extrabold text-xs text-slate-900 leading-tight">Collector Guarantee</h4>
          <p class="text-[10px] text-slate-500 mt-0.5 leading-snug">Hassle-free support &amp; mint delivery</p>
        </div>
      </div>
    </section>

    <!-- Storefront Mobile Footer (Matches Screenshot 1) -->
    <footer class="pt-6 pb-4 border-t border-slate-800/80 space-y-4">
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
          <img src="/logo.png" alt="RLG Online Shop" class="max-w-full max-h-full object-contain" />
        </div>
        <div class="font-black text-white text-base leading-tight">
          RLG <span class="text-rose-500">ONLINE SHOP</span>
        </div>
      </div>

      <p class="text-xs text-slate-400 leading-relaxed max-w-sm">
        Your premier online hobby shop for factory-sealed TCG booster boxes, authentic Japanese Bandai Gunpla model kits, collectible scale figures, and protective card accessories.
      </p>

      <!-- 3 Category Chips -->
      <div class="flex items-center gap-2 pt-1">
        <button @click="activeCategoryFilter = 'tcg'" class="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sm hover:scale-105 transition-transform" title="TCG">
          🃏
        </button>
        <button @click="activeCategoryFilter = 'gunpla'" class="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sm hover:scale-105 transition-transform" title="Gunpla">
          🤖
        </button>
        <button @click="activeCategoryFilter = 'figures'" class="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sm hover:scale-105 transition-transform" title="Figures">
          🛡️
        </button>
      </div>

      <!-- Hobby Vault Navigation Links -->
      <div class="pt-2 space-y-2">
        <div class="text-[11px] font-black uppercase tracking-wider text-white">HOBBY VAULT</div>
        <div class="space-y-1.5 text-xs text-slate-400 font-medium">
          <div @click="activeCategoryFilter = 'tcg'" class="cursor-pointer hover:text-white transition-colors">TCG Booster Boxes</div>
          <div @click="activeCategoryFilter = 'gunpla'" class="cursor-pointer hover:text-white transition-colors">Gunpla &amp; Model Kits</div>
          <div @click="activeCategoryFilter = 'figures'" class="cursor-pointer hover:text-white transition-colors">Scale Anime Figures</div>
          <div class="cursor-pointer hover:text-white transition-colors">Deck Boxes &amp; Sleeves</div>
          <div class="cursor-pointer hover:text-white transition-colors">Collector Toploaders</div>
        </div>
      </div>
    </footer>
    </template>

    <!-- ================= AUTHENTIC DESKTOP & TABLET STOREFRONT (MATCHES USER SCREENSHOTS) ================= -->
    <template v-else>
      <div class="w-full flex flex-col space-y-6 sm:space-y-8 pb-16 text-slate-100 font-sans">
        
        <!-- 1. TOP FLASH ANNOUNCEMENT BAR (Matches Image 1) -->
        <div class="w-full bg-[#030712] text-slate-300 text-[11px] font-semibold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 border-b border-slate-800/80">
          <span class="text-amber-400">⚡</span>
          <span>WELCOME TO RLG HOBBY SHOP • FREE DISPATCH ON ORDERS OVER ₱2,500 • USE CODE </span>
          <span class="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-mono font-black text-[10px]">HOBBY10</span>
          <span>FOR 10% OFF</span>
          <span class="text-amber-400">⚡</span>
        </div>

        <!-- 2. DESKTOP STOREFRONT HEADER BAR (Matches Image 1) -->
        <header class="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 py-3 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30">
          <!-- Left: Official Logo -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
              <img src="/logo.png" alt="RLG" class="max-w-full max-h-full object-contain" />
            </div>
            <div>
              <div class="text-sm font-black text-white leading-tight">
                RLG <span class="text-amber-400">ONLINE SHOP</span>
              </div>
              <div class="text-[9px] text-slate-400 font-medium">TCG • Gunpla • Figures • Supplies</div>
            </div>
          </div>

          <!-- Center: Horizontal Navigation Links -->
          <nav class="hidden lg:flex items-center gap-1 text-xs font-semibold">
            <button 
              @click="activeCategoryFilter = 'all'" 
              :class="[
                'px-3.5 py-1.5 rounded-full transition-all cursor-pointer',
                activeCategoryFilter === 'all' 
                  ? 'bg-[#1e293b] text-white shadow-xs font-bold' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              ]"
            >
              Home
            </button>
            <button 
              @click="activeCategoryFilter = 'all'" 
              class="px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              All Products
            </button>
            <button 
              @click="activeCategoryFilter = 'tcg'" 
              :class="[
                'px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer',
                activeCategoryFilter === 'tcg' ? 'bg-[#1e293b] text-amber-300 font-bold' : 'text-slate-300 hover:text-white'
              ]"
            >
              <span>🃏 TCG Cards</span>
              <span class="text-[10px] opacity-70">▾</span>
            </button>
            <button 
              @click="activeCategoryFilter = 'gunpla'" 
              :class="[
                'px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer',
                activeCategoryFilter === 'gunpla' ? 'bg-[#1e293b] text-amber-300 font-bold' : 'text-slate-300 hover:text-white'
              ]"
            >
              <span>🤖 Gunpla</span>
            </button>
            <button 
              @click="activeCategoryFilter = 'figures'" 
              :class="[
                'px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer',
                activeCategoryFilter === 'figures' ? 'bg-[#1e293b] text-amber-300 font-bold' : 'text-slate-300 hover:text-white'
              ]"
            >
              <span>⚡ Anime Figures</span>
            </button>
            <button 
              @click="activeCategoryFilter = 'merch'" 
              class="px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <span>🎁 Anime Merchandise</span>
            </button>
            <button 
              @click="activeCategoryFilter = 'plushies'" 
              class="px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <span>🧸 Toys &amp; Plushies</span>
            </button>
            <button 
              @click="activeCategoryFilter = 'all'" 
              class="px-3 py-1.5 rounded-full text-slate-300 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>⚡ Auctions</span>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          </nav>

          <!-- Right: Search, Member Profile, Wishlist, Cart -->
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Search Button -->
            <button 
              @click="isSearchOpen = !isSearchOpen"
              class="w-9 h-9 rounded-full bg-[#131b2e] hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Search"
            >
              <Search class="w-4 h-4" />
            </button>

            <!-- Member Profile Pill -->
            <div class="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#131b2e] border border-slate-700/80 text-xs">
              <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                R
              </div>
              <div class="leading-none text-left">
                <span class="font-bold text-white block text-[11px]">Russel Luis...</span>
                <span class="text-[9px] text-cyan-400 font-mono">MEMBER</span>
              </div>
              <span class="text-slate-500 text-[10px]">▾</span>
            </div>

            <!-- Wishlist Button -->
            <button 
              @click="toggleWishlist('bs-1')"
              class="w-9 h-9 rounded-full bg-[#131b2e] hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-rose-400 transition-colors cursor-pointer relative"
              title="Wishlist"
            >
              <Heart class="w-4 h-4" :class="wishlist.size > 0 ? 'text-rose-400 fill-rose-400' : 'text-slate-300'" />
              <span v-if="wishlist.size > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {{ wishlist.size }}
              </span>
            </button>

            <!-- Cart Trigger Pill with Currency & Amount -->
            <button 
              @click="cartStore.toggleCart"
              class="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-amber-400/20 transition-all cursor-pointer"
            >
              <div class="flex items-center gap-1.5">
                <ShoppingBag class="w-3.5 h-3.5 text-slate-950" />
                <span class="w-4 h-4 rounded-full bg-slate-950 text-amber-300 text-[10px] flex items-center justify-center font-bold">
                  {{ cartStore.itemCount }}
                </span>
              </div>
              <span class="font-mono">{{ formatPrice(cartStore.total) }}</span>
            </button>
          </div>
        </header>

        <!-- MAIN STOREFRONT CONTAINER (Full Width, Centered, Matches Image 1-4) -->
        <div class="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          <!-- 3. HERO BANNER (Matches Image 1 Exactly) -->
          <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b132b] via-[#080d1e] to-[#050813] border border-indigo-500/25 p-6 sm:p-10 lg:p-12 shadow-2xl">
            <!-- Ambient Glow Elements -->
            <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
            <div class="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <!-- Left Column: Copy & CTAs -->
              <div class="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
                <!-- Pill Badge -->
                <div class="inline-flex items-center gap-1.5 bg-indigo-950/80 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                  <Sparkles class="w-3 h-3 text-amber-300" />
                  <span>RLG HOBBY SHOP • OFFICIAL IMPORTS VAULT</span>
                </div>

                <!-- Headline -->
                <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                  Build, Collect &amp; <br />
                  Battle. <br />
                  <span class="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                    Your Premier Hobby Store.
                  </span>
                </h1>

                <!-- Subtitle -->
                <p class="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  Discover factory-sealed Trading Card Game booster boxes, authentic Japanese Bandai Gunpla kits, detailed anime scale figures, and premium card sleeves — shipped securely across the Philippines.
                </p>

                <!-- CTA Buttons -->
                <div class="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    @click="activeCategoryFilter = 'all'"
                    class="px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/25 border border-amber-300 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Explore All Products</span>
                    <span>&rarr;</span>
                  </button>

                  <button
                    @click="isHobbyMatcherOpen = true"
                    class="px-6 py-3 rounded-full bg-[#131b2e] hover:bg-slate-800 active:scale-95 text-slate-200 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer border border-slate-700 shadow-sm"
                  >
                    <span>🎯</span>
                    <span>Hobby Matcher</span>
                  </button>
                </div>

                <!-- Trust Badges Row -->
                <div class="pt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 border-t border-indigo-500/15">
                  <div class="flex items-center gap-1.5">
                    <span class="text-amber-400">★</span>
                    <span class="text-white font-bold">4.9 / 5</span>
                    <span class="text-slate-400">(10,000+ Hobbyists)</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <ShieldCheck class="w-3.5 h-3.5 text-teal-400" />
                    <span class="text-slate-300">100% Factory Sealed &amp; Mint</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-amber-400">⚡</span>
                    <span class="text-slate-300">Fast PH Dispatch</span>
                  </div>
                </div>
              </div>

              <!-- Right Column: Visual Fan Card Cluster (Matches Image 1) -->
              <div class="lg:col-span-5 relative flex items-center justify-center">
                <div class="relative w-72 sm:w-80 h-72 sm:h-80 bg-gradient-to-tr from-[#131b2e]/80 to-[#1e293b]/60 rounded-3xl p-4 border border-indigo-500/30 shadow-2xl flex items-center justify-center">
                  <!-- Decorative Card Fan Array -->
                  <div class="grid grid-cols-2 gap-2.5 w-full h-full p-2">
                    <div class="rounded-xl overflow-hidden bg-slate-950/60 p-2 border border-indigo-500/20 flex flex-col items-center justify-center">
                      <img src="/storage/products/0Wb34Nm2V7UO9oSiB8LJ7XgCpPhtb3wNFV2KlAGw.png" alt="Card" class="w-full h-24 object-contain" />
                      <span class="text-[9px] text-amber-300 font-bold mt-1">S4a Shiny Star V</span>
                    </div>
                    <div class="rounded-xl overflow-hidden bg-slate-950/60 p-2 border border-indigo-500/20 flex flex-col items-center justify-center">
                      <img src="/storage/products/25EjAOVQHiF8J5b4cqtsdJKLCjfv4mE3I4LEgCJo.png" alt="Card" class="w-full h-24 object-contain" />
                      <span class="text-[9px] text-amber-300 font-bold mt-1">Boltund V Secret</span>
                    </div>
                    <div class="rounded-xl overflow-hidden bg-slate-950/60 p-2 border border-indigo-500/20 flex flex-col items-center justify-center">
                      <img src="/storage/products/2hKHz5gqFTfnYk9blD4AnQQA73CDgP3RA2o2YCl7.png" alt="Card" class="w-full h-24 object-contain" />
                      <span class="text-[9px] text-amber-300 font-bold mt-1">Bisharp Holo Foil</span>
                    </div>
                    <div class="rounded-xl overflow-hidden bg-slate-950/60 p-2 border border-indigo-500/20 flex flex-col items-center justify-center">
                      <img src="/storage/products/ruNqPFJtP9Zpdh1n8S0gI8tuClx8fe41h3XxE8Ae.png" alt="Card" class="w-full h-24 object-contain" />
                      <span class="text-[9px] text-amber-300 font-bold mt-1">Cyclizar Shiny AR</span>
                    </div>
                  </div>

                  <!-- Overlay Badges matching Image 1 -->
                  <div class="absolute -top-3 left-3 px-3 py-1 rounded-lg bg-[#090d16] border border-indigo-500/40 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1.5 shadow-lg">
                    <span>🎴 TRADING CARDS: Factory Sealed TCG</span>
                  </div>
                  <div class="absolute -bottom-3 right-3 px-3 py-1 rounded-lg bg-[#090d16] border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1.5 shadow-lg">
                    <span>🤖 MODEL KITS: Bandai Gunpla Imports</span>
                  </div>
                  <div class="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-indigo-950/90 border border-indigo-400/50 text-[9px] font-mono font-bold text-indigo-200 shadow-md">
                    <span>JP DIRECT IMPORT</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 4. SHOP BY HOBBY CATEGORY (Matches Image 1 Exactly) -->
          <section class="space-y-4 text-left">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Shop by Hobby Category
                </h2>
                <p class="text-xs text-slate-400 font-medium">
                  Explore Trading Card Games, Japanese Model Kits, Scale Figures &amp; Supplies
                </p>
              </div>
              <button 
                @click="activeCategoryFilter = 'all'"
                class="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>View All Categories</span>
                <span>&rarr;</span>
              </button>
            </div>

            <!-- 5 Category Cards in a Row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <!-- Card 1: TCG -->
              <div 
                @click="activeCategoryFilter = 'tcg'"
                class="p-4 rounded-2xl bg-[#0c1324] border border-indigo-500/20 hover:border-amber-400/50 transition-all flex flex-col justify-between space-y-3 cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-xl">
                    🃏
                  </div>
                  <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/30 text-indigo-300 group-hover:text-amber-300">
                    EXPLORE →
                  </span>
                </div>
                <div>
                  <h3 class="font-extrabold text-white text-sm group-hover:text-amber-300 transition-colors">
                    TCG (Trading Cards)
                  </h3>
                  <p class="text-[11px] text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    Pokémon, Yu-Gi-Oh!, One Piece, Dragon Ball, Gundam, Hololive &amp; more Japanese Booster Boxes &amp; Singles.
                  </p>
                </div>
                <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span class="text-slate-400">Official Factory Sealed</span>
                  <span class="text-amber-400 font-bold group-hover:translate-x-1 transition-transform">Shop TCG →</span>
                </div>
              </div>

              <!-- Card 2: Gunpla -->
              <div 
                @click="activeCategoryFilter = 'gunpla'"
                class="p-4 rounded-2xl bg-[#0c1324] border border-indigo-500/20 hover:border-amber-400/50 transition-all flex flex-col justify-between space-y-3 cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-2xl bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-xl">
                    🤖
                  </div>
                  <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-950 border border-sky-500/30 text-sky-300 group-hover:text-amber-300">
                    EXPLORE →
                  </span>
                </div>
                <div>
                  <h3 class="font-extrabold text-white text-sm group-hover:text-amber-300 transition-colors">
                    Gunpla &amp; Model Kits
                  </h3>
                  <p class="text-[11px] text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    High Grade (HG), Real Grade (RG), Master Grade (MG), Perfect Grade (PG) &amp; specialized mecha tools.
                  </p>
                </div>
                <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span class="text-slate-400">Official Factory Sealed</span>
                  <span class="text-amber-400 font-bold group-hover:translate-x-1 transition-transform">Shop Gunpla →</span>
                </div>
              </div>

              <!-- Card 3: Anime Figures -->
              <div 
                @click="activeCategoryFilter = 'figures'"
                class="p-4 rounded-2xl bg-[#0c1324] border border-indigo-500/20 hover:border-amber-400/50 transition-all flex flex-col justify-between space-y-3 cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-xl">
                    ⚡
                  </div>
                  <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/30 text-amber-300 group-hover:text-amber-300">
                    EXPLORE →
                  </span>
                </div>
                <div>
                  <h3 class="font-extrabold text-white text-sm group-hover:text-amber-300 transition-colors">
                    Anime Figures
                  </h3>
                  <p class="text-[11px] text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    Scale statues, Nendoroids, Pop Up Parade, action figures &amp; articulated battle poses from top studios.
                  </p>
                </div>
                <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span class="text-slate-400">Official Factory Sealed</span>
                  <span class="text-amber-400 font-bold group-hover:translate-x-1 transition-transform">Shop Anime →</span>
                </div>
              </div>

              <!-- Card 4: Anime Merchandise -->
              <div 
                @click="activeCategoryFilter = 'merch'"
                class="p-4 rounded-2xl bg-[#0c1324] border border-indigo-500/20 hover:border-amber-400/50 transition-all flex flex-col justify-between space-y-3 cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-xl">
                    🎁
                  </div>
                  <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500/30 text-rose-300 group-hover:text-amber-300">
                    EXPLORE →
                  </span>
                </div>
                <div>
                  <h3 class="font-extrabold text-white text-sm group-hover:text-amber-300 transition-colors">
                    Anime Merchandise
                  </h3>
                  <p class="text-[11px] text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    Authentic plushies, die-cast Pokéballs, collector pin badges, keychains, apparel &amp; trainer accessories.
                  </p>
                </div>
                <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span class="text-slate-400">Official Factory Sealed</span>
                  <span class="text-amber-400 font-bold group-hover:translate-x-1 transition-transform">Shop Merch →</span>
                </div>
              </div>

              <!-- Card 5: Toys & Plushies -->
              <div 
                @click="activeCategoryFilter = 'plushies'"
                class="p-4 rounded-2xl bg-[#0c1324] border border-indigo-500/20 hover:border-amber-400/50 transition-all flex flex-col justify-between space-y-3 cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div class="flex items-center justify-between">
                  <div class="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-xl">
                    🧸
                  </div>
                  <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300 group-hover:text-amber-300">
                    EXPLORE →
                  </span>
                </div>
                <div>
                  <h3 class="font-extrabold text-white text-sm group-hover:text-amber-300 transition-colors">
                    Toys &amp; Plushies
                  </h3>
                  <p class="text-[11px] text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    Cuddly plushies, Nesoberi, squish pillows, capsule toys, Gachapon, blind boxes &amp; novelty imports.
                  </p>
                </div>
                <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span class="text-slate-400">Official Factory Sealed</span>
                  <span class="text-amber-400 font-bold group-hover:translate-x-1 transition-transform">Shop Toys →</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 5. SLIDABLE PROMOTIONAL BANNER (Matches Image 2 Exactly) -->
          <section class="relative rounded-3xl overflow-hidden border border-indigo-500/30 shadow-2xl group">
            <div class="relative aspect-[21/9] sm:aspect-[24/8] w-full bg-slate-950 flex items-center justify-center">
              <img 
                :src="slides[currentSlide].image" 
                :alt="slides[currentSlide].title" 
                class="w-full h-full object-cover transition-opacity duration-300"
              />
              <!-- Slide pagination dots -->
              <div class="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20">
                <button 
                  v-for="(s, idx) in slides" 
                  :key="s.id"
                  @click="currentSlide = idx"
                  :class="[
                    'transition-all duration-200 cursor-pointer',
                    currentSlide === idx ? 'w-8 h-2 rounded-full bg-amber-400' : 'w-2 h-2 rounded-full bg-white/40'
                  ]"
                />
              </div>
            </div>
          </section>

          <!-- 6. 🔥 BEST SELLING SECTION (Matches Image 2 Exactly: 5-Column Grid, 10 Items) -->
          <section class="space-y-4 text-left">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xl">🔥</span>
                  <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Best Selling
                  </h2>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300">
                    HIGH DEMAND
                  </span>
                </div>
                <p class="text-xs text-slate-400 font-medium mt-0.5">
                  Top-selling collector favorites, sealed boxes, and fan-voted grails
                </p>
              </div>

              <button 
                @click="activeCategoryFilter = 'all'"
                class="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>See All Best Sellers</span>
                <span>&rarr;</span>
              </button>
            </div>

            <!-- 5-Column Grid of 10 Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              <div
                v-for="product in bestSellingProducts.slice(0, 10)"
                :key="product.id"
                @click="handleProductClick(product)"
                class="bg-[#0c1324] rounded-2xl p-2.5 border border-indigo-500/20 hover:border-amber-400/50 flex flex-col justify-between relative group transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                <!-- Image Container with Badges & Wishlist -->
                <div class="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-950/60 flex items-center justify-center shrink-0">
                  <img 
                    :src="product.image" 
                    :alt="product.name" 
                    class="max-w-full max-h-full object-contain p-2 rounded-xl group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  <!-- Badges Top-Left -->
                  <div class="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10 pointer-events-none">
                    <span class="bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                      <span>🔥 Best Seller</span>
                    </span>
                    <span class="bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                      -{{ product.discountPercent }}%
                    </span>
                  </div>

                  <!-- Wishlist Heart Top-Right -->
                  <button
                    @click.stop="toggleWishlist(product.id)"
                    class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-950/80 hover:bg-slate-900 flex items-center justify-center text-slate-300 hover:text-amber-400 transition-transform active:scale-90 z-10 cursor-pointer border border-white/10"
                    title="Add to Wishlist"
                  >
                    <Heart 
                      class="w-3.5 h-3.5 transition-colors" 
                      :class="isWishlisted(product.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'"
                    />
                  </button>
                </div>

                <!-- Product Details -->
                <div class="pt-2 pb-1 space-y-1 flex-1 flex flex-col justify-between text-left">
                  <h3 class="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors leading-tight">
                    {{ product.name }}
                  </h3>

                  <div class="pt-1 flex items-baseline justify-between gap-1">
                    <div class="flex items-baseline gap-1">
                      <span class="text-xs sm:text-sm font-black text-amber-300 font-mono">
                        {{ formatPrice(product.price) }}
                      </span>
                      <span class="text-[9px] text-slate-500 line-through font-mono">
                        {{ formatPrice(product.origPrice) }}
                      </span>
                    </div>

                    <button
                      @click="addToCartFromCard(product, $event)"
                      class="px-2 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] flex items-center gap-0.5 transition-all shadow-xs cursor-pointer active:scale-95"
                      title="Add to Cart"
                    >
                      <Plus class="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/80">
                    <span class="truncate">{{ product.condition }}</span>
                    <span class="text-emerald-400 font-bold">★ {{ product.rating.toFixed(1) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 7. ✨ TOP PICKS SECTION (Matches Image 3 Exactly: 5-Column Grid, 10 Items) -->
          <section class="space-y-4 text-left">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xl">✨</span>
                  <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Top Picks
                  </h2>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">
                    STAFF CURATED
                  </span>
                </div>
                <p class="text-xs text-slate-400 font-medium mt-0.5">
                  Hand-picked gems, premium collectibles, and essential hobbyist grails
                </p>
              </div>

              <button 
                @click="activeCategoryFilter = 'all'"
                class="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Explore Top Picks</span>
                <span>&rarr;</span>
              </button>
            </div>

            <!-- 5-Column Grid of 10 Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              <div
                v-for="product in topPicksProducts.slice(0, 10)"
                :key="product.id"
                @click="handleProductClick(product)"
                class="bg-[#0c1324] rounded-2xl p-2.5 border border-indigo-500/20 hover:border-amber-400/50 flex flex-col justify-between relative group transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                <!-- Image Container with Badges & Wishlist -->
                <div class="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-950/60 flex items-center justify-center shrink-0">
                  <img 
                    :src="product.image" 
                    :alt="product.name" 
                    class="max-w-full max-h-full object-contain p-2 rounded-xl group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  <!-- Badges Top-Left -->
                  <div class="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10 pointer-events-none">
                    <span class="bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                      <span>✨ Top Pick</span>
                    </span>
                    <span class="bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                      -{{ product.discountPercent }}%
                    </span>
                  </div>

                  <!-- Wishlist Heart Top-Right -->
                  <button
                    @click.stop="toggleWishlist(product.id)"
                    class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-950/80 hover:bg-slate-900 flex items-center justify-center text-slate-300 hover:text-amber-400 transition-transform active:scale-90 z-10 cursor-pointer border border-white/10"
                    title="Add to Wishlist"
                  >
                    <Heart 
                      class="w-3.5 h-3.5 transition-colors" 
                      :class="isWishlisted(product.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'"
                    />
                  </button>
                </div>

                <!-- Product Details -->
                <div class="pt-2 pb-1 space-y-1 flex-1 flex flex-col justify-between text-left">
                  <h3 class="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors leading-tight">
                    {{ product.name }}
                  </h3>

                  <div class="pt-1 flex items-baseline justify-between gap-1">
                    <div class="flex items-baseline gap-1">
                      <span class="text-xs sm:text-sm font-black text-amber-300 font-mono">
                        {{ formatPrice(product.price) }}
                      </span>
                      <span class="text-[9px] text-slate-500 line-through font-mono">
                        {{ formatPrice(product.origPrice) }}
                      </span>
                    </div>

                    <button
                      @click="addToCartFromCard(product, $event)"
                      class="px-2 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] flex items-center gap-0.5 transition-all shadow-xs cursor-pointer active:scale-95"
                      title="Add to Cart"
                    >
                      <Plus class="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/80">
                    <span class="truncate">{{ product.condition }}</span>
                    <span class="text-emerald-400 font-bold">★ {{ product.rating.toFixed(1) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 8. COLLECTOR WELCOME COUPON BANNER (Matches Image 3 Exactly) -->
          <section class="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950 via-[#101935] to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl text-left">
            <div class="space-y-2">
              <span class="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold bg-amber-950/70 border border-amber-500/30 px-3 py-1 rounded-full">
                COLLECTOR WELCOME COUPON ⚡
              </span>
              <h3 class="text-xl sm:text-2xl font-black text-white tracking-tight">
                Level Up Your Collection: 10% – 20% Off Drops!
              </h3>
              <p class="text-xs text-slate-300 max-w-xl">
                Apply collector code <code class="text-amber-300 font-bold font-mono">HOBBY10</code> or <code class="text-amber-300 font-bold font-mono">GUNPLA20</code> at checkout on all orders!
              </p>
            </div>

            <button
              @click="applyCouponCode"
              class="px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/25 transition-all cursor-pointer shrink-0"
            >
              <span>Shop Deals Now →</span>
            </button>
          </section>

          <!-- 9. 🚀 NEW RELEASE SECTION (Matches Image 3 Exactly) -->
          <section class="space-y-4 text-left">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xl">🚀</span>
                  <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">
                    New Release
                  </h2>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                    JUST LANDED
                  </span>
                </div>
                <p class="text-xs text-slate-400 font-medium mt-0.5">
                  Fresh shipments from Japan &amp; official distributors — latest card sets &amp; first-run model kits
                </p>
              </div>

              <button 
                @click="activeCategoryFilter = 'all'"
                class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>View All New Releases</span>
                <span>&rarr;</span>
              </button>
            </div>

            <!-- 5-Column Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              <div
                v-for="product in tcgSpotlightProducts.slice(0, 5)"
                :key="product.id"
                @click="handleProductClick(product)"
                class="bg-[#0c1324] rounded-2xl p-2.5 border border-indigo-500/20 hover:border-amber-400/50 flex flex-col justify-between relative group transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                <div class="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-950/60 flex items-center justify-center shrink-0">
                  <img 
                    :src="product.image" 
                    :alt="product.name" 
                    class="max-w-full max-h-full object-contain p-2 rounded-xl group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div class="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10 pointer-events-none">
                    <span class="bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                      New Drop
                    </span>
                  </div>
                </div>

                <div class="pt-2 pb-1 space-y-1 flex-1 flex flex-col justify-between text-left">
                  <h3 class="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors leading-tight">
                    {{ product.name }}
                  </h3>

                  <div class="pt-1 flex items-baseline justify-between gap-1">
                    <span class="text-xs sm:text-sm font-black text-amber-300 font-mono">
                      {{ formatPrice(product.price) }}
                    </span>
                    <button
                      @click="addToCartFromCard(product, $event)"
                      class="px-2 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] flex items-center gap-0.5 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <Plus class="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 10. 🤖 GUNPLA MODEL KITS & SCALE FIGURES SECTION (Matches Image 4) -->
          <section class="space-y-4 text-left">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xl">🤖</span>
                  <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Gunpla Model Kits &amp; Scale Figures
                  </h2>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                    AUTHENTIC BANDAI &amp; GSC
                  </span>
                </div>
                <p class="text-xs text-slate-400 font-medium mt-0.5">
                  Authentic Bandai Spirits RG, MG, HG Gundams &amp; Good Smile Company scale statues
                </p>
              </div>

              <button 
                @click="activeCategoryFilter = 'gunpla'"
                class="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Explore Gunpla &amp; Figures</span>
                <span>&rarr;</span>
              </button>
            </div>

            <!-- 3 Gunpla / Figure Cards Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div
                v-for="product in gunplaProducts"
                :key="product.id"
                @click="handleProductClick(product)"
                class="bg-[#0c1324] rounded-2xl p-4 border border-indigo-500/20 hover:border-cyan-400/50 flex flex-col justify-between relative group transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md text-left"
              >
                <div class="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950/60 flex items-center justify-center shrink-0">
                  <img 
                    :src="product.image" 
                    :alt="product.name" 
                    class="max-w-full max-h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div class="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                    <span class="bg-cyan-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      Bandai Spirits
                    </span>
                  </div>
                </div>

                <div class="pt-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 class="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {{ product.name }}
                    </h3>
                    <div class="flex items-center justify-between text-xs text-slate-400 mt-1">
                      <span>{{ product.condition }}</span>
                      <span class="text-emerald-400 font-bold">★ {{ product.rating.toFixed(1) }}</span>
                    </div>
                  </div>

                  <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div class="text-base font-black text-amber-300 font-mono">
                        {{ formatPrice(product.price) }}
                      </div>
                      <div class="text-[10px] text-slate-500 line-through font-mono">
                        {{ formatPrice(product.origPrice) }}
                      </div>
                    </div>

                    <button
                      @click="addToCartFromCard(product, $event)"
                      class="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <Plus class="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 11. 📰 HOBBY GUIDES & ARTICLES (Matches Image 4 Exactly) -->
          <section class="space-y-4 text-left">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xl">📰</span>
                  <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Hobby Guides &amp; Articles
                  </h2>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">
                    COMMUNITY JOURNAL
                  </span>
                </div>
                <p class="text-xs text-slate-400 font-medium mt-0.5">
                  Tournament meta breakdowns, modeling build tips, and preservation guides from our team
                </p>
              </div>
            </div>

            <!-- 2 Journal Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Article 1 -->
              <div class="p-5 rounded-2xl bg-[#0c1324] border border-indigo-500/20 hover:border-indigo-400/50 transition-all space-y-3 cursor-pointer group shadow-sm">
                <div class="flex items-center justify-between text-[10px] text-slate-400">
                  <span class="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                    TCG STRATEGY
                  </span>
                  <span class="font-mono">2026-09-28</span>
                </div>
                <h3 class="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                  Top 5 One Piece Card Game Meta Decks in OP-07 Egghead
                </h3>
                <p class="text-xs text-slate-300 leading-relaxed">
                  A deep dive into Yellow Vegapunk, Blue Doflamingo, and Green Bonney tournament tier lists.
                </p>
                <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span class="text-slate-400 text-[11px]">By <strong>Chief Deck Architect</strong></span>
                  <span class="text-indigo-400 font-bold group-hover:translate-x-1 transition-transform">Read Article →</span>
                </div>
              </div>

              <!-- Article 2 -->
              <div class="p-5 rounded-2xl bg-[#0c1324] border border-indigo-500/20 hover:border-indigo-400/50 transition-all space-y-3 cursor-pointer group shadow-sm">
                <div class="flex items-center justify-between text-[10px] text-slate-400">
                  <span class="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30 font-bold uppercase">
                    GUNPLA &amp; MODELING
                  </span>
                  <span class="font-mono">2026-09-15</span>
                </div>
                <h3 class="text-base font-extrabold text-white group-hover:text-sky-300 transition-colors">
                  Beginner Guide: Essential Tools for Building Your First RG Gunpla
                </h3>
                <p class="text-xs text-slate-300 leading-relaxed">
                  Single blade nippers, sanding sponges, panel lining markers, and topcoat finishes explained.
                </p>
                <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span class="text-slate-400 text-[11px]">By <strong>Master Builder Ken</strong></span>
                  <span class="text-sky-400 font-bold group-hover:translate-x-1 transition-transform">Read Article →</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 12. 4 TRUST BADGES IN A ROW (Matches Image 4 Exactly) -->
          <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div class="p-4 rounded-2xl bg-[#0c1324] border border-indigo-500/20 flex items-center gap-3 text-left">
              <div class="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                🚚
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">Fast Nationwide Shipping</h4>
                <p class="text-[10px] text-slate-400 mt-0.5">Free delivery on orders over ₱2,500</p>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-[#0c1324] border border-indigo-500/20 flex items-center gap-3 text-left">
              <div class="w-10 h-10 rounded-xl bg-teal-950/60 border border-teal-500/30 flex items-center justify-center text-xl shrink-0">
                🛡️
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">100% Authentic Imports</h4>
                <p class="text-[10px] text-slate-400 mt-0.5">Official Bandai, Pokémon &amp; Good Smile</p>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-[#0c1324] border border-indigo-500/20 flex items-center gap-3 text-left">
              <div class="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
                📦
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">Collector-Grade Packaging</h4>
                <p class="text-[10px] text-slate-400 mt-0.5">Double-boxed with corner protectors</p>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-[#0c1324] border border-indigo-500/20 flex items-center gap-3 text-left">
              <div class="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-xl shrink-0">
                🤝
              </div>
              <div>
                <h4 class="text-xs font-bold text-white">Collector Guarantee</h4>
                <p class="text-[10px] text-slate-400 mt-0.5">Hassle-free support &amp; mint delivery</p>
              </div>
            </div>
          </section>

          <!-- 13. STOREFRONT FOOTER (Matches Image 4 Exactly) -->
          <footer class="pt-8 border-t border-slate-800 text-left text-xs space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <!-- Column 1: Brand Info -->
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center">
                    <img src="/logo.png" alt="RLG" class="w-full h-full object-contain" />
                  </div>
                  <span class="font-black text-white text-sm">RLG <span class="text-amber-400">ONLINE SHOP</span></span>
                </div>
                <p class="text-[11px] text-slate-400 leading-relaxed">
                  Your premier online hobby shop for factory-sealed TCG booster boxes, authentic Japanese Bandai Gunpla model kits, collectible scale figures, and protective card accessories.
                </p>
                <div class="flex items-center gap-2 text-slate-500 text-sm">
                  <span>🎴</span>
                  <span>🤖</span>
                  <span>🛡️</span>
                </div>
              </div>

              <!-- Column 2: Hobby Vault Links -->
              <div class="space-y-2">
                <h4 class="font-black text-white text-xs uppercase tracking-wider">HOBBY VAULT</h4>
                <ul class="space-y-1.5 text-[11px] text-slate-400">
                  <li @click="activeCategoryFilter = 'tcg'" class="cursor-pointer hover:text-white transition-colors">TCG Booster Boxes</li>
                  <li @click="activeCategoryFilter = 'gunpla'" class="cursor-pointer hover:text-white transition-colors">Gunpla &amp; Model Kits</li>
                  <li @click="activeCategoryFilter = 'figures'" class="cursor-pointer hover:text-white transition-colors">Scale Anime Figures</li>
                  <li class="cursor-pointer hover:text-white transition-colors">Deck Boxes &amp; Sleeves</li>
                  <li class="cursor-pointer hover:text-white transition-colors">Collector Toploaders</li>
                </ul>
              </div>

              <!-- Column 3: Collector Care Links -->
              <div class="space-y-2">
                <h4 class="font-black text-white text-xs uppercase tracking-wider">COLLECTOR CARE</h4>
                <ul class="space-y-1.5 text-[11px] text-slate-400">
                  <li class="cursor-pointer hover:text-white transition-colors">Track Order Dispatch</li>
                  <li class="cursor-pointer hover:text-white transition-colors">Saved Wishlist</li>
                  <li class="cursor-pointer hover:text-white transition-colors">About Our Vault</li>
                  <li class="cursor-pointer hover:text-white transition-colors">Terms &amp; Authenticity</li>
                  <li class="cursor-pointer hover:text-white transition-colors">Privacy Policy</li>
                  <li class="cursor-pointer hover:text-white transition-colors">Collector FAQs</li>
                  <li @click="portfolioStore.setDemoMode('admin')" class="cursor-pointer text-amber-400 font-bold hover:underline">
                    Staff Portal • Login
                  </li>
                </ul>
              </div>

              <!-- Column 4: VIP Club Newsletter -->
              <div class="space-y-3">
                <h4 class="font-black text-white text-xs uppercase tracking-wider">COLLECTOR VIP CLUB</h4>
                <p class="text-[11px] text-slate-400">
                  Get priority notifications on rare booster box restocks and new Gunpla pre-orders.
                </p>
                <div class="space-y-2">
                  <input
                    type="email"
                    placeholder="collector@hobby.com"
                    class="w-full bg-[#131b2e] border border-indigo-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    class="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors shadow-md shadow-amber-400/20 cursor-pointer"
                  >
                    <span>Get 10% Off Code ⚡</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Copyright bar -->
            <div class="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500">
              <p>© 2026 RLG Hobby Shop. All brand trademarks belong to their respective owners.</p>
              <p>RLG Hobby Shop • Built with ⚡ Vue 3, PrimeVue &amp; Tailwind</p>
            </div>
          </footer>

        </div>
      </div>
    </template>

    <!-- ================= 13. DUAL FLOATING LAUNCHERS DOCK + AIKO TOOLTIP (MATCHES ALL SCREENSHOTS) ================= -->
    <div class="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2.5">
      
      <!-- Aiko AI Tooltip Bubble (Matches Screenshots 4 & 5) -->
      <Transition
        enter-active-class="transition duration-200 ease-out transform"
        enter-from-class="opacity-0 translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-150 ease-in transform"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-2 scale-95"
      >
        <div
          v-if="showAikoTooltip"
          class="max-w-[240px] sm:max-w-[280px] p-3 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-indigo-500/40 text-left shadow-2xl relative"
        >
          <div class="flex items-center justify-between pb-1">
            <div class="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
              <Sparkles class="w-3.5 h-3.5 text-amber-300" />
              <span>Aiko AI Assistant</span>
            </div>
            <button 
              @click.stop="showAikoTooltip = false"
              class="text-slate-500 hover:text-slate-300 text-xs p-0.5"
            >
              ✕
            </button>
          </div>
          <p class="text-[11px] leading-relaxed text-slate-300">
            Need help checking live stock counts, Japanese imports, or active coupons? Chat with me!
          </p>
        </div>
      </Transition>

      <!-- Dual Floating Circular Launchers (Matches Screenshots 1 to 5) -->
      <div class="flex items-center gap-3">
        <!-- Launcher 1: Message Staff (Blue Glowing Circle) -->
        <button
          @click="isStaffChatOpen = true"
          type="button"
          class="w-12 h-12 rounded-full bg-slate-950 p-1 border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-lg text-white cursor-pointer"
          title="Message Staff Support"
        >
          <span>💬</span>
        </button>

        <!-- Launcher 2: Ask Aiko AI (Magenta/Purple Glowing Circle) -->
        <button
          @click="isAiChatOpen = true; showAikoTooltip = false"
          type="button"
          class="w-12 h-12 rounded-full bg-slate-950 p-1 border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-lg text-white cursor-pointer"
          title="Chat with Aiko AI Assistant"
        >
          <span>✨</span>
        </button>
      </div>

    </div>

    <!-- ================= 14. AIKO AI CONCIERGE CHAT DIALOG ================= -->
    <div
      v-if="isAiChatOpen"
      class="fixed inset-x-3 bottom-16 sm:inset-auto sm:right-6 sm:bottom-20 sm:w-[380px] h-[520px] max-h-[85vh] rounded-3xl bg-[#090d16] border border-rose-500/40 shadow-2xl flex flex-col justify-between overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Chat Header -->
      <div class="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-rose-500/30 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 via-purple-600 to-amber-400 p-0.5 flex items-center justify-center text-sm shadow-md">
            <span>✨</span>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h4 class="font-bold text-white text-xs">Aiko AI Concierge</h4>
              <span class="text-[9px] font-bold px-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live
              </span>
            </div>
            <p class="text-[10px] text-slate-400">Warehouse Stocks &amp; Coupons</p>
          </div>
        </div>
        <button 
          @click="isAiChatOpen = false" 
          class="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Messages Stream -->
      <div class="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        <div
          v-for="msg in aiChatMessages"
          :key="msg.id"
          :class="[
            'flex flex-col',
            msg.role === 'user' ? 'items-end' : 'items-start'
          ]"
        >
          <div 
            :class="[
              'p-3 rounded-2xl max-w-[85%] leading-relaxed shadow-sm',
              msg.role === 'user' 
                ? 'bg-rose-600 text-white rounded-br-xs' 
                : 'bg-[#131b2e] border border-indigo-500/30 text-slate-200 rounded-bl-xs'
            ]"
          >
            {{ msg.text }}
          </div>
          <span class="text-[9px] text-slate-500 mt-0.5 px-1">{{ msg.time }}</span>
        </div>

        <div v-if="isAiTyping" class="flex items-center gap-1 text-[11px] text-rose-400 italic">
          <Sparkles class="w-3.5 h-3.5 animate-spin" />
          <span>Aiko is analyzing inventory database...</span>
        </div>
      </div>

      <!-- Quick Prompt Chips -->
      <div class="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center gap-1.5 overflow-x-auto text-[10px]">
        <button
          v-for="p in quickAiPrompts"
          :key="p"
          @click="sendAiMessage(p)"
          class="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-amber-400 transition-colors shrink-0"
        >
          {{ p }}
        </button>
      </div>

      <!-- Input Bar -->
      <div class="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <input 
          v-model="aiInputText"
          @keydown.enter="sendAiMessage()"
          type="text" 
          placeholder="Ask Aiko about cards, Gunpla, or coupons..."
          class="flex-1 bg-[#131b2e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
        />
        <button
          @click="sendAiMessage()"
          class="w-8 h-8 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md shrink-0 transition-transform active:scale-95"
        >
          <Send class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- ================= 15. STAFF SUPPORT CHAT DIALOG ================= -->
    <div
      v-if="isStaffChatOpen"
      class="fixed inset-x-3 bottom-16 sm:inset-auto sm:right-6 sm:bottom-20 sm:w-[380px] rounded-3xl bg-[#090d16] border border-indigo-500/40 shadow-2xl p-4 z-50 animate-in fade-in duration-200 text-xs space-y-3"
    >
      <div class="flex items-center justify-between border-b border-slate-800 pb-2">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
            💬
          </div>
          <div>
            <h4 class="font-bold text-white text-xs">Message Staff Support</h4>
            <span class="text-[9px] text-slate-400">Direct Collector Inquiries</span>
          </div>
        </div>
        <button @click="isStaffChatOpen = false" class="text-slate-400 hover:text-white">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div v-if="staffSentSuccess" class="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-center space-y-1">
        <div class="text-emerald-400 font-bold text-sm">✓ Message Dispatched!</div>
        <p class="text-[11px] text-slate-300">A support representative will respond to your registered collector email shortly.</p>
      </div>

      <div v-else class="space-y-2">
        <div>
          <label class="text-[10px] text-slate-400 font-semibold block mb-1">Subject Inquiries</label>
          <select v-model="staffSubject" class="w-full bg-[#131b2e] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white">
            <option>Order &amp; Delivery Tracking</option>
            <option>Japanese Card Authenticity Inquiry</option>
            <option>Pre-Order Allocation (Pokémon / One Piece)</option>
            <option>Custom Gunpla Sourcing Request</option>
          </select>
        </div>

        <div>
          <label class="text-[10px] text-slate-400 font-semibold block mb-1">Your Message</label>
          <textarea 
            v-model="staffMessage"
            rows="3" 
            placeholder="Describe your inquiry..."
            class="w-full bg-[#131b2e] border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
          ></textarea>
        </div>

        <button
          @click="sendStaffTicket"
          class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
        >
          <span>Send to Support</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>

    <!-- ================= 16. HOBBY MATCHER RECOMMENDATION POPUP ================= -->
    <div
      v-if="isHobbyMatcherOpen"
      class="fixed inset-x-4 top-20 sm:inset-auto sm:right-10 sm:top-24 sm:w-[360px] p-4 rounded-3xl bg-[#090d16] border border-amber-400/50 shadow-2xl z-50 space-y-3 animate-in fade-in duration-200 text-xs"
    >
      <div class="flex items-center justify-between border-b border-slate-800 pb-2">
        <div class="flex items-center gap-2">
          <span class="text-base">🎯</span>
          <h4 class="font-bold text-white text-xs">AI Hobby Matcher</h4>
        </div>
        <button @click="isHobbyMatcherOpen = false" class="text-slate-400 hover:text-white">
          <X class="w-4 h-4" />
        </button>
      </div>

      <p class="text-[11px] text-slate-300">
        Looking to start collecting? Tell us your preference:
      </p>

      <div class="grid grid-cols-2 gap-2">
        <button 
          @click="activeCategoryFilter = 'tcg'; isHobbyMatcherOpen = false"
          class="p-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-left hover:border-amber-400 transition-colors"
        >
          <div class="font-bold text-white">🃏 Singles &amp; SAR</div>
          <div class="text-[9px] text-slate-400 mt-0.5">High-grade Japanese foils from ₱120</div>
        </button>
        <button 
          @click="activeCategoryFilter = 'gunpla'; isHobbyMatcherOpen = false"
          class="p-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-left hover:border-amber-400 transition-colors"
        >
          <div class="font-bold text-white">🤖 Real Grade Gunpla</div>
          <div class="text-[9px] text-slate-400 mt-0.5">Bandai Spirits Hi-Nu &amp; Freedom</div>
        </button>
      </div>
    </div>

    <!-- ================= 17. QUICK PRODUCT DETAIL MODAL ================= -->
    <div
      v-if="isQuickViewOpen && selectedProduct"
      class="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      @click="isQuickViewOpen = false"
    >
      <div 
        @click.stop
        class="bg-[#0f172a] border border-indigo-500/40 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-left"
      >
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider">
            Product Inspection
          </span>
          <button @click="isQuickViewOpen = false" class="text-slate-400 hover:text-white">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-2 flex items-center justify-center">
          <img 
            :src="selectedProduct.image" 
            :alt="selectedProduct.name" 
            class="max-w-full max-h-full object-contain"
          />
        </div>

        <div>
          <h3 class="font-bold text-white text-sm sm:text-base leading-snug">
            {{ selectedProduct.name }}
          </h3>
          <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              {{ selectedProduct.condition }}
            </span>
            <span>★ {{ selectedProduct.rating }} Rating</span>
            <span class="ml-auto font-mono text-slate-500">Stock: {{ selectedProduct.stock }}</span>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-400 font-mono">Price:</div>
            <div class="text-lg font-black text-amber-300 font-mono">
              {{ formatPrice(selectedProduct.price) }}
            </div>
          </div>

          <button
            @click="addToCartFromCard(selectedProduct); isQuickViewOpen = false"
            class="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md shadow-amber-400/25 flex items-center gap-1.5 transition-all"
          >
            <Plus class="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Embedded Cart Drawer Component -->
    <CartDrawer />

  </div>
</template>
