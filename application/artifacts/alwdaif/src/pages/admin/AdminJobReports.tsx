import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Flag, CheckCircle, XCircle, Clock, Briefcase, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const reasonLabels: Record<string, string> = {
  broken_link: "رابط التقديم لا يعمل",
  fake_job: "وظيفة وهمية",
  expired: "الإعلان منتهي الصلاحية",
  duplicate: "إعلان مكرر",
  misleading: "معلومات مضللة",
  scam: "احتيال أو نصب",
  other: "أخرى",
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "بانتظار المراجعة",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    icon: <Clock className="h-3 w-3" />,
  },
  resolved: {
    label: "تمت المعالجة",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  dismissed: {
    label: "تم الرفض",
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    icon: <XCircle className="h-3 w-3" />,
  },
};

type UnifiedReport = {
  _id: string;
  id: number;
  source: "job" | "employer";
  jobId?: number;
  employerJobId?: number;
  reason: string;
  details?: string | null;
  reporterName?: string | null;
  reporterEmail?: string | null;
  memberId?: number | null;
  status: string;
  createdAt: string | null;
};

export default function AdminJobReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sourceFilter, setSourceFilter] = useState<"all" | "job" | "employer">("all");

  const { data: jobReports = [], isLoading: loadingJob } = useQuery<any[]>({
    queryKey: ["/api/admin/job-reports"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/job-reports");
      return res.json();
    },
  });

  const { data: employerReports = [], isLoading: loadingEmployer } = useQuery<any[]>({
    queryKey: ["/api/admin/employer-job-reports"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/employer-job-reports");
      return res.json();
    },
  });

  const isLoading = loadingJob || loadingEmployer;

  const allReports: UnifiedReport[] = [
    ...(Array.isArray(jobReports) ? jobReports.map((r: any) => ({ ...r, _id: `job-${r.id}`, source: "job" as const })) : []),
    ...(Array.isArray(employerReports) ? employerReports.map((r: any) => ({ ...r, _id: `employer-${r.id}`, source: "employer" as const })) : []),
  ].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

  const filtered = sourceFilter === "all" ? allReports : allReports.filter(r => r.source === sourceFilter);
  const pending = filtered.filter(r => r.status === "pending");
  const resolved = filtered.filter(r => r.status !== "pending");

  const resolveJobMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await adminFetch(`/api/admin/job-reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/job-reports"] });
      toast({ title: "تم التحديث", description: "تم تحديث حالة البلاغ بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في تحديث البلاغ", variant: "destructive" }),
  });

  const resolveEmployerMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await adminFetch(`/api/admin/employer-job-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employer-job-reports"] });
      toast({ title: "تم التحديث", description: "تم تحديث حالة البلاغ بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في تحديث البلاغ", variant: "destructive" }),
  });

  const handleResolve = (report: UnifiedReport, status: string) => {
    if (report.source === "job") {
      resolveJobMutation.mutate({ id: report.id, status });
    } else {
      resolveEmployerMutation.mutate({ id: report.id, status });
    }
  };

  const isPending = resolveJobMutation.isPending || resolveEmployerMutation.isPending;

  const totalPending = allReports.filter(r => r.status === "pending").length;
  const totalResolved = allReports.filter(r => r.status === "resolved").length;

  return (
    <AdminLayout title="بلاغات الوظائف">
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Link href="/admin/jobs-hub">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">بلاغات الوظائف</h1>
            <p className="text-gray-500 dark:text-gray-400">
              جميع البلاغات الواردة على الإعلانات الوظيفية من مختلف أقسام الموقع
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{totalPending}</p>
              <p className="text-sm text-muted-foreground">بانتظار المراجعة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{totalResolved}</p>
              <p className="text-sm text-muted-foreground">تمت المعالجة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-500">{allReports.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي البلاغات</p>
            </CardContent>
          </Card>
        </div>

        {/* Source filter */}
        <div className="flex items-center gap-2">
          {([
            { value: "all", label: "الكل" },
            { value: "job", label: "وظائف حكومية وشركات" },
            { value: "employer", label: "وظائف أصحاب العمل" },
          ] as const).map(f => (
            <button
              key={f.value}
              onClick={() => setSourceFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sourceFilter === f.value
                  ? "bg-rose-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
              data-testid={`filter-source-${f.value}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <Flag className="h-14 w-14 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-muted-foreground">لا توجد بلاغات حتى الآن</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  بانتظار المراجعة
                  <Badge variant="secondary">{pending.length}</Badge>
                </h2>
                {pending.map((report) => (
                  <ReportCard
                    key={report._id}
                    report={report}
                    onResolve={(status) => handleResolve(report, status)}
                    isPending={isPending}
                  />
                ))}
              </div>
            )}
            {resolved.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  المعالجة سابقاً
                  <Badge variant="outline">{resolved.length}</Badge>
                </h2>
                {resolved.map((report) => (
                  <ReportCard key={report._id} report={report} resolved />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function ReportCard({
  report,
  onResolve,
  isPending,
  resolved,
}: {
  report: UnifiedReport;
  onResolve?: (status: string) => void;
  isPending?: boolean;
  resolved?: boolean;
}) {
  const cfg = statusConfig[report.status] || statusConfig.pending;
  const isEmployer = report.source === "employer";
  const adId = isEmployer ? report.employerJobId : report.jobId;
  const adLink = isEmployer ? `/employer-jobs/${adId}` : `/jobs/post/${adId}`;

  return (
    <Card className={resolved ? "opacity-70" : ""} data-testid={`report-card-${report._id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-xs border ${cfg.color} flex items-center gap-1`}>
                {cfg.icon}
                {cfg.label}
              </Badge>
              {/* Source badge */}
              {isEmployer ? (
                <Badge className="text-xs border bg-violet-500/10 text-violet-600 border-violet-500/20 flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  وظيفة صاحب عمل
                </Badge>
              ) : (
                <Badge className="text-xs border bg-blue-500/10 text-blue-600 border-blue-500/20 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  وظيفة حكومية / شركة
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {report.createdAt
                  ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: ar })
                  : ""}
              </span>
              {adId && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  إعلان #{adId}
                </Badge>
              )}
            </div>

            <div className="text-sm">
              <span className="font-medium">السبب: </span>
              <span className="text-muted-foreground">
                {reasonLabels[report.reason] || report.reason}
              </span>
            </div>

            {report.details && (
              <p className="text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg">
                {report.details}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              {report.reporterName
                ? `أبلغ عنه: ${report.reporterName}`
                : report.memberId
                ? `عضو #${report.memberId}`
                : "زائر"}
              {report.reporterEmail && ` — ${report.reporterEmail}`}
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {!resolved && onResolve && (
              <>
                <Button
                  size="sm"
                  className="gap-1 text-xs h-8"
                  onClick={() => onResolve("resolved")}
                  disabled={isPending}
                  data-testid={`button-resolve-report-${report._id}`}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  معالجة
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs h-8"
                  onClick={() => onResolve("dismissed")}
                  disabled={isPending}
                  data-testid={`button-dismiss-report-${report._id}`}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  رفض
                </Button>
              </>
            )}
            {adId && (
              <Link href={adLink}>
                <Button size="sm" variant="ghost" className="text-xs h-8 w-full">
                  عرض الإعلان
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
