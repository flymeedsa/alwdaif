import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "./DashboardLayout";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell, MessageSquare, ThumbsUp, CheckCheck, Briefcase,
  ShoppingBag, PackageCheck, Heart, FileText, AlertCircle,
  ExternalLink, Trash2, Megaphone, ChevronDown, CheckCheck as Check, Inbox
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PAGE_SIZE = 10;

const notificationConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  reply_post:          { icon: MessageSquare, color: "text-blue-400",   bg: "bg-blue-500/10",   label: "رد على موضوعك"       },
  reply_comment:       { icon: MessageSquare, color: "text-green-400",  bg: "bg-green-500/10",  label: "رد على تعليقك"       },
  like_post:           { icon: ThumbsUp,      color: "text-rose-400",   bg: "bg-rose-500/10",   label: "إعجاب بموضوعك"      },
  like_comment:        { icon: ThumbsUp,      color: "text-rose-400",   bg: "bg-rose-500/10",   label: "إعجاب بتعليقك"      },
  new_post:            { icon: FileText,      color: "text-indigo-400", bg: "bg-indigo-500/10", label: "موضوع جديد"          },
  new_order:           { icon: ShoppingBag,   color: "text-purple-400", bg: "bg-purple-500/10", label: "طلب جديد"            },
  order_status_change: { icon: PackageCheck,  color: "text-amber-400",  bg: "bg-amber-500/10",  label: "تحديث حالة الطلب"   },
  job_saved:           { icon: Heart,         color: "text-pink-400",   bg: "bg-pink-500/10",   label: "وظيفة محفوظة"       },
  job:                 { icon: Briefcase,     color: "text-amber-400",  bg: "bg-amber-500/10",  label: "وظيفة"              },
  new_job_alert:       { icon: Briefcase,     color: "text-amber-400",  bg: "bg-amber-500/10",  label: "تنبيه وظيفة"        },
  order:               { icon: ShoppingBag,   color: "text-purple-400", bg: "bg-purple-500/10", label: "طلب"                 },
  announcement:        { icon: Megaphone,     color: "text-primary",    bg: "bg-primary/10",    label: "إعلان من الإدارة"  },
  system:              { icon: AlertCircle,   color: "text-orange-400", bg: "bg-orange-500/10", label: "إشعار نظام"         },
  general:             { icon: Bell,          color: "text-gray-400",   bg: "bg-gray-500/10",   label: "إشعار"              },
};

export default function DashboardNotifications() {
  usePageTitle("الإشعارات - لوحة التحكم");
  const { data: authData } = useCommunityAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/community/notifications"],
    enabled: !!authData?.authenticated,
    refetchInterval: 30000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/community/notifications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/community/notifications/unread-count"] });
    queryClient.invalidateQueries({ queryKey: ["/api/community/notifications/announcements/unread-count"] });
  };

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/community/notifications/${id}/read`, {});
      return res.json();
    },
    onSuccess: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/community/notifications/read-all", {});
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "تم", description: "تم تعليم جميع الإشعارات كمقروءة" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/community/notifications/${id}`, {});
      return res.json();
    },
    onSuccess: invalidate,
    onError: () => toast({ title: "خطأ", description: "فشل حذف الإشعار", variant: "destructive" }),
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/community/notifications", {});
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setVisibleCount(PAGE_SIZE);
      toast({ title: "تم", description: "تم حذف جميع الإشعارات" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل حذف الإشعارات", variant: "destructive" }),
  });

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) markReadMutation.mutate(n.id);
    if (n.link) setLocation(n.link);
    else if (n.postId) setLocation(`/community/post/${n.postId}`);
  };

  const allNotifications = notifications as any[];
  const visibleNotifications = allNotifications.slice(0, visibleCount);
  const hasMore = allNotifications.length > visibleCount;
  const unreadCount = allNotifications.filter((n: any) => !n.isRead).length;
  const readCount = allNotifications.length - unreadCount;

  // Group visible notifications by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const grouped: { label: string; items: any[] }[] = [];
  const todayItems    = visibleNotifications.filter(n => new Date(n.createdAt) >= today);
  const yesterdayItems = visibleNotifications.filter(n => { const d = new Date(n.createdAt); return d >= yesterday && d < today; });
  const olderItems    = visibleNotifications.filter(n => new Date(n.createdAt) < yesterday);
  if (todayItems.length)     grouped.push({ label: "اليوم",  items: todayItems });
  if (yesterdayItems.length) grouped.push({ label: "أمس",    items: yesterdayItems });
  if (olderItems.length)     grouped.push({ label: "سابقاً", items: olderItems });

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-3xl mx-auto" dir="rtl">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-amber-400" />
              الإشعارات
              {unreadCount > 0 && (
                <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-xs px-2">
                  {unreadCount} جديد
                </Badge>
              )}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              جميع تنبيهاتك من المنصة — المجتمع والطلبات والوظائف
            </p>
          </div>

          {/* Action buttons */}
          {allNotifications.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending || unreadCount === 0}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                مقروء للكل
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs text-red-500 hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/5"
                    data-testid="button-delete-all-notifications"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف الكل
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف جميع الإشعارات</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف جميع إشعاراتك ({allNotifications.length} إشعار) نهائياً ولا يمكن التراجع.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row-reverse gap-2">
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => deleteAllMutation.mutate()}
                    >
                      نعم، احذف الكل
                    </AlertDialogAction>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center border-border/60 bg-card">
            <p className="text-2xl font-black text-foreground">{allNotifications.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">إجمالي الإشعارات</p>
          </Card>
          <Card className="p-4 text-center border-red-500/20 bg-red-500/5">
            <p className="text-2xl font-black text-red-400">{unreadCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">غير مقروءة</p>
          </Card>
          <Card className="p-4 text-center border-green-500/20 bg-green-500/5">
            <p className="text-2xl font-black text-green-400">{readCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">مقروءة</p>
          </Card>
        </div>

        {/* ── List ── */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : allNotifications.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Inbox className="h-10 w-10 opacity-30" />
            </div>
            <p className="text-lg font-bold text-foreground">لا توجد إشعارات بعد</p>
            <p className="text-sm mt-2">
              ستظهر هنا إشعاراتك عند نشر موضوع، تقديم طلب، أو تفاعل الأعضاء معك
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(group => (
              <div key={group.label}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.items.map((n: any) => {
                    const cfg = notificationConfig[n.type] || notificationConfig.general;
                    const Icon = cfg.icon;
                    const hasLink = !!(n.link || n.postId);
                    return (
                      <div
                        key={n.id}
                        data-testid={`notification-item-${n.id}`}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-xl border transition-all group",
                          n.isRead
                            ? "bg-muted/20 border-border/50 hover:bg-muted/30"
                            : "bg-card border-primary/20 hover:border-primary/40 shadow-sm"
                        )}
                      >
                        {/* Icon */}
                        <div
                          className={cn("p-2.5 rounded-xl shrink-0 mt-0.5", cfg.bg, hasLink && "cursor-pointer")}
                          onClick={() => hasLink && handleNotificationClick(n)}
                        >
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                        </div>

                        {/* Content */}
                        <div
                          className={cn("flex-1 min-w-0", hasLink && "cursor-pointer")}
                          onClick={() => hasLink && handleNotificationClick(n)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className={cn("text-sm leading-relaxed", !n.isRead && "font-medium")}>
                            {n.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ar })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mb-0.5" />}
                          {hasLink && (
                            <button
                              onClick={() => handleNotificationClick(n)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground/50 hover:text-primary transition-colors"
                              title="فتح الرابط"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {!n.isRead && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(n.id); }}
                              className="p-1 rounded hover:bg-muted text-muted-foreground/50 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                              title="تعليم كمقروء"
                              data-testid={`button-mark-read-${n.id}`}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(n.id); }}
                            disabled={deleteMutation.isPending}
                            className="p-1 rounded hover:bg-red-500/10 text-muted-foreground/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="حذف الإشعار"
                            data-testid={`button-delete-notification-${n.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="text-center pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  data-testid="button-load-more-notifications"
                >
                  <ChevronDown className="h-4 w-4" />
                  تحميل المزيد ({allNotifications.length - visibleCount} متبقي)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
