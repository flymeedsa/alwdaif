import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Megaphone,
  Zap, Shield, Hash, CheckCircle, Clock, Star, Bell,
  Globe, Phone, Send, Award, Rocket, Lock, FileText, Users
} from "lucide-react";
import type { Ad } from "@shared/schema";
import { parseAdMedia } from "@/lib/adIconMap";

/* ─── Interest tracking ─── */
const INTERESTS_KEY = "visitor_interests";

const PAGE_INTERESTS: Record<string, string[]> = {
  "/": ["general"],
  "/jobs": ["civil", "military", "companies"],
  "/results": ["results"],
  "/blog": ["blog"],
  "/community": ["community"],
};

function getInterestsFromPath(path: string): string[] {
  if (path.includes("civil")) return ["civil"];
  if (path.includes("military")) return ["military"];
  if (path.includes("companies") || path.includes("company")) return ["companies"];
  if (path.includes("result")) return ["results"];
  if (path.includes("blog")) return ["blog"];
  if (path.includes("community")) return ["community"];
  for (const [key, interests] of Object.entries(PAGE_INTERESTS))
    if (path === key) return interests;
  return ["general"];
}

function loadInterests(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(INTERESTS_KEY) || "{}"); } catch { return {}; }
}
function saveInterests(i: Record<string, number>) {
  try { localStorage.setItem(INTERESTS_KEY, JSON.stringify(i)); } catch {}
}
function trackPageInterests(path: string) {
  const pi = getInterestsFromPath(path);
  const stored = loadInterests();
  for (const p of pi) stored[p] = (stored[p] || 0) + 1;
  saveInterests(stored);
}
function getTopInterests(limit = 3): string[] {
  return Object.entries(loadInterests())
    .sort((a, b) => b[1] - a[1]).slice(0, limit).map(([i]) => i);
}

/* ─── Icon map (for ad features) ─── */
const ICON_MAP: Record<string, React.ElementType> = {
  Zap, Shield, Hash, CheckCircle, Clock, Star, Bell,
  Globe, Phone, Send, Award, Rocket, Lock, FileText, Users,
};

/* ─── Ad media slot (image or icon) ─── */
function AdMediaSlot({ imageUrl, title, size }: { imageUrl: string; title: string; size: "sm" | "md" | "lg" }) {
  const media = parseAdMedia(imageUrl);
  const dims = size === "sm" ? "w-10 h-10 rounded-xl" : size === "md" ? "w-14 h-14 rounded-2xl" : "w-20 h-20 rounded-2xl";
  const iconSize = size === "sm" ? "h-5 w-5" : size === "md" ? "h-7 w-7" : "h-10 w-10";
  if (!media) return null;
  return (
    <div className={`flex-shrink-0 ${dims} bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center shadow-sm`}>
      {media.type === "image"
        ? <img src={media.url} alt={title} className="w-full h-full object-contain" />
        : media.IconComp
          ? <media.IconComp className={`${iconSize} text-primary`} />
          : null
      }
    </div>
  );
}

interface Feature { icon: React.ElementType | null; text: string; }

function parseFeature(line: string): Feature {
  const trimmed = line.trim();
  if (trimmed.includes("|")) {
    const [iconName, text] = trimmed.split("|", 2);
    const Icon = ICON_MAP[iconName.trim()] || null;
    return { icon: Icon, text: text.trim() };
  }
  return { icon: null, text: trimmed };
}

/* ─── Component ─── */
export default function SmartAdBanner() {
  const [location] = useLocation();
  const [ad, setAd] = useState<Ad | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    trackPageInterests(location);
    fetchAdRef.current?.();
  }, [location]);

  const fetchAdRef = useRef<(() => Promise<void>) | undefined>(undefined);

  fetchAdRef.current = async () => {
    try {
      const interests = getTopInterests(3);
      const params = interests.length ? `?interests=${interests.join(",")}` : "";
      const res = await fetch(`/api/ads/smart${params}`, { cache: "no-store" });
      if (!res.ok) return;
      const data: Ad | null = await res.json();
      if (data) { setAd(data); setVisible(true); }
      else { setAd(null); setVisible(false); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAdRef.current?.();

    const poll = setInterval(() => fetchAdRef.current?.(), 30_000);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === "ads_changed") fetchAdRef.current?.();
        } catch {}
      };
      ws.onclose = () => { reconnectTimer = setTimeout(connect, 5000); };
      ws.onerror = () => { ws?.close(); };
    };

    connect();

    return () => {
      clearInterval(poll);
      ws?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  if (loading || !ad || !visible) return null;

  const features: Feature[] = ad.content
    ? ad.content.split("\n").filter(Boolean).map(parseFeature)
    : [];

  const adAny = ad as any;
  const titleColor: string | undefined = adAny.titleColor || undefined;
  const ctaBg: string | undefined = adAny.ctaBgColor || undefined;
  const ctaFg: string | undefined = adAny.ctaTextColor || undefined;

  const ctaStyle = {
    backgroundColor: ctaBg || "hsl(var(--primary))",
    color: ctaFg || "hsl(var(--primary-foreground))",
  };

  const titleStyle = {
    color: isDark ? "#ffffff" : (titleColor || undefined),
  };

  return (
    <div
      className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4"
      style={{ animation: "adFadeIn 0.35s ease-out" }}
      dir="rtl"
    >
      <style>{`
        @keyframes adFadeIn {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">

        {/* ══════════════════════════════════════
            MOBILE  (< 640px) — WhatsApp-style layout
        ══════════════════════════════════════ */}
        <div className="flex sm:hidden flex-col items-center gap-5 p-6">
          {/* Badge */}
          <div className="self-start">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/8 border border-primary/20 px-2.5 py-1 rounded-full">
              <Megaphone className="h-3 w-3 scale-x-[-1]" />
              إعلان
            </span>
          </div>

          {/* Icon + Text row */}
          <div className="flex items-center gap-4 w-full">
            {ad.imageUrl && (
              <div className="shrink-0">
                <AdMediaSlot imageUrl={ad.imageUrl} title={ad.title} size="lg" />
              </div>
            )}
            <div className="flex-1 min-w-0 text-right">
              <p className="font-bold text-foreground text-lg leading-snug" style={titleStyle}>
                {ad.title}
              </p>
              {ad.description && (
                <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
                  {ad.description}
                </p>
              )}
            </div>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center w-full">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <span key={i} className="inline-flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5 leading-none">
                    {Icon ? <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-primary/70 flex-shrink-0" />}
                    {f.text}
                  </span>
                );
              })}
            </div>
          )}

          {/* CTA Button */}
          {ad.linkUrl && (
            <a
              href={ad.linkUrl} target="_blank" rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 text-base font-bold h-12 px-8 rounded-xl transition-opacity hover:opacity-90 shadow-md"
              style={ctaStyle} data-testid="smart-ad-cta"
            >
              {ad.ctaText || "اعرف أكثر"}
              <ArrowLeft className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* ══════════════════════════════════════
            TABLET  (640px – 1023px) — medium row
        ══════════════════════════════════════ */}
        <div className="hidden sm:flex lg:hidden items-center gap-4 px-5 py-5">
          {ad.imageUrl && <AdMediaSlot imageUrl={ad.imageUrl} title={ad.title} size="md" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/8 border border-primary/20 px-2 py-0.5 rounded-full">
                <Megaphone className="h-3 w-3 scale-x-[-1]" />
                إعلان
              </span>
            </div>
            <h3 className="font-black text-foreground text-base leading-snug" style={titleStyle}>
              {ad.title}
            </h3>
            {ad.description && (
              <p className="text-muted-foreground text-sm mt-1">
                {ad.description}
              </p>
            )}
            {features.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <span key={i} className="inline-flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-full px-2.5 py-1">
                      {Icon ? <Icon className="h-3 w-3 text-primary flex-shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-primary/70 flex-shrink-0" />}
                      {f.text}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          {ad.linkUrl && (
            <div className="flex-shrink-0">
              <a
                href={ad.linkUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-base font-bold px-7 py-3 rounded-xl transition-all hover:opacity-90 hover:scale-[1.03] active:scale-95 whitespace-nowrap shadow-lg"
                style={ctaStyle} data-testid="smart-ad-cta"
              >
                {ad.ctaText || "اعرف أكثر"}
                <ArrowLeft className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════
            DESKTOP  (≥ 1024px) — full/large row
        ══════════════════════════════════════ */}
        <div className="hidden lg:flex items-center gap-6 px-8 py-6">
          {ad.imageUrl && <AdMediaSlot imageUrl={ad.imageUrl} title={ad.title} size="lg" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/8 border border-primary/20 px-2.5 py-1 rounded-full">
                <Megaphone className="h-3 w-3 scale-x-[-1]" />
                إعلان
              </span>
            </div>
            <h3 className="font-black text-foreground text-xl leading-snug" style={titleStyle}>
              {ad.title}
            </h3>
            {ad.description && (
              <p className="text-muted-foreground text-base mt-1.5">
                {ad.description}
              </p>
            )}
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <span key={i} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border rounded-full px-3 py-1.5">
                      {Icon ? <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-primary/70 flex-shrink-0" />}
                      {f.text}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          {ad.linkUrl && (
            <div className="flex-shrink-0">
              <a
                href={ad.linkUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-lg font-bold px-10 py-4 rounded-2xl transition-all hover:opacity-90 hover:scale-[1.04] active:scale-95 whitespace-nowrap shadow-xl"
                style={ctaStyle} data-testid="smart-ad-cta"
              >
                {ad.ctaText || "اعرف أكثر"}
                <ArrowLeft className="h-5 w-5" />
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
