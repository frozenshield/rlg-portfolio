<script setup>
import { ref } from 'vue'
import HeroSection from './HeroSection.vue'
import ProjectShowcaseCard from './ProjectShowcaseCard.vue'
import SkillsMatrix from './SkillsMatrix.vue'
import { usePortfolioStore } from '../../stores/portfolioStore'
import { 
  Sparkles, 
  Cpu, 
  Server, 
  GitBranch, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink,
  Layers,
  ShieldAlert,
  ArrowRight,
  Workflow,
  Radio,
  FileCode2,
  Terminal
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()
const copiedEmail = ref(false)

function copyEmailAddress() {
  navigator.clipboard.writeText('architect@rlgonlineshop.com')
  copiedEmail.value = true
  setTimeout(() => {
    copiedEmail.value = false
  }, 2000)
}
</script>

<template>
  <div class="space-y-8 sm:space-y-12">
    <!-- Hero Section -->
    <HeroSection />

    <!-- Flagship Showcase Bento Card (RLG Online Shop) -->
    <ProjectShowcaseCard />

    <!-- Skills, Tooling & Infrastructure Matrix -->
    <SkillsMatrix />

    <!-- Additional Architecture & Innovation Bento Row -->
    <div id="architecture" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Tile 1: AI Vision & Multimodal Automation -->
      <div class="bento-card p-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2.5 text-purple-600 mb-3">
            <div class="p-2 rounded-lg bg-purple-50 border border-purple-200">
              <Cpu class="w-5 h-5" />
            </div>
            <span class="text-xs font-bold uppercase tracking-wider text-purple-700">Multimodal AI Engine</span>
          </div>
          <h4 class="text-lg font-bold text-slate-900 leading-snug">
            Gemini Vision OCR & Automated SEO
          </h4>
          <p class="text-xs text-slate-600 mt-2 leading-relaxed">
            Eliminating manual merchant intake by parsing trading card Japanese Kanji, expansion sets, and condition grading in 1.2s. Generates JSON-LD schema on the fly.
          </p>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px] font-mono text-purple-600 font-semibold">99.8% Precision</span>
          <button 
            @click="portfolioStore.openWorkspace('rlg-online-shop', 'ai')"
            class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Inspect Pipeline</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Tile 2: Cloud Infra & Production DNS -->
      <div class="bento-card p-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2.5 text-sky-600 mb-3">
            <div class="p-2 rounded-lg bg-sky-50 border border-sky-200">
              <Server class="w-5 h-5" />
            </div>
            <span class="text-xs font-bold uppercase tracking-wider text-sky-700">Production Cloud</span>
          </div>
          <h4 class="text-lg font-bold text-slate-900 leading-snug">
            Railway & Namecheap DNS Routing
          </h4>
          <p class="text-xs text-slate-600 mt-2 leading-relaxed">
            Zero-downtime rolling container deploys on Railway with Redis queues, Edge CDN, and automated Let's Encrypt TLS for <code class="text-indigo-600 font-mono text-[11px]">rlgonlineshop.com</code>.
          </p>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px] font-mono text-emerald-600 font-semibold flex items-center gap-1">
            <Radio class="w-3 h-3 animate-pulse" /> Live & Healthy
          </span>
          <button 
            @click="portfolioStore.openWorkspace('rlg-online-shop', 'infra')"
            class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View Topology</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Tile 3: Autonomous Agent Orchestration -->
      <div class="bento-card p-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2.5 text-amber-600 mb-3">
            <div class="p-2 rounded-lg bg-amber-50 border border-amber-200">
              <Workflow class="w-5 h-5" />
            </div>
            <span class="text-xs font-bold uppercase tracking-wider text-amber-700">Autonomous DevOps</span>
          </div>
          <h4 class="text-lg font-bold text-slate-900 leading-snug">
            Google Antigravity & Jules
          </h4>
          <p class="text-xs text-slate-600 mt-2 leading-relaxed">
            Autonomous multi-agent pair programming for frontend refactoring, coupled with Google Jules asynchronous PR validation and Playwright headless E2E verification.
          </p>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px] font-mono text-amber-600 font-semibold">Agent Assisted CI/CD</span>
          <button 
            @click="portfolioStore.openWorkspace('rlg-online-shop', 'architecture')"
            class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Learn More</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>

    <!-- Contact & Architecture Consulting Tile -->
    <div id="contact" class="bento-card p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white border-indigo-500/30">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2 text-center md:text-left">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <Sparkles class="w-3.5 h-3.5 text-amber-300" />
            <span>Available for Senior Frontend & Architecture Roles</span>
          </div>
          <h3 class="text-2xl sm:text-3xl font-extrabold text-white">
            Let's Build Something Resilient & Fast
          </h3>
          <p class="text-sm text-slate-300 max-w-xl">
            Looking for senior engineering leadership in Vue 3, Laravel monorepos, or production multimodal AI applications? Let's connect.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button 
            @click="copyEmailAddress"
            class="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-2"
          >
            <component :is="copiedEmail ? Check : Copy" class="w-4 h-4 text-emerald-400" />
            <span>{{ copiedEmail ? 'Email Copied!' : 'architect@rlgonlineshop.com' }}</span>
          </button>

          <a 
            href="https://rlgonlineshop.com"
            target="_blank"
            rel="noopener noreferrer"
            class="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <span>Visit Production Shop</span>
            <ExternalLink class="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>

  </div>
</template>

