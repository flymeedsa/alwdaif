import { useQuery } from "@tanstack/react-query";
import { getCommunityToken } from "@/lib/queryClient";

async function fetchCommunityMe() {
  const headers: Record<string, string> = {};
  const token = getCommunityToken();
  if (token) headers["X-Community-Token"] = token;

  const res = await fetch("/api/community/me", { credentials: "include", headers });
  const data = await res.json();

  if (data?.authenticated && data?.member) {
    localStorage.setItem("communityMember", JSON.stringify(data.member));
    // Save token returned by server (e.g. for PWA/iOS where cookies are unreliable)
    if (data.token) {
      localStorage.setItem("communityToken", data.token);
    }
  } else {
    // Only clear if no token (avoid wiping on transient failures)
    if (!token) localStorage.removeItem("communityMember");
  }
  return data as { authenticated: boolean; member?: any };
}

/**
 * Unified community auth hook.
 * Always validates against the server — no localStorage fake auth.
 * The server maps authenticated site users to community members automatically.
 */
export function useCommunityAuth() {
  return useQuery<{ authenticated: boolean; member?: any }>({
    queryKey: ["/api/community/me"],
    queryFn: fetchCommunityMe,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
}

/** Alias for backward compatibility */
export function useCommunityMember() {
  return useCommunityAuth();
}
