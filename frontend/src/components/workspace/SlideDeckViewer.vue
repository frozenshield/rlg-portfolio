<script setup>
import { computed } from 'vue'
import { usePortfolioStore } from '../../stores/portfolioStore'
import { rlgProjectData } from '../../data/projectsData'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Tv, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Cpu, 
  ExternalLink,
  Presentation,
  Maximize2,
  Volume2
} from 'lucide-vue-next'

const portfolioStore = usePortfolioStore()
const slides = rlgProjectData.slides

const currentSlide = computed(() => {
  return slides[portfolioStore.currentSlideIndex] || slides[0]
})
</script>

<template>
  <div class="rounded-2xl border border-indigo-500/30 bg-[#0f172a]/95 overflow-hidden shadow-2xl relative">
    <!-- Slide Header bar -->
    <div class="px-5 py-3 border-b border-indigo-500/20 bg-[#090d16]/80 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="p-1 rounded-md bg-indigo-500/20 text-indigo-400">
          <Presentation class="w-4 h-4" />
        </div>
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-300">
          NotebookLM Interactive Deck & Architecture Review
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="portfolioStore.toggleTalkTracks"
          class="text-xs px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-colors"
        >
          <Volume2 class="w-3.5 h-3.5" />
          <span>{{ portfolioStore.isTalkTracksOpen ? 'Hide Notes' : 'Show Talk Tracks' }}</span>
        </button>
      </div>
    </div>

    <!-- Main Content: Slide Arena + Talk Tracks Drawer -->
    <div class="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
      
      <!-- Left Arena: Active Slide Display (lg:col-span-8 or 12) -->
      <div 
        :class="[
          'relative p-6 sm:p-8 flex flex-col justify-between transition-all bg-gradient-to-br from-[#0b101d] via-[#0f172a] to-[#090d16]',
          portfolioStore.isTalkTracksOpen ? 'lg:col-span-8 border-b lg:border-b-0 lg:border-r border-indigo-500/20' : 'lg:col-span-12'
        ]"
      >
        <!-- Floating Navigation Chevrons -->
        <button 
          @click="portfolioStore.prevSlide(slides.length)"
          class="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#131b2e]/90 hover:bg-indigo-600 border border-indigo-500/40 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
          title="Previous slide"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>

        <button 
          @click="portfolioStore.nextSlide(slides.length)"
          class="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#131b2e]/90 hover:bg-indigo-600 border border-indigo-500/40 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
          title="Next slide"
        >
          <ChevronRight class="w-5 h-5" />
        </button>

        <!-- Slide Core Content -->
        <div class="max-w-2xl mx-auto w-full my-auto px-6 text-left">
          <!-- Slide Meta Tag -->
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-medium mb-3">
            <Sparkles class="w-3.5 h-3.5" />
            <span>Slide {{ currentSlide.id }} of {{ slides.length }}</span>
            <span class="text-slate-600">|</span>
            <span class="text-slate-300 font-sans">{{ currentSlide.subtitle }}</span>
          </div>

          <!-- Slide Title -->
          <h3 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {{ currentSlide.title }}
          </h3>

          <!-- Visual preview / architectural diagram snippet based on slide type -->
          <div class="my-6 p-4 rounded-xl bg-[#131b2e]/90 border border-indigo-500/20 backdrop-blur-sm">
            <!-- Simulated Mock UI inside slide -->
            <div class="flex items-center justify-between pb-2 mb-3 border-b border-indigo-500/20 text-[11px] text-slate-400 font-mono">
              <span class="text-indigo-300 flex items-center gap-1.5 font-semibold">
                <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                RLG Architecture Matrix
              </span>
              <span>Production Validated</span>
            </div>

            <!-- Bullet Points with glowing checks -->
            <ul class="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li 
                v-for="(bullet, bIdx) in currentSlide.bulletPoints" 
                :key="bIdx"
                class="flex items-start gap-2.5"
              >
                <div class="p-0.5 rounded-full bg-indigo-500/20 text-indigo-400 mt-0.5 shrink-0">
                  <CheckCircle2 class="w-3.5 h-3.5" />
                </div>
                <span class="leading-relaxed">{{ bullet }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Slide Bottom Navigation Bar matching reference UI -->
        <div class="pt-4 border-t border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span class="font-mono text-slate-400 text-[11px]">
            Slide {{ currentSlide.id }}
          </span>

          <!-- Dot navigation pills -->
          <div class="flex items-center gap-1.5">
            <button
              v-for="(_, idx) in slides"
              :key="idx"
              @click="portfolioStore.goToSlide(idx)"
              :class="[
                'h-2 rounded-full transition-all duration-300',
                portfolioStore.currentSlideIndex === idx 
                  ? 'w-6 bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-sm shadow-indigo-500/50' 
                  : 'w-2 bg-slate-700 hover:bg-slate-500'
              ]"
              :title="`Go to slide ${idx + 1}`"
            />
          </div>

          <!-- Counter button with small arrows -->
          <div class="flex items-center gap-2 bg-[#131b2e] px-2.5 py-1 rounded-lg border border-indigo-500/30 text-white font-mono text-[11px]">
            <button 
              @click="portfolioStore.prevSlide(slides.length)"
              class="hover:text-indigo-400 transition-colors"
            >
              &lt;
            </button>
            <span>{{ currentSlide.id }} of {{ slides.length }}</span>
            <button 
              @click="portfolioStore.nextSlide(slides.length)"
              class="hover:text-indigo-400 transition-colors"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      <!-- Right Drawer: Talk Tracks & Highlight Notes matching screenshot -->
      <div 
        v-show="portfolioStore.isTalkTracksOpen"
        class="lg:col-span-4 p-5 sm:p-6 bg-[#090d16]/95 flex flex-col justify-between text-left"
      >
        <div>
          <!-- Drawer Header -->
          <div class="flex items-center justify-between pb-3 mb-4 border-b border-indigo-500/20">
            <h4 class="font-bold text-white text-sm tracking-wide flex items-center gap-2">
              <span>Talk Tracks & Highlight Notes</span>
            </h4>
            <button 
              @click="portfolioStore.toggleTalkTracks"
              class="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              <ChevronDown class="w-4 h-4" />
            </button>
          </div>

          <!-- Presenter Info -->
          <div class="flex items-center gap-3 p-3 rounded-xl bg-[#131b2e]/60 border border-indigo-500/20 mb-4">
            <div class="w-9 h-9 rounded-full overflow-hidden border border-indigo-400/40 shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" 
                alt="Presenter"
                class="w-full h-full object-cover" 
              />
            </div>
            <div>
              <span class="text-xs font-bold text-white block">Presenter</span>
              <span class="text-[11px] text-indigo-300 block">Lead UI Architect / Monorepo Owner</span>
            </div>
          </div>

          <!-- Spoken Walkthrough Text -->
          <div class="space-y-3">
            <span class="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
              INTERVIEW TALK TRACK:
            </span>
            <blockquote class="text-xs text-slate-300 leading-relaxed italic bg-indigo-950/30 p-3.5 rounded-xl border-l-2 border-indigo-500">
              "{{ currentSlide.talkTrackNotes }}"
            </blockquote>
          </div>

          <!-- Key interview focus bullet cues -->
          <div class="mt-4 space-y-2">
            <span class="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
              ARCHITECTURAL FOCUS:
            </span>
            <div class="text-[11px] text-slate-300 space-y-1.5">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>Explain decoupling of Vision API from web request queue.</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>Detail Pinia reactive store hydration via Inertia.js props.</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Showcase Railway Nixpack caching for instant rebuilds.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Drawer Footer -->
        <div class="mt-6 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Speaker Mode Active</span>
          <span class="text-emerald-400">Ready for Q&A</span>
        </div>
      </div>

    </div>
  </div>
</template>

