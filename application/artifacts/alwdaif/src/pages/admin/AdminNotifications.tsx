import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Briefcase, 
  FileText, 
  Users, 
  CheckCheck,
  Trash2,
  Clock,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  type: "job" | "article" | "user" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: "job",
    title: "وظيفة جديدة مضافة",
    message: "تمت إضافة وظيفة 'مهندس برمجيات' بنجاح",
    time: "منذ 5 دقائق",
    read: false,
  },
  {
    id: 2,
    type: "article",
    title: "مقال جديد منشور",
    message: "تم نشر مقال 'نصائح للمقابلات الوظيفية'",
    time: "منذ ساعة",
    read: false,
  },
  {
    id: 3,
    type: "system",
    title: "تحديث النظام",
    message: "تم تحديث النظام إلى الإصدار 2.0",
    time: "منذ 3 ساعات",
    read: true,
  },
  {
    id: 4,
    type: "user",
    title: "مستخدم جديد",
    message: "تم تسجيل مستخدم جديد في الموقع",
    time: "منذ يوم",
    read: true,
  },
  {
    id: 5,
    type: "job",
    title: "تم تعديل وظيفة",
    message: "تم تعديل وظيفة 'محاسب أول' بنجاح",
    time: "منذ يومين",
    read: true,
  },
];

const typeIcons = {
  job: Briefcase,
  article: FileText,
  user: Users,
  system: AlertCircle,
};

const typeColors = {
  job: "bg-blue-500/20 text-blue-400",
  article: "bg-purple-500/20 text-purple-400",
  user: "bg-green-500/20 text-green-400",
  system: "bg-orange-500/20 text-orange-400",
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filter === "unread" 
    ? notifications.filter((n) => !n.read) 
    : notifications;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <AdminLayout title="الإشعارات">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
                <Bell className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-foreground">الإشعارات</CardTitle>
                <p className="text-muted-foreground text-sm">{unreadCount} إشعار غير مقروء</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="border-border text-muted-foreground hover:text-foreground"
                disabled={unreadCount === 0}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="h-4 w-4 ml-2" />
                قراءة الكل
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="border-border text-red-400 hover:text-red-300 hover:border-red-400/50"
                disabled={notifications.length === 0}
                data-testid="button-clear-all"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف الكل
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className={filter !== "all" ? "border-border text-muted-foreground" : ""}
                data-testid="button-filter-all"
              >
                الكل ({notifications.length})
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("unread")}
                className={filter !== "unread" ? "border-border text-muted-foreground" : ""}
                data-testid="button-filter-unread"
              >
                غير مقروء ({unreadCount})
              </Button>
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const Icon = typeIcons[notification.type];
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer hover:bg-muted",
                        notification.read 
                          ? "bg-muted/50 border-border/50" 
                          : "bg-primary/5 border-primary/20"
                      )}
                      onClick={() => markAsRead(notification.id)}
                      data-testid={`notification-${notification.id}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", typeColors[notification.type])}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={cn("font-medium", notification.read ? "text-muted-foreground" : "text-foreground")}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mt-1">{notification.message}</p>
                          <div className="flex items-center gap-1 mt-2 text-muted-foreground/70 text-xs">
                            <Clock className="h-3 w-3" />
                            <span>{notification.time}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                          data-testid={`button-delete-${notification.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
