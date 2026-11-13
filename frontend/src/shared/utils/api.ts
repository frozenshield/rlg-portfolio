/**
 * Centralized API & Storage URL Resolver
 * Supports VITE_API_BASE_URL, relative proxy routes, and Capacitor mobile environments.
 */

// Canonical Railway backend URL for production
const RAILWAY_BACKEND_ORIGIN = "https://rlgshop-production.up.railway.app";

// 1. Resolve raw API base URL from Vite environment or default fallback
const envApiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

const rawApiBase = (() => {
  // If explicitly configured to a backend URL (and not pointing to the static frontend domain)
  if (envApiUrl && typeof envApiUrl === "string" && !envApiUrl.includes("rlgonlineshop.com")) {
    return envApiUrl;
  }

  // If running on production storefront
  if (
    typeof window !== "undefined" &&
    window.location.hostname.includes("rlgonlineshop.com")
  ) {
    return `${RAILWAY_BACKEND_ORIGIN}/api`;
  }

  // Inside Capacitor Native Webview on mobile devices (targets local PC database via USB / ADB reverse)
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "capacitor:"
  ) {
    return "http://localhost:8000/api";
  }

  // Local development / proxy fallback
  return envApiUrl || "/api";
})();

export const API_BASE_URL = rawApiBase.replace(/\/+$/, "");

// 2. Resolve the Backend Root Origin (without /api)
export const BACKEND_URL = (() => {
  // If API_BASE_URL is a full URL, strip /api
  if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
    const origin = API_BASE_URL.replace(/\/api\/?$/, "");
    if (!origin.includes("rlgonlineshop.com")) {
      return origin;
    }
  }

  // Inside Capacitor Native Webview on mobile devices fallback
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "capacitor:"
  ) {
    return "http://localhost:8000";
  }

  // Production storefront web domain
  if (
    typeof window !== "undefined" &&
    window.location.hostname.includes("rlgonlineshop.com")
  ) {
    return RAILWAY_BACKEND_ORIGIN;
  }

  return "";
})();

/**
 * Resolves any API endpoint path to the full target API URL
 */
export function resolveApiUrl(path: string): string {
  if (!path) return API_BASE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // If path already starts with /api
  if (cleanPath.startsWith("/api")) {
    const subPath = cleanPath.slice(4); // everything after /api
    return `${API_BASE_URL}${subPath.startsWith("/") ? subPath : `/${subPath}`}`;
  }

  return `${API_BASE_URL}${cleanPath}`;
}

// Canonical Cloudflare R2 public bucket URL for product images
export const CLOUDFLARE_R2_URL =
  import.meta.env.VITE_CLOUDFLARE_R2_URL ||
  "https://pub-f25cefd3a5a349788bf015e8d7ab04e2.r2.dev";

/**
 * Standardized Image & Storage Asset URL Resolver
 * 
 * Rules:
 * 1. Empty / null / undefined -> returns ""
 * 2. Blob / Data preview URLs -> returned as-is (in-memory previews before upload)
 * 3. Vite static public frontend assets (/images/..., /assets/..., /logo.) -> returned as-is
 * 4. Cloudflare R2 URLs (e.g. *.r2.dev, cloudflarestorage.com, or custom R2 CDN) -> returned as-is with HTTPS
 * 5. Migrated product images (products/..., /storage/products/..., or old Railway/localhost product URLs)
 *    -> automatically mapped to Cloudflare R2 public URL
 * 6. External third-party URLs (e.g. Unsplash, external CDNs) -> returned as-is
 * 7. Non-product backend storage paths -> normalized to backend storage
 */
export function resolveStorageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return "";
  }

  const clean = url.trim();

  // 1. Data URLs & Blob URLs (in-memory previews)
  if (clean.startsWith("data:") || clean.startsWith("blob:")) {
    return clean;
  }

  // 2. Vite static public frontend assets
  if (
    clean.startsWith("/images/") ||
    clean.startsWith("/assets/") ||
    clean.startsWith("/logo.") ||
    clean.startsWith("images/") ||
    clean.startsWith("assets/")
  ) {
    return clean.startsWith("/") ? clean : `/${clean}`;
  }

  const r2Base = CLOUDFLARE_R2_URL.replace(/\/+$/, "");

  // 3. Already pointing to Cloudflare R2
  if (
    clean.includes("r2.dev") ||
    clean.includes("cloudflarestorage.com") ||
    clean.startsWith(r2Base)
  ) {
    return clean.replace(/^http:\/\//i, "https://");
  }

  // 4. Product images migrated to Cloudflare R2
  // Matches any path ending with products/{filename} from old storage, localhost, or Railway
  const productMatch = clean.match(/(?:^|\/)(?:storage\/)?(products\/[^\s?#]+)/i);
  if (productMatch && productMatch[1]) {
    const productRelPath = productMatch[1].replace(/^\/+/, "");
    return `${r2Base}/${productRelPath}`;
  }

  // 5. Determine backend storage base origin for other assets
  const backendBase =
    BACKEND_URL ||
    (typeof window !== "undefined" &&
    (window.location.hostname.includes("rlgonlineshop.com") ||
      window.location.protocol === "capacitor:")
      ? RAILWAY_BACKEND_ORIGIN
      : "");

  // 6. Handle full HTTP/HTTPS URLs
  if (/^https?:\/\//i.test(clean)) {
    // Localhost dev remnants: http://localhost:8000/storage/...
    const localhostMatch = clean.match(
      /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/storage\/(.*)$/i
    );
    if (localhostMatch) {
      return backendBase
        ? `${backendBase}/storage/${localhostMatch[1]}`
        : `/storage/${localhostMatch[1]}`;
    }

    // Pointed to static frontend domain: https://(www.)rlgonlineshop.com/storage/...
    const prodFrontendMatch = clean.match(
      /^https?:\/\/(?:www\.)?rlgonlineshop\.com\/storage\/(.*)$/i
    );
    if (prodFrontendMatch) {
      return backendBase
        ? `${backendBase}/storage/${prodFrontendMatch[1]}`
        : `/storage/${prodFrontendMatch[1]}`;
    }

    // Keep third-party URLs as-is
    return clean.replace(/^http:\/\//i, "https://");
  }

  // 7. Relative storage paths for non-product assets
  let relativePath = clean;

  if (relativePath.startsWith("/storage/")) {
    relativePath = relativePath.slice("/storage/".length);
  } else if (relativePath.startsWith("storage/")) {
    relativePath = relativePath.slice("storage/".length);
  } else {
    relativePath = relativePath.replace(/^\/+/, "");
  }

  if (backendBase) {
    return `${backendBase}/storage/${relativePath}`;
  }

  return `/storage/${relativePath}`;
}
