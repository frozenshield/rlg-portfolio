<script setup>
import { ref, computed, reactive } from 'vue'
import { usePortfolioStore } from '../../../stores/portfolioStore'
import { 
  Sparkles, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  CreditCard, 
  Copy, 
  Check, 
  ExternalLink,
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  FileText,
  DollarSign,
  Briefcase,
  ChevronDown,
  X,
  Search,
  Users,
  LayoutDashboard,
  Monitor,
  Tablet,
  Smartphone,
  Grid,
  List,
  Eye,
  Phone,
  Mail,
  MapPin,
  Building2,
  Bell,
  Crown,
  Lock,
  Signal,
  Wifi,
  Menu,
  Filter,
  ArrowUpRight,
  Calendar
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()

// Active ProposalAI Page / Workspace:
// 'proposals' (Image 1) | 'catalog' (Image 2) | 'clients' (Image 3) | 'dashboard' (Image 4) | 'create' (Live Studio)
const activePage = ref('proposals')

// Mobile Navigation Drawer State
const isMobileDrawerOpen = ref(false)

// Mobile Studio Tab Toggle: 'form' | 'preview'
const mobileStudioTab = ref('form')

// Current URL computed for address bar simulation
const currentUrl = computed(() => {
  const pageMap = {
    dashboard: 'dashboard',
    proposals: 'proposals',
    clients: 'clients',
    catalog: 'catalog',
    create: 'proposals/create'
  }
  const path = pageMap[activePage.value] || 'proposals'
  if (portfolioStore.activeDevice === 'mobile') {
    return `cap://localhost/${path}`
  }
  return `http://localhost:5173/${path}`
})

// Breadcrumbs computed based on active page
const breadcrumbs = computed(() => {
  switch (activePage.value) {
    case 'dashboard':
      return { section: 'Workspace', page: 'Dashboard Overview' }
    case 'clients':
      return { section: 'Directory', page: 'Client Accounts' }
    case 'catalog':
      return { section: 'Inventory', page: 'Services & Pricing Catalog' }
    case 'create':
      return { section: 'Workspace', page: 'Create Proposal Studio' }
    case 'proposals':
    default:
      return { section: 'Workspace', page: 'Proposals Directory' }
  }
})

// Resolution Label
const resolutionLabel = computed(() => {
  switch (portfolioStore.activeDevice) {
    case 'mobile':
      return '390 × 844 px • Mobile Smartphone (Capacitor PWA)'
    case 'tablet':
      return '1024 × 768 px • Enterprise Tablet Viewport'
    case 'desktop':
    default:
      return '1440 × 900 px • Enterprise Desktop Widescreen'
  }
})

// ================= 1. PROPOSALS DIRECTORY DATA (Image 1) =================
const proposalFilter = ref('All Proposals')
const proposalSearch = ref('')
const proposalSort = ref('Newest First')
const proposalViewMode = ref('grid') // 'grid' | 'list'

const proposalsList = ref([
  {
    id: 'PROP-2026-884',
    status: 'Drafting',
    statusColor: 'amber',
    title: 'Strategic AI Modernization & Cost Optimization Proposal',
    description: 'Turnkey AI modernization reducing recurring operational overhead by 42% with guaranteed 6-month ROI in PHP.',
    tag: 'Cost-Saving Focus & ROI • 98%',
    clientCompany: 'Apex Retail Solutions Philippines',
    contactPerson: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    amount: 376540.00,
    amountFormatted: '₱376,540.00',
    date: 'Oct 08, 2026'
  },
  {
    id: 'PROP-2026-883',
    status: 'Sent',
    statusColor: 'blue',
    title: 'Autonomous Healthcare Pipeline & SOC2 Hardening',
    description: 'HIPAA and SOC2 compliance automation and microservices zero-downtime failover architecture.',
    tag: 'Security & Compliance • 94%',
    clientCompany: 'OmniHealth Technologies Asia',
    contactPerson: 'David Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    amount: 642000.00,
    amountFormatted: '₱642,000.00',
    date: 'Oct 05, 2026'
  },
  {
    id: 'PROP-2026-882',
    status: 'Approved',
    statusColor: 'green',
    title: 'FinTech Cloud Infrastructure Resilience Sprint',
    description: 'High-frequency transaction streaming engine and multi-cloud disaster recovery.',
    tag: 'Speed-to-Market • 99%',
    clientCompany: 'FinVanguard Global Capital',
    contactPerson: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    amount: 1120000.00,
    amountFormatted: '₱1,120,000.00',
    date: 'Oct 02, 2026'
  },
  {
    id: 'PROP-2026-881',
    status: 'In Review',
    statusColor: 'blue',
    title: 'Supply Chain Automated Dispatcher Model',
    description: 'Real-time fleet rerouting and multi-depot dynamic dispatch optimization with automated SLA safeguards.',
    tag: 'Logistics & SLA • 96%',
    clientCompany: 'Hobby, Toy, and Game Shops',
    contactPerson: 'Russel Luis Gementiza',
    avatar: '/profile.jpg',
    amount: 489000.00,
    amountFormatted: '₱489,000.00',
    date: 'Oct 01, 2026'
  },
  {
    id: 'PROP-2026-879',
    status: 'Archived',
    statusColor: 'gray',
    title: 'Legacy Database to Distributed Snowflake',
    description: 'Complete migration of on-premise transactional schemas to Snowflake with CDC streaming pipelines.',
    tag: 'Modern Data Stack • 91%',
    clientCompany: 'Ayala Ikand',
    contactPerson: 'Maria Santa',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    amount: 890000.00,
    amountFormatted: '₱890,000.00',
    date: 'Sep 28, 2026'
  }
])

const filteredProposals = computed(() => {
  return proposalsList.value.filter(item => {
    // Filter tab
    if (proposalFilter.value === 'Drafting' && item.status !== 'Drafting') return false
    if (proposalFilter.value === 'In Review' && item.status !== 'In Review') return false
    if (proposalFilter.value === 'Sent to Client' && item.status !== 'Sent') return false
    if (proposalFilter.value === 'Approved & Won' && item.status !== 'Approved') return false
    if (proposalFilter.value === 'Archived' && item.status !== 'Archived') return false
    
    // Search query
    if (proposalSearch.value) {
      const q = proposalSearch.value.toLowerCase()
      return item.title.toLowerCase().includes(q) ||
             item.clientCompany.toLowerCase().includes(q) ||
             item.id.toLowerCase().includes(q)
    }
    return true
  })
})

// ================= 2. SERVICES & PRICING CATALOG DATA (Image 2) =================
const catalogItems = ref([
  {
    id: 'cat-1',
    category: 'AI & Data Science',
    title: 'AI Customer Sentiment Engine',
    subtitle: 'Full fine-tuning pipeline with real-time analytics dashboard',
    rateFormatted: '₱195,000.00',
    unitPrice: 195000,
    period: '/ package'
  },
  {
    id: 'cat-2',
    category: 'Cloud Infrastructure',
    title: 'Enterprise Kubernetes DR Suite',
    subtitle: 'Automated multi-region cluster backups and failover automation.',
    rateFormatted: '₱320,000.00',
    unitPrice: 320000,
    period: '/ package'
  },
  {
    id: 'cat-3',
    category: 'Security & Compliance',
    title: 'SOC2 Type II Hardening Sprint',
    subtitle: 'Automated IAM audit, policy as code, and zero-trust perimeter configuration.',
    rateFormatted: '₱245,000.00',
    unitPrice: 245000,
    period: '/ package'
  },
  {
    id: 'cat-4',
    category: 'Database & Storage',
    title: 'Supabase pgvector Cluster Deployment',
    subtitle: 'High-availability Postgres with HNSW indexing and pgvector embedding pipelines.',
    rateFormatted: '₱180,000.00',
    unitPrice: 180000,
    period: '/ package'
  },
  {
    id: 'cat-5',
    category: 'AI & Data Science',
    title: 'Gemini Multimodal Vision Pipeline',
    subtitle: 'Production OCR and multimodal document parsing with high-concurrency queues.',
    rateFormatted: '₱215,000.00',
    unitPrice: 215000,
    period: '/ package'
  },
  {
    id: 'cat-6',
    category: 'Payments & FinTech',
    title: 'Stripe & PayMongo Checkout Integration',
    subtitle: 'Multi-currency payment gateways with webhook verification and recurring billing.',
    rateFormatted: '₱160,000.00',
    unitPrice: 160000,
    period: '/ package'
  }
])

// ================= 3. CLIENT ACCOUNTS DATA (Image 3) =================
const clientAccounts = ref([
  {
    id: 'client-1',
    name: 'Dr. Aris Thorne',
    role: 'Executive',
    company: 'Aegis BioTech Corp',
    email: 'aris@aegisbio.com',
    phone: '+63 917 555 4321',
    location: 'BGC, Taguig City, Metro Manila',
    avatarEmoji: '⚡',
    avatarBg: 'bg-amber-400'
  },
  {
    id: 'client-2',
    name: 'Maria Santa',
    role: 'Managing Director',
    company: 'Ayala Ikand',
    email: 'russelluisg@gmail.com',
    phone: '+63 9568997787',
    location: 'BGC, Taguig City, Metro Manila',
    avatarEmoji: '👩‍💼',
    avatarBg: 'bg-rose-300'
  },
  {
    id: 'client-3',
    name: 'Russel Luis Gementiza',
    role: 'Managing Director',
    company: 'Hobby, Toy, and Game Shops',
    email: 'russelluisg@gmail.com',
    phone: '+63 9',
    location: 'BGC, Taguig City, Metro Manila',
    avatarEmoji: '🤖',
    avatarBg: 'bg-indigo-400'
  },
  {
    id: 'client-4',
    name: 'Russel Luis Gementiza',
    role: 'Managing Director',
    company: 'Hobby, Toy, and Game Shops',
    email: 'russelluisg@gmail.com',
    phone: '+63 95689973694',
    location: 'BGC, Taguig City, Metro Manila',
    avatarEmoji: '👨‍💻',
    avatarBg: 'bg-teal-400'
  }
])

// ================= 4. EXECUTIVE DASHBOARD DATA (Image 4) =================
const dashboardStats = [
  { label: 'Active Proposals', value: '14', change: '+18% this month', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
  { label: 'Total Win Value', value: '₱2,845,000', change: '+32% closing rate', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  { label: 'Client Accounts', value: '42', change: '4 new this week', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
  { label: 'Avg. AI Turnaround', value: '3.2 mins', change: '85% faster', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-100' }
]

const recentProposals = [
  {
    company: 'Apex Retail Solutions Philippines',
    code: 'PROP-2026-884 • Just now',
    amount: '₱376,540',
    status: 'Drafting',
    statusColor: 'amber'
  },
  {
    company: 'OmniHealth Tech Asia',
    code: 'PROP-2026-883 • 2 days ago',
    amount: '₱642,000',
    status: 'Sent',
    statusColor: 'blue'
  },
  {
    company: 'FinVanguard Global Capital',
    code: 'PROP-2026-882 • Oct 04',
    amount: '₱1,120,000',
    status: 'Approved',
    statusColor: 'green'
  }
]

// ================= 5. LIVE PROPOSAL BUILDER STATE =================
const clientForm = reactive({
  clientName: 'Apex Retail Solutions Philippines',
  email: 'procurement@apexretail.ph',
  firstName: 'Sarah',
  lastName: 'Jenkins',
  directive: 'Focus on 6-month ROI, zero-downtime microservices cutover, and ISO 27001 data residency compliance.'
})

const deliverables = ref([
  {
    name: 'AI Customer Sentiment Engine & Fine-Tuning Pipeline',
    unitPrice: 195000,
    qty: 1,
    discount: 10
  },
  {
    name: 'Enterprise Kubernetes DR Suite & Multi-Region Setup',
    unitPrice: 140000,
    qty: 1,
    discount: 5
  },
  {
    name: 'Supabase pgvector Knowledge Base Embedding Engine',
    unitPrice: 85000,
    qty: 1,
    discount: 0
  }
])

function addDeliverable() {
  deliverables.value.push({
    name: 'Custom Domain Technical Enablement & Training',
    unitPrice: 45000,
    qty: 1,
    discount: 5
  })
}

function removeDeliverable(index) {
  if (deliverables.value.length > 1) {
    deliverables.value.splice(index, 1)
  }
}

// Reactive Financial Ledger Math (Pinia-style deterministic math in PHP)
const ledger = computed(() => {
  let subtotal = 0
  let totalDiscount = 0

  deliverables.value.forEach(item => {
    const rawTotal = (item.unitPrice || 0) * (item.qty || 1)
    const discountAmount = rawTotal * ((item.discount || 0) / 100)
    subtotal += rawTotal
    totalDiscount += discountAmount
  })

  const discountedSubtotal = subtotal - totalDiscount
  const taxRate = 0.12 // 12% standard enterprise VAT in Philippines
  const tax = discountedSubtotal * taxRate
  const grandTotal = discountedSubtotal + tax

  return {
    subtotal,
    totalDiscount,
    discountedSubtotal,
    tax,
    grandTotal
  }
})

// Quick CTA handlers to jump to proposal studio
function openProposalDraft(prop) {
  clientForm.clientName = prop.clientCompany
  clientForm.firstName = prop.contactPerson.split(' ')[0] || 'Executive'
  clientForm.lastName = prop.contactPerson.split(' ')[1] || 'Lead'
  activePage.value = 'create'
  mobileStudioTab.value = 'preview'
}

function draftForClient(client) {
  clientForm.clientName = client.company
  clientForm.email = client.email
  clientForm.firstName = client.name.split(' ')[0] || 'Executive'
  clientForm.lastName = client.name.split(' ').slice(1).join(' ') || ''
  clientForm.directive = `Draft comprehensive high-conversion proposal for ${client.company} located in ${client.location} with target delivery in Q4.`
  activePage.value = 'create'
  mobileStudioTab.value = 'form'
}

function useCatalogItemInProposal(item) {
  deliverables.value.push({
    name: item.title,
    unitPrice: item.unitPrice,
    qty: 1,
    discount: 5
  })
  activePage.value = 'create'
  mobileStudioTab.value = 'form'
}

// AI Generation States
const isGenerating = ref(false)
const generationStep = ref(3)
const generationTime = ref('2.8s')
const hasGenerated = ref(true)

function triggerAiGeneration() {
  isGenerating.value = true
  generationStep.value = 1

  setTimeout(() => {
    generationStep.value = 2
  }, 700)

  setTimeout(() => {
    generationStep.value = 3
  }, 1400)

  setTimeout(() => {
    isGenerating.value = false
    hasGenerated.value = true
  }, 2200)
}

// Vector Flywheel Toast Notification
const showFlywheelToast = ref(false)
const toastMessage = ref('')

function markAsWonAndVectorize() {
  toastMessage.value = `Deal marked as WON! Chunks embedded via gemini-embedding-2 and stored in Supabase pgvector table 'won_pitches' (768-dim HNSW). Future pitches will rank this winning scope!`
  showFlywheelToast.value = true
  setTimeout(() => {
    showFlywheelToast.value = false
  }, 5000)
}

// Upgrade Modal State (Stripe & PayMongo)
const isUpgradeModalOpen = ref(false)
const paymentProvider = ref('stripe') // 'stripe' | 'paymongo'

const quotaUsed = ref(3)
const quotaLimit = ref(5)
const quotaPercent = computed(() => (quotaUsed.value / quotaLimit.value) * 100)

function navigateTo(page) {
  activePage.value = page
  isMobileDrawerOpen.value = false
}
</script>

<template>
  <div class="space-y-4 text-left font-sans">
    
    <!-- ================= TOP TOOLBAR: DEVICE SWITCHER & RESOLUTION PRESETS ================= -->
    <div class="p-3 sm:p-4 rounded-2xl bg-[#0d111c] border border-purple-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl text-white">
      
      <!-- Left: Active Workspace Pill Navigator -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono uppercase text-slate-400 font-semibold hidden sm:inline">Workspace:</span>
        <div class="p-1 rounded-xl bg-[#131b2e] border border-purple-500/20 flex flex-wrap items-center gap-1 text-xs">
          <button
            @click="navigateTo('proposals')"
            :class="[
              'px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all',
              activePage === 'proposals'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            ]"
          >
            <FileText class="w-3.5 h-3.5" />
            <span>Proposals</span>
          </button>

          <button
            @click="navigateTo('dashboard')"
            :class="[
              'px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all',
              activePage === 'dashboard'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            ]"
          >
            <LayoutDashboard class="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            @click="navigateTo('clients')"
            :class="[
              'px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all',
              activePage === 'clients'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            ]"
          >
            <Users class="w-3.5 h-3.5" />
            <span>Clients</span>
          </button>

          <button
            @click="navigateTo('catalog')"
            :class="[
              'px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all',
              activePage === 'catalog'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            ]"
          >
            <Layers class="w-3.5 h-3.5" />
            <span>Catalog</span>
          </button>

          <button
            @click="navigateTo('create')"
            :class="[
              'px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all',
              activePage === 'create'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                : 'text-teal-400 hover:text-white'
            ]"
          >
            <Sparkles class="w-3.5 h-3.5 text-amber-300" />
            <span>+ Create</span>
          </button>
        </div>
      </div>

      <!-- Center: Screen Resolution & Device Presets (Desktop PC, Tablet, Mobile Phone) -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono uppercase text-slate-400 font-semibold hidden md:inline">Resolution:</span>
        <div class="p-1 rounded-xl bg-[#131b2e] border border-purple-500/20 flex items-center gap-1 text-xs">
          <!-- Desktop Preset -->
          <button
            @click="portfolioStore.setDevice('desktop')"
            :class="[
              'px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all',
              portfolioStore.activeDevice === 'desktop'
                ? 'bg-purple-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            ]"
            title="Desktop PC 1440x900"
          >
            <Monitor class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Desktop</span>
            <span class="text-[10px] font-mono opacity-80">(1440px)</span>
          </button>

          <!-- Tablet Preset -->
          <button
            @click="portfolioStore.setDevice('tablet')"
            :class="[
              'px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all',
              portfolioStore.activeDevice === 'tablet'
                ? 'bg-purple-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            ]"
            title="Tablet 1024x768"
          >
            <Tablet class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Tablet</span>
            <span class="text-[10px] font-mono opacity-80">(1024px)</span>
          </button>

          <!-- Mobile Phone Preset -->
          <button
            @click="portfolioStore.setDevice('mobile')"
            :class="[
              'px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all',
              portfolioStore.activeDevice === 'mobile'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            ]"
            title="Mobile Smartphone 390x844"
          >
            <Smartphone class="w-3.5 h-3.5" />
            <span class="font-bold">Mobile Phone</span>
            <span class="text-[10px] font-mono opacity-90">(390px)</span>
          </button>
        </div>
      </div>

      <!-- Right: Live Resolution Badge -->
      <div class="hidden lg:flex items-center gap-2 text-xs font-mono text-purple-300 bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-500/30">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>{{ resolutionLabel }}</span>
      </div>

    </div>

    <!-- ================= FLYWHEEL TOAST NOTIFICATION ================= -->
    <Transition name="slide-down">
      <div 
        v-if="showFlywheelToast" 
        class="fixed top-6 right-6 z-50 max-w-md p-4 rounded-xl bg-slate-900 text-white shadow-2xl border border-teal-500/40 flex items-start gap-3"
      >
        <div class="p-2 rounded-lg bg-teal-500/20 text-teal-400 shrink-0">
          <TrendingUp class="w-5 h-5" />
        </div>
        <div class="space-y-1 text-left">
          <h4 class="text-xs font-bold uppercase tracking-wider text-teal-300">Self-Improving RAG Flywheel</h4>
          <p class="text-xs text-slate-200 leading-relaxed">{{ toastMessage }}</p>
        </div>
        <button @click="showFlywheelToast = false" class="text-slate-400 hover:text-white ml-auto">
          <X class="w-4 h-4" />
        </button>
      </div>
    </Transition>

    <!-- ================= DISPLAY FRAME CONTAINER ================= -->
    <div class="w-full flex justify-center py-2 transition-all">

      <!-- ========================================================================= -->
      <!-- A. MOBILE PHONE VIEWPORT (390px Native Chassis)                           -->
      <!-- ========================================================================= -->
      <div 
        v-if="portfolioStore.activeDevice === 'mobile'" 
        class="relative mx-auto my-4 flex flex-col items-center"
      >
        <!-- Device Tag Label -->
        <div class="mb-3 flex items-center gap-2 text-xs font-mono text-purple-300 bg-purple-950/70 px-3 py-1 rounded-full border border-purple-500/30">
          <Smartphone class="w-3.5 h-3.5 text-purple-400" />
          <span>Native Smartphone Mockup (Capacitor PWA Viewport)</span>
        </div>

        <!-- Physical Phone Chassis (iPhone 15 Pro style) -->
        <div class="relative w-[360px] sm:w-[395px] h-[820px] sm:h-[844px] bg-[#1a1e29] rounded-[52px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(168,85,247,0.25)] border-[8px] border-[#2d3242] transition-all">
          
          <!-- Outer Chassis Side Buttons -->
          <div class="absolute -left-[11px] top-28 w-[3px] h-8 bg-slate-600 rounded-l" title="Action Button" />
          <div class="absolute -left-[11px] top-40 w-[3px] h-12 bg-slate-600 rounded-l" title="Volume Up" />
          <div class="absolute -left-[11px] top-56 w-[3px] h-12 bg-slate-600 rounded-l" title="Volume Down" />
          <div class="absolute -right-[11px] top-36 w-[3px] h-16 bg-slate-600 rounded-r" title="Power Button" />

          <!-- Inner Phone Glass Screen -->
          <div class="w-full h-full bg-[#f8fafc] rounded-[42px] overflow-hidden flex flex-col justify-between relative border border-slate-700/50 [transform:translate3d(0,0,0)] text-slate-800">
            
            <!-- Phone Top Status Bar & Dynamic Island -->
            <div class="h-10 px-6 pt-2 bg-[#090d16] flex items-center justify-between text-white text-[11px] font-semibold tracking-tight z-40 shrink-0 select-none">
              <span>9:41</span>
              <!-- Dynamic Island -->
              <div class="w-24 h-5 bg-black rounded-full flex items-center justify-between px-2 shadow-inner border border-white/5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#0a192f] border border-purple-500/40"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div class="flex items-center gap-1.5 text-slate-300">
                <Signal class="w-3 h-3" />
                <Wifi class="w-3 h-3" />
                <div class="w-5 h-2.5 border border-white rounded-xs p-0.5 flex items-center">
                  <div class="h-full w-full bg-emerald-400 rounded-2xs"></div>
                </div>
              </div>
            </div>

            <!-- Mobile App URL Bar -->
            <div class="px-3 py-1.5 bg-[#0d111c] border-b border-purple-900/40 flex items-center justify-between text-[10px] text-slate-300 font-mono z-30">
              <div class="flex items-center gap-1 truncate max-w-[240px]">
                <Lock class="w-2.5 h-2.5 text-emerald-400" />
                <span class="text-slate-300 truncate">{{ currentUrl }}</span>
              </div>
              <span class="text-[9px] px-1 rounded bg-purple-950 text-purple-300 border border-purple-500/40">PWA</span>
            </div>

            <!-- Mobile App Navigation Header -->
            <header class="px-3 py-2 bg-[#0d111c] flex items-center justify-between gap-2 border-b border-slate-800/80 z-20 shrink-0">
              <div class="flex items-center gap-2">
                <button 
                  @click="isMobileDrawerOpen = !isMobileDrawerOpen"
                  class="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
                  title="Open Navigation"
                >
                  <Menu class="w-4 h-4" />
                </button>
                <div class="flex items-center gap-1.5">
                  <div class="w-6 h-6 rounded-md bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                    ✦
                  </div>
                  <span class="text-white font-bold text-xs">ProposalAI</span>
                  <span class="text-[9px] bg-purple-950 text-purple-300 px-1 rounded font-mono">v2.4</span>
                </div>
              </div>

              <!-- Header Right: Upgrade Button -->
              <button 
                @click="isUpgradeModalOpen = true"
                class="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-xs"
              >
                <Crown class="w-2.5 h-2.5" />
                <span>Upgrade Pro</span>
              </button>
            </header>

            <!-- Slide-over Drawer for Mobile Navigation -->
            <Transition name="fade">
              <div 
                v-if="isMobileDrawerOpen"
                @click="isMobileDrawerOpen = false"
                class="absolute inset-0 bg-black/60 z-50 backdrop-blur-xs"
              >
                <div 
                  @click.stop
                  class="w-64 h-full bg-[#0d111c] text-white p-4 flex flex-col justify-between shadow-2xl border-r border-slate-800"
                >
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-xs">
                          ✦
                        </div>
                        <div>
                          <div class="font-bold text-sm">ProposalAI</div>
                          <div class="text-[9px] text-slate-400 uppercase tracking-widest font-mono">ENTERPRISE GENUI</div>
                        </div>
                      </div>
                      <button @click="isMobileDrawerOpen = false" class="text-slate-400 hover:text-white">
                        <X class="w-4 h-4" />
                      </button>
                    </div>

                    <!-- Button: Create Proposal -->
                    <button 
                      @click="navigateTo('create')"
                      class="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/30"
                    >
                      <Plus class="w-3.5 h-3.5" />
                      <span>Create Proposal</span>
                    </button>

                    <!-- Nav Items -->
                    <div class="space-y-1 pt-2">
                      <div class="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider px-2">Core Workspaces</div>
                      
                      <button 
                        @click="navigateTo('dashboard')"
                        :class="['w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold', activePage === 'dashboard' ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40' : 'text-slate-300 hover:bg-slate-800']"
                      >
                        <div class="flex items-center gap-2.5">
                          <LayoutDashboard class="w-4 h-4 text-slate-400" />
                          <span>Dashboard</span>
                        </div>
                      </button>

                      <button 
                        @click="navigateTo('clients')"
                        :class="['w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold', activePage === 'clients' ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40' : 'text-slate-300 hover:bg-slate-800']"
                      >
                        <div class="flex items-center gap-2.5">
                          <Users class="w-4 h-4 text-slate-400" />
                          <span>Clients</span>
                        </div>
                        <span class="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded-full font-mono">4 Active</span>
                      </button>

                      <button 
                        @click="navigateTo('catalog')"
                        :class="['w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold', activePage === 'catalog' ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40' : 'text-slate-300 hover:bg-slate-800']"
                      >
                        <div class="flex items-center gap-2.5">
                          <Layers class="w-4 h-4 text-slate-400" />
                          <span>Catalog</span>
                        </div>
                        <span class="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded-full font-mono">6 Items</span>
                      </button>

                      <button 
                        @click="navigateTo('proposals')"
                        :class="['w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold', activePage === 'proposals' ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40' : 'text-slate-300 hover:bg-slate-800']"
                      >
                        <div class="flex items-center gap-2.5">
                          <FileText class="w-4 h-4 text-purple-400" />
                          <span>Proposals</span>
                        </div>
                        <span class="text-[9px] bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded-full font-mono font-bold">Now</span>
                      </button>
                    </div>
                  </div>

                  <!-- Drawer Footer Auth -->
                  <div class="space-y-2 pt-4 border-t border-slate-800">
                    <button class="w-full py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs">Sign In</button>
                    <button class="w-full py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs">Create Account</button>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Mobile Viewport Scrollable App Content -->
            <div class="flex-1 overflow-y-auto overflow-x-hidden relative p-3 space-y-4">
              
              <!-- 1. PROPOSALS DIRECTORY (MOBILE) -->
              <div v-if="activePage === 'proposals'" class="space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>Proposals</span>
                      <span class="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full">5 Deals</span>
                    </h2>
                    <p class="text-[10px] text-slate-500">Monitor client pipelines</p>
                  </div>
                  <button 
                    @click="navigateTo('create')"
                    class="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Plus class="w-3 h-3" />
                    <span>Create</span>
                  </button>
                </div>

                <!-- 2x2 Stat Cards in Mobile -->
                <div class="grid grid-cols-2 gap-2 text-left">
                  <div class="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div class="text-[9px] text-slate-400 font-bold uppercase font-mono">Proposals</div>
                    <div class="text-base font-black text-slate-900">5</div>
                    <div class="text-[9px] text-emerald-600">+2 this week</div>
                  </div>
                  <div class="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div class="text-[9px] text-slate-400 font-bold uppercase font-mono">Pipeline</div>
                    <div class="text-xs font-black text-slate-900 truncate">₱2.87M</div>
                    <div class="text-[9px] text-slate-500">4 accounts</div>
                  </div>
                </div>

                <!-- Search Input in Mobile -->
                <div class="relative">
                  <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input 
                    v-model="proposalSearch"
                    type="text" 
                    placeholder="Search proposals..."
                    class="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <!-- Proposal Cards Stack (Mobile) -->
                <div class="space-y-2.5">
                  <div 
                    v-for="prop in filteredProposals"
                    :key="prop.id"
                    class="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-left"
                  >
                    <div class="flex items-center justify-between text-[10px]">
                      <span class="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        {{ prop.id }}
                      </span>
                      <span :class="[
                        'px-2 py-0.5 rounded-full font-bold uppercase text-[9px]',
                        prop.status === 'Drafting' ? 'bg-amber-100 text-amber-800' :
                        prop.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                        prop.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        prop.status === 'In Review' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                      ]">
                        ● {{ prop.status }}
                      </span>
                    </div>

                    <h3 class="font-bold text-xs text-slate-900 leading-snug">{{ prop.title }}</h3>
                    
                    <div class="inline-block text-[9px] bg-purple-50 text-purple-700 font-medium px-2 py-0.5 rounded-md border border-purple-100">
                      {{ prop.tag }}
                    </div>

                    <div class="pt-1 border-t border-slate-100 flex items-center justify-between">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <img :src="prop.avatar" class="w-5 h-5 rounded-full object-cover shrink-0" />
                        <span class="text-[10px] font-semibold text-slate-700 truncate max-w-[120px]">{{ prop.clientCompany }}</span>
                      </div>
                      <div class="text-right shrink-0">
                        <div class="text-[9px] text-slate-400">Total</div>
                        <div class="text-xs font-black text-slate-900">{{ prop.amountFormatted }}</div>
                      </div>
                    </div>

                    <div class="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{{ prop.date }}</span>
                      <button 
                        @click="openProposalDraft(prop)"
                        class="text-purple-600 font-bold flex items-center gap-0.5 hover:text-purple-800"
                      >
                        <span>Open</span>
                        <ArrowUpRight class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2. SERVICES CATALOG (MOBILE) -->
              <div v-else-if="activePage === 'catalog'" class="space-y-3">
                <div class="flex items-center justify-between">
                  <h2 class="text-base font-extrabold text-slate-900">Services Catalog</h2>
                  <span class="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">6 Packages</span>
                </div>

                <div class="space-y-2.5">
                  <div 
                    v-for="item in catalogItems" 
                    :key="item.id"
                    class="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-left"
                  >
                    <span class="text-[9px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      {{ item.category }}
                    </span>
                    <h3 class="font-bold text-xs text-slate-900 leading-tight">{{ item.title }}</h3>
                    <p class="text-[10px] text-slate-500 leading-relaxed">{{ item.subtitle }}</p>
                    
                    <div class="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div class="text-[9px] text-slate-400">Rate</div>
                        <div class="text-xs font-black text-slate-900">{{ item.rateFormatted }}</div>
                      </div>
                      <button 
                        @click="useCatalogItemInProposal(item)"
                        class="px-2.5 py-1 rounded-lg border border-purple-500 text-purple-700 hover:bg-purple-50 text-[10px] font-bold"
                      >
                        + Use in Proposal
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 3. CLIENT ACCOUNTS (MOBILE) -->
              <div v-else-if="activePage === 'clients'" class="space-y-3">
                <div class="flex items-center justify-between">
                  <h2 class="text-base font-extrabold text-slate-900">Client Accounts</h2>
                  <span class="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">4 Active</span>
                </div>

                <div class="space-y-2.5">
                  <div 
                    v-for="c in clientAccounts" 
                    :key="c.id"
                    class="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5 text-left"
                  >
                    <div class="flex items-center gap-2.5">
                      <div :class="['w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-xs shrink-0', c.avatarBg]">
                        {{ c.avatarEmoji }}
                      </div>
                      <div class="min-w-0">
                        <div class="font-bold text-xs text-slate-900 truncate">{{ c.name }}</div>
                        <div class="text-[10px] text-purple-700 font-semibold truncate">{{ c.company }}</div>
                      </div>
                    </div>

                    <div class="space-y-1 text-[10px] text-slate-500">
                      <div class="flex items-center gap-1.5 truncate">
                        <Mail class="w-3 h-3 text-slate-400 shrink-0" />
                        <span class="truncate">{{ c.email }}</span>
                      </div>
                      <div class="flex items-center gap-1.5 truncate">
                        <Phone class="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{{ c.phone }}</span>
                      </div>
                    </div>

                    <button 
                      @click="draftForClient(c)"
                      class="w-full py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-purple-50 hover:border-purple-300 text-slate-800 text-[10px] font-bold transition-all text-center"
                    >
                      Draft Proposal for {{ c.company }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- 4. EXECUTIVE DASHBOARD (MOBILE) -->
              <div v-else-if="activePage === 'dashboard'" class="space-y-3">
                <h2 class="text-base font-extrabold text-slate-900">Executive Dashboard</h2>
                
                <div class="grid grid-cols-2 gap-2 text-left">
                  <div 
                    v-for="(st, idx) in dashboardStats" 
                    :key="idx"
                    class="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs"
                  >
                    <div class="text-[9px] text-slate-400 font-bold uppercase font-mono">{{ st.label }}</div>
                    <div class="text-sm font-black text-slate-900 mt-0.5 truncate">{{ st.value }}</div>
                    <div class="text-[9px] text-emerald-600 font-medium">{{ st.change }}</div>
                  </div>
                </div>

                <div class="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-left">
                  <div class="text-xs font-bold text-slate-900">Recent Proposals</div>
                  <div class="space-y-2">
                    <div 
                      v-for="(rp, rIdx) in recentProposals" 
                      :key="rIdx"
                      class="pb-2 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <div class="font-bold text-[11px] text-slate-800 truncate">{{ rp.company }}</div>
                      <div class="flex items-center justify-between text-[10px] mt-0.5">
                        <span class="text-slate-400 font-mono">{{ rp.code }}</span>
                        <span class="font-black text-slate-900">{{ rp.amount }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 5. CREATE PROPOSAL STUDIO (MOBILE) -->
              <div v-else-if="activePage === 'create'" class="space-y-3">
                <!-- Mobile Tab Switcher: Form vs Preview Canvas -->
                <div class="p-1 rounded-xl bg-slate-200 flex items-center text-xs font-bold">
                  <button 
                    @click="mobileStudioTab = 'form'"
                    :class="['flex-1 py-1 rounded-lg transition-all', mobileStudioTab === 'form' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600']"
                  >
                    1. Form & Ledger
                  </button>
                  <button 
                    @click="mobileStudioTab = 'preview'"
                    :class="['flex-1 py-1 rounded-lg transition-all', mobileStudioTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600']"
                  >
                    2. AI Canvas Preview
                  </button>
                </div>

                <!-- Tab 1: Form & Financial Ledger -->
                <div v-if="mobileStudioTab === 'form'" class="space-y-3 text-left">
                  <div class="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <div class="text-xs font-bold text-slate-800">Client Information</div>
                    <input 
                      v-model="clientForm.clientName"
                      type="text" 
                      placeholder="Company"
                      class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                    <input 
                      v-model="clientForm.email"
                      type="email" 
                      placeholder="Email"
                      class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <!-- Deliverables in Mobile -->
                  <div class="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <div class="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Deliverables Ledger</span>
                      <button @click="addDeliverable" class="text-purple-600 text-[11px]">+ Add Item</button>
                    </div>

                    <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                      <div 
                        v-for="(item, idx) in deliverables" 
                        :key="idx"
                        class="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1"
                      >
                        <div class="flex items-center justify-between font-bold text-slate-900">
                          <span class="truncate max-w-[190px]">{{ item.name }}</span>
                          <button @click="removeDeliverable(idx)" class="text-slate-400 hover:text-red-500">
                            <Trash2 class="w-3 h-3" />
                          </button>
                        </div>
                        <div class="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                          <span>₱{{ item.unitPrice.toLocaleString() }}</span>
                          <span>Qty: {{ item.qty }} • -{{ item.discount }}%</span>
                        </div>
                      </div>
                    </div>

                    <!-- Ledger Summary -->
                    <div class="pt-2 border-t border-slate-100 text-[11px] space-y-1">
                      <div class="flex justify-between text-slate-500">
                        <span>Subtotal:</span>
                        <span class="font-mono">₱{{ ledger.subtotal.toLocaleString() }}</span>
                      </div>
                      <div class="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span class="font-mono">-₱{{ ledger.totalDiscount.toLocaleString() }}</span>
                      </div>
                      <div class="flex justify-between text-slate-500">
                        <span>VAT (12%):</span>
                        <span class="font-mono">+₱{{ ledger.tax.toLocaleString() }}</span>
                      </div>
                      <div class="flex justify-between font-extrabold text-slate-900 pt-1 border-t border-slate-100 text-xs">
                        <span>Grand Total:</span>
                        <span class="text-purple-700 font-mono">₱{{ ledger.grandTotal.toLocaleString() }}</span>
                      </div>
                    </div>

                    <button 
                      @click="triggerAiGeneration(); mobileStudioTab = 'preview'"
                      class="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30"
                    >
                      <Sparkles class="w-3.5 h-3.5 text-amber-300" />
                      <span>Generate AI Proposal</span>
                    </button>
                  </div>
                </div>

                <!-- Tab 2: AI Canvas Preview -->
                <div v-else class="space-y-3 text-left">
                  <div class="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-bold text-purple-700">Proposal Draft Canvas</span>
                      <span class="text-[10px] text-emerald-600 font-mono">● Ready</span>
                    </div>

                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <h4 class="font-extrabold text-xs text-slate-900">Executive Summary</h4>
                      <p class="text-[10px] text-slate-600 leading-relaxed">
                        Tailored for {{ clientForm.clientName }}. Enterprise GenUI platform automating sales scopes with guaranteed ROI and zero downtime.
                      </p>
                    </div>

                    <div class="p-2.5 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
                      <div class="text-[10px] font-bold text-purple-800">Dynamic Pricing Summary</div>
                      <div class="text-base font-black text-purple-900 font-mono">
                        ₱{{ ledger.grandTotal.toLocaleString() }} PHP
                      </div>
                      <div class="text-[9px] text-purple-600">Includes 12% standard enterprise VAT</div>
                    </div>

                    <button 
                      @click="markAsWonAndVectorize"
                      class="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 class="w-3.5 h-3.5" />
                      <span>Mark as Won & Vectorize</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

            <!-- Bottom Home Navigation Bar (Native Mobile Dock) -->
            <div class="px-3 py-1.5 bg-[#0d111c] border-t border-slate-800 flex items-center justify-around text-slate-400 text-[9px] font-bold shrink-0 z-30">
              <button 
                @click="navigateTo('dashboard')"
                :class="['flex flex-col items-center gap-0.5 p-1', activePage === 'dashboard' ? 'text-purple-400' : 'hover:text-white']"
              >
                <LayoutDashboard class="w-4 h-4" />
                <span>Dash</span>
              </button>
              <button 
                @click="navigateTo('proposals')"
                :class="['flex flex-col items-center gap-0.5 p-1', activePage === 'proposals' ? 'text-purple-400' : 'hover:text-white']"
              >
                <FileText class="w-4 h-4" />
                <span>Proposals</span>
              </button>
              <button 
                @click="navigateTo('clients')"
                :class="['flex flex-col items-center gap-0.5 p-1', activePage === 'clients' ? 'text-purple-400' : 'hover:text-white']"
              >
                <Users class="w-4 h-4" />
                <span>Clients</span>
              </button>
              <button 
                @click="navigateTo('catalog')"
                :class="['flex flex-col items-center gap-0.5 p-1', activePage === 'catalog' ? 'text-purple-400' : 'hover:text-white']"
              >
                <Layers class="w-4 h-4" />
                <span>Catalog</span>
              </button>
              <button 
                @click="navigateTo('create')"
                :class="['flex flex-col items-center gap-0.5 p-1', activePage === 'create' ? 'text-emerald-400 font-extrabold' : 'text-teal-400 hover:text-white']"
              >
                <Sparkles class="w-4 h-4 text-amber-300" />
                <span>Create</span>
              </button>
            </div>

            <!-- Bottom Home Indicator Bar -->
            <div class="h-4 bg-[#090d16] flex items-center justify-center shrink-0 z-30">
              <div class="w-28 h-1 bg-white/40 rounded-full" />
            </div>

          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- B. DESKTOP OR TABLET BROWSER VIEWPORT                                     -->
      <!-- ========================================================================= -->
      <div 
        v-else 
        :class="[
          'w-full bg-[#0d111c] rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col transition-all',
          portfolioStore.activeDevice === 'tablet' ? 'max-w-4xl' : 'w-full max-w-full'
        ]"
      >
        <!-- Browser Window Chrome Bar -->
        <div class="px-4 py-2.5 bg-[#090d16] border-b border-purple-900/40 flex items-center justify-between gap-3 text-xs">
          <!-- Window Controls -->
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-rose-500/90 inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-amber-500/90 inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-emerald-500/90 inline-block"></span>
            <span class="text-[11px] font-mono text-slate-300 ml-2 hidden sm:inline font-semibold">
              ProposalAI — Enterprise B2B SaaS Platform
            </span>
          </div>

          <!-- Browser Address Bar -->
          <div class="flex-1 max-w-lg mx-2">
            <div class="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#131b2e] border border-purple-500/20 text-slate-200 font-mono text-[11px]">
              <Lock class="w-3 h-3 text-emerald-400 shrink-0" />
              <span class="truncate">{{ currentUrl }}</span>
              <span class="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shrink-0">
                SSL 256-bit
              </span>
            </div>
          </div>

          <!-- External Production Site Button -->
          <a 
            href="https://proposal-ai.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono transition-colors shrink-0"
          >
            <span>Vercel Edge</span>
            <ExternalLink class="w-3 h-3" />
          </a>
        </div>

        <!-- Main Window Container: Left Sidebar + Right Scrollable Body -->
        <div class="h-[780px] flex overflow-hidden bg-[#f8fafc]">
          
          <!-- ================= LEFT DARK SIDEBAR (Matches Images 1, 2, 3, 4) ================= -->
          <aside 
            :class="[
              'bg-[#0d111c] text-white flex flex-col justify-between shrink-0 border-r border-slate-800 transition-all select-none',
              portfolioStore.activeDevice === 'tablet' ? 'w-52 p-3' : 'w-64 p-4'
            ]"
          >
            <div class="space-y-4">
              <!-- Brand Header -->
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-purple-500/20">
                  ✦
                </div>
                <div>
                  <div class="font-extrabold text-sm sm:text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
                    <span>ProposalAI</span>
                    <span class="text-[9px] font-mono font-bold bg-[#1e1b4b] text-purple-300 px-1.5 py-0.2 rounded border border-purple-700/50">v2.4</span>
                  </div>
                  <div class="text-[9px] text-slate-400 font-mono tracking-wider uppercase font-semibold">ENTERPRISE GENUI</div>
                </div>
              </div>

              <!-- Button: Create Proposal -->
              <button 
                @click="navigateTo('create')"
                class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
              >
                <Plus class="w-4 h-4" />
                <span>Create Proposal</span>
              </button>

              <!-- Section: CORE WORKSPACES -->
              <div class="space-y-1 pt-2">
                <div class="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider px-2 mb-2">
                  CORE WORKSPACES
                </div>

                <!-- Dashboard -->
                <button 
                  @click="navigateTo('dashboard')"
                  :class="[
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                    activePage === 'dashboard' 
                      ? 'bg-[#281e4b] text-white border-l-4 border-purple-500 shadow-xs' 
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  ]"
                >
                  <div class="flex items-center gap-2.5">
                    <LayoutDashboard class="w-4 h-4 text-slate-400" />
                    <span>Dashboard</span>
                  </div>
                </button>

                <!-- Clients -->
                <button 
                  @click="navigateTo('clients')"
                  :class="[
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                    activePage === 'clients' 
                      ? 'bg-[#281e4b] text-white border-l-4 border-purple-500 shadow-xs' 
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  ]"
                >
                  <div class="flex items-center gap-2.5">
                    <Users class="w-4 h-4 text-slate-400" />
                    <span>Clients</span>
                  </div>
                  <span class="text-[10px] bg-[#1e1b4b] text-purple-300 px-2 py-0.5 rounded-full font-mono font-medium border border-purple-700/40">
                    4 Active
                  </span>
                </button>

                <!-- Catalog -->
                <button 
                  @click="navigateTo('catalog')"
                  :class="[
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                    activePage === 'catalog' 
                      ? 'bg-[#281e4b] text-white border-l-4 border-purple-500 shadow-xs' 
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  ]"
                >
                  <div class="flex items-center gap-2.5">
                    <Layers class="w-4 h-4 text-slate-400" />
                    <span>Catalog</span>
                  </div>
                  <span class="text-[10px] bg-[#1e1b4b] text-purple-300 px-2 py-0.5 rounded-full font-mono font-medium border border-purple-700/40">
                    6 Items
                  </span>
                </button>

                <!-- Proposals (Active in screenshot 1) -->
                <button 
                  @click="navigateTo('proposals')"
                  :class="[
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                    activePage === 'proposals' 
                      ? 'bg-[#281e4b] text-white border-l-4 border-purple-500 shadow-xs' 
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  ]"
                >
                  <div class="flex items-center gap-2.5">
                    <FileText class="w-4 h-4 text-purple-400" />
                    <span>Proposals</span>
                  </div>
                  <span class="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-mono font-bold shadow-xs">
                    Now
                  </span>
                </button>
              </div>
            </div>

            <!-- Sidebar Bottom: Auth Actions (Matches Screenshot 1) -->
            <div class="space-y-2 pt-4 border-t border-slate-800">
              <button class="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors">
                Sign In
              </button>
              <button class="w-full py-2 rounded-xl bg-[#090d16] hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs transition-colors">
                Create Account
              </button>
            </div>
          </aside>

          <!-- ================= RIGHT MAIN VIEW BODY ================= -->
          <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
            
            <!-- Top Breadcrumb & Status Badges Bar (Matches Screenshots 1, 2, 3, 4) -->
            <div class="px-6 py-3 bg-white border-b border-slate-200/80 flex items-center justify-between gap-4 shrink-0">
              <!-- Left Breadcrumb -->
              <div class="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span>{{ breadcrumbs.section }}</span>
                <span>›</span>
                <span class="text-slate-900 font-bold">{{ breadcrumbs.page }}</span>
              </div>

              <!-- Right Status Badges (Matches Screenshots) -->
              <div class="flex items-center gap-3">
                <!-- Engine Pill -->
                <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Engine:</span>
                  <span class="text-purple-700 flex items-center gap-1">
                    <Sparkles class="w-3 h-3 text-purple-600" />
                    Gemini Flash-Lite
                  </span>
                </div>

                <!-- Upgrade Pro Button -->
                <button 
                  @click="isUpgradeModalOpen = true"
                  class="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Crown class="w-3.5 h-3.5 text-slate-950" />
                  <span>Upgrade Pro</span>
                </button>

                <!-- Bell Notification -->
                <button class="p-1.5 rounded-full text-slate-400 hover:text-slate-600 relative">
                  <Bell class="w-4 h-4" />
                  <span class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                </button>

                <!-- SOC2 Certified Pill -->
                <div class="flex items-center gap-1 text-slate-600 text-xs font-medium">
                  <ShieldCheck class="w-4 h-4 text-emerald-600" />
                  <span>SOC2 Certified</span>
                </div>
              </div>
            </div>

            <!-- Scrollable View Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800">
              
              <!-- ================= 1. PROPOSALS DIRECTORY VIEW (Matches Screenshot 1) ================= -->
              <div v-if="activePage === 'proposals'" class="space-y-6 text-left">
                <!-- Page Title Row -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                      <span>Proposals Directory</span>
                      <span class="text-xs bg-purple-100 text-purple-700 font-bold px-2.5 py-0.5 rounded-full">
                        5 Commercial Deals
                      </span>
                    </h1>
                    <p class="text-xs text-slate-500 font-medium mt-1">
                      Monitor client approval pipelines, review AI-synthesized scopes, and launch tailored proposals.
                    </p>
                  </div>

                  <button 
                    @click="navigateTo('create')"
                    class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all shrink-0"
                  >
                    <Plus class="w-4 h-4" />
                    <span>Create Proposal</span>
                  </button>
                </div>

                <!-- 4 Top Metric Cards (Matches Screenshot 1) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <!-- Total Proposals -->
                  <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start justify-between">
                    <div>
                      <div class="text-xs font-semibold text-slate-500">Total Proposals</div>
                      <div class="text-2xl font-black text-slate-900 mt-1">5</div>
                      <div class="text-[11px] text-emerald-600 font-medium mt-0.5">+2 generated this week</div>
                    </div>
                    <div class="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                      <FileText class="w-5 h-5" />
                    </div>
                  </div>

                  <!-- Active Pipeline Value -->
                  <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start justify-between">
                    <div>
                      <div class="text-xs font-semibold text-slate-500">Active Pipeline Value</div>
                      <div class="text-xl font-black text-slate-900 mt-1 truncate">₱2,871,540.00</div>
                      <div class="text-[11px] text-slate-500 font-medium mt-0.5">Across 4 target accounts</div>
                    </div>
                    <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                      <span class="font-bold text-base leading-none">₱</span>
                    </div>
                  </div>

                  <!-- Proposal Close Rate -->
                  <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start justify-between">
                    <div>
                      <div class="text-xs font-semibold text-slate-500">Proposal Close Rate</div>
                      <div class="text-2xl font-black text-slate-900 mt-1">72.4%</div>
                      <div class="text-[11px] text-emerald-600 font-medium mt-0.5">+14% vs. manual drafting</div>
                    </div>
                    <div class="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                      <TrendingUp class="w-5 h-5" />
                    </div>
                  </div>

                  <!-- Avg. AI Strategic Fit -->
                  <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start justify-between">
                    <div>
                      <div class="text-xs font-semibold text-slate-500">Avg. AI Strategic Fit</div>
                      <div class="text-2xl font-black text-slate-900 mt-1">95.2%</div>
                      <div class="text-[11px] text-purple-600 font-medium mt-0.5">Gemini 1.5 Pro synthesis</div>
                    </div>
                    <div class="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                      <Sparkles class="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <!-- Filters & Search Bar (Matches Screenshot 1) -->
                <div class="space-y-3">
                  <!-- Filter Tabs -->
                  <div class="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-bold text-slate-600">
                    <button 
                      v-for="f in ['All Proposals', 'Drafting', 'In Review', 'Sent to Client', 'Approved & Won', 'Archived']"
                      :key="f"
                      @click="proposalFilter = f"
                      :class="[
                        'px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap',
                        proposalFilter === f 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'hover:bg-slate-200/70 text-slate-600'
                      ]"
                    >
                      {{ f }}
                    </button>
                  </div>

                  <!-- Search & View Controls -->
                  <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div class="relative w-full sm:w-96">
                      <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        v-model="proposalSearch"
                        type="text" 
                        placeholder="Search by proposal #, title, or client company..."
                        class="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-xs"
                      />
                    </div>

                    <div class="flex items-center gap-2 self-end sm:self-auto text-xs">
                      <span class="text-slate-400 font-medium">Sort:</span>
                      <select 
                        v-model="proposalSort"
                        class="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-xs"
                      >
                        <option>Newest First</option>
                        <option>Highest Value</option>
                        <option>Close Rate</option>
                      </select>

                      <div class="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
                        <button 
                          @click="proposalViewMode = 'grid'"
                          :class="['p-1.5 rounded-lg', proposalViewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700']"
                        >
                          <Grid class="w-3.5 h-3.5" />
                        </button>
                        <button 
                          @click="proposalViewMode = 'list'"
                          :class="['p-1.5 rounded-lg', proposalViewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700']"
                        >
                          <List class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Proposals Cards Grid (Matches Screenshot 1) -->
                <div :class="[
                  proposalViewMode === 'grid'
                    ? (portfolioStore.activeDevice === 'tablet' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4')
                    : 'space-y-3'
                ]">
                  <div 
                    v-for="prop in filteredProposals" 
                    :key="prop.id"
                    class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-purple-300 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div class="space-y-2">
                      <!-- Card Header: Code & Status -->
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          {{ prop.id }}
                        </span>
                        <span :class="[
                          'px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide',
                          prop.status === 'Drafting' ? 'bg-amber-100 text-amber-800' :
                          prop.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                          prop.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          prop.status === 'In Review' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                        ]">
                          ● {{ prop.status }}
                        </span>
                      </div>

                      <!-- Title & Description -->
                      <h3 class="font-extrabold text-sm text-slate-900 leading-snug">
                        {{ prop.title }}
                      </h3>
                      <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {{ prop.description }}
                      </p>

                      <!-- Pill Tag -->
                      <div class="inline-block text-[11px] bg-purple-50 text-purple-700 font-medium px-2.5 py-0.5 rounded-lg border border-purple-100">
                        {{ prop.tag }}
                      </div>
                    </div>

                    <!-- Client Info & Price -->
                    <div class="pt-3 border-t border-slate-100 space-y-3">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2 min-w-0">
                          <img :src="prop.avatar" class="w-7 h-7 rounded-full object-cover shrink-0" />
                          <div class="min-w-0">
                            <div class="text-xs font-bold text-slate-900 truncate">{{ prop.clientCompany }}</div>
                            <div class="text-[10px] text-slate-400 truncate">{{ prop.contactPerson }}</div>
                          </div>
                        </div>

                        <div class="text-right shrink-0">
                          <div class="text-[10px] text-slate-400 font-medium">Total</div>
                          <div class="text-sm font-black text-slate-900 font-mono">{{ prop.amountFormatted }}</div>
                        </div>
                      </div>

                      <!-- Footer Date & Action Icons -->
                      <div class="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <div class="flex items-center gap-1.5 text-[11px]">
                          <Calendar class="w-3.5 h-3.5" />
                          <span>{{ prop.date }}</span>
                        </div>

                        <div class="flex items-center gap-2">
                          <button class="p-1 hover:text-slate-600"><Eye class="w-3.5 h-3.5" /></button>
                          <button class="p-1 hover:text-slate-600"><Copy class="w-3.5 h-3.5" /></button>
                          <button class="p-1 hover:text-red-500"><Trash2 class="w-3.5 h-3.5" /></button>
                          
                          <button 
                            @click="openProposalDraft(prop)"
                            class="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1 transition-colors"
                          >
                            <span>Open</span>
                            <ArrowUpRight class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ================= 2. SERVICES & PRICING CATALOG (Matches Screenshot 2) ================= -->
              <div v-else-if="activePage === 'catalog'" class="space-y-6 text-left">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 class="text-2xl font-black text-slate-900 tracking-tight">Services & Product Catalog</h1>
                    <p class="text-xs text-slate-500 font-medium mt-1">
                      Configure standard deliverables, engineering packages, and base unit pricing.
                    </p>
                  </div>

                  <button class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all shrink-0">
                    <Plus class="w-4 h-4" />
                    <span>+ New Catalog Item</span>
                  </button>
                </div>

                <!-- Catalog Grid (Matches Screenshot 2) -->
                <div :class="portfolioStore.activeDevice === 'tablet' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'">
                  <div 
                    v-for="item in catalogItems" 
                    :key="item.id"
                    class="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div class="space-y-2">
                      <span class="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                        {{ item.category }}
                      </span>
                      <h3 class="text-sm font-extrabold text-slate-900 leading-snug">{{ item.title }}</h3>
                      <p class="text-xs text-slate-500 leading-relaxed">{{ item.subtitle }}</p>
                    </div>

                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div class="text-[10px] text-slate-400">Rate</div>
                        <div class="text-sm font-black text-slate-900 font-mono">
                          {{ item.rateFormatted }} <span class="text-[11px] font-normal text-slate-500">{{ item.period }}</span>
                        </div>
                      </div>

                      <button 
                        @click="useCatalogItemInProposal(item)"
                        class="px-3 py-1.5 rounded-xl border border-purple-500 text-purple-700 hover:bg-purple-50 text-xs font-bold transition-colors"
                      >
                        + Use in Proposal
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ================= 3. CLIENT ACCOUNTS VIEW (Matches Screenshot 3) ================= -->
              <div v-else-if="activePage === 'clients'" class="space-y-6 text-left">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 class="text-2xl font-black text-slate-900 tracking-tight">Client Accounts</h1>
                    <p class="text-xs text-slate-500 font-medium mt-1">
                      Manage target enterprise companies, key decision makers, and past deal metrics.
                    </p>
                  </div>

                  <button class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all shrink-0">
                    <Plus class="w-4 h-4" />
                    <span>+ Add Client</span>
                  </button>
                </div>

                <!-- Clients Grid (Matches Screenshot 3) -->
                <div :class="portfolioStore.activeDevice === 'tablet' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'">
                  <div 
                    v-for="c in clientAccounts" 
                    :key="c.id"
                    class="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div class="space-y-3">
                      <!-- Client Header -->
                      <div class="flex items-center gap-3">
                        <div :class="['w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-xs shrink-0', c.avatarBg]">
                          {{ c.avatarEmoji }}
                        </div>
                        <div class="min-w-0">
                          <h3 class="font-bold text-sm text-slate-900 truncate">{{ c.name }}</h3>
                          <div class="text-xs text-slate-400">{{ c.role }}</div>
                          <div class="text-xs font-semibold text-purple-700 flex items-center gap-1 mt-0.5 truncate">
                            <Building2 class="w-3 h-3 text-purple-500 shrink-0" />
                            <span>{{ c.company }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Contact Details -->
                      <div class="space-y-1.5 text-xs text-slate-500 pt-1">
                        <div class="flex items-center gap-2 truncate">
                          <Mail class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span class="truncate">{{ c.email }}</span>
                        </div>
                        <div class="flex items-center gap-2 truncate">
                          <Phone class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{{ c.phone }}</span>
                        </div>
                        <div class="flex items-center gap-2 truncate">
                          <MapPin class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span class="truncate">{{ c.location }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Bottom CTA Button -->
                    <button 
                      @click="draftForClient(c)"
                      class="w-full py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-purple-50 hover:border-purple-300 text-slate-800 text-xs font-bold transition-all text-center"
                    >
                      Draft Proposal for {{ c.company }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- ================= 4. EXECUTIVE DASHBOARD VIEW (Matches Screenshot 4) ================= -->
              <div v-else-if="activePage === 'dashboard'" class="space-y-6 text-left">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 class="text-2xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
                    <p class="text-xs text-slate-500 font-medium mt-1">
                      Overview of generated proposals, deal pipeline velocity, and client engagement.
                    </p>
                  </div>

                  <button 
                    @click="navigateTo('create')"
                    class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all shrink-0"
                  >
                    <Plus class="w-4 h-4" />
                    <span>+ New Proposal</span>
                  </button>
                </div>

                <!-- 4 Top Stat Cards (Matches Screenshot 4) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div 
                    v-for="(st, idx) in dashboardStats" 
                    :key="idx"
                    class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start justify-between"
                  >
                    <div>
                      <div class="text-xs font-semibold text-slate-500">{{ st.label }}</div>
                      <div class="text-2xl font-black text-slate-900 mt-1 font-mono">{{ st.value }}</div>
                      <div class="text-[11px] text-emerald-600 font-medium mt-0.5">{{ st.change }}</div>
                    </div>
                    <div :class="['p-2.5 rounded-xl', st.bg, st.color]">
                      <component :is="st.icon" class="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <!-- Recent Proposals Table (Matches Screenshot 4) -->
                <div class="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                      RECENT PROPOSALS
                    </h3>
                    <button 
                      @click="navigateTo('proposals')"
                      class="text-xs font-bold text-purple-600 hover:text-purple-800"
                    >
                      View All
                    </button>
                  </div>

                  <div class="space-y-3">
                    <div 
                      v-for="(rp, rIdx) in recentProposals" 
                      :key="rIdx"
                      class="p-3.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-100 last:border-0"
                    >
                      <div class="space-y-0.5">
                        <div class="font-bold text-sm text-slate-900">{{ rp.company }}</div>
                        <div class="text-xs text-slate-400 font-mono">{{ rp.code }}</div>
                      </div>

                      <div class="flex items-center gap-4">
                        <div class="font-black text-slate-900 font-mono text-sm">{{ rp.amount }}</div>
                        <span :class="[
                          'px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide',
                          rp.status === 'Drafting' ? 'bg-amber-100 text-amber-800' :
                          rp.status === 'Sent' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        ]">
                          {{ rp.status }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ================= 5. LIVE PROPOSAL BUILDER & CANVAS ================= -->
              <div v-else-if="activePage === 'create'" class="space-y-6 text-left">
                <!-- Dual Column Live Studio -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  <!-- Column 1: Proposal Form & Reactive Ledger -->
                  <div class="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5">
                    <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span class="text-[10px] font-mono font-bold tracking-wider uppercase text-purple-700">NEW PROPOSAL:</span>
                        <h2 class="text-lg font-extrabold text-slate-900">{{ clientForm.clientName }}</h2>
                      </div>

                      <button 
                        @click="triggerAiGeneration"
                        class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Sparkles class="w-3.5 h-3.5 text-amber-300" />
                        <span>Regenerate Scope</span>
                      </button>
                    </div>

                    <!-- Client Intel -->
                    <div class="space-y-3">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        <Briefcase class="w-3.5 h-3.5 text-purple-600" />
                        <span>Client Intel & CRM Dossier</span>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label class="text-[11px] font-semibold text-slate-500 block mb-1">Client name</label>
                          <input 
                            v-model="clientForm.clientName"
                            type="text" 
                            class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label class="text-[11px] font-semibold text-slate-500 block mb-1">Email</label>
                          <input 
                            v-model="clientForm.email"
                            type="email" 
                            class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Deliverables Ledger -->
                    <div class="space-y-3 pt-2">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Catalog Deliverables (Quantity, Cost, Discount %)
                        </span>
                        <button 
                          @click="addDeliverable"
                          class="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                        >
                          <Plus class="w-3.5 h-3.5" />
                          <span>+ Add Items</span>
                        </button>
                      </div>

                      <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
                        <div 
                          v-for="(item, idx) in deliverables" 
                          :key="idx"
                          class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-12 gap-2 items-center text-xs"
                        >
                          <div class="col-span-5 sm:col-span-6">
                            <input 
                              v-model="item.name"
                              type="text"
                              class="w-full bg-transparent font-medium text-slate-800 focus:outline-none truncate"
                            />
                          </div>
                          <div class="col-span-3 sm:col-span-2">
                            <div class="relative">
                              <span class="absolute left-1.5 top-1 text-slate-400 text-[10px]">₱</span>
                              <input 
                                v-model.number="item.unitPrice"
                                type="number"
                                class="w-full bg-white border border-slate-200 rounded px-1.5 pl-4 py-0.5 text-right font-mono text-[11px] font-semibold text-slate-800"
                              />
                            </div>
                          </div>
                          <div class="col-span-3 sm:col-span-3 flex items-center justify-end gap-1.5">
                            <div class="flex items-center border border-slate-200 rounded bg-white overflow-hidden">
                              <button 
                                @click="item.qty > 1 && item.qty--"
                                class="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 font-mono text-[10px]"
                              >-</button>
                              <span class="px-1.5 font-mono text-[11px] font-bold">{{ item.qty }}</span>
                              <button 
                                @click="item.qty++"
                                class="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 font-mono text-[10px]"
                              >+</button>
                            </div>
                            <span class="text-[10px] text-slate-400 font-mono">-{{ item.discount }}%</span>
                          </div>
                          <div class="col-span-1 text-right">
                            <button 
                              @click="removeDeliverable(idx)"
                              class="text-slate-400 hover:text-red-500 p-0.5"
                            >
                              <Trash2 class="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <!-- Real-time Ledger Summary -->
                      <div class="p-3 rounded-xl bg-purple-50/60 border border-purple-200/80 text-xs space-y-1.5">
                        <div class="flex justify-between text-slate-600">
                          <span>Catalog Subtotal:</span>
                          <span class="font-mono font-medium">₱{{ ledger.subtotal.toLocaleString() }}</span>
                        </div>
                        <div class="flex justify-between text-emerald-700">
                          <span>Volume Discount Curve:</span>
                          <span class="font-mono font-medium">-₱{{ ledger.totalDiscount.toLocaleString() }}</span>
                        </div>
                        <div class="flex justify-between text-slate-600">
                          <span>Standard Enterprise VAT (12%):</span>
                          <span class="font-mono font-medium">+₱{{ ledger.tax.toLocaleString() }}</span>
                        </div>
                        <div class="flex justify-between font-extrabold text-slate-900 pt-2 border-t border-purple-200 text-sm">
                          <span>Grand Total in PHP:</span>
                          <span class="text-purple-700 font-mono">₱{{ ledger.grandTotal.toLocaleString() }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Strategic Directives -->
                    <div class="space-y-2 pt-2">
                      <label class="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Strategic Directives & Gemini Context
                      </label>
                      <textarea 
                        v-model="clientForm.directive"
                        rows="2"
                        class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      ></textarea>
                    </div>

                    <button 
                      @click="triggerAiGeneration"
                      class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
                    >
                      <Sparkles class="w-4 h-4 text-amber-300" />
                      <span>Generate AI Proposal with Gemini</span>
                    </button>
                  </div>

                  <!-- Column 2: Document Live Canvas Preview -->
                  <div class="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5">
                    <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div class="flex items-center gap-2">
                        <FileText class="w-4 h-4 text-purple-600" />
                        <h3 class="text-sm font-bold text-slate-900">Live Proposal Canvas Preview</h3>
                      </div>

                      <div class="flex items-center gap-2">
                        <button 
                          @click="markAsWonAndVectorize"
                          class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <CheckCircle2 class="w-3.5 h-3.5" />
                          <span>Mark as Won & Vectorize</span>
                        </button>
                      </div>
                    </div>

                    <!-- AI Preview Content -->
                    <div class="space-y-4 text-xs">
                      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div class="text-[10px] font-mono uppercase font-bold text-purple-700">EXECUTIVE SUMMARY</div>
                        <h4 class="font-extrabold text-slate-900">Enterprise AI Modernization & Architecture Scope</h4>
                        <p class="text-slate-600 leading-relaxed">
                          Prepared exclusively for <strong>{{ clientForm.clientName }}</strong>. This engagement guarantees turnkey microservices modernization, reducing operational overhead by 42% while adhering to ISO 27001 data residency in the Philippines.
                        </p>
                      </div>

                      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div class="text-[10px] font-mono uppercase font-bold text-purple-700">PHASED DELIVERABLES</div>
                        <div class="space-y-1.5">
                          <div v-for="(it, idx) in deliverables" :key="idx" class="flex items-center justify-between">
                            <span class="text-slate-800 font-medium">Phase {{ idx + 1 }}: {{ it.name }}</span>
                            <span class="font-mono text-slate-500 font-semibold">₱{{ (it.unitPrice * it.qty * (1 - it.discount/100)).toLocaleString() }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="p-4 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900 flex items-center justify-between">
                        <div>
                          <div class="text-[10px] font-mono font-bold uppercase text-purple-600">PROPOSAL TOTAL (INC. 12% VAT)</div>
                          <div class="text-xl font-black font-mono">₱{{ ledger.grandTotal.toLocaleString() }} PHP</div>
                        </div>
                        <div class="text-right text-[11px] text-purple-700 font-medium">
                          <div>Supabase pgvector Grounded</div>
                          <div>Top-3 Cosine Pitches Matched</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ================= UPGRADE PRO MODAL (Stripe & PayMongo) ================= -->
    <Transition name="fade">
      <div 
        v-if="isUpgradeModalOpen" 
        @click="isUpgradeModalOpen = false"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
        <div 
          @click.stop
          class="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-5 text-left"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <Crown class="w-5 h-5 text-amber-500" />
                <h3 class="text-xl font-extrabold text-slate-900">Upgrade ProposalAI Quotas</h3>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Unlock 50 proposals/mo or Unlimited with Stripe Cashier & PayMongo.
              </p>
            </div>
            <button @click="isUpgradeModalOpen = false" class="text-slate-400 hover:text-slate-600">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Gateway Selector -->
          <div class="p-1 rounded-xl bg-slate-100 flex items-center text-xs font-bold">
            <button 
              @click="paymentProvider = 'stripe'"
              :class="['flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all', paymentProvider === 'stripe' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600']"
            >
              <CreditCard class="w-3.5 h-3.5" />
              <span>Stripe Cashier (Global)</span>
            </button>
            <button 
              @click="paymentProvider = 'paymongo'"
              :class="['flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all', paymentProvider === 'paymongo' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600']"
            >
              <CreditCard class="w-3.5 h-3.5" />
              <span>PayMongo (GCash / Maya)</span>
            </button>
          </div>

          <!-- Tier Cards -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-4 rounded-2xl border-2 border-purple-500 bg-purple-50/50 space-y-2">
              <div class="text-xs font-bold text-purple-700">PRO TIER</div>
              <div class="text-xl font-black text-slate-900">₱2,490 <span class="text-xs text-slate-500 font-normal">/mo</span></div>
              <ul class="text-[11px] text-slate-600 space-y-1">
                <li>✓ 50 AI Proposals / mo</li>
                <li>✓ pgvector RAG indexing</li>
                <li>✓ PDF & DOCX export</li>
              </ul>
              <button class="w-full py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs mt-2">
                Checkout
              </button>
            </div>

            <div class="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
              <div class="text-xs font-bold text-slate-700">ENTERPRISE</div>
              <div class="text-xl font-black text-slate-900">₱9,900 <span class="text-xs text-slate-500 font-normal">/mo</span></div>
              <ul class="text-[11px] text-slate-600 space-y-1">
                <li>✓ Unlimited Proposals</li>
                <li>✓ Dedicated Supabase RLS</li>
                <li>✓ Gemini 2.5 Pro fine-tune</li>
              </ul>
              <button class="w-full py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs mt-2">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
