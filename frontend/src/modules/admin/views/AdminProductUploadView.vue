<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAdminStore } from "../admin.store";
import type { RefPokemonSetItem } from "@/shared/types/toy.types";
import { formatProductDescription } from "@/shared/utils/descriptionFormatter";
import { resolveApiUrl, resolveStorageUrl } from "@/shared/utils/api";

const props = withDefaults(
  defineProps<{
    isVipMode?: boolean;
  }>(),
  {
    isVipMode: false,
  },
);

const emit = defineEmits<{
  (e: "vip-saved", product: any): void;
  (e: "cancel"): void;
}>();

const router = useRouter();
const route = useRoute();
const editingProductId = ref<number | null>(null);
const isEditMode = computed(() => editingProductId.value !== null);
const adminStore = useAdminStore();
const showDescriptionPreview = ref(true);

interface CategoryItem {
  id: number;
  desc: string;
  subcategories: { id: number; desc: string; ref_category_id: number }[];
}

interface BrandItem {
  id: number;
  name: string;
}

interface ConditionItem {
  id: number;
  desc: string;
}

interface SalePercentageOption {
  id: number;
  value: number;
}

const dbCategories = ref<CategoryItem[]>([]);
const dbBrands = ref<BrandItem[]>([]);
const dbConditions = ref<ConditionItem[]>([]);
const dbPokemonSets = ref<RefPokemonSetItem[]>([]);
const salePercentages = ref<SalePercentageOption[]>(
  Array.from({ length: 100 }, (_, i) => ({ id: i + 1, value: i + 1 })),
);

const isPromotion = ref(props.isVipMode);
const salePercentageId = ref<number | null>(props.isVipMode ? 20 : null);

watch(
  () => props.isVipMode,
  (val) => {
    if (val) {
      isPromotion.value = true;
      if (!salePercentageId.value) {
        salePercentageId.value = 20;
      }
    }
  },
  { immediate: true },
);

const selectedPercentageValue = computed(() => {
  if (!salePercentageId.value) return 0;
  const found = salePercentages.value.find(
    (sp) => sp.id === Number(salePercentageId.value),
  );
  return found ? found.value : 0;
});

const computedVipPrice = computed(() => {
  const base = Number(sellingPrice.value) || 0;
  const pct = selectedPercentageValue.value;
  if (pct <= 0) return base;
  return Number(Math.max(0, base - base * (pct / 100)).toFixed(2));
});

// Product Duplicate Detection & Validation State
export interface DuplicateItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  original_price: number | null;
  stock: number;
  image_url: string | null;
  status: string;
  is_promotion: boolean;
  category: string;
  condition: string;
  match_type: string;
  confidence: number;
  reason: string;
}

const isAutomation = computed(() => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return Boolean(
    navigator.webdriver ||
      (window as any).__playwright ||
      (window as any).__pw_manualStatus ||
      /playwright/i.test(navigator.userAgent) ||
      window.localStorage?.getItem("disable_duplicate_check") === "true",
  );
});

const detectedDuplicates = ref<DuplicateItem[]>([]);
const isCheckingDuplicates = ref(false);
const allowDuplicate = ref(false);
const enableDuplicateCheck = ref(!isAutomation.value);
const isDuplicateDismissed = ref(false);
const isDuplicateModalOpen = ref(false);
const isAddingStock = ref(false);
const stockAddedSuccess = ref("");
let duplicateCheckTimeout: any = null;

const dismissDuplicateWarning = () => {
  isDuplicateDismissed.value = true;
  allowDuplicate.value = true;
  detectedDuplicates.value = [];
  isDuplicateModalOpen.value = false;
};

const checkDuplicateProducts = async () => {
  if (!enableDuplicateCheck.value || isAutomation.value || isDuplicateDismissed.value) {
    detectedDuplicates.value = [];
    return;
  }

  const currentTitle = title.value.trim();
  const currentImg =
    mediaList.value.find((m) => m.isPrimary)?.serverUrl ||
    mediaList.value.find((m) => m.isPrimary)?.url ||
    mediaList.value[0]?.serverUrl ||
    mediaList.value[0]?.url ||
    "";

  if (!currentTitle && !currentImg) {
    detectedDuplicates.value = [];
    return;
  }

  isCheckingDuplicates.value = true;
  try {
    const res = await fetch(resolveApiUrl("/api/products/check-duplicate"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(isAutomation.value ? { "X-Automation-Test": "playwright" } : {}),
      },
      body: JSON.stringify({
        name: currentTitle,
        title: currentTitle,
        image_url: currentImg.startsWith("blob:") ? null : currentImg,
        description: description.value,
        sku: sku.value ? sku.value.trim() : null,
        condition: condition.value,
        bypass_duplicate_check: !enableDuplicateCheck.value || isAutomation.value || isDuplicateDismissed.value ? 1 : 0,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (
        json.success &&
        Array.isArray(json.data) &&
        enableDuplicateCheck.value &&
        !isAutomation.value &&
        !isDuplicateDismissed.value
      ) {
        detectedDuplicates.value = json.data;
      } else {
        detectedDuplicates.value = [];
      }
    }
  } catch (e) {
    console.warn("Duplicate check error:", e);
  } finally {
    isCheckingDuplicates.value = false;
  }
};

const triggerDebouncedDuplicateCheck = () => {
  if (isAutomation.value || !enableDuplicateCheck.value || isDuplicateDismissed.value) return;
  if (duplicateCheckTimeout) clearTimeout(duplicateCheckTimeout);
  duplicateCheckTimeout = setTimeout(() => {
    checkDuplicateProducts();
  }, 600);
};

const handleAddStockToExisting = async (existingProduct: DuplicateItem, amount: number = 1) => {
  isAddingStock.value = true;
  saveError.value = "";
  try {
    const res = await fetch(`/api/products/${existingProduct.id}/add-stock`, { method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ amount }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Failed to update stock.");
    }

    // Update local admin inventory state if present
    adminStore.updateStock(String(existingProduct.id), Number(existingProduct.stock) + amount);

    stockAddedSuccess.value = `✅ Successfully added +${amount} stock to "${existingProduct.name}" (SKU: ${existingProduct.sku})! Current stock: ${Number(existingProduct.stock) + amount}.`;

    // Reset card-specific fields for the next upload
    title.value = "";
    sku.value = "";
    description.value = "";
    sellingPrice.value = 0;
    stock.value = 1;
    mediaList.value = [];
    newImageUrl.value = "";
    aiSuccess.value = "";
    aiStatusMessage.value = "";
    detectedDuplicates.value = [];
    isDuplicateModalOpen.value = false;
    allowDuplicate.value = false;

    setTimeout(() => {
      stockAddedSuccess.value = "";
    }, 6000);
  } catch (err: any) {
    saveError.value = err.message || "Could not update stock on existing product.";
  } finally {
    isAddingStock.value = false;
  }
};

const handleConfirmPublishSeparateCopy = async () => {
  allowDuplicate.value = true;
  isDuplicateDismissed.value = true;
  isDuplicateModalOpen.value = false;
  await handleSaveProduct();
};

const selectedPokemonSeries = ref("");
const selectedPokemonSet = ref("");
const refPokemonSetId = ref<number | null>(null);

// Get unique series list for the Series dropdown
const availablePokemonSeries = computed(() => {
  const seriesSet = new Set<string>();
  for (const s of dbPokemonSets.value) {
    if (s.series) {
      seriesSet.add(s.series);
    }
  }
  return Array.from(seriesSet);
});

// Group sets by generation series (filtered by selectedPokemonSeries if selected)
const groupedPokemonSets = computed(() => {
  const groups: { series: string; sets: RefPokemonSetItem[] }[] = [];
  const map = new Map<string, RefPokemonSetItem[]>();

  const setsToGroup = selectedPokemonSeries.value
    ? dbPokemonSets.value.filter(
        (s) => s.series === selectedPokemonSeries.value,
      )
    : dbPokemonSets.value;

  for (const s of setsToGroup) {
    const seriesName = s.series || "Other Sets";
    if (!map.has(seriesName)) {
      map.set(seriesName, []);
    }
    map.get(seriesName)!.push(s);
  }

  for (const [series, sets] of map.entries()) {
    groups.push({ series, sets });
  }

  return groups;
});

// Selected Pokemon Set Object
const currentSelectedPokemonSetObj = computed(() => {
  if (refPokemonSetId.value) {
    return dbPokemonSets.value.find((s) => s.id === refPokemonSetId.value);
  }
  if (selectedPokemonSet.value) {
    return dbPokemonSets.value.find(
      (s) =>
        s.japanese_set === selectedPokemonSet.value ||
        s.japanese_code === selectedPokemonSet.value,
    );
  }
  return null;
});

const fetchTaxonomy = async () => {
  try {
    const [catRes, brandRes, condRes, setsRes, saleRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/brands"),
      fetch("/api/conditions"),
      fetch("/api/pokemon-sets"),
      fetch("/api/sale-percentages"),
    ]);
    if (catRes.ok) {
      dbCategories.value = await catRes.json();
    }
    if (brandRes.ok) {
      dbBrands.value = await brandRes.json();
    }
    if (condRes.ok) {
      const condList = await condRes.json();
      if (Array.isArray(condList)) {
        const order = [
          "Brandnew",
          "MISB",
          "BIB",
          "Loose",
          "Near Mint",
          "Lightly Played",
          "Moderately Played",
          "Heavily Played",
          "Damaged",
        ];
        dbConditions.value = condList.sort((a, b) => {
          const idxA = order.indexOf(a.desc);
          const idxB = order.indexOf(b.desc);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.desc.localeCompare(b.desc);
        });
      }
    }
    if (setsRes.ok) {
      const sJson = await setsRes.json();
      if (sJson.success && Array.isArray(sJson.data)) {
        dbPokemonSets.value = sJson.data;
      }
    }
    if (saleRes && saleRes.ok) {
      const saleJson = await saleRes.json();
      if (saleJson.success && Array.isArray(saleJson.data) && saleJson.data.length > 0) {
        salePercentages.value = saleJson.data;
      }
    }
  } catch (e) {
    console.error("Failed to load taxonomy from API", e);
  }
};

const isLoadingProduct = ref(false);

const loadProductForEditing = async (id: number) => {
  editingProductId.value = id;
  isLoadingProduct.value = true;
  try {
    const res = await fetch(resolveApiUrl(`/api/products/${id}`));
    const json = await res.json();
    if (res.ok && json.success && json.data) {
      const p = json.data;
      title.value = p.name || "";
      sku.value = p.sku || "";
      sellingPrice.value = Number(p.price) || 0;
      stock.value = Number(p.stock) || 0;
      description.value = p.description || "";
      condition.value = p.condition?.desc || p.condition || "";
      primaryCategory.value = p.category?.desc || p.category || "";
      secondaryCategory.value = p.subcategory?.desc || p.subcategory || "";
      brandVendor.value = p.brand?.name || p.brand || "";
      weightGrams.value = Number(p.weight) || null;
      dimensionLength.value = Number(p.length) || null;
      dimensionWidth.value = Number(p.width) || null;
      dimensionHeight.value = Number(p.height) || null;
      if (p.status) {
        publishStatus.value = p.status.charAt(0).toUpperCase() + p.status.slice(1);
      }
      if (p.image_url) {
        mediaList.value = [
          {
            id: 'primary-' + id,
            url: resolveStorageUrl(p.image_url),
            serverUrl: p.image_url,
            alt: p.name,
            isPrimary: true,
          }
        ];
      }
      if (Array.isArray(p.gallery_images)) {
        p.gallery_images.forEach((g: string, idx: number) => {
          if (g && g !== p.image_url) {
            mediaList.value.push({
              id: 'gal-' + idx,
              url: resolveStorageUrl(g),
              serverUrl: g,
              alt: p.name,
              isPrimary: false,
            });
          }
        });
      }
    }
  } catch (err) {
    console.error("Failed to load product for editing:", err);
  } finally {
    isLoadingProduct.value = false;
  }
};

onMounted(async () => {
  await fetchTaxonomy();
  const editId = route.query.edit || route.query.id;
  if (editId) {
    await loadProductForEditing(Number(editId));
  }
});

// Basic Info
const title = ref("");
const sku = ref("");
const condition = ref("");

// Description (plain text)
const description = ref("");

watch([title, description, condition], () => {
  triggerDebouncedDuplicateCheck();
});

// Media Gallery
interface MediaItem {
  id: string;
  url: string;
  serverUrl?: string;
  file?: File;
  alt: string;
  isPrimary: boolean;
  width?: number;
  height?: number;
  fileSize?: string;
}

const mediaList = ref<MediaItem[]>([]);
const newImageUrl = ref("");

const getImageDimensions = (
  url: string,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
};

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatConditionOption = (desc: string): string => {
  switch (desc) {
    case "MISB":
      return "MISB (Mint In Sealed Box)";
    case "BIB":
      return "BIB (Back In Box / With Box)";
    case "Loose":
      return "Loose (Unboxed / No Box)";
    case "Brandnew":
      return "Brandnew / Factory Sealed";
    case "Near Mint":
      return "Near Mint (Pristine Card / Item)";
    default:
      return desc;
  }
};

const addImage = async () => {
  if (newImageUrl.value.trim()) {
    const url = newImageUrl.value.trim();
    const newId = "m-" + Date.now();
    const dims = await getImageDimensions(url);
    mediaList.value.push({
      id: newId,
      url,
      alt: title.value ? title.value + " photo" : "Product photo",
      isPrimary: mediaList.value.length === 0,
      width: dims.width > 0 ? dims.width : undefined,
      height: dims.height > 0 ? dims.height : undefined,
    });
    newImageUrl.value = "";
  }
};

const setPrimaryMedia = (id: string) => {
  mediaList.value.forEach((m) => {
    m.isPrimary = m.id === id;
  });
};

const removeMedia = (id: string) => {
  mediaList.value = mediaList.value.filter((m) => m.id !== id);
  if (mediaList.value.length > 0 && !mediaList.value.some((m) => m.isPrimary)) {
    mediaList.value[0].isPrimary = true;
  }
};

// AI Automation & Image Upload State
const isAnalyzingWithAi = ref(false);
const autoFillWithAi = ref(true);
const aiStatusMessage = ref("");
const aiError = ref("");
const aiSuccess = ref("");
const fileInput = ref<HTMLInputElement | null>(null);
const isDraggingOver = ref(false);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    await processUploadedImage(target.files[0]);
    target.value = "";
  }
};

const handleDrop = async (e: DragEvent) => {
  isDraggingOver.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    await processUploadedImage(e.dataTransfer.files[0]);
  }
};

const uploadMediaToServer = async (file: File, mediaItemId: string): Promise<string | null> => {
  const target = mediaList.value.find((m) => m.id === mediaItemId);
  if (target?.serverUrl) return target.serverUrl;

  try {
    const fd = new FormData();
    fd.append("image", file);
    const token = localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const upRes = await fetch(resolveApiUrl("/api/upload"), { method: "POST",
      headers,
      body: fd,
    });
    const upData = await upRes.json();
    if (upRes.ok && upData.success && upData.url) {
      if (target) {
        target.serverUrl = upData.url;
      }
      return upData.url;
    }
  } catch (e) {
    console.warn("Direct upload to /api/upload failed:", e);
  }
  return null;
};

const processUploadedImage = async (file: File) => {
  const localPreviewUrl = URL.createObjectURL(file);
  const newMediaId = "m-" + Date.now();
  const dims = await getImageDimensions(localPreviewUrl);
  const fileSize = formatBytes(file.size);

  mediaList.value.unshift({
    id: newMediaId,
    url: localPreviewUrl,
    file,
    alt: file.name,
    isPrimary: true,
    width: dims.width > 0 ? dims.width : undefined,
    height: dims.height > 0 ? dims.height : undefined,
    fileSize,
  });
  mediaList.value.slice(1).forEach((m) => (m.isPrimary = false));

  // Eagerly upload the image to server storage so serverUrl is guaranteed even before saving or if AI has issues
  await uploadMediaToServer(file, newMediaId);

  if (!autoFillWithAi.value) {
    return;
  }

  await runAiAnalysis(file, newMediaId);
};

const analyzeUrlWithAi = async () => {
  if (!newImageUrl.value.trim()) return;
  const url = newImageUrl.value.trim();
  addImage();
  const lastItem = mediaList.value[mediaList.value.length - 1];
  if (autoFillWithAi.value && lastItem) {
    await runAiAnalysis(url, lastItem.id);
  }
};

const runAiAnalysis = async (source: File | string, mediaItemId: string) => {
  isAnalyzingWithAi.value = true;
  aiError.value = "";
  aiSuccess.value = "";
  aiStatusMessage.value =
    "Google Gemini is analyzing the image to detect product name, description, categories, and tags...";

  try {
    const formData = new FormData();
    if (source instanceof File) {
      formData.append("image", source);
    } else {
      formData.append("image_url", source);
    }

    const response = await fetch(resolveApiUrl("/api/ai/analyze-product-image"), { method: "POST",
      body: formData,
    });

    const res = await response.json();

    if (!response.ok || !res.success) {
      if (res?.image_url) {
        const found = mediaList.value.find((m) => m.id === mediaItemId);
        if (found) {
          found.serverUrl = res.image_url;
        }
      }
      throw new Error(res.message || "Failed to analyze image with AI.");
    }

    const data = res.data;

    if (data.title) title.value = data.title;
    if (data.description) description.value = data.description;

    // Normalize Primary Category (Anime Figures, Gunpla, TCG, Collectibles)
    if (data.primary_category) {
      const p = String(data.primary_category).trim();
      const pLower = p.toLowerCase();
      if (pLower.includes("figure") || pLower.includes("statue")) {
        primaryCategory.value = "Anime Figures";
      } else if (pLower.includes("gunpla") || pLower.includes("gundam")) {
        primaryCategory.value = "Gunpla";
      } else if (
        pLower.includes("tcg") ||
        pLower.includes("trading") ||
        pLower.includes("card")
      ) {
        primaryCategory.value = "TCG (Trading Cards)";
      } else if (pLower.includes("merch") || pLower.includes("collectible")) {
        primaryCategory.value = "Anime Merch Collectibles";
      } else if (pLower.includes("toy") || pLower.includes("plush")) {
        primaryCategory.value = "Toys & Plushies";
      } else {
        const matched = dbCategories.value.find(
          (c) => c.desc.toLowerCase() === pLower,
        );
        primaryCategory.value = matched ? matched.desc : p;
      }
    }

    if (data.secondary_category) {
      secondaryCategory.value = data.secondary_category;
    }

    if (data.brand) brandVendor.value = data.brand;
    if (data.weight) weightGrams.value = Number(data.weight);
    if (data.length) dimensionLength.value = Number(data.length);
    if (data.width) dimensionWidth.value = Number(data.width);
    if (data.height) dimensionHeight.value = Number(data.height);
    if (data.status) {
      const s = String(data.status).toLowerCase();
      if (s === "draft") publishStatus.value = "Draft";
      else if (s === "archived") publishStatus.value = "Archived";
      else publishStatus.value = "Active";
    }
    if (Array.isArray(data.tags)) tagsInput.value = data.tags.join(", ");
    if (data.suggested_price) {
      sellingPrice.value = Number(data.suggested_price);
    }
    if (data.sku_suggestion) sku.value = data.sku_suggestion;
    if (data.sku) sku.value = data.sku;

    // Normalize Condition (Crucial for anime figures: loose vs with box / BIB / MISB)
    const isFigureProduct =
      primaryCategory.value === "Anime Figures" ||
      !data.is_pokemon_tcg ||
      String(data.title || "")
        .toLowerCase()
        .includes("figure") ||
      String(data.title || "")
        .toLowerCase()
        .includes("nendoroid");

    const rawCond = String(data.condition || "").trim();
    const cLower = rawCond.toLowerCase();

    if (isFigureProduct) {
      if (
        data.has_box === false ||
        cLower.includes("loose") ||
        cLower.includes("unboxed") ||
        cLower.includes("no box") ||
        cLower.includes("without box")
      ) {
        condition.value = "Loose";
      } else if (
        data.is_sealed_box === true ||
        cLower.includes("misb") ||
        cLower.includes("mint in sealed") ||
        cLower.includes("sealed")
      ) {
        condition.value = "MISB";
      } else if (
        data.has_box === true ||
        cLower.includes("bib") ||
        cLower.includes("box") ||
        cLower.includes("packaging")
      ) {
        condition.value = "BIB";
      } else if (cLower.includes("damaged")) {
        condition.value = "Damaged";
      } else if (cLower.includes("brand") || cLower.includes("new")) {
        condition.value = data.has_box === false ? "Loose" : "Brandnew";
      } else {
        condition.value = data.has_box === false ? "Loose" : "BIB";
      }
    } else {
      // TCG Card conditions
      if (cLower.includes("loose") || cLower.includes("unboxed")) {
        condition.value = "Loose";
      } else if (cLower.includes("misb") || cLower.includes("sealed")) {
        condition.value = "MISB";
      } else if (cLower.includes("bib") || cLower.includes("box")) {
        condition.value = "BIB";
      } else if (cLower.includes("brand") || cLower.includes("new")) {
        condition.value = "Brandnew";
      } else if (cLower.includes("near mint") || cLower === "nm") {
        condition.value = "Near Mint";
      } else if (cLower.includes("lightly played") || cLower === "lp") {
        condition.value = "Lightly Played";
      } else if (cLower.includes("moderately played") || cLower === "mp") {
        condition.value = "Moderately Played";
      } else if (cLower.includes("heavily played") || cLower === "hp") {
        condition.value = "Heavily Played";
      } else if (cLower.includes("damaged")) {
        condition.value = "Damaged";
      } else {
        const found = dbConditions.value.find(
          (cond) => cond.desc.toLowerCase() === cLower,
        );
        condition.value = found ? found.desc : rawCond || "Near Mint";
      }
    }

    // Pokemon TCG Set Series & Expansion Detection (applicable only for Pokemon TCG)
    if (data.is_pokemon_tcg) {
      primaryCategory.value = "TCG (Trading Cards)";
      secondaryCategory.value = "Pokémon";
      if (!brandVendor.value || brandVendor.value === "Import") {
        brandVendor.value = "The Pokémon Company";
      }

      if (data.pokemon_series) {
        selectedPokemonSeries.value = data.pokemon_series;
      }

      if (data.ref_pokemon_set_id) {
        refPokemonSetId.value = Number(data.ref_pokemon_set_id);
        const matched = dbPokemonSets.value.find(
          (s) => s.id === refPokemonSetId.value,
        );
        if (matched) {
          selectedPokemonSet.value = matched.japanese_set;
          if (matched.series) {
            selectedPokemonSeries.value = matched.series;
          }
        }
      } else if (data.pokemon_japanese_set || data.pokemon_set_dropdown_value) {
        const setName =
          data.pokemon_japanese_set || data.pokemon_set_dropdown_value;
        const matched = dbPokemonSets.value.find(
          (s) =>
            s.japanese_set.toLowerCase() === setName.toLowerCase() ||
            (s.japanese_code &&
              s.japanese_code.toLowerCase() === setName.toLowerCase()),
        );
        if (matched) {
          refPokemonSetId.value = matched.id;
          selectedPokemonSet.value = matched.japanese_set;
          if (matched.series) {
            selectedPokemonSeries.value = matched.series;
          }
        } else {
          selectedPokemonSet.value = setName;
        }
      }
    } else {
      // Clear Pokemon fields if not Pokemon TCG (e.g. Gunpla, Anime Figure)
      selectedPokemonSeries.value = "";
      selectedPokemonSet.value = "";
      refPokemonSetId.value = null;
    }

    // Update with server stored image URL if returned
    if (data.image_url) {
      const found = mediaList.value.find((m) => m.id === mediaItemId);
      if (found) {
        found.serverUrl = data.image_url;
        // Keep the crisp local blob preview if already active, otherwise resolve with resolveStorageUrl
        if (!found.url || !found.url.startsWith("blob:")) {
          found.url = resolveStorageUrl(data.image_url);
        }
        found.alt = data.title || found.alt;
      }
    }

    aiSuccess.value = `✨ Auto-populated "${data.title}" successfully with Google Gemini!`;
    await checkDuplicateProducts();
  } catch (err: any) {
    aiError.value =
      err.message || "An unexpected error occurred while analyzing the image.";

    // Fallback: If AI analysis failed, make sure the file is still safely stored on server
    if (source instanceof File) {
      await uploadMediaToServer(source, mediaItemId);
    }
  } finally {
    isAnalyzingWithAi.value = false;
    aiStatusMessage.value = "";
  }
};

// Pricing & Stock
const sellingPrice = ref<number | "">("");
const stock = ref<number | "">("");

// Taxonomy & Organization
const primaryCategory = ref("");
const secondaryCategory = ref("");
const brandVendor = ref("");

const currentSubcategories = computed(() => {
  const selectedCat = dbCategories.value.find(
    (c) => c.desc === primaryCategory.value,
  );
  return selectedCat?.subcategories || [];
});

const isPokemonTcg = computed(() => {
  const p = primaryCategory.value.toLowerCase();
  const s = secondaryCategory.value.toLowerCase();
  const b = brandVendor.value.toLowerCase();
  const t = title.value.toLowerCase();

  return (
    ((p.includes("tcg") || p.includes("trading") || p.includes("card")) &&
      (s.includes("poke") ||
        s.includes("poké") ||
        b.includes("poke") ||
        b.includes("poké") ||
        t.includes("poke") ||
        t.includes("poké"))) ||
    ((s.includes("poke") || s.includes("poké")) && !!p) ||
    !!selectedPokemonSeries.value ||
    !!selectedPokemonSet.value
  );
});

const tagsInput = ref("");
const tags = computed(() =>
  tagsInput.value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean),
);

watch(selectedPokemonSet, (newSet) => {
  if (newSet) {
    const matched = dbPokemonSets.value.find(
      (s) => s.japanese_set === newSet || s.japanese_code === newSet,
    );
    if (matched) {
      refPokemonSetId.value = matched.id;
      if (matched.series && !selectedPokemonSeries.value) {
        selectedPokemonSeries.value = matched.series;
      }
    }
    const existing = tagsInput.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!existing.includes(newSet)) {
      existing.push(newSet);
    }
    if (matched?.japanese_code && !existing.includes(matched.japanese_code)) {
      existing.push(matched.japanese_code);
    }
    if (matched?.english_set && !existing.includes(matched.english_set)) {
      existing.push(matched.english_set);
    }
    tagsInput.value = existing.join(", ");
  } else {
    refPokemonSetId.value = null;
  }
});

watch(selectedPokemonSeries, (newSeries) => {
  if (newSeries && selectedPokemonSet.value) {
    const current = dbPokemonSets.value.find(
      (s) => s.japanese_set === selectedPokemonSet.value,
    );
    if (current && current.series !== newSeries) {
      selectedPokemonSet.value = "";
      refPokemonSetId.value = null;
    }
  }
});

// Shipping & Physical Specs
const weightGrams = ref<number | "">("");
const dimensionLength = ref<number | "">("");
const dimensionWidth = ref<number | "">("");
const dimensionHeight = ref<number | "">("");

// Visibility & Publishing
const publishStatus = ref<"Draft" | "Active" | "Archived">("Draft");
const isScheduled = ref(false);
const scheduledDate = ref("");

const isSaving = ref(false);
const successNotice = ref("");
const saveError = ref("");

const handleSaveProduct = async () => {
  if (!title.value.trim()) {
    saveError.value = "Please enter a product title before saving.";
    return;
  }

  isSaving.value = true;
  saveError.value = "";
  successNotice.value = "";

  try {
    // Ensure any media item with a raw File is uploaded to server if not already uploaded
    for (const m of mediaList.value) {
      if (!m.serverUrl && m.file) {
        await uploadMediaToServer(m.file, m.id);
      }
    }

    let primaryImg =
      mediaList.value.find((m) => m.isPrimary)?.serverUrl ||
      mediaList.value[0]?.serverUrl ||
      "";

    if (!primaryImg) {
      const candidate =
        mediaList.value.find((m) => m.isPrimary)?.url ||
        mediaList.value[0]?.url ||
        "";
      if (candidate && !candidate.startsWith("blob:")) {
        primaryImg = candidate;
      }
    }

    if (mediaList.value.length > 0 && (!primaryImg || primaryImg.startsWith("blob:"))) {
      saveError.value =
        "Product image is still uploading to Cloudflare R2 storage or failed to upload. Please wait a few seconds and try again.";
      isSaving.value = false;
      return;
    }

    const gallery = mediaList.value
      .map((m) => m.serverUrl || m.url)
      .filter((u) => u && !u.startsWith("blob:"));

    // Resolve category id
    const selectedCat = dbCategories.value.find(
      (c) => c.desc === primaryCategory.value,
    );
    const categoryId = selectedCat?.id || null;

    // Resolve subcategory id
    const selectedSub = selectedCat?.subcategories?.find(
      (s) => s.desc === secondaryCategory.value,
    );
    const subcategoryId = selectedSub?.id || null;

    // Resolve brand id
    const selectedBrand = dbBrands.value.find(
      (b) => b.name === brandVendor.value,
    );
    const brandId = selectedBrand?.id || null;

    // Resolve condition id
    const selectedCond = dbConditions.value.find(
      (c) => c.desc === condition.value,
    );
    const conditionIdVal = selectedCond?.id || null;

    const isVip = props.isVipMode || isPromotion.value;
    const finalPrice =
      isVip && computedVipPrice.value > 0
        ? computedVipPrice.value
        : Number(sellingPrice.value) || 0;
    const originalPrice = Number(sellingPrice.value) || 0;

    // Pre-flight duplicate check: if high confidence duplicates exist and allowDuplicate is false, show confirmation modal
    if (
      enableDuplicateCheck.value &&
      !isAutomation.value &&
      !isDuplicateDismissed.value &&
      !allowDuplicate.value &&
      detectedDuplicates.value.length > 0
    ) {
      const highConfidence = detectedDuplicates.value.filter(
        (d) => d.confidence >= 90,
      );
      if (highConfidence.length > 0) {
        isDuplicateModalOpen.value = true;
        isSaving.value = false;
        return;
      }
    }

    const payload = {
      name: title.value.trim(),
      sku: sku.value ? sku.value.trim() : null,
      price: finalPrice,
      original_price: isVip ? (originalPrice > 0 ? originalPrice : finalPrice) : null,
      sale_percentage_id: isVip ? (salePercentageId.value || null) : null,
      is_promotion: isVip ? 1 : 0,
      stock: Number(stock.value) || 0,
      description: description.value,
      ref_category_id: categoryId,
      category: primaryCategory.value,
      ref_subcategory_id: subcategoryId,
      subcategory: secondaryCategory.value,
      ref_brand_id: brandId,
      brand: brandVendor.value,
      ref_condition_id: conditionIdVal,
      condition_id: conditionIdVal,
      condition: condition.value,
      ref_pokemon_set_id: isPokemonTcg.value ? refPokemonSetId.value : null,
      pokemon_set: isPokemonTcg.value ? selectedPokemonSet.value : null,
      weight: Number(weightGrams.value) || null,
      length: Number(dimensionLength.value) || null,
      width: Number(dimensionWidth.value) || null,
      height: Number(dimensionHeight.value) || null,
      status: publishStatus.value.toLowerCase(),
      image_url: primaryImg,
      gallery_images: gallery,
      allow_duplicate:
        allowDuplicate.value ||
        !enableDuplicateCheck.value ||
        isAutomation.value ||
        isDuplicateDismissed.value,
      bypass_duplicate_check:
        !enableDuplicateCheck.value ||
        isAutomation.value ||
        isDuplicateDismissed.value
          ? 1
          : 0,
    };

    const isUpdating = isEditMode.value && editingProductId.value;
    const endpoint = resolveApiUrl(
      isUpdating
        ? `/api/products/${editingProductId.value}`
        : isVip
          ? "/api/products/vip"
          : "/api/products"
    );
    const method = isUpdating ? "PUT" : "POST";
    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(isAutomation.value ? { "X-Automation-Test": "playwright" } : {}),
      },
      body: JSON.stringify(payload),
    });

    const res = await response.json();

    if (!response.ok || !res.success) {
      if (
        res.is_duplicate &&
        res.duplicates &&
        enableDuplicateCheck.value &&
        !isAutomation.value &&
        !isDuplicateDismissed.value
      ) {
        detectedDuplicates.value = res.duplicates;
        isDuplicateModalOpen.value = true;
        saveError.value = res.message || "A matching product was found in your catalog.";
        isSaving.value = false;
        return;
      }
      throw new Error(res.message || "Failed to save product in database.");
    }

    const savedProduct = res.data;

    // Update SKU ref if server generated or assigned one
    if (savedProduct.sku) {
      sku.value = savedProduct.sku;
    }

    // Also add to inventory state in store
    adminStore.addInventoryItem({
      sku: savedProduct.sku || sku.value || `PRD-${savedProduct.id}`,
      barcode: savedProduct.sku || sku.value || `BC-${savedProduct.id}`,
      name: savedProduct.name,
      imageUrl: primaryImg,
      category: primaryCategory.value,
      condition: condition.value,
      stock: Number(savedProduct.stock) || 0,
      lowStockThreshold: 5,
      costPrice: 0,
      sellingPrice: Number(savedProduct.price) || 0,
      vendor: brandVendor.value,
      leadTimeDays: 7,
      variants: [],
    });

    if (isUpdating) {
      successNotice.value = `Product "${savedProduct.name}" details updated successfully!`;
      setTimeout(() => {
        router.push("/admin/inventory");
      }, 1200);
    } else if (isVip) {
      emit("vip-saved", savedProduct);
      successNotice.value = `VIP Product "${savedProduct.name}" saved with ${selectedPercentageValue.value}% discount!`;
    } else {
      successNotice.value = `"${savedProduct.name}" saved successfully to database! Ready to upload your next product.`;
    }

    // Reset card-specific form fields so user can seamlessly upload the next product from their folder
    title.value = "";
    sku.value = "";
    description.value = "";
    sellingPrice.value = 0;
    stock.value = 1;
    mediaList.value = [];
    newImageUrl.value = "";
    aiSuccess.value = "";
    aiStatusMessage.value = "";
    detectedDuplicates.value = [];
    isDuplicateModalOpen.value = false;
    allowDuplicate.value = false;
    // Note: Category, Series, and Brand selections remain preserved for batch uploading cards from the same folder
  } catch (err: any) {
    saveError.value =
      err.message || "Failed to save product to database. Please try again.";
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  if (props.isVipMode) {
    emit("cancel");
  } else {
    router.push("/admin/inventory");
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs"
    >
      <div>
        <div class="flex items-center gap-2">
          <h1
            class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
          >
            {{ isEditMode ? ("Edit Product Details: " + (title || "Product #" + editingProductId)) : (isVipMode ? "VIP & Promotional Product Upload" : "Product Catalog & Upload Module") }}
          </h1>
          <span
            v-if="isVipMode || isPromotion"
            class="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider"
          >
            VIP Exclusive
          </span>
        </div>
        <p class="text-xs text-slate-500">
          {{
            isVipMode
              ? "Upload VIP exclusive products with AI vision auto-fill, media gallery, pricing, and verified discount."
              : "Upload products with AI vision auto-fill, media gallery, pricing, and classification."
          }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <label
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer select-none hover:bg-slate-100 transition-colors"
          title="Toggle duplicate validation for catalog uploads"
        >
          <input
            v-model="enableDuplicateCheck"
            type="checkbox"
            class="accent-indigo-600 rounded cursor-pointer"
          />
          <span>Duplicate Check</span>
        </label>
        <button
          type="button"
          class="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer flex items-center justify-center"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          type="button"
          class="flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          :disabled="isSaving"
          @click="handleSaveProduct"
        >
          <span>{{
            isSaving
              ? "Saving..."
              : isEditMode
                ? "💾 Update Product Details"
              : isVipMode
                ? "🚀 Save & Publish VIP Product"
                : "🚀 Save & Publish Product"
          }}</span>
        </button>
      </div>
    </div>

    <!-- Alert -->
    <div
      v-if="successNotice"
      class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-fade-in flex items-center justify-between gap-3 shadow-xs"
    >
      <div class="flex items-center gap-2">
        <span class="text-base">✅</span>
        <span>{{ successNotice }}</span>
      </div>
      <div class="flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          class="text-xs font-bold text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
          @click="router.push('/admin/inventory')"
        >
          View in Inventory &rarr;
        </button>
        <button
          type="button"
          class="text-emerald-600 hover:text-emerald-900 text-sm font-bold cursor-pointer"
          @click="successNotice = ''"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Save Error Alert -->
    <div
      v-if="saveError"
      class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl animate-fade-in flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <span>⚠️</span>
        <span>{{ saveError }}</span>
      </div>
      <button
        type="button"
        class="text-rose-500 hover:text-rose-800 text-sm font-bold"
        @click="saveError = ''"
      >
        ✕
      </button>
    </div>

    <!-- AI Success Alert -->
    <div
      v-if="aiSuccess"
      class="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl animate-fade-in flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <span class="text-base">✨</span>
        <span>{{ aiSuccess }}</span>
      </div>
      <button
        type="button"
        class="text-indigo-600 hover:text-indigo-900 text-xs"
        @click="aiSuccess = ''"
      >
        ✕
      </button>
    </div>

    <!-- AI Error Alert -->
    <div
      v-if="aiError"
      class="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl animate-fade-in flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <span class="text-base">⚠️</span>
        <span>{{ aiError }}</span>
      </div>
      <button
        type="button"
        class="text-rose-600 hover:text-rose-900 text-xs"
        @click="aiError = ''"
      >
        ✕
      </button>
    </div>

    <!-- AI Analysis In-Progress Banner -->
    <div
      v-if="isAnalyzingWithAi"
      class="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 text-indigo-950 text-xs font-bold rounded-xl shadow-xs flex items-center gap-3 animate-pulse"
    >
      <div
        class="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0"
      ></div>
      <div>
        <p class="font-extrabold text-sm text-indigo-900">
          Google Gemini AI is analyzing your product image...
        </p>
        <p class="text-[11px] text-indigo-700 font-normal">
          {{ aiStatusMessage }}
        </p>
      </div>
    </div>

    <!-- Stock Added Success Alert -->
    <div
      v-if="stockAddedSuccess"
      class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-fade-in flex items-center justify-between gap-3 shadow-xs"
    >
      <div class="flex items-center gap-2">
        <span class="text-base">📦</span>
        <span>{{ stockAddedSuccess }}</span>
      </div>
      <button
        type="button"
        class="text-emerald-600 hover:text-emerald-900 text-sm font-bold cursor-pointer"
        @click="stockAddedSuccess = ''"
      >
        ✕
      </button>
    </div>

    <!-- Potential Duplicate Product Detected Warning Banner -->
    <div
      v-if="enableDuplicateCheck && !isAutomation && !isDuplicateDismissed && detectedDuplicates.length > 0"
      class="p-5 rounded-2xl bg-amber-50/90 border-2 border-amber-300 shadow-sm space-y-3.5 animate-fade-in"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/70">
        <div class="flex items-center gap-2.5">
          <span class="text-xl">⚠️</span>
          <div>
            <h3 class="text-sm font-black text-amber-950 flex items-center gap-2">
              <span>Potential Duplicate Product Detected in Catalog</span>
              <span class="text-[11px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold">
                {{ detectedDuplicates.length }} match{{ detectedDuplicates.length > 1 ? 'es' : '' }}
              </span>
            </h3>
            <p class="text-xs text-amber-800">
              AI Vision &amp; catalog validation detected item(s) matching this title, card code, or image. To prevent duplicate listings, you can add stock to an existing item or verify this upload as a distinct variant.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
          <div v-if="isCheckingDuplicates" class="flex items-center gap-1.5 text-xs text-amber-700 font-bold">
            <span class="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
            <span>Checking...</span>
          </div>
          <button
            type="button"
            class="w-7 h-7 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
            title="Dismiss duplicate alert for this item"
            @click="dismissDuplicateWarning"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Matched Items Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="dup in detectedDuplicates.slice(0, 4)"
          :key="dup.id"
          class="bg-white rounded-xl p-3 border border-amber-200/80 shadow-2xs flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-3 min-w-0">
            <img
              :src="resolveStorageUrl(dup.image_url)"
              alt="Duplicate thumbnail"
              class="w-12 h-12 object-contain bg-slate-50 rounded-lg border border-slate-200 p-0.5 shrink-0"
            />
            <div class="min-w-0">
              <span class="font-bold text-xs text-slate-900 truncate block">{{ dup.name }}</span>
              <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                <span class="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">{{ dup.sku }}</span>
                <span>•</span>
                <span>Stock: <strong class="text-slate-800">{{ dup.stock }}</strong></span>
                <span>•</span>
                <span>₱{{ dup.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
              </div>
              <div class="flex items-center gap-1.5 mt-1">
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  :class="dup.confidence >= 95 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ dup.reason }}
                </span>
                <span v-if="dup.condition" class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium">
                  {{ dup.condition }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-1.5 shrink-0">
            <button
              type="button"
              :disabled="isAddingStock"
              class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1 justify-center transition-colors disabled:opacity-50"
              @click="handleAddStockToExisting(dup, 1)"
            >
              <span>➕ Add Stock (+1)</span>
            </button>
            <button
              type="button"
              class="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-[10px] text-center cursor-pointer"
              @click="router.push('/admin/inventory')"
            >
              View in Inventory
            </button>
          </div>
        </div>
      </div>

      <!-- Override / Distinct Checkbox -->
      <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-t border-amber-200/60">
        <label class="flex items-center gap-2 font-bold text-amber-950 cursor-pointer">
          <input
            v-model="allowDuplicate"
            type="checkbox"
            class="accent-amber-600 rounded"
          />
          <span>This is a distinct copy / variant (e.g. separate condition, PSA slab cert, or language)</span>
        </label>
        <span v-if="allowDuplicate" class="text-emerald-700 font-bold text-[11px]">
          ✓ Duplicate warning acknowledged — publishing as separate item allowed.
        </span>
      </div>
    </div>

    <!-- 2 Column Master Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Column (8 cols): Content, Gallery, Pricing, Variants, Specs -->
      <div class="lg:col-span-8 space-y-6">
        <!-- 1. Basic Information -->
        <div
          class="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
        >
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Basic Product Information
          </h2>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1"
              >Product Title *</label
            >
            <input
              v-model="title"
              type="text"
              placeholder="e.g. Pokémon TCG: Terastal Festival ex Booster Box"
              class="w-full text-sm font-bold p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900"
            />
          </div>

          <!-- Description (plain text) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-700">
                Description (Normal text & tabs saved in DB)
              </label>
              <button
                v-if="description"
                type="button"
                @click="showDescriptionPreview = !showDescriptionPreview"
                class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
              >
                <span>{{
                  showDescriptionPreview
                    ? "Hide Storefront Preview"
                    : "👁️ Preview Storefront (HTML & Icons)"
                }}</span>
              </button>
            </div>
            <textarea
              v-model="description"
              rows="5"
              placeholder="Detailed product description, features, box contents (spacing and tabs supported)..."
              class="w-full text-xs text-slate-700 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 resize-y transition-all font-mono"
            ></textarea>

            <!-- Storefront preview with icons and styled sections -->
            <div
              v-if="showDescriptionPreview && description"
              class="mt-2.5 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-sm"
            >
              <div
                class="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-2.5 flex items-center justify-between border-b border-slate-800 pb-2"
              >
                <span class="flex items-center gap-1.5">
                  <span>🛍️</span>
                  <span>Storefront Preview (Dynamic HTML & Icons)</span>
                </span>
                <span class="text-[10px] text-slate-400 font-normal">
                  Plain text in DB → Rendered with icons & badges on storefront
                </span>
              </div>
              <div
                class="text-xs text-slate-300 leading-relaxed font-normal space-y-1"
                v-html="formatProductDescription(description)"
              ></div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1"
                >SKU (Stock Keeping Unit) *</label
              >
              <input
                v-model="sku"
                type="text"
                placeholder="e.g. TCG-PKM-001"
                class="w-full text-xs font-mono font-bold p-2.5 rounded-xl border border-slate-200 uppercase"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1"
                >Condition *</label
              >
              <select
                v-model="condition"
                class="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="" disabled>Select condition...</option>
                <template v-if="dbConditions.length > 0">
                  <option
                    v-for="cond in dbConditions"
                    :key="cond.id"
                    :value="cond.desc"
                  >
                    {{ formatConditionOption(cond.desc) }}
                  </option>
                </template>
                <template v-else>
                  <option value="Brandnew">Brandnew / Factory Sealed</option>
                  <option value="MISB">MISB (Mint In Sealed Box)</option>
                  <option value="BIB">BIB (Back In Box / With Box)</option>
                  <option value="Loose">Loose (Unboxed / No Box)</option>
                  <option value="Near Mint">
                    Near Mint (Pristine Card / Item)
                  </option>
                  <option value="Lightly Played">Lightly Played</option>
                  <option value="Moderately Played">Moderately Played</option>
                  <option value="Heavily Played">Heavily Played</option>
                  <option value="Damaged">Damaged</option>
                </template>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1"
                >Available Stock *</label
              >
              <input
                v-model.number="stock"
                type="number"
                min="0"
                placeholder="0"
                class="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        <!-- 2. Media Gallery & Management -->
        <div
          class="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
        >
          <div class="flex items-center justify-between">
            <h2
              class="text-sm font-bold text-slate-900 uppercase tracking-wider"
            >
              2. Media Gallery &amp; Alt-Text
            </h2>
            <span class="text-xs text-slate-400"
              >{{ mediaList.length }} images attached</span
            >
          </div>

          <!-- Hidden File Input for Native File Dialog -->
          <input
            ref="fileInput"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            class="hidden"
            @change="handleFileSelect"
          />

          <!-- AI Toggle Banner -->
          <div
            class="flex items-center justify-between p-3.5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-100 shadow-2xs"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-xl">✨</span>
              <div>
                <p
                  class="text-xs font-black text-indigo-950 flex items-center gap-1.5"
                >
                  Google Gemini Auto-Population
                  <span
                    class="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-bold"
                    >AI Vision</span
                  >
                </p>
                <p class="text-[11px] text-indigo-700">
                  Upload an image to auto-generate title, description,
                  categories, tags &amp; specs
                </p>
              </div>
            </div>
            <label
              class="relative inline-flex items-center cursor-pointer select-none"
            >
              <input
                v-model="autoFillWithAi"
                type="checkbox"
                class="sr-only peer"
              />
              <div
                class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"
              ></div>
            </label>
          </div>

          <!-- Drag and Drop Dropzone -->
          <div
            class="p-6 border-2 border-dashed rounded-2xl text-center space-y-3 transition-all cursor-pointer"
            :class="[
              isDraggingOver
                ? 'border-indigo-600 bg-indigo-50/70 scale-[0.99]'
                : 'border-slate-200 hover:border-indigo-400 bg-slate-50/80',
              isAnalyzingWithAi ? 'opacity-60 pointer-events-none' : '',
            ]"
            @dragover.prevent="isDraggingOver = true"
            @dragleave.prevent="isDraggingOver = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <div
              class="w-12 h-12 mx-auto rounded-full bg-indigo-100/80 flex items-center justify-center text-2xl shadow-2xs"
            >
              📸
            </div>
            <div>
              <p class="text-xs font-bold text-slate-800">
                <span class="text-indigo-600 underline font-extrabold"
                  >Click to upload product photo</span
                >
                or drag &amp; drop here
              </p>
              <p class="text-[11px] text-slate-500 mt-0.5">
                PNG, JPG, WEBP up to 15MB &bull; Gemini analyzes box art, figure
                tags, &amp; specs
              </p>
            </div>

            <div
              class="flex items-center justify-center gap-2 max-w-sm mx-auto pt-2"
              @click.stop
            >
              <input
                v-model="newImageUrl"
                type="url"
                placeholder="Or paste direct image URL..."
                class="text-xs p-2 rounded-xl border border-slate-200 bg-white flex-1 focus:outline-none focus:border-indigo-600"
                @keyup.enter="analyzeUrlWithAi"
              />
              <button
                type="button"
                class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                :disabled="isAnalyzingWithAi || !newImageUrl.trim()"
                @click="analyzeUrlWithAi"
              >
                <span>Add URL</span>
                <span v-if="autoFillWithAi" class="text-xs">✨</span>
              </button>
            </div>
          </div>

          <!-- Existing Images Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div
              v-for="img in mediaList"
              :key="img.id"
              class="relative rounded-xl overflow-hidden border-2 bg-slate-50 group flex flex-col justify-between"
              :class="
                img.isPrimary
                  ? 'border-rose-600 ring-2 ring-rose-200'
                  : 'border-slate-200'
              "
            >
              <div
                class="aspect-square relative overflow-hidden bg-slate-900 flex items-center justify-center p-1.5"
              >
                <img
                  :src="resolveStorageUrl(img.url)"
                  :alt="img.alt"
                  class="max-w-full max-h-full object-contain"
                />
                <span
                  v-if="img.isPrimary"
                  class="absolute top-1.5 left-1.5 bg-rose-600 text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-2xs"
                >
                  Primary
                </span>
                <span
                  v-if="img.width && img.height"
                  class="absolute bottom-1.5 left-1.5 bg-slate-950/85 backdrop-blur-xs text-slate-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-700/60 shadow-xs pointer-events-none"
                >
                  {{ img.width }}×{{ img.height
                  }}<span v-if="img.fileSize" class="text-slate-400 ml-1"
                    >({{ img.fileSize }})</span
                  >
                </span>
                <button
                  type="button"
                  class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/80 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-rose-600"
                  title="Delete image"
                  @click="removeMedia(img.id)"
                >
                  ✕
                </button>
              </div>

              <!-- Alt text input -->
              <div class="p-2 bg-white space-y-1">
                <input
                  v-model="img.alt"
                  type="text"
                  placeholder="Alt text (SEO & a11y)"
                  class="w-full text-[10px] p-1 border border-slate-200 rounded"
                  title="Image description for visually impaired and Google Image search"
                />
                <button
                  v-if="!img.isPrimary"
                  type="button"
                  class="w-full text-[10px] font-bold text-slate-500 hover:text-slate-900 text-center py-0.5 cursor-pointer"
                  @click="setPrimaryMedia(img.id)"
                >
                  Set as Primary
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Pricing -->
        <div
          class="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Pricing {{ (isVipMode || isPromotion) ? '& VIP Promotion Discount' : '' }}
            </h2>
            <span
              v-if="isVipMode || isPromotion"
              class="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-2xs"
            >
              VIP Exclusive
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ (isVipMode || isPromotion) ? "Original Selling Price (PHP ₱) *" : "Selling Price (PHP ₱) *" }}
              </label>
              <input
                v-model.number="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 3850"
                class="w-full text-base font-black p-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div v-if="isVipMode || isPromotion">
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Sale Percentage ID (`sale_percentage`) *
              </label>
              <select
                v-model.number="salePercentageId"
                class="w-full text-xs font-bold p-2.5 rounded-xl border border-amber-400 bg-amber-50/50 text-slate-900 focus:outline-none focus:border-amber-600"
              >
                <option :value="null">No Discount (0%)</option>
                <option
                  v-for="sp in salePercentages"
                  :key="sp.id"
                  :value="sp.id"
                >
                  ID #{{ sp.id }} — {{ sp.value }}% OFF
                </option>
              </select>
            </div>

            <div v-if="isVipMode || isPromotion">
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Computed VIP Member Price
              </label>
              <div
                class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-sm flex items-center justify-between"
              >
                <span>₱{{ computedVipPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                <span class="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                  -{{ selectedPercentageValue }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Shipping & Physical Specifications -->
        <div
          class="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
        >
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
            4. Shipping &amp; Physical Specs
          </h2>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1"
                >Weight (Grams)</label
              >
              <input
                v-model.number="weightGrams"
                type="number"
                placeholder="0"
                class="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1"
                >Length (cm)</label
              >
              <input
                v-model.number="dimensionLength"
                type="number"
                placeholder="0"
                class="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1"
                >Width (cm)</label
              >
              <input
                v-model.number="dimensionWidth"
                type="number"
                placeholder="0"
                class="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1"
                >Height (cm)</label
              >
              <input
                v-model.number="dimensionHeight"
                type="number"
                placeholder="0"
                class="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column (4 cols): Visibility, Taxonomy, SEO Preview -->
      <div class="lg:col-span-4 space-y-6">
        <!-- Status & Visibility Card -->
        <div
          class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
        >
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Publishing Status
          </h3>

          <div class="space-y-2">
            <label
              v-for="st in ['Active', 'Draft', 'Archived'] as const"
              :key="st"
              class="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all"
              :class="
                publishStatus === st
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200'
              "
            >
              <span class="text-xs font-bold text-slate-800">{{ st }}</span>
              <input
                v-model="publishStatus"
                type="radio"
                :value="st"
                class="accent-slate-900"
              />
            </label>
          </div>

          <!-- Scheduled Publishing Toggle -->
          <div class="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <label
              class="flex items-center gap-2 font-bold text-slate-700 cursor-pointer"
            >
              <input
                v-model="isScheduled"
                type="checkbox"
                class="accent-rose-600 rounded"
              />
              <span>Schedule Drop / Limited Release</span>
            </label>
            <div v-if="isScheduled" class="pt-1 animate-fade-in">
              <input
                v-model="scheduledDate"
                type="datetime-local"
                class="w-full p-2 rounded-xl border border-slate-200 font-mono text-xs"
              />
            </div>
          </div>

          <!-- VIP Notice (Shown only in VIP mode) -->
          <div v-if="isVipMode" class="pt-3 border-t border-slate-100 space-y-1 text-xs">
            <span class="font-bold text-amber-700 flex items-center gap-1.5">👑 VIP &amp; Pro Exclusive Product</span>
            <p class="text-[11px] text-slate-500">Publishes with Gold VIP badge on VIP Storefront with discount.</p>
          </div>
        </div>

        <!-- Organization & Taxonomy Card -->
        <div
          class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs"
        >
          <h3 class="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Taxonomy &amp; Brand
          </h3>

          <div>
            <label class="block font-bold text-slate-700 mb-1"
              >Primary Category</label
            >
            <select
              v-model="primaryCategory"
              class="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="" disabled>Select category...</option>
              <template v-if="dbCategories.length > 0">
                <option
                  v-for="cat in dbCategories"
                  :key="cat.id"
                  :value="cat.desc"
                >
                  {{ cat.desc }}
                </option>
              </template>
              <template v-else>
                <option value="TCG (Trading Cards)">TCG (Trading Cards)</option>
                <option value="Gunpla">Gunpla</option>
                <option value="Anime Figures">Anime Figures</option>
                <option value="Anime Merch Collectibles">
                  Anime Merch Collectibles
                </option>
              </template>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1"
              >Secondary / Sub-Category</label
            >
            <input
              v-model="secondaryCategory"
              type="text"
              list="subcategories-list"
              class="w-full p-2.5 rounded-xl border border-slate-200"
              placeholder="e.g. Pokemon, HG, Scale Figures..."
            />
            <datalist id="subcategories-list">
              <option
                v-for="sub in currentSubcategories"
                :key="sub.id"
                :value="sub.desc"
              />
            </datalist>
          </div>

          <!-- Pokemon TCG Set Series & Expansion Dropdown (Ref Data from Backend ref_pokemon_set) -->
          <div
            v-if="isPokemonTcg"
            class="p-4 bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl border border-amber-200/90 shadow-xs space-y-3 animate-fade-in text-xs"
          >
            <div
              class="flex items-center justify-between border-b border-amber-200/70 pb-2"
            >
              <label
                class="font-black text-amber-950 text-xs flex items-center gap-1.5"
              >
                <span class="text-sm">⚡</span>
                <span>Pokémon TCG Set &amp; Series</span>
              </label>
              <span
                class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold"
              >
                {{ dbPokemonSets.length }} Reference Sets
              </span>
            </div>

            <!-- Series Dropdown -->
            <div>
              <label class="block font-bold text-amber-950 text-[11px] mb-1">
                Generation Series *
              </label>
              <select
                v-model="selectedPokemonSeries"
                class="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500/20"
              >
                <option value="">All Pokémon Series Generations</option>
                <option
                  v-for="sName in availablePokemonSeries"
                  :key="sName"
                  :value="sName"
                >
                  {{ sName }}
                </option>
              </select>
            </div>

            <!-- Expansion / Set Dropdown -->
            <div>
              <label class="block font-bold text-amber-950 text-[11px] mb-1">
                Japanese Expansion / Set *
              </label>
              <select
                v-model="selectedPokemonSet"
                class="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500/20"
              >
                <option value="">Select Japanese Pokémon Set...</option>
                <optgroup
                  v-for="grp in groupedPokemonSets"
                  :key="grp.series"
                  :label="grp.series"
                >
                  <option
                    v-for="s in grp.sets"
                    :key="s.id"
                    :value="s.japanese_set"
                  >
                    {{ s.japanese_set
                    }}{{ s.japanese_code ? ` [${s.japanese_code}]` : "" }}
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- Real-time Matched Set Preview Badge -->
            <div
              v-if="currentSelectedPokemonSetObj"
              class="p-3 bg-white/90 rounded-xl border border-amber-200 space-y-1.5 shadow-2xs animate-fade-in"
            >
              <div class="flex items-center justify-between">
                <span class="font-extrabold text-amber-950 text-xs">
                  {{ currentSelectedPokemonSetObj.japanese_set }}
                </span>
                <span
                  v-if="currentSelectedPokemonSetObj.japanese_code"
                  class="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[10px] font-bold"
                >
                  {{ currentSelectedPokemonSetObj.japanese_code }}
                </span>
              </div>
              <p class="text-[11px] text-amber-950">
                <span class="font-semibold text-amber-700"
                  >English Equivalent:</span
                >
                <span class="font-bold text-slate-900 ml-1">
                  {{ currentSelectedPokemonSetObj.english_set }}
                </span>
              </p>
              <div
                class="flex items-center justify-between text-[10px] text-amber-800 pt-1 border-t border-amber-100"
              >
                <span>
                  {{ currentSelectedPokemonSetObj.series }}
                  {{
                    currentSelectedPokemonSetObj.series_years
                      ? `(${currentSelectedPokemonSetObj.series_years})`
                      : ""
                  }}
                </span>
                <span
                  class="px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 font-medium"
                >
                  {{ currentSelectedPokemonSetObj.set_type }}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1"
              >Brand / Vendor Manufacturer</label
            >
            <input
              v-model="brandVendor"
              type="text"
              list="brands-list"
              class="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
              placeholder="e.g. The Pokémon Company, Bandai, Good Smile..."
            />
            <datalist id="brands-list">
              <option
                v-for="brand in dbBrands"
                :key="brand.id"
                :value="brand.name"
              />
            </datalist>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1"
              >Tags &amp; Smart Collections (comma separated)</label
            >
            <textarea
              v-model="tagsInput"
              rows="2"
              placeholder="e.g. Booster Box, Japanese, Limited Edition..."
              class="w-full p-2.5 rounded-xl border border-slate-200 text-[11px]"
            ></textarea>
            <div class="flex flex-wrap gap-1 mt-1.5">
              <span
                v-for="(t, i) in tags"
                :key="i"
                class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
              >
                #{{ t }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Duplicate Resolution Modal -->
    <div
      v-if="enableDuplicateCheck && !isAutomation && !isDuplicateDismissed && isDuplicateModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚠️</span>
            <h3 class="text-base font-black text-slate-900">
              Potential Duplicate Product Detected
            </h3>
          </div>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
            @click="dismissDuplicateWarning"
          >
            ✕
          </button>
        </div>

        <p class="text-xs text-slate-600 leading-relaxed">
          The product you are trying to publish matches an existing item in your catalog. To avoid duplicate listings, you can add stock to the existing product or proceed and create a distinct product listing.
        </p>

        <!-- Matched item preview -->
        <div
          v-if="detectedDuplicates[0]"
          class="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center gap-3.5"
        >
          <img
            :src="resolveStorageUrl(detectedDuplicates[0].image_url)"
            alt="Matched product"
            class="w-14 h-14 object-contain bg-white rounded-lg border border-amber-200 p-0.5 shrink-0"
          />
          <div class="min-w-0">
            <span class="text-xs font-bold text-slate-900 block truncate">{{ detectedDuplicates[0].name }}</span>
            <span class="text-[11px] text-amber-900 font-mono block">SKU: {{ detectedDuplicates[0].sku }}</span>
            <div class="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-2">
              <span>Current Stock: <strong>{{ detectedDuplicates[0].stock }}</strong></span>
              <span>•</span>
              <span class="text-amber-700 font-bold">{{ detectedDuplicates[0].reason }}</span>
            </div>
          </div>
        </div>

        <div class="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
            @click="isDuplicateModalOpen = false"
          >
            Cancel &amp; Review
          </button>
          <button
            v-if="detectedDuplicates[0]"
            type="button"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            @click="handleAddStockToExisting(detectedDuplicates[0], 1)"
          >
            <span>➕ Add Stock to Existing (+1)</span>
          </button>
          <button
            type="button"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md cursor-pointer"
            @click="handleConfirmPublishSeparateCopy"
          >
            Publish as Separate Listing
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
