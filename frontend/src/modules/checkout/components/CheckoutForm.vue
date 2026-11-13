<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { checkoutFormSchema } from "../checkout-form.schema";
import type { CheckoutFormData, RefShippingCarrier } from "@/shared/types/toy.types";
import BaseButton from "@/shared/components/BaseButton.vue";
import { formatCurrency } from "@/shared/utils/currency.util";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useCartStore } from "@/modules/cart/cart.store";
import { useWalletStore } from "@/modules/wallet/wallet.store";
import { resolveApiUrl } from "@/shared/utils/api";
import * as yup from "yup";

interface Props {
  isSubmitting: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "submit-order", data: CheckoutFormData): void;
  (e: "delivery-change", option: "standard" | "express" | "gift-wrapped"): void;
  (e: "carrier-change", carrierId: number): void;
}>();

const authStore = useAuthStore();
const cartStore = useCartStore();
const walletStore = useWalletStore();

interface PaymentMerchant {
  id: number;
  name: string;
  code: string;
  account_name: string;
  account_number: string;
  qr_image_url: string;
  instructions: string;
}

// 4 Static QR Merchants: GoTyme, GCash, MariBank, PayMaya
const paymentMerchants = ref<PaymentMerchant[]>([
  {
    id: 1,
    name: "GoTyme Bank",
    code: "gotyme",
    account_name: "RUSSEL LUIS GEMENTIZA",
    account_number: "•••••••• 5860",
    qr_image_url: "/images/qr/gotyme-qr.png",
    instructions: "Scan with your GoTyme or any InstaPay app. Input the exact total and save transaction screenshot.",
  },
  {
    id: 2,
    name: "GCash",
    code: "gcash",
    account_name: "RU***L LU*S G.",
    account_number: "+63 956 997 ****",
    qr_image_url: "/images/qr/gcash-qr.jpg",
    instructions: "Scan via GCash app. Transfer fees may apply. Save transaction receipt to confirm payment.",
  },
  {
    id: 3,
    name: "MariBank",
    code: "maribank",
    account_name: "RUSSEL LUIS GEMENTIZA",
    account_number: "MariBank(****4301)",
    qr_image_url: "/images/qr/maribank-qr.png",
    instructions: "Scan via MariBank or any InstaPay e-wallet. Save transfer confirmation.",
  },
  {
    id: 4,
    name: "PayMaya",
    code: "paymaya",
    account_name: "Russel Luis Gementiza",
    account_number: "+63 *** *** 0813 (@russelluis)",
    qr_image_url: "/images/qr/maya-qr.jpg",
    instructions: "Scan using Maya app. Transfer fees may apply. Save confirmation receipt.",
  },
]);

const selectedMerchantCode = ref<string>("gotyme");

const selectedMerchant = computed(() => {
  return (
    paymentMerchants.value.find((m) => m.code === selectedMerchantCode.value) ||
    paymentMerchants.value[0]
  );
});

// Dynamic Shipping Carriers from ref_shipping_carrier table
const carriers = ref<RefShippingCarrier[]>([]);
const isLoadingCarriers = ref(false);

const form = ref<CheckoutFormData>({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  streetAddress: "",
  city: "",
  postalCode: "",
  notes: "",
  deliveryOption: "standard",
  carrierId: null,
  saveToProfile: false,
  giftMessage: "",
  paymentMethod: "paymongo_qrph",
  qrMerchantCode: "gotyme",
  cardNumber: "",
  cardExpiry: "",
  cardCvv: "",
});

const errors = ref<Record<string, string>>({});

// Compute estimated order total for display in QR instruction banner
const deliveryFee = computed(() => {
  return cartStore.standardShippingCost;
});

const estimatedTotal = computed(() => {
  const taxableBase = Math.max(0, cartStore.subtotal - cartStore.promoDiscount);
  const vat = (taxableBase * cartStore.vatPercentage) / 100;
  return Math.max(0, taxableBase + deliveryFee.value + vat);
});

// Auto-fill only first name, last name, and email from authenticated user (e.g. Gmail OAuth)
const populateFromAuth = () => {
  const u = authStore.currentUser;
  if (!u) return;

  const fullName = (u.name || "").trim();
  const spaceIndex = fullName.indexOf(" ");
  const firstName = spaceIndex !== -1 ? fullName.substring(0, spaceIndex) : fullName;
  const lastName = spaceIndex !== -1 ? fullName.substring(spaceIndex + 1) : "";

  if (!form.value.firstName && firstName) form.value.firstName = firstName;
  if (!form.value.lastName && lastName) form.value.lastName = lastName;
  if (!form.value.email && u.email) form.value.email = u.email;
};

const handleSelectCarrier = (carrierId: number) => {
  form.value.carrierId = carrierId;
  if (errors.value.carrierId) {
    delete errors.value.carrierId;
  }
  emit("carrier-change", carrierId);
};

const selectedPaymentMethod = ref<"paymongo_qrph" | "paymongo_bpi" | "paymongo_ubp" | "qr" | "wallet" | "cod">("paymongo_qrph");

const handleSelectPaymentMethod = (method: "paymongo_qrph" | "paymongo_bpi" | "paymongo_ubp" | "qr" | "wallet" | "cod") => {
  selectedPaymentMethod.value = method;
  form.value.paymentMethod = method;
  if (errors.value.paymentMethod) {
    delete errors.value.paymentMethod;
  }
};

const handleSelectMerchant = (code: string) => {
  selectedMerchantCode.value = code;
  form.value.qrMerchantCode = code;
};

const handleSubmit = async () => {
  errors.value = {};
  try {
    form.value.paymentMethod = selectedPaymentMethod.value;
    if (form.value.paymentMethod === "wallet") {
      if (walletStore.spendableBalance < estimatedTotal.value) {
        errors.value.paymentMethod = `Insufficient wallet balance (Available: ${formatCurrency(walletStore.spendableBalance)}, Required: ${formatCurrency(estimatedTotal.value)}). Please top up or choose another payment method.`;
        return;
      }
    }
    if (form.value.paymentMethod === "qr") {
      form.value.qrMerchantCode = selectedMerchantCode.value;
    }
    const validData = await checkoutFormSchema.validate(form.value, {
      abortEarly: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit("submit-order", validData as any);
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      err.inner.forEach((validationError) => {
        if (validationError.path) {
          errors.value[validationError.path] = validationError.message;
        }
      });
    }
  }
};

onMounted(async () => {
  populateFromAuth();
  walletStore.fetchWalletSummary().catch(() => {});
  await cartStore.fetchShippingTax();

  // Dynamic shipping carriers from ref_shipping_carrier API
  isLoadingCarriers.value = true;
  try {
    const carrierRes = await fetch(resolveApiUrl("/api/ref-shipping-carriers"));
    if (carrierRes.ok) {
      const data = await carrierRes.json();
      if (Array.isArray(data) && data.length > 0) {
        carriers.value = data;
        if (!form.value.carrierId) {
          form.value.carrierId = data[0].id;
        }
      }
    }
  } catch (e) {
    console.warn("Could not load dynamic carriers", e);
  } finally {
    isLoadingCarriers.value = false;
  }

  // Fetch active payment merchants
  try {
    const res = await fetch(resolveApiUrl("/api/ref-payment-merchants"));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        paymentMerchants.value = data;
      }
    }
  } catch (e) {
    // Keep local fallback list
  }

  // Load collector wallet overview for escrow balance payment option
  if (authStore.isAuthenticated) {
    try {
      await walletStore.fetchOverview();
    } catch {
      // Non-blocking
    }
  }
});
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6 font-display">
    <!-- Step 1: Contact & Shipping Address -->
    <div
      class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div class="flex items-center gap-2">
          <span
            class="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center"
            >1</span
          >
          <h3 class="text-base font-extrabold text-slate-900">
            Shipping &amp; Contact Details
          </h3>
        </div>

        <!-- Authenticated Profile Autofill Badge -->
        <span
          v-if="authStore.isAuthenticated"
          class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70"
        >
          <span>✓</span>
          <span>Autofilled from your Profile</span>
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1"
            >First Name *</label
          >
          <input
            v-model="form.firstName"
            type="text"
            placeholder="e.g. Ren"
            class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-200"
          />
          <p
            v-if="errors.firstName"
            class="text-[11px] text-red-500 font-semibold mt-1"
          >
            {{ errors.firstName }}
          </p>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1"
            >Last Name *</label
          >
          <input
            v-model="form.lastName"
            type="text"
            placeholder="e.g. Santos"
            class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-200"
          />
          <p
            v-if="errors.lastName"
            class="text-[11px] text-red-500 font-semibold mt-1"
          >
            {{ errors.lastName }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1"
            >Email Address *</label
          >
          <input
            v-model="form.email"
            type="email"
            placeholder="collector@example.com"
            class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-200"
          />
          <p
            v-if="errors.email"
            class="text-[11px] text-red-500 font-semibold mt-1"
          >
            {{ errors.email }}
          </p>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1"
            >Phone Number *</label
          >
          <input
            v-model="form.phone"
            type="tel"
            placeholder="+63 917 123 4567"
            class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-200"
          />
          <p
            v-if="errors.phone"
            class="text-[11px] text-red-500 font-semibold mt-1"
          >
            {{ errors.phone }}
          </p>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1"
          >Street Address *</label
        >
        <input
          v-model="form.streetAddress"
          type="text"
          placeholder="123 Collector Blvd, Unit 4B"
          class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-200"
        />
        <p
          v-if="errors.streetAddress"
          class="text-[11px] text-red-500 font-semibold mt-1"
        >
          {{ errors.streetAddress }}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1"
            >City / Region *</label
          >
          <input
            v-model="form.city"
            type="text"
            placeholder="Quezon City, Metro Manila"
            class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900"
          />
          <p
            v-if="errors.city"
            class="text-[11px] text-red-500 font-semibold mt-1"
          >
            {{ errors.city }}
          </p>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1"
            >Postal Code *</label
          >
          <input
            v-model="form.postalCode"
            type="text"
            placeholder="1100"
            class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900"
          />
          <p
            v-if="errors.postalCode"
            class="text-[11px] text-red-500 font-semibold mt-1"
          >
            {{ errors.postalCode }}
          </p>
        </div>
      </div>

      <!-- Save shipping details to profile check button -->
      <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div class="space-y-0.5">
          <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span>💾</span>
            <span>Save shipping details to profile</span>
          </span>
          <p class="text-[11px] text-slate-500 leading-tight">
            Update your profile and delivery address for 1-click faster checkout next time.
          </p>
        </div>

        <button
          type="button"
          class="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs select-none"
          :class="
            form.saveToProfile
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-600/20'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
          "
          @click="form.saveToProfile = !form.saveToProfile"
        >
          <span
            class="w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-black"
            :class="form.saveToProfile ? 'bg-white/20 text-white' : 'bg-white border border-slate-300 text-transparent'"
          >
            ✓
          </span>
          <span>{{ form.saveToProfile ? 'Saved to Profile' : 'Save Details' }}</span>
        </button>
      </div>
    </div>

    <!-- Step 2: Dynamic Shipping Carriers -->
    <div
      class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span
            class="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center"
            >2</span
          >
          <h3 class="text-base font-extrabold text-slate-900">
            Shipping Carrier
          </h3>
        </div>
        <span class="text-[11px] font-semibold text-slate-500">
          Official Couriers
        </span>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingCarriers" class="py-6 text-center text-xs text-slate-500">
        Loading carriers from registry...
      </div>

      <!-- Dynamic Carrier Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div
          v-for="carrier in carriers"
          :key="carrier.id"
          class="p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between"
          :class="
            form.carrierId === carrier.id
              ? 'border-red-600 bg-red-50/50 shadow-xs ring-1 ring-red-500/20'
              : 'border-slate-200 hover:border-slate-300'
          "
          @click="handleSelectCarrier(carrier.id)"
        >
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-lg">🚚</span>
              <span class="text-xs font-extrabold text-slate-900">
                {{ carrier.short_name || carrier.name }}
              </span>
            </div>
            <p class="text-[11px] text-slate-600 font-medium">
              {{ carrier.name }}
            </p>
          </div>
          <div class="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
            <span class="text-[10px] font-bold text-slate-400 uppercase">
              {{ carrier.code }}
            </span>
            <span
              v-if="form.carrierId === carrier.id"
              class="text-[10px] font-extrabold text-red-600 bg-red-100/80 px-2 py-0.5 rounded-full"
            >
              Selected ✓
            </span>
          </div>
        </div>
      </div>
      <p
        v-if="errors.carrierId"
        class="text-[11px] text-red-500 font-semibold mt-1"
      >
        {{ errors.carrierId }}
      </p>
    </div>

    <!-- Step 3: Secure Payment (Horizontal Layers) -->
    <div
      class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span
            class="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center"
            >3</span
          >
          <h3 class="text-base font-extrabold text-slate-900">Secure Payment</h3>
        </div>

        <span
          class="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full"
        >
          🔒 Official QR Ph &amp; Bank Transfer
        </span>
      </div>

      <!-- Payment Method Selection Horizontal Layers (Simplified & Streamlined) -->
      <div class="space-y-2.5">
        <!-- Layer 1: Instant QR Ph -->
        <div
          class="relative p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          :class="
            selectedPaymentMethod === 'paymongo_qrph'
              ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-500/30'
              : 'border-slate-200 bg-white hover:border-slate-300'
          "
          @click="handleSelectPaymentMethod('paymongo_qrph')"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              :class="selectedPaymentMethod === 'paymongo_qrph' ? 'border-amber-500 bg-amber-500' : 'border-slate-300 bg-white'"
            >
              <div v-if="selectedPaymentMethod === 'paymongo_qrph'" class="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <div class="h-10 px-2 rounded-xl bg-white border border-amber-200 shadow-2xs flex items-center justify-center shrink-0">
              <img src="/images/qr/qrph-logo.png" alt="QR Ph" class="h-6 w-auto object-contain" />
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-xs sm:text-sm font-extrabold text-slate-900">Instant QR Ph</h4>
                <span class="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                  ⚡ Auto-Verify
                </span>
                <span class="text-[9px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                Scan with GCash, Maya, BDO Pay, BPI, GoTyme, ShopeePay &amp; all PH bank apps
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center pl-8 sm:pl-0">
            <span class="text-[10px] font-bold text-slate-400">All PH Banks &amp; Wallets</span>
            <span
              v-if="selectedPaymentMethod === 'paymongo_qrph'"
              class="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full"
            >
              Selected ✓
            </span>
          </div>
        </div>

        <!-- Layer 2: BPI Online Direct Debit -->
        <div
          class="relative p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          :class="
            selectedPaymentMethod === 'paymongo_bpi'
              ? 'border-red-500 bg-red-50/40 shadow-sm ring-1 ring-red-500/30'
              : 'border-slate-200 bg-white hover:border-slate-300'
          "
          @click="handleSelectPaymentMethod('paymongo_bpi')"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              :class="selectedPaymentMethod === 'paymongo_bpi' ? 'border-red-500 bg-red-500' : 'border-slate-300 bg-white'"
            >
              <div v-if="selectedPaymentMethod === 'paymongo_bpi'" class="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
              🏛️
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-xs sm:text-sm font-extrabold text-slate-900">BPI Online Direct Debit</h4>
                <span class="text-[9px] font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                  Bank Direct
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                Pay directly from your Bank of the Philippine Islands account via secure online login
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center pl-8 sm:pl-0">
            <span class="text-[10px] font-bold text-slate-400">Direct Account Debit</span>
            <span
              v-if="selectedPaymentMethod === 'paymongo_bpi'"
              class="text-[10px] font-extrabold text-red-800 bg-red-100 px-2 py-0.5 rounded-full"
            >
              Selected ✓
            </span>
          </div>
        </div>

        <!-- Layer 3: UnionBank (UB) Online Direct Debit -->
        <div
          class="relative p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          :class="
            selectedPaymentMethod === 'paymongo_ubp'
              ? 'border-orange-500 bg-orange-50/40 shadow-sm ring-1 ring-orange-500/30'
              : 'border-slate-200 bg-white hover:border-slate-300'
          "
          @click="handleSelectPaymentMethod('paymongo_ubp')"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              :class="selectedPaymentMethod === 'paymongo_ubp' ? 'border-orange-500 bg-orange-500' : 'border-slate-300 bg-white'"
            >
              <div v-if="selectedPaymentMethod === 'paymongo_ubp'" class="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
              🟧
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-xs sm:text-sm font-extrabold text-slate-900">UnionBank (UB) Online</h4>
                <span class="text-[9px] font-extrabold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                  Bank Direct
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                Pay directly with your UnionBank Philippines credentials &amp; mobile banking OTP
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center pl-8 sm:pl-0">
            <span class="text-[10px] font-bold text-slate-400">Direct Account Debit</span>
            <span
              v-if="selectedPaymentMethod === 'paymongo_ubp'"
              class="text-[10px] font-extrabold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full"
            >
              Selected ✓
            </span>
          </div>
        </div>

        <!-- Layer 4: Manual Static QR & InstaPay -->
        <div
          class="relative p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          :class="
            selectedPaymentMethod === 'qr'
              ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500/30'
              : 'border-slate-200 bg-white hover:border-slate-300'
          "
          @click="handleSelectPaymentMethod('qr')"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              :class="selectedPaymentMethod === 'qr' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'"
            >
              <div v-if="selectedPaymentMethod === 'qr'" class="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
              📱
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-xs sm:text-sm font-extrabold text-slate-900">Manual Static QR / Bank Transfer</h4>
                <span class="text-[9px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  0% Transfer Fee
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                GoTyme, GCash, MariBank, Maya &bull; Reply to order confirmation email with screenshot
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center pl-8 sm:pl-0">
            <span class="text-[10px] font-bold text-slate-400">Manual Verification</span>
            <span
              v-if="selectedPaymentMethod === 'qr'"
              class="text-[10px] font-extrabold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full"
            >
              Selected ✓
            </span>
          </div>
        </div>

        <!-- Layer 5: Collector Escrow Wallet Balance -->
        <div
          class="relative p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          :class="
            selectedPaymentMethod === 'wallet'
              ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500/30'
              : 'border-slate-200 bg-white hover:border-slate-300'
          "
          @click="handleSelectPaymentMethod('wallet')"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              :class="selectedPaymentMethod === 'wallet' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'"
            >
              <div v-if="selectedPaymentMethod === 'wallet'" class="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
              💳
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-xs sm:text-sm font-extrabold text-slate-900">Collector Wallet Balance</h4>
                <span class="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Instant 0% Fee
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                Pay immediately from your wallet escrow balance &bull; Available: <strong class="text-emerald-700">{{ formatCurrency(walletStore.spendableBalance) }}</strong>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center pl-8 sm:pl-0">
            <span class="text-[11px] font-black font-mono" :class="walletStore.spendableBalance >= estimatedTotal ? 'text-emerald-600' : 'text-amber-600'">
              {{ formatCurrency(walletStore.spendableBalance) }}
            </span>
            <span
              v-if="selectedPaymentMethod === 'wallet'"
              class="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full"
            >
              Selected ✓
            </span>
          </div>
        </div>

        <!-- Layer 6: Cash on Delivery (COD) -->
        <div
          class="relative p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          :class="
            selectedPaymentMethod === 'cod'
              ? 'border-teal-500 bg-teal-50/40 shadow-sm ring-1 ring-teal-500/30'
              : 'border-slate-200 bg-white hover:border-slate-300'
          "
          @click="handleSelectPaymentMethod('cod')"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              :class="selectedPaymentMethod === 'cod' ? 'border-teal-500 bg-teal-500' : 'border-slate-300 bg-white'"
            >
              <div v-if="selectedPaymentMethod === 'cod'" class="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
              💵
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-xs sm:text-sm font-extrabold text-slate-900">Cash on Delivery (COD)</h4>
                <span class="text-[9px] font-extrabold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                  Doorstep Pay
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                Pay in cash directly to your courier rider upon receiving package at your door
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center pl-8 sm:pl-0">
            <span class="text-[10px] font-bold text-slate-400">Pay on Hand</span>
            <span
              v-if="selectedPaymentMethod === 'cod'"
              class="text-[10px] font-extrabold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full"
            >
              Selected ✓
            </span>
          </div>
        </div>
      </div>

      <!-- Option 1 Details: Instant QR Ph Showcase -->
      <div
        v-if="selectedPaymentMethod === 'paymongo_qrph'"
        class="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-slate-50 rounded-2xl p-5 border border-amber-200/80 space-y-3.5 animate-fade-in"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/60">
          <div class="flex items-center gap-2.5">
            <img
              src="/images/qr/qrph-logo.png"
              alt="QR Ph"
              class="h-7 w-auto object-contain bg-white px-2 py-0.5 rounded-lg border border-amber-200/80 shadow-2xs"
            />
            <div>
              <h5 class="text-xs font-extrabold text-slate-900">How Instant QR Ph Works</h5>
              <p class="text-[10px] text-slate-500 font-medium">Automatic verification in real-time</p>
            </div>
          </div>
          <span class="text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300/50">
            Payable Amount: <span class="font-mono font-black text-rose-600">{{ formatCurrency(estimatedTotal) }}</span>
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
          <div class="bg-white/80 p-3 rounded-xl border border-amber-200/50 shadow-xs space-y-1">
            <span class="font-black text-amber-600 text-xs">1. Tap Place Order</span>
            <p class="text-[11px] text-slate-600 leading-tight">
              A unique, secure dynamic QR Ph code is generated instantly on the confirmation screen.
            </p>
          </div>
          <div class="bg-white/80 p-3 rounded-xl border border-amber-200/50 shadow-xs space-y-1">
            <span class="font-black text-amber-600 text-xs">2. Scan from Any Bank</span>
            <p class="text-[11px] text-slate-600 leading-tight">
              Open GCash, Maya, BDO, BPI, GoTyme, or any QR Ph app and scan the code.
            </p>
          </div>
          <div class="bg-white/80 p-3 rounded-xl border border-amber-200/50 shadow-xs space-y-1">
            <span class="font-black text-emerald-600 text-xs">3. Verified Instantly</span>
            <p class="text-[11px] text-slate-600 leading-tight">
              No receipt emails or screenshots needed. The page confirms your payment immediately!
            </p>
          </div>
        </div>

        <div class="bg-white/60 p-2.5 rounded-xl border border-amber-200/40 flex items-center justify-between text-[11px] text-slate-500">
          <span class="flex items-center gap-1.5 font-medium">
            <span>🛡️</span>
            <span>BSP Certified QR Ph Standard &bull; 256-Bit SSL Encrypted</span>
          </span>
          <span class="text-emerald-700 font-bold text-[10px]">Zero manual review delay</span>
        </div>
      </div>

      <!-- Option 2 Details: BPI Online Direct Debit -->
      <div
        v-else-if="selectedPaymentMethod === 'paymongo_bpi'"
        class="bg-gradient-to-br from-red-500/10 via-red-50/50 to-slate-50 rounded-2xl p-5 border border-red-200/80 space-y-3.5 animate-fade-in"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-red-200/60">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              🏛️
            </div>
            <div>
              <h5 class="text-xs font-extrabold text-slate-900">BPI Online Direct Debit</h5>
              <p class="text-[10px] text-slate-500 font-medium">Bank of the Philippine Islands direct debit authorization</p>
            </div>
          </div>
          <span class="text-[11px] font-bold text-red-900 bg-red-100/80 px-2.5 py-0.5 rounded-full border border-red-300/50">
            Payable Amount: <span class="font-mono font-black text-rose-600">{{ formatCurrency(estimatedTotal) }}</span>
          </span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
          <div class="bg-white/80 p-3 rounded-xl border border-red-200/50 shadow-xs space-y-1">
            <span class="font-black text-red-600 text-xs">1. Tap Place Order</span>
            <p class="text-[11px] text-slate-600 leading-tight">You will be securely redirected to the BPI authentication gateway.</p>
          </div>
          <div class="bg-white/80 p-3 rounded-xl border border-red-200/50 shadow-xs space-y-1">
            <span class="font-black text-red-600 text-xs">2. Authorize via OTP</span>
            <p class="text-[11px] text-slate-600 leading-tight">Log in to your BPI account and verify with Mobile Key / OTP.</p>
          </div>
          <div class="bg-white/80 p-3 rounded-xl border border-red-200/50 shadow-xs space-y-1">
            <span class="font-black text-emerald-600 text-xs">3. Real-Time Success</span>
            <p class="text-[11px] text-slate-600 leading-tight">Your payment is confirmed in real-time with 0% processing fees.</p>
          </div>
        </div>
      </div>

      <!-- Option 3 Details: UnionBank Online Direct Debit -->
      <div
        v-else-if="selectedPaymentMethod === 'paymongo_ubp'"
        class="bg-gradient-to-br from-orange-500/10 via-orange-50/50 to-slate-50 rounded-2xl p-5 border border-orange-200/80 space-y-3.5 animate-fade-in"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-orange-200/60">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-orange-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
              🟧
            </div>
            <div>
              <h5 class="text-xs font-extrabold text-slate-900">UnionBank (UB) Online Direct Debit</h5>
              <p class="text-[10px] text-slate-500 font-medium">UnionBank Philippines direct debit authorization</p>
            </div>
          </div>
          <span class="text-[11px] font-bold text-orange-900 bg-orange-100/80 px-2.5 py-0.5 rounded-full border border-orange-300/50">
            Payable Amount: <span class="font-mono font-black text-rose-600">{{ formatCurrency(estimatedTotal) }}</span>
          </span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
          <div class="bg-white/80 p-3 rounded-xl border border-orange-200/50 shadow-xs space-y-1">
            <span class="font-black text-orange-600 text-xs">1. Tap Place Order</span>
            <p class="text-[11px] text-slate-600 leading-tight">You will be securely redirected to the official UnionBank gateway.</p>
          </div>
          <div class="bg-white/80 p-3 rounded-xl border border-orange-200/50 shadow-xs space-y-1">
            <span class="font-black text-orange-600 text-xs">2. Enter UB Credentials</span>
            <p class="text-[11px] text-slate-600 leading-tight">Authenticate with your UnionBank Online login and SMS OTP.</p>
          </div>
          <div class="bg-white/80 p-3 rounded-xl border border-orange-200/50 shadow-xs space-y-1">
            <span class="font-black text-emerald-600 text-xs">3. Real-Time Success</span>
            <p class="text-[11px] text-slate-600 leading-tight">Your payment is immediately verified and order moves to packing.</p>
          </div>
        </div>
      </div>

      <!-- Option 4 Details: Static QR Merchant Selection & Live QR Display -->
      <div v-else-if="selectedPaymentMethod === 'qr'" class="space-y-4 pt-1 animate-fade-in">
        <div>
          <label class="block text-xs font-extrabold text-slate-800 mb-1.5">
            Select Your Receiving Wallet / Bank:
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="merch in paymentMerchants"
              :key="merch.code"
              type="button"
              class="px-3 py-2.5 rounded-xl border-2 text-xs font-extrabold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center"
              :class="
                selectedMerchantCode === merch.code
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
              "
              @click="handleSelectMerchant(merch.code)"
            >
              <span>{{ merch.name }}</span>
              <span
                class="text-[9px] font-medium"
                :class="selectedMerchantCode === merch.code ? 'text-indigo-100' : 'text-slate-400'"
              >
                {{ merch.code === 'gotyme' ? 'No transfer fee' : 'InstaPay QR' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Static QR Code Display Box with Explicit User Instruction -->
        <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
          <!-- Exact Instruction Banner Required by User -->
          <div class="bg-indigo-50/80 border border-indigo-200 text-indigo-900 p-3.5 rounded-xl text-xs font-semibold leading-relaxed">
            <div class="flex items-center gap-1.5 font-extrabold text-indigo-950 mb-0.5">
              <span>📌 Payment Instruction:</span>
            </div>
            Scan this <strong>{{ selectedMerchant.name }}</strong> QR, input the exact total of
            <strong class="text-rose-600 font-mono text-sm underline">{{ formatCurrency(estimatedTotal) }}</strong>,
            and reply to your confirmation email with the payment screenshot.
          </div>

          <!-- QR Image & Receiving Account Box -->
          <div class="flex flex-col sm:flex-row items-center gap-5 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div class="bg-white p-2 rounded-xl border border-slate-200 shadow-xs shrink-0 text-center">
              <img
                :src="selectedMerchant.qr_image_url"
                :alt="`${selectedMerchant.name} QR Code`"
                class="w-44 h-auto rounded-lg mx-auto object-contain"
              />
              <span class="text-[10px] font-bold text-slate-400 block mt-1">
                Scan via {{ selectedMerchant.name }}
              </span>
            </div>

            <div class="space-y-2 text-xs flex-1 text-center sm:text-left">
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400">Receiving Merchant</span>
                <p class="font-black text-slate-900 text-sm">{{ selectedMerchant.name }}</p>
              </div>

              <div v-if="selectedMerchant.account_name">
                <span class="text-[10px] uppercase font-bold text-slate-400">Account Name</span>
                <p class="font-extrabold text-slate-800">{{ selectedMerchant.account_name }}</p>
              </div>

              <div v-if="selectedMerchant.account_number">
                <span class="text-[10px] uppercase font-bold text-slate-400">Account / ID Number</span>
                <p class="font-mono font-bold text-indigo-700">{{ selectedMerchant.account_number }}</p>
              </div>

              <div class="pt-1">
                <span class="text-[10px] uppercase font-bold text-slate-400">Payable Amount</span>
                <p class="text-lg font-black text-rose-600 font-mono">{{ formatCurrency(estimatedTotal) }}</p>
              </div>
            </div>
          </div>

          <!-- Explanation of Zero-Cost Manual Verification Flow -->
          <div class="text-[11px] text-slate-500 space-y-1 bg-white/60 p-3 rounded-xl border border-slate-200/60">
            <div class="font-bold text-slate-700 flex items-center gap-1.5">
              <span>💡 Zero-Cost Static QR Flow:</span>
            </div>
            <p>
              1. When you click <strong>Place Order</strong>, your order is saved as <strong>Pending</strong>.
            </p>
            <p>
              2. Our Laravel email engine will automatically dispatch an email attaching this static QR code image.
            </p>
            <p>
              3. You transfer the exact amount and reply with your receipt screenshot. We will verify and mark your order as <strong>Paid</strong>!
            </p>
          </div>
        </div>
      </div>

      <!-- Option 5 Details: Escrow Wallet Balance Payment Confirmation -->
      <div
        v-else-if="selectedPaymentMethod === 'wallet'"
        class="bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-slate-50 rounded-2xl p-5 border border-emerald-200/80 space-y-4 animate-fade-in"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-200/60">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              💳
            </div>
            <div>
              <h5 class="text-xs font-extrabold text-slate-900">Collector Escrow Vault Checkout</h5>
              <p class="text-[10px] text-slate-500 font-medium">Instant ledger debit &bull; 0% payment transaction fees</p>
            </div>
          </div>
          <span class="text-[11px] font-bold text-emerald-900 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300/50">
            Payable Amount: <span class="font-mono font-black text-rose-600">{{ formatCurrency(estimatedTotal) }}</span>
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="bg-white p-3.5 rounded-xl border border-emerald-200/70 shadow-xs space-y-1">
            <span class="text-[10px] font-bold uppercase text-slate-400">Available Spendable Funds</span>
            <p class="text-base font-black font-mono text-emerald-600">
              {{ formatCurrency(walletStore.spendableBalance) }}
            </p>
            <p class="text-[10px] text-slate-500">
              Active ledger balance in your verified collector account.
            </p>
          </div>

          <div class="bg-white p-3.5 rounded-xl border border-emerald-200/70 shadow-xs space-y-1">
            <span class="text-[10px] font-bold uppercase text-slate-400">Balance After Order</span>
            <p
              class="text-base font-black font-mono"
              :class="walletStore.spendableBalance >= estimatedTotal ? 'text-slate-800' : 'text-rose-600'"
            >
              {{ formatCurrency(Math.max(0, walletStore.spendableBalance - estimatedTotal)) }}
            </p>
            <p v-if="walletStore.spendableBalance < estimatedTotal" class="text-[10px] text-rose-500 font-semibold">
              Needs {{ formatCurrency(estimatedTotal - walletStore.spendableBalance) }} top-up.
            </p>
            <p v-else class="text-[10px] text-emerald-600 font-semibold">
              Instant fulfillment approval upon placing order!
            </p>
          </div>
        </div>

        <div v-if="walletStore.spendableBalance < estimatedTotal" class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <span class="font-medium">Insufficient balance to complete checkout.</span>
          <router-link
            to="/wallet"
            target="_blank"
            class="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-colors"
          >
            ⚡ Top Up Wallet
          </router-link>
        </div>
      </div>

      <!-- Option 6 Details: Cash on Delivery (COD) -->
      <div
        v-else-if="selectedPaymentMethod === 'cod'"
        class="bg-gradient-to-br from-teal-500/10 via-teal-50/50 to-slate-50 rounded-2xl p-5 border border-teal-200/80 space-y-3.5 animate-fade-in"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-teal-200/60">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-teal-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              💵
            </div>
            <div>
              <h5 class="text-xs font-extrabold text-slate-900">Cash on Delivery (COD)</h5>
              <p class="text-[10px] text-slate-500 font-medium">Doorstep collection upon handover</p>
            </div>
          </div>
          <span class="text-[11px] font-bold text-teal-900 bg-teal-100/80 px-2.5 py-0.5 rounded-full border border-teal-300/50">
            Total Due on Delivery: <span class="font-mono font-black text-teal-700">{{ formatCurrency(estimatedTotal) }}</span>
          </span>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed">
          Please prepare exact cash amount of <strong class="text-slate-900 font-mono">{{ formatCurrency(estimatedTotal) }}</strong> upon package delivery. The courier rider will verify the recipient and provide your physical delivery slip.
        </p>
      </div>
    </div>

    <!-- Place Order Button -->
    <BaseButton
      type="submit"
      variant="primary"
      size="lg"
      fullWidth
      :loading="isSubmitting"
    >
      <span v-if="selectedPaymentMethod === 'paymongo_qrph'">
        Generate Dynamic QR Ph &amp; Place Order ⚡
      </span>
      <span v-else-if="selectedPaymentMethod === 'paymongo_bpi'">
        Proceed to BPI Online Direct Debit 🏛️
      </span>
      <span v-else-if="selectedPaymentMethod === 'paymongo_ubp'">
        Proceed to UnionBank Online Direct Debit 🟧
      </span>
      <span v-else-if="selectedPaymentMethod === 'wallet'">
        Pay with Wallet Balance &amp; Place Order 💳
      </span>
      <span v-else-if="selectedPaymentMethod === 'cod'">
        Place Order (Cash on Delivery) 💵
      </span>
      <span v-else>
        Place Order &amp; Receive Instructions 📲
      </span>
    </BaseButton>
  </form>
</template>
