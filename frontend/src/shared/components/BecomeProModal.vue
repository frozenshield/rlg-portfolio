<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/modules/auth/auth.store";

const props = defineProps<{
  modelValue?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void;
  (e: "subscribed"): void;
}>();

const router = useRouter();
const authStore = useAuthStore();

// Modal Stages: 'perks' -> 'payment' -> 'success'
const modalStep = ref<"perks" | "payment" | "success">("perks");

// Payment Session State
const isGeneratingQr = ref(false);
const isVerifying = ref(false);
const paymentIntentId = ref<string | null>(null);
const orderNumber = ref<string>("");
const qrImageUrl = ref<string>("");
const qrString = ref<string>("");
const paymentError = ref<string>("");
const pollTimer = ref<any>(null);

// 6 Exclusive Collector Perks with Cool Icons & Descriptions
const collectorPerks = [
  {
    icon: "🛡️",
    badge: "AI GRADING",
    title: "Free access to the grader feature",
    subtitle: "Automated subgrades for centering, corners, edges & surface.",
    gradient: "from-blue-500/20 to-indigo-500/20",
    border: "border-blue-400/40",
    badgeBg: "bg-blue-400/20 text-blue-300",
  },
  {
    icon: "🏷️",
    badge: "VIP PRICING",
    title: "Free access with special promotion price",
    subtitle: "Unlock member-only discounts on rare booster boxes & slabs.",
    gradient: "from-amber-500/20 to-yellow-500/20",
    border: "border-amber-400/40",
    badgeBg: "bg-amber-400/20 text-amber-300",
  },
  {
    icon: "⚡",
    badge: "ULTRA RARE",
    title: "Free 1 random ex, V, vmax, vstar card",
    subtitle: "Guaranteed mint ultra rare foil card included with your pass.",
    gradient: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-400/40",
    badgeBg: "bg-purple-400/20 text-purple-300",
  },
  {
    icon: "🌟",
    badge: "25TH VAULT",
    title: "Free 1 25th Anniversary card",
    subtitle: "Official celebratory foil card featuring classic nostalgic art.",
    gradient: "from-yellow-500/20 to-amber-600/20",
    border: "border-yellow-400/40",
    badgeBg: "bg-yellow-400/20 text-yellow-300",
  },
  {
    icon: "🔴",
    badge: "SEALED FOIL",
    title: "Free 1 Pokeball holo Card",
    subtitle: "Exclusive Pokéball reverse pattern holographic card.",
    gradient: "from-rose-500/20 to-red-600/20",
    border: "border-rose-400/40",
    badgeBg: "bg-rose-400/20 text-rose-300",
  },
  {
    icon: "✨",
    badge: "PRISM SHINE",
    title: "Free 1 Mirror Holo Card",
    subtitle: "Reflective mirror surface foil shipped in protective toploader.",
    gradient: "from-cyan-500/20 to-teal-500/20",
    border: "border-cyan-400/40",
    badgeBg: "bg-cyan-400/20 text-cyan-300",
  },
];

const isOpen = computed(() => props.modelValue || authStore.isProModalOpen);

const stopPolling = () => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
};

const closeModal = () => {
  stopPolling();
  authStore.closeProModal();
  emit("update:modelValue", false);
  // Reset step after transition completes
  setTimeout(() => {
    modalStep.value = "perks";
    paymentError.value = "";
  }, 250);
};

// Require user to sign in before subscribing
const handleRequireSignIn = () => {
  closeModal();
  authStore.openAuthModal("Please sign in or create an account to activate VIP membership.");
};

// Initiate PayMongo QR Ph payment session for ₱999.00
const startQrPhPayment = async () => {
  if (!authStore.isAuthenticated) {
    handleRequireSignIn();
    return;
  }

  paymentError.value = "";
  isGeneratingQr.value = true;
  stopPolling();

  try {
    const res = await fetch("/api/user/vip-subscription/create-qrph", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      },
      body: JSON.stringify({
        user_id: authStore.currentUser?.id,
        email: authStore.currentUser?.email,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      if (res.status === 401) {
        handleRequireSignIn();
        return;
      }
      paymentError.value = data.message || "Failed to initialize PayMongo QR Ph payment.";
      return;
    }

    paymentIntentId.value = data.payment_intent_id;
    orderNumber.value = data.order_number;
    qrImageUrl.value = data.qr_image_url;
    qrString.value = data.qr_string;
    modalStep.value = "payment";

    // Begin background status polling every 4 seconds
    pollTimer.value = setInterval(() => {
      checkPaymentStatus(false);
    }, 4000);
  } catch (e: any) {
    console.error("PayMongo QR Ph error:", e);
    paymentError.value = "Network error connecting to payment gateway.";
  } finally {
    isGeneratingQr.value = false;
  }
};

// Check if payment was confirmed directly from PayMongo API / Webhook
const checkPaymentStatus = async (isManualClick = false) => {
  if (!paymentIntentId.value) return;
  if (isManualClick) isVerifying.value = true;
  paymentError.value = "";

  try {
    const res = await fetch(`/api/user/vip-subscription/check-status/${paymentIntentId.value}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      },
    });

    const data = await res.json();
    if (res.ok && data.is_paid) {
      stopPolling();
      // Apply VIP to authenticated auth state
      if (authStore.currentUser) {
        authStore.currentUser.is_vip = true;
        authStore.currentUser.pro_subscribed_at = data.user?.pro_subscribed_at || new Date().toISOString();
      }
      modalStep.value = "success";
      emit("subscribed");
    } else if (isManualClick) {
      paymentError.value =
        "PayMongo has not confirmed this payment yet. If you have already scanned and completed the QR Ph transfer in your app, please allow a few moments for the bank or e-wallet to post the transaction, then click 'Check Payment Status' again.";
    }
  } catch (e) {
    if (isManualClick) {
      paymentError.value = "Unable to connect to PayMongo verification server.";
    }
  } finally {
    if (isManualClick) isVerifying.value = false;
  }
};

const goToVipVault = () => {
  closeModal();
  router.push("/vip");
};

watch(
  () => isOpen.value,
  (val) => {
    if (val) {
      if (authStore.isVip) {
        modalStep.value = "success";
      } else {
        modalStep.value = "perks";
      }
    } else {
      stopPolling();
    }
  },
);

onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <teleport to="body">
    <transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
        @click.self="closeModal"
      >
        <div
          class="relative w-full max-w-xl rounded-3xl overflow-hidden bg-gradient-to-b from-[#0e1424] via-[#0b0f19] to-[#080b12] border-2 border-amber-400/70 shadow-[0_25px_80px_-15px_rgba(251,191,36,0.35)] text-slate-100 p-5 sm:p-7 space-y-5 animate-scale-up my-auto max-h-[92vh] overflow-y-auto"
        >
          <!-- Radiant Ambient Glow Filter Behind Modal Header -->
          <div
            class="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-44 bg-gradient-to-b from-amber-400/25 via-pink-500/15 to-transparent blur-3xl rounded-full"
          ></div>

          <!-- Close Button -->
          <button
            type="button"
            class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors border border-slate-700/60 z-20"
            aria-label="Close modal"
            @click="closeModal"
          >
            ✕
          </button>

          <!-- ═══════════════════════════════════════════════════════════ -->
          <!-- STEP 1: PERKS & PRESENTATION VIEW                          -->
          <!-- ═══════════════════════════════════════════════════════════ -->
          <div v-if="modalStep === 'perks'" class="space-y-4">
            <!-- Animated Glowing Crown Header -->
            <div class="text-center space-y-2">
              <div class="relative inline-flex items-center justify-center mb-1">
                <!-- Pulsing Golden Halo -->
                <div class="absolute -inset-3 rounded-full bg-amber-400/20 blur-md animate-pulse"></div>
                <div
                  class="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.6)] border border-yellow-200/50 transform hover:scale-105 transition-transform"
                >
                  <span class="text-3xl crown-glowing-icon">👑</span>
                </div>
              </div>

              <div
                class="inline-block px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400/20 via-yellow-400/30 to-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-black tracking-widest uppercase"
              >
                RLG Collector VIP Pass
              </div>

              <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-serif">
                Become a <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">Pro</span> Member
              </h2>
              <p class="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Elevate your collecting journey with verified VIP discounts, priority card grading, and 4 guaranteed physical holographic cards.
              </p>
            </div>

            <!-- Price Highlight Card (strictly ₱999.00 with zeros) -->
            <div
              class="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/15 border border-amber-400/50 flex items-center justify-between shadow-inner"
            >
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                    All-Access Pro Annual Pass
                  </span>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400/20 text-amber-200">
                    Instant Activation
                  </span>
                </div>
                <p class="text-xs text-slate-300 mt-0.5">
                  Includes Gold VIP Profile Badge &amp; Member-Only Vault
                </p>
              </div>

              <div class="text-right shrink-0 pl-3">
                <div class="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight drop-shadow-sm">
                  ₱999.00
                </div>
                <span class="text-[10px] font-bold text-amber-200/80 block uppercase tracking-wider">
                  999.00 PHP / One-Time
                </span>
              </div>
            </div>

            <!-- Authentication Requirement Notice if not logged in -->
            <div
              v-if="!authStore.isAuthenticated"
              class="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <span class="font-bold text-amber-300 block">Collector Account Required</span>
                <span class="text-slate-300 text-[11px]">Please sign in or create an account before subscribing so your VIP membership is linked to your profile.</span>
              </div>
              <button
                type="button"
                class="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
                @click="handleRequireSignIn"
              >
                Sign In / Register
              </button>
            </div>

            <!-- 6 Included Exclusive Perks (Distinct Cool Icons) -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <span>✨</span>
                  <span>Six Guaranteed Collector Perks:</span>
                </h3>
                <span class="text-[11px] text-slate-400 font-medium">Included upon verified payment</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  v-for="(perk, index) in collectorPerks"
                  :key="index"
                  class="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-400/50 transition-all flex items-start gap-3 shadow-xs"
                >
                  <div
                    class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border"
                    :class="[perk.gradient, perk.border]"
                  >
                    {{ perk.icon }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 mb-0.5">
                      <span class="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.2 rounded" :class="perk.badgeBg">
                        {{ perk.badge }}
                      </span>
                    </div>
                    <h4 class="text-xs font-bold text-slate-100 leading-snug">
                      {{ perk.title }}
                    </h4>
                    <p class="text-[10px] text-slate-400 leading-tight mt-0.5">
                      {{ perk.subtitle }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Error Feedback if any -->
            <div v-if="paymentError" class="p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs font-bold">
              ⚠️ {{ paymentError }}
            </div>

            <!-- CTA: Proceed to PayMongo QR Ph -->
            <div class="space-y-2 pt-1">
              <button
                v-if="authStore.isAuthenticated"
                type="button"
                :disabled="isGeneratingQr"
                class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_10px_25px_-5px_rgba(251,191,36,0.5)] cursor-pointer transition-all flex items-center justify-center gap-2"
                @click="startQrPhPayment"
              >
                <span class="crown-glowing-icon">👑</span>
                <span>
                  {{ isGeneratingQr ? "Generating PayMongo QR Ph..." : "Subscribe via PayMongo QR Ph — ₱999.00" }}
                </span>
                <span>→</span>
              </button>

              <button
                v-else
                type="button"
                class="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-black text-sm uppercase tracking-wider shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 border border-amber-400/30"
                @click="handleRequireSignIn"
              >
                <span>🔑</span>
                <span>Sign In to Subscribe via PayMongo QR Ph</span>
              </button>

              <div class="flex items-center justify-center gap-3 text-[11px] text-slate-400 pt-1">
                <span class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Instant QR Ph (GCash &bull; Maya &bull; InstaPay)
                </span>
                <span>&bull;</span>
                <button
                  type="button"
                  class="text-amber-400 hover:underline cursor-pointer font-bold"
                  @click="goToVipVault"
                >
                  Preview VIP Drops First
                </button>
              </div>
            </div>
          </div>

          <!-- ═══════════════════════════════════════════════════════════ -->
          <!-- STEP 2: PAYMONGO QR PH PAYMENT SCREEN                      -->
          <!-- ═══════════════════════════════════════════════════════════ -->
          <div v-else-if="modalStep === 'payment'" class="space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                type="button"
                class="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                @click="modalStep = 'perks'"
              >
                ← Back to Perks
              </button>
              <span class="text-[11px] font-black uppercase text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Official PayMongo QR Ph
              </span>
            </div>

            <div class="text-center space-y-1">
              <h3 class="text-xl font-black text-white">
                Scan QR Ph to Complete VIP Subscription
              </h3>
              <p class="text-xs text-slate-300">
                Scan using <span class="text-amber-300 font-bold">GCash, Maya, BDO, BPI, UnionBank</span> or any InstaPay-enabled banking app.
              </p>
            </div>

            <!-- QR Code Display Box -->
            <div class="p-5 rounded-2xl bg-white text-slate-900 border-2 border-amber-400 flex flex-col items-center justify-center shadow-xl space-y-3">
              <div class="flex items-center justify-between w-full border-b border-slate-200 pb-2 text-xs">
                <div class="flex items-center gap-1.5 font-black tracking-tight text-slate-800">
                  <span class="text-rose-600 font-bold">QR</span>
                  <span class="text-blue-600 font-bold">Ph</span>
                  <span class="text-slate-400">|</span>
                  <span>PayMongo Gateway</span>
                </div>
                <span class="font-mono font-bold text-slate-500">{{ orderNumber }}</span>
              </div>

              <!-- QR Image -->
              <div class="relative p-2 rounded-xl bg-white border border-slate-200 shadow-inner">
                <img
                  :src="qrImageUrl"
                  alt="PayMongo QR Ph Code"
                  class="w-56 h-56 object-contain"
                />
              </div>

              <!-- Amount Lock -->
              <div class="w-full text-center bg-slate-100 rounded-xl py-2 px-3">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Amount Due</span>
                <span class="text-2xl font-black text-slate-900 font-mono">₱999.00</span>
              </div>
            </div>

            <!-- Polling Indicator -->
            <div class="flex items-center justify-center gap-2 text-xs text-amber-300/90 font-medium">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>Awaiting payment confirmation from PayMongo network...</span>
            </div>

            <div v-if="paymentError" class="p-3.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-semibold leading-relaxed">
              ℹ️ {{ paymentError }}
            </div>

            <!-- Action Buttons: Real status check only, no bypass -->
            <div class="space-y-2">
              <button
                type="button"
                :disabled="isVerifying"
                class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                @click="checkPaymentStatus(true)"
              >
                <span v-if="isVerifying" class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span v-else>🔄</span>
                <span>{{ isVerifying ? "Verifying with PayMongo..." : "Check Payment Status" }}</span>
              </button>

              <button
                type="button"
                class="w-full py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer transition-colors"
                @click="modalStep = 'perks'"
              >
                Cancel and Return to Perks
              </button>
            </div>
          </div>

          <!-- ═══════════════════════════════════════════════════════════ -->
          <!-- STEP 3: SUCCESS & ACTIVATION CELEBRATION                   -->
          <!-- ═══════════════════════════════════════════════════════════ -->
          <div v-else-if="modalStep === 'success'" class="space-y-5 text-center py-2">
            <div class="relative inline-flex items-center justify-center">
              <div class="absolute -inset-4 rounded-full bg-amber-400/25 blur-lg animate-pulse"></div>
              <div
                class="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 flex items-center justify-center text-4xl shadow-2xl border-2 border-yellow-200"
              >
                👑
              </div>
            </div>

            <div class="space-y-1">
              <span class="px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider inline-block">
                🎉 Payment Confirmed &bull; Pro VIP Activated!
              </span>
              <h3 class="text-2xl font-black text-white font-serif">
                Welcome to the RLG Pro Circle
              </h3>
              <p class="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your account is officially upgraded! The Gold VIP badge is active next to your profile, and all exclusive promotion prices are unlocked.
              </p>
            </div>

            <!-- Summary of Unlocked Perks -->
            <div class="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2">
              <div class="text-[11px] font-black uppercase text-amber-300 tracking-wider">
                Active Member Privileges
              </div>
              <ul class="text-xs text-slate-200 space-y-1.5">
                <li class="flex items-center gap-2">
                  <span class="text-amber-400 font-black">✓</span>
                  <span>Instant access to VIP-only drops on <strong>/vip</strong></span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-amber-400 font-black">✓</span>
                  <span>Free AI Card Grader tool with high-resolution inspection</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="text-amber-400 font-black">✓</span>
                  <span>4 bonus holographic cards will ship with your next order</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl cursor-pointer transition-all"
              @click="goToVipVault"
            >
              👑 Explore VIP Exclusive Products Now →
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
@keyframes crownGlow {
  0%, 100% {
    filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.8)) drop-shadow(0 0 25px rgba(245, 158, 11, 0.5));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 18px rgba(251, 191, 36, 1)) drop-shadow(0 0 35px rgba(236, 72, 153, 0.6));
    transform: scale(1.06);
  }
}

.crown-glowing-icon {
  display: inline-block;
  animation: crownGlow 2.5s ease-in-out infinite;
}

@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-up {
  animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
