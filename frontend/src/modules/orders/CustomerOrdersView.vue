<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useCheckoutStore } from "@/modules/checkout/checkout.store";
import { useCatalogStore } from "@/modules/catalog/catalog.store";
import { formatCurrency } from "@/shared/utils/currency.util";
import { resolveApiUrl, resolveStorageUrl } from "@/shared/utils/api";
import BaseBadge from "@/shared/components/BaseBadge.vue";
import BaseButton from "@/shared/components/BaseButton.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const checkoutStore = useCheckoutStore();
const catalogStore = useCatalogStore();

interface OrderItem {
  id?: number | string;
  product_id?: number | string;
  product_name?: string;
  name?: string;
  sku?: string;
  price: number | string;
  quantity: number;
  subtotal?: number | string;
  image_url?: string;
  toy?: any;
}

interface OrderRecord {
  id: string | number;
  orderNumber: string;
  createdAt: string;
  status: string;
  statusLabel?: string;
  statusBadgeColor?: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  city?: string;
  postalCode?: string;
  notes?: string;
  carrierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  paymentIntentId?: string | null;
  paymentDetails?: any;
  items: OrderItem[];
}

const orders = ref<OrderRecord[]>([]);
const isLoading = ref(true);
const searchQuery = ref("");
const selectedFilter = ref<
  "all" | "shipped" | "delivered" | "processing" | "completed" | "cancelled" | "vault"
>("all");
const selectedOrderForModal = ref<OrderRecord | null>(null);

// Digital Vault Shipments Tracking
const vaultShipments = ref<any[]>([]);
const isVaultLoading = ref(false);

const fetchVaultShipments = async () => {
  if (!authStore.isAuthenticated) return;
  isVaultLoading.value = true;
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (authStore.token) {
      headers["Authorization"] = "Bearer " + authStore.token;
    }
    if (authStore.currentUser?.id) {
      headers['X-User-Id'] = String(authStore.currentUser.id);
    }
    const res = await fetch(resolveApiUrl('/vault/shipments'), { headers });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        vaultShipments.value = json.data;
      }
    }
  } catch {
    vaultShipments.value = [];
  } finally {
    isVaultLoading.value = false;
  }
};

// Pagination and Per-Page state
const perPageOptions = [5, 10, 20, 50];
const perPage = ref<number>(5);
const currentPage = ref<number>(1);

const openAuthModal = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-auth-modal"));
  }
};

const fetchOrders = async () => {
  isLoading.value = true;
  try {
    const headers: Record<string, string> = {};
    if (authStore.token) {
      headers["Authorization"] = `Bearer ${authStore.token}`;
    }

    const res = await fetch("/api/customer-orders", { headers });
    let dbOrders: OrderRecord[] = [];
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        dbOrders = json.data.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          createdAt: o.created_at || o.order_date,
          status: o.status?.name || "processing",
          statusLabel: o.status?.label || "Processing",
          statusBadgeColor: o.status?.badge_color || "blue",
          totalAmount: parseFloat(o.total_amount) || 0,
          paymentMethod: o.payment_method || "Credit Card",
          paymentStatus: o.payment_status || "Paid",
          customerName:
            o.customer_profile?.name ||
            o.customer_profile?.user?.name ||
            "Collector",
          customerEmail:
            o.customer_profile?.user?.email ||
            authStore.currentUser?.email ||
            "collector@rlghobby.com",
          customerPhone:
            o.customer_profile?.phone ||
            o.customer_profile?.shipping_address?.phone ||
            undefined,
          shippingAddress:
            o.customer_profile?.shipping_address?.shipping_address ||
            o.customer_profile?.address_line1 ||
            "Metro Manila, Philippines",
          city:
            o.customer_profile?.shipping_address?.city ||
            o.customer_profile?.city ||
            "Metro Manila",
          postalCode:
            o.customer_profile?.shipping_address?.postal_code ||
            o.customer_profile?.postal_code ||
            "",
          notes: o.notes || "",
          carrierName:
            o.fulfillment?.carrier?.short_name ||
            o.fulfillment?.carrier?.name ||
            "J&T Express",
          trackingNumber: o.fulfillment?.tracking_number || undefined,
          trackingUrl:
            o.fulfillment?.carrier?.tracking_url_template &&
            o.fulfillment?.tracking_number
              ? o.fulfillment.carrier.tracking_url_template.replace(
                  "{tracking}",
                  o.fulfillment.tracking_number,
                )
              : undefined,
          paymentIntentId: o.payment_intent_id || null,
          paymentDetails: o.payment_details || null,
          items: (o.items || []).map((it: any) => ({
            id: it.id,
            product_id: it.product_id || it.product?.id,
            product_name: it.product_name || it.product?.name || "Collector Product",
            sku: it.sku || it.product?.sku || "TCG-ITEM",
            price: parseFloat(it.price) || 0,
            quantity: it.quantity || 1,
            image_url:
              resolveStorageUrl(it.image_url || it.product?.image_url) ||
              "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&auto=format&fit=crop&q=80",
          })),
        }));

        // Also merge local storage placed orders from current session
        const localOrders = checkoutStore.orderHistory.map((lo) => {
          const isCard = lo.shippingDetails.paymentMethod === "card";
          const isCancelled =
            (lo as any).status === "cancel" ||
            (lo as any).status === "cancelled" ||
            (lo as any).paymentStatus === "Cancelled";

          return {
            id: lo.orderId,
            orderNumber: lo.orderId,
            createdAt: lo.createdAt,
            status: isCancelled ? "cancel" : isCard ? "processing" : "pending",
            statusLabel: isCancelled ? "Cancelled" : isCard ? "Processing" : "Pending",
            statusBadgeColor: isCancelled ? "rose" : isCard ? "blue" : "amber",
            totalAmount: lo.total,
            paymentMethod: lo.shippingDetails.paymentMethod.toUpperCase(),
            paymentStatus: isCancelled ? "Cancelled" : isCard ? "Paid" : "Pending",
            customerName:
              `${lo.shippingDetails.firstName} ${lo.shippingDetails.lastName}`.trim(),
            customerEmail: lo.shippingDetails.email,
            customerPhone: lo.shippingDetails.phone,
            shippingAddress: lo.shippingDetails.streetAddress,
            city: lo.shippingDetails.city,
            postalCode: lo.shippingDetails.postalCode || "",
            notes: lo.shippingDetails.notes || "",
            carrierName: "J&T Express (Standard)",
            trackingNumber: `PH-${Math.floor(100000000 + Math.random() * 900000000)}`,
            trackingUrl: "https://www.jtexpress.ph",
            items: lo.items.map((it) => ({
              id: (it as any).id,
              product_id: (it as any).product_id || (it as any).toy?.id ? Number((it as any).toy.id) : undefined,
              product_name: it.toy.name,
              sku: it.toy.slug || "TCG-COLLECTIBLE",
              price: it.toy.price,
              quantity: it.quantity,
              image_url: it.toy.imageUrl,
            })),
          };
        });

        const existingMap = new Map(dbOrders.map((d) => [d.orderNumber, d]));
        for (const lo of checkoutStore.orderHistory) {
          const matchedDb = existingMap.get(lo.orderId);
          if (matchedDb) {
            (lo as any).status = matchedDb.status;
            (lo as any).paymentStatus = matchedDb.paymentStatus;
          }
        }
        const filteredLocals = localOrders.filter(
          (l) => !existingMap.has(l.orderNumber),
        );
        orders.value = [...filteredLocals, ...dbOrders];
      }
    }
  } catch (e) {
    console.error("Failed to load customer orders", e);
  } finally {
    isLoading.value = false;
  }
};

// Customer reviews mapping & review modal state
const userReviewsMap = ref<Record<string, { stars: number; message: string }>>({});
const isReviewModalOpen = ref(false);
const activeReviewItem = ref<OrderItem | null>(null);
const activeReviewOrder = ref<OrderRecord | null>(null);
const reviewRating = ref<number>(5);
const reviewHoverRating = ref<number>(0);
const reviewMessage = ref<string>("");
const isSubmittingReview = ref<boolean>(false);
const reviewSuccessMsg = ref<string>("");
const reviewErrorMsg = ref<string>("");

const fetchUserReviews = async () => {
  try {
    const res = await fetch("/api/customer-reviews");
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const map: Record<string, { stars: number; message: string }> = {};
        json.data.forEach((r: any) => {
          if (r.product_id) {
            map[String(r.product_id)] = {
              stars: Number(r.stars),
              message: r.message,
            };
          }
        });
        userReviewsMap.value = map;
      }
    }
  } catch (e) {
    console.error("Failed to fetch customer reviews:", e);
  }
};

const isOrderCompleted = (o: OrderRecord | null | undefined): boolean => {
  if (!o) return false;
  const s = (o.status || "").toLowerCase().trim();
  const l = (o.statusLabel || "").toLowerCase().trim();
  return (
    s === "completed" ||
    s === "accepted" ||
    s.includes("complete") ||
    s.includes("accept") ||
    l.includes("completed")
  );
};

const openReviewModal = (item: OrderItem, order: OrderRecord) => {
  activeReviewItem.value = item;
  activeReviewOrder.value = order;
  const pId = item.product_id || item.id;
  const existing = pId ? userReviewsMap.value[String(pId)] : null;
  if (existing) {
    reviewRating.value = existing.stars;
    reviewMessage.value = existing.message;
  } else {
    reviewRating.value = 5;
    reviewMessage.value = "";
  }
  reviewHoverRating.value = 0;
  reviewSuccessMsg.value = "";
  reviewErrorMsg.value = "";
  isReviewModalOpen.value = true;
};

const closeReviewModal = () => {
  isReviewModalOpen.value = false;
  activeReviewItem.value = null;
  activeReviewOrder.value = null;
};

const handleConfirmReview = async () => {
  if (!activeReviewItem.value) return;
  if (!reviewMessage.value.trim()) {
    reviewErrorMsg.value = "Please write a brief collector review message.";
    return;
  }

  isSubmittingReview.value = true;
  reviewErrorMsg.value = "";
  reviewSuccessMsg.value = "";

  try {
    let productId = activeReviewItem.value.product_id;
    if (!productId && activeReviewItem.value.sku) {
      const match = catalogStore.toys.find(
        (t) =>
          t.slug === activeReviewItem.value?.sku ||
          t.name === activeReviewItem.value?.product_name
      );
      if (match) productId = match.id;
    }
    if (!productId) {
      productId = 1;
    }

    const payload = {
      product_id: Number(productId),
      stars: reviewRating.value,
      message: reviewMessage.value.trim(),
      user_id: authStore.currentUser?.id,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (authStore.token) {
      headers["Authorization"] = `Bearer ${authStore.token}`;
    }

    const res = await fetch("/api/customer-reviews", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      reviewSuccessMsg.value = "Review and rating published successfully!";
      userReviewsMap.value[String(productId)] = {
        stars: reviewRating.value,
        message: reviewMessage.value.trim(),
      };
      catalogStore.fetchProducts(true);
      setTimeout(() => {
        closeReviewModal();
      }, 1500);
    } else {
      reviewErrorMsg.value = json.message || "Failed to submit review.";
    }
  } catch (err: any) {
    reviewErrorMsg.value = err?.message || "An error occurred submitting your review.";
  } finally {
    isSubmittingReview.value = false;
  }
};

// ─── 30-MINUTE PAYMENT EXPIRATION & AUTO-CANCEL TIMER ─────────────────────────
const now = ref(Date.now());
let countdownInterval: any = null;
const autoCancelledOrderIds = new Set<string>();

const PAYMENT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes in ms

const getRemainingPaymentTime = (order: OrderRecord | null | undefined) => {
  if (!order || !order.createdAt) {
    return { expired: false, minutes: 30, seconds: 0, formatted: "30:00", remainingMs: PAYMENT_EXPIRY_MS };
  }
  const createdMs = new Date(order.createdAt).getTime();
  if (isNaN(createdMs)) {
    return { expired: false, minutes: 30, seconds: 0, formatted: "30:00", remainingMs: PAYMENT_EXPIRY_MS };
  }
  const expiryTime = createdMs + PAYMENT_EXPIRY_MS;
  const diff = expiryTime - now.value;
  if (diff <= 0) {
    return { expired: true, minutes: 0, seconds: 0, formatted: "00:00", remainingMs: 0 };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return { expired: false, minutes, seconds, formatted, remainingMs: diff };
};

const handleAutoCancelOrder = async (order: OrderRecord) => {
  const key = String(order.id || order.orderNumber);
  if (autoCancelledOrderIds.has(key)) return;
  autoCancelledOrderIds.add(key);

  try {
    const orderId = order.id || order.orderNumber;
    await fetch(resolveApiUrl(`/api/customer-orders/${encodeURIComponent(orderId)}/cancel`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      },
      body: JSON.stringify({ reason: "Order auto-cancelled: 30-minute payment window expired" }),
    });
  } catch (e) {
    console.warn("Could not sync auto-cancel to backend", e);
  }

  // Update order status locally
  order.status = "cancel";
  order.statusLabel = "Cancelled";
  order.statusBadgeColor = "rose";
  order.paymentStatus = "Cancelled";

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rlg-order-status-synced", {
        detail: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: "Canceled",
          paymentStatus: "Cancelled",
        },
      }),
    );
  }

  // Update localStorage guest orders
  try {
    const raw = localStorage.getItem("rlg_guest_orders");
    if (raw) {
      const list = JSON.parse(raw);
      const target = list.find(
        (lo: any) => lo.orderId === order.orderNumber || lo.orderId === String(order.id)
      );
      if (target) {
        target.status = "cancel";
        localStorage.setItem("rlg_guest_orders", JSON.stringify(list));
      }
    }
  } catch {}
};

onMounted(() => {
  fetchOrders();
  fetchUserReviews();

  // If query has order tracking search param
  if (route.query.q) {
    searchQuery.value = String(route.query.q);
  }

  // Start 30-minute expiration countdown timer
  countdownInterval = setInterval(() => {
    now.value = Date.now();
    for (const o of orders.value) {
      if (isOrderPendingPayment(o)) {
        const timer = getRemainingPaymentTime(o);
        if (timer.expired) {
          handleAutoCancelOrder(o);
        }
      }
    }
  }, 1000);
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});

watch(
  () => authStore.token,
  () => {
    fetchOrders();
  },
);

// Cancellation helper and counts
const isOrderCancelled = (o: OrderRecord | null | undefined): boolean => {
  if (!o) return false;
  const s = (o.status || "").toLowerCase().trim();
  const p = (o.paymentStatus || "").toLowerCase().trim();
  return (
    s === "cancel" ||
    s === "cancelled" ||
    s.includes("cancel") ||
    p === "cancelled" ||
    p.includes("cancel")
  );
};

const activeOrdersCount = computed(() => {
  return orders.value.filter((o) => !isOrderCancelled(o)).length;
});

const cancelledOrdersCount = computed(() => {
  return orders.value.filter((o) => isOrderCancelled(o)).length;
});

const filteredOrders = computed(() => {
  return orders.value.filter((o) => {
    const isCancelled = isOrderCancelled(o);

    // Rule: Cancelled orders ONLY show in 'cancelled' filter tab.
    // They are NEVER included in 'all' orders or other active status filters!
    if (selectedFilter.value === "cancelled") {
      if (!isCancelled) return false;
    } else {
      if (isCancelled) return false;

      // Status filter
      if (selectedFilter.value !== "all") {
        const st = (o.status || "").toLowerCase();
        if (
          selectedFilter.value === "shipped" &&
          !st.includes("ship") &&
          !st.includes("transit")
        )
          return false;
        if (selectedFilter.value === "delivered" && !st.includes("deliver"))
          return false;
        if (
          selectedFilter.value === "completed" &&
          !st.includes("complete") &&
          !st.includes("accept")
        )
          return false;
        if (
          selectedFilter.value === "processing" &&
          !st.includes("process") &&
          !st.includes("pend")
        )
          return false;
      }
    }

    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchTrack = o.trackingNumber
        ? o.trackingNumber.toLowerCase().includes(q)
        : false;
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchEmail = o.customerEmail.toLowerCase().includes(q);
      const matchItems = o.items.some((it) =>
        (it.product_name || "").toLowerCase().includes(q),
      );
      return matchNum || matchTrack || matchName || matchEmail || matchItems;
    }

    return true;
  });
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredOrders.value.length / perPage.value));
});

watch([selectedFilter, searchQuery, perPage], () => {
  currentPage.value = 1;
});

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredOrders.value.slice(start, start + perPage.value);
});

const visiblePages = computed(() => {
  const pages: number[] = [];
  const maxButtons = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxButtons / 2));
  let end = Math.min(totalPages.value, start + maxButtons - 1);
  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

const getStatusBadgeClass = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s.includes("complete") || s.includes("accept")) {
    return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
  }
  if (s.includes("deliver")) {
    return "bg-teal-500/20 text-teal-400 border border-teal-500/40";
  }
  if (s.includes("transit")) {
    return "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40";
  }
  if (s.includes("ship")) {
    return "bg-purple-500/20 text-purple-400 border border-purple-500/40";
  }
  if (s.includes("process")) {
    return "bg-blue-500/20 text-blue-400 border border-blue-500/40";
  }
  if (s.includes("cancel")) {
    return "bg-rose-500/20 text-rose-400 border border-rose-500/40";
  }
  if (s.includes("refund")) {
    return "bg-pink-500/20 text-pink-400 border border-pink-500/40";
  }
  return "bg-amber-500/20 text-amber-400 border border-amber-500/40";
};

export interface TimelineStep {
  step: number;
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isPendingPayment?: boolean;
  isCancelled?: boolean;
}

const getStepProgressIndex = (order: OrderRecord): number => {
  if (isOrderCancelled(order)) {
    return 2;
  }
  const s = (order.status || "").toLowerCase().trim();
  const p = (order.paymentStatus || "").toLowerCase().trim();
  const isOrderPending = s === "pending" || s.includes("pend");

  // If order status is Pending or paymentStatus is Pending, keep at Step 1 (Awaiting Payment)
  if (isOrderPending || p === "pending") {
    return 1;
  }

  // Step 7: Completed (Accepted / Completed)
  if (
    s === "completed" ||
    s === "accepted" ||
    s.includes("complete") ||
    s.includes("accept")
  ) {
    return 7;
  }
  // Step 6: Delivered
  if (s === "delivered" || s.includes("deliver")) {
    return 6;
  }
  // Step 5: In Transit
  if (s === "in_transit" || s === "in-transit" || s.includes("transit")) {
    return 5;
  }
  // Step 4: Shipped
  if (s === "shipped" || s.includes("ship")) {
    // If tracking number exists and dispatched, advance into In Transit
    return order.trackingNumber ? 5 : 4;
  }
  // Step 3: Processing
  if (s === "processing" || s.includes("process") || s.includes("pack")) {
    return 3;
  }
  // Step 2: Payment Confirmed / Paid
  const isPaid = p === "paid" || p === "success" || p === "completed";
  if (isPaid) {
    return 2;
  }
  // Step 1: Order Placed (Payment Pending)
  return 1;
};

const getProgressLineWidth = (order: OrderRecord): string => {
  if (isOrderCancelled(order)) {
    return "0%";
  }
  const current = getStepProgressIndex(order);
  const ratio = Math.max(0, Math.min(6, current - 1)) / 6;
  return `${ratio * 85.72}%`;
};

const getTimelineSteps = (order: OrderRecord): TimelineStep[] => {
  const isCancelled = isOrderCancelled(order);
  const current = getStepProgressIndex(order);
  const s = (order.status || "").toLowerCase().trim();
  const p = (order.paymentStatus || "").toLowerCase().trim();
  const isOrderPending = s === "pending" || s.includes("pend");
  const isPaid =
    !isCancelled &&
    !isOrderPending &&
    (p === "paid" || p === "success" || p === "completed" || current >= 3);
  const isCod =
    order.paymentMethod?.toLowerCase().includes("cod") ||
    order.paymentMethod?.toLowerCase().includes("cash");

  return [
    {
      step: 1,
      key: "order-placed",
      title: "Order Placed",
      subtitle: "Verified",
      icon: "✓",
      isCompleted: true,
      isCurrent: !isCancelled && current === 1 && !isPaid,
    },
    {
      step: 2,
      key: "payment",
      title: isCancelled ? "Cancelled" : isPaid ? "Payment Success" : "Payment Pending",
      subtitle: isCancelled
        ? "Order Cancelled"
        : isPaid
          ? `${order.paymentMethod || "Online"} Paid`
          : isCod
            ? "Due on Delivery"
            : "Awaiting Payment",
      icon: isCancelled ? "✕" : isPaid ? "✓" : "⏳",
      isCompleted: isPaid,
      isCurrent: isCancelled || (!isPaid && !isCancelled),
      isPendingPayment: !isPaid && !isCancelled,
      isCancelled: isCancelled,
    },
    {
      step: 3,
      key: "processing",
      title: "Processing",
      subtitle: !isCancelled && current >= 3 ? "Pick & Pack" : "Pending",
      icon: !isCancelled && current > 3 ? "✓" : !isCancelled && current === 3 ? "📦" : "3",
      isCompleted: !isCancelled && current > 3,
      isCurrent: !isCancelled && current === 3,
    },
    {
      step: 4,
      key: "shipped",
      title: "Shipped",
      subtitle:
        !isCancelled && current >= 4
          ? order.carrierName
            ? order.carrierName.split(" ")[0]
            : "Dispatched"
          : "Carrier Dispatch",
      icon: !isCancelled && current > 4 ? "✓" : !isCancelled && current === 4 ? "🏷️" : "4",
      isCompleted: !isCancelled && current > 4,
      isCurrent: !isCancelled && current === 4,
    },
    {
      step: 5,
      key: "in-transit",
      title: "In Transit",
      subtitle:
        !isCancelled && current >= 5
          ? order.trackingNumber
            ? "On the Road"
            : "In Transit"
          : "Logistics Hub",
      icon: !isCancelled && current > 5 ? "✓" : !isCancelled && current === 5 ? "🚚" : "5",
      isCompleted: !isCancelled && current > 5,
      isCurrent: !isCancelled && current === 5,
    },
    {
      step: 6,
      key: "delivered",
      title: "Delivered",
      subtitle: !isCancelled && current >= 6 ? "Package Arrived" : "Collector Handed",
      icon: !isCancelled && current > 6 ? "✓" : !isCancelled && current === 6 ? "🏠" : "6",
      isCompleted: !isCancelled && current >= 6,
      isCurrent: !isCancelled && current === 6,
    },
    {
      step: 7,
      key: "completed",
      title: "Completed",
      subtitle: !isCancelled && current >= 7 ? "Order Finalized" : "Final Step",
      icon: !isCancelled && current >= 7 ? "★" : "7",
      isCompleted: !isCancelled && current >= 7,
      isCurrent: !isCancelled && current === 7,
    },
  ];
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

interface PaymentMerchant {
  id: number;
  name: string;
  code: string;
  account_name: string;
  account_number: string;
  qr_image_url: string;
  instructions: string;
}

const paymentMerchants = ref<PaymentMerchant[]>([
  {
    id: 1,
    name: "GoTyme Bank",
    code: "gotyme",
    account_name: "RUSSEL LUIS GEMENTIZA",
    account_number: "•••••••• 5860",
    qr_image_url: "/images/qr/gotyme-qr.png",
    instructions:
      "Scan with your GoTyme or any InstaPay app. Input the exact total and save transaction screenshot.",
  },
  {
    id: 2,
    name: "GCash",
    code: "gcash",
    account_name: "RU***L LU*S G.",
    account_number: "+63 956 997 ****",
    qr_image_url: "/images/qr/gcash-qr.jpg",
    instructions:
      "Scan via GCash app. Transfer fees may apply. Save transaction receipt to confirm payment.",
  },
  {
    id: 3,
    name: "MariBank",
    code: "maribank",
    account_name: "RUSSEL LUIS GEMENTIZA",
    account_number: "MariBank(****4301)",
    qr_image_url: "/images/qr/maribank-qr.png",
    instructions:
      "Scan via MariBank or any InstaPay e-wallet. Save transfer confirmation.",
  },
  {
    id: 4,
    name: "PayMaya",
    code: "paymaya",
    account_name: "Russel Luis Gementiza",
    account_number: "+63 *** *** 0813 (@russelluis)",
    qr_image_url: "/images/qr/maya-qr.jpg",
    instructions:
      "Scan using Maya app. Transfer fees may apply. Save confirmation receipt.",
  },
]);

// Helper to check whether order is strictly in payment pending status
const isOrderPendingPayment = (
  order: OrderRecord | null | undefined,
): boolean => {
  if (!order) return false;
  const s = (order.status || "").toLowerCase().trim();
  const p = (order.paymentStatus || "").toLowerCase().trim();

  // If order was cancelled, refunded, or already shipped/delivered/completed, it is NOT pending
  if (
    s === "cancel" ||
    s === "cancelled" ||
    s.includes("cancel") ||
    p === "cancelled" ||
    p === "refunded" ||
    s === "completed" ||
    s === "delivered" ||
    s === "shipped" ||
    s === "in_transit"
  ) {
    return false;
  }

  return (
    s === "pending" ||
    s === "payment_pending" ||
    s === "unpaid" ||
    p === "pending" ||
    p === "unpaid"
  );
};

// Edit Pending Order Modal State
const isEditModalOpen = ref(false);
const editingOrder = ref<OrderRecord | null>(null);
const editDynamicQrUrl = ref<string | null>(null);
const isGeneratingEditQr = ref(false);

const editForm = ref({
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  shippingAddress: "",
  city: "",
  postalCode: "",
  paymentMethod: "paymongo_qrph" as "paymongo_qrph" | "qr",
  qrMerchantCode: "gotyme",
  notes: "",
  resendEmail: true,
});
const isSavingEdit = ref(false);
const editSuccessMsg = ref("");
const editErrorMsg = ref("");

// Helper to reproduce/generate dynamic PayMongo QR Ph code inside Edit Modal
const reproduceEditPayMongoQr = async () => {
  if (!editingOrder.value) return;
  const orderRef = editingOrder.value.orderNumber || editingOrder.value.id;
  if (!orderRef) return;

  isGeneratingEditQr.value = true;
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
        editDynamicQrUrl.value = json.qr_details.qr_image_url;
      } else if (json.data?.payment_details?.qr_image_url) {
        editDynamicQrUrl.value = json.data.payment_details.qr_image_url;
      }
    }
  } catch (e) {
    console.warn("Could not reproduce PayMongo QR for order edit", e);
  } finally {
    isGeneratingEditQr.value = false;
  }
};

// Selected merchant helper for edit modal
const selectedEditMerchant = computed(() => {
  return (
    paymentMerchants.value.find(
      (m) => m.code === editForm.value.qrMerchantCode,
    ) || paymentMerchants.value[0]
  );
});

// Cancel Order Confirmation Modal State
const isCancelModalOpen = ref(false);
const cancellingOrder = ref<OrderRecord | null>(null);
const cancelReason = ref("Changed my mind");
const isSubmittingCancel = ref(false);
const cancelSuccessMsg = ref("");
const cancelErrorMsg = ref("");

const openEditOrderModal = (order: OrderRecord) => {
  if (!isOrderPendingPayment(order)) return;
  editingOrder.value = order;

  const pm = (order.paymentMethod || "").toLowerCase();
  let method: "paymongo_qrph" | "qr" = "paymongo_qrph";
  let qrCode = "gotyme";

  if (pm.includes("paymongo") || pm.includes("qrph") || order.paymentDetails?.qr_image_url) {
    method = "paymongo_qrph";
  } else {
    method = "qr";
    if (pm.includes("gcash")) qrCode = "gcash";
    else if (pm.includes("mari")) qrCode = "maribank";
    else if (pm.includes("maya")) qrCode = "paymaya";
    else qrCode = "gotyme";
  }

  editDynamicQrUrl.value = order.paymentDetails?.qr_image_url || null;

  editForm.value = {
    customerName: order.customerName || "",
    customerEmail: order.customerEmail || "",
    customerPhone: order.customerPhone || "",
    shippingAddress: order.shippingAddress || "",
    city: order.city || "",
    postalCode: order.postalCode || "",
    paymentMethod: method,
    qrMerchantCode: qrCode,
    notes: order.notes || "",
    resendEmail: true,
  };
  editSuccessMsg.value = "";
  editErrorMsg.value = "";
  isEditModalOpen.value = true;

  if (method === "paymongo_qrph" && !editDynamicQrUrl.value) {
    reproduceEditPayMongoQr();
  }
};

const openCancelOrderModal = (order: OrderRecord) => {
  if (!isOrderPendingPayment(order)) return;
  cancellingOrder.value = order;
  cancelReason.value = "Changed my mind";
  cancelSuccessMsg.value = "";
  cancelErrorMsg.value = "";
  isCancelModalOpen.value = true;
};

const openEditFromReceipt = () => {
  if (
    selectedOrderForModal.value &&
    isOrderPendingPayment(selectedOrderForModal.value)
  ) {
    const o = selectedOrderForModal.value;
    selectedOrderForModal.value = null;
    openEditOrderModal(o);
  }
};

const openCancelFromReceipt = () => {
  if (
    selectedOrderForModal.value &&
    isOrderPendingPayment(selectedOrderForModal.value)
  ) {
    const o = selectedOrderForModal.value;
    selectedOrderForModal.value = null;
    openCancelOrderModal(o);
  }
};

const handleSaveOrderEdit = async () => {
  if (!editingOrder.value) return;
  isSavingEdit.value = true;
  editSuccessMsg.value = "";
  editErrorMsg.value = "";

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (authStore.token) {
      headers["Authorization"] = `Bearer ${authStore.token}`;
    }

    const payload = {
      customer_name: editForm.value.customerName,
      customer_email: editForm.value.customerEmail,
      customer_phone: editForm.value.customerPhone,
      shipping_address: editForm.value.shippingAddress,
      city: editForm.value.city,
      postal_code: editForm.value.postalCode,
      payment_method:
        editForm.value.paymentMethod === "paymongo_qrph"
          ? "paymongo_qrph"
          : "QR",
      payment_option: editForm.value.paymentMethod,
      qr_merchant_code:
        editForm.value.paymentMethod === "qr"
          ? editForm.value.qrMerchantCode
          : null,
      notes: editForm.value.notes,
      resend_email: editForm.value.resendEmail,
    };

    const orderId = editingOrder.value.id;
    const res = await fetch(`/api/customer-orders/${orderId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to update order details.");
    }

    let newPaymentMethodDisplay = payload.payment_method;
    if (editForm.value.paymentMethod === "qr") {
      const merch = paymentMerchants.value.find(
        (m) => m.code === editForm.value.qrMerchantCode,
      );
      newPaymentMethodDisplay = `QR - ${merch?.name || "Static QR"}`;
    }

    const target = orders.value.find(
      (o) =>
        o.id === editingOrder.value?.id ||
        o.orderNumber === editingOrder.value?.orderNumber,
    );
    if (target) {
      target.customerName = editForm.value.customerName;
      target.customerEmail = editForm.value.customerEmail;
      target.customerPhone = editForm.value.customerPhone;
      target.shippingAddress = editForm.value.shippingAddress;
      target.city = editForm.value.city;
      target.postalCode = editForm.value.postalCode;
      target.notes = editForm.value.notes;
      target.paymentMethod = newPaymentMethodDisplay;
    }

    // Also sync in checkoutStore orderHistory if matching
    const localTarget = checkoutStore.orderHistory.find(
      (l) =>
        l.orderId === editingOrder.value?.orderNumber ||
        l.orderId === String(editingOrder.value?.id),
    );
    if (localTarget) {
      localTarget.shippingDetails.firstName = editForm.value.customerName;
      localTarget.shippingDetails.email = editForm.value.customerEmail;
      localTarget.shippingDetails.phone = editForm.value.customerPhone;
      localTarget.shippingDetails.streetAddress =
        editForm.value.shippingAddress;
      localTarget.shippingDetails.city = editForm.value.city;
      localTarget.shippingDetails.postalCode = editForm.value.postalCode;
      localTarget.shippingDetails.notes = editForm.value.notes;
      localTarget.shippingDetails.paymentMethod = editForm.value.paymentMethod;
      localTarget.shippingDetails.qrMerchantCode =
        editForm.value.qrMerchantCode;
    }

    editSuccessMsg.value =
      "Order details and payment options successfully updated!";
    setTimeout(() => {
      isEditModalOpen.value = false;
      editingOrder.value = null;
    }, 1200);
  } catch (err: any) {
    editErrorMsg.value =
      err.message || "An unexpected error occurred while saving changes.";
  } finally {
    isSavingEdit.value = false;
  }
};

const handleConfirmCancel = async () => {
  if (!cancellingOrder.value) return;
  isSubmittingCancel.value = true;
  cancelSuccessMsg.value = "";
  cancelErrorMsg.value = "";

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (authStore.token) {
      headers["Authorization"] = `Bearer ${authStore.token}`;
    }

    const orderId = cancellingOrder.value.id || cancellingOrder.value.orderNumber;
    const orderNumber = cancellingOrder.value.orderNumber;
    let cancelSucceeded = false;

    try {
      const res = await fetch(
        resolveApiUrl(`/api/customer-orders/${encodeURIComponent(orderId)}/cancel`),
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ reason: cancelReason.value }),
        },
      );

      const json = await res.json();
      if (res.ok) {
        cancelSucceeded = true;
      } else if (res.status === 404 && orderNumber && String(orderId) !== orderNumber) {
        const retryRes = await fetch(
          resolveApiUrl(`/api/customer-orders/${encodeURIComponent(orderNumber)}/cancel`),
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ reason: cancelReason.value }),
          },
        );
        if (retryRes.ok) {
          cancelSucceeded = true;
        } else {
          const isLocalOnly = checkoutStore.orderHistory.some(
            (lo) =>
              lo.orderId === orderNumber ||
              lo.orderId === String(cancellingOrder.value?.id),
          );
          if (isLocalOnly && retryRes.status === 404) {
            cancelSucceeded = true;
          } else {
            throw new Error(json.message || "Failed to cancel order.");
          }
        }
      } else {
        const isLocalOnly = checkoutStore.orderHistory.some(
          (lo) =>
            lo.orderId === orderNumber ||
            lo.orderId === String(cancellingOrder.value?.id),
        );
        if (isLocalOnly && res.status === 404) {
          cancelSucceeded = true;
        } else {
          throw new Error(json.message || "Failed to cancel order.");
        }
      }
    } catch (fetchErr: any) {
      const isLocalOnly = checkoutStore.orderHistory.some(
        (lo) =>
          lo.orderId === orderNumber ||
          lo.orderId === String(cancellingOrder.value?.id),
      );
      if (isLocalOnly) {
        cancelSucceeded = true;
      } else {
        throw fetchErr;
      }
    }

    if (cancelSucceeded) {
      const target = orders.value.find(
        (o) =>
          o.id === cancellingOrder.value?.id ||
          o.orderNumber === cancellingOrder.value?.orderNumber,
      );
      if (target) {
        target.status = "cancel";
        target.statusLabel = "Cancelled";
        target.statusBadgeColor = "rose";
        target.paymentStatus = "Cancelled";
      }

      // Also sync to checkoutStore orderHistory in localStorage
      const localTarget = checkoutStore.orderHistory.find(
        (l) =>
          l.orderId === cancellingOrder.value?.orderNumber ||
          l.orderId === String(cancellingOrder.value?.id),
      );
      if (localTarget) {
        (localTarget as any).status = "cancel";
        (localTarget as any).paymentStatus = "Cancelled";
      }

      // Immediately synchronize global order status across Admin Orders & Dashboard
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("rlg-order-status-synced", {
            detail: {
              orderId: cancellingOrder.value?.id,
              orderNumber: cancellingOrder.value?.orderNumber,
              status: "Canceled",
              paymentStatus: "Cancelled",
            },
          }),
        );
      }

      cancelSuccessMsg.value =
        "Order has been cancelled successfully. Global order status has been synchronized.";
      setTimeout(() => {
        isCancelModalOpen.value = false;
        cancellingOrder.value = null;
      }, 1200);
    }
  } catch (err: any) {
    cancelErrorMsg.value = err.message || "Failed to cancel order.";
  } finally {
    isSubmittingCancel.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen py-10 font-display text-slate-100">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <!-- Page Header -->
      <div
        class="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden"
      >
        <!-- Background decorative badge -->
        <div
          class="absolute -right-8 -bottom-8 opacity-10 text-9xl pointer-events-none select-none"
        >
          📦
        </div>

        <div class="relative z-10 space-y-3">
          <div class="flex items-center gap-2">
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 uppercase tracking-wider"
            >
              Live Fulfillment Tracking
            </span>
            <span
              class="text-xs text-emerald-400 font-bold flex items-center gap-1"
            >
              <span
                class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
              ></span>
              Real-time Carrier Sync
            </span>
          </div>

          <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight">
            My Collector Orders &amp; Package Tracking
          </h1>

          <p
            class="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed"
          >
            Track your authentic Japanese Pokémon booster boxes, serialized
            cards, and collector scale figures directly from warehouse packaging
            to your doorstep.
          </p>
        </div>
      </div>

      <!-- Auth Status / Guest Scoped Notice -->
      <div
        v-if="!authStore.isAuthenticated"
        class="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">🔒</span>
          <div>
            <p class="font-bold text-white">
              Sign In for Scoped Order Tracking
            </p>
            <p class="text-slate-400 text-[11px]">
              You are currently browsing as a guest. Log in to sync and track
              all your authenticated collector orders.
            </p>
          </div>
        </div>
        <button
          type="button"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-md"
          @click="openAuthModal"
        >
          Sign In / Register
        </button>
      </div>

      <div
        v-else
        class="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300"
      >
        <span class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span
            >Orders scoped to:
            <strong class="text-white">{{
              authStore.currentUser?.name || "Verified Collector"
            }}</strong>
            ({{ authStore.currentUser?.email }})</span
          >
        </span>
        <span
          class="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30"
        >
          Encrypted &amp; Scoped
        </span>
      </div>

      <!-- Search & Status Filter Bar -->
      <div
        class="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
      >
        <!-- Search input -->
        <div class="relative flex-1 max-w-lg">
          <span
            class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm"
          >
            🔍
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by Order # (e.g. ORD-8921), tracking number, or item name..."
            class="w-full pl-10 pr-4 py-2.5 bg-slate-950 text-white text-xs rounded-xl border border-slate-700/80 focus:border-amber-400 focus:outline-none placeholder-slate-500 font-medium"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white text-xs cursor-pointer"
            @click="searchQuery = ''"
          >
            ✕
          </button>
        </div>

        <!-- Filter Tabs -->
        <div
          class="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-950 rounded-xl border border-slate-800"
        >
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
            :class="
              selectedFilter === 'all'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            "
            @click="selectedFilter = 'all'"
          >
            All Orders ({{ activeOrdersCount }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
            :class="
              selectedFilter === 'shipped'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            "
            @click="selectedFilter = 'shipped'"
          >
            🚚 In Transit / Shipped
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
            :class="
              selectedFilter === 'processing'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            "
            @click="selectedFilter = 'processing'"
          >
            ⚙️ Processing
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
            :class="
              selectedFilter === 'delivered'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            "
            @click="selectedFilter = 'delivered'"
          >
            ✓ Delivered
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
            :class="
              selectedFilter === 'completed'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            "
            @click="selectedFilter = 'completed'"
          >
            ★ Completed
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
            :class="
              selectedFilter === 'cancelled'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-rose-400/80 hover:text-rose-300'
            "
            @click="selectedFilter = 'cancelled'"
          >
            ✕ Cancelled ({{ cancelledOrdersCount }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5"
            :class="
              selectedFilter === 'vault'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-md'
                : 'text-amber-400/90 hover:text-amber-300'
            "
            @click="selectedFilter = 'vault'"
          >
            <span>🏛️ Vault Deliveries</span>
            <span
              v-if="vaultShipments.length > 0"
              class="px-1.5 py-0.2 rounded-full text-[10px]"
              :class="selectedFilter === 'vault' ? 'bg-slate-950 text-amber-300' : 'bg-amber-400/20 text-amber-300'"
            >
              {{ vaultShipments.length }}
            </span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="py-16 text-center space-y-3">
        <div
          class="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"
        ></div>
        <p class="text-xs text-slate-400 font-bold">
          Synchronizing orders from warehouse database...
        </p>
      </div>

      <!-- DEDICATED DIGITAL VAULT DELIVERIES VIEW -->
      <div v-else-if="selectedFilter === 'vault'" class="space-y-6">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div>
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 mb-1">
              <span>🏛️ Unified Digital Vault Shipments</span>
              <span>•</span>
              <span>Live Slot Raffle Wins &amp; Gacha Oripa</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-white">Physical Vault Delivery Tracking</h2>
            <p class="text-xs text-slate-400 mt-1 max-w-xl">
              Track real-time courier dispatch status, waybill tracking numbers, and delivery milestones for authenticated graded slabs shipped from your Digital Vault.
            </p>
          </div>
          <router-link
            to="/gacha?tab=vault"
            class="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md flex items-center gap-2 transition-all"
          >
            <span>🏛️ Open My Digital Vault</span>
            <span>&rarr;</span>
          </router-link>
        </div>

        <div
          v-if="vaultShipments.length === 0"
          class="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800 space-y-4 max-w-md mx-auto"
        >
          <div class="text-5xl">🏛️</div>
          <h3 class="text-lg font-bold text-white">No Vault Deliveries Requested Yet</h3>
          <p class="text-xs text-slate-400">
            Slabs you win from Live Slot Raffles or rip from Gacha Mystery Oripas are held in your Digital Vault. You can dispatch them individually or bulk ship with courier tracking.
          </p>
          <router-link
            to="/gacha?tab=vault"
            class="inline-block px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all"
          >
            Go to My Digital Vault &rarr;
          </router-link>
        </div>

        <div v-else class="space-y-5">
          <div
            v-for="batch in vaultShipments"
            :key="batch.batch_code"
            class="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl"
          >
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div class="flex items-center gap-2.5">
                  <span class="text-xs font-mono font-black text-amber-400 tracking-wider">
                    {{ batch.batch_code }}
                  </span>
                  <span
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                    :class="
                      batch.status === 'delivered'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : batch.status === 'shipped'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    "
                  >
                    {{ batch.status }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  Requested on {{ new Date(batch.created_at).toLocaleDateString() }} • {{ batch.items_count }} slab(s) dispatched
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span
                  v-if="batch.carrier"
                  class="px-3 py-1 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                >
                  <span>🚚</span>
                  <span>{{ batch.carrier.name }}</span>
                </span>
                <div v-if="batch.tracking_number" class="flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/40 rounded-xl px-3 py-1 text-xs">
                  <span class="text-[10px] uppercase text-indigo-300 font-bold">Waybill:</span>
                  <span class="font-mono font-black text-white">{{ batch.tracking_number }}</span>
                  <a
                    v-if="batch.tracking_url"
                    :href="batch.tracking_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-amber-400 hover:text-amber-300 underline font-bold text-[11px]"
                  >
                    Track Package &rarr;
                  </a>
                </div>
                <span v-else class="text-xs text-slate-500 font-mono italic">
                  Awaiting Courier Waybill
                </span>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              <div>
                <span class="text-[10px] text-slate-400 font-bold block">Recipient:</span>
                <span class="text-white font-bold">{{ batch.recipient_name }}</span>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 font-bold block">Mobile:</span>
                <span class="text-white font-mono">{{ batch.phone }}</span>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 font-bold block">Shipping Address:</span>
                <span class="text-slate-300 truncate block" :title="batch.address">{{ batch.address }}</span>
              </div>
            </div>
            <div class="space-y-2">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Vault Items in this Package:
              </span>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div
                  v-for="item in batch.items"
                  :key="item.id"
                  class="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-950 border border-slate-800"
                >
                  <img
                    v-if="item.vault_item?.image_url"
                    :src="resolveStorageUrl(item.vault_item.image_url)"
                    :alt="item.vault_item?.item_name"
                    class="w-12 h-14 object-contain rounded-lg bg-slate-900 border border-slate-800 shrink-0"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="text-xs font-bold text-white truncate">
                      {{ item.vault_item?.item_name || 'Graded Slab' }}
                    </div>
                    <div class="text-[10px] text-slate-400">
                      {{ item.vault_item?.card_condition || 'PSA 10 GEM MINT' }}
                    </div>
                    <span
                      v-if="item.vault_item?.source === 'live_slot'"
                      class="text-[9px] text-rose-300 font-bold"
                    >
                      🎯 Live Slot Win
                    </span>
                    <span
                      v-else
                      class="text-[9px] text-indigo-300 font-bold"
                    >
                      🎴 Gacha Oripa
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredOrders.length === 0"
        class="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800 space-y-4 max-w-md mx-auto"
      >
        <div class="text-5xl">📦</div>
        <h3 class="text-lg font-bold text-white">No Orders Found</h3>
        <p class="text-xs text-slate-400 max-w-xs mx-auto">
          {{
            searchQuery
              ? `No order records matched "${searchQuery}". Check the tracking code or order number.`
              : "You don't have any placed orders yet. Explore our collector store!"
          }}
        </p>
        <button
          type="button"
          class="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"
          @click="router.push('/catalog')"
        >
          Browse Pokémon Catalog &rarr;
        </button>
      </div>

      <!-- Orders List Cards -->
      <div v-else class="space-y-6">
        <!-- Top Toolbar / Pagination Summary & Per-Page Controls -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1"
        >
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <span>Show:</span>
            <select
              v-model="perPage"
              class="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none cursor-pointer"
            >
              <option v-for="n in perPageOptions" :key="n" :value="n">
                {{ n }} per page
              </option>
            </select>
            <span class="text-slate-400 font-medium">
              Showing
              {{
                filteredOrders.length === 0
                  ? 0
                  : (currentPage - 1) * perPage + 1
              }}–{{
                Math.min(currentPage * perPage, filteredOrders.length)
              }}
              of {{ filteredOrders.length }} orders
            </span>
          </div>

          <div
            v-if="totalPages > 1"
            class="flex items-center gap-1.5 self-end sm:self-auto"
          >
            <button
              type="button"
              :disabled="currentPage <= 1"
              class="px-2.5 py-1 text-xs rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              @click="currentPage--"
            >
              &larr; Prev
            </button>
            <span class="text-xs font-mono font-bold text-slate-400 px-1.5">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <button
              type="button"
              :disabled="currentPage >= totalPages"
              class="px-2.5 py-1 text-xs rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              @click="currentPage++"
            >
              Next &rarr;
            </button>
          </div>
        </div>

        <div
          v-for="order in paginatedOrders"
          :key="order.id"
          class="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden transition-all hover:border-slate-700"
        >
          <!-- Order Card Header -->
          <div
            class="p-5 sm:p-6 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span class="font-mono text-base font-black text-amber-400">
                  {{ order.orderNumber }}
                </span>
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                  :class="getStatusBadgeClass(order.status)"
                >
                  {{ isOrderCancelled(order) ? 'CANCELED' : order.statusLabel }}
                </span>
                <span class="text-xs text-slate-400 font-medium">
                  Placed on {{ formatDate(order.createdAt) }}
                </span>
              </div>
              <p class="text-xs text-slate-400">
                Payment:
                <span class="text-slate-200 font-bold">{{
                  order.paymentMethod
                }}</span>
                &bull; Status:
                <span
                  :class="
                    isOrderCancelled(order)
                      ? 'text-rose-400 font-semibold'
                      : (order.paymentStatus === 'Paid' ||
                          order.paymentStatus === 'Success') &&
                        !order.status?.toLowerCase().includes('pend')
                        ? 'text-emerald-400 font-semibold'
                        : 'text-amber-400 font-semibold'
                  "
                  >{{
                    isOrderCancelled(order)
                      ? 'Cancelled'
                      : order.status?.toLowerCase().includes('pend') &&
                        order.paymentStatus !== 'Refunded'
                        ? 'Pending'
                        : order.paymentStatus
                  }}</span
                >
              </p>
            </div>

            <!-- Carrier & Tracking Quick Pill -->
            <div class="flex items-center gap-2 sm:self-center">
              <div
                v-if="order.trackingNumber"
                class="px-3 py-1.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-xs text-indigo-300 font-mono font-bold flex items-center gap-2"
              >
                <span>🚚 {{ order.carrierName }}:</span>
                <span class="text-amber-300">{{ order.trackingNumber }}</span>
              </div>
              <a
                v-if="order.trackingUrl"
                :href="order.trackingUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-colors flex items-center gap-1"
                title="Open carrier tracking page"
              >
                <span>Track</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          <!-- Live Progress Stepper Graphic (7-Step Order Locator) -->
          <div class="p-6 bg-slate-900/60 border-b border-slate-800/80">
            <div class="flex items-center justify-between mb-4">
              <h4
                class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
              >
                <span>📍</span>
                <span>Shipment Journey Locator</span>
              </h4>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-slate-400"
                  >Current Stage:
                  <strong
                    :class="
                      isOrderCancelled(order)
                        ? 'text-rose-400 font-bold uppercase'
                        : 'text-amber-400 font-bold uppercase'
                    "
                    >{{
                      isOrderCancelled(order)
                        ? 'CANCELLED'
                        : (order.statusLabel || order.status)
                    }}</strong
                  ></span
                >
                <span
                  class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                  :class="
                    isOrderCancelled(order)
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  "
                  >{{
                    isOrderCancelled(order)
                      ? 'Cancelled'
                      : `Step ${getStepProgressIndex(order)} / 7`
                  }}</span
                >
              </div>
            </div>
            <div class="overflow-x-auto pb-2 -mx-2 px-2 custom-scrollbar">
              <div
                class="min-w-[620px] sm:min-w-0 grid grid-cols-7 gap-1 text-center relative py-1"
              >
                <!-- Track background line -->
                <div
                  class="absolute top-4 left-[7.14%] right-[7.14%] h-1 bg-slate-800 -z-0 rounded-full"
                ></div>
                <!-- Active gradient progress line -->
                <div
                  class="absolute top-4 left-[7.14%] h-1 bg-gradient-to-r from-amber-400 via-indigo-500 to-emerald-400 -z-0 transition-all duration-700 rounded-full"
                  :style="{ width: getProgressLineWidth(order) }"
                ></div>

                <!-- 7 Journey Steps: Order Placed -> Payment (Pending/Success) -> Processing -> Shipped -> In Transit -> Delivered -> Completed -->
                <div
                  v-for="step in getTimelineSteps(order)"
                  :key="step.key"
                  class="flex flex-col items-center relative z-10 space-y-1.5 px-0.5"
                >
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    :class="[
                      step.isCancelled
                        ? 'bg-rose-500/20 text-rose-400 border-2 border-rose-500 ring-4 ring-rose-500/20 font-black shadow-md'
                        : step.isCompleted
                          ? 'bg-amber-400 text-slate-950 font-black ring-4 ring-amber-400/20 shadow-md'
                          : step.isCurrent
                            ? step.isPendingPayment
                              ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-400 ring-4 ring-amber-400/20 animate-pulse'
                              : 'bg-indigo-600 text-white font-black ring-4 ring-indigo-500/30 animate-pulse shadow-md'
                            : 'bg-slate-800 text-slate-500 border border-slate-700/60',
                    ]"
                  >
                    <span>{{ step.icon }}</span>
                  </div>
                  <span
                    class="text-[10px] sm:text-[11px] font-bold leading-tight"
                    :class="[
                      step.isCancelled
                        ? 'text-rose-400 font-extrabold'
                        : step.isCompleted
                          ? 'text-white'
                          : step.isCurrent
                            ? step.isPendingPayment
                              ? 'text-amber-400'
                              : 'text-indigo-300 font-extrabold'
                            : 'text-slate-500',
                    ]"
                  >
                    {{ step.title }}
                  </span>
                  <span
                    class="text-[9px] sm:text-[10px] text-slate-400 leading-tight hidden sm:block truncate max-w-full"
                    :title="step.subtitle"
                  >
                    {{ step.subtitle }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Items Ordered Grid -->
          <div class="p-6 space-y-3">
            <h5 class="text-xs font-bold text-slate-300">
              Items Included in Parcel ({{ order.items.length }})
            </h5>
            <div class="divide-y divide-slate-800/80">
              <div
                v-for="(item, idx) in order.items"
                :key="idx"
                class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-3.5"
              >
                <div class="flex items-center gap-3.5 flex-1 min-w-0">
                  <img
                    :src="item.image_url"
                    :alt="item.product_name"
                    class="w-14 h-14 rounded-xl object-contain bg-slate-950 border border-slate-800 p-1 flex-shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <h6 class="text-xs sm:text-sm font-bold text-white truncate">
                      {{ item.product_name }}
                    </h6>
                    <p class="text-[11px] text-slate-400 font-mono">
                      SKU: {{ item.sku }} &bull; Qty: {{ item.quantity }}
                    </p>
                  </div>
                  <div class="text-right flex-shrink-0 font-mono">
                    <p class="text-xs sm:text-sm font-bold text-amber-400">
                      {{ formatCurrency(Number(item.price) * item.quantity) }}
                    </p>
                    <p
                      v-if="item.quantity > 1"
                      class="text-[10px] text-slate-500"
                    >
                      {{ formatCurrency(Number(item.price)) }} each
                    </p>
                  </div>
                </div>

                <!-- Review and Star Rating Action (when order is completed) -->
                <div
                  v-if="isOrderCompleted(order)"
                  class="flex items-center justify-end sm:justify-start gap-2 pt-1 sm:pt-0 sm:pl-3 sm:border-l sm:border-slate-800/80"
                >
                  <button
                    v-if="!userReviewsMap[String(item.product_id || item.id)]"
                    type="button"
                    class="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 hover:text-amber-200 text-xs font-bold rounded-xl border border-amber-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    @click="openReviewModal(item, order)"
                  >
                    <span>⭐</span>
                    <span>Write Review &amp; Stars</span>
                  </button>
                  <div
                    v-else
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold"
                  >
                    <span>★ {{ userReviewsMap[String(item.product_id || item.id)].stars }}.0</span>
                    <span>Reviewed</span>
                    <button
                      type="button"
                      class="text-slate-400 hover:text-white underline text-[10px] ml-1 cursor-pointer"
                      title="Edit your review"
                      @click="openReviewModal(item, order)"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 30-Minute Payment Countdown Banner -->
          <div
            v-if="isOrderPendingPayment(order)"
            class="px-4 sm:px-6 py-2.5 bg-amber-500/10 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <div class="flex items-center gap-2 text-amber-300 font-bold min-w-0">
              <span class="text-sm animate-pulse">⏱️</span>
              <span class="truncate text-[11px] sm:text-xs">
                Complete payment within 30 mins (auto-cancels if unpaid)
              </span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0 ml-auto">
              <span class="text-[10px] uppercase font-mono text-slate-400">Time Left:</span>
              <span class="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950 shadow-xs">
                {{ getRemainingPaymentTime(order).formatted }}
              </span>
            </div>
          </div>

          <!-- Order Footer: Recipient & Total -->
          <div
            class="p-5 sm:p-6 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
          >
            <div class="space-y-0.5 text-slate-400">
              <p>
                <span class="text-slate-200 font-bold">Recipient:</span>
                {{ order.customerName }}
                {{ order.customerPhone ? `(${order.customerPhone})` : "" }}
              </p>
              <p class="text-[11px]">
                <span class="text-slate-200 font-bold">Destination:</span>
                {{ order.shippingAddress }}, {{ order.city }}
              </p>
            </div>

            <div
              class="flex items-center gap-2 sm:gap-3 sm:self-center flex-wrap justify-end"
            >
              <div class="text-right mr-1">
                <span
                  class="text-[10px] text-slate-400 uppercase tracking-wider block font-bold"
                  >Total
                  {{ isOrderPendingPayment(order) ? "Payable" : "Paid" }}</span
                >
                <span class="text-lg font-black text-amber-400 font-mono">
                  {{ formatCurrency(order.totalAmount) }}
                </span>
              </div>

              <!-- ONLY show Edit & Cancel when status is strictly in payment pending, else remove that edit button! -->
              <template v-if="isOrderPendingPayment(order)">
                <button
                  type="button"
                  class="px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 text-xs font-bold rounded-xl border border-amber-500/40 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Edit Contact, Shipping Destination or Change Payment Option"
                  @click="openEditOrderModal(order)"
                >
                  <span>✏️</span>
                  <span>Edit Details / Payment</span>
                </button>
                <button
                  type="button"
                  class="px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 text-xs font-bold rounded-xl border border-rose-500/40 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Cancel this pending order"
                  @click="openCancelOrderModal(order)"
                >
                  <span>✕</span>
                  <span>Cancel Order</span>
                </button>
              </template>

              <!-- Completed Order Review & Stars Action -->
              <button
                v-if="isOrderCompleted(order) && order.items.length > 0"
                type="button"
                class="px-3 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 hover:text-amber-200 text-xs font-bold rounded-xl border border-amber-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="Write a review and submit star rating for this completed order"
                @click="openReviewModal(order.items[0], order)"
              >
                <span>⭐</span>
                <span>Write Review &amp; Stars</span>
              </button>

              <button
                type="button"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                @click="selectedOrderForModal = order"
              >
                Receipt
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Pagination Controls -->
        <div
          v-if="filteredOrders.length > 0"
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 mt-6"
        >
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <span>Show:</span>
            <select
              v-model="perPage"
              class="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none cursor-pointer"
            >
              <option v-for="n in perPageOptions" :key="n" :value="n">
                {{ n }} per page
              </option>
            </select>
            <span class="text-slate-400 font-medium">
              Showing
              {{ (currentPage - 1) * perPage + 1 }}–{{
                Math.min(currentPage * perPage, filteredOrders.length)
              }}
              of {{ filteredOrders.length }} orders
            </span>
          </div>

          <div
            v-if="totalPages > 1"
            class="flex items-center gap-1.5 flex-wrap self-end sm:self-auto"
          >
            <button
              type="button"
              :disabled="currentPage <= 1"
              class="px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              @click="currentPage--"
            >
              &larr; Prev
            </button>

            <button
              v-for="p in visiblePages"
              :key="p"
              type="button"
              class="px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer"
              :class="
                currentPage === p
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              "
              @click="currentPage = p"
            >
              {{ p }}
            </button>

            <button
              type="button"
              :disabled="currentPage >= totalPages"
              class="px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              @click="currentPage++"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Receipt Modal -->
    <teleport to="body">
      <div
        v-if="selectedOrderForModal"
        class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto overflow-x-hidden p-2 sm:p-4 font-display"
        @click="selectedOrderForModal = null"
      >
        <div class="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-8 pointer-events-none">
          <div
            class="pointer-events-auto bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-[calc(100vw-1.25rem)] sm:max-w-lg w-full p-4 sm:p-8 space-y-4 sm:space-y-5 text-slate-100 shadow-2xl relative box-border overflow-hidden"
            @click.stop
          >
          <button
            type="button"
            class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer shrink-0"
            @click="selectedOrderForModal = null"
          >
            ✕
          </button>

          <div class="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-8">
            <span class="text-2xl shrink-0">🧾</span>
            <div class="min-w-0">
              <h3 class="text-base font-black text-white truncate">
                Collector Official Invoice
              </h3>
              <p class="text-xs text-slate-400 font-mono truncate">
                Order {{ selectedOrderForModal.orderNumber }}
              </p>
            </div>
          </div>

          <!-- 30-Minute Payment Countdown in Receipt -->
          <div
            v-if="isOrderPendingPayment(selectedOrderForModal)"
            class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-sm animate-pulse">⏱️</span>
              <span class="text-[11px] font-medium truncate">
                Payment window (auto-cancels in 30m):
              </span>
            </div>
            <span class="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950 shrink-0">
              {{ getRemainingPaymentTime(selectedOrderForModal).formatted }}
            </span>
          </div>

          <div
            class="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
          >
            <div class="flex justify-between">
              <span class="text-slate-400">Order Date:</span>
              <span class="font-bold text-white">{{
                formatDate(selectedOrderForModal.createdAt)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Payment:</span>
              <span class="font-bold text-white"
                >{{ selectedOrderForModal.paymentMethod }} ({{
                  selectedOrderForModal.paymentStatus
                }})</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Carrier:</span>
              <span class="font-bold text-white">{{
                selectedOrderForModal.carrierName
              }}</span>
            </div>
            <div
              v-if="selectedOrderForModal.trackingNumber"
              class="flex justify-between"
            >
              <span class="text-slate-400">Tracking Number:</span>
              <span class="font-mono font-bold text-amber-300">{{
                selectedOrderForModal.trackingNumber
              }}</span>
            </div>
          </div>

          <div class="space-y-2">
            <h4 class="text-xs font-bold text-slate-300">
              Items ({{ selectedOrderForModal.items.length }})
            </h4>
            <div
              class="max-h-48 overflow-y-auto divide-y divide-slate-800/80 pr-1 text-xs"
            >
              <div
                v-for="(it, i) in selectedOrderForModal.items"
                :key="i"
                class="py-2.5 flex flex-col gap-1.5"
              >
                <div class="flex justify-between items-center">
                  <div class="min-w-0 flex-1 pr-2">
                    <p class="font-bold text-white truncate">
                      {{ it.product_name }}
                    </p>
                    <p class="text-[10px] text-slate-400">
                      Qty: {{ it.quantity }} &times;
                      {{ formatCurrency(Number(it.price)) }}
                    </p>
                  </div>
                  <span class="font-mono font-bold text-amber-400">
                    {{ formatCurrency(Number(it.price) * it.quantity) }}
                  </span>
                </div>
                <!-- Review option if completed -->
                <div v-if="isOrderCompleted(selectedOrderForModal)" class="flex justify-end">
                  <button
                    v-if="!userReviewsMap[String(it.product_id || it.id)]"
                    type="button"
                    class="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer"
                    @click="openReviewModal(it, selectedOrderForModal)"
                  >
                    <span>⭐</span>
                    <span>Write Review &amp; Stars</span>
                  </button>
                  <span
                    v-else
                    class="text-[11px] font-bold text-emerald-400 flex items-center gap-1"
                  >
                    ★ {{ userReviewsMap[String(it.product_id || it.id)].stars }}.0 Reviewed
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="pt-3 border-t border-slate-800 flex justify-between items-baseline"
          >
            <span class="text-sm font-bold text-white">Total Amount</span>
            <span class="text-xl font-black text-amber-400 font-mono">
              {{ formatCurrency(selectedOrderForModal.totalAmount) }}
            </span>
          </div>

          <!-- Pending Status Actions inside Receipt Modal -->
          <div
            v-if="isOrderPendingPayment(selectedOrderForModal)"
            class="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2"
          >
            <button
              type="button"
              class="flex-1 py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              @click="openEditFromReceipt"
            >
              <span>✏️</span>
              <span>Change Payment / Shipping Details</span>
            </button>
            <button
              type="button"
              class="py-2.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              @click="openCancelFromReceipt"
            >
              <span>✕</span>
              <span>Cancel Order</span>
            </button>
          </div>

          <button
            type="button"
            class="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer transition-colors"
            @click="selectedOrderForModal = null"
          >
            Close Receipt
          </button>
        </div>
        </div>
      </div>
    </teleport>

    <!-- Edit Pending Order Modal -->
    <teleport to="body">
      <div
        v-if="isEditModalOpen && editingOrder"
        class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto overflow-x-hidden p-2 sm:p-4 font-display"
        @click="isEditModalOpen = false"
      >
        <div class="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-8 pointer-events-none">
          <div
            class="pointer-events-auto bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-[calc(100vw-1.25rem)] sm:max-w-2xl w-full p-4 sm:p-8 space-y-4 sm:space-y-6 text-slate-100 shadow-2xl relative box-border overflow-hidden"
            @click.stop
          >
          <!-- Close button -->
          <button
            type="button"
            class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer shrink-0"
            @click="isEditModalOpen = false"
          >
            ✕
          </button>

          <!-- Modal Header -->
          <div class="flex items-start gap-2.5 sm:gap-3 pr-8 min-w-0">
            <span class="text-2xl sm:text-3xl shrink-0">✏️</span>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-base sm:text-lg font-black text-white truncate">
                  Edit Order &amp; Payment Options
                </h3>
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase shrink-0"
                >
                  Pending Payment
                </span>
              </div>
              <p class="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5 truncate">
                Order Reference: {{ editingOrder.orderNumber }} &bull; Total:
                {{ formatCurrency(editingOrder.totalAmount) }}
              </p>
            </div>
          </div>

          <!-- 30-Minute Payment Countdown Alert in Edit Modal -->
          <div
            class="p-3.5 rounded-xl sm:rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-sm min-w-0"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="text-lg sm:text-xl animate-pulse shrink-0">⏱️</span>
              <div class="min-w-0">
                <p class="font-extrabold text-amber-300 truncate">
                  30-Minute Payment Window Active
                </p>
                <p class="text-[10px] text-amber-200/80 truncate">
                  Order auto-cancels if payment is not completed before timer expires.
                </p>
              </div>
            </div>
            <div class="flex flex-col items-end shrink-0">
              <span class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Time Left</span>
              <span class="font-mono text-xs sm:text-sm font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-amber-400 text-slate-950 shadow-xs">
                {{ getRemainingPaymentTime(editingOrder).formatted }}
              </span>
            </div>
          </div>

          <!-- Success Alert -->
          <div
            v-if="editSuccessMsg"
            class="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2"
          >
            <span>✓</span>
            <span class="truncate">{{ editSuccessMsg }}</span>
          </div>

          <!-- Error Alert -->
          <div
            v-if="editErrorMsg"
            class="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2"
          >
            <span>⚠️</span>
            <span class="truncate">{{ editErrorMsg }}</span>
          </div>

          <form @submit.prevent="handleSaveOrderEdit" class="space-y-4 sm:space-y-6">
            <!-- Section 1: Customer Contact Details -->
            <div
              class="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 sm:space-y-4 min-w-0"
            >
              <h4
                class="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5"
              >
                <span>👤</span>
                <span>Recipient &amp; Contact Details</span>
              </h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div class="min-w-0">
                  <label class="block text-slate-400 font-medium mb-1"
                    >Full Name</label
                  >
                  <input
                    v-model="editForm.customerName"
                    type="text"
                    required
                    class="w-full max-w-full min-w-0 box-border px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-slate-100 text-xs font-medium"
                    placeholder="Recipient Name"
                  />
                </div>
                <div class="min-w-0">
                  <label class="block text-slate-400 font-medium mb-1"
                    >Email Address</label
                  >
                  <input
                    v-model="editForm.customerEmail"
                    type="email"
                    required
                    class="w-full max-w-full min-w-0 box-border px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-slate-100 text-xs font-medium"
                    placeholder="buyer@example.com"
                  />
                </div>
                <div class="sm:col-span-2 min-w-0">
                  <label class="block text-slate-400 font-medium mb-1"
                    >Phone / Mobile Number</label
                  >
                  <input
                    v-model="editForm.customerPhone"
                    type="tel"
                    class="w-full max-w-full min-w-0 box-border px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-slate-100 text-xs font-medium font-mono"
                    placeholder="+63 9XX XXX XXXX"
                  />
                </div>
              </div>
            </div>

            <!-- Section 2: Shipping Destination -->
            <div
              class="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 sm:space-y-4 min-w-0"
            >
              <h4
                class="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5"
              >
                <span>📍</span>
                <span>Shipping Destination Address</span>
              </h4>
              <div class="space-y-3 text-xs">
                <div class="min-w-0">
                  <label class="block text-slate-400 font-medium mb-1"
                    >Street Address / Unit / Building</label
                  >
                  <input
                    v-model="editForm.shippingAddress"
                    type="text"
                    required
                    class="w-full max-w-full min-w-0 box-border px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-slate-100 text-xs font-medium"
                    placeholder="House/Unit #, Street name, Barangay"
                  />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="min-w-0">
                    <label class="block text-slate-400 font-medium mb-1"
                      >City / Municipality</label
                    >
                    <input
                      v-model="editForm.city"
                      type="text"
                      required
                      class="w-full max-w-full min-w-0 box-border px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-slate-100 text-xs font-medium"
                      placeholder="e.g. Quezon City, Makati"
                    />
                  </div>
                  <div class="min-w-0">
                    <label class="block text-slate-400 font-medium mb-1"
                      >Postal / ZIP Code</label
                    >
                    <input
                      v-model="editForm.postalCode"
                      type="text"
                      class="w-full max-w-full min-w-0 box-border px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-slate-100 text-xs font-medium font-mono"
                      placeholder="e.g. 1100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 3: Payment Method & QR Merchant Option -->
            <div
              class="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 sm:space-y-4 min-w-0"
            >
              <div class="flex items-center justify-between flex-wrap gap-2">
                <h4
                  class="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span>💳</span>
                  <span>Payment Method &amp; Confirmation</span>
                </h4>
                <span class="text-[10px] text-slate-400"
                  >Switch or change method</span
                >
              </div>

              <!-- Payment Method Choice Radio Cards (Instant QR Ph and Static QR only) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <label
                  class="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all text-xs min-w-0"
                  :class="
                    editForm.paymentMethod === 'paymongo_qrph'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400/50'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  "
                >
                  <input
                    type="radio"
                    v-model="editForm.paymentMethod"
                    value="paymongo_qrph"
                    class="sr-only"
                  />
                  <div class="h-8 px-1.5 rounded-lg bg-white border border-amber-200/80 shadow-2xs flex items-center justify-center shrink-0">
                    <img
                      src="/images/qr/qrph-logo.png"
                      alt="QR Ph"
                      class="h-5 w-auto object-contain"
                    />
                  </div>
                  <div class="min-w-0 truncate">
                    <span class="block font-bold truncate">Instant QR Ph</span>
                    <span class="block text-[10px] text-slate-400 font-normal truncate">Auto-Verifies in seconds</span>
                  </div>
                </label>

                <label
                  class="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all text-xs min-w-0"
                  :class="
                    editForm.paymentMethod === 'qr'
                      ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400/50'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  "
                >
                  <input
                    type="radio"
                    v-model="editForm.paymentMethod"
                    value="qr"
                    class="sr-only"
                  />
                  <div class="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center text-sm shrink-0">
                    📱
                  </div>
                  <div class="min-w-0 truncate">
                    <span class="block font-bold truncate">Static QR Code</span>
                    <span class="block text-[10px] text-slate-400 font-normal truncate">Direct bank / e-wallet transfer</span>
                  </div>
                </label>
              </div>

              <!-- PayMongo Dynamic QR Ph Presentation & Reproduce Option -->
              <div
                v-if="editForm.paymentMethod === 'paymongo_qrph'"
                class="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3 sm:space-y-3.5 min-w-0 overflow-hidden"
              >
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
                  <div class="flex items-center gap-2 font-bold text-amber-300 shrink-0">
                    <img
                      src="/images/qr/qrph-logo.png"
                      alt="QR Ph"
                      class="h-5 w-auto object-contain bg-white px-1 py-0.5 rounded shadow-2xs"
                    />
                    <span class="text-xs sm:text-sm">Official Dynamic QR Ph</span>
                  </div>
                  <button
                    type="button"
                    class="text-[11px] px-2.5 sm:px-3 py-1.5 bg-amber-300 hover:bg-amber-200 text-slate-950 font-black rounded-lg border border-amber-400 shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0 ml-auto"
                    :disabled="isGeneratingEditQr"
                    @click="reproduceEditPayMongoQr"
                  >
                    <span :class="{'animate-spin': isGeneratingEditQr}">🔄</span>
                    <span>{{ isGeneratingEditQr ? 'Generating...' : 'Regenerate QR Ph' }}</span>
                  </button>
                </div>

                <!-- Dynamic QR Image Area -->
                <div class="flex flex-col items-center text-center gap-3 py-2 min-w-0">
                  <div v-if="isGeneratingEditQr" class="py-10 flex flex-col items-center gap-2 text-slate-400">
                    <div class="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-xs">Generating dynamic QR Ph code for this order...</span>
                  </div>
                  <div v-else-if="editDynamicQrUrl" class="space-y-2 max-w-full">
                    <div class="w-48 h-48 sm:w-64 sm:h-64 max-w-full aspect-square bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl flex items-center justify-center mx-auto border-2 border-amber-400/60 overflow-hidden">
                      <img
                        :src="editDynamicQrUrl"
                        alt="Dynamic QR Ph"
                        class="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                    <p class="text-[11px] text-slate-300 font-mono">
                      Payable Amount: <strong class="text-amber-300 font-bold">{{ formatCurrency(editingOrder.totalAmount) }}</strong>
                    </p>
                    <span class="text-[10px] text-slate-400 block font-medium">
                      BSP-Certified &bull; Single-use Dynamic QR Ph
                    </span>
                  </div>
                  <div v-else class="text-center py-4 space-y-2">
                    <p class="text-xs text-amber-200 font-medium">
                      No active QR code generated yet. Click below to create dynamic QR Ph:
                    </p>
                    <button
                      type="button"
                      class="px-5 py-2.5 bg-amber-300 hover:bg-amber-200 text-slate-950 font-black text-xs rounded-xl shadow-md border border-amber-400 cursor-pointer transition-all active:scale-95"
                      @click="reproduceEditPayMongoQr"
                    >
                      ⚡ Generate Dynamic QR Ph Code
                    </button>
                  </div>
                </div>

                <p class="text-[11px] text-amber-200/90 leading-relaxed border-t border-amber-500/20 pt-2">
                  Scan this dynamic QR code with any Philippine banking or e-wallet app (GCash, Maya, BDO, BPI, GoTyme). Payment is automatically verified without sending screenshots!
                </p>
              </div>

              <!-- Static QR Merchant Sub-picker -->
              <div
                v-if="editForm.paymentMethod === 'qr'"
                class="pt-2 space-y-3 min-w-0"
              >
                <p class="text-[11px] text-slate-400 font-medium">
                  Select your receiving bank or wallet:
                </p>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    v-for="merch in paymentMerchants"
                    :key="merch.id"
                    type="button"
                    class="p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-w-0 overflow-hidden"
                    :class="
                      editForm.qrMerchantCode === merch.code
                        ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    "
                    @click="editForm.qrMerchantCode = merch.code"
                  >
                    <span class="text-xs font-bold text-white truncate">{{
                      merch.name
                    }}</span>
                    <span class="text-[10px] text-slate-400 font-mono mt-1 truncate">{{
                      merch.account_name.split(" ")[0]
                    }}</span>
                  </button>
                </div>

                <!-- QR Merchant Large Preview Box -->
                <div
                  v-if="selectedEditMerchant"
                  class="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center gap-3 sm:gap-4 text-xs min-w-0 overflow-hidden"
                >
                  <!-- Large QR Image -->
                  <div
                    class="w-48 h-48 sm:w-64 sm:h-64 max-w-full aspect-square bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl flex items-center justify-center shrink-0 border-2 border-amber-400/40 overflow-hidden"
                  >
                    <img
                      :src="selectedEditMerchant.qr_image_url"
                      :alt="selectedEditMerchant.name"
                      class="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <div class="space-y-1.5 max-w-sm min-w-0">
                    <div class="flex items-center justify-center gap-2 flex-wrap">
                      <span class="font-extrabold text-amber-300 text-sm truncate">{{
                        selectedEditMerchant.name
                      }}</span>
                      <span
                        class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
                        >0% Fee</span
                      >
                    </div>
                    <p class="text-xs text-slate-300 font-medium truncate">
                      Account:
                      <strong class="text-white">{{ selectedEditMerchant.account_name }}</strong>
                    </p>
                    <p class="text-xs sm:text-sm text-amber-400 font-mono font-bold tracking-wider truncate">
                      {{ selectedEditMerchant.account_number }}
                    </p>
                    <p class="text-[11px] text-slate-400 italic">
                      {{ selectedEditMerchant.instructions }}
                    </p>
                  </div>
                </div>

                <!-- Email Resend Option -->
                <label
                  class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1 min-w-0"
                >
                  <input
                    type="checkbox"
                    v-model="editForm.resendEmail"
                    class="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-400 focus:ring-amber-400 shrink-0"
                  />
                  <span class="truncate"
                    >📧 Send updated QR payment email to
                    <strong>{{
                      editForm.customerEmail || "buyer"
                    }}</strong></span
                  >
                </label>
              </div>
            </div>

            <!-- Section 4: Order Notes -->
            <div
              class="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs min-w-0"
            >
              <label class="block text-slate-400 font-medium"
                >Special Delivery Notes &amp; Collector Instructions</label
              >
              <textarea
                v-model="editForm.notes"
                rows="2"
                class="w-full max-w-full min-w-0 box-border px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-slate-100 text-xs font-medium resize-none"
                placeholder="Add special packing or delivery notes..."
              ></textarea>
            </div>

            <!-- Modal Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                class="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer text-center"
                @click="isEditModalOpen = false"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                :disabled="isSavingEdit"
                class="flex-1 py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <span
                  v-if="isSavingEdit"
                  class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"
                ></span>
                <span>{{
                  isSavingEdit ? "Saving Changes..." : "Save &amp; Update Order"
                }}</span>
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </teleport>

    <!-- Cancel Order Confirmation Modal -->
    <teleport to="body">
      <div
        v-if="isCancelModalOpen && cancellingOrder"
        class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto overflow-x-hidden p-2 sm:p-4 font-display"
        @click="isCancelModalOpen = false"
      >
        <div class="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-8 pointer-events-none">
          <div
            class="pointer-events-auto bg-slate-900 border border-rose-500/30 rounded-3xl max-w-[calc(100vw-1.25rem)] sm:max-w-md w-full p-4 sm:p-8 space-y-5 text-slate-100 shadow-2xl relative text-center box-border overflow-hidden"
            @click.stop
          >
          <div
            class="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-3xl"
          >
            ⚠️
          </div>

          <div class="space-y-1">
            <h3 class="text-lg font-black text-white">Cancel Pending Order?</h3>
            <p class="text-xs text-slate-400 font-mono">
              Order #{{ cancellingOrder.orderNumber }} &bull;
              {{ formatCurrency(cancellingOrder.totalAmount) }}
            </p>
          </div>

          <p class="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to cancel this order? Once cancelled,
            fulfillment will be cancelled, and you will no longer be able to
            edit or submit payment for it.
          </p>

          <!-- Reason Selector -->
          <div class="text-left space-y-1 text-xs">
            <label class="text-slate-400 font-medium"
              >Reason for cancellation (optional):</label
            >
            <select
              v-model="cancelReason"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-rose-400"
            >
              <option value="Changed my mind">Changed my mind</option>
              <option value="Found cheaper alternative">
                Found cheaper alternative
              </option>
              <option value="Need to modify items ordered">
                Need to modify items ordered
              </option>
              <option value="Payment method not available">
                Payment method not available
              </option>
              <option value="Ordered by mistake">Ordered by mistake</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <!-- Success Alert -->
          <div
            v-if="cancelSuccessMsg"
            class="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold"
          >
            {{ cancelSuccessMsg }}
          </div>

          <!-- Error Alert -->
          <div
            v-if="cancelErrorMsg"
            class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold"
          >
            {{ cancelErrorMsg }}
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              class="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              @click="isCancelModalOpen = false"
            >
              Keep Order
            </button>
            <button
              type="button"
              :disabled="isSubmittingCancel"
              class="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              @click="handleConfirmCancel"
            >
              <span
                v-if="isSubmittingCancel"
                class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></span>
              <span>{{
                isSubmittingCancel ? "Cancelling..." : "Yes, Cancel Order"
              }}</span>
            </button>
          </div>
        </div>
        </div>
      </div>
    </teleport>

    <!-- Review & Stars Modal -->
    <teleport to="body">
      <div
        v-if="isReviewModalOpen && activeReviewItem && activeReviewOrder"
        class="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-display"
        @click.self="closeReviewModal"
      >
        <div class="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-8 pointer-events-none">
          <div
            class="pointer-events-auto w-full max-w-[calc(100vw-1.25rem)] sm:max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5 text-left relative box-border overflow-hidden"
          >
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-lg">⭐</span>
                <h3 class="text-base sm:text-lg font-black text-white">
                  Write Product Review
                </h3>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                Order #{{ activeReviewOrder.orderNumber }} &bull; Verified Collector Review
              </p>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
              @click="closeReviewModal"
            >
              ✕
            </button>
          </div>

          <!-- Product Card Preview -->
          <div
            class="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800"
          >
            <img
              :src="activeReviewItem.image_url"
              :alt="activeReviewItem.product_name"
              class="w-12 h-12 rounded-xl object-contain bg-slate-900 border border-slate-800 p-1 flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <h4 class="text-xs sm:text-sm font-bold text-white truncate">
                {{ activeReviewItem.product_name }}
              </h4>
              <p class="text-[11px] text-amber-400 font-mono">
                {{ formatCurrency(Number(activeReviewItem.price) || 0) }}
              </p>
            </div>
          </div>

          <!-- Star Rating Selector (Interactive 1-5 Stars) -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-300 block">
              Rating (1 to 5 Stars)
            </label>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1.5 text-2xl">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  class="cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                  @mouseenter="reviewHoverRating = star"
                  @mouseleave="reviewHoverRating = 0"
                  @click="reviewRating = star"
                >
                  <span
                    :class="
                      star <= (reviewHoverRating || reviewRating)
                        ? 'text-amber-400 drop-shadow-md'
                        : 'text-slate-700'
                    "
                  >
                    ★
                  </span>
                </button>
              </div>
              <span class="text-xs font-bold text-amber-300 font-mono ml-2">
                {{ (reviewHoverRating || reviewRating) }}.0 / 5.0
                <span class="text-slate-400 font-sans text-[11px] font-normal ml-1">
                  {{
                    (reviewHoverRating || reviewRating) === 5
                      ? '• Mint / Perfect'
                      : (reviewHoverRating || reviewRating) === 4
                      ? '• Great Quality'
                      : (reviewHoverRating || reviewRating) === 3
                      ? '• Satisfactory'
                      : (reviewHoverRating || reviewRating) === 2
                      ? '• Needs Improvement'
                      : '• Poor'
                  }}
                </span>
              </span>
            </div>
          </div>

          <!-- Review Comment Textarea -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300 block">
              Your Review &amp; Feedback
            </label>
            <textarea
              v-model="reviewMessage"
              rows="3"
              placeholder="Share details about the packaging condition, item authenticity, delivery condition..."
              class="w-full text-xs px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 resize-none font-medium"
            ></textarea>
          </div>

          <!-- Success Alert -->
          <div
            v-if="reviewSuccessMsg"
            class="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2"
          >
            <span>🎉</span>
            <span>{{ reviewSuccessMsg }}</span>
          </div>

          <!-- Error Alert -->
          <div
            v-if="reviewErrorMsg"
            class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>{{ reviewErrorMsg }}</span>
          </div>

          <!-- Buttons -->
          <div class="flex gap-2.5 pt-1">
            <button
              type="button"
              class="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              @click="closeReviewModal"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="isSubmittingReview || !reviewMessage.trim()"
              class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              @click="handleConfirmReview"
            >
              <span
                v-if="isSubmittingReview"
                class="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"
              ></span>
              <span>{{ isSubmittingReview ? "Submitting..." : "Submit Review ⭐" }}</span>
            </button>
          </div>
        </div>
        </div>
      </div>
    </teleport>
  </div>
</template>
