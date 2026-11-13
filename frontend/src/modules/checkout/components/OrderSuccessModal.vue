<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import type { PlacedOrder } from "@/shared/types/toy.types";
import { formatCurrency } from "@/shared/utils/currency.util";
import { resolveApiUrl } from "@/shared/utils/api";
import BaseButton from "@/shared/components/BaseButton.vue";

interface Props {
  order: PlacedOrder | null;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const router = useRouter();

const isPolling = ref(false);
const isPaid = ref(false);
const isChecking = ref(false);
const pollTimer = ref<any>(null);
const dynamicQrUrl = ref<string | null>(null);
const isGeneratingQr = ref(false);

const isPayMongoOrder = computed(() => {
  if (!props.order) return false;
  const method = (
    props.order.shippingDetails?.paymentMethod || ""
  ).toLowerCase();
  return (
    method === "paymongo_qrph" ||
    method.includes("paymongo") ||
    !!props.order.paymentDetails?.qr_image_url
  );
});

// Polling and QR fetch helpers (defined before watch to prevent TDZ initialization errors)
const stopPolling = () => {
  isPolling.value = false;
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
};

const checkPaymentStatus = async () => {
  if (!props.order || isPaid.value) return;
  const orderRef = props.order.orderId || props.order.backendId;
  if (!orderRef) return;

  isChecking.value = true;
  try {
    const res = await fetch(
      resolveApiUrl(`/api/customer-orders/${orderRef}/payment-status`),
      {
        headers: { Accept: "application/json" },
      },
    );
    if (res.ok) {
      const json = await res.json();
      if (json.is_paid || json.payment_status?.toLowerCase() === "paid") {
        isPaid.value = true;
        if (props.order) {
          props.order.paymentStatus = "Paid";
        }
        stopPolling();
      }
    }
  } catch (e) {
    // Polling error silently ignored
  } finally {
    isChecking.value = false;
  }
};

const startPolling = () => {
  stopPolling();
  isPolling.value = true;
  pollTimer.value = setInterval(() => {
    checkPaymentStatus();
  }, 3500);
};

const fetchQrForOrder = async () => {
  if (!props.order) return;
  const orderRef = props.order.orderId || props.order.backendId;
  if (!orderRef) return;

  isGeneratingQr.value = true;
  try {
    const res = await fetch(
      resolveApiUrl(`/api/customer-orders/${orderRef}/paymongo-qrph`),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );
    if (res.ok) {
      const json = await res.json();
      if (json.qr_details?.qr_image_url) {
        dynamicQrUrl.value = json.qr_details.qr_image_url;
      }
      if (json.is_paid) {
        isPaid.value = true;
        stopPolling();
      }
    }
  } catch (e) {
    console.warn("Could not generate PayMongo QR on modal", e);
  } finally {
    isGeneratingQr.value = false;
  }
};

// Extract or generate QR image URL
watch(
  () => [props.isOpen, props.order] as const,
  async () => {
    if (props.isOpen && props.order) {
      const ord: PlacedOrder = props.order;
      isPaid.value =
        ord.paymentStatus?.toLowerCase() === "paid" ||
        ord.paymentDetails?.status === "paid";

      if (ord.paymentDetails?.qr_image_url) {
        dynamicQrUrl.value = ord.paymentDetails.qr_image_url;
      } else if (
        isPayMongoOrder.value &&
        !dynamicQrUrl.value &&
        !isPaid.value
      ) {
        await fetchQrForOrder();
      }

      if (isPayMongoOrder.value && !isPaid.value) {
        startPolling();
      }
    } else {
      stopPolling();
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  stopPolling();
});

const handleContinueShopping = () => {
  stopPolling();
  emit("close");
  router.push("/catalog");
};

const goToOrderDetails = () => {
  stopPolling();
  emit("close");
  router.push(`/orders?q=${props.order?.orderId}`);
};

const downloadQrCode = () => {
  if (!dynamicQrUrl.value) return;
  const link = document.createElement("a");
  link.href = dynamicQrUrl.value;
  link.download = `RLG-QRPH-${props.order?.orderId || "order"}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <teleport to="body">
    <transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen && order"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <div
          class="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative border border-slate-200 font-display text-center space-y-4 animate-scale-up max-h-[92vh] overflow-y-auto"
        >
          <!-- Top Right Close 'X' Button -->
          <button
            type="button"
            class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer text-base font-bold z-10"
            title="Close / Change Payment"
            @click="emit('close')"
          >
            ✕
          </button>

          <!-- Confetti / Success Header -->
          <div
            class="w-14 h-14 rounded-2xl text-white flex items-center justify-center mx-auto text-2xl shadow-lg transition-all"
            :class="
              isPaid
                ? 'bg-emerald-500 shadow-emerald-500/30 animate-bounce'
                : 'bg-amber-500 shadow-amber-500/30'
            "
          >
            <span v-if="isPaid">🎉</span>
            <span v-else-if="isPayMongoOrder">⚡</span>
            <span v-else>✓</span>
          </div>

          <div>
            <div
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider mb-2"
              :class="
                isPaid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              "
            >
              <span v-if="isPaid"
                >✓ Payment Confirmed &bull; Preparing Shipment</span
              >
              <span v-else-if="isPayMongoOrder"
                >⚡ Awaiting QR Ph Payment Scan</span
              >
              <span v-else>Order Confirmed &bull; Pending Static QR</span>
            </div>

            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900">
              <span v-if="isPaid">Payment Received! 🎉</span>
              <span v-else-if="isPayMongoOrder"
                >Scan QR Ph to Complete Payment</span
              >
              <span v-else>Thank You for Your Order!</span>
            </h2>

            <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              <span v-if="isPaid">
                Your payment for order
                <strong class="text-slate-800">{{ order.orderId }}</strong> has
                been verified. Our collector vault team is preparing your
                package with reinforced packaging.
              </span>
              <span v-else-if="isPayMongoOrder">
                Scan this dynamic QR code with any Philippine banking or
                e-wallet app. Our system automatically detects your payment in
                seconds.
              </span>
              <span v-else>
                We received your order,
                <strong class="text-slate-700">{{
                  order.shippingDetails.firstName
                }}</strong
                >! Please check your email for payment instructions.
              </span>
            </p>
          </div>

          <!-- Dynamic PayMongo QR Ph Payment Box -->
          <div
            v-if="isPayMongoOrder && !isPaid"
            class="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 rounded-2xl p-5 border-2 border-amber-300 shadow-sm space-y-4 animate-fade-in"
          >
            <!-- QR Ph Badge & Live Status -->
            <div
              class="flex items-center justify-between border-b border-amber-200/80 pb-2.5"
            >
              <div class="flex items-center gap-2">
                <img
                  src="/images/qr/qrph-logo.png"
                  alt="QR Ph"
                  class="h-6 w-auto object-contain bg-white px-1.5 py-0.5 rounded-md border border-amber-200/80 shadow-2xs"
                />
                <span class="text-xs font-extrabold text-slate-900"
                  >Official QR Ph</span
                >
              </div>
              <div
                class="flex items-center gap-1.5 text-[11px] font-bold text-amber-800"
              >
                <span class="relative flex h-2 w-2">
                  <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"
                  ></span>
                  <span
                    class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"
                  ></span>
                </span>
                <span>{{
                  isChecking ? "Verifying payment..." : "Waiting for scan..."
                }}</span>
              </div>
            </div>

            <!-- Dynamic QR Image Presentation -->
            <div
              class="relative bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs max-w-[220px] sm:max-w-[240px] mx-auto text-center"
            >
              <div
                v-if="isGeneratingQr"
                class="py-12 text-xs text-slate-400 flex flex-col items-center gap-2"
              >
                <div
                  class="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"
                ></div>
                <span>Generating secure QR Ph code...</span>
              </div>
              <div v-else-if="dynamicQrUrl">
                <img
                  :src="dynamicQrUrl"
                  :alt="`QR Ph for ${order.orderId}`"
                  class="w-44 h-44 sm:w-48 sm:h-48 mx-auto object-contain rounded-lg"
                />
                <span class="text-[10px] font-bold text-slate-400 block mt-1.5">
                  BSP-Certified &bull; Single-Use Dynamic QR
                </span>
              </div>
              <div v-else class="py-10 text-xs text-rose-500">
                Unable to load QR image. Please refresh or check orders.
              </div>
            </div>

            <!-- Exact Centavo Amount Display -->
            <div
              class="bg-white/80 p-3 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs"
            >
              <span class="text-slate-500 font-bold"
                >Exact Payable Amount:</span
              >
              <span class="text-lg font-black font-mono text-rose-600">
                {{ formatCurrency(order.total) }}
              </span>
            </div>

            <!-- Instructions and Supported E-Wallets -->
            <div
              class="space-y-1.5 text-[11px] text-slate-600 text-left bg-white/60 p-3 rounded-xl border border-amber-200/40"
            >
              <div
                class="font-extrabold text-slate-800 flex items-center gap-1.5"
              >
                <span>📲 How to scan:</span>
              </div>
              <p>
                1. Open <strong>GCash, Maya, BDO, BPI, GoTyme</strong> or any
                banking app.
              </p>
              <p>
                2. Tap <strong>Scan QR</strong> (or upload QR from photos if on
                mobile).
              </p>
              <p>
                3. Complete transfer. This screen updates
                <strong>automatically</strong> within seconds!
              </p>
            </div>

            <!-- Mobile User Convenience: Save QR & Manual Check Buttons -->
            <div class="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                @click="downloadQrCode"
              >
                <span>💾</span>
                <span>Save QR to Photos</span>
              </button>
              <button
                type="button"
                class="flex-1 py-2.5 px-3 rounded-xl text-xs font-black text-amber-950 bg-amber-300 hover:bg-amber-400 border border-amber-400/80 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                :disabled="isChecking"
                @click="checkPaymentStatus"
              >
                <span :class="{ 'animate-spin': isChecking }">🔄</span>
                <span>{{
                  isChecking ? "Checking..." : "Check Status Now"
                }}</span>
              </button>
            </div>
          </div>

          <!-- Confirmed Payment Success Card -->
          <div
            v-else-if="isPaid"
            class="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 text-emerald-950 text-left space-y-3 animate-fade-in"
          >
            <div class="flex items-center gap-3">
              <span
                class="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black text-lg flex items-center justify-center shadow-xs"
              >
                ✓
              </span>
              <div>
                <h4 class="text-sm font-extrabold text-emerald-950">
                  Payment Successfully Verified
                </h4>
                <p class="text-xs text-emerald-700">
                  Thank you! Your transaction has been cleared successfully.
                </p>
              </div>
            </div>
            <div
              class="pt-2 border-t border-emerald-200/70 flex justify-between items-center text-xs"
            >
              <span class="text-emerald-800 font-medium">Total Paid:</span>
              <span class="font-mono font-black text-emerald-900 text-sm">{{
                formatCurrency(order.total)
              }}</span>
            </div>
          </div>

          <!-- Order Summary Card -->
          <div
            class="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2.5 text-xs"
          >
            <div
              class="flex justify-between items-center pb-2 border-b border-slate-200/70 font-bold"
            >
              <span class="text-slate-500">Order Reference:</span>
              <span class="text-rose-600 font-mono text-sm">{{
                order.orderId
              }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-slate-500">Payment Status:</span>
              <span
                class="font-extrabold px-2 py-0.5 rounded-full text-[10px]"
                :class="
                  isPaid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                "
              >
                {{ isPaid ? "Paid ✓" : "Awaiting Payment" }}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-slate-500">Est. Dispatch Date:</span>
              <span class="font-bold text-slate-800">{{
                order.estimatedDeliveryDate
              }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-slate-500">Ship To:</span>
              <span class="font-bold text-slate-800 truncate max-w-[200px]">
                {{ order.shippingDetails.firstName }}
                {{ order.shippingDetails.lastName }}
              </span>
            </div>

            <div
              class="flex justify-between items-center pt-2 border-t border-slate-200/70 font-extrabold text-sm text-slate-900"
            >
              <span>{{ isPaid ? "Total Paid:" : "Payable Amount:" }}</span>
              <span class="text-rose-600">{{
                formatCurrency(order.total)
              }}</span>
            </div>
          </div>

          <!-- Static QR Notice (For Option 2 Manual Transfer) -->
          <div
            v-if="
              order.shippingDetails.paymentMethod === 'qr' && !isPayMongoOrder
            "
            class="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-950 text-left space-y-2 animate-fade-in"
          >
            <div class="flex items-center justify-between">
              <span
                class="font-extrabold flex items-center gap-1.5 text-indigo-900"
              >
                <span>📧 Static QR Payment Email Sent</span>
              </span>
              <span
                class="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full"
              >
                Pending Screenshot
              </span>
            </div>
            <p class="text-[11px] text-indigo-800 leading-relaxed">
              We have dispatched your static QR code to
              <strong>{{ order.shippingDetails.email }}</strong
              >. Scan the QR, input the exact total of
              <strong>{{ formatCurrency(order.total) }}</strong
              >, and reply to that email with your payment screenshot.
            </p>
            <div
              class="pt-1.5 flex items-center justify-between border-t border-indigo-200/60 text-[11px]"
            >
              <span class="text-indigo-700"
                >Need to update shipping or change payment method?</span
              >
              <button
                type="button"
                class="font-bold text-indigo-600 hover:text-indigo-900 underline cursor-pointer"
                @click="goToOrderDetails"
              >
                Edit Order &rarr;
              </button>
            </div>
          </div>

          <!-- Items Ordered Mini-Preview -->
          <div
            class="flex items-center justify-center gap-2 overflow-hidden py-1"
          >
            <img
              v-for="item in order.items.slice(0, 4)"
              :key="item.toy.id"
              :src="item.toy.imageUrl"
              :alt="item.toy.name"
              class="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
              :title="item.toy.name"
            />
            <span
              v-if="order.items.length > 4"
              class="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center border border-slate-200"
            >
              +{{ order.items.length - 4 }}
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="pt-2 flex flex-col sm:flex-row gap-3">
            <BaseButton
              v-if="!isPaid"
              variant="outline"
              size="md"
              fullWidth
              @click="goToOrderDetails"
            >
              📋 Track / View Order
            </BaseButton>
            <BaseButton
              v-if="isPaid"
              variant="outline"
              size="md"
              fullWidth
              @click="emit('close')"
            >
              Close Receipt
            </BaseButton>
            <BaseButton
              variant="primary"
              size="md"
              fullWidth
              @click="handleContinueShopping"
            >
              Explore More Collectibles 🚀
            </BaseButton>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>
