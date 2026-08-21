import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Shield, CheckCircle, XCircle, Clock, User, FolderOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "بانتظار المراجعة", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "مقبول", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "مرفوض", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: <XCircle className="h-3 w-3" /> },
};

export default function AdminCommunityModeratorRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/community/moderator-requests"],
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/admin/community/moderator-requests/${id}`, { status });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/moderator-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/stats"] });
      toast({
        title: variables.status === "approved" ? "تم القبول" : "تم الرفض",
        description: variables.status === "approved"
          ? "تم قبول طلب الإشراف بنجاح"
          : "تم رفض طلب الإشراف",
      });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تحديث الطلب", variant: "destructive" });
    },
  });

  const pending = requests.filter((r: any) => r.status === "pending");
  const resolved = requests.filter((r: any) => r.status !== "pending");

  return (
    <AdminLayout title="طلبات الإشراف">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/community">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">طلبات الإشراف</h1>
            <p className="text-gray-500 dark:text-gray-400">مراجعة طلبات الأعضاء لإشراف الأقسام</p>
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
              <p className="text-2xl font-bold text-green-500">{requests.filter((r: any) => r.status === "approved").length}</p>
              <p className="text-sm text-muted-foreground">مقبولة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-500">{requests.length}</p>
              <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <Shield className="h-14 w-14 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-muted-foreground">لا توجد طلبات إشراف حتى الآن</p>
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
                {pending.map((request: any) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onResolve={(status) => resolveMutation.mutate({ id: request.id, status })}
                    isPending={resolveMutation.isPending}
                  />
                ))}
              </div>
            )}

            {resolved.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  المراجعة سابقاً
                  <Badge variant="outline">{resolved.length}</Badge>
                </h2>
                {resolved.map((request: any) => (
                  <RequestCard key={request.id} request={request} resolved />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function RequestCard({
  request,
  onResolve,
  isPending,
  resolved,
}: {
  request: any;
  onResolve?: (status: string) => void;
  isPending?: boolean;
  resolved?: boolean;
}) {
  const cfg = statusConfig[request.status] || statusConfig.pending;

  return (
    <Card className={resolved ? "opacity-70" : ""} data-testid={`moderator-request-card-${request.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={`text-xs border ${cfg.color} flex items-center gap-1`}>
                {cfg.icon}
                {cfg.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {request.createdAt
                  ? formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: ar })
                  : ""}
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{request.member?.displayName || `عضو #${request.memberId}`}</span>
                {request.member?.username && (
                  <span className="text-muted-foreground text-xs">@{request.member.username}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {request.category?.name || `قسم #${request.categoryId}`}
                </span>
              </div>
            </div>

            {request.reason && (
              <div className="bg-muted/40 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">سبب الطلب:</p>
                <p className="text-sm">{request.reason}</p>
              </div>
            )}
          </div>

          {!resolved && onResolve && (
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                className="gap-1 text-xs h-8"
                onClick={() => onResolve("approved")}
                disabled={isPending}
                data-testid={`button-approve-request-${request.id}`}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                قبول
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs h-8 border-red-500/30 text-red-500 hover:bg-red-500/5"
                onClick={() => onResolve("rejected")}
                disabled={isPending}
                data-testid={`button-reject-request-${request.id}`}
              >
                <XCircle className="h-3.5 w-3.5" />
                رفض
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
