<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from "vue";
import { useCatalogStore } from "@/modules/catalog/catalog.store";
import { useCartStore } from "@/modules/cart/cart.store";
import { resolveStorageUrl, resolveApiUrl } from "@/shared/utils/api";
import type { ToyProduct } from "@/shared/types/toy.types";

export interface TcgCardHeroProps {
  cardId?: string;
  mode?: "single-slab" | "card-cluster";
  showControls?: boolean;
  heroBanner?: any;
}

const props = withDefaults(defineProps<TcgCardHeroProps>(), {
  cardId: "umbreon",
  mode: "single-slab",
  showControls: true,
});

const emit = defineEmits<{
  (e: "inspect-card", card: any): void;
  (e: "cta-click"): void;
}>();

const catalogStore = useCatalogStore();
const cartStore = useCartStore();

// Preset definition for the 3 user-provided authentic PSA slabs
export interface SlabPreset {
  id: "umbreon" | "charizard" | "rayquaza";
  badgeIndex: string;
  name: string;
  set: string;
  number: string;
  rarity: string;
  grade: string;
  certNumber: string;
  imageSrc: string;
  fallbackCardImg: string;
  themeColor: string;
}

const SLAB_PRESETS: Record<string, SlabPreset> = {
  umbreon: {
    id: "umbreon",
    badgeIndex: "1st Image",
    name: "Umbreon VMAX (Alt Art Moonbreon)",
    set: "2021 POKEMON SWSH EVOLVING SKIES",
    number: "#215/203",
    rarity: "Secret Rare • Alternate Art",
    grade: "PSA 10 GEM MINT",
    certNumber: "88492150",
    imageSrc: "/images/slabs/umbreon-vmax-slab.png",
    fallbackCardImg: "https://images.pokemontcg.io/swsh7/215_hires.png",
    themeColor: "#818cf8",
  },
  charizard: {
    id: "charizard",
    badgeIndex: "2nd Image",
    name: "Charizard VMAX",
    set: "2020 POKEMON JPN. SWSH STARTER SET",
    number: "#002/021",
    rarity: "Japanese Starter Set VMAX",
    grade: "PSA 10 GEM MINT",
    certNumber: "52190756",
    imageSrc: "/images/slabs/charizard-vmax-slab.png",
    fallbackCardImg: "https://images.pokemontcg.io/swsh3/20_hires.png",
    themeColor: "#f97316",
  },
  rayquaza: {
    id: "rayquaza",
    badgeIndex: "3rd Image",
    name: "Rayquaza VMAX (Alt Art)",
    set: "2021 POKEMON SWSH EVOLVING SKIES",
    number: "#218/203",
    rarity: "Secret Rare • Alternate Art",
    grade: "PSA 10 GEM MINT",
    certNumber: "64193704",
    imageSrc: "/images/slabs/rayquaza-vmax-slab.png",
    fallbackCardImg: "https://images.pokemontcg.io/swsh7/218_hires.png",
    themeColor: "#10b981",
  },
};

// Container & Search refs
const containerRef = ref<HTMLDivElement | null>(null);
const searchContainerRef = ref<HTMLDivElement | null>(null);

// UI & 3D States
const activePresetKey = ref<"umbreon" | "charizard" | "rayquaza">("umbreon");
const activePreset = computed(() => SLAB_PRESETS[activePresetKey.value]);
const activeMode = ref<"single-slab" | "card-cluster">(props.mode);
const isInteracting = ref<boolean>(false);
const autoRotateEnabled = ref<boolean>(true);

// Interactive 3D Holo Studio & Camera Angle Controls
const activeHoloStyle = ref<"rainbow" | "gold" | "cosmos" | "clean">("rainbow");
const activeAnglePreset = ref<"front" | "iso" | "back">("front");

// Store Product Search & Dynamic Selection States
const searchQuery = ref<string>("");
const isSearchDropdownOpen = ref<boolean>(false);
const selectedProduct = ref<ToyProduct | null>(null);
const addedToCartFeedback = ref<boolean>(false);

// Extracted transparent cutout data URL for Non-TCG 3D rotatable products
const extractedCutoutUrl = ref<string | null>(null);
const isExtractingCutout = ref<boolean>(false);
const extractionCache = new Map<string, string>();

// Authentic Japanese Pokemon Card Back source (attached 180° back image)
const cardBackSrc = ref<string>("/images/slabs/pokemon-card-back-jp.png");
const cardBackFallbackStage = ref<number>(0);
const japaneseCardBackDataUrl = ref<string>("");

// Track broken full-slab preset image paths
const presetSlabFailed = reactive<Record<string, boolean>>({
  umbreon: false,
  charizard: false,
  rayquaza: false,
});

// 3D Rotation & Glare Coordinates
const currentRotation = reactive({ x: 0, y: 0 });
const targetRotation = reactive({ x: 0, y: 0 });
const floatOffset = reactive({ y: 0, roll: 0, wingLeftY: 0, wingRightY: 0 });
const glarePos = reactive({ x: 50, y: 50 });

let animationFrameId: number | null = null;
let startTime = performance.now();

/**
 * Generates a high-resolution replica of the attached Japanese Pokémon Gold-Border Card Back
 * (Gold outer frame, cosmic blue background, rainbow vortex, 6 energy orbs, 3D Pokéball, and arched Pokémon logos)
 * so the 180° back is always available even before the static file copy completes.
 */
function generateJapanesePokemonCardBack(): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 630;
  canvas.height = 880;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Gold Metallic Outer Frame
  const goldGrad = ctx.createLinearGradient(0, 0, 630, 880);
  goldGrad.addColorStop(0, "#d4af37");
  goldGrad.addColorStop(0.5, "#facc15");
  goldGrad.addColorStop(1, "#a16207");
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, 630, 880);

  // 2. Inner Deep Cosmic Blue Mottled Background
  const m = 28;
  const w = 630 - m * 2;
  const h = 880 - m * 2;
  const bgGrad = ctx.createRadialGradient(315, 440, 40, 315, 440, 460);
  bgGrad.addColorStop(0, "#38bdf8");
  bgGrad.addColorStop(0.35, "#0369a1");
  bgGrad.addColorStop(0.75, "#1e3a8a");
  bgGrad.addColorStop(1, "#0f172a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(m, m, w, h);

  // 3. Rainbow Vortex Swirl Rays Behind Center Pokéball
  const rayColors = [
    "rgba(239, 68, 68, 0.55)",
    "rgba(250, 204, 21, 0.55)",
    "rgba(74, 222, 128, 0.55)",
    "rgba(56, 189, 248, 0.55)",
    "rgba(168, 85, 247, 0.55)",
    "rgba(244, 114, 182, 0.55)",
  ];
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    ctx.save();
    ctx.translate(315, 440);
    ctx.rotate(angle);
    const rGrad = ctx.createLinearGradient(0, 0, 220, 0);
    rGrad.addColorStop(0, "rgba(255,255,255,0.85)");
    rGrad.addColorStop(0.5, rayColors[i % rayColors.length]);
    rGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 235, -0.18, 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 4. Six Elemental Energy Orbs Around the Perimeter
  const orbs = [
    { x: 92, y: 92, c1: "#86efac", c2: "#15803d" }, // Grass top-left
    { x: 538, y: 92, c1: "#fef08a", c2: "#ca8a04" }, // Lightning top-right
    { x: 112, y: 465, c1: "#fca5a5", c2: "#dc2626" }, // Fire mid-left
    { x: 518, y: 465, c1: "#e9d5ff", c2: "#7e22ce" }, // Psychic mid-right
    { x: 315, y: 600, c1: "#f8fafc", c2: "#94a3b8" }, // Colorless bottom-mid
    { x: 95, y: 785, c1: "#7dd3fc", c2: "#0284c7" }, // Water bottom-left
    { x: 535, y: 785, c1: "#fdba74", c2: "#c2410c" }, // Fighting bottom-right
  ];
  for (const orb of orbs) {
    const oGrad = ctx.createRadialGradient(
      orb.x - 8,
      orb.y - 8,
      4,
      orb.x,
      orb.y,
      32
    );
    oGrad.addColorStop(0, "#ffffff");
    oGrad.addColorStop(0.45, orb.c1);
    oGrad.addColorStop(1, orb.c2);
    ctx.fillStyle = oGrad;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 32, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Center 3D Glowing Pokéball
  const cx = 315;
  const cy = 415;
  const pr = 128;

  // Outer shadow
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, pr, 0, Math.PI * 2);
  ctx.clip();

  // Top Red Dome
  const redGrad = ctx.createRadialGradient(cx - 35, cy - 55, 15, cx, cy, pr);
  redGrad.addColorStop(0, "#fca5a5");
  redGrad.addColorStop(0.3, "#ef4444");
  redGrad.addColorStop(1, "#7f1d1d");
  ctx.fillStyle = redGrad;
  ctx.fillRect(cx - pr, cy - pr, pr * 2, pr);

  // Bottom White Dome
  const whiteGrad = ctx.createRadialGradient(cx - 25, cy + 35, 15, cx, cy, pr);
  whiteGrad.addColorStop(0, "#ffffff");
  whiteGrad.addColorStop(0.6, "#e2e8f0");
  whiteGrad.addColorStop(1, "#64748b");
  ctx.fillStyle = whiteGrad;
  ctx.fillRect(cx - pr, cy, pr * 2, pr);

  // Center Black Seam & Glowing Opening
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(cx - pr, cy - 16, pr * 2, 32);

  // Center Button
  ctx.beginPath();
  ctx.arc(cx, cy - 10, 38, 0, Math.PI * 2);
  ctx.fillStyle = "#0f172a";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy - 10, 26, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy - 10, 16, 0, Math.PI * 2);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // 6. Top "Pokémon" 3D Yellow/Blue Logo
  ctx.save();
  ctx.translate(315, 210);
  ctx.font = "900 92px sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 18;
  ctx.strokeStyle = "#1d4ed8";
  ctx.strokeText("Pokémon", 0, 0);
  ctx.fillStyle = "#facc15";
  ctx.fillText("Pokémon", 0, 0);
  ctx.restore();

  // 7. Bottom Inverted "Pokémon" 3D Yellow/Blue Logo
  ctx.save();
  ctx.translate(315, 675);
  ctx.rotate(Math.PI);
  ctx.font = "900 92px sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 18;
  ctx.strokeStyle = "#1d4ed8";
  ctx.strokeText("Pokémon", 0, 0);
  ctx.fillStyle = "#facc15";
  ctx.fillText("Pokémon", 0, 0);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

function handleCardBackImgError() {
  if (cardBackFallbackStage.value === 0) {
    cardBackFallbackStage.value = 1;
    cardBackSrc.value = resolveApiUrl("/api/card-back-jp");
  } else {
    cardBackFallbackStage.value = 2;
    if (!japaneseCardBackDataUrl.value) {
      japaneseCardBackDataUrl.value = generateJapanesePokemonCardBack();
    }
    cardBackSrc.value = japaneseCardBackDataUrl.value;
  }
}

/**
 * Determines whether a catalog product is ANY TCG item (Pokémon, One Piece, Yu-Gi-Oh!,
 * Dragon Ball, Hololive, Gundam TCG, Weiß Schwarz, Duel Masters, Battle Spirits, etc.) -> renders in 3D PSA Slab,
 * or a Non-TCG item (Figure, Gunpla Model Kit, Plushie, Merch) -> extracts subject & renders as 3D rotatable figure.
 */
function isProductCard(prod: ToyProduct): boolean {
  // 1. Any item in the 'tcg' category or with a tcgSeries is ALWAYS placed in a PSA Slab
  if (prod.category === "tcg" || Boolean(prod.tcgSeries)) {
    return true;
  }

  // 2. Any item with Pokemon or One Piece set metadata is a TCG item
  if (
    prod.pokemonSetCode ||
    prod.pokemonSetSeries ||
    prod.onePieceSetCode ||
    prod.onePieceProductLine
  ) {
    return true;
  }

  const nameLower = (prod.name || "").toLowerCase();

  // 3. Explicit Non-TCG categories (gunpla, anime-figures, toys-plushies, anime-merchandise)
  // are only treated as cards if their title explicitly says card/tcg/slab/psa/booster
  const explicitTcgKeywords = [
    "tcg",
    "ocg",
    "card game",
    "single card",
    "pokemon card",
    "pokémon card",
    "one piece card",
    "yugioh",
    "yu-gi-oh",
    "weiss schwarz",
    "weiß schwarz",
    "duel masters",
    "battle spirits",
    "hololive official card",
    "gundam card",
    "dragon ball super card",
    "fusion world",
    "psa ",
    "slab",
    "booster pack",
    "booster box",
    "vmax",
    "vstar",
    "sar",
  ];

  return explicitTcgKeywords.some((k) => nameLower.includes(k));
}

function getCategoryLabel(prod: ToyProduct): string {
  if (isProductCard(prod)) return "🛡️ 3D PSA Slab";
  if (prod.category === "gunpla") return "🤖 3D Gunpla Cutout";
  if (prod.category === "anime-figures") return "🗿 3D Figure Cutout";
  if (prod.category === "toys-plushies") return "🧸 3D Plush Cutout";
  return "🎁 3D Merch Cutout";
}

/**
 * Automatically extracts the product subject from its background (white / light / studio backdrop)
 * using perimeter flood-fill + anti-aliased edge feathering on an offscreen HTML5 Canvas.
 * Uses CORS-safe proxy (/r2-proxy or /api/image-proxy) so Cloudflare R2 images can be pixel-processed.
 */
async function extractProductSubjectCutout(rawImageUrl: string): Promise<string> {
  if (!rawImageUrl || typeof document === "undefined") return rawImageUrl;
  if (extractionCache.has(rawImageUrl)) {
    return extractionCache.get(rawImageUrl)!;
  }

  // Build candidate CORS-enabled URLs so canvas getImageData() succeeds on R2 images
  const candidateUrls: string[] = [];

  // 1. If it's a Cloudflare R2 URL, try local Vite /r2-proxy first, then backend /api/image-proxy
  const r2Match = rawImageUrl.match(
    /^https?:\/\/[^/]+\.r2\.dev\/(.+)$/i
  );
  if (r2Match && r2Match[1]) {
    candidateUrls.push(`/r2-proxy/${r2Match[1]}`);
  }
  if (/^https?:\/\//i.test(rawImageUrl)) {
    candidateUrls.push(
      resolveApiUrl(`/api/image-proxy?url=${encodeURIComponent(rawImageUrl)}`)
    );
  }
  candidateUrls.push(rawImageUrl);

  const loadCorsImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  };

  let loadedImg: HTMLImageElement | null = null;
  for (const url of candidateUrls) {
    try {
      loadedImg = await loadCorsImage(url);
      break;
    } catch {
      // Try next candidate
    }
  }

  if (!loadedImg) {
    return rawImageUrl;
  }

  try {
    const maxDim = 520;
    const scale = Math.min(
      1,
      maxDim / Math.max(loadedImg.naturalWidth || 1, loadedImg.naturalHeight || 1)
    );
    const w = Math.max(1, Math.round((loadedImg.naturalWidth || 400) * scale));
    const h = Math.max(1, Math.round((loadedImg.naturalHeight || 400) * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return rawImageUrl;

    ctx.drawImage(loadedImg, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Sample corner & border pixels to determine background color (r, g, b)
    const sampleCoords = [
      [2, 2],
      [w - 3, 2],
      [2, h - 3],
      [w - 3, h - 3],
      [Math.floor(w / 2), 2],
      [2, Math.floor(h / 2)],
      [w - 3, Math.floor(h / 2)],
    ];

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let count = 0;

    for (const [sx, sy] of sampleCoords) {
      const idx = (sy * w + sx) * 4;
      // If corner is already transparent, image is already a cutout PNG!
      if (data[idx + 3] < 20) {
        extractionCache.set(rawImageUrl, rawImageUrl);
        return rawImageUrl;
      }
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      count++;
    }

    const bgR = rSum / count;
    const bgG = gSum / count;
    const bgB = bSum / count;

    // Color distance helper from detected studio background
    const colorDist = (pIdx: number): number => {
      const dr = data[pIdx] - bgR;
      const dg = data[pIdx + 1] - bgG;
      const db = data[pIdx + 2] - bgB;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    };

    // Flood-fill BFS from all 4 outer borders so internal white details on the figure are preserved
    const visited = new Uint8Array(w * h);
    const isBgMask = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    const tolerance = 52; // Studio background shadow/gradient tolerance

    const enqueueIfBg = (x: number, y: number) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const pos = y * w + x;
      if (visited[pos]) return;
      visited[pos] = 1;
      const pIdx = pos * 4;
      if (colorDist(pIdx) <= tolerance) {
        isBgMask[pos] = 1;
        queue[tail++] = pos;
      }
    };

    // Seed all 4 outer edges
    for (let x = 0; x < w; x++) {
      enqueueIfBg(x, 0);
      enqueueIfBg(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      enqueueIfBg(0, y);
      enqueueIfBg(w - 1, y);
    }

    while (head < tail) {
      const curr = queue[head++];
      const cx = curr % w;
      const cy = (curr / w) | 0;

      enqueueIfBg(cx + 1, cy);
      enqueueIfBg(cx - 1, cy);
      enqueueIfBg(cx, cy + 1);
      enqueueIfBg(cx, cy - 1);
    }

    // Apply transparency to flood-filled background & soft feathering to boundary pixels
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const pos = y * w + x;
        const pIdx = pos * 4;
        if (isBgMask[pos]) {
          data[pIdx + 3] = 0;
        } else {
          // Check if adjacent to a removed background pixel for smooth anti-aliased edge feathering
          const n1 = x > 0 ? isBgMask[pos - 1] : 0;
          const n2 = x < w - 1 ? isBgMask[pos + 1] : 0;
          const n3 = y > 0 ? isBgMask[pos - w] : 0;
          const n4 = y < h - 1 ? isBgMask[pos + w] : 0;
          const bgNeighbors = n1 + n2 + n3 + n4;
          if (bgNeighbors > 0) {
            const dist = colorDist(pIdx);
            const alphaFactor = Math.min(
              1,
              Math.max(0.15, (dist - tolerance * 0.6) / (tolerance * 0.8))
            );
            data[pIdx + 3] = Math.round(data[pIdx + 3] * alphaFactor);
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const cutoutDataUrl = canvas.toDataURL("image/png");
    extractionCache.set(rawImageUrl, cutoutDataUrl);
    return cutoutDataUrl;
  } catch {
    // If canvas is tainted, return original URL
    return rawImageUrl;
  }
}

// Watch selectedProduct to automatically extract subject cutout when a Non-TCG item is chosen
watch(
  selectedProduct,
  async (prod) => {
    if (!prod || isProductCard(prod)) {
      extractedCutoutUrl.value = null;
      isExtractingCutout.value = false;
      return;
    }
    const rawUrl = resolveStorageUrl(prod.imageUrl);
    isExtractingCutout.value = true;
    extractedCutoutUrl.value = await extractProductSubjectCutout(rawUrl);
    isExtractingCutout.value = false;
  },
  { immediate: true }
);

// Filtered products from catalogStore
const filteredProducts = computed<ToyProduct[]>(() => {
  const allProducts = catalogStore.toys || [];
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) {
    return allProducts.slice(0, 8);
  }
  return allProducts
    .filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(q);
      const brandMatch = item.brand?.toLowerCase().includes(q);
      const catMatch = item.category?.toLowerCase().includes(q);
      const setMatch = item.pokemonSetSeries?.toLowerCase().includes(q);
      const typeMatch = item.pokemonType?.toLowerCase().includes(q);
      const tagMatch = item.tags?.some((t) => t.toLowerCase().includes(q));
      return (
        nameMatch || brandMatch || catMatch || setMatch || typeMatch || tagMatch
      );
    })
    .slice(0, 10);
});

// Base slab casing photo used so ALL TCG slabs share the exact physical slab design of the first 3 slabs
const baseSlabTemplateSrc = computed(() => {
  const preset = SLAB_PRESETS[activePresetKey.value];
  if (preset && !presetSlabFailed[activePresetKey.value]) {
    return preset.imageSrc;
  }
  return "/images/slabs/rayquaza-vmax-slab.png";
});

// Unified display metadata for the Left Hero Column & 3D Stage
const activeDisplayMeta = computed(() => {
  if (selectedProduct.value) {
    const prod = selectedProduct.value;
    const isCard = isProductCard(prod);
    const resolvedImg = resolveStorageUrl(prod.imageUrl);
    return {
      isStoreProduct: true,
      isCard,
      name: prod.name,
      set: (
        prod.pokemonSetSeries ||
        prod.onePieceProductLine ||
        prod.brand ||
        (isCard ? "2024 OFFICIAL TCG" : "AUTHENTIC COLLECTOR SERIES")
      ).toUpperCase(),
      subLabel: (
        prod.tcgSeries
          ? `${prod.tcgSeries.toUpperCase()} • ${prod.condition || "MINT"}`
          : prod.condition || "OFFICIAL VAULT MINT"
      ).toUpperCase(),
      number: prod.pokemonSetCode
        ? `#${prod.pokemonSetCode}`
        : prod.onePieceSetCode
          ? `#${prod.onePieceSetCode}`
          : `#${prod.id}`,
      rarity: isCard
        ? prod.condition || "PSA 10 Gem Mint • Holo Foil"
        : prod.category === "gunpla"
          ? "3D Extracted Model Cutout"
          : prod.category === "anime-figures"
            ? "3D Extracted Figure Cutout"
            : "3D Extracted Collector Cutout",
      grade: isCard
        ? "PSA 10 GEM MINT"
        : prod.category === "gunpla"
          ? "3D ROTATABLE MODEL"
          : "3D ROTATABLE FIGURE",
      certNumber: String(prod.id).padStart(8, "0"),
      imageUrl: isCard
        ? resolvedImg
        : extractedCutoutUrl.value || resolvedImg,
      rawImageUrl: resolvedImg,
      authLabel: isCard
        ? "100% Genuine PSA Slab Preview"
        : "3D Subject Cutout Extracted",
    };
  }

  return {
    isStoreProduct: false,
    isCard: true,
    name: activePreset.value.name,
    set: activePreset.value.set,
    subLabel: activePreset.value.rarity.toUpperCase(),
    number: activePreset.value.number,
    rarity: activePreset.value.rarity,
    grade: activePreset.value.grade,
    certNumber: activePreset.value.certNumber,
    imageUrl: presetSlabFailed[activePresetKey.value]
      ? activePreset.value.fallbackCardImg
      : activePreset.value.imageSrc,
    rawImageUrl: activePreset.value.imageSrc,
    authLabel: "100% Genuine PSA Graded",
  };
});

// Secondary wing presets when in 3-Card Cluster mode
const clusterWings = computed(() => {
  const allKeys: Array<"umbreon" | "charizard" | "rayquaza"> = [
    "umbreon",
    "charizard",
    "rayquaza",
  ];
  const others = allKeys.filter((k) => k !== activePresetKey.value);
  return {
    left: SLAB_PRESETS[others[0]],
    right: SLAB_PRESETS[others[1]],
  };
});

// Volumetric 3D depth slices for extracted 3D rotatable Figure / Model Kit mode
const figureDepthSlices = [-14, -11, -8, -5, -2, 1, 4, 7, 10, 13];

function setHoloFinish(style: "rainbow" | "gold" | "cosmos" | "clean") {
  activeHoloStyle.value = style;
}

function setInspectionAngle(angle: "front" | "iso" | "back") {
  activeAnglePreset.value = angle;
  if (angle === "front") {
    targetRotation.x = 0;
    targetRotation.y = 0;
  } else if (angle === "iso") {
    targetRotation.x = 8;
    targetRotation.y = -24;
  } else if (angle === "back") {
    targetRotation.x = 0;
    targetRotation.y = 180;
  }
}

const stage3DTransformStyle = computed(() => {
  return {
    transform: `translate3d(0px, ${floatOffset.y.toFixed(2)}px, 0px) rotateX(${currentRotation.x.toFixed(2)}deg) rotateY(${currentRotation.y.toFixed(2)}deg) rotateZ(${floatOffset.roll.toFixed(2)}deg)`,
  };
});

// Dynamic holographic overlay style that tracks cursor & selected finish preset
const holoOverlayStyle = computed(() => {
  const gx = glarePos.x;
  const gy = glarePos.y;

  if (activeHoloStyle.value === "clean") {
    return {
      background: `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.28) 0%, transparent 60%)`,
      mixBlendMode: "overlay" as const,
      opacity: 0.55,
    };
  }
  if (activeHoloStyle.value === "gold") {
    return {
      background: `
        radial-gradient(circle at ${gx}% ${gy}%, rgba(253, 224, 71, 0.55) 0%, rgba(245, 158, 11, 0.25) 38%, transparent 68%),
        repeating-linear-gradient(125deg, transparent 0%, rgba(251, 191, 36, 0.22) 6%, rgba(255, 255, 255, 0.35) 12%, transparent 18%)
      `,
      backgroundPosition: `${gx}% ${gy}%`,
      mixBlendMode: "color-dodge" as const,
      opacity: 0.72,
    };
  }
  if (activeHoloStyle.value === "cosmos") {
    return {
      background: `
        radial-gradient(circle at ${gx}% ${gy}%, rgba(168, 85, 247, 0.6) 0%, rgba(56, 189, 248, 0.35) 42%, transparent 72%),
        repeating-radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.22) 0px, transparent 14px, rgba(99,102,241,0.25) 28px)
      `,
      mixBlendMode: "screen" as const,
      opacity: 0.68,
    };
  }
  return {
    background: `
      radial-gradient(circle at ${gx}% ${gy}%, rgba(255, 255, 255, 0.65) 0%, transparent 55%),
      linear-gradient(${115 + (gx - 50) * 0.8}deg,
        transparent 15%,
        rgba(236, 72, 153, 0.42) 30%,
        rgba(250, 204, 21, 0.42) 42%,
        rgba(52, 211, 153, 0.42) 52%,
        rgba(56, 189, 248, 0.45) 62%,
        rgba(168, 85, 247, 0.42) 74%,
        transparent 88%)
    `,
    mixBlendMode: "color-dodge" as const,
    opacity: 0.75,
  };
});

function animateLoop(now: number) {
  animationFrameId = requestAnimationFrame(animateLoop);
  const elapsed = (now - startTime) * 0.001;

  floatOffset.y = Math.sin(elapsed * 1.6) * 7;
  floatOffset.roll = Math.cos(elapsed * 1.0) * 1.2;
  floatOffset.wingLeftY = Math.sin(elapsed * 1.9 + 1.1) * 6;
  floatOffset.wingRightY = Math.cos(elapsed * 1.7 + 2.2) * 6;

  let autoYaw = 0;
  let autoPitch = 0;
  if (autoRotateEnabled.value && !isInteracting.value) {
    autoYaw = Math.sin(elapsed * 0.75) * 11;
    autoPitch = Math.cos(elapsed * 0.6) * 3.5;
    glarePos.x = 50 + Math.sin(elapsed * 1.1) * 30;
    glarePos.y = 50 + Math.cos(elapsed * 0.9) * 25;
  }

  const desiredX = targetRotation.x + autoPitch;
  const desiredY = targetRotation.y + autoYaw;

  currentRotation.x += (desiredX - currentRotation.x) * 0.08;
  currentRotation.y += (desiredY - currentRotation.y) * 0.08;
}

function handleMouseMove(event: MouseEvent) {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

  glarePos.x = Math.round(x * 100);
  glarePos.y = Math.round(y * 100);

  const normX = (x - 0.5) * 2;
  const normY = (y - 0.5) * 2;

  const baseY =
    activeAnglePreset.value === "back"
      ? 180
      : activeAnglePreset.value === "iso"
        ? -24
        : 0;
  const baseX = activeAnglePreset.value === "iso" ? 8 : 0;

  targetRotation.y = baseY + normX * 26;
  targetRotation.x = baseX - normY * 18;
}

function handleTouchMove(event: TouchEvent) {
  if (!containerRef.value || event.touches.length === 0) return;
  const touch = event.touches[0];
  const rect = containerRef.value.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));

  glarePos.x = Math.round(x * 100);
  glarePos.y = Math.round(y * 100);

  const normX = (x - 0.5) * 2;
  const normY = (y - 0.5) * 2;

  const baseY =
    activeAnglePreset.value === "back"
      ? 180
      : activeAnglePreset.value === "iso"
        ? -24
        : 0;
  const baseX = activeAnglePreset.value === "iso" ? 8 : 0;

  targetRotation.y = baseY + normX * 28;
  targetRotation.x = baseX - normY * 20;
}

function handleMouseEnter() {
  isInteracting.value = true;
}

function handleMouseLeave() {
  isInteracting.value = false;
  setInspectionAngle(activeAnglePreset.value);
}

function toggleDisplayMode(mode: "single-slab" | "card-cluster") {
  activeMode.value = mode;
}

function selectPreset(key: "umbreon" | "charizard" | "rayquaza") {
  selectedProduct.value = null;
  searchQuery.value = "";
  activePresetKey.value = key;
  setInspectionAngle("front");
}

function selectStoreProduct(prod: ToyProduct) {
  selectedProduct.value = prod;
  searchQuery.value = prod.name;
  isSearchDropdownOpen.value = false;
  setInspectionAngle("front");
}

function clearProductSelection() {
  selectedProduct.value = null;
  searchQuery.value = "";
  isSearchDropdownOpen.value = false;
  setInspectionAngle("front");
}

function handlePrimaryAction() {
  if (selectedProduct.value) {
    cartStore.addItem(selectedProduct.value, 1);
    addedToCartFeedback.value = true;
    setTimeout(() => {
      addedToCartFeedback.value = false;
    }, 2200);
  } else {
    emit("cta-click");
  }
}

function handleInspectAction() {
  if (selectedProduct.value) {
    catalogStore.openDetailModal(selectedProduct.value);
  } else {
    emit("inspect-card", activePreset.value);
  }
}

function handleClickOutsideSearch(e: MouseEvent) {
  if (
    searchContainerRef.value &&
    !searchContainerRef.value.contains(e.target as Node)
  ) {
    isSearchDropdownOpen.value = false;
  }
}

function handleProductImgError(e: Event) {
  const target = e.target as HTMLImageElement;
  if (!target || target.dataset.fallbackApplied === "true") return;
  target.dataset.fallbackApplied = "true";
  target.src = activePreset.value.fallbackCardImg;
}

onMounted(() => {
  if (catalogStore.toys.length === 0) {
    catalogStore.fetchProducts();
  }
  japaneseCardBackDataUrl.value = generateJapanesePokemonCardBack();
  window.addEventListener("mousedown", handleClickOutsideSearch);
  startTime = performance.now();
  animationFrameId = requestAnimationFrame(animateLoop);
});

onUnmounted(() => {
  window.removeEventListener("mousedown", handleClickOutsideSearch);
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<template>
  <div
    class="relative w-full rounded-3xl overflow-hidden bg-[#0b0f19] text-white border border-slate-800/80 shadow-2xl font-display"
  >
    <!-- Ambient Vault Glows (Deep Purple & Radiant Amber) -->
    <div
      class="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/20 blur-[110px] pointer-events-none"
    ></div>
    <div
      class="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/15 blur-[120px] pointer-events-none"
    ></div>

    <!-- Hexagonal Vault Background Grid Watermark -->
    <div
      class="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#818cf8_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none"
    ></div>

    <div
      class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-14"
    >
      <!-- ─── LEFT: SEARCH BAR, HIT METRICS & INTERACTIVE STUDIO (5 COLS) ─── -->
      <div
        class="lg:col-span-5 space-y-5 text-center lg:text-left order-2 lg:order-1"
      >
        <!-- 🔎 LIVE STORE PRODUCT 3D SEARCH FIELD -->
        <div ref="searchContainerRef" class="relative text-left">
          <label
            class="block text-[11px] font-extrabold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1.5"
          >
            <span>🔎</span>
            <span>Search Store Products to Preview in 3D Slab / Showcase:</span>
          </label>
          <div class="relative flex items-center">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search any TCG card, Gunpla, Figure, or Merch..."
              class="w-full pl-4 pr-20 py-3 rounded-2xl bg-slate-900/95 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs sm:text-sm font-semibold text-white placeholder-slate-400 shadow-lg transition-all"
              @focus="isSearchDropdownOpen = true"
              @input="isSearchDropdownOpen = true"
            />
            <button
              v-if="searchQuery || selectedProduct"
              type="button"
              class="absolute right-2.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 cursor-pointer transition-colors"
              @click="clearProductSelection"
            >
              ✕ Reset
            </button>
          </div>

          <!-- Search Results Dropdown -->
          <div
            v-if="isSearchDropdownOpen"
            class="absolute left-0 right-0 mt-2 max-h-72 overflow-y-auto rounded-2xl bg-slate-900/98 backdrop-blur-xl border border-slate-700 shadow-2xl z-50 divide-y divide-slate-800/80"
          >
            <div
              v-if="filteredProducts.length === 0"
              class="p-4 text-center text-xs text-slate-400"
            >
              No matching products found in your store inventory.
            </div>

            <button
              v-for="item in filteredProducts"
              :key="item.id"
              type="button"
              class="w-full flex items-center gap-3 p-3 hover:bg-slate-800/90 transition-colors text-left cursor-pointer"
              @click="selectStoreProduct(item)"
            >
              <img
                :src="resolveStorageUrl(item.imageUrl)"
                :alt="item.name"
                class="w-11 h-11 rounded-xl object-contain bg-slate-950 border border-slate-700 p-0.5 shrink-0"
                @error="
                  (e) =>
                    ((e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=100&auto=format&fit=crop&q=80')
                "
              />
              <div class="flex-1 min-w-0">
                <div class="text-xs font-bold text-white truncate">
                  {{ item.name }}
                </div>
                <div class="flex items-center gap-2 mt-0.5">
                  <span
                    class="text-[10px] font-extrabold px-1.5 py-0.5 rounded border"
                    :class="
                      isProductCard(item)
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    "
                  >
                    {{ getCategoryLabel(item) }}
                  </span>
                  <span
                    class="text-[10px] font-semibold text-slate-400 truncate"
                  >
                    {{ item.brand || "Official Import" }}
                  </span>
                </div>
              </div>
              <span
                class="text-[10px] font-bold text-emerald-400 shrink-0 px-2 py-1 rounded-lg bg-emerald-500/10"
              >
                Preview 3D &rarr;
              </span>
            </button>
          </div>
        </div>

        <!-- RLG Vault Grade Badge & CMS Storefront Sync Badge -->
        <div class="flex flex-wrap items-center justify-center lg:justify-start gap-2">
          <div
            v-if="props.heroBanner?.badgeText && !selectedProduct"
            class="inline-flex items-center gap-2 bg-indigo-950/80 backdrop-blur-md px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30 shadow-xs"
          >
            <span>✨</span>
            <span>{{ props.heroBanner.badgeText }}</span>
          </div>

          <div
            class="inline-flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/30 shadow-md text-xs font-bold"
          >
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span class="font-black uppercase tracking-wider text-amber-300">
              {{ activeDisplayMeta.grade }}
            </span>
            <span class="text-slate-600">•</span>
            <span class="font-mono text-slate-300">
              CERT #{{ activeDisplayMeta.certNumber }}
            </span>
          </div>
        </div>

        <!-- Main Heading (Synced with CMS Slot #1 when not inspecting specific single item) -->
        <div class="space-y-2">
          <template v-if="!selectedProduct && props.heroBanner?.title">
            <h1
              class="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white line-clamp-3"
            >
              <template v-if="props.heroBanner.title.includes('.')">
                {{ props.heroBanner.title.split('.')[0] }}. <br />
                <span
                  class="bg-gradient-to-r from-white via-indigo-200 to-amber-300 bg-clip-text text-transparent"
                >
                  {{ props.heroBanner.title.split('.').slice(1).join('.').trim() }}
                </span>
              </template>
              <template v-else>
                {{ props.heroBanner.title }}
              </template>
            </h1>
            <p
              v-if="props.heroBanner.subtitle"
              class="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed whitespace-pre-line max-w-xl mx-auto lg:mx-0"
            >
              {{ props.heroBanner.subtitle }}
            </p>
          </template>
          <template v-else>
            <h1
              class="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] text-white line-clamp-2"
            >
              {{ activeDisplayMeta.name }}
            </h1>
            <p
              class="text-sm sm:text-base font-bold bg-gradient-to-r from-violet-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent"
            >
              {{ activeDisplayMeta.set }} • {{ activeDisplayMeta.number }}
            </p>
          </template>
        </div>

        <!-- ⚡ INTERACTIVE 3D HOLO & ANGLE STUDIO PANEL -->
        <div
          class="p-4 sm:p-5 rounded-2xl bg-slate-900/85 border border-slate-800 backdrop-blur-md space-y-3.5 text-left shadow-xl"
        >
          <!-- Header Row -->
          <div
            class="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-2.5"
          >
            <span class="flex items-center gap-1.5 text-white font-extrabold">
              <span class="text-amber-400">⚡</span>
              <span>Interactive 3D Holo Studio</span>
            </span>
            <span
              class="text-emerald-400 flex items-center gap-1 font-mono text-[11px]"
            >
              <span>🛡️</span>
              <span>{{ activeDisplayMeta.authLabel }}</span>
            </span>
          </div>

          <!-- Interactive Foil Shimmer Finish Selector -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span
                class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
              >
                Foil Refraction &amp; Shader Finish
              </span>
              <span class="text-[10px] font-bold text-violet-300">
                {{ activeDisplayMeta.rarity }}
              </span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                class="px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1"
                :class="
                  activeHoloStyle === 'rainbow'
                    ? 'bg-gradient-to-r from-violet-600/40 to-amber-500/40 text-white border-amber-400/60 shadow-sm font-black'
                    : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200'
                "
                @click="setHoloFinish('rainbow')"
              >
                <span>🌈</span>
                <span>Prism</span>
              </button>

              <button
                type="button"
                class="px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1"
                :class="
                  activeHoloStyle === 'gold'
                    ? 'bg-amber-500/30 text-amber-200 border-amber-400/60 shadow-sm font-black'
                    : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200'
                "
                @click="setHoloFinish('gold')"
              >
                <span>☀️</span>
                <span>Starlight</span>
              </button>

              <button
                type="button"
                class="px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1"
                :class="
                  activeHoloStyle === 'cosmos'
                    ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/60 shadow-sm font-black'
                    : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200'
                "
                @click="setHoloFinish('cosmos')"
              >
                <span>🔮</span>
                <span>Cosmos</span>
              </button>

              <button
                type="button"
                class="px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1"
                :class="
                  activeHoloStyle === 'clean'
                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/60 shadow-sm font-black'
                    : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200'
                "
                @click="setHoloFinish('clean')"
              >
                <span>💎</span>
                <span>Crystal</span>
              </button>
            </div>
          </div>

          <!-- Interactive 3D Inspection Camera Angles -->
          <div class="pt-1">
            <span
              class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5"
            >
              3D Camera Inspection Angle
            </span>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                class="px-3 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5"
                :class="
                  activeAnglePreset === 'front'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-xs'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
                "
                @click="setInspectionAngle('front')"
              >
                <span>🎯</span>
                <span>Front Face</span>
              </button>

              <button
                type="button"
                class="px-3 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5"
                :class="
                  activeAnglePreset === 'iso'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-xs'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
                "
                @click="setInspectionAngle('iso')"
              >
                <span>📐</span>
                <span>Holo Tilt</span>
              </button>

              <button
                type="button"
                class="px-3 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5"
                :class="
                  activeAnglePreset === 'back'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-xs'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
                "
                @click="setInspectionAngle('back')"
              >
                <span>🔄</span>
                <span>180° Back</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Interactive CTA Actions -->
        <div
          class="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-1"
        >
          <button
            type="button"
            class="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 border border-amber-300 transition-all cursor-pointer flex items-center gap-2"
            @click="handlePrimaryAction"
          >
            <span v-if="addedToCartFeedback">✓ Added to Cart!</span>
            <template v-else-if="activeDisplayMeta.isStoreProduct">
              <span>🛒 Add to Cart</span>
              <span>&rarr;</span>
            </template>
            <template v-else>
              <span>💎 {{ props.heroBanner?.ctaText || 'Explore Store Catalog' }}</span>
              <span>&rarr;</span>
            </template>
          </button>

          <button
            type="button"
            class="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold text-sm border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
            @click="handleInspectAction"
          >
            <span>🔍</span>
            <span>{{
              activeDisplayMeta.isStoreProduct
                ? "Inspect Product Details"
                : "Inspect Hologram"
            }}</span>
          </button>
        </div>

        <!-- Hit Switcher Preset Buttons for 1st, 2nd, and 3rd Images -->
        <div v-if="props.showControls" class="pt-1">
          <span
            class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2"
          >
            Featured Grails (Or Search Any Store Item Above):
          </span>
          <div
            class="flex flex-wrap items-center justify-center lg:justify-start gap-2"
          >
            <button
              type="button"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5"
              :class="
                !selectedProduct && activePresetKey === 'umbreon'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20 font-black'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
              "
              @click="selectPreset('umbreon')"
            >
              <span>🌙</span>
              <span>1st: Umbreon #215</span>
            </button>

            <button
              type="button"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5"
              :class="
                !selectedProduct && activePresetKey === 'charizard'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20 font-black'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
              "
              @click="selectPreset('charizard')"
            >
              <span>🔥</span>
              <span>2nd: Charizard #002</span>
            </button>

            <button
              type="button"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5"
              :class="
                !selectedProduct && activePresetKey === 'rayquaza'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20 font-black'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
              "
              @click="selectPreset('rayquaza')"
            >
              <span>🐉</span>
              <span>3rd: Rayquaza #218</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ─── RIGHT: CRYSTAL-CLEAR VOLUMETRIC 3D STAGE (7 COLS) ─────────── -->
      <div
        class="lg:col-span-7 relative flex flex-col items-center justify-center order-1 lg:order-2"
      >
        <div
          ref="containerRef"
          class="relative w-full h-[470px] sm:h-[560px] lg:h-[620px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          style="perspective: 1400px"
          @mousemove="handleMouseMove"
          @touchmove="handleTouchMove"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <!-- Ambient Backlight Halo behind the 3D Object -->
          <div
            class="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full blur-3xl pointer-events-none transition-colors duration-500"
            :class="
              activeDisplayMeta.isCard
                ? 'bg-gradient-to-tr from-indigo-500/25 via-purple-500/20 to-amber-400/25'
                : 'bg-gradient-to-tr from-cyan-500/25 via-indigo-500/20 to-rose-500/25'
            "
          ></div>

          <!-- Floating Interactive Tip Pill -->
          <div
            class="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] font-bold text-slate-200 flex items-center gap-2 pointer-events-none shadow-lg z-30 transition-opacity duration-300"
            :class="isInteracting ? 'opacity-35' : 'opacity-100'"
          >
            <span>✨</span>
            <span>{{
              activeDisplayMeta.isCard
                ? "Move cursor to tilt PSA Slab & catch holo glare"
                : "Move cursor to rotate extracted 3D Product"
            }}</span>
          </div>

          <!-- ═════════════════════════════════════════════════════════════════
               3D OBJECT ROOT CONTAINER (preserve-3d)
               ═════════════════════════════════════════════════════════════════ -->
          <div
            class="relative flex items-center justify-center"
            style="transform-style: preserve-3d"
            :style="stage3DTransformStyle"
          >
            <!-- ───────────────────────────────────────────────────────────────
                 MODE A: ALL TCG ITEMS -> REAL UPLOADED PSA SLAB CASING
                 (Uses the exact uploaded slab casing of Umbreon/Charizard/Rayquaza,
                  dynamically replacing only the card artwork and top label details!)
                 ─────────────────────────────────────────────────────────────── -->
            <template v-if="activeDisplayMeta.isCard">
              <!-- Optional 3-Card Cluster Flanking Left & Right Wing Slabs -->
              <template v-if="activeMode === 'card-cluster'">
                <!-- Left Wing Slab -->
                <div
                  class="absolute w-[185px] sm:w-[225px] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] pointer-events-none"
                  :style="{
                    transform: `translate3d(-140px, ${floatOffset.wingLeftY}px, -55px) rotateY(22deg) rotateZ(-11deg)`,
                  }"
                >
                  <img
                    :src="
                      presetSlabFailed[clusterWings.left.id]
                        ? clusterWings.left.fallbackCardImg
                        : clusterWings.left.imageSrc
                    "
                    :alt="clusterWings.left.name"
                    class="w-full h-auto object-contain block"
                    @error="presetSlabFailed[clusterWings.left.id] = true"
                  />
                  <div
                    class="absolute inset-x-[7%] top-[24.5%] bottom-[6.5%] rounded-lg pointer-events-none"
                    :style="holoOverlayStyle"
                  ></div>
                </div>

                <!-- Right Wing Slab -->
                <div
                  class="absolute w-[185px] sm:w-[225px] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] pointer-events-none"
                  :style="{
                    transform: `translate3d(140px, ${floatOffset.wingRightY}px, -65px) rotateY(-22deg) rotateZ(11deg)`,
                  }"
                >
                  <img
                    :src="
                      presetSlabFailed[clusterWings.right.id]
                        ? clusterWings.right.fallbackCardImg
                        : clusterWings.right.imageSrc
                    "
                    :alt="clusterWings.right.name"
                    class="w-full h-auto object-contain block"
                    @error="presetSlabFailed[clusterWings.right.id] = true"
                  />
                  <div
                    class="absolute inset-x-[7%] top-[24.5%] bottom-[6.5%] rounded-lg pointer-events-none"
                    :style="holoOverlayStyle"
                  ></div>
                </div>
              </template>

              <!-- ─── CENTER 3D PSA GRADED SLAB (Exact Real Slab Casing) ─── -->
              <div
                class="relative w-[262px] sm:w-[306px]"
                style="transform-style: preserve-3d"
              >
                <!-- 3D Extruded Acrylic Slab Edge Thickness Layers -->
                <div
                  v-for="zLayer in [-9, -6, -3, 3, 6, 9]"
                  :key="zLayer"
                  class="absolute inset-0 rounded-[14px] border border-white/25 bg-white/[0.03] pointer-events-none"
                  :style="{ transform: `translateZ(${zLayer}px)` }"
                ></div>

                <!-- FRONT FACE OF THE PSA 10 SLAB (translateZ +11px) -->
                <div
                  class="relative w-full rounded-[14px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)]"
                  style="
                    transform: translateZ(11px);
                    backface-visibility: hidden;
                  "
                >
                  <!-- 1. Authentic Uploaded PSA Slab Base Photograph (Casing, Red Border, PSA Sticker & Acrylic Rails) -->
                  <img
                    :src="baseSlabTemplateSrc"
                    :alt="activeDisplayMeta.name"
                    class="w-full h-auto block select-none"
                    @error="presetSlabFailed[activePresetKey] = true"
                  />

                  <!-- 2. When a Store TCG Product is Selected: Dynamically Replace the Label Text & Card Artwork Inside the Real Slab! -->
                  <template v-if="activeDisplayMeta.isStoreProduct">
                    <!-- Dynamic Label Overlay Inside the Original Red PSA Label Frame -->
                    <div
                      class="absolute left-[6.3%] right-[7.2%] top-[3.3%] h-[11.5%] bg-[#f2f4f8] px-2 py-1 flex flex-col justify-between text-slate-950 overflow-hidden"
                    >
                      <!-- Row 1: Set / Franchise + Card/Item Number -->
                      <div
                        class="flex items-center justify-between text-[8.5px] sm:text-[9.5px] font-mono font-bold tracking-tight leading-none text-slate-900"
                      >
                        <span class="truncate max-w-[74%]">{{
                          activeDisplayMeta.set
                        }}</span>
                        <span class="shrink-0 font-extrabold">{{
                          activeDisplayMeta.number
                        }}</span>
                      </div>

                      <!-- Row 2: Product / Card Name + GEM MT -->
                      <div
                        class="flex items-center justify-between text-[9px] sm:text-[10px] font-mono font-black tracking-tight leading-none text-slate-950"
                      >
                        <span class="truncate max-w-[74%]">{{
                          activeDisplayMeta.name.toUpperCase()
                        }}</span>
                        <span class="shrink-0">GEM MT</span>
                      </div>

                      <!-- Row 3: Series / Condition + 10 -->
                      <div
                        class="flex items-center justify-between text-[8.5px] sm:text-[9.5px] font-mono font-bold tracking-tight leading-none text-slate-800"
                      >
                        <span class="truncate max-w-[76%]">{{
                          activeDisplayMeta.subLabel
                        }}</span>
                        <span class="shrink-0 font-black">10</span>
                      </div>

                      <!-- Row 4: Barcode Left + Authentic Silver PSA Hologram Center + Cert # Right -->
                      <div
                        class="flex items-center justify-between pt-0.5 leading-none"
                      >
                        <!-- Barcode bars -->
                        <div class="flex items-center gap-[1.2px] h-2.5 sm:h-3">
                          <span
                            v-for="b in 18"
                            :key="b"
                            class="h-full bg-slate-950"
                            :class="b % 3 === 0 ? 'w-[2px]' : 'w-[1px]'"
                          ></span>
                        </div>

                        <!-- Silver Metallic PSA Security Hologram Sticker -->
                        <span
                          class="px-1.5 py-[1px] rounded-[2px] bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 border border-slate-400 text-[8px] sm:text-[9px] font-black italic text-blue-900 tracking-wider leading-none shadow-2xs"
                        >
                          PSA
                        </span>

                        <!-- Cert Number -->
                        <span
                          class="text-[8.5px] sm:text-[9.5px] font-mono font-extrabold text-slate-900"
                        >
                          {{ activeDisplayMeta.certNumber }}
                        </span>
                      </div>
                    </div>

                    <!-- Dynamic Card Content Overlay Inside the Real Slab's Inner Acrylic Window -->
                    <div
                      class="absolute left-[6.8%] right-[7.8%] top-[24.4%] bottom-[6.4%] rounded-[10px] bg-slate-950 flex items-center justify-center overflow-hidden shadow-[inset_0_0_8px_rgba(0,0,0,0.65)]"
                    >
                      <img
                        :src="activeDisplayMeta.imageUrl"
                        :alt="activeDisplayMeta.name"
                        class="w-full h-full object-cover rounded-[9px]"
                        @error="handleProductImgError"
                      />
                    </div>
                  </template>

                  <!-- 3. Interactive Holographic Foil Shimmer over the Slab's Card Window -->
                  <div
                    class="absolute left-[6.8%] right-[7.8%] top-[24.4%] bottom-[6.4%] rounded-[10px] pointer-events-none transition-opacity duration-200"
                    :style="holoOverlayStyle"
                  ></div>
                </div>

                <!-- BACK FACE OF THE PSA 10 SLAB (180° Flip Inspection with Attached Japanese Card Back) -->
                <div
                  class="absolute inset-0 rounded-[14px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)]"
                  style="
                    transform: rotateY(180deg) translateZ(11px);
                    backface-visibility: hidden;
                  "
                >
                  <!-- Real PSA Slab Casing on Back -->
                  <img
                    :src="baseSlabTemplateSrc"
                    alt="PSA Slab Back Casing"
                    class="w-full h-full object-cover scale-x-[-1] brightness-95 select-none"
                  />

                  <!-- Reverse PSA Label Header -->
                  <div
                    class="absolute left-[6.3%] right-[7.2%] top-[3.3%] h-[11.5%] bg-[#f2f4f8] px-2.5 py-1 flex flex-col justify-between text-slate-900"
                  >
                    <div
                      class="flex items-center justify-between text-[9px] font-mono font-black text-red-700"
                    >
                      <span>PSA AUTHENTICATION</span>
                      <span>CERT #{{ activeDisplayMeta.certNumber }}</span>
                    </div>
                    <p
                      class="text-[8px] font-mono font-bold text-slate-700 leading-tight truncate"
                    >
                      OFFICIAL GRADED ENCAPSULATION • GEM MT 10
                    </p>
                    <div
                      class="flex items-center justify-between text-[8.5px] font-mono font-black text-slate-900 border-t border-slate-300 pt-0.5"
                    >
                      <span class="truncate max-w-[75%]">{{
                        activeDisplayMeta.name.toUpperCase()
                      }}</span>
                      <span class="text-blue-800 italic">PSA 10</span>
                    </div>
                  </div>

                  <!-- Attached Japanese Pokémon Card Back Inside the Reverse Slab Window -->
                  <div
                    class="absolute left-[6.8%] right-[7.8%] top-[24.4%] bottom-[6.4%] rounded-[10px] overflow-hidden bg-slate-950 shadow-inner"
                  >
                    <img
                      :src="cardBackSrc"
                      alt="Official Pokémon Card Back"
                      class="w-full h-full object-cover rounded-[9px]"
                      @error="handleCardBackImgError"
                    />
                  </div>
                </div>
              </div>
            </template>

            <!-- ───────────────────────────────────────────────────────────────
                 MODE B: NON-TCG PRODUCT -> EXTRACTED 3D ROTATABLE SUBJECT CUTOUT
                 + ATTACHED 180° BACK
                 ─────────────────────────────────────────────────────────────── -->
            <template v-else>
              <div
                class="relative w-[290px] sm:w-[350px] h-[390px] sm:h-[450px] flex items-center justify-center"
                style="transform-style: preserve-3d"
              >
                <!-- Glowing 3D Hologram Floor Ring Underneath Extracted Figure -->
                <div
                  class="absolute -bottom-6 w-56 sm:w-64 h-16 rounded-full border-2 border-cyan-400/60 bg-radial from-cyan-400/30 via-indigo-500/15 to-transparent shadow-[0_0_45px_rgba(34,211,238,0.55)] pointer-events-none"
                  style="transform: rotateX(76deg) translateZ(-20px)"
                ></div>

                <!-- Inner Rotating Energy Ring -->
                <div
                  class="absolute -bottom-4 w-40 sm:w-48 h-12 rounded-full border border-dashed border-amber-300/70 pointer-events-none"
                  style="transform: rotateX(76deg) translateZ(-12px)"
                ></div>

                <!-- Extracting Cutout Indicator Badge -->
                <div
                  v-if="isExtractingCutout"
                  class="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-400/50 text-[10px] font-bold text-cyan-300 flex items-center gap-1.5 shadow-lg"
                >
                  <span
                    class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"
                  ></span>
                  <span>Extracting 3D Cutout...</span>
                </div>

                <!-- VOLUMETRIC 3D EXTRUDED SLICES OF THE EXTRACTED PRODUCT CUTOUT -->
                <div
                  v-for="(zOffset, sIdx) in figureDepthSlices"
                  :key="zOffset"
                  class="absolute inset-0 flex items-center justify-center pointer-events-none"
                  :style="{
                    transform: `translateZ(${zOffset}px)`,
                  }"
                >
                  <img
                    :src="activeDisplayMeta.imageUrl"
                    :alt="activeDisplayMeta.name"
                    class="w-full h-full object-contain select-none"
                    :class="
                      sIdx === figureDepthSlices.length - 1
                        ? 'brightness-105 contrast-105'
                        : 'brightness-75 opacity-85'
                    "
                    @error="handleProductImgError"
                  />
                </div>

                <!-- FRONT HERO EXTRACTED 3D FIGURE PLANE (translateZ +16px) -->
                <div
                  class="relative w-full h-full flex items-center justify-center"
                  style="
                    transform: translateZ(16px);
                    backface-visibility: hidden;
                  "
                >
                  <img
                    :src="activeDisplayMeta.imageUrl"
                    :alt="activeDisplayMeta.name"
                    class="w-full h-full object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.85)] select-none"
                    @error="handleProductImgError"
                  />
                </div>

                <!-- 180° BACK FACE ATTACHED TO THE 3D ROTATABLE PRODUCT -->
                <div
                  class="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style="
                    transform: rotateY(180deg) translateZ(16px);
                    backface-visibility: hidden;
                  "
                >
                  <div
                    class="relative w-[245px] sm:w-[285px] aspect-[63/88] rounded-2xl overflow-hidden shadow-[0_25px_55px_rgba(0,0,0,0.9)] border-2 border-amber-400/70"
                  >
                    <img
                      :src="cardBackSrc"
                      alt="Attached 180° Collector Back"
                      class="w-full h-full object-cover"
                      @error="handleCardBackImgError"
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Viewport Mode & Shimmer Floating Controls -->
          <div
            v-if="props.showControls"
            class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl z-30"
          >
            <template v-if="activeDisplayMeta.isCard">
              <button
                type="button"
                class="px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                :class="
                  activeMode === 'single-slab'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                "
                title="Graded PSA Acrylic Slab View"
                @click="toggleDisplayMode('single-slab')"
              >
                <span>🛡️</span>
                <span>Acrylic Slab</span>
              </button>

              <button
                type="button"
                class="px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                :class="
                  activeMode === 'card-cluster'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                "
                title="Dynamic 3-Card Cluster View"
                @click="toggleDisplayMode('card-cluster')"
              >
                <span>🃏</span>
                <span>3-Card Cluster</span>
              </button>

              <div class="w-[1px] h-4 bg-slate-700 mx-1"></div>
            </template>
            <template v-else>
              <span
                class="px-3 py-1 rounded-xl text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5"
              >
                <span>🗿</span>
                <span>3D Extracted Cutout</span>
              </span>
              <div class="w-[1px] h-4 bg-slate-700 mx-1"></div>
            </template>

            <button
              type="button"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer"
              :class="
                autoRotateEnabled
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                  : 'bg-slate-800 text-slate-400'
              "
              title="Toggle Ambient Auto-Rotation"
              @click="autoRotateEnabled = !autoRotateEnabled"
            >
              🔄 Float {{ autoRotateEnabled ? "ON" : "PAUSED" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
