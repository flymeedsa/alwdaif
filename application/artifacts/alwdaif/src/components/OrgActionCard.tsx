import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, Briefcase, Bell, CheckCircle, Loader2, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import type { Organization } from "@shared/schema";
import { toDisplayUrl } from "@/lib/mediaUrl";

type OrgWithFollowers = Organization & { followerCount: number };
type OrgsResponse =
  | { orgs: OrgWithFollowers[]; totalFollowers: number }
  | OrgWithFollowers[];

interface OrgActionCardProps {
  org?: Organization | null;
  jobCompany?: string;
  jobLogo?: string | null;
  variant?: "default" | "compact";
}

export default function OrgActionCard({ org, jobCompany, jobLogo, variant = "default" }: OrgActionCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: authData } = useCommunityAuth();
  const isLoggedIn = !!authData?.authenticated;

  const { data: follows = [] } = useQuery<any[]>({
    queryKey: ["/api/community/follows/organizations"],
    enabled: isLoggedIn,
  });

  const { data: orgsData } = useQuery<OrgsResponse>({
    queryKey: ["/api/organizations"],
  });

  // The Node API returns { orgs, totalFollowers }, while the Cloudways PHP
  // bridge returns the organizations array directly. Support both contracts so
  // a missing wrapper cannot take down the entire page during rendering.
  const organizations = Array.isArray(orgsData) ? orgsData : orgsData?.orgs ?? [];
  const followerCount = organizations.find(o => o.id === org?.id)?.followerCount ?? 0;

  const isFollowing = org ? (follows as any[]).some((f: any) => f.organizationId === org.id) : false;

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        const res = await apiRequest("DELETE", `/api/community/follows/organizations/${org!.id}`, {});
        return res.json();
      } else {
        const res = await apiRequest("POST", `/api/community/follows/organizations/${org!.id}`, {});
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/follows/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/notifications/unread-count"] });
      toast({
        title: isFollowing ? "تم إلغاء المتابعة" : "تمت المتابعة",
        description: isFollowing
          ? "لن تصلك إشعارات وظائف هذه الجهة"
          : "ستصلك إشعارات عند نشر وظيفة جديدة لهذه الجهة",
      });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تنفيذ العملية", variant: "destructive" });
    }
  });

  const handleFollow = () => {
    if (!isLoggedIn) {
      toast({ title: "يجب تسجيل الدخول", description: "سجّل دخولك لمتابعة الجهات", variant: "destructive" });
      return;
    }
    if (!org) return;
    followMutation.mutate();
  };

  const name = org?.name || jobCompany || "الجهة";
  const logo = toDisplayUrl(org?.logo || jobLogo);
  const orgId = org?.id;

  const followerLabel = org
    ? `${followerCount.toLocaleString("ar-SA")} متابع`
    : "تابع أحدث وظائف الجهة";

  if (variant === "compact") {
    return (
      <div className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3" dir="rtl" data-testid="org-card-compact">
        <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center p-1 shrink-0">
          {logo ? <img src={logo} alt={name} className="w-full h-full object-contain" /> : <Building2 className="h-5 w-5 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1" data-testid="text-org-follower-label-compact">
            {org && <Users className="h-3 w-3 shrink-0" />}
            {followerLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {orgId && (
            <Link href={`/jobs/organizations/${orgId}`}>
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8" data-testid="button-org-jobs">
                <Briefcase className="h-3.5 w-3.5" />
                وظائف
              </Button>
            </Link>
          )}
          <Button
            variant={isFollowing ? "default" : "ghost"}
            size="sm"
            className={`text-xs gap-1.5 h-8 ${isFollowing ? "bg-green-600 hover:bg-red-500 text-white" : "border border-dashed border-border hover:border-primary"}`}
            onClick={handleFollow}
            disabled={followMutation.isPending}
            data-testid="button-org-follow"
          >
            {followMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isFollowing ? <CheckCircle className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            {isFollowing ? "متابَعة" : "متابعة"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl" dir="rtl" data-testid="org-card-default">
      <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between overflow-hidden">
        {/* Info row */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-background border border-border flex items-center justify-center p-2 shadow-sm shrink-0">
            {logo ? (
              <img src={logo} alt={name} className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-full h-full text-primary" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-foreground font-black text-sm md:text-lg leading-tight mb-0.5 break-words">{name}</span>
            <span className="text-muted-foreground text-[10px] md:text-xs font-medium flex items-center gap-1" data-testid="text-org-follower-label">
              {org && <Users className="h-3 w-3 shrink-0" />}
              {followerLabel}
            </span>
          </div>
        </div>

        {/* Buttons row — full-width on mobile, auto on md+ */}
        <div className="flex items-stretch gap-2 w-full md:w-auto md:shrink-0">
          {orgId && (
            <Link href={`/jobs/organizations/${orgId}`} className="flex-1 md:flex-none block">
              <Button variant="outline" className="h-9 w-full md:w-auto md:px-5 rounded-xl font-bold text-sm gap-1.5" data-testid="button-org-jobs">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                تصفح الوظائف
              </Button>
            </Link>
          )}
          <Button
            className={`h-9 flex-1 md:flex-none md:w-auto md:px-5 rounded-xl font-bold text-sm gap-1.5 ${isFollowing ? "bg-green-600 hover:bg-red-500 text-white" : ""}`}
            onClick={handleFollow}
            disabled={followMutation.isPending}
            data-testid="button-org-follow"
          >
            {followMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            ) : isFollowing ? (
              <>
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">متابَعة</span>
              </>
            ) : (
              <>
                <Bell className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">متابعة الجهة</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
