import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { Preferences } from "@capacitor/preferences";
import axios from "axios";

export const TOKEN_KEY = "rlg_sanctum_token";

export interface UserProfile {
  id?: number | string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  user_type?: "customer" | "staff" | "admin";
  // Shipping / Address Fields
  address_line1?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  // Collector Hobby Fields
  favorite_franchise?: string;
  bio?: string;
  is_vip?: boolean;
  pro_subscribed_at?: string | null;
}

export interface UserSettings {
  email_notifications: boolean;
  order_updates_sms: boolean;
  marketing_emails: boolean;
  currency_preference: "PHP" | "USD" | "JPY";
  two_factor_auth: boolean;
  public_collection: boolean;
}

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);
  const currentUser = ref<UserProfile>({
    id: 1,
    name: "Collector",
    username: "hobby_collector",
    email: "collector@rlgshop.local",
    phone: "+63 912 345 6789",
    avatar: null,
    user_type: "customer",
    address_line1: "123 Hobby St, Metro Manila",
    city: "Quezon City",
    postal_code: "1100",
    country: "Philippines",
    favorite_franchise: "Pokémon TCG",
    bio: "Sealed box collector and Gunpla builder since 2018.",
  });

  // Alias user to currentUser for Capacitor / Sanctum spec compatibility
  const user = currentUser;

  const settings = ref<UserSettings>({
    email_notifications: true,
    order_updates_sms: true,
    marketing_emails: false,
    currency_preference: "PHP",
    two_factor_auth: false,
    public_collection: true,
  });

  const isAuthenticated = computed(() => !!token.value);

  // ─── Global Auth Modal State & Guard ───────────────────────────────────────
  const isAuthModalOpen = ref(false);
  const authModalMessage = ref("");
  const authModalTab = ref<"login" | "register">("login");

  const openAuthModal = (
    message?: string,
    tab: "login" | "register" = "login",
  ) => {
    authModalMessage.value = message || "";
    authModalTab.value = tab;
    isAuthModalOpen.value = true;
  };

  const closeAuthModal = () => {
    isAuthModalOpen.value = false;
    authModalMessage.value = "";
  };

  const requireAuth = (actionMessage?: string): boolean => {
    if (!isAuthenticated.value) {
      openAuthModal(
        actionMessage || "Please sign in or create an account to continue.",
      );
      return false;
    }
    return true;
  };

  // Initialize auth from Capacitor Preferences (with localStorage fallback)
  const initAuth = async () => {
    try {
      const { value } = await Preferences.get({ key: TOKEN_KEY });
      const fallback = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const resolvedToken = value || fallback;

      if (resolvedToken && resolvedToken !== "null" && resolvedToken !== "undefined") {
        token.value = resolvedToken;
        axios.defaults.headers.common["Authorization"] = `Bearer ${resolvedToken}`;

        // Sync to Capacitor Preferences
        await Preferences.set({ key: TOKEN_KEY, value: resolvedToken });

        // Restore cached user from Preferences or localStorage if available
        const { value: cachedUserStr } = await Preferences.get({ key: "rlg_auth_user" });
        const localUserStr = typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
        const userJson = cachedUserStr || localUserStr;
        if (userJson) {
          try {
            currentUser.value = { ...currentUser.value, ...JSON.parse(userJson) };
          } catch {}
        }

        // Fetch fresh user data from API
        await fetchCurrentUser();
      }

      // Restore cached settings from localStorage
      if (typeof window !== "undefined") {
        const cachedSettings = localStorage.getItem("rlg_user_settings");
        if (cachedSettings) {
          try {
            settings.value = { ...settings.value, ...JSON.parse(cachedSettings) };
          } catch {}
        }
      }
    } catch (e) {
      console.warn("initAuth error:", e);
    }
  };

  const setAuth = async (newToken: string, userData?: Partial<UserProfile>) => {
    token.value = newToken;
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

    await Preferences.set({ key: TOKEN_KEY, value: newToken });
    try {
      localStorage.setItem("auth_token", newToken);
    } catch {}

    if (userData) {
      currentUser.value = { ...currentUser.value, ...userData };
      await Preferences.set({ key: "rlg_auth_user", value: JSON.stringify(currentUser.value) });
      try {
        localStorage.setItem("auth_user", JSON.stringify(currentUser.value));
      } catch {}
    }

    // Load user settings from API
    try {
      const sRes = await fetch("/api/user/settings", {
        headers: {
          Authorization: `Bearer ${newToken}`,
          Accept: "application/json",
        },
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        settings.value = { ...settings.value, ...sData };
        localStorage.setItem("rlg_user_settings", JSON.stringify(settings.value));
        if (currentUser.value.email) {
          localStorage.setItem(
            `rlg_2fa_enabled_${currentUser.value.email.trim().toLowerCase()}`,
            settings.value.two_factor_auth ? "true" : "false",
          );
        }
      }
    } catch {}
  };

  const login = async (credentials: any) => {
    const response = await axios.post("/api/auth/login", credentials);
    const data = response.data;
    const newToken = data.token;
    const newUser = data.user;

    token.value = newToken;
    if (newUser) {
      currentUser.value = { ...currentUser.value, ...newUser };
    }

    await Preferences.set({ key: TOKEN_KEY, value: newToken });
    if (newUser) {
      await Preferences.set({ key: "rlg_auth_user", value: JSON.stringify(currentUser.value) });
    }
    try {
      localStorage.setItem("auth_token", newToken);
      if (newUser) localStorage.setItem("auth_user", JSON.stringify(currentUser.value));
    } catch {}

    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    return data;
  };

  const fetchCurrentUser = async () => {
    if (!token.value) return;
    try {
      const res = await fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${token.value}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        currentUser.value = { ...currentUser.value, ...data };
        await Preferences.set({ key: "rlg_auth_user", value: JSON.stringify(currentUser.value) });
        try {
          localStorage.setItem("auth_user", JSON.stringify(currentUser.value));
        } catch {}

        // Also sync settings from backend
        try {
          const sRes = await fetch("/api/user/settings", {
            headers: {
              Authorization: `Bearer ${token.value}`,
              Accept: "application/json",
            },
          });
          if (sRes.ok) {
            const sData = await sRes.json();
            settings.value = { ...settings.value, ...sData };
            localStorage.setItem("rlg_user_settings", JSON.stringify(settings.value));
            if (currentUser.value.email) {
              localStorage.setItem(
                `rlg_2fa_enabled_${currentUser.value.email.trim().toLowerCase()}`,
                settings.value.two_factor_auth ? "true" : "false",
              );
            }
          }
        } catch {}

        // Fetch cart for authenticated user
        try {
          const { useCartStore } = await import("@/modules/cart/cart.store");
          const cartStore = useCartStore();
          await cartStore.fetchCart();
        } catch (e) {
          console.warn("Could not fetch cart during auth", e);
        }
      }
    } catch {
      // Backend not reachable or offline; keep cached user
    }
  };

  const updateProfile = async (fields: Partial<UserProfile>) => {
    currentUser.value = { ...currentUser.value, ...fields };
    await Preferences.set({ key: "rlg_auth_user", value: JSON.stringify(currentUser.value) });
    try {
      localStorage.setItem("auth_user", JSON.stringify(currentUser.value));
    } catch {}

    if (token.value) {
      try {
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.value}`,
            Accept: "application/json",
          },
          body: JSON.stringify(fields),
        });
      } catch {}
    }
    return currentUser.value;
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    settings.value = { ...settings.value, ...newSettings };
    try {
      localStorage.setItem("rlg_user_settings", JSON.stringify(settings.value));
      if (currentUser.value.email) {
        localStorage.setItem(
          `rlg_2fa_enabled_${currentUser.value.email.trim().toLowerCase()}`,
          settings.value.two_factor_auth ? "true" : "false",
        );
      }
    } catch {}

    if (token.value) {
      try {
        await fetch("/api/user/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token.value}`,
            Accept: "application/json",
          },
          body: JSON.stringify(newSettings),
        });
      } catch {}
    }
    return settings.value;
  };

  const logout = async () => {
    const savedToken = token.value;

    token.value = null;
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: "rlg_auth_user" });
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    } catch {}

    delete axios.defaults.headers.common["Authorization"];

    // Clear cart
    try {
      const { useCartStore } = await import("@/modules/cart/cart.store");
      const cartStore = useCartStore();
      cartStore.clearCart();
    } catch (e) {
      console.warn("Could not clear cart during logout", e);
    }

    currentUser.value = {
      id: 0,
      name: "",
      username: "",
      email: "",
      avatar: null,
      user_type: "customer",
    };

    if (savedToken) {
      try {
        await axios.post("/api/auth/logout").catch(() => {
          return fetch("/api/logout", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${savedToken}`,
              Accept: "application/json",
            },
            signal: AbortSignal.timeout(1500),
          });
        });
      } catch {}
    }
  };

  const isProModalOpen = ref(false);

  const isVip = computed(() => {
    if (!isAuthenticated.value || !currentUser.value?.id) return false;
    return Boolean(currentUser.value?.is_vip);
  });

  const openProModal = () => {
    isProModalOpen.value = true;
  };

  const closeProModal = () => {
    isProModalOpen.value = false;
  };

  const subscribeToPro = () => {
    openProModal();
    return true;
  };

  // Eagerly initiate auth hydration
  initAuth();

  return {
    user,
    currentUser,
    token,
    settings,
    isAuthenticated,
    isVip,
    isProModalOpen,
    openProModal,
    closeProModal,
    subscribeToPro,
    initAuth,
    setAuth,
    login,
    logout,
    fetchCurrentUser,
    updateProfile,
    updateSettings,
    isAuthModalOpen,
    authModalMessage,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    requireAuth,
  };
});

