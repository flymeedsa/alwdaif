import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "./DashboardLayout";
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { Badge } from "@/components/ui/badge";
import {
  Heart, ShoppingBag, Bell, Briefcase, Users,
  Clock, CheckCircle, XCircle, AlertCircle, Sparkles,
  BriefcaseBusiness, ExternalLink, Megaphone, Newspaper,
  User, Rocket, BrainCircuit, ChevronLeft, ArrowUpRight, Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { usePageTitle } from "@/hooks/usePageTitle";

function getCommunityToken() {
  try { return localStorage.getItem("communityToken"); } catch { return null; }
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | Date }) {
  const date = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.ceil((date.getTime() - now.getTime()) / 86400000);
  if (daysLeft <= 0) return <p className="text-[10px] text-red-500/80 mt-0.5">انتهت الصلاحية</p>;
  if (daysLeft <= 7) return <p className="text-[10px] text-orange-500/90 mt-0.5">تنتهي خلال {daysLeft} {daysLeft === 1 ? "يوم" : "أيام"}</p>;
  return <p className="text-[10px] text-muted-foreground/60 mt-0.5">تنتهي {formatDistanceToNow(date, { addSuffix: true, locale: ar })}</p>;
}

const orderStatusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending:     { label: "قيد المراجعة", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25", icon: Clock },
  in_progress: { label: "جاري التنفيذ",  color: "bg-blue-500/15 text-blue-400 border-blue-500/25",   icon: AlertCircle },
  completed:   { label: "مكتمل",         color: "bg-green-500/15 text-green-400 border-green-500/25", icon: CheckCircle },
  cancelled:   { label: "ملغي",          color: "bg-red-500/15 text-red-400 border-red-500/25",       icon: XCircle },
};

export default function DashboardHome() {
  usePageTitle("لوحة التحكم");
  const { data: authData } = useCommunityAuth();
  const member = authData?.member;
  const token = getCommunityToken();
  const authHeaders = token ? { "X-Community-Token": token } : {};

  const { data: favorites = [] } = useQuery<any[]>({
    queryKey: ["/api/community/favorites"],
    enabled: !!authData?.authenticated,
  });
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/community/my-orders"],
    enabled: !!authData?.authenticated,
    refetchInterval: 30000,
  });
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/community/notifications"],
    enabled: !!authData?.authenticated,
    refetchInterval: 30000,
  });
  const { data: myPosts = [] } = useQuery<any[]>({
    queryKey: ["/api/community/my-posts"],
    enabled: !!authData?.authenticated,
  });
  const { data: jobAlerts = [] } = useQuery<any[]>({
    queryKey: ["/api/community/job-alerts"],
    enabled: !!authData?.authenticated,
  });
  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ["/api/announcements"],
    enabled: !!authData?.authenticated,
    refetchInterval: 60000,
  });
  const { data: jobCredits } = useQuery({
    queryKey: ["/api/community/job-credits"],
    queryFn: async () => {
      const res = await fetch("/api/community/job-credits", {
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) return { balance: 0 };
      return res.json();
    },
    enabled: !!authData?.authenticated,
  });
  const { data: aiCredits } = useQuery({
    queryKey: ["/api/cv-analysis/usage"],
    queryFn: async () => {
      const res = await fetch("/api/cv-analysis/usage", {
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) return { paidCredits: 0, freeUsed: 0, freeLimit: 3 };
      return res.json();
    },
    enabled: !!authData?.authenticated,
  });
  const { data: jobAlertPoints } = useQuery({
    queryKey: ["/api/community/job-alert-points"],
    queryFn: async () => {
      const res = await fetch("/api/community/job-alert-points", {
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) return { freePoints: 0, paidPoints: 0, points: 0 };
      return res.json();
    },
    enabled: !!authData?.authenticated,
  });

  const unreadNotifications = (notifications as any[]).filter((n: any) => !n.isRead);
  const unreadJobAlerts = (jobAlerts as any[]).filter((a: any) => !a.isRead);
  const recentOrders = (orders as any[]).slice(0, 4);
  const recentNotifications = unreadNotifications.slice(0, 4);
  const recentJobAlerts = unreadJobAlerts.slice(0, 3);

  const navLinks = [
    ...(FEATURE_FLAGS.services ? [{ label: "طلباتي", path: "/dashboard/orders", icon: ShoppingBag, iconColor: "text-blue-400", iconBg: "bg-blue-500/10", count: (orders as any[]).length, countLabel: "طلب" }] : []),
    { label: "المفضلة",           path: "/dashboard/favorites",            icon: Heart,           iconColor: "text-rose-400",   iconBg: "bg-rose-500/10",   count: (favorites as any[]).length,    countLabel: "وظيفة" },
    ...(FEATURE_FLAGS.community ? [{ label: "المجتمع", path: "/dashboard/community", icon: Users, iconColor: "text-green-400", iconBg: "bg-green-500/10", count: (myPosts as any[]).length, countLabel: "منشور" }] : []),
    { label: "تنبيهات الوظائف",  path: "/dashboard/job-alerts",           icon: BriefcaseBusiness, iconColor: "text-orange-400", iconBg: "bg-orange-500/10", count: unreadJobAlerts.length,        countLabel: "جديد", highlight: unreadJobAlerts.length > 0 },
    { label: "الإعلانات",         path: "/dashboard/announcements",        icon: Megaphone,       iconColor: "text-purple-400", iconBg: "bg-purple-500/10", count: (announcements as any[]).length, countLabel: "إعلان" },
    { label: "الإشعارات",         path: "/dashboard/notifications",        icon: Bell,            iconColor: "text-amber-400",  iconBg: "bg-amber-500/10",  count: unreadNotifications.length,     countLabel: "جديد", highlight: unreadNotifications.length > 0 },
    { label: "الملخص الأسبوعي",  path: "/dashboard/weekly-subscription",  icon: Newspaper,       iconColor: "text-cyan-400",   iconBg: "bg-cyan-500/10",   count: null, countLabel: "" },
    { label: "حسابي",             path: "/dashboard/account",              icon: User,            iconColor: "text-slate-400",  iconBg: "bg-slate-500/10",  count: null, countLabel: "" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-4xl mx-auto" dir="rtl">

        {/* ── Welcome ── */}
        <div className="rounded-2xl bg-gradient-to-l from-primary/20 via-primary/10 to-transparent border border-primary/20 p-5 flex items-center gap-4">
          {member?.avatar ? (
            <img src={member.avatar} alt={member.displayName} className="w-14 h-14 rounded-full object-cover border-2 border-primary/30 shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary/25 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
              {member?.displayName?.charAt(0) || "؟"}
            </div>
          )}
          <div>
            <h1 className="text-lg font-black text-foreground">أهلاً، {member?.displayName} 👋</h1>
            <p className="text-xs text-muted-foreground mt-0.5">مرحباً بك في لوحة حسابك الشخصي</p>
          </div>
        </div>

        {/* ── Credits ── */}
        <div>
          <p className="text-xs font-black text-muted-foreground mb-3 px-0.5">أرصدتي</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Job Credits */}
            <Link href="/dashboard/orders">
              <div className="rounded-2xl border border-emerald-500/25 bg-card hover:bg-emerald-500/5 transition-colors p-4 cursor-pointer group h-full" data-testid="card-job-credits">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Rocket className="h-5 w-5 text-emerald-400" />
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-emerald-400 transition-colors mt-1" />
                </div>
                <p className="text-3xl font-black text-foreground tabular-nums leading-none">
                  {jobCredits?.balance ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">رصيد التقديم</p>
                {jobCredits?.expiresAt && <ExpiryBadge expiresAt={jobCredits.expiresAt} />}
              </div>
            </Link>

            {/* Job Alert Points */}
            <Link href="/dashboard/orders">
              <div className="rounded-2xl border border-amber-500/25 bg-card hover:bg-amber-500/5 transition-colors p-4 cursor-pointer group h-full" data-testid="card-job-alert-points">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-amber-400" />
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-amber-400 transition-colors mt-1" />
                </div>
                <p className="text-3xl font-black text-foreground tabular-nums leading-none">
                  {jobAlertPoints?.paidPoints ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">نقاط التنبيهات</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">مجاني: {jobAlertPoints?.freePoints ?? 0} / 100</p>
              </div>
            </Link>

            {/* CV Credits */}
            <Link href="/dashboard/orders" className="col-span-2 sm:col-span-1">
              <div className="rounded-2xl border border-violet-500/25 bg-card hover:bg-violet-500/5 transition-colors p-4 cursor-pointer group h-full" data-testid="card-cv-credits">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <BrainCircuit className="h-5 w-5 text-violet-400" />
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-violet-400 transition-colors mt-1" />
                </div>
                <p className="text-3xl font-black text-foreground tabular-nums leading-none">
                  {aiCredits?.paidCredits ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">رصيد تحليل السيرة الذاتية</p>
                {aiCredits?.expiresAt && <ExpiryBadge expiresAt={aiCredits.expiresAt} />}
              </div>
            </Link>
          </div>
        </div>

        {/* ── Quick Nav ── */}
        <div>
          <p className="text-xs font-black text-muted-foreground mb-3 px-0.5">الوصول السريع</p>
          <div className="grid grid-cols-4 gap-2.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`relative rounded-2xl border p-3 flex flex-col gap-2 cursor-pointer transition-all hover:shadow-sm hover:-translate-y-0.5 ${
                      (item as any).highlight
                        ? "border-primary/30 bg-primary/5 hover:bg-primary/8"
                        : "border-border bg-card hover:border-primary/20 hover:bg-accent/40"
                    }`}
                    data-testid={`card-nav-${item.path.split("/").pop()}`}
                  >
                    {(item as any).highlight && (
                      <span className="absolute top-2.5 left-2.5 w-2 h-2 rounded-full bg-primary" />
                    )}
                    <div className={`w-8 h-8 rounded-xl ${item.iconBg} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${item.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-foreground leading-tight">{item.label}</p>
                      {item.count !== null && (
                        <p className="text-base font-black text-foreground tabular-nums leading-tight">
                          {item.count}
                          <span className="text-[9px] font-medium text-muted-foreground mr-0.5">{item.countLabel}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Recent Orders */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-black text-foreground">آخر الطلبات</span>
              </div>
              <Link href="/dashboard/orders">
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  عرض الكل <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
            <div className="p-3 space-y-2">
              {recentOrders.length === 0 ? (
                <div className="text-center py-6">
                  <ShoppingBag className="h-7 w-7 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">لا توجد طلبات بعد</p>
                </div>
              ) : (
                recentOrders.map((order: any) => {
                  const status = orderStatusMap[order.status] || orderStatusMap.pending;
                  const Icon = status.icon;
                  return (
                    <div key={order.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40" data-testid={`row-order-${order.id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{order.serviceName}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{order.orderNumber}</p>
                      </div>
                      <Badge className={`text-[10px] border shrink-0 ${status.color}`}>
                        <Icon className="h-2.5 w-2.5 ml-1" />
                        {status.label}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-black text-foreground">الإشعارات الجديدة</span>
                {unreadNotifications.length > 0 && (
                  <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[10px] px-1.5 py-0">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </div>
              <Link href="/dashboard/notifications">
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  عرض الكل <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
            <div className="p-3 space-y-2">
              {recentNotifications.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="h-7 w-7 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">لا توجد إشعارات جديدة</p>
                </div>
              ) : (
                recentNotifications.map((n: any) => (
                  <div key={n.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40" data-testid={`row-notif-${n.id}`}>
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {n.createdAt && formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ar })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Recent Job Alerts ── */}
        {recentJobAlerts.length > 0 && (
          <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-orange-500/15">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-black text-foreground">تنبيهات الوظائف الجديدة</span>
                <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/25 text-[10px] px-1.5 py-0">
                  {recentJobAlerts.length}
                </Badge>
              </div>
              <Link href="/dashboard/job-alerts">
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  عرض الكل <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
            <div className="p-3 space-y-2">
              {recentJobAlerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-background/60 border border-orange-400/15"
                  data-testid={`row-jobalert-${alert.id}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Briefcase className="h-4 w-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {alert.createdAt && formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: ar })}
                    </p>
                  </div>
                  {alert.link && (
                    <Link href={alert.link}>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent/60 transition-colors shrink-0">
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
