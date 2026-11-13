import { ref } from "vue";
import { Capacitor } from "@capacitor/core";
import { PushNotifications, type Token, type ActionPerformed, type PushNotificationSchema } from "@capacitor/push-notifications";
import { resolveApiUrl } from "@/shared/utils/api";
import router from "@/router";

export interface PushToastPayload {
  id: string;
  title: string;
  body: string;
  type?: "outbid" | "raffle_draw_started" | "gacha_drop_alert" | "general";
  deepLink?: string;
  imageUrl?: string;
  data?: Record<string, any>;
  timestamp: number;
}

// Global reactive toast state for foreground notifications
export const activePushToast = ref<PushToastPayload | null>(null);
export const fcmDeviceToken = ref<string | null>(null);

let isInitialized = false;

/**
 * Register FCM device token with Laravel backend.
 */
export async function syncDeviceTokenToBackend(token: string): Promise<boolean> {
  fcmDeviceToken.value = token;
  const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
  const authToken = localStorage.getItem("auth_token") || localStorage.getItem("token") || "";

  try {
    const res = await fetch(resolveApiUrl("/api/device-tokens"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authToken ? `Bearer ${authToken}` : "",
      },
      body: JSON.stringify({
        token,
        platform,
      }),
    });

    if (res.ok) {
      console.log("[Push Notification] Device token registered with backend successfully.");
      return true;
    } else {
      console.warn("[Push Notification] Failed to sync token with backend:", await res.text());
      return false;
    }
  } catch (err) {
    console.warn("[Push Notification] Error syncing token with backend:", err);
    return false;
  }
}

/**
 * Initialize Push Notifications, request permissions, and set up foreground / action listeners.
 */
export async function initPushNotifications() {
  if (isInitialized) return;

  const isNative = Capacitor.isNativePlatform();
  const isPluginAvailable = Capacitor.isPluginAvailable("PushNotifications");

  if (!isNative || !isPluginAvailable) {
    console.info("[Push Notification] Native push notifications not active in standard desktop browser mode.");
    return;
  }

  try {
    // 1. Request Push Notification Permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      console.warn("[Push Notification] User declined or did not grant push notifications permission.");
      return;
    }

    // 2. Register with FCM APNs / Firebase
    await PushNotifications.register();
    isInitialized = true;

    // 3. Listener: Registration successful, receive FCM Token
    await PushNotifications.addListener("registration", async (token: Token) => {
      console.log("[Push Notification] FCM Token received:", token.value);
      await syncDeviceTokenToBackend(token.value);
    });

    // 4. Listener: Registration error
    await PushNotifications.addListener("registrationError", (error: any) => {
      console.error("[Push Notification] Registration failed:", error);
    });

    // 5. Listener: Push Notification Received in Foreground (e.g. while browsing auctions or gacha)
    await PushNotifications.addListener("pushNotificationReceived", (notification: PushNotificationSchema) => {
      console.log("[Push Notification Received (Foreground)]", notification);

      const data = notification.data || {};
      const type = data.type || "general";
      const deepLink = data.deep_link || data.click_action || "";

      // Trigger custom animated Tailwind toast in Vue root layout
      activePushToast.value = {
        id: notification.id || `push_${Date.now()}`,
        title: notification.title || "RLG Collectibles Alert",
        body: notification.body || "",
        type,
        deepLink,
        imageUrl: (notification as any).image || data.image || undefined,
        data,
        timestamp: Date.now(),
      };

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        if (activePushToast.value?.id === (notification.id || `push_${Date.now()}`)) {
          activePushToast.value = null;
        }
      }, 6000);
    });

    // 6. Listener: Notification Action Performed (User tapped notification from notification tray)
    await PushNotifications.addListener("actionPerformed", (action: ActionPerformed) => {
      console.log("[Push Notification Action Performed]", action);
      const data = action.notification.data || {};
      const deepLink = data.deep_link;

      if (deepLink && router) {
        router.push(deepLink);
      }
    });

  } catch (error) {
    console.error("[Push Notification] Error initializing Push Notifications:", error);
  }
}

/**
 * Dismiss active foreground push toast.
 */
export function dismissPushToast() {
  activePushToast.value = null;
}

/**
 * Action click on toast - navigates to deepLink and dismisses toast.
 */
export function handlePushToastClick(toast: PushToastPayload) {
  if (toast.deepLink) {
    router.push(toast.deepLink);
  }
  dismissPushToast();
}

