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

// Device state & layout
const isMobile = computed(() => portfolioStore.activeDevice === 'mobile')
const isTablet = computed(() => portfolioStore.activeDevice === 'tablet')

// Active section inside the Admin Panel
// 'dashboard' | 'orders' | 'inventory' | 'products' | 'auctions' | 'customers' | 'marketing' | 'cms' | 'analytics' | 'settings'
const currentAdminSection = ref('dashboard')

const currentSectionTitle = computed(() => {
  if (isMobile.value) {
    switch (currentAdminSection.value) {
      case 'dashboard': return 'Dashboard'
      case 'orders': return 'Orders'
      case 'inventory': return 'Inventory & Stock'
      case 'products': return 'Products'
      case 'auctions': return 'Auctions'
      case 'customers': return 'Customers'
      case 'marketing': return 'Marketing'
      case 'cms': return 'Cms'
      case 'analytics': return 'Analytics'
      case 'settings': return 'Settings'
      default: return 'Admin'
    }
  }
  switch (currentAdminSection.value) {
    case 'dashboard': return 'Dashboard'
    case 'orders': return 'Orders'
    case 'inventory': return 'Inventory & Stock'
    case 'products': return 'Product Catalog'
    case 'auctions': return 'Auctions & Bidding'
    case 'customers': return 'Customers & CRM'
    case 'marketing': return 'Marketing & Promos'
    case 'cms': return 'CMS & Storefront'
    case 'analytics': return 'Analytics & Reports'
    case 'settings': return 'Settings & Config'
    default: return 'Admin'
  }
})

function handleSignOut() {
  portfolioStore.setDemoMode('storefront')
}

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

// Telemetry metrics based on timeframe from Image 1 & 2
const metrics = computed(() => {
  if (timeframe.value === 'today') {
    return {
      revenue: '₱120.00',
      orders: '1 Order',
      aov: '₱120.00',
      cartItems: '1 Item',
      favourites: '1 Saved',
      visitors: '4 Live',
      trendRev: '+8.2%',
      trendOrd: '+4.1%'
    }
  } else if (timeframe.value === 'week') {
    // Exactly matches Screenshot 2!
    return {
      revenue: '₱370.00',
      orders: '2 Orders',
      aov: '₱185.00',
      cartItems: '3 Items',
      favourites: '2 Saved',
      visitors: '12 Live',
      trendRev: '+18.4%',
      trendOrd: '+12.1%'
    }
  } else {
    return {
      revenue: '₱1,480.00',
      orders: '8 Orders',
      aov: '₱185.00',
      cartItems: '9 Items',
      favourites: '6 Saved',
      visitors: '45 Live',
      trendRev: '+28.5%',
      trendOrd: '+18.2%'
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

// Authentic Inventory Table items from Image 3 & 5
const inventoryItems = ref([
  {
    id: 1,
    sku: 'TCG-PKM-S4A-233-S',
    barcode: 'BC-TCG-PKM-S4A-233-S',
    name: 'Pokémon TCG Frosmoth Shiny Rare S4a 233/190 Shiny Treasure',
    category: 'TCG (Trading Cards)',
    sellingPrice: 120.00,
    costPrice: 85.00,
    marginPct: '29%',
    marginAmount: '+₱35.00',
    stock: 5,
    status: 'Low (x5)',
    vendor: 'The Pokémon Company',
    leadTime: '7 days lead',
    image: '/storage/products/S0ovGIsIj0qdpoSjGm868MkWp6aGZxl4xAQmcYDl.png'
  },
  {
    id: 2,
    sku: 'TCG-PKM-SV4A-202',
    barcode: 'BC-TCG-PKM-SV4A-202',
    name: 'Pokémon TCG Revavroom 202/190 S Shiny Treasures Japanese',
    category: 'TCG (Trading Cards)',
    sellingPrice: 150.00,
    costPrice: 105.00,
    marginPct: '30%',
    marginAmount: '+₱45.00',
    stock: 3,
    status: 'Low (x3)',
    vendor: 'The Pokémon Company',
    leadTime: '7 days lead',
    image: '/storage/products/Aswglt6vA7NegrJ08eaH2rNvT4J10zoFmdaFUtzA.png'
  },
  {
    id: 3,
    sku: 'TCG-PKM-SV4A-200',
    barcode: 'BC-TCG-PKM-SV4A-200',
    name: 'Abomasnow (Shiny Holo) 200/190 S - Pokémon Card Shiny Treasure',
    category: 'TCG (Trading Cards)',
    sellingPrice: 250.00,
    costPrice: 175.00,
    marginPct: '30%',
    marginAmount: '+₱75.00',
    stock: 4,
    status: 'Low (x4)',
    vendor: 'The Pokémon Company',
    leadTime: '7 days lead',
    image: '/storage/products/UH1tPUsjZDfjkGH76LeqGuEfJSX8JX7VEgn4sAUr.png'
  },
  {
    id: 4,
    sku: 'TCG-PKM-SV4A-311',
    barcode: 'BC-TCG-PKM-SV4A-311',
    name: 'Boltund Shiny V (S4a 311/190) High Class Pack',
    category: 'TCG (Trading Cards)',
    sellingPrice: 250.00,
    costPrice: 175.00,
    marginPct: '30%',
    marginAmount: '+₱75.00',
    stock: 6,
    status: 'In Stock',
    vendor: 'The Pokémon Company',
    leadTime: '7 days lead',
    image: '/storage/products/25EjAOVQHiF8J5b4cqtsdJKLCjfv4mE3I4LEgCJo.png'
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

// Orders from Image 2 & 4
const ordersList = ref([
  {
    id: 'ORD-MXXIN041',
    date: 'Oct 8, 2026, 12:26 PM',
    customer: 'Customer #41 (Metro Manila)',
    address: 'Metro Manila, PH',
    items: 'Pokémon TCG Frosmoth Shiny Rare S4a',
    total: '₱120.00',
    payment: 'QR - GCASH',
    status: 'Pending',
    tracking: 'LBC-PH84920491',
    action: 'Fulfill',
    image: '/storage/products/S0ovGIsIj0qdpoSjGm868MkWp6aGZxl4xAQmcYDl.png'
  },
  {
    id: 'ORD-F6PDDBDV',
    date: 'Oct 8, 2026, 12:07 PM',
    customer: 'Customer #40 (Cebu City)',
    address: 'Cebu City, Central Visayas',
    items: 'Boltund Shiny V (S4a 311/190)',
    total: '₱250.00',
    payment: 'QR - GCASH',
    status: 'Pending',
    tracking: 'J&T-948201948',
    action: 'Fulfill',
    image: '/storage/products/25EjAOVQHiF8J5b4cqtsdJKLCjfv4mE3I4LEgCJo.png'
  },
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
    action: 'Print Slip',
    image: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=120&auto=format&fit=crop&q=80'
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
    action: 'Track',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&auto=format&fit=crop&q=80'
  }
])

// CRM Customers from Screenshot 3
const crmCustomers = ref([
  {
    id: 4,
    custCode: 'CUST-4',
    name: 'Trisha Carvajal',
    email: 'trishacarvajal55@gmail.com',
    location: 'Metro Manila • N/A',
    segment: 'Regular',
    ltv: '₱0.00',
    ordersCount: 0,
    lastActive: '2026-10-08'
  },
  {
    id: 3,
    custCode: 'CUST-3',
    name: 'Admin Chief',
    email: 'admin@rlghobby.com',
    location: 'Metro Manila • N/A',
    segment: 'Regular',
    ltv: '₱0.00',
    ordersCount: 0,
    lastActive: '2026-10-06'
  },
  {
    id: 2,
    custCode: 'CUST-2',
    name: 'Test User',
    email: 'test@example.com',
    location: 'Manila • +63 900 000 0000',
    segment: 'Regular',
    ltv: '₱0.00',
    ordersCount: 0,
    lastActive: '2026-10-05'
  },
  {
    id: 1,
    custCode: 'CUST-1',
    name: 'Russel Luis Gemonilao',
    email: 'russel.luis@gmail.com',
    location: 'Quezon City • +63 912 345 6789',
    segment: 'Regular',
    ltv: '₱0.00',
    ordersCount: 0,
    lastActive: '2026-10-05'
  }
])

// Promotional Coupons from Screenshot 4
const couponsList = ref([
  {
    code: 'HOBBY10',
    type: 'Percentage Discount (10% Off)',
    redemptions: '0 uses',
    limit: 'Unlimited',
    expiry: 'Dec 31, 2026',
    status: 'Active'
  },
  {
    code: 'GUNPLA20',
    type: 'Category Discount (20% Off Gunpla)',
    redemptions: '0 uses',
    limit: '500 uses',
    expiry: 'Dec 31, 2026',
    status: 'Active'
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

// Staff Members from Settings Mobile Screenshot (media_1791465286994_7c0d1e0b.png)
const staffMembers = ref([
  {
    name: 'Admin Chief',
    email: 'admin@rlghobby.com',
    role: 'Super Admin (Unrestricted)',
    roleType: 'super-admin'
  },
  {
    name: 'Rowena Santos',
    email: 'rowena.ops@rlghobby.com',
    role: 'Store Manager (Catalog & Operations)',
    roleType: 'manager'
  },
  {
    name: 'Store Manager Demo',
    email: 'manager@rlghobby.com',
    role: 'Store Manager (Catalog & Operations)',
    roleType: 'manager'
  }
])

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
  <div 
    :class="[
      'min-h-[750px] bg-[#f1f5f9] text-slate-800 rounded-xl overflow-hidden text-left font-sans shadow-inner relative',
      isMobile ? 'flex flex-col w-full' : 'flex flex-row w-full'
    ]"
  >
    
    <!-- Mobile Backdrop Drawer (Only active on mobile when drawer is open) -->
    <Transition name="fade">
      <div 
        v-if="isMobile && isSidebarOpen"
        @click="isSidebarOpen = false"
        class="absolute inset-0 bg-black/75 z-40 backdrop-blur-xs transition-opacity"
      />
    </Transition>

    <!-- ================= ACTUAL LEFT SIDEBAR (Dark navy #050811) ================= -->
    <Transition name="admin-drawer">
      <aside 
        v-if="!isMobile || isSidebarOpen"
        :class="[
          'bg-[#050811] text-slate-400 p-4 shrink-0 flex flex-col justify-between border-r border-slate-800/80 transition-all',
          isMobile 
            ? 'absolute inset-y-0 left-0 w-72 max-w-[85%] z-50 shadow-2xl'
            : (isTablet ? 'w-52 static z-20 flex' : 'w-60 lg:w-64 static z-20 flex')
        ]"
      >
      <div class="space-y-4 overflow-y-auto pr-1">
        <!-- Brand Header from Screenshot 3 -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
              <img src="/logo.png" alt="RLG" class="w-full h-full object-contain" />
            </div>
            <div>
              <h1 class="text-xs font-black tracking-wider uppercase leading-none">
                <span class="text-white">RLG </span><span class="text-amber-400">ONLINE SHOP</span>
              </h1>
              <span class="text-[9px] text-slate-400 tracking-tight block mt-0.5 font-medium">Command Center</span>
            </div>
          </div>

          <!-- Close drawer button for mobile -->
          <button v-if="isMobile" @click="isSidebarOpen = false" class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Admin Chief Profile Card from Screenshot 3 -->
        <div class="p-3 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-center gap-2.5 shadow-sm">
          <div class="w-9 h-9 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-sm shadow-md">
            A
          </div>
          <div class="truncate text-left flex-1 min-w-0">
            <span class="text-xs font-black text-white block truncate">Admin Chief</span>
            <span class="text-[8px] font-bold tracking-wider uppercase text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30 inline-block mt-0.5">
              SUPER ADMIN (UNRESTRICTED)
            </span>
          </div>
        </div>

        <!-- Sidebar Navigation List: ALL 10 MODULES with #ff0055 hot pink active state -->
        <nav class="space-y-1 text-xs font-semibold">
          <button
            v-for="mod in [
              { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
              { id: 'orders', name: 'Orders', icon: ShoppingBag, badge: '2', badgeClass: 'bg-rose-500 text-white' },
              { id: 'inventory', name: 'Inventory & Stock', icon: Package, badge: 'Low', badgeClass: 'bg-rose-950 text-rose-300 border border-rose-800' },
              { id: 'products', name: 'Product Catalog', icon: PlusCircle, badge: 'New', badgeClass: 'bg-indigo-950 text-indigo-300 border border-indigo-800' },
              { id: 'auctions', name: 'Auctions & Bidding', icon: Gavel, badge: 'Live', badgeClass: 'bg-pink-950 text-pink-300 border border-pink-800' },
              { id: 'customers', name: 'Customers & CRM', icon: Users },
              { id: 'marketing', name: 'Marketing & Promos', icon: Megaphone },
              { id: 'cms', name: 'CMS & Storefront', icon: Globe2 },
              { id: 'analytics', name: 'Analytics & Reports', icon: BarChart3 },
              { id: 'settings', name: 'Settings & Config', icon: Settings }
            ]"
            :key="mod.id"
            @click="switchSection(mod.id)"
            :class="[
              'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all',
              currentAdminSection === mod.id
                ? 'bg-[#ff0055] text-white font-extrabold shadow-lg shadow-pink-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            ]"
          >
            <div class="flex items-center gap-2.5">
              <component :is="mod.icon" class="w-4 h-4" />
              <span>{{ mod.name }}</span>
            </div>
            <span v-if="mod.badge" :class="['text-[9px] font-bold px-1.5 py-0.2 rounded', mod.badgeClass]">
              {{ mod.badge }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Bottom Actions from Screenshot 3 -->
      <div class="pt-3 border-t border-slate-800/80 space-y-2">
        <button
          @click="portfolioStore.setDemoMode('storefront'); isSidebarOpen = false"
          class="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <span>Live Storefront</span>
          <ExternalLink class="w-3.5 h-3.5 text-slate-400" />
        </button>

        <button
          @click="handleSignOut(); isSidebarOpen = false"
          class="w-full py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-900/50 font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <span>🚪 Sign Out</span>
        </button>
      </div>
    </aside>
    </Transition>

    <!-- ================= RIGHT WORKSPACE AREA ================= -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f1f5f9]">
      
      <!-- Top Header Bar -->
      <header class="h-14 px-3 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between gap-2 shrink-0 shadow-2xs">
        <!-- Mobile Header Bar (Screenshots 2, 4, 5) -->
        <template v-if="isMobile">
          <div class="flex items-center gap-2.5">
            <button 
              @click="isSidebarOpen = !isSidebarOpen"
              class="p-1.5 rounded-xl text-slate-800 hover:bg-slate-100 transition-colors"
              title="Toggle Menu"
            >
              <Menu class="w-5 h-5" />
            </button>
            <span class="font-extrabold text-slate-900 text-sm tracking-tight">
              {{ currentSectionTitle }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <!-- ↗ Live Storefront -->
            <button
              @click="portfolioStore.setDemoMode('storefront')"
              class="w-8 h-8 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/60 flex items-center justify-center transition-colors shadow-2xs"
              title="Live Storefront"
            >
              <ArrowUpRight class="w-4 h-4" />
            </button>

            <!-- + Add Product -->
            <button
              @click="switchSection('products')"
              class="w-8 h-8 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white flex items-center justify-center transition-colors shadow-xs"
              title="Add Product"
            >
              <Plus class="w-4 h-4" />
            </button>

            <!-- ⇥ Sign Out -->
            <button
              @click="handleSignOut"
              class="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 flex items-center justify-center transition-colors shadow-2xs"
              title="Sign Out"
            >
              <LogOut class="w-3.5 h-3.5" />
            </button>
          </div>
        </template>

        <!-- Desktop / Tablet Header Bar -->
        <template v-else>
          <div class="flex items-center gap-2 text-xs">
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
              {{ currentSectionTitle }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="portfolioStore.setDemoMode('storefront')"
              class="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 flex items-center gap-1 transition-colors"
            >
              <span>Live Storefront</span>
              <ExternalLink class="w-3 h-3 text-slate-400" />
            </button>

            <button
              @click="switchSection('products')"
              class="px-2.5 sm:px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
            >
              <Plus class="w-3 h-3" />
              <span>+ Add Product</span>
            </button>
          </div>
        </template>
      </header>

      <!-- Scrollable Main Content Area -->
      <main 
        :class="[
          'flex-1 overflow-y-auto',
          isMobile 
            ? 'bg-[#9ba6b5] p-3 space-y-3.5 text-slate-900' 
            : 'bg-[#f1f5f9] p-3 sm:p-5 md:p-6 space-y-6 text-slate-800'
        ]"
      >
        
        <!-- ================= VIEW 1: DASHBOARD (From Image 1 & Screenshot 2) ================= -->
        <div v-if="currentAdminSection === 'dashboard'" class="space-y-3.5 sm:space-y-6">
          
          <!-- MOBILE DASHBOARD (Screenshot 2) -->
          <template v-if="isMobile">
            <!-- Command Center Card -->
            <div class="bg-white p-4.5 rounded-[26px] shadow-xs space-y-3 text-slate-900 border border-slate-200/40">
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                LIVE STORE TELEMETRY • LIVE STOREFRONT SESSIONS (30M ROLLING WINDOW)
              </div>
              <div>
                <h2 class="text-xl font-black text-slate-900 tracking-tight">Executive Command Center</h2>
                <p class="text-[11px] text-slate-500 mt-0.5">Real-time overview of revenue, operations, fulfillment, and customer traffic.</p>
              </div>
              <div class="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold text-center">
                <button @click="timeframe = 'today'" :class="['py-1.5 rounded-lg transition-all', timeframe === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500']">Today</button>
                <button @click="timeframe = 'week'" :class="['py-1.5 rounded-lg transition-all', timeframe === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500']">This Week</button>
                <button @click="timeframe = 'month'" :class="['py-1.5 rounded-lg transition-all', timeframe === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500']">This Month</button>
              </div>
            </div>

            <!-- Card 1: TOTAL REVENUE -->
            <div class="bg-white p-4.5 rounded-[26px] shadow-xs space-y-1.5 text-slate-900 border border-slate-200/40">
              <div class="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <span>TOTAL REVENUE</span>
                <span class="text-base">💰</span>
              </div>
              <div class="text-2xl font-black text-slate-900">{{ metrics.revenue }}</div>
              <p class="text-[11px] text-emerald-600 font-bold">↑ {{ metrics.trendRev }} vs previous</p>
            </div>

            <!-- Card 2: TOTAL ORDERS -->
            <div class="bg-white p-4.5 rounded-[26px] shadow-xs space-y-1.5 text-slate-900 border border-slate-200/40">
              <div class="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <span>TOTAL ORDERS</span>
                <span class="text-base">📦</span>
              </div>
              <div class="text-2xl font-black text-slate-900">{{ metrics.orders }}</div>
              <p class="text-[11px] text-indigo-600 font-bold">↑ {{ metrics.trendOrd }} velocity</p>
            </div>

            <!-- Card 3: AVG ORDER (AOV) -->
            <div class="bg-white p-4.5 rounded-[26px] shadow-xs space-y-1.5 text-slate-900 border border-slate-200/40">
              <div class="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <span>AVG ORDER (AOV)</span>
                <span class="text-base">🏷️</span>
              </div>
              <div class="text-2xl font-black text-slate-900">{{ metrics.aov }}</div>
              <p class="text-[11px] text-rose-600 font-bold">↑ +₱420 bundle lift</p>
            </div>

            <!-- Card 4: TOTAL IN CART -->
            <div class="bg-white p-4.5 rounded-[26px] shadow-xs space-y-1.5 text-slate-900 border border-slate-200/40">
              <div class="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <span>TOTAL IN CART</span>
                <span class="text-base">🛒</span>
              </div>
              <div class="text-2xl font-black text-slate-900">{{ metrics.cartItems }}</div>
              <p class="text-[11px] text-sky-600 font-bold">3 active collector baskets</p>
            </div>

            <!-- Operational Notifications Card -->
            <div class="bg-white p-4.5 rounded-[26px] shadow-xs space-y-2.5 text-slate-900 border border-slate-200/40">
              <h3 class="text-xs font-black uppercase text-slate-600 tracking-wider">OPERATIONAL NOTIFICATIONS</h3>
              <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-center gap-2.5">
                <span class="text-base">⏳</span>
                <div>
                  <span class="font-bold text-slate-900 block">Pending Orders (2 Orders)</span>
                  <span class="text-[10px] text-slate-500">2 orders awaiting courier pickup</span>
                </div>
              </div>
              <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs flex items-center gap-2.5">
                <span class="text-base">⚠️</span>
                <div>
                  <span class="font-bold text-slate-900 block">Low Stock Alert (4 SKUs Critical)</span>
                  <span class="text-[10px] text-slate-500">Frosmoth Shiny & Revavroom below safety stock</span>
                </div>
              </div>
            </div>

            <!-- Top Products Card -->
            <div class="bg-white p-4.5 rounded-[26px] shadow-xs space-y-3 text-slate-900 border border-slate-200/40">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 class="font-black text-slate-900 text-xs">TOP PERFORMING PRODUCTS</h3>
                <button @click="switchSection('inventory')" class="text-xs font-bold text-rose-600 hover:text-rose-700">Manage →</button>
              </div>
              <div class="space-y-2">
                <div v-for="item in topProducts" :key="item.rank" class="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50">
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
          </template>

          <!-- DESKTOP / TABLET DASHBOARD -->
          <template v-else>
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
          </template>
        </div>

        <!-- ================= VIEW 2: ORDERS (From Image 2 & Screenshot 4) ================= -->
        <div v-else-if="currentAdminSection === 'orders'" class="space-y-3.5 sm:space-y-5">
          <!-- MOBILE ORDERS (Screenshot 4) -->
          <template v-if="isMobile">
            <!-- Controls Card -->
            <div class="bg-white p-4.5 rounded-[26px] shadow-xs space-y-3 text-slate-900 border border-slate-200/40">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-black text-slate-900">Order Lifecycle & Fulfillment</h2>
                  <p class="text-[11px] text-slate-500">Total {{ filteredOrders.length }} orders placed across all storefront sessions.</p>
                </div>
                <span class="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Total: {{ filteredOrders.length }}</span>
              </div>

              <!-- Search -->
              <div class="relative w-full">
                <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input v-model="orderSearchQuery" type="text" placeholder="Search by order ID, customer name, items..." class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none" />
              </div>

              <!-- Status Filters -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                <button v-for="st in ['All', 'Pending', 'Processing', 'Shipped', 'In Transit', 'Delivered']" :key="st" @click="orderStatusFilter = st" :class="['px-3 py-1 rounded-lg shrink-0 transition-all', orderStatusFilter === st ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600']">{{ st }}</button>
              </div>
            </div>

            <!-- Mobile Order Cards -->
            <div v-for="order in filteredOrders" :key="order.id" class="bg-white p-4.5 rounded-[26px] shadow-xs space-y-3 text-slate-900 border border-slate-200/40">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-black text-sm text-slate-900 block font-mono">{{ order.id }}</span>
                  <span class="text-[10px] text-slate-400 font-mono">{{ order.date }}</span>
                </div>
                <div class="text-right">
                  <span class="text-base font-black text-slate-900 block">{{ order.total }}</span>
                  <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-block font-mono">{{ order.payment }}</span>
                </div>
              </div>

              <div class="text-xs border-t border-slate-100 pt-2 text-slate-600">
                <span class="font-bold text-slate-800">{{ order.customer }}</span>
                <span class="text-slate-400 block text-[11px]">{{ order.address }}</span>
              </div>

              <div class="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div class="w-12 h-16 rounded-lg bg-white border border-slate-200 p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                  <img :src="order.image" :alt="order.items" class="w-full h-full object-contain" />
                </div>
                <div class="flex-1 min-w-0">
                  <span class="font-bold text-xs text-slate-900 block truncate">{{ order.items }}</span>
                  <span class="text-[10px] text-slate-500 font-medium">1 item(s) →</span>
                  <div class="text-[10px] text-slate-400 font-mono mt-0.5">Tracking: {{ order.tracking }}</div>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-400 text-[11px] font-semibold">STATUS:</span>
                <span class="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs flex items-center gap-1">
                  <span>● {{ order.status }}</span>
                  <span class="text-[10px]">▾</span>
                </span>
              </div>

              <div class="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                <button class="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs">
                  <span>🏷️ Fulfill</span>
                </button>
                <button class="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 border border-slate-200">
                  <span>📄 Invoice</span>
                </button>
                <button class="py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1 border border-rose-200">
                  <span>🔄 Refund</span>
                </button>
              </div>
            </div>
          </template>

          <!-- DESKTOP ORDERS TABLE -->
          <template v-else>
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
          </template>
        </div>

        <!-- ================= VIEW 3: INVENTORY (From Image 3 & Screenshot 5) ================= -->
        <div v-else-if="currentAdminSection === 'inventory'" class="space-y-3.5 sm:space-y-5">
          <!-- MOBILE INVENTORY (Screenshot 5) -->
          <template v-if="isMobile">
            <!-- Controls Card -->
            <div class="bg-white p-4.5 rounded-[26px] shadow-xs space-y-3 text-slate-900 border border-slate-200/40">
              <div>
                <h2 class="text-lg font-black text-slate-900">Inventory & Stock Control</h2>
                <p class="text-[11px] text-slate-500">Real-time SKU monitoring, variant matrices, vendor lead times, and bulk CSV updates.</p>
              </div>

              <div class="flex items-center gap-2">
                <button class="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1">
                  <RefreshCw class="w-3.5 h-3.5" />
                  <span>Refresh Stock</span>
                </button>
                <button class="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1">
                  <FileDown class="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button class="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1">
                  <FileUp class="w-3.5 h-3.5" />
                  <span>Import CSV</span>
                </button>
              </div>

              <div class="relative w-full">
                <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input v-model="inventorySearchQuery" type="text" placeholder="Search by product title or SKU..." class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none" />
              </div>

              <div class="flex items-center justify-between gap-2 text-xs">
                <span class="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[11px]">TCG (Trading Cards)</span>
                <span class="text-slate-400 text-[11px] font-mono">10 / page ▾</span>
              </div>
            </div>

            <!-- Mobile Inventory Cards -->
            <div v-for="item in filteredInventory" :key="item.id" class="bg-white p-4.5 rounded-[26px] shadow-xs space-y-3 text-slate-900 border border-slate-200/40">
              <!-- Top SKU & Barcode + Product Title -->
              <div class="flex items-start gap-3">
                <div class="w-14 h-20 rounded-xl bg-slate-50 border border-slate-200 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                  <img :src="item.image" :alt="item.name" class="w-full h-full object-contain" />
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">SKU & BARCODE</span>
                  <span class="font-mono font-bold text-xs text-slate-900 block truncate">{{ item.sku }}</span>
                  <span class="text-[10px] font-mono text-slate-400 block">UPC: {{ item.barcode }}</span>

                  <span class="text-[10px] font-bold uppercase text-slate-400 block tracking-wider mt-2">PRODUCT NAME & CATEGORY</span>
                  <h4 class="font-bold text-xs text-slate-900 leading-snug line-clamp-2">{{ item.name }}</h4>
                  <span class="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">
                    {{ item.category }}
                  </span>
                </div>
              </div>

              <!-- Pricing & Margin Grid -->
              <div class="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div>
                  <span class="text-[9px] font-bold text-slate-400 uppercase block">PRICE</span>
                  <span class="font-black text-xs text-slate-900">₱{{ item.sellingPrice.toFixed(2) }}</span>
                </div>
                <div>
                  <span class="text-[9px] font-bold text-slate-400 uppercase block">COST</span>
                  <span class="font-bold text-xs text-slate-600">₱{{ item.costPrice.toFixed(2) }}</span>
                </div>
                <div>
                  <span class="text-[9px] font-bold text-emerald-600 uppercase block">MARGIN</span>
                  <span class="font-black text-xs text-emerald-600">{{ item.marginPct }}</span>
                </div>
              </div>

              <!-- Stock Controls -->
              <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                <div>
                  <span class="text-[10px] text-slate-400 block">{{ item.vendor }}</span>
                  <span class="text-[10px] font-medium text-slate-500">{{ item.leadTime }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span :class="['text-[11px] font-bold px-2 py-0.5 rounded-full', item.status.includes('Low') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700']">{{ item.status }}</span>
                  <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <button @click="adjustStock(item, -1)" class="w-6 h-6 flex items-center justify-center hover:bg-slate-100 font-bold text-slate-600">-</button>
                    <span class="px-2 font-mono font-bold text-xs">{{ item.stock }}</span>
                    <button @click="adjustStock(item, 1)" class="w-6 h-6 flex items-center justify-center hover:bg-slate-100 font-bold text-slate-600">+</button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- DESKTOP INVENTORY TABLE -->
          <template v-else>
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
          </template>
        </div>

        <!-- ================= VIEW 4: PRODUCT CATALOG (From Image 4 & Screenshot 1) ================= -->
        <div v-else-if="currentAdminSection === 'products'" class="space-y-3.5 sm:space-y-5">
          <!-- MOBILE PRODUCTS (Screenshot 1) -->
          <template v-if="isMobile">
            <!-- Header Card with Cancel & Save -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs space-y-3.5 text-slate-900 border border-slate-200/40">
              <div>
                <h2 class="text-lg font-black text-slate-900 leading-tight">Product Catalog & Upload Module</h2>
                <p class="text-[11px] text-slate-500 mt-1">Upload products with AI vision auto-fill, media gallery, pricing, and classification.</p>
              </div>

              <!-- Button Row matching Screenshot 1 -->
              <div class="flex items-center gap-3 pt-1">
                <button 
                  @click="switchSection('inventory')" 
                  class="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 text-center transition-colors"
                >
                  Cancel
                </button>
                <button 
                  @click="handleSaveProduct" 
                  class="flex-1 py-3 px-4 rounded-2xl bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-xs text-center shadow-md flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>🚀</span>
                  <span>Save & Publish Product</span>
                </button>
              </div>
            </div>

            <!-- Card 2: Basic Product Information matching Screenshot 1 -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs space-y-3.5 text-slate-900 border border-slate-200/40 text-xs">
              <h3 class="text-xs font-black uppercase text-slate-800 tracking-wider">1. BASIC PRODUCT INFORMATION</h3>
              
              <div>
                <label class="font-bold text-slate-700 block mb-1 text-[11px]">Product Title *</label>
                <input 
                  v-model="uploadForm.title" 
                  type="text" 
                  placeholder="e.g. Pokémon TCG: Terastal Festival ex Bo" 
                  class="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-2xs" 
                />
              </div>

              <div>
                <label class="font-bold text-slate-700 block mb-1 text-[11px]">Description (Normal text & tabs saved in DB)</label>
                <textarea 
                  v-model="uploadForm.description" 
                  rows="4" 
                  placeholder="Detailed product description, features, box contents (spacing and tabs supported)..." 
                  class="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-2xs" 
                />
              </div>

              <div>
                <label class="font-bold text-slate-700 block mb-1 text-[11px]">SKU (Stock Keeping Unit) *</label>
                <input 
                  v-model="uploadForm.sku" 
                  type="text" 
                  placeholder="E.G. TCG-PKM-001" 
                  class="w-full font-mono bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-2xs" 
                />
              </div>

              <div>
                <label class="font-bold text-slate-700 block mb-1 text-[11px]">Condition *</label>
                <select 
                  v-model="uploadForm.condition" 
                  class="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-slate-400 shadow-2xs"
                >
                  <option value="" disabled selected>Select condition...</option>
                  <option value="Brand New Factory Sealed">Brand New Factory Sealed</option>
                  <option value="Near Mint (Pack Fresh)">Near Mint (Pack Fresh)</option>
                  <option value="Mint (Graded 9-10)">Mint (Graded 9-10)</option>
                  <option value="Lightly Played">Lightly Played</option>
                </select>
              </div>

              <div>
                <label class="font-bold text-slate-700 block mb-1 text-[11px]">Available Stock *</label>
                <input 
                  v-model="uploadForm.stock" 
                  type="number" 
                  placeholder="0" 
                  class="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-2xs" 
                />
              </div>
            </div>

            <!-- Card 3: AI Gemini Auto-Population & Media Gallery -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs space-y-3.5 text-slate-900 border border-slate-200/40 text-xs">
              <div class="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
                <div>
                  <span class="font-black text-purple-900 text-xs">✨ Google Gemini Auto-Population</span>
                  <p class="text-[10px] text-purple-700 mt-0.5">Upload card photo to auto-fill title, set, rarity, and specs</p>
                </div>
                <span class="px-2 py-0.5 rounded-lg bg-purple-200 text-purple-800 text-[10px] font-bold">Active</span>
              </div>
              <div @click="handleSimulatedGeminiIntake" class="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center cursor-pointer hover:border-purple-500 bg-slate-50/50">
                <Upload class="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <span class="text-xs font-bold text-slate-800 block">Click to upload product photo or drag & drop</span>
                <span class="text-[10px] text-slate-400">Supports PNG, JPG, WEBP up to 10MB</span>
                <div v-if="isUploadingImage" class="text-xs text-purple-600 font-bold pt-2 animate-pulse">Gemini Vision parsing card...</div>
              </div>
            </div>

            <!-- Card 4: Pricing & Taxonomy -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs space-y-3 text-slate-900 border border-slate-200/40 text-xs">
              <h3 class="text-xs font-black uppercase text-slate-800 tracking-wider">2. PRICING & CATEGORIZATION</h3>
              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <label class="font-bold text-slate-700 block mb-1 text-[11px]">Selling Price (PHP) *</label>
                  <input v-model="uploadForm.pricePhp" type="number" class="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 font-bold" />
                </div>
                <div>
                  <label class="font-bold text-slate-700 block mb-1 text-[11px]">Primary Category</label>
                  <select v-model="uploadForm.primaryCategory" class="w-full bg-white border border-slate-200 rounded-2xl px-3 py-2.5">
                    <option>TCG (Trading Cards)</option>
                    <option>Gunpla & Models</option>
                    <option>Anime Figures</option>
                  </select>
                </div>
              </div>
            </div>
          </template>

          <!-- DESKTOP PRODUCT CATALOG -->
          <template v-else>
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
          </template>
        </div>

        <!-- ================= VIEW 5: AUCTIONS & BIDDING (From New Image 1 & Screenshot 2) ================= -->
        <div v-else-if="currentAdminSection === 'auctions'" class="space-y-3.5 sm:space-y-5">
          <!-- MOBILE AUCTIONS (Screenshot 2) -->
          <template v-if="isMobile">
            <!-- Header Card -->
            <div class="bg-[#384152] p-5 rounded-[26px] text-white shadow-xs space-y-3.5">
              <div class="flex items-start gap-3">
                <span class="text-3xl shrink-0 mt-0.5">🔨</span>
                <div class="space-y-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h2 class="text-xl font-black leading-tight tracking-tight">Auctions &amp; Bidding Arena</h2>
                    <span class="bg-[#123835] text-[#00d09c] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#00d09c]/30 tracking-wider uppercase">
                      PESSIMISTIC DB LOCKS
                    </span>
                  </div>
                  <p class="text-xs text-slate-300 leading-relaxed">
                    Create product auction lots, configure starting amounts, end timestamps, and monitor live bids in real-time.
                  </p>
                </div>
              </div>

              <!-- Button Row -->
              <div class="flex items-center gap-3 pt-1">
                <button class="flex-1 py-3 px-3 rounded-2xl bg-[#252c3b] hover:bg-[#1e2430] text-white text-xs font-bold text-center border border-white/5 transition-colors">
                  Live Arena ↗
                </button>
                <button class="flex-1 py-3 px-3 rounded-2xl bg-[#00a87e] hover:bg-[#00926d] text-white text-xs font-black text-center shadow-md transition-colors flex items-center justify-center gap-1">
                  <span>+</span>
                  <span>Launch Auction</span>
                </button>
              </div>
            </div>

            <!-- 4 Stat Cards in 2x2 Grid -->
            <div class="grid grid-cols-2 gap-3">
              <!-- TOTAL LOTS -->
              <div class="bg-[#485366] rounded-[22px] p-4 text-white shadow-xs space-y-1">
                <span class="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">TOTAL LOTS</span>
                <div class="text-3xl font-black text-white">0</div>
                <span class="text-[10px] text-slate-400 block">Registered auction catalog</span>
              </div>

              <!-- ACTIVE NOW -->
              <div class="bg-[#485366] rounded-[22px] p-4 text-white shadow-xs space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-[#00e5a3] uppercase tracking-wider">ACTIVE NOW</span>
                  <span class="bg-[#00e5a3]/20 text-[#00e5a3] text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#00e5a3]"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-[#00e5a3]"></span>
                  </span>
                </div>
                <div class="text-3xl font-black text-[#00e5a3]">0</div>
                <span class="text-[10px] text-slate-400 block">Accepting live &amp; proxy bids</span>
              </div>

              <!-- BIDS PLACED -->
              <div class="bg-[#485366] rounded-[22px] p-4 text-white shadow-xs space-y-1">
                <span class="text-[10px] font-bold text-[#818cf8] uppercase tracking-wider block">BIDS PLACED</span>
                <div class="text-3xl font-black text-[#818cf8]">0</div>
                <span class="text-[10px] text-slate-400 block">Immutable ledger transactions</span>
              </div>

              <!-- TOP CURRENT PRICE -->
              <div class="bg-[#485366] rounded-[22px] p-4 text-white shadow-xs space-y-1">
                <span class="text-[10px] font-bold text-[#fbbf24] uppercase tracking-wider block">TOP CURRENT PRICE</span>
                <div class="text-3xl font-black text-[#fbbf24]">₱0.00</div>
                <span class="text-[10px] text-slate-400 block">Highest active lot bid</span>
              </div>
            </div>

            <!-- Filter & Search Card -->
            <div class="bg-[#525d72] rounded-[26px] p-3 shadow-xs space-y-2.5">
              <!-- Tab Pill Bar -->
              <div class="bg-[#131722] rounded-[20px] p-1 flex items-center justify-between text-xs">
                <button 
                  v-for="f in ['All (0)', 'Active (0)', 'Ended (0)', 'Cancelled']" 
                  :key="f"
                  @click="auctionFilter = f"
                  :class="[
                    'py-2 px-3 rounded-[16px] transition-all text-center',
                    auctionFilter === f || (auctionFilter === 'All' && f === 'All (0)') 
                      ? 'bg-[#2b3548] text-white font-bold shadow-xs' 
                      : 'text-slate-400 font-semibold hover:text-white'
                  ]"
                >
                  {{ f }}
                </button>
              </div>

              <!-- Search Bar -->
              <div class="bg-[#0d1017] rounded-[18px] px-4 py-3 flex items-center gap-2.5 text-slate-400 text-xs border border-white/5">
                <Search class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search by lot # or title..." 
                  class="w-full bg-transparent text-white placeholder:text-slate-500 text-xs focus:outline-none" 
                />
              </div>
            </div>
          </template>

          <!-- DESKTOP AUCTIONS -->
          <template v-else>
            <!-- Dark slate header card matching Image 1 -->
            <div class="p-5 rounded-2xl bg-[#2c3345] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div class="flex items-start gap-3">
                <div class="p-2.5 rounded-xl bg-slate-700/60 text-amber-400">
                  <Gavel class="w-6 h-6" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="text-lg font-black tracking-tight">Auctions &amp; Bidding Arena</h2>
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
                <span class="text-[10px] text-slate-400 block">Accepting live &amp; proxy bids</span>
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
          </template>
        </div>

        <!-- ================= VIEW 6: CUSTOMERS & CRM (From New Image 2 & Screenshot 3) ================= -->
        <div v-else-if="currentAdminSection === 'customers'" class="space-y-3.5 sm:space-y-5">
          <!-- MOBILE CUSTOMERS / CRM (Screenshot 3) -->
          <template v-if="isMobile">
            <!-- Header Card with sub-box pills -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs space-y-3.5 text-slate-900 border border-slate-200/40">
              <div>
                <h2 class="text-lg font-black text-slate-900 leading-tight">Customer Relationship Management (CRM)</h2>
                <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                  Collector profiles, purchase history LTV, behavioral segmentation, and centralized inquiry inbox.
                </p>
              </div>

              <!-- Sub-tabs pill box -->
              <div class="bg-[#f0f4f9] rounded-[20px] p-2 space-y-1.5">
                <div class="bg-white rounded-[14px] px-3.5 py-2 shadow-xs flex items-center justify-between text-xs font-bold text-slate-800">
                  <span class="flex items-center gap-1.5">👥 Customer Profiles</span>
                  <span class="text-slate-400 font-semibold text-[11px]">(4)</span>
                </div>
                <div class="px-3.5 py-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span class="flex items-center gap-1.5">💬 Live Chat Desk</span>
                  <span class="text-slate-400 font-semibold text-[11px]">(3)</span>
                </div>
                <div class="px-3.5 py-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span class="flex items-center gap-1.5">⭐ Customer Reviews</span>
                  <span class="text-slate-400 font-semibold text-[11px]">(0)</span>
                </div>
              </div>
            </div>

            <!-- Search & Filters Card -->
            <div class="bg-white p-3.5 rounded-[26px] shadow-xs space-y-2.5 border border-slate-200/40">
              <div class="bg-[#f0f4f9] rounded-[18px] px-3.5 py-2.5 flex items-center gap-2 text-xs text-slate-700 border border-slate-200/60">
                <Search class="w-4 h-4 text-slate-400 shrink-0" />
                <input 
                  v-model="crmSearchQuery" 
                  type="text" 
                  placeholder="Search collectors by name, email, or city.." 
                  class="w-full bg-transparent text-slate-800 placeholder:text-slate-400 text-xs focus:outline-none" 
                />
              </div>

              <div class="bg-[#f0f4f9] rounded-[18px] p-1 flex items-center justify-between text-xs">
                <button 
                  v-for="seg in ['All', 'VIP', 'Regular', 'Wholesale', 'Inactive']" 
                  :key="seg"
                  @click="crmSegmentFilter = seg"
                  :class="[
                    'py-1.5 px-3 rounded-[14px] transition-all text-center',
                    crmSegmentFilter === seg ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 font-semibold hover:text-slate-800'
                  ]"
                >
                  {{ seg }}
                </button>
              </div>
            </div>

            <!-- Customer Profiles Card -->
            <div class="bg-white p-4 rounded-[26px] shadow-xs border border-slate-200/40 space-y-3">
              <div class="grid grid-cols-[1.1fr_1.4fr_0.7fr] text-[10px] font-black text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                <span>CUSTOMER NAME</span>
                <span>CONTACT &amp; LOCATION</span>
                <span class="text-right">SEGMENT RANK</span>
              </div>

              <div class="divide-y divide-slate-100">
                <div 
                  v-for="cust in filteredCrm" 
                  :key="cust.id" 
                  class="grid grid-cols-[1.1fr_1.4fr_0.7fr] items-center gap-2 py-3 first:pt-1 last:pb-1"
                >
                  <!-- Col 1: Avatar + Name + Cust Code -->
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-9 h-9 rounded-full bg-[#0f172a] text-white font-black flex items-center justify-center text-xs shrink-0 shadow-2xs">
                      {{ cust.name.charAt(0) }}
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-xs text-slate-900 truncate leading-tight">{{ cust.name }}</div>
                      <div class="text-[10px] text-slate-400 font-mono uppercase mt-0.5">{{ cust.custCode }}</div>
                    </div>
                  </div>

                  <!-- Col 2: Email + Location -->
                  <div class="min-w-0">
                    <div class="text-[11px] text-slate-700 font-medium truncate leading-tight">{{ cust.email }}</div>
                    <div class="text-[10px] text-slate-400 truncate mt-0.5">{{ cust.location }}</div>
                  </div>

                  <!-- Col 3: Segment Rank Pill -->
                  <div class="text-right">
                    <span class="bg-[#dbeafe] text-[#1d4ed8] font-bold text-[10px] px-2.5 py-1 rounded-full inline-block">
                      {{ cust.segment }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- DESKTOP CUSTOMERS / CRM -->
          <template v-else>
            <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-lg sm:text-xl font-black text-slate-900">Customer Relationship Management (CRM)</h2>
                <p class="text-xs text-slate-500">Collector profiles, purchase history, LTV, behavioral segmentation, and central customer inbox.</p>
              </div>
              <div class="flex items-center gap-1.5 text-xs font-bold">
                <span class="px-3 py-1 rounded-xl bg-slate-900 text-white">👥 Customer Profiles (4)</span>
                <span class="px-3 py-1 rounded-xl bg-slate-100 text-slate-600">💬 Live Chat Desk (3)</span>
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
          </template>
        </div>

        <!-- ================= VIEW 7: MARKETING & PROMOS (From New Image 3 & Screenshot 4) ================= -->
        <div v-else-if="currentAdminSection === 'marketing'" class="space-y-3.5 sm:space-y-5">
          <!-- MOBILE MARKETING & PROMOTIONS (Screenshot 4) -->
          <template v-if="isMobile">
            <!-- Header Card with AUTOMATED badge & sub-box pills -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs space-y-3.5 text-slate-900 border border-slate-200/40">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h2 class="text-lg font-black text-slate-900 leading-tight">Marketing &amp; Promotions Engine</h2>
                  <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                    Discount codes, cross-sell/upsell matrices, abandoned cart recovery, and search engine optimization.
                  </p>
                </div>
                <span class="bg-rose-50 text-rose-500 border border-rose-200/70 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-0.5">
                  AUTOMATED
                </span>
              </div>

              <!-- Sub-tabs pill grid -->
              <div class="bg-[#f0f4f9] rounded-[20px] p-2 grid grid-cols-2 gap-2 text-xs">
                <div class="bg-white rounded-[14px] p-2.5 shadow-xs flex items-center justify-between font-bold text-slate-800">
                  <span class="flex items-center gap-1.5">🏷️ Discount Codes</span>
                  <span class="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold">0</span>
                </div>
                <div class="p-2.5 flex items-center justify-between font-semibold text-slate-600">
                  <span class="flex items-center gap-1.5">🔄 Upsell &amp; Bundles</span>
                  <span class="bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">64</span>
                </div>
              </div>
            </div>

            <!-- Title Row: Active Promotional Coupons + Button -->
            <div class="flex items-center justify-between px-1 pt-1">
              <div>
                <h3 class="text-xs font-black text-slate-900 uppercase tracking-wide">ACTIVE PROMOTIONAL COUPONS</h3>
                <p class="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  Configure percentage markdowns, fixed discounts, and free shipping triggers
                </p>
              </div>
              <button class="bg-[#0f172a] hover:bg-slate-800 text-white text-[11px] font-bold px-3.5 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm text-center leading-tight shrink-0 transition-colors">
                <span class="text-xs">+</span>
                <span>Create Promo Code</span>
              </button>
            </div>

            <!-- Coupons Table Card with horizontal scrollbar track -->
            <div class="bg-white p-4 rounded-[26px] shadow-xs border border-slate-200/40 overflow-hidden">
              <div class="overflow-x-auto pb-2">
                <table class="w-full text-left text-xs whitespace-nowrap min-w-[500px]">
                  <thead>
                    <tr class="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                      <th class="py-2.5 pr-4">COUPON CODE</th>
                      <th class="py-2.5 pr-4">DISCOUNT TYPE &amp; VALUE</th>
                      <th class="py-2.5 pr-4">REDEMPTIONS</th>
                      <th class="py-2.5 pr-4">USAGE LIMIT</th>
                      <th class="py-2.5 pr-2">EXPIRY DATE</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="c in couponsList" :key="c.code" class="hover:bg-slate-50/60">
                      <td class="py-3 pr-4 font-mono font-bold text-slate-900">{{ c.code }}</td>
                      <td class="py-3 pr-4 font-semibold text-slate-700">{{ c.type }}</td>
                      <td class="py-3 pr-4 font-mono text-slate-500">{{ c.redemptions }}</td>
                      <td class="py-3 pr-4 text-slate-600">{{ c.limit }}</td>
                      <td class="py-3 pr-2 font-mono text-slate-500">{{ c.expiry }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- Horizontal scrollbar indicator pill track matching Screenshot 4 -->
              <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div class="w-2/5 h-full bg-slate-300 rounded-full"></div>
              </div>
            </div>
          </template>

          <!-- DESKTOP MARKETING & PROMOTIONS -->
          <template v-else>
            <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-lg sm:text-xl font-black text-slate-900">Marketing &amp; Promotions Engine</h2>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-600 font-bold border border-rose-200">AUTOMATED</span>
                </div>
                <p class="text-xs text-slate-500">Discount codes, cross-sell/upsell matrices, abandoned cart recovery, and search engine optimization.</p>
              </div>
              <div class="flex items-center gap-1.5 text-xs font-bold">
                <span class="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600">🎟️ Discount Codes (2)</span>
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
                  <span class="px-3 py-1 rounded-lg bg-slate-900 text-white">AI Generator &amp; Editor</span>
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
                      <span class="text-xs font-bold uppercase text-slate-500">2. EDIT METADATA &amp; KEYWORDS</span>
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
                      💾 Save &amp; Publish SEO Metadata
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
          </template>
        </div>

        <!-- ================= VIEW 8: CMS & STOREFRONT (From New Image 4 & Screenshot 5) ================= -->
        <div v-else-if="currentAdminSection === 'cms'" class="space-y-3.5 sm:space-y-5">
          <!-- MOBILE CMS (Screenshot 5) -->
          <template v-if="isMobile">
            <!-- Header Card with LIVE STOREFRONT SYNC badge & sub-box pills -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs space-y-3.5 text-slate-900 border border-slate-200/40">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h2 class="text-lg font-black text-slate-900 leading-tight">Content Management System (CMS)</h2>
                  <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                    Changes made here immediately update the storefront hero banners, promotional coupons, legal policy pages, and blogs.
                  </p>
                </div>
                <span class="bg-[#e6fbf3] text-[#00a87e] border border-[#a3f0d5] text-[9px] font-black px-2.5 py-1 rounded-xl uppercase leading-tight text-center shrink-0 mt-0.5">
                  LIVE<br/>STOREFRONT<br/>SYNC
                </span>
              </div>

              <!-- Sub-tabs horizontal scrollable container -->
              <div class="bg-[#f0f4f9] rounded-[20px] p-2 flex items-center gap-2 overflow-x-auto text-xs">
                <div class="bg-white rounded-[14px] px-3.5 py-2 shadow-xs flex items-center gap-2 shrink-0 font-bold text-slate-800">
                  <span>🎨 Store Banners</span>
                  <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">2</span>
                </div>
                <div class="px-3 py-2 flex items-center gap-2 shrink-0 font-semibold text-slate-600">
                  <span>📄 Static Pages</span>
                </div>
                <div class="px-3 py-2 flex items-center gap-2 shrink-0 font-semibold text-slate-600">
                  <span>✍️ Blogs</span>
                </div>
              </div>
            </div>

            <!-- Storefront Banner Slots Controls Card -->
            <div class="bg-white p-4 rounded-[26px] shadow-xs border border-slate-200/40 flex items-center justify-between gap-2">
              <div>
                <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider">STOREFRONT BANNER SLOTS</h3>
                <p class="text-[10px] text-slate-500 mt-0.5 leading-tight max-w-[190px]">
                  Banner 1 controls the top Hero Banner. Banner 2 controls the Promotional Collector Coupon strip.
                </p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button class="bg-[#f0f4f9] hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-3 py-2.5 rounded-xl border border-slate-200/70 text-center leading-tight transition-colors">
                  + Add Banner Slot
                </button>
                <button @click="saveBanners" class="bg-[#0f172a] hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-2.5 rounded-xl text-center leading-tight shadow-sm transition-colors">
                  Deploy Banners to Storefront
                </button>
              </div>
            </div>

            <!-- Slot #1 Card matching Screenshot 5 -->
            <div class="bg-white p-4 rounded-[26px] shadow-xs border border-slate-200/40 space-y-3.5 text-xs text-slate-900">
              <!-- Top Badges & Actions -->
              <div class="flex items-center gap-2 flex-wrap pb-1">
                <span class="bg-rose-50 text-rose-600 border border-rose-200 font-bold text-[11px] px-2.5 py-1 rounded-lg">
                  Slot #1 • bnr-1
                </span>
                <span class="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px] px-2 py-1 rounded-lg uppercase">
                  PRIMARY HERO BANNER
                </span>
                <div class="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px] ml-1">
                  <!-- Custom Red Square Checkbox from Screenshot -->
                  <div class="w-4 h-4 rounded bg-[#e11d48] flex items-center justify-center text-white text-[10px] font-black">
                    ✓
                  </div>
                  <span class="text-emerald-700 font-bold">Visible on Storefront</span>
                </div>
                <button class="text-slate-400 hover:text-rose-500 text-xs font-semibold flex items-center gap-0.5 ml-auto">
                  <span>✕</span>
                  <span>Delete</span>
                </button>
              </div>

              <!-- Field 1: Banner Headline Title -->
              <div>
                <label class="font-bold text-slate-700 block mb-1 text-[11px]">Banner Headline Title</label>
                <input 
                  v-model="heroBanner.headline" 
                  type="text" 
                  class="rounded-[16px] border border-slate-200 bg-[#fbfcfe] px-3.5 py-2.5 text-xs font-semibold text-slate-800 w-full focus:outline-none focus:border-slate-400 shadow-2xs" 
                />
              </div>

              <!-- Field 2: Top Badge Label -->
              <div>
                <label class="font-bold text-slate-700 block mb-1 text-[11px]">Top Badge Label</label>
                <input 
                  v-model="heroBanner.badge" 
                  type="text" 
                  class="rounded-[16px] border border-slate-200 bg-[#fbfcfe] px-3.5 py-2.5 text-xs font-semibold text-slate-800 w-full focus:outline-none focus:border-slate-400 shadow-2xs font-mono" 
                />
              </div>

              <!-- Field 3: Subtitle / Descriptive Copy -->
              <div>
                <label class="font-bold text-slate-700 block mb-1 text-[11px]">Subtitle / Descriptive Copy</label>
                <textarea 
                  v-model="heroBanner.subtitle" 
                  rows="3" 
                  class="rounded-[16px] border border-slate-200 bg-[#fbfcfe] px-3.5 py-2.5 text-xs font-medium text-slate-700 w-full resize-none focus:outline-none focus:border-slate-400 shadow-2xs leading-relaxed" 
                />
              </div>
            </div>
          </template>

          <!-- DESKTOP CMS -->
          <template v-else>
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
          </template>
        </div>

        <!-- ================= VIEW 9: ANALYTICS & REPORTS (From Screenshot media_1791465286979_bdc225a2.png) ================= -->
        <div v-else-if="currentAdminSection === 'analytics'" class="space-y-3.5 sm:space-y-5">
          <!-- MOBILE ANALYTICS (Screenshot) -->
          <template v-if="isMobile">
            <!-- Header Card -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs space-y-3.5 text-slate-900 border border-slate-200/40">
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="bg-[#e0e7ff] text-[#4f46e5] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    LIVE SP TELEMETRY
                  </span>
                  <span class="text-slate-400 text-xs font-medium">Reconciled at 08:49 PM</span>
                </div>
                <h2 class="text-xl font-black text-slate-900 leading-tight">Analytics &amp; Executive Reporting</h2>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Gross vs. net sales reconciliations, Philippine 12% VAT audit, inventory velocity, and capital liquidation analysis.
                </p>
              </div>

              <!-- Time-range selector pill container -->
              <div class="bg-[#f0f4f9] rounded-[20px] p-1.5 flex items-center justify-between text-xs font-bold text-slate-500">
                <button 
                  v-for="r in ['7D', '30D', '90D', 'YEAR', 'ALL']" 
                  :key="r"
                  @click="analyticsRange = r"
                  :class="[
                    'py-2 px-3 rounded-[14px] transition-all text-center',
                    analyticsRange === r ? 'bg-white text-slate-900 font-black shadow-xs' : 'hover:text-slate-900'
                  ]"
                >
                  {{ r }}
                </button>
              </div>

              <!-- Export Excel Report Button matching Screenshot -->
              <button class="bg-[#00a87e] hover:bg-[#00926d] text-white font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs w-full transition-colors">
                <span class="text-sm">📥</span>
                <span>🍰 Export Excel Report</span>
              </button>
            </div>

            <!-- Metric Card 1: GROSS SALES -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs border border-slate-200/40 space-y-1 text-slate-900">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">GROSS SALES</span>
                <span class="bg-[#e6fbf3] text-[#00a87e] text-[10px] font-bold px-2.5 py-0.5 rounded-full">Reconciled</span>
              </div>
              <div class="text-3xl font-black text-slate-900 pt-0.5">₱370.00</div>
              <div class="text-xs text-slate-400">2 orders billed</div>
            </div>

            <!-- Metric Card 2: NET REALIZED -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs border border-slate-200/40 space-y-1 text-slate-900">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">NET REALIZED</span>
                <span class="bg-[#eef2ff] text-[#6366f1] text-[10px] font-bold px-2.5 py-0.5 rounded-full">Store Net</span>
              </div>
              <div class="text-3xl font-black text-[#00a87e] pt-0.5">₱370.00</div>
              <div class="text-xs text-slate-400">Post-refunds &amp; reversals</div>
            </div>

            <!-- Metric Card 3: 12% VAT LIABILITY -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs border border-slate-200/40 space-y-1 text-slate-900">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">12% VAT LIABILITY</span>
                <span class="bg-[#eef2ff] text-[#6366f1] text-[10px] font-bold px-2.5 py-0.5 rounded-full">BIR Tax</span>
              </div>
              <div class="text-3xl font-black text-[#6366f1] pt-0.5">₱44.40</div>
              <div class="text-xs text-slate-400">Tax compliance audit</div>
            </div>

            <!-- Metric Card 4: EST. LOGISTICS -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs border border-slate-200/40 space-y-1 text-slate-900">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">EST. LOGISTICS</span>
                <span class="bg-[#fef3c7] text-[#d97706] text-[10px] font-bold px-2.5 py-0.5 rounded-full">Couriers</span>
              </div>
              <div class="text-3xl font-black text-slate-900 pt-0.5">₱0.00</div>
              <div class="text-xs text-slate-400">Fulfillment courier liability</div>
            </div>

            <!-- Metric Card 5: AVG ORDER VALUE -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs border border-slate-200/40 space-y-1 text-slate-900">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">AVG ORDER VALUE</span>
                <span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Per Ticket</span>
              </div>
              <div class="text-3xl font-black text-slate-900 pt-0.5">₱185.00</div>
              <div class="text-xs text-slate-400">Per transaction basket average</div>
            </div>

            <!-- Metric Card 6: TIED CAPITAL -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs border border-slate-200/40 space-y-1 text-slate-900">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-rose-500 uppercase tracking-wider">TIED CAPITAL</span>
                <span class="bg-rose-50 text-rose-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Warehouse</span>
              </div>
              <div class="text-3xl font-black text-slate-900 pt-0.5">₱4,120.00</div>
              <div class="text-xs text-slate-400">Warehouse stock valuation</div>
            </div>
          </template>

          <!-- DESKTOP ANALYTICS -->
          <template v-else>
            <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 mb-1">
                  LIVE EP TELEMETRY • Reconciled today 9:10 PM
                </div>
                <h2 class="text-lg sm:text-xl font-black text-slate-900">Analytics &amp; Executive Reporting</h2>
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
          </template>
        </div>

        <!-- ================= VIEW 10: SETTINGS (From Screenshot media_1791465286994_7c0d1e0b.png) ================= -->
        <div v-else-if="currentAdminSection === 'settings'" class="space-y-3.5 sm:space-y-5">
          <!-- MOBILE SETTINGS (Screenshot) -->
          <template v-if="isMobile">
            <!-- Header Card -->
            <div class="bg-white p-5 rounded-[26px] shadow-xs space-y-3.5 text-slate-900 border border-slate-200/40">
              <div>
                <h2 class="text-lg font-black text-slate-900 leading-tight">Settings &amp; Store Configuration</h2>
                <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                  Staff RBAC permissions, payment gateway APIs, logistics tax zones, and currency localization.
                </p>
              </div>

              <!-- Sub-tab horizontal scrollable container -->
              <div class="bg-[#f0f4f9] rounded-[20px] p-2 flex items-center gap-2 overflow-x-auto text-xs">
                <div class="bg-white rounded-[14px] px-3.5 py-2 shadow-xs flex items-center gap-1.5 font-bold text-slate-800 shrink-0">
                  <span>👥 Staff &amp; RBAC</span>
                </div>
                <div class="px-3 py-2 flex items-center gap-1.5 font-semibold text-slate-600 shrink-0">
                  <span>💳 Payment Gateways</span>
                </div>
                <div class="px-3 py-2 flex items-center gap-1.5 font-semibold text-slate-600 shrink-0">
                  <span>🚚 Shipping &amp; Tax</span>
                </div>
              </div>
            </div>

            <!-- Section Title Row: Staff Role-based Permissions + Add Staff Button -->
            <div class="flex items-center justify-between px-1 pt-1">
              <div>
                <h3 class="text-xs font-black text-slate-900 uppercase tracking-wide">STAFF ROLE-BASED PERMISSIONS</h3>
                <p class="text-[10px] text-slate-500 mt-0.5 max-w-[210px] leading-tight">
                  Configure access levels for administrators, inventory managers, and pack room fulfillment crews
                </p>
              </div>
              <button class="bg-[#0f172a] hover:bg-slate-800 text-white text-[11px] font-bold px-3.5 py-2.5 rounded-2xl shadow-sm text-center leading-tight shrink-0 transition-colors">
                + Add Staff Member
              </button>
            </div>

            <!-- Staff Members Card -->
            <div class="bg-white p-4 rounded-[26px] shadow-xs border border-slate-200/40 space-y-3 text-xs">
              <div class="grid grid-cols-[1.4fr_1.1fr] text-[10px] font-black text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                <span>STAFF MEMBER</span>
                <span class="text-right">ASSIGNED ROLE</span>
              </div>

              <div class="divide-y divide-slate-100">
                <div 
                  v-for="staff in staffMembers" 
                  :key="staff.email"
                  class="grid grid-cols-[1.4fr_1.1fr] items-center gap-2 py-3.5 first:pt-1 last:pb-1"
                >
                  <!-- Col 1: Avatar + Name + Email -->
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-9 h-9 rounded-full bg-[#f1f5f9] text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                      {{ staff.name.charAt(0) }}
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-xs text-slate-900 truncate leading-tight">{{ staff.name }}</div>
                      <div class="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{{ staff.email }}</div>
                    </div>
                  </div>

                  <!-- Col 2: Assigned Role Pill -->
                  <div class="text-right">
                    <span 
                      v-if="staff.roleType === 'super-admin'"
                      class="bg-[#fff1f2] text-[#e11d48] border border-rose-200 text-[10px] font-bold px-3 py-1.5 rounded-full text-center inline-block leading-tight"
                    >
                      {{ staff.role }}
                    </span>
                    <span 
                      v-else
                      class="bg-[#eff6ff] text-[#2563eb] border border-blue-200 text-[10px] font-bold px-3 py-1.5 rounded-full text-center inline-block leading-tight"
                    >
                      {{ staff.role }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- DESKTOP SETTINGS -->
          <template v-else>
            <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <h2 class="text-lg sm:text-xl font-black text-slate-900">Settings &amp; Store Configuration</h2>
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
          </template>
        </div>

      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-drawer-enter-active,
.admin-drawer-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}
.admin-drawer-enter-from,
.admin-drawer-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
