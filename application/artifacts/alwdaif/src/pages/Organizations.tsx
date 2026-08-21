import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toDisplayUrl } from "@/lib/mediaUrl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Search, Briefcase, Bell, CheckCircle, Loader2, Users, ArrowUpDown, ChevronDown, Landmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { cn } from "@/lib/utils";
import type { Organization } from "@shared/schema";

type OrgWithFollowers = Organization & { followerCount: number };
type OrgsResponse = { orgs: OrgWithFollowers[]; totalFollowers: number };

const PAGE_SIZE = 16;

type TabKey = "all" | "government" | "company";

export default function Organizations() {
  usePageTitle("الجهات");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [sortBy, setSortBy] = useState<"alphabetical" | "followers" | "newest">("alphabetical");
  const [allVisible, setAllVisible] = useState(PAGE_SIZE);
  const [govVisible, setGovVisible] = useState(PAGE_SIZE);
  const [compVisible, setCompVisible] = useState(PAGE_SIZE);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: authData } = useCommunityAuth();
  const isLoggedIn = !!authData?.authenticated;

  const { data: orgsData, isLoading } = useQuery<OrgsResponse>({
    queryKey: ["/api/organizations"],
  });

  const orgs = orgsData?.orgs ?? [];
  const totalFollowers = orgsData?.totalFollowers ?? 0;

  const { data: follows = [] } = useQuery<any[]>({
    queryKey: ["/api/community/follows/organizations"],
    enabled: isLoggedIn,
  });

  const followedIds = new Set((follows as any[]).map((f: any) => f.organizationId));
  const [pendingOrgId, setPendingOrgId] = useState<number | null>(null);

  const followMutation = useMutation({
    mutationFn: async ({ id, following }: { id: number; following: boolean }) => {
      if (following) {
        const res = await apiRequest("DELETE", `/api/community/follows/organizations/${id}`, {});
        return res.json();
      } else {
        const res = await apiRequest("POST", `/api/community/follows/organizations/${id}`, {});
        return res.json();
      }
    },
    onSuccess: (data, variables) => {
      setPendingOrgId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/community/follows/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({
        title: variables.following ? "تم إلغاء المتابعة" : "تمت المتابعة",
        description: variables.following
          ? "لن تصلك إشعارات وظائف هذه الجهة"
          : "ستصلك إشعارات عند نشر وظيفة جديدة لهذه الجهة",
      });
    },
    onError: (err) => {
      setPendingOrgId(null);
      toast({ title: "خطأ", description: err.message || "فشل في تنفيذ العملية", variant: "destructive" });
    }
  });

  const handleFollow = (org: OrgWithFollowers) => {
    if (!isLoggedIn) {
      toast({ title: "يجب تسجيل الدخول", description: "سجّل دخولك لمتابعة الجهات", variant: "destructive" });
      return;
    }
    setPendingOrgId(org.id);
    followMutation.mutate({ id: org.id, following: followedIds.has(org.id) });
  };

  const filtered = orgs
    .filter(org => {
      if (!org.isActive) return false;
      return !search || org.name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === "followers") return b.followerCount - a.followerCount;
      if (sortBy === "newest") return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      return a.name.localeCompare(b.name, "ar");
    });

  const govOrgs = filtered.filter(o => o.type === "government" || o.type === "military");
  const companyOrgs = filtered.filter(o => o.type === "company" || o.type === "private");

  const tabs = [
    { key: "all" as TabKey, label: "الكل", count: filtered.length, icon: Users, color: "text-primary" },
    { key: "government" as TabKey, label: "الجهات الحكومية", count: govOrgs.length, icon: Landmark, color: "text-primary" },
    { key: "company" as TabKey, label: "الشركات", count: companyOrgs.length, icon: Building2, color: "text-amber-500" },
  ];

  const currentOrgs = activeTab === "all" ? filtered : activeTab === "government" ? govOrgs : companyOrgs;
  const visibleCount = activeTab === "all" ? allVisible : activeTab === "government" ? govVisible : compVisible;
  const setVisibleCount = activeTab === "all" ? setAllVisible : activeTab === "government" ? setGovVisible : setCompVisible;
  const visible = currentOrgs.slice(0, visibleCount);
  const hasMore = visibleCount < currentOrgs.length;

  return (
    <Layout>
      <Helmet>
        <title>جهات التوظيف الحكومية والخاصة | إعلانات الوظائف</title>
        <meta name="description" content="تصفح جهات التوظيف الحكومية والشركات الخاصة في المملكة العربية السعودية. تابع وظائفها الجديدة وانضم لقوائم التنبيه." />
        <link rel="canonical" href="https://www.alwdaif.com/organizations" />
      </Helmet>

      <div className="min-h-screen" dir="rtl">
        {/* Hero */}
        <div className="bg-gradient-to-b from-primary/8 to-transparent border-b border-border/50 py-10 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">جهات التوظيف</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">قائمة الجهات</h1>
            <p className="text-muted-foreground">تصفح الجهات الحكومية والشركات وتابع وظائفها الجديدة مباشرة</p>
            {!isLoading && (
              <div className="inline-flex items-center gap-2 mt-4 bg-muted/60 border border-border rounded-full px-5 py-2 text-sm text-muted-foreground" data-testid="text-total-followers">
                <Users className="h-4 w-4 text-primary" />
                <span>
                  إجمالي متابعي الجهات:{" "}
                  <span className="font-bold text-foreground">{totalFollowers.toLocaleString("ar-SA")}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن جهة..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
                data-testid="input-org-search"
              />
            </div>
            <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="h-10 w-auto gap-1.5 text-sm" data-testid="select-sort-orgs">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="alphabetical" data-testid="sort-option-alphabetical">أبجدي</SelectItem>
                <SelectItem value="followers" data-testid="sort-option-followers">الأكثر متابعة</SelectItem>
                <SelectItem value="newest" data-testid="sort-option-newest">الأحدث</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs — right-aligned, clear */}
          <div className="flex justify-start gap-0 border-b border-border">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  data-testid={`tab-${tab.key}`}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-150 -mb-px",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? tab.color : "")} />
                  {tab.label}
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full font-bold",
                    isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : currentOrgs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد جهات</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {visible.map((org, index) => {
                  const isFollowing = followedIds.has(org.id);
                  const isPending = pendingOrgId === org.id;
                  return (
                    <Fragment key={org.id}>
                    <div
                      className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-3 hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                      data-testid={`card-org-${org.id}`}
                    >
                      {/* Logo */}
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                        {org.logo ? (
                          <img src={toDisplayUrl(org.logo) ?? ""} alt={org.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>

                      {/* Name */}
                      <p className="text-sm font-bold text-center leading-tight line-clamp-2">{org.name}</p>

                      {/* Badge + followers */}
                      <div className="flex flex-col items-center gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {org.type === "government" ? "حكومية" : org.type === "military" ? "عسكرية" : "شركة"}
                        </Badge>
                        <span
                          className="flex items-center gap-1 text-xs text-muted-foreground"
                          data-testid={`text-follower-count-${org.id}`}
                        >
                          <Users className="h-3 w-3" />
                          {org.followerCount.toLocaleString("ar-SA")} متابع
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 w-full mt-auto">
                        <Link href={`/jobs/organizations/${org.id}`} data-testid={`link-org-jobs-${org.id}`}>
                          <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                            <Briefcase className="h-3.5 w-3.5" />
                            تصفح الوظائف
                          </Button>
                        </Link>
                        <Button
                          variant={isFollowing ? "default" : "ghost"}
                          size="sm"
                          className={`w-full text-xs gap-1.5 ${isFollowing ? "bg-green-600 hover:bg-red-500 text-white" : "border border-dashed border-border hover:border-primary"}`}
                          onClick={() => handleFollow(org)}
                          disabled={isPending}
                          data-testid={`button-follow-org-${org.id}`}
                        >
                          {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isFollowing ? (
                            <><CheckCircle className="h-3.5 w-3.5" />متابَعة</>
                          ) : (
                            <><Bell className="h-3.5 w-3.5" />متابعة</>
                          )}
                        </Button>
                      </div>
                    </div>
                    </Fragment>
                  );
                })}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    className="gap-2 px-8"
                    onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                    data-testid="button-load-more"
                  >
                    <ChevronDown className="h-4 w-4" />
                    عرض المزيد ({currentOrgs.length - visibleCount} جهة متبقية)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
