<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  useThemeStore,
  THEME_REGISTRY,
  type ThemeMode,
} from "@/shared/stores/theme.store";

interface Props {
  variant?: "header" | "pill" | "drawer";
}

withDefaults(defineProps<Props>(), {
  variant: "header",
});

const themeStore = useThemeStore();
const isMenuOpen = ref(false);

const availableThemes = computed(() => {
  return themeStore.enabledStorefrontThemes
    .map((id) => THEME_REGISTRY[id])
    .filter(Boolean);
});

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const selectTheme = (themeId: ThemeMode) => {
  if (themeStore.adminForcedTheme) return;
  themeStore.setTheme(themeId);
  isMenuOpen.value = false;
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && isMenuOpen.value) {
    isMenuOpen.value = false;
  }
};

onMounted(() => {
  themeStore.initTheme();
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeyDown);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleKeyDown);
  }
});
</script>

<template>
  <div class="relative inline-block font-sans">
    <!-- Header Variant Trigger -->
    <button
      v-if="variant === 'header'"
      type="button"
      class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl border transition-all cursor-pointer shadow-xs group active:scale-95 text-xs font-bold"
      :class="[
        isMenuOpen
          ? 'border-amber-400 bg-slate-800 text-white'
          : 'border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white',
      ]"
      :title="`Theme: ${themeStore.activeThemeMeta.name}`"
      aria-label="Toggle Shopping Experience Theme"
      @click="toggleMenu"
    >
      <span class="text-sm sm:text-base group-hover:scale-110 transition-transform">
        {{ themeStore.activeThemeMeta.icon }}
      </span>
      <span class="hidden md:inline text-[11px] font-black tracking-tight">
        {{ themeStore.activeThemeMeta.name.split(' ')[0] }}
      </span>
      <span class="text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider hidden lg:inline-block"
        :class="themeStore.adminForcedTheme ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-400/15 text-amber-300'"
      >
        {{ themeStore.adminForcedTheme ? 'Campaign' : themeStore.activeThemeMeta.badge }}
      </span>
      <svg
        class="w-3 h-3 text-slate-400 group-hover:text-amber-400 transition-transform"
        :class="isMenuOpen ? 'rotate-180 text-amber-400' : ''"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Drawer / Full-Width Variant Trigger -->
    <button
      v-else-if="variant === 'drawer'"
      type="button"
      class="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer"
      @click="toggleMenu"
    >
      <div class="flex items-center gap-3 min-w-0">
        <span class="text-xl p-2 rounded-xl bg-slate-950 border border-slate-800">
          {{ themeStore.activeThemeMeta.icon }}
        </span>
        <div class="min-w-0">
          <p class="text-xs font-bold text-white truncate">
            Experience: {{ themeStore.activeThemeMeta.name }}
          </p>
          <p class="text-[10px] text-slate-400 truncate">
            {{ themeStore.activeThemeMeta.badge }}
          </p>
        </div>
      </div>
      <span class="text-xs text-amber-400 font-bold">Switch &rarr;</span>
    </button>

    <!-- Backdrop Click to Close -->
    <div
      v-if="isMenuOpen"
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:bg-transparent"
      @click="isMenuOpen = false"
    ></div>

    <!-- Dropdown Panel -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="isMenuOpen"
        class="absolute right-0 top-full mt-2 w-72 sm:w-84 max-w-[calc(100vw-2rem)] p-3 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl z-50 space-y-2 animate-scale-up text-slate-100 font-display"
      >
        <!-- Dropdown Header -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-800 px-1">
          <div>
            <h4 class="text-xs font-black text-white flex items-center gap-1.5">
              <span>🎭</span> Shopping Vibe &amp; Modes
            </h4>
            <p class="text-[10px] text-slate-400">
              Shift navigation filters &amp; visual style
            </p>
          </div>
          <span
            v-if="themeStore.adminForcedTheme"
            class="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-black uppercase"
          >
            Store Campaign
          </span>
        </div>

        <!-- Forced Campaign Notice -->
        <div
          v-if="themeStore.adminForcedTheme"
          class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-[11px] leading-snug"
        >
          🔒 A storewide campaign (<strong>{{ themeStore.activeThemeMeta.name }}</strong>) is currently active. Individual theme switching is locked by admin.
        </div>

        <!-- Theme Options List -->
        <div class="max-h-80 overflow-y-auto space-y-1.5 pr-1">
          <button
            v-for="item in availableThemes"
            :key="item.id"
            type="button"
            class="w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer relative group"
            :class="[
              themeStore.activeTheme === item.id
                ? 'border-amber-400 bg-amber-400/10 shadow-sm'
                : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-slate-700',
              themeStore.adminForcedTheme ? 'opacity-60 cursor-not-allowed' : '',
            ]"
            @click="selectTheme(item.id)"
          >
            <!-- Theme Icon -->
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border"
              :class="
                themeStore.activeTheme === item.id
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-900 border-slate-800 text-white'
              "
            >
              {{ item.icon }}
            </div>

            <!-- Theme Text & Details -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-1">
                <span class="text-xs font-bold text-white truncate">
                  {{ item.name }}
                </span>
                <span
                  class="text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase shrink-0"
                  :class="
                    themeStore.activeTheme === item.id
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-800 text-indigo-300'
                  "
                >
                  {{ item.badge }}
                </span>
              </div>
              <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                {{ item.description }}
              </p>
            </div>
          </button>
        </div>

        <!-- Active Audience Filter Indicator -->
        <div class="pt-2 border-t border-slate-800/80 px-1 flex items-center justify-between text-[10px]">
          <span class="text-slate-400">Current Filter Mode:</span>
          <span class="text-amber-300 font-mono font-bold">{{ themeStore.activeThemeMeta.filterTitle }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

