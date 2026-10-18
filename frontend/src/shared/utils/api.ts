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

/**
 * Standardized Image & Storage Asset URL Resolver
 * 
 * Rules:
 * 1. Empty / null / undefined -> returns ""
 * 2. Blob / Data preview URLs -> returned as-is (in-memory previews before upload)
 * 3. Vite static public frontend assets (/images/..., /assets/..., /logo.) -> returned as-is
 * 4. External third-party URLs (e.g. Unsplash, external CDNs) -> returned as-is
 * 5. Backend storage paths (e.g. /storage/..., storage/..., products/..., or full URLs from
 *    backend / localhost / rlgonlineshop.com) -> normalized to point directly to backend storage.
 *    In production: https://rlgshop-production.up.railway.app/storage/...
 *    In local dev: /storage/... (proxied via Vite dev server)
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

  // Determine backend storage base origin (e.g. "https://rlgshop-production.up.railway.app" or "")
  const backendBase =
    BACKEND_URL ||
    (typeof window !== "undefined" &&
    (window.location.hostname.includes("rlgonlineshop.com") ||
      window.location.protocol === "capacitor:")
      ? RAILWAY_BACKEND_ORIGIN
      : "");

  // 3. Handle full HTTP/HTTPS URLs
  if (/^https?:\/\//i.test(clean)) {
    // A. Localhost dev remnants: http://localhost:8000/storage/..., http://127.0.0.1:8000/storage/...
    const localhostMatch = clean.match(
      /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/storage\/(.*)$/i
    );
    if (localhostMatch) {
      return backendBase
        ? `${backendBase}/storage/${localhostMatch[1]}`
        : `/storage/${localhostMatch[1]}`;
    }

    // B. Pointed to static frontend domain: https://(www.)rlgonlineshop.com/storage/...
    const prodFrontendMatch = clean.match(
      /^https?:\/\/(?:www\.)?rlgonlineshop\.com\/storage\/(.*)$/i
    );
    if (prodFrontendMatch) {
      return backendBase
        ? `${backendBase}/storage/${prodFrontendMatch[1]}`
        : `/storage/${prodFrontendMatch[1]}`;
    }

    // C. Already points to the Railway backend domain: https://rlgshop-production.up.railway.app/storage/...
    const railwayBackendMatch = clean.match(
      /^https?:\/\/rlgshop-production\.up\.railway\.app\/storage\/(.*)$/i
    );
    if (railwayBackendMatch) {
      return clean;
    }

    // D. Any other external image URL (e.g. Unsplash, Cloudinary, etc.) -> keep as-is
    return clean;
  }

  // 4. Relative storage paths
  let relativePath = clean;

  if (relativePath.startsWith("/storage/")) {
    relativePath = relativePath.slice("/storage/".length);
  } else if (relativePath.startsWith("storage/")) {
    relativePath = relativePath.slice("storage/".length);
  } else {
    // Relative folder inside storage disk, e.g. "products/xyz.png" or "/products/xyz.png"
    relativePath = relativePath.replace(/^\/+/, "");
  }

  if (backendBase) {
    return `${backendBase}/storage/${relativePath}`;
  }

  return `/storage/${relativePath}`;
}
