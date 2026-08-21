import { Helmet } from "react-helmet";
import { formatTimeAgo } from "@/lib/formatDate";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";
import {
  Users, MessageSquare, Search, TrendingUp, ThumbsUp, Plus, Filter,
  MessageCircle, HelpCircle, Briefcase, GraduationCap, LogIn, LogOut,
  Eye, Pin, Rocket, Shield, Star, Crown, User, MoreHorizontal, Lock, Unlock, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunityAuth } from "@/hooks/use-community-auth";

const defaultCategoryIcons: Record<string, any> = {
  "الرئيسية": Users,
  "نقاشات عامة": MessageCircle,
  "استفسارات المقابلات": HelpCircle,
  "تجارب التوظيف": Briefcase,
  "دورات وتطوير": GraduationCap,
  "مشاريع وأفكار": Rocket,
};

const defaultCategoryColors: Record<string, string> = {
  "الرئيسية": "bg-primary",
  "نقاشات عامة": "bg-blue-500",
  "استفسارات المقابلات": "bg-purple-500",
  "تجارب التوظيف": "bg-green-500",
  "دورات وتطوير": "bg-orange-500",
  "مشاريع وأفكار": "bg-yellow-500",
};

const roleLabels: Record<string, { label: string; color: string; icon: any; showBadge: boolean }> = {
  new_member: { label: "عضو جديد", color: "text-muted-foreground", icon: User, showBadge: false },
  member: { label: "عضو مميز", color: "text-blue-500", icon: Star, showBadge: true },
  moderator: { label: "مشرف", color: "text-purple-500", icon: Shield, showBadge: true },
  admin: { label: "المدير", color: "text-primary", icon: Crown, showBadge: true },
};

export default function Community() {
  usePageTitle("المجتمع");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const { data: authData } = useCommunityAuth();
  const { toast } = useToast();

  const [modRequestOpen, setModRequestOpen] = useState(false);
  const [modRequestCategoryId, setModRequestCategoryId] = useState("");
  const [modRequestReason, setModRequestReason] = useState("");

  const { data: categories = [] } = useQuery<any[]>({ queryKey: ["/api/community/categories"] });

  const { data: posts = [] } = useQuery<any[]>({
    queryKey: ["/api/community/posts", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory
        ? `/api/community/posts?categoryId=${selectedCategory}`
        : "/api/community/posts";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const { data: stats } = useQuery<any>({ queryKey: ["/api/community/stats"] });

  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("POST", `/api/community/posts/${postId}/like`, {});
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] }),
  });

  const pinMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("POST", `/api/community/posts/${postId}/pin`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] }); toast({ title: "تم تحديث حالة التثبيت" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const lockMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("POST", `/api/community/posts/${postId}/lock`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] }); toast({ title: "تم تحديث حالة الإغلاق" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const featureMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("POST", `/api/community/posts/${postId}/feature`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] }); toast({ title: "تم تحديث حالة التمييز" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const modDeleteMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("DELETE", `/api/community/moderator/posts/${postId}`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] }); toast({ title: "تم حذف الموضوع" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem("communityMember");
      const res = await apiRequest("POST", "/api/community/logout", {});
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/community/me"] }),
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


  const filteredPosts = posts.filter(
    (post) =>
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <Layout>
      <Helmet>
        <title>مجتمع الباحثين عن عمل | إعلانات الوظائف</title>
        <meta name="description" content="انضم لمجتمع الباحثين عن عمل في السعودية. شارك تجاربك، اسأل عن المقابلات، وتعلّم من تجارب الآخرين في سوق العمل السعودي." />
        <link rel="canonical" href="https://www.alwdaif.com/community" />
      </Helmet>
      <div className="container mx-auto px-4 py-4 md:py-8" dir="rtl">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-6 md:mb-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
            <Users className="h-8 w-8" />
          </div>
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-black text-foreground leading-relaxed">مجتمع الباحثين عن عمل</h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-loose">تواصل، شارك، وتعلم من تجارب الآخرين</p>
          </div>
          <div className="w-24 h-1 bg-primary rounded-full mt-2"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-8 lg:order-2 space-y-6">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="ابحث في المواضيع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pr-12 rounded-xl text-right"
                  dir="rtl"
                  data-testid="input-search"
                />
              </div>
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl gap-2 flex-row-reverse shrink-0"
                onClick={() => setSelectedCategory(null)}
                data-testid="button-clear-filter"
              >
                <Filter className="h-5 w-5" />
                {selectedCategory ? "إزالة التصفية" : "الكل"}
              </Button>
            </div>

            {/* Mobile Category Pills */}
            {categories.length > 0 && (
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1" dir="rtl">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-colors ${
                    selectedCategory === null
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-border text-muted-foreground hover:border-primary/40"
                  }`}
                  data-testid="button-category-pill-all"
                >
                  الكل
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted border-border text-muted-foreground hover:border-primary/40"
                    }`}
                    data-testid={`button-category-pill-${cat.id}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Posts */}
            <div className="space-y-4">
              {/* Mobile New Post Button */}
              <div className="lg:hidden">
                {authData?.authenticated ? (
                  <Button
                    onClick={() => setLocation("/community/new-post")}
                    className="w-full h-14 font-bold rounded-2xl shadow-lg shadow-primary/20 gap-2 flex-row-reverse text-lg mb-4"
                    data-testid="button-new-topic-mobile"
                  >
                    <Plus className="h-6 w-6" />
                    إضافة موضوع جديد
                  </Button>
                ) : (
                  <Button
                    onClick={() => setLocation("/login")}
                    className="w-full h-14 font-bold rounded-2xl shadow-lg shadow-primary/20 gap-2 flex-row-reverse text-lg mb-4"
                    data-testid="button-login-mobile"
                  >
                    <LogIn className="h-6 w-6" />
                    تسجيل الدخول للمشاركة
                  </Button>
                )}
              </div>

              {filteredPosts.slice(0, 8).length === 0 ? (
                <Card className="bg-card border-border p-12 text-center">
                  <MessageCircle className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">لا توجد مواضيع</h3>
                  <p className="text-muted-foreground mb-6">كن أول من يبدأ النقاش في المجتمع</p>
                  {authData?.authenticated ? (
                    <Button onClick={() => setLocation("/community/new-post")} data-testid="button-first-post">
                      <Plus className="h-5 w-5 ml-2" />
                      أنشئ أول موضوع
                    </Button>
                  ) : (
                    <Button onClick={() => setLocation("/login")} data-testid="button-login-to-post">
                      <LogIn className="h-5 w-5 ml-2" />
                      سجل الدخول لإنشاء موضوع
                    </Button>
                  )}
                </Card>
              ) : (
                filteredPosts.slice(0, showAll ? filteredPosts.length : 8).map((post, index) => (
                  <div key={post.id}>
                  <div onClick={(e) => {
                    if ((e.target as HTMLElement).closest('[data-stop-nav]')) return;
                    setLocation(`/community/post/${post.id}`);
                  }} className="cursor-pointer">
                    <Card
                      className="bg-card border-border hover:border-primary/25 hover:shadow-md transition-all group overflow-hidden text-right"
                      data-testid={`card-post-${post.id}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          {post.isPinned && (
                            <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-none gap-1">
                              <Pin className="h-3 w-3" />
                              مثبت
                            </Badge>
                          )}
                          {post.isFeatured && (
                            <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-none">مميز🔥</Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-3">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4">
                          {post.content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                        </p>

                        <div className="border-t border-border pt-4">
                          <div className="flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
                            <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold">
                              {post.category?.name || "عام"}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-primary" />
                              <span>{post.member?.displayName || "عضو"}</span>
                              {(post.member?.role === "moderator" || post.member?.role === "admin") && post.member?.moderatorCategory ? (
                                <span className={`${post.member.role === "admin" ? "text-red-500" : "text-purple-500"} flex items-center gap-0.5`} title={`${post.member.role === "admin" ? "مدير" : "مشرف"} — ${post.member.moderatorCategory.name || "جميع الأقسام"}`}>
                                  <Shield className="h-3 w-3" />
                                </span>
                              ) : (() => {
                                const role = post.member?.role || "new_member";
                                const roleInfo = roleLabels[role];
                                const RoleIcon = roleInfo?.icon;
                                if (roleInfo?.showBadge && RoleIcon) {
                                  return (
                                    <span className={`flex items-center gap-0.5 ${roleInfo.color}`} title={roleInfo.label}>
                                      <RoleIcon className="h-3 w-3" />
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                              {post.member?.rank && (
                                <span
                                  className="text-[10px] px-1.5 py-0 rounded-full font-semibold leading-tight"
                                  style={{ backgroundColor: (post.member.rank.color || "#6b7280") + "22", color: post.member.rank.color || "#6b7280", border: `1px solid ${post.member.rank.color || "#6b7280"}44` }}
                                  title={post.member.rank.name}
                                >
                                  {post.member.rank.icon && <span className="mr-0.5">{post.member.rank.icon}</span>}
                                  {post.member.rank.name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">مشاهدة</span>
                              <span>{post.viewsCount || 0}</span>
                            </div>
                            <button
                              className="flex items-center gap-1.5 hover:text-red-500 transition-colors"
                              data-stop-nav
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                authData?.authenticated && likeMutation.mutate(post.id);
                              }}
                              data-testid={`button-like-${post.id}`}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">إعجاب</span>
                              <span>{post.likesCount || 0}</span>
                            </button>
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">تعليق</span>
                              <span>{post.commentsCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>{formatTimeAgo(post.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        {(() => {
                          const isModeratorUser = authData?.authenticated && (authData?.member?.role === "moderator" || authData?.member?.role === "admin");
                          if (!isModeratorUser) return null;
                          return (
                            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border" data-stop-nav>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); pinMutation.mutate(post.id); }}
                                disabled={pinMutation.isPending}
                                className={`h-7 px-2 gap-1 rounded-lg text-xs ${post.isPinned ? "text-yellow-600 bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-600 hover:bg-yellow-500/10"}`}
                                title={post.isPinned ? "إلغاء التثبيت" : "تثبيت"}
                              >
                                <Pin className="h-3 w-3" />
                                <span className="hidden sm:inline">{post.isPinned ? "إلغاء التثبيت" : "تثبيت"}</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); lockMutation.mutate(post.id); }}
                                disabled={lockMutation.isPending}
                                className={`h-7 px-2 gap-1 rounded-lg text-xs ${post.isLocked ? "text-orange-600 bg-orange-500/10" : "text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10"}`}
                                title={post.isLocked ? "فتح الموضوع" : "إغلاق"}
                              >
                                {post.isLocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                <span className="hidden sm:inline">{post.isLocked ? "فتح" : "إغلاق"}</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); featureMutation.mutate(post.id); }}
                                disabled={featureMutation.isPending}
                                className={`h-7 px-2 gap-1 rounded-lg text-xs ${post.isFeatured ? "text-orange-500 bg-orange-500/10" : "text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10"}`}
                                title={post.isFeatured ? "إلغاء التمييز" : "تمييز"}
                              >
                                <Star className="h-3 w-3" />
                                <span className="hidden sm:inline">{post.isFeatured ? "إلغاء التمييز" : "تمييز"}</span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 gap-1 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg text-xs"
                                    title="حذف الموضوع"
                                    data-stop-nav
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span className="hidden sm:inline">حذف</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-right">
                                      <Shield className="h-5 w-5 text-purple-500" />
                                      حذف الموضوع
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-right">
                                      هل أنت متأكد من حذف هذا الموضوع؟ سيُحذف الموضوع مع جميع تعليقاته.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-row-reverse gap-2">
                                    <AlertDialogAction
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); modDeleteMutation.mutate(post.id); }}
                                      className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                      نعم، احذف
                                    </AlertDialogAction>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                  </div>
                ))
              )}
            </div>

            {filteredPosts.length > 8 && !showAll && (
              <Button
                variant="outline"
                className="w-full h-12 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl gap-2"
                onClick={() => setShowAll(true)}
                data-testid="button-show-more-posts"
              >
                <MoreHorizontal className="h-4 w-4" />
                عرض المزيد من المواضيع ({filteredPosts.length - 7})
              </Button>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 lg:order-1 space-y-8">
            {/* Auth */}
            <div className="hidden lg:block space-y-8">
              {authData?.authenticated ? (
                <div className="space-y-3">
                  <Button
                    onClick={() => setLocation("/community/new-post")}
                    className="w-full h-12 font-bold rounded-xl shadow-lg shadow-primary/20 gap-2 flex-row-reverse"
                    data-testid="button-new-topic"
                  >
                    <Plus className="h-5 w-5" />
                    موضوع جديد
                  </Button>

                  <div className="flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-xl">
                    <Link href="/dashboard" className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                        {authData.member?.avatar ? (
                          <img src={authData.member.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          authData.member?.displayName?.[0] || "م"
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-foreground font-medium">{authData.member?.displayName}</div>
                        <div className="text-muted-foreground text-sm">@{authData.member?.username}</div>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => logoutMutation.mutate()}
                      className="text-muted-foreground hover:text-foreground"
                      data-testid="button-logout"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full h-12 font-bold rounded-xl shadow-lg shadow-primary/20 gap-2 flex-row-reverse"
                  data-testid="button-login"
                >
                  <LogIn className="h-5 w-5" />
                  تسجيل الدخول للمشاركة
                </Button>
              )}
            </div>

            {/* Mobile Profile */}
            {authData?.authenticated && (
              <div className="lg:hidden flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-2xl mb-4">
                <Link href="/dashboard" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                    {authData.member?.avatar ? (
                      <img src={authData.member.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      authData.member?.displayName?.[0] || "م"
                    )}
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-foreground font-medium">{authData.member?.displayName}</div>
                    <div className="text-muted-foreground text-sm">@{authData.member?.username}</div>
                  </div>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => logoutMutation.mutate()} className="text-muted-foreground hover:text-foreground">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Categories Card */}
            <Card className="bg-card border-border rounded-2xl overflow-hidden shadow-md">
              <CardHeader className="bg-muted/30 border-b border-border">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  أقسام المجتمع
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <button
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-all group text-right",
                    selectedCategory === null && "bg-accent"
                  )}
                  onClick={() => setSelectedCategory(null)}
                  data-testid="button-category-home"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md bg-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <span className="text-foreground font-medium group-hover:text-primary transition-colors">الرئيسية</span>
                  </div>
                  <span className="bg-muted px-2 py-1 rounded-md text-muted-foreground text-xs">{stats?.postsCount || 0}</span>
                </button>

                {categories.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">لا توجد أقسام بعد</p>
                  </div>
                ) : (
                  categories.map((cat: any) => {
                    const IconComponent = defaultCategoryIcons[cat.name] || MessageCircle;
                    const colorClass = defaultCategoryColors[cat.name] || "bg-primary";
                    return (
                      <button
                        key={cat.id}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-all group text-right",
                          selectedCategory === cat.id && "bg-accent"
                        )}
                        onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                        data-testid={`button-category-${cat.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md", colorClass)}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <span className="text-foreground font-medium group-hover:text-primary transition-colors">{cat.name}</span>
                        </div>
                        <span className="bg-muted px-2 py-1 rounded-md text-muted-foreground text-xs">{cat.postsCount || 0}</span>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Moderator Request Button */}
            {authData?.authenticated && (
              <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">طلب إشراف على قسم</p>
                  <p className="text-xs text-muted-foreground mt-1">تقدّم لإشراف أحد أقسام المجتمع</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-purple-500/30 text-purple-500 hover:bg-purple-500/10 hover:text-purple-500"
                  onClick={() => setModRequestOpen(true)}
                  data-testid="button-open-mod-request-community"
                >
                  <Shield className="h-4 w-4" />
                  تقديم طلب
                </Button>
              </div>
            )}

            {/* Stats Card */}
            <Card className="bg-gradient-to-br from-primary/15 to-primary/5 border-primary/15 rounded-2xl shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold text-lg">إحصائيات المجتمع</h4>
                    <p className="text-muted-foreground text-sm">تفاعل مستمر على مدار الساعة</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: stats?.membersCount || 0, label: "عضو مسجل", color: "text-foreground" },
                    { value: stats?.onlineCount || 0, label: "متصل الآن", color: "text-primary" },
                    { value: stats?.postsCount || 0, label: "موضوع", color: "text-foreground" },
                    { value: stats?.commentsCount || 0, label: "تعليق", color: "text-foreground" },
                  ].map((item, i) => (
                    <div key={i} className="bg-background/60 border border-border/50 p-4 rounded-xl text-center">
                      <span className={`block text-2xl font-black ${item.color}`}>{item.value}</span>
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <div className="p-6 bg-muted/40 border border-border rounded-2xl space-y-4 text-right">
              <h4 className="text-foreground font-bold">قوانين المجتمع</h4>
              <ul className="space-y-3">
                {[
                  "الاحترام المتبادل بين جميع الأعضاء",
                  "عدم نشر إعلانات وهمية أو مضللة",
                  "استخدام الأقسام الصحيحة لكل موضوع",
                  "مساعدة الآخرين بقدر المستطاع",
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
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
                <SelectTrigger data-testid="select-mod-request-category-community">
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
                data-testid="textarea-mod-request-reason-community"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              سيتم مراجعة طلبك من قِبل فريق الإدارة والرد عليك في أقرب وقت ممكن.
            </p>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setModRequestOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={submitModRequest}
              disabled={!modRequestCategoryId || !modRequestReason.trim() || modRequestMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600 text-white"
              data-testid="button-submit-mod-request-community"
            >
              {modRequestMutation.isPending ? "جارٍ الإرسال..." : "إرسال الطلب"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
