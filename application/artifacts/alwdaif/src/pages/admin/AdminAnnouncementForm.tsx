import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaPicker from "@/components/admin/MediaPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/adminAuth";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  Save, ArrowRight, Megaphone, Link2, Image, Users, Settings
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const emptyForm = {
  title: "",
  body: "",
  imageUrl: "",
  linkUrl: "",
  linkButtonText: "",
  targetAudience: "all",
  status: "active",
};

export default function AdminAnnouncementForm() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const params = useParams() as { id?: string };
  const annId = params.id ? parseInt(params.id) : null;
  const isEditing = !!annId;

  const [form, setForm] = useState(emptyForm);
  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const { data: existing, isLoading: existingLoading } = useQuery({
    queryKey: ["/api/admin/announcements", annId],
    queryFn: () => adminFetch(`/api/admin/announcements`).then(r => r.json()).then((arr: any[]) => arr.find(a => a.id === annId)),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || "",
        body: existing.body || "",
        imageUrl: existing.imageUrl || "",
        linkUrl: existing.linkUrl || "",
        linkButtonText: existing.linkButtonText || "",
        targetAudience: existing.targetAudience || "all",
        status: existing.status || "active",
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const url = isEditing ? `/api/admin/announcements/${annId}` : "/api/admin/announcements";
      const method = isEditing ? "PUT" : "POST";
      const body = {
        title: data.title,
        body: sanitizeHtml(data.body),
        imageUrl: data.imageUrl || null,
        linkUrl: data.linkUrl || null,
        linkButtonText: data.linkButtonText || null,
        targetAudience: data.targetAudience,
        status: data.status,
        startDate: null,
        endDate: null,
      };
      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).message || "فشل الحفظ");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      qc.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: isEditing ? "تم تحديث الإعلان" : "تم إنشاء الإعلان بنجاح" });
      setLocation("/admin/settings/announcements");
    },
    onError: (e: any) =>
      toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast({ title: "يرجى ملء العنوان والمحتوى", variant: "destructive" });
      return;
    }
    saveMutation.mutate(form);
  };

  if (isEditing && existingLoading) {
    return (
      <AdminLayout title="تحميل...">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditing ? "تعديل الإعلان" : "إعلان جديد"}>
      <div className="max-w-4xl mx-auto" dir="rtl">
        {/* Back button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation("/admin/settings/announcements")}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للإعلانات
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Info */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Megaphone className="h-5 w-5 text-primary" />
                معلومات الإعلان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label>عنوان الإعلان *</Label>
                <Input
                  value={form.title}
                  onChange={e => set("title", e.target.value)}
                  placeholder="مثال: صيانة مجدولة للمنصة"
                  required
                  data-testid="input-ann-title"
                />
              </div>

              {/* Audience + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    الجمهور المستهدف
                  </Label>
                  <Select value={form.targetAudience} onValueChange={v => set("targetAudience", v)}>
                    <SelectTrigger data-testid="select-ann-audience"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأعضاء</SelectItem>
                      <SelectItem value="members">الأعضاء المسجلين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                    الحالة
                  </Label>
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger data-testid="select-ann-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط — يظهر للأعضاء</SelectItem>
                      <SelectItem value="draft">مسودة — مخفي</SelectItem>
                      <SelectItem value="ended">منتهي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image & Link */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                <Image className="h-4 w-4 text-primary" />
                الصورة والرابط (اختياري)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image via MediaPicker */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Image className="h-3.5 w-3.5 text-muted-foreground" />
                  صورة الإعلان
                </Label>
                <MediaPicker
                  value={form.imageUrl}
                  onChange={url => set("imageUrl", url)}
                  placeholder="اختر صورة للإعلان"
                />
                {form.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-border max-h-48">
                    <img src={form.imageUrl} alt="معاينة" className="w-full h-48 object-cover" />
                  </div>
                )}
              </div>

              {/* Link URL */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                  رابط الإعلان
                </Label>
                <Input
                  value={form.linkUrl}
                  onChange={e => set("linkUrl", e.target.value)}
                  placeholder="https://example.com/details"
                  dir="ltr"
                  data-testid="input-ann-link"
                />
              </div>

              {/* Link Button Text */}
              <div className="space-y-2">
                <Label>نص زر الإجراء</Label>
                <Input
                  value={form.linkButtonText}
                  onChange={e => set("linkButtonText", e.target.value)}
                  placeholder="مثال: اقرأ المزيد، سجّل الآن، تفاصيل الإعلان..."
                  data-testid="input-ann-btn-text"
                />
                <p className="text-xs text-muted-foreground">النص الذي يظهر على زر الرابط أمام العضو</p>
              </div>
            </CardContent>
          </Card>

          {/* Rich Text Body */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">محتوى الإعلان *</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={form.body}
                onChange={html => set("body", html)}
                placeholder="اكتب محتوى الإعلان هنا..."
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setLocation("/admin/settings/announcements")}>
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="gap-2"
              data-testid="button-save-announcement"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending
                ? "جاري الحفظ..."
                : isEditing ? "حفظ التعديلات" : "نشر الإعلان"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
