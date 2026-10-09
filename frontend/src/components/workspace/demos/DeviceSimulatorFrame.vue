<script setup>
import { computed } from 'vue'
import { usePortfolioStore } from '../../../stores/portfolioStore'
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  RotateCw, 
  Maximize2, 
  Lock, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Sparkles,
  ExternalLink,
  Wifi,
  Battery,
  Signal,
  CheckCircle2,
  Store,
  LayoutDashboard
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()

const currentUrl = computed(() => {
  if (portfolioStore.activeDevice === 'mobile') {
    return portfolioStore.activeDemoMode === 'admin' 
      ? 'cap://localhost/admin/dashboard' 
      : 'cap://localhost/store'
  }
  return portfolioStore.activeDemoMode === 'admin' 
    ? 'https://rlgonlineshop.com/admin/dashboard' 
    : 'https://rlgonlineshop.com'
})

const resolutionLabel = computed(() => {
  switch (portfolioStore.activeDevice) {
    case 'mobile':
      return '390 × 844 px • Retina Display (Capacitor PWA Mobile)'
    case 'tablet':
      return '1024 × 768 px • Tablet Viewport'
    case 'desktop':
    default:
      return '1440 × 900 px • Desktop Widescreen'
  }
})
</script>

<template>
  <div class="space-y-4 text-left">
    <!-- Top Interactive Toolbar: Mode Switcher + Screen Resolution Presets -->
    <div class="p-3.5 sm:p-4 rounded-2xl bg-[#0f172a] border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
      
      <!-- Left: Demo Surface Toggle -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono uppercase text-slate-400 font-semibold hidden sm:inline">Surface:</span>
        <div class="p-1 rounded-xl bg-[#131b2e] border border-indigo-500/20 flex items-center gap-1 text-xs">
          <button
            @click="portfolioStore.setDemoMode('admin')"
            :class="[
              'px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all',
              portfolioStore.activeDemoMode === 'admin'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            ]"
          >
            <LayoutDashboard class="w-3.5 h-3.5" />
            <span>Admin Panel</span>
          </button>
          <button
            @click="portfolioStore.setDemoMode('storefront')"
            :class="[
              'px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all',
              portfolioStore.activeDemoMode === 'storefront'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            ]"
          >
            <Store class="w-3.5 h-3.5" />
            <span>Buyer Storefront</span>
          </button>
        </div>
      </div>

      <!-- Center: Screen Resolution & Device Presets (Desktop, Tablet, Mobile) -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono uppercase text-slate-400 font-semibold hidden md:inline">Resolution:</span>
        <div class="p-1 rounded-xl bg-[#131b2e] border border-indigo-500/20 flex items-center gap-1 text-xs">
          <!-- Desktop Preset -->
          <button
            @click="portfolioStore.setDevice('desktop')"
            :class="[
              'px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all',
              portfolioStore.activeDevice === 'desktop'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            ]"
            title="Desktop 1440x900"
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
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
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

      <!-- Right: Live Resolution Pill -->
      <div class="hidden lg:flex items-center gap-2 text-xs font-mono text-indigo-300 bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-500/30">
        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span>{{ resolutionLabel }}</span>
      </div>

    </div>

    <!-- ================= DISPLAY FRAME CONTAINER ================= -->
    <div class="w-full flex justify-center py-2 transition-all">
      
      <!-- ================= MOBILE SMARTPHONE VIEW ================= -->
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
        <div class="relative w-[360px] sm:w-[395px] h-[820px] sm:h-[844px] bg-[#1a1e29] rounded-[52px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(99,102,241,0.25)] border-[8px] border-[#2d3242] transition-all">
          
          <!-- Outer Chassis Edge Accents / Side Button Indications -->
          <div class="absolute -left-[11px] top-28 w-[3px] h-8 bg-slate-600 rounded-l" title="Action Button" />
          <div class="absolute -left-[11px] top-40 w-[3px] h-12 bg-slate-600 rounded-l" title="Volume Up" />
          <div class="absolute -left-[11px] top-56 w-[3px] h-12 bg-slate-600 rounded-l" title="Volume Down" />
          <div class="absolute -right-[11px] top-36 w-[3px] h-16 bg-slate-600 rounded-r" title="Power Button" />

          <!-- Inner Phone Glass Screen (creates containing block for fixed position popups and dock) -->
          <div class="w-full h-full bg-[#090d16] rounded-[42px] overflow-hidden flex flex-col justify-between relative border border-slate-700/50 [transform:translate3d(0,0,0)]">
            
            <!-- Phone Top Status Bar & Dynamic Island -->
            <div class="h-10 px-6 pt-2 bg-[#090d16]/95 backdrop-blur-md flex items-center justify-between text-white text-[11px] font-semibold tracking-tight z-30 shrink-0 select-none">
              <!-- Left: Clock -->
              <span>9:41</span>

              <!-- Center: Dynamic Island Capsule -->
              <div class="w-24 h-5 bg-black rounded-full flex items-center justify-between px-2 shadow-inner border border-white/5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#0a192f] border border-cyan-500/40"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              <!-- Right: Cellular, Wifi, Battery -->
              <div class="flex items-center gap-1.5 text-slate-300">
                <Signal class="w-3 h-3" />
                <Wifi class="w-3 h-3" />
                <div class="w-5 h-2.5 border border-white rounded-xs p-0.5 flex items-center">
                  <div class="h-full w-full bg-emerald-400 rounded-2xs"></div>
                </div>
              </div>
            </div>

            <!-- Mobile App Address bar (PWA / Web URL) -->
            <div class="px-4 py-1.5 bg-[#0f172a] border-b border-indigo-500/20 flex items-center justify-between text-[10px] text-slate-400 font-mono z-20">
              <div class="flex items-center gap-1 truncate max-w-[260px]">
                <Lock class="w-2.5 h-2.5 text-emerald-400" />
                <span class="text-slate-300 truncate">{{ currentUrl }}</span>
              </div>
              <span class="text-[9px] px-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">PWA</span>
            </div>

            <!-- Mobile Viewport Scrollable App Content -->
            <div class="flex-1 overflow-y-auto overflow-x-hidden relative p-3">
              <slot />
            </div>

            <!-- Bottom Home Indicator Bar -->
            <div class="h-5 bg-[#090d16] flex items-center justify-center shrink-0 z-30">
              <div class="w-32 h-1 bg-white/50 rounded-full" />
            </div>

          </div>
        </div>
      </div>

      <!-- ================= DESKTOP OR TABLET BROWSER VIEW ================= -->
      <div 
        v-else 
        :class="[
          'w-full bg-[#0f172a] rounded-2xl border border-indigo-500/30 shadow-2xl overflow-hidden flex flex-col transition-all',
          portfolioStore.activeDevice === 'tablet' ? 'max-w-4xl' : 'w-full max-w-full'
        ]"
      >
        <!-- Browser Window Chrome Top Header -->
        <div class="px-4 py-2.5 bg-[#090d16] border-b border-indigo-500/20 flex items-center justify-between gap-3 text-xs">
          <!-- Window Controls -->
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-rose-500/90 inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-amber-500/90 inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-emerald-500/90 inline-block"></span>
            <span class="text-[11px] font-mono text-slate-400 ml-2 hidden sm:inline">
              {{ portfolioStore.activeDemoMode === 'admin' ? 'RLG Shop - Admin Command Center' : 'RLG Online Shop - Buyer Storefront' }}
            </span>
          </div>

          <!-- Browser Address Bar -->
          <div class="flex-1 max-w-lg mx-2">
            <div class="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#131b2e] border border-indigo-500/20 text-slate-300 font-mono text-[11px]">
              <Lock class="w-3 h-3 text-emerald-400 shrink-0" />
              <span class="truncate">{{ currentUrl }}</span>
              <span class="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shrink-0">
                SSL 256-bit
              </span>
            </div>
          </div>

          <!-- External Production Site Button -->
          <a 
            href="https://rlgonlineshop.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono transition-colors shrink-0"
          >
            <span>Production</span>
            <ExternalLink class="w-3 h-3" />
          </a>
        </div>

        <!-- Browser Viewport Inner Content (Fixed Height, Scrollable within Device) -->
        <div class="h-[750px] overflow-y-auto overflow-x-hidden min-w-0 w-full p-2 sm:p-4 bg-[#090d16]">
          <slot />
        </div>
      </div>

    </div>
  </div>
</template>

