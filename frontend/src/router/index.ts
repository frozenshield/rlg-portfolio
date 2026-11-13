import { createRouter, createWebHistory } from "vue-router";
import { routes } from "./routes";
import { useAdminStore } from "@/modules/admin/admin.store";
import { useAuthStore } from "@/modules/auth/auth.store";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  // Update browser document title
  if (to.meta.title && typeof to.meta.title === "string") {
    document.title = to.meta.title;
  }

  // Customer Checkout route protection
  if (to.path === "/checkout" || to.path.startsWith("/checkout")) {
    let isCustomerAuth = false;
    try {
      const authStore = useAuthStore();
      isCustomerAuth = authStore.isAuthenticated;
      if (!isCustomerAuth) {
        authStore.openAuthModal(
          "Please sign in or create an account to proceed to checkout.",
        );
      }
    } catch {}

    const hasStoredToken =
      typeof window !== "undefined" &&
      !!(
        localStorage.getItem("auth_token") ||
        localStorage.getItem("rlg_sanctum_token")
      );

    if (!isCustomerAuth && !hasStoredToken) {
      return next({ path: "/" });
    }
  }

  // Admin route protection
  const isAdminRoute = to.path.startsWith("/admin");
  const isAdminLogin = to.path === "/admin/login";

  // Verify stored admin session from both in-memory store and localStorage
  let isAdminAuthenticated = false;
  let parsedSession: any = null;

  try {
    const adminStore = useAdminStore();
    if (adminStore.isAuthenticated && adminStore.currentAdmin) {
      isAdminAuthenticated = true;
      parsedSession = adminStore.currentAdmin;
    }
  } catch {
    // Pinia not yet initialized fallback
  }

  if (!isAdminAuthenticated) {
    const rawAdminSession = localStorage.getItem("rlg-admin-session");
    if (
      rawAdminSession &&
      rawAdminSession !== "null" &&
      rawAdminSession !== "undefined"
    ) {
      try {
        const raw =
          typeof rawAdminSession === "string"
            ? JSON.parse(rawAdminSession)
            : rawAdminSession;
        if (raw && typeof raw === "object" && (raw.id || raw.email)) {
          parsedSession = raw;
          isAdminAuthenticated = true;
          try {
            const adminStore = useAdminStore();
            adminStore.currentAdmin = raw;
          } catch {
            // Pinia not yet initialized
          }
        }
      } catch {
        isAdminAuthenticated = false;
      }
    }
  }

  // When visiting /admin root directly:
  if (to.path === "/admin" || to.path === "/admin/") {
    if (isAdminAuthenticated) {
      return next({ path: "/admin/dashboard" });
    }
    return next({ path: "/admin/login" });
  }

  // If already authenticated and visiting /admin/login, forward straight to dashboard
  if (isAdminLogin) {
    if (isAdminAuthenticated) {
      return next({ path: "/admin/dashboard" });
    }
    return next();
  }

  if (isAdminRoute) {
    // If not logged in, redirect to login page
    if (!isAdminAuthenticated) {
      const redirectTarget =
        to.fullPath !== "/admin" &&
        to.fullPath !== "/admin/" &&
        to.fullPath !== "/admin/login"
          ? to.fullPath
          : "/admin/dashboard";
      return next({
        path: "/admin/login",
        query: { redirect: redirectTarget },
      });
    }

    // Role-based Access Matrix enforcement on child routes
    const role = String(parsedSession?.role || "").toLowerCase();
    const roleLabel = String(parsedSession?.roleLabel || "").toLowerCase();
    const isSuper =
      role === "super-admin" ||
      role === "admin" ||
      role.includes("admin") ||
      roleLabel.includes("admin");

    if (parsedSession && !isSuper) {
      const allowedCodes: string[] = parsedSession.allowedCodes || [];
      const allowedPaths: string[] = parsedSession.allowedPaths || [];

      // Extract module code from e.g. /admin/settings -> settings
      const match = to.path.match(/^\/admin\/([a-z0-9_-]+)/i);
      const moduleCode = match ? match[1].toLowerCase() : null;

      if (moduleCode && moduleCode !== "dashboard") {
        if (allowedCodes.length === 0 && allowedPaths.length === 0) {
          return next();
        }

        const hasCodeAccess =
          allowedCodes.length > 0 ? allowedCodes.includes(moduleCode) : true;
        const hasPathAccess =
          allowedPaths.length > 0
            ? allowedPaths.some(
                (p) =>
                  p.toLowerCase() === to.path.toLowerCase() ||
                  to.path.toLowerCase().startsWith(p.toLowerCase() + "/"),
              )
            : true;

        if (!hasCodeAccess && !hasPathAccess) {
          // Block unauthorized module and redirect to permitted dashboard
          return next({ path: "/admin/dashboard" });
        }
      }
    }
  }

  next();
});

router.afterEach(() => {
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove("overflow-hidden");
    document.body.classList.remove("overflow-hidden");
  }
});

export default router;
