import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export function useOnlineTracking() {
  const [location] = useLocation();

  useEffect(() => {
    const sendHeartbeat = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        await fetch("/api/online/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ currentPage: location }),
          keepalive: true,
        });
      } catch (error) {
        // Silently fail - don't interrupt user experience
      }
    };

    // Send heartbeat immediately
    sendHeartbeat();

    // Send heartbeat every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [location]);
}

export function useOnlineCount() {
  return useQuery({
    queryKey: ["/api/online/count"],
    queryFn: async () => {
      const res = await fetch("/api/online/count");
      if (!res.ok) throw new Error("Failed to fetch online count");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000
  });
}
