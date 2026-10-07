<script setup>
import { 
  Network, 
  GitFork, 
  Layers, 
  CheckCircle2, 
  Workflow, 
  ShieldCheck, 
  Terminal, 
  Code2,
  Cpu,
  ArrowRight
} from 'lucide-vue-next'
</script>

<template>
  <div class="space-y-6 text-left">
    <!-- Header -->
    <div class="p-6 rounded-2xl bg-[#0f172a] border border-indigo-500/30">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-medium mb-2">
        <Network class="w-3.5 h-3.5 text-indigo-400" />
        <span>Monorepo Architecture & Code Quality</span>
      </div>
      <h3 class="text-xl sm:text-2xl font-extrabold text-white">Full-Stack Design Patterns & Agentic Workflows</h3>
      <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
        Structured according to enterprise separation of concerns, strict type-safety across PHP 8.3 & TypeScript, and accelerated by Google Antigravity & Google Jules workflows.
      </p>
    </div>

    <!-- Architecture Pillars -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Backend Layer -->
      <div class="p-6 rounded-2xl bg-[#131b2e] border border-indigo-500/20 space-y-4">
        <div class="flex items-center gap-2.5 pb-3 border-b border-indigo-500/20">
          <div class="p-2 rounded-xl bg-rose-500/20 text-rose-400">
            <Layers class="w-5 h-5" />
          </div>
          <div>
            <h4 class="font-bold text-white text-base">Backend: Laravel 11 Service Layer</h4>
            <span class="text-xs text-slate-400">Decoupled from HTTP Controllers</span>
          </div>
        </div>

        <div class="space-y-3 text-xs text-slate-300">
          <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-1">
            <span class="font-bold text-rose-300">1. Form Requests Validation</span>
            <p class="text-slate-400 text-[11px]">Strict input sanitization before hitting business layers. Zero dirty data permitted.</p>
          </div>
          <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-1">
            <span class="font-bold text-rose-300">2. Service Layer Orchestration</span>
            <p class="text-slate-400 text-[11px]"><code class="text-indigo-300">ProductIntakeService</code> and <code class="text-indigo-300">GeminiVisionService</code> contain isolated transactional logic with idempotency keys.</p>
          </div>
          <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-1">
            <span class="font-bold text-rose-300">3. Inertia.js Seamless Monolith</span>
            <p class="text-slate-400 text-[11px]">Shared server-driven props without needing separate Swagger synchronizers or duplicated client routes.</p>
          </div>
        </div>
      </div>

      <!-- Frontend Layer -->
      <div class="p-6 rounded-2xl bg-[#131b2e] border border-indigo-500/20 space-y-4">
        <div class="flex items-center gap-2.5 pb-3 border-b border-indigo-500/20">
          <div class="p-2 rounded-xl bg-teal-500/20 text-teal-400">
            <Code2 class="w-5 h-5" />
          </div>
          <div>
            <h4 class="font-bold text-white text-base">Frontend: Vue 3 & Pinia Reactive Stores</h4>
            <span class="text-xs text-slate-400">Composition API with &lt;script setup&gt;</span>
          </div>
        </div>

        <div class="space-y-3 text-xs text-slate-300">
          <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-1">
            <span class="font-bold text-teal-300">1. Pure Composition API</span>
            <p class="text-slate-400 text-[11px]">Modular composables (<code class="text-indigo-300">useVisionIntake</code>, <code class="text-indigo-300">useCardFilter</code>) isolating reactive logic cleanly from presentation.</p>
          </div>
          <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-1">
            <span class="font-bold text-teal-300">2. Pinia Central State</span>
            <p class="text-slate-400 text-[11px]">Deterministic cart mutations, optical scanning progress, and cached live listings with zero re-render overhead.</p>
          </div>
          <div class="p-3 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-1">
            <span class="font-bold text-teal-300">3. PWA & Offline Readiness</span>
            <p class="text-slate-400 text-[11px]">Service Worker caching for static card assets, enabling quick re-scans in poor warehouse connectivity.</p>
          </div>
        </div>
      </div>

    </div>

    <!-- Agentic CI/CD Workflows: Google Antigravity & Jules -->
    <div class="p-6 rounded-2xl bg-[#131b2e] border border-indigo-500/20 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-indigo-500/20">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Workflow class="w-5 h-5" />
          </div>
          <div>
            <h4 class="font-bold text-white text-base">Autonomous Agent Development Lifecycle</h4>
            <span class="text-xs text-slate-400">Google Antigravity & Google Jules in Production Monorepos</span>
          </div>
        </div>
        <span class="text-xs font-mono text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/30">
          Agent-Accelerated
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="p-4 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-2">
          <div class="flex items-center gap-2 text-indigo-400 font-bold">
            <Cpu class="w-4 h-4" />
            <span>Google Antigravity</span>
          </div>
          <p class="text-slate-300 leading-relaxed">
            Utilized for multi-agent pair programming: simultaneously scaffolding Pinia stores, generating Tailwind theme tokens, and generating Playwright regression test files.
          </p>
        </div>

        <div class="p-4 rounded-xl bg-[#090d16] border border-indigo-500/20 space-y-2">
          <div class="flex items-center gap-2 text-purple-400 font-bold">
            <GitFork class="w-4 h-4" />
            <span>Google Jules</span>
          </div>
          <p class="text-slate-300 leading-relaxed">
            Asynchronous multi-turn GitHub PR review agent: detects potential N+1 query bottlenecks in Eloquent queries, audits CSRF/OAuth gates, and enforces strict Vue TypeScript interfaces.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

