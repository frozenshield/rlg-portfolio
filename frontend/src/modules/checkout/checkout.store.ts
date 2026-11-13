import { defineStore } from "pinia";
import { ref } from "vue";
import { useStorage } from "@vueuse/core";
import type { CheckoutFormData, PlacedOrder } from "@/shared/types/toy.types";
import { useCartStore } from "../cart/cart.store";
import { useAuthStore } from "../auth/auth.store";
import { resolveApiUrl } from "@/shared/utils/api";

export const useCheckoutStore = defineStore("checkoutStore", () => {
  const cartStore = useCartStore();
  const authStore = useAuthStore();

  // Last completed order
  const lastPlacedOrder = ref<PlacedOrder | null>(null);
  const isSuccessModalOpen = ref(false);
  const isSubmitting = ref(false);

  // Saved orders history
  const orderHistory = useStorage<PlacedOrder[]>("rlg-shop-order-history", []);

  const initialFormData: CheckoutFormData = {
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
  };

  const formData = ref<CheckoutFormData>({ ...initialFormData });

  // Delivery option fees
  const getDeliveryFee = (
    option?: "standard" | "express" | "gift-wrapped",
  ): number => {
    switch (option) {
      case "express":
        return 12.99;
      case "gift-wrapped":
        return 7.99;
      case "standard":
      default:
        return cartStore.standardShippingCost;
    }
  };

  const placeOrder = async (data: CheckoutFormData): Promise<PlacedOrder> => {
    isSubmitting.value = true;

    // Simulate payment processing latency
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const selectedList = [...cartStore.selectedItems];
    if (selectedList.length === 0) {
      isSubmitting.value = false;
      throw new Error("No items selected for checkout.");
    }

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const shippingFee = getDeliveryFee(data.deliveryOption);
    const taxableBase = Math.max(
      0,
      cartStore.subtotal - cartStore.promoDiscount,
    );
    const vatPercentage = cartStore.vatPercentage;
    const vatAmount = (taxableBase * vatPercentage) / 100;
    const orderTotal = Math.max(0, taxableBase + shippingFee + vatAmount);

    const deliveryDays = data.deliveryOption === "express" ? 2 : 4;
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + deliveryDays);

    const order: PlacedOrder = {
      orderId,
      items: selectedList,
      subtotal: cartStore.subtotal,
      shippingCost: shippingFee,
      vatPercentage,
      vatAmount,
      discountAmount: cartStore.promoDiscount,
      total: orderTotal,
      shippingDetails: { ...data },
      createdAt: new Date().toISOString(),
      estimatedDeliveryDate: estDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };

    // Attempt to persist to backend customer_order table
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (authStore.token) {
        headers["Authorization"] = `Bearer ${authStore.token}`;
      }

      const res = await fetch(resolveApiUrl("/api/customer-orders"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          order_number: orderId,
          customer_name: `${data.firstName} ${data.lastName}`.trim(),
          customer_email: data.email,
          customer_phone: data.phone,
          shipping_address: data.streetAddress,
          city: data.city,
          postal_code: data.postalCode,
          carrier_id: data.carrierId || null,
          save_to_profile: !!data.saveToProfile,
          payment_method:
            data.paymentMethod === "paymongo_qrph"
              ? "paymongo_qrph"
              : data.paymentMethod === "paymongo_bpi"
                ? "paymongo_bpi"
                : data.paymentMethod === "paymongo_ubp"
                  ? "paymongo_ubp"
              : data.paymentMethod === "qr"
                ? `QR - ${(data.qrMerchantCode || "gotyme").toUpperCase()}`
                : data.paymentMethod.toUpperCase(),
          payment_option: data.paymentMethod,
          qr_merchant_code: data.qrMerchantCode || "gotyme",
          total_amount: orderTotal,
          shipping_amount: shippingFee,
          tax_amount: vatAmount,
          notes: data.notes || undefined,
          items: selectedList.map((item) => ({
            product_name: item.toy.name,
            sku: item.toy.slug || "TCG-ITEM",
            price: item.toy.price,
            quantity: item.quantity,
            image_url: item.toy.imageUrl,
          })),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.order_number) {
            order.orderId = json.data.order_number;
          }
          order.backendId = json.data.id;
          order.paymentStatus = json.data.payment_status || "Pending";
          order.paymentDetails = json.data.payment_details || null;
        }
      }
    } catch (e) {
      console.warn("Could not post order to backend", e);
    }

    lastPlacedOrder.value = order;
    orderHistory.value.unshift(order);

    // Remove only the selected items that were checked out!
    cartStore.removeSelectedItems();

    isSubmitting.value = false;
    isSuccessModalOpen.value = true;

    return order;
  };

  const closeSuccessModal = () => {
    isSuccessModalOpen.value = false;
  };

  const resetForm = () => {
    formData.value = { ...initialFormData };
  };

  return {
    lastPlacedOrder,
    isSuccessModalOpen,
    isSubmitting,
    orderHistory,
    formData,
    placeOrder,
    closeSuccessModal,
    resetForm,
    getDeliveryFee,
  };
});
