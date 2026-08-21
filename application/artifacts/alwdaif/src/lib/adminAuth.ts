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

/**
 * A fetch wrapper that automatically adds the admin token header.
 */
export function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["x-admin-token"] = token;
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
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    if (url.includes("/api/admin/")) {
      const token = getAdminToken();
      if (token) {
        const headers = new Headers((init?.headers as HeadersInit) || {});
        if (!headers.has("x-admin-token")) {
          headers.set("x-admin-token", token);
        }
        return originalFetch(input, { credentials: "include", ...init, headers });
      }
    }
    return originalFetch(input, init);
  };
}
