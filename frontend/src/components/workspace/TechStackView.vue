<script setup>
import { 
  Layers, 
  Code2, 
  Server, 
  Sparkles, 
  Cloud, 
  Workflow, 
  ShieldCheck, 
  Terminal,
  Database
} from 'lucide-vue-next'
import { skillsMatrix } from '../../data/projectsData'
</script>

<template>
  <div class="space-y-6 text-left">
    <!-- Header -->
    <div class="p-6 rounded-2xl bg-[#0f172a] border border-indigo-500/30">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-medium mb-2">
        <Layers class="w-3.5 h-3.5 text-indigo-400" />
        <span>Stack Architecture Matrix</span>
      </div>
      <h3 class="text-xl sm:text-2xl font-extrabold text-white">Production Dependencies & System Blueprint</h3>
      <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
        Every framework, utility, and infrastructure layer chosen with purposeful intent for sub-100ms response times and automated AI fulfillment.
      </p>
    </div>

    <!-- Tech Categories Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="cat in skillsMatrix" 
        :key="cat.category"
        class="p-5 rounded-2xl bg-[#131b2e] border border-indigo-500/20 space-y-4 flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-indigo-500/20">
            <h4 class="font-bold text-white text-sm sm:text-base">{{ cat.category }}</h4>
            <span class="text-[10px] font-mono text-slate-400">{{ cat.skills.length }} Technologies</span>
          </div>

          <div class="space-y-3 mt-3">
            <div 
              v-for="item in cat.skills" 
              :key="item.name"
              class="p-2.5 rounded-xl bg-[#090d16] border border-indigo-500/10 space-y-1"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-indigo-300 text-xs">{{ item.name }}</span>
                <span class="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  {{ item.level }}
                </span>
              </div>
              <p class="text-[11px] text-slate-400 leading-snug">{{ item.desc }}</p>
            </div>
          </div>
        </div>

        <div class="pt-2 border-t border-indigo-500/10 text-[10px] text-slate-500 font-mono flex justify-between">
          <span>Enterprise Ready</span>
          <span class="text-emerald-400">Production Tested</span>
        </div>
      </div>
    </div>
  </div>
</template>

