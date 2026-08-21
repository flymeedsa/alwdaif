import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "./DashboardLayout";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { getCommunityToken } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag, Clock, CheckCircle, XCircle, AlertCircle,
  ExternalLink, FileText, Phone, Mail, Package, Eye,
  Loader2, Calendar, CreditCard, Rocket, Coins, Building2, Sparkles, Brain, Bell
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import { usePageTitle } from "@/hooks/usePageTitle";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

function ExpiryLine({ expiresAt }: { expiresAt: string | Date | null | undefined }) {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (daysLeft <= 0) return <p className="text-[10px] text-red-500">انتهت الصلاحية</p>;
  if (daysLeft <= 7) return <p className="text-[10px] text-orange-500">تنتهي خلال {daysLeft} {daysLeft === 1 ? "يوم" : "أيام"}</p>;
  return <p className="text-[10px] text-muted-foreground/60">تنتهي {formatDistanceToNow(date, { addSuffix: true, locale: ar })}</p>;
}

type OrderStatus = "all" | "pending" | "in_progress" | "completed" | "cancelled";
type AppStatus = "all" | "pending" | "in_progress" | "done" | "failed";
type MainTab = "orders" | "applications" | "cv-analyses";

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: any }> = {
  pending:     { label: "قيد المراجعة", badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",  icon: Clock },
  in_progress: { label: "قيد التنفيذ",  badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",    icon: Loader2 },
  completed:   { label: "تم التنفيذ",   badgeClass: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20", icon: CheckCircle },
  cancelled:   { label: "ملغي",         badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",         icon: XCircle },
};

const APP_STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  pending:     { label: "بانتظار التنفيذ",  badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  in_progress: { label: "قيد التقديم",      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  done:        { label: "تم التقديم",        badgeClass: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
  failed:      { label: "لم يُتمكن من التقديم", badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
};

const TABS: { key: OrderStatus; label: string }[] = [
  { key: "all",         label: "كل الطلبات" },
  { key: "pending",     label: "قيد المراجعة" },
  { key: "in_progress", label: "قيد التنفيذ" },
  { key: "completed",   label: "تم التنفيذ" },
  { key: "cancelled",   label: "ملغية" },
];

const APP_TABS: { key: AppStatus; label: string }[] = [
  { key: "all",         label: "كل الطلبات" },
  { key: "pending",     label: "بانتظار التنفيذ" },
  { key: "in_progress", label: "قيد التقديم" },
  { key: "done",        label: "تم التقديم" },
  { key: "failed",      label: "لم يُتمكن" },
];

export default function DashboardOrders() {
  usePageTitle("طلباتي");
  const { data: authData } = useCommunityAuth();
  const [activeTab, setActiveTab] = useState<OrderStatus>("all");
  const [appTab, setAppTab] = useState<AppStatus>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [mainTab, setMainTab] = useState<MainTab>("orders");

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/community/my-orders"],
    enabled: !!authData?.authenticated,
    refetchInterval: 30000,
  });

  const { data: jobApps = [], isLoading: appsLoading } = useQuery<any[]>({
    queryKey: ["/api/community/my-job-applications"],
    queryFn: async () => {
      const res = await fetch("/api/community/my-job-applications", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!authData?.authenticated,
    refetchInterval: 30000,
  });

  const { data: jobCredits } = useQuery({
    queryKey: ["/api/community/job-credits"],
    queryFn: async () => {
      const token = getCommunityToken();
      const res = await fetch("/api/community/job-credits", {
        credentials: "include",
        headers: token ? { "X-Community-Token": token } : {},
      });
      if (!res.ok) return { balance: 0 };
      return res.json();
    },
    enabled: !!authData?.authenticated,
  });

  const { data: aiCredits } = useQuery({
    queryKey: ["/api/cv-analysis/usage"],
    queryFn: async () => {
      const token = getCommunityToken();
      const res = await fetch("/api/cv-analysis/usage", {
        credentials: "include",
        headers: token ? { "X-Community-Token": token } : {},
      });
      if (!res.ok) return { paidCredits: 0, freeUsed: 0, freeLimit: 3 };
      return res.json();
    },
    enabled: !!authData?.authenticated,
  });

  const { data: jobAlertPointsData } = useQuery<{ freePoints: number; paidPoints: number; points: number }>({
    queryKey: ["/api/community/job-alert-points"],
    queryFn: async () => {
      const token = getCommunityToken();
      const res = await fetch("/api/community/job-alert-points", {
        credentials: "include",
        headers: token ? { "X-Community-Token": token } : {},
      });
      if (!res.ok) return { freePoints: 0, paidPoints: 0, points: 0 };
      return res.json();
    },
    enabled: !!authData?.authenticated,
  });

  const { data: cvHistory = [], isLoading: cvHistoryLoading } = useQuery<any[]>({
    queryKey: ["/api/cv-analysis/history"],
    queryFn: async () => {
      const token = getCommunityToken();
      const res = await fetch("/api/cv-analysis/history", {
        credentials: "include",
        headers: token ? { "X-Community-Token": token } : {},
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!authData?.authenticated,
  });

  const filtered = activeTab === "all"
    ? orders
    : orders.filter((o: any) => o.status === activeTab);

  const counts = {
    all:         orders.length,
    pending:     orders.filter((o: any) => o.status === "pending").length,
    in_progress: orders.filter((o: any) => o.status === "in_progress").length,
    completed:   orders.filter((o: any) => o.status === "completed").length,
    cancelled:   orders.filter((o: any) => o.status === "cancelled").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              طلباتي
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              طلباتك من متجر الخدمات المهنية
            </p>
          </div>
          <Link href="/store/services">
            <Button variant="outline" size="sm" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">تصفح الخدمات</span>
            </Button>
          </Link>
        </div>

        {/* My Balance Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Job Application Credits */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4" data-testid="balance-card-jobs">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Coins className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">رصيد التقديمات</p>
                <p className="font-black text-foreground text-lg leading-tight">
                  {jobCredits?.balance ?? 0}
                  <span className="text-xs font-medium text-muted-foreground mr-1">تقديم</span>
                </p>
                <p className="text-[11px] text-muted-foreground">تقديم احترافي على الوظائف</p>
                <ExpiryLine expiresAt={jobCredits?.expiresAt} />
              </div>
            </div>
            <Link href="/store/services/job-credits" className="w-full sm:w-auto">
              <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 text-xs w-full sm:w-auto">
                شحن
              </Button>
            </Link>
          </div>

          {/* Job Alert Points */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4" data-testid="balance-card-job-alerts">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">نقاط تنبيهات الوظائف</p>
                <p className="font-black text-foreground text-lg leading-tight">
                  {(jobAlertPointsData?.paidPoints ?? 0).toLocaleString("ar-SA")}
                  <span className="text-xs font-medium text-muted-foreground mr-1">مدفوع</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  مجاني: {jobAlertPointsData?.freePoints ?? 0} / 100 نقطة
                </p>
              </div>
            </div>
            <Link href="/store/services/job-alert-points" className="w-full sm:w-auto">
              <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10 text-xs w-full sm:w-auto">
                شحن
              </Button>
            </Link>
          </div>

          {/* AI Credits */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 col-span-2 sm:col-span-1" data-testid="balance-card-ai">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-violet-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">رصيد تحليل السيرة الذاتية</p>
                <p className="font-black text-foreground text-lg leading-tight">
                  {aiCredits?.paidCredits ?? 0}
                  <span className="text-xs font-medium text-muted-foreground mr-1">مدفوع</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  مجاني: {(aiCredits?.freeLimit ?? 3) - (aiCredits?.freeUsed ?? 0)} / {aiCredits?.freeLimit ?? 3}
                </p>
                <ExpiryLine expiresAt={aiCredits?.expiresAt} />
              </div>
            </div>
            <Link href="/store/services/cv-analysis-credits" className="w-full sm:w-auto">
              <Button size="sm" variant="outline" className="border-violet-500/30 text-violet-600 hover:bg-violet-500/10 text-xs w-full sm:w-auto">
                شحن
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Tab Switcher */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-0 border-b border-border min-w-max sm:min-w-0">
            <button
              onClick={() => setMainTab("orders")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px whitespace-nowrap ${mainTab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              data-testid="main-tab-orders"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              طلبات الخدمات
              {orders.length > 0 && <span className="bg-muted rounded-full text-xs px-1.5 py-0.5">{orders.length}</span>}
            </button>
            <button
              onClick={() => setMainTab("applications")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px whitespace-nowrap ${mainTab === "applications" ? "border-emerald-500 text-emerald-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              data-testid="main-tab-applications"
            >
              <Rocket className="h-4 w-4 shrink-0" />
              طلبات التقديم
              {jobApps.length > 0 && <span className="bg-emerald-500/10 text-emerald-600 rounded-full text-xs px-1.5 py-0.5">{jobApps.length}</span>}
            </button>
            <button
              onClick={() => setMainTab("cv-analyses")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px whitespace-nowrap ${mainTab === "cv-analyses" ? "border-violet-500 text-violet-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              data-testid="main-tab-cv-analyses"
            >
              <Brain className="h-4 w-4 shrink-0" />
              تحليلات السيرة
              {cvHistory.length > 0 && <span className="bg-violet-500/10 text-violet-600 rounded-full text-xs px-1.5 py-0.5">{cvHistory.length}</span>}
            </button>
          </div>
        </div>

        {/* Job Applications Panel */}
        {mainTab === "applications" && (
          <div className="space-y-4">
            {appsLoading ? (
              <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse border border-border" />)}</div>
            ) : jobApps.length === 0 ? (
              <div className="text-center py-16 bg-muted/20 border border-border rounded-2xl">
                <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground/25" />
                <p className="text-foreground font-bold mb-1">لا توجد طلبات تقديم بعد</p>
                <p className="text-muted-foreground text-sm mb-6">اضغط على "قدّم لي على هذه الوظيفة" في أي إعلان وظيفي</p>
                <Link href="/jobs">
                  <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Rocket className="h-4 w-4" />
                    تصفح الوظائف
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Sub-tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {APP_TABS.map((tab) => {
                    const count = tab.key === "all"
                      ? jobApps.length
                      : jobApps.filter((a: any) => a.status === tab.key).length;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setAppTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                          appTab === tab.key
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                        }`}
                        data-testid={`app-tab-${tab.key}`}
                      >
                        {tab.label}
                        {count > 0 && (
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                            appTab === tab.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                          }`}>{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Filtered list */}
                {(() => {
                  const filtered = appTab === "all" ? jobApps : jobApps.filter((a: any) => a.status === appTab);
                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 bg-muted/20 border border-border rounded-2xl">
                        <p className="text-muted-foreground text-sm">لا توجد طلبات في هذه الحالة</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {filtered.map((app: any) => {
                        const cfg = APP_STATUS_CONFIG[app.status] || APP_STATUS_CONFIG.pending;
                        return (
                          <Card key={app.id} className="bg-card border-border hover:border-emerald-500/20 transition-colors" data-testid={`job-app-${app.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                  <Rocket className="h-4 w-4 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className="font-bold text-foreground text-sm leading-snug">{app.jobTitle}</p>
                                    <Badge className={`text-xs border shrink-0 ${cfg.badgeClass}`}>{cfg.label}</Badge>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {app.jobCompany && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{app.jobCompany}</span>}
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDistanceToNow(new Date(app.createdAt), { addSuffix: true, locale: ar })}</span>
                                  </div>
                                  {app.adminNotes && (
                                    <p className="mt-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">{app.adminNotes}</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* CV Analysis History Panel */}
        {mainTab === "cv-analyses" && (
          <div className="space-y-4">
            {cvHistoryLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse border border-border" />)}</div>
            ) : cvHistory.length === 0 ? (
              <div className="text-center py-16 bg-muted/20 border border-border rounded-2xl">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/25" />
                <p className="text-foreground font-bold mb-1">لا توجد تحليلات بعد</p>
                <p className="text-muted-foreground text-sm mb-6">افتح أي وظيفة واضغط على "حلّل سيرتي الذاتية" لبدء التحليل</p>
                <Link href="/jobs">
                  <Button className="gap-2 bg-violet-500 hover:bg-violet-600 text-white">
                    <Brain className="h-4 w-4" />
                    تصفح الوظائف
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border bg-card p-4 text-center">
                    <p className="text-2xl font-black text-foreground">{cvHistory.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">إجمالي التحليلات</p>
                  </div>
                  <div className="rounded-2xl border bg-card p-4 text-center">
                    <p className="text-2xl font-black text-violet-500">
                      {cvHistory.length > 0 ? Math.round(cvHistory.reduce((s: number, h: any) => s + h.matchPercentage, 0) / cvHistory.length) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">متوسط التوافق</p>
                  </div>
                  <div className="rounded-2xl border bg-card p-4 text-center">
                    <p className="text-2xl font-black text-emerald-500">
                      {cvHistory.filter((h: any) => h.matchPercentage >= 70).length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">توافق 70%+</p>
                  </div>
                </div>

                {/* History List */}
                <div className="space-y-2">
                  {cvHistory.map((item: any) => {
                    const pct = item.matchPercentage;
                    const color = pct >= 70 ? "text-emerald-500" : pct >= 45 ? "text-amber-500" : "text-red-500";
                    const ringColor = pct >= 70 ? "ring-emerald-500/30" : pct >= 45 ? "ring-amber-500/30" : "ring-red-500/30";
                    const bgColor = pct >= 70 ? "bg-emerald-500/8" : pct >= 45 ? "bg-amber-500/8" : "bg-red-500/8";
                    return (
                      <div key={item.id} className={`flex items-center gap-3 rounded-2xl border ${bgColor} p-4`} data-testid={`cv-history-${item.id}`}>
                        {/* Score Ring */}
                        <div className={`w-12 h-12 rounded-xl ring-2 ${ringColor} flex flex-col items-center justify-center shrink-0`}>
                          <span className={`text-base font-black leading-none ${color}`}>{pct}</span>
                          <span className="text-[9px] text-muted-foreground leading-none">%</span>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-sm leading-snug truncate">{item.jobTitle}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                            {item.jobCompany && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{item.jobCompany}</span>}
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ar })}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${item.creditType === "paid" ? "bg-violet-500/10 text-violet-600" : "bg-blue-500/10 text-blue-600"}`}>
                              {item.creditType === "paid" ? "مدفوع" : "مجاني"}
                            </span>
                          </div>
                        </div>
                        {/* Score Label */}
                        <div className="shrink-0 text-left">
                          <p className={`text-xs font-bold ${color}`}>
                            {pct >= 70 ? "توافق ممتاز" : pct >= 45 ? "توافق متوسط" : "توافق ضعيف"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Service Orders Panel */}
        {mainTab === "orders" && (
        <div className="space-y-4">

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
              }`}
              data-testid={`tab-${tab.key}`}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 rounded-2xl bg-muted/40 animate-pulse border border-border" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 border border-border rounded-2xl">
            <ShoppingBag className="h-14 w-14 mx-auto mb-4 text-muted-foreground/25" />
            <p className="text-foreground font-bold text-lg mb-1">
              {activeTab === "all" ? "لا توجد طلبات بعد" : `لا توجد طلبات ${TABS.find(t => t.key === activeTab)?.label}`}
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              {activeTab === "all" ? "اطلب إحدى خدماتنا المتخصصة وستجد طلباتك هنا" : "جرّب تصفية مختلفة أو تصفح الخدمات الجديدة"}
            </p>
            <Link href="/store/services">
              <Button className="gap-2">
                <Package className="h-4 w-4" />
                تصفح الخدمات
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order: any) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <Card key={order.id} className="bg-card border-border hover:border-primary/30 transition-colors shadow-sm" data-testid={`order-${order.id}`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Main info */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-bold text-foreground text-base leading-snug">{order.serviceName}</h3>
                            {order.serviceVariant && (() => {
                              let parsed: any = null;
                              try { parsed = JSON.parse(order.serviceVariant); } catch {}
                              if (Array.isArray(parsed)) {
                                return (
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                    {parsed.map((item: any, i: number) => (
                                      <span key={i} className="text-xs text-muted-foreground bg-muted/40 rounded px-1.5 py-0.5">
                                        {item.name}
                                        {item.variant ? <span className="opacity-70"> ({item.variant})</span> : null}
                                      </span>
                                    ))}
                                  </div>
                                );
                              }
                              return <p className="text-xs text-muted-foreground mt-0.5">{order.serviceVariant}</p>;
                            })()}
                          </div>
                          <Badge className={`text-xs border shrink-0 flex items-center gap-1 py-1 ${cfg.badgeClass}`}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </div>

                        {/* Order number + amount */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <FileText className="h-3.5 w-3.5" />
                            <span className="font-mono text-foreground font-medium">{order.orderNumber}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-primary font-bold text-base">
                            <CreditCard className="h-3.5 w-3.5" />
                            {order.amount?.toLocaleString()} ريال
                          </span>
                          <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: ar })}
                          </span>
                        </div>

                        {/* Contact info */}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {order.customerEmail && (
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{order.customerEmail}</span>
                          )}
                          {order.customerPhone && (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{order.customerPhone}</span>
                          )}
                        </div>

                        {/* Cancellation reason */}
                        {order.status === "cancelled" && order.cancellationReason && (
                          <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-sm text-red-600 dark:text-red-400">
                            <span className="font-medium">سبب الإلغاء: </span>
                            {order.cancellationReason}
                          </div>
                        )}

                        {/* Notes */}
                        {order.notes && (
                          <div className="p-3 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">ملاحظات: </span>
                            {order.notes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => setSelectedOrder(order)}
                          data-testid={`view-order-${order.id}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          التفاصيل
                        </Button>
                        {order.receiptUrl && (
                          <a href={order.receiptUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="gap-1.5 text-xs w-full border border-border">
                              <FileText className="h-3.5 w-3.5" />
                              الإيصال
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      )}
      </div>

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg bg-card border-border" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-foreground text-right">تفاصيل الطلب</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Status */}
              {(() => {
                const cfg = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                return (
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                    <span className="text-muted-foreground text-sm">حالة الطلب</span>
                    <Badge className={`flex items-center gap-1 border ${cfg.badgeClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </Badge>
                  </div>
                );
              })()}

              {/* Service info */}
              <div className="space-y-3">
                <h4 className="text-foreground font-bold text-sm border-b border-border pb-2">معلومات الخدمة</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">اسم الخدمة</p>
                    <p className="text-foreground font-medium">{selectedOrder.serviceName}</p>
                  </div>
                  {selectedOrder.serviceVariant && (() => {
                    let parsed: any = null;
                    try { parsed = JSON.parse(selectedOrder.serviceVariant); } catch {}
                    if (Array.isArray(parsed)) {
                      return (
                        <div className="col-span-2">
                          <p className="text-muted-foreground text-xs mb-1">الخدمات المطلوبة</p>
                          <div className="space-y-1">
                            {parsed.map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-2 py-1">
                                <span className="text-foreground font-medium">
                                  {item.name}
                                  {item.variant ? <span className="text-muted-foreground font-normal mr-1">({item.variant})</span> : null}
                                </span>
                                <span className="text-primary font-bold">{item.price} ريال</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div>
                        <p className="text-muted-foreground text-xs mb-0.5">نوع الخدمة</p>
                        <p className="text-foreground font-medium">{selectedOrder.serviceVariant}</p>
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">رقم الطلب</p>
                    <p className="text-foreground font-mono font-bold text-primary">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">المبلغ</p>
                    <p className="text-foreground font-bold">{selectedOrder.amount?.toLocaleString()} ريال</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">طريقة الدفع</p>
                    <p className="text-foreground font-medium">تحويل بنكي</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">تاريخ الطلب</p>
                    <p className="text-foreground font-medium">
                      {format(new Date(selectedOrder.createdAt), "dd/MM/yyyy HH:mm", { locale: ar })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-3">
                <h4 className="text-foreground font-bold text-sm border-b border-border pb-2">بيانات التواصل</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">الاسم</p>
                    <p className="text-foreground font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">الجوال</p>
                    <p className="text-foreground font-medium">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs mb-0.5">البريد الإلكتروني</p>
                    <p className="text-foreground font-medium">{selectedOrder.customerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border text-sm">
                  <p className="text-muted-foreground text-xs mb-1">الملاحظات</p>
                  <p className="text-foreground">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Cancellation */}
              {selectedOrder.status === "cancelled" && selectedOrder.cancellationReason && (
                <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-sm">
                  <p className="text-muted-foreground text-xs mb-1">سبب الإلغاء</p>
                  <p className="text-red-600 dark:text-red-400">{selectedOrder.cancellationReason}</p>
                </div>
              )}

              {/* Receipt */}
              {selectedOrder.receiptUrl && (
                <div className="space-y-2">
                  <p className="text-foreground font-bold text-sm border-b border-border pb-2">إيصال التحويل</p>
                  <a href={selectedOrder.receiptUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={selectedOrder.receiptUrl}
                      alt="إيصال التحويل"
                      className="w-full max-h-48 object-contain rounded-xl border border-border bg-muted/20"
                    />
                  </a>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Link href={`/store/services/${selectedOrder.serviceSlug}`} className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    صفحة الخدمة
                  </Button>
                </Link>
                <Button onClick={() => setSelectedOrder(null)} className="flex-1">
                  إغلاق
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </DashboardLayout>
  );
}
