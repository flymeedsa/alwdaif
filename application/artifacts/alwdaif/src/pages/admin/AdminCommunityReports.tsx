import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Flag, CheckCircle, XCircle, Clock, MessageSquare, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const reasonLabels: Record<string, string> = {
  spam: "محتوى مزعج",
  offensive: "محتوى مسيء",
  misinformation: "معلومات مضللة",
  inappropriate: "محتوى غير لائق",
  other: "أخرى",
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "بانتظار المراجعة", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: <Clock className="h-3 w-3" /> },
  resolved: { label: "تمت المعالجة", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: <CheckCircle className="h-3 w-3" /> },
  dismissed: { label: "تم الرفض", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: <XCircle className="h-3 w-3" /> },
};

export default function AdminCommunityReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/community/reports"],
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/admin/community/reports/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/stats"] });
      toast({ title: "تم التحديث", description: "تم تحديث حالة البلاغ بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تحديث البلاغ", variant: "destructive" });
    },
  });

  const pending = reports.filter((r: any) => r.status === "pending");
  const resolved = reports.filter((r: any) => r.status !== "pending");

  return (
    <AdminLayout title="بلاغات المجتمع">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/community">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">بلاغات المجتمع</h1>
            <p className="text-gray-500 dark:text-gray-400">مراجعة ومعالجة البلاغات المُرسلة من الأعضاء</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{pending.length}</p>
              <p className="text-sm text-muted-foreground">بانتظار المراجعة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{reports.filter((r: any) => r.status === "resolved").length}</p>
              <p className="text-sm text-muted-foreground">تمت المعالجة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-500">{reports.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي البلاغات</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
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
                {pending.map((report: any) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onResolve={(status) => resolveMutation.mutate({ id: report.id, status })}
                    isPending={resolveMutation.isPending}
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
                {resolved.map((report: any) => (
                  <ReportCard key={report.id} report={report} resolved />
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
  report: any;
  onResolve?: (status: string) => void;
  isPending?: boolean;
  resolved?: boolean;
}) {
  const cfg = statusConfig[report.status] || statusConfig.pending;

  return (
    <Card className={resolved ? "opacity-70" : ""} data-testid={`report-card-${report.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={`text-xs border ${cfg.color} flex items-center gap-1`}>
                {cfg.icon}
                {cfg.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {report.createdAt
                  ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: ar })
                  : ""}
              </span>
              {report.postId && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  منشور #{report.postId}
                </Badge>
              )}
              {report.commentId && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  تعليق #{report.commentId}
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
              أبلغ عنه: <span className="font-medium">عضو #{report.reporterId}</span>
            </p>
          </div>

          {!resolved && onResolve && (
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                className="gap-1 text-xs h-8"
                onClick={() => onResolve("resolved")}
                disabled={isPending}
                data-testid={`button-resolve-report-${report.id}`}
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
                data-testid={`button-dismiss-report-${report.id}`}
              >
                <XCircle className="h-3.5 w-3.5" />
                رفض
              </Button>
              {report.postId && (
                <Link href={`/community/post/${report.postId}`}>
                  <Button size="sm" variant="ghost" className="text-xs h-8 w-full">
                    عرض المنشور
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
