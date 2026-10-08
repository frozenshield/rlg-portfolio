<script setup>
import { usePortfolioStore } from './stores/portfolioStore'
import PortfolioNavbar from './components/portfolio/PortfolioNavbar.vue'
import BentoGrid from './components/portfolio/BentoGrid.vue'
import PortfolioFooter from './components/portfolio/PortfolioFooter.vue'
import WorkspaceShell from './components/workspace/WorkspaceShell.vue'

const portfolioStore = usePortfolioStore()
</script>

<template>
  <div class="min-h-screen">
    <!-- Smooth Transition between Outer Bento Mode & Inner Dark Workspace Shell -->
    <Transition name="workspace-mode" mode="out-in">
      <!-- OUTER PORTFOLIO (Light Bento Grid) -->
      <div 
        v-if="portfolioStore.currentMode === 'outer'" 
        key="outer-mode"
        class="min-h-screen bg-[#f8fafc] text-slate-800 relative overflow-x-hidden"
      >
        <!-- Animated Background Grid Pattern -->
        <div class="fixed inset-0 bg-grid-pattern opacity-60 pointer-events-none -z-10" />

        <!-- Floating Gradient Blobs -->
        <div class="fixed top-20 left-10 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none -z-10 animate-float" />
        <div class="fixed bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none -z-10 animate-float [animation-delay:3s]" />

        <!-- Navigation Bar -->
        <PortfolioNavbar />

        <!-- Bento Grid & Content Sections -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          <BentoGrid />
        </main>

        <!-- Footer -->
        <PortfolioFooter />
      </div>

      <!-- INNER PROJECT WORKSPACE (Dark SaaS / DevOps Dashboard) -->
      <div 
        v-else 
        key="workspace-mode"
        class="h-screen w-full overflow-hidden bg-[#090d16] text-slate-100"
      >
        <WorkspaceShell />
      </div>
    </Transition>
  </div>
</template>

<style>
/* Smooth workspace transition */
.workspace-mode-enter-active,
.workspace-mode-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.workspace-mode-enter-from {
  opacity: 0;
  transform: scale(0.985) translateY(8px);
}

.workspace-mode-leave-to {
  opacity: 0;
  transform: scale(1.01) translateY(-8px);
}
</style>
