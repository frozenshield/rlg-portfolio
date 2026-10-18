<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAdminStore } from "../admin.store";
import { formatCurrency } from "@/shared/utils/currency.util";
import { resolveStorageUrl } from "@/shared/utils/api";
import {
  getStorewideDiscount,
  saveStorewideDiscount,
  type StorewideDiscountConfig,
} from "@/shared/utils/storewideDiscount";
import type { ProductBundleItem, AbandonedCart, SeoMetadataItem } from "../admin.types";

const adminStore = useAdminStore();

// Main Tabs
const activeTab = ref<"promos" | "global_discount" | "upsells" | "abandoned" | "seo" | "newsletter">("promos");

// Notification Feedback
const feedbackMessage = ref("");
const showFeedback = (msg: string) => {
  feedbackMessage.value = msg;
  setTimeout(() => {
    feedbackMessage.value = "";
  }, 4000);
};

// ─── TAB 1: Promo Code Engine ──────────────────────────────────────────────
const isCreatePromoOpen = ref(false);
const newCode = ref("");
const newType = ref<"percentage" | "fixed" | "shipping">("percentage");
const newValue = ref(15);
const newLimit = ref(200);
const newExpiry = ref("2026-12-31");
const newMinOrderAmount = ref(0);

const fetchDbPromos = async () => {
  try {
    const res = await fetch("/api/promo-codes");
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        adminStore.promoCodes = json.data.map((p: any) => ({
          id: String(p.id),
          code: p.code,
          type: p.type,
          value: Number(p.value),
          usageCount: Number(p.usage_count) || 0,
          usageLimit: p.usage_limit ? Number(p.usage_limit) : 500,
          expiryDate: p.expiry_date
            ? String(p.expiry_date).slice(0, 10)
            : "2026-12-31",
          isActive: Boolean(p.is_active),
          minOrderAmount: Number(p.min_order_amount) || 0,
        }));
      }
    }
  } catch (e) {
    console.error("Failed to load promo codes from database", e);
  }
};

const handleCreatePromo = async () => {
  if (!newCode.value.trim()) return;
  const code = newCode.value.toUpperCase().trim();
  // Bound percentage to 100 max
  const finalValue = newType.value === "percentage" ? Math.min(100, Math.max(0, newValue.value)) : newValue.value;
  const finalMinSpend = Math.max(0, newMinOrderAmount.value || 0);

  try {
    const res = await fetch("/api/promo-codes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        code,
        type: newType.value,
        value: finalValue,
        usage_limit: newLimit.value,
        expiry_date: newExpiry.value,
        min_order_amount: finalMinSpend,
        is_active: true,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const p = json.data;
      adminStore.promoCodes.unshift({
        id: String(p.id),
        code: p.code,
        type: p.type,
        value: Number(p.value),
        usageCount: Number(p.usage_count) || 0,
        usageLimit: p.usage_limit ? Number(p.usage_limit) : newLimit.value,
        expiryDate: p.expiry_date
          ? String(p.expiry_date).slice(0, 10)
          : newExpiry.value,
        isActive: Boolean(p.is_active),
        minOrderAmount: Number(p.min_order_amount) || finalMinSpend,
      });
      isCreatePromoOpen.value = false;
      newCode.value = "";
      newMinOrderAmount.value = 0;
      showFeedback(`Promo coupon ${code} created successfully!`);
      return;
    }
  } catch (e) {
    console.error("Failed to create promo code in database", e);
  }

  adminStore.addPromoCode({
    code,
    type: newType.value,
    value: finalValue,
    usageLimit: newLimit.value,
    expiryDate: newExpiry.value,
    isActive: true,
    minOrderAmount: finalMinSpend,
  });
  isCreatePromoOpen.value = false;
  newCode.value = "";
  newMinOrderAmount.value = 0;
  showFeedback(`Promo coupon ${code} created successfully!`);
};

const handleTogglePromo = async (promo: any) => {
  promo.isActive = !promo.isActive;
  try {
    await fetch(`/api/promo-codes/${promo.id}/toggle`, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
  } catch (e) {
    console.error("Failed to toggle promo in database", e);
  }
};

// ─── TAB 2: Upsell & Bundles Engine ────────────────────────────────────────
const isCreateBundleOpen = ref(false);
const editingBundleId = ref<number | null>(null);
const bundleTitle = ref("");
const bundlePrimaryId = ref<number | null>(null);
const bundleCompanionIds = ref<number[]>([]);
const bundleDiscountPercent = ref(10);
const bundleConversionLift = ref("+24.5%");
const bundleBadgeText = ref("🔥 Frequent Combo");
const isSubmittingBundle = ref(false);

const openCreateBundleModal = () => {
  editingBundleId.value = null;
  bundleTitle.value = "";
  bundlePrimaryId.value = adminStore.inventory[0]?.id ? Number(adminStore.inventory[0].id) : null;
  bundleCompanionIds.value = adminStore.inventory[1]?.id ? [Number(adminStore.inventory[1].id)] : [];
  bundleDiscountPercent.value = 10;
  bundleConversionLift.value = "+22.5%";
  bundleBadgeText.value = "🔥 Frequent Combo";
  isCreateBundleOpen.value = true;
};

const openEditBundleModal = (bundle: ProductBundleItem) => {
  editingBundleId.value = bundle.id;
  bundleTitle.value = bundle.title;
  bundlePrimaryId.value = bundle.primary_product_id;
  bundleCompanionIds.value = [...bundle.bundle_product_ids];
  bundleDiscountPercent.value = bundle.discount_percentage;
  bundleConversionLift.value = bundle.conversion_lift;
  bundleBadgeText.value = bundle.badge_text;
  isCreateBundleOpen.value = true;
};

const toggleCompanionSelection = (productId: number) => {
  if (bundleCompanionIds.value.includes(productId)) {
    bundleCompanionIds.value = bundleCompanionIds.value.filter((id) => id !== productId);
  } else {
    bundleCompanionIds.value.push(productId);
  }
};

const saveBundle = async () => {
  if (!bundlePrimaryId.value || bundleCompanionIds.value.length === 0 || !bundleTitle.value.trim()) {
    alert("Please select a primary product, at least one companion product, and enter a title.");
    return;
  }

  isSubmittingBundle.value = true;
  const payload = {
    primary_product_id: bundlePrimaryId.value,
    bundle_product_ids: bundleCompanionIds.value,
    title: bundleTitle.value.trim(),
    discount_percentage: Number(bundleDiscountPercent.value) || 10,
    conversion_lift: bundleConversionLift.value.trim() || "+20.0%",
    badge_text: bundleBadgeText.value.trim() || "Frequently Bought Together",
    is_active: true,
  };

  try {
    if (editingBundleId.value) {
      await adminStore.updateProductBundle(editingBundleId.value, payload);
      showFeedback(`Bundle "${payload.title}" updated successfully!`);
    } else {
      await adminStore.createProductBundle(payload);
      showFeedback(`Bundle "${payload.title}" created and activated!`);
    }
    isCreateBundleOpen.value = false;
  } catch (e) {
    console.error("Save bundle error", e);
  } finally {
    isSubmittingBundle.value = false;
  }
};

const handleDeleteBundle = async (bundle: ProductBundleItem) => {
  if (confirm(`Are you sure you want to delete the bundle "${bundle.title}"?`)) {
    await adminStore.deleteProductBundle(bundle.id);
    showFeedback("Bundle pairing removed.");
  }
};

// ─── TAB 3: Abandoned Carts & Email Recovery ────────────────────────────────
const isDispatchingAll = ref(false);
const sendingEmailCartId = ref<string | number | null>(null);
const copiedToken = ref<string | null>(null);

const handleSendReminder = async (cart: AbandonedCart) => {
  sendingEmailCartId.value = cart.id;
  try {
    const msg = await adminStore.sendAbandonedCartReminder(cart.id);
    showFeedback(msg || `10% Recovery email dispatched to ${cart.customerEmail}!`);
  } finally {
    sendingEmailCartId.value = null;
  }
};

const handleDispatchAll = async () => {
  if (!confirm("Dispatch 10% recovery emails to all customers with pending abandoned carts?")) {
    return;
  }
  isDispatchingAll.value = true;
  try {
    const msg = await adminStore.dispatchAllAbandonedCarts();
    showFeedback(msg || "All pending abandoned cart reminders have been emailed!");
  } finally {
    isDispatchingAll.value = false;
  }
};

const copyRecoveryLink = (cart: AbandonedCart) => {
  const token = cart.recoveryToken || "RECOVER";
  const url = `${window.location.origin}/checkout?recover=${token}&promo=${cart.discountCode || "RECOVER10"}`;
  navigator.clipboard.writeText(url);
  copiedToken.value = String(cart.id);
  setTimeout(() => {
    copiedToken.value = null;
  }, 2500);
  showFeedback("Checkout recovery link copied to clipboard!");
};

const handleDeleteCart = async (cart: AbandonedCart) => {
  if (confirm(`Remove abandoned cart record for ${cart.customerName}?`)) {
    await adminStore.deleteAbandonedCart(cart.id);
    showFeedback("Cart record removed.");
  }
};

// ─── TAB 4: Search Engine Optimization (SEO) & AI Copilot ───────────────────
const seoViewMode = ref<"copilot" | "directory">("copilot");
const serpDeviceMode = ref<"desktop" | "mobile">("desktop");
const isGeneratingAiSeo = ref(false);
const isSavingSeo = ref(false);

// AI Copilot Generator Inputs
const seoTargetType = ref<"global" | "product" | "category" | "custom">("global");
const seoSelectedProductId = ref<number | null>(null);
const seoCustomRoute = ref("/");
const seoTargetKeyword = ref("One Piece TCG Philippines");

// Active SEO Record being edited / generated
const currentSeo = ref<SeoMetadataItem>({
  entity_type: "global",
  page_name: "Storefront Homepage",
  route_path: "/",
  meta_title: "RLG Hobby Shop | TCG, Model Kits & Collectibles Philippines",
  meta_description: "Shop authentic factory-sealed Pokémon & One Piece TCG booster boxes, Japanese Gunpla kits, and scale anime figures with secure nationwide shipping in PH.",
  focus_keyword: "Hobby Shop Philippines",
  meta_keywords: "Pokemon TCG Philippines, One Piece Card Game, Gunpla Manila, Bandai Model Kits, Anime Figures, TCG booster boxes",
  canonical_url: "https://rlghobby.ph/",
  og_title: "RLG Hobby Shop | Authentic TCG, Gunpla & Scale Collectibles",
  og_description: "Official hub for authentic Pokémon TCG, One Piece TCG, Bandai Gunpla kits, and Japanese hobby collectibles in the Philippines.",
  og_image_url: "https://rlghobby.ph/logo.png",
  twitter_card: "summary_large_image",
  robots: "index, follow",
  structured_data_json: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RLG Hobby Shop",
    url: "https://rlghobby.ph",
  },
  seo_score: 95,
  ai_generated: true,
  ai_model: "gemini-2.5-flash",
  is_active: true,
});

const seoRecommendations = ref<string[]>([
  "Primary focus keyword is positioned within the first 40 characters of the meta title.",
  "Meta description contains a clear, urgency-driven action verb (Shop now, Order now).",
  "Schema.org structured data markup is validated for Google Rich Results snippets.",
]);

const runAiSeoGeneration = async () => {
  isGeneratingAiSeo.value = true;
  try {
    let pageName = "Storefront Homepage";
    let routePath = seoCustomRoute.value || "/";
    let productDetails: any = null;

    if (seoTargetType.value === "product") {
      const prod = adminStore.inventory.find((p) => Number(p.id) === Number(seoSelectedProductId.value));
      if (prod) {
        pageName = prod.name;
        routePath = `/products/${prod.id}`;
        productDetails = {
          price: prod.sellingPrice || prod.costPrice,
          brand: prod.vendor || "Bandai",
          description: prod.name,
        };
      }
    } else if (seoTargetType.value === "category") {
      pageName = "Trading Card Games (TCG) Category";
      routePath = "/catalog?category=tcg";
    }

    const payload = {
      entity_type: seoTargetType.value === "custom" ? "custom_page" : seoTargetType.value,
      entity_id: seoSelectedProductId.value,
      page_name: pageName,
      route_path: routePath,
      target_keyword: seoTargetKeyword.value,
      ...productDetails,
    };

    const result = await adminStore.generateAiSeo(payload);
    if (result) {
      currentSeo.value = {
        ...currentSeo.value,
        ...result,
        page_name: pageName,
        route_path: routePath,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        is_active: true,
      };
      if (Array.isArray(result.recommendations)) {
        seoRecommendations.value = result.recommendations;
      }
      showFeedback("✨ Gemini AI generated optimized SEO metadata and Schema.org markup!");
    } else {
      showFeedback("AI Generation complete with local SEO optimization engine.");
    }
  } catch (e) {
    console.error("AI SEO error:", e);
  } finally {
    isGeneratingAiSeo.value = false;
  }
};

const handleSaveSeo = async () => {
  isSavingSeo.value = true;
  try {
    const success = await adminStore.saveSeoMetadata(currentSeo.value);
    if (success) {
      showFeedback("SEO metadata published to storefront routes successfully!");
    }
  } finally {
    isSavingSeo.value = false;
  }
};

const selectSeoForEdit = (item: SeoMetadataItem) => {
  currentSeo.value = { ...item };
  seoViewMode.value = "copilot";
  showFeedback(`Loaded "${item.page_name}" into AI Copilot editor.`);
};

const handleDeleteSeo = async (item: SeoMetadataItem) => {
  if (item.id && confirm(`Delete SEO configuration for route "${item.route_path}"?`)) {
    await adminStore.deleteSeoMetadata(item.id);
    showFeedback("SEO record deleted.");
  }
};

// ─── TAB 5: Email Alerts & Newsletter Broadcast Engine ───────────────────────
interface SubscriberItem {
  id: number;
  email: string;
  is_active: boolean;
  source: string;
  subscribed_at: string;
}

const subscribers = ref<SubscriberItem[]>([]);
const subscriberSearch = ref("");
const isLoadingSubscribers = ref(false);
const broadcastSubject = ref("");
const broadcastBody = ref("");
const broadcastPreheader = ref("");
const broadcastTheme = ref("flash_sale");
const broadcastDiscountCode = ref("");
const broadcastDiscountPercent = ref(10);
const isGeneratingCopy = ref(false);
const isSendingBroadcast = ref(false);
const isAddSubscriberOpen = ref(false);
const newSubscriberEmail = ref("");
const featuredProductsPreview = ref<any[]>([]);

const filteredSubscribers = computed(() => {
  if (!subscriberSearch.value.trim()) return subscribers.value;
  const q = subscriberSearch.value.toLowerCase();
  return subscribers.value.filter(
    (s) => s.email.toLowerCase().includes(q) || (s.source && s.source.toLowerCase().includes(q))
  );
});

const fetchSubscribers = async () => {
  isLoadingSubscribers.value = true;
  try {
    const res = await fetch("/api/newsletter/subscribers");
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        subscribers.value = json.data;
      }
    }
  } catch (e) {
    console.warn("Could not load newsletter subscribers", e);
  } finally {
    isLoadingSubscribers.value = false;
  }
};

const handleGenerateAiCopy = async () => {
  isGeneratingCopy.value = true;
  try {
    const res = await fetch("/api/newsletter/generate-copy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        theme: broadcastTheme.value,
        promo_code: broadcastDiscountCode.value,
        discount_percent: broadcastDiscountPercent.value,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        broadcastSubject.value = json.data.subject || "";
        broadcastPreheader.value = json.data.preheader || "";
        broadcastBody.value = json.data.body || "";
        if (json.data.discount_code) broadcastDiscountCode.value = json.data.discount_code;
        if (json.data.featured_products) featuredProductsPreview.value = json.data.featured_products;
        showFeedback("AI promotional campaign generated from live catalog & discount code! ⚡");
        return;
      }
    }
  } catch (e) {
    console.warn("AI generation error", e);
  } finally {
    isGeneratingCopy.value = false;
  }

  // Fallback
  broadcastSubject.value = `⚡ RLG Collector VIP Alert: Exclusive ${broadcastDiscountPercent.value}% OFF Restocks!`;
  broadcastPreheader.value = `Use code ${broadcastDiscountCode.value || 'VIP10'} at checkout for ${broadcastDiscountPercent.value}% off!`;
  broadcastBody.value = `Dear Collectors,\n\nFresh hobby shipments have just landed at RLG Online Shop! Use voucher code [ ${broadcastDiscountCode.value || 'VIP10'} ] at checkout to receive ${broadcastDiscountPercent.value}% OFF your order.\n\nAll items are guaranteed 100% authentic Japanese stock with fast dispatch.\n\nVisit RLG Hobby Shop to claim your discount before inventory sells out!\n\nHappy Collecting,\nRLG Vault Team`;
  showFeedback("Generated default campaign copy.");
};

const handleSendBroadcast = async () => {
  if (!broadcastSubject.value.trim() || !broadcastBody.value.trim()) {
    alert("Please provide both an email subject and body before sending.");
    return;
  }

  if (subscribers.value.length === 0) {
    alert("No active subscribers in the roster yet.");
    return;
  }

  if (!confirm(`Broadcast this email campaign to all ${subscribers.value.length} active subscriber(s)?`)) {
    return;
  }

  isSendingBroadcast.value = true;
  try {
    const res = await fetch("/api/newsletter/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        subject: broadcastSubject.value.trim(),
        body: broadcastBody.value.trim(),
        preheader: broadcastPreheader.value.trim(),
        discount_code: broadcastDiscountCode.value.trim(),
      }),
    });

    if (res.ok) {
      const json = await res.json();
      showFeedback(json.message || "Email promotion successfully sent to all subscribers! 🎉");
      broadcastSubject.value = "";
      broadcastBody.value = "";
      broadcastPreheader.value = "";
    }
  } catch (e) {
    console.error("Broadcast failed", e);
    showFeedback("Failed to dispatch broadcast. Check network connection.");
  } finally {
    isSendingBroadcast.value = false;
  }
};

const handleAddSubscriber = async () => {
  if (!newSubscriberEmail.value.trim() || !newSubscriberEmail.value.includes("@")) {
    alert("Please enter a valid email address.");
    return;
  }
  try {
    const res = await fetch("/api/newsletter/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: newSubscriberEmail.value.trim(), source: "admin_manual" }),
    });
    if (res.ok) {
      const json = await res.json();
      subscribers.value.unshift(json.data);
      newSubscriberEmail.value = "";
      isAddSubscriberOpen.value = false;
      showFeedback("Email registered successfully! ✅");
    }
  } catch (e) {
    console.error("Failed to add subscriber", e);
  }
};

const handleDeleteSubscriber = async (sub: SubscriberItem) => {
  if (confirm(`Remove subscriber ${sub.email}?`)) {
    try {
      await fetch(`/api/newsletter/subscribers/${sub.id}`, { method: "DELETE" });
      subscribers.value = subscribers.value.filter((s) => s.id !== sub.id);
      showFeedback(`Subscriber ${sub.email} removed.`);
    } catch (e) {
      console.warn("Could not delete subscriber", e);
    }
  }
};

const handleCopyAllEmails = () => {
  if (subscribers.value.length === 0) {
    alert("No subscriber emails to copy.");
    return;
  }
  const emailList = subscribers.value.map((s) => s.email).join(", ");
  navigator.clipboard.writeText(emailList);
  showFeedback(`Copied ${subscribers.value.length} email(s) to clipboard! 📋`);
};

const handleExportSubscribersCsv = () => {
  if (subscribers.value.length === 0) {
    alert("No subscribers to export.");
    return;
  }
  const headers = "ID,Email,Source,Subscribed At,Status\n";
  const rows = subscribers.value
    .map(
      (s) =>
        `${s.id},"${s.email}","${s.source}","${s.subscribed_at}",${s.is_active ? "Active" : "Inactive"}`
    )
    .join("\n");
  const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ─── TAB NAVIGATION HORIZONTAL SCROLL ────────────────────────────────────────
const tabBarRef = ref<HTMLElement | null>(null);

const scrollTabBar = (direction: "left" | "right") => {
  if (tabBarRef.value) {
    const amount = direction === "left" ? -240 : 240;
    tabBarRef.value.scrollBy({ left: amount, behavior: "smooth" });
  }
};

// ─── DYNAMIC PROMOTION PRODUCT SELECTOR STATE & HANDLERS ─────────────────────
const globalDiscountConfig = ref<StorewideDiscountConfig>(getStorewideDiscount());
const isSavingGlobalDiscount = ref(false);

const quickDiscountPercentages = [5, 10, 15, 20, 25, 30, 40, 50];

interface SalePercentageOption {
  id: number;
  value: number;
}

const salePercentages = ref<SalePercentageOption[]>(
  Array.from({ length: 100 }, (_, i) => ({ id: i + 1, value: i + 1 })),
);
const isPromoProductSelectorOpen = ref(false);
const promoSelectorSearch = ref("");
const selectedPromoProductIds = ref<number[]>([]);
const catalogPromotionProducts = ref<any[]>([]);

const fetchSalePercentagesAndCatalog = async () => {
  try {
    const [spRes, prodRes] = await Promise.all([
      fetch("/api/sale-percentages"),
      fetch("/api/products?per_page=200"),
    ]);
    if (spRes.ok) {
      const spJson = await spRes.json();
      if (spJson.success && Array.isArray(spJson.data) && spJson.data.length > 0) {
        salePercentages.value = spJson.data;
      }
    }
    if (prodRes.ok) {
      const prodJson = await prodRes.json();
      if (Array.isArray(prodJson.data)) {
        catalogPromotionProducts.value = prodJson.data;
        selectedPromoProductIds.value = prodJson.data
          .filter((p: any) => Boolean(p.is_promotion))
          .map((p: any) => Number(p.id));
      }
    }
  } catch (e) {
    console.warn("Could not load sale_percentage or products list", e);
  }
};

const filteredPromoSelectorProducts = computed(() => {
  const source =
    catalogPromotionProducts.value.length > 0
      ? catalogPromotionProducts.value
      : adminStore.inventory;
  const q = promoSelectorSearch.value.trim().toLowerCase();
  if (!q) return source;
  return source.filter((p: any) =>
    String(p.name || "")
      .toLowerCase()
      .includes(q),
  );
});

const togglePromoProductCheckbox = (productId: number) => {
  const idx = selectedPromoProductIds.value.indexOf(productId);
  if (idx > -1) {
    selectedPromoProductIds.value.splice(idx, 1);
  } else {
    selectedPromoProductIds.value.push(productId);
  }
};

const toggleAllPromoSelectorProducts = () => {
  const ids = filteredPromoSelectorProducts.value.map((p: any) => Number(p.id));
  const allChecked =
    ids.length > 0 && ids.every((id) => selectedPromoProductIds.value.includes(id));
  if (allChecked) {
    selectedPromoProductIds.value = selectedPromoProductIds.value.filter(
      (id) => !ids.includes(id),
    );
  } else {
    selectedPromoProductIds.value = Array.from(
      new Set([...selectedPromoProductIds.value, ...ids]),
    );
  }
};

const openPromoProductSelector = () => {
  isPromoProductSelectorOpen.value = true;
};

const handleApplySelectedProductsPromotion = async () => {
  if (selectedPromoProductIds.value.length === 0) {
    alert("Please check at least one product to apply the promotion.");
    return;
  }

  isSavingGlobalDiscount.value = true;
  try {
    const pct = Math.min(
      100,
      Math.max(1, Number(globalDiscountConfig.value.percentage) || 15),
    );
    globalDiscountConfig.value.percentage = pct;

    // Resolve sale_percentage_id from sale_percentage table options
    const matchedSp =
      salePercentages.value.find((sp) => Number(sp.value) === pct) ||
      salePercentages.value.find((sp) => Number(sp.id) === pct);
    const salePercentageId = matchedSp ? matchedSp.id : pct;

    // Keep global storewide discount false so ONLY checked products receive the discount
    globalDiscountConfig.value.isActive = false;
    saveStorewideDiscount(globalDiscountConfig.value);

    const res = await fetch("/api/products/apply-promotion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        product_ids: selectedPromoProductIds.value,
        sale_percentage_id: salePercentageId,
        is_promotion: true,
      }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      isPromoProductSelectorOpen.value = false;
      await fetchSalePercentagesAndCatalog();
      await adminStore.fetchInventory();
      showFeedback(
        json.message ||
          `⚡ Applied ${pct}% discount (sale_percentage ID #${salePercentageId}) to ${selectedPromoProductIds.value.length} checked product(s)!`,
      );
    } else {
      showFeedback(json?.message || "Failed to apply promotion to selected products.");
    }
  } catch (e) {
    console.error("Failed to apply product promotion", e);
    showFeedback("Failed to apply promotion to selected products.");
  } finally {
    isSavingGlobalDiscount.value = false;
  }
};

// Dynamic Combo Price Calculators for Bundles
const resolveProductUnitPrice = (productId: number | null, fallbackPrice?: number): number => {
  if (fallbackPrice && Number(fallbackPrice) > 0) {
    return Number(fallbackPrice);
  }
  if (!productId) return 0;
  const invItem = adminStore.inventory.find((p) => Number(p.id) === Number(productId));
  if (invItem) {
    return Number(invItem.sellingPrice || invItem.costPrice || 0);
  }
  const catItem = catalogPromotionProducts.value.find(
    (p: any) => Number(p.id) === Number(productId),
  );
  return catItem ? Number(catItem.price || catItem.original_price || 0) : 0;
};

const getBundleOriginalTotal = (bundle: any): number => {
  if (bundle.original_total_price && Number(bundle.original_total_price) > 0) {
    return Number(bundle.original_total_price);
  }
  const primaryPrice = resolveProductUnitPrice(
    bundle.primary_product_id,
    bundle.primary_product?.price,
  );
  const companionsTotal = Array.isArray(bundle.bundled_products)
    ? bundle.bundled_products.reduce(
        (sum: number, c: any) => sum + resolveProductUnitPrice(c.id, c.price),
        0,
      )
    : 0;
  return Number((primaryPrice + companionsTotal).toFixed(2));
};

const getBundleComboPrice = (bundle: any): number => {
  if (bundle.combo_price && Number(bundle.combo_price) > 0) {
    return Number(bundle.combo_price);
  }
  const orig = getBundleOriginalTotal(bundle);
  const discPct = Math.min(100, Math.max(0, Number(bundle.discount_percentage || 0)));
  return Number(Math.max(0, orig * (1 - discPct / 100)).toFixed(2));
};

const liveModalBundleOriginalTotal = computed(() => {
  const primaryPrice = resolveProductUnitPrice(bundlePrimaryId.value);
  const companionsPrice = bundleCompanionIds.value.reduce(
    (sum, id) => sum + resolveProductUnitPrice(id),
    0,
  );
  return Number((primaryPrice + companionsPrice).toFixed(2));
});

const liveModalBundleComboPrice = computed(() => {
  const orig = liveModalBundleOriginalTotal.value;
  const pct = Math.min(100, Math.max(0, Number(bundleDiscountPercent.value) || 0));
  return Number(Math.max(0, orig * (1 - pct / 100)).toFixed(2));
});

// Lifecycle
onMounted(() => {
  fetchDbPromos();
  fetchSubscribers();
  fetchSalePercentagesAndCatalog();
  adminStore.fetchProductBundles();
  adminStore.fetchAbandonedCarts();
  adminStore.fetchSeoMetadata();
  if (adminStore.inventory.length === 0) {
    adminStore.fetchInventory();
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs"
    >
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Marketing &amp; Promotions Engine
          </h1>
          <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            Automated
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">
          Discount codes, cross-sell/upsell matrices, abandoned cart recovery, and search engine optimization.
        </p>
      </div>

      <!-- Tab Buttons with Left & Right Horizontal Scroll Navigation -->
      <div class="flex items-center gap-1.5 max-w-full sm:max-w-2xl lg:max-w-3xl overflow-hidden">
        <!-- Left Arrow Scroll Button -->
        <button
          type="button"
          class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center text-sm font-black transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95 hover:text-indigo-600"
          title="Scroll tab bar left"
          @click="scrollTabBar('left')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Tab Buttons Scroll Container -->
        <div
          ref="tabBarRef"
          class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto scroll-smooth no-scrollbar"
        >
          <!-- 1. Discount Codes -->
          <button
            type="button"
            class="px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            :class="
              activeTab === 'promos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            "
            @click="activeTab = 'promos'"
          >
            <span>🏷️</span>
            <span>Discount Codes</span>
            <span class="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-200 text-slate-700">
              {{ adminStore.promoCodes.length }}
            </span>
          </button>

          <!-- 2. Dynamic Storewide Discount -->
          <button
            type="button"
            class="px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            :class="
              activeTab === 'global_discount'
                ? 'bg-rose-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
            "
            @click="activeTab = 'global_discount'"
          >
            <span>⚡</span>
            <span>Dynamic Discount</span>
            <span
              class="px-1.5 py-0.2 rounded-full text-[9px] font-bold"
              :class="
                activeTab === 'global_discount'
                  ? 'bg-rose-800 text-white'
                  : globalDiscountConfig.isActive
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-200 text-slate-600'
              "
            >
              {{ globalDiscountConfig.isActive ? `${globalDiscountConfig.percentage}% Active` : 'Disabled' }}
            </span>
          </button>

          <!-- 3. Upsell & Bundles -->
          <button
            type="button"
            class="px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            :class="
              activeTab === 'upsells'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            "
            @click="activeTab = 'upsells'"
          >
            <span>🔄</span>
            <span>Upsell &amp; Bundles</span>
            <span class="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 text-indigo-700">
              {{ adminStore.productBundles.length }}
            </span>
          </button>

          <!-- 4. Abandoned Carts -->
          <button
            type="button"
            class="px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            :class="
              activeTab === 'abandoned'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            "
            @click="activeTab = 'abandoned'"
          >
            <span>🛒</span>
            <span>Abandoned Carts</span>
            <span class="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-100 text-rose-700 font-bold">
              {{ adminStore.abandonedCarts.length }}
            </span>
          </button>

          <!-- 5. SEO Metadata -->
          <button
            type="button"
            class="px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            :class="
              activeTab === 'seo'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            "
            @click="activeTab = 'seo'"
          >
            <span>🔍</span>
            <span>SEO Metadata</span>
            <span class="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 text-emerald-700 font-bold">
              AI Active
            </span>
          </button>

          <!-- 6. AI Email Blast & Subscribers -->
          <button
            type="button"
            class="px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            :class="
              activeTab === 'newsletter'
                ? 'bg-purple-600 text-white shadow-xs font-black'
                : 'text-slate-700 hover:text-purple-700 hover:bg-purple-50'
            "
            @click="activeTab = 'newsletter'"
          >
            <span>📣</span>
            <span>AI Email Blast &amp; Subscribers</span>
            <span
              class="px-1.5 py-0.2 rounded-full text-[9px] font-bold"
              :class="
                activeTab === 'newsletter'
                  ? 'bg-purple-800 text-white'
                  : 'bg-purple-100 text-purple-700'
              "
            >
              {{ subscribers.length }}
            </span>
          </button>
        </div>

        <!-- Right Arrow Scroll Button -->
        <button
          type="button"
          class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center text-sm font-black transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95 hover:text-indigo-600"
          title="Scroll tab bar right"
          @click="scrollTabBar('right')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Feedback Notification Banner -->
    <div
      v-if="feedbackMessage"
      class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-fade-in"
    >
      <div class="flex items-center gap-2">
        <span>✨</span>
        <span>{{ feedbackMessage }}</span>
      </div>
      <button
        type="button"
        class="text-emerald-600 hover:text-emerald-900 text-xs font-bold cursor-pointer"
        @click="feedbackMessage = ''"
      >
        ✕
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 1: Discount Promo Codes Engine                                    -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'promos'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Active Promotional Coupons
          </h2>
          <p class="text-xs text-slate-500">
            Configure percentage markdowns, fixed discounts, and free shipping triggers
          </p>
        </div>
        <button
          type="button"
          class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
          @click="isCreatePromoOpen = true"
        >
          <span>+</span>
          <span>Create Promo Code</span>
        </button>
      </div>

      <div
        class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                class="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider"
              >
                <th class="p-4">Coupon Code</th>
                <th class="p-4">Discount Type &amp; Value</th>
                <th class="p-4">Min. Purchase</th>
                <th class="p-4">Redemptions</th>
                <th class="p-4">Usage Limit</th>
                <th class="p-4">Expiration Date</th>
                <th class="p-4">Status</th>
                <th class="p-4 text-right">Toggle Active</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="promo in adminStore.promoCodes"
                :key="promo.id"
                class="hover:bg-slate-50/70 transition-colors"
              >
                <td class="p-4 font-mono font-black text-rose-600 text-xs">
                  {{ promo.code }}
                </td>
                <td class="p-4 font-bold text-slate-800">
                  <span v-if="promo.type === 'percentage'"
                    >{{ promo.value }}% OFF</span
                  >
                  <span v-else-if="promo.type === 'fixed'"
                    >₱{{ promo.value }} Fixed Reduction</span
                  >
                  <span v-else>Free Shipping</span>
                </td>
                <td class="p-4 font-semibold text-slate-700 font-mono">
                  <span v-if="promo.minOrderAmount && promo.minOrderAmount > 0">
                    {{ formatCurrency(promo.minOrderAmount) }}
                  </span>
                  <span v-else class="text-slate-400 font-normal italic">
                    None (₱0)
                  </span>
                </td>
                <td class="p-4 font-bold text-slate-700">
                  {{ promo.usageCount }} times used
                </td>
                <td class="p-4 text-slate-500">
                  {{ promo.usageLimit }} maximum
                </td>
                <td class="p-4 text-slate-500 font-mono">
                  {{ promo.expiryDate }}
                </td>
                <td class="p-4">
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    :class="
                      promo.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    "
                  >
                    {{ promo.isActive ? "Active" : "Disabled" }}
                  </span>
                </td>
                <td class="p-4 text-right">
                  <button
                    type="button"
                    class="px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer"
                    :class="
                      promo.isActive
                        ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    "
                    @click="handleTogglePromo(promo)"
                  >
                    {{ promo.isActive ? "Pause" : "Activate" }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- TAB: Selective Product Promotion & Discount Engine                     -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'global_discount'" class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Selective Product Promotion &amp; Discount Selector
            </h2>
            <span
              class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-2xs bg-amber-50 text-amber-700 border-amber-200"
            >
              {{ selectedPromoProductIds.length }} Checked Product(s)
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            Select a discount percentage (resolved via the `sale_percentage` table) and choose specific products via checkboxes so the promotion applies only to checked items.
          </p>
        </div>
        <button
          type="button"
          class="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-2 transition-all shrink-0 active:scale-95 disabled:opacity-50"
          :disabled="isSavingGlobalDiscount"
          @click="openPromoProductSelector"
        >
          <span>☑️</span>
          <span>Select Products &amp; Apply Discount ({{ selectedPromoProductIds.length }})</span>
        </button>
      </div>

      <!-- Main Config Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Column 1: Product Selection Summary -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>☑️</span>
            <span>Targeted Product Selection</span>
          </h3>

          <div class="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-rose-700">● Checked Products Mode</span>
              <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                {{ selectedPromoProductIds.length }} Selected
              </span>
            </div>
            <p class="text-[11px] text-slate-600 leading-relaxed">
              Instead of applying promotions to all products automatically, open the Product Selector modal to check the exact products that should receive the <strong>-{{ globalDiscountConfig.percentage }}% OFF</strong> discount from `sale_percentage`.
            </p>
            <button
              type="button"
              class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs cursor-pointer transition-colors"
              @click="openPromoProductSelector"
            >
              Open Product Checkbox Selector →
            </button>
          </div>
        </div>

        <!-- Column 2: Percentage & Promotion Settings -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>🏷️</span>
            <span>Sale Percentage Tier (`sale_percentage` Table)</span>
          </h3>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Select Discount Percentage (1% – 100%)
              </label>
              <select
                v-model.number="globalDiscountConfig.percentage"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none text-xs font-black text-slate-900 bg-white"
              >
                <option
                  v-for="sp in salePercentages"
                  :key="sp.id"
                  :value="sp.value"
                >
                  sale_percentage ID #{{ sp.id }} — {{ sp.value }}% OFF
                </option>
              </select>
            </div>

            <!-- Quick Percentage Selection Chips -->
            <div>
              <label class="block text-[11px] font-bold text-slate-500 mb-1.5">
                Quick Preset Percentages
              </label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="pct in quickDiscountPercentages"
                  :key="pct"
                  type="button"
                  class="px-2.5 py-1 rounded-lg text-xs font-black font-mono transition-all cursor-pointer border"
                  :class="
                    globalDiscountConfig.percentage === pct
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  "
                  @click="globalDiscountConfig.percentage = pct"
                >
                  {{ pct }}%
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Promotional Campaign Title
              </label>
              <input
                v-model="globalDiscountConfig.saleTitle"
                type="text"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none text-xs text-slate-900"
                placeholder="e.g. Collector Flash Sale"
              />
            </div>
          </div>
        </div>

        <!-- Column 3: Live Storefront Card Preview -->
        <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 text-white">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>👁️</span>
              <span>Live Storefront Preview</span>
            </h3>
            <span class="text-[10px] text-slate-400">Checked Card Demo</span>
          </div>

          <!-- Preview Card -->
          <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-300 truncate">
                Pokémon 151 Booster Box
              </span>
              <!-- Demo Discount Badge -->
              <span
                class="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs animate-pulse"
              >
                -{{ globalDiscountConfig.percentage }}% OFF
              </span>
            </div>

            <div class="flex items-baseline gap-2">
              <!-- Demo Current Price -->
              <span class="text-lg font-black text-amber-400 font-mono">
                {{ formatCurrency(5000 * (1 - globalDiscountConfig.percentage / 100)) }}
              </span>
              <!-- Demo Original Price Strike-through -->
              <span
                class="text-xs text-slate-500 line-through font-mono"
              >
                {{ formatCurrency(5000) }}
              </span>
            </div>

            <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Promo Campaign:</span>
              <span class="font-bold text-amber-300 truncate max-w-[140px]">
                {{ globalDiscountConfig.saleTitle || 'Flash Promo' }}
              </span>
            </div>
          </div>

          <div class="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            💡 <strong>Selective Promotion:</strong> Only products checked in the Product Selector Modal receive this discount and appear with VIP/Promotional badges.
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 2: Upsell & Bundles Engine                                        -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'upsells'" class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Frequently Bought Together &amp; Bundle Matrices
          </h2>
          <p class="text-xs text-slate-500">
            Pair complementary hobby items (booster boxes + card sleeves, Gunpla kits + action bases) with dynamic combo discounts to multiply basket value.
          </p>
        </div>
        <button
          type="button"
          class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2 transition-colors shrink-0"
          @click="openCreateBundleModal"
        >
          <span>+</span>
          <span>Create Bundle Pairing</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="adminStore.isLoadingBundles" class="p-8 text-center text-slate-400 text-xs font-bold">
        Loading bundle matrices...
      </div>

      <!-- Empty State -->
      <div
        v-else-if="adminStore.productBundles.length === 0"
        class="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3"
      >
        <div class="text-3xl">📦</div>
        <h3 class="text-sm font-bold text-slate-800">No Bundles Configured Yet</h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">
          Create pairing matrices between products to boost average order values across your catalog.
        </p>
        <button
          type="button"
          class="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 cursor-pointer"
          @click="openCreateBundleModal"
        >
          + Create First Bundle
        </button>
      </div>

      <!-- Bundles Grid / List -->
      <div v-else class="grid grid-cols-1 gap-4">
        <div
          v-for="bundle in adminStore.productBundles"
          :key="bundle.id"
          class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div class="space-y-2 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-black text-slate-900">{{ bundle.title }}</span>
              <span
                class="px-2 py-0.5 rounded-md text-[10px] font-bold"
                :class="bundle.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'"
              >
                {{ bundle.is_active ? 'Active on Storefront' : 'Inactive' }}
              </span>
              <span class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                {{ bundle.badge_text || 'Frequently Bought Together' }}
              </span>
            </div>

            <!-- Primary Product Anchor -->
            <div class="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <img
                :src="bundle.primary_product?.image_url || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=100'"
                :alt="bundle.primary_product?.name || 'Primary Product'"
                class="w-10 h-10 object-cover rounded-lg border border-slate-200"
              />
              <div class="flex-1 min-w-0">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Anchor Product</span>
                <span class="text-xs font-bold text-slate-800 truncate block">
                  {{ bundle.primary_product?.name || 'Primary Product #' + bundle.primary_product_id }}
                </span>
              </div>
              <div class="text-right">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Unit Price</span>
                <span class="text-xs font-black text-slate-900">
                  {{ formatCurrency(resolveProductUnitPrice(bundle.primary_product_id, bundle.primary_product?.price)) }}
                </span>
              </div>
            </div>

            <!-- Companion Products -->
            <div class="flex items-center gap-2 flex-wrap pt-1">
              <span class="text-[11px] text-slate-400 font-semibold">Bundled With:</span>
              <span
                v-for="comp in bundle.bundled_products"
                :key="comp.id"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 text-[11px] font-bold border border-indigo-100"
              >
                <span>+</span>
                <span>{{ comp.name }}</span>
                <span class="text-indigo-500 font-mono text-[10px]">
                  ({{ formatCurrency(resolveProductUnitPrice(comp.id, comp.price)) }})
                </span>
              </span>
            </div>
          </div>

          <!-- Economics & Controls -->
          <div class="flex items-center gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-between md:justify-end">
            <div class="text-right">
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Dynamic Combo Price</span>
              <div class="flex items-baseline justify-end gap-1.5">
                <span class="text-base font-black text-emerald-700 font-mono">
                  {{ formatCurrency(getBundleComboPrice(bundle)) }}
                </span>
                <span class="text-xs text-slate-400 line-through font-mono">
                  {{ formatCurrency(getBundleOriginalTotal(bundle)) }}
                </span>
              </div>
              <div class="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-md bg-rose-50 text-rose-700 font-black text-[10px] border border-rose-200">
                <span>🏷️ Save {{ bundle.discount_percentage }}% ({{ bundle.conversion_lift || '+20%' }} Lift)</span>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer"
                :class="bundle.is_active ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'"
                @click="adminStore.toggleProductBundle(bundle.id)"
              >
                {{ bundle.is_active ? 'Pause' : 'Activate' }}
              </button>
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Edit Bundle"
                @click="openEditBundleModal(bundle)"
              >
                ✏️
              </button>
              <button
                type="button"
                class="p-1.5 text-rose-400 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                title="Delete Bundle"
                @click="handleDeleteBundle(bundle)"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 3: Abandoned Carts Recovery Engine                                 -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'abandoned'" class="space-y-4">
      <!-- Recovery Statistics KPI Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div class="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Unclaimed Cart Value</span>
          <div class="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
            {{ formatCurrency(adminStore.abandonedCartStats.total_abandoned_value) }}
          </div>
          <span class="text-[10.5px] text-slate-500 font-medium">Pending checkout completion</span>
        </div>

        <div class="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Abandoned Carts</span>
          <div class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {{ adminStore.abandonedCarts.length }}
          </div>
          <span class="text-[10.5px] text-slate-500 font-medium">Across storefront sessions</span>
        </div>

        <div class="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Reminder Emails Sent</span>
          <div class="text-xl sm:text-2xl font-black text-indigo-600 tracking-tight">
            {{ adminStore.abandonedCartStats.reminders_sent_count }}
          </div>
          <span class="text-[10.5px] text-slate-500 font-medium">With 10% discount tokens</span>
        </div>

        <div class="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span class="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Recovery Rate</span>
          <div class="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
            {{ adminStore.abandonedCartStats.recovery_rate_percent }}%
          </div>
          <span class="text-[10.5px] text-slate-500 font-medium">Checkout conversions saved</span>
        </div>
      </div>

      <!-- Controls & Header -->
      <div
        class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
      >
        <div class="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Incomplete Checkouts &amp; Cart Recovery
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Trigger personalized HTML reminder emails with one-click recover discount tokens (10% OFF voucher).
            </p>
          </div>

          <button
            type="button"
            :disabled="isDispatchingAll || adminStore.abandonedCarts.length === 0"
            class="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2 transition-all shrink-0"
            @click="handleDispatchAll"
          >
            <span v-if="isDispatchingAll" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span v-else>🚀</span>
            <span>{{ isDispatchingAll ? 'Dispatching...' : 'Dispatch All Recovery Emails' }}</span>
          </button>
        </div>

        <!-- Carts List -->
        <div class="divide-y divide-slate-100">
          <div
            v-for="cart in adminStore.abandonedCarts"
            :key="cart.id"
            class="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
          >
            <!-- Customer & Item Info -->
            <div class="space-y-2 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-extrabold text-slate-900 text-xs">{{ cart.customerName }}</span>
                <span class="text-[11px] text-slate-400 font-mono">({{ cart.customerEmail }})</span>
                <span
                  v-if="cart.recovered"
                  class="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800"
                >
                  RECOVERED
                </span>
              </div>

              <!-- Cart Value & Items Count -->
              <div class="flex items-center gap-3 text-xs text-slate-600">
                <span>{{ cart.itemsCount }} item(s) left in cart</span>
                <span>&bull;</span>
                <span>
                  Value:
                  <span class="font-bold text-slate-900">{{ formatCurrency(cart.totalValue) }}</span>
                </span>
                <span>&bull;</span>
                <span class="text-[11px] text-slate-400">Last activity: {{ cart.lastActive }}</span>
              </div>

              <!-- Items Thumbnails Carousel -->
              <div v-if="cart.cartItems && cart.cartItems.length > 0" class="flex items-center gap-2 flex-wrap pt-1">
                <div
                  v-for="(item, iIdx) in cart.cartItems"
                  :key="iIdx"
                  class="flex items-center gap-1.5 p-1 px-2 rounded-lg bg-slate-100 border border-slate-200 text-[11px]"
                >
                  <img
                    :src="resolveStorageUrl(item.image_url) || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=80'"
                    :alt="item.name"
                    class="w-5 h-5 rounded object-cover"
                    @error="(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=80'; }"
                  />
                  <span class="font-semibold text-slate-700 max-w-[140px] truncate">{{ item.name }}</span>
                  <span class="text-slate-400 font-mono text-[10px]">x{{ item.quantity }}</span>
                </div>
              </div>
            </div>

            <!-- Actions & Dispatched Status -->
            <div class="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
              <!-- Copy Recovery Link Button -->
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1"
                title="Copy Direct Checkout Recovery URL"
                @click="copyRecoveryLink(cart)"
              >
                <span>🔗</span>
                <span>{{ copiedToken === String(cart.id) ? 'Copied!' : 'Copy Link' }}</span>
              </button>

              <!-- Email Trigger Button -->
              <button
                v-if="!cart.reminderSent"
                type="button"
                :disabled="sendingEmailCartId === cart.id"
                class="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50"
                @click="handleSendReminder(cart)"
              >
                <span
                  v-if="sendingEmailCartId === cart.id"
                  class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"
                ></span>
                <span v-else>💌</span>
                <span>{{ sendingEmailCartId === cart.id ? 'Sending...' : 'Send 10% Recovery Email' }}</span>
              </button>

              <span
                v-else
                class="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5"
              >
                <span>✓</span>
                <span>Reminder Email Dispatched</span>
              </span>

              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                title="Remove Cart Record"
                @click="handleDeleteCart(cart)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 4: Search Engine Optimization (SEO) & AI Copilot                 -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'seo'" class="space-y-4">
      <!-- Sub-Navigation Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 px-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Search Engine Optimization (SEO) Copilot
            </h2>
            <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
              ⚡ Google Gemini Enabled
            </span>
          </div>
          <p class="text-xs text-slate-500">
            Automatically craft high-CTR meta titles, Google SERP snippets, Open Graph tags, and Schema.org JSON-LD.
          </p>
        </div>

        <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            :class="seoViewMode === 'copilot' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
            @click="seoViewMode = 'copilot'"
          >
            ✨ AI Generator &amp; Editor
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            :class="seoViewMode === 'directory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
            @click="seoViewMode = 'directory'"
          >
            📑 Tracked Routes Matrix ({{ adminStore.seoMetadataList.length }})
          </button>
        </div>
      </div>

      <!-- VIEW 1: AI Copilot Generator & Visual Preview -->
      <div v-if="seoViewMode === 'copilot'" class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Left: Configuration & Inputs (7 cols) -->
        <div class="lg:col-span-7 space-y-4">
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">1. Select SEO Target</span>
              <span class="text-[11px] text-slate-400 font-mono">{{ currentSeo.route_path }}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Target Page Type</label>
                <select
                  v-model="seoTargetType"
                  class="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:outline-none focus:border-slate-800"
                >
                  <option value="global">Homepage (Storefront Root)</option>
                  <option value="product">Specific Product from Catalog</option>
                  <option value="category">Category Hub (TCG / Gunpla)</option>
                  <option value="custom">Custom Storefront URL Route</option>
                </select>
              </div>

              <div v-if="seoTargetType === 'product'">
                <label class="block font-bold text-slate-700 mb-1">Choose Product</label>
                <select
                  v-model="seoSelectedProductId"
                  class="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:outline-none focus:border-slate-800"
                >
                  <option :value="null">-- Select Product --</option>
                  <option v-for="prod in adminStore.inventory" :key="prod.id" :value="Number(prod.id)">
                    {{ prod.name }} (₱{{ prod.sellingPrice || prod.costPrice }})
                  </option>
                </select>
              </div>

              <div v-else-if="seoTargetType === 'custom'">
                <label class="block font-bold text-slate-700 mb-1">Custom Route Path</label>
                <input
                  v-model="seoCustomRoute"
                  type="text"
                  placeholder="e.g. /collections/rare-charizards"
                  class="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Target Focus Keyword</label>
                <input
                  v-model="seoTargetKeyword"
                  type="text"
                  placeholder="e.g. One Piece OP-05 Philippines"
                  class="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-xs"
                />
              </div>
            </div>

            <div class="pt-2">
              <button
                type="button"
                :disabled="isGeneratingAiSeo"
                class="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                @click="runAiSeoGeneration"
              >
                <span v-if="isGeneratingAiSeo" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span v-else>✨</span>
                <span>{{ isGeneratingAiSeo ? 'Gemini AI Optimizing Meta & Schema...' : 'Generate High-Ranking SEO with AI (Gemini)' }}</span>
              </button>
            </div>
          </div>

          <!-- Metadata Fields Editor -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <span class="font-bold text-slate-800 uppercase tracking-wider text-xs">2. Edit Metadata &amp; Keywords</span>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-bold text-slate-400">SEO Score:</span>
                <span class="px-2 py-0.5 rounded-full font-black text-[10px] bg-emerald-100 text-emerald-800">
                  {{ currentSeo.seo_score || 94 }}/100 🟢
                </span>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="font-bold text-slate-700">Meta Title (Max 60 chars)</label>
                <span
                  class="text-[10px] font-mono"
                  :class="currentSeo.meta_title.length > 60 ? 'text-rose-600 font-bold' : 'text-slate-400'"
                >
                  {{ currentSeo.meta_title.length }} / 60
                </span>
              </div>
              <input
                v-model="currentSeo.meta_title"
                type="text"
                maxlength="80"
                class="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-xs focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="font-bold text-slate-700">Meta Description (Max 160 chars)</label>
                <span
                  class="text-[10px] font-mono"
                  :class="currentSeo.meta_description.length > 160 ? 'text-rose-600 font-bold' : 'text-slate-400'"
                >
                  {{ currentSeo.meta_description.length }} / 160
                </span>
              </div>
              <textarea
                v-model="currentSeo.meta_description"
                rows="3"
                maxlength="180"
                class="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-xs focus:outline-none focus:border-slate-800 leading-relaxed"
              ></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Focus Keyword</label>
                <input
                  v-model="currentSeo.focus_keyword"
                  type="text"
                  class="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Canonical URL</label>
                <input
                  v-model="currentSeo.canonical_url"
                  type="text"
                  class="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Target Keyword Cloud (Comma Separated)</label>
              <input
                v-model="currentSeo.meta_keywords"
                type="text"
                class="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <!-- Save CTA -->
            <div class="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                :disabled="isSavingSeo"
                class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2 transition-all disabled:opacity-50"
                @click="handleSaveSeo"
              >
                <span v-if="isSavingSeo" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>💾</span>
                <span>{{ isSavingSeo ? 'Saving...' : 'Save & Publish SEO Metadata' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Live Previews (SERP & Social Open Graph) (5 cols) -->
        <div class="lg:col-span-5 space-y-4">
          <!-- Google SERP Live Snippet Preview -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <span class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>🔎</span>
                <span>Google SERP Live Snippet</span>
              </span>
              <div class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  class="px-2 py-0.5 rounded cursor-pointer"
                  :class="serpDeviceMode === 'desktop' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'"
                  @click="serpDeviceMode = 'desktop'"
                >
                  Desktop
                </button>
                <button
                  type="button"
                  class="px-2 py-0.5 rounded cursor-pointer"
                  :class="serpDeviceMode === 'mobile' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'"
                  @click="serpDeviceMode = 'mobile'"
                >
                  Mobile
                </button>
              </div>
            </div>

            <!-- SERP Snippet Box -->
            <div
              class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-sans transition-all"
              :class="serpDeviceMode === 'mobile' ? 'max-w-[320px] mx-auto shadow-inner' : ''"
            >
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-full bg-rose-600 flex items-center justify-center text-[9px] text-white font-black">
                  R
                </div>
                <div class="text-[11px] text-slate-600 font-mono truncate leading-tight">
                  https://rlghobby.ph <span class="text-slate-400">&rsaquo;</span> {{ currentSeo.route_path.replace(/^\//, '') || 'home' }}
                </div>
              </div>
              <h4 class="text-sm font-medium text-blue-800 hover:underline cursor-pointer leading-snug pt-0.5">
                {{ currentSeo.meta_title }}
              </h4>
              <p class="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {{ currentSeo.meta_description }}
              </p>
            </div>
          </div>

          <!-- Social Share Open Graph Card Live Preview (Facebook / Discord / Twitter) -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <span class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <span>💬</span>
              <span>Social Share Preview (Open Graph)</span>
            </span>

            <div class="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-2xs">
              <img
                :src="currentSeo.og_image_url || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600'"
                alt="OG Preview Banner"
                class="w-full h-36 object-cover bg-slate-200"
              />
              <div class="p-3 space-y-1">
                <span class="text-[10px] font-mono uppercase text-slate-400 font-bold block">RLGHOBBY.PH</span>
                <span class="text-xs font-bold text-slate-900 block line-clamp-1">
                  {{ currentSeo.og_title || currentSeo.meta_title }}
                </span>
                <p class="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {{ currentSeo.og_description || currentSeo.meta_description }}
                </p>
              </div>
            </div>
          </div>

          <!-- AI Optimization Recommendations -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5 text-xs">
            <span class="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
              💡 Gemini AI SEO Strategy Tips
            </span>
            <ul class="space-y-1.5 text-slate-600">
              <li
                v-for="(rec, rIdx) in seoRecommendations"
                :key="rIdx"
                class="flex items-start gap-2 leading-relaxed text-[11.5px]"
              >
                <span class="text-emerald-600 font-bold mt-0.5">✓</span>
                <span>{{ rec }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- VIEW 2: Tracked Routes Directory Matrix Table -->
      <div v-else class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Storefront Tracked SEO Routes
          </h3>
          <span class="text-xs text-slate-400">Total: {{ adminStore.seoMetadataList.length }} pages</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <th class="p-4">Route Path &amp; Name</th>
                <th class="p-4">Meta Title</th>
                <th class="p-4">Focus Keyword</th>
                <th class="p-4">SEO Health</th>
                <th class="p-4">Engine</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in adminStore.seoMetadataList"
                :key="item.id"
                class="hover:bg-slate-50/70 transition-colors"
              >
                <td class="p-4">
                  <span class="font-extrabold text-slate-900 block text-xs">{{ item.page_name }}</span>
                  <span class="font-mono text-slate-400 text-[11px]">{{ item.route_path }}</span>
                </td>
                <td class="p-4 font-medium text-slate-700 max-w-xs truncate">
                  {{ item.meta_title }}
                </td>
                <td class="p-4">
                  <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                    {{ item.focus_keyword || 'Auto' }}
                  </span>
                </td>
                <td class="p-4">
                  <span class="px-2 py-0.5 rounded-full font-black text-[10px] bg-emerald-100 text-emerald-800">
                    {{ item.seo_score || 95 }}/100 🟢
                  </span>
                </td>
                <td class="p-4">
                  <span
                    v-if="item.ai_generated"
                    class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200"
                  >
                    AI (Gemini)
                  </span>
                  <span v-else class="text-slate-400 text-[11px]">Manual</span>
                </td>
                <td class="p-4 text-right space-x-2">
                  <button
                    type="button"
                    class="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 cursor-pointer"
                    @click="selectSeoForEdit(item)"
                  >
                    Edit in Copilot
                  </button>
                  <button
                    type="button"
                    class="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                    title="Delete"
                    @click="handleDeleteSeo(item)"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 5: Email Alerts & VIP Customer Broadcast Engine                    -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'newsletter'" class="space-y-6">
      <!-- Sub-Navigation Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 px-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
              AI Promotional Email &amp; VIP Broadcast Engine
            </h2>
            <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
              ⚡ Gemini AI Powered
            </span>
          </div>
          <p class="text-xs text-slate-500">
            Automatically scans live catalog products to generate high-converting discount emails, then batch push sends to all customers who saved their email.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 bg-purple-50 px-3.5 py-1.5 rounded-xl border border-purple-200">
            <span class="text-xs font-bold text-purple-900">Total Saved Emails:</span>
            <span class="px-2 py-0.5 rounded-lg bg-purple-600 text-white font-mono font-black text-xs">
              {{ subscribers.length }}
            </span>
          </div>
          <button
            type="button"
            class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1 transition-all"
            @click="isAddSubscriberOpen = true"
          >
            <span>➕</span>
            <span>Add Email</span>
          </button>
        </div>
      </div>

      <!-- Main 2-Column Layout: Campaign Composer + Subscribers Table -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left: AI Campaign Composer (7 cols) -->
        <div class="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>🤖</span>
                <span>AI Product &amp; Discount Email Generator</span>
              </h3>
              <p class="text-xs text-slate-500">
                Gemini checks live inventory and crafts email copy with discount voucher codes
              </p>
            </div>

            <!-- AI Generator Button -->
            <button
              type="button"
              :disabled="isGeneratingCopy"
              class="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
              @click="handleGenerateAiCopy"
            >
              <span v-if="isGeneratingCopy" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-else>✨</span>
              <span>{{ isGeneratingCopy ? 'AI Checking Inventory...' : 'AI Generate Discount Email' }}</span>
            </button>
          </div>

          <!-- Discount Configuration for the Email -->
          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>🏷️</span>
              <span>Discount &amp; Promotion Settings</span>
            </span>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">
                  Target Discount Code
                </label>
                <div class="flex gap-1.5">
                  <input
                    v-model="broadcastDiscountCode"
                    type="text"
                    placeholder="e.g. VIP10 or OP05-FLASH"
                    class="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900 uppercase bg-white focus:outline-none focus:border-purple-500"
                  />
                  <select
                    v-if="adminStore.promoCodes.length > 0"
                    class="p-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 font-bold focus:outline-none"
                    @change="broadcastDiscountCode = ($event.target as HTMLSelectElement).value"
                  >
                    <option value="">Select Active</option>
                    <option
                      v-for="pc in adminStore.promoCodes"
                      :key="pc.id"
                      :value="pc.code"
                    >
                      {{ pc.code }} ({{ pc.type === 'percentage' ? pc.value + '%' : '₱' + pc.value }})
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-600 mb-1">
                  Discount Percentage
                </label>
                <div class="flex items-center gap-1">
                  <button
                    v-for="pct in [5, 10, 15, 20]"
                    :key="pct"
                    type="button"
                    class="flex-1 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all border text-center"
                    :class="
                      broadcastDiscountPercent === pct
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    "
                    @click="broadcastDiscountPercent = pct"
                  >
                    {{ pct }}%
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Campaign Theme Selector -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              class="p-2.5 rounded-xl border text-left transition-all cursor-pointer"
              :class="
                broadcastTheme === 'flash_sale'
                  ? 'border-purple-500 bg-purple-50/60 text-purple-950 font-bold shadow-2xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              "
              @click="broadcastTheme = 'flash_sale'"
            >
              <span class="block text-xs">⚡ Flash Sale / Restock</span>
              <span class="text-[10px] text-slate-500 font-normal">Urgency &amp; instant discount</span>
            </button>

            <button
              type="button"
              class="p-2.5 rounded-xl border text-left transition-all cursor-pointer"
              :class="
                broadcastTheme === 'collector_vault'
                  ? 'border-purple-500 bg-purple-50/60 text-purple-950 font-bold shadow-2xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              "
              @click="broadcastTheme = 'collector_vault'"
            >
              <span class="block text-xs">🛡️ Vault Exclusives</span>
              <span class="text-[10px] text-slate-500 font-normal">Sealed booster boxes &amp; rare kits</span>
            </button>

            <button
              type="button"
              class="p-2.5 rounded-xl border text-left transition-all cursor-pointer"
              :class="
                broadcastTheme === 'weekend_drop'
                  ? 'border-purple-500 bg-purple-50/60 text-purple-950 font-bold shadow-2xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              "
              @click="broadcastTheme = 'weekend_drop'"
            >
              <span class="block text-xs">📦 Weekend Drop</span>
              <span class="text-[10px] text-slate-500 font-normal">Fast courier dispatch &amp; freebies</span>
            </button>
          </div>

          <!-- Featured Products Scanned by AI Preview -->
          <div v-if="featuredProductsPreview.length > 0" class="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-1.5">
            <div class="flex items-center justify-between text-[11px] font-bold text-purple-900">
              <span>🎯 Live Products Checked &amp; Included by AI:</span>
              <span class="text-purple-600">{{ featuredProductsPreview.length }} products</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="p in featuredProductsPreview"
                :key="p.id"
                class="px-2 py-1 rounded-lg bg-white border border-purple-200 text-[10px] text-slate-800 font-semibold shadow-2xs flex items-center gap-1"
              >
                <span>📦</span>
                <span>{{ p.name }}</span>
                <span class="text-slate-400 line-through text-[9px]">{{ p.formatted_original }}</span>
                <span class="text-emerald-600 font-black">{{ p.formatted_discounted }}</span>
              </span>
            </div>
          </div>

          <!-- Email Subject Line -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-slate-700">
              Email Subject Line *
            </label>
            <input
              v-model="broadcastSubject"
              type="text"
              placeholder="e.g. ⚡ VIP Flash Discount: 10% OFF on Rare Booster Boxes & Gunpla!"
              class="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>

          <!-- Preheader Text -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-slate-700">
              Preheader Snippet (Inbox Preview)
            </label>
            <input
              v-model="broadcastPreheader"
              type="text"
              placeholder="e.g. Use code VIP10 at checkout for 10% off authentic Japanese collectibles..."
              class="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-700 focus:outline-none focus:border-purple-500"
            />
          </div>

          <!-- Email Body Content -->
          <div class="space-y-1">
            <label class="block text-xs font-bold text-slate-700">
              Email Body Content (Markdown / Plain Text) *
            </label>
            <textarea
              v-model="broadcastBody"
              rows="6"
              placeholder="Click 'AI Generate Discount Email' above to automatically scan products and create a ready-to-send promotional email..."
              class="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-purple-500 font-sans leading-relaxed"
            ></textarea>
          </div>

          <!-- Broadcast Action CTA -->
          <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span class="text-[11px] text-slate-500 font-medium">
              Push notification batch will be sent to all <span class="font-bold text-purple-700">{{ subscribers.length }}</span> saved customer emails.
            </span>

            <button
              type="button"
              :disabled="isSendingBroadcast || subscribers.length === 0"
              class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
              @click="handleSendBroadcast"
            >
              <span v-if="isSendingBroadcast" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-else>🚀</span>
              <span>{{ isSendingBroadcast ? 'Sending Batch...' : `Batch Send to All (${subscribers.length}) Emails` }}</span>
            </button>
          </div>
        </div>

        <!-- Right: Saved Customer Emails Table (5 cols) -->
        <div class="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>📋</span>
                <span>Saved Promotional Emails</span>
              </h3>
              <p class="text-[11px] text-slate-400">Users who saved their email in the storefront</p>
            </div>

            <div class="flex items-center gap-1.5">
              <button
                type="button"
                title="Copy All Emails"
                class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                @click="handleCopyAllEmails"
              >
                📋 Copy
              </button>
              <button
                type="button"
                title="Export CSV"
                class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                @click="handleExportSubscribersCsv"
              >
                📥 CSV
              </button>
              <button
                type="button"
                title="Refresh Table"
                class="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                @click="fetchSubscribers"
              >
                🔄
              </button>
            </div>
          </div>

          <!-- Search Filter -->
          <div class="relative">
            <input
              v-model="subscriberSearch"
              type="text"
              placeholder="Search saved emails..."
              class="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-500 bg-slate-50"
            />
            <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
          </div>

          <!-- Loading State -->
          <div v-if="isLoadingSubscribers" class="py-12 text-center text-xs text-slate-400">
            <span class="inline-block w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-1"></span>
            <p>Loading email database...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="subscribers.length === 0" class="py-12 text-center text-xs text-slate-400 space-y-2">
            <p class="text-3xl">📬</p>
            <p class="font-bold text-slate-700">No Emails Saved Yet</p>
            <p class="text-[11px] max-w-xs mx-auto">When customers enter their email in the storefront promotional field (footer VIP alerts), their emails are automatically saved here.</p>
            <button
              type="button"
              class="mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              @click="isAddSubscriberOpen = true"
            >
              ➕ Add Test Email Now
            </button>
          </div>

          <!-- Full Table View of Saved Emails -->
          <div v-else class="overflow-x-auto max-h-[480px] overflow-y-auto border border-slate-100 rounded-xl">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 sticky top-0 bg-slate-50 z-10">
                <tr>
                  <th class="p-2.5">Email Address</th>
                  <th class="p-2.5 hidden sm:table-cell">Source</th>
                  <th class="p-2.5 hidden sm:table-cell">Date</th>
                  <th class="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="sub in filteredSubscribers"
                  :key="sub.id"
                  class="hover:bg-purple-50/40 transition-colors"
                >
                  <td class="p-2.5 font-mono font-bold text-slate-800 text-[11px] truncate max-w-[150px]">
                    <div class="flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span class="truncate">{{ sub.email }}</span>
                    </div>
                  </td>
                  <td class="p-2.5 hidden sm:table-cell">
                    <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                      {{ sub.source === 'storefront_promo_field' ? 'Storefront Field' : sub.source.replace(/_/g, ' ') }}
                    </span>
                  </td>
                  <td class="p-2.5 text-slate-400 text-[10px] hidden sm:table-cell whitespace-nowrap">
                    {{ new Date(sub.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
                  </td>
                  <td class="p-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      class="text-rose-500 hover:text-rose-700 text-[11px] font-bold cursor-pointer p-1 rounded hover:bg-rose-50"
                      title="Remove Email"
                      @click="handleDeleteSubscriber(sub)"
                    >
                      ✕ Remove
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Add Manual / Test Email Subscriber -->
    <teleport to="body">
      <div
        v-if="isAddSubscriberOpen"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
        <div class="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">
              Add Promotional Email
            </h3>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              @click="isAddSubscriberOpen = false"
            >
              ✕
            </button>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold text-slate-700">
              Customer Email Address
            </label>
            <input
              v-model="newSubscriberEmail"
              type="email"
              placeholder="collector@example.com"
              class="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
              @keyup.enter="handleAddSubscriber"
            />
          </div>

          <div class="pt-2 flex justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              @click="isAddSubscriberOpen = false"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs cursor-pointer"
              @click="handleAddSubscriber"
            >
              Save Email
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Create Promo Code                                              -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <teleport to="body">
      <div
        v-if="isCreatePromoOpen"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
        <div
          class="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-slate-200 font-display"
        >
          <div
            class="flex items-center justify-between pb-3 border-b border-slate-100"
          >
            <div>
              <h3 class="text-base font-bold text-slate-900">
                Create New Coupon Engine Rule
              </h3>
              <p class="text-xs text-slate-500">
                Set discount code, percentage, and usage limits
              </p>
            </div>
            <button
              type="button"
              class="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              @click="isCreatePromoOpen = false"
            >
              ✕
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1"
                >Promo Code (Uppercase)</label
              >
              <input
                v-model="newCode"
                type="text"
                placeholder="e.g. FLASH25"
                class="w-full p-2.5 rounded-xl border border-slate-300 uppercase font-mono font-bold"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1"
                  >Discount Type</label
                >
                <select
                  v-model="newType"
                  class="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Cash (₱)</option>
                  <option value="shipping">Free Shipping</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">
                  {{
                    newType === 'percentage'
                      ? 'Discount Percentage (%)'
                      : newType === 'fixed'
                        ? 'Fixed Deduction (₱)'
                        : 'Free Shipping (N/A)'
                  }}
                </label>
                <div class="relative">
                  <input
                    v-model.number="newValue"
                    type="number"
                    :min="0"
                    :max="newType === 'percentage' ? 100 : undefined"
                    :disabled="newType === 'shipping'"
                    :placeholder="newType === 'percentage' ? '15 (Max 100%)' : '150'"
                    class="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                  <span
                    class="absolute right-3 top-2.5 text-xs font-black text-slate-400 select-none pointer-events-none"
                  >
                    {{ newType === 'percentage' ? '%' : newType === 'fixed' ? '₱' : '🚚' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Minimum Purchase Field -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                Minimum Purchase Amount (₱)
              </label>
              <div class="relative">
                <input
                  v-model.number="newMinOrderAmount"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="0 (No minimum spend required)"
                  class="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                />
                <span class="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  PHP
                </span>
              </div>
              <p class="text-[10px] text-slate-500 mt-1">
                Customers must have at least this amount in their cart to activate this coupon. Leave 0 for any amount.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1"
                  >Total Usage Limit</label
                >
                <input
                  v-model.number="newLimit"
                  type="number"
                  class="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1"
                  >Expiration Date</label
                >
                <input
                  v-model="newExpiry"
                  type="date"
                  class="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          <div class="flex gap-3 pt-3">
            <button
              type="button"
              class="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              @click="isCreatePromoOpen = false"
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              @click="handleCreatePromo"
            >
              Publish Coupon
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Create / Edit Product Bundle Pairing                           -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <teleport to="body">
      <div
        v-if="isCreateBundleOpen"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
        <div
          class="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 font-display max-h-[90vh] overflow-y-auto"
        >
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-900">
                {{ editingBundleId ? 'Edit Bundle Pairing' : 'Create Frequently Bought Together Bundle' }}
              </h3>
              <p class="text-xs text-slate-500">
                Select an anchor product and complementary add-on accessories
              </p>
            </div>
            <button
              type="button"
              class="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              @click="isCreateBundleOpen = false"
            >
              ✕
            </button>
          </div>

          <div class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Bundle Title / Proposition</label>
              <input
                v-model="bundleTitle"
                type="text"
                placeholder="e.g. Pro Sleeves &amp; Magnetic Case Protector Pack"
                class="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Anchor Primary Product</label>
              <select
                v-model="bundlePrimaryId"
                class="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
              >
                <option :value="null">-- Select Primary Product --</option>
                <option v-for="prod in adminStore.inventory" :key="prod.id" :value="Number(prod.id)">
                  {{ prod.name }} ({{ formatCurrency(prod.sellingPrice || prod.costPrice) }})
                </option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1.5">
                Select Bundled Companion Products (Check 1 or more)
              </label>
              <div class="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                <label
                  v-for="prod in adminStore.inventory.filter((p) => Number(p.id) !== bundlePrimaryId)"
                  :key="prod.id"
                  class="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    :checked="bundleCompanionIds.includes(Number(prod.id))"
                    class="rounded text-indigo-600 focus:ring-indigo-500"
                    @change="toggleCompanionSelection(Number(prod.id))"
                  />
                  <img
                    :src="(prod as any).imageUrl || (prod as any).image_url || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=80'"
                    class="w-6 h-6 object-cover rounded"
                  />
                  <span class="flex-1 font-medium text-slate-800 truncate text-[11.5px]">{{ prod.name }}</span>
                  <span class="font-bold text-slate-600 text-[11px]">{{ formatCurrency(prod.sellingPrice || prod.costPrice) }}</span>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Bundle Discount (%)</label>
                <input
                  v-model.number="bundleDiscountPercent"
                  type="number"
                  min="0"
                  max="50"
                  class="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Expected Lift</label>
                <input
                  v-model="bundleConversionLift"
                  type="text"
                  placeholder="+25.0%"
                  class="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Badge Tag</label>
                <input
                  v-model="bundleBadgeText"
                  type="text"
                  placeholder="🔥 Frequent Combo"
                  class="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <!-- Live Dynamic Combo Price Preview -->
            <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold uppercase text-emerald-700 block">
                  Calculated Combo Price ({{ 1 + bundleCompanionIds.length }} Items)
                </span>
                <span class="text-[11px] text-slate-600">
                  Original Total: <strong class="line-through">{{ formatCurrency(liveModalBundleOriginalTotal) }}</strong>
                  (Save {{ bundleDiscountPercent || 0 }}%)
                </span>
              </div>
              <span class="text-base font-black text-emerald-800 font-mono">
                {{ formatCurrency(liveModalBundleComboPrice) }}
              </span>
            </div>
          </div>

          <div class="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              class="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              @click="isCreateBundleOpen = false"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="isSubmittingBundle"
              class="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              @click="saveBundle"
            >
              <span v-if="isSubmittingBundle" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isSubmittingBundle ? 'Saving...' : 'Save & Activate Bundle' }}</span>
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: Product Selector for Promotions (Images + Checkboxes)           -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <teleport to="body">
      <div
        v-if="isPromoProductSelectorOpen"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      >
        <div
          class="bg-white text-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden font-display [color-scheme:light]"
        >
          <div class="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="text-base font-black text-slate-900">
                Select Products for Promotion
              </h3>
              <p class="text-xs text-slate-500">
                Check the products below. The selected {{ globalDiscountConfig.percentage }}% discount (`sale_percentage` table) will only apply to these checked products.
              </p>
            </div>
            <button
              type="button"
              class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              @click="isPromoProductSelectorOpen = false"
            >
              ✕
            </button>
          </div>

          <div class="p-4 bg-slate-50 border-b border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Discount (`sale_percentage`)
              </label>
              <select
                v-model.number="globalDiscountConfig.percentage"
                class="w-full p-2 rounded-xl border border-rose-400 bg-white text-slate-900 text-xs font-bold"
              >
                <option
                  v-for="sp in salePercentages"
                  :key="sp.id"
                  :value="sp.value"
                >
                  ID #{{ sp.id }} — {{ sp.value }}% OFF
                </option>
              </select>
            </div>

            <div class="sm:col-span-2 flex items-end gap-2">
              <div class="flex-1">
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Filter Products
                </label>
                <input
                  v-model="promoSelectorSearch"
                  type="text"
                  placeholder="Search product name..."
                  class="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                />
              </div>
              <button
                type="button"
                class="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer shrink-0"
                @click="toggleAllPromoSelectorProducts"
              >
                Toggle All
              </button>
            </div>
          </div>

          <div class="p-4 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh]">
            <label
              v-for="prod in filteredPromoSelectorProducts"
              :key="prod.id"
              class="flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all select-none"
              :class="
                selectedPromoProductIds.includes(Number(prod.id))
                  ? 'border-rose-500 bg-rose-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              "
            >
              <input
                type="checkbox"
                class="w-4 h-4 accent-rose-600 rounded cursor-pointer shrink-0"
                :checked="selectedPromoProductIds.includes(Number(prod.id))"
                @change="togglePromoProductCheckbox(Number(prod.id))"
              />
              <img
                :src="resolveStorageUrl(prod.image_url || prod.imageUrl) || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=100'"
                :alt="prod.name"
                class="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
              />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-slate-900 truncate">
                  {{ prod.name }}
                </p>
                <div class="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span class="line-through">
                    {{ formatCurrency(prod.original_price || prod.price || prod.sellingPrice || 0) }}
                  </span>
                  <span>→</span>
                  <span class="font-black text-rose-600">
                    {{
                      formatCurrency(
                        (prod.original_price || prod.price || prod.sellingPrice || 0) *
                          (1 - globalDiscountConfig.percentage / 100),
                      )
                    }}
                  </span>
                </div>
              </div>
            </label>
          </div>

          <div class="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
            <span class="text-xs font-bold text-slate-600">
              {{ selectedPromoProductIds.length }} product(s) checked
            </span>
            <div class="flex items-center gap-2.5">
              <button
                type="button"
                class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                @click="isPromoProductSelectorOpen = false"
              >
                Cancel
              </button>
              <button
                type="button"
                :disabled="isSavingGlobalDiscount || selectedPromoProductIds.length === 0"
                class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs cursor-pointer"
                @click="handleApplySelectedProductsPromotion"
              >
                {{
                  isSavingGlobalDiscount
                    ? "Applying..."
                    : `Apply ${globalDiscountConfig.percentage}% OFF to ${selectedPromoProductIds.length} Checked Product(s)`
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>
