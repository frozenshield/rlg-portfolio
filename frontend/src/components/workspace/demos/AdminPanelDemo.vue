<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '../../../stores/inventoryStore'
import { usePortfolioStore } from '../../../stores/portfolioStore'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  PlusCircle, 
  Gavel, 
  Users, 
  Megaphone, 
  Globe2, 
  BarChart3, 
  Settings, 
  ExternalLink, 
  LogOut, 
  Sparkles, 
  Upload, 
  Check, 
  Copy, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  FileDown, 
  FileUp, 
  Plus, 
  Minus, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  DollarSign, 
  Heart, 
  Eye, 
  ShieldCheck, 
  Truck, 
  Menu, 
  X,
  Tag,
  Share2,
  FileText,
  Radio,
  Lock,
  ArrowRight,
  Smartphone,
  Monitor
} from 'lucide-vue-next'

const inventoryStore = useInventoryStore()
const portfolioStore = usePortfolioStore()

// Active section inside the Admin Panel
// 'dashboard' | 'orders' | 'inventory' | 'products' | 'auctions' | 'customers' | 'marketing' | 'cms' | 'analytics' | 'settings'
const currentAdminSection = ref('dashboard')

// Mobile / Tablet drawer state
const isSidebarOpen = ref(false)

// Timeframe selector from Image 1
const timeframe = ref('week') // 'today' | 'week' | 'month'

// Orders filter from Image 2
const orderStatusFilter = ref('All')
const orderSearchQuery = ref('')

// Inventory search from Image 3
const inventorySearchQuery = ref('')

// Product Upload form state from Image 4
const uploadForm = ref({
  title: '',
  description: '',
  sku: 'TCG-P01-SV4A-099',
  condition: 'Brand New Factory Sealed',
  stock: 12,
  geminiAutoActive: true,
  pricePhp: 3850,
  weight: 350,
  length: 14,
  width: 14,
  height: 4,
  status: 'Draft',
  isScheduled: false,
  primaryCategory: 'TCG (Trading Cards)',
  subCategory: 'Pokémon TCG Booster Boxes',
  brand: 'The Pokémon Company (Tokyo)',
  tags: 'Booster Box, Japanese, Limited Edition, Scarlet & Violet',
  imageUrl: ''
})

const isUploadingImage = ref(false)
const showUploadSuccess = ref(false)

// Auctions Filter from Image 1 (New)
const auctionFilter = ref('All')

// CRM Filter from Image 2 (New)
const crmSegmentFilter = ref('All')
const crmSearchQuery = ref('')

// Marketing SEO state from Image 3 (New)
const seoForm = ref({
  pageType: 'Homepage (Storefront Root)',
  focusKeyword: 'One Piece TCG Philippines',
  metaTitle: 'RLG Hobby Shop | TCG, Model Kits & Collectibles Philippines',
  metaDescription: 'Shop authentic factory-sealed Pokémon & One Piece TCG booster boxes, Japanese Gunpla kits, and scale anime figures with secure nationwide shipping in PH.',
  canonicalUrl: 'https://rlgonlineshop.com',
  keywordsCloud: 'Pokemon TCG Philippines, One Piece Card Game, Gunpla Manila, Bandai Model Kits, Anime Figures, TCG Booster',
  previewMode: 'desktop' // 'desktop' | 'mobile'
})
const isSeoGenerating = ref(false)
const showSeoSaved = ref(false)

// CMS Banners state from Image 4 (New)
const heroBanner = ref({
  headline: 'Build, Collect & Battle. Your Premier Hobby Store.',
  badge: 'RLG HOBBY SHOP • OFFICIAL IMPORTS VAULT',
  subtitle: 'Discover factory-sealed Trading Card Game booster boxes, authentic Japanese Bandai Gunpla kits, detailed anime scale figures, and premium card sleeves — shipped securely across the Philippines.',
  ctaText: 'Explore All Products',
  ctaLink: '/catalog',
  imageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=700&auto=format&fit=crop&q=80',
  isVisible: true
})

const promoBanner = ref({
  headline: 'Level Up Your Collection: 10% - 20% Off Drops!',
  badge: 'Collector Welcome Coupon ⚡',
  subtitle: 'Apply collector code HOBBY10 or GUNPLA20 at checkout on all orders!',
  ctaText: 'Shop Deals Now',
  ctaLink: '/catalog',
  imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=700&auto=format&fit=crop&q=80',
  isVisible: true
})
const showBannerSaved = ref(false)

// Analytics Timeframe from Image 5 (New)
const analyticsRange = ref('30D')

// Telemetry metrics based on timeframe from Image 1
const metrics = computed(() => {
  if (timeframe.value === 'today') {
    return {
      revenue: '₱42,500.00',
      orders: '8 Orders',
      aov: '₱5,312.50',
      cartItems: '14 Items',
      favourites: '3 Saved',
      visitors: '12',
      trendRev: '+14.2%',
      trendOrd: '+8.4%'
    }
  } else if (timeframe.value === 'week') {
    return {
      revenue: '₱592,400.00',
      orders: '142 Orders',
      aov: '₱4,171.83',
      cartItems: '38 Items',
      favourites: '19 Saved',
      visitors: '84',
      trendRev: '+18.4%',
      trendOrd: '+12.7%'
    }
  } else {
    return {
      revenue: '₱1,284,500.00',
      orders: '310 Orders',
      aov: '₱4,143.55',
      cartItems: '94 Items',
      favourites: '45 Saved',
      visitors: '260',
      trendRev: '+31.8%',
      trendOrd: '+22.5%'
    }
  }
})

// Top Performing Products from Image 1
const topProducts = [
  {
    rank: '#1',
    name: 'One Piece OP-05 Awakening of the New Era',
    meta: '94 units dispatched • 31% store share',
    revenue: '₱414,000.00',
    trending: 'Trending High'
  },
  {
    rank: '#2',
    name: 'Pokémon TCG 151 Elite Trainer Box',
    meta: '78 units dispatched • 24% store share',
    revenue: '₱218,322.00',
    trending: 'Trending High'
  },
  {
    rank: '#3',
    name: 'Hololive OCG Blooming Radiance Booster Box',
    meta: '55 units dispatched • 17% store share',
    revenue: '₱221,200.00',
    trending: 'Trending High'
  },
  {
    rank: '#4',
    name: 'RG 1/144 RX-78-2 Gundam Ver. 2.0 Kit',
    meta: '42 units dispatched • 13% store share',
    revenue: '₱107,100.00',
    trending: 'Trending High'
  }
]

// Acquisition channels from Image 1
const acquisitionChannels = [
  { name: 'Facebook TCG & Gunpla Philippines', percent: 68, visits: '4.8K OK', type: 'Primary Channel' },
  { name: 'Google Organic Search ("RLG Hobby...")', percent: 85, visits: '6.2K OK', type: 'Primary Channel' },
  { name: 'YouTube Hobbyist Unboxing & Guides', percent: 74, visits: '5.4K OK', type: 'Primary Channel' },
  { name: 'Direct & Bookmark Collectors', percent: 92, visits: '11.4K OK', type: 'Primary Channel' }
]

// Authentic Inventory Table items from Image 3
const inventoryItems = ref([
  {
    id: 1,
    sku: 'TCG-P01-SV4A-233-G',
    barcode: '4521329394811',
    name: 'Pokémon TCG Frosmoth Shiny Rare Sv4a 233/190 Shiny Treasure ex',
    category: 'TCG (Trading Card)',
    sellingPrice: 250.00,
    costPrice: 175.00,
    marginPct: '30%',
    marginAmount: '+₱75.00',
    stock: 5,
    status: 'Low (x5)',
    vendor: 'The Pokémon Company',
    leadTime: '7 days lead',
    image: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    sku: 'TCG-P01-SV4A-202',
    barcode: '4521329394828',
    name: 'Pokémon TCG Revavroom 202/190 S Shiny Treasures Japanese',
    category: 'TCG (Trading Card)',
    sellingPrice: 250.00,
    costPrice: 175.00,
    marginPct: '30%',
    marginAmount: '+₱75.00',
    stock: 3,
    status: 'Low (x3)',
    vendor: 'The Pokémon Company',
    leadTime: '7 days lead',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 3,
    sku: 'TCG-P01-SV4A-200',
    barcode: '4521329394835',
    name: 'Abomasnow (Shiny Holo) 200/190 S - Pokémon Card Shiny Treasure',
    category: 'TCG (Trading Card)',
    sellingPrice: 250.00,
    costPrice: 175.00,
    marginPct: '30%',
    marginAmount: '+₱75.00',
    stock: 2,
    status: 'Low (x2)',
    vendor: 'The Pokémon Company',
    leadTime: '7 days lead',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 4,
    sku: 'TCG-P01-SV4A-219',
    barcode: '4521329394842',
    name: 'Pokémon TCG Japanese Electrode Shiny Rare (219/190 S) Shiny Treasure',
    category: 'TCG (Trading Card)',
    sellingPrice: 250.00,
    costPrice: 175.00,
    marginPct: '30%',
    marginAmount: '+₱75.00',
    stock: 8,
    status: 'In Stock',
    vendor: 'The Pokémon Company',
    leadTime: '7 days lead',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 5,
    sku: 'TCG-P01-SV4A-201',
    barcode: '4521329394859',
    name: 'Dratini (Shiny / Master Ball Mirror Holo) - Sv4a 201/190',
    category: 'TCG (Trading Card)',
    sellingPrice: 350.00,
    costPrice: 220.00,
    marginPct: '37%',
    marginAmount: '+₱130.00',
    stock: 4,
    status: 'Low (x4)',
    vendor: 'The Pokémon Company',
    leadTime: '7 days lead',
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 6,
    sku: 'TCG-P01-SV4A-240',
    barcode: '4521329394866',
    name: 'Pokémon Card Game - Dreepy Shiny Holo Sv4a 240/190',
    category: 'TCG (Trading Card)',
    sellingPrice: 180.00,
    costPrice: 120.00,
    marginPct: '33%',
    marginAmount: '+₱60.00',
    stock: 12,
    status: 'In Stock',
    vendor: 'The Pokémon Company',
    leadTime: '7 days lead',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=120&auto=format&fit=crop&q=80'
  }
])

// Orders from Image 2
const ordersList = ref([
  {
    id: 'ORD-9821',
    date: 'Oct 7, 2026 09:30 PM',
    customer: 'Kenji Takahashi',
    address: 'Tokyo, Japan (DHL Express)',
    items: 'Charizard VSTAR SAR #212/S-P (x1)',
    total: '₱5,200.00',
    payment: 'Credit Card (Stripe)',
    status: 'Paid',
    tracking: 'DHL-984210948',
    action: 'Print Slip'
  },
  {
    id: 'ORD-9820',
    date: 'Oct 7, 2026 08:45 PM',
    customer: 'Miguel Santos',
    address: 'Quezon City, Metro Manila',
    items: 'Pokémon Sulit God Pack Bundle (x2)',
    total: '₱4,950.00',
    payment: 'GCash Instant',
    status: 'In Transit',
    tracking: 'LBC-PH84920491',
    action: 'Track'
  },
  {
    id: 'ORD-9819',
    date: 'Oct 7, 2026 07:15 PM',
    customer: 'Sarah Jenkins',
    address: 'Makati City, Metro Manila',
    items: 'One Piece OP-01 Romance Dawn Box (x1)',
    total: '₱10,500.00',
    payment: 'Bank Transfer (BDO)',
    status: 'Processing',
    tracking: 'Awaiting Pickup',
    action: 'Dispatch'
  },
  {
    id: 'ORD-9818',
    date: 'Oct 7, 2026 05:20 PM',
    customer: 'Christian Ramos',
    address: 'Cebu City, Central Visayas',
    items: 'Pikachu Illustrator Foil Promo (x1)',
    total: '₱14,100.00',
    payment: 'Maya Pay',
    status: 'Delivered',
    tracking: 'J&T-948201948',
    action: 'Invoice'
  }
])

// CRM Customers from Image 2 (New)
const crmCustomers = ref([
  {
    id: 1,
    name: 'Admin Chief',
    email: 'admin@rlgonlineshop.com',
    location: 'Metro Manila, PH',
    segment: 'Regular',
    ltv: '₱0.00',
    ordersCount: 0,
    lastActive: '2026-10-06'
  },
  {
    id: 2,
    name: 'Test User',
    email: 'test@example.com',
    location: 'Manila +63 900 000 0000',
    segment: 'Regular',
    ltv: '₱0.00',
    ordersCount: 0,
    lastActive: '2026-10-05'
  },
  {
    id: 3,
    name: 'Russel Luis Gemonilao',
    email: 'russel.luis@gmail.com',
    location: 'Quezon City +63 912 345 6789',
    segment: 'Regular',
    ltv: '₱0.00',
    ordersCount: 0,
    lastActive: '2026-10-05'
  }
])

// Category Share from Image 5 (New)
const categoryShareData = [
  { name: 'TCG (Trading Cards)', revenue: '₱1,800.00 (38%)', units: '3 units moved' },
  { name: 'Gunpla', revenue: '₱1,800.00 (38%)', units: '3 units moved' },
  { name: 'Anime Figures', revenue: '₱1,000.00 (15%)', units: '2 units moved' },
  { name: 'Anime Merch Collectibles', revenue: '₱1,000.00 (15%)', units: '2 units moved' },
  { name: 'Toys & Plushies', revenue: '₱600.00 (6%)', units: '1 units moved' }
]

const filteredOrders = computed(() => {
  let list = ordersList.value
  if (orderStatusFilter.value !== 'All') {
    list = list.filter(o => o.status === orderStatusFilter.value)
  }
  if (orderSearchQuery.value.trim()) {
    const q = orderSearchQuery.value.toLowerCase()
    list = list.filter(o => o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.items.toLowerCase().includes(q))
  }
  return list
})

const filteredInventory = computed(() => {
  let list = inventoryItems.value
  if (inventorySearchQuery.value.trim()) {
    const q = inventorySearchQuery.value.toLowerCase()
    list = list.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
  }
  return list
})

const filteredCrm = computed(() => {
  let list = crmCustomers.value
  if (crmSegmentFilter.value !== 'All') {
    list = list.filter(c => c.segment === crmSegmentFilter.value)
  }
  if (crmSearchQuery.value.trim()) {
    const q = crmSearchQuery.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.location.toLowerCase().includes(q))
  }
  return list
})

function adjustStock(item, delta) {
  item.stock = Math.max(0, item.stock + delta)
}

function handleSaveProduct() {
  if (!uploadForm.value.title) return
  showUploadSuccess.value = true
  setTimeout(() => {
    showUploadSuccess.value = false
    currentAdminSection.value = 'inventory'
  }, 1500)
}

function handleSimulatedGeminiIntake() {
  isUploadingImage.value = true
  setTimeout(() => {
    uploadForm.value.title = 'Pokémon TCG: Terastal Festivities High Class Booster Box [s12a]'
    uploadForm.value.description = 'Factory sealed Japanese High Class Pack containing 10 booster packs. Guaranteed 1x Secret Rare or SAR per box. Mint condition shrink wrap.'
    uploadForm.value.sku = 'TCG-P01-SV8A-001'
    uploadForm.value.pricePhp = 4250
    uploadForm.value.condition = 'Brand New Factory Sealed'
    uploadForm.value.stock = 16
    uploadForm.value.imageUrl = 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&auto=format&fit=crop&q=80'
    isUploadingImage.value = false
  }, 800)
}

function generateAiSeo() {
  isSeoGenerating.value = true
  setTimeout(() => {
    seoForm.value.metaTitle = 'One Piece TCG & Japanese Pokémon Cards Philippines | RLG Shop'
    seoForm.value.metaDescription = 'Buy 100% authentic Japanese Pokémon TCG booster boxes, One Piece Card Game singles, and mystery bundles in Manila. Fast courier delivery nationwide.'
    isSeoGenerating.value = false
  }, 900)
}

function saveSeo() {
  showSeoSaved.value = true
  setTimeout(() => {
    showSeoSaved.value = false
  }, 2500)
}

function saveBanners() {
  showBannerSaved.value = true
  setTimeout(() => {
    showBannerSaved.value = false
  }, 2500)
}

// Quick helper to switch sections and close mobile drawer
function switchSection(sec) {
  currentAdminSection.value = sec
  isSidebarOpen.value = false
}
</script>

<template>
  <div class="min-h-[750px] bg-[#f1f5f9] text-slate-800 rounded-xl overflow-hidden flex flex-col md:flex-row text-left font-sans shadow-inner relative">
    
    <!-- Mobile Backdrop Drawer -->
    <div 
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="md:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-xs"
    />

    <!-- ================= ACTUAL LEFT SIDEBAR (Dark navy #090d16) ================= -->
    <aside 
      :class="[
        'w-64 bg-[#090d16] text-slate-400 p-4 shrink-0 flex flex-col justify-between border-r border-slate-800 transition-all z-40',
        'md:flex md:static md:translate-x-0',
        isSidebarOpen ? 'fixed inset-y-0 left-0 translate-x-0 shadow-2xl flex' : 'hidden -translate-x-full'
      ]"
    >
      <div class="space-y-5">
        <!-- Brand Header from Image 1 -->
        <div class="flex items-center justify-between px-2 py-1">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
              R
            </div>
            <div>
              <h1 class="text-xs font-black text-white tracking-wider uppercase leading-none">
                RLG ONLINE SHOP
              </h1>
              <span class="text-[9px] text-slate-400 tracking-tight block mt-0.5">Command Center</span>
            </div>
          </div>

          <!-- Close drawer button for mobile -->
          <button @click="isSidebarOpen = false" class="md:hidden text-slate-400 hover:text-white p-1">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Sidebar Navigation List: ALL 10 MODULES from the Screenshots -->
        <nav class="space-y-1 text-xs font-semibold">
          <!-- 1. Dashboard -->
          <button
            @click="switchSection('dashboard')"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all',
              currentAdminSection === 'dashboard'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <LayoutDashboard class="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </button>

          <!-- 2. Orders -->
          <button
            @click="switchSection('orders')"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all',
              currentAdminSection === 'orders'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <ShoppingBag class="w-4 h-4" />
              <span>Orders</span>
            </div>
          </button>

          <!-- 3. Inventory & Stock (badge Low) -->
          <button
            @click="switchSection('inventory')"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all',
              currentAdminSection === 'inventory'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <Package class="w-4 h-4" />
              <span>Inventory & Stock</span>
            </div>
            <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
              Low
            </span>
          </button>

          <!-- 4. Product Catalog (badge New) -->
          <button
            @click="switchSection('products')"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all',
              currentAdminSection === 'products'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <PlusCircle class="w-4 h-4" />
              <span>Product Catalog</span>
            </div>
            <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              New
            </span>
          </button>

          <!-- 5. Auctions & Bidding (badge Live) -->
          <button
            @click="switchSection('auctions')"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all',
              currentAdminSection === 'auctions'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <Gavel class="w-4 h-4" />
              <span>Auctions & Bidding</span>
            </div>
            <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-pink-950 text-pink-300 border border-pink-800">
              Live
            </span>
          </button>

          <!-- 6. Customers & CRM -->
          <button
            @click="switchSection('customers')"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all',
              currentAdminSection === 'customers'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <Users class="w-4 h-4" />
              <span>Customers & CRM</span>
            </div>
          </button>

          <!-- 7. Marketing & Promos -->
          <button
            @click="switchSection('marketing')"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all',
              currentAdminSection === 'marketing'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <Megaphone class="w-4 h-4" />
              <span>Marketing & Promos</span>
            </div>
          </button>

          <!-- 8. CMS & Storefront -->
          <button
            @click="switchSection('cms')"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all',
              currentAdminSection === 'cms'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <Globe2 class="w-4 h-4" />
              <span>CMS & Storefront</span>
            </div>
          </button>

          <!-- 9. Analytics & Reports -->
          <button
            @click="switchSection('analytics')"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all',
              currentAdminSection === 'analytics'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <BarChart3 class="w-4 h-4" />
              <span>Analytics & Reports</span>
            </div>
          </button>

          <!-- 10. Settings & Config -->
          <button
            @click="switchSection('settings')"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all',
              currentAdminSection === 'settings'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <Settings class="w-4 h-4" />
              <span>Settings & Config</span>
            </div>
          </button>
        </nav>
      </div>

      <!-- Bottom Profile -->
      <div class="pt-3 border-t border-slate-800/80">
        <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div class="w-7 h-7 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
            A
          </div>
          <div class="truncate text-left flex-1 min-w-0">
            <span class="text-xs font-bold text-white block truncate">Admin Chief</span>
            <span class="text-[9px] text-slate-400 block truncate">Super Admin (Unrestricted)</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- ================= RIGHT WORKSPACE AREA ================= -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f1f5f9]">
      
      <!-- Top Header Bar -->
      <header class="h-14 px-4 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div class="flex items-center gap-2 text-xs">
          <!-- Mobile / Tablet Hamburger Button -->
          <button 
            @click="isSidebarOpen = !isSidebarOpen"
            class="md:hidden p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            title="Toggle Admin Sidebar"
          >
            <Menu class="w-4 h-4" />
          </button>
          
          <span class="text-slate-400 font-medium">Admin</span>
          <span class="text-slate-400">/</span>
          <span class="font-bold text-slate-800 capitalize">
            {{ currentAdminSection === 'products' ? 'Products' : currentAdminSection }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Switch to Storefront Button -->
          <button
            @click="portfolioStore.setDemoMode('storefront')"
            class="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 flex items-center gap-1 transition-colors"
          >
            <span>Live Storefront</span>
            <ExternalLink class="w-3 h-3 text-slate-400" />
          </button>

          <!-- Add Product Button -->
          <button
            @click="switchSection('products')"
            class="px-2.5 sm:px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
          >
            <Plus class="w-3 h-3" />
            <span class="hidden sm:inline">+ Add Product</span>
            <span class="sm:hidden">+ Product</span>
          </button>
        </div>
      </header>

      <!-- Scrollable Main Content Area -->
      <main class="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto space-y-6">
        
        <!-- ================= VIEW 1: DASHBOARD (From Image 1) ================= -->
        <div v-if="currentAdminSection === 'dashboard'" class="space-y-6">
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 mb-1">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                LIVE STORE TELEMETRY • LIVE STOREFRONT SESSIONS (30M ROLLING WINDOW)
              </div>
              <h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Executive Command Center
              </h2>
              <p class="text-xs text-slate-500">
                Real-time overview of revenue, operations, fulfillment, and customer traffic.
              </p>
            </div>

            <!-- Timeframe Toggle Buttons -->
            <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto text-xs font-bold">
              <button
                @click="timeframe = 'today'"
                :class="[
                  'px-2.5 sm:px-3 py-1.5 rounded-lg transition-all',
                  timeframe === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                ]"
              >
                Today
              </button>
              <button
                @click="timeframe = 'week'"
                :class="[
                  'px-2.5 sm:px-3 py-1.5 rounded-lg transition-all',
                  timeframe === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                ]"
              >
                This Week
              </button>
              <button
                @click="timeframe = 'month'"
                :class="[
                  'px-2.5 sm:px-3 py-1.5 rounded-lg transition-all',
                  timeframe === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                ]"
              >
                This Month
              </button>
            </div>
          </div>

          <!-- 6 Core Metric Cards -->
          <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <div class="flex items-center justify-between text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                <span>TOTAL REVENUE</span>
                <span>💰</span>
              </div>
              <div class="text-base sm:text-lg font-black text-slate-900">{{ metrics.revenue }}</div>
              <p class="text-[9px] text-emerald-600 font-bold">↑ {{ metrics.trendRev }} vs prev</p>
            </div>

            <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <div class="flex items-center justify-between text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                <span>TOTAL ORDERS</span>
                <span>📦</span>
              </div>
              <div class="text-base sm:text-lg font-black text-slate-900">{{ metrics.orders }}</div>
              <p class="text-[9px] text-indigo-600 font-bold">↑ {{ metrics.trendOrd }} velocity</p>
            </div>

            <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <div class="flex items-center justify-between text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                <span>AVG ORDER (AOV)</span>
                <span>🏷️</span>
              </div>
              <div class="text-base sm:text-lg font-black text-slate-900">{{ metrics.aov }}</div>
              <p class="text-[9px] text-rose-600 font-bold">↑ +₱420 bundle lift</p>
            </div>

            <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <div class="flex items-center justify-between text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                <span>TOTAL IN CART</span>
                <span>🛒</span>
              </div>
              <div class="text-base sm:text-lg font-black text-slate-900">{{ metrics.cartItems }}</div>
              <p class="text-[9px] text-sky-600 font-bold">3 active baskets</p>
            </div>

            <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <div class="flex items-center justify-between text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                <span>IN FAVOURITES</span>
                <span>❤️</span>
              </div>
              <div class="text-base sm:text-lg font-black text-slate-900">{{ metrics.favourites }}</div>
              <p class="text-[9px] text-pink-600 font-bold">Wishlist demand</p>
            </div>

            <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
              <div class="flex items-center justify-between text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                <span>ACTIVE VISITORS</span>
                <span>👤</span>
              </div>
              <div class="text-base sm:text-lg font-black text-slate-900">{{ metrics.visitors }}</div>
              <p class="text-[9px] text-emerald-600 font-bold">● 0 in checkout</p>
            </div>
          </div>

          <!-- 3 Operational Alerts -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="p-3.5 rounded-2xl bg-[#fffbeb] border border-[#fef3c7] flex items-start gap-2.5 text-xs">
              <span class="text-base">⏳</span>
              <div>
                <span class="font-bold text-slate-900 block">Pending Orders (0 Needs Review)</span>
                <p class="text-[11px] text-slate-600 mt-0.5">Orders pending payment or require manual COD confirmation.</p>
              </div>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#fef2f2] border border-[#fee2e2] flex items-start gap-2.5 text-xs">
              <span class="text-base">⚠️</span>
              <div>
                <span class="font-bold text-slate-900 block">Low Stock Warnings (21 SKU Critical)</span>
                <p class="text-[11px] text-slate-600 mt-0.5">Top Gunpla kits and TCG VSTAR boxes need urgent replenishment!</p>
              </div>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#f0f9ff] border border-[#e0f2fe] flex items-start gap-2.5 text-xs">
              <span class="text-base">💬</span>
              <div>
                <span class="font-bold text-slate-900 block">Customer Inquiries (0 Unread)</span>
                <p class="text-[11px] text-slate-600 mt-0.5">Pre-order questions and tracking inquiries awaiting response.</p>
              </div>
            </div>
          </div>

          <!-- Products & Referrers Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 class="font-black text-slate-900 text-xs sm:text-sm">TOP PERFORMING PRODUCTS</h3>
                <button @click="switchSection('inventory')" class="text-xs font-bold text-rose-600 hover:text-rose-700">Manage →</button>
              </div>
              <div class="space-y-2.5">
                <div v-for="item in topProducts" :key="item.rank" class="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50">
                  <div class="truncate">
                    <span class="font-bold text-slate-900 text-xs block truncate">{{ item.rank }} {{ item.name }}</span>
                    <span class="text-[10px] text-slate-400 block">{{ item.meta }}</span>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="text-xs font-black text-slate-900 block">{{ item.revenue }}</span>
                    <span class="text-[9px] font-bold text-rose-600 block">{{ item.trending }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 class="font-black text-slate-900 text-xs sm:text-sm pb-2 border-b border-slate-100">TOP ACQUISITION REFERRERS</h3>
              <div class="space-y-3">
                <div v-for="ref in acquisitionChannels" :key="ref.name" class="space-y-1">
                  <div class="flex items-center justify-between text-xs font-semibold">
                    <span class="text-slate-800 truncate max-w-[200px]">{{ ref.name }}</span>
                    <span class="text-[10px] text-slate-500 font-mono">{{ ref.visits }}</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-gradient-to-r from-rose-500 to-pink-500 h-full rounded-full" :style="{ width: `${ref.percent}%` }" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= VIEW 2: ORDERS (From Image 2) ================= -->
        <div v-else-if="currentAdminSection === 'orders'" class="space-y-5">
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h2 class="text-lg sm:text-xl font-black text-slate-900">Order Lifecycle & Fulfillment</h2>
              <p class="text-xs text-slate-500">Track statuses, print packing slips, attach courier tracking, and issue refunds.</p>
            </div>
            <span class="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Total: {{ filteredOrders.length }}</span>
          </div>

          <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div class="flex flex-col sm:flex-row items-center gap-3">
              <div class="relative flex-1 w-full">
                <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input v-model="orderSearchQuery" type="text" placeholder="Search by order ID, customer name..." class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none" />
              </div>
              <div class="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 text-xs font-bold">
                <button v-for="st in ['All', 'Pending', 'Processing', 'Shipped', 'In Transit', 'Delivered']" :key="st" @click="orderStatusFilter = st" :class="['px-2.5 py-1 rounded-lg shrink-0', orderStatusFilter === st ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600']">{{ st }}</button>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th class="py-3 px-3">ORDER ID</th>
                    <th class="py-3 px-3">CUSTOMER</th>
                    <th class="py-3 px-3">ITEMS</th>
                    <th class="py-3 px-3">TOTAL</th>
                    <th class="py-3 px-3">STATUS</th>
                    <th class="py-3 px-3">TRACKING</th>
                    <th class="py-3 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-mono font-bold text-rose-600">{{ order.id }}</td>
                    <td class="py-3 px-3 font-bold text-slate-900">{{ order.customer }}</td>
                    <td class="py-3 px-3 text-slate-700">{{ order.items }}</td>
                    <td class="py-3 px-3 font-black">{{ order.total }}</td>
                    <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">{{ order.status }}</span></td>
                    <td class="py-3 px-3 font-mono text-[11px] text-slate-500">{{ order.tracking }}</td>
                    <td class="py-3 px-3 text-right"><button class="px-2.5 py-1 rounded bg-slate-900 text-white font-bold text-[10px]">{{ order.action }}</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ================= VIEW 3: INVENTORY (From Image 3) ================= -->
        <div v-else-if="currentAdminSection === 'inventory'" class="space-y-5">
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-lg sm:text-xl font-black text-slate-900">Inventory & Stock Control</h2>
              <p class="text-xs text-slate-500">Real-time SKU monitoring, variant matrices, vendor lead times, and bulk CSV updates.</p>
            </div>
            <div class="flex items-center gap-2">
              <button class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">Refresh Stock</button>
              <button class="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold">Import CSV</button>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th class="py-3 px-3">SKU & BARCODE</th>
                    <th class="py-3 px-3">PRODUCT</th>
                    <th class="py-3 px-3">PRICE / COST</th>
                    <th class="py-3 px-3">MARGIN</th>
                    <th class="py-3 px-3">STOCK</th>
                    <th class="py-3 px-3">VENDOR</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="item in filteredInventory" :key="item.id" class="hover:bg-slate-50">
                    <td class="py-3 px-3 font-mono font-bold text-slate-800">{{ item.sku }}</td>
                    <td class="py-3 px-3 font-bold text-slate-900 max-w-xs truncate">{{ item.name }}</td>
                    <td class="py-3 px-3 font-black">₱{{ item.sellingPrice.toFixed(2) }}</td>
                    <td class="py-3 px-3 text-emerald-600 font-bold">{{ item.marginPct }}</td>
                    <td class="py-3 px-3">
                      <div class="flex items-center gap-1 font-mono font-bold">
                        <button @click="adjustStock(item, -1)" class="w-5 h-5 rounded bg-slate-100 text-center">-</button>
                        <span class="px-1">{{ item.stock }}</span>
                        <button @click="adjustStock(item, 1)" class="w-5 h-5 rounded bg-slate-100 text-center">+</button>
                      </div>
                    </td>
                    <td class="py-3 px-3 text-slate-500">{{ item.vendor }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ================= VIEW 4: PRODUCT CATALOG (From Image 4) ================= -->
        <div v-else-if="currentAdminSection === 'products'" class="space-y-5">
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h2 class="text-lg sm:text-xl font-black text-slate-900">Product Catalog & Upload Module</h2>
              <p class="text-xs text-slate-500">Upload products with AI vision auto-fill, media gallery, pricing, and classification.</p>
            </div>
            <button @click="handleSaveProduct" class="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold">Save & Publish</button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div class="lg:col-span-8 space-y-4">
              <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <h3 class="text-xs font-bold uppercase text-slate-500">1. BASIC PRODUCT INFORMATION</h3>
                <input v-model="uploadForm.title" type="text" placeholder="Product Title *" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                <textarea v-model="uploadForm.description" rows="2" placeholder="Description..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <input v-model="uploadForm.sku" type="text" placeholder="SKU *" class="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono" />
                  <input v-model="uploadForm.pricePhp" type="number" placeholder="Price (PHP) *" class="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold" />
                  <input v-model="uploadForm.stock" type="number" placeholder="Stock *" class="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono" />
                </div>
              </div>

              <!-- Media with Gemini Auto-Population -->
              <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div class="p-3 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
                  <div>
                    <span class="font-bold text-purple-900 text-xs">✨ Google Gemini Auto-Population</span>
                    <p class="text-[10px] text-purple-700">Upload card photo to auto-fill title, set, rarity, and specs</p>
                  </div>
                  <span class="px-2 py-0.5 rounded bg-purple-200 text-purple-800 text-[10px] font-bold">Active</span>
                </div>
                <div @click="handleSimulatedGeminiIntake" class="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center cursor-pointer hover:border-purple-500">
                  <span class="text-xs font-bold text-slate-800">Click to upload product photo or drag & drop</span>
                  <div v-if="isUploadingImage" class="text-xs text-purple-600 font-bold pt-1 animate-pulse">Gemini Vision parsing card...</div>
                </div>
              </div>
            </div>

            <div class="lg:col-span-4 space-y-4">
              <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <h3 class="text-xs font-bold uppercase text-slate-500">TAXONOMY</h3>
                <select v-model="uploadForm.primaryCategory" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs">
                  <option>TCG (Trading Cards)</option>
                  <option>Gunpla & Models</option>
                  <option>Anime Figures</option>
                </select>
                <input v-model="uploadForm.brand" type="text" placeholder="Brand..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs" />
              </div>
            </div>
          </div>
        </div>

        <!-- ================= VIEW 5: AUCTIONS & BIDDING (From New Image 1) ================= -->
        <div v-else-if="currentAdminSection === 'auctions'" class="space-y-5">
          <!-- Dark slate header card matching Image 1 -->
          <div class="p-5 rounded-2xl bg-[#2c3345] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div class="flex items-start gap-3">
              <div class="p-2.5 rounded-xl bg-slate-700/60 text-amber-400">
                <Gavel class="w-6 h-6" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-black tracking-tight">Auctions & Bidding Arena</h2>
                  <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    PESSIMISTIC DB LOCKS
                  </span>
                </div>
                <p class="text-xs text-slate-300 mt-0.5">
                  Create product auction lots, configure starting amounts, and timestamps, and monitor live bids in real-time.
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button class="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1">
                <span>Live Arena</span>
                <ExternalLink class="w-3 h-3" />
              </button>
              <button class="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 text-xs font-black flex items-center gap-1">
                <Plus class="w-3.5 h-3.5" />
                <span>+ Launch Auction</span>
              </button>
            </div>
          </div>

          <!-- 4 Stat Cards from Image 1 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="p-4 rounded-2xl bg-[#363e52] text-white space-y-1">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">TOTAL LOTS</span>
              <div class="text-2xl font-black">0</div>
              <span class="text-[10px] text-slate-400 block">Registered auction catalog</span>
            </div>

            <div class="p-4 rounded-2xl bg-[#363e52] text-white space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-[10px] uppercase font-bold text-slate-400">ACTIVE NOW</span>
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div class="text-2xl font-black">0</div>
              <span class="text-[10px] text-slate-400 block">Accepting live & proxy bids</span>
            </div>

            <div class="p-4 rounded-2xl bg-[#363e52] text-white space-y-1">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">BIDS PLACED</span>
              <div class="text-2xl font-black">0</div>
              <span class="text-[10px] text-slate-400 block">Immutable wager transactions</span>
            </div>

            <div class="p-4 rounded-2xl bg-[#363e52] text-white space-y-1">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">TOP CURRENT PRICE</span>
              <div class="text-2xl font-black text-amber-300">₱0.00</div>
              <span class="text-[10px] text-slate-400 block">Highest active lot bid</span>
            </div>
          </div>

          <!-- Filter & Search Bar -->
          <div class="p-3 rounded-2xl bg-[#363e52] text-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-1.5 text-xs font-bold">
              <button 
                v-for="f in ['All (0)', 'Active (0)', 'Ended (0)', 'Cancelled']" 
                :key="f"
                @click="auctionFilter = f"
                :class="['px-3 py-1 rounded-xl', auctionFilter === f ? 'bg-slate-900 text-white' : 'text-slate-300 hover:bg-slate-700']"
              >
                {{ f }}
              </button>
            </div>
            <div class="relative w-full sm:w-64">
              <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search by lot title..." class="w-full bg-[#272d3b] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none" />
            </div>
          </div>

          <!-- Empty State Box from Image 1 -->
          <div class="p-12 rounded-2xl bg-[#363e52] text-center text-white space-y-3">
            <span class="text-3xl block">🏷️</span>
            <h3 class="font-bold text-base">No auctions found</h3>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">
              No active lots in this current filter. Launch a new auction using the button below.
            </p>
            <button class="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 shadow-md">
              <Plus class="w-4 h-4" />
              <span>+ Launch First Auction</span>
            </button>
          </div>
        </div>

        <!-- ================= VIEW 6: CUSTOMERS & CRM (From New Image 2) ================= -->
        <div v-else-if="currentAdminSection === 'customers'" class="space-y-5">
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-lg sm:text-xl font-black text-slate-900">Customer Relationship Management (CRM)</h2>
              <p class="text-xs text-slate-500">Collector profiles, purchase history, LTV, behavioral segmentation, and central customer inbox.</p>
            </div>
            <div class="flex items-center gap-1.5 text-xs font-bold">
              <span class="px-3 py-1 rounded-xl bg-slate-900 text-white">👥 Customer Profiles (3)</span>
              <span class="px-3 py-1 rounded-xl bg-slate-100 text-slate-600">💬 Live Chat Desk (2)</span>
              <span class="px-3 py-1 rounded-xl bg-slate-100 text-slate-600">⭐ Reviews (0)</span>
            </div>
          </div>

          <!-- Search & Filters -->
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div class="relative flex-1 w-full">
              <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input v-model="crmSearchQuery" type="text" placeholder="Search collectors by name, email, or city..." class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none" />
            </div>
            <div class="flex items-center gap-1 text-xs font-bold">
              <button v-for="seg in ['All', 'VIP', 'Regular', 'Wholesale', 'Inactive']" :key="seg" @click="crmSegmentFilter = seg" :class="['px-2.5 py-1 rounded-lg', crmSegmentFilter === seg ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600']">{{ seg }}</button>
            </div>
          </div>

          <!-- Customers Table from Image 2 -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th class="py-3 px-4">CUSTOMER NAME</th>
                    <th class="py-3 px-4">CONTACT & LOCATION</th>
                    <th class="py-3 px-4">SEGMENT RANK</th>
                    <th class="py-3 px-4">LIFETIME VALUE (LTV)</th>
                    <th class="py-3 px-4">TOTAL ORDERS</th>
                    <th class="py-3 px-4">LAST ACTIVE</th>
                    <th class="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="cust in filteredCrm" :key="cust.id" class="hover:bg-slate-50">
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                          {{ cust.name.charAt(0) }}
                        </div>
                        <span class="font-bold text-slate-900">{{ cust.name }}</span>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <span class="text-slate-800 font-semibold block">{{ cust.email }}</span>
                      <span class="text-[10px] text-slate-400 block">{{ cust.location }}</span>
                    </td>
                    <td class="py-3 px-4">
                      <span class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                        {{ cust.segment }}
                      </span>
                    </td>
                    <td class="py-3 px-4 font-black text-slate-900">{{ cust.ltv }}</td>
                    <td class="py-3 px-4 font-mono">{{ cust.ordersCount }} orders</td>
                    <td class="py-3 px-4 font-mono text-slate-500">{{ cust.lastActive }}</td>
                    <td class="py-3 px-4 text-right">
                      <button class="text-xs font-bold text-rose-600 hover:text-rose-700">View LTV →</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ================= VIEW 7: MARKETING & PROMOS (From New Image 3) ================= -->
        <div v-else-if="currentAdminSection === 'marketing'" class="space-y-5">
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg sm:text-xl font-black text-slate-900">Marketing & Promotions Engine</h2>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-600 font-bold border border-rose-200">AUTOMATED</span>
              </div>
              <p class="text-xs text-slate-500">Discount codes, cross-sell/upsell matrices, abandoned cart recovery, and search engine optimization.</p>
            </div>
            <div class="flex items-center gap-1.5 text-xs font-bold">
              <span class="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600">🎟️ Discount Codes (1)</span>
              <span class="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600">📦 Bundles (4)</span>
              <span class="px-2.5 py-1 rounded-xl bg-rose-500 text-white">🔍 SEO Metatags</span>
            </div>
          </div>

          <div v-if="showSeoSaved" class="p-3 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4" />
            <span>SEO metadata and OpenGraph tags published to live site!</span>
          </div>

          <!-- SEO Copilot Panel matching Image 3 -->
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-slate-900 text-sm">SEARCH ENGINE OPTIMIZATION (SEO) COPILOT</h3>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Google Gemini Enabled</span>
                </div>
                <p class="text-xs text-slate-400">Automatically craft high-CTR meta titles, Google SERP snippets, Open Graph tags and Schema.org JSON-LD.</p>
              </div>
              <div class="flex items-center gap-2 text-xs font-bold">
                <span class="px-3 py-1 rounded-lg bg-slate-900 text-white">AI Generator & Editor</span>
                <span class="px-3 py-1 rounded-lg bg-slate-100 text-slate-600">Tracked Routes (3)</span>
              </div>
            </div>

            <!-- 2-Column SEO Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <!-- Left Form Column -->
              <div class="lg:col-span-7 space-y-4">
                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span class="text-xs font-bold uppercase text-slate-500 block">1. SELECT SEO TARGET</span>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label class="text-[11px] font-bold text-slate-600 block mb-1">Target Page Type</label>
                      <input v-model="seoForm.pageType" type="text" class="w-full bg-white border border-slate-200 rounded-lg p-2" />
                    </div>
                    <div>
                      <label class="text-[11px] font-bold text-slate-600 block mb-1">Target Focus Keyword</label>
                      <input v-model="seoForm.focusKeyword" type="text" class="w-full bg-white border border-slate-200 rounded-lg p-2" />
                    </div>
                  </div>
                  <button 
                    @click="generateAiSeo"
                    :disabled="isSeoGenerating"
                    class="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:from-purple-500 hover:to-indigo-500 transition-all"
                  >
                    <Sparkles class="w-4 h-4 text-amber-300" />
                    <span>{{ isSeoGenerating ? 'Synthesizing SEO via Gemini...' : 'Generate High-Ranking SEO with AI (Gemini)' }}</span>
                  </button>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold uppercase text-slate-500">2. EDIT METADATA & KEYWORDS</span>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">SEO Score: 75/100</span>
                  </div>

                  <div>
                    <label class="text-[11px] font-bold text-slate-600 block mb-1">Meta Title (Max 60 chars)</label>
                    <input v-model="seoForm.metaTitle" type="text" class="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs" />
                  </div>

                  <div>
                    <label class="text-[11px] font-bold text-slate-600 block mb-1">Meta Description (Max 160 chars)</label>
                    <textarea v-model="seoForm.metaDescription" rows="2" class="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs" />
                  </div>

                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label class="text-[11px] font-bold text-slate-600 block mb-1">Focus Keyword</label>
                      <input v-model="seoForm.focusKeyword" type="text" class="w-full bg-white border border-slate-200 rounded-lg p-2" />
                    </div>
                    <div>
                      <label class="text-[11px] font-bold text-slate-600 block mb-1">Canonical URL</label>
                      <input v-model="seoForm.canonicalUrl" type="text" class="w-full bg-white border border-slate-200 rounded-lg p-2" />
                    </div>
                  </div>

                  <button @click="saveSeo" class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs">
                    💾 Save & Publish SEO Metadata
                  </button>
                </div>
              </div>

              <!-- Right Preview Column -->
              <div class="lg:col-span-5 space-y-4">
                <!-- Google SERP Live Snippet from Image 3 -->
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] font-bold text-slate-600 uppercase">GOOGLE SERP LIVE SNIPPET</span>
                    <div class="flex items-center gap-1 text-[10px] font-bold">
                      <span class="px-2 py-0.5 rounded bg-white shadow-2xs">Desktop</span>
                      <span class="px-2 py-0.5 rounded text-slate-400">Mobile</span>
                    </div>
                  </div>

                  <div class="p-3 rounded-lg bg-white border border-slate-200/80 space-y-1">
                    <div class="text-[10px] text-slate-500 flex items-center gap-1">
                      <span>🌐</span>
                      <span>https://rlgonlineshop.com</span>
                    </div>
                    <h4 class="text-xs font-bold text-blue-700 hover:underline leading-snug">
                      {{ seoForm.metaTitle }}
                    </h4>
                    <p class="text-[11px] text-slate-600 leading-relaxed">
                      {{ seoForm.metaDescription }}
                    </p>
                  </div>
                </div>

                <!-- Open Graph Social Preview from Image 3 -->
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span class="text-[11px] font-bold text-slate-600 uppercase block">SOCIAL SHARE PREVIEW (OPEN GRAPH)</span>
                  <div class="rounded-lg bg-white border border-slate-200/80 overflow-hidden shadow-2xs">
                    <img src="https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=500&auto=format&fit=crop&q=80" alt="OG" class="w-full h-24 object-cover" />
                    <div class="p-2.5 space-y-1">
                      <span class="text-[9px] text-slate-400 uppercase font-mono">RLGONLINESHOP.COM</span>
                      <h5 class="text-xs font-bold text-slate-900 leading-tight">{{ seoForm.metaTitle }}</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= VIEW 8: CMS & STOREFRONT (From New Image 4) ================= -->
        <div v-else-if="currentAdminSection === 'cms'" class="space-y-5">
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg sm:text-xl font-black text-slate-900">Content Management System (CMS)</h2>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">LIVE STOREFRONT SYNC</span>
              </div>
              <p class="text-xs text-slate-500">Changes made here immediately update the storefront hero banners, promotional coupons, and legal pages.</p>
            </div>
            <div class="flex items-center gap-1.5 text-xs font-bold">
              <span class="px-2.5 py-1 rounded-xl bg-slate-900 text-white">🖼️ Store Banners (2)</span>
              <span class="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600">📄 Static Pages</span>
              <span class="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600">✍️ Blogs (2)</span>
            </div>
          </div>

          <div v-if="showBannerSaved" class="p-3 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4" />
            <span>Storefront banners deployed and synced live!</span>
          </div>

          <!-- Banner Slots Header from Image 4 -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-700">STOREFRONT BANNER SLOTS</h3>
              <p class="text-[11px] text-slate-400">Banner 1 controls the top Hero Banner; Banner 2 controls the Promo Strip.</p>
            </div>
            <button @click="saveBanners" class="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
              Deploy Banners to Storefront
            </button>
          </div>

          <!-- Slot 1: Primary Hero Banner -->
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">Slot #1 • bnr-1</span>
                <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">PRIMARY HERO BANNER</span>
              </div>
              <label class="flex items-center gap-1.5 text-emerald-600 font-bold cursor-pointer">
                <input type="checkbox" v-model="heroBanner.isVisible" class="accent-emerald-600" />
                <span>Visible on Storefront</span>
              </label>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div class="lg:col-span-7 space-y-3 text-xs">
                <div>
                  <label class="text-[11px] font-bold text-slate-600 block mb-1">Banner Headline Title</label>
                  <input v-model="heroBanner.headline" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" />
                </div>
                <div>
                  <label class="text-[11px] font-bold text-slate-600 block mb-1">Top Badge Label</label>
                  <input v-model="heroBanner.badge" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono" />
                </div>
                <div>
                  <label class="text-[11px] font-bold text-slate-600 block mb-1">Subtitle / Descriptive Copy</label>
                  <textarea v-model="heroBanner.subtitle" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <input v-model="heroBanner.ctaText" type="text" placeholder="Button text" class="bg-slate-50 border border-slate-200 rounded-lg p-2" />
                  <input v-model="heroBanner.ctaLink" type="text" placeholder="Route link" class="bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono" />
                </div>
              </div>

              <!-- Live Visual Preview matching Image 4 -->
              <div class="lg:col-span-5 space-y-2">
                <span class="text-[10px] font-bold text-slate-400 uppercase">Live Visual Preview (Storefront Render)</span>
                <div class="rounded-xl overflow-hidden border border-slate-200 shadow-2xs relative h-40">
                  <img :src="heroBanner.imageUrl" alt="Preview" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex flex-col justify-end text-white text-left">
                    <span class="text-[9px] font-mono text-purple-300">{{ heroBanner.badge }}</span>
                    <h5 class="text-xs font-bold leading-tight line-clamp-1">{{ heroBanner.headline }}</h5>
                  </div>
                </div>
                <button @click="saveBanners" class="w-full py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold">
                  Deploy Banner Changes
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= VIEW 9: ANALYTICS & REPORTS (From New Image 5) ================= -->
        <div v-else-if="currentAdminSection === 'analytics'" class="space-y-5">
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 mb-1">
                LIVE EP TELEMETRY • Reconciled today 9:10 PM
              </div>
              <h2 class="text-lg sm:text-xl font-black text-slate-900">Analytics & Executive Reporting</h2>
              <p class="text-xs text-slate-500">Gross vs. net sales reconciliations, Philippine 12% VAT audit, inventory velocity, and capital liquidation.</p>
            </div>

            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button v-for="r in ['7D', '30D', '90D', 'YEAR', 'ALL']" :key="r" @click="analyticsRange = r" :class="['px-2 py-1 rounded-lg', analyticsRange === r ? 'bg-white shadow-2xs' : 'text-slate-500']">{{ r }}</button>
              </div>
              <button class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1">
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <!-- Top 6 Analytics Metrics from Image 5 -->
          <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span class="text-[9px] font-bold uppercase text-slate-400 block">GROSS SALES</span>
              <div class="text-base sm:text-lg font-black text-slate-900">₱0.00</div>
              <span class="text-[9px] text-slate-400 block">Orders billed</span>
            </div>
            <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span class="text-[9px] font-bold uppercase text-slate-400 block">NET REALIZED</span>
              <div class="text-base sm:text-lg font-black text-slate-900">₱0.00</div>
              <span class="text-[9px] text-slate-400 block">Post-refunds</span>
            </div>
            <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span class="text-[9px] font-bold uppercase text-slate-400 block">12% VAT LIABILITY</span>
              <div class="text-base sm:text-lg font-black text-slate-900">₱0.00</div>
              <span class="text-[9px] text-slate-400 block">Tax compliance</span>
            </div>
            <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span class="text-[9px] font-bold uppercase text-slate-400 block">EST. LOGISTICS</span>
              <div class="text-base sm:text-lg font-black text-slate-900">₱0.00</div>
              <span class="text-[9px] text-slate-400 block">Fulfillment courier</span>
            </div>
            <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span class="text-[9px] font-bold uppercase text-slate-400 block">AVG ORDER VALUE</span>
              <div class="text-base sm:text-lg font-black text-slate-900">₱0.00</div>
              <span class="text-[9px] text-slate-400 block">Per transaction</span>
            </div>
            <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <span class="text-[9px] font-bold uppercase text-rose-500 block">TIED CAPITAL</span>
              <div class="text-base sm:text-lg font-black text-slate-900">₱4,120.00</div>
              <span class="text-[9px] text-slate-400 block">Warehouse stock</span>
            </div>
          </div>

          <!-- Dark Operational Sub-bar from Image 5 -->
          <div class="p-3 rounded-2xl bg-[#2c3345] text-white grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
            <div><span class="text-[9px] text-slate-400 block uppercase">PHYSICAL STOCK</span><span class="font-bold">21 units</span></div>
            <div><span class="text-[9px] text-slate-400 block uppercase">ACTIVE SKUS</span><span class="font-bold">21 catalog</span></div>
            <div><span class="text-[9px] text-slate-400 block uppercase">LOW STOCK (&lt;10)</span><span class="font-bold text-rose-400">21 items</span></div>
            <div><span class="text-[9px] text-slate-400 block uppercase">ACTIVE CUSTOMERS</span><span class="font-bold">0 accounts</span></div>
            <div><span class="text-[9px] text-slate-400 block uppercase">CART INTEREST</span><span class="font-bold">0 active</span></div>
            <div><span class="text-[9px] text-slate-400 block uppercase">WISHLISTED</span><span class="font-bold text-pink-400">1 items</span></div>
          </div>

          <!-- Charts Grid from Image 5 -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <!-- Simulated Bar Chart: GROSS VS NET SALES TRAJECTORY -->
            <div class="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 class="font-black text-slate-900 text-xs sm:text-sm">GROSS VS NET SALES TRAJECTORY</h3>
                <span class="text-[10px] text-slate-400">6-month trend</span>
              </div>
              <div class="h-44 flex items-end justify-between gap-3 px-4 pt-6">
                <div v-for="(m, i) in [{mon:'May', h: 40}, {mon:'Jun', h: 55}, {mon:'Jul', h: 65}, {mon:'Aug', h: 90}, {mon:'Sep', h: 80}, {mon:'Oct', h: 45}]" :key="m.mon" class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div class="w-full flex items-end justify-center gap-1 h-full">
                    <div class="w-3 bg-slate-900 rounded-t" :style="{ height: `${m.h}%` }" />
                    <div class="w-3 bg-teal-500 rounded-t" :style="{ height: `${m.h * 0.85}%` }" />
                  </div>
                  <span class="text-[10px] font-mono text-slate-500">{{ m.mon }}</span>
                </div>
              </div>
              <div class="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                <span class="text-emerald-600 font-bold">▲ Sustainable Momentum</span>
                <span>Consistent gross-to-net realization over 90%</span>
              </div>
            </div>

            <!-- PRODUCT CATEGORIES SHARE from Image 5 -->
            <div class="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div class="pb-2 border-b border-slate-100">
                <h3 class="font-black text-slate-900 text-xs sm:text-sm">PRODUCT CATEGORIES SHARE</h3>
                <span class="text-[10px] text-slate-400">Revenue and units distributed by department</span>
              </div>

              <div class="space-y-2 text-xs">
                <div v-for="cat in categoryShareData" :key="cat.name" class="p-2 rounded-xl bg-slate-50 flex items-center justify-between">
                  <div>
                    <span class="font-bold text-slate-900 block">{{ cat.name }}</span>
                    <span class="text-[10px] text-slate-400 block">{{ cat.units }}</span>
                  </div>
                  <span class="font-mono font-bold text-slate-700 text-xs">{{ cat.revenue }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= VIEW 10: SETTINGS ================= -->
        <div v-else-if="currentAdminSection === 'settings'" class="space-y-5">
          <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h2 class="text-lg sm:text-xl font-black text-slate-900">Settings & Store Configuration</h2>
              <p class="text-xs text-slate-500">Configure currency, Philippine VAT calculations, and courier API keys.</p>
            </div>
            <button class="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold">Save Settings</button>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 max-w-xl text-xs">
            <div>
              <label class="font-bold text-slate-700 block mb-1">Store Name</label>
              <input type="text" value="RLG Online Shop" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold" />
            </div>
            <div>
              <label class="font-bold text-slate-700 block mb-1">Default Currency</label>
              <select class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2">
                <option>PHP (Philippine Peso ₱)</option>
                <option>USD (US Dollar $)</option>
              </select>
            </div>
            <div>
              <label class="font-bold text-slate-700 block mb-1">Standard VAT Rate</label>
              <input type="text" value="12%" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono" />
            </div>
          </div>
        </div>

      </main>
    </div>

  </div>
</template>
