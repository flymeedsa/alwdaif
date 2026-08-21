import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import {
  Plus, Pencil, Trash2, Megaphone, Users, CheckCircle2, Clock, XCircle, Image, Link2, Eye,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Announcement = {
  id: number;
  title: string;
  body: string;
  targetAudience: string;
  status: string;
  imageUrl: string | null;
  linkUrl: string | null;
  linkButtonText: string | null;
  createdAt: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "نشط",   color: "bg-green-500/15 text-green-400 border-green-500/25", icon: CheckCircle2 },
  draft:  { label: "مسودة", color: "bg-amber-500/15 text-amber-400 border-amber-500/25", icon: Clock },
  ended:  { label: "منتهي", color: "bg-gray-500/15 text-gray-400 border-gray-500/25",    icon: XCircle },
};

const audienceLabel: Record<string, string> = {
  all:     "جميع الأعضاء",
  members: "الأعضاء المسجلين",
};

export default function AdminAnnouncements() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    queryFn: () => adminFetch("/api/admin/announcements").then(r => r.json()),
  });

  const { data: readStats = {} } = useQuery<Record<number, { total: number; readCount: number }>>({
    queryKey: ["/api/admin/announcements/read-stats"],
    queryFn: () => adminFetch("/api/admin/announcements/read-stats").then(r => r.json()),
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      adminFetch(`/api/admin/announcements/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({ title: "تم حذف الإعلان" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  return (
    <AdminLayout title="إعلانات الإدارة">
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <a href="/admin/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </a>
          <div>
            <h2 className="text-xl font-bold text-foreground">إعلانات الإدارة</h2>
            <p className="text-muted-foreground text-sm mt-0.5">إرسال إعلانات وتنبيهات لأعضاء المنصة</p>
          </div>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">إعلانات الإدارة</h1>
              <p className="text-sm text-muted-foreground">إرسال إعلانات لأعضاء المنصة</p>
            </div>
          </div>
          <Link href="/admin/settings/announcements/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إعلان جديد
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "الإجمالي",  value: items.length,                                           color: "text-primary" },
            { label: "نشطة",      value: items.filter(i => i.status === "active").length,        color: "text-green-400" },
            { label: "مسودة",     value: items.filter(i => i.status === "draft").length,         color: "text-amber-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium">لا توجد إعلانات بعد</p>
              <p className="text-sm mt-1">اضغط "إعلان جديد" لإنشاء أول إعلان</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const sc = statusConfig[item.status] || statusConfig.draft;
              const Icon = sc.icon;
              return (
                <Card key={item.id} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3 flex-1 min-w-0">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-14 h-14 rounded-lg object-cover border border-border shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                            <Badge variant="outline" className={cn("text-xs border", sc.color)}>
                              <Icon className="h-3 w-3 me-1" />{sc.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-muted-foreground border-border/50">
                              <Users className="h-3 w-3 me-1" />
                              {audienceLabel[item.targetAudience] || item.targetAudience}
                            </Badge>
                            {item.imageUrl && (
                              <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
                                <Image className="h-3 w-3 me-1" />صورة
                              </Badge>
                            )}
                            {item.linkUrl && (
                              <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
                                <Link2 className="h-3 w-3 me-1" />{item.linkButtonText || "رابط"}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="text-xs border-primary/30 text-primary/80 bg-primary/5"
                            >
                              <Eye className="h-3 w-3 me-1" />
                              {readStats[item.id]
                                ? `${readStats[item.id].readCount} / ${readStats[item.id].total} قرأه`
                                : "0 / 0 قرأه"}
                            </Badge>
                          </div>
                          {/* body as plain text preview */}
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                            {item.body?.replace(/<[^>]+>/g, ' ')?.replace(/\s+/g, ' ')?.trim() || ''}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {format(new Date(item.createdAt), "dd MMM yyyy، hh:mm a", { locale: ar })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/admin/settings/announcements/edit/${item.id}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          size="icon" variant="ghost"
                          className="h-8 w-8 text-red-400 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-red-400">تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
