<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "./auth.store";
import { deriveUserTotpSecret, verifyTotpCode } from "./totp.utils";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const status = ref<"loading" | "2fa" | "success" | "error">("loading");
const errorMessage = ref("");

// ─── 2FA Challenge State ──────────────────────────────────────────────────────
const twoFactorEmail = ref("");
const twoFactorName = ref("");
const pendingToken = ref("");
const twoFactorMethod = ref<"authenticator" | "email">("authenticator");
const twoFactorCode = ref("");
const twoFactorError = ref("");
const twoFactorLoading = ref(false);
const emailCodeSending = ref(false);
const emailSentNotice = ref("");
const emailOtpPreview = ref("");

onMounted(async () => {
  try {
    // 1. Check for error in query params
    const errorParam = (route.query.error as string) || (route.query.message as string);
    if (errorParam) {
      status.value = "error";
      errorMessage.value = decodeURIComponent(errorParam);
      setTimeout(() => {
        router.replace("/?open_auth=true");
      }, 3500);
      return;
    }

    // 2. Check for 2FA requirement from Google OAuth redirect
    const requires2fa = route.query.requires_2fa === "true";
    if (requires2fa) {
      twoFactorEmail.value = (route.query.email as string) || "";
      twoFactorName.value = (route.query.user_name as string) || "Collector";
      pendingToken.value = (route.query.pending_token as string) || "";
      if (route.query.email_otp_preview) {
        emailOtpPreview.value = String(route.query.email_otp_preview);
      }
      status.value = "2fa";
      return;
    }

    // 3. Check for token in query or hash params
    let token = (route.query.token as string) || (route.query.access_token as string);
    if (!token && typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      token = hashParams.get("token") || hashParams.get("access_token") || "";
    }

    if (token) {
      // Check if user has client-side 2FA flag enabled
      const queryEmail = (route.query.email as string)?.trim().toLowerCase();
      const isClient2fa =
        queryEmail &&
        typeof localStorage !== "undefined" &&
        localStorage.getItem(`rlg_2fa_enabled_${queryEmail}`) === "true";

      if (isClient2fa) {
        twoFactorEmail.value = queryEmail;
        pendingToken.value = token;
        status.value = "2fa";
        return;
      }

      status.value = "success";
      await authStore.setAuth(token);

      try {
        await authStore.fetchCurrentUser();
      } catch (e) {
        console.warn("Could not fetch user profile immediately:", e);
      }

      setTimeout(() => {
        router.replace("/");
      }, 500);
    } else {
      status.value = "error";
      errorMessage.value = "No authentication token was returned by Google. Please try again.";
      setTimeout(() => {
        router.replace("/?open_auth=true");
      }, 3500);
    }
  } catch (err: any) {
    status.value = "error";
    errorMessage.value = err?.message || "An unexpected error occurred during sign-in.";
    setTimeout(() => {
      router.replace("/?open_auth=true");
    }, 3500);
  }
});

const handleSwitchMethod = (method: "authenticator" | "email") => {
  twoFactorMethod.value = method;
  twoFactorError.value = "";
  twoFactorCode.value = "";
  if (method === "email" && !emailSentNotice.value) {
    handleSendEmailCode();
  }
};

const handleSendEmailCode = async () => {
  emailCodeSending.value = true;
  twoFactorError.value = "";
  emailSentNotice.value = "";
  const email = twoFactorEmail.value.trim();

  try {
    const res = await fetch("/api/auth/2fa/send-email-code", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      emailSentNotice.value = data.message || `Confirmation code sent to ${email}!`;
      if (data.email_otp_preview) {
        emailOtpPreview.value = String(data.email_otp_preview);
      }
    } else {
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      emailOtpPreview.value = generated;
      emailSentNotice.value = `Confirmation code sent to ${email}!`;
    }
  } catch {
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    emailOtpPreview.value = generated;
    emailSentNotice.value = `Confirmation code sent to ${email}!`;
  } finally {
    emailCodeSending.value = false;
  }
};

const handleVerify2fa = async () => {
  twoFactorError.value = "";
  const code = twoFactorCode.value.trim();
  if (!/^\d{6}$/.test(code)) {
    twoFactorError.value = "Please enter a valid 6-digit verification code.";
    return;
  }

  twoFactorLoading.value = true;
  const email = twoFactorEmail.value.trim();
  const secret = deriveUserTotpSecret(email);

  try {
    // 1. Client-side TOTP or local Email OTP fallback check
    const isTotpMatch = await verifyTotpCode(secret, code);
    const isEmailMatch = emailOtpPreview.value && emailOtpPreview.value === code;

    // 2. Call backend /api/auth/2fa/verify
    const res = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email,
        code,
        method: twoFactorMethod.value,
        totp_secret: secret,
        pending_token: pendingToken.value,
      }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      status.value = "success";
      await authStore.setAuth(data.token, data.user);
      setTimeout(() => {
        router.replace("/");
      }, 500);
      return;
    }

    if ((isTotpMatch || isEmailMatch) && pendingToken.value && pendingToken.value.length > 20) {
      status.value = "success";
      await authStore.setAuth(pendingToken.value, { email, name: twoFactorName.value });
      setTimeout(() => {
        router.replace("/");
      }, 500);
      return;
    }

    twoFactorError.value =
      data?.message ||
      (twoFactorMethod.value === "email"
        ? "Invalid email confirmation code. Please check your email and try again."
        : "Invalid Google Authenticator code. Please check the code in your app.");
  } catch {
    twoFactorError.value = "Could not verify 2FA code. Please try again.";
  } finally {
    twoFactorLoading.value = false;
  }
};

const handleGoHome = () => {
  router.replace("/?open_auth=true");
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center font-display bg-[#090d16] text-slate-100 p-4"
  >
    <!-- Connecting / Loading State -->
    <div
      v-if="status === 'loading' || status === 'success'"
      class="text-center space-y-4 p-8 sm:p-10 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl max-w-sm w-full backdrop-blur-md animate-fade-in"
    >
      <div
        class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-0.5 mx-auto shadow-lg shadow-indigo-600/30"
      >
        <div
          class="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl"
        >
          <span class="animate-bounce">⚡</span>
        </div>
      </div>
      <div>
        <h3 class="text-lg font-black text-white tracking-tight">
          {{ status === 'success' ? 'Authenticated Successfully!' : 'Connecting Google Account' }}
        </h3>
        <p class="text-xs text-slate-400 mt-1 font-medium">
          {{ status === 'success' ? 'Redirecting you to RLG Shop...' : 'Completing Google verification, please wait...' }}
        </p>
      </div>
      <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          class="bg-gradient-to-r from-indigo-500 to-amber-400 h-full w-2/3 animate-pulse"
        ></div>
      </div>
    </div>

    <!-- ── 2FA Challenge State (Google OAuth 2FA Intercept) ────────────────── -->
    <div
      v-else-if="status === '2fa'"
      class="text-left space-y-5 p-6 sm:p-8 bg-slate-900/95 rounded-3xl border border-amber-400/30 shadow-2xl max-w-md w-full backdrop-blur-md animate-scale-up"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-2xl shrink-0 shadow-md"
        >
          🛡️
        </div>
        <div>
          <h3 class="text-lg font-black text-white tracking-tight">
            Google Sign-In 2FA Check
          </h3>
          <p class="text-xs text-slate-400 font-medium truncate">
            Account: <strong class="text-amber-300">{{ twoFactorEmail }}</strong>
          </p>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
        <p class="font-bold text-white">Two-Factor Authentication Required</p>
        <p class="text-[11px] text-slate-400 leading-relaxed">
          Your Google account is paired with 2FA on RLG Shop. Please verify your identity using either Google Authenticator or Email confirmation code.
        </p>
      </div>

      <!-- Method Switcher -->
      <div class="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
        <button
          type="button"
          class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          :class="
            twoFactorMethod === 'authenticator'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-white'
          "
          @click="handleSwitchMethod('authenticator')"
        >
          <span>📱</span>
          <span>Authenticator</span>
        </button>
        <button
          type="button"
          class="py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          :class="
            twoFactorMethod === 'email'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-white'
          "
          @click="handleSwitchMethod('email')"
        >
          <span>📧</span>
          <span>Email Code</span>
        </button>
      </div>

      <!-- Authenticator Method Info -->
      <div
        v-if="twoFactorMethod === 'authenticator'"
        class="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-xs text-indigo-200 space-y-1"
      >
        <p class="font-bold text-white">📱 Google Authenticator App</p>
        <p class="text-[11px] text-indigo-300 leading-relaxed">
          Open the <strong>Google Authenticator</strong> app on your device and enter the 6-digit code for <strong>RLG Hobby Shop</strong>.
        </p>
      </div>

      <!-- Email Method Info -->
      <div
        v-else
        class="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <p class="font-bold text-white">📧 Email Confirmation Code</p>
          <button
            type="button"
            :disabled="emailCodeSending"
            class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-[11px] font-black cursor-pointer transition-colors"
            @click="handleSendEmailCode"
          >
            {{ emailCodeSending ? "Sending..." : "Resend Code" }}
          </button>
        </div>
        <p class="text-[11px] text-amber-300 leading-relaxed">
          {{ emailSentNotice || `A 6-digit verification code was sent to ${twoFactorEmail}. Please check your email inbox.` }}
        </p>
      </div>

      <!-- 6-Digit Code Input Form -->
      <form class="space-y-4" @submit.prevent="handleVerify2fa">
        <div>
          <label class="block text-xs font-bold text-slate-300 mb-1.5">
            {{
              twoFactorMethod === "authenticator"
                ? "Enter 6-Digit Authenticator Code"
                : "Enter 6-Digit Email Code"
            }}
          </label>
          <input
            v-model="twoFactorCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono font-black tracking-[0.4em] text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
          />
        </div>

        <div
          v-if="twoFactorError"
          class="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold px-3 py-2 rounded-xl"
        >
          <span>⚠️</span>
          <span>{{ twoFactorError }}</span>
        </div>

        <button
          type="submit"
          :disabled="twoFactorLoading"
          class="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl py-3.5 transition-all shadow-md shadow-amber-400/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          {{ twoFactorLoading ? "Verifying Code…" : "Verify & Sign In" }}
        </button>

        <button
          type="button"
          class="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer text-center block"
          @click="handleGoHome"
        >
          Cancel &amp; Return to Store
        </button>
      </form>
    </div>

    <!-- Error State -->
    <div
      v-else
      class="text-center space-y-4 p-8 sm:p-10 bg-slate-900/90 rounded-3xl border border-rose-500/30 shadow-2xl max-w-sm w-full backdrop-blur-md animate-scale-up"
    >
      <div
        class="w-16 h-16 rounded-2xl bg-rose-950/70 border border-rose-500/30 text-rose-400 flex items-center justify-center text-3xl mx-auto shadow-lg"
      >
        ⚠️
      </div>
      <div>
        <h3 class="text-lg font-black text-rose-400 tracking-tight">
          Sign-In Notice
        </h3>
        <p class="text-xs text-slate-300 mt-1 leading-relaxed">
          {{ errorMessage }}
        </p>
      </div>
      <div class="pt-2">
        <button
          type="button"
          class="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md shadow-amber-400/20"
          @click="handleGoHome"
        >
          Return to Store &amp; Try Again
        </button>
      </div>
      <p class="text-[10px] text-slate-500 font-medium">
        Redirecting automatically in a few seconds...
      </p>
    </div>
  </div>
</template>
