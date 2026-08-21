import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "./DashboardLayout";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { getCommunityToken } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BrainCircuit, Sparkles, ShoppingCart, Clock, CheckCircle,
  XCircle, Loader2, AlertCircle, FileText, Calendar
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import { usePageTitle } from "@/hooks/usePageTitle";

function getCommunityTokenLocal() {
  try { return localStorage.getItem("communityToken"); } catch { return null; }
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | Date | null | undefined }) {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (daysLeft <= 0)
    return <Badge className="bg-red-500/15 text-red-500 border-red-500/25 text-xs">انتهت الصلاحية</Badge>;
  if (daysLeft <= 7)
    return <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/25 text-xs">تنتهي خلال {daysLeft} {daysLeft === 1 ? "يوم" : "أيام"}</Badge>;
  if (daysLeft <= 30)
    return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/25 text-xs">تنتهي خلال {daysLeft} يوماً</Badge>;
  return (
    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-xs">
      تنتهي {formatDistanceToNow(date, { addSuffix: true, locale: ar })}
    </Badge>
  );
}

const MATCH_COLOR = (pct: number) =>
  pct >= 75 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-500";

const MATCH_LABEL = (pct: number) =>
  pct >= 75 ? "تطابق عالٍ" : pct >= 50 ? "تطابق متوسط" : "تطابق منخفض";

export default function DashboardAiCredits() {
  usePageTitle("رصيد تحليل السيرة الذاتية");
  const { data: authData } = useCommunityAuth();
  const token = getCommunityTokenLocal();
  const authHeaders = token ? { "X-Community-Token": token } : {};

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["/api/cv-analysis/usage"],
    queryFn: async () => {
      const res = await fetch("/api/cv-analysis/usage", {
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) return { paidCredits: 0, freeUsed: 0, freeLimit: 10, expiresAt: null, isExpired: false };
      return res.json();
    },
    enabled: !!authData?.authenticated,
  });

  const { data: history = [], isLoading: historyLoading } = useQuery<any[]>({
    queryKey: ["/api/cv-analysis/history"],
    queryFn: async () => {
      const res = await fetch("/api/cv-analysis/history", {
        credentials: "include",
        headers: authHeaders,
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!authData?.authenticated,
  });

  const freeUsed = usage?.freeUsed ?? 0;
  const freeLimit = usage?.freeLimit ?? 10;
  const freeRemaining = Math.max(0, freeLimit - freeUsed);
  const paidCredits = usage?.paidCredits ?? 0;
  const isExpired = usage?.isExpired ?? false;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">رصيد تحليل السيرة الذاتية</h1>
              <p className="text-sm text-muted-foreground">تابع رصيدك وسجل تحليلاتك</p>
            </div>
          </div>
          <Button asChild size="sm" className="gap-2">
            <Link href="/store">
              <ShoppingCart className="w-4 h-4" />
              شراء رصيد
            </Link>
          </Button>
        </div>

        {/* Credits Cards */}
        {usageLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Paid Credits */}
            <Card className={`border ${isExpired ? "border-red-500/30" : "border-purple-500/25"}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isExpired ? "bg-red-500/10" : "bg-purple-500/10"}`}>
                      <Sparkles className={`w-4 h-4 ${isExpired ? "text-red-500" : "text-purple-500"}`} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">رصيد مدفوع</span>
                  </div>
                  <ExpiryBadge expiresAt={usage?.expiresAt} />
                </div>
                <p className={`text-3xl font-bold ${isExpired ? "text-red-500/60 line-through" : ""}`}>
                  {paidCredits}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isExpired ? "انتهت صلاحية الرصيد" : "تحليل متاح"}
                </p>
                {usage?.expiresAt && !isExpired && (
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    تاريخ الانتهاء: {format(new Date(usage.expiresAt), "dd/MM/yyyy", { locale: ar })}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Free Credits */}
            <Card className="border border-blue-500/25">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <BrainCircuit className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">رصيد مجاني</span>
                </div>
                <p className="text-3xl font-bold">{freeRemaining}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  مستخدم {freeUsed} من {freeLimit}
                </p>
                {/* Progress bar */}
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${Math.min(100, (freeUsed / freeLimit) * 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info box */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400 flex gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>الرصيد المدفوع صالح لمدة سنة واحدة من تاريخ الشراء. استخدمه قبل انتهاء صلاحيته.</span>
        </div>

        {/* History */}
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            سجل التحليلات
          </h2>

          {historyLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <BrainCircuit className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">لا توجد تحليلات بعد</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  ابدأ بتحليل سيرتك الذاتية عند تصفح الوظائف
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((item: any) => (
                <Card key={item.id} className="border border-border/60" data-testid={`cv-analysis-history-${item.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.jobTitle}</p>
                        {item.jobCompany && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.jobCompany}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-xs ${item.creditType === "paid" ? "border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5" : "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5"}`}
                          >
                            {item.creditType === "paid" ? "رصيد مدفوع" : "رصيد مجاني"}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ar })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-2xl font-bold ${MATCH_COLOR(item.matchPercentage)}`}>
                          {item.matchPercentage}%
                        </p>
                        <p className={`text-[10px] ${MATCH_COLOR(item.matchPercentage)}`}>
                          {MATCH_LABEL(item.matchPercentage)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
