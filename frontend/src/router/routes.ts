import type { RouteRecordRaw } from "vue-router";

const HomeView = () => import("@/modules/home/HomeView.vue");
const ToyCatalogView = () => import("@/modules/catalog/ToyCatalogView.vue");
const CheckoutView = () => import("@/modules/checkout/CheckoutView.vue");
const WishlistView = () => import("@/modules/wishlist/WishlistView.vue");
const AuthCallbackView = () => import("@/modules/auth/AuthCallbackView.vue");

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: {
      title: "Home | RLG Hobby Shop - Pokémon Toys & TCG Collectibles",
    },
  },
  {
    path: "/catalog",
    name: "catalog",
    component: ToyCatalogView,
    meta: {
      title: "All Pokémon Toys, Cards & Gear | RLG Hobby Shop",
    },
  },
  {
    path: "/vip",
    name: "vip-subscription",
    component: () => import("@/modules/catalog/VipSubscriptionView.vue"),
    meta: {
      title: "VIP & Pro Exclusive Drops | RLG Hobby Shop",
    },
  },
  {
    path: "/wishlist",
    name: "wishlist",
    component: WishlistView,
    meta: {
      title: "Trainer Wishlist | RLG Hobby Shop",
    },
  },
  {
    path: "/checkout",
    name: "checkout",
    component: CheckoutView,
    meta: {
      title: "Express Poké-Checkout | RLG Hobby Shop",
    },
  },
  {
    path: "/orders",
    name: "orders",
    component: () => import("@/modules/orders/CustomerOrdersView.vue"),
    meta: {
      title: "My Orders & Package Tracking | RLG Hobby Shop",
    },
  },
  {
    path: "/track-order",
    redirect: "/orders",
  },
  {
    path: "/auth/callback",
    name: "auth-callback",
    component: AuthCallbackView,
    meta: {
      title: "Authenticating... | RLG Hobby Shop",
    },
  },
  {
    path: "/login",
    redirect: () => ({ path: "/", query: { open_auth: "true" } }),
  },
  {
    path: "/auctions",
    name: "auctions-list",
    component: () => import("@/modules/auctions/views/AuctionsListView.vue"),
    meta: {
      title: "Real-Time Collector Auctions | RLG Hobby Shop",
    },
  },
  {
    path: "/auctions/:id",
    name: "auction-detail",
    component: () => import("@/modules/auctions/views/AuctionDetailView.vue"),
    meta: {
      title: "Live Bidding Arena | RLG Hobby Shop",
    },
  },
  {
    path: "/profile/auctions",
    name: "customer-auctions",
    component: () => import("@/modules/auctions/views/CustomerAuctionsView.vue"),
    meta: {
      title: "My Auctions, Bids & Won Lots | RLG Hobby Shop",
    },
  },
  {
    path: "/user/auctions",
    redirect: "/profile/auctions",
  },
  {
    path: "/wallet",
    name: "wallet-dashboard",
    component: () => import("@/modules/wallet/WalletDashboardView.vue"),
    meta: {
      title: "Collector Digital Wallet & Escrow Ledger | RLG Hobby Shop",
    },
  },
  {
    path: "/gacha",
    name: "gacha-vault",
    component: () => import("@/modules/gacha/GachaVaultView.vue"),
    meta: {
      title: "Gacha Mystery Oripa, Live Box Breaks & Pre-Orders | RLG Hobby Shop",
    },
  },
  {
    path: "/raffles",
    name: "raffle-arena",
    component: () => import("@/modules/raffles/RaffleArenaView.vue"),
    meta: {
      title: "100-Slot Grail Raffle Arena & Live Roulette | RLG Hobby Shop",
    },
  },
  {
    path: "/raffles/:id",
    name: "raffle-detail",
    component: () => import("@/modules/raffles/RaffleArenaView.vue"),
    meta: {
      title: "Live 10x10 Grail Raffle Board | RLG Hobby Shop",
    },
  },
  {
    path: "/gacha-oripa",
    redirect: "/gacha",
  },
  {
    path: "/user/wallet",
    redirect: "/profile/auctions",
  },
  {
    path: "/preorders",
    name: "preorders-drop-calendar",
    component: () => import("@/modules/preorders/PreordersView.vue"),
    meta: {
      title: "Pre-Order Drop Calendar & Allocations | RLG Hobby Shop",
    },
  },
  {
    path: "/live-breaks",
    name: "live-breaks",
    component: () => import("@/modules/live-breaks/LiveBreaksView.vue"),
    meta: {
      title: "Live Box Breaks & Stream Broadcast | RLG Hobby Shop",
    },
  },
  {
    path: "/breaks",
    redirect: "/live-breaks",
  },
  // --- Admin Portal Routes ---
  {
    path: "/admin/login",
    name: "admin-login",
    component: () => import("@/modules/admin/AdminLoginView.vue"),
    meta: {
      title: "Admin Staff Login | RLG Hobby Command Center",
      isAdmin: false,
    },
  },
  {
    path: "/admin",
    component: () => import("@/modules/admin/AdminLayout.vue"),
    redirect: "/admin/dashboard",
    meta: {
      isAdmin: true,
    },
    children: [
      {
        path: "dashboard",
        name: "admin-dashboard",
        component: () => import("@/modules/admin/views/AdminDashboardView.vue"),
        meta: { title: "Dashboard & Command Center | RLG Admin" },
      },
      {
        path: "orders",
        name: "admin-orders",
        component: () => import("@/modules/admin/views/AdminOrdersView.vue"),
        meta: { title: "Order Management & Fulfillment | RLG Admin" },
      },
      {
        path: "inventory",
        name: "admin-inventory",
        component: () => import("@/modules/admin/views/AdminInventoryView.vue"),
        meta: { title: "Inventory & Stock Control | RLG Admin" },
      },
      {
        path: "products",
        name: "admin-products",
        component: () =>
          import("@/modules/admin/views/AdminProductUploadView.vue"),
        meta: { title: "Product Catalog & Upload Module | RLG Admin" },
      },
      {
        path: "auctions",
        name: "admin-auctions",
        component: () =>
          import("@/modules/admin/views/AdminAuctionsView.vue"),
        meta: { title: "Auctions & Bidding Management | RLG Admin" },
      },
      {
        path: "wallet",
        name: "admin-wallet",
        component: () =>
          import("@/modules/admin/views/AdminWalletView.vue"),
        meta: { title: "Wallet Ledger & Top-Up Approvals | RLG Admin" },
      },
            {
        path: "live-breaks",
        name: "admin-live-breaks",
        component: () => import("@/modules/admin/views/AdminLiveBreaksView.vue"),
        meta: { title: "Live Breaks & Streaming Hub | RLG Admin" },
      },
      {
        path: "preorders",
        name: "admin-preorders",
        component: () => import("@/modules/admin/views/AdminPreordersView.vue"),
        meta: { title: "Pre-Order Drops & Allocation Hub | RLG Admin" },
      },
      {
        path: "gacha-raffles",
        name: "admin-gacha-raffles",
        component: () =>
          import("@/modules/admin/views/AdminGachaRafflesView.vue"),
        meta: { title: "Gacha Oripa & 100-Slot Raffles | RLG Admin" },
      },
      {
        path: "wallet-gacha",
        redirect: "/admin/wallet",
      },
      {
        path: "customers",
        name: "admin-customers",
        component: () => import("@/modules/admin/views/AdminCustomersView.vue"),
        meta: { title: "Customer Management CRM & Inbox | RLG Admin" },
      },
      {
        path: "marketing",
        name: "admin-marketing",
        component: () => import("@/modules/admin/views/AdminMarketingView.vue"),
        meta: { title: "Marketing, Promos & SEO | RLG Admin" },
      },
      {
        path: "pro-subscription",
        name: "admin-pro-subscription",
        component: () =>
          import("@/modules/admin/views/AdminProSubscriptionView.vue"),
        meta: { title: "Pro Subscription & VIP Drops | RLG Admin" },
      },
      {
        path: "cms",
        name: "admin-cms",
        component: () => import("@/modules/admin/views/AdminCmsView.vue"),
        meta: { title: "CMS & Storefront Pages | RLG Admin" },
      },
      {
        path: "analytics",
        name: "admin-analytics",
        component: () => import("@/modules/admin/views/AdminAnalyticsView.vue"),
        meta: { title: "Analytics & Financial Reporting | RLG Admin" },
      },
      {
        path: "mobile-tools",
        name: "admin-mobile-tools",
        component: () => import("@/Pages/Admin/MobileTools/Index.vue"),
        meta: { title: "Mobile Tools & Rapid-Fire Card Scanner | RLG Admin" },
      },
      {
        path: "audit-trail",
        name: "admin-audit-trail",
        component: () => import("@/modules/admin/views/AdminAuditTrailView.vue"),
        meta: { title: "Audit Trail & Security Logs | RLG Admin" },
      },
      {
        path: "settings",
        name: "admin-settings",
        component: () => import("@/modules/admin/views/AdminSettingsView.vue"),
        meta: { title: "Settings, RBAC & Gateways | RLG Admin" },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
