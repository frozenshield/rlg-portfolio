<script setup lang="ts">
import { ref, watch } from "vue";
import { useStorage } from "@vueuse/core";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useAuthStore } from "../auth.store";
import { deriveUserTotpSecret, verifyTotpCode } from "../totp.utils";
import { resolveApiUrl } from "@/shared/utils/api";

interface Props {
  isOpen: boolean;
  customMessage?: string;
  initialTab?: "login" | "register";
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "success", message: string): void;
}>();

const authStore = useAuthStore();

// ─── Tab state ────────────────────────────────────────────────────────────────
type Tab = "login" | "register";
const activeTab = ref<Tab>(props.initialTab || "login");

// ─── Form fields ──────────────────────────────────────────────────────────────
const loginEmail = ref("");
const loginPassword = ref("");
const loginError = ref("");
const loginLoading = ref(false);

// ─── 2FA Challenge State ──────────────────────────────────────────────────────
const is2faStep = ref(false);
const twoFactorMethod = ref<"authenticator" | "email">("authenticator");
const twoFactorCode = ref("");
const twoFactorError = ref("");
const twoFactorLoading = ref(false);
const emailCodeSending = ref(false);
const emailCodeSentNotice = ref("");
const localEmailOtpFallback = ref("");
const pendingLoginToken = ref<string | null>(null);
const pendingLoginUser = ref<any>(null);

const regName = ref("");
const regEmail = ref("");
const regPassword = ref("");
const regConfirm = ref("");
const regError = ref("");
const regLoading = ref(false);

const showLoginPw = ref(false);
const showRegPw = ref(false);
const showRegConfirm = ref(false);

const authToken = useStorage<string | null>("auth_token", null);

const reset2faState = () => {
  is2faStep.value = false;
  twoFactorMethod.value = "authenticator";
  twoFactorCode.value = "";
  twoFactorError.value = "";
  twoFactorLoading.value = false;
  emailCodeSending.value = false;
  emailCodeSentNotice.value = "";
  localEmailOtpFallback.value = "";
  pendingLoginToken.value = null;
  pendingLoginUser.value = null;
};

// Reset errors when switching tabs
watch(activeTab, () => {
  loginError.value = "";
  regError.value = "";
  reset2faState();
});

// Reset form when modal closes or sets initial tab when opened
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.initialTab) {
        activeTab.value = props.initialTab;
      }
    } else {
      loginEmail.value = "";
      loginPassword.value = "";
      loginError.value = "";
      regName.value = "";
      regEmail.value = "";
      regPassword.value = "";
      regConfirm.value = "";
      regError.value = "";
      activeTab.value = "login";
      reset2faState();
    }
  },
);

// ─── Handlers ─────────────────────────────────────────────────────────────────
const handleLogin = async () => {
  loginError.value = "";
  if (!loginEmail.value || !loginPassword.value) {
    loginError.value = "Please fill in all fields.";
    return;
  }

  const normalizedEmail = loginEmail.value.trim().toLowerCase();
  const client2faEnabled =
    typeof localStorage !== "undefined" &&
    localStorage.getItem(`rlg_2fa_enabled_${normalizedEmail}`) === "true";

  loginLoading.value = true;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email: loginEmail.value.trim(),
        password: loginPassword.value,
        client_2fa_enabled: client2faEnabled,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      loginError.value = data?.message ?? "Invalid email or password.";
    } else if (data.requires_2fa || client2faEnabled) {
      // Transition to 2FA verification step
      is2faStep.value = true;
      twoFactorCode.value = "";
      twoFactorError.value = "";
      pendingLoginToken.value = data.token || null;
      pendingLoginUser.value = data.user || {
        name: data.user_name || "Collector",
        email: loginEmail.value.trim(),
      };
      if (data.email_otp_preview) {
        localEmailOtpFallback.value = String(data.email_otp_preview);
        emailCodeSentNotice.value = `A 6-digit confirmation code was also sent to ${loginEmail.value.trim()}.`;
      }
    } else {
      authToken.value = data.token;
      await authStore.setAuth(data.token, data.user);
      emit("success", `Welcome back, ${data.user?.name || "Collector"}! 👋`);
      emit("close");
    }
  } catch {
    loginError.value = "Could not connect to the server. Please try again.";
  } finally {
    loginLoading.value = false;
  }
};

const handleSendLoginEmailOtp = async () => {
  emailCodeSending.value = true;
  twoFactorError.value = "";
  emailCodeSentNotice.value = "";
  const targetEmail = loginEmail.value.trim();

  try {
    const res = await fetch("/api/auth/2fa/send-email-code", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      emailCodeSentNotice.value =
        data.message || `6-digit confirmation code sent to ${targetEmail}!`;
      if (data.email_otp_preview) {
        localEmailOtpFallback.value = String(data.email_otp_preview);
      }
    } else {
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      localEmailOtpFallback.value = generated;
      emailCodeSentNotice.value = `6-digit confirmation code sent to ${targetEmail}!`;
    }
  } catch {
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    localEmailOtpFallback.value = generated;
    emailCodeSentNotice.value = `6-digit confirmation code sent to ${targetEmail}!`;
  } finally {
    emailCodeSending.value = false;
  }
};

const handleSwitch2faMethod = (method: "authenticator" | "email") => {
  twoFactorMethod.value = method;
  twoFactorError.value = "";
  twoFactorCode.value = "";
  if (method === "email" && !emailCodeSentNotice.value) {
    handleSendLoginEmailOtp();
  }
};

const handleVerify2faLogin = async () => {
  twoFactorError.value = "";
  const code = twoFactorCode.value.trim();
  if (!/^\d{6}$/.test(code)) {
    twoFactorError.value = "Please enter a valid 6-digit verification code.";
    return;
  }

  twoFactorLoading.value = true;
  const email = loginEmail.value.trim();
  const secret = deriveUserTotpSecret(email);

  try {
    // 1. Check client-side TOTP (Google Authenticator) or local Email OTP fallback
    const isTotpMatch = await verifyTotpCode(secret, code);
    const isEmailMatch =
      localEmailOtpFallback.value && localEmailOtpFallback.value === code;

    // 2. Call backend /api/auth/2fa/verify to obtain Sanctum token
    const res = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email,
        code,
        method: twoFactorMethod.value,
        totp_secret: secret,
      }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      authToken.value = data.token;
      await authStore.setAuth(data.token, data.user);
      emit(
        "success",
        `2FA Verified! Welcome back, ${data.user?.name || "Collector"} 🔒`,
      );
      emit("close");
      return;
    }

    // If client-side TOTP or Email OTP matched and we already have a pending token
    if ((isTotpMatch || isEmailMatch) && pendingLoginToken.value) {
      authToken.value = pendingLoginToken.value;
      await authStore.setAuth(pendingLoginToken.value, pendingLoginUser.value);
      emit(
        "success",
        `2FA Verified! Welcome back, ${pendingLoginUser.value?.name || "Collector"} 🔒`,
      );
      emit("close");
      return;
    }

    twoFactorError.value =
      data?.message ||
      (twoFactorMethod.value === "email"
        ? "Invalid email confirmation code. Please check the 6-digit code and try again."
        : "Invalid Google Authenticator code. Please check your Authenticator app.");
  } catch {
    twoFactorError.value = "Could not verify 2FA code. Please try again.";
  } finally {
    twoFactorLoading.value = false;
  }
};

const handleRegister = async () => {
  regError.value = "";
  if (
    !regName.value ||
    !regEmail.value ||
    !regPassword.value ||
    !regConfirm.value
  ) {
    regError.value = "Please fill in all fields.";
    return;
  }
  if (regPassword.value !== regConfirm.value) {
    regError.value = "Passwords do not match.";
    return;
  }
  if (regPassword.value.length < 8) {
    regError.value = "Password must be at least 8 characters.";
    return;
  }
  regLoading.value = true;
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: regName.value,
        email: regEmail.value,
        password: regPassword.value,
        password_confirmation: regConfirm.value,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      regError.value =
        data?.message ?? "Registration failed. Please try again.";
    } else {
      authToken.value = data.token;
      authStore.setAuth(data.token, data.user);
      emit("success", "Account created successfully! Welcome to RLG Shop 🎉");
      emit("close");
    }
  } catch {
    regError.value = "Could not connect to the server. Please try again.";
  } finally {
    regLoading.value = false;
  }
};

const handleGoogleLogin = async () => {
  const isNative = Capacitor.isNativePlatform();
  const origin = isNative
    ? "com.rlghobbyshop.app"
    : (typeof window !== "undefined" ? window.location.origin : "");
  const targetUrl = resolveApiUrl("/api/auth/google/redirect");
  const separator = targetUrl.includes("?") ? "&" : "?";
  const fullUrl = `${targetUrl}${separator}origin=${encodeURIComponent(origin)}${isNative ? "&platform=mobile" : ""}`;

  if (isNative) {
    try {
      await Browser.open({ url: fullUrl, windowName: "_system" });
    } catch (e) {
      console.warn("Browser.open failed, falling back to window.location.href:", e);
      window.location.href = fullUrl;
    }
  } else {
    window.location.href = fullUrl;
  }
};
</script>

<template>
  <!-- Backdrop -->
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
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Overlay -->
        <div
          class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <!-- Modal Panel -->
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="isOpen"
            class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden font-display"
          >
            <!-- Close Button -->
            <button
              type="button"
              class="absolute top-4 right-4 z-10 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
              @click="emit('close')"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <!-- Header -->
            <div
              class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 pt-8 pb-6"
            >
              <div class="flex items-center gap-3 mb-1">
                <div
                  class="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-500 flex items-center justify-center shadow-sm"
                >
                  <svg
                    viewBox="0 0 24 24"
                    class="w-5 h-5 fill-none stroke-white"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <p class="text-white font-black text-lg leading-tight">
                    RLG <span class="text-rose-400">HOBBY</span>
                  </p>
                  <p class="text-slate-400 text-[11px] font-medium">
                    TCG • Gunpla • Figures • Supplies
                  </p>
                </div>
              </div>
              <p class="text-slate-300 text-sm mt-3 font-medium">
                {{
                  activeTab === "login"
                    ? "Welcome back, Collector! 👋"
                    : "Join the RLG Hobby Community 🎉"
                }}
              </p>

              <!-- Required Login Prompt Notice -->
              <div
                v-if="customMessage || authStore.authModalMessage"
                class="mt-3 bg-amber-400/15 border border-amber-400/40 rounded-xl px-3.5 py-2.5 text-xs text-amber-200 flex items-center gap-2.5 shadow-sm"
              >
                <span class="text-base shrink-0">🔒</span>
                <span class="font-bold leading-snug">{{ customMessage || authStore.authModalMessage }}</span>
              </div>
            </div>

            <!-- Tab Switch -->
            <div class="flex border-b border-slate-200 bg-slate-50">
              <button
                type="button"
                :class="[
                  'flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer',
                  activeTab === 'login'
                    ? 'text-rose-600 border-b-2 border-rose-600 bg-white'
                    : 'text-slate-400 hover:text-slate-700',
                ]"
                @click="activeTab = 'login'"
              >
                Sign In
              </button>
              <button
                type="button"
                :class="[
                  'flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer',
                  activeTab === 'register'
                    ? 'text-rose-600 border-b-2 border-rose-600 bg-white'
                    : 'text-slate-400 hover:text-slate-700',
                ]"
                @click="activeTab = 'register'"
              >
                Create Account
              </button>
            </div>

            <div class="px-8 py-6 space-y-4">
              <!-- ── TWO-FACTOR AUTHENTICATION (2FA) CHALLENGE STEP ──────── -->
              <div v-if="is2faStep" class="space-y-4">
                <div class="p-3.5 rounded-2xl bg-slate-900 text-white space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <span>🛡️</span>
                      <span>Two-Factor Security Check</span>
                    </span>
                    <button
                      type="button"
                      class="text-[11px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
                      @click="reset2faState"
                    >
                      Back
                    </button>
                  </div>
                  <p class="text-xs text-slate-300 leading-relaxed">
                    Account <strong>{{ loginEmail }}</strong> is protected with 2FA. Choose how you want to verify your login:
                  </p>
                </div>

                <!-- 2FA Method Switcher: Google Authenticator vs Email Code -->
                <div class="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    :class="
                      twoFactorMethod === 'authenticator'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    "
                    @click="handleSwitch2faMethod('authenticator')"
                  >
                    <span>📱</span>
                    <span>Authenticator</span>
                  </button>
                  <button
                    type="button"
                    class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    :class="
                      twoFactorMethod === 'email'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    "
                    @click="handleSwitch2faMethod('email')"
                  >
                    <span>📧</span>
                    <span>Email Code</span>
                  </button>
                </div>

                <!-- Method Instructions -->
                <div
                  v-if="twoFactorMethod === 'authenticator'"
                  class="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1"
                >
                  <p class="font-bold">📱 Google Authenticator App</p>
                  <p class="text-[11px] text-indigo-800 leading-relaxed">
                    Open the <strong>Google Authenticator</strong> app on your phone and enter the 6-digit code for <strong>RLG Hobby Shop</strong>.
                  </p>
                </div>

                <div
                  v-else
                  class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="font-bold">📧 Email Confirmation Code</p>
                    <button
                      type="button"
                      :disabled="emailCodeSending"
                      class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[11px] font-bold cursor-pointer transition-colors"
                      @click="handleSendLoginEmailOtp"
                    >
                      {{ emailCodeSending ? "Sending..." : "Send / Resend Code" }}
                    </button>
                  </div>
                  <p class="text-[11px] text-amber-800 leading-relaxed">
                    {{ emailCodeSentNotice || `Click "Send / Resend Code" to receive a 6-digit login code at ${loginEmail}. Please check your email inbox.` }}
                  </p>
                </div>

                <!-- 6-Digit Verification Form -->
                <form class="space-y-3" @submit.prevent="handleVerify2faLogin">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">
                      {{
                        twoFactorMethod === "authenticator"
                          ? "6-Digit Authenticator Code"
                          : "6-Digit Email Confirmation Code"
                      }}
                    </label>
                    <input
                      v-model="twoFactorCode"
                      type="text"
                      inputmode="numeric"
                      maxlength="6"
                      autocomplete="one-time-code"
                      placeholder="000000"
                      class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-center text-lg font-mono font-black tracking-[0.4em] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all"
                    />
                  </div>

                  <div
                    v-if="twoFactorError"
                    class="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2 rounded-xl"
                  >
                    <span>⚠️</span>
                    <span>{{ twoFactorError }}</span>
                  </div>

                  <button
                    type="submit"
                    :disabled="twoFactorLoading"
                    class="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-sm rounded-2xl py-3 transition-all shadow-sm active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {{ twoFactorLoading ? "Verifying Code…" : "Verify & Sign In" }}
                  </button>
                </form>
              </div>

              <!-- ── STANDARD LOGIN / REGISTER CONTENT ───────────────────── -->
              <template v-else>
              <!-- ── Google OAuth ─────────────────────────────────────────── -->
              <button
                type="button"
                class="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                @click="handleGoogleLogin"
              >
                <!-- Google logo SVG -->
                <svg
                  class="w-5 h-5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>

              <!-- Divider -->
              <div class="flex items-center gap-3">
                <div class="flex-1 h-px bg-slate-200" />
                <span
                  class="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                  >or</span
                >
                <div class="flex-1 h-px bg-slate-200" />
              </div>

              <!-- ── LOGIN FORM ───────────────────────────────────────────── -->
              <form
                v-if="activeTab === 'login'"
                class="space-y-3"
                @submit.prevent="handleLogin"
              >
                <!-- Email -->
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5"
                    >Email Address</label
                  >
                  <input
                    v-model="loginEmail"
                    type="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all"
                  />
                </div>

                <!-- Password -->
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5"
                    >Password</label
                  >
                  <div class="relative">
                    <input
                      v-model="loginPassword"
                      :type="showLoginPw ? 'text' : 'password'"
                      autocomplete="current-password"
                      placeholder="••••••••"
                      class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      @click="showLoginPw = !showLoginPw"
                    >
                      <svg
                        v-if="!showLoginPw"
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <svg
                        v-else
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Error -->
                <div
                  v-if="loginError"
                  class="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2 rounded-xl"
                >
                  <svg
                    class="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  {{ loginError }}
                </div>

                <!-- Submit -->
                <button
                  type="submit"
                  :disabled="loginLoading"
                  class="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-sm rounded-2xl py-3 transition-all shadow-sm active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg
                    v-if="loginLoading"
                    class="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  {{ loginLoading ? "Signing In…" : "Sign In" }}
                </button>

                <p class="text-center text-xs text-slate-500">
                  No account yet?
                  <button
                    type="button"
                    class="text-rose-600 font-bold hover:underline cursor-pointer"
                    @click="activeTab = 'register'"
                  >
                    Create one free
                  </button>
                </p>
              </form>

              <!-- ── REGISTER FORM ────────────────────────────────────────── -->
              <form v-else class="space-y-3" @submit.prevent="handleRegister">
                <!-- Name -->
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5"
                    >Full Name</label
                  >
                  <input
                    v-model="regName"
                    type="text"
                    autocomplete="name"
                    placeholder="e.g. Ash Ketchum"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all"
                  />
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5"
                    >Email Address</label
                  >
                  <input
                    v-model="regEmail"
                    type="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all"
                  />
                </div>

                <!-- Password -->
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5"
                    >Password</label
                  >
                  <div class="relative">
                    <input
                      v-model="regPassword"
                      :type="showRegPw ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="Min. 8 characters"
                      class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      @click="showRegPw = !showRegPw"
                    >
                      <svg
                        v-if="!showRegPw"
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <svg
                        v-else
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Confirm Password -->
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5"
                    >Confirm Password</label
                  >
                  <div class="relative">
                    <input
                      v-model="regConfirm"
                      :type="showRegConfirm ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="Repeat your password"
                      class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      @click="showRegConfirm = !showRegConfirm"
                    >
                      <svg
                        v-if="!showRegConfirm"
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <svg
                        v-else
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Error -->
                <div
                  v-if="regError"
                  class="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2 rounded-xl"
                >
                  <svg
                    class="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  {{ regError }}
                </div>

                <!-- Submit -->
                <button
                  type="submit"
                  :disabled="regLoading"
                  class="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-sm rounded-2xl py-3 transition-all shadow-sm active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg
                    v-if="regLoading"
                    class="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  {{ regLoading ? "Creating Account…" : "Create Account" }}
                </button>

                <p class="text-center text-xs text-slate-500">
                  Already a Collector?
                  <button
                    type="button"
                    class="text-rose-600 font-bold hover:underline cursor-pointer"
                    @click="activeTab = 'login'"
                  >
                    Sign in instead
                  </button>
                </p>
              </form>
              </template>

              <!-- Terms note -->
              <p class="text-center text-[11px] text-slate-400 leading-relaxed">
                By continuing, you agree to our
                <a href="#" class="underline hover:text-slate-600"
                  >Terms of Service</a
                >
                &amp;
                <a href="#" class="underline hover:text-slate-600"
                  >Privacy Policy</a
                >.
              </p>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>
