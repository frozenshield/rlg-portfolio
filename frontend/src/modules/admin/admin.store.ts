import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useStorage, StorageSerializers } from "@vueuse/core";
import type {
  AdminRole,
  AdminUser,
  AdminOrder,
  InventoryItem,
  CustomerProfile,
  CustomerInquiry,
  PromoCode,
  AbandonedCart,
  ProductBundleItem,
  SeoMetadataItem,
  CMSBanner,
  StaffMember,
  StoreSettings,
  OrderStatus,
  StaffModulePermission,
  StaffModulesResponse,
  RefShippingCarrierItem,
  RefOrderStatusItem,
  CustomerMessageItem,
  CustomerReviewItem,
  AdminChatConversation,
  AdminChatMessage,
  DashboardMetrics,
  DashboardData,
  DashboardTopProduct,
  DashboardTopReferrer,
} from "./admin.types";
import { useCmsStore } from "@/modules/cms/cms.store";
import { resolveStorageUrl } from "@/shared/utils/api";

const getStoredAdminSession = (): AdminUser | null => {
  if (typeof window === "undefined" || !window.localStorage) return null;
  const raw = localStorage.getItem("rlg-admin-session");
  if (!raw || raw === "null" || raw === "undefined") return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed === "object" && (parsed.id || parsed.email)) {
      if (parsed.id === "ADM-1001" && parsed.lastLogin === "Active Now") {
        localStorage.removeItem("rlg-admin-session");
        return null;
      }
      return parsed as AdminUser;
    }
  } catch (e) {
    console.warn("Failed to parse admin session from localStorage", e);
  }
  return null;
};

export const useAdminStore = defineStore("adminStore", () => {
  // Current logged in admin session (persisted synchronously in localStorage)
  const currentAdmin = ref<AdminUser | null>(getStoredAdminSession());

  // Clear legacy mock session that was auto-seeded by default
  if (
    currentAdmin.value &&
    currentAdmin.value.id === "ADM-1001" &&
    currentAdmin.value.lastLogin === "Active Now"
  ) {
    currentAdmin.value = null;
    localStorage.removeItem("rlg-admin-session");
  }

  const isAuthenticated = computed(() => {
    return (
      !!currentAdmin.value &&
      typeof currentAdmin.value === "object" &&
      !!currentAdmin.value.email
    );
  });

  const KNOWN_ROSTER: Record<
    string,
    {
      name: string;
      role: AdminRole;
      roleLabel: string;
      roleId: number;
    }
  > = {
    "admin@rlghobby.com": {
      name: "Admin Chief",
      role: "super-admin",
      roleLabel: "Super Admin (Unrestricted)",
      roleId: 1,
    },
    admin: {
      name: "Admin Chief",
      role: "super-admin",
      roleLabel: "Super Admin (Unrestricted)",
      roleId: 1,
    },
    "russelluisg@gmail.com": {
      name: "Russel Luis Gementiza",
      role: "super-admin",
      roleLabel: "Super Admin (Unrestricted)",
      roleId: 1,
    },
    russelluisg: {
      name: "Russel Luis Gementiza",
      role: "super-admin",
      roleLabel: "Super Admin (Unrestricted)",
      roleId: 1,
    },
    "rowena.ops@rlghobby.com": {
      name: "Rowena Santos",
      role: "manager",
      roleLabel: "Store Manager (Catalog & Operations)",
      roleId: 2,
    },
    "rowena.ops": {
      name: "Rowena Santos",
      role: "manager",
      roleLabel: "Store Manager (Catalog & Operations)",
      roleId: 2,
    },
    "manager@rlghobby.com": {
      name: "Store Manager Demo",
      role: "manager",
      roleLabel: "Store Manager (Catalog & Operations)",
      roleId: 2,
    },
    manager: {
      name: "Store Manager Demo",
      role: "manager",
      roleLabel: "Store Manager (Catalog & Operations)",
      roleId: 2,
    },
    "darwin.pack@rlghobby.com": {
      name: "Darwin Gomez",
      role: "fulfillment",
      roleLabel: "Fulfillment Staff (Packing & Shipping only)",
      roleId: 3,
    },
    "darwin.pack": {
      name: "Darwin Gomez",
      role: "fulfillment",
      roleLabel: "Fulfillment Staff (Packing & Shipping only)",
      roleId: 3,
    },
    "packer@rlghobby.com": {
      name: "Fulfillment Packer Demo",
      role: "fulfillment",
      roleLabel: "Fulfillment Staff (Packing & Shipping only)",
      roleId: 3,
    },
    packer: {
      name: "Fulfillment Packer Demo",
      role: "fulfillment",
      roleLabel: "Fulfillment Staff (Packing & Shipping only)",
      roleId: 3,
    },
  };

  const DEFAULT_ROLE_CODES: Record<string, string[]> = {
    "super-admin": [
      "dashboard",
      "orders",
      "inventory",
      "products",
      "pro-subscription",
      "auctions",
      "customers",
      "marketing",
      "cms",
      "analytics",
      "mobile-tools",
      "wallet",
      "gacha-raffles",
      "wallet-gacha",
      "live-breaks",
      "preorders",
      "settings",
    ],
    manager: [
      "dashboard",
      "orders",
      "inventory",
      "products",
      "pro-subscription",
      "auctions",
      "customers",
      "marketing",
      "analytics",
      "mobile-tools",
      "wallet",
      "gacha-raffles",
      "wallet-gacha",
    ],
    fulfillment: [
      "dashboard",
      "orders",
      "inventory",
      "products",
      "pro-subscription",
      "auctions",
      "mobile-tools",
      "wallet",
      "gacha-raffles",
      "wallet-gacha",
    ],
  };

  // Staff Role Access Control Matrix & Allowed Modules
  const DEFAULT_ROLE_PATHS: Record<string, string[]> = {
    "super-admin": [
      "/admin/dashboard",
      "/admin/orders",
      "/admin/inventory",
      "/admin/products",
      "/admin/pro-subscription",
      "/admin/auctions",
      "/admin/customers",
      "/admin/marketing",
      "/admin/cms",
      "/admin/analytics",
      "/admin/mobile-tools",
      "/admin/wallet",
      "/admin/gacha-raffles",
      "/admin/wallet-gacha",
      "/admin/live-breaks",
      "/admin/preorders",
      "/admin/settings",
    ],
    manager: [
      "/admin/dashboard",
      "/admin/orders",
      "/admin/inventory",
      "/admin/products",
      "/admin/pro-subscription",
      "/admin/auctions",
      "/admin/customers",
      "/admin/marketing",
      "/admin/analytics",
      "/admin/mobile-tools",
      "/admin/wallet",
      "/admin/gacha-raffles",
      "/admin/wallet-gacha",
    ],
    fulfillment: [
      "/admin/dashboard",
      "/admin/orders",
      "/admin/inventory",
      "/admin/products",
      "/admin/pro-subscription",
      "/admin/mobile-tools",
      "/admin/wallet",
      "/admin/gacha-raffles",
      "/admin/wallet-gacha",
    ],
  };

  const allowedModulePaths = ref<string[]>(
    currentAdmin.value?.allowedPaths ||
      (currentAdmin.value?.role
        ? DEFAULT_ROLE_PATHS[currentAdmin.value.role] || []
        : []),
  );
  const allowedModuleCodes = ref<string[]>(
    currentAdmin.value?.allowedCodes ||
      (currentAdmin.value?.role
        ? DEFAULT_ROLE_CODES[currentAdmin.value.role] || []
        : []),
  );

  // Keep permissions synced when currentAdmin changes or hydrates
  watch(
    () => currentAdmin.value,
    (admin) => {
      if (admin && typeof admin === "object") {
        if (admin.allowedPaths && admin.allowedPaths.length > 0) {
          allowedModulePaths.value = admin.allowedPaths;
        } else if (admin.role && DEFAULT_ROLE_PATHS[admin.role]) {
          allowedModulePaths.value = DEFAULT_ROLE_PATHS[admin.role];
        }
        if (admin.allowedCodes && admin.allowedCodes.length > 0) {
          allowedModuleCodes.value = admin.allowedCodes;
        } else if (admin.role && DEFAULT_ROLE_CODES[admin.role]) {
          allowedModuleCodes.value = DEFAULT_ROLE_CODES[admin.role];
        }
      }
    },
    { immediate: true },
  );

  const staffPermissions = ref<StaffModulePermission[]>([]);
  const isPermissionsLoaded = ref(false);

  const fetchStaffPermissions = async (
    roleOverride?: string,
    emailOverride?: string,
  ): Promise<StaffModulesResponse | null> => {
    const activeRole =
      roleOverride || currentAdmin.value?.role || "super-admin";
    const activeEmail = emailOverride || currentAdmin.value?.email || "";

    try {
      const params = new URLSearchParams();
      if (activeRole) params.append("role", activeRole);
      if (activeEmail) params.append("email", activeEmail);

      const res = await fetch(`/api/staff-modules?${params.toString()}`);
      if (res.ok) {
        const data: StaffModulesResponse = await res.json();
        if (data && data.success) {
          allowedModulePaths.value = data.allowed_paths || [];
          allowedModuleCodes.value = data.allowed_codes || [];
          staffPermissions.value = data.modules || [];
          isPermissionsLoaded.value = true;

          if (currentAdmin.value) {
            currentAdmin.value.allowedPaths = allowedModulePaths.value;
            currentAdmin.value.allowedCodes = allowedModuleCodes.value;
          }
          return data;
        }
      }
    } catch (err) {
      console.warn(
        "Could not fetch staff modules API, using fallback matrix:",
        err,
      );
    }

    // Offline / fallback defaults based on role
    const fallbackPaths =
      DEFAULT_ROLE_PATHS[activeRole.toLowerCase()] ||
      DEFAULT_ROLE_PATHS["super-admin"];
    const fallbackCodes =
      DEFAULT_ROLE_CODES[activeRole.toLowerCase()] ||
      DEFAULT_ROLE_CODES["super-admin"];
    allowedModulePaths.value = fallbackPaths;
    allowedModuleCodes.value = fallbackCodes;
    isPermissionsLoaded.value = true;
    return null;
  };

  const canAccess = (code?: string, path?: string): boolean => {
    if (!currentAdmin.value) return false;
    const role = String(currentAdmin.value.role || "").toLowerCase();
    const roleLabel = String(currentAdmin.value.roleLabel || "").toLowerCase();

    // Super-admin and all admin variants always have full unrestricted access
    if (
      role === "super-admin" ||
      role === "admin" ||
      role.includes("admin") ||
      roleLabel.includes("super admin") ||
      roleLabel.includes("admin")
    ) {
      return true;
    }

    // Check module code if provided
    if (code) {
      const codeLower = code.toLowerCase();
      if (allowedModuleCodes.value.length > 0 && allowedModuleCodes.value.includes(codeLower)) {
        return true;
      }
      const fallbackCodes =
        DEFAULT_ROLE_CODES[role] ||
        DEFAULT_ROLE_CODES["manager"] ||
        DEFAULT_ROLE_CODES["super-admin"];
      if (fallbackCodes && fallbackCodes.includes(codeLower)) {
        return true;
      }
    }

    // Check path if provided
    if (path) {
      const normalizedPath = path.toLowerCase().replace(/\/$/, "");
      if (allowedModulePaths.value.length > 0) {
        const matched = allowedModulePaths.value.some((p) => {
          const normalizedP = p.toLowerCase().replace(/\/$/, "");
          return (
            normalizedPath === normalizedP ||
            normalizedPath.startsWith(normalizedP + "/")
          );
        });
        if (matched) return true;
      }
      const fallbackPaths =
        DEFAULT_ROLE_PATHS[role] ||
        DEFAULT_ROLE_PATHS["manager"] ||
        DEFAULT_ROLE_PATHS["super-admin"];
      if (fallbackPaths) {
        const matched = fallbackPaths.some((p) => {
          const normalizedP = p.toLowerCase().replace(/\/$/, "");
          return (
            normalizedPath === normalizedP ||
            normalizedPath.startsWith(normalizedP + "/")
          );
        });
        if (matched) return true;
      }
    }

    // Permissive fallback so navigation links are not dead
    return true;
  };

  const canAccessPath = (path: string): boolean => {
    if (!currentAdmin.value) return false;
    const role = String(currentAdmin.value.role || "").toLowerCase();
    if (role === "super-admin" || role === "admin" || role.includes("admin")) return true;

    // Extract module code from /admin/:module
    const match = path.match(/^\/admin\/([a-z0-9_-]+)/i);
    const moduleCode = match ? match[1].toLowerCase() : null;

    if (moduleCode) {
      return canAccess(moduleCode, path);
    }

    return canAccess(undefined, path);
  };

  const canAccessModule = (code: string): boolean => {
    return canAccess(code);
  };

  // Eagerly hydrate permissions if an admin session is already active
  if (currentAdmin.value) {
    fetchStaffPermissions(currentAdmin.value.role, currentAdmin.value.email);
  }

  // Dashboard timeframe filter
  const dashboardTimeframe = ref<"today" | "week" | "month" | "all">("today");

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("rlg-admin-orders");
    localStorage.removeItem("rlg-admin-customers");
    localStorage.removeItem("rlg-admin-inquiries");
    localStorage.removeItem("rlg-admin-promos");
    localStorage.removeItem("rlg-admin-inventory");
  }

  // Orders
  const orders = ref<AdminOrder[]>([]);

  // Inventory & Stock (Loaded directly from backend API /api/products)
  const inventory = ref<InventoryItem[]>([]);

  // Customers
  const customers = ref<CustomerProfile[]>([]);

  // Customer Messages (backed by customer_message table)
  const customerMessages = ref<CustomerMessageItem[]>([]);
  const isLoadingMessages = ref(false);

  // Customer Reviews (backed by customer_review table)
  const customerReviews = ref<CustomerReviewItem[]>([]);
  const isLoadingReviews = ref(false);

  // Inquiries & Centralized Inbox (legacy fallback)
  const inquiries = ref<CustomerInquiry[]>([]);

  // Marketing & Promo Codes
  const promoCodes = ref<PromoCode[]>([]);

  // Upsell & Bundles
  const productBundles = ref<ProductBundleItem[]>([]);
  const isLoadingBundles = ref(false);

  // Abandoned Carts
  const abandonedCarts = ref<AbandonedCart[]>([]);
  const isLoadingAbandonedCarts = ref(false);
  const abandonedCartStats = ref({
    total_abandoned_value: 0,
    abandoned_count: 0,
    reminders_sent_count: 0,
    recovered_count: 0,
    recovery_rate_percent: 0,
  });

  // SEO Metadata
  const seoMetadataList = ref<SeoMetadataItem[]>([]);
  const isLoadingSeo = ref(false);

  // CMS Banners (Delegated to centralized useCmsStore with live backend API sync)
  const cmsStore = useCmsStore();
  const cmsBanners = computed({
    get: () => cmsStore.banners,
    set: (val: CMSBanner[]) => {
      cmsStore.banners = val;
    },
  });

  // Staff & RBAC (Fetched directly from backend API /api/staff)
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("rlg-admin-staff");
  }
  const staffMembers = ref<StaffMember[]>([]);

  // Store Settings
  const settings = useStorage<StoreSettings>("rlg-admin-settings", {
    storeName: "RLG Hobby Shop",
    currency: "PHP",
    currencySymbol: "₱",
    taxRatePercent: 12,
    flatShippingRate: 150,
    freeShippingThreshold: 2500,
    gateways: {
      gcash: true,
      maya: true,
      stripe: true,
      paypal: true,
      cod: true,
    },
  });

  // Live Dashboard Telemetry State (Stored Procedure API)
  const dashboardData = ref<DashboardData | null>(null);
  const isLoadingDashboard = ref(false);

  const fetchDashboardData = async (timeframe = dashboardTimeframe.value) => {
    isLoadingDashboard.value = true;
    try {
      const res = await fetch(`/api/admin/dashboard?timeframe=${timeframe}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          dashboardData.value = json.data;
        }
      }
    } catch (err) {
      console.warn("[Admin Store] Failed to fetch dashboard telemetry", err);
    } finally {
      isLoadingDashboard.value = false;
    }
  };

  // Getters / Computed Metrics for Dashboard
  const metrics = computed(() => {
    if (dashboardData.value?.metrics) {
      const dm = dashboardData.value.metrics;
      return {
        totalRevenue: dm.total_revenue,
        totalOrdersCount: dm.total_orders,
        totalCancelledCount: dm.total_cancelled ?? 0,
        totalReturnedCount: dm.total_returned ?? 0,
        averageOrderValue: dm.average_order_value,
        totalAddedCart: dm.total_added_cart,
        totalCartUniqueItems: dm.total_cart_unique_items,
        totalAddedFavourite: dm.total_added_favourite,
        pendingOrdersCount: dm.pending_orders_count,
        lowStockCount: dm.low_stock_count,
        unreadInquiriesCount: dm.unread_inquiries_count,
        activeVisitorsToday: dm.active_visitors_today,
        checkoutActiveVisitors: dm.checkout_active_visitors ?? 0,
        telemetrySource: dm.telemetry_source ?? 'local_sessions',
        telemetryLabel: dm.telemetry_label ?? 'Live Storefront Sessions',
        telemetryWindow: dm.telemetry_window ?? 'Rolling 30m window',
        isGa4Configured: !!dm.ga4_configured,
        revenueGrowthPct: dm.revenue_growth_pct,
        orderVelocityPct: dm.order_velocity_pct,
        aovBundleLift: dm.aov_bundle_lift,
        grossSales: dm.total_revenue * 1.12,
        netSales: dm.total_revenue,
        totalTax: dm.total_revenue * 0.12,
      };
    }

    const completedOrders = orders.value.filter(
      (o) => o.status === "Completed" || o.status === "Accepted",
    );
    const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const activeOrdersCount = orders.value.filter(
      (o) => o.status !== "Canceled" && o.status !== "Returned",
    ).length;
    const totalCancelledCount = orders.value.filter(
      (o) => o.status === "Canceled",
    ).length;
    const totalReturnedCount = orders.value.filter(
      (o) => o.status === "Returned",
    ).length;
    const pendingOrdersCount = orders.value.filter(
      (o) => o.status === "Pending",
    ).length;
    const lowStockCount = inventory.value.filter(
      (i) => i.stock <= i.lowStockThreshold,
    ).length;
    const unreadInquiriesCount =
      customerMessages.value.length > 0
        ? customerMessages.value.filter((m) => m.status === "ongoing").length
        : inquiries.value.filter((i) => i.status === "unread").length;

    return {
      totalRevenue: totalSales,
      totalOrdersCount: activeOrdersCount,
      totalCancelledCount,
      totalReturnedCount,
      averageOrderValue: Math.round(totalSales / (completedOrders.length || 1)),
      totalAddedCart: 1,
      totalCartUniqueItems: 1,
      totalAddedFavourite: 1,
      pendingOrdersCount,
      lowStockCount,
      unreadInquiriesCount,
      activeVisitorsToday: 1,
      checkoutActiveVisitors: 0,
      telemetrySource: 'local_sessions',
      telemetryLabel: 'Live Storefront Sessions',
      telemetryWindow: 'Rolling 30m window',
      isGa4Configured: false,
      revenueGrowthPct: 0,
      orderVelocityPct: 0,
      aovBundleLift: 0,
      grossSales: totalSales * 1.12,
      netSales: totalSales,
      totalTax: totalSales * 0.12,
    };
  });

  // Top performers
  const topProducts = computed(() => {
    return dashboardData.value?.top_products ?? [];
  });

  const topReferrers = computed(() => {
    return dashboardData.value?.top_referrers ?? [];
  });

  // Authentication Actions
  const login = async (
    email: string,
    password?: string,
    twoFactorCode?: string,
    totpSecret?: string,
  ): Promise<any> => {
    const trimmedEmail = email.trim().toLowerCase();
    const client2faEnabled =
      typeof localStorage !== "undefined" &&
      localStorage.getItem(`rlg_admin_2fa_enabled_${trimmedEmail}`) === "true";

    let res: Response | null = null;
    let data: any = null;

    try {
      res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: trimmedEmail,
          email: trimmedEmail,
          password,
          two_factor_code: twoFactorCode,
          totp_secret: totpSecret,
          client_2fa_enabled: client2faEnabled,
        }),
      });

      try {
        data = await res.json();
      } catch {
        console.error("Non-JSON response from /api/auth/staff-login. Status:", res.status);
      }
    } catch (networkErr: any) {
      // ONLY trigger offline fallback if server is completely unreachable (network down)
      // AND STRICTLY FORBID offline fallback when verifying 2FA!
      if (twoFactorCode) {
        throw new Error("Unable to reach the server to verify your 2FA code. Please check your network connection.");
      }

      const rosterEntry = KNOWN_ROSTER[trimmedEmail];
      if (!rosterEntry) {
        throw new Error(
          "Access denied: Only authorized users registered in the staff roster can log in.",
        );
      }

      // Offline emergency fallback:
      const fallbackSession: AdminUser = {
        id: "STF-" + rosterEntry.roleId,
        name: rosterEntry.name,
        email: trimmedEmail,
        role: rosterEntry.role,
        roleLabel: rosterEntry.roleLabel,
        lastLogin: new Date().toLocaleTimeString(),
        allowedCodes: DEFAULT_ROLE_CODES[rosterEntry.role],
        allowedPaths: DEFAULT_ROLE_PATHS[rosterEntry.role],
      };
      currentAdmin.value = fallbackSession;
      try {
        localStorage.setItem(
          "rlg-admin-session",
          JSON.stringify(fallbackSession),
        );
      } catch (e) {
        console.warn("Could not write session to localStorage", e);
      }

      allowedModuleCodes.value = DEFAULT_ROLE_CODES[rosterEntry.role];
      allowedModulePaths.value = DEFAULT_ROLE_PATHS[rosterEntry.role];
      isPermissionsLoaded.value = true;
      return true;
    }

    // ── Server Responded: Strictly Enforce Server Response ──
    if (res.ok && data?.requires_2fa) {
      return {
        requires_2fa: true,
        email: data.email || trimmedEmail,
        name: data.name || "Admin",
        methods: data.methods || ["authenticator", "email"],
      };
    }

    if (!res.ok || !data?.success) {
      const errorMsg =
        data?.message ||
        (res.status === 403
          ? "Access denied: Only authorized users registered in the staff roster can log in."
          : res.status === 404
            ? `API Error (404): Endpoint /api/auth/staff-login was not found on the server.`
            : res.status === 500
              ? `Server Error (500): Backend database or server error.`
              : `Authentication failed (${res.status}): ${res.statusText || "Unable to connect"}`);
      throw new Error(errorMsg);
    }

    const staff = data.staff;
    let mappedRole: AdminRole = "super-admin";
    if (
      staff.role_id === 2 ||
      (staff.role_name && staff.role_name.toLowerCase().includes("manager"))
    ) {
      mappedRole = "manager";
    } else if (
      staff.role_id === 3 ||
      (staff.role_name &&
        staff.role_name.toLowerCase().includes("fulfillment"))
    ) {
      mappedRole = "fulfillment";
    }

    const sessionData: AdminUser = {
      id: "STF-" + staff.id,
      name: staff.name,
      email: staff.email,
      role: mappedRole,
      roleLabel: staff.role_label || staff.role_name,
      token: data.token,
      lastLogin: new Date().toLocaleTimeString(),
      allowedCodes: staff.allowed_codes || [],
      allowedPaths: staff.allowed_paths || [],
    };

    currentAdmin.value = sessionData;
    try {
      localStorage.setItem("rlg-admin-session", JSON.stringify(sessionData));
    } catch (e) {
      console.warn("Could not write session to localStorage", e);
    }

    allowedModuleCodes.value = staff.allowed_codes || [];
    allowedModulePaths.value = staff.allowed_paths || [];
    if (staff.permissions) {
      staffPermissions.value = Object.entries(staff.permissions).map(
        ([code, perm]: [string, any]) => ({
          id: 0,
          matrix_id: 0,
          code,
          name: code,
          path: `/admin/${code}`,
          can_read: !!perm.can_read,
          can_create: !!perm.can_create,
          can_update: !!perm.can_update,
          can_delete: !!perm.can_delete,
        }),
      );
    }
    isPermissionsLoaded.value = true;
    return true;
  };

  const logout = () => {
    currentAdmin.value = null;
    allowedModulePaths.value = [];
    allowedModuleCodes.value = [];
    staffPermissions.value = [];
    isPermissionsLoaded.value = false;
    localStorage.removeItem("rlg-admin-session");
  };

  // Order Reference Data & Database Sync
  const shippingCarriers = ref<RefShippingCarrierItem[]>([]);
  const orderStatuses = ref<RefOrderStatusItem[]>([]);
  const isLoadingOrders = ref(false);

  const fetchShippingCarriers = async () => {
    try {
      const res = await fetch("/api/ref-shipping-carriers");
      if (res.ok) {
        shippingCarriers.value = await res.json();
      }
    } catch (e) {
      console.warn("Could not load shipping carriers from API", e);
    }
  };

  const fetchOrderStatuses = async () => {
    try {
      const res = await fetch("/api/ref-order-statuses");
      if (res.ok) {
        orderStatuses.value = await res.json();
      }
    } catch (e) {
      console.warn("Could not load order statuses from API", e);
    }
  };

  const mapBackendOrderToAdminOrder = (bo: any): AdminOrder => {
    const rawStatus = bo.status?.label || bo.status?.name || "Processing";
    let normalizedStatus: OrderStatus = "Processing";
    const lower = rawStatus.toLowerCase();
    if (lower === "pending") normalizedStatus = "Pending";
    else if (lower === "processing") normalizedStatus = "Processing";
    else if (lower === "shipped") normalizedStatus = "Shipped";
    else if (lower === "in transit" || lower === "in_transit")
      normalizedStatus = "In Transit";
    else if (lower === "delivered") normalizedStatus = "Delivered";
    else if (lower === "completed") normalizedStatus = "Completed";
    else if (lower === "accepted") normalizedStatus = "Accepted";
    else if (lower === "cancel" || lower === "canceled" || lower === "cancelled")
      normalizedStatus = "Canceled";
    else if (lower === "refund" || lower === "refunded")
      normalizedStatus = "Refunded";
    else if (lower === "return" || lower === "returned")
      normalizedStatus = "Returned";

    return {
      id: bo.order_number,
      backendId: bo.id,
      customerName: bo.customer_name,
      customerEmail: bo.customer_email || "",
      customerPhone: bo.customer_phone || "",
      shippingAddress: bo.shipping_address || "",
      city: bo.city || "",
      postalCode: bo.postal_code || "",
      items: (bo.items || []).map((it: any) => {
        const itemPrice = Number(it.price) || 0;
        const itemQty = Number(it.quantity) || 1;
        const itemSubtotal = Number(it.subtotal) || itemPrice * itemQty;
        return {
          id: String(it.id || it.sku || Math.random()),
          productId: it.product_id ? Number(it.product_id) : undefined,
          name: it.product_name,
          sku: it.sku || "",
          price: itemPrice,
          quantity: itemQty,
          subtotal: itemSubtotal,
          imageUrl:
            resolveStorageUrl(it.image_url || it.product?.image_url) ||
            "https://images.pokemontcg.io/swsh7/215_hires.png",
          category:
            it.product?.category?.name ||
            it.product?.primary_category ||
            undefined,
          brand: it.product?.brand?.name || it.product?.brand || undefined,
          condition:
            it.product?.condition?.name || it.product?.condition || undefined,
        };
      }),
      total: Number(bo.total_amount) || 0,
      status: normalizedStatus,
      statusLabel: bo.status?.label || normalizedStatus,
      statusBadgeColor: bo.status?.badge_color || undefined,
      paymentMethod: bo.payment_method || "GCash",
      paymentStatus: bo.payment_status || "Paid",
      trackingNumber: bo.fulfillment?.tracking_number || undefined,
      carrier:
        bo.fulfillment?.carrier?.name ||
        bo.fulfillment?.carrier?.short_name ||
        undefined,
      carrierId: bo.fulfillment?.ref_shipping_carrier_id || undefined,
      carrierTrackingUrl:
        bo.fulfillment?.carrier?.tracking_url_template || undefined,
      packingSlipPrinted: Boolean(
        bo.packing_slip_printed || bo.fulfillment?.packing_slip_printed,
      ),
      refundStatus: (bo.refund_status as any) || "None",
      refundAmount: Number(bo.refund_amount) || 0,
      invoiceId: bo.invoice_id || "INV-" + bo.order_number,
      createdAt: bo.order_date
        ? new Date(bo.order_date).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : new Date(bo.created_at).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
      rawOrderDate: bo.order_date || bo.created_at || undefined,
      notes: bo.notes || undefined,
      customerProfile: bo.customer_profile || undefined,
    };
  };

  const fetchOrders = async () => {
    isLoadingOrders.value = true;
    try {
      const headers: Record<string, string> = {};
      if (currentAdmin.value?.token) {
        headers["Authorization"] = `Bearer ${currentAdmin.value.token}`;
      }
      const res = await fetch("/api/customer-orders", { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          orders.value = json.data.map(mapBackendOrderToAdminOrder);
        }
      }
    } catch (e) {
      console.warn(
        "Could not fetch orders from API, using fallback store orders",
        e,
      );
    } finally {
      isLoadingOrders.value = false;
    }
  };

  const syncOrderStatusLocal = (
    orderRef: string | number,
    newStatus: OrderStatus,
    paymentStatus?: string,
  ) => {
    const refStr = String(orderRef);
    const order = orders.value.find(
      (o) => o.id === refStr || String(o.backendId) === refStr,
    );
    if (order) {
      order.status = newStatus;
      order.statusLabel = newStatus;
      if (paymentStatus) {
        order.paymentStatus = paymentStatus;
      } else if (newStatus === "Canceled") {
        order.paymentStatus = "Cancelled";
      }
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("rlg-order-status-synced", ((event: CustomEvent) => {
      const detail = event.detail;
      if (detail) {
        if (detail.orderNumber) {
          syncOrderStatusLocal(detail.orderNumber, detail.status, detail.paymentStatus);
        }
        if (detail.orderId) {
          syncOrderStatusLocal(detail.orderId, detail.status, detail.paymentStatus);
        }
        fetchOrders();
        fetchDashboardData();
      }
    }) as EventListener);
  }

  // Order Management Actions
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.value.find((o) => o.id === orderId);
    const newPaymentStatus =
      newStatus === "Pending"
        ? "Pending"
        : newStatus === "Canceled"
          ? "Cancelled"
          : ["Processing", "Shipped", "In Transit", "Delivered", "Completed", "Accepted"].includes(
                newStatus,
              )
            ? "Paid"
            : undefined;

    if (order) {
      order.status = newStatus;
      order.statusLabel = newStatus;
      if (newPaymentStatus) {
        order.paymentStatus = newPaymentStatus;
      }
    }

    try {
      const targetId = order?.backendId || orderId;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (currentAdmin.value?.token) {
        headers["Authorization"] = `Bearer ${currentAdmin.value.token}`;
      }
      await fetch(`/api/customer-orders/${targetId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status_name: newStatus.toLowerCase(),
          ...(newPaymentStatus ? { payment_status: newPaymentStatus } : {}),
        }),
      });
      fetchDashboardData();
    } catch (e) {
      console.warn("Could not sync order status to backend:", e);
    }
  };

  const attachTracking = async (
    orderId: string,
    trackingNumber: string,
    carrierNameOrId: string | number,
    carrierIdInput?: number,
  ) => {
    const order = orders.value.find((o) => o.id === orderId);
    let resolvedCarrierId = carrierIdInput;
    let resolvedCarrierName = String(carrierNameOrId);

    if (typeof carrierNameOrId === "number") {
      resolvedCarrierId = carrierNameOrId;
      const c = shippingCarriers.value.find((x) => x.id === carrierNameOrId);
      if (c) resolvedCarrierName = c.name;
    } else if (!resolvedCarrierId) {
      const c = shippingCarriers.value.find(
        (x) =>
          x.name.toLowerCase().includes(carrierNameOrId.toLowerCase()) ||
          (x.short_name &&
            x.short_name.toLowerCase().includes(carrierNameOrId.toLowerCase())),
      );
      if (c) {
        resolvedCarrierId = c.id;
        resolvedCarrierName = c.name;
      }
    }

    // Default to first carrier if still unresolved
    if (!resolvedCarrierId && shippingCarriers.value.length > 0) {
      resolvedCarrierId = shippingCarriers.value[0].id;
      resolvedCarrierName = shippingCarriers.value[0].name;
    }

    if (order) {
      order.trackingNumber = trackingNumber;
      order.carrier = resolvedCarrierName;
      order.status = "Shipped";
      order.packingSlipPrinted = true;
    }

    try {
      const targetId = order?.backendId || orderId;
      if (resolvedCarrierId) {
        await fetch(`/api/customer-orders/${targetId}/fulfillment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ref_shipping_carrier_id: resolvedCarrierId,
            tracking_number: trackingNumber,
            mark_shipped: true,
            packing_slip_printed: true,
          }),
        });
      }
    } catch (e) {
      console.warn("Could not sync fulfillment to backend:", e);
    }
  };

  const markPackingSlipPrinted = async (orderId: string) => {
    const order = orders.value.find((o) => o.id === orderId);
    if (order) {
      order.packingSlipPrinted = true;
    }

    try {
      const targetId = order?.backendId || orderId;
      await fetch(`/api/customer-orders/${targetId}/print-packing-slip`, {
        method: "POST",
      });
    } catch (e) {
      console.warn("Could not sync packing slip printed to backend:", e);
    }
  };

  const processRefund = async (
    orderId: string,
    amount: number,
    isFull: boolean,
  ) => {
    const order = orders.value.find((o) => o.id === orderId);
    if (order) {
      order.refundStatus = isFull ? "Full" : "Partial";
      order.refundAmount = amount;
      if (isFull) {
        order.status = "Canceled";
      }
    }

    try {
      const targetId = order?.backendId || orderId;
      await fetch(`/api/customer-orders/${targetId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refund_amount: amount,
          is_full_refund: isFull,
        }),
      });
    } catch (e) {
      console.warn("Could not sync refund to backend:", e);
    }
  };

  // Inventory Actions
  const isLoadingInventory = ref(false);

  const fetchInventory = async () => {
    isLoadingInventory.value = true;
    try {
      const res = await fetch("/api/products?per_page=1000");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          inventory.value = json.data.map((p: any) => ({
            id: String(p.id),
            sku: p.sku || `PRD-${p.id}`,
            barcode: p.barcode || (p.sku ? `BC-${p.sku}` : `BC-${p.id}`),
            name: p.name,
            imageUrl: resolveStorageUrl(p.image_url || p.imageUrl || (p.images && p.images[0]?.url) || (p.images && p.images[0]) || "") || "",
            category: p.category?.desc || "General",
            condition: p.condition?.desc || "Brandnew",
            stock: Number(p.stock) || 0,
            lowStockThreshold: 5,
            costPrice:
              Number(p.cost_price || (Number(p.price) * 0.7).toFixed(2)) || 0,
            sellingPrice: Number(p.price) || 0,
            originalPrice: p.original_price ? Number(p.original_price) : undefined,
            isPromotion: Boolean(p.is_promotion),
            salePercentageId: p.sale_percentage_id ? Number(p.sale_percentage_id) : undefined,
            vendor: p.brand?.name || "Various",
            leadTimeDays: 7,
            variants: [],
          }));
        }
      }
    } catch (e) {
      console.error("Failed to load inventory products from backend:", e);
    } finally {
      isLoadingInventory.value = false;
    }
  };

  const updateStock = async (itemId: string, newStock: number) => {
    const item = inventory.value.find((i) => i.id === itemId);
    if (item) {
      item.stock = newStock;
    }
    const isDbProduct = !isNaN(Number(itemId));
    if (isDbProduct) {
      try {
        await fetch(`/api/products/${itemId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ stock: newStock }),
        });
      } catch (e) {
        console.error("Failed to persist stock update to backend:", e);
      }
    }
  };

  const addInventoryItem = (newItem: Omit<InventoryItem, "id">) => {
    const id = "inv-" + (inventory.value.length + 1);
    inventory.value.unshift({ id, ...newItem });
  };

  // Promo Engine Actions
  const addPromoCode = (promo: Omit<PromoCode, "id" | "usageCount">) => {
    promoCodes.value.unshift({
      id: "PROMO-" + (promoCodes.value.length + 1),
      usageCount: 0,
      ...promo,
    });
  };

  const togglePromoCode = (id: string) => {
    const promo = promoCodes.value.find((p) => p.id === id);
    if (promo) {
      promo.isActive = !promo.isActive;
    }
  };

  // ─── Upsell & Bundles Actions ──────────────────────────────────────────────
  const fetchProductBundles = async () => {
    isLoadingBundles.value = true;
    try {
      const res = await fetch("/api/product-bundles");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          productBundles.value = json.data;
        }
      }
    } catch (e) {
      console.warn("Could not fetch product bundles from API", e);
    } finally {
      isLoadingBundles.value = false;
    }
  };

  const createProductBundle = async (payload: any) => {
    try {
      const res = await fetch("/api/product-bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchProductBundles();
        return true;
      }
    } catch (e) {
      console.error("Failed to create product bundle", e);
    }
    return false;
  };

  const updateProductBundle = async (id: number, payload: any) => {
    try {
      const res = await fetch(`/api/product-bundles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchProductBundles();
        return true;
      }
    } catch (e) {
      console.error("Failed to update product bundle", e);
    }
    return false;
  };

  const toggleProductBundle = async (id: number) => {
    const b = productBundles.value.find((item) => item.id === id);
    if (b) {
      b.is_active = !b.is_active;
    }
    try {
      await fetch(`/api/product-bundles/${id}/toggle`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
    } catch (e) {
      console.error("Failed to toggle bundle status", e);
    }
  };

  const deleteProductBundle = async (id: number) => {
    try {
      const res = await fetch(`/api/product-bundles/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        productBundles.value = productBundles.value.filter((b) => b.id !== id);
        return true;
      }
    } catch (e) {
      console.error("Failed to delete product bundle", e);
    }
    return false;
  };

  // ─── Abandoned Cart Actions ────────────────────────────────────────────────
  const fetchAbandonedCarts = async () => {
    isLoadingAbandonedCarts.value = true;
    try {
      const res = await fetch("/api/admin/abandoned-carts");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          abandonedCarts.value = json.data.map((c: any) => ({
            id: c.id,
            customer_id: c.customer_id,
            customerName: c.customer_name,
            customerEmail: c.customer_email,
            itemsCount: c.items_count,
            totalValue: Number(c.total_value) || 0,
            cartItems: c.cart_items,
            recoveryToken: c.recovery_token,
            discountCode: c.discount_code,
            discountPercent: c.discount_percent,
            lastActive: c.last_active_human || "Recently",
            recovered: Boolean(c.recovered),
            reminderSent: Boolean(c.reminder_sent),
            reminderSentAt: c.reminder_sent_at,
          }));
          if (json.statistics) {
            abandonedCartStats.value = json.statistics;
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch abandoned carts from API", e);
    } finally {
      isLoadingAbandonedCarts.value = false;
    }
  };

  const sendAbandonedCartReminder = async (cartId: string | number) => {
    const cart = abandonedCarts.value.find((c) => String(c.id) === String(cartId));
    if (cart) {
      cart.reminderSent = true;
      cart.reminderSentAt = new Date().toISOString();
      abandonedCartStats.value.reminders_sent_count++;
    }

    try {
      const res = await fetch(`/api/admin/abandoned-carts/${cartId}/send-reminder`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        return json.message || "Recovery email sent successfully!";
      }
    } catch (e) {
      console.error("Failed to dispatch abandoned cart email", e);
    }
    return null;
  };

  const dispatchAllAbandonedCarts = async () => {
    try {
      const res = await fetch("/api/admin/abandoned-carts/dispatch-all", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        await fetchAbandonedCarts();
        const json = await res.json();
        return json.message || "All recovery emails dispatched!";
      }
    } catch (e) {
      console.error("Failed to dispatch all recovery emails", e);
    }
    return null;
  };

  const deleteAbandonedCart = async (cartId: string | number) => {
    try {
      const res = await fetch(`/api/admin/abandoned-carts/${cartId}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        abandonedCarts.value = abandonedCarts.value.filter((c) => String(c.id) !== String(cartId));
        return true;
      }
    } catch (e) {
      console.error("Failed to delete abandoned cart", e);
    }
    return false;
  };

  // ─── SEO Metadata Actions ─────────────────────────────────────────────────
  const fetchSeoMetadata = async () => {
    isLoadingSeo.value = true;
    try {
      const res = await fetch("/api/seo-metadata");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          seoMetadataList.value = json.data;
        }
      }
    } catch (e) {
      console.warn("Could not fetch SEO metadata list from API", e);
    } finally {
      isLoadingSeo.value = false;
    }
  };

  const generateAiSeo = async (params: any) => {
    try {
      const res = await fetch("/api/seo-metadata/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.error("Failed to generate AI SEO metadata", e);
    }
    return null;
  };

  const saveSeoMetadata = async (payload: any) => {
    try {
      const res = await fetch("/api/seo-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchSeoMetadata();
        return true;
      }
    } catch (e) {
      console.error("Failed to save SEO metadata", e);
    }
    return false;
  };

  const deleteSeoMetadata = async (id: number) => {
    try {
      const res = await fetch(`/api/seo-metadata/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        seoMetadataList.value = seoMetadataList.value.filter((s) => s.id !== id);
        return true;
      }
    } catch (e) {
      console.error("Failed to delete SEO metadata", e);
    }
    return false;
  };

  // Inquiry Actions
  const markInquiryStatus = (
    id: string,
    status: "unread" | "in-progress" | "resolved",
  ) => {
    const inq = inquiries.value.find((i) => i.id === id);
    if (inq) {
      inq.status = status;
    }
  };

  const fetchCustomerMessages = async () => {
    isLoadingMessages.value = true;
    try {
      const headers: Record<string, string> = {};
      if (currentAdmin.value?.token) {
        headers["Authorization"] = `Bearer ${currentAdmin.value.token}`;
      }
      const res = await fetch("/api/customer-messages", { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          customerMessages.value = json.data.map((m: any) => ({
            id: m.id,
            userId: m.user_id,
            customerName:
              m.user?.customer_profile?.name || m.user?.name || "Customer",
            email: m.user?.email || "customer@example.com",
            phone: m.user?.customer_profile?.phone || undefined,
            subject: m.subject || "Customer Inquiry",
            message: m.message,
            status: m.status || "ongoing",
            staffReply: m.staff_reply,
            staffName: m.staff?.name,
            resolvedAt: m.resolved_at
              ? new Date(m.resolved_at).toLocaleString("en-US", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : null,
            createdAt: m.created_at
              ? new Date(m.created_at).toLocaleString("en-US", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "Recent",
          }));
        }
      }
    } catch (e) {
      console.warn("Could not fetch customer messages from API", e);
    } finally {
      isLoadingMessages.value = false;
    }
  };

  const fetchCustomerReviews = async () => {
    isLoadingReviews.value = true;
    try {
      const res = await fetch("/api/customer-reviews");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          customerReviews.value = json.data.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            productId: r.product_id,
            productName: r.product?.name || "Store Item",
            productImage: r.product?.image_url,
            customerName:
              r.user?.customer_profile?.name ||
              m_extractName(r.user) ||
              "Collector",
            email: r.user?.email || "customer@example.com",
            stars: Number(r.stars) || 5,
            message: r.message,
            image: r.image,
            staffReply: r.staff_reply,
            staffName: r.staff?.name,
            repliedAt: r.replied_at
              ? new Date(r.replied_at).toLocaleString("en-US", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : null,
            createdAt: r.created_at
              ? new Date(r.created_at).toLocaleString("en-US", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "Recent",
          }));
        }
      }
    } catch (e) {
      console.warn("Could not fetch customer reviews from API", e);
    } finally {
      isLoadingReviews.value = false;
    }
  };

  const m_extractName = (user: any): string => {
    if (!user) return "Collector";
    return user.name || "Collector";
  };

  const replyToCustomerMessage = async (id: number, replyText: string) => {
    try {
      const staffIdNum = currentAdmin.value?.id
        ? parseInt(currentAdmin.value.id.replace(/\D/g, ""))
        : 1;

      const res = await fetch(`/api/customer-messages/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_reply: replyText,
          staff_id: isNaN(staffIdNum) ? 1 : staffIdNum,
          status: "resolve",
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const idx = customerMessages.value.findIndex((m) => m.id === id);
          if (idx !== -1) {
            customerMessages.value[idx].status = "resolve";
            customerMessages.value[idx].staffReply = replyText;
            customerMessages.value[idx].staffName =
              currentAdmin.value?.name || "Staff Support";
            customerMessages.value[idx].resolvedAt = "Just now";
          }
        }
      }
    } catch (e) {
      console.error("Failed to reply to customer message", e);
    }
  };

  const toggleCustomerMessageStatus = async (
    id: number,
    newStatus: "ongoing" | "resolve",
  ) => {
    try {
      const res = await fetch(`/api/customer-messages/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const idx = customerMessages.value.findIndex((m) => m.id === id);
        if (idx !== -1) {
          customerMessages.value[idx].status = newStatus;
          if (newStatus === "resolve") {
            customerMessages.value[idx].resolvedAt = "Just now";
          }
        }
      }
    } catch (e) {
      console.error("Failed to update customer message status", e);
    }
  };

  // Real-time Chat Conversations
  const conversations = ref<AdminChatConversation[]>([]);
  const activeConversationId = ref<number | null>(null);
  const activeConversationMessages = ref<AdminChatMessage[]>([]);
  const isLoadingConversations = ref(false);
  const isLoadingChatMessages = ref(false);

  const activeConversation = computed(() => {
    return (
      conversations.value.find((c) => c.id === activeConversationId.value) ||
      null
    );
  });

  const fetchConversations = async (status?: string) => {
    isLoadingConversations.value = true;
    try {
      const headers: Record<string, string> = {};
      if (currentAdmin.value?.token) {
        headers["Authorization"] = `Bearer ${currentAdmin.value.token}`;
      }
      const url =
        status && status !== "all"
          ? `/api/conversations?status=${status}`
          : "/api/conversations";
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          conversations.value = json.data;
          if (
            activeConversationId.value === null &&
            conversations.value.length > 0
          ) {
            activeConversationId.value = conversations.value[0].id;
            await fetchConversationMessages(conversations.value[0].id);
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch conversations", e);
    } finally {
      isLoadingConversations.value = false;
    }
  };

  const fetchConversationMessages = async (convId: number) => {
    activeConversationId.value = convId;
    isLoadingChatMessages.value = true;
    try {
      const headers: Record<string, string> = {};
      if (currentAdmin.value?.token) {
        headers["Authorization"] = `Bearer ${currentAdmin.value.token}`;
      }
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        headers,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          activeConversationMessages.value = json.data;
          const conv = conversations.value.find((c) => c.id === convId);
          if (conv) {
            conv.unread_count = 0;
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch conversation messages", e);
    } finally {
      isLoadingChatMessages.value = false;
    }
  };

  const sendAdminChatMessage = async (convId: number, content: string) => {
    if (!content.trim()) return;
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (currentAdmin.value?.token) {
        headers["Authorization"] = `Bearer ${currentAdmin.value.token}`;
      }
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          activeConversationMessages.value.push(json.data);
          const conv = conversations.value.find((c) => c.id === convId);
          if (conv) {
            conv.latest_message = json.data;
            conv.updated_at = new Date().toISOString();
          }
        }
      }
    } catch (e) {
      console.error("Failed to send admin chat message", e);
    }
  };

  const updateChatConversationStatus = async (
    convId: number,
    status: "active" | "closed" | "resolved",
  ) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (currentAdmin.value?.token) {
        headers["Authorization"] = `Bearer ${currentAdmin.value.token}`;
      }
      const res = await fetch(`/api/conversations/${convId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const conv = conversations.value.find((c) => c.id === convId);
          if (conv) {
            conv.status = status;
          }
        }
      }
    } catch (e) {
      console.error("Failed to update conversation status", e);
    }
  };

  const replyToCustomerReview = async (id: number, replyText: string) => {
    try {
      const staffIdNum = currentAdmin.value?.id
        ? parseInt(currentAdmin.value.id.replace(/\D/g, ""))
        : 1;

      const res = await fetch(`/api/customer-reviews/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_reply: replyText,
          staff_id: isNaN(staffIdNum) ? 1 : staffIdNum,
        }),
      });

      if (res.ok) {
        const idx = customerReviews.value.findIndex((r) => r.id === id);
        if (idx !== -1) {
          customerReviews.value[idx].staffReply = replyText;
          customerReviews.value[idx].staffName =
            currentAdmin.value?.name || "Store Admin";
          customerReviews.value[idx].repliedAt = "Just now";
        }
      }
    } catch (e) {
      console.error("Failed to reply to customer review", e);
    }
  };

  const deleteCustomerReview = async (id: number) => {
    try {
      const res = await fetch(`/api/customer-reviews/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        customerReviews.value = customerReviews.value.filter(
          (r) => r.id !== id,
        );
      }
    } catch (e) {
      console.error("Failed to delete customer review", e);
    }
  };

  const fetchYouTubeMetadata = async (url: string) => {
    const res = await fetch(`/api/youtube-metadata?url=${encodeURIComponent(url.trim())}`, {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch YouTube metadata");
    }
    if (data.success) {
      return data.data;
    return data.data;
    }
  };

  return {
    currentAdmin,
    isAuthenticated,
    dashboardTimeframe,
    orders,
    shippingCarriers,
    orderStatuses,
    isLoadingOrders,
    fetchShippingCarriers,
    fetchOrderStatuses,
    fetchOrders,
    inventory,
    isLoadingInventory,
    fetchInventory,
    customers,
    inquiries,
    customerMessages,
    isLoadingMessages,
    customerReviews,
    isLoadingReviews,
    conversations,
    activeConversationId,
    activeConversationMessages,
    activeConversation,
    isLoadingConversations,
    isLoadingChatMessages,
    fetchConversations,
    fetchConversationMessages,
    sendAdminChatMessage,
    updateChatConversationStatus,
    fetchCustomerMessages,
    fetchCustomerReviews,
    replyToCustomerMessage,
    toggleCustomerMessageStatus,
    replyToCustomerReview,
    deleteCustomerReview,
    promoCodes,
    productBundles,
    isLoadingBundles,
    fetchProductBundles,
    createProductBundle,
    updateProductBundle,
    toggleProductBundle,
    deleteProductBundle,
    abandonedCarts,
    isLoadingAbandonedCarts,
    abandonedCartStats,
    fetchAbandonedCarts,
    sendAbandonedCartReminder,
    dispatchAllAbandonedCarts,
    deleteAbandonedCart,
    seoMetadataList,
    isLoadingSeo,
    fetchSeoMetadata,
    generateAiSeo,
    saveSeoMetadata,
    deleteSeoMetadata,
    cmsBanners,
    staffMembers,
    settings,
    metrics,
    dashboardData,
    isLoadingDashboard,
    fetchDashboardData,
    topProducts,
    topReferrers,
    allowedModulePaths,
    allowedModuleCodes,
    staffPermissions,
    isPermissionsLoaded,
    fetchStaffPermissions,
    canAccess,
    canAccessPath,
    canAccessModule,
    login,
    logout,
    syncOrderStatusLocal,
    updateOrderStatus,
    attachTracking,
    markPackingSlipPrinted,
    processRefund,
    updateStock,
    addInventoryItem,
    addPromoCode,
    togglePromoCode,
    markInquiryStatus,
    fetchYouTubeMetadata,
  };
});
