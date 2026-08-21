import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import RichTextEditor from "@/components/admin/RichTextEditor";
import OrganizationPicker from "@/components/admin/OrganizationPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, ArrowRight, Briefcase, CalendarIcon, Link as LinkIcon, Globe, Mail, Phone, X, Twitter, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Job } from "@shared/schema";
import { sanitizeHtml } from "@/lib/sanitize";

export default function AdminJobForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const params = useParams() as { id?: string };
  const jobId = params.id ? parseInt(params.id) : null;
  const isEditing = !!jobId;

  const [isTwitterPublishing, setIsTwitterPublishing] = useState(false);

  const handlePublishToTwitter = async () => {
    if (!jobId) return;
    setIsTwitterPublishing(true);
    try {
      const res = await fetch("/api/twitter/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contentType: "job", contentId: jobId }),
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
    company: "",
    organizationId: "",
    category: "civil",
    date: new Date().toLocaleDateString('ar-SA'),
    description: "",
    applyUrl: "",
    sourceUrl: "",
    linkType: "url",
    status: "published",
    isFeatured: false,
    deadlineDate: "",
  });

  const [calendarOpen, setCalendarOpen] = useState(false);

  const getLocalToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const { data: job, isLoading: jobLoading, error: jobError } = useQuery<Job>({
    queryKey: ["/api/admin/jobs", jobId],
    queryFn: async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const isResult = searchParams.get("isResult") === "true";
      const endpoint = isResult ? `/api/admin/results/${jobId}` : `/api/admin/jobs/${jobId}`;
      const res = await fetch(endpoint, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      if (isResult) {
        return {
          ...data,
          title: data.title || "",
          company: data.org || "",
          description: data.details || "",
          applyUrl: data.inquiryUrl || "",
          sourceUrl: data.inquiryUrl || "",
          category: "results",
          organizationId: data.organizationId ? data.organizationId.toString() : ""
        };
      }
      return data;
    },
    enabled: isEditing,
    retry: false,
    staleTime: 0
  });

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        company: job.company || "",
        organizationId: job.organizationId?.toString() || "",
        category: job.category || "civil",
        date: job.date || new Date().toLocaleDateString('ar-SA'),
        description: job.description || "",
        applyUrl: job.applyUrl || "",
        sourceUrl: job.sourceUrl || "",
        linkType: job.linkType || "url",
        status: job.status || "published",
        isFeatured: job.isFeatured || false,
        deadlineDate: job.deadlineDate
          ? (() => {
              const d = new Date(job.deadlineDate);
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              return `${y}-${m}-${day}`;
            })()
          : "",
      });
    }
  }, [job]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          description: sanitizeHtml(data.description),
          organizationId: data.organizationId ? parseInt(data.organizationId) : null,
          deadlineDate: data.deadlineDate || null,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errBody.detail || errBody.message || "Failed to create job");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      toast({ title: "تمت الإضافة", description: "تم إضافة الوظيفة بنجاح" });
      setLocation("/admin/jobs-hub/jobs");
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err?.message || "فشل في إضافة الوظيفة", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          description: sanitizeHtml(data.description),
          organizationId: data.organizationId ? parseInt(data.organizationId) : null,
          deadlineDate: data.deadlineDate || null,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const rawText = await res.text().catch(() => res.statusText);
        let detail = rawText;
        try { const j = JSON.parse(rawText); detail = j.detail || j.message || rawText; } catch {}
        throw new Error(`[${res.status}] ${detail || "Failed to update job"}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      toast({ title: "تم التحديث", description: "تم تحديث الوظيفة بنجاح" });
      setLocation("/admin/jobs-hub/jobs");
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err?.message || "فشل في تحديث الوظيفة", variant: "destructive" });
    },
  });

  const updateResultMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/results/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update result");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      toast({ title: "تم التحديث", description: "تم تحديث النتيجة بنجاح" });
      setLocation("/admin/jobs-hub/jobs");
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تحديث النتيجة", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال عنوان الوظيفة", variant: "destructive" });
      return;
    }
    if (!formData.organizationId) {
      toast({ title: "خطأ", description: "يرجى اختيار الجهة", variant: "destructive" });
      return;
    }
    const isResult = new URLSearchParams(window.location.search).get("isResult") === "true";
    if (isEditing) {
      if (isResult) {
        updateResultMutation.mutate({
          ...formData,
          org: formData.company,
          details: formData.description,
          inquiryUrl: formData.applyUrl,
          organizationId: parseInt(formData.organizationId)
        });
      } else {
        updateMutation.mutate(formData);
      }
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isEditing && jobLoading) {
    return (
      <AdminLayout title="تحميل...">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  if (isEditing && jobError) {
    return (
      <AdminLayout title="خطأ">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-red-400">فشل في تحميل بيانات الوظيفة</p>
          <Button onClick={() => setLocation("/admin/jobs-hub/jobs")}>العودة للوظائف</Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditing ? "تعديل الوظيفة" : "إضافة وظيفة جديدة"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => setLocation("/admin/jobs-hub/jobs")} className="border-border text-muted-foreground gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة للوظائف
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                معلومات الوظيفة الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">عنوان الوظيفة *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-muted/50 border-border text-foreground"
                  placeholder="مثال: مهندس برمجيات أول"
                  required
                  data-testid="input-job-title"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">اختر الجهة *</Label>
                <OrganizationPicker
                  value={formData.organizationId}
                  onChange={(orgId, orgName, orgType) => {
                    const categoryMap: Record<string, string> = {
                      government: "civil",
                      military: "military",
                      company: "companies",
                    };
                    const newCategory = orgType ? (categoryMap[orgType] ?? formData.category) : formData.category;
                    setFormData({ ...formData, organizationId: orgId, company: orgName, category: newCategory });
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">التصنيف *</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 [&>option]:bg-background [&>option]:text-foreground"
                    data-testid="select-job-category"
                  >
                    <option value="civil">وظائف مدنية</option>
                    <option value="military">وظائف عسكرية</option>
                    <option value="companies">وظائف شركات</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">تاريخ النشر *</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <Input
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="bg-muted/50 border-border text-foreground pr-10"
                      placeholder="مثال: 15 يناير 2026"
                      required
                      data-testid="input-job-date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">الحالة</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 [&>option]:bg-background [&>option]:text-foreground"
                    data-testid="select-job-status"
                  >
                    <option value="published">منشور</option>
                    <option value="draft">مسودة</option>
                    <option value="trash">محذوف</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-5 h-5 rounded border-border bg-muted/50 text-primary focus:ring-primary cursor-pointer"
                  data-testid="checkbox-job-featured"
                />
                <Label htmlFor="isFeatured" className="text-foreground cursor-pointer flex-1">
                  <span className="font-medium">وظيفة مميزة</span>
                  <span className="block text-sm text-muted-foreground mt-0.5">تفعيل هذا الخيار لإظهار الوظيفة في قسم الوظائف المميزة بالصفحة الرئيسية</span>
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  تاريخ انتهاء الوظيفة
                  <span className="mr-1 text-xs text-muted-foreground/70">(اختياري — إذا لم تحدد، تُغلق تلقائياً بعد 30 يوماً)</span>
                </Label>
                <div className="flex items-center gap-2 w-full">
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        data-testid="input-job-deadline"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/50 text-foreground text-sm hover:bg-muted transition-colors flex-1 text-right"
                      >
                        <CalendarIcon className="h-5 w-5 text-muted-foreground/70 shrink-0" />
                        {formData.deadlineDate
                          ? (() => {
                              const [y, m, d] = formData.deadlineDate.split("-");
                              const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
                              return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
                            })()
                          : <span className="text-muted-foreground">اختر تاريخ انتهاء الوظيفة</span>
                        }
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.deadlineDate ? new Date(formData.deadlineDate + "T00:00:00") : undefined}
                        defaultMonth={new Date()}
                        disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                        className="p-4"
                        onSelect={(date) => {
                          if (date) {
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, "0");
                            const d = String(date.getDate()).padStart(2, "0");
                            setFormData({ ...formData, deadlineDate: `${y}-${m}-${d}` });
                          }
                          setCalendarOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {formData.deadlineDate && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deadlineDate: "" })}
                      className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      title="مسح تاريخ الانتهاء"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">وصف الوظيفة</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={formData.description}
                onChange={(content) => setFormData({ ...formData, description: content })}
                placeholder="اكتب وصف الوظيفة والمتطلبات والمميزات..."
              />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-primary" />
                روابط التقديم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">نوع الرابط</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, linkType: "url" })}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      formData.linkType === "url"
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                    }`}
                    data-testid="btn-link-type-url"
                  >
                    <Globe className="h-4 w-4" />
                    رابط موقع
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, linkType: "email" })}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      formData.linkType === "email"
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                    }`}
                    data-testid="btn-link-type-email"
                  >
                    <Mail className="h-4 w-4" />
                    بريد إلكتروني
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, linkType: "phone" })}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      formData.linkType === "phone"
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                    }`}
                    data-testid="btn-link-type-phone"
                  >
                    <Phone className="h-4 w-4" />
                    رقم جوال
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  {formData.linkType === "url" ? "رابط التقديم *" : formData.linkType === "email" ? "البريد الإلكتروني *" : "رقم الجوال *"}
                </Label>
                <Input
                  value={formData.applyUrl}
                  onChange={(e) => setFormData({ ...formData, applyUrl: e.target.value })}
                  className="bg-muted/50 border-border text-foreground text-left"
                  dir="ltr"
                  placeholder={formData.linkType === "url" ? "https://..." : formData.linkType === "email" ? "example@domain.com" : "+966..."}
                  required
                  data-testid="input-job-apply-url"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">رابط المصدر *</Label>
                <Input
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  className="bg-muted/50 border-border text-foreground text-left"
                  dir="ltr"
                  placeholder="https://..."
                  required
                  data-testid="input-job-source-url"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/admin/jobs-hub/jobs")} className="border-border text-muted-foreground">
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
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="gap-2" data-testid="button-save-job">
              <Save className="h-4 w-4" />
              {isEditing ? "حفظ التغييرات" : "إضافة الوظيفة"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
