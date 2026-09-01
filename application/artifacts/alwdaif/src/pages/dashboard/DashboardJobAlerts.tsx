import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "./DashboardLayout";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Briefcase, Building2, ExternalLink, BellOff, CheckCheck, ShoppingCart, Zap, AlertTriangle, ChevronDown } from "lucide-react";
import { toDisplayUrl } from "@/lib/mediaUrl";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { Organization } from "@shared/schema";

const PAGE_SIZE = 12;
const ORGS_PAGE_SIZE = 8;

export default function DashboardJobAlerts() {
  usePageTitle("تنبيهات الوظائف - لوحة التحكم");
  const { data: authData } = useCommunityAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [visibleOrgsCount, setVisibleOrgsCount] = useState(ORGS_PAGE_SIZE);

  const { data: alerts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/community/job-alerts"],
    enabled: !!authData?.authenticated,
    refetchInterval: 30000,
  });

  const { data: follows = [] } = useQuery<any[]>({
    queryKey: ["/api/community/follows/organizations"],
    enabled: !!authData?.authenticated,
  });

  const { data: pointsData } = useQuery<{ freePoints: number; paidPoints: number; points: number }>({
    queryKey: ["/api/community/job-alert-points"],
    enabled: !!authData?.authenticated,
    refetchInterval: 60000,
  });

  const { data: orgsData } = useQuery<{ orgs: Organization[]; totalFollowers: number }>({
    queryKey: ["/api/organizations"],
  });
  const orgs = orgsData?.orgs ?? [];

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/community/notifications/${id}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/job-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/community/notifications/read-all", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/job-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/notifications/unread-count"] });
      toast({ title: "تم تعليم الكل كمقروء" });
    },
  });

  const alertItems = Array.isArray(alerts) ? alerts : [];
  const followItems = Array.isArray(follows) ? follows : [];
  const unreadCount = alertItems.filter((a: any) => !a.isRead).length;
  const followedOrgs = followItems.map((f: any) => {
    const org = (orgs as Organization[]).find(o => o.id === f.organizationId);
    return org;
  }).filter(Boolean);

  const points = pointsData?.points ?? 0;
  const freePoints = pointsData?.freePoints ?? 0;
  const paidPoints = pointsData?.paidPoints ?? 0;
  const isLowPoints = points > 0 && points <= 10;
  const isOutOfPoints = points === 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-amber-400" />
              تنبيهات الوظائف
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              إشعارات الوظائف من الجهات التي تتابعها
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              data-testid="button-mark-all-read"
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              تعليم الكل كمقروء
              <Badge variant="secondary">{unreadCount}</Badge>
            </Button>
          )}
        </div>

        {/* Points Balance Card */}
        <div className={cn(
          "rounded-2xl border p-5 flex items-center justify-between gap-4 flex-wrap",
          isOutOfPoints
            ? "bg-red-500/5 border-red-400/30"
            : isLowPoints
            ? "bg-amber-500/5 border-amber-400/30"
            : "bg-card border-border"
        )} data-testid="card-job-alert-points">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              isOutOfPoints ? "bg-red-500/10" : isLowPoints ? "bg-amber-500/10" : "bg-amber-500/10"
            )}>
              {isOutOfPoints ? (
                <AlertTriangle className="h-6 w-6 text-red-400" />
              ) : isLowPoints ? (
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              ) : (
                <Zap className="h-6 w-6 text-amber-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">رصيد نقاط التنبيه</p>
              <p className={cn(
                "text-3xl font-bold",
                isOutOfPoints ? "text-red-400" : isLowPoints ? "text-amber-400" : "text-foreground"
              )} data-testid="text-job-alert-points">
                {paidPoints.toLocaleString("ar-SA")}
                <span className="text-base font-medium text-muted-foreground mr-1">مدفوع</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                رصيدك المجاني: <span className="font-semibold text-foreground">{freePoints.toLocaleString("ar-SA")}</span> نقطة
              </p>
              {isOutOfPoints && (
                <p className="text-xs text-red-400 mt-0.5">نفد رصيدك — لن تصلك إشعارات جديدة</p>
              )}
              {isLowPoints && (
                <p className="text-xs text-amber-400 mt-0.5">رصيدك منخفض — اشحن قريباً</p>
              )}
            </div>
          </div>
          <Link href="/store/services/job-alert-points">
            <Button
              className={cn(
                "gap-2 shrink-0",
                isOutOfPoints
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              )}
              data-testid="button-buy-job-alert-points"
            >
              <ShoppingCart className="h-4 w-4" />
              {isOutOfPoints ? "اشحن الآن" : "شحن نقاط"}
            </Button>
          </Link>
        </div>

        {/* Followed orgs summary */}
        {followedOrgs.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              الجهات التي تتابعها ({followedOrgs.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {followedOrgs.slice(0, visibleOrgsCount).map((org: any) => (
                <Link key={org.id} href={`/jobs/organizations/${org.id}`}>
                  <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-1.5 hover:bg-primary/10 transition-colors cursor-pointer border border-transparent hover:border-primary/20" data-testid={`link-followed-org-${org.id}`}>
                    {org.logo ? (
                      <img src={toDisplayUrl(org.logo) ?? ""} alt={org.name} className="w-5 h-5 object-contain rounded" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium">{org.name}</span>
                  </div>
                </Link>
              ))}
              {visibleOrgsCount < followedOrgs.length && (
                <button
                  onClick={() => setVisibleOrgsCount(v => v + ORGS_PAGE_SIZE)}
                  className="flex items-center gap-1.5 bg-muted/60 border border-dashed border-border rounded-xl px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  data-testid="button-load-more-orgs"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  {followedOrgs.length - visibleOrgsCount} أخرى
                </button>
              )}
            </div>
          </div>
        )}

        {/* Alerts list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : alertItems.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BellOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium mb-1">لا توجد تنبيهات</p>
            <p className="text-sm mb-4">
              {followedOrgs.length === 0
                ? "تابع الجهات التي تهمك لتصلك تنبيهات عند نشر وظيفة جديدة"
                : "ستصلك تنبيهات هنا عند نشر وظائف جديدة من الجهات التي تتابعها"}
            </p>
            <Link href="/jobs/organizations">
              <Button variant="outline" className="gap-2" data-testid="link-browse-orgs">
                <Building2 className="h-4 w-4" />
                تصفح الجهات
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {alertItems.slice(0, visibleCount).map((alert: any) => (
              <div
                key={alert.id}
                className={cn(
                  "bg-card border rounded-2xl p-4 flex items-start gap-3 transition-all cursor-pointer hover:border-amber-400/40",
                  !alert.isRead ? "border-amber-400/30 bg-amber-500/5" : "border-border"
                )}
                onClick={() => {
                  if (!alert.isRead) markReadMutation.mutate(alert.id);
                }}
                data-testid={`alert-item-${alert.id}`}
              >
                {/* Icon */}
                <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-amber-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {alert.createdAt && formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: ar })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!alert.isRead && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  )}
                  {alert.link && (
                    <Link href={alert.link} onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`link-alert-${alert.id}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {visibleCount < alertItems.length && (
              <div className="pt-2 text-center">
                <Button
                  variant="outline"
                  className="gap-2 w-full sm:w-auto"
                  onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                  data-testid="button-load-more-alerts"
                >
                  <ChevronDown className="h-4 w-4" />
                  تحميل المزيد
                  <span className="text-muted-foreground text-xs">
                    ({alertItems.length - visibleCount} متبقية)
                  </span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
