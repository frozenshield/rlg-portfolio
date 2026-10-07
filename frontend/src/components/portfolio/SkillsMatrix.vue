<script setup>
import { ref } from 'vue'
import { skillsMatrix } from '../../data/projectsData'
import { 
  Code2, 
  Server, 
  LayoutGrid, 
  Sparkles, 
  Cloud, 
  Workflow,
  CheckCircle,
  BadgeCheck,
  Zap
} from 'lucide-vue-next'

const selectedCategory = ref('all')

const iconMap = {
  'Code2': Code2,
  'Server': Server,
  'LayoutGrid': LayoutGrid,
  'Sparkles': Sparkles,
  'Cloud': Cloud,
  'Workflow': Workflow
}

function getIcon(name) {
  return iconMap[name] || Code2
}
</script>

<template>
  <div id="skills-matrix" class="bento-card p-6 sm:p-8 border-slate-200/80">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
          <Zap class="w-3.5 h-3.5" />
          <span>Core Capabilities & Tech Matrix</span>
        </div>
        <h3 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Tools, Languages & Infrastructure
        </h3>
        <p class="mt-1 text-slate-600 text-sm max-w-2xl">
          Engineered for production scale across modern frontend paradigms, robust Laravel service layers, and autonomous AI pipelines.
        </p>
      </div>

      <!-- Category Filter Pills -->
      <div class="flex flex-wrap gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 text-xs font-semibold">
        <button
          @click="selectedCategory = 'all'"
          :class="[
            'px-3 py-1.5 rounded-lg transition-all',
            selectedCategory === 'all' 
              ? 'bg-white text-indigo-700 shadow-xs font-bold' 
              : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          All (6 Areas)
        </button>
        <button
          v-for="cat in skillsMatrix"
          :key="cat.category"
          @click="selectedCategory = cat.category"
          :class="[
            'px-3 py-1.5 rounded-lg transition-all',
            selectedCategory === cat.category 
              ? 'bg-white text-indigo-700 shadow-xs font-bold' 
              : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          {{ cat.category.split(' ')[0] }}
        </button>
      </div>
    </div>

    <!-- Skills Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="section in skillsMatrix" 
        :key="section.category"
        v-show="selectedCategory === 'all' || selectedCategory === section.category"
        class="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
      >
        <div>
          <!-- Section Header -->
          <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="p-2 rounded-lg bg-slate-100 text-indigo-600">
                <component :is="getIcon(section.icon)" class="w-4 h-4" />
              </div>
              <h4 class="font-bold text-slate-900 text-sm sm:text-base">
                {{ section.category }}
              </h4>
            </div>
            <span class="text-[11px] font-mono text-slate-400">
              {{ section.skills.length }} Skills
            </span>
          </div>

          <!-- Skills list in section -->
          <div class="space-y-3">
            <div 
              v-for="skill in section.skills" 
              :key="skill.name"
              class="group p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/60"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <BadgeCheck class="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  {{ skill.name }}
                </span>
                <span 
                  :class="[
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider',
                    skill.level === 'Expert' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  ]"
                >
                  {{ skill.level }}
                </span>
              </div>
              <p class="text-[11px] text-slate-500 leading-snug pl-5">
                {{ skill.desc }}
              </p>
            </div>
          </div>
        </div>

        <!-- Card bottom subtle note -->
        <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Production Ready</span>
          <span class="text-indigo-600 font-semibold">100% Tested</span>
        </div>
      </div>
    </div>
  </div>
</template>

