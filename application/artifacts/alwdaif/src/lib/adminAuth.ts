const TOKEN_KEY = "admin_auth_token";

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

function isLocalAdminRequest(input: RequestInfo | URL): boolean {
  const value = input instanceof Request ? input.url : String(input);
  const url = new URL(value, window.location.href);
  return url.origin === window.location.origin && (url.pathname.startsWith("/api/admin/") || isUploadPath(url.pathname));
}

function isUploadPath(path: string): boolean {
  return path === "/api/media/upload" || path === "/api/uploads/request-url" || /^\/api\/uploads\/(local|r2)\/[^/]+$/.test(path);
}

function requestHeaders(input: RequestInfo | URL, init?: RequestInit): Headers {
  return new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
}

/**
 * A fetch wrapper that automatically adds the admin token header.
 */
export function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getAdminToken();
  const headers = requestHeaders(input, init);
  if (token && isLocalAdminRequest(input)) {
    headers.set("x-admin-token", token);
  }
  return fetch(input, { credentials: "include", ...init, headers });
}

/**
 * Patches window.fetch to automatically inject the admin token header
 * for any request to /api/admin/* paths. Call once at app startup.
 */
export function setupAdminFetchInterceptor(): void {
  const originalFetch = window.fetch.bind(window);
  window.fetch = function patchedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (isLocalAdminRequest(input)) {
      const token = getAdminToken();
      const requestUrl = new URL(input instanceof Request ? input.url : String(input), window.location.href);
      let communityToken: string | null = null;
      if (isUploadPath(requestUrl.pathname)) {
        try { communityToken = localStorage.getItem("communityToken"); } catch { /* Storage may be unavailable. */ }
      }
      if (token || communityToken) {
        const headers = requestHeaders(input, init);
        if (token && !headers.has("x-admin-token")) {
          headers.set("x-admin-token", token);
        }
        if (communityToken && !headers.has("x-community-token")) headers.set("x-community-token", communityToken);
        return originalFetch(input, { credentials: "include", ...init, headers });
      }
    }
    return originalFetch(input, init);
  };
}
