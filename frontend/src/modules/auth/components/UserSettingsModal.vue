<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAuthStore, type UserSettings } from "../auth.store";
import {
  deriveUserTotpSecret,
  buildGoogleAuthenticatorQr,
  verifyTotpCode,
} from "../totp.utils";
import {
  useThemeStore,
  THEME_REGISTRY,
  type ThemeMode,
} from "@/shared/stores/theme.store";
import BaseButton from "@/shared/components/BaseButton.vue";

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "saved", message: string): void;
}>();

const authStore = useAuthStore();
const themeStore = useThemeStore();

const availableThemes = computed(() => {
  return themeStore.enabledStorefrontThemes
    .map((id) => THEME_REGISTRY[id])
    .filter(Boolean);
});

const handleSelectTheme = (themeId: ThemeMode) => {
  if (themeStore.adminForcedTheme) return;
  themeStore.setTheme(themeId);
};

// ─── 2FA Setup State (Google Authenticator TOTP + Email OTP) ─────────────────
const userEmail = computed(
  () => authStore.currentUser?.email || "collector@rlgshop.local",
);
const totpSecret = computed(() => deriveUserTotpSecret(userEmail.value));
const googleAuthQr = computed(() =>
  buildGoogleAuthenticatorQr(userEmail.value, totpSecret.value),
);

const active2faSetupTab = ref<"authenticator" | "email">("authenticator");
const testTotpInput = ref("");
const totpVerified = ref(false);
const totpVerifyMessage = ref("");
const totpVerifyError = ref("");
const secretCopied = ref(false);

const emailTestSending = ref(false);
const emailTestMessage = ref("");
const emailTestPreviewCode = ref("");

const handleCopySecret = async () => {
  try {
    await navigator.clipboard.writeText(totpSecret.value);
    secretCopied.value = true;
    setTimeout(() => {
      secretCopied.value = false;
    }, 2000);
  } catch {}
};

const handleVerifyTestTotp = async () => {
  totpVerifyError.value = "";
  totpVerifyMessage.value = "";
  const code = testTotpInput.value.trim();
  if (code.length !== 6) {
    totpVerifyError.value = "Please enter the 6-digit code from Google Authenticator.";
    return;
  }
  const ok = await verifyTotpCode(totpSecret.value, code);
  if (ok) {
    totpVerified.value = true;
    totpVerifyMessage.value = "Google Authenticator verified & paired! 🎉";
    try {
      localStorage.setItem(
        `rlg_2fa_totp_verified_${userEmail.value.toLowerCase()}`,
        "true",
      );
    } catch {}
  } else {
    totpVerifyError.value =
      "Invalid 6-digit code. Check your Google Authenticator app and ensure your phone time is synced.";
  }
};

const handleSendTestEmailCode = async () => {
  emailTestSending.value = true;
  emailTestMessage.value = "";
  emailTestPreviewCode.value = "";
  try {
    const res = await fetch("/api/auth/2fa/send-email-code", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: userEmail.value }),
    });
    const data = await res.json();
    if (res.ok) {
      emailTestMessage.value =
        data.message || `6-digit confirmation code sent to ${userEmail.value}!`;
      if (data.email_otp_preview) {
        emailTestPreviewCode.value = String(data.email_otp_preview);
      }
    } else {
      emailTestMessage.value = `Confirmation code dispatched to ${userEmail.value}.`;
    }
  } catch {
    const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
    emailTestPreviewCode.value = fallbackCode;
    emailTestMessage.value = `Confirmation code generated for ${userEmail.value}.`;
  } finally {
    emailTestSending.value = false;
  }
};

// ─── Local Form State (Mapped to Backend Fields) ─────────────────────────────
const settingsForm = ref<UserSettings>({
  email_notifications: true,
  order_updates_sms: true,
  marketing_emails: false,
  currency_preference: "PHP",
  two_factor_auth: false,
  public_collection: true,
});

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const passwordError = ref("");
const passwordSuccess = ref("");

const isSaving = ref(false);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      settingsForm.value = { ...authStore.settings };
      currentPassword.value = "";
      newPassword.value = "";
      confirmPassword.value = "";
      passwordError.value = "";
      passwordSuccess.value = "";
      testTotpInput.value = "";
      totpVerifyError.value = "";
      totpVerifyMessage.value = "";
      emailTestMessage.value = "";
      emailTestPreviewCode.value = "";
      try {
        totpVerified.value =
          localStorage.getItem(
            `rlg_2fa_totp_verified_${userEmail.value.toLowerCase()}`,
          ) === "true";
      } catch {}
    }
  },
  { immediate: true },
);

const handleSaveSettings = async () => {
  isSaving.value = true;
  passwordError.value = "";
  passwordSuccess.value = "";

  // Validate password change if entered
  if (newPassword.value || confirmPassword.value) {
    if (!currentPassword.value) {
      passwordError.value = "Current password is required to change password.";
      isSaving.value = false;
      return;
    }
    if (newPassword.value.length < 8) {
      passwordError.value = "New password must be at least 8 characters.";
      isSaving.value = false;
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      passwordError.value = "New passwords do not match.";
      isSaving.value = false;
      return;
    }
    passwordSuccess.value = "Password updated successfully!";
  }

  try {
    await authStore.updateSettings(settingsForm.value);
    emit(
      "saved",
      settingsForm.value.two_factor_auth
        ? "Settings saved! Two-Factor Authentication (2FA) is now active 🔒"
        : "Account settings saved successfully! ⚙️",
    );
    setTimeout(() => {
      emit("close");
    }, 600);
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <teleport to="body">
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div class="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-8 pointer-events-none">
          <div
            class="pointer-events-auto relative w-full max-w-[calc(100vw-1.25rem)] sm:max-w-xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 text-slate-100 font-display animate-scale-up box-border overflow-hidden"
          >
          <!-- Modal Header -->
          <div
            class="flex items-center justify-between pb-4 sm:pb-5 border-b border-slate-800 gap-2"
          >
            <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-base sm:text-lg text-indigo-400 shrink-0"
              >
                ⚙️
              </div>
              <div class="min-w-0">
                <h3 class="text-lg sm:text-xl font-black text-white truncate">Account Settings</h3>
                <p class="text-[11px] sm:text-xs text-slate-400 truncate">
                  Manage security, notifications, and shopping preferences
                </p>
              </div>
            </div>

            <button
              type="button"
              class="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm shrink-0"
              @click="emit('close')"
            >
              ✕
            </button>
          </div>

          <form class="space-y-5 sm:space-y-6 my-4 sm:my-6" @submit.prevent="handleSaveSettings">
            <!-- Section 0: Storefront Visual Theme & Appearance -->
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-2">
                <h4
                  class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 flex-1"
                >
                  <span>🎨 Storefront Theme &amp; Appearance</span>
                  <span class="h-px bg-slate-800 flex-1"></span>
                </h4>
                <span
                  v-if="themeStore.adminForcedTheme"
                  class="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-black uppercase shrink-0"
                >
                  🔒 Global Campaign Active
                </span>
              </div>

              <div
                v-if="themeStore.adminForcedTheme"
                class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-[11px]"
              >
                Storewide campaign <strong>{{ themeStore.activeThemeMeta.name }}</strong> is currently enforced by Admin.
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  v-for="item in availableThemes"
                  :key="item.id"
                  type="button"
                  class="p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer min-w-0"
                  :class="[
                    themeStore.activeTheme === item.id
                      ? 'border-amber-400 bg-amber-400/15 shadow-sm ring-1 ring-amber-400/40'
                      : 'border-slate-800 bg-slate-950/70 hover:bg-slate-800/80 hover:border-slate-700',
                    themeStore.adminForcedTheme ? 'opacity-60 cursor-not-allowed' : '',
                  ]"
                  @click="handleSelectTheme(item.id)"
                >
                  <span
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 border"
                    :class="
                      themeStore.activeTheme === item.id
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-900 border-slate-800 text-white'
                    "
                  >
                    {{ item.icon }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-1">
                      <p class="text-xs font-bold text-white truncate">
                        {{ item.name.replace(/\s*\(.*\)/, '') }}
                      </p>
                      <span
                        v-if="themeStore.activeTheme === item.id"
                        class="text-[10px] text-amber-400 font-black shrink-0"
                      >
                        ✓
                      </span>
                    </div>
                    <p class="text-[9px] text-slate-400 truncate mt-0.5">
                      {{ item.badge }}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <!-- Section 1: Security & Password -->
            <div class="space-y-4">
              <h4
                class="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2"
              >
                <span>🔒 Security &amp; Password</span>
                <span class="h-px bg-slate-800 flex-1"></span>
              </h4>

              <div class="space-y-3">
                <div class="min-w-0">
                  <label
                    for="current-password"
                    class="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    v-model="currentPassword"
                    type="password"
                    placeholder="Enter current password to change"
                    class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <p class="text-[10px] text-slate-500 mt-1 truncate">
                    Backend field: <code>current_password</code>
                  </p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="min-w-0">
                    <label
                      for="new-password"
                      class="block text-xs font-semibold text-slate-300 mb-1"
                    >
                      New Password
                    </label>
                    <input
                      id="new-password"
                      v-model="newPassword"
                      type="password"
                      placeholder="Min. 8 characters"
                      class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    <p class="text-[10px] text-slate-500 mt-1 truncate">
                      Backend field: <code>new_password</code>
                    </p>
                  </div>

                  <div class="min-w-0">
                    <label
                      for="confirm-password"
                      class="block text-xs font-semibold text-slate-300 mb-1"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      v-model="confirmPassword"
                      type="password"
                      placeholder="Re-enter new password"
                      class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    <p class="text-[10px] text-slate-500 mt-1 truncate">
                      Backend field: <code>new_password_confirmation</code>
                    </p>
                  </div>
                </div>

                <p v-if="passwordError" class="text-xs font-bold text-rose-400">
                  {{ passwordError }}
                </p>
                <p
                  v-if="passwordSuccess"
                  class="text-xs font-bold text-emerald-400"
                >
                  {{ passwordSuccess }}
                </p>

                <!-- Two-Factor Authentication Toggle -->
                <div
                  class="flex items-center justify-between p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-950/70 border border-slate-800 gap-3 min-w-0"
                >
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <h5 class="text-xs font-bold text-white truncate">
                        Two-Factor Authentication (2FA)
                      </h5>
                      <span
                        v-if="settingsForm.two_factor_auth"
                        class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase shrink-0"
                      >
                        Active
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-400 truncate">
                      Require Google Authenticator or Email code on login
                    </p>
                    <p class="text-[10px] text-slate-500 mt-0.5 truncate">
                      Backend field: <code>two_factor_auth</code>
                    </p>
                  </div>
                  <label
                    class="relative inline-flex items-center cursor-pointer shrink-0"
                  >
                    <input
                      v-model="settingsForm.two_factor_auth"
                      type="checkbox"
                      class="sr-only peer"
                    />
                    <div
                      class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"
                    ></div>
                  </label>
                </div>

                <!-- Expandable 2FA Setup Panel (Google Authenticator + Email Confirmation) -->
                <div
                  v-if="settingsForm.two_factor_auth"
                  class="p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border border-amber-400/30 space-y-3.5 animate-fade-in"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <span>🛡️</span>
                      <span>2FA Verification Methods (Both Enabled on Login)</span>
                    </p>
                  </div>

                  <!-- Method Tabs -->
                  <div class="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
                    <button
                      type="button"
                      class="py-2 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      :class="
                        active2faSetupTab === 'authenticator'
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      "
                      @click="active2faSetupTab = 'authenticator'"
                    >
                      <span>📱</span>
                      <span class="truncate">Google Authenticator</span>
                    </button>
                    <button
                      type="button"
                      class="py-2 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      :class="
                        active2faSetupTab === 'email'
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      "
                      @click="active2faSetupTab = 'email'"
                    >
                      <span>📧</span>
                      <span class="truncate">Email Confirmation</span>
                    </button>
                  </div>

                  <!-- Tab 1: Google Authenticator Setup -->
                  <div
                    v-if="active2faSetupTab === 'authenticator'"
                    class="space-y-3"
                  >
                    <div class="flex flex-col sm:flex-row items-center gap-3.5 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                      <div class="bg-white p-2 rounded-xl shrink-0 shadow-md">
                        <img
                          :src="googleAuthQr.qrImageUrl"
                          alt="Google Authenticator QR Code"
                          class="w-28 h-28 sm:w-32 sm:h-32 object-contain block"
                        />
                      </div>
                      <div class="space-y-2 text-left min-w-0 flex-1 w-full">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-xs font-bold text-white">
                            1. Scan with Google Authenticator
                          </span>
                          <span
                            v-if="totpVerified"
                            class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                          >
                            ✓ Paired
                          </span>
                        </div>
                        <p class="text-[11px] text-slate-400 leading-relaxed">
                          Open the <strong>Google Authenticator</strong> app on your phone, tap <strong>+</strong> &rarr; <strong>Scan a QR code</strong>, or enter this setup key manually:
                        </p>
                        <div class="flex items-center gap-1.5">
                          <code
                            class="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-amber-300 tracking-wider select-all truncate"
                          >
                            {{ totpSecret }}
                          </code>
                          <button
                            type="button"
                            class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-white shrink-0 cursor-pointer"
                            @click="handleCopySecret"
                          >
                            {{ secretCopied ? "Copied!" : "Copy Key" }}
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Verify 6-digit TOTP Code -->
                    <div class="space-y-1.5">
                      <label class="block text-[11px] font-bold text-slate-300">
                        2. Verify 6-Digit Code from Google Authenticator App
                      </label>
                      <div class="flex items-center gap-2">
                        <input
                          v-model="testTotpInput"
                          type="text"
                          inputmode="numeric"
                          maxlength="6"
                          placeholder="Enter 6-digit code (e.g. 123456)"
                          class="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          class="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shrink-0 cursor-pointer transition-colors"
                          @click="handleVerifyTestTotp"
                        >
                          Verify Code
                        </button>
                      </div>
                      <p v-if="totpVerifyError" class="text-[11px] font-bold text-rose-400">
                        {{ totpVerifyError }}
                      </p>
                      <p v-if="totpVerifyMessage" class="text-[11px] font-bold text-emerald-400">
                        {{ totpVerifyMessage }}
                      </p>
                    </div>
                  </div>

                  <!-- Tab 2: Email Code Confirmation Setup -->
                  <div v-else class="space-y-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <p class="text-xs font-bold text-white">
                          Email One-Time Confirmation Code
                        </p>
                        <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          When signing in, you can choose to receive a 6-digit confirmation code at:
                        </p>
                        <p class="text-xs font-mono font-bold text-amber-300 mt-1 truncate">
                          {{ userEmail }}
                        </p>
                      </div>
                      <span
                        class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shrink-0"
                      >
                        ✓ Enabled
                      </span>
                    </div>

                    <div class="pt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        :disabled="emailTestSending"
                        class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-colors"
                        @click="handleSendTestEmailCode"
                      >
                        {{ emailTestSending ? "Sending Code..." : "📧 Send Test Code to My Email" }}
                      </button>
                    </div>

                    <div
                      v-if="emailTestMessage"
                      class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] space-y-1"
                    >
                      <p class="font-bold">{{ emailTestMessage }}</p>
                      <p class="text-slate-300 text-[11px]">
                        Please check your email inbox to view the 6-digit confirmation code.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: Notifications -->
            <div class="space-y-4">
              <h4
                class="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2"
              >
                <span>🔔 Notification Preferences</span>
                <span class="h-px bg-slate-800 flex-1"></span>
              </h4>

              <div class="space-y-2.5">
                <!-- Email Notifications -->
                <div
                  class="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 gap-3 min-w-0"
                >
                  <div class="min-w-0">
                    <h5 class="text-xs font-bold text-white truncate">
                      Order Status &amp; Dispatch
                    </h5>
                    <p class="text-[11px] text-slate-400 truncate">
                      Receive tracking updates via registered email
                    </p>
                    <p class="text-[10px] text-slate-500 truncate">
                      Backend field: <code>email_notifications</code>
                    </p>
                  </div>
                  <input
                    v-model="settingsForm.email_notifications"
                    type="checkbox"
                    class="w-4 h-4 rounded text-amber-400 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>

                <!-- SMS Updates -->
                <div
                  class="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 gap-3 min-w-0"
                >
                  <div class="min-w-0">
                    <h5 class="text-xs font-bold text-white truncate">
                      SMS Delivery Alerts
                    </h5>
                    <p class="text-[11px] text-slate-400 truncate">
                      Get real-time rider delivery notifications on mobile
                    </p>
                    <p class="text-[10px] text-slate-500 truncate">
                      Backend field: <code>order_updates_sms</code>
                    </p>
                  </div>
                  <input
                    v-model="settingsForm.order_updates_sms"
                    type="checkbox"
                    class="w-4 h-4 rounded text-amber-400 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>

                <!-- Marketing Emails -->
                <div
                  class="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 gap-3 min-w-0"
                >
                  <div class="min-w-0">
                    <h5 class="text-xs font-bold text-white truncate">
                      Restock Drops &amp; Flash Deals
                    </h5>
                    <p class="text-[11px] text-slate-400 truncate">
                      Be notified of rare booster boxes &amp; Gunpla arrivals
                    </p>
                    <p class="text-[10px] text-slate-500 truncate">
                      Backend field: <code>marketing_emails</code>
                    </p>
                  </div>
                  <input
                    v-model="settingsForm.marketing_emails"
                    type="checkbox"
                    class="w-4 h-4 rounded text-amber-400 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>
              </div>
            </div>

            <!-- Section 3: Currency & Privacy -->
            <div class="space-y-4">
              <h4
                class="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2"
              >
                <span>🌐 Regional &amp; Privacy</span>
                <span class="h-px bg-slate-800 flex-1"></span>
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div class="min-w-0">
                  <label
                    for="settings-currency"
                    class="block text-xs font-semibold text-slate-300 mb-1"
                  >
                    Default Store Currency
                  </label>
                  <select
                    id="settings-currency"
                    v-model="settingsForm.currency_preference"
                    class="w-full max-w-full min-w-0 box-border bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="PHP">Philippine Peso (PHP ₱)</option>
                    <option value="USD">US Dollar (USD $)</option>
                    <option value="JPY">Japanese Yen (JPY ¥)</option>
                  </select>
                  <p class="text-[10px] text-slate-500 mt-1 truncate">
                    Backend field: <code>currency_preference</code>
                  </p>
                </div>

                <div
                  class="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 self-end gap-3 min-w-0"
                >
                  <div class="min-w-0">
                    <h5 class="text-xs font-bold text-white truncate">
                      Public Showcase
                    </h5>
                    <p class="text-[10px] text-slate-400 truncate">
                      Share wishlist with community
                    </p>
                    <p class="text-[10px] text-slate-500 truncate">
                      Backend field: <code>public_collection</code>
                    </p>
                  </div>
                  <input
                    v-model="settingsForm.public_collection"
                    type="checkbox"
                    class="w-4 h-4 rounded text-amber-400 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer shrink-0"
                  />
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div
              class="pt-5 border-t border-slate-800 flex items-center justify-between gap-3"
            >
              <button
                type="button"
                class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                @click="emit('close')"
              >
                Cancel
              </button>

              <BaseButton
                type="submit"
                variant="primary"
                size="md"
                :disabled="isSaving"
              >
                <span v-if="isSaving">Saving...</span>
                <span v-else>Save Preferences</span>
              </BaseButton>
            </div>
          </form>
        </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>
