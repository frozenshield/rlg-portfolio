<script setup>
import { computed } from 'vue'
import { usePortfolioStore } from '../../stores/portfolioStore'
import { rlgProjectData } from '../../data/projectsData'
import WorkspaceSidebar from './WorkspaceSidebar.vue'
import WorkspaceTopBar from './WorkspaceTopBar.vue'
import SlideDeckViewer from './SlideDeckViewer.vue'
import DeviceSimulatorFrame from './demos/DeviceSimulatorFrame.vue'
import AdminPanelDemo from './demos/AdminPanelDemo.vue'
import BuyerStorefrontDemo from './demos/BuyerStorefrontDemo.vue'
import DeploymentView from './DeploymentView.vue'
import AiPipelinesView from './AiPipelinesView.vue'
import ArchitectureView from './ArchitectureView.vue'
import TechStackView from './TechStackView.vue'

import { 
  Layers, 
  Cpu, 
  Smartphone, 
  ShieldCheck, 
  ExternalLink,
  Store,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  BookOpen,
  FolderGit2,
  Scan,
  Compass,
  Monitor
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()

const metricCards = [
  {
    tag: 'FULL-STACK ARCHITECTURE',
    title: 'Laravel',
    subtitle: 'Laravel, Vue 3, Inertia.js',
    icon: Layers,
    color: 'text-indigo-400'
  },
  {
    tag: 'AI-POWERED PIPELINES',
    title: '3 Active Engines',
    subtitle: '(Vision, SEO, Chat)',
    icon: Cpu,
    color: 'text-purple-400'
  },
  {
    tag: 'MOBILE FIRST (PWA)',
    title: 'Offline ready',
    subtitle: '& responsive',
    icon: Smartphone,
    color: 'text-teal-400'
  },
  {
    tag: 'SECURE OAUTH',
    title: 'Google Auth',
    subtitle: 'Google Auth & token-based',
    icon: ShieldCheck,
    color: 'text-sky-400'
  }
]
</script>

<template>
  <div class="min-h-screen bg-[#090d16] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
    <!-- Left Navigation Sidebar -->
    <WorkspaceSidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 bg-[#090d16]">
      <!-- Top Navigation & Status Bar -->
      <WorkspaceTopBar />

      <!-- Scrollable View Body -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-8">
        
        <!-- ================= OVERVIEW & METRICS VIEW ================= -->
        <div v-if="portfolioStore.activeWorkspaceTab === 'overview'" class="space-y-8 text-left">
          
          <!-- Workspace Hero Title matching Reference Screenshot -->
          <div class="space-y-1">
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              RLG Online Shop Dashboard
            </h1>
            <p class="text-sm text-slate-400 font-normal">
              Full-stack monorepo featuring multimodal AI automation
            </p>
          </div>

          <!-- Top 4 Feature / Metric Cards matching Reference Screenshot -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              v-for="(card, cIdx) in metricCards" 
              :key="cIdx"
              class="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#131b2e] to-[#0f172a] border border-indigo-500/20 hover:border-indigo-400/40 transition-all duration-200 shadow-lg shadow-black/20"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                  {{ card.tag }}
                </span>
                <component :is="card.icon" :class="['w-4 h-4', card.color]" />
              </div>
              <div class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {{ card.title }}
              </div>
              <p class="text-xs text-slate-400 mt-1">
                {{ card.subtitle }}
              </p>
            </div>
          </div>

          <!-- Middle Presentation Deck & Talk Tracks (Matching Reference Screenshot) -->
          <div class="space-y-3">
            <SlideDeckViewer />
          </div>

          <!-- Bottom 4 Feature Cards (Laravel & Vue 3, NotebookLM, Google Antigravity, Multimodal AI) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Card 1: Laravel & Vue 3 -->
            <button 
              @click="portfolioStore.setWorkspaceTab('architecture')"
              class="p-4 rounded-2xl bg-[#131b2e] hover:bg-[#18223a] border border-indigo-500/20 hover:border-indigo-400/40 text-left transition-all flex items-center justify-between group"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-xs">
                  LV
                </div>
                <div>
                  <h4 class="font-bold text-white text-xs sm:text-sm group-hover:text-indigo-300 transition-colors">
                    Laravel & Vue 3
                  </h4>
                  <span class="text-[11px] text-slate-400">Monorepo Bridge</span>
                </div>
              </div>
              <span class="text-slate-500 group-hover:text-indigo-400 text-xs">→</span>
            </button>

            <!-- Card 2: NotebookLM Slides -->
            <button 
              @click="portfolioStore.setWorkspaceTab('slides')"
              class="p-4 rounded-2xl bg-[#131b2e] hover:bg-[#18223a] border border-indigo-500/20 hover:border-indigo-400/40 text-left transition-all flex items-center justify-between group"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                  NL
                </div>
                <div>
                  <h4 class="font-bold text-white text-xs sm:text-sm group-hover:text-indigo-300 transition-colors">
                    NotebookLM Slides
                  </h4>
                  <span class="text-[11px] text-slate-400">8 Curated Slides</span>
                </div>
              </div>
              <span class="text-slate-500 group-hover:text-indigo-400 text-xs">→</span>
            </button>

            <!-- Card 3: Google Antigravity -->
            <button 
              @click="portfolioStore.setWorkspaceTab('architecture')"
              class="p-4 rounded-2xl bg-[#131b2e] hover:bg-[#18223a] border border-indigo-500/20 hover:border-indigo-400/40 text-left transition-all flex items-center justify-between group"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                  AG
                </div>
                <div>
                  <h4 class="font-bold text-white text-xs sm:text-sm group-hover:text-indigo-300 transition-colors">
                    Google Antigravity
                  </h4>
                  <span class="text-[11px] text-slate-400">Autonomous Agents</span>
                </div>
              </div>
              <span class="text-slate-500 group-hover:text-indigo-400 text-xs">→</span>
            </button>

            <!-- Card 4: Multimodal AI (Vision & OCR) -->
            <button 
              @click="portfolioStore.setWorkspaceTab('ai')"
              class="p-4 rounded-2xl bg-[#131b2e] hover:bg-[#18223a] border border-indigo-500/20 hover:border-indigo-400/40 text-left transition-all flex items-center justify-between group"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                  AI
                </div>
                <div>
                  <h4 class="font-bold text-white text-xs sm:text-sm group-hover:text-indigo-300 transition-colors">
                    Multimodal AI (Vision)
                  </h4>
                  <span class="text-[11px] text-slate-400">Gemini OCR Engine</span>
                </div>
              </div>
              <span class="text-slate-500 group-hover:text-indigo-400 text-xs">→</span>
            </button>
          </div>

          <!-- Quick Launch Interactive Demos Banner with Desktop vs Mobile Phone triggers -->
          <div class="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="space-y-1">
              <span class="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">Hands-On Evaluation</span>
              <h3 class="text-lg font-bold text-white">Experience Live Demos with Device Resolution Switcher</h3>
              <p class="text-xs text-slate-300">
                Inspect actual views from the <code class="text-indigo-400">rlgshop</code> repository in Desktop (1440px), Tablet (1024px), or realistic Smartphone Frame (390px).
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                @click="portfolioStore.setWorkspaceTab('demos'); portfolioStore.setDemoMode('admin'); portfolioStore.setDevice('desktop')"
                class="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Monitor class="w-3.5 h-3.5" />
                <span>Admin (Desktop)</span>
              </button>

              <button
                @click="portfolioStore.setWorkspaceTab('demos'); portfolioStore.setDemoMode('storefront'); portfolioStore.setDevice('mobile')"
                class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Smartphone class="w-3.5 h-3.5 text-amber-300" />
                <span>Storefront (Mobile Phone)</span>
              </button>
            </div>
          </div>

        </div>

        <!-- ================= PRESENTATION DECK TAB ================= -->
        <div v-else-if="portfolioStore.activeWorkspaceTab === 'slides'" class="space-y-6">
          <SlideDeckViewer />
        </div>

        <!-- ================= INTERACTIVE DEMOS TAB (WITH DEVICE RESOLUTION SIMULATOR) ================= -->
        <div v-else-if="portfolioStore.activeWorkspaceTab === 'demos'" class="space-y-6">
          <DeviceSimulatorFrame>
            <Transition mode="out-in" name="fade">
              <component 
                :is="portfolioStore.activeDemoMode === 'admin' ? AdminPanelDemo : BuyerStorefrontDemo" 
              />
            </Transition>
          </DeviceSimulatorFrame>
        </div>

        <!-- ================= INFRASTRUCTURE TAB ================= -->
        <div v-else-if="portfolioStore.activeWorkspaceTab === 'infra'" class="space-y-6">
          <DeploymentView />
        </div>

        <!-- ================= AI PIPELINES TAB ================= -->
        <div v-else-if="portfolioStore.activeWorkspaceTab === 'ai'" class="space-y-6">
          <AiPipelinesView />
        </div>

        <!-- ================= ARCHITECTURE TAB ================= -->
        <div v-else-if="portfolioStore.activeWorkspaceTab === 'architecture'" class="space-y-6">
          <ArchitectureView />
        </div>

        <!-- ================= TECH STACK TAB ================= -->
        <div v-else-if="portfolioStore.activeWorkspaceTab === 'tech'" class="space-y-6">
          <TechStackView />
        </div>

      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
