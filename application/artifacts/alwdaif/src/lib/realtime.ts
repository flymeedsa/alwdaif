import { queryClient } from "./queryClient";

const WS_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`
    : "";

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const eventToQueryKeys: Record<string, string[]> = {
  jobs_changed: ["/api/jobs", "/api/admin/jobs", "/api/jobs/featured"],
  results_changed: ["/api/results", "/api/admin/results"],
  blog_changed: ["/api/blog", "/api/admin/blog"],
  pages_changed: ["/api/pages", "/api/admin/pages"],
  organizations_changed: ["/api/admin/organizations"],
  categories_changed: ["/api/categories", "/api/admin/categories"],
  services_changed: ["/api/services", "/api/admin/services"],
  ads_changed: ["/api/admin/ads"],
  seo_changed: ["/api/admin/seo"],
  settings_changed: ["/api/admin/settings", "/api/admin/site-settings", "/api/homepage-settings"],
  media_changed: ["/api/admin/media"],
  orders_changed: ["/api/admin/service-orders", "/api/admin/job-applications", "/api/community/job-credits", "/api/cv-analysis/usage"],
  community_posts_changed: ["/api/community/posts", "/api/community/stats"],
  community_comments_changed: ["/api/community/posts", "/api/community/stats"],
  community_members_changed: [
    "/api/community/members",
    "/api/community/moderators",
    "/api/community/stats",
    "/api/admin/community/members",
    "/api/admin/community/moderators",
  ],
  notifications_changed: ["/api/community/notifications", "/api/community/notifications/unread-count"],
  favorites_changed: ["/api/community/favorites"],
};

export function connectRealtime() {
  if (ws?.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(WS_URL);

  ws.onmessage = (evt) => {
    try {
      const { event } = JSON.parse(evt.data);
      const keys = eventToQueryKeys[event];
      if (keys) {
        keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      }
    } catch {
      /* ignore malformed messages */
    }
  };

  ws.onclose = () => {
    ws = null;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => connectRealtime(), 3000);
  };

  ws.onerror = () => {
    ws?.close();
  };
}
