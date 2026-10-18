import { defineStore } from "pinia";
import { ref, computed } from "vue";

export type ThemeMode =
  | "light"
  | "collector"
  | "sakura"
  | "playtime"
  | "workbench"
  | "retro-arcade"
  | "cyber-sale"
  | "seasonal-workshop";

export type FilterAudienceMode =
  | "standard"
  | "technical"
  | "sakura_edition"
  | "age_groups"
  | "scale_ratios"
  | "vintage_eras"
  | "drop_countdown"
  | "gift_guides";

export interface ThemeDefinition {
  id: ThemeMode;
  name: string;
  badge: string;
  icon: string;
  description: string;
  filterMode: FilterAudienceMode;
  filterTitle: string;
  sampleFilters: string[];
}

export const THEME_REGISTRY: Record<ThemeMode, ThemeDefinition> = {
  light: {
    id: "light",
    name: "Light Mode (Shopper)",
    badge: "Simple & Clean",
    icon: "☀️",
    description: "Clean, crisp daylight storefront with white cards and easy-to-read contrast for everyday shoppers.",
    filterMode: "standard",
    filterTitle: "Standard Shopper Catalog",
    sampleFilters: ["Best Sellers", "New Arrivals", "On Sale", "In Stock", "Popular Bundles"],
  },
  collector: {
    id: "collector",
    name: "Dark Mode (Collector)",
    badge: "Default Dark",
    icon: "🌙",
    description: "Charcoal & navy dark aesthetic with crisp contrast, gold accents & collector grade clarity.",
    filterMode: "technical",
    filterTitle: "Collector Technical Filters",
    sampleFilters: ["PSA Graded", "Factory Sealed", "First Edition", "1/144 HG", "1/100 MG", "Japanese Import"],
  },
  sakura: {
    id: "sakura",
    name: "Pink Sakura",
    badge: "Sakura Blossom",
    icon: "🌸",
    description: "Soft cherry blossom pink aesthetic with rose-gold accents, petal gradients & Japanese Harajuku collector vibes.",
    filterMode: "sakura_edition",
    filterTitle: "Sakura Blossom Showcase",
    sampleFilters: ["🌸 Sakura Specials", "Japanese Imports", "Kawaii Collectibles", "VIP Exclusives", "Holo & Foil"],
  },
  playtime: {
    id: "playtime",
    name: "Playtime (Kids)",
    badge: "Age 1–8+ & Fun",
    icon: "🧸",
    description: "Vibrant candy colors, friendly rounded bubbles & playful pastel storefront vibe.",
    filterMode: "age_groups",
    filterTitle: "Browse by Age & Play Stage",
    sampleFilters: ["Toddlers (1–3 yrs)", "Kids (4–7 yrs)", "Pre-Teens (8–12 yrs)", "Plushies & Soft Toys", "Board Games"],
  },
  workbench: {
    id: "workbench",
    name: "Blueprint Workbench",
    badge: "Cutting Mat",
    icon: "📐",
    description: "Drafting board with blueprint grid lines, monospace font & DIY model builder aesthetic.",
    filterMode: "scale_ratios",
    filterTitle: "Workshop Drafting Scales",
    sampleFilters: ["1/144 Scale", "1/100 Scale", "1/60 Perfect Grade", "1/12 Scale", "Paints & Primers", "Hobby Nippers"],
  },
  "retro-arcade": {
    id: "retro-arcade",
    name: "Retro Arcade",
    badge: "8-Bit Nostalgia",
    icon: "👾",
    description: "CRT scanlines, neon magenta & phosphor green accents for vintage toys & retro games.",
    filterMode: "vintage_eras",
    filterTitle: "Retro Eras & Nostalgia Vault",
    sampleFilters: ["80s Golden Age", "90s Pixel Era", "Y2K Retro", "Arcade Cabinet", "Vintage TCG (1999)"],
  },
  "cyber-sale": {
    id: "cyber-sale",
    name: "Cyber Drop & Sale",
    badge: "Limited Drops",
    icon: "⚡",
    description: "High-voltage dark drop aesthetic with neon crimson & yellow accents for flash sales.",
    filterMode: "drop_countdown",
    filterTitle: "Cyber Vault & Limited Drops",
    sampleFilters: ["🔥 Live Drops", "⏳ Dropping in 24h", "💎 Vault Exclusives", "⚡ 50% Off Flash", "Low Stock Alerts"],
  },
  "seasonal-workshop": {
    id: "seasonal-workshop",
    name: "Santa's Workshop",
    badge: "Holiday Gifting",
    icon: "🎄",
    description: "Velvet crimson, festive gold & pine green overlay tailored for holiday gift finding.",
    filterMode: "gift_guides",
    filterTitle: "Santa's Gift Finder",
    sampleFilters: ["🎅 Gifts Under ₱1,000", "🎁 Collector Gift Sets", "⭐ Top Rated for Gifting", "Stocking Stuffers"],
  },
};

const STORAGE_KEY_USER_THEME = "rlg_store_theme";
const STORAGE_KEY_FORCED_THEME = "rlg_admin_forced_theme";
const STORAGE_KEY_ENABLED_THEMES = "rlg_enabled_themes";

export const useThemeStore = defineStore("app-theme", () => {
  const currentTheme = ref<ThemeMode>("collector");
  const adminForcedTheme = ref<ThemeMode | null>(null);
  const enabledStorefrontThemes = ref<ThemeMode[]>([
    "light",
    "collector",
    "sakura",
    "playtime",
    "workbench",
    "retro-arcade",
    "cyber-sale",
    "seasonal-workshop",
  ]);

  const activeTheme = computed<ThemeMode>(() => {
    return adminForcedTheme.value || currentTheme.value;
  });

  const activeThemeMeta = computed<ThemeDefinition>(() => {
    return THEME_REGISTRY[activeTheme.value] || THEME_REGISTRY.collector;
  });

  const activeFilterMode = computed<FilterAudienceMode>(() => {
    return activeThemeMeta.value.filterMode;
  });

  const applyThemeToDOM = (theme: ThemeMode) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  };

  const setTheme = (theme: ThemeMode) => {
    currentTheme.value = theme;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_USER_THEME, theme);
    }
    applyThemeToDOM(activeTheme.value);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rlg:theme-updated", { detail: activeTheme.value }));
    }
  };

  const setAdminForcedTheme = (theme: ThemeMode | null) => {
    adminForcedTheme.value = theme;
    if (typeof localStorage !== "undefined") {
      if (theme) {
        localStorage.setItem(STORAGE_KEY_FORCED_THEME, theme);
      } else {
        localStorage.removeItem(STORAGE_KEY_FORCED_THEME);
      }
    }
    applyThemeToDOM(activeTheme.value);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rlg:admin-theme-forced", { detail: theme }));
    }
  };

  const setEnabledThemes = (themes: ThemeMode[]) => {
    if (themes.length === 0) return;
    enabledStorefrontThemes.value = [...themes];
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ENABLED_THEMES, JSON.stringify(themes));
    }
    // If current theme is no longer allowed and no admin force, switch to first allowed
    if (!adminForcedTheme.value && !themes.includes(currentTheme.value)) {
      setTheme(themes[0]);
    }
  };

  const initTheme = () => {
    if (typeof localStorage === "undefined") return;

    // Load admin forced theme
    const forced = localStorage.getItem(STORAGE_KEY_FORCED_THEME) as ThemeMode | null;
    if (forced && THEME_REGISTRY[forced]) {
      adminForcedTheme.value = forced;
    }

    // Load enabled themes
    const enabledRaw = localStorage.getItem(STORAGE_KEY_ENABLED_THEMES);
    if (enabledRaw) {
      try {
        const parsed = JSON.parse(enabledRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((t) => THEME_REGISTRY[t as ThemeMode]) as ThemeMode[];
          if (!valid.includes("light")) {
            valid.unshift("light");
          }
          if (!valid.includes("sakura")) {
            valid.splice(2, 0, "sakura");
          }
          enabledStorefrontThemes.value = valid;
        }
      } catch (e) {
        console.error("Failed to parse enabled themes", e);
      }
    }

    // Load user theme preference
    const saved = localStorage.getItem(STORAGE_KEY_USER_THEME) as ThemeMode | null;
    if (saved && THEME_REGISTRY[saved]) {
      currentTheme.value = saved;
    }

    applyThemeToDOM(activeTheme.value);

    // Cross-tab sync listener
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY_FORCED_THEME) {
          adminForcedTheme.value = (e.newValue as ThemeMode) || null;
          applyThemeToDOM(activeTheme.value);
        } else if (e.key === STORAGE_KEY_USER_THEME && e.newValue) {
          if (THEME_REGISTRY[e.newValue as ThemeMode]) {
            currentTheme.value = e.newValue as ThemeMode;
            applyThemeToDOM(activeTheme.value);
          }
        }
      });
    }
  };

  return {
    currentTheme,
    adminForcedTheme,
    enabledStorefrontThemes,
    activeTheme,
    activeThemeMeta,
    activeFilterMode,
    setTheme,
    setAdminForcedTheme,
    setEnabledThemes,
    initTheme,
  };
});

