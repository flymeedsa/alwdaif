import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "./DashboardLayout";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Briefcase, MapPin, Calendar, ExternalLink, Trash2 } from "lucide-react";
import { toDisplayUrl } from "@/lib/mediaUrl";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function DashboardFavorites() {
  usePageTitle("مفضلتي - لوحة التحكم");
  const { data: authData } = useCommunityAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favorites = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/community/favorites"],
    enabled: !!authData?.authenticated,
  });

  const removeMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("DELETE", `/api/community/favorites/${jobId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/favorites"] });
      toast({ title: "تم الحذف", description: "تم إزالة الوظيفة من المفضلة" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في إزالة الوظيفة", variant: "destructive" });
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-400" />
            مفضلتي
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            الوظائف التي حفظتها — {(favorites as any[]).length} وظيفة
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (favorites as any[]).length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Heart className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">لا توجد وظائف محفوظة</p>
            <p className="text-sm mt-1 mb-4">تصفح الوظائف واضغط على أيقونة القلب لحفظها هنا</p>
            <Link href="/jobs">
              <Button className="gap-2">
                <Briefcase className="h-4 w-4" />
                تصفح الوظائف
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {(favorites as any[]).map((fav: any) => {
              const job = fav.job;
              return (
                <Card key={fav.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      {/* Top row on mobile: logo + info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
                        {job?.logo ? (
                          <img
                            src={toDisplayUrl(job.logo) ?? ""}
                            alt={job.company}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain bg-muted p-2 border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base line-clamp-1">{job?.title}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{job?.company}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {job?.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{job.location}
                              </span>
                            )}
                            {job?.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />{job.date}
                              </span>
                            )}
                            {job?.category && (
                              <Badge variant="secondary" className="text-xs">{job.category}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                        <Link href={`/jobs/post/${fav.jobId}`} className="flex-1 sm:flex-none">
                          <Button size="sm" className="gap-1 text-xs w-full">
                            <ExternalLink className="h-3 w-3" />
                            تفاصيل
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-xs text-red-400 hover:text-red-400 hover:bg-red-500/10 flex-1 sm:flex-none"
                          onClick={() => removeMutation.mutate(fav.jobId)}
                          disabled={removeMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                          إزالة
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
    </DashboardLayout>
  );
}
