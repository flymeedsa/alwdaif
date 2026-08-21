import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  ArrowLeft, TrendingUp, ShoppingCart, CheckCircle2,
  XCircle, Clock, Package, BarChart3, Loader2, Trophy,
  Target, Edit3,
} from "lucide-react";

type Period = "today" | "week" | "month" | "year" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "اليوم" },
  { key: "week", label: "هذا الأسبوع" },
  { key: "month", label: "هذا الشهر" },
  { key: "year", label: "هذه السنة" },
  { key: "all", label: "كل الوقت" },
];

type Stats = {
  revenue: number;
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  cancelled: number;
};

type BreakdownItem = {
  label: string;
  revenue: number;
  total: number;
  completed: number;
  cancelled: number;
};

type ReportData = {
  period: string;
  stats: Stats;
  breakdown: BreakdownItem[];
  topServices: { name: string; count: number; revenue: number }[];
};

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  sub,
  testId,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  sub?: string;
  testId?: string;
}) {
  return (
    <Card className="bg-card border-border" data-testid={testId}>
      <CardContent className="p-5">
        <div className={`inline-flex p-2.5 rounded-xl ${iconBg} mb-3`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="text-2xl font-black text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
        {sub && <div className="text-xs text-muted-foreground/60 mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function BarChart({ data, valueKey }: { data: BreakdownItem[]; valueKey: "revenue" | "total" }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const hasData = data.some(d => d[valueKey] > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40 gap-2">
        <BarChart3 className="h-10 w-10" />
        <span className="text-sm">لا توجد بيانات لهذه الفترة</span>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-1 min-w-max px-1 pb-2" style={{ height: 160 }}>
        {data.map((item, i) => {
          const pct = Math.max((item[valueKey] / max) * 100, item[valueKey] > 0 ? 4 : 0);
          return (
            <div key={i} className="flex flex-col items-center gap-1 group" style={{ minWidth: 28 }}>
              <div className="relative w-full flex flex-col items-center justify-end" style={{ height: 130 }}>
                {item[valueKey] > 0 && (
                  <div className="absolute -top-6 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {valueKey === "revenue" ? `${item[valueKey].toLocaleString()} ر.س` : item[valueKey]}
                  </div>
                )}
                <div
                  className={`w-5 rounded-t-md transition-all duration-500 ${item[valueKey] > 0 ? "bg-primary/70 group-hover:bg-primary" : "bg-muted/30"}`}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground/60 text-center leading-tight max-w-[32px] truncate">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminStoreReports() {
  const [period, setPeriod] = useState<Period>("month");
  const [chartMode, setChartMode] = useState<"revenue" | "total">("revenue");
  const [goalInput, setGoalInput] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: report, isLoading } = useQuery<ReportData>({
    queryKey: ["/api/admin/store/report/detailed", period],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/store/report/detailed?period=${period}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 0,
  });

  const { data: baseReport } = useQuery<any>({
    queryKey: ["/api/admin/store/report"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/store/report");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 0,
  });

  const goalMutation = useMutation({
    mutationFn: async (goal: number) => {
      const res = await adminFetch("/api/admin/store/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم الحفظ", description: "تم تحديث هدف الشهر" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/store/report"] });
      setEditingGoal(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حفظ الهدف", variant: "destructive" });
    },
  });

  const stats = report?.stats;
  const completionRate = stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const monthlyGoal = baseReport?.monthlyGoal || 0;
  const thisMonthRevenue = baseReport?.thisMonth?.revenue || 0;
  const goalProgress = monthlyGoal > 0 ? Math.min(100, Math.round((thisMonthRevenue / monthlyGoal) * 100)) : 0;

  const startEditGoal = () => {
    setGoalInput(String(monthlyGoal || ""));
    setEditingGoal(true);
  };

  return (
    <AdminLayout title="تقارير المتجر">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/store">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors" data-testid="btn-back-store">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">تقارير المتجر</h1>
            <p className="text-muted-foreground text-sm">إحصائيات مفصلة حسب الفترة الزمنية</p>
          </div>
        </div>

        {/* Monthly Goal Card — always visible */}
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">هدف الشهر الحالي</CardTitle>
              </div>
              {!editingGoal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startEditGoal}
                  className="gap-1.5 text-muted-foreground hover:text-foreground h-8"
                  data-testid="btn-edit-goal"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {monthlyGoal > 0 ? "تعديل" : "تحديد هدف"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {editingGoal ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="مثال: 5000"
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  className="bg-muted/50 border-border text-center font-bold text-lg max-w-[180px]"
                  autoFocus
                  data-testid="input-monthly-goal"
                />
                <span className="text-muted-foreground text-sm whitespace-nowrap">ريال</span>
                <Button
                  size="sm"
                  onClick={() => goalMutation.mutate(parseInt(goalInput) || 0)}
                  disabled={goalMutation.isPending}
                  className="gap-1"
                  data-testid="btn-save-goal"
                >
                  {goalMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "حفظ"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingGoal(false)}>إلغاء</Button>
              </div>
            ) : monthlyGoal > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {thisMonthRevenue.toLocaleString("ar-SA")}
                      <span className="text-base font-normal text-muted-foreground mr-1">
                        / {monthlyGoal.toLocaleString("ar-SA")} ريال
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">الإيرادات المحققة هذا الشهر</div>
                  </div>
                  <div className={`text-3xl font-black ${goalProgress >= 100 ? "text-green-500" : goalProgress >= 60 ? "text-amber-500" : "text-primary"}`}>
                    {goalProgress}%
                  </div>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${goalProgress >= 100 ? "bg-green-500" : goalProgress >= 60 ? "bg-amber-500" : "bg-primary"}`}
                    style={{ width: `${goalProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>الباقي: {Math.max(0, monthlyGoal - thisMonthRevenue).toLocaleString("ar-SA")} ريال</span>
                  {goalProgress >= 100 && (
                    <span className="flex items-center gap-1 text-green-500 font-medium">
                      <Trophy className="h-3.5 w-3.5" />
                      تم تحقيق الهدف!
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 py-2">
                <div className="text-muted-foreground/40">
                  <Target className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">لم يتم تحديد هدف لهذا الشهر بعد</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditGoal}
                    className="mt-2 gap-1.5 text-primary border-primary/30"
                    data-testid="btn-set-goal"
                  >
                    <Target className="h-3.5 w-3.5" />
                    تحديد الهدف
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Period Tabs */}
        <div className="flex items-center gap-2 flex-wrap" data-testid="period-tabs">
          {PERIODS.map(p => (
            <Button
              key={p.key}
              variant={period === p.key ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.key)}
              className="rounded-full h-8 px-4 text-sm"
              data-testid={`tab-period-${p.key}`}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>جارٍ تحميل التقرير...</span>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard
                icon={TrendingUp}
                iconBg="bg-green-500/10"
                iconColor="text-green-500"
                value={(stats?.revenue || 0).toLocaleString("ar-SA") + " ر.س"}
                label="الإيرادات"
                testId="stat-revenue"
              />
              <StatCard
                icon={ShoppingCart}
                iconBg="bg-blue-500/10"
                iconColor="text-blue-500"
                value={stats?.total || 0}
                label="إجمالي الطلبات"
                testId="stat-total"
              />
              <StatCard
                icon={CheckCircle2}
                iconBg="bg-emerald-500/10"
                iconColor="text-emerald-500"
                value={stats?.completed || 0}
                label="مكتملة"
                sub={`معدل ${completionRate}%`}
                testId="stat-completed"
              />
              <StatCard
                icon={Clock}
                iconBg="bg-amber-500/10"
                iconColor="text-amber-500"
                value={stats?.pending || 0}
                label="قيد المراجعة"
                testId="stat-pending"
              />
              <StatCard
                icon={Package}
                iconBg="bg-purple-500/10"
                iconColor="text-purple-500"
                value={stats?.inProgress || 0}
                label="جارٍ التنفيذ"
                testId="stat-inprogress"
              />
              <StatCard
                icon={XCircle}
                iconBg="bg-red-500/10"
                iconColor="text-red-400"
                value={stats?.cancelled || 0}
                label="ملغاة"
                testId="stat-cancelled"
              />
            </div>

            {/* Chart */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base">
                      {period === "today" && "توزيع اليوم بالساعة"}
                      {period === "week" && "الأيام السبعة الماضية"}
                      {period === "month" && "أيام الشهر الحالي"}
                      {period === "year" && "أشهر السنة الحالية"}
                      {period === "all" && "آخر 12 شهراً"}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                    <button
                      onClick={() => setChartMode("revenue")}
                      className={`text-xs px-3 py-1 rounded-md transition-colors ${chartMode === "revenue" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                      data-testid="chart-mode-revenue"
                    >
                      الإيرادات
                    </button>
                    <button
                      onClick={() => setChartMode("total")}
                      className={`text-xs px-3 py-1 rounded-md transition-colors ${chartMode === "total" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                      data-testid="chart-mode-total"
                    >
                      الطلبات
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {report?.breakdown && <BarChart data={report.breakdown} valueKey={chartMode} />}
              </CardContent>
            </Card>

            {/* Breakdown Table */}
            {report?.breakdown && report.breakdown.some(b => b.total > 0) && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-base">تفاصيل الفترة</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" dir="rtl">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">الفترة</th>
                          <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">الطلبات</th>
                          <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">مكتملة</th>
                          <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">ملغاة</th>
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">الإيرادات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {report.breakdown.filter(b => b.total > 0).map((row, i) => (
                          <tr key={i} className="hover:bg-muted/20 transition-colors" data-testid={`breakdown-row-${i}`}>
                            <td className="px-4 py-2.5 font-medium text-foreground">{row.label}</td>
                            <td className="px-4 py-2.5 text-center text-foreground">{row.total}</td>
                            <td className="px-4 py-2.5 text-center text-emerald-500 font-medium">{row.completed}</td>
                            <td className="px-4 py-2.5 text-center text-red-400">{row.cancelled}</td>
                            <td className="px-4 py-2.5 text-left text-green-500 font-bold">
                              {row.revenue > 0 ? `${row.revenue.toLocaleString("ar-SA")} ر.س` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Services */}
            {report?.topServices && report.topServices.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Trophy className="h-4 w-4 text-purple-500" />
                    </div>
                    <CardTitle className="text-base">أكثر الخدمات طلباً</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {report.topServices.map((svc, i) => {
                      const maxCount = report.topServices[0].count;
                      const barPct = Math.round((svc.count / maxCount) * 100);
                      const rankColors = [
                        "bg-amber-400 text-amber-900",
                        "bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200",
                        "bg-orange-300 text-orange-900",
                      ];
                      return (
                        <div key={i} className="flex items-center gap-4 px-5 py-3.5" data-testid={`top-service-${i}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankColors[i] || "bg-muted text-muted-foreground"}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{svc.name}</div>
                            <div className="relative h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                              <div className="h-full bg-primary/60 rounded-full transition-all duration-500" style={{ width: `${barPct}%` }} />
                            </div>
                          </div>
                          <div className="text-right shrink-0 min-w-[80px]">
                            <div className="text-sm font-bold text-foreground">{svc.count} طلب</div>
                            {svc.revenue > 0 && (
                              <div className="text-xs text-green-500">{svc.revenue.toLocaleString("ar-SA")} ر.س</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {stats?.total === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50 gap-3">
                <BarChart3 className="h-14 w-14" />
                <p className="text-base font-medium">لا توجد طلبات في هذه الفترة</p>
                <p className="text-sm">جرّب فترة زمنية أخرى</p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
