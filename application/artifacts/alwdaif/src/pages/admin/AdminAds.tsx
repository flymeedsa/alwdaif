import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Megaphone, Image as ImageIcon, Type, Bell, Eye, EyeOff,
  Sparkles, Loader2, Wand2, RotateCcw, X, GripVertical, Shapes,
  Zap, Shield, Hash, CheckCircle, Clock, Star,
  Globe, Phone, Send, Award, Rocket, Lock, FileText, Users,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MediaPicker from "@/components/admin/MediaPicker";
import IconPicker from "@/components/admin/IconPicker";
import { cn } from "@/lib/utils";
import type { Ad } from "@shared/schema";

const INTEREST_OPTIONS = [
  { value: "civil", label: "وظائف مدنية" },
  { value: "military", label: "وظائف عسكرية" },
  { value: "companies", label: "وظائف شركات" },
  { value: "results", label: "نتائج الوظائف" },
  { value: "courses", label: "دورات تدريبية" },
  { value: "blog", label: "المقالات والمدونة" },
  { value: "community", label: "المجتمع" },
];

const FEATURE_ICONS = [
  "Zap", "Shield", "Hash", "CheckCircle", "Clock", "Star",
  "Bell", "Globe", "Phone", "Send", "Award", "Rocket", "Lock", "FileText", "Users",
];

const ICON_MAP: Record<string, React.ElementType> = {
  Zap, Shield, Hash, CheckCircle, Clock, Star,
  Bell, Globe, Phone, Send, Award, Rocket, Lock, FileText, Users,
};

type FeatureRow = { icon: string; text: string };

function contentToFeatures(content: string): FeatureRow[] {
  if (!content.trim()) return [];
  return content.split("\n").map(line => {
    const [icon, ...rest] = line.split("|");
    return rest.length > 0
      ? { icon: icon.trim(), text: rest.join("|").trim() }
      : { icon: "", text: icon.trim() };
  }).filter(f => f.text);
}

function featuresToContent(features: FeatureRow[]): string {
  return features.map(f => (f.icon && f.icon !== "none") ? `${f.icon}|${f.text}` : f.text).join("\n");
}

const defaultForm = {
  title: "",
  type: "image",
  content: "",
  description: "",
  ctaText: "",
  titleColor: "",
  ctaBgColor: "",
  ctaTextColor: "",
  targetInterests: "",
  imageUrl: "",
  linkUrl: "",
  position: "header_banner",
  pages: "",
  isActive: true,
  priority: 0,
};

const TABS = [
  { key: "all", label: "الكل" },
  { key: "active", label: "إعلانات نشطة" },
  { key: "inactive", label: "إعلانات متوقفة" },
  { key: "deleted", label: "إعلانات محذوفة" },
];

export default function AdminAds() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState({ ...defaultForm });
  const [activeTab, setActiveTab] = useState("all");
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [customInterests, setCustomInterests] = useState<{ value: string; label: string }[]>([]);
  const [showInterestInput, setShowInterestInput] = useState(false);
  const [newInterestText, setNewInterestText] = useState("");

  const [mediaMode, setMediaMode] = useState<"image" | "icon">("image");

  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const statusParam = activeTab === "all" ? "" : `?status=${activeTab}`;
  const { data: ads = [], isLoading } = useQuery<Ad[]>({
    queryKey: ["/api/admin/ads", activeTab],
    queryFn: async () => {
      const r = await fetch(`/api/admin/ads${statusParam}`, { credentials: "include" });
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "تمت الإضافة", description: "تم إضافة الإعلان بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في إضافة الإعلان", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      fetch(`/api/admin/ads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      setIsDialogOpen(false);
      setEditingAd(null);
      resetForm();
      toast({ title: "تم التحديث", description: "تم تحديث الإعلان بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في تحديث الإعلان", variant: "destructive" }),
  });

  const trashMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/ads/${id}/trash`, { method: "POST", credentials: "include" })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      toast({ title: "تم النقل للسلة", description: "يمكنك استعادة الإعلان من تبويب المحذوفة" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في نقل الإعلان للسلة", variant: "destructive" }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/ads/${id}/restore`, { method: "POST", credentials: "include" })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      toast({ title: "تمت الاستعادة", description: "تم استعادة الإعلان بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في استعادة الإعلان", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/ads/${id}`, { method: "DELETE", credentials: "include" })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      toast({ title: "تم الحذف نهائياً", description: "تم حذف الإعلان بشكل نهائي" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في حذف الإعلان", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({ ...defaultForm });
    setFeatures([]);
    setCustomInterests([]);
    setShowInterestInput(false);
    setNewInterestText("");
    setMediaMode("image");
  };

  const updateFeatures = (newFeatures: FeatureRow[]) => {
    setFeatures(newFeatures);
    setFormData(prev => ({ ...prev, content: featuresToContent(newFeatures) }));
  };

  const addFeature = () => updateFeatures([...features, { icon: "Zap", text: "" }]);

  const removeFeature = (idx: number) => updateFeatures(features.filter((_, i) => i !== idx));

  const updateFeatureField = (idx: number, field: keyof FeatureRow, value: string) => {
    const updated = features.map((f, i) => i === idx ? { ...f, [field]: value } : f);
    updateFeatures(updated);
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    const targetInterests = (ad as any).targetInterests || "";
    const savedInterests = targetInterests ? targetInterests.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    const builtinValues = INTEREST_OPTIONS.map(o => o.value);
    const custom = savedInterests
      .filter((v: string) => !builtinValues.includes(v))
      .map((v: string) => ({ value: v, label: v }));
    setCustomInterests(custom);
    setShowInterestInput(false);
    setNewInterestText("");
    setFormData({
      title: ad.title,
      type: ad.type,
      content: ad.content || "",
      description: (ad as any).description || "",
      ctaText: (ad as any).ctaText || "",
      titleColor: (ad as any).titleColor || "",
      ctaBgColor: (ad as any).ctaBgColor || "",
      ctaTextColor: (ad as any).ctaTextColor || "",
      targetInterests,
      imageUrl: ad.imageUrl || "",
      linkUrl: ad.linkUrl || "",
      position: ad.position,
      pages: ad.pages || "",
      isActive: ad.isActive ?? true,
      priority: ad.priority ?? 0,
    });
    setFeatures(contentToFeatures(ad.content || ""));
    setMediaMode((ad.imageUrl || "").startsWith("icon:") ? "icon" : "image");
    setIsDialogOpen(true);
  };

  const addCustomInterest = () => {
    const val = newInterestText.trim();
    if (!val) return;
    const key = val;
    if (INTEREST_OPTIONS.some(o => o.value === key) || customInterests.some(c => c.value === key)) return;
    const newCustom = [...customInterests, { value: key, label: val }];
    setCustomInterests(newCustom);
    const current = formData.targetInterests ? formData.targetInterests.split(",").map(s => s.trim()).filter(Boolean) : [];
    setFormData(prev => ({ ...prev, targetInterests: [...current, key].join(",") }));
    setNewInterestText("");
    setShowInterestInput(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAd) {
      updateMutation.mutate({ id: editingAd.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleInterest = (value: string) => {
    const current = formData.targetInterests
      ? formData.targetInterests.split(",").map(s => s.trim()).filter(Boolean)
      : [];
    const updated = current.includes(value)
      ? current.filter(i => i !== value)
      : [...current, value];
    setFormData({ ...formData, targetInterests: updated.join(",") });
  };

  const selectedInterests = formData.targetInterests
    ? formData.targetInterests.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/ads/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        ctaText: data.ctaText || prev.ctaText,
        targetInterests: data.targetInterests || prev.targetInterests,
      }));
      setAiDialogOpen(false);
      setAiPrompt("");
      toast({ title: "✨ تم التوليد", description: "تم ملء الحقول بالذكاء الاصطناعي — راجع وعدّل حسب الحاجة" });
    } catch {
      toast({ title: "خطأ", description: "فشل توليد المحتوى بالذكاء الاصطناعي", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const types = [
    { value: "image", label: "إعلان صوري", icon: ImageIcon },
    { value: "text", label: "إعلان نصي", icon: Type },
    { value: "notification", label: "إشعار", icon: Bell },
  ];

  const positions = [
    { value: "header_banner", label: "بانر ذكي تحت الهيدر (موصى به)" },
    { value: "header-top", label: "أعلى الهيدر" },
    { value: "header", label: "داخل الهيدر" },
    { value: "sidebar", label: "القائمة الجانبية" },
    { value: "content", label: "داخل المحتوى" },
    { value: "jobs", label: "صفحة الوظائف" },
    { value: "results", label: "صفحة النتائج" },
    { value: "footer", label: "الفوتر" },
  ];

  return (
    <AdminLayout title="إعلانات الموقع">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <a href="/admin/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </a>
          <div>
            <h2 className="text-xl font-bold text-foreground">إعلانات الموقع</h2>
            <p className="text-muted-foreground text-sm mt-0.5">إدارة البنرات الذكية التي تستهدف الزوار حسب اهتماماتهم</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit border border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`tab-ads-${tab.key}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">الإعلانات تظهر تلقائياً تحت الهيدر في كل صفحات الموقع</p>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingAd(null); resetForm(); } }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" data-testid="btn-add-ad">
                <Plus className="h-4 w-4 ml-2" />
                إضافة إعلان
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2">
                  <span>{editingAd ? "تعديل الإعلان" : "إضافة إعلان جديد"}</span>
                  <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" size="sm" variant="outline" className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10">
                        <Sparkles className="h-3.5 w-3.5" />
                        توليد بالذكاء الاصطناعي
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm" dir="rtl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Wand2 className="h-5 w-5 text-primary" />
                          توليد محتوى الإعلان
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          اكتب فكرة الإعلان بشكل مختصر وسيقوم الذكاء الاصطناعي بكتابة العنوان والوصف ونص الزر تلقائياً
                        </p>
                        <div className="space-y-2">
                          <Label>فكرة الإعلان</Label>
                          <Textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="مثال: إعلان عن دورة جدارات للوظائف المدنية، أو انضم لمجتمع الباحثين عن عمل..."
                            rows={3}
                            data-testid="input-ai-prompt"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleAiGenerate}
                            disabled={aiLoading || !aiPrompt.trim()}
                            className="flex-1"
                            data-testid="btn-ai-generate"
                          >
                            {aiLoading ? (
                              <><Loader2 className="h-4 w-4 ml-2 animate-spin" />جاري التوليد...</>
                            ) : (
                              <><Sparkles className="h-4 w-4 ml-2" />توليد</>
                            )}
                          </Button>
                          <Button variant="outline" onClick={() => setAiDialogOpen(false)}>إلغاء</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>عنوان الإعلان *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="مثال: انضم لأكبر تجمع باحثين عن عمل"
                    required
                    data-testid="input-ad-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الوصف (اختياري)</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف مختصر يظهر تحت العنوان في البانر"
                    data-testid="input-ad-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نص زر الإجراء</Label>
                    <Input
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      placeholder="اعرف أكثر"
                      data-testid="input-ad-cta"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رابط الإعلان</Label>
                    <Input
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      placeholder="https://..."
                      data-testid="input-ad-link"
                    />
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-2 p-3 bg-muted/40 rounded-xl border border-border/60">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">🎨 الألوان المخصصة</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">لون العنوان</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.titleColor || "#111827"}
                          onChange={(e) => setFormData({ ...formData, titleColor: e.target.value })}
                          className="w-8 h-8 rounded-lg border border-border cursor-pointer p-0.5 bg-card"
                          title="لون العنوان"
                        />
                        <Input
                          value={formData.titleColor}
                          onChange={(e) => setFormData({ ...formData, titleColor: e.target.value })}
                          placeholder="افتراضي"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">خلفية الزر</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.ctaBgColor || "#2563eb"}
                          onChange={(e) => setFormData({ ...formData, ctaBgColor: e.target.value })}
                          className="w-8 h-8 rounded-lg border border-border cursor-pointer p-0.5 bg-card"
                          title="لون خلفية الزر"
                        />
                        <Input
                          value={formData.ctaBgColor}
                          onChange={(e) => setFormData({ ...formData, ctaBgColor: e.target.value })}
                          placeholder="افتراضي"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">نص الزر</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.ctaTextColor || "#ffffff"}
                          onChange={(e) => setFormData({ ...formData, ctaTextColor: e.target.value })}
                          className="w-8 h-8 rounded-lg border border-border cursor-pointer p-0.5 bg-card"
                          title="لون نص الزر"
                        />
                        <Input
                          value={formData.ctaTextColor}
                          onChange={(e) => setFormData({ ...formData, ctaTextColor: e.target.value })}
                          placeholder="افتراضي"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                  </div>
                  {(formData.ctaBgColor || formData.titleColor) && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">معاينة الزر:</span>
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-lg"
                        style={{
                          backgroundColor: formData.ctaBgColor || "#2563eb",
                          color: formData.ctaTextColor || "#ffffff",
                        }}
                      >
                        {formData.ctaText || "الزر"}
                      </span>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                        onClick={() => setFormData({ ...formData, titleColor: "", ctaBgColor: "", ctaTextColor: "" })}
                      >
                        إعادة تعيين
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>الاهتمامات المستهدفة</Label>
                    <button
                      type="button"
                      onClick={() => { setShowInterestInput(v => !v); setNewInterestText(""); }}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      data-testid="btn-add-interest"
                      title="إضافة اهتمام مخصص"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      إضافة اهتمام
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">اختر من تريد إظهار الإعلان له. إذا لم تختر شيئاً يظهر لجميع الزوار.</p>

                  {showInterestInput && (
                    <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg border border-dashed border-primary/40">
                      <Input
                        value={newInterestText}
                        onChange={(e) => setNewInterestText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomInterest(); } if (e.key === "Escape") { setShowInterestInput(false); setNewInterestText(""); } }}
                        placeholder="اكتب اسم الاهتمام..."
                        className="h-7 text-xs flex-1"
                        autoFocus
                        data-testid="input-new-interest"
                      />
                      <button
                        type="button"
                        onClick={addCustomInterest}
                        disabled={!newInterestText.trim()}
                        className="h-7 px-3 text-xs bg-primary text-primary-foreground rounded-md disabled:opacity-40 hover:opacity-90 transition-opacity"
                        data-testid="btn-confirm-interest"
                      >
                        إضافة
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowInterestInput(false); setNewInterestText(""); }}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleInterest(opt.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          selectedInterests.includes(opt.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                        data-testid={`interest-${opt.value}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    {customInterests.map((opt) => (
                      <span key={opt.value} className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleInterest(opt.value)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            selectedInterests.includes(opt.value)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          }`}
                          data-testid={`interest-custom-${opt.value}`}
                        >
                          {opt.label}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomInterests(prev => prev.filter(c => c.value !== opt.value));
                            setFormData(prev => ({
                              ...prev,
                              targetInterests: prev.targetInterests
                                .split(",").map(s => s.trim()).filter(s => s && s !== opt.value).join(",")
                            }));
                          }}
                          className="text-muted-foreground hover:text-red-500 transition-colors -mr-1"
                          title="إزالة"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع الإعلان *</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>موضع الإعلان *</Label>
                    <Select value={formData.position} onValueChange={(v) => setFormData({ ...formData, position: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {positions.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.type === "image" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>صورة الإعلان أو أيقونة</Label>
                      <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setMediaMode("image");
                            if (formData.imageUrl?.startsWith("icon:")) setFormData({ ...formData, imageUrl: "" });
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all font-medium",
                            mediaMode === "image"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          data-testid="btn-media-mode-image"
                        >
                          <ImageIcon className="h-3 w-3" />
                          صورة
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMediaMode("icon");
                            if (!formData.imageUrl?.startsWith("icon:")) setFormData({ ...formData, imageUrl: "" });
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all font-medium",
                            mediaMode === "icon"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          data-testid="btn-media-mode-icon"
                        >
                          <Shapes className="h-3 w-3" />
                          أيقونة
                        </button>
                      </div>
                    </div>
                    {mediaMode === "icon" ? (
                      <IconPicker
                        value={formData.imageUrl}
                        onChange={(val) => setFormData({ ...formData, imageUrl: val })}
                        placeholder="اختر أيقونة للإعلان"
                      />
                    ) : (
                      <MediaPicker
                        value={formData.imageUrl}
                        onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                        placeholder="اختر صورة للإعلان"
                      />
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>المميزات</Label>
                    <button
                      type="button"
                      onClick={addFeature}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      data-testid="btn-add-feature"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      إضافة ميزة
                    </button>
                  </div>

                  {features.length === 0 ? (
                    <button
                      type="button"
                      onClick={addFeature}
                      className="w-full border-2 border-dashed border-border rounded-lg py-5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary/70 transition-colors flex flex-col items-center gap-1.5"
                    >
                      <Plus className="h-5 w-5" />
                      أضف ميزة للإعلان
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {features.map((feature, idx) => {
                        const IconComp = ICON_MAP[feature.icon];
                        return (
                          <div key={idx} className="flex items-center gap-2 bg-muted/40 rounded-lg p-2 border border-border">
                            <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                            <Select
                              value={feature.icon}
                              onValueChange={(v) => updateFeatureField(idx, "icon", v)}
                            >
                              <SelectTrigger className="w-[120px] flex-shrink-0 h-8 text-xs gap-1.5" data-testid={`select-icon-${idx}`}>
                                <span className="flex items-center gap-1.5">
                                  {IconComp && feature.icon !== "none" && <IconComp className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                                  <span className="truncate">{(!feature.icon || feature.icon === "none") ? "بدون" : feature.icon}</span>
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="text-muted-foreground">بدون أيقونة</span>
                                </SelectItem>
                                {FEATURE_ICONS.map((name) => {
                                  const Ic = ICON_MAP[name];
                                  return (
                                    <SelectItem key={name} value={name}>
                                      <span className="flex items-center gap-2">
                                        {Ic && <Ic className="h-3.5 w-3.5 text-primary" />}
                                        {name}
                                      </span>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <Input
                              value={feature.text}
                              onChange={(e) => updateFeatureField(idx, "text", e.target.value)}
                              placeholder="نص الميزة..."
                              className="flex-1 h-8 text-sm"
                              data-testid={`input-feature-${idx}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeFeature(idx)}
                              className="p-1 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                              data-testid={`btn-remove-feature-${idx}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الأولوية (كلما كانت أعلى ظهر أولاً)</Label>
                    <Input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <Label>مفعّل</Label>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                      data-testid="switch-ad-active"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="btn-submit-ad">
                    {editingAd ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground/70 text-xl mb-2">لا توجد إعلانات حالياً</p>
            <p className="text-muted-foreground/50 text-sm">أضف إعلانك الأول واستخدم الذكاء الاصطناعي لتوليد المحتوى</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {ads.map((ad) => {
              const adInterests = (ad as any).targetInterests
                ? ((ad as any).targetInterests as string).split(",").map((s: string) => s.trim()).filter(Boolean)
                : [];
              return (
                <Card key={ad.id} className="bg-card border-border" data-testid={`card-ad-${ad.id}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        ad.type === "image" ? "bg-purple-500/20" : ad.type === "text" ? "bg-blue-500/20" : "bg-yellow-500/20"
                      }`}>
                        {ad.imageUrl ? (
                          <img src={ad.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : ad.type === "image" ? (
                          <ImageIcon className="h-6 w-6 text-purple-400" />
                        ) : ad.type === "text" ? (
                          <Type className="h-6 w-6 text-blue-400" />
                        ) : (
                          <Bell className="h-6 w-6 text-yellow-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                          {ad.title}
                          {ad.isActive
                            ? <Eye className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                            : <EyeOff className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                          }
                        </h3>
                        {(ad as any).description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">{(ad as any).description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-xs text-muted-foreground">الأولوية: {ad.priority}</span>
                          {adInterests.length > 0 ? (
                            adInterests.map((i: string) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                                {INTEREST_OPTIONS.find(o => o.value === i)?.label || i}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">عام (كل الزوار)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {activeTab !== "deleted" ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(ad)} data-testid={`btn-edit-ad-${ad.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { if (confirm("نقل الإعلان إلى سلة المحذوفات؟")) trashMutation.mutate(ad.id); }}
                            data-testid={`btn-trash-ad-${ad.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => restoreMutation.mutate(ad.id)}
                            data-testid={`btn-restore-ad-${ad.id}`}
                            title="استعادة"
                          >
                            <RotateCcw className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { if (confirm("حذف نهائي؟ لا يمكن التراجع عن هذا الإجراء.")) deleteMutation.mutate(ad.id); }}
                            data-testid={`btn-delete-ad-${ad.id}`}
                            title="حذف نهائي"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
