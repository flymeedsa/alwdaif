import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "./DashboardLayout";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Users, MessageSquare, ThumbsUp, Eye, ExternalLink, TrendingUp,
  Calendar, ArrowLeft, Shield
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function DashboardCommunity() {
  usePageTitle("المجتمع - لوحة التحكم");
  const { data: authData } = useCommunityAuth();
  const { toast } = useToast();

  const [modRequestOpen, setModRequestOpen] = useState(false);
  const [modRequestCategoryId, setModRequestCategoryId] = useState("");
  const [modRequestReason, setModRequestReason] = useState("");

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/community/categories"],
    enabled: modRequestOpen,
  });

  const modRequestMutation = useMutation({
    mutationFn: async (data: { categoryId: number; reason: string }) => {
      const res = await apiRequest("POST", "/api/community/moderator-requests", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "فشل في إرسال الطلب");
      }
      return res.json();
    },
    onSuccess: () => {
      setModRequestOpen(false);
      setModRequestCategoryId("");
      setModRequestReason("");
      toast({ title: "تم إرسال الطلب", description: "سيتم مراجعة طلبك من قِبل الإدارة قريباً" });
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const submitModRequest = () => {
    if (!modRequestCategoryId || !modRequestReason.trim()) return;
    modRequestMutation.mutate({ categoryId: parseInt(modRequestCategoryId), reason: modRequestReason.trim() });
  };

  const { data: myPosts = [], isLoading: postsLoading } = useQuery<any[]>({
    queryKey: ["/api/community/my-posts"],
    enabled: !!authData?.authenticated,
  });

  const { data: myComments = [], isLoading: commentsLoading } = useQuery<any[]>({
    queryKey: ["/api/community/my-comments"],
    enabled: !!authData?.authenticated,
  });

  const member = authData?.member;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">المجتمع</h2>
            <p className="text-muted-foreground text-sm mt-1">نشاطك ومشاركاتك في المجتمع</p>
          </div>
          <Link href="/community">
            <Button className="gap-2">
              <ExternalLink className="h-4 w-4" />
              زيارة المجتمع
            </Button>
          </Link>
        </div>

        {/* Member Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "المنشورات", value: member?.postsCount || (myPosts as any[]).length, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "التعليقات", value: member?.commentsCount || (myComments as any[]).length, icon: MessageSquare, color: "text-green-400", bg: "bg-green-500/10" },
            { label: "الإعجابات المستلمة", value: member?.likesReceived || 0, icon: ThumbsUp, color: "text-rose-400", bg: "bg-rose-500/10" },
            { label: "عضو منذ", value: member?.createdAt ? formatDistanceToNow(new Date(member.createdAt), { locale: ar }) : "—", icon: Calendar, color: "text-purple-400", bg: "bg-purple-500/10", isText: true },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className={`font-bold ${stat.isText ? "text-sm" : "text-2xl"}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Moderator Request Button */}
        {authData?.authenticated && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 shrink-0">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-sm">طلب إشراف على قسم</p>
                <p className="text-xs text-muted-foreground">يمكنك التقدم لإشراف أحد أقسام المجتمع</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-purple-500/30 text-purple-500 hover:bg-purple-500/10 hover:text-purple-500 w-full sm:w-auto"
              onClick={() => setModRequestOpen(true)}
              data-testid="button-open-mod-request"
            >
              <Shield className="h-4 w-4" />
              تقديم طلب
            </Button>
          </div>
        )}

        {/* My Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              منشوراتي
              <Badge variant="secondary">{(myPosts as any[]).length}</Badge>
            </CardTitle>
            <Link href="/community">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">
                الكل في المجتمع <ArrowLeft className="h-3 w-3 rotate-180" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {postsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : (myPosts as any[]).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">لم تنشر أي منشور بعد</p>
                <Link href="/community">
                  <Button variant="outline" size="sm" className="mt-3 gap-2">
                    <ExternalLink className="h-4 w-4" />
                    ابدأ بالمشاركة
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {(myPosts as any[]).map((post: any) => (
                  <div key={post.id} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{post.title}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{post.likesCount || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{post.commentsCount || 0}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.viewsCount || 0}</span>
                        <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ar })}</span>
                      </div>
                    </div>
                    <Link href={`/community/post/${post.id}`}>
                      <Button variant="ghost" size="sm" className="shrink-0 text-xs gap-1">
                        عرض <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Comments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-400" />
              تعليقاتي
              <Badge variant="secondary">{(myComments as any[]).length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {commentsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />)}
              </div>
            ) : (myComments as any[]).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">لم تعلق على أي منشور بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(myComments as any[]).slice(0, 5).map((comment: any) => (
                  <div key={comment.id} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40">
                    <MessageSquare className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ar })}
                      </p>
                    </div>
                    {comment.postId && (
                      <Link href={`/community/post/${comment.postId}`}>
                        <Button variant="ghost" size="sm" className="shrink-0 text-xs gap-1">
                          عرض المنشور <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Moderator Request Dialog */}
      <Dialog open={modRequestOpen} onOpenChange={setModRequestOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              طلب إشراف على قسم
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">القسم المراد الإشراف عليه</label>
              <Select value={modRequestCategoryId} onValueChange={setModRequestCategoryId} dir="rtl">
                <SelectTrigger data-testid="select-mod-request-category">
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  {(categories as any[]).map((cat: any) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">سبب الطلب</label>
              <Textarea
                placeholder="اشرح لماذا تريد الإشراف على هذا القسم..."
                value={modRequestReason}
                onChange={(e) => setModRequestReason(e.target.value)}
                className="min-h-[100px] resize-none"
                data-testid="textarea-mod-request-reason"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              سيتم مراجعة طلبك من قِبل فريق الإدارة والرد عليك في أقرب وقت ممكن.
            </p>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              variant="outline"
              onClick={() => setModRequestOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={submitModRequest}
              disabled={!modRequestCategoryId || !modRequestReason.trim() || modRequestMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600 text-white"
              data-testid="button-submit-mod-request"
            >
              {modRequestMutation.isPending ? "جارٍ الإرسال..." : "إرسال الطلب"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
