import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Eye, Building2, TrendingUp, Sparkles, Bot, ArrowUpRight, Flame, Clock } from "lucide-react";

interface MarketData {
  topViewedJob: { id: number; title: string; company: string; viewCount: number; category: string } | null;
  newestJob: { id: number; title: string; company: string; category: string } | null;
  topCompany: { name: string; count: number; organizationId: number | null } | null;
  topCategory: { key: string; label: string; count: number } | null;
  counts: { total: number; civil: number; military: number; companies: number };
  forecast: string | null;
}

const categoryColors: Record<string, string> = {
  civil: "text-blue-500",
  military: "text-slate-500",
  companies: "text-indigo-500",
};

const categoryBg: Record<string, string> = {
  civil: "bg-blue-500/10 border-blue-500/20",
  military: "bg-slate-500/10 border-slate-500/20",
  companies: "bg-indigo-500/10 border-indigo-500/20",
};

export default function MarketIndicators() {
  const { data, isLoading } = useQuery<MarketData | null>({
    queryKey: ["/api/market-indicators"],
    queryFn: async () => {
      const res = await fetch("/api/market-indicators");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <section className="mb-8" dir="rtl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">مؤشرات سوق العمل</span>
          <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-bold">AI</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
              <div className="h-3 w-16 bg-muted rounded mb-3" />
              <div className="h-5 w-full bg-muted rounded mb-2" />
              <div className="h-3 w-12 bg-muted rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!data) return null;

  const cards = [
    {
      id: "top-viewed",
      icon: Flame,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500/10 border-orange-500/20",
      label: "الأكثر تداولاً",
      value: data.topViewedJob?.title || "—",
      sub: data.topViewedJob?.company || "",
      badge: data.topViewedJob?.viewCount ? `${data.topViewedJob.viewCount.toLocaleString()} مشاهدة` : null,
      badgeColor: "text-orange-500",
      href: data.topViewedJob ? `/jobs/post/${data.topViewedJob.id}` : null,
    },
    {
      id: "top-category",
      icon: TrendingUp,
      iconColor: "text-green-500",
      iconBg: "bg-green-500/10 border-green-500/20",
      label: "الأكثر طلباً",
      value: data.topCategory?.label || "—",
      sub: data.topCategory ? `${data.topCategory.count} وظيفة` : "",
      badge: null,
      badgeColor: "text-green-500",
      href: data.topCategory?.key ? `/jobs/${data.topCategory.key}` : null,
    },
    {
      id: "top-company",
      icon: Building2,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10 border-blue-500/20",
      label: "الأكثر توظيفاً",
      value: data.topCompany?.name || "—",
      sub: data.topCompany ? `${data.topCompany.count} وظيفة منشورة` : "",
      badge: null,
      badgeColor: "text-blue-500",
      href: data.topCompany?.organizationId
        ? `/jobs/organizations/${data.topCompany.organizationId}`
        : data.topCompany?.name
        ? `/jobs?search=${encodeURIComponent(data.topCompany.name)}`
        : "/jobs/organizations",
    },
    {
      id: "newest",
      icon: Clock,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500/10 border-purple-500/20",
      label: "أحدث إضافة",
      value: data.newestJob?.title || "—",
      sub: data.newestJob?.company || "",
      badge: "جديد",
      badgeColor: "text-purple-500",
      href: data.newestJob ? `/jobs/post/${data.newestJob.id}` : null,
    },
  ];

  return (
    <section className="mb-8" dir="rtl" data-testid="section-market-indicators">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-sm md:text-base font-black text-foreground">
            مؤشرات سوق العمل
          </h2>
          <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-bold tracking-wide">
            AI
          </span>
        </div>
        <span className="text-[10px] md:text-xs text-muted-foreground">
          خلال الـ 24 ساعة الماضية
        </span>
      </div>

      {/* 4 indicator cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {cards.map(({ id, icon: Icon, iconColor, iconBg, label, value, sub, badge, badgeColor, href }) => {
          const inner = (
            <div
              className="group relative bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200 h-full"
              data-testid={`card-indicator-${id}`}
            >
              <div className="flex items-start justify-between mb-2.5">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                {badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                    badge === "جديد"
                      ? "bg-purple-500/10 border-purple-500/20 text-purple-500"
                      : "bg-orange-500/10 border-orange-500/20 text-orange-500"
                  }`}>
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium mb-1">{label}</p>
              <p className="text-foreground font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {value}
              </p>
              {sub && (
                <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{sub}</p>
              )}
              {href && (
                <ArrowUpRight className="absolute bottom-3 left-3 h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
              )}
            </div>
          );

          if (!href) return <div key={id}>{inner}</div>;
          if (href.startsWith("/jobs/post/") || href.startsWith("/jobs") || href.startsWith("/org")) {
            return <Link key={id} href={href}>{inner}</Link>;
          }
          return <Link key={id} href={href}>{inner}</Link>;
        })}
      </div>

      {/* AI Forecast bar */}
      {data.forecast && (
        <div
          className="flex items-start gap-3 bg-gradient-to-r from-primary/8 via-primary/5 to-transparent border border-primary/15 rounded-2xl px-4 py-3"
          data-testid="card-indicator-forecast"
        >
          <div className="w-7 h-7 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-primary block mb-0.5">توقع الذكاء الاصطناعي</span>
            <p className="text-sm text-foreground leading-relaxed">{data.forecast}</p>
          </div>
        </div>
      )}
    </section>
  );
}
