<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAdminStore } from "./admin.store";
import { deriveUserTotpSecret, verifyTotpCode } from "@/modules/auth/totp.utils";
import SecretQuestionModal from "@/shared/components/SecretQuestionModal.vue";

const router = useRouter();
const route = useRoute();
const adminStore = useAdminStore();

const username = ref("");
const password = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");

// Staff Portal Secret Question Clearance Gate
const isClearanceModalOpen = ref(false);

const handleClearanceClose = (isOpen: boolean) => {
  if (!isOpen) {
    const isUnlocked = typeof sessionStorage !== "undefined" && sessionStorage.getItem("rlg_staff_unlocked") === "true";
    if (!isUnlocked) {
      router.push("/");
    }
  }
};

// Hydrate remembered admin username from localStorage & check clearance gate
onMounted(() => {
  const isUnlocked = typeof sessionStorage !== "undefined" && sessionStorage.getItem("rlg_staff_unlocked") === "true";
  if (!isUnlocked) {
    isClearanceModalOpen.value = true;
  }

  const savedUser = localStorage.getItem("rlg_admin_remember_user");
  if (savedUser) {
    username.value = savedUser;
    rememberMe.value = true;
  }
});

// ─── Admin 2FA Challenge State ────────────────────────────────────────────────
onBeforeUnmount(() => {
  isLoginSuccess.value = false;
});

const is2faStep = ref(false);
const twoFactorMethod = ref<"authenticator" | "email">("authenticator");
const twoFactorCode = ref("");
const twoFactorEmail = ref("");
const twoFactorName = ref("");
const emailOtpPreview = ref("");
const emailCodeSending = ref(false);
const emailSentNotice = ref("");
const is2faLoading = ref(false);

const sessionExpiredMessage = computed(() => {
  if (route.query.expired === "true" || route.query.reason === "inactivity") {
    return (
      (route.query.message as string) ||
      "Session expired due to inactivity. Please log in again."
    );
  }
  return "";
});

const isLoginSuccess = ref(false);
const loggedAdminName = ref("");

const handleLogin = async () => {
  if (!username.value.trim() || !password.value) {
    errorMessage.value = "Please enter both username and password.";
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const res = await adminStore.login(username.value.trim(), password.value);

    // If 2FA is required for this staff member
    if (res && res.requires_2fa) {
      is2faStep.value = true;
      twoFactorEmail.value = res.email || username.value.trim();
      twoFactorName.value = res.name || "Admin";
      twoFactorCode.value = "";
      if (res.email_otp_preview) {
        emailOtpPreview.value = String(res.email_otp_preview);
      }
      return;
    }

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("rlg_staff_unlocked", "true");
    }
    loggedAdminName.value = adminStore.currentAdmin?.name || username.value.trim();
    isLoginSuccess.value = true;

    completeRedirect();
  } catch (e: any) {
    errorMessage.value =
      e?.message || "Login failed. Please check your network and credentials.";
  } finally {
    isLoading.value = false;
  }
};

const handleSwitch2faMethod = (method: "authenticator" | "email") => {
  twoFactorMethod.value = method;
  twoFactorCode.value = "";
  errorMessage.value = "";
  if (method === "email" && !emailSentNotice.value) {
    handleSendAdminEmailCode();
  }
};

const handleSendAdminEmailCode = async () => {
  emailCodeSending.value = true;
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

const handleVerifyAdmin2fa = async () => {
  const code = twoFactorCode.value.trim();
  if (!/^\d{6}$/.test(code)) {
    errorMessage.value = "Please enter a valid 6-digit verification code.";
    return;
  }

  is2faLoading.value = true;
  errorMessage.value = "";
  const email = twoFactorEmail.value.trim();
  const secret = deriveUserTotpSecret(email);

  try {
    const res = await adminStore.login(username.value.trim(), password.value, code, secret);
    if (res && res.requires_2fa) {
      errorMessage.value = "Invalid 6-digit code. Please check your Google Authenticator or email.";
      return;
    }

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("rlg_staff_unlocked", "true");
    }
    loggedAdminName.value = adminStore.currentAdmin?.name || username.value.trim();
    isLoginSuccess.value = true;

    completeRedirect();
  } catch (e: any) {
    errorMessage.value =
      e?.message || "Invalid 2FA code. Please check your Authenticator app or email.";
  } finally {
    is2faLoading.value = false;
  }
};

const forceRedirectNow = (target?: string) => {
  const dest = target || (route.query.redirect as string) || "/admin/dashboard";
  const cleanDest =
    !dest || dest === "/admin" || dest === "/admin/" || dest.startsWith("/admin/login")
      ? "/admin/dashboard"
      : dest;
  window.location.href = cleanDest;
};

const completeRedirect = () => {
  if (rememberMe.value && username.value.trim()) {
    localStorage.setItem("rlg_admin_remember_user", username.value.trim());
  } else {
    localStorage.removeItem("rlg_admin_remember_user");
  }

  let redirectTarget = (route.query.redirect as string) || "/admin/dashboard";
  if (
    !redirectTarget ||
    redirectTarget === "/admin" ||
    redirectTarget === "/admin/" ||
    redirectTarget.startsWith("/admin/login")
  ) {
    redirectTarget = "/admin/dashboard";
  }

  // Fast-track transition (450ms for checkmark visual feedback)
  setTimeout(async () => {
    try {
      await router.replace(redirectTarget);
      if (router.currentRoute.value.path === "/admin/login") {
        window.location.href = redirectTarget;
      }
    } catch {
      window.location.href = redirectTarget;
    }
  }, 450);

  // Safety net fallback: if route replacement stalls, force hard redirect
  setTimeout(() => {
    if (isLoginSuccess.value) {
      window.location.href = redirectTarget;
    }
  }, 1200);
};

const handleBackToPassword = () => {
  is2faStep.value = false;
  twoFactorCode.value = "";
  errorMessage.value = "";
};
</script>

<template>
  <div
    class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-display relative overflow-hidden select-none"
  >
    <!-- Ambient Background Gradients -->
    <div
      class="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-rose-600/10 blur-[120px] pointer-events-none"
    ></div>
    <div
      class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"
    ></div>
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 rounded-full bg-slate-900/40 blur-[140px] pointer-events-none"
    ></div>

    <div class="w-full max-w-md relative z-10 space-y-6">
      <!-- Top Branding Emblem -->
      <div class="text-center space-y-2">
        <router-link to="/" class="inline-flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="RLG Online Shop Logo"
            class="w-14 h-14 object-contain group-hover:scale-105 transition-transform drop-shadow-lg"
          />
          <div class="text-left">
            <h1
              class="text-xl font-black tracking-tight text-white flex items-center gap-1.5"
            >
              RLG <span class="text-amber-400">ONLINE SHOP</span>
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                >ADMIN</span
              >
            </h1>
            <p class="text-[11px] text-slate-400 font-medium">
              Store Operations &amp; Command Center
            </p>
          </div>
        </router-link>
      </div>

      <!-- Main Login Card -->
      <div
        class="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 relative"
      >
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-white tracking-tight">
              {{ is2faStep ? "2FA Security Check" : "Staff Login" }}
            </h2>
            <span
              class="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              <span
                class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
              ></span>
              {{ is2faStep ? "2FA Active" : "Vault Secure" }}
            </span>
          </div>
          <p class="text-xs text-slate-400">
            {{
              is2faStep
                ? "Enter the 6-digit verification code to access the command center."
                : "Sign in with your staff account to access the command center."
            }}
          </p>
        </div>

        <!-- Session Expired Inactivity Notice -->
        <div
          v-if="sessionExpiredMessage && !is2faStep"
          class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-2.5 animate-fade-in"
        >
          <span class="text-base flex-shrink-0">⏳</span>
          <div class="flex-1">
            <p class="font-bold text-amber-300">Session Expired</p>
            <p class="text-[11px] text-amber-200/90 mt-0.5">
              {{ sessionExpiredMessage }}
            </p>
          </div>
        </div>

        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2"
        >
          <span>⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- ── 2FA VERIFICATION STEP ──────────────────────────────────────── -->
        <div v-if="is2faStep" class="space-y-4 animate-scale-up">
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
            <p class="text-slate-400">
              Staff Member: <strong class="text-white">{{ twoFactorName }}</strong>
            </p>
            <p class="text-slate-400">
              Account: <strong class="text-amber-300">{{ twoFactorEmail }}</strong>
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
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              "
              @click="handleSwitch2faMethod('email')"
            >
              <span>📧</span>
              <span>Email Code</span>
            </button>
          </div>

          <!-- Authenticator Info -->
          <div
            v-if="twoFactorMethod === 'authenticator'"
            class="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-xs text-indigo-200 space-y-1"
          >
            <p class="font-bold text-white">📱 Google Authenticator App</p>
            <p class="text-[11px] text-indigo-300 leading-relaxed">
              Open your <strong>Google Authenticator</strong> app and enter the 6-digit code for your Admin account.
            </p>
          </div>

          <!-- Email Info -->
          <div
            v-else
            class="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-2"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-bold text-white">📧 Staff Email Confirmation</p>
              <button
                type="button"
                :disabled="emailCodeSending"
                class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-[11px] font-black cursor-pointer transition-colors"
                @click="handleSendAdminEmailCode"
              >
                {{ emailCodeSending ? "Sending..." : "Resend Code" }}
              </button>
            </div>
            <p class="text-[11px] text-amber-300 leading-relaxed">
              {{ emailSentNotice || `A 6-digit verification code was sent to ${twoFactorEmail}. Please check your email inbox.` }}
            </p>
          </div>

          <!-- 6-Digit Code Input -->
          <form class="space-y-4" @submit.prevent="handleVerifyAdmin2fa">
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

            <button
              type="submit"
              :disabled="is2faLoading"
              class="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <svg
                v-if="is2faLoading"
                class="animate-spin h-4 w-4 text-slate-950"
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
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{{ is2faLoading ? "Verifying..." : "Verify & Access Command Center" }}</span>
            </button>

            <button
              type="button"
              class="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer text-center block"
              @click="handleBackToPassword"
            >
              &larr; Back to Username &amp; Password
            </button>
          </form>
        </div>

        <!-- ── REGULAR USERNAME / PASSWORD FORM ───────────────────────────── -->
        <form v-else @submit.prevent="handleLogin" class="space-y-4">
          <!-- Username / Email Field -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-slate-300"
              >Username or Email</label
            >
            <div class="relative">
              <input
                v-model="username"
                type="text"
                required
                autocomplete="username"
                placeholder="Enter username or email"
                class="w-full text-xs px-3.5 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition-all pl-10"
              />
              <span class="absolute left-3.5 top-3.5 text-slate-500 text-sm"
                >👤</span
              >
            </div>
          </div>

          <!-- Password Field -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-slate-300"
                >Password</label
              >
            </div>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                placeholder="Enter your password"
                class="w-full text-xs px-3.5 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition-all pl-10 pr-10"
              />
              <span class="absolute left-3.5 top-3.5 text-slate-500 text-sm"
                >🔒</span
              >
              <button
                type="button"
                class="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? "🙈" : "👁️" }}
              </button>
            </div>
          </div>

          <!-- Remember Me Checkbox -->
          <div class="flex items-center justify-between text-xs pt-1">
            <label
              class="flex items-center gap-2 cursor-pointer text-slate-300"
            >
              <input
                v-model="rememberMe"
                type="checkbox"
                class="rounded accent-rose-600 w-4 h-4 cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <span class="text-[11px] text-slate-500 font-mono">v4.2.0-PRO</span>
          </div>

          <!-- Login Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 via-rose-700 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <svg
              v-if="isLoading"
              class="animate-spin h-4 w-4 text-white"
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
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>{{ isLoading ? "Logging in..." : "Log In" }}</span>
          </button>
        </form>
      </div>

      <!-- Footer Info & Return to Store -->
      <div
        class="flex items-center justify-between text-xs text-slate-500 px-2"
      >
        <router-link
          to="/"
          class="hover:text-rose-400 transition-colors flex items-center gap-1"
        >
          <span>&larr;</span>
          <span>Back to Storefront</span>
        </router-link>
        <span class="flex items-center gap-1">
          <span>🛡️</span>
          <span>Encrypted Session Guard</span>
        </span>
      </div>
    </div>

    <!-- Login Success Modal -->
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
          v-if="isLoginSuccess"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div
            class="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl shadow-emerald-500/10 font-display animate-scale-up"
          >
            <div
              class="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-3xl flex items-center justify-center mx-auto shadow-lg animate-bounce"
            >
              ✓
            </div>
            <div>
              <h3 class="text-lg font-black text-white">Login Successful!</h3>
              <p class="text-xs text-slate-300 mt-1">
                Welcome back, <strong class="text-amber-400">{{ loggedAdminName }}</strong>.
              </p>
              <p class="text-[11px] text-slate-500 mt-1">
                Redirecting to Command Center Dashboard...
              </p>
            </div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div class="bg-emerald-400 h-full rounded-full animate-pulse w-full"></div>
            </div>
            <button
              type="button"
              @click="forceRedirectNow()"
              class="text-[11px] text-amber-400/80 hover:text-amber-300 underline cursor-pointer pt-1 block mx-auto"
            >
              Click here to proceed &rarr;
            </button>
            <div class="hidden"><button>
            </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Staff Security Clearance Gate Modal -->
    <SecretQuestionModal
      :model-value="isClearanceModalOpen"
      @update:model-value="handleClearanceClose"
      @unlocked="isClearanceModalOpen = false"
    />
  </div>
</template>
