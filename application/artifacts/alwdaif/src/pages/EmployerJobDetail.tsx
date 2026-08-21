import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useParams, Link } from "wouter";
import { buildJobPostingJsonLd } from "@/lib/structuredData";
import { useQuery } from "@tanstack/react-query";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  MapPin,
  Calendar,
  Eye,
  Building2,
  Users,
  Globe,
  Flag,
  Mail,
  Phone,
  ExternalLink,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  AlertTriangle,
  Clock,
  ChevronLeft,
  FileText,
  Zap,
  Upload,
  X,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Sparkles,
  Loader2,
} from "lucide-react";

const GENDER_LABELS: Record<string, string> = {
  male: "ذكور فقط",
  female: "إناث فقط",
  all: "الجنسين",
};

const NATIONALITY_LABELS: Record<string, string> = {
  saudi: "سعودي فقط",
  non_saudi: "غير سعودي",
  all: "جميع الجنسيات",
};

const WORK_SCHEDULE_LABELS: Record<string, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
};

const WORK_MODE_LABELS: Record<string, string> = {
  on_site: "حضوري",
  remote: "عن بعد",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function daysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ApplySection({ job, isClosed }: { job: any; isClosed: boolean }) {
  if (isClosed) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-border text-muted-foreground">
        <AlertTriangle className="h-5 w-5 text-gray-400 flex-shrink-0" />
        <span className="text-sm font-medium">انتهى موعد التقديم على هذه الوظيفة</span>
      </div>
    );
  }

  const applyConfig = job.contactMethod === "url"
    ? { icon: ExternalLink, type: "عبر الرابط الخارجي", href: job.contactValue, target: "_blank", rel: "noopener noreferrer" }
    : job.contactMethod === "email"
    ? { icon: Mail, type: "عبر البريد الإلكتروني", href: `mailto:${job.contactValue}?subject=طلب وظيفة: ${encodeURIComponent(job.title)}`, target: "_blank", rel: undefined }
    : job.contactMethod === "phone"
    ? { icon: Phone, type: "عبر الجوال", href: `tel:${job.contactValue}`, target: "_blank", rel: undefined }
    : null;

  if (!applyConfig) return null;

  const Icon = applyConfig.icon;

  return (
    <a
      href={applyConfig.href}
      target={applyConfig.target}
      rel={applyConfig.rel}
      data-testid="button-apply"
      className="w-full flex flex-col items-center gap-2 bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground rounded-xl py-4 px-4 transition-all no-underline"
    >
      <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
        <Icon className="h-6 w-6" />
      </div>
      <span className="font-bold text-base">قدّم الآن</span>
      <span className="text-xs text-primary-foreground/80">{applyConfig.type}</span>
    </a>
  );
}

function ReportDialog({ jobId, jobTitle, open, onClose }: { jobId: number; jobTitle: string; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/employer-jobs/${jobId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, reporterName, reporterEmail }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "تم الإبلاغ", description: "شكراً، سيتم مراجعة البلاغ." });
      setReason(""); setReporterName(""); setReporterEmail("");
      onClose();
    } catch {
      toast({ title: "خطأ", description: "فشل إرسال البلاغ.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>الإبلاغ عن إعلان وظيفي</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{jobTitle}</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>سبب البلاغ <span className="text-red-500">*</span></Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="اكتب سبب الإبلاغ..." rows={3} data-testid="input-report-reason" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>اسمك (اختياري)</Label>
              <Input value={reporterName} onChange={(e) => setReporterName(e.target.value)} placeholder="الاسم" />
            </div>
            <div className="space-y-1.5">
              <Label>بريدك (اختياري)</Label>
              <Input value={reporterEmail} onChange={(e) => setReporterEmail(e.target.value)} type="email" placeholder="البريد" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={!reason.trim() || loading} data-testid="button-submit-report">
            {loading ? "جارٍ الإرسال..." : "إرسال البلاغ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EmployerJobDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [reportOpen, setReportOpen] = useState(false);

  const { data: job, isLoading, isError } = useQuery<any>({
    queryKey: [`/api/employer-jobs/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/employer-jobs/${id}`);
      if (!res.ok) throw new Error("not found");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: authData } = useCommunityAuth();
  const isLoggedIn = !!authData?.authenticated;

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    matchPercentage: number;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
    summary: string;
    atsCompatible: boolean;
    atsIssues: string[];
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisUsage, setAnalysisUsage] = useState<{ paidCredits: number; freeUsed: number; freeLimit: number } | null>(null);

  function getCommunityToken() {
    try { return localStorage.getItem("communityToken"); } catch { return null; }
  }

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = getCommunityToken();
    const headers: Record<string, string> = {};
    if (token) headers["X-Community-Token"] = token;
    fetch("/api/cv-analysis/usage", { headers }).then(r => r.ok ? r.json() : null).then(data => {
      if (data) setAnalysisUsage(data);
    }).catch(() => {});
  }, [isLoggedIn]);

  async function handleAnalyzeCV() {
    if (!cvFile || !id) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    try {
      const formData = new FormData();
      formData.append("cv", cvFile);
      const token = getCommunityToken();
      const headers: Record<string, string> = {};
      if (token) headers["X-Community-Token"] = token;
      const res = await fetch(`/api/employer-jobs/${id}/analyze-cv`, { method: "POST", body: formData, headers });
      const data = await res.json();
      if (!res.ok) {
        if (data.usage) setAnalysisUsage(data.usage);
        setAnalysisError(data.message || "حدث خطأ، حاول مرة أخرى");
      } else {
        if (data.usage) setAnalysisUsage(data.usage);
        setAnalysisResult(data);
      }
    } catch {
      setAnalysisError("فشل الاتصال بالخادم، حاول مرة أخرى");
    } finally {
      setAnalyzing(false);
    }
  }

  const { data: similarJobs = [] } = useQuery<any[]>({
    queryKey: [`/api/employer-jobs/${id}/similar`],
    queryFn: async () => {
      const res = await fetch(`/api/employer-jobs/${id}/similar`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id && !!job,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-6 w-64 bg-muted rounded-lg animate-pulse" />
          <div className="h-40 bg-muted rounded-2xl animate-pulse" />
          <div className="h-56 bg-muted rounded-2xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (isError || !job) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
          <Briefcase className="h-14 w-14 mx-auto text-muted-foreground/30" />
          <h2 className="text-xl font-bold">لم يتم العثور على الإعلان</h2>
          <p className="text-muted-foreground text-sm">ربما تم حذف هذا الإعلان أو لم يعد متاحاً.</p>
          <Link href="/jobs/employer">
            <Button variant="outline" className="gap-2 mt-2">
              <ArrowRight className="h-4 w-4" />
              العودة لقائمة الوظائف
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const deadline = job.deadlineDate ? new Date(job.deadlineDate) : null;
  const isClosed = !!deadline && deadline <= new Date();
  const days = daysLeft(job.deadlineDate);

  const jobJsonLd = buildJobPostingJsonLd({
    id: job.id,
    title: job.title,
    company: job.company,
    description: job.description,
    region: job.region,
    city: job.city,
    contactMethod: job.contactMethod,
    contactValue: job.contactValue,
    createdAt: job.createdAt,
    deadlineDate: job.deadlineDate,
    workSchedule: job.workSchedule,
    workMode: job.workMode,
    pageUrl: `${window.location.origin}/jobs/employer/${job.id}`,
  });

  return (
    <Layout>
      <Helmet>
        <title>{job.title}</title>
        <script type="application/ld+json">{JSON.stringify(jobJsonLd)}</script>
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Back nav */}
        <Link href="/jobs/employer" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowRight className="h-4 w-4" />
          وظائف أصحاب العمل
        </Link>

        {/* Hero card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          <div className={`h-2 w-full ${isClosed ? "bg-gray-300 dark:bg-gray-600" : "bg-gradient-to-l from-primary to-primary/60"}`} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-tight mb-2">{job.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-foreground">{job.company}</span>
                </div>
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {job.workSchedule && WORK_SCHEDULE_LABELS[job.workSchedule] && (
                <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2.5">
                  <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">نوع الدوام</p>
                    <p className="text-sm font-medium text-primary">{WORK_SCHEDULE_LABELS[job.workSchedule]}</p>
                  </div>
                </div>
              )}
              {job.workMode && WORK_MODE_LABELS[job.workMode] && (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2.5">
                  <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">طبيعة العمل</p>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{WORK_MODE_LABELS[job.workMode]}</p>
                  </div>
                </div>
              )}
              {job.region && job.region !== "كل المدن" && (
                <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2.5">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">المنطقة</p>
                    <p className="text-sm font-medium">{job.region}{job.city && job.city !== job.region ? ` · ${job.city}` : ""}</p>
                  </div>
                </div>
              )}
              {(!job.region || job.region === "كل المدن") && (
                <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2.5">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">المنطقة</p>
                    <p className="text-sm font-medium">كل المدن</p>
                  </div>
                </div>
              )}
              {/* Row 2: الجنس | الجنسية | آخر موعد للتقديم */}
              {job.targetGender && (
                <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2.5">
                  <Users className="h-4 w-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">الجنس</p>
                    <p className="text-sm font-medium">{GENDER_LABELS[job.targetGender] || job.targetGender}</p>
                  </div>
                </div>
              )}
              {job.targetNationality && (
                <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2.5">
                  <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">الجنسية</p>
                    <p className="text-sm font-medium">{NATIONALITY_LABELS[job.targetNationality] || job.targetNationality}</p>
                  </div>
                </div>
              )}
              {deadline && (
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${
                  isClosed ? "bg-red-50 dark:bg-red-950/30" : days !== null && days <= 7 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-muted/60"
                }`}>
                  <Calendar className={`h-4 w-4 flex-shrink-0 ${isClosed ? "text-red-500" : days !== null && days <= 7 ? "text-amber-500" : "text-primary"}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{isClosed ? "انتهى الموعد في" : "آخر موعد للتقديم"}</p>
                    <p className={`text-sm font-medium ${isClosed ? "text-red-600 dark:text-red-400" : ""}`}>
                      {formatDate(job.deadlineDate)}
                      {!isClosed && days !== null && days <= 7 && (
                        <span className="me-2 text-amber-600 dark:text-amber-400"> (يتبقى {days} {days === 1 ? "يوم" : "أيام"})</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              {/* Row 3: رقم الإعلان (يمين) | المشاهدات (متساويان) */}
              <div className="col-span-2 sm:col-span-3 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2.5">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">رقم الإعلان</p>
                    <p className="text-sm font-bold text-primary">#{job.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2.5">
                  <Eye className="h-4 w-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">المشاهدات</p>
                    <p className="text-sm font-medium">{job.viewCount || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Description */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <ClipboardList className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-bold text-base">وصف الوظيفة</h2>
              </div>
              <p className="text-sm text-foreground leading-loose whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <h2 className="font-bold text-base">المتطلبات والمؤهلات</h2>
                </div>
                <div className="space-y-2">
                  {job.requirements.split(/\n|–|-/).filter((r: string) => r.trim()).map((req: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{req.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CV Analyzer */}
            {false && !isClosed && (
            <div className="bg-card border border-primary/20 rounded-2xl p-6 overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black text-foreground">هل أنت مناسب لهذه الوظيفة؟</p>
                  <p className="text-xs text-muted-foreground">ارفع سيرتك الذاتية — يحللها الذكاء الاصطناعي في ثوانٍ</p>
                </div>
                {isLoggedIn && analysisUsage && (
                  <div className={`shrink-0 text-center px-2.5 py-1 rounded-lg text-xs font-black tabular-nums ${
                    analysisUsage.paidCredits > 0
                      ? "bg-violet-500/10 text-violet-600"
                      : analysisUsage.freeUsed >= analysisUsage.freeLimit
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/10 text-primary"
                  }`} data-testid="text-cv-usage-counter">
                    {analysisUsage.paidCredits > 0
                      ? <><span className="text-[9px]">✦</span> {analysisUsage.paidCredits}</>
                      : <>{analysisUsage.freeLimit - analysisUsage.freeUsed}/{analysisUsage.freeLimit}</>
                    }
                    <span className="block text-[9px] font-medium opacity-70">
                      {analysisUsage.paidCredits > 0 ? "مدفوع" : "متبقية"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                {!isLoggedIn ? (
                  <div className="flex flex-col items-center text-center gap-3 py-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-foreground text-sm mb-1">ميزة حصرية للأعضاء المسجلين</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">سجّل دخولك مجاناً لتحليل سيرتك الذاتية بالذكاء الاصطناعي ومعرفة مدى توافقك مع هذه الوظيفة.</p>
                    </div>
                    <Link href="/login">
                      <Button className="h-9 px-6 font-black text-sm rounded-xl" data-testid="button-login-to-analyze">
                        سجّل دخولك الآن
                      </Button>
                    </Link>
                  </div>
                ) : analysisUsage && analysisUsage.paidCredits <= 0 && analysisUsage.freeUsed >= analysisUsage.freeLimit && !analysisResult ? (
                  <div className="flex flex-col items-center text-center gap-3 py-3" data-testid="div-cv-limit-reached">
                    <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <p className="font-black text-foreground text-sm mb-1">استنفدت التحليلات المجانية</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        استخدمت {analysisUsage.freeLimit}/{analysisUsage.freeLimit} تحليل مجاني — اشترِ رصيداً للمتابعة
                      </p>
                      <Link href="/store/services/cv-analysis-credits">
                        <button className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-xl transition-colors" data-testid="button-buy-credits-limit">
                          <Sparkles className="w-3.5 h-3.5" />
                          اشترِ رصيداً الآن
                        </button>
                      </Link>
                    </div>
                  </div>
                ) : !analysisResult ? (
                  <div className="space-y-3">
                    <div
                      className={`relative border-2 border-dashed rounded-xl transition-colors ${cvFile ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setCvFile(f); }}
                    >
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/jpeg,image/jpg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                        data-testid="input-cv-upload-inline"
                      />
                      <div className="py-5 text-center pointer-events-none">
                        {cvFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <FileText className="w-5 h-5 text-primary shrink-0" />
                            <span className="text-sm font-bold text-foreground truncate max-w-[200px]">{cvFile.name}</span>
                            <button className="pointer-events-auto p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" onClick={(e) => { e.preventDefault(); setCvFile(null); setAnalysisError(null); }}>
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Upload className="w-4 h-4" />
                            <span className="text-xs font-bold">PDF أو Word أو صورة (JPG/PNG)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {analysisError && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />{analysisError}
                      </div>
                    )}
                    <Button className="w-full h-10 font-black text-sm rounded-xl" disabled={!cvFile || analyzing} onClick={handleAnalyzeCV} data-testid="button-analyze-cv">
                      {analyzing ? <><Loader2 className="w-3.5 h-3.5 animate-spin ml-1.5" />جارٍ التحليل...</> : <><Zap className="w-3.5 h-3.5 ml-1.5" />حلّل مدى توافقي</>}
                    </Button>
                    <p className="text-center text-[11px] text-muted-foreground">السيرة لا تُحفظ — تُقرأ مرة واحدة وتُحذف فوراً</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-14 h-14 rounded-full border-[3px] text-lg font-black shrink-0 ${
                          analysisResult.matchPercentage >= 70 ? "border-green-500 text-green-600 bg-green-500/10" :
                          analysisResult.matchPercentage >= 45 ? "border-yellow-500 text-yellow-600 bg-yellow-500/10" :
                          "border-red-500 text-red-600 bg-red-500/10"
                        }`}>{analysisResult.matchPercentage}%</div>
                        <div>
                          <p className="font-black text-foreground text-sm">نسبة التوافق</p>
                          <p className="text-xs text-muted-foreground max-w-xs">{analysisResult.summary}</p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs border ${
                        analysisResult.recommendation.includes("ينصح بالتقديم") ? "bg-green-500/10 border-green-500/30 text-green-600" :
                        analysisResult.recommendation.includes("ممكن") ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600" :
                        "bg-red-500/10 border-red-500/30 text-red-600"
                      }`}>
                        <TrendingUp className="w-3 h-3" />{analysisResult.recommendation}
                      </div>
                    </div>
                    <div className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs ${
                      analysisResult.atsCompatible ? "bg-green-500/5 border-green-500/20" : "bg-orange-500/5 border-orange-500/25"
                    }`}>
                      <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${analysisResult.atsCompatible ? "bg-green-500" : "bg-orange-500"}`}>
                        {analysisResult.atsCompatible ? <CheckCircle2 className="w-3 h-3 text-white" /> : <AlertCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className={`font-black mb-1 text-xs ${analysisResult.atsCompatible ? "text-green-700 dark:text-green-400" : "text-orange-700 dark:text-orange-400"}`}>
                          {analysisResult.atsCompatible ? "متوافقة مع نظام ATS ✓" : "غير متوافقة مع نظام ATS"}
                        </p>
                        {!analysisResult.atsCompatible && analysisResult.atsIssues.length > 0 && (
                          <ul className="space-y-0.5">
                            {analysisResult.atsIssues.map((issue, i) => (
                              <li key={i} className="text-muted-foreground flex items-start gap-1">
                                <span className="text-orange-400 shrink-0">•</span><span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {analysisResult.atsCompatible && <p className="text-muted-foreground text-xs">سيرتك الذاتية تجتاز مرشحات الفرز الآلي بنجاح</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysisResult.strengths.length > 0 && (
                        <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-black text-green-600 text-xs mb-2"><ThumbsUp className="w-3 h-3" />نقاط القوة</div>
                          {analysisResult.strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                              <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" /><span>{s}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {analysisResult.weaknesses.length > 0 && (
                        <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-black text-red-500 text-xs mb-2"><ThumbsDown className="w-3 h-3" />ما ينقص</div>
                          {analysisResult.weaknesses.map((w, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                              <AlertCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" /><span>{w}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {(analysisResult.matchPercentage < 90 || !analysisResult.atsCompatible) && (
                      <div className="rounded-xl bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/25 p-3.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-foreground text-xs mb-0.5">
                            {!analysisResult.atsCompatible ? "سيرتك غير متوافقة مع ATS — حسّنها الآن" : "رفع نسبة توافقك فوق 90%؟"}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">احصل على سيرة ذاتية احترافية متوافقة مع ATS ومصمَّمة خصيصاً لتناسب هذه الوظيفة.</p>
                        </div>
                        <Link href="/store/services/cv-atc" className="shrink-0">
                          <Button size="sm" className="h-8 px-3 text-xs font-black rounded-lg">اطلب الخدمة</Button>
                        </Link>
                      </div>
                    )}
                    <button className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors" onClick={() => { setAnalysisResult(null); setCvFile(null); setAnalysisError(null); }}>تحليل سيرة أخرى</button>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Apply card */}
            <div className="bg-card border border-border rounded-2xl p-5 sticky top-4">
              <h3 className="font-bold mb-4 text-base">
                {isClosed ? "هذه الوظيفة مغلقة" : "قدّم على هذه الوظيفة"}
              </h3>

              {!isClosed && days !== null && days <= 7 && days > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2 mb-3">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>يتبقى {days} {days === 1 ? "يوم فقط" : "أيام"} للتقديم</span>
                </div>
              )}

              <ApplySection job={job} isClosed={isClosed} />

              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-muted-foreground hover:text-red-500"
                  onClick={() => setReportOpen(true)}
                  data-testid="button-report-job"
                >
                  <Flag className="h-4 w-4" />
                  الإبلاغ عن هذا الإعلان
                </Button>
              </div>
            </div>

            {/* Add your own */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
              <Briefcase className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium mb-1">هل تبحث عن موظفين؟</p>
              <p className="text-xs text-muted-foreground mb-3">أضف إعلانك مجاناً وصل لآلاف الباحثين</p>
              <Link href="/jobs/employer/add">
                <Button size="sm" variant="outline" className="w-full gap-1.5">
                  <span>أضف إعلانك الآن</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {similarJobs.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 pb-10" dir="rtl">
          <div className="border-t border-border pt-8">
            <h2 className="text-lg font-bold mb-4">وظائف مشابهة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {similarJobs.map((sj: any) => (
                <Link key={sj.id} href={`/jobs/employer/${sj.id}`}>
                  <div
                    className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group"
                    data-testid={`card-similar-job-${sj.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {sj.title}
                      </h3>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{sj.company}</span>
                    </div>
                    {sj.region && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span>{sj.region}{sj.city && sj.city !== sj.region ? ` · ${sj.city}` : ""}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <ReportDialog
        jobId={job.id}
        jobTitle={job.title}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </Layout>
  );
}
