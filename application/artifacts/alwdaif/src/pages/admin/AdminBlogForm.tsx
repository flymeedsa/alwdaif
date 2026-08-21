import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, ArrowRight, FileText, Calendar, User, Tag, Twitter, Loader2 } from "lucide-react";
import MediaPicker from "@/components/admin/MediaPicker";
import type { BlogPost, Category } from "@shared/schema";
import { sanitizeHtml } from "@/lib/sanitize";

export default function AdminBlogForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const params = useParams() as { id?: string };
  const postId = params.id ? parseInt(params.id) : null;
  const isEditing = !!postId;

  const [isTwitterPublishing, setIsTwitterPublishing] = useState(false);

  const handlePublishToTwitter = async () => {
    if (!postId) return;
    setIsTwitterPublishing(true);
    try {
      const res = await fetch("/api/twitter/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contentType: "blog", contentId: postId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "✅ تم النشر في X بنجاح" });
      } else {
        toast({ title: "❌ " + (data.error || "فشل النشر"), variant: "destructive" });
      }
    } catch {
      toast({ title: "❌ خطأ في الاتصال", variant: "destructive" });
    } finally {
      setIsTwitterPublishing(false);
    }
  };

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image: "",
    source: "",
    category: "أخبار",
    author: "فريق إعلانات الوظائف",
    date: new Date().toLocaleDateString('ar-SA'),
    status: "published",
  });

  const { data: rawCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/blog-categories"],
    queryFn: async () => {
      const res = await fetch("/api/blog-categories");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const blogCategories = rawCategories.filter((c) => c.isActive).map((c) => c.name);

  const { data: post, isLoading: postLoading } = useQuery<BlogPost>({
    queryKey: ["/api/admin/blog", postId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/blog/${postId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        content: post.content || "",
        image: post.image || "",
        source: post.source || "",
        category: post.category,
        author: post.author,
        date: post.date,
        status: post.status || "published",
      });
    }
  }, [post]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const slug = data.slug || data.title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0621-\u064A-]/g, "");
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, slug, content: sanitizeHtml(data.content) }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "تمت الإضافة", description: "تم إضافة المقالة بنجاح" });
      setLocation("/admin/blog");
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في إضافة المقالة", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const slug = data.slug || data.title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0621-\u064A-]/g, "");
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, slug, content: sanitizeHtml(data.content) }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "تم التحديث", description: "تم تحديث المقالة بنجاح" });
      setLocation("/admin/blog");
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تحديث المقالة", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isEditing && postLoading) {
    return (
      <AdminLayout title="تحميل...">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditing ? "تعديل المقالة" : "إضافة مقالة جديدة"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => setLocation("/admin/blog")} className="border-border text-muted-foreground gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة للمدونة
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                معلومات المقالة الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">عنوان المقالة *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-muted/50 border-border text-foreground"
                  placeholder="مثال: نصائح للمقابلات الوظيفية"
                  required
                  data-testid="input-blog-title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">القسم *</Label>
                  <div className="relative">
                    <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 pr-10 [&>option]:bg-background [&>option]:text-foreground"
                      data-testid="select-blog-category"
                    >
                      {blogCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">الكاتب</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <Input
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="bg-muted/50 border-border text-foreground pr-10"
                      data-testid="input-blog-author"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">تاريخ النشر *</Label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <Input
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="bg-muted/50 border-border text-foreground pr-10"
                      placeholder="مثال: 15 يناير 2026"
                      required
                      data-testid="input-blog-date"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">الحالة</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 [&>option]:bg-background [&>option]:text-foreground"
                    data-testid="select-blog-status"
                  >
                    <option value="published">منشور</option>
                    <option value="draft">مسودة</option>
                    <option value="trash">محذوف</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">المصدر</Label>
                  <Input
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="bg-muted/50 border-border text-foreground"
                    placeholder="مثال: الموقع الرسمي للتدريب التقني"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">صورة المقالة</Label>
                <MediaPicker
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  placeholder="اختر صورة للمقالة"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">المقتطف (الوصف المختصر)</Label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="bg-muted/50 border-border text-foreground resize-none"
                  rows={2}
                  placeholder="وصف مختصر للمقالة يظهر في قائمة المقالات..."
                  data-testid="input-blog-excerpt"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">محتوى المقالة</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content: content })}
                placeholder="اكتب محتوى المقالة هنا..."
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/admin/blog")} className="border-border text-muted-foreground">
              إلغاء
            </Button>
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePublishToTwitter}
                disabled={isTwitterPublishing}
                className="gap-2 border-sky-400 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950"
              >
                {isTwitterPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Twitter className="h-4 w-4" />}
                نشر في X
              </Button>
            )}
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="gap-2" data-testid="button-save-blog">
              <Save className="h-4 w-4" />
              {isEditing ? "حفظ التغييرات" : "نشر المقالة"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
