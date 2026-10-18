<script setup lang="ts">
import { ref } from "vue";
import {
  useThemeStore,
  THEME_REGISTRY,
  type ThemeMode,
} from "@/shared/stores/theme.store";

const themeStore = useThemeStore();
const saveFeedback = ref("");

const toggleStorefrontTheme = (themeId: ThemeMode) => {
  const current = [...themeStore.enabledStorefrontThemes];
  const idx = current.indexOf(themeId);
  if (idx > -1) {
    if (current.length <= 1) {
      alert("At least one storefront theme must remain enabled.");
      return;
    }
    current.splice(idx, 1);
  } else {
    current.push(themeId);
  }
  themeStore.setEnabledThemes(current);
  showFeedback("Storefront theme permissions updated! 🎨");
};

const handleForcedThemeChange = (themeId: ThemeMode | null) => {
  themeStore.setAdminForcedTheme(themeId);
  if (themeId) {
    showFeedback(`Global campaign lock activated: ${THEME_REGISTRY[themeId].name} 🚀`);
  } else {
    showFeedback("Global campaign lock removed. Shoppers can now freely select themes. 🔓");
  }
};

const handleBackendPreviewChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const themeId = target.value as ThemeMode;
  themeStore.setTheme(themeId);
  showFeedback(`Previewing ${THEME_REGISTRY[themeId].name} in Admin Panel 👁️`);
};

const showFeedback = (msg: string) => {
  saveFeedback.value = msg;
  setTimeout(() => {
    saveFeedback.value = "";
  }, 3000);
};
</script>

<template>
  <div class="space-y-6 font-display text-slate-100">
    <!-- Header Banner -->
    <div
      class="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
    >
      <div>
        <div class="flex items-center gap-2.5">
          <span class="text-2xl p-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
            🎨
          </span>
          <div>
            <h3 class="text-lg font-black text-white">
              Multi-State Theme &amp; Audience Control Center
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Configure radical UI themes, age-group filters, technical specs, and seasonal flash campaigns.
            </p>
          </div>
        </div>
      </div>

      <!-- Live Backend Preview Switcher -->
      <div class="flex items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 shrink-0">
        <div class="text-right hidden sm:block">
          <p class="text-[10px] font-black uppercase text-amber-400 tracking-wider">
            Admin Preview
          </p>
          <p class="text-xs text-slate-300 font-bold">
            Test UI Theme:
          </p>
        </div>
        <select
          :value="themeStore.activeTheme"
          class="bg-slate-900 border border-slate-700 text-amber-300 font-black rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 cursor-pointer shadow-sm"
          @change="handleBackendPreviewChange"
        >
          <option v-for="t in THEME_REGISTRY" :key="t.id" :value="t.id">
            {{ t.icon }} {{ t.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Feedback Toast -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="saveFeedback"
        class="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg"
      >
        <span>✓</span>
        <span>{{ saveFeedback }}</span>
      </div>
    </transition>

    <!-- SECTION 1: GLOBAL FORCED CAMPAIGN THEME (Black Friday / Cyber Drop / Q4 Holidays) -->
    <div
      class="p-6 rounded-3xl border shadow-xl space-y-4"
      :class="
        themeStore.adminForcedTheme
          ? 'bg-gradient-to-br from-rose-950/60 via-slate-900 to-amber-950/40 border-rose-500/40'
          : 'bg-slate-900/90 border-slate-800'
      "
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-lg">📢</span>
            <h4 class="text-sm font-black text-white uppercase tracking-wider">
              Global Forced Campaign Mode (Storewide Override)
            </h4>
            <span
              v-if="themeStore.adminForcedTheme"
              class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500 text-white animate-pulse"
            >
              Active Override
            </span>
          </div>
          <p class="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            When set, all shoppers on the website will be <strong>forced into this specific theme</strong> (e.g. Cyber Sale for limited drops, or Santa's Workshop during Q4 holidays), disabling personal switching.
          </p>
        </div>

        <button
          v-if="themeStore.adminForcedTheme"
          type="button"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer shrink-0"
          @click="handleForcedThemeChange(null)"
        >
          ✕ Deactivate Lock (Restore Shopper Freedom)
        </button>
      </div>

      <!-- Campaign Buttons Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
        <!-- Option: No Forced Override -->
        <button
          type="button"
          class="p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
          :class="
            !themeStore.adminForcedTheme
              ? 'border-emerald-400 bg-emerald-400/10 font-bold text-emerald-300 shadow-md ring-1 ring-emerald-400'
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-400'
          "
          @click="handleForcedThemeChange(null)"
        >
          <span class="text-xl">🆓</span>
          <span class="text-xs font-black">Shopper Choice</span>
          <span class="text-[9px] text-slate-400">No force lock</span>
        </button>

        <!-- Each registered theme -->
        <button
          v-for="item in THEME_REGISTRY"
          :key="item.id"
          type="button"
          class="p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
          :class="
            themeStore.adminForcedTheme === item.id
              ? 'border-amber-400 bg-amber-400/15 font-black text-amber-300 shadow-md ring-2 ring-amber-400/50'
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300 hover:text-white'
          "
          @click="handleForcedThemeChange(item.id)"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span class="text-xs font-bold truncate w-full">{{ item.name.split(' ')[0] }}</span>
          <span class="text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase bg-slate-800 text-indigo-300">
            {{ item.badge }}
          </span>
        </button>
      </div>
    </div>

    <!-- SECTION 2: STOREFRONT THEME AVAILABILITY MATRIX -->
    <div class="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
      <div>
        <h4 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <span>🎛️</span> Available Storefront Themes
        </h4>
        <p class="text-xs text-slate-400 mt-1">
          Control which themes are accessible to shoppers in the header toggle switch. Unchecking a theme hides it from shoppers.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        <div
          v-for="item in THEME_REGISTRY"
          :key="item.id"
          class="p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3"
          :class="
            themeStore.enabledStorefrontThemes.includes(item.id)
              ? 'bg-slate-950 border-slate-800'
              : 'bg-slate-950/40 border-slate-900 opacity-50'
          "
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0">
                {{ item.icon }}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <h5 class="text-xs font-bold text-white truncate">{{ item.name }}</h5>
                </div>
                <span class="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  {{ item.badge }}
                </span>
                <p class="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {{ item.description }}
                </p>
              </div>
            </div>

            <!-- Toggle Checkbox -->
            <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                class="sr-only peer"
                :checked="themeStore.enabledStorefrontThemes.includes(item.id)"
                @change="toggleStorefrontTheme(item.id)"
              />
              <div
                class="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"
              ></div>
            </label>
          </div>

          <!-- Quick Live Preview Action -->
          <div class="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
            <span class="text-slate-400">
              {{ themeStore.activeTheme === item.id ? '● Currently Active on Page' : 'Page Visual Style' }}
            </span>
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
              :class="
                themeStore.activeTheme === item.id
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
              "
              @click="themeStore.setTheme(item.id); showFeedback(`Switched page theme to ${item.name} 🎨`)"
            >
              {{ themeStore.activeTheme === item.id ? '✓ Active Theme' : 'Apply Theme' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

