import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles, Briefcase, Users, TrendingUp, Brain, Clock,
  Calendar, ChevronDown, ChevronUp, AlertCircle, Eye,
  MessageCircle, Heart, MapPin, Building2, ArrowLeft,
  BarChart3, BookOpen, Bell, BellOff, Mail, Loader2,
  PlusCircle, FileText, Flame, Bot, ArrowUpRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

interface TopJob {
  id: number;
  title: string;
  company: string;
  viewCount: number;
  category: string;
  location?: string | null;
}

interface TopEmployerJob {
  id: number;
  title: string;
  company: string;
  region?: string | null;
  city?: string | null;
  viewCount: number;
}

interface TopBlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  viewCount: number;
  category: string;
}

interface TopPost {
  id: number;
  title: string;
  commentsCount: number;
  likesCount: number;
  viewsCount: number;
}

interface StatsData {
  totalJobs: number;
  civilCount: number;
  militaryCount: number;
  companiesCount: number;
  newJobsThisWeek: number;
  totalMembers: number;
  newMembersThisWeek: number;
  totalPosts: number;
  newPostsThisWeek: number;
}

interface WeeklyMarketData {
  topViewedJob: { id: number; title: string; company: string; viewCount: number; category: string } | null;
  topCategory: { key: string; label: string; count: number } | null;
  topCompany: { name: string; count: number; organizationId: number | null } | null;
  employerJobsCount: number;
  newEmployerThisWeek: number;
  newJobsThisWeek: number;
}

interface WeeklySummary {
  id: number;
  weekLabel: string;
  generatedAt: string;
  narrative: string;
  topJobsSection: string;
  topPostsSection: string;
  statsSnapshot: string;
  aiAdvice: string;
  topJobsData?: string | null;
  topPostsData?: string | null;
  statsData?: string | null;
}

const categoryLabel = (cat: string) =>
  cat === "civil" ? "حكومي" : cat === "military" ? "عسكري" : "شركات";

const categoryColor = (cat: string) =>
  cat === "civil"
    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    : cat === "military"
    ? "bg-red-500/10 text-red-600 dark:text-red-400"
    : "bg-green-500/10 text-green-600 dark:text-green-400";

function NextFridayCountdown() {
  const countdown = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilFriday = day === 5 ? 7 : (5 - day + 7) % 7 || 7;
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + daysUntilFriday);
    nextFriday.setHours(13, 0, 0, 0);
    const diffMs = nextFriday.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const dateLabel = nextFriday.toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long" });
    return { diffDays, diffHours, diffMins, dateLabel };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-primary/5 border border-primary/20 text-center">
      <div className="flex items-center gap-2 text-primary font-bold text-sm">
        <Clock className="h-4 w-4" />
        الملخص القادم
      </div>
      <p className="text-xs text-muted-foreground">{countdown.dateLabel} — الساعة 1:00 ظهراً</p>
      <div className="flex items-center gap-3">
        {[
          { value: countdown.diffDays, label: "يوم" },
          { value: countdown.diffHours, label: "ساعة" },
          { value: countdown.diffMins, label: "دقيقة" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center">
            <span className="text-2xl font-black text-foreground w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center shadow-sm">
              {item.value}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">{item.label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/70">يتم التحديث كل جمعة بواسطة الذكاء الاصطناعي</p>
    </div>
  );
}

function StatsGrid({ stats }: { stats: StatsData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "إجمالي الوظائف", value: stats.totalJobs, sub: `+${stats.newJobsThisWeek} هذا الأسبوع`, icon: Briefcase, color: "text-blue-500" },
        { label: "وظائف حكومية", value: stats.civilCount, sub: "مدني وحكومي", icon: Building2, color: "text-blue-600" },
        { label: "وظائف شركات", value: stats.companiesCount, sub: "قطاع خاص", icon: BarChart3, color: "text-green-500" },
        { label: "أعضاء المجتمع", value: stats.totalMembers, sub: `+${stats.newMembersThisWeek} جديد`, icon: Users, color: "text-purple-500" },
      ].map((item) => (
        <div key={item.label} className="p-3 rounded-xl bg-muted/30 border border-border/40 flex flex-col gap-1">
          <item.icon className={`h-4 w-4 ${item.color}`} />
          <span className="text-xl font-black text-foreground">{item.value}</span>
          <span className="text-xs font-semibold text-foreground/80">{item.label}</span>
          <span className="text-[10px] text-muted-foreground">{item.sub}</span>
        </div>
      ))}
    </div>
  );
}

function WeeklyMarketIndicators({ data, statsSnapshot }: { data: WeeklyMarketData; statsSnapshot: string }) {
  const cards = [
    {
      id: "top-viewed",
      icon: Flame,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500/10 border-orange-500/20",
      label: "الأكثر تداولاً هذا الأسبوع",
      value: data.topViewedJob?.title || "—",
      sub: data.topViewedJob?.company || "",
      badge: data.topViewedJob?.viewCount ? `${data.topViewedJob.viewCount.toLocaleString("ar-SA")} مشاهدة` : null,
      href: data.topViewedJob ? `/jobs/post/${data.topViewedJob.id}` : null,
    },
    {
      id: "top-category",
      icon: TrendingUp,
      iconColor: "text-green-500",
      iconBg: "bg-green-500/10 border-green-500/20",
      label: "الفئة الأكثر نشاطاً",
      value: data.topCategory?.label || "—",
      sub: data.topCategory ? `${data.topCategory.count} وظيفة جديدة` : "هذا الأسبوع",
      badge: null,
      href: data.topCategory?.key ? `/jobs/${data.topCategory.key}` : null,
    },
    {
      id: "top-company",
      icon: Building2,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10 border-blue-500/20",
      label: "الجهة الأكثر توظيفاً",
      value: data.topCompany?.name || "—",
      sub: data.topCompany ? `${data.topCompany.count} وظيفة منشورة` : "",
      badge: null,
      href: data.topCompany?.organizationId
        ? `/jobs/organizations/${data.topCompany.organizationId}`
        : data.topCompany?.name
        ? `/jobs?search=${encodeURIComponent(data.topCompany.name)}`
        : null,
    },
    {
      id: "employer-jobs",
      icon: PlusCircle,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500/10 border-purple-500/20",
      label: "وظائف أصحاب العمل",
      value: data.employerJobsCount > 0 ? `${data.employerJobsCount} وظيفة` : "—",
      sub: data.newEmployerThisWeek > 0 ? `+${data.newEmployerThisWeek} جديدة هذا الأسبوع` : "متاحة الآن",
      badge: data.newEmployerThisWeek > 0 ? `${data.newEmployerThisWeek} جديد` : null,
      href: "/jobs/employer",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-black text-foreground">مؤشرات سوق العمل</span>
          <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-bold">AI</span>
        </div>
        <span className="text-[10px] text-muted-foreground">آخر 7 أيام</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(({ id, icon: Icon, iconColor, iconBg, label, value, sub, badge, href }) => {
          const inner = (
            <div className="group relative bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200 h-full" data-testid={`weekly-indicator-${id}`}>
              <div className="flex items-start justify-between mb-2.5">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                {badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-orange-500/10 border-orange-500/20 text-orange-500">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium mb-1">{label}</p>
              <p className="text-foreground font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {value}
              </p>
              {sub && <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{sub}</p>}
              {href && <ArrowUpRight className="absolute bottom-3 left-3 h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />}
            </div>
          );
          return href
            ? <Link key={id} href={href}>{inner}</Link>
            : <div key={id}>{inner}</div>;
        })}
      </div>

    </div>
  );
}

function JobsList({ jobs }: { jobs: TopJob[] }) {
  const filtered = jobs
    .filter(j => j.category === "civil" || j.category === "companies")
    .slice(0, 15);

  if (filtered.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Building2 className="h-4 w-4 text-primary" />
          أبرز الوظائف الحكومية والشركات الكبرى لهذا الأسبوع
        </div>
        <span className="text-xs text-muted-foreground">الأكثر مشاهدة</span>
      </div>
      <div className="space-y-2">
        {filtered.map((job, i) => (
          <Link key={job.id} href={`/jobs/post/${job.id}`} data-testid={`weekly-job-${job.id}`}>
            <div className="group flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/40 hover:bg-accent/60 hover:border-primary/30 transition-all cursor-pointer">
              <span className="text-lg font-black text-muted-foreground/40 w-6 text-center shrink-0 mt-0.5 group-hover:text-primary/60 transition-colors">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-5">
                  {job.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {job.company}
                  </span>
                  {job.location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Badge className={`text-[10px] px-1.5 py-0 border-none font-medium ${categoryColor(job.category)}`}>
                  {categoryLabel(job.category)}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {job.viewCount.toLocaleString("ar-SA")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/jobs" data-testid="all-jobs-link">
        <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-primary/30 text-xs text-primary hover:bg-primary/5 transition-all cursor-pointer">
          <Briefcase className="h-3 w-3" />
          تصفح جميع الوظائف
          <ArrowLeft className="h-3 w-3" />
        </div>
      </Link>
    </div>
  );
}

function EmployerJobsList({ jobs }: { jobs: TopEmployerJob[] }) {
  if (jobs.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <PlusCircle className="h-4 w-4 text-orange-500" />
          أبرز وظائف أصحاب العمل
        </div>
        <span className="text-xs text-muted-foreground">الأكثر مشاهدة</span>
      </div>
      <div className="space-y-2">
        {jobs.map((job, i) => (
          <Link key={job.id} href={`/jobs/employer/${job.id}`} data-testid={`weekly-employer-job-${job.id}`}>
            <div className="group flex items-start gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/15 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all cursor-pointer">
              <span className="text-lg font-black text-muted-foreground/40 w-6 text-center shrink-0 mt-0.5 group-hover:text-orange-500/60 transition-colors">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 leading-5">
                  {job.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {job.company}
                  </span>
                  {(job.city || job.region) && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.city || job.region}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                <Eye className="h-3 w-3" />
                {job.viewCount.toLocaleString("ar-SA")}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/jobs/employer" data-testid="employer-jobs-link">
        <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-orange-500/30 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-500/5 transition-all cursor-pointer">
          <PlusCircle className="h-3 w-3" />
          تصفح جميع وظائف أصحاب العمل
          <ArrowLeft className="h-3 w-3" />
        </div>
      </Link>
    </div>
  );
}

function PostsList({ posts }: { posts: TopPost[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Users className="h-4 w-4 text-primary" />
          أبرز مواضيع المجتمع
        </div>
        <span className="text-xs text-muted-foreground">الترتيب حسب التفاعل</span>
      </div>
      <div className="space-y-2">
        {posts.map((post, i) => (
          <Link key={post.id} href={`/community/post/${post.id}`} data-testid={`weekly-post-${post.id}`}>
            <div className="group flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/40 hover:bg-accent/60 hover:border-primary/30 transition-all cursor-pointer">
              <span className="text-lg font-black text-muted-foreground/40 w-6 text-center shrink-0 mt-0.5 group-hover:text-primary/60 transition-colors">
                {i + 1}
              </span>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex-1 min-w-0 line-clamp-2 leading-5">
                {post.title}
              </p>
              <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-rose-400" />
                  {post.likesCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3 text-blue-400" />
                  {post.commentsCount}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/community" data-testid="community-link">
        <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-primary/30 text-xs text-primary hover:bg-primary/5 transition-all cursor-pointer">
          <BookOpen className="h-3 w-3" />
          تصفح جميع مواضيع المجتمع
          <ArrowLeft className="h-3 w-3" />
        </div>
      </Link>
    </div>
  );
}

function BlogPostsList({ posts }: { posts: TopBlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <FileText className="h-4 w-4 text-violet-500" />
          أبرز المقالات
        </div>
        <span className="text-xs text-muted-foreground">الأكثر قراءة</span>
      </div>
      <div className="space-y-2">
        {posts.map((post, i) => (
          <Link key={post.id} href={`/blog/${post.id}`} data-testid={`weekly-blog-${post.id}`}>
            <div className="group flex items-start gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/15 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all cursor-pointer">
              <span className="text-lg font-black text-muted-foreground/40 w-6 text-center shrink-0 mt-0.5 group-hover:text-violet-500/60 transition-colors">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2 leading-5">
                  {post.title}
                </p>
                {post.excerpt && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{post.excerpt}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                <Eye className="h-3 w-3" />
                {post.viewCount.toLocaleString("ar-SA")}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/blog" data-testid="blog-link">
        <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-violet-500/30 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-500/5 transition-all cursor-pointer">
          <BookOpen className="h-3 w-3" />
          تصفح جميع المقالات
          <ArrowLeft className="h-3 w-3" />
        </div>
      </Link>
    </div>
  );
}

function SummaryCard({ summary, isArchive = false }: { summary: WeeklySummary; isArchive?: boolean }) {
  const [expanded, setExpanded] = useState(!isArchive);

  const topJobs: TopJob[] = useMemo(() => {
    try { return summary.topJobsData ? JSON.parse(summary.topJobsData) : []; }
    catch { return []; }
  }, [summary.topJobsData]);

  const topPosts: TopPost[] = useMemo(() => {
    try { return summary.topPostsData ? JSON.parse(summary.topPostsData) : []; }
    catch { return []; }
  }, [summary.topPostsData]);

  const stats: StatsData | null = useMemo(() => {
    try { return summary.statsData ? JSON.parse(summary.statsData) : null; }
    catch { return null; }
  }, [summary.statsData]);

  const { data: weeklyMarket } = useQuery<WeeklyMarketData | null>({
    queryKey: ["/api/weekly-summary/weekly-market-indicators"],
    queryFn: async () => {
      const res = await fetch("/api/weekly-summary/weekly-market-indicators");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !isArchive,
  });

  const { data: topEmployerJobs = [] } = useQuery<TopEmployerJob[]>({
    queryKey: ["/api/weekly-summary/top-employer-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/weekly-summary/top-employer-jobs");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !isArchive,
  });

  const { data: topBlogPosts = [] } = useQuery<TopBlogPost[]>({
    queryKey: ["/api/weekly-summary/top-blog-posts"],
    queryFn: async () => {
      const res = await fetch("/api/weekly-summary/top-blog-posts");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !isArchive,
  });

  const generatedDate = new Date(summary.generatedAt).toLocaleDateString("ar-SA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <Card className={`border-border overflow-hidden ${isArchive ? "bg-card/60" : "bg-card shadow-lg shadow-black/10"}`}>
      <CardHeader
        className={`border-b border-border/60 ${isArchive ? "py-3 cursor-pointer hover:bg-accent/50 transition-colors" : ""}`}
        onClick={isArchive ? () => setExpanded(!expanded) : undefined}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {!isArchive && (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className={`${isArchive ? "text-sm" : "text-base"} text-foreground`}>
                  {summary.weekLabel}
                </CardTitle>
                {!isArchive && (
                  <Badge className="bg-primary/10 text-primary border-none text-xs shrink-0">
                    أحدث ملخص
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{generatedDate}</p>
            </div>
          </div>
          {isArchive && (
            <button className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-5 space-y-6">
          {/* Narrative */}
          <div className="flex items-start gap-3 bg-gradient-to-r from-primary/8 via-primary/5 to-transparent border border-primary/15 rounded-2xl px-4 py-3">
            <div className="w-7 h-7 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-primary block mb-0.5">تحليل الذكاء الاصطناعي</span>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{summary.narrative}</p>
            </div>
          </div>

          {/* Market Indicators — live for latest, static grid for archive */}
          {!isArchive && weeklyMarket ? (
            <WeeklyMarketIndicators data={weeklyMarket} statsSnapshot={summary.statsSnapshot} />
          ) : (
            <>
              {stats && <StatsGrid stats={stats} />}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-7">{summary.statsSnapshot}</p>
              </div>
            </>
          )}

          {/* Top Gov + Companies Jobs List */}
          {topJobs.length > 0 ? (
            <JobsList jobs={topJobs} />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                أبرز الوظائف الحكومية والشركات الكبرى لهذا الأسبوع
              </div>
              <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                <p className="text-sm text-muted-foreground leading-7">{summary.topJobsSection}</p>
              </div>
            </div>
          )}

          {/* Top Employer Jobs — live, only on latest */}
          {!isArchive && <EmployerJobsList jobs={topEmployerJobs} />}

          {/* Top Community Posts */}
          {topPosts.length > 0 ? (
            <PostsList posts={topPosts} />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Users className="h-4 w-4 text-primary" />
                أبرز مواضيع المجتمع
              </div>
              <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                <p className="text-sm text-muted-foreground leading-7">{summary.topPostsSection}</p>
              </div>
            </div>
          )}

          {/* Top Blog Posts — live, only on latest */}
          {!isArchive && <BlogPostsList posts={topBlogPosts} />}

          {/* AI Advice of the Week */}
          <div className="rounded-xl overflow-hidden border border-amber-500/25">
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/8 border-b border-amber-500/20">
              <Brain className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">نصيحة الأسبوع للباحثين عن عمل</span>
            </div>
            <div className="p-4 bg-amber-500/5">
              <p className="text-sm text-foreground leading-8">{summary.aiAdvice}</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function SubscribeSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authHeaders = useMemo(() => {
    const token = (() => {
      try { return localStorage.getItem("communityToken"); } catch { return null; }
    })();
    return token ? { "X-Community-Token": token } : {};
  }, []);

  const { data: meData } = useQuery<{ authenticated: boolean; member?: any }>({
    queryKey: ["/api/community/me"],
    queryFn: async () => {
      const res = await fetch("/api/community/me", { credentials: "include", headers: authHeaders });
      if (!res.ok) return { authenticated: false };
      return res.json();
    },
  });

  const { data: statusData, isLoading: statusLoading } = useQuery<{ subscribed: boolean; authenticated: boolean }>({
    queryKey: ["/api/weekly-summary/subscription-status"],
    queryFn: async () => {
      const res = await fetch("/api/weekly-summary/subscription-status", { credentials: "include", headers: authHeaders });
      if (!res.ok) return { subscribed: false, authenticated: false };
      return res.json();
    },
  });

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/weekly-summary/subscribers-count"],
    queryFn: async () => {
      const res = await fetch("/api/weekly-summary/subscribers-count");
      if (!res.ok) return { count: 0 };
      return res.json();
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (action: "subscribe" | "unsubscribe") => {
      const res = await fetch(`/api/weekly-summary/${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "فشل العملية");
      }
      return res.json();
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-summary/subscription-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-summary/subscribers-count"] });
      toast({
        title: action === "subscribe" ? "تم الاشتراك بنجاح" : "تم إلغاء الاشتراك",
        description: action === "subscribe"
          ? "ستصلك رسالة بريد إلكتروني كل جمعة عند صدور الملخص الأسبوعي"
          : "لن تصلك رسائل الملخص الأسبوعي بعد الآن",
      });
    },
    onError: (err: Error) => {
      toast({ title: "حدث خطأ", description: err.message, variant: "destructive" });
    },
  });

  const isLoggedIn = meData?.authenticated === true;
  const isSubscribed = statusData?.subscribed ?? false;
  const subscribersCount = countData?.count ?? 0;

  return (
    <div className="flex flex-col items-center gap-2">
      {statusLoading ? (
        <Button variant="outline" size="sm" disabled className="gap-2 text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          جاري التحميل...
        </Button>
      ) : !isLoggedIn ? (
        <Link href="/community/login" data-testid="subscribe-login-link">
          <Button variant="outline" size="sm" className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/5">
            <Mail className="h-3.5 w-3.5" />
            سجّل دخولك للاشتراك في الملخص الأسبوعي
          </Button>
        </Link>
      ) : isSubscribed ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs border-green-500/40 text-green-600 dark:text-green-400 hover:bg-red-500/5 hover:border-red-400/40 hover:text-red-500 transition-all group"
          onClick={() => subscribeMutation.mutate("unsubscribe")}
          disabled={subscribeMutation.isPending}
          data-testid="unsubscribe-button"
        >
          {subscribeMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Bell className="h-3.5 w-3.5 fill-current group-hover:hidden" />
              <BellOff className="h-3.5 w-3.5 hidden group-hover:block" />
            </>
          )}
          <span className="group-hover:hidden">مشترك في الملخص الأسبوعي</span>
          <span className="hidden group-hover:inline">إلغاء الاشتراك</span>
        </Button>
      ) : (
        <Button
          size="sm"
          className="gap-2 text-xs bg-primary hover:bg-primary/90"
          onClick={() => subscribeMutation.mutate("subscribe")}
          disabled={subscribeMutation.isPending}
          data-testid="subscribe-button"
        >
          {subscribeMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Bell className="h-3.5 w-3.5" />
          )}
          اشترك — يصلك كل جمعة
        </Button>
      )}

      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50"
        data-testid="subscribers-count"
      >
        <div className="flex -space-x-1.5 rtl:space-x-reverse">
          {[...Array(Math.min(Math.max(subscribersCount, 1), 4))].map((_, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center"
            >
              <Users className="h-2.5 w-2.5 text-primary" />
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {subscribersCount > 0 ? (
            <>
              <strong className="text-foreground font-semibold">{subscribersCount.toLocaleString("ar-SA")}</strong>
              {" "}مشترك يتلقى الملخص كل جمعة
            </>
          ) : (
            "كن أول مشترك في الملخص الأسبوعي"
          )}
        </span>
      </div>
    </div>
  );
}

export default function WeeklySummaryPage() {
  useEffect(() => {
    document.title = "الملخص الاسبوعي لاعلانات الوظائف في السعودية";
  }, []);

  const { data: latest, isLoading: loadingLatest } = useQuery<WeeklySummary | null>({
    queryKey: ["/api/weekly-summary/latest"],
    queryFn: async () => {
      const res = await fetch("/api/weekly-summary/latest");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: allSummaries = [] } = useQuery<WeeklySummary[]>({
    queryKey: ["/api/weekly-summary/all"],
    queryFn: async () => {
      const res = await fetch("/api/weekly-summary/all");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const archiveSummaries = allSummaries.filter(s => s.id !== latest?.id);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
        {/* Header */}
        <div className="text-center space-y-3 pt-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-black text-foreground">الملخص الأسبوعي</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-6">
            كل جمعة يحلل الذكاء الاصطناعي بيانات المنصة ويُعدّ ملخصاً شاملاً لسوق العمل وأبرز الوظائف ونشاط المجتمع
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge className="bg-primary/10 text-primary border-none gap-1">
              <Brain className="h-3 w-3" />
              مدعوم بالذكاء الاصطناعي
            </Badge>
            <Badge className="bg-muted text-muted-foreground border-none gap-1">
              <Calendar className="h-3 w-3" />
              كل جمعة — 1:00 ظهراً
            </Badge>
          </div>
          <div className="flex justify-center">
            <SubscribeSection />
          </div>
        </div>

        {/* Latest Summary */}
        {loadingLatest ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-12 bg-muted rounded-xl" />
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-24 bg-muted rounded-xl" />
            <div className="h-48 bg-muted rounded-xl" />
          </div>
        ) : latest ? (
          <SummaryCard summary={latest} />
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <AlertCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">لا يوجد ملخص بعد</h3>
                <p className="text-sm text-muted-foreground leading-6">
                  سيصدر الملخص الأسبوعي الأول قريباً. اشترك الآن لتكون أول من يتلقاه.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Countdown to next summary */}
        <NextFridayCountdown />

        {/* Archive */}
        {archiveSummaries.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground font-medium px-2">الأرشيف</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-2">
              {archiveSummaries.map(summary => (
                <SummaryCard key={summary.id} summary={summary} isArchive />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
