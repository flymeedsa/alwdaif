import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Twitter,
  Settings,
  Send,
  List,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Eye,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Link } from "wouter";

interface TwitterSettings {
  id: number;
  enabled: boolean;
  autoJobsGeneral: boolean;
  autoJobsCivil: boolean;
  autoJobsMilitary: boolean;
  autoJobsCompanies: boolean;
  autoJobsOrganizations: boolean;
  autoJobsResults: boolean;
  autoBlog: boolean;
  defaultHashtags: string;
  imageSource: string;
  templateJob: string;
  templateCivil: string;
  templateMilitary: string;
  templateCompanies: string;
  templateOrganizations: string;
  templateResults: string;
  templateBlog: string;
  rateLimitPerHour: number;
}

interface TwitterPost {
  id: number;
  contentType: string;
  contentId: number;
  tweetId: string | null;
  tweetUrl: string | null;
  tweetText: string | null;
  status: string;
  isAuto: boolean;
  publishedBy: number | null;
  attempts: number;
  errorMessage: string | null;
  createdAt: string;
  publishedAt: string | null;
  contentTitle?: string;
}

interface TwitterStatus {
  configured: boolean;
  enabled: boolean;
  todayCount: number;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  published: { label: "منشور", variant: "default" },
  failed: { label: "فشل", variant: "destructive" },
  pending: { label: "معلّق", variant: "secondary" },
};

const TYPE_LABELS: Record<string, string> = {
  job: "وظيفة",
  blog: "مقال",
  result: "نتيجة",
};

export default function AdminTwitter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [previewType, setPreviewType] = useState<"job" | "blog" | "result">("job");
  const [previewId, setPreviewId] = useState("");
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const { data: status } = useQuery<TwitterStatus>({
    queryKey: ["/api/twitter/status"],
    queryFn: async () => {
      const res = await fetch("/api/twitter/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<TwitterSettings>({
    queryKey: ["/api/twitter/settings"],
    queryFn: async () => {
      const res = await fetch("/api/twitter/settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery<TwitterPost[]>({
    queryKey: ["/api/twitter/posts"],
    queryFn: async () => {
      const res = await fetch("/api/twitter/posts?limit=50", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Partial<TwitterSettings>) => {
      const res = await fetch("/api/twitter/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/twitter/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/twitter/status"] });
      toast({ title: "✅ تم حفظ الإعدادات" });
    },
    onError: () => toast({ title: "❌ فشل الحفظ", variant: "destructive" }),
  });

  const handleSave = () => {
    if (!settings) return;
    saveSettingsMutation.mutate(settings);
  };

  const handleToggle = (key: keyof TwitterSettings, value: boolean) => {
    if (!settings) return;
    saveSettingsMutation.mutate({ [key]: value });
  };

  const handlePreview = async () => {
    if (!previewId) return;
    setIsPreviewing(true);
    setPreviewText(null);
    try {
      const res = await fetch(`/api/twitter/preview?contentType=${previewType}&contentId=${previewId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.text) {
        setPreviewText(data.text);
        setCustomText(data.text);
      } else {
        toast({ title: "❌ " + (data.message || "فشل المعاينة"), variant: "destructive" });
      }
    } catch {
      toast({ title: "❌ خطأ في المعاينة", variant: "destructive" });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handlePublish = async () => {
    if (!previewId) return;
    setIsPublishing(true);
    try {
      const res = await fetch("/api/twitter/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contentType: previewType,
          contentId: parseInt(previewId),
          customText: customText || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "✅ تم النشر في X بنجاح" });
        queryClient.invalidateQueries({ queryKey: ["/api/twitter/posts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/twitter/status"] });
        setPreviewText(null);
        setCustomText("");
        setPreviewId("");
      } else {
        toast({ title: "❌ " + (data.error || "فشل النشر"), variant: "destructive" });
      }
    } catch {
      toast({ title: "❌ خطأ في النشر", variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  };

  const SettingRow = ({ label, fieldKey }: { label: string; fieldKey: keyof TwitterSettings }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <span className="text-sm font-medium">{label}</span>
      <Switch
        checked={!!(settings as any)?.[fieldKey]}
        onCheckedChange={(v) => handleToggle(fieldKey, v)}
        disabled={saveSettingsMutation.isPending}
      />
    </div>
  );

  if (settingsLoading) {
    return (
      <AdminLayout title="النشر في X">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="النشر في X / Twitter">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Twitter className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">النشر في X / Twitter</h1>
            <p className="text-muted-foreground text-sm">إدارة النشر التلقائي واليدوي لمحتوى الموقع</p>
          </div>
          <div className="mr-auto flex items-center gap-2">
            {status?.configured ? (
              <Badge variant="default" className="gap-1">
                <Wifi className="h-3 w-3" /> متصل
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" /> غير متصل
              </Badge>
            )}
            {status?.todayCount !== undefined && (
              <Badge variant="outline">{status.todayCount} منشور اليوم</Badge>
            )}
          </div>
        </div>

        {!status?.configured && (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300">مفاتيح X API غير مضبوطة</p>
              <p className="text-yellow-700 dark:text-yellow-400 mt-0.5">
                أضف المتغيرات في إعدادات Cloudways الآمنة: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="settings" dir="rtl">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" />الإعدادات</TabsTrigger>
            <TabsTrigger value="publish" className="gap-2"><Send className="h-4 w-4" />نشر يدوي</TabsTrigger>
            <TabsTrigger value="log" className="gap-2"><List className="h-4 w-4" />السجل</TabsTrigger>
            <TabsTrigger value="connection" className="gap-2"><Wifi className="h-4 w-4" />الربط</TabsTrigger>
          </TabsList>

          {/* ─── Settings Tab ─── */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">تفعيل النظام</CardTitle></CardHeader>
                <CardContent>
                  <SettingRow label="تفعيل نظام النشر في X" fieldKey="enabled" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">النشر التلقائي</CardTitle></CardHeader>
                <CardContent>
                  <SettingRow label="وظائف عامة" fieldKey="autoJobsGeneral" />
                  <SettingRow label="وظائف مدنية" fieldKey="autoJobsCivil" />
                  <SettingRow label="وظائف عسكرية" fieldKey="autoJobsMilitary" />
                  <SettingRow label="وظائف الشركات" fieldKey="autoJobsCompanies" />
                  <SettingRow label="وظائف الجهات" fieldKey="autoJobsOrganizations" />
                  <SettingRow label="نتائج الوظائف" fieldKey="autoJobsResults" />
                  <SettingRow label="مقالات المدونة" fieldKey="autoBlog" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">الإعدادات العامة</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الهاشتاقات الافتراضية</Label>
                    <Input
                      value={settings?.defaultHashtags || ""}
                      onChange={(e) => saveSettingsMutation.mutate({ ...settings, defaultHashtags: e.target.value })}
                      placeholder="#وظائف_السعودية #وظائف"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>مصدر الصورة</Label>
                    <Select
                      value={settings?.imageSource || "logo"}
                      onValueChange={(v) => saveSettingsMutation.mutate({ ...settings, imageSource: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="logo">شعار الموقع</SelectItem>
                        <SelectItem value="featured">الصورة البارزة</SelectItem>
                        <SelectItem value="company">صورة الشركة</SelectItem>
                        <SelectItem value="default">بدون صورة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>حد النشر في الساعة</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={settings?.rateLimitPerHour || 5}
                      onChange={(e) => saveSettingsMutation.mutate({ ...settings, rateLimitPerHour: parseInt(e.target.value) || 5 })}
                      className="text-left"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">الحد الأقصى للتغريدات التلقائية في الساعة الواحدة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">قوالب التغريدات</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">المتغيرات المتاحة: {"{{title}} {{company}} {{city}} {{url}} {{hashtags}}"}</p>
                {[
                  { key: "templateJob" as keyof TwitterSettings, label: "قالب الوظيفة العامة" },
                  { key: "templateCivil" as keyof TwitterSettings, label: "قالب الوظيفة المدنية" },
                  { key: "templateMilitary" as keyof TwitterSettings, label: "قالب الوظيفة العسكرية" },
                  { key: "templateCompanies" as keyof TwitterSettings, label: "قالب وظائف الشركات" },
                  { key: "templateOrganizations" as keyof TwitterSettings, label: "قالب وظائف الجهات" },
                  { key: "templateResults" as keyof TwitterSettings, label: "قالب نتائج الوظائف" },
                  { key: "templateBlog" as keyof TwitterSettings, label: "قالب مقالات المدونة" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Textarea
                      value={(settings as any)?.[key] || ""}
                      onChange={(e) => {
                        if (!settings) return;
                        (settings as any)[key] = e.target.value;
                      }}
                      onBlur={(e) => saveSettingsMutation.mutate({ [key]: e.target.value })}
                      rows={4}
                      className="text-sm font-mono resize-none"
                      dir="rtl"
                    />
                  </div>
                ))}

                <Button onClick={handleSave} disabled={saveSettingsMutation.isPending} className="gap-2">
                  {saveSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  حفظ القوالب
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Manual Publish Tab ─── */}
          <TabsContent value="publish" className="mt-6">
            <Card>
              <CardHeader><CardTitle className="text-base">نشر يدوي</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {!status?.configured && (
                  <p className="text-sm text-destructive">مفاتيح X API غير مضبوطة — لا يمكن النشر</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع المحتوى</Label>
                    <Select value={previewType} onValueChange={(v) => { setPreviewType(v as any); setPreviewText(null); setCustomText(""); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="job">وظيفة</SelectItem>
                        <SelectItem value="blog">مقال المدونة</SelectItem>
                        <SelectItem value="result">نتيجة وظيفة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>رقم المحتوى (ID)</Label>
                    <Input
                      type="number"
                      value={previewId}
                      onChange={(e) => { setPreviewId(e.target.value); setPreviewText(null); }}
                      placeholder="مثال: 303"
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <Button variant="outline" onClick={handlePreview} disabled={!previewId || isPreviewing} className="gap-2">
                  {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  معاينة التغريدة
                </Button>

                {previewText && (
                  <div className="space-y-3">
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-2">معاينة التغريدة ({previewText.length}/280 حرف)</p>
                      <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{previewText}</pre>
                    </div>

                    <div className="space-y-2">
                      <Label>تعديل النص (اختياري)</Label>
                      <Textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        rows={5}
                        maxLength={280}
                        className="text-sm font-mono"
                        dir="rtl"
                      />
                      <p className="text-xs text-muted-foreground text-left">{customText.length}/280</p>
                    </div>

                    <Button
                      onClick={handlePublish}
                      disabled={!status?.configured || isPublishing}
                      className="gap-2 bg-black hover:bg-black/80 text-white"
                    >
                      {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Twitter className="h-4 w-4" />}
                      نشر في X الآن
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Log Tab ─── */}
          <TabsContent value="log" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">سجل المنشورات</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/twitter/posts"] })}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : posts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد منشورات بعد</p>
                ) : (
                  <div className="space-y-2">
                    {posts.map((post) => {
                      const { label, variant } = STATUS_LABELS[post.status] || { label: post.status, variant: "outline" as const };
                      return (
                        <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">{TYPE_LABELS[post.contentType] || post.contentType}</Badge>
                              <Badge variant={variant} className="text-xs">{label}</Badge>
                              {post.isAuto && <Badge variant="secondary" className="text-xs">تلقائي</Badge>}
                            </div>
                            <p className="text-sm font-medium truncate">{post.tweetText?.slice(0, 80)}...</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("ar-SA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : new Date(post.createdAt).toLocaleDateString("ar-SA")}
                              </span>
                              {post.errorMessage && (
                                <span className="text-xs text-destructive truncate">{post.errorMessage}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {post.status === "published" ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : post.status === "failed" ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                            {post.tweetUrl && (
                              <a href={post.tweetUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Connection Tab ─── */}
          <TabsContent value="connection" className="mt-6">
            <Card>
              <CardHeader><CardTitle className="text-base">حالة الربط مع X</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className={`flex items-center gap-4 p-4 rounded-lg border ${status?.configured ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"}`}>
                  {status?.configured ? (
                    <CheckCircle className="h-8 w-8 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600 shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">{status?.configured ? "متصل بـ X API" : "غير متصل بـ X API"}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {status?.configured ? "المفاتيح موجودة ومضبوطة بشكل صحيح" : "لم يتم إضافة المفاتيح بعد"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">المتغيرات المطلوبة في Cloudways</h3>
                  {["TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_TOKEN_SECRET"].map((key) => (
                    <div key={key} className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm" dir="ltr">
                      <span className="text-green-600">$</span>
                      <span>{key}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">خطوات الإعداد:</p>
                  <ol className="list-decimal list-inside space-y-1.5 mr-2">
                    <li>افتح <a href="https://developer.twitter.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">developer.twitter.com</a> وأنشئ حساباً</li>
                    <li>أنشئ تطبيقاً جديداً واحصل على المفاتيح الأربعة</li>
                    <li>فعّل صلاحية <strong>Read and Write</strong> للتطبيق</li>
                    <li>أضف المفاتيح في إعدادات التطبيق الآمنة على Cloudways</li>
                    <li>أعد تشغيل الخادم بعد إضافة المفاتيح</li>
                  </ol>
                  <p className="text-xs mt-2">ملاحظة: حدود النشر تعتمد على باقة X API الخاصة بحسابك. راجع <a href="https://developer.twitter.com/en/docs/twitter-api/getting-started/about-twitter-api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">صفحة الباقات</a> للاطلاع على الحدود.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
