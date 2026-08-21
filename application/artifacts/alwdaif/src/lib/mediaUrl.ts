export function toDisplayUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/api/objects")) return url;
  return `/api/objects${url.replace(/^\/objects/, "")}`;
}
