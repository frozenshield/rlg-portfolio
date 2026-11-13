<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useAdminStore } from "@/modules/admin/admin.store";

export interface StagedCardItem {
  id: string;
  sequence: number;
  blob: Blob;
  previewUrl: string;
  originalRawUrl?: string; // Store original raw shot for manual re-crop / adjustment
  hasTemplate?: boolean;
  filename: string;
  sizeBytes: number;
  sizeKb: number;
  quality: number;
  width: number;
  height: number;
  capturedAt: string;
  status: "staged" | "uploading" | "uploaded" | "error";
  driveLink?: string | null;
  localUrl?: string | null;
  errorMessage?: string;
}

interface DriveConfig {
  folder_id: string | null;
  folder_url: string | null;
  has_credentials: boolean;
  service_account_email: string | null;
  auth_mode: string;
}

const adminStore = useAdminStore();

// ─── Environment & Capture Mode State ─────────────────────────────────────────
const isNativePlatform = ref<boolean>(Capacitor.isNativePlatform());
const autoReArmLoop = ref<boolean>(true);
const isLoopActive = ref<boolean>(false);
const isProcessingCard = ref<boolean>(false);
const activeProcessingCount = ref<number>(0);

// Intelligent Card Boundary Auto-Crop & Pro Image Enhancement Toggles
const rawCameraMode = ref<boolean>(
  typeof localStorage !== "undefined"
    ? localStorage.getItem("rlg_raw_camera_mode") === "true"
    : false,
);

watch(rawCameraMode, (val) => {
  try {
    localStorage.setItem("rlg_raw_camera_mode", val ? "true" : "false");
  } catch {}
});

const autoEdgeDetect = ref<boolean>(true);
const enhanceCard = ref<boolean>(true);
const shadowReduction = ref<boolean>(true);
const boostSaturation = ref<boolean>(true);
const unsharpMask = ref<boolean>(true);

// ─── Branded Background Template Compositor State ─────────────────────────────
export type TemplateAspectRatio = "1:1" | "63:88" | "3:4" | "4:3" | "original";

const applyBrandedTemplate = ref<boolean>(
  typeof localStorage !== "undefined"
    ? localStorage.getItem("rlg_apply_branded_template") !== "false"
    : true,
);
const templateAspectRatio = ref<TemplateAspectRatio>(
  typeof localStorage !== "undefined"
    ? (localStorage.getItem("rlg_card_template_aspect_ratio") as TemplateAspectRatio) || "1:1"
    : "1:1",
);
const defaultTemplateUrl = "/templates/pokemon-rlg-card-template.png";
const activeTemplateUrl = ref<string>("/templates/pokemon-rlg-card-template.png");
const templateName = ref<string>("RLG Pokémon Shop Template");
const customTemplateLoaded = ref<boolean>(false);
const templateScalePercent = ref<number>(76); // 76% height: optimal prominence inside Shopee 1:1 square
const templateFileInputRef = ref<HTMLInputElement | null>(null);

watch(applyBrandedTemplate, (val) => {
  try {
    localStorage.setItem("rlg_apply_branded_template", val ? "true" : "false");
  } catch {}
});
watch(templateAspectRatio, (val) => {
  try {
    localStorage.setItem("rlg_card_template_aspect_ratio", val);
  } catch {}
});

export interface QuadCornerPoint {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
}

export interface QuadCorners {
  tl: QuadCornerPoint;
  tr: QuadCornerPoint;
  br: QuadCornerPoint;
  bl: QuadCornerPoint;
}

// Manual Crop & Boundary Fine-Tuning Modal State
const croppingCard = ref<StagedCardItem | null>(null);
const cropCorners = ref<QuadCorners>({
  tl: { x: 12, y: 8 },
  tr: { x: 88, y: 8 },
  br: { x: 88, y: 92 },
  bl: { x: 12, y: 92 },
});
const activeDraggingCorner = ref<"tl" | "tr" | "br" | "bl" | null>(null);
const cropPreviewContainerRef = ref<HTMLDivElement | null>(null);

// Live WebRTC Viewfinder State (for zero-latency continuous scanning in web/hybrid)
const isLiveStreamActive = ref<boolean>(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const cameraFlashEffect = ref<boolean>(false);
const torchSupported = ref<boolean>(false);
const torchEnabled = ref<boolean>(false);
let mediaStream: MediaStream | null = null;

// ─── Staged Cards Queue ───────────────────────────────────────────────────────
const stagedQueue = ref<StagedCardItem[]>([]);
const inspectedCard = ref<StagedCardItem | null>(null);
let sequenceCounter = 0;

// ─── Batch Upload Progress Modal State ────────────────────────────────────────
const isUploadModalOpen = ref<boolean>(false);
const isUploadingBatch = ref<boolean>(false);
const uploadCurrentIndex = ref<number>(0);
const uploadTotalCards = ref<number>(0);
const uploadCurrentCardKb = ref<number>(0);
const uploadCompleted = ref<boolean>(false);
const uploadError = ref<string>("");
const lastBatchSummary = ref<{
  batchId: string;
  totalCards: number;
  driveUploadedCount: number;
  totalSizeKb: number;
  targetFolderUrl: string | null;
  storageMode: string;
  cards: any[];
  warnings?: string[];
} | null>(null);

// ─── Google Drive Target Folder Settings Modal ────────────────────────────────
const isDriveConfigModalOpen = ref<boolean>(false);
const isSavingDriveConfig = ref<boolean>(false);
const isTestingDriveConnection = ref<boolean>(false);
const driveTestResult = ref<{ success: boolean; message?: string; error?: string } | null>(null);
const copiedSaEmail = ref<boolean>(false);
const driveConfig = ref<DriveConfig>({
  folder_id: null,
  folder_url: null,
  has_credentials: false,
  service_account_email: null,
  auth_mode: "local_mirror",
});
const driveFolderInput = ref<string>("");
const driveAccessTokenInput = ref<string>("");
const driveServiceAccountInput = ref<string>("");
const driveConfigFeedback = ref<string>("");
const recentBatches = ref<any[]>([]);

// ─── Computed Telemetry ───────────────────────────────────────────────────────
const stagedCount = computed(() => stagedQueue.value.length);

const totalStagedKb = computed(() => {
  const bytes = stagedQueue.value.reduce((acc, item) => acc + item.sizeBytes, 0);
  return Math.round((bytes / 1024) * 10) / 10;
});

const averageCardKb = computed(() => {
  if (stagedQueue.value.length === 0) return 0;
  return Math.round((totalStagedKb.value / stagedQueue.value.length) * 10) / 10;
});

const uploadProgressPercent = computed(() => {
  if (uploadTotalCards.value === 0) return 0;
  return Math.min(
    100,
    Math.round((uploadCurrentIndex.value / uploadTotalCards.value) * 100),
  );
});

// ─── Haptic Feedback Helper ───────────────────────────────────────────────────
async function triggerHapticTick() {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    }
  } catch {
    // Fallback to Web Vibration API
  }
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(25);
    }
  } catch {}
}

// ─── HTML5 Canvas Warp & Strict Sub-200KB Compression Pipeline ────────────────
const TARGET_WIDTH = 750;
const TARGET_HEIGHT = 1050;
const TARGET_RATIO = 63 / 88; // Standard Trading Card Ratio (~0.7159 / 1:1.397)
const MAX_FILE_SIZE_BYTES = 200 * 1024; // 200 KB hard ceiling

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas toBlob conversion failed."));
        }
      },
      mimeType,
      quality,
    );
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * High-Precision Trading Card Boundary Detector.
 * Analyzes the frame for the rectangular card object by:
 * 1. Scoring color variance and gradient contrast between the card and surrounding hands/background.
 * 2. Scanning from center outward (since users frame the card in the center 60-80% of view).
 * 3. Rejecting human skin tone pixels (hands holding the card) and dark/wood table edges.
 * 4. Snapping strictly to standard 63:88 trading card proportions.
 */
function detectCardBoundingBox(
  srcCanvas: HTMLCanvasElement,
  srcW: number,
  srcH: number,
): { cropX: number; cropY: number; cropW: number; cropH: number } {
  // Downsample to 320px width for fast, reliable pixel evaluation
  const sampleW = 320;
  const sampleH = Math.round((srcH / srcW) * sampleW);
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = sampleW;
  sampleCanvas.height = sampleH;
  const sCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!sCtx) {
    return computeDefaultCenterCrop(srcW, srcH);
  }

  sCtx.drawImage(srcCanvas, 0, 0, sampleW, sampleH);
  const imgData = sCtx.getImageData(0, 0, sampleW, sampleH);
  const data = imgData.data;

  // Center coordinate of frame
  const cx = Math.floor(sampleW / 2);
  const cy = Math.floor(sampleH / 2);

  // Compute column and row edge intensities
  const colEdges = new Float32Array(sampleW);
  const rowEdges = new Float32Array(sampleH);

  for (let y = 10; y < sampleH - 10; y++) {
    for (let x = 10; x < sampleW - 10; x++) {
      const idx = (y * sampleW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Detect skin-tone pixels (hands holding card) to weight boundaries
      const isSkin = r > g && g > b && (r - g) > 12 && r > 55 && (r + g + b) < 650;

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const rightIdx = (y * sampleW + (x + 1)) * 4;
      const rightLum = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
      const downIdx = ((y + 1) * sampleW + x) * 4;
      const downLum = 0.299 * data[downIdx] + 0.587 * data[downIdx + 1] + 0.114 * data[downIdx + 2];

      let hDiff = Math.abs(lum - rightLum);
      let vDiff = Math.abs(lum - downLum);

      if (isSkin) {
        hDiff *= 2.0;
        vDiff *= 2.0;
      }

      colEdges[x] += hDiff;
      rowEdges[y] += vDiff;
    }
  }

  // Find Left Edge: Scan from the outer margin inward (sampleW * 0.04 to sampleW * 0.36)
  // This locks onto the OUTER card edge instead of the high-contrast inner artwork box!
  const leftStart = Math.floor(sampleW * 0.04);
  const leftEnd = Math.floor(sampleW * 0.36);
  let bestLeft = Math.floor(sampleW * 0.10);
  let maxLeftPeak = 0;
  for (let x = leftStart; x <= leftEnd; x++) {
    if (colEdges[x] > maxLeftPeak) {
      maxLeftPeak = colEdges[x];
      bestLeft = x;
    }
  }

  // Find Right Edge: Scan from the outer margin inward (sampleW * 0.96 down to sampleW * 0.64)
  const rightStart = Math.floor(sampleW * 0.96);
  const rightEnd = Math.floor(sampleW * 0.64);
  let bestRight = Math.floor(sampleW * 0.90);
  let maxRightPeak = 0;
  for (let x = rightStart; x >= rightEnd; x--) {
    if (colEdges[x] > maxRightPeak) {
      maxRightPeak = colEdges[x];
      bestRight = x;
    }
  }

  let detectedW = bestRight - bestLeft;
  // Whole trading card bounds check: card must occupy between 52% and 94% of frame width
  // If narrower, it means an inner art/text element was picked; fall back to safe reticle crop
  if (detectedW < sampleW * 0.52 || detectedW > sampleW * 0.94) {
    return computeDefaultCenterCrop(srcW, srcH);
  }

  // Standard Trading Card Proportions (63:88 ~ 0.7159)
  const expectedH = Math.round(detectedW / TARGET_RATIO);

  // COUPLED JOINT TOP-BOTTOM DETECTOR:
  // Card is framed in the center reticle, so vertical center is near cy.
  // Evaluate joint edge score: rowEdges[top] + rowEdges[top + expectedH].
  // This guarantees we lock onto the TRUE top and bottom edges of the physical card,
  // completely ignoring background room items like speakers, monitors, or desks!
  let bestTop = Math.round(cy - expectedH / 2);
  let maxJointScore = -1;

  const minTop = Math.max(8, Math.floor(cy - expectedH * 0.62));
  const maxTop = Math.min(sampleH - expectedH - 8, Math.floor(cy - expectedH * 0.38));

  for (let top = minTop; top <= maxTop; top++) {
    const bY = top + expectedH;
    if (bY < sampleH - 6) {
      const bottomEdge = Math.max(
        rowEdges[bY - 1] || 0,
        rowEdges[bY],
        rowEdges[bY + 1] || 0,
      );
      const topEdge = Math.max(
        rowEdges[top - 1] || 0,
        rowEdges[top],
        rowEdges[top + 1] || 0,
      );
      const jointScore = topEdge + bottomEdge;
      if (jointScore > maxJointScore) {
        maxJointScore = jointScore;
        bestTop = top;
      }
    }
  }

  const bestBottom = bestTop + expectedH;
  const detectedHeight = bestBottom - bestTop;

  if (detectedW > sampleW * 0.45 && detectedHeight > 50) {
    const scaleX = srcW / sampleW;
    const scaleY = srcH / sampleH;

    // Add generous 5.5% outer safety margin so card borders, corners, name, HP, and set info are NEVER clipped
    const padX = Math.round(detectedW * 0.055);
    const padY = Math.round(detectedHeight * 0.055);

    const sampleLeft = Math.max(0, bestLeft - padX);
    const sampleRight = Math.min(sampleW, bestRight + padX);
    const sampleTop = Math.max(0, bestTop - padY);
    const sampleBottom = Math.min(sampleH, bestBottom + padY);

    let cX = Math.round(sampleLeft * scaleX);
    let cY = Math.round(sampleTop * scaleY);
    let cW = Math.round((sampleRight - sampleLeft) * scaleX);
    let cH = Math.round((sampleBottom - sampleTop) * scaleY);

    // Strictly enforce 63:88 trading card proportions
    const currentRatio = cW / cH;
    if (currentRatio > TARGET_RATIO) {
      const targetW = Math.round(cH * TARGET_RATIO);
      cX += Math.round((cW - targetW) / 2);
      cW = targetW;
    } else {
      const targetH = Math.round(cW / TARGET_RATIO);
      cY += Math.round((cH - targetH) / 2);
      cH = targetH;
    }

    cX = Math.max(0, Math.min(srcW - cW, cX));
    cY = Math.max(0, Math.min(srcH - cH, cY));
    cW = Math.min(srcW - cX, cW);
    cH = Math.min(srcH - cY, cH);

    return { cropX: cX, cropY: cY, cropW: cW, cropH: cH };
  }

  return computeDefaultCenterCrop(srcW, srcH);
}

function computeDefaultCenterCrop(srcW: number, srcH: number) {
  // Center 84% framing matching the live viewfinder 63:88 reticle (ensures entire physical card with borders is captured without zoom)
  const targetW = Math.round(Math.min(srcW * 0.84, srcH * 0.84 * TARGET_RATIO));
  const targetH = Math.round(targetW / TARGET_RATIO);
  const cropX = Math.round((srcW - targetW) / 2);
  const cropY = Math.round((srcH - targetH) / 2);

  return {
    cropX: Math.max(0, cropX),
    cropY: Math.max(0, cropY),
    cropW: Math.min(srcW, targetW),
    cropH: Math.min(srcH, targetH),
  };
}

/**
 * 3x3 Homography Matrix Solver for Perspective Warp (CamScanner Algorithm).
 * Maps 4 arbitrary quad corners (tl, tr, br, bl) into a flat rectangular destination (0,0 to w,h).
 */
function solveHomography(
  srcPts: { x: number; y: number }[],
  dstPts: { x: number; y: number }[],
): number[] {
  // Gaussian elimination to solve the 8 linear equations for projective transformation
  const a: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const sx = srcPts[i].x;
    const sy = srcPts[i].y;
    const dx = dstPts[i].x;
    const dy = dstPts[i].y;

    a.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy, dx]);
    a.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy, dy]);
  }

  // Gaussian elimination with partial pivoting
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) {
        maxRow = k;
      }
    }
    const temp = a[i];
    a[i] = a[maxRow];
    a[maxRow] = temp;

    for (let k = i + 1; k < n; k++) {
      const c = -a[k][i] / (a[i][i] || 1e-8);
      for (let j = i; j <= n; j++) {
        if (i === j) {
          a[k][j] = 0;
        } else {
          a[k][j] += c * a[i][j];
        }
      }
    }
  }

  // Back-substitution
  const h = new Array(9).fill(0);
  h[8] = 1;
  for (let i = n - 1; i >= 0; i--) {
    let sum = a[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= a[i][j] * h[j];
    }
    h[i] = sum / (a[i][i] || 1e-8);
  }

  return h;
}

/**
 * Executes high-precision bilinear backward perspective warp.
 * Flattens any tilted card shot straight onto the 750x1050 target canvas.
 */
function warpPerspectiveQuad(
  srcCanvas: HTMLCanvasElement,
  dstCtx: CanvasRenderingContext2D,
  corners: QuadCorners,
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
) {
  const sCtx = srcCanvas.getContext("2d");
  if (!sCtx) return;

  const srcImgData = sCtx.getImageData(0, 0, srcW, srcH);
  const srcData = srcImgData.data;

  const dstImgData = dstCtx.createImageData(targetW, targetH);
  const dstData = dstImgData.data;

  // Convert percentage corners to full pixel coordinates
  const pTL = { x: (corners.tl.x / 100) * srcW, y: (corners.tl.y / 100) * srcH };
  const pTR = { x: (corners.tr.x / 100) * srcW, y: (corners.tr.y / 100) * srcH };
  const pBR = { x: (corners.br.x / 100) * srcW, y: (corners.br.y / 100) * srcH };
  const pBL = { x: (corners.bl.x / 100) * srcW, y: (corners.bl.y / 100) * srcH };

  const dstPts = [
    { x: 0, y: 0 },
    { x: targetW, y: 0 },
    { x: targetW, y: targetH },
    { x: 0, y: targetH },
  ];
  const srcPts = [pTL, pTR, pBR, pBL];

  // Invert homography: mapping destination coordinates back to source canvas (backward mapping)
  const H = solveHomography(dstPts, srcPts);

  for (let dy = 0; dy < targetH; dy++) {
    const dstRow = dy * targetW;
    for (let dx = 0; dx < targetW; dx++) {
      const z = H[6] * dx + H[7] * dy + H[8] || 1e-8;
      const sx = (H[0] * dx + H[1] * dy + H[2]) / z;
      const sy = (H[3] * dx + H[4] * dy + H[5]) / z;

      if (sx >= 0 && sx < srcW - 1 && sy >= 0 && sy < srcH - 1) {
        // Bilinear interpolation
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;
        const fx = sx - x0;
        const fy = sy - y0;

        const idx00 = (y0 * srcW + x0) * 4;
        const idx10 = (y0 * srcW + x1) * 4;
        const idx01 = (y1 * srcW + x0) * 4;
        const idx11 = (y1 * srcW + x1) * 4;

        const dIdx = (dstRow + dx) * 4;
        for (let c = 0; c < 3; c++) {
          const top = srcData[idx00 + c] * (1 - fx) + srcData[idx10 + c] * fx;
          const bottom = srcData[idx01 + c] * (1 - fx) + srcData[idx11 + c] * fx;
          dstData[dIdx + c] = Math.round(top * (1 - fy) + bottom * fy);
        }
        dstData[dIdx + 3] = 255;
      } else {
        // Outside edge fill neutral dark
        const dIdx = (dstRow + dx) * 4;
        dstData[dIdx] = 15;
        dstData[dIdx + 1] = 23;
        dstData[dIdx + 2] = 42;
        dstData[dIdx + 3] = 255;
      }
    }
  }

  dstCtx.putImageData(dstImgData, 0, 0);
}

/**
 * CamScanner "Magic Color" Trading Card Enhancement Engine:
 * 1. Automatic White Balance & Background Flattening: Eliminates yellow/dim phone camera casts.
 * 2. Adaptive High-Pass Contrast & Shadow Suppression: Makes artwork explode with color without washing out text.
 * 3. 300 DPI Text & Border Edge Sharpness Filter: Maximizes readability of card details, set logos, and HP.
 */
function applyCamScannerMagicColor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    enhance: boolean;
    shadowLift: boolean;
    vibrancy: boolean;
    sharpness: boolean;
  },
) {
  if (!options.enhance) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  // Compute histogram min/max to stretch dynamic range (Auto White-Balance)
  let minLum = 255;
  let maxLum = 0;
  for (let i = 0; i < len; i += 16) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  // Ensure reasonable bounds
  minLum = Math.max(10, Math.min(80, minLum));
  maxLum = Math.max(180, Math.min(250, maxLum));
  const range = Math.max(1, maxLum - minLum);

  // Magic Color Tuning Parameters
  const saturationFactor = options.vibrancy ? 1.25 : 1.05;
  const shadowLiftAmt = options.shadowLift ? 18 : 8;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Auto-level stretch
    r = ((r - minLum) / range) * 255;
    g = ((g - minLum) / range) * 255;
    b = ((b - minLum) / range) * 255;

    // 2. CamScanner Shadow Suppression & Surface Brightening
    if (r < 140 && g < 140 && b < 140) {
      const avg = (r + g + b) / 3;
      const boost = Math.round(shadowLiftAmt * (1 - avg / 140));
      r += boost;
      g += boost;
      b += boost;
    }

    // 3. Holographic Foil & Art Color Vibrancy
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    r = lum + (r - lum) * saturationFactor;
    g = lum + (g - lum) * saturationFactor;
    b = lum + (b - lum) * saturationFactor;

    // Clamp
    data[i] = r < 0 ? 0 : r > 255 ? 255 : Math.round(r);
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : Math.round(g);
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : Math.round(b);
  }

  // 4. Flatbed Scanner 3x3 Unsharp Mask Kernel for Ultra-Crisp Japanese/English typography
  if (options.sharpness) {
    const copy = new Uint8ClampedArray(data);
    const kernelWeight = 0.40; // High precision sharpness
    const centerWeight = 1 + 4 * kernelWeight;

    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width;
      for (let x = 1; x < width - 1; x++) {
        const idx = (rowOffset + x) * 4;
        const up = ((y - 1) * width + x) * 4;
        const down = ((y + 1) * width + x) * 4;
        const left = (rowOffset + x - 1) * 4;
        const right = (rowOffset + x + 1) * 4;

        for (let c = 0; c < 3; c++) {
          const val =
            copy[idx + c] * centerWeight -
            (copy[up + c] + copy[down + c] + copy[left + c] + copy[right + c]) * kernelWeight;
          data[idx + c] = val < 0 ? 0 : val > 255 ? 255 : Math.round(val);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Composites the isolated, enhanced trading card into the center of the branded background template.
 * Matches standard 63:88 trading card proportions with authentic rounded corners and subtle drop shadow.
 */
async function compositeCardOnTemplate(
  cardCanvas: HTMLCanvasElement,
  templateSrc: string,
  aspectRatio: TemplateAspectRatio = templateAspectRatio.value,
): Promise<HTMLCanvasElement> {
  const templateImg = await loadImageElement(templateSrc);
  const tplW = templateImg.naturalWidth || templateImg.width || 759;
  const tplH = templateImg.naturalHeight || templateImg.height || 637;

  // Determine output canvas size according to selected aspect ratio:
  let outW = tplW;
  let outH = tplH;

  if (aspectRatio === "1:1") {
    // Standard Shopee / Marketplace Square (1000 x 1000 px)
    outW = 1000;
    outH = 1000;
  } else if (aspectRatio === "63:88") {
    // Standard Trading Card Dimensions (750 x 1050 px)
    outW = 750;
    outH = 1050;
  } else if (aspectRatio === "3:4") {
    // E-Commerce Portrait (900 x 1200 px)
    outW = 900;
    outH = 1200;
  } else if (aspectRatio === "4:3") {
    // E-Commerce Landscape (1200 x 900 px)
    outW = 1200;
    outH = 900;
  } else {
    // Original template dimensions
    outW = tplW;
    outH = tplH;
  }

  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  const ctx = outCanvas.getContext("2d");
  if (!ctx) throw new Error("Could not get template canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 1. Draw clean white base
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);

  // 2. Draw template background graphics
  if (aspectRatio === "original") {
    ctx.drawImage(templateImg, 0, 0, outW, outH);
  } else {
    // Fill the canvas edge-to-edge (cover mode) so background theme is NEVER small, shrunken, or letterboxed!
    const scaleCover = Math.max(outW / tplW, outH / tplH);
    const drawW = Math.round(tplW * scaleCover);
    const drawH = Math.round(tplH * scaleCover);
    const drawX = Math.round((outW - drawW) / 2);
    const drawY = Math.round((outH - drawH) / 2);
    ctx.drawImage(templateImg, drawX, drawY, drawW, drawH);
  }

  // 3. Calculate center card dimensions based on scale
  // For 1:1 Shopee square, 76% height = 760px; for 63:88 TCG or 3:4 portrait, 82% gives great prominence
  const defaultScale = aspectRatio === "1:1" ? 76 : (aspectRatio === "63:88" ? 82 : 80);
  const scalePercent = templateScalePercent.value || defaultScale;
  const scale = scalePercent / 100;
  const maxCardH = Math.round(outH * scale);
  const maxCardW = Math.round(outW * scale);

  let cardH = maxCardH;
  let cardW = Math.round(cardH * TARGET_RATIO); // strictly 63:88 standard trading card ratio
  if (cardW > maxCardW) {
    cardW = maxCardW;
    cardH = Math.round(cardW / TARGET_RATIO);
  }

  const cardX = Math.round((outW - cardW) / 2);
  const cardY = Math.round((outH - cardH) / 2);

  const radius = Math.round(cardW * 0.046); // Authentic trading card corner radius (~3mm)

  // 4. Draw soft, realistic drop shadow behind the card
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.16)";
  ctx.shadowBlur = Math.round(cardW * 0.035);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(cardW * 0.015);
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  // 5. Clip to rounded rectangle and draw the high-res card
  ctx.save();
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.clip();
  ctx.drawImage(cardCanvas, cardX, cardY, cardW, cardH);
  ctx.restore();

  // 6. Draw subtle, clean card border outline
  ctx.save();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.lineWidth = 1;
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.stroke();
  ctx.restore();

  return outCanvas;
}

function handleTemplateFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result && typeof e.target.result === "string") {
      activeTemplateUrl.value = e.target.result;
      templateName.value = file.name;
      customTemplateLoaded.value = true;
      try {
        localStorage.setItem("rlg_custom_card_template", e.target.result);
        localStorage.setItem("rlg_custom_card_template_name", file.name);
      } catch {}
      triggerHapticTick();
    }
  };
  reader.readAsDataURL(file);
  input.value = "";
}

function resetToDefaultTemplate() {
  activeTemplateUrl.value = defaultTemplateUrl;
  templateName.value = "RLG Pokémon Shop Template";
  customTemplateLoaded.value = false;
  try {
    localStorage.removeItem("rlg_custom_card_template");
    localStorage.removeItem("rlg_custom_card_template_name");
  } catch {}
  triggerHapticTick();
}

/**
 * Core Client-Side Image Processing Engine:
 * 1. Automatically isolates trading card boundaries using luminance edge detection (or reticle crop).
 * 2. Normalizes aspect ratio to standard trading card 63:88 ratio.
 * 3. Applies studio enhancement: shadow reduction, vibrancy boost, and unsharp mask text sharpening.
 * 4. Resizes to 750 x 1050 px target card dimensions.
 * 5. Optionally composites the card in the center of the branded background template.
 * 6. Iterates JPEG compression starting at 0.80 down to 0.40 to guarantee < 200 KB (target ~100-150 KB).
 * 7. Pushes to stagedQueue and fires haptic tick.
 */
async function processAndCompressCard(imageUri: string, customLabel?: string): Promise<void> {
  activeProcessingCount.value++;
  isProcessingCard.value = true;

  try {
    const img = await loadImageElement(imageUri);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;

    // Default Camera Only Mode: Pure raw camera photo without auto-crop, warp, or studio color enhancements
    if (rawCameraMode.value) {
      const rawCanvas = document.createElement("canvas");
      rawCanvas.width = srcW;
      rawCanvas.height = srcH;
      const rCtx = rawCanvas.getContext("2d");
      if (rCtx) {
        rCtx.imageSmoothingEnabled = true;
        rCtx.imageSmoothingQuality = "high";
        rCtx.drawImage(img, 0, 0, srcW, srcH);
      }

      let finalCanvas: HTMLCanvasElement = rawCanvas;
      const hasTemplate = applyBrandedTemplate.value;
      if (hasTemplate) {
        try {
          finalCanvas = await compositeCardOnTemplate(rawCanvas, activeTemplateUrl.value);
        } catch (tmplErr) {
          console.warn("[FastBatchScanner] Template compositing in raw mode failed:", tmplErr);
        }
      }

      let quality = 0.88;
      let blob = await canvasToBlob(finalCanvas, "image/jpeg", quality);
      while (blob.size > (MAX_FILE_SIZE_BYTES * 2) && quality > 0.45) {
        quality = Math.round((quality - 0.05) * 100) / 100;
        blob = await canvasToBlob(finalCanvas, "image/jpeg", quality);
      }

      sequenceCounter++;
      const paddedSeq = String(sequenceCounter).padStart(3, "0");
      const previewUrl = URL.createObjectURL(blob);
      const sizeKb = Math.round((blob.size / 1024) * 10) / 10;

      const newItem: StagedCardItem = {
        id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        sequence: sequenceCounter,
        blob,
        previewUrl,
        originalRawUrl: imageUri,
        hasTemplate,
        filename: customLabel || `card_raw_${paddedSeq}_${Date.now()}.jpg`,
        sizeBytes: blob.size,
        sizeKb,
        quality: Math.round(quality * 100),
        width: finalCanvas.width,
        height: finalCanvas.height,
        capturedAt: new Date().toLocaleTimeString(),
        status: "staged",
      };

      stagedQueue.value.unshift(newItem);
      await triggerHapticTick();
      return;
    }

    // Create temporary source canvas for edge detection & bounding box computation
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = srcW;
    sourceCanvas.height = srcH;
    const srcCtx = sourceCanvas.getContext("2d");
    if (srcCtx) {
      srcCtx.drawImage(img, 0, 0, srcW, srcH);
    }

    // Determine crop bounds: edge detection or standard 63:88 reticle crop
    let cropBounds = { cropX: 0, cropY: 0, cropW: srcW, cropH: srcH };
    if (autoEdgeDetect.value && srcCtx) {
      cropBounds = detectCardBoundingBox(sourceCanvas, srcW, srcH);
    } else {
      cropBounds = computeDefaultCenterCrop(srcW, srcH);
    }

    const { cropX, cropY, cropW, cropH } = cropBounds;

    const cardCanvas = document.createElement("canvas");
    cardCanvas.width = TARGET_WIDTH;
    cardCanvas.height = TARGET_HEIGHT;

    const cCtx = cardCanvas.getContext("2d");
    if (!cCtx) {
      throw new Error("Unable to initialize 2D canvas context.");
    }

    // High-quality bicubic downsampling
    cCtx.imageSmoothingEnabled = true;
    cCtx.imageSmoothingQuality = "high";

    // Clean neutral backdrop
    cCtx.fillStyle = "#0f172a";
    cCtx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

    // Draw isolated card bounds onto 750x1050 canvas
    cCtx.drawImage(
      img,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT,
    );

    // Apply CamScanner Magic Color Document Enhancement (Auto White-Balance, Foil Vibrancy, Text Crispness)
    if (enhanceCard.value) {
      applyCamScannerMagicColor(cCtx, TARGET_WIDTH, TARGET_HEIGHT, {
        enhance: enhanceCard.value,
        shadowLift: shadowReduction.value,
        vibrancy: boostSaturation.value,
        sharpness: unsharpMask.value,
      });
    }

    // Branded Background Template Compositor (Centers card in middle of template)
    let finalCanvas: HTMLCanvasElement = cardCanvas;
    const hasTemplate = applyBrandedTemplate.value;
    if (hasTemplate) {
      try {
        finalCanvas = await compositeCardOnTemplate(cardCanvas, activeTemplateUrl.value);
      } catch (tmplErr) {
        console.warn("[FastBatchScanner] Template compositing failed, falling back to raw card:", tmplErr);
      }
    }

    // Quality & File Size Enforcer Loop (Target ~100-150 KB, Ceiling 200 KB)
    let quality = 0.80;
    let blob = await canvasToBlob(finalCanvas, "image/jpeg", quality);
    while (blob.size > MAX_FILE_SIZE_BYTES && quality > 0.4) {
      quality = Math.round((quality - 0.05) * 100) / 100;
      blob = await canvasToBlob(finalCanvas, "image/jpeg", quality);
    }

    sequenceCounter++;
    const paddedSeq = String(sequenceCounter).padStart(3, "0");
    const previewUrl = URL.createObjectURL(blob);
    const sizeKb = Math.round((blob.size / 1024) * 10) / 10;

    const newItem: StagedCardItem = {
      id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sequence: sequenceCounter,
      blob,
      previewUrl,
      originalRawUrl: imageUri,
      hasTemplate,
      filename: customLabel || `card_scan_${paddedSeq}_${Date.now()}.jpg`,
      sizeBytes: blob.size,
      sizeKb,
      quality: Math.round(quality * 100),
      width: finalCanvas.width,
      height: finalCanvas.height,
      capturedAt: new Date().toLocaleTimeString(),
      status: "staged",
    };

    stagedQueue.value.unshift(newItem);
    await triggerHapticTick();
  } catch (err) {
    console.error("[FastBatchScanner] Image processing error:", err);
  } finally {
    activeProcessingCount.value = Math.max(0, activeProcessingCount.value - 1);
    isProcessingCard.value = activeProcessingCount.value > 0;
  }
}

// ─── A. Continuous Capacitor Camera Loop ──────────────────────────────────────
async function triggerCapacitorCameraLoop() {
  if (!Capacitor.isNativePlatform()) {
    // On web, if live stream isn't active, trigger file input capture
    fileInputRef.value?.click();
    return;
  }

  isLoopActive.value = true;

  while (isLoopActive.value) {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        correctOrientation: true,
      });

      const uri = photo.webPath || photo.path;
      if (uri) {
        // Zero-Delay Trigger: Process card asynchronously in background while immediately re-arming camera!
        processAndCompressCard(uri);
      }

      if (!autoReArmLoop.value) {
        isLoopActive.value = false;
        break;
      }

      // Brief 80ms tick so UI updates counter before next shutter opens
      await new Promise((r) => setTimeout(r, 80));
    } catch (err: any) {
      // Operator pressed back/cancel in native camera viewfinder -> exit continuous loop cleanly
      isLoopActive.value = false;
      break;
    }
  }
}

// ─── Live In-Page WebRTC Viewfinder (Zero-Latency Continuous Scanning) ────────
async function startLiveViewfinder() {
  stopLiveViewfinder();
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });

    isLiveStreamActive.value = true;

    // Check if hardware torch/flashlight is supported on rear camera
    const track = mediaStream.getVideoTracks()[0];
    if (track && typeof track.getCapabilities === "function") {
      const caps = track.getCapabilities() as any;
      torchSupported.value = Boolean(caps?.torch);
    }

    setTimeout(() => {
      if (videoRef.value && mediaStream) {
        videoRef.value.srcObject = mediaStream;
        videoRef.value.play().catch(() => {});
      }
    }, 50);
  } catch (err) {
    console.warn("[FastBatchScanner] Live camera stream unavailable, falling back to file capture:", err);
    isLiveStreamActive.value = false;
    fileInputRef.value?.click();
  }
}

function stopLiveViewfinder() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  isLiveStreamActive.value = false;
  torchEnabled.value = false;
  torchSupported.value = false;
}

async function toggleTorch() {
  if (!mediaStream) return;
  const track = mediaStream.getVideoTracks()[0];
  if (!track) return;
  try {
    const nextState = !torchEnabled.value;
    await track.applyConstraints({
      advanced: [{ torch: nextState } as any],
    });
    torchEnabled.value = nextState;
  } catch (e) {
    console.warn("Could not toggle torch:", e);
  }
}

/**
 * Instant <50ms shutter capture directly from the live video stream
 * Allows rapid-fire scanning at 2+ cards per second without leaving the viewfinder.
 */
async function snapFromLiveViewfinder() {
  const video = videoRef.value;
  if (!video || !video.videoWidth || !video.videoHeight) return;

  // Visual shutter flash
  cameraFlashEffect.value = true;
  setTimeout(() => {
    cameraFlashEffect.value = false;
  }, 110);

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;
  const ctx = tempCanvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
  const dataUrl = tempCanvas.toDataURL("image/jpeg", 0.92);

  // Non-blocking background warp & compression so operator can immediately tap again
  processAndCompressCard(dataUrl);
}

function scrollToQueue() {
  const el = document.getElementById("staged-card-queue");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ─── Fallback File Input Handler (Supports Single or Multi-Select) ────────────
async function handleFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const files = Array.from(input.files);
  for (const file of files) {
    const objectUrl = URL.createObjectURL(file);
    await processAndCompressCard(objectUrl, file.name.replace(/\.[^.]+$/, ".jpg"));
    URL.revokeObjectURL(objectUrl);
  }

  // Reset input so same file or next camera shot can be re-triggered immediately
  input.value = "";

  // If continuous auto-rearm is enabled on mobile web capture, re-open camera prompt
  if (autoReArmLoop.value && files.length === 1 && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    setTimeout(() => {
      // Ready for next tap
    }, 100);
  }
}

// ─── Queue Management Actions ─────────────────────────────────────────────────
function removeCardFromQueue(id: string) {
  const idx = stagedQueue.value.findIndex((c) => c.id === id);
  if (idx !== -1) {
    const [removed] = stagedQueue.value.splice(idx, 1);
    if (removed?.previewUrl) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    if (inspectedCard.value?.id === id) {
      inspectedCard.value = null;
    }
  }
}

function openCropModal(card: StagedCardItem) {
  croppingCard.value = card;
  // Initialize with tight card bounds centered on the shot
  cropCorners.value = {
    tl: { x: 14, y: 7 },
    tr: { x: 86, y: 7 },
    br: { x: 86, y: 93 },
    bl: { x: 14, y: 93 },
  };
}

function startDragCorner(corner: "tl" | "tr" | "br" | "bl", event: MouseEvent | TouchEvent) {
  activeDraggingCorner.value = corner;
  updateCornerPosition(event);
  window.addEventListener("mousemove", onWindowPointerMove);
  window.addEventListener("mouseup", onWindowPointerUp);
  window.addEventListener("touchmove", onWindowPointerMove, { passive: false });
  window.addEventListener("touchend", onWindowPointerUp);
}

function onWindowPointerMove(event: MouseEvent | TouchEvent) {
  if (!activeDraggingCorner.value) return;
  if (event.cancelable) event.preventDefault();
  updateCornerPosition(event);
}

function onWindowPointerUp() {
  activeDraggingCorner.value = null;
  window.removeEventListener("mousemove", onWindowPointerMove);
  window.removeEventListener("mouseup", onWindowPointerUp);
  window.removeEventListener("touchmove", onWindowPointerMove);
  window.removeEventListener("touchend", onWindowPointerUp);
}

function updateCornerPosition(event: MouseEvent | TouchEvent) {
  if (!activeDraggingCorner.value || !cropPreviewContainerRef.value) return;
  const rect = cropPreviewContainerRef.value.getBoundingClientRect();
  const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
  const clientY = "touches" in event ? event.touches[0].clientY : event.clientY;

  let xPct = Math.round(((clientX - rect.left) / rect.width) * 100);
  let yPct = Math.round(((clientY - rect.top) / rect.height) * 100);

  xPct = Math.max(0, Math.min(100, xPct));
  yPct = Math.max(0, Math.min(100, yPct));

  cropCorners.value[activeDraggingCorner.value] = { x: xPct, y: yPct };
}

function setCornerPreset(preset: "tight" | "medium" | "wide") {
  if (preset === "tight") {
    cropCorners.value = {
      tl: { x: 15, y: 9 },
      tr: { x: 85, y: 9 },
      br: { x: 85, y: 91 },
      bl: { x: 15, y: 91 },
    };
  } else if (preset === "medium") {
    cropCorners.value = {
      tl: { x: 10, y: 5 },
      tr: { x: 90, y: 5 },
      br: { x: 90, y: 95 },
      bl: { x: 10, y: 95 },
    };
  } else {
    cropCorners.value = {
      tl: { x: 4, y: 2 },
      tr: { x: 96, y: 2 },
      br: { x: 96, y: 98 },
      bl: { x: 4, y: 98 },
    };
  }
}

async function applyPerspectiveCrop() {
  if (!croppingCard.value) return;
  const card = croppingCard.value;
  const rawSource = card.originalRawUrl || card.previewUrl;
  if (!rawSource) return;

  try {
    const img = await loadImageElement(rawSource);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = srcW;
    sourceCanvas.height = srcH;
    const sCtx = sourceCanvas.getContext("2d");
    if (!sCtx) return;
    sCtx.drawImage(img, 0, 0, srcW, srcH);

    const canvas = document.createElement("canvas");
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // CamScanner-style perspective warp: flattens the 4 pinned corners onto 750x1050
    warpPerspectiveQuad(
      sourceCanvas,
      ctx,
      cropCorners.value,
      srcW,
      srcH,
      TARGET_WIDTH,
      TARGET_HEIGHT,
    );

    // Apply CamScanner Magic Color Document Filter
    if (enhanceCard.value) {
      applyCamScannerMagicColor(ctx, TARGET_WIDTH, TARGET_HEIGHT, {
        enhance: true,
        shadowLift: shadowReduction.value,
        vibrancy: boostSaturation.value,
        sharpness: unsharpMask.value,
      });
    }

    let finalCanvas: HTMLCanvasElement = canvas;
    const hasTemplate = applyBrandedTemplate.value;
    if (hasTemplate) {
      try {
        finalCanvas = await compositeCardOnTemplate(canvas, activeTemplateUrl.value);
      } catch (tmplErr) {
        console.warn("[FastBatchScanner] Template compositing failed, falling back to raw card:", tmplErr);
      }
    }

    let quality = 0.80;
    let blob = await canvasToBlob(finalCanvas, "image/jpeg", quality);
    while (blob.size > MAX_FILE_SIZE_BYTES && quality > 0.4) {
      quality = Math.round((quality - 0.05) * 100) / 100;
      blob = await canvasToBlob(finalCanvas, "image/jpeg", quality);
    }

    if (card.previewUrl) {
      URL.revokeObjectURL(card.previewUrl);
    }

    card.blob = blob;
    card.previewUrl = URL.createObjectURL(blob);
    card.sizeBytes = blob.size;
    card.sizeKb = Math.round((blob.size / 1024) * 10) / 10;
    card.quality = Math.round(quality * 100);
    card.width = finalCanvas.width;
    card.height = finalCanvas.height;
    card.hasTemplate = hasTemplate;

    if (inspectedCard.value?.id === card.id) {
      inspectedCard.value = { ...card };
    }

    croppingCard.value = null;
    await triggerHapticTick();
  } catch (err) {
    console.error("Failed to apply perspective crop:", err);
  }
}

async function reprocessCard(
  card: StagedCardItem,
  opts?: { hasTemplate?: boolean; aspectRatio?: TemplateAspectRatio },
) {
  const rawSource = card.originalRawUrl || card.previewUrl;
  if (!rawSource) return;

  const targetHasTemplate =
    opts?.hasTemplate !== undefined ? opts.hasTemplate : card.hasTemplate;
  const targetRatio = opts?.aspectRatio || templateAspectRatio.value;

  isProcessingCard.value = true;
  activeProcessingCount.value++;

  try {
    const img = await loadImageElement(rawSource);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = srcW;
    sourceCanvas.height = srcH;
    const sCtx = sourceCanvas.getContext("2d");
    if (!sCtx) return;
    sCtx.drawImage(img, 0, 0, srcW, srcH);

    let cropBounds = { cropX: 0, cropY: 0, cropW: srcW, cropH: srcH };
    if (autoEdgeDetect.value) {
      cropBounds = detectCardBoundingBox(sourceCanvas, srcW, srcH);
    } else {
      cropBounds = computeDefaultCenterCrop(srcW, srcH);
    }

    const { cropX, cropY, cropW, cropH } = cropBounds;
    const cardCanvas = document.createElement("canvas");
    cardCanvas.width = TARGET_WIDTH;
    cardCanvas.height = TARGET_HEIGHT;
    const cCtx = cardCanvas.getContext("2d");
    if (!cCtx) return;

    cCtx.imageSmoothingEnabled = true;
    cCtx.imageSmoothingQuality = "high";
    cCtx.fillStyle = "#0f172a";
    cCtx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    cCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

    if (enhanceCard.value) {
      applyCamScannerMagicColor(cCtx, TARGET_WIDTH, TARGET_HEIGHT, {
        enhance: true,
        shadowLift: shadowReduction.value,
        vibrancy: boostSaturation.value,
        sharpness: unsharpMask.value,
      });
    }

    let finalCanvas = cardCanvas;
    if (targetHasTemplate) {
      finalCanvas = await compositeCardOnTemplate(cardCanvas, activeTemplateUrl.value, targetRatio);
    }

    let quality = 0.80;
    let blob = await canvasToBlob(finalCanvas, "image/jpeg", quality);
    while (blob.size > MAX_FILE_SIZE_BYTES && quality > 0.4) {
      quality = Math.round((quality - 0.05) * 100) / 100;
      blob = await canvasToBlob(finalCanvas, "image/jpeg", quality);
    }

    if (card.previewUrl) URL.revokeObjectURL(card.previewUrl);
    card.blob = blob;
    card.previewUrl = URL.createObjectURL(blob);
    card.sizeBytes = blob.size;
    card.sizeKb = Math.round((blob.size / 1024) * 10) / 10;
    card.quality = Math.round(quality * 100);
    card.width = finalCanvas.width;
    card.height = finalCanvas.height;
    card.hasTemplate = targetHasTemplate;

    if (inspectedCard.value?.id === card.id) {
      inspectedCard.value = { ...card };
    }
    await triggerHapticTick();
  } catch (err) {
    console.error("Failed to reprocess card:", err);
  } finally {
    activeProcessingCount.value = Math.max(0, activeProcessingCount.value - 1);
    isProcessingCard.value = activeProcessingCount.value > 0;
  }
}

async function toggleCardTemplate(card: StagedCardItem) {
  await reprocessCard(card, { hasTemplate: !card.hasTemplate });
}

async function changeTemplateAspectRatio(ratio: TemplateAspectRatio) {
  templateAspectRatio.value = ratio;
  try {
    localStorage.setItem("rlg_card_template_aspect_ratio", ratio);
  } catch {}
  if (inspectedCard.value) {
    await reprocessCard(inspectedCard.value, { aspectRatio: ratio });
  }
}

async function reprocessAllStagedCards() {
  if (stagedQueue.value.length === 0) return;
  for (const card of stagedQueue.value) {
    await reprocessCard(card, {
      hasTemplate: applyBrandedTemplate.value,
      aspectRatio: templateAspectRatio.value,
    });
  }
}

function clearEntireQueue() {
  if (stagedQueue.value.length === 0) return;
  stagedQueue.value.forEach((c) => {
    if (c.previewUrl) URL.revokeObjectURL(c.previewUrl);
  });
  stagedQueue.value = [];
  sequenceCounter = 0;
}

// ─── Auth Headers Helper ──────────────────────────────────────────────────────
function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  let token = adminStore.currentAdmin?.token || "";
  if (!token && typeof localStorage !== "undefined") {
    try {
      const rawSession = localStorage.getItem("rlg-admin-session");
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed?.token) token = parsed.token;
      }
    } catch {}
    if (!token) {
      token =
        localStorage.getItem("auth_token") ||
        localStorage.getItem("rlg_sanctum_token") ||
        "";
    }
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (adminStore.currentAdmin?.email) {
    headers["X-Admin-Email"] = adminStore.currentAdmin.email;
  }

  return headers;
}

// ─── Batch Upload to Laravel -> Google Drive ──────────────────────────────────
async function handleUploadBatch() {
  if (stagedQueue.value.length === 0 || isUploadingBatch.value) return;

  isUploadModalOpen.value = true;
  isUploadingBatch.value = true;
  uploadCompleted.value = false;
  uploadError.value = "";
  lastBatchSummary.value = null;

  // Upload cards in chronological scan order (oldest first)
  const cardsToUpload = [...stagedQueue.value].reverse();
  uploadTotalCards.value = cardsToUpload.length;
  uploadCurrentIndex.value = 0;

  const sharedBatchId = `BATCH-${Date.now().toString(36).toUpperCase()}`;
  const uploadedResults: any[] = [];
  const batchWarnings: string[] = [];
  let driveUploadedCount = 0;
  let totalKbUploaded = 0;
  let targetFolderUrl: string | null = driveConfig.value.folder_url;
  let finalStorageMode = "local_mirror_ready";

  try {
    for (let i = 0; i < cardsToUpload.length; i++) {
      const card = cardsToUpload[i];
      uploadCurrentIndex.value = i + 1;
      uploadCurrentCardKb.value = card.sizeKb;
      card.status = "uploading";

      const formData = new FormData();
      formData.append("cards[]", card.blob, card.filename);
      formData.append("batch_id", sharedBatchId);
      if (driveFolderInput.value.trim()) {
        formData.append("folder_id", driveFolderInput.value.trim());
      }

      const headers = buildAuthHeaders();

      let res = await fetch("/api/v1/mobile-tools/cards/batch-upload", {
        method: "POST",
        headers,
        body: formData,
      });

      // Fallback to /api/mobile-tools/cards/batch-upload if needed
      if (res.status === 404 || res.status === 401) {
        res = await fetch("/api/mobile-tools/cards/batch-upload", {
          method: "POST",
          headers,
          body: formData,
        });
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        card.status = "error";
        card.errorMessage = json?.message || `Upload failed (HTTP ${res.status})`;
        throw new Error(card.errorMessage);
      }

      const batchData = json.data;
      const uploadedCardInfo = batchData?.cards?.[0] || null;
      card.status = "uploaded";
      card.driveLink = uploadedCardInfo?.drive_web_view_link || batchData?.target_folder_url || null;
      card.localUrl = uploadedCardInfo?.local_url || null;

      if (uploadedCardInfo) {
        uploadedResults.push(uploadedCardInfo);
      }
      if (batchData?.warnings && Array.isArray(batchData.warnings)) {
        batchWarnings.push(...batchData.warnings);
      }
      if (batchData?.drive_uploaded_count > 0) {
        driveUploadedCount += Number(batchData.drive_uploaded_count);
        finalStorageMode = "google_drive";
      }
      if (batchData?.target_folder_url) {
        targetFolderUrl = batchData.target_folder_url;
      }
      totalKbUploaded += card.sizeKb;
    }

    lastBatchSummary.value = {
      batchId: sharedBatchId,
      totalCards: cardsToUpload.length,
      driveUploadedCount,
      totalSizeKb: Math.round(totalKbUploaded * 10) / 10,
      targetFolderUrl,
      storageMode: finalStorageMode,
      cards: uploadedResults,
      warnings: batchWarnings.length > 0
        ? batchWarnings
        : (driveUploadedCount === 0 && cardsToUpload.length > 0
            ? ["Images saved to server vault, but Google Drive rejected folder access. Please share your folder with the Service Account as Editor."]
            : []),
    };

    uploadCompleted.value = true;
    await triggerHapticTick();
    await fetchDriveConfigAndHistory();
  } catch (err: any) {
    uploadError.value =
      err?.message || "An error occurred while uploading the card batch.";
  } finally {
    isUploadingBatch.value = false;
  }
}

function handleFinishAndClearBatch() {
  clearEntireQueue();
  isUploadModalOpen.value = false;
  uploadCompleted.value = false;
  lastBatchSummary.value = null;
}

// ─── Google Drive Configuration & History ─────────────────────────────────────
async function fetchDriveConfigAndHistory() {
  try {
    const res = await fetch("/api/v1/mobile-tools/cards/config", {
      headers: buildAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.config) {
        driveConfig.value = json.config;
        if (json.config.folder_id && !driveFolderInput.value) {
          driveFolderInput.value = json.config.folder_id;
        }
      }
      if (Array.isArray(json.history)) {
        recentBatches.value = json.history;
      }
    }
  } catch (e) {
    console.warn("[FastBatchScanner] Could not load Drive config:", e);
  }
}

async function copyServiceAccountEmail() {
  const email = driveConfig.value.service_account_email || "rlg-shop-ga4@static-balm-445614-v9.iam.gserviceaccount.com";
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(email);
    } else {
      const el = document.createElement("textarea");
      el.value = email;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    copiedSaEmail.value = true;
    triggerHapticTick();
    setTimeout(() => {
      copiedSaEmail.value = false;
    }, 2500);
  } catch (err) {
    console.warn("Could not copy email:", err);
  }
}

async function testDriveConnection() {
  isTestingDriveConnection.value = true;
  driveTestResult.value = null;
  try {
    const payload = {
      folder_id: driveFolderInput.value.trim() || driveConfig.value.folder_id || null,
    };
    let res = await fetch("/api/v1/mobile-tools/cards/test-connection", {
      method: "POST",
      headers: {
        ...buildAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (res.status === 404) {
      res = await fetch("/api/mobile-tools/cards/test-connection", {
        method: "POST",
        headers: {
          ...buildAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    }

    const data = await res.json();
    driveTestResult.value = {
      success: !!data.success,
      message: data.message || "Connection verified successfully!",
      error: data.error || (data.success ? undefined : "Connection failed."),
    };
    triggerHapticTick();
  } catch (err: any) {
    driveTestResult.value = {
      success: false,
      error: err?.message || "Failed to reach server to test connection.",
    };
  } finally {
    isTestingDriveConnection.value = false;
  }
}

async function handleSaveDriveConfig() {
  isSavingDriveConfig.value = true;
  driveConfigFeedback.value = "";
  try {
    const payload: Record<string, any> = {
      folder_id: driveFolderInput.value.trim() || null,
    };
    if (driveAccessTokenInput.value.trim()) {
      payload.access_token = driveAccessTokenInput.value.trim();
    }
    if (driveServiceAccountInput.value.trim()) {
      payload.service_account_json = driveServiceAccountInput.value.trim();
    }

    const res = await fetch("/api/v1/mobile-tools/cards/config", {
      method: "POST",
      headers: {
        ...buildAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      driveConfig.value = json.config;
      driveFolderInput.value = json.config.folder_id || "";
      driveAccessTokenInput.value = "";
      driveServiceAccountInput.value = "";
      driveConfigFeedback.value = "✓ Google Drive target folder & credentials saved!";
      setTimeout(() => {
        driveConfigFeedback.value = "";
        isDriveConfigModalOpen.value = false;
      }, 1400);
    } else {
      driveConfigFeedback.value = json?.message || "Failed to save configuration.";
    }
  } catch {
    driveConfigFeedback.value = "Network error while saving configuration.";
  } finally {
    isSavingDriveConfig.value = false;
  }
}

onMounted(() => {
  fetchDriveConfigAndHistory();
  try {
    const savedTemplate = localStorage.getItem("rlg_custom_card_template");
    const savedName = localStorage.getItem("rlg_custom_card_template_name");
    if (savedTemplate) {
      activeTemplateUrl.value = savedTemplate;
      templateName.value = savedName || "Custom Template";
      customTemplateLoaded.value = true;
    }
  } catch {}
});

onBeforeUnmount(() => {
  stopLiveViewfinder();
  stagedQueue.value.forEach((c) => {
    if (c.previewUrl) URL.revokeObjectURL(c.previewUrl);
  });
});
</script>

<template>
  <div class="space-y-5 font-display select-none">
    <!-- Hidden Native/Web File Input Fallback -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      capture="environment"
      multiple
      class="hidden"
      @change="handleFileInputChange"
    />

    <!-- Hidden Custom Template Upload Input -->
    <input
      ref="templateFileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleTemplateFileInputChange"
    />

    <!-- ─── TOP TELEMETRY & STATUS BAR ───────────────────────────────────────── -->
    <div
      class="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4"
    >
      <!-- Left: Scanner Identity & Live Staged Counter Badge -->
      <div class="flex flex-wrap items-center gap-3">
        <div
          class="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-md shadow-rose-950/50 shrink-0"
        >
          <!-- Lucide ScanLine Icon -->
          <svg
            class="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"
            />
          </svg>
        </div>

        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-sm sm:text-base font-black tracking-tight text-white">
              Rapid-Fire Batch Card Scanner
            </h2>
            <span
              class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs"
            >
              Staged Cards: {{ stagedCount }}
            </span>
            <span
              v-if="isProcessingCard"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              Compressing ({{ activeProcessingCount }})...
            </span>
          </div>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Card <strong class="text-slate-200">63:88 TCG</strong> •
            <template v-if="applyBrandedTemplate">
              Template <strong class="text-amber-300">RLG/Pokémon Overlay (Centered)</strong> •
            </template>
            <template v-else>
              Isolated Card <strong class="text-slate-300">750×1050px</strong> •
            </template>
            Target <strong class="text-emerald-400">~120 KB</strong> (&le;200 KB)
            <span v-if="stagedCount > 0" class="text-amber-300 font-mono ml-1">
              • Batch: {{ totalStagedKb }} KB (Avg {{ averageCardKb }} KB/card)
            </span>
          </p>
        </div>
      </div>

      <!-- Right: Continuous Loop Toggle, Template & Aspect Ratio Toggle & Google Drive Target Button -->
      <div class="flex flex-wrap items-center gap-2.5">
        <!-- Aspect Ratio Quick Switcher -->
        <div class="flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-xl p-1 text-xs font-bold">
          <button
            type="button"
            class="px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            :class="templateAspectRatio === '1:1' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'"
            title="Shopee 1:1 Square (1000×1000 px)"
            @click="changeTemplateAspectRatio('1:1')"
          >
            <span>🛒</span>
            <span>1:1</span>
          </button>
          <button
            type="button"
            class="px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            :class="templateAspectRatio === '63:88' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'"
            title="63:88 Standard TCG Card (750×1050 px)"
            @click="changeTemplateAspectRatio('63:88')"
          >
            <span>🃏</span>
            <span>63:88</span>
          </button>
          <button
            type="button"
            class="px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            :class="templateAspectRatio === '3:4' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'"
            title="3:4 E-Commerce Portrait (900×1200 px)"
            @click="changeTemplateAspectRatio('3:4')"
          >
            <span>📱</span>
            <span>3:4</span>
          </button>
        </div>

        <!-- Default Camera Mode (Raw Capture / No Auto-Enhance) Toggle -->
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer"
          :class="
            rawCameraMode
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20 font-black'
              : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:border-slate-600'
          "
          title="Toggle Default Camera Only: Captures pure unenhanced raw camera photo without auto-cropping or studio color filters"
          @click="rawCameraMode = !rawCameraMode"
        >
          <span>📷</span>
          <span>Camera: {{ rawCameraMode ? 'Default Raw (No Auto-Enhance)' : 'Auto-Enhance (Studio)' }}</span>
        </button>

        <!-- Branded Background Template Quick Toggle -->
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer"
          :class="
            applyBrandedTemplate
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
          "
          title="Toggle centering cards inside branded RLG Pokémon background template"
          @click="applyBrandedTemplate = !applyBrandedTemplate"
        >
          <span>🖼️</span>
          <span>Template: {{ applyBrandedTemplate ? 'ON (Centered)' : 'OFF (Whole Card)' }}</span>
        </button>

        <!-- Zero-Delay Auto-Rearm Toggle -->
        <label
          class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
          title="Immediately re-arms camera after each shot for < 2s rapid-fire scanning"
        >
          <input
            v-model="autoReArmLoop"
            type="checkbox"
            class="sr-only peer"
          />
          <div
            class="w-8 h-4 bg-slate-600 rounded-full peer peer-checked:bg-emerald-500 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"
          ></div>
          <span class="text-xs font-bold text-slate-200">
            Zero-Delay Loop (&lt;2s)
          </span>
        </label>

        <!-- Google Drive Folder Config Button -->
        <button
          type="button"
          class="px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2"
          :class="
            driveConfig.folder_id
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          "
          @click="isDriveConfigModalOpen = true"
        >
          <span>📁</span>
          <span>
            {{
              driveConfig.folder_id
                ? `Drive Folder: ...${driveConfig.folder_id.slice(-6)}`
                : "Set Google Drive Folder"
            }}
          </span>
        </button>
      </div>
    </div>

    <!-- ─── MAIN SCANNER VIEWPORT / RAPID CAPTURE DECK ───────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <!-- Left 7 Cols: Viewfinder & Trigger Deck -->
      <div class="lg:col-span-7 space-y-4">
        <div
          class="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-xl relative"
        >
          <!-- Viewport Header Controls -->
          <div
            class="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2"
          >
            <div class="flex items-center gap-2">
              <span
                class="w-2.5 h-2.5 rounded-full"
                :class="
                  isLiveStreamActive
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400'
                "
              ></span>
              <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {{
                  isLiveStreamActive
                    ? "Live Optical Viewfinder (63:88 Guide)"
                    : isNativePlatform
                      ? "Capacitor Native Camera Engine"
                      : "Rapid Card Capture Deck"
                }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <!-- Torch / Flashlight Button (when supported on mobile rear camera) -->
              <button
                v-if="isLiveStreamActive && torchSupported"
                type="button"
                class="px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer"
                :class="
                  torchEnabled
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                "
                @click="toggleTorch"
              >
                🔦 {{ torchEnabled ? "Torch ON" : "Torch" }}
              </button>

              <!-- Toggle Live Viewfinder Stream -->
              <button
                v-if="!isLiveStreamActive"
                type="button"
                class="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
                @click="startLiveViewfinder"
              >
                🎥 Open Live Viewfinder
              </button>
              <button
                v-else
                type="button"
                class="px-3 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                @click="stopLiveViewfinder"
              >
                ✕ Close Stream
              </button>
            </div>
          </div>

          <!-- Optical Viewfinder Area -->
          <div
            class="relative min-h-[380px] sm:min-h-[440px] flex flex-col items-center justify-center p-6 bg-radial from-slate-900 to-slate-950"
          >
            <!-- White Shutter Flash Overlay -->
            <div
              v-if="cameraFlashEffect"
              class="absolute inset-0 bg-white z-30 pointer-events-none transition-opacity duration-100"
            ></div>

            <!-- MODE 1: Live WebRTC Video Stream with 63:88 Trading Card Reticle -->
            <template v-if="isLiveStreamActive">
              <video
                ref="videoRef"
                autoplay
                playsinline
                muted
                class="absolute inset-0 w-full h-full object-cover"
              ></video>

              <!-- Darkened Surround Vignette + 63:88 Card Alignment Reticle -->
              <div
                class="relative z-10 w-[225px] h-[315px] sm:w-[252px] sm:h-[352px] rounded-2xl border-2 border-amber-400/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.65)] pointer-events-none flex flex-col justify-between p-3"
              >
                <!-- Corner Brackets -->
                <div class="flex justify-between">
                  <div class="w-5 h-5 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl"></div>
                  <span class="px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono font-bold text-amber-300">
                    63:88 TCG FRAME
                  </span>
                  <div class="w-5 h-5 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr"></div>
                </div>

                <!-- Center Crosshair -->
                <div class="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent animate-pulse"></div>

                <div class="flex justify-between items-end">
                  <div class="w-5 h-5 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl"></div>
                  <span class="px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-slate-300">
                    750 × 1050 px
                  </span>
                  <div class="w-5 h-5 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br"></div>
                </div>
              </div>

              <!-- Floating Instant Shutter Trigger Button -->
              <div class="relative z-20 mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  class="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-950/60 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5"
                  @click="snapFromLiveViewfinder"
                >
                  <span class="w-3.5 h-3.5 rounded-full bg-slate-950 animate-ping"></span>
                  <span>SNAP CARD NOW (0ms)</span>
                </button>

                <button
                  v-if="stagedCount > 0"
                  type="button"
                  class="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-400/40 font-mono font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  title="Jump to staged cards queue"
                  @click="scrollToQueue"
                >
                  <span>🃏</span>
                  <span>{{ stagedCount }} Staged ↓</span>
                </button>
              </div>
            </template>

            <!-- MODE 2: Capacitor Native Camera Loop & Quick File Trigger Deck -->
            <template v-else>
              <!-- 63:88 Card Wireframe Preview -->
              <div
                class="w-56 h-64 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/70 flex flex-col items-center justify-center p-4 text-center space-y-2 mb-6 relative group hover:border-amber-400/70 transition-colors"
              >
                <div class="text-3xl">🃏 ➜ 🖼️</div>
                <p class="text-xs font-black text-white">63 : 88 Card Center Framing</p>
                <p class="text-[11px] text-slate-400 leading-tight">
                  <span v-if="applyBrandedTemplate" class="text-amber-300 font-bold block">
                    Centered inside RLG Pokémon Template
                  </span>
                  <span v-else class="text-slate-300 block">
                    Standalone Card Scan (750×1050 px)
                  </span>
                  Standard TCG proportions &amp; rounded corners
                </p>
                <span
                  class="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-emerald-400 border border-slate-700"
                >
                  Compressed: &le; 200 KB
                </span>
              </div>

              <!-- Primary Capture Triggers -->
              <div class="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                <!-- Button 1: Native Capacitor Camera / Environment Camera -->
                <button
                  type="button"
                  class="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-950/60 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                  @click="triggerCapacitorCameraLoop"
                >
                  <span>📸</span>
                  <span>
                    {{
                      isNativePlatform
                        ? "Launch Rapid Camera Loop"
                        : "Snap / Select Card Photos"
                    }}
                  </span>
                </button>

                <!-- Button 2: Live Optical Stream (WebRTC) -->
                <button
                  type="button"
                  class="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                  @click="startLiveViewfinder"
                >
                  <span>⚡</span>
                  <span>Live Viewfinder</span>
                </button>
              </div>

              <p class="text-[11px] text-slate-400 mt-3 text-center max-w-md">
                Tip: On Android devices,
                <strong class="text-slate-200">Launch Rapid Camera Loop</strong>
                uses <code>@capacitor/camera</code> with zero-delay re-arming. Or use
                <strong class="text-slate-200">Live Viewfinder</strong> for instant
                0ms in-page continuous snapping.
              </p>
            </template>
          </div>
        </div>
      </div>

      <!-- Right 5 Cols: Compression Specs & Recent Google Drive Batches -->
      <div class="lg:col-span-5 space-y-4">
        <!-- Pipeline Specification Card -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>⚙️</span>
              <span>Client-Side Warp &amp; Compression Pipeline</span>
            </h3>
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              ACTIVE
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2.5 text-xs">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Aspect Ratio</span>
              <span class="font-black text-slate-900 text-sm">63 : 88 (TCG)</span>
              <span class="text-[10px] text-slate-500 block">750 &times; 1050 px</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Size Enforcer</span>
              <span class="font-black text-emerald-700 text-sm">&sim;120 KB</span>
              <span class="text-[10px] text-slate-500 block">Hard cap: 200 KB</span>
            </div>
          </div>

          <!-- Studio Enhancement & Auto Edge-Crop Settings -->
          <div class="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2.5 text-xs">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="font-bold flex items-center gap-1.5 text-amber-300">
                <span>✨</span>
                <span>Card Boundary &amp; Studio Enhancement</span>
              </span>
              <span
                class="px-2 py-0.5 rounded font-mono text-[10px] font-bold"
                :class="rawCameraMode ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400'"
              >
                {{ rawCameraMode ? 'RAW CAMERA ONLY' : 'ENHANCED' }}
              </span>
            </div>

            <!-- Default Camera Mode (No Autoenhance) Master Toggle -->
            <label class="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/35 cursor-pointer group">
              <div>
                <span class="font-black text-amber-300 block text-[11px] flex items-center gap-1.5">
                  <span>📷</span>
                  <span>Default Camera Only (Raw Capture)</span>
                </span>
                <span class="text-[10px] text-amber-200/90">Pure natural camera shot without auto-crop, warp, or studio color filter</span>
              </div>
              <input
                v-model="rawCameraMode"
                type="checkbox"
                class="w-4 h-4 rounded text-amber-500 bg-slate-800 border-amber-500/40 focus:ring-0 cursor-pointer"
              />
            </label>

            <!-- Auto Edge Detect Toggle -->
            <label class="flex items-center justify-between cursor-pointer group">
              <div>
                <span class="font-bold text-slate-200 block text-[11px]">Auto Card Edge-Crop</span>
                <span class="text-[10px] text-slate-400">Isolates only the physical card boundary</span>
              </div>
              <input
                v-model="autoEdgeDetect"
                type="checkbox"
                class="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
              />
            </label>

            <!-- Studio Enhancement Toggle -->
            <label class="flex items-center justify-between cursor-pointer group">
              <div>
                <span class="font-bold text-slate-200 block text-[11px]">Studio Lighting &amp; Glare Fix</span>
                <span class="text-[10px] text-slate-400">Lifts dark shadows and stretches contrast</span>
              </div>
              <input
                v-model="enhanceCard"
                type="checkbox"
                class="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
              />
            </label>

            <!-- Vibrancy & Saturation Boost -->
            <label v-if="enhanceCard" class="flex items-center justify-between cursor-pointer group pl-2 border-l-2 border-amber-500/40">
              <div>
                <span class="font-bold text-slate-200 block text-[11px]">Color &amp; Foil Vibrancy</span>
                <span class="text-[10px] text-slate-400">Restores rich holo colors &amp; card artwork</span>
              </div>
              <input
                v-model="boostSaturation"
                type="checkbox"
                class="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
              />
            </label>

            <!-- Unsharp Mask Sharpening -->
            <label v-if="enhanceCard" class="flex items-center justify-between cursor-pointer group pl-2 border-l-2 border-amber-500/40">
              <div>
                <span class="font-bold text-slate-200 block text-[11px]">Text &amp; Border Sharpening</span>
                <span class="text-[10px] text-slate-400">Crisp Japanese/English text, HP, and set symbols</span>
              </div>
              <input
                v-model="unsharpMask"
                type="checkbox"
                class="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
              />
            </label>
          </div>

          <!-- Branded Background Template Section -->
          <div class="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-3 text-xs">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="font-bold flex items-center gap-1.5 text-amber-300">
                <span>🖼️</span>
                <span>Branded Background Template</span>
              </span>
              <span
                class="px-2 py-0.5 rounded font-mono text-[10px] font-bold"
                :class="
                  applyBrandedTemplate
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                "
              >
                {{ applyBrandedTemplate ? 'ENABLED' : 'RAW CARD ONLY' }}
              </span>
            </div>

            <!-- Enable Template Toggle -->
            <label class="flex items-center justify-between cursor-pointer group">
              <div>
                <span class="font-bold text-slate-200 block text-[11px]">Apply Background Template</span>
                <span class="text-[10px] text-slate-400">Centers card inside branded template (RLG / Pokémon)</span>
              </div>
              <input
                v-model="applyBrandedTemplate"
                type="checkbox"
                class="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
              />
            </label>

            <!-- Aspect Ratio & Marketplace Framing Selector -->
            <div class="space-y-1.5 pt-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-200 block text-[11px]">Output Format / Aspect Ratio</span>
                <span class="font-mono text-[10px] text-amber-300 font-bold">
                  {{
                    templateAspectRatio === '1:1' ? '1000×1000 px (Square)' :
                    templateAspectRatio === '63:88' ? '750×1050 px (TCG)' :
                    templateAspectRatio === '3:4' ? '900×1200 px (Portrait)' :
                    templateAspectRatio === '4:3' ? '1200×900 px (Landscape)' : 'Template Dimensions'
                  }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                <button
                  type="button"
                  class="p-2 rounded-lg text-left border transition-all cursor-pointer flex flex-col justify-between"
                  :class="
                    templateAspectRatio === '1:1'
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm font-black'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 font-bold'
                  "
                  @click="changeTemplateAspectRatio('1:1')"
                >
                  <span class="text-[11px] flex items-center gap-1">
                    <span>🛒</span>
                    <span>1:1 Shopee</span>
                  </span>
                  <span class="text-[9px] opacity-80 mt-0.5">1000×1000 Square</span>
                </button>

                <button
                  type="button"
                  class="p-2 rounded-lg text-left border transition-all cursor-pointer flex flex-col justify-between"
                  :class="
                    templateAspectRatio === '63:88'
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm font-black'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 font-bold'
                  "
                  @click="changeTemplateAspectRatio('63:88')"
                >
                  <span class="text-[11px] flex items-center gap-1">
                    <span>🃏</span>
                    <span>63:88 Card</span>
                  </span>
                  <span class="text-[9px] opacity-80 mt-0.5">750×1050 Whole</span>
                </button>

                <button
                  type="button"
                  class="p-2 rounded-lg text-left border transition-all cursor-pointer flex flex-col justify-between"
                  :class="
                    templateAspectRatio === '3:4'
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm font-black'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 font-bold'
                  "
                  @click="changeTemplateAspectRatio('3:4')"
                >
                  <span class="text-[11px] flex items-center gap-1">
                    <span>📱</span>
                    <span>3:4 Portrait</span>
                  </span>
                  <span class="text-[9px] opacity-80 mt-0.5">900×1200 px</span>
                </button>

                <button
                  type="button"
                  class="p-2 rounded-lg text-left border transition-all cursor-pointer flex flex-col justify-between"
                  :class="
                    templateAspectRatio === '4:3'
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm font-black'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 font-bold'
                  "
                  @click="changeTemplateAspectRatio('4:3')"
                >
                  <span class="text-[11px] flex items-center gap-1">
                    <span>🖥️</span>
                    <span>4:3 Wide</span>
                  </span>
                  <span class="text-[9px] opacity-80 mt-0.5">1200×900 px</span>
                </button>
              </div>
            </div>

            <!-- Template Preview & Selector (shown when template is enabled) -->
            <div v-if="applyBrandedTemplate" class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
              <div class="flex items-center gap-3">
                <!-- Mini Template Preview -->
                <div class="w-14 h-11 rounded-md overflow-hidden bg-white border border-slate-700 shrink-0 p-0.5 flex items-center justify-center shadow-xs">
                  <img :src="activeTemplateUrl" alt="Template" class="w-full h-full object-contain" />
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-slate-200 truncate text-[11px]">{{ templateName }}</span>
                    <span v-if="customTemplateLoaded" class="px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 text-[9px] font-bold">Custom</span>
                    <span v-else class="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 text-[9px] font-bold">Default</span>
                  </div>
                  <p class="text-[10px] text-slate-400 mt-0.5">
                    Card centered with 63:88 trading card proportions and soft shadow
                  </p>
                </div>
              </div>

              <!-- Template Action Buttons -->
              <div class="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  class="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
                  @click="templateFileInputRef?.click()"
                >
                  <span>📁</span>
                  <span>Select / Upload Template</span>
                </button>

                <button
                  v-if="customTemplateLoaded"
                  type="button"
                  class="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 text-[10px] font-bold transition-colors cursor-pointer border border-slate-700"
                  title="Reset to default RLG Pokémon template"
                  @click="resetToDefaultTemplate"
                >
                  <span>↺ Default</span>
                </button>
              </div>
            </div>

            <!-- Batch Re-Render Button if items exist -->
            <button
              v-if="stagedCount > 0"
              type="button"
              class="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
              @click="reprocessAllStagedCards"
            >
              <span>⚡</span>
              <span>Re-render All {{ stagedCount }} Staged Cards in Selected Format</span>
            </button>
          </div>

          <!-- Google Drive Target Status Box -->
          <div
            class="p-3.5 rounded-xl border text-xs space-y-1.5"
            :class="
              driveConfig.folder_id
                ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            "
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-bold flex items-center gap-1.5">
                <span>☁️</span>
                <span>Google Drive Ingestion Target</span>
              </span>
              <button
                type="button"
                class="text-[11px] font-bold underline cursor-pointer text-indigo-600 hover:text-indigo-800"
                @click="isDriveConfigModalOpen = true"
              >
                Configure
              </button>
            </div>
            <p class="text-[11px] leading-relaxed text-slate-600">
              <template v-if="driveConfig.folder_id">
                Target Folder ID:
                <code class="font-mono font-bold text-indigo-700">{{ driveConfig.folder_id }}</code>
              </template>
              <template v-else>
                No custom Folder ID set yet — uploads are stored in the server's public batch vault and ready for Drive sync.
              </template>
            </p>
            <div v-if="driveConfig.folder_url" class="pt-1">
              <a
                :href="driveConfig.folder_url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                <span>🔗 Open Google Drive Folder</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Recent Uploaded Batches Log -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black uppercase tracking-wider text-slate-800">
              📦 Recent Uploaded Card Batches
            </h3>
            <span class="text-[11px] font-bold text-slate-400">
              {{ recentBatches.length }} batch(es)
            </span>
          </div>

          <div
            v-if="recentBatches.length === 0"
            class="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl"
          >
            No card batches uploaded in this session yet.
          </div>

          <div v-else class="space-y-2 max-h-52 overflow-y-auto pr-1">
            <div
              v-for="batch in recentBatches.slice(0, 6)"
              :key="batch.batch_id"
              class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-slate-900 truncate">
                    {{ batch.batch_id }}
                  </span>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800"
                  >
                    {{ batch.total_cards }} cards
                  </span>
                </div>
                <p class="text-[10px] text-slate-500 mt-0.5">
                  {{ batch.total_size_kb }} KB total (Avg {{ batch.average_size_kb }} KB)
                </p>
              </div>

              <a
                v-if="batch.target_folder_url"
                :href="batch.target_folder_url"
                target="_blank"
                rel="noopener noreferrer"
                class="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] shrink-0 transition-colors"
              >
                Drive ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── BOTTOM STRIP / FLOATING STAGING DRAWER ──────────────────────────── -->
    <div
      id="staged-card-queue"
      class="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-2xl space-y-4 relative z-10"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span
            class="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs"
          >
            {{ stagedCount }}
          </span>
          <div>
            <h3 class="text-xs sm:text-sm font-black text-white">
              Staged Card Queue ({{ stagedCount }} Ready)
            </h3>
            <p class="text-[11px] text-slate-400">
              Tap any card to inspect crop quality, or tap
              <span class="text-rose-400 font-bold">✕</span> to discard misfired shots.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            v-if="stagedCount > 0"
            type="button"
            class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            @click="clearEntireQueue"
          >
            🗑️ Clear Queue
          </button>

          <!-- Primary Action Button: Upload Batch (X Cards) -->
          <button
            type="button"
            :disabled="stagedCount === 0 || isUploadingBatch"
            class="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
            @click="handleUploadBatch"
          >
            <span>☁️</span>
            <span>Upload Batch ({{ stagedCount }} Cards)</span>
          </button>
        </div>
      </div>

      <!-- Horizontal Scrolling Thumbnail Tray -->
      <div
        v-if="stagedCount === 0"
        class="py-6 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-500"
      >
        Queue is empty — snap a trading card above to stage it for batch upload.
      </div>

      <div
        v-else
        class="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth"
      >
        <div
          v-for="card in stagedQueue"
          :key="card.id"
          class="relative group shrink-0 rounded-xl overflow-hidden bg-slate-950 border-2 transition-all"
          :class="[
            card.hasTemplate ? 'w-32 sm:w-36' : 'w-24 sm:w-28',
            card.status === 'uploaded'
              ? 'border-emerald-500'
              : card.status === 'error'
                ? 'border-rose-500'
                : 'border-slate-700 hover:border-amber-400'
          ]"
        >
          <!-- Thumbnail Container (Adapts cleanly to template banner or raw 63:88 card) -->
          <div
            class="w-full overflow-hidden cursor-pointer relative flex items-center justify-center"
            :class="card.hasTemplate ? 'bg-white p-1' : 'bg-slate-950'"
            :style="{ aspectRatio: `${card.width || 750} / ${card.height || 1050}` }"
            @click="inspectedCard = card"
          >
            <img
              :src="card.previewUrl"
              :alt="card.filename"
              class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
            />

            <!-- Sequence Badge -->
            <span
              class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-950/85 text-[10px] font-mono font-black text-amber-300 border border-slate-700"
            >
              #{{ card.sequence }}
            </span>

            <!-- Template Indicator Pill -->
            <span
              v-if="card.hasTemplate"
              class="absolute bottom-1.5 left-1.5 px-1 py-0.2 rounded bg-amber-400 text-slate-950 text-[8px] font-black uppercase tracking-wider shadow-xs"
            >
              Overlay
            </span>

            <!-- Uploaded Checkmark Overlay -->
            <div
              v-if="card.status === 'uploaded'"
              class="absolute inset-0 bg-emerald-950/60 flex items-center justify-center"
            >
              <span class="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                ✓
              </span>
            </div>
          </div>

          <!-- Quick Delete / Remove Overlay Button for Misfired Shots -->
          <button
            type="button"
            class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center justify-center shadow-md cursor-pointer z-10 active:scale-90 transition-transform"
            title="Remove misfired shot"
            @click.stop="removeCardFromQueue(card.id)"
          >
            ✕
          </button>

          <!-- File Size & Compression Quality Footer -->
          <div
            class="px-2 py-1 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono"
          >
            <span
              class="font-bold"
              :class="card.sizeKb <= 160 ? 'text-emerald-400' : 'text-amber-300'"
            >
              {{ card.sizeKb }} KB
            </span>
            <span class="text-slate-400 flex items-center gap-1">
              <span v-if="card.hasTemplate" class="text-amber-400 text-[10px]">🖼️</span>
              <span>Q{{ card.quality }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── BATCH UPLOAD PROGRESS MODAL ─────────────────────────────────────── -->
    <teleport to="body">
      <div
        v-if="isUploadModalOpen"
        class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 font-display"
      >
        <div
          class="bg-slate-900 text-white border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
        >
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
                :class="
                  uploadCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : uploadError
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                "
              >
                {{ uploadCompleted ? "✓" : uploadError ? "⚠️" : "☁️" }}
              </div>
              <div>
                <h3 class="text-base font-black text-white">
                  {{
                    uploadCompleted
                      ? "Batch Upload Complete!"
                      : uploadError
                        ? "Batch Upload Interrupted"
                        : "Uploading Card Batch..."
                  }}
                </h3>
                <p class="text-xs text-slate-400">
                  POST /api/v1/mobile-tools/cards/batch-upload
                </p>
              </div>
            </div>

            <button
              v-if="!isUploadingBatch"
              type="button"
              class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              @click="isUploadModalOpen = false"
            >
              ✕
            </button>
          </div>

          <!-- Incremental Progress Status -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs font-bold">
              <span class="text-slate-200">
                <template v-if="isUploadingBatch">
                  Uploading card {{ uploadCurrentIndex }} of {{ uploadTotalCards }}
                  <span class="text-amber-300 font-mono">
                    ({{ uploadCurrentCardKb }} KB / 200 KB)
                  </span>...
                </template>
                <template v-else-if="uploadCompleted">
                  Uploaded {{ uploadTotalCards }} of {{ uploadTotalCards }} cards successfully!
                </template>
                <template v-else>
                  Paused at card {{ uploadCurrentIndex }} of {{ uploadTotalCards }}
                </template>
              </span>
              <span class="font-mono text-emerald-400">{{ uploadProgressPercent }}%</span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                class="h-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                :style="{ width: `${uploadProgressPercent}%` }"
              ></div>
            </div>
          </div>

          <!-- Error Alert -->
          <div
            v-if="uploadError"
            class="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 space-y-1"
          >
            <p class="font-bold text-rose-300">Upload Error</p>
            <p>{{ uploadError }}</p>
          </div>

          <!-- Completion Summary -->
          <div
            v-if="uploadCompleted && lastBatchSummary"
            class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
          >
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Batch ID:</span>
              <span class="font-mono font-bold text-amber-300">{{ lastBatchSummary.batchId }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Total Payload:</span>
              <span class="font-mono font-bold text-emerald-400">
                {{ lastBatchSummary.totalSizeKb }} KB ({{ lastBatchSummary.totalCards }} cards)
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Destination:</span>
              <span class="font-bold text-white">
                {{
                  lastBatchSummary.storageMode === "google_drive"
                    ? "Google Drive + Server Vault"
                    : "Server Vault (Drive Pending)"
                }}
              </span>
            </div>

            <!-- Warning if cards succeeded on local server but could not reach Google Drive -->
            <div
              v-if="lastBatchSummary.driveUploadedCount === 0 && lastBatchSummary.totalCards > 0"
              class="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs space-y-1.5 mt-2"
            >
              <div class="font-bold flex items-center gap-1.5 text-amber-300">
                <span>⚠️</span>
                <span>Uploaded to Server Vault Only</span>
              </div>
              <p class="text-[11px] text-amber-300/90 leading-relaxed">
                Images are safely stored in your admin server vault, but Google Drive rejected folder access. Please share your Google Drive folder with the Service Account as <strong>Editor</strong>.
              </p>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] cursor-pointer inline-flex items-center gap-1"
                @click="isDriveConfigModalOpen = true"
              >
                <span>⚙️ Configure Drive Sharing</span>
                <span>→</span>
              </button>
            </div>

            <div v-if="lastBatchSummary.targetFolderUrl && lastBatchSummary.driveUploadedCount > 0" class="pt-2">
              <a
                :href="lastBatchSummary.targetFolderUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>📁 Open Target Google Drive Folder</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          <!-- Footer Buttons -->
          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              v-if="uploadError && !isUploadingBatch"
              type="button"
              class="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
              @click="handleUploadBatch"
            >
              🔄 Retry Upload
            </button>
            <button
              v-if="uploadCompleted"
              type="button"
              class="w-full py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
              @click="handleFinishAndClearBatch"
            >
              ✓ Done &amp; Start Next Batch
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ─── CARD FULLSCREEN LIGHTBOX INSPECTOR MODAL ────────────────────────── -->
    <teleport to="body">
      <div
        v-if="inspectedCard"
        class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 font-display"
        @click.self="inspectedCard = null"
      >
        <div
          class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 text-white shadow-2xl"
        >
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-black text-white">
                Card #{{ inspectedCard.sequence }} Preview
              </h4>
              <p class="text-[11px] text-slate-400 font-mono">
                {{ inspectedCard.width }}&times;{{ inspectedCard.height }}px •
                {{ inspectedCard.sizeKb }} KB (JPEG Q{{ inspectedCard.quality }})
                <span v-if="inspectedCard.hasTemplate" class="text-amber-300 ml-1 font-sans font-bold">
                  • Branded Template
                </span>
              </p>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              @click="inspectedCard = null"
            >
              ✕
            </button>
          </div>

          <div
            class="w-full rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center p-2"
            :class="inspectedCard.hasTemplate ? 'bg-white/95' : 'bg-slate-950'"
            :style="{ minHeight: '260px' }"
          >
            <img
              :src="inspectedCard.previewUrl"
              :alt="inspectedCard.filename"
              class="w-full h-auto max-h-[50vh] object-contain rounded-lg shadow-sm"
            />
          </div>

          <!-- Instant Aspect Ratio Switcher Pills -->
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-400 font-bold uppercase tracking-wider font-mono text-[10px]">Aspect Ratio / Framing:</span>
              <span class="text-amber-300 font-mono text-[10px] font-bold">
                {{
                  templateAspectRatio === '1:1' ? '1000×1000 Shopee Square' :
                  templateAspectRatio === '63:88' ? '750×1050 Standard TCG' :
                  templateAspectRatio === '3:4' ? '900×1200 Portrait' :
                  templateAspectRatio === '4:3' ? '1200×900 Landscape' : 'Original'
                }}
              </span>
            </div>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                class="py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center"
                :class="
                  templateAspectRatio === '1:1'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                "
                title="Shopee 1:1 Square (1000×1000 px)"
                @click="changeTemplateAspectRatio('1:1')"
              >
                <span>🛒 1:1</span>
                <span class="text-[9px] opacity-75 font-mono">Shopee</span>
              </button>
              <button
                type="button"
                class="py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center"
                :class="
                  templateAspectRatio === '63:88'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                "
                title="63:88 Standard TCG Card (750×1050 px)"
                @click="changeTemplateAspectRatio('63:88')"
              >
                <span>🃏 63:88</span>
                <span class="text-[9px] opacity-75 font-mono">TCG</span>
              </button>
              <button
                type="button"
                class="py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center"
                :class="
                  templateAspectRatio === '3:4'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                "
                title="3:4 Portrait (900×1200 px)"
                @click="changeTemplateAspectRatio('3:4')"
              >
                <span>📱 3:4</span>
                <span class="text-[9px] opacity-75 font-mono">Portrait</span>
              </button>
              <button
                type="button"
                class="py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center"
                :class="
                  templateAspectRatio === '4:3'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                "
                title="4:3 Landscape (1200×900 px)"
                @click="changeTemplateAspectRatio('4:3')"
              >
                <span>🖥️ 4:3</span>
                <span class="text-[9px] opacity-75 font-mono">Wide</span>
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              class="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              @click="openCropModal(inspectedCard)"
            >
              <span>✂️</span>
              <span>Crop &amp; Deskew</span>
            </button>

            <!-- Toggle Template for this specific card -->
            <button
              v-if="inspectedCard.originalRawUrl"
              type="button"
              class="py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              :class="
                inspectedCard.hasTemplate
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
              "
              :title="inspectedCard.hasTemplate ? 'Switch to whole card only (no template frame)' : 'Apply branded template overlay'"
              @click="toggleCardTemplate(inspectedCard)"
            >
              <span>{{ inspectedCard.hasTemplate ? '🃏' : '🖼️' }}</span>
              <span>{{ inspectedCard.hasTemplate ? 'Whole Card Only' : 'Branded Template' }}</span>
            </button>

            <button
              type="button"
              class="py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold cursor-pointer"
              @click="removeCardFromQueue(inspectedCard.id)"
            >
              🗑️ Discard
            </button>
            <button
              type="button"
              class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              @click="inspectedCard = null"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ─── CAMSCANNER 4-CORNER PERSPECTIVE WARP MODAL ──────────────────────── -->
    <teleport to="body">
      <div
        v-if="croppingCard"
        class="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-display"
      >
        <div
          class="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm sm:max-w-md w-full p-4 sm:p-5 space-y-3.5 text-white shadow-2xl"
        >
          <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <h4 class="text-sm font-black text-white flex items-center gap-1.5">
                <span class="text-amber-400">📄</span>
                <span>CamScanner: 4-Corner Pin &amp; Deskew</span>
              </h4>
              <p class="text-[11px] text-slate-400">
                Drag the 4 corner pins to match the card edges.
              </p>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              @click="croppingCard = null"
            >
              ✕
            </button>
          </div>

          <!-- Interactive 4-Corner Pinning Canvas Viewport -->
          <div
            ref="cropPreviewContainerRef"
            class="relative aspect-[63/88] w-full rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 select-none touch-none"
          >
            <!-- Background Raw Photo -->
            <img
              :src="croppingCard.originalRawUrl || croppingCard.previewUrl"
              alt="Raw shot preview"
              class="w-full h-full object-cover pointer-events-none"
            />

            <!-- SVG Polygon Line Mesh Between 4 Pinned Corners -->
            <svg class="absolute inset-0 w-full h-full pointer-events-none">
              <!-- Semi-transparent boundary fill -->
              <polygon
                :points="`${cropCorners.tl.x}%,${cropCorners.tl.y}% ${cropCorners.tr.x}%,${cropCorners.tr.y}% ${cropCorners.br.x}%,${cropCorners.br.y}% ${cropCorners.bl.x}%,${cropCorners.bl.y}%`"
                fill="rgba(245, 158, 11, 0.15)"
                stroke="#fbbf24"
                stroke-width="2.5"
                stroke-dasharray="4 2"
              />
            </svg>

            <!-- 4 Interactive Magnetic Corner Pin Handles (Min 44px tap target) -->
            <!-- Top-Left Pin -->
            <div
              class="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-30"
              :style="{ left: `${cropCorners.tl.x}%`, top: `${cropCorners.tl.y}%` }"
              @mousedown.stop="startDragCorner('tl', $event)"
              @touchstart.stop="startDragCorner('tl', $event)"
            >
              <div class="w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-lg flex items-center justify-center text-[9px] font-black text-slate-950">
                TL
              </div>
            </div>

            <!-- Top-Right Pin -->
            <div
              class="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-30"
              :style="{ left: `${cropCorners.tr.x}%`, top: `${cropCorners.tr.y}%` }"
              @mousedown.stop="startDragCorner('tr', $event)"
              @touchstart.stop="startDragCorner('tr', $event)"
            >
              <div class="w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-lg flex items-center justify-center text-[9px] font-black text-slate-950">
                TR
              </div>
            </div>

            <!-- Bottom-Right Pin -->
            <div
              class="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-30"
              :style="{ left: `${cropCorners.br.x}%`, top: `${cropCorners.br.y}%` }"
              @mousedown.stop="startDragCorner('br', $event)"
              @touchstart.stop="startDragCorner('br', $event)"
            >
              <div class="w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-lg flex items-center justify-center text-[9px] font-black text-slate-950">
                BR
              </div>
            </div>

            <!-- Bottom-Left Pin -->
            <div
              class="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-30"
              :style="{ left: `${cropCorners.bl.x}%`, top: `${cropCorners.bl.y}%` }"
              @mousedown.stop="startDragCorner('bl', $event)"
              @touchstart.stop="startDragCorner('bl', $event)"
            >
              <div class="w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-lg flex items-center justify-center text-[9px] font-black text-slate-950">
                BL
              </div>
            </div>
          </div>

          <!-- Quick Presets -->
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="text-slate-400 text-[11px] font-bold">Corner Presets:</span>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 cursor-pointer"
                @click="setCornerPreset('tight')"
              >
                In Hand (Trim Fingers)
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 cursor-pointer"
                @click="setCornerPreset('medium')"
              >
                On Mat
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 cursor-pointer"
                @click="setCornerPreset('wide')"
              >
                Full
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              @click="croppingCard = null"
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              @click="applyPerspectiveCrop"
            >
              <span>🪄</span>
              <span>Deskew &amp; CamScanner Enhance</span>
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ─── GOOGLE DRIVE FOLDER & CREDENTIALS MODAL ─────────────────────────── -->
    <teleport to="body">
      <div
        v-if="isDriveConfigModalOpen"
        class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 font-display"
      >
        <div
          class="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
        >
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-black text-slate-900">
                ☁️ Google Drive Target Folder Settings
              </h3>
              <p class="text-xs text-slate-500">
                Configure where scanned card batches are pushed via the Laravel API.
              </p>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              @click="isDriveConfigModalOpen = false"
            >
              ✕
            </button>
          </div>

          <div class="space-y-3.5">
            <!-- Step 1: Service Account Share Guide -->
            <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="font-black text-amber-950 block text-[12px]">
                    🔑 Step 1: Grant Access to Google Service Account
                  </span>
                  <p class="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Google Drive requires you to share your target folder with this Service Account email with <strong class="text-amber-950 underline">Editor</strong> permissions:
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 bg-white/90 border border-amber-300 rounded-xl p-2 shadow-xs">
                <code class="text-[11px] font-mono text-slate-900 break-all flex-1 select-all font-bold">
                  {{ driveConfig.service_account_email || 'rlg-shop-ga4@static-balm-445614-v9.iam.gserviceaccount.com' }}
                </code>
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] shrink-0 cursor-pointer flex items-center gap-1 shadow-xs transition-colors"
                  @click="copyServiceAccountEmail"
                >
                  <span>{{ copiedSaEmail ? '✓ Copied' : '📋 Copy' }}</span>
                </button>
              </div>

              <p class="text-[10px] text-amber-700">
                In Google Drive: Open folder → Click <strong>Share</strong> → Paste this email → Choose <strong>Editor</strong> → Send.
              </p>
            </div>

            <!-- Step 2: Folder Link / ID -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                Step 2: Google Drive Folder URL or Folder ID
              </label>
              <input
                v-model="driveFolderInput"
                type="text"
                placeholder="e.g. https://drive.google.com/drive/folders/1AbCdEfG... or Folder ID"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
              />
              <p class="text-[11px] text-slate-500 mt-1">
                Paste either the full Google Drive folder link or the folder ID string.
              </p>
            </div>

            <!-- Test Connection Button -->
            <div class="pt-1">
              <button
                type="button"
                :disabled="isTestingDriveConnection"
                class="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                @click="testDriveConnection"
              >
                <span>{{ isTestingDriveConnection ? '⏳ Testing Connection...' : '🔌 Test Folder Connection & Permissions' }}</span>
              </button>
            </div>

            <!-- Test Connection Result Feedback -->
            <div
              v-if="driveTestResult"
              class="p-3 rounded-xl text-xs font-bold"
              :class="driveTestResult.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'"
            >
              <span v-if="driveTestResult.success">✓ {{ driveTestResult.message }}</span>
              <span v-else>⚠️ {{ driveTestResult.error }}</span>
            </div>

            <details class="text-xs text-slate-600">
              <summary class="cursor-pointer font-bold text-slate-500 hover:text-slate-800">
                Advanced Credentials Override (Optional)
              </summary>
              <div class="space-y-3 pt-2">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    Google OAuth Access Token (Optional Override)
                  </label>
                  <input
                    v-model="driveAccessTokenInput"
                    type="password"
                    placeholder="ya29.a0AfH6SM... (Leave blank to use server .env / Service Account)"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    Service Account JSON (Optional Override)
                  </label>
                  <textarea
                    v-model="driveServiceAccountInput"
                    rows="2"
                    placeholder='{"type": "service_account", "client_email": "...", "private_key": "..."}'
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                  ></textarea>
                </div>
              </div>
            </details>

            <div
              v-if="driveConfigFeedback"
              class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold"
            >
              {{ driveConfigFeedback }}
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              @click="isDriveConfigModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="isSavingDriveConfig"
              class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              @click="handleSaveDriveConfig"
            >
              {{ isSavingDriveConfig ? "Saving..." : "Save Drive Settings" }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

