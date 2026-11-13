<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "@/modules/cart/cart.store";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useThemeStore } from "@/shared/stores/theme.store";
import { useCheckoutStore } from "./checkout.store";
import CheckoutForm from "./components/CheckoutForm.vue";
import OrderSummary from "./components/OrderSummary.vue";
import OrderSuccessModal from "./components/OrderSuccessModal.vue";
import BaseButton from "@/shared/components/BaseButton.vue";
import type { CheckoutFormData } from "@/shared/types/toy.types";

const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const checkoutStore = useCheckoutStore();

onMounted(async () => {
  await cartStore.fetchShippingTax();
  if (!authStore.isAuthenticated) {
    authStore.openAuthModal(
      "Please sign in or create an account to proceed to checkout.",
    );
    router.replace("/");
  }
});

const currentDeliveryOption = ref<"standard" | "express" | "gift-wrapped">(
  "standard",
);

const handleDeliveryChange = (opt: "standard" | "express" | "gift-wrapped") => {
  currentDeliveryOption.value = opt;
};

const handleSubmitOrder = async (data: CheckoutFormData) => {
  await checkoutStore.placeOrder(data);
};
</script>

<template>
  <div class="min-h-screen py-8 sm:py-10 font-display">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <!-- Title & Progress -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 transition-colors"
        :class="themeStore.isDark ? 'border-slate-800' : 'border-amber-200/80'"
      >
        <div>
          <button
            type="button"
            class="text-xs font-bold flex items-center gap-1.5 mb-1 cursor-pointer transition-colors"
            :class="themeStore.isDark ? 'text-slate-400 hover:text-amber-400' : 'text-slate-500 hover:text-amber-600'"
            @click="router.back()"
          >
            &larr; Back to Store
          </button>
          <h1
            class="text-2xl sm:text-3xl font-extrabold tracking-tight transition-colors"
            :class="themeStore.isDark ? 'text-white' : 'text-slate-900'"
          >
            Checkout
          </h1>
        </div>

        <div class="flex items-center gap-2 text-xs font-bold">
          <span class="text-emerald-500 flex items-center gap-1">
            <span>✓</span> Bag
          </span>
          <span :class="themeStore.isDark ? 'text-slate-600' : 'text-slate-300'">&gt;</span>
          <span
            class="px-3 py-1 rounded-full border text-amber-400 bg-amber-400/10 border-amber-400/30"
          >
            Shipping &amp; Payment
          </span>
          <span :class="themeStore.isDark ? 'text-slate-600' : 'text-slate-300'">&gt;</span>
          <span :class="themeStore.isDark ? 'text-slate-500' : 'text-slate-400'">Order Placed</span>
        </div>
      </div>

      <!-- Empty Cart Guard -->
      <div
        v-if="
          cartStore.selectedItems.length === 0 &&
          !checkoutStore.isSuccessModalOpen
        "
        class="rounded-3xl p-12 text-center border shadow-sm max-w-lg mx-auto space-y-4"
        :class="
          themeStore.isDark
            ? 'bg-slate-900/80 border-slate-800 text-slate-100'
            : 'bg-white border-amber-200/80 text-slate-800'
        "
      >
        <div class="text-5xl">🛍️</div>
        <h3
          class="text-xl font-bold"
          :class="themeStore.isDark ? 'text-white' : 'text-slate-800'"
        >
          {{
            cartStore.items.length === 0
              ? "Your Cart is Currently Empty"
              : "No Items Selected for Checkout"
          }}
        </h3>
        <p
          class="text-xs max-w-xs mx-auto"
          :class="themeStore.isDark ? 'text-slate-400' : 'text-slate-500'"
        >
          {{
            cartStore.items.length === 0
              ? "Please select items from our catalog before proceeding to checkout."
              : "Please select which items you would like to proceed with in your cart."
          }}
        </p>
        <BaseButton
          variant="primary"
          size="md"
          @click="
            cartStore.items.length === 0
              ? router.push('/catalog')
              : cartStore.openDrawer()
          "
        >
          {{
            cartStore.items.length === 0
              ? "Browse Store Catalog 🛍️"
              : "Open Cart & Select Items 🛒"
          }}
        </BaseButton>
      </div>

      <!-- Main Checkout Grid -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left: Multi-step Form (7 cols) -->
        <div class="lg:col-span-7">
          <CheckoutForm
            :is-submitting="checkoutStore.isSubmitting"
            @delivery-change="handleDeliveryChange"
            @submit-order="handleSubmitOrder"
          />
        </div>

        <!-- Right: Order Summary Sticky Card (5 cols) -->
        <div class="lg:col-span-5 sticky top-28">
          <OrderSummary :selected-delivery-option="currentDeliveryOption" />
        </div>
      </div>

      <!-- Success Celebration Modal -->
      <OrderSuccessModal
        :order="checkoutStore.lastPlacedOrder"
        :is-open="checkoutStore.isSuccessModalOpen"
        @close="checkoutStore.closeSuccessModal"
      />
    </div>
  </div>
</template>
