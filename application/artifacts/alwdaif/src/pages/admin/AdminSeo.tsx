import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Home, Briefcase, Building2, Shield, Users, CheckCircle, BookOpen,
  ShoppingBag, Globe, Search, Save, Eye, AlertCircle, ChevronLeft,
  Plus, Trash2, Settings, FileText, LogIn
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MediaPicker from "@/components/admin/MediaPicker";
import type { SeoSetting } from "@shared/schema";

const PAGES = [
  { path: "/", label: "الصفحة الرئيسية", icon: Home, category: "رئيسي" },
  { path: "/jobs", label: "كل الوظائف", icon: Briefcase, category: "وظائف" },
  { path: "/jobs/civil", label: "وظائف مدنية", icon: FileText, category: "وظائف" },
  { path: "/jobs/military", label: "وظائف عسكرية", icon: Shield, category: "وظائف" },
  { path: "/jobs/companies", label: "وظائف شركات", icon: Building2, category: "وظائف" },
  { path: "/jobs/employer", label: "أصحاب العمل", icon: Users, category: "وظائف" },
  { path: "/jobs/organizations", label: "قائمة الجهات", icon: Building2, category: "وظائف" },
  { path: "/results", label: "نتائج التوظيف", icon: CheckCircle, category: "رئيسي" },
  { path: "/blog", label: "المدونة", icon: BookOpen, category: "محتوى" },
  { path: "/community", label: "المجتمع", icon: Users, category: "محتوى" },
  { path: "/store/services", label: "المتجر", icon: ShoppingBag, category: "خدمات" },
  { path: "/login", label: "تسجيل الدخول", icon: LogIn, category: "أخرى" },
];

const CATEGORIES = ["رئيسي", "وظائف", "محتوى", "خدمات", "أخرى"];

const EMPTY_SEO_LIST: SeoSetting[] = [];

const ROBOTS_OPTIONS = [
  { value: "index,follow", label: "فهرسة + متابعة" },
  { value: "index,nofollow", label: "فهرسة بدون متابعة" },
  { value: "noindex,follow", label: "بدون فهرسة + متابعة" },
  { value: "noindex,nofollow", label: "بدون فهرسة أو متابعة" },
];

const EMPTY_FORM = {
  pagePath: "",
  title: "",
  description: "",
  keywords: "",
  ogImage: "",
  canonicalUrl: "",
  robots: "index,follow",
  customMeta: "",
};

function CharCounter({ value, min, max }: { value: string; min: number; max: number }) {
  const len = value.length;
  const ok = len >= min && len <= max;
  const warn = len > max;
  return (
    <span className={`text-xs font-mono ${warn ? "text-red-500" : ok ? "text-green-500" : "text-muted-foreground"}`}>
      {len}/{max}
    </span>
  );
}

function GooglePreview({ title, description, path }: { title: string; description: string; path: string }) {
  const displayUrl = `example.com${path}`;
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1" dir="ltr">
      <p className="text-xs text-green-700 dark:text-green-400 font-medium truncate">{displayUrl}</p>
      <p className="text-[#1a0dab] dark:text-blue-400 text-base font-medium leading-tight line-clamp-1">
        {title || "عنوان الصفحة"}
      </p>
      <p className="text-sm text-[#4d5156] dark:text-muted-foreground leading-snug line-clamp-2">
        {description || "وصف الصفحة في محركات البحث..."}
      </p>
    </div>
  );
}

export default function AdminSeo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPath, setSelectedPath] = useState<string>("/");
  const [customPath, setCustomPath] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data: seoSettingsData, isLoading } = useQuery<SeoSetting[]>({
    queryKey: ["/api/admin/seo"],
    queryFn: () => fetch("/api/admin/seo", { credentials: "include" }).then(r => r.json()),
  });
  const seoSettings = seoSettingsData ?? EMPTY_SEO_LIST;

  const getSettingForPath = (path: string) => seoSettings.find(s => s.pagePath === path);

  useEffect(() => {
    const setting = getSettingForPath(selectedPath);
    if (setting) {
      setForm({
        pagePath: setting.pagePath,
        title: setting.title || "",
        description: setting.description || "",
        keywords: setting.keywords || "",
        ogImage: setting.ogImage || "",
        canonicalUrl: setting.canonicalUrl || "",
        robots: setting.robots || "index,follow",
        customMeta: setting.customMeta || "",
      });
    } else {
      setForm({ ...EMPTY_FORM, pagePath: selectedPath });
    }
  }, [selectedPath, seoSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof EMPTY_FORM) => {
      const existing = getSettingForPath(data.pagePath);
      if (existing) {
        const res = await fetch(`/api/admin/seo/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        return res.json();
      } else {
        const res = await fetch("/api/admin/seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo"] });
      toast({ title: "✓ تم الحفظ", description: `تم حفظ إعدادات السيو لـ ${form.pagePath}` });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في الحفظ", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/seo/${id}`, { method: "DELETE", credentials: "include" })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo"] });
      setForm({ ...EMPTY_FORM, pagePath: selectedPath });
      toast({ title: "تم الحذف" });
    },
    onError: () => toast({ title: "خطأ", variant: "destructive" }),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const path = showCustom ? customPath.trim() : selectedPath;
    if (!path) return;
    saveMutation.mutate({ ...form, pagePath: path });
  };

  const configuredCount = seoSettings.length;
  const totalCount = PAGES.length;

  const selectPage = (path: string) => {
    setSelectedPath(path);
    setShowCustom(false);
  };

  const currentSetting = getSettingForPath(showCustom ? customPath : selectedPath);

  return (
    <AdminLayout title="إعدادات السيو">
      <div className="space-y-4" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <a href="/admin/settings" className="p-2 hover:bg-muted rounded-lg transition-colors inline-flex">
            <ChevronLeft className="h-5 w-5" />
          </a>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold">إعدادات السيو</h2>
            <p className="text-sm text-muted-foreground">تحسين ظهور الموقع في محركات البحث</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground">
              {configuredCount} / {totalCount} صفحة مُهيَّأة
            </span>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(configuredCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main layout: sidebar + form */}
        <div className="grid grid-cols-[280px_1fr] gap-4 min-h-[600px]">

          {/* ─── Left: Pages List ─── */}
          <div className="space-y-3">
            {/* Pages grouped by category */}
            {CATEGORIES.map(cat => {
              const pages = PAGES.filter(p => p.category === cat);
              return (
                <div key={cat}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">{cat}</p>
                  <div className="space-y-1">
                    {pages.map(page => {
                      const Icon = page.icon;
                      const configured = !!getSettingForPath(page.path);
                      const isActive = !showCustom && selectedPath === page.path;
                      const setting = getSettingForPath(page.path);
                      return (
                        <button
                          key={page.path}
                          onClick={() => selectPage(page.path)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-right transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <div className="flex-1 min-w-0 text-right">
                            <p className="text-sm font-medium leading-none truncate">{page.label}</p>
                            <p className={`text-xs mt-0.5 truncate font-mono ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {page.path}
                            </p>
                          </div>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${configured ? "bg-green-500" : isActive ? "bg-primary-foreground/40" : "bg-muted-foreground/30"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Custom page */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">مخصص</p>
              <button
                onClick={() => setShowCustom(true)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-right transition-all ${
                  showCustom ? "bg-primary text-primary-foreground" : "hover:bg-muted border border-dashed border-border"
                }`}
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">صفحة مخصصة</span>
              </button>
            </div>

            {/* Other configured pages not in the list */}
            {seoSettings.filter(s => !PAGES.find(p => p.path === s.pagePath)).length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">صفحات أخرى</p>
                <div className="space-y-1">
                  {seoSettings.filter(s => !PAGES.find(p => p.path === s.pagePath)).map(s => (
                    <button
                      key={s.pagePath}
                      onClick={() => selectPage(s.pagePath)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-right transition-all ${
                        !showCustom && selectedPath === s.pagePath ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      <Globe className="h-4 w-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate">{s.pagePath}</p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── Right: Form ─── */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <form onSubmit={handleSave} className="h-full flex flex-col">
                {/* Form header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    {showCustom ? (
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <Input
                          value={customPath}
                          onChange={e => setCustomPath(e.target.value)}
                          placeholder="/custom-path"
                          className="h-8 w-48 font-mono text-sm"
                          dir="ltr"
                        />
                      </div>
                    ) : (
                      <>
                        {(() => { const Icon = PAGES.find(p => p.path === selectedPath)?.icon || Globe; return <Icon className="h-5 w-5 text-primary" />; })()}
                        <div>
                          <p className="font-bold text-sm">{PAGES.find(p => p.path === selectedPath)?.label || selectedPath}</p>
                          <p className="text-xs text-muted-foreground font-mono">{selectedPath}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentSetting && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => { if (confirm("حذف إعدادات السيو لهذه الصفحة؟")) deleteMutation.mutate(currentSetting.id); }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Badge variant={currentSetting ? "default" : "secondary"} className={currentSetting ? "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30" : ""}>
                      {currentSetting ? "مُهيَّأة" : "غير مُهيَّأة"}
                    </Badge>
                    <Button type="submit" size="sm" disabled={saveMutation.isPending} className="gap-1.5">
                      <Save className="h-3.5 w-3.5" />
                      {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                  </div>
                </div>

                {/* Scrollable form body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Google Preview */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">معاينة Google</p>
                    </div>
                    <GooglePreview
                      title={form.title}
                      description={form.description}
                      path={showCustom ? customPath : selectedPath}
                    />
                  </div>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">عنوان الصفحة (Title)</Label>
                      <CharCounter value={form.title} min={50} max={60} />
                    </div>
                    <Input
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="عنوان مُحسَّن لمحركات البحث — يفضل 50-60 حرف"
                      className="h-10"
                    />
                    {form.title.length > 60 && (
                      <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> العنوان طويل جداً</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">وصف الصفحة (Meta Description)</Label>
                      <CharCounter value={form.description} min={150} max={160} />
                    </div>
                    <Textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      placeholder="وصف مختصر للصفحة — يفضل 150-160 حرف"
                    />
                    {form.description.length > 160 && (
                      <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> الوصف طويل جداً</p>
                    )}
                  </div>

                  {/* Keywords */}
                  <div className="space-y-1.5">
                    <Label className="font-semibold">الكلمات المفتاحية</Label>
                    <Input
                      value={form.keywords}
                      onChange={e => setForm({ ...form, keywords: e.target.value })}
                      placeholder="وظائف السعودية, وظائف حكومية, فرص عمل..."
                      className="h-10"
                    />
                    {form.keywords && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {form.keywords.split(",").map((kw, i) => kw.trim() && (
                          <span key={i} className="text-xs bg-muted rounded-full px-2.5 py-1 text-muted-foreground">{kw.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* OG Image + Canonical */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold">صورة المشاركة (OG Image)</Label>
                      <MediaPicker
                        value={form.ogImage}
                        onChange={url => setForm({ ...form, ogImage: url })}
                        placeholder="اختر صورة"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold">الرابط الأساسي (Canonical)</Label>
                      <Input
                        value={form.canonicalUrl}
                        onChange={e => setForm({ ...form, canonicalUrl: e.target.value })}
                        placeholder="https://..."
                        className="h-10"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Robots */}
                  <div className="space-y-1.5">
                    <Label className="font-semibold">إعدادات الروبوتات</Label>
                    <Select value={form.robots} onValueChange={v => setForm({ ...form, robots: v })}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROBOTS_OPTIONS.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Meta */}
                  <div className="space-y-1.5">
                    <Label className="font-semibold">وسوم Meta إضافية</Label>
                    <Textarea
                      value={form.customMeta}
                      onChange={e => setForm({ ...form, customMeta: e.target.value })}
                      rows={3}
                      placeholder={'<meta name="..." content="..." />'}
                      className="font-mono text-xs"
                      dir="ltr"
                    />
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
