import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Home,
  Save,
  Eye,
  Briefcase,
  Building2,
  FileText,
  Star,
  BookOpen,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Hash,
  MessageSquare,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTION_DEFINITIONS = [
  { key: "hero",         label: "قسم الترحيب (Hero)",       icon: Home,          desc: "البانر الرئيسي في أعلى الصفحة" },
  { key: "stats",        label: "الإحصائيات",               icon: Hash,          desc: "عداد الوظائف والنتائج والمقالات" },
  { key: "featured",     label: "الوظائف المميزة",           icon: Star,          desc: "الوظائف الظاهرة في قسم المميزة" },
  { key: "latest_jobs",  label: "أحدث الوظائف",             icon: Briefcase,     desc: "قائمة آخر الوظائف المنشورة" },
  { key: "organizations",label: "الجهات الموظفة",           icon: Building2,     desc: "شبكة الجهات والشركات" },
  { key: "results",      label: "نتائج التوظيف",             icon: TrendingUp,    desc: "آخر نتائج الترقيات والقبول" },
  { key: "blog",         label: "أحدث المقالات",             icon: FileText,      desc: "مقالات المدونة الأحدث" },
  { key: "courses",      label: "الدورات التدريبية",         icon: GraduationCap, desc: "قسم الدورات المجانية" },
  { key: "community",    label: "تغريدات المجتمع",           icon: MessageSquare, desc: "آخر منشورات مجتمع الموقع" },
  { key: "categories",   label: "تصنيفات الوظائف",           icon: LayoutGrid,    desc: "شبكة أيقونات التصنيفات" },
];

interface HomepageSettings {
  sections: {
    [key: string]: {
      enabled: boolean;
      order: number;
    };
  };
  hero: {
    title: string;
    subtitle: string;
    showSearch: boolean;
  };
  stats: {
    showJobsCount: boolean;
    showOrgsCount: boolean;
    showResultsCount: boolean;
    showBlogCount: boolean;
  };
  latest_jobs: {
    count: number;
  };
  featured: {
    count: number;
  };
}

const DEFAULT_SETTINGS: HomepageSettings = {
  sections: Object.fromEntries(
    SECTION_DEFINITIONS.map((s, i) => [s.key, { enabled: true, order: i + 1 }])
  ),
  hero: {
    title: "الدليل الشامل للوظائف في المملكة العربية السعودية",
    subtitle: "تصفّح آلاف الوظائف الحكومية والعسكرية والقطاع الخاص",
    showSearch: true,
  },
  stats: {
    showJobsCount: true,
    showOrgsCount: true,
    showResultsCount: true,
    showBlogCount: true,
  },
  latest_jobs: { count: 12 },
  featured: { count: 4 },
};

export default function AdminHomePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedSection, setExpandedSection] = useState<string | null>("hero");

  const { data: savedSettings, isLoading } = useQuery<HomepageSettings>({
    queryKey: ["/api/admin/homepage-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/homepage-settings", { credentials: "include" });
      if (!res.ok) return DEFAULT_SETTINGS;
      return res.json();
    },
  });

  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const current = settings ?? savedSettings ?? DEFAULT_SETTINGS;

  const saveMutation = useMutation({
    mutationFn: async (data: HomepageSettings) => {
      const res = await fetch("/api/admin/homepage-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/homepage-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/homepage-settings"] });
      toast({ title: "تم الحفظ", description: "تم حفظ إعدادات الصفحة الرئيسية بنجاح" });
      setSettings(null);
    },
    onError: () => toast({ title: "خطأ", description: "فشل في حفظ الإعدادات", variant: "destructive" }),
  });

  const updateSection = (key: string, enabled: boolean) => {
    const next = {
      ...(settings ?? savedSettings ?? DEFAULT_SETTINGS),
      sections: {
        ...(settings ?? savedSettings ?? DEFAULT_SETTINGS).sections,
        [key]: { ...(settings ?? savedSettings ?? DEFAULT_SETTINGS).sections[key], enabled },
      },
    };
    setSettings(next);
  };

  const moveSection = (key: string, dir: "up" | "down") => {
    const base = settings ?? savedSettings ?? DEFAULT_SETTINGS;
    const sects = { ...base.sections };
    const current = sects[key].order;
    const swapKey = Object.keys(sects).find(k =>
      sects[k].order === (dir === "up" ? current - 1 : current + 1)
    );
    if (!swapKey) return;
    setSettings({
      ...base,
      sections: {
        ...sects,
        [key]: { ...sects[key], order: sects[swapKey].order },
        [swapKey]: { ...sects[swapKey], order: sects[key].order },
      },
    });
  };

  const updateHero = (field: keyof HomepageSettings["hero"], value: any) => {
    const base = settings ?? savedSettings ?? DEFAULT_SETTINGS;
    setSettings({ ...base, hero: { ...base.hero, [field]: value } });
  };

  const updateStats = (field: keyof HomepageSettings["stats"], value: boolean) => {
    const base = settings ?? savedSettings ?? DEFAULT_SETTINGS;
    setSettings({ ...base, stats: { ...base.stats, [field]: value } });
  };

  const updateLatestJobs = (count: number) => {
    const base = settings ?? savedSettings ?? DEFAULT_SETTINGS;
    setSettings({ ...base, latest_jobs: { count } });
  };

  const updateFeatured = (count: number) => {
    const base = settings ?? savedSettings ?? DEFAULT_SETTINGS;
    setSettings({ ...base, featured: { count } });
  };

  const sortedSections = SECTION_DEFINITIONS.slice().sort((a, b) =>
    (current.sections[a.key]?.order ?? 99) - (current.sections[b.key]?.order ?? 99)
  );

  const hasChanges = settings !== null;

  return (
    <AdminLayout title="اعدادات الصفحات">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <a href="/admin/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </a>
          <div>
            <h2 className="text-xl font-bold text-foreground">اعدادات الصفحات</h2>
            <p className="text-muted-foreground text-sm mt-0.5">تحكم في أقسام وترتيب الصفحة الرئيسية للزوار</p>
          </div>
        </div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              إدارة الصفحة الرئيسية
            </h1>
            <p className="text-muted-foreground text-sm mt-1">تحكم في أقسام وترتيب الصفحة الرئيسية للزوار</p>
          </div>
          <div className="flex gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                معاينة الموقع
              </Button>
            </a>
            <Button
              onClick={() => saveMutation.mutate(current)}
              disabled={saveMutation.isPending || !hasChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>لديك تغييرات غير محفوظة — اضغط "حفظ التغييرات" لتطبيقها على الموقع</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Sections Control */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                  أقسام الصفحة الرئيسية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sortedSections.map((section) => {
                  const sectionState = current.sections[section.key] ?? { enabled: true, order: 99 };
                  const Icon = section.icon;
                  const isLast = sectionState.order === Math.max(...Object.values(current.sections).map(s => s.order));
                  const isFirst = sectionState.order === Math.min(...Object.values(current.sections).map(s => s.order));

                  return (
                    <div
                      key={section.key}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all",
                        sectionState.enabled
                          ? "bg-card border-border"
                          : "bg-muted/30 border-border/50 opacity-60"
                      )}
                    >
                      {/* Order arrows */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveSection(section.key, "up")}
                          disabled={isFirst}
                          className="p-0.5 rounded hover:bg-muted disabled:opacity-20 transition-colors"
                        >
                          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => moveSection(section.key, "down")}
                          disabled={isLast}
                          className="p-0.5 rounded hover:bg-muted disabled:opacity-20 transition-colors"
                        >
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Order number */}
                      <span className="text-xs text-muted-foreground/60 w-5 text-center font-mono">
                        {sectionState.order}
                      </span>

                      {/* Icon */}
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        sectionState.enabled ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Icon className={cn("h-4 w-4", sectionState.enabled ? "text-primary" : "text-muted-foreground")} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{section.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{section.desc}</p>
                      </div>

                      {/* Settings expand button */}
                      {(section.key === "hero" || section.key === "stats" || section.key === "latest_jobs" || section.key === "featured") && (
                        <button
                          onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                          className="text-xs text-primary hover:underline shrink-0"
                        >
                          إعدادات
                        </button>
                      )}

                      {/* Toggle */}
                      <Switch
                        checked={sectionState.enabled}
                        onCheckedChange={(v) => updateSection(section.key, v)}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Hero Settings */}
            {expandedSection === "hero" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    إعدادات قسم الترحيب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>العنوان الرئيسي</Label>
                    <Input
                      value={current.hero.title}
                      onChange={(e) => updateHero("title", e.target.value)}
                      placeholder="عنوان الصفحة الرئيسية..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>العنوان الفرعي</Label>
                    <Textarea
                      value={current.hero.subtitle}
                      onChange={(e) => updateHero("subtitle", e.target.value)}
                      placeholder="وصف مختصر..."
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">إظهار شريط البحث</p>
                      <p className="text-xs text-muted-foreground">شريط البحث السريع عن الوظائف</p>
                    </div>
                    <Switch
                      checked={current.hero.showSearch}
                      onCheckedChange={(v) => updateHero("showSearch", v)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Settings */}
            {expandedSection === "stats" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    إعدادات الإحصائيات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: "showJobsCount",    label: "عدد الوظائف",    desc: "عداد إجمالي الوظائف المنشورة" },
                    { key: "showOrgsCount",    label: "عدد الجهات",     desc: "عداد الجهات الموظفة" },
                    { key: "showResultsCount", label: "عدد النتائج",    desc: "عداد نتائج التوظيف" },
                    { key: "showBlogCount",    label: "عدد المقالات",   desc: "عداد مقالات المدونة" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={current.stats[item.key as keyof HomepageSettings["stats"]]}
                        onCheckedChange={(v) => updateStats(item.key as keyof HomepageSettings["stats"], v)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Latest Jobs Settings */}
            {expandedSection === "latest_jobs" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    إعدادات أحدث الوظائف
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    <Label>عدد الوظائف المعروضة</Label>
                    <Input
                      type="number"
                      min={4}
                      max={24}
                      value={current.latest_jobs.count}
                      onChange={(e) => updateLatestJobs(Number(e.target.value))}
                      className="w-32"
                    />
                    <p className="text-xs text-muted-foreground">بين 4 و 24 وظيفة</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Featured Settings */}
            {expandedSection === "featured" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    إعدادات الوظائف المميزة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    <Label>عدد الوظائف المميزة</Label>
                    <Input
                      type="number"
                      min={1}
                      max={8}
                      value={current.featured.count}
                      onChange={(e) => updateFeatured(Number(e.target.value))}
                      className="w-32"
                    />
                    <p className="text-xs text-muted-foreground">بين 1 و 8 وظائف مميزة</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Footer */}
            <div className="flex justify-end pb-6">
              <Button
                onClick={() => saveMutation.mutate(current)}
                disabled={saveMutation.isPending || !hasChanges}
                size="lg"
                className="gap-2 px-8"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
