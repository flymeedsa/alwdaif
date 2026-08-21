import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminFetch } from "@/lib/adminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase, FileText, Users, MessageSquare, Bell,
  TrendingUp, Building2, Eye, Sparkles, RefreshCw,
  Bot, Star, BarChart3, Activity, BookOpen
} from "lucide-react";

interface AnalyticsData {
  totalJobs: number;
  totalBlogs: number;
  totalOrganizations: number;
  jobs24h: number;
  blogs24h: number;
  communityPosts24h: number;
  communityComments24h: number;
  newMembers24h: number;
  communityPosts7d: number;
  announcements24h: number;
  topJobs: { id: number; title: string; company: string; viewCount: number; category: string }[];
  totalMembers: number;
  totalCvAnalyses: number;
  onlineNow: number;
  categoryBreakdown: Record<string, number>;
}

const CATEGORY_LABELS: Record<string, string> = {
  civil: "مدني",
  military: "عسكري",
  companies: "شركات",
};

function AiButton({ sectionData, focusArea, label }: { sectionData: Record<string, any>; focusArea: string; label: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const res = await adminFetch("/api/admin/analytics/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: sectionData, focusArea }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "خطأ");
      setResult(json.analysis);
    } catch (e: any) {
      setError(e.message || "فشل التحليل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 h-8"
        onClick={analyze}
        disabled={loading}
        data-testid={`button-ai-${focusArea}`}
      >
        {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Bot className="h-3 w-3" />}
        {loading ? "جاري التحليل..." : `تحليل ذكي: ${label}`}
      </Button>

      {open && (
        <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground leading-relaxed whitespace-pre-line">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              يحلل الذكاء الاصطناعي البيانات...
            </div>
          )}
          {error && <span className="text-destructive">{error}</span>}
          {result && !loading && <span>{result}</span>}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "primary",
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  highlight?: boolean;
}) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-500/10 text-green-500",
    blue: "bg-blue-500/10 text-blue-500",
    amber: "bg-amber-500/10 text-amber-500",
    purple: "bg-purple-500/10 text-purple-500",
    rose: "bg-rose-500/10 text-rose-500",
  };

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color] || colorMap.primary}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-2xl font-black text-foreground leading-none">{value.toLocaleString("ar-SA")}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [fullAnalysis, setFullAnalysis] = useState<string | null>(null);
  const [fullLoading, setFullLoading] = useState(false);
  const [fullError, setFullError] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching, isError, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/analytics");
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw new Error(msg || `خطأ ${res.status}`);
      }
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 0,
    retry: 1,
  });

  const runFullAnalysis = async () => {
    if (!data) return;
    setFullLoading(true);
    setFullError(null);
    setFullAnalysis(null);
    try {
      const res = await adminFetch("/api/admin/analytics/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, focusArea: "تحليل شامل لكامل الموقع" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "خطأ");
      setFullAnalysis(json.analysis);
    } catch (e: any) {
      setFullError(e.message || "فشل التحليل");
    } finally {
      setFullLoading(false);
    }
  };

  return (
    <AdminLayout title="التحليل الذكي">
      <div className="flex items-center gap-4 mb-6">
        <a href="/admin/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors inline-flex">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </a>
        <div>
          <h1 className="text-2xl font-bold">التحليل الذكي</h1>
          <p className="text-gray-500 dark:text-gray-400">نظرة شاملة على أداء الموقع مدعومة بالذكاء الاصطناعي</p>
        </div>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            التحليل الذكي
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">نظرة شاملة على أداء الموقع مدعومة بالذكاء الاصطناعي</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh-analytics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <Button
            size="sm"
            className="gap-1.5 h-9 shadow-md shadow-primary/20"
            onClick={runFullAnalysis}
            disabled={fullLoading || !data}
            data-testid="button-full-ai-analysis"
          >
            {fullLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {fullLoading ? "جاري التحليل..." : "تحليل ذكي شامل"}
          </Button>
        </div>
      </div>

      {/* Full AI Result */}
      {(fullAnalysis || fullError || fullLoading) && (
        <div className="mb-6 p-4 rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-sm text-primary">التحليل الذكي الشامل</span>
          </div>
          {fullLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              يحلل الذكاء الاصطناعي كامل بيانات الموقع...
            </div>
          )}
          {fullError && <p className="text-destructive text-sm">{fullError}</p>}
          {fullAnalysis && (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{fullAnalysis}</p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError || !data ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Activity className="h-7 w-7 text-destructive" />
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground mb-1">تعذّر تحميل البيانات</p>
            {error instanceof Error && (
              <p className="text-sm text-muted-foreground max-w-sm">{error.message}</p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1.5" data-testid="button-retry-analytics">
            <RefreshCw className="h-3.5 w-3.5" />
            إعادة المحاولة
          </Button>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Section 1 — نبضة الموقع */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-1 bg-primary rounded-full" />
              <h2 className="font-bold text-base text-foreground">نبضة الموقع — آخر 24 ساعة</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Activity} label="متواجدون (24 ساعة)" value={data.onlineNow} color="green" highlight />
              <StatCard icon={Briefcase} label="وظائف نُشرت اليوم" value={data.jobs24h} color="primary" />
              <StatCard icon={Bell} label="إعلانات أُرسلت" value={data.announcements24h} color="amber" />
              <StatCard icon={Users} label="أعضاء جدد" value={data.newMembers24h} color="purple" />
            </div>
            <AiButton
              sectionData={{
                onlineNow: data.onlineNow,
                jobs24h: data.jobs24h,
                announcements24h: data.announcements24h,
                newMembers24h: data.newMembers24h,
              }}
              focusArea="نبضة الموقع والنشاط اليومي"
              label="النشاط اليومي"
            />
          </section>

          {/* Section 2 — الوظائف */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-1 bg-blue-500 rounded-full" />
              <h2 className="font-bold text-base text-foreground">الوظائف</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatCard icon={Briefcase} label="إجمالي الوظائف المنشورة" value={data.totalJobs} color="blue" />
              <StatCard icon={Building2} label="إجمالي الجهات" value={data.totalOrganizations} color="blue" />
              <StatCard icon={TrendingUp} label="مدني" value={data.categoryBreakdown?.civil ?? 0} sub="وظيفة" color="green" />
              <StatCard icon={TrendingUp} label="عسكري" value={data.categoryBreakdown?.military ?? 0} sub="وظيفة" color="rose" />
            </div>

            {/* Top Jobs */}
            {data.topJobs.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-sm">أكثر الوظائف مشاهدة</span>
                </div>
                <div className="space-y-2">
                  {data.topJobs.map((job, i) => (
                    <div key={job.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0" data-testid={`top-job-${job.id}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.company} · {CATEGORY_LABELS[job.category] || job.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Eye className="h-3 w-3" />
                        {job.viewCount.toLocaleString("ar-SA")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <AiButton
              sectionData={{
                totalJobs: data.totalJobs,
                totalOrganizations: data.totalOrganizations,
                jobs24h: data.jobs24h,
                categoryBreakdown: data.categoryBreakdown,
                topJobs: data.topJobs,
              }}
              focusArea="أداء الوظائف وتوزيعها وأكثرها مشاهدة"
              label="الوظائف"
            />
          </section>

          {/* Section 3 — المحتوى */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-1 bg-amber-500 rounded-full" />
              <h2 className="font-bold text-base text-foreground">المحتوى</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatCard icon={BookOpen} label="مقالات المدونة الإجمالية" value={data.totalBlogs} color="amber" />
              <StatCard icon={FileText} label="مقالات نُشرت اليوم" value={data.blogs24h} color="amber" />
              <StatCard icon={Activity} label="تحليلات السيرة الذاتية" value={data.totalCvAnalyses} color="purple" sub="إجمالي" />
            </div>
            <AiButton
              sectionData={{
                totalBlogs: data.totalBlogs,
                blogs24h: data.blogs24h,
                totalCvAnalyses: data.totalCvAnalyses,
              }}
              focusArea="أداء المحتوى والمدونة وتحليلات السيرة الذاتية"
              label="المحتوى"
            />
          </section>

          {/* Section 4 — المجتمع */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-1 bg-green-500 rounded-full" />
              <h2 className="font-bold text-base text-foreground">المجتمع</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Users} label="إجمالي الأعضاء" value={data.totalMembers} color="green" />
              <StatCard icon={MessageSquare} label="مواضيع جديدة (24 ساعة)" value={data.communityPosts24h} color="green" />
              <StatCard icon={MessageSquare} label="ردود ومشاركات (24 ساعة)" value={data.communityComments24h} color="blue" />
              <StatCard icon={TrendingUp} label="مواضيع آخر 7 أيام" value={data.communityPosts7d} color="purple" />
            </div>
            <AiButton
              sectionData={{
                totalMembers: data.totalMembers,
                newMembers24h: data.newMembers24h,
                communityPosts24h: data.communityPosts24h,
                communityComments24h: data.communityComments24h,
                communityPosts7d: data.communityPosts7d,
              }}
              focusArea="نشاط وتفاعل مجتمع الموقع"
              label="المجتمع"
            />
          </section>

        </div>
      )}
    </AdminLayout>
  );
}
