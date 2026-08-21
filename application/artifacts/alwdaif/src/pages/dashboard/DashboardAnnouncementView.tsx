import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CalendarDays, ExternalLink, Megaphone, Clock } from "lucide-react";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { usePageTitle } from "@/hooks/usePageTitle";

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

export default function DashboardAnnouncementView() {
  const params = useParams() as { id?: string };
  const id = parseInt(params.id || "0");
  const qc = useQueryClient();
  usePageTitle("الإعلان");

  useEffect(() => {
    apiRequest("PUT", "/api/community/notifications/announcements/read-all", {})
      .then(() => {
        qc.invalidateQueries({ queryKey: ["/api/community/notifications/announcements/unread-count"] });
        qc.invalidateQueries({ queryKey: ["/api/community/notifications/unread-count"] });
      }).catch(() => {});
  }, [id]);

  const { data: item, isLoading } = useQuery<Announcement>({
    queryKey: ["/api/announcements", id],
    queryFn: async () => {
      const res = await fetch(`/api/announcements/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!id,
  });

  return (
    <DashboardLayout>
      <div dir="rtl" className="max-w-3xl mx-auto space-y-4">

        {/* Back button */}
        <Link href="/dashboard/announcements">
          <Button variant="ghost" size="sm" className="gap-2 rounded-xl -me-1 text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            العودة للإعلانات
          </Button>
        </Link>

        {/* Single card wrapping everything */}
        <Card className="border-border/50 shadow-sm overflow-hidden">

          {isLoading ? (
            <CardContent className="p-6 space-y-5 animate-pulse">
              <div className="h-52 rounded-xl bg-muted/50" />
              <div className="space-y-3">
                <div className="h-4 w-1/3 bg-muted/60 rounded-lg" />
                <div className="h-7 w-2/3 bg-muted/60 rounded-lg" />
                <div className="h-4 w-full bg-muted/40 rounded-lg" />
                <div className="h-4 w-4/5 bg-muted/40 rounded-lg" />
                <div className="h-4 w-3/4 bg-muted/40 rounded-lg" />
              </div>
            </CardContent>
          ) : !item ? (
            <CardContent className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-4">
                <Megaphone className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-base font-bold">الإعلان غير موجود</p>
              <p className="text-sm text-muted-foreground mt-1">ربما تم حذفه أو انتهت صلاحيته</p>
            </CardContent>
          ) : (
            <>
              {/* Hero image */}
              {item.imageUrl && (
                <div className="w-full h-60 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Accent bar when no image */}
              {!item.imageUrl && (
                <div className="h-1 w-full bg-gradient-to-l from-primary to-blue-400" />
              )}

              {/* Header */}
              <CardHeader className="px-6 pt-5 pb-4 border-b border-border/30">
                {/* Meta badges */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs gap-1.5">
                    <Megaphone className="h-3 w-3" />
                    إعلان إداري
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(new Date(item.createdAt), "EEEE، dd MMMM yyyy", { locale: ar })}
                  </span>
                  <span className="text-xs text-muted-foreground/50 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ar })}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
                  {item.title}
                </h1>
              </CardHeader>

              {/* Body */}
              <CardContent className="px-6 py-5">
                <div
                  className="
                    prose prose-sm sm:prose-base max-w-none dark:prose-invert
                    prose-headings:font-bold prose-headings:text-foreground
                    prose-p:text-foreground/85 prose-p:leading-8
                    prose-li:text-foreground/85 prose-li:leading-7
                    prose-a:text-primary hover:prose-a:underline
                    prose-strong:text-foreground
                    prose-img:rounded-xl prose-img:shadow-sm
                  "
                  style={{ direction: "rtl", textAlign: "right" }}
                  dangerouslySetInnerHTML={{ __html: item.body }}
                />

                {/* CTA */}
                {item.linkUrl && (
                  <div className="mt-6 pt-5 border-t border-border/30">
                    <Button asChild size="lg" className="gap-2 rounded-xl w-full sm:w-auto">
                      <a href={item.linkUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        {item.linkButtonText || "اقرأ المزيد"}
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>

              {/* Footer */}
              <CardFooter className="px-6 py-3 bg-muted/20 border-t border-border/30 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  نُشر بتاريخ {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ar })}
                </p>
                <Link href="/dashboard/announcements">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
                    <ArrowRight className="h-3.5 w-3.5" />
                    جميع الإعلانات
                  </Button>
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
