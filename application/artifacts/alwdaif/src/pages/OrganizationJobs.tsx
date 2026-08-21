import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Fragment } from "react";
import { useRoute, Link } from "wouter";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import JobCard, { isJobClosed } from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toDisplayUrl } from "@/lib/mediaUrl";
import { Building2, Briefcase, ArrowRight, Bell, CheckCircle, Loader2, Users, CheckCircle2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import type { Organization } from "@shared/schema";

type OrgWithFollowers = Organization & { followerCount: number };
type OrgsResponse = { orgs: OrgWithFollowers[]; totalFollowers: number } | OrgWithFollowers[];

export default function OrganizationJobs() {
  const [, rawParams] = useRoute("/jobs/organizations/:id");
  const params = rawParams as { id?: string } | null;
  const orgId = parseInt(params?.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: authData } = useCommunityAuth();
  const isLoggedIn = !!authData?.authenticated;

  const { data: orgsData } = useQuery<OrgsResponse>({
    queryKey: ["/api/organizations"],
  });
  const organizations = Array.isArray(orgsData) ? orgsData : orgsData?.orgs ?? [];
  const org = organizations.find(o => o.id === orgId);

  usePageTitle(org ? `وظائف ${org.name}` : "وظائف الجهة");

  const { data: jobs = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/organizations/${orgId}/jobs`],
    enabled: orgId > 0,
  });

  const { data: follows = [] } = useQuery<any[]>({
    queryKey: ["/api/community/follows/organizations"],
    enabled: isLoggedIn,
  });

  const isFollowing = (follows as any[]).some((f: any) => f.organizationId === orgId);

  const followMutation = useMutation({
    mutationFn: async (following: boolean) => {
      if (following) {
        const res = await apiRequest("DELETE", `/api/community/follows/organizations/${orgId}`, {});
        return res.json();
      } else {
        const res = await apiRequest("POST", `/api/community/follows/organizations/${orgId}`, {});
        return res.json();
      }
    },
    onSuccess: (_, wasFollowing) => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/follows/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: wasFollowing ? "تم إلغاء المتابعة" : "تمت المتابعة",
        description: wasFollowing
          ? "لن تصلك إشعارات وظائف هذه الجهة"
          : "ستصلك إشعارات عند نشر وظيفة جديدة",
      });
    },
    onError: () => {
      toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً", variant: "destructive" });
    }
  });

  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");

  const openJobs = (jobs as any[]).filter(j => !isJobClosed(j));
  const closedJobs = (jobs as any[]).filter(j => isJobClosed(j));
  const tabJobs = activeTab === "open" ? openJobs : closedJobs;

  const handleFollow = () => {
    if (!isLoggedIn) {
      toast({ title: "يجب تسجيل الدخول", description: "سجّل دخولك لمتابعة الجهات", variant: "destructive" });
      return;
    }
    setIsPending(true);
    followMutation.mutate(isFollowing, { onSettled: () => setIsPending(false) });
  };

  return (
    <Layout>
      <Helmet>
        <title>{org ? `وظائف ${org.name} | إعلانات الوظائف` : "وظائف الجهة | إعلانات الوظائف"}</title>
        <meta name="description" content={org ? `تصفح أحدث وظائف ${org.name} في المملكة العربية السعودية. متابعة إعلانات التوظيف والتقديم المباشر.` : "وظائف الجهة في المملكة العربية السعودية"} />
        <link rel="canonical" href={org ? `https://www.alwdaif.com/jobs/organizations/${org.id}` : "https://www.alwdaif.com/jobs/organizations"} />
      </Helmet>

      <div className="min-h-screen" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/8 to-transparent border-b border-border/50 py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <Link href="/jobs/organizations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors" data-testid="link-back-orgs">
              <ArrowRight className="h-4 w-4" />
              العودة إلى الجهات
            </Link>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Logo */}
              <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {org?.logo ? (
                  <img src={toDisplayUrl(org.logo) ?? ""} alt={org?.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-2xl font-bold">{org?.name || "الجهة"}</h1>
                  {org?.type && (
                    <Badge variant="outline">
                      {org.type === "government" ? "حكومية" : org.type === "military" ? "عسكرية" : "شركة"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground mt-0.5">
                  <span>{(jobs as any[]).length} وظيفة منشورة</span>
                  {org && (
                    <span className="flex items-center gap-1" data-testid="text-org-follower-count">
                      <Users className="h-3.5 w-3.5" />
                      {((org as OrgWithFollowers).followerCount ?? 0).toLocaleString("ar-SA")} متابع
                    </span>
                  )}
                </div>
              </div>

              {/* Follow button */}
              <Button
                variant={isFollowing ? "default" : "outline"}
                onClick={handleFollow}
                disabled={isPending}
                className={`gap-2 ${isFollowing ? "bg-green-600 hover:bg-red-500" : ""}`}
                data-testid="button-follow-org"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    متابَعة
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    متابعة الجهة
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Jobs list */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (jobs as any[]).length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium mb-1">لا توجد وظائف منشورة</p>
              <p className="text-sm">تابع هذه الجهة لتصلك إشعارات عند نشر وظيفة جديدة</p>
              {!isFollowing && (
                <Button onClick={handleFollow} className="mt-4 gap-2" disabled={isPending} data-testid="button-follow-empty">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                  متابعة الجهة
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex items-center bg-muted rounded-xl p-1 gap-1 w-fit">
                <button
                  onClick={() => setActiveTab("open")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === "open"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="tab-org-open-jobs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  وظائف مفتوحة
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === "open"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  }`}>
                    {openJobs.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("closed")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === "closed"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="tab-org-closed-jobs"
                >
                  <Lock className="h-3.5 w-3.5 text-gray-400" />
                  وظائف مغلقة
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === "closed"
                      ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  }`}>
                    {closedJobs.length}
                  </span>
                </button>
              </div>

              {/* Jobs */}
              {tabJobs.length > 0 ? (
                <div className="space-y-3">
                  {tabJobs.map((job: any, index: number) => (
                    <Fragment key={job.id}>
                      <JobCard job={job} />
                    </Fragment>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  {activeTab === "closed"
                    ? <Lock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    : <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  }
                  <p className="text-base font-medium">
                    {activeTab === "closed" ? "لا توجد وظائف مغلقة" : "لا توجد وظائف مفتوحة حالياً"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
