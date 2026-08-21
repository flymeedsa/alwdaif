import { formatTimeAgo } from "@/lib/formatDate";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useParams, Link } from "wouter";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users, MessageSquare, ThumbsUp, Share2, ArrowRight,
  Eye, Pin, Clock, Send, Reply, MoreVertical, Flag, Heart, Lock,
  Pencil, Trash2, AlertTriangle, Plus, Shield, Star, Unlock
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";
import { useCommunityAuth } from "@/hooks/use-community-auth";

const reportReasons = [
  { value: "spam", label: "محتوى مزعج" },
  { value: "offensive", label: "محتوى مسيء" },
  { value: "misinformation", label: "معلومات مضللة" },
  { value: "inappropriate", label: "محتوى غير لائق" },
  { value: "other", label: "أخرى" },
];

export default function CommunityPost() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: authData } = useCommunityAuth();

  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ postId?: number; commentId?: number } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const reportMutation = useMutation({
    mutationFn: async (data: { postId?: number; commentId?: number; reason: string; details?: string }) => {
      const res = await apiRequest("POST", "/api/community/report", data);
      return res.json();
    },
    onSuccess: () => {
      setReportDialogOpen(false);
      setReportTarget(null);
      setReportReason("");
      setReportDetails("");
      toast({ title: "تم إرسال البلاغ", description: "شكراً لك، سنقوم بمراجعته قريباً" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في إرسال البلاغ", variant: "destructive" });
    },
  });

  const openReportDialog = (target: { postId?: number; commentId?: number }) => {
    if (!authData?.authenticated) {
      toast({ title: "يجب تسجيل الدخول", description: "سجل دخولك لإرسال بلاغ", variant: "destructive" });
      return;
    }
    setReportTarget(target);
    setReportReason("");
    setReportDetails("");
    setReportDialogOpen(true);
  };

  const submitReport = () => {
    if (!reportReason || !reportTarget) return;
    reportMutation.mutate({ ...reportTarget, reason: reportReason, details: reportDetails || undefined });
  };

  const { data: post, isLoading } = useQuery<any>({
    queryKey: [`/api/community/posts/${id}`],
    enabled: !!id,
  });

  usePageTitle(post?.title || "الموضوع");

  const { data: comments = [] } = useQuery<any[]>({
    queryKey: [`/api/community/posts/${id}/comments`],
    enabled: !!id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: number }) => {
      const res = await apiRequest("POST", `/api/community/posts/${id}/comments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${id}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${id}`] });
      setNewComment("");
      setReplyingTo(null);
      setReplyContent("");
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/community/posts/${id}/like`, {});
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${id}`] }),
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/community/posts/${id}`, {});
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "فشل في حذف الموضوع");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      toast({ title: "تم حذف الموضوع", description: "تم حذف موضوعك بنجاح" });
      setLocation("/community");
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await apiRequest("POST", `/api/community/comments/${commentId}/like`, {});
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${id}/comments`] }),
  });

  const pinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/community/posts/${id}/pin`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      toast({ title: "تم تحديث حالة التثبيت" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const lockMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/community/posts/${id}/lock`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      toast({ title: "تم تحديث حالة الإغلاق" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const featureMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/community/posts/${id}/feature`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/posts/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      toast({ title: "تم تحديث حالة التمييز" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const modDeleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/community/moderator/posts/${id}`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      toast({ title: "تم حذف الموضوع" });
      setLocation("/community");
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  // 3-hour edit/delete window
  const isOwner = post && authData?.authenticated && authData.member?.id === post.memberId;
  const hoursElapsed = post ? (Date.now() - new Date(post.createdAt).getTime()) / 3600000 : 0;
  const canEditOrDelete = isOwner && hoursElapsed <= 3;
  const minutesLeft = post ? Math.max(0, Math.floor(180 - hoursElapsed * 60)) : 0;
  const isModerator = authData?.authenticated && (authData?.member?.role === "moderator" || authData?.member?.role === "admin");

  const sharePost = () => {
    if (navigator.share) {
      navigator.share({ title: post.title, text: post.content.substring(0, 100) + "...", url: window.location.href })
        .catch(() => {
          navigator.clipboard.writeText(window.location.href);
          toast({ title: "تم نسخ الرابط", description: "تم نسخ رابط الموضوع إلى الحافظة" });
        });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "تم نسخ الرابط", description: "تم نسخ رابط الموضوع إلى الحافظة" });
    }
  };


  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ content: newComment });
  };

  const handleSubmitReply = (parentId: number) => {
    if (!replyContent.trim()) return;
    addCommentMutation.mutate({ content: replyContent, parentId });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8" dir="rtl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8" dir="rtl">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-foreground mb-4">الموضوع غير موجود</h2>
            <Button onClick={() => setLocation("/community")}>العودة للمجتمع</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="container mx-auto px-4 py-8" dir="rtl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/community" className="hover:text-primary transition-colors">المجتمع</Link>
          <ArrowRight className="h-4 w-4 rotate-180" />
          <span className="text-muted-foreground/60">{post.category?.name || "عام"}</span>
          <ArrowRight className="h-4 w-4 rotate-180" />
          <span className="text-foreground line-clamp-1 max-w-[200px]">{post.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">

            {/* New Post Button — above post card, aligned right */}
            <div className="flex justify-start">
              {authData?.authenticated ? (
                <Button
                  onClick={() => setLocation("/community/new-post")}
                  className="h-12 font-bold rounded-xl shadow-lg shadow-primary/20 gap-2 flex-row-reverse px-6"
                  data-testid="button-new-post"
                >
                  <Plus className="h-5 w-5" />
                  موضوع جديد
                </Button>
              ) : (
                <Button
                  onClick={() => setLocation("/login")}
                  variant="outline"
                  className="h-12 font-bold rounded-xl gap-2 flex-row-reverse px-6 border-primary/30 text-primary hover:bg-primary/5"
                  data-testid="button-new-post-login"
                >
                  <Plus className="h-5 w-5" />
                  موضوع جديد
                </Button>
              )}
            </div>

            {/* Post Card */}
            <Card className="bg-card border-border overflow-hidden shadow-sm">
              <CardContent className="p-0">
                {/* Post Header */}
                <div className="p-4 md:p-6 border-b border-border">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-11 h-11 md:w-14 md:h-14 rounded-full shrink-0 overflow-hidden">
                      {post.member?.avatar ? (
                        <img src={post.member.avatar} alt={post.member.displayName || "عضو"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-base md:text-xl">
                          {post.member?.displayName?.[0] || "م"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-foreground font-bold text-lg">{post.member?.displayName || "عضو"}</h3>
                          {(post.member?.role === "moderator" || post.member?.role === "admin") && post.member?.moderatorCategory ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-xs font-semibold flex items-center gap-1 ${post.member.role === "admin" ? "text-red-600 dark:text-red-400" : "text-purple-600 dark:text-purple-400"}`}>
                                <Shield className="h-3 w-3" />
                                {post.member.role === "admin" ? "مدير" : "مشرف"}
                                {post.member.moderatorCategory.name && ` — ${post.member.moderatorCategory.name}`}
                              </span>
                            </div>
                          ) : post.member?.rank ? (
                            <div className="mt-0.5">
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ backgroundColor: (post.member.rank.color || "#6b7280") + "22", color: post.member.rank.color || "#6b7280", border: `1px solid ${post.member.rank.color || "#6b7280"}44` }}
                              >
                                {post.member.rank.icon} {post.member.rank.name}
                              </span>
                            </div>
                          ) : null}
                          <div className="flex items-center gap-3 text-muted-foreground text-sm mt-1">
                            <span>@{post.member?.username || "member"}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatTimeAgo(post.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {post.isPinned && (
                            <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-none gap-1">
                              <Pin className="h-3 w-3" />
                              مثبت
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-primary/30 text-primary">
                            {post.category?.name || "عام"}
                          </Badge>
                          {canEditOrDelete && !isModerator && (
                            <div className="flex items-center gap-1.5 border-r border-border pr-2 mr-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setLocation(`/community/edit-post/${id}`)}
                                className="h-8 px-3 gap-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-lg"
                                data-testid="button-edit-post"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span className="text-xs font-bold">تعديل</span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-3 gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                                    data-testid="button-delete-post"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span className="text-xs font-bold">حذف</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-right">
                                      <AlertTriangle className="h-5 w-5 text-red-500" />
                                      تأكيد حذف الموضوع
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-right">
                                      هل أنت متأكد من حذف هذا الموضوع؟ لن تتمكن من التراجع عن هذا الإجراء وسيُحذف الموضوع مع جميع تعليقاته.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-row-reverse gap-2">
                                    <AlertDialogAction
                                      onClick={() => deletePostMutation.mutate()}
                                      className="bg-red-500 hover:bg-red-600 text-white"
                                      data-testid="button-confirm-delete"
                                    >
                                      نعم، احذف الموضوع
                                    </AlertDialogAction>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                          {isModerator && post && (
                            <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => pinMutation.mutate()}
                                disabled={pinMutation.isPending}
                                className={`h-8 px-2 gap-1 rounded-lg ${post.isPinned ? "text-yellow-600 bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-600 hover:bg-yellow-500/10"}`}
                                title={post.isPinned ? "إلغاء التثبيت" : "تثبيت"}
                                data-testid="button-mod-pin"
                              >
                                <Pin className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => lockMutation.mutate()}
                                disabled={lockMutation.isPending}
                                className={`h-8 px-2 gap-1 rounded-lg ${post.isLocked ? "text-orange-600 bg-orange-500/10" : "text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10"}`}
                                title={post.isLocked ? "فتح الموضوع" : "إغلاق الموضوع"}
                                data-testid="button-mod-lock"
                              >
                                {post.isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => featureMutation.mutate()}
                                disabled={featureMutation.isPending}
                                className={`h-8 px-2 gap-1 rounded-lg ${post.isFeatured ? "text-orange-500 bg-orange-500/10" : "text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10"}`}
                                title={post.isFeatured ? "إلغاء التمييز" : "تمييز الموضوع"}
                                data-testid="button-mod-feature"
                              >
                                <Star className="h-3.5 w-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 gap-1 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                                    title="حذف الموضوع (مشرف)"
                                    data-testid="button-mod-delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-right">
                                      <Shield className="h-5 w-5 text-purple-500" />
                                      حذف الموضوع (صلاحية مشرف)
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-right">
                                      هل أنت متأكد من حذف هذا الموضوع بصفتك مشرفاً؟ سيُحذف الموضوع مع جميع تعليقاته.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-row-reverse gap-2">
                                    <AlertDialogAction
                                      onClick={() => modDeleteMutation.mutate()}
                                      className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                      نعم، احذف
                                    </AlertDialogAction>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-4 md:p-6">
                  <h1 className="text-lg md:text-2xl font-bold text-foreground mb-4 md:mb-6">{post.title}</h1>
                  <div
                    className="prose dark:prose-invert max-w-none text-foreground/80 leading-relaxed"
                    dir="rtl"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>

                {/* Post Actions */}
                <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button
                      className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors group"
                      onClick={() => authData?.authenticated && likeMutation.mutate()}
                      data-testid="button-like-post"
                    >
                      <Heart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span className="font-medium hidden sm:inline">إعجاب</span>
                      <span className="font-medium">{post.likesCount || 0}</span>
                    </button>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageSquare className="h-5 w-5" />
                      <span className="font-medium hidden sm:inline">تعليق</span>
                      <span className="font-medium">{post.commentsCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="h-5 w-5" />
                      <span className="font-medium hidden sm:inline">مشاهدة</span>
                      <span className="font-medium">{post.viewsCount || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                      onClick={sharePost}
                      title="مشاركة"
                    >
                      <Share2 className="h-5 w-5" />
                      <span className="hidden sm:inline">مشاركة</span>
                    </button>
                    <button
                      className="text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1.5"
                      title="إبلاغ"
                      onClick={() => openReportDialog({ postId: post.id })}
                      data-testid="button-report-post"
                    >
                      <Flag className="h-5 w-5" />
                      <span className="hidden sm:inline">إبلاغ</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Comment */}
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  أضف تعليقك
                </h3>
                {post.isLocked ? (
                  <div className="text-center py-8 bg-red-500/5 border border-red-500/20 rounded-xl flex flex-col items-center gap-3">
                    <div className="p-3 bg-red-500/10 rounded-full">
                      <Lock className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-foreground font-bold">هذا الموضوع مغلق</h4>
                      <p className="text-muted-foreground text-sm">لا يمكن إضافة تعليقات أو ردود جديدة على هذا الموضوع حالياً.</p>
                    </div>
                  </div>
                ) : authData?.authenticated ? (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="اكتب تعليقك هنا..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[100px] resize-none"
                      data-testid="textarea-new-comment"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSubmitComment}
                        className="gap-2"
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                        data-testid="button-submit-comment"
                      >
                        <Send className="h-4 w-4" />
                        {addCommentMutation.isPending ? "جارٍ الإرسال..." : "إرسال التعليق"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/40 rounded-xl border border-border">
                    <p className="text-muted-foreground mb-4">سجل الدخول لإضافة تعليق</p>
                    <Button onClick={() => setLocation("/login")}>
                      تسجيل الدخول
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                التعليقات ({comments.length})
              </h3>

              {comments.length === 0 ? (
                <Card className="bg-card border-border shadow-sm">
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground">لا توجد تعليقات بعد. كن أول من يعلق!</p>
                  </CardContent>
                </Card>
              ) : (
                comments.map((comment: any) => (
                  <Card key={comment.id} className="bg-card border-border shadow-sm" data-testid={`comment-${comment.id}`}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden">
                          {comment.member?.avatar ? (
                            <img src={comment.member.avatar} alt={comment.member.displayName || "عضو"} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                              {comment.member?.displayName?.[0] || "م"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-foreground font-bold">{comment.member?.displayName || "عضو"}</span>
                              <span className="text-muted-foreground text-sm flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(comment.createdAt)}
                              </span>
                            </div>
                            <DropdownMenu dir="rtl">
                              <DropdownMenuTrigger asChild>
                                <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                  className="flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500"
                                  onClick={() => openReportDialog({ commentId: comment.id, postId: post.id })}
                                  data-testid={`button-report-comment-${comment.id}`}
                                >
                                  <Flag className="h-4 w-4" />
                                  <span>إبلاغ عن مخالفة</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <p className="text-foreground/80 leading-relaxed">{comment.content}</p>

                          <div className="flex items-center gap-4 pt-2">
                            <button
                              className={`flex items-center gap-1.5 transition-colors text-sm ${
                                authData?.authenticated ? "text-muted-foreground hover:text-red-500" : "text-muted-foreground/40 cursor-not-allowed"
                              }`}
                              onClick={() => authData?.authenticated && likeCommentMutation.mutate(comment.id)}
                              disabled={likeCommentMutation.isPending}
                            >
                              <ThumbsUp className={`h-4 w-4 ${comment.isLiked ? "fill-red-400 text-red-400" : ""}`} />
                              <span>{comment.likesCount || 0}</span>
                            </button>
                            {authData?.authenticated && !post.isLocked && (
                              <button
                                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm"
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              >
                                <Reply className="h-4 w-4" />
                                <span>رد</span>
                              </button>
                            )}
                          </div>

                          {/* Reply Form */}
                          {replyingTo === comment.id && (
                            <div className="mt-4 pr-4 border-r-2 border-primary/30 space-y-3">
                              <Textarea
                                placeholder="اكتب ردك..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="min-h-[80px] resize-none"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setReplyingTo(null)}>
                                  إلغاء
                                </Button>
                                <Button onClick={() => handleSubmitReply(comment.id)} disabled={!replyContent.trim()}>
                                  إرسال الرد
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-4 pr-4 border-r-2 border-border space-y-4">
                              {comment.replies.map((reply: any) => (
                                <div key={reply.id} className="flex gap-3">
                                  <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden">
                                    {reply.member?.avatar ? (
                                      <img src={reply.member.avatar} alt={reply.member.displayName || "عضو"} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-primary/10 border border-primary/15 flex items-center justify-center text-primary text-sm font-bold">
                                        {reply.member?.displayName?.[0] || "م"}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-foreground font-medium text-sm">{reply.member?.displayName || "عضو"}</span>
                                      <span className="text-muted-foreground text-xs">{formatTimeAgo(reply.createdAt)}</span>
                                    </div>
                                    <p className="text-foreground/75 text-sm">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Author Card */}
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden">
                  {post.member?.avatar ? (
                    <img src={post.member.avatar} alt={post.member.displayName || "عضو"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-2xl">
                      {post.member?.displayName?.[0] || "م"}
                    </div>
                  )}
                </div>
                <h4 className="text-foreground font-bold text-lg">{post.member?.displayName || "عضو"}</h4>
                <p className="text-muted-foreground text-sm">@{post.member?.username || "member"}</p>
                {(post.member?.role === "moderator" || post.member?.role === "admin") && post.member?.moderatorCategory ? (
                  <span className={`text-xs font-semibold mt-1 mb-3 inline-flex items-center gap-1 ${post.member.role === "admin" ? "text-red-600 dark:text-red-400" : "text-purple-600 dark:text-purple-400"}`}>
                    <Shield className="h-3 w-3" />
                    {post.member.role === "admin" ? "مدير" : "مشرف"}
                  </span>
                ) : post.member?.rank ? (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold mt-1 mb-3 inline-block"
                    style={{ backgroundColor: (post.member.rank.color || "#6b7280") + "22", color: post.member.rank.color || "#6b7280", border: `1px solid ${post.member.rank.color || "#6b7280"}44` }}
                  >
                    {post.member.rank.icon} {post.member.rank.name}
                  </span>
                ) : <div className="mb-3" />}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">{post.member?.postsCount || 0}</div>
                    <div className="text-xs text-muted-foreground">موضوع</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">{post.member?.commentsCount || 0}</div>
                    <div className="text-xs text-muted-foreground">تعليق</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">{post.member?.likesCount || 0}</div>
                    <div className="text-xs text-muted-foreground">إعجاب</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Posts */}
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <h4 className="text-foreground font-bold mb-4">مواضيع ذات صلة</h4>
                <div className="space-y-3">
                  <Link href="/community" className="block p-3 bg-muted/40 border border-border rounded-xl hover:bg-accent hover:border-primary/20 transition-colors">
                    <p className="text-foreground text-sm line-clamp-2">نصائح للبحث عن وظيفة في السعودية</p>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground text-xs">
                      <Eye className="h-3 w-3" />
                      <span>156</span>
                      <MessageSquare className="h-3 w-3 mr-2" />
                      <span>5</span>
                    </div>
                  </Link>
                  <Link href="/community" className="block p-3 bg-muted/40 border border-border rounded-xl hover:bg-accent hover:border-primary/20 transition-colors">
                    <p className="text-foreground text-sm line-clamp-2">أسئلة المقابلات الأكثر شيوعاً</p>
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground text-xs">
                      <Eye className="h-3 w-3" />
                      <span>312</span>
                      <MessageSquare className="h-3 w-3 mr-2" />
                      <span>20</span>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Back Button */}
            <Button
              onClick={() => setLocation("/community")}
              variant="outline"
              className="w-full gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              العودة للمجتمع
            </Button>
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              إبلاغ عن مخالفة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">سبب البلاغ</label>
              <Select value={reportReason} onValueChange={setReportReason} dir="rtl">
                <SelectTrigger data-testid="select-report-reason">
                  <SelectValue placeholder="اختر سبب البلاغ" />
                </SelectTrigger>
                <SelectContent>
                  {reportReasons.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">تفاصيل إضافية (اختياري)</label>
              <Textarea
                placeholder="اكتب تفاصيل إضافية هنا..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="min-h-[80px] resize-none"
                data-testid="textarea-report-details"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              variant="outline"
              onClick={() => setReportDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={submitReport}
              disabled={!reportReason || reportMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
              data-testid="button-submit-report"
            >
              {reportMutation.isPending ? "جارٍ الإرسال..." : "إرسال البلاغ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
