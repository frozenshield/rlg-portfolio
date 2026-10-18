export interface StorewideDiscountConfig {
  isActive: boolean;
  percentage: number;
  saleTitle: string;
  updatedAt?: string;
}

const STORAGE_KEY = "rlg_storewide_discount";

export function getStorewideDiscount(): StorewideDiscountConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        isActive: parsed.isActive === true || parsed.isActive === "true",
        percentage: typeof parsed.percentage === "number" ? parsed.percentage : 15,
        saleTitle: parsed.saleTitle || "Collector Flash Promo",
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch (e) {
    console.warn("Failed to read storewide discount from storage", e);
  }

  // Default: active with 15% discount
  return {
    isActive: true,
    percentage: 15,
    saleTitle: "Collector Flash Promo",
    updatedAt: new Date().toISOString(),
  };
}

export function saveStorewideDiscount(config: StorewideDiscountConfig): void {
  try {
    config.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Dispatch custom event so reactive stores can refresh without page reload
    window.dispatchEvent(
      new CustomEvent("rlg:storewide-discount-updated", { detail: config })
    );
  } catch (e) {
    console.warn("Failed to save storewide discount to storage", e);
  }
}

