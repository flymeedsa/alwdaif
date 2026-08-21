import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, CalendarDays, ChevronLeft, Inbox, ChevronDown } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { usePageTitle } from "@/hooks/usePageTitle";
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

const PAGE_SIZE = 10;

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").slice(0, 160);
}

export default function DashboardAnnouncements() {
  usePageTitle("الإعلانات");
  const qc = useQueryClient();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: items = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  useEffect(() => {
    apiRequest("PUT", "/api/community/notifications/announcements/read-all", {})
      .then(() => {
        qc.invalidateQueries({ queryKey: ["/api/community/notifications/announcements/unread-count"] });
        qc.invalidateQueries({ queryKey: ["/api/community/notifications/unread-count"] });
      }).catch(() => {});
  }, []);

  const visible = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <DashboardLayout>
      <div dir="rtl" className="space-y-5 max-w-3xl mx-auto">

        {/* ── Main Card ── */}
        <Card className="border-border/50 shadow-sm overflow-hidden">

          {/* Card Header */}
          <CardHeader className="px-5 py-4 border-b border-border/40 bg-gradient-to-l from-primary/5 to-transparent">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Megaphone className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-foreground leading-none mb-0.5">الإعلانات الرسمية</h1>
                  <p className="text-xs text-muted-foreground">إعلانات وتنبيهات من إدارة المنصة</p>
                </div>
              </div>
              {items.length > 0 && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs shrink-0">
                  {items.length} إعلان
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-border/30">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-5 animate-pulse space-y-3">
                    <div className="h-4 w-1/4 bg-muted/60 rounded-lg" />
                    <div className="h-5 w-3/4 bg-muted/50 rounded-lg" />
                    <div className="h-4 w-full bg-muted/40 rounded-lg" />
                    <div className="h-9 bg-muted/30 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-3">
                  <Inbox className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-base font-bold text-foreground">لا توجد إعلانات حالياً</p>
                <p className="text-sm text-muted-foreground/70 mt-1">ستظهر هنا إعلانات الإدارة عند نشرها</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-border/30">
                  {visible.map((item, idx) => (
                    <div
                      key={item.id}
                      data-testid={`announcement-card-${item.id}`}
                      className="group"
                    >
                      {/* Banner image */}
                      {item.imageUrl && (
                        <Link href={`/dashboard/announcements/${item.id}`}>
                          <div className="w-full h-44 overflow-hidden cursor-pointer">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                            />
                          </div>
                        </Link>
                      )}

                      {/* No-image accent bar */}
                      {!item.imageUrl && idx === 0 && (
                        <div className="h-0.5 w-full bg-gradient-to-l from-primary to-blue-400" />
                      )}

                      <div className="p-5 space-y-3">
                        {/* Meta */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {idx === 0 && (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] px-1.5 py-0 font-bold">
                              جديد
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                            <Megaphone className="h-2.5 w-2.5" />
                            إعلان إداري
                          </Badge>
                          <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1 me-auto">
                            <CalendarDays className="h-3 w-3" />
                            {format(new Date(item.createdAt), "dd MMMM yyyy", { locale: ar })}
                          </span>
                          <span className="text-[10px] text-muted-foreground/40">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ar })}
                          </span>
                        </div>

                        {/* Title */}
                        <Link href={`/dashboard/announcements/${item.id}`}>
                          <h2
                            className="text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer leading-snug"
                            data-testid={`announcement-title-${item.id}`}
                          >
                            {item.title}
                          </h2>
                        </Link>

                        {/* Excerpt */}
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {stripHtml(item.body)}
                        </p>

                        {/* CTA */}
                        <Link href={`/dashboard/announcements/${item.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 h-9 text-sm rounded-xl"
                            data-testid={`read-announcement-${item.id}`}
                          >
                            قراءة الإعلان
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="border-t border-border/30 p-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-sm text-muted-foreground"
                      onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                    >
                      <ChevronDown className="h-4 w-4" />
                      عرض المزيد ({items.length - visibleCount} إعلان متبقٍّ)
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
