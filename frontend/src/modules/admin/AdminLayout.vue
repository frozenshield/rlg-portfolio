<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watchEffect } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ScanLine } from "lucide-vue-next";
import { useAdminStore } from "./admin.store";

const router = useRouter();
const route = useRoute();
const adminStore = useAdminStore();

const isSidebarCollapsed = ref(false);
const isMobileMenuOpen = ref(false);

// --- Inactivity Auto-Logout (5 Minutes with 60s Warning Countdown Modal) ---
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes (300,000 ms)
const WARNING_THRESHOLD_MS = 60 * 1000; // 60 seconds warning before timeout
const EVENT_THROTTLE_MS = 1000; // Throttle event listener updates

const lastActivityTime = ref<number>(Date.now());
const showIdleWarningModal = ref<boolean>(false);
const idleSecondsRemaining = ref<number>(60);
let lastProcessedActivity = Date.now();
let idleCheckInterval: any = null;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
];

const handleUserActivity = () => {
  const now = Date.now();
  if (now - lastProcessedActivity < EVENT_THROTTLE_MS) return;
  lastProcessedActivity = now;

  // Once warning modal is showing, user must explicitly click "Stay Logged In"
  // to prevent accidental microscopic mouse movement from dismissing the warning.
  if (!showIdleWarningModal.value) {
    lastActivityTime.value = now;
  }
};

const handleExtendSession = () => {
  const now = Date.now();
  lastProcessedActivity = now;
  lastActivityTime.value = now;
  showIdleWarningModal.value = false;
  idleSecondsRemaining.value = 60;
};

const handleIdleTimeout = async () => {
  showIdleWarningModal.value = false;
  stopIdleTimer();
  adminStore.logout();
  try {
    localStorage.removeItem("rlg-admin-session");
    sessionStorage.removeItem("rlg-admin-session");
  } catch {}
  await router.replace({
    path: "/admin/login",
    query: {
      expired: "true",
      reason: "inactivity",
      message: "Session expired due to inactivity. Please log in again.",
    },
  });
};

const startIdleTimer = () => {
  stopIdleTimer();
  lastActivityTime.value = Date.now();
  lastProcessedActivity = Date.now();
  idleCheckInterval = setInterval(() => {
    if (!adminStore.currentAdmin) return;
    const elapsed = Date.now() - lastActivityTime.value;
    const remainingMs = INACTIVITY_TIMEOUT_MS - elapsed;

    if (remainingMs <= 0) {
      handleIdleTimeout();
    } else if (remainingMs <= WARNING_THRESHOLD_MS) {
      showIdleWarningModal.value = true;
      idleSecondsRemaining.value = Math.max(1, Math.ceil(remainingMs / 1000));
    } else {
      showIdleWarningModal.value = false;
    }
  }, 1000);
};

const stopIdleTimer = () => {
  if (idleCheckInterval) {
    clearInterval(idleCheckInterval);
    idleCheckInterval = null;
  }
};

// Guard: if no admin session, hydrate from localStorage first, only redirect if truly unauthenticated
onMounted(() => {
  if (!adminStore.currentAdmin) {
    const raw = localStorage.getItem("rlg-admin-session");
    if (raw && raw !== "null" && raw !== "undefined") {
      try {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === "object" &&
          (parsed.id || parsed.email)
        ) {
          adminStore.currentAdmin = parsed;
        }
      } catch (e) {
        console.warn("Failed to parse admin session on mount", e);
      }
    }
  }

  if (!adminStore.currentAdmin) {
    router.replace("/admin/login");
  } else {
    // Refresh permissions for currently logged in admin/staff
    adminStore.fetchStaffPermissions();

    // Attach user activity listeners across the document/window
    ACTIVITY_EVENTS.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });
    startIdleTimer();
  }
});

onUnmounted(() => {
  ACTIVITY_EVENTS.forEach((evt) => {
    window.removeEventListener(evt, handleUserActivity);
  });
  stopIdleTimer();
});

const handleSignOut = async () => {
  stopIdleTimer();
  adminStore.logout();
  try {
    localStorage.removeItem("rlg-admin-session");
    sessionStorage.removeItem("rlg-admin-session");
  } catch {}
  await router.replace("/admin/login");
};

// Master list of all admin sidebar modules
const allNavItems = computed(() => [
  {
    path: "/admin/dashboard",
    code: "dashboard",
    name: "Dashboard",
    icon: "📊",
    badge: null,
  },
  {
    path: "/admin/orders",
    code: "orders",
    name: "Orders",
    icon: "📦",
    badge: adminStore.metrics?.pendingOrdersCount ?? null,
  },
  {
    path: "/admin/inventory",
    code: "inventory",
    name: "Inventory & Stock",
    icon: "🏷️",
    badge: adminStore.metrics?.lowStockCount ? "Low" : null,
  },
  {
    path: "/admin/products",
    code: "products",
    name: "Product Catalog",
    icon: "➕",
    badge: "New",
  },
  {
    path: "/admin/auctions",
    code: "auctions",
    name: "Auctions & Bidding",
    icon: "🔨",
    badge: "Live",
  },
    {
    path: "/admin/wallet",
    code: "wallet",
    name: "Wallet Ledger",
    icon: "💳",
    badge: null,
  },
    {
    path: "/admin/live-breaks",
    code: "live-breaks",
    name: "Live Breaks & Stream",
    icon: "📡",
    badge: "Live",
  },
  {
    path: "/admin/preorders",
    code: "preorders",
    name: "Pre-Orders & Drops",
    icon: "📅",
    badge: "Calendar",
  },
  {
    path: "/admin/gacha-raffles",
    code: "gacha-raffles",
    name: "Gacha & Raffles",
    icon: "🎰",
    badge: "Oripa",
  },
  {
    path: "/admin/customers",
    code: "customers",
    name: "Customers & CRM",
    icon: "👥",
    badge: adminStore.metrics?.unreadInquiriesCount || null,
  },
  {
    path: "/admin/marketing",
    code: "marketing",
    name: "Marketing & Promos",
    icon: "🎯",
    badge: null,
  },
  {
    path: "/admin/pro-subscription",
    code: "pro-subscription",
    name: "Pro Subscription",
    icon: "👑",
    badge: "VIP",
  },
  {
    path: "/admin/cms",
    code: "cms",
    name: "CMS & Storefront",
    icon: "🎨",
    badge: null,
  },
  {
    path: "/admin/analytics",
    code: "analytics",
    name: "Analytics & Reports",
    icon: "📈",
    lucideIcon: null,
    badge: null,
  },
  {
    path: "/admin/mobile-tools",
    code: "mobile-tools",
    name: "Mobile Tools",
    icon: "📱",
    lucideIcon: ScanLine,
    badge: "Scanner",
  },
  {
    path: "/admin/audit-trail",
    code: "audit-trail",
    name: "Audit Trail",
    icon: "📜",
    lucideIcon: null,
    badge: "Security",
  },
  {
    path: "/admin/settings",
    code: "settings",
    name: "Settings & Config",
    icon: "⚙️",
    lucideIcon: null,
    badge: null,
  },
]);

// Filter visible sidebar items by staff access matrix permissions
const navItems = computed(() => {
  return allNavItems.value.filter((item) =>
    adminStore.canAccess(item.code, item.path),
  );
});

// Friendly role label
const roleLabel = computed(() => {
  if (adminStore.currentAdmin?.roleLabel) {
    return adminStore.currentAdmin.roleLabel;
  }
  const r = adminStore.currentAdmin?.role;
  if (r === "super-admin") return "Super Admin (Unrestricted)";
  if (r === "manager") return "Store Manager (Catalog & Operations)";
  if (r === "fulfillment") return "Fulfillment Staff (Packing & Shipping only)";
  return "Staff Member";
});

// Access matrix route guard: if navigating to an unauthorized module URL, redirect to dashboard or first allowed module
watchEffect(() => {
  if (
    adminStore.currentAdmin &&
    route.path.startsWith("/admin") &&
    route.path !== "/admin/login"
  ) {
    const role = String(adminStore.currentAdmin.role || "").toLowerCase();
    const roleLabel = String(adminStore.currentAdmin.roleLabel || "").toLowerCase();
    if (
      role === "super-admin" ||
      role === "admin" ||
      role.includes("admin") ||
      roleLabel.includes("admin")
    ) {
      return;
    }

    if (navItems.value.length > 0 && !adminStore.canAccessPath(route.path)) {
      const fallbackTarget = navItems.value[0]?.path || "/admin/dashboard";
      if (route.path !== fallbackTarget) {
        router.replace(fallbackTarget);
      }
    }
  }
});
</script>

<template>
  <div
    class="h-screen max-h-screen admin-theme-shell text-slate-800 flex font-display overflow-hidden transition-colors duration-300"
  >
    <!-- Desktop Sidebar -->
    <aside
      class="hidden md:flex flex-col bg-slate-950 text-slate-300 border-r border-slate-800 transition-all duration-300 z-30 h-full flex-shrink-0"
      :class="isSidebarCollapsed ? 'w-20' : 'w-64'"
    >
      <!-- Brand Logo / Header -->
      <div
        class="h-20 flex items-center justify-between px-5 border-b border-slate-800/80"
      >
        <router-link
          to="/admin/dashboard"
          class="flex items-center gap-3 overflow-hidden group select-none"
        >
          <img
            src="/logo.png"
            alt="RLG Online Shop Logo"
            class="w-10 h-10 object-contain rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform"
          />
          <div v-if="!isSidebarCollapsed" class="min-w-0">
            <h2 class="text-sm font-black text-white tracking-tight truncate">
              RLG <span class="text-amber-400">ONLINE SHOP</span>
            </h2>
            <p class="text-[10px] text-slate-400 font-medium">Command Center</p>
          </div>
        </router-link>

        <button
          type="button"
          class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          :title="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="isSidebarCollapsed = !isSidebarCollapsed"
        >
          <svg
            class="w-4 h-4 transition-transform"
            :class="isSidebarCollapsed ? 'rotate-180' : ''"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group"
          :class="
            route.path.startsWith(item.path)
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          "
          :title="item.name"
        >
          <component
            :is="item.lucideIcon"
            v-if="item.lucideIcon"
            :size="18"
            class="flex-shrink-0"
          />
          <span v-else class="text-lg flex-shrink-0">{{ item.icon }}</span>
          <span v-if="!isSidebarCollapsed" class="flex-1 truncate">{{
            item.name
          }}</span>
          <span
            v-if="!isSidebarCollapsed && item.badge"
            class="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full"
            :class="
              route.path.startsWith(item.path)
                ? 'bg-white/20 text-white'
                : 'bg-slate-800 text-rose-400'
            "
          >
            {{ item.badge }}
          </span>
        </router-link>
      </nav>

      <!-- Bottom Staff Profile & Dedicated Logout -->
      <div class="p-3 border-t border-slate-800/80 space-y-2">
        <div
          class="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60"
          :class="isSidebarCollapsed ? 'justify-center' : ''"
        >
          <div
            class="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0"
          >
            {{
              (adminStore.currentAdmin?.name || "Admin").charAt(0).toUpperCase()
            }}
          </div>
          <div v-if="!isSidebarCollapsed" class="flex-1 min-w-0">
            <p class="text-xs font-bold text-white truncate">
              {{ adminStore.currentAdmin?.name || "Administrator" }}
            </p>
            <p class="text-[10px] text-slate-400 capitalize truncate">
              {{ roleLabel }}
            </p>
          </div>
        </div>

        <!-- Sidebar Log Out Button -->
        <button
          type="button"
          class="w-full py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800/80 hover:border-rose-700/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          :title="isSidebarCollapsed ? 'Log Out' : ''"
          @click="handleSignOut"
        >
          <svg
            class="w-4 h-4 text-rose-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span v-if="!isSidebarCollapsed">Log Out</span>
        </button>
      </div>
    </aside>

    <!-- Main Workspace -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
      <!-- Top Navbar -->
      <header
        class="h-20 admin-topbar border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-3 sm:gap-4 sticky top-0 z-20 shadow-xs flex-shrink-0 transition-colors duration-300"
      >
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <!-- Mobile Hamburger Menu Button (Min 44px tap target) -->
          <button
            type="button"
            class="md:hidden w-11 h-11 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/30 flex-shrink-0"
            aria-label="Toggle navigation drawer"
            @click="isMobileMenuOpen = true"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <!-- Breadcrumb Title -->
          <div
            class="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-slate-400 min-w-0"
          >
            <span class="hidden sm:inline">Admin</span>
            <span class="hidden sm:inline">/</span>
            <span class="text-slate-900 capitalize truncate font-extrabold sm:font-bold">{{
              (route.name || "dashboard").toString().replace("admin-", "")
            }}</span>
          </div>
        </div>

        <!-- Right Header Items -->
        <div class="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <!-- View Storefront Link (Desktop) -->
          <router-link
            to="/"
            target="_blank"
            class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <span>Live Storefront</span>
            <span>↗</span>
          </router-link>

          <!-- View Storefront Link (Mobile icon button, 44px) -->
          <router-link
            to="/"
            target="_blank"
            class="sm:hidden w-11 h-11 rounded-xl flex items-center justify-center text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-sm transition-colors"
            title="View Live Storefront"
          >
            <span>↗</span>
          </router-link>

          <!-- Quick Action: New Product (Desktop) -->
          <router-link
            v-if="adminStore.canAccessPath('/admin/products')"
            to="/admin/products"
            class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
          >
            <span>+ Add Product</span>
          </router-link>

          <!-- Quick Action: New Product (Mobile icon button, 44px) -->
          <router-link
            v-if="adminStore.canAccessPath('/admin/products')"
            to="/admin/products"
            class="sm:hidden w-11 h-11 rounded-xl flex items-center justify-center text-white bg-slate-900 hover:bg-slate-800 shadow-xs text-base font-bold transition-colors"
            title="Add Product"
          >
            <span>+</span>
          </router-link>

          <!-- Logout Button (Top Header, Min 44px height) -->
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 min-h-[44px] rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 transition-colors border border-rose-200 cursor-pointer shadow-xs active:scale-95"
            title="Log out and end session"
            @click="handleSignOut"
          >
            <svg
              class="w-4 h-4 text-rose-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span class="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <!-- Page Content Area -->
      <main class="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <router-view />
      </main>
    </div>

    <!-- Mobile Slide-Out Drawer Navigation (Collapsible Drawer) -->
    <teleport to="body">
      <transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isMobileMenuOpen"
          class="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 md:hidden"
          @click="isMobileMenuOpen = false"
        ></div>
      </transition>

      <transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
      >
        <aside
          v-if="isMobileMenuOpen"
          class="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-950 text-slate-300 z-50 md:hidden flex flex-col shadow-2xl border-r border-slate-800 overflow-hidden pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          @click.stop
        >
          <!-- Drawer Header -->
          <div
            class="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 flex-shrink-0"
          >
            <div class="flex items-center gap-3 min-w-0">
              <img
                src="/logo.png"
                alt="RLG Online Shop Logo"
                class="w-9 h-9 object-contain rounded-xl flex-shrink-0"
              />
              <div class="min-w-0">
                <h2 class="text-xs font-black text-white tracking-tight truncate">
                  RLG <span class="text-amber-400">ONLINE SHOP</span>
                </h2>
                <p class="text-[10px] text-slate-400 font-medium">Command Center</p>
              </div>
            </div>

            <button
              type="button"
              class="w-11 h-11 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close navigation menu"
              @click="isMobileMenuOpen = false"
            >
              ✕
            </button>
          </div>

          <!-- Staff User Profile Card inside Drawer -->
          <div class="p-3 border-b border-slate-800/80 bg-slate-900/40 flex-shrink-0">
            <div
              class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800"
            >
              <div
                class="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0"
              >
                {{
                  (adminStore.currentAdmin?.name || "Admin").charAt(0).toUpperCase()
                }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-white truncate">
                  {{ adminStore.currentAdmin?.name || "Administrator" }}
                </p>
                <span
                  class="inline-block text-[9px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50 truncate max-w-full"
                >
                  {{ roleLabel }}
                </span>
              </div>
            </div>
          </div>

          <!-- Navigation Links (Scrollable with min 44px tap targets) -->
          <nav class="flex-1 px-3 py-3 space-y-1 overflow-y-auto no-scrollbar">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-xs font-bold transition-all"
              :class="
                route.path.startsWith(item.path)
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              "
              @click="isMobileMenuOpen = false"
            >
              <component
                :is="item.lucideIcon"
                v-if="item.lucideIcon"
                :size="18"
                class="flex-shrink-0"
              />
              <span v-else class="text-lg flex-shrink-0">{{ item.icon }}</span>
              <span class="flex-1 truncate">{{ item.name }}</span>
              <span
                v-if="item.badge"
                class="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                :class="
                  route.path.startsWith(item.path)
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-rose-400 border border-slate-700'
                "
              >
                {{ item.badge }}
              </span>
            </router-link>
          </nav>

          <!-- Drawer Footer Actions -->
          <div class="p-3 border-t border-slate-800/80 space-y-2 flex-shrink-0">
            <router-link
              to="/"
              target="_blank"
              class="w-full min-h-[44px] px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-800 transition-colors"
              @click="isMobileMenuOpen = false"
            >
              <span>Live Storefront</span>
              <span>↗</span>
            </router-link>

            <button
              type="button"
              class="w-full min-h-[44px] px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              @click="handleSignOut"
            >
              <svg
                class="w-4 h-4 text-rose-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      </transition>
    </teleport>

    <!-- Inactivity Auto-Logout Warning Modal (Countdown Timer) -->
    <teleport to="body">
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="showIdleWarningModal"
          class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 font-display"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="idle-warning-title"
        >
          <div
            class="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl shadow-amber-950/40 text-slate-100 animate-fade-in"
            @click.stop
          >
            <!-- Animated Icon -->
            <div
              class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-3xl mx-auto shadow-inner"
            >
              <span class="animate-pulse">⏳</span>
            </div>

            <!-- Title & Description -->
            <div class="space-y-2">
              <h3
                id="idle-warning-title"
                class="text-lg font-black text-white tracking-tight"
              >
                Inactivity Warning
              </h3>
              <p class="text-xs text-slate-300 leading-relaxed">
                Your admin session has been inactive for over 4 minutes. For store security, you will be automatically logged out in:
              </p>
            </div>

            <!-- Countdown Pill -->
            <div
              class="py-2.5 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 inline-flex items-center gap-2 text-amber-300 font-black text-sm"
            >
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>{{ idleSecondsRemaining }} seconds remaining</span>
            </div>

            <!-- Actions (Min 44px touch targets) -->
            <div class="space-y-2 pt-2">
              <button
                type="button"
                class="w-full min-h-[44px] py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-400/20 active:scale-95 cursor-pointer"
                @click="handleExtendSession"
              >
                ✓ Stay Logged In
              </button>

              <button
                type="button"
                class="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                @click="handleSignOut"
              >
                Log Out Now
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>
