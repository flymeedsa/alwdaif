import AdminLayout from "@/components/admin/AdminLayout";
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase, FileText, Building2, TrendingUp, ShoppingCart, Package,
  Image, Clock, CheckCircle, XCircle, AlertCircle, ArrowUpRight,
  BarChart3, Activity, Users, MessageSquare, Flag, Megaphone,
  MonitorPlay, Search, Settings, GraduationCap, Layout, Plus,
  PenLine, Radio, Home, Power, ShieldCheck, Newspaper, Eye, Star,
  ChevronLeft, HelpCircle, Users2, LineChart, Cog, BookOpen,
  Building, FileBarChart, HeadphonesIcon, BadgeCheck, Wrench,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { adminFetch } from "@/lib/adminAuth";

interface CommunityStats {
  membersCount: number;
  postsCount: number;
  commentsCount: number;
  onlineCount: number;
  totalPosts: number;
  totalCategories: number;
  totalMembers: number;
  totalModerators: number;
  totalPermissions: number;
  totalReports: number;
  pendingReports: number;
  totalModeratorRequests: number;
  pendingModeratorRequests: number;
}

export default function AdminDashboard() {
  const { data: profile } = useQuery({
    queryKey: ["/api/admin/profile"],
    queryFn: () => adminFetch("/api/admin/profile").then(r => r.json()),
    staleTime: 0,
  });

  const { data: jobsData = [] } = useQuery({
    queryKey: ["/api/admin/jobs"],
    queryFn: () => fetch("/api/admin/jobs", { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const { data: resultsData = [] } = useQuery({
    queryKey: ["/api/admin/results"],
    queryFn: () => fetch("/api/admin/results", { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const { data: blogData = [] } = useQuery({
    queryKey: ["/api/admin/blog"],
    queryFn: () => fetch("/api/admin/blog", { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const { data: orgsData = [] } = useQuery({
    queryKey: ["/api/admin/organizations"],
    queryFn: () => fetch("/api/admin/organizations", { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const { data: ordersData = [] } = useQuery({
    queryKey: ["/api/admin/service-orders"],
    queryFn: () => fetch("/api/admin/service-orders", { credentials: "include" }).then(r => r.ok ? r.json() : []),
    refetchInterval: 30000,
  });

  const { data: servicesData = [] } = useQuery({
    queryKey: ["/api/admin/services"],
    queryFn: () => fetch("/api/admin/services", { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const { data: mediaData = [] } = useQuery({
    queryKey: ["/api/admin/media"],
    queryFn: () => fetch("/api/admin/media", { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const { data: adsData = [] } = useQuery({
    queryKey: ["/api/admin/ads"],
    queryFn: () => fetch("/api/admin/ads", { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const { data: pagesData = [] } = useQuery({
    queryKey: ["/api/admin/pages"],
    queryFn: () => fetch("/api/admin/pages", { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const { data: announcementsData = [] } = useQuery({
    queryKey: ["/api/admin/announcements"],
    queryFn: () => fetch("/api/admin/announcements", { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const { data: communityStats } = useQuery<CommunityStats>({
    queryKey: ["/api/admin/community/stats"],
    queryFn: () => fetch("/api/admin/community/stats", { credentials: "include" }).then(r => r.ok ? r.json() : null),
    refetchInterval: 60000,
  });

  const { data: adminsData = [] } = useQuery({
    queryKey: ["/api/admin/admins"],
    queryFn: () => fetch("/api/admin/admins", { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const { data: supportCount } = useQuery<{ openComplaints: number; totalOpen: number }>({
    queryKey: ["/api/admin/support/open-count"],
    queryFn: () => fetch("/api/admin/support/open-count", { credentials: "include" }).then(r => r.ok ? r.json() : { openComplaints: 0, totalOpen: 0 }),
    refetchInterval: 30000,
  });

  const { data: faqData = [] } = useQuery({
    queryKey: ["/api/admin/faq"],
    queryFn: () => fetch("/api/admin/faq", { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const { data: employerJobsData = [] } = useQuery({
    queryKey: ["/api/employer-jobs"],
    queryFn: () => fetch("/api/employer-jobs?limit=1000").then(r => r.ok ? r.json() : []),
  });

  const jobs       = Array.isArray(jobsData) ? jobsData : [];
  const results    = Array.isArray(resultsData) ? resultsData : [];
  const blog       = Array.isArray(blogData) ? blogData : [];
  const orgs       = Array.isArray(orgsData) ? orgsData : [];
  const orders     = Array.isArray(ordersData) ? ordersData : [];
  const services   = Array.isArray(servicesData) ? servicesData : [];
  const media      = Array.isArray(mediaData) ? mediaData : [];
  const ads        = Array.isArray(adsData) ? adsData : [];
  const pages      = Array.isArray(pagesData) ? pagesData : [];
  const announcements = Array.isArray(announcementsData) ? announcementsData : [];
  const admins     = Array.isArray(adminsData) ? adminsData : [];
  const faq        = Array.isArray(faqData) ? faqData : [];
  const employerJobs = Array.isArray(employerJobsData) ? employerJobsData : [];
  const openTickets = supportCount?.totalOpen ?? 0;

  // Jobs stats
  const publishedJobs  = jobs.filter((j: any) => j.status === "published").length;
  const draftJobs      = jobs.filter((j: any) => j.status === "draft").length;
  const trashJobs      = jobs.filter((j: any) => j.status === "trash").length;
  const civilJobs      = jobs.filter((j: any) => j.category === "civil").length;
  const militaryJobs   = jobs.filter((j: any) => j.category === "military").length;
  const companyJobs    = jobs.filter((j: any) => j.category === "company" || j.category === "companies").length;

  // Results stats
  const publishedResults = results.filter((r: any) => r.status === "published").length;

  // Blog stats
  const publishedBlog = blog.filter((p: any) => p.status === "published").length;
  const draftBlog     = blog.filter((p: any) => p.status === "draft").length;

  // Orders stats
  const pendingOrders    = orders.filter((o: any) => o.status === "pending").length;
  const inProgressOrders = orders.filter((o: any) => o.status === "in_progress").length;
  const completedOrders  = orders.filter((o: any) => o.status === "completed").length;
  const totalRevenue     = orders
    .filter((o: any) => o.status === "completed" || o.status === "in_progress")
    .reduce((s: number, o: any) => s + (o.amount || 0), 0);

  // Org stats
  const govOrgs  = orgs.filter((o: any) => o.type === "government").length;
  const milOrgs  = orgs.filter((o: any) => o.type === "military").length;
  const privOrgs = orgs.filter((o: any) => o.type === "company").length;

  // Services / Ads
  const activeServices = services.filter((s: any) => s.isActive).length;
  const activeAds      = ads.filter((a: any) => a.isActive).length;

  // Community
  const cs = communityStats ?? {
    membersCount: 0, postsCount: 0, commentsCount: 0, onlineCount: 0,
    totalPosts: 0, totalCategories: 0, totalMembers: 0, totalModerators: 0,
    totalPermissions: 0, totalReports: 0, pendingReports: 0,
    totalModeratorRequests: 0, pendingModeratorRequests: 0,
  };

  const recentJobs   = [...jobs].slice(0, 5);
  const recentOrders = [...orders].slice(0, 5);
  const recentBlog   = [...blog].slice(0, 4);

  const getOrderBadge = (status: string) => {
    switch (status) {
      case "pending":     return { label: "قيد المراجعة", cls: "bg-amber-500/15 text-amber-500 border-amber-500/25" };
      case "confirmed":   return { label: "مؤكد",         cls: "bg-blue-500/15 text-blue-500 border-blue-500/25" };
      case "in_progress": return { label: "جاري التنفيذ", cls: "bg-indigo-500/15 text-indigo-500 border-indigo-500/25" };
      case "completed":   return { label: "مكتمل",        cls: "bg-green-500/15 text-green-500 border-green-500/25" };
      case "cancelled":   return { label: "ملغي",         cls: "bg-red-500/15 text-red-500 border-red-500/25" };
      default:            return { label: status,          cls: "bg-muted text-muted-foreground border-border" };
    }
  };

  const getJobBadge = (status: string) => {
    if (status === "published") return "bg-green-500/15 text-green-500 border-green-500/25";
    if (status === "draft")     return "bg-amber-500/15 text-amber-500 border-amber-500/25";
    return "bg-red-500/15 text-red-500 border-red-500/25";
  };

  const getJobLabel = (status: string) => {
    if (status === "published") return "منشور";
    if (status === "draft")     return "مسودة";
    return "محذوف";
  };

  const quickLinks = [
    { label: "الوظائف",       href: "/admin/jobs-hub/jobs",          icon: Briefcase,    from: "from-blue-500",    to: "to-blue-600" },
    { label: "الأعضاء",       href: "/admin/members",                icon: Users2,       from: "from-pink-500",    to: "to-pink-600" },
    { label: "الدعم الفني",   href: "/admin/support",                icon: HelpCircle,   from: "from-red-500",     to: "to-red-600" },
    ...(FEATURE_FLAGS.services ? [
      { label: "المتجر", href: "/admin/store", icon: ShoppingCart, from: "from-amber-500", to: "to-amber-600" },
      { label: "الخدمات", href: "/admin/store/services", icon: Package, from: "from-cyan-500", to: "to-cyan-600" },
    ] : []),
    ...(FEATURE_FLAGS.community ? [{ label: "المجتمع", href: "/admin/community", icon: Users, from: "from-rose-500", to: "to-rose-600" }] : []),
    { label: "نتائج التوظيف", href: "/admin/jobs-hub/results",       icon: CheckCircle,  from: "from-emerald-500", to: "to-emerald-600" },
    { label: "الجهات",        href: "/admin/jobs-hub/organizations", icon: Building2,    from: "from-orange-500",  to: "to-orange-600" },
    { label: "المدونة",       href: "/admin/blog",                   icon: FileText,     from: "from-purple-500",  to: "to-purple-600" },
    { label: "الفريق",        href: "/admin/staff",                  icon: ShieldCheck,  from: "from-green-500",   to: "to-green-600" },
    { label: "إعلانات الإدارة", href: "/admin/settings/announcements", icon: Megaphone,    from: "from-yellow-500",  to: "to-yellow-600" },
    { label: "الإعدادات",     href: "/admin/settings",               icon: Settings,     from: "from-zinc-500",    to: "to-zinc-600" },
  ];

  return (
    <AdminLayout title="نظرة عامة">
      <div className="space-y-6">

        {/* ① Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-blue-600/5 rounded-2xl p-6 border border-primary/20">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">مرحباً، {profile?.name || "مشرف"}</h2>
                <p className="text-muted-foreground text-sm">{format(new Date(), "EEEE، dd MMMM yyyy", { locale: ar })}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/admin/jobs-hub/jobs/new">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow shadow-blue-500/20 gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> وظيفة جديدة
                </Button>
              </Link>
              <Link href="/admin/blog/new">
                <Button size="sm" variant="outline" className="gap-1.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                  <PenLine className="h-3.5 w-3.5" /> مقال جديد
                </Button>
              </Link>
              {FEATURE_FLAGS.community && <Link href="/admin/community/posts">
                <Button size="sm" variant="outline" className="gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                  <MessageSquare className="h-3.5 w-3.5" /> المجتمع
                </Button>
              </Link>}
            </div>
          </div>
        </div>

        {/* ① Quick Links — All Sections */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              الوصول السريع لجميع الأقسام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
              {quickLinks.map(link => (
                <Link key={link.label} href={link.href}>
                  <div className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/40 hover:bg-muted/80 border border-border/50 hover:border-primary/30 transition-all cursor-pointer">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${link.from} ${link.to} shadow-sm`}>
                      <link.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground font-medium text-center transition-colors leading-tight">{link.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ② 5 Big KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

          {/* Jobs KPI */}
          <Link href="/admin/jobs-hub/jobs">
            <Card className="hover:border-blue-500/40 transition-all cursor-pointer group relative overflow-hidden h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Briefcase className="h-6 w-6 text-blue-500" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="text-3xl font-black text-blue-500 mb-1">{jobs.length}</div>
                <div className="text-foreground font-bold text-base">الوظائف</div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-medium">{publishedJobs} منشورة</span>
                  <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-medium">{draftJobs} مسودة</span>
                  <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-medium">{results.length} نتيجة</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Community KPI */}
          {FEATURE_FLAGS.community && <Link href="/admin/community">
            <Card className="hover:border-rose-500/40 transition-all cursor-pointer group relative overflow-hidden h-full">
              {(cs.pendingReports > 0 || cs.pendingModeratorRequests > 0) && (
                <div className="absolute top-3 left-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-rose-500/10">
                    <Users className="h-6 w-6 text-rose-500" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-rose-500 transition-colors" />
                </div>
                <div className="text-3xl font-black text-rose-500 mb-1">{cs.totalMembers ?? 0}</div>
                <div className="text-foreground font-bold text-base">المجتمع</div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="text-xs bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full font-medium">{cs.postsCount ?? 0} موضوع</span>
                  {(cs.pendingReports ?? 0) > 0 && (
                    <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-medium animate-pulse">{cs.pendingReports} بلاغ</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>}

          {/* Store KPI */}
          {FEATURE_FLAGS.services && <Link href="/admin/store">
            <Card className="hover:border-amber-500/40 transition-all cursor-pointer group relative overflow-hidden h-full">
              {pendingOrders > 0 && (
                <div className="absolute top-3 left-3 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
              )}
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <ShoppingCart className="h-6 w-6 text-amber-500" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-amber-500 transition-colors" />
                </div>
                <div className="text-3xl font-black text-amber-500 mb-1">{totalRevenue.toLocaleString()}</div>
                <div className="text-foreground font-bold text-base">الإيرادات (ر.س)</div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-medium">{orders.length} طلب</span>
                  {pendingOrders > 0 && (
                    <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-medium">{pendingOrders} معلق</span>
                  )}
                  <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-medium">{completedOrders} مكتمل</span>
                </div>
              </CardContent>
            </Card>
          </Link>}

          {/* Content KPI */}
          <Link href="/admin/blog">
            <Card className="hover:border-purple-500/40 transition-all cursor-pointer group relative overflow-hidden h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <FileText className="h-6 w-6 text-purple-500" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-purple-500 transition-colors" />
                </div>
                <div className="text-3xl font-black text-purple-500 mb-1">{blog.length}</div>
                <div className="text-foreground font-bold text-base">المحتوى</div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full font-medium">{publishedBlog} منشور</span>
                  <span className="text-xs bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded-full font-medium">{pages.length} صفحة</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Staff & Support KPI */}
          <Link href="/admin/staff">
            <Card className="hover:border-green-500/40 transition-all cursor-pointer group relative overflow-hidden h-full">
              {openTickets > 0 && (
                <div className="absolute top-3 left-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <ShieldCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-green-500 transition-colors" />
                </div>
                <div className="text-3xl font-black text-green-500 mb-1">{admins.length}</div>
                <div className="text-foreground font-bold text-base">الفريق</div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-medium">{admins.length} مشرف</span>
                  {openTickets > 0 && (
                    <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-medium">{openTickets} تذكرة</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* ③ Detailed Section Breakdown — 3 medium cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Jobs Detail */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  إحصائيات الوظائف
                </CardTitle>
                <Link href="/admin/jobs-hub/jobs">
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10 h-7 px-2 gap-1">
                    عرض الكل <ChevronLeft className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "منشورة", v: publishedJobs,  text: "text-green-500" },
                  { label: "مسودة",  v: draftJobs,      text: "text-amber-500" },
                  { label: "محذوفة", v: trashJobs,      text: "text-red-500"   },
                ].map(r => (
                  <div key={r.label} className="text-center p-2.5 bg-muted/50 rounded-xl">
                    <div className={`text-xl font-black ${r.text}`}>{r.v}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{r.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-xs mb-2 px-0.5">حسب التصنيف</p>
              {[
                { label: "مدنية",            v: civilJobs,       bg: "bg-blue-500/8 border-blue-500/20",       text: "text-blue-500" },
                { label: "عسكرية",           v: militaryJobs,    bg: "bg-red-500/8 border-red-500/20",         text: "text-red-500" },
                { label: "شركات",            v: companyJobs,     bg: "bg-emerald-500/8 border-emerald-500/20", text: "text-emerald-500" },
                { label: "نتائج التوظيف",    v: results.length,  bg: "bg-teal-500/8 border-teal-500/20",       text: "text-teal-500" },
                { label: "وظائف أصحاب العمل", v: employerJobs.length, bg: "bg-indigo-500/8 border-indigo-500/20", text: "text-indigo-500" },
              ].map(r => (
                <div key={r.label} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${r.bg}`}>
                  <span className="text-muted-foreground text-xs">{r.label}</span>
                  <span className={`font-bold text-sm ${r.text}`}>{r.v}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Community Detail */}
          {FEATURE_FLAGS.community && <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-rose-500" />
                  إحصائيات المجتمع
                </CardTitle>
                <Link href="/admin/community">
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10 h-7 px-2 gap-1">
                    عرض الكل <ChevronLeft className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "الأعضاء",   v: cs.totalMembers  ?? 0, text: "text-rose-500" },
                  { label: "المواضيع",  v: cs.totalPosts    ?? 0, text: "text-indigo-500" },
                  { label: "متصل الآن", v: cs.onlineCount   ?? 0, text: "text-green-500" },
                ].map(r => (
                  <div key={r.label} className="text-center p-2.5 bg-muted/50 rounded-xl">
                    <div className={`text-xl font-black ${r.text}`}>{r.v}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{r.label}</div>
                  </div>
                ))}
              </div>
              {[
                { label: "التعليقات",        v: cs.commentsCount          ?? 0, bg: "bg-indigo-500/8 border-indigo-500/20",   text: "text-indigo-500" },
                { label: "المشرفون",          v: cs.totalModerators        ?? 0, bg: "bg-blue-500/8 border-blue-500/20",       text: "text-blue-500" },
                { label: "البلاغات المعلقة",  v: cs.pendingReports         ?? 0, bg: cs.pendingReports > 0 ? "bg-red-500/8 border-red-500/20" : "bg-muted/40 border-border", text: cs.pendingReports > 0 ? "text-red-500" : "text-muted-foreground" },
                { label: "طلبات الإشراف",    v: cs.pendingModeratorRequests ?? 0, bg: cs.pendingModeratorRequests > 0 ? "bg-orange-500/8 border-orange-500/20" : "bg-muted/40 border-border", text: cs.pendingModeratorRequests > 0 ? "text-orange-500" : "text-muted-foreground" },
              ].map(r => (
                <div key={r.label} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${r.bg}`}>
                  <span className="text-muted-foreground text-xs">{r.label}</span>
                  <span className={`font-bold text-sm ${r.text}`}>{r.v}</span>
                </div>
              ))}
            </CardContent>
          </Card>}

          {/* Store Detail */}
          {FEATURE_FLAGS.services && <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-amber-500" />
                  إحصائيات المتجر
                </CardTitle>
                <Link href="/admin/store">
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10 h-7 px-2 gap-1">
                    عرض الكل <ChevronLeft className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "معلق",   v: pendingOrders,    text: "text-amber-500" },
                  { label: "تنفيذ",  v: inProgressOrders, text: "text-blue-500" },
                  { label: "مكتمل",  v: completedOrders,  text: "text-green-500" },
                ].map(r => (
                  <div key={r.label} className="text-center p-2.5 bg-muted/50 rounded-xl">
                    <div className={`text-xl font-black ${r.text}`}>{r.v}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{r.label}</div>
                  </div>
                ))}
              </div>
              {[
                { label: "إجمالي الطلبات",    v: orders.length,   bg: "bg-amber-500/8 border-amber-500/20", text: "text-amber-500" },
                { label: "الخدمات المفعّلة",   v: activeServices,  bg: "bg-cyan-500/8 border-cyan-500/20",   text: "text-cyan-500" },
                { label: "الخدمات الكلي",      v: services.length, bg: "bg-muted/40 border-border",          text: "text-foreground" },
              ].map(r => (
                <div key={r.label} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${r.bg}`}>
                  <span className="text-muted-foreground text-xs">{r.label}</span>
                  <span className={`font-bold text-sm ${r.text}`}>{r.v}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-lg font-black text-green-500">{totalRevenue.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ريال</span></p>
              </div>
            </CardContent>
          </Card>}
        </div>

        {/* ④ Supporting Modules — 8 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "الجهات",         href: "/admin/jobs-hub/organizations", icon: Building2,    iconBg: "bg-orange-500/10",  color: "text-orange-500",  main: orgs.length,         sub: `${govOrgs} حكومية · ${milOrgs} عسكرية · ${privOrgs} خاصة` },
            { label: "الإعلانات",      href: "/admin/settings/ads",          icon: MonitorPlay,   iconBg: "bg-pink-500/10",    color: "text-pink-500",    main: ads.length,          sub: `${activeAds} نشط · ${ads.length - activeAds} غير نشط` },
            { label: "الوسائط",        href: "/admin/settings/media",         icon: Image,         iconBg: "bg-violet-500/10",  color: "text-violet-500",  main: media.length,        sub: "ملف مرفوع" },
            { label: "الإشعارات",      href: "/admin/settings/announcements", icon: Megaphone,     iconBg: "bg-teal-500/10",    color: "text-teal-500",    main: announcements.length, sub: "إشعار / إعلان" },
            { label: "الفريق",         href: "/admin/staff",                  icon: ShieldCheck,   iconBg: "bg-green-500/10",   color: "text-green-500",   main: admins.length,       sub: "مشرف ومسؤول" },
            { label: "الأعضاء",        href: "/admin/members",                icon: Users2,        iconBg: "bg-rose-500/10",    color: "text-rose-500",    main: cs.totalMembers ?? 0, sub: "عضو مسجل" },
            { label: "الدعم الفني",    href: "/admin/support",                icon: HelpCircle,    iconBg: openTickets > 0 ? "bg-red-500/10" : "bg-blue-500/10",   color: openTickets > 0 ? "text-red-500" : "text-blue-500",  main: openTickets, sub: openTickets > 0 ? "تذكرة مفتوحة" : "لا تذاكر مفتوحة" },
            { label: "الأسئلة الشائعة", href: "/admin/settings/faq",         icon: MessageSquare, iconBg: "bg-cyan-500/10",    color: "text-cyan-500",    main: faq.length,          sub: "سؤال وجواب" },
          ].map(s => (
            <Link key={s.label} href={s.href}>
              <Card className="hover:border-primary/30 transition-all cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2.5 rounded-lg ${s.iconBg}`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div className={`text-2xl font-black ${s.color}`}>{s.main}</div>
                  </div>
                  <div className="text-foreground text-sm font-bold">{s.label}</div>
                  <div className="text-muted-foreground text-xs mt-0.5 truncate">{s.sub}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* ⑤ Settings & Content Modules — 4 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "الصفحات",          href: "/admin/settings/pages",       icon: Layout,       iconBg: "bg-indigo-500/10",  color: "text-indigo-500",  main: pages.length,  sub: "صفحة ثابتة" },
            { label: "التحليلات",         href: "/admin/settings/analytics",   icon: LineChart,    iconBg: "bg-lime-500/10",    color: "text-lime-500",    main: "—",           sub: "إحصائيات الزوار" },
            { label: "إعدادات الموقع",    href: "/admin/settings/site",        icon: Cog,          iconBg: "bg-slate-500/10",   color: "text-slate-400",   main: "—",           sub: "SEO · عام · الرئيسية" },
            { label: "وظائف أصحاب العمل", href: "/admin/jobs-hub/employer-jobs", icon: Building,  iconBg: "bg-indigo-500/10",  color: "text-indigo-500",  main: employerJobs.length, sub: "وظيفة معلنة" },
          ].map(s => (
            <Link key={s.label} href={s.href}>
              <Card className="hover:border-primary/30 transition-all cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2.5 rounded-lg ${s.iconBg}`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div className={`text-2xl font-black ${s.color}`}>{s.main}</div>
                  </div>
                  <div className="text-foreground text-sm font-bold">{s.label}</div>
                  <div className="text-muted-foreground text-xs mt-0.5 truncate">{s.sub}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* ⑥ Recent Activity — 2 tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent Jobs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  أحدث الوظائف
                </CardTitle>
                <Link href="/admin/jobs-hub/jobs">
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10 h-7 px-2">عرض الكل</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  لا توجد وظائف بعد
                </div>
              ) : (
                <div className="space-y-2">
                  {recentJobs.map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-xl border border-border/50 hover:border-blue-500/20 transition-all">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-foreground font-bold text-xs line-clamp-1">{job.title}</p>
                          <p className="text-muted-foreground text-xs truncate">{job.company}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold border ${getJobBadge(job.status)}`}>
                        {getJobLabel(job.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          {FEATURE_FLAGS.services && <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-amber-500" />
                  أحدث الطلبات
                </CardTitle>
                <Link href="/admin/store">
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10 h-7 px-2">عرض الكل</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  لا توجد طلبات بعد
                </div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((order: any) => {
                    const b = getOrderBadge(order.status);
                    return (
                      <div key={order.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-xl border border-border/50 hover:border-amber-500/20 transition-all">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <ShoppingCart className="h-3.5 w-3.5 text-amber-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-foreground font-bold text-xs line-clamp-1">{order.serviceName}</p>
                            <p className="text-muted-foreground text-xs truncate">{order.customerName}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-left space-y-0.5">
                          <span className={`block px-2 py-0.5 rounded-full text-xs font-bold border ${b.cls}`}>{b.label}</span>
                          <p className="text-primary font-bold text-xs text-center">{order.amount} ر</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>}
        </div>

        {/* ⑦ Recent Blog Posts */}
        {recentBlog.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  أحدث المقالات
                </CardTitle>
                <Link href="/admin/blog">
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10 h-7 px-2">عرض الكل</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {recentBlog.map((post: any) => (
                  <div key={post.id} className="p-3 bg-muted/40 rounded-xl border border-border/50 hover:border-purple-500/20 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                        <FileText className="h-3.5 w-3.5 text-purple-500" />
                      </div>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-xs font-bold border ${post.status === "published" ? "bg-green-500/15 text-green-500 border-green-500/25" : "bg-amber-500/15 text-amber-500 border-amber-500/25"}`}>
                        {post.status === "published" ? "منشور" : "مسودة"}
                      </span>
                    </div>
                    <p className="text-foreground font-bold text-xs line-clamp-2">{post.title}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


      </div>
    </AdminLayout>
  );
}
