import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Helmet } from "react-helmet";
import { buildJobPostingJsonLd } from "@/lib/structuredData";
import { toDisplayUrl } from "@/lib/mediaUrl";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Building2, ArrowRight, Send, ExternalLink, Share2, Heart, Loader2, Eye, Sparkles, FileText, Linkedin, CheckCircle2, ChevronLeft, Bell, Briefcase, Users, MessageSquare, Upload, X, TrendingUp, AlertCircle, ThumbsUp, ThumbsDown, Zap, Flag, Lock, Rocket, Coins, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePageTitle } from "@/hooks/usePageTitle";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Job, Organization } from "@shared/schema";
import { formatRelativeDate } from "@/lib/formatDate";
import whatsappIcon from "@/assets/whatsapp.png";
import OrgActionCard from "@/components/OrgActionCard";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { isJobClosed } from "@/components/JobCard";

const SocialIcon = ({ platform, url }: { platform: string; url: string }) => {
  const icons: Record<string, { color: string; name: string; icon: string; hover: string }> = {
    whatsapp: {
      color: "bg-[#25D366]/10 border-[#25D366]/20 text-[#25D366]",
      hover: "hover:bg-[#25D366] hover:text-white",
      name: "واتساب",
      icon: "https://cdn-icons-png.flaticon.com/512/733/733585.png",
    },
    telegram: {
      color: "bg-[#0088cc]/10 border-[#0088cc]/20 text-[#0088cc]",
      hover: "hover:bg-[#0088cc] hover:text-white",
      name: "تليجرام",
      icon: "https://cdn-icons-png.flaticon.com/512/2111/2111646.png",
    },
    twitter: {
      color: "bg-muted border-border text-foreground",
      hover: "hover:bg-foreground hover:text-background",
      name: "منصة X",
      icon: "https://upload.wikimedia.org/wikipedia/commons/5/53/X_logo_2023_original.svg",
    },
    linkedin: {
      color: "bg-[#0077b5]/10 border-[#0077b5]/20 text-[#0077b5]",
      hover: "hover:bg-[#0077b5] hover:text-white",
      name: "لينكد إن",
      icon: "https://cdn-icons-png.flaticon.com/512/174/174857.png",
    },
  };
  const config = icons[platform];
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center md:justify-start gap-3 p-3 md:px-6 md:py-3 rounded-2xl border ${config.color} ${config.hover} font-bold text-sm transition-all duration-300 hover:scale-105 shadow-sm group w-full md:w-auto`}
    >
      <img
        src={config.icon}
        alt={config.name}
        className={`w-6 h-6 md:w-5 md:h-5 transition-all duration-300 ${platform === "twitter" ? "dark:invert group-hover:invert-0" : "group-hover:invert"}`}
      />
      <span className="hidden md:inline">{config.name}</span>
    </a>
  );
};

interface JobWithOrg extends Job {
  organization?: Organization | null;
}

export default function JobDetails() {
  const [, rawParams] = useRoute("/jobs/post/:id");
  const params = rawParams as { id?: string } | null;
  const jobId = params?.id ? parseInt(params.id) : null;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const urlParams = new URLSearchParams(window.location.search);
  const isResult = urlParams.get("isResult") === "true";

  const { data: job, isLoading, error } = useQuery<JobWithOrg>({
    queryKey: ["/api/jobs", jobId, isResult],
    queryFn: async () => {
      const url = isResult ? `/api/jobs/${jobId}?isResult=true` : `/api/jobs/${jobId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch job");
      return res.json();
    },
    enabled: !!jobId,
  });

  usePageTitle(undefined);

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

  // Job application (قدم لي الآن)
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyStep, setApplyStep] = useState<"confirm" | "noCreds" | "success">("confirm");
  const [applyLoading, setApplyLoading] = useState(false);

  const { data: jobCredits } = useQuery({
    queryKey: ["/api/community/job-credits"],
    queryFn: async () => {
      const token = getCommunityToken();
      const res = await fetch("/api/community/job-credits", {
        credentials: "include",
        headers: token ? { "X-Community-Token": token } : {},
      });
      if (!res.ok) return { balance: 0, expiresAt: null };
      return res.json();
    },
    enabled: !!isLoggedIn,
  });

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
    if (!cvFile || !jobId) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    try {
      const formData = new FormData();
      formData.append("cv", cvFile);
      const token = getCommunityToken();
      const headers: Record<string, string> = {};
      if (token) headers["X-Community-Token"] = token;
      const res = await fetch(`/api/jobs/${jobId}/analyze-cv`, { method: "POST", body: formData, headers });
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

  const { data: relatedJobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs/related", jobId, job?.category],
    queryFn: async () => {
      if (!job?.category) return [];
      const res = await fetch(`/api/jobs?category=${job.category}&limit=15`);
      if (!res.ok) return [];
      const all = await res.json();
      const items = Array.isArray(all) ? all : (all.jobs ?? []);
      return items.filter((j: Job) => j.id !== jobId).slice(0, 6);
    },
    enabled: !!job?.category,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["/api/community/favorites"],
    enabled: !!authData?.authenticated,
  });

  const isFavorited = jobId ? (favorites as any[]).some((f: any) => f.jobId === jobId) : false;

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const reportMutation = useMutation({
    mutationFn: async (data: { jobId: number; reason: string; details?: string }) => {
      const res = await apiRequest("POST", "/api/job-reports", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "فشل في إرسال البلاغ");
      }
      return res.json();
    },
    onSuccess: () => {
      setReportOpen(false);
      setReportReason("");
      setReportDetails("");
      toast({ title: "تم إرسال البلاغ", description: "شكراً، سيتم مراجعة بلاغك من قِبل الإدارة" });
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });

  const submitReport = () => {
    if (!reportReason || !jobId) return;
    reportMutation.mutate({ jobId, reason: reportReason, details: reportDetails || undefined });
  };

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/community/favorites/${jobId}`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/favorites"] });
      toast({
        title: data.favorited ? "تمت الإضافة" : "تمت الإزالة",
        description: data.favorited ? "تم إضافة الوظيفة للمفضلة" : "تم إزالة الوظيفة من المفضلة",
      });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تحديث المفضلة", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (error || !job) {
    return (
      <Layout>
        <div className="text-center py-32">
          <h1 className="text-2xl font-bold text-foreground mb-4">لم يتم العثور على الوظيفة</h1>
          <Link href="/jobs">
            <Button className="gap-2">
              <ArrowRight className="h-4 w-4 rotate-180" />
              العودة للوظائف
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const orgLogo = toDisplayUrl(job.organization?.logo || job.logo);
  const categoryLabel = job.category === "civil" ? "حكومي" : job.category === "military" ? "عسكري" : "شركات";
  const formattedDate = formatRelativeDate(job.date, job.createdAt);
  const closed = isJobClosed(job);

  const jobJsonLd = buildJobPostingJsonLd({
    id: job.id,
    title: job.title,
    company: job.company,
    companyLogo: job.organization?.logo || job.logo,
    description: job.description,
    location: job.location,
    applyUrl: job.applyUrl,
    createdAt: job.createdAt,
    deadlineDate: (job as any).deadlineDate,
    pageUrl: `${window.location.origin}/jobs/post/${job.id}`,
  });

  return (
    <Layout>
      <Helmet>
        <title>{job.title} | إعلانات الوظائف</title>
        <meta name="description" content={
          job.description
            ? job.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 155)
            : `وظيفة ${job.title} في ${job.company} — المملكة العربية السعودية`
        } />
        <link rel="canonical" href={`https://www.alwdaif.com/jobs/post/${job.id}`} />
        <script type="application/ld+json">{JSON.stringify(jobJsonLd)}</script>
      </Helmet>
      <div className="py-8" dir="rtl">
        <div className="container mx-auto px-4 max-w-[1115px]">
          {/* Back Button */}
          <div className="mb-6">
            <Link href={job.category === "civil" ? "/jobs/civil" : job.category === "military" ? "/jobs/military" : job.category === "companies" ? "/jobs/companies" : job.category === "results" ? "/jobs/results" : "/jobs"}>
              <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold" data-testid="button-back-to-jobs">
                <ArrowRight className="h-4 w-4 rotate-180" /> {
                  job.category === "civil" ? "العودة للوظائف المدنية" :
                  job.category === "military" ? "العودة للوظائف العسكرية" :
                  job.category === "companies" ? "العودة لوظائف الشركات" :
                  job.category === "results" ? "العودة لنتائج التوظيف" :
                  "العودة للوظائف"
                }
              </button>
            </Link>
          </div>

          {/* Closed Banner */}
          {closed && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/60 px-5 py-4" data-testid="banner-job-closed">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-700">
                <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-700 dark:text-gray-300 text-sm md:text-base">انتهى التقديم على هذه الوظيفة</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">هذا الإعلان لم يعد متاحاً للتقديم، يمكنك تصفح الوظائف المفتوحة</p>
              </div>
              <Link href={job.category === "civil" ? "/jobs/civil" : job.category === "military" ? "/jobs/military" : job.category === "companies" ? "/jobs/companies" : "/jobs"}>
                <button className="shrink-0 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                  وظائف مفتوحة
                </button>
              </Link>
            </div>
          )}

          {/* Main Job Card */}
          <Card className="bg-card border border-primary/20 shadow-xl overflow-hidden mb-12 rounded-[2.5rem] relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

            {/* Header Section */}
            <div className="p-6 md:p-8 relative overflow-hidden border-b border-border bg-gradient-to-r from-primary/8 via-transparent to-transparent" dir="rtl">
              <div className="absolute top-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -ml-24 -mt-24" />

              <div className="relative z-10 flex flex-col items-start gap-4 w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="hidden md:block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-xs font-bold tracking-wider">
                    {categoryLabel}
                  </div>
                  <div className="hidden md:block">
                    <button
                      onClick={() => toggleFavoriteMutation.mutate()}
                      disabled={toggleFavoriteMutation.isPending}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isFavorited
                          ? "bg-red-500/15 border-red-500/30 text-red-500 hover:bg-red-500/25"
                          : "bg-muted border-border text-muted-foreground hover:text-red-400 hover:border-red-500/30"
                      }`}
                      data-testid="button-favorite-job"
                    >
                      {toggleFavoriteMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                      )}
                      <span className="text-sm font-medium">{isFavorited ? "في المفضلة" : "أضف للمفضلة"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-start gap-4 md:gap-6 w-full group">
                  <div className="flex flex-col items-start gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-4 w-full">
                      {/* Logo */}
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-primary blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
                        <div className="w-14 h-14 md:w-24 md:h-24 rounded-[1rem] md:rounded-[2rem] bg-background border-2 border-primary/25 flex items-center justify-center p-2 md:p-4 overflow-hidden shadow-lg relative z-10 transform group-hover:-rotate-3 transition-transform duration-500">
                          {orgLogo ? (
                            <img src={orgLogo} alt={job.company} className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="w-full h-full text-primary" />
                          )}
                        </div>
                      </div>
                      <h1 className="text-[14px] md:text-[24px] font-bold font-heading text-foreground leading-tight group-hover:text-primary transition-colors duration-300 md:hidden flex-1">
                        {job.title}
                      </h1>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-1 md:gap-2 flex-1 w-full">
                    <h1 className="text-[24px] font-bold font-heading text-foreground leading-tight group-hover:text-primary transition-colors duration-300 hidden md:block">
                      {job.title}
                    </h1>
                    <div className="flex flex-col gap-0.5 md:gap-2 w-full">
                      <Link
                        href={job.organizationId ? `/jobs/organizations/${job.organizationId}` : `/jobs/company/${encodeURIComponent(job.company)}`}
                        className="text-sm md:text-base text-muted-foreground font-medium hover:text-primary transition-colors mt-0"
                      >
                        {job.company}
                      </Link>
                      <div className="flex items-center justify-between md:justify-start md:gap-6 w-full mt-2 md:mt-0">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="md:hidden px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-wider">
                            {categoryLabel}
                          </div>
                          <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-sm">{formattedDate}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 transition-colors ${
                            (job.viewCount || 0) >= 1000 ? "text-red-600" :
                            (job.viewCount || 0) >= 500  ? "text-red-500" :
                            (job.viewCount || 0) >= 250  ? "text-orange-500" :
                            "text-muted-foreground"
                          }`}>
                            <Eye className={`h-4 w-4 ${
                              (job.viewCount || 0) >= 1000 ? "text-red-600" :
                              (job.viewCount || 0) >= 500  ? "text-red-500" :
                              (job.viewCount || 0) >= 250  ? "text-orange-500" :
                              "text-primary"
                            }`} />
                            <span className="text-sm">{job.viewCount || 0}</span>
                            {(job.viewCount || 0) >= 1000 && (
                              <span className="text-[10px] font-bold bg-red-500/15 text-red-600 border border-red-500/25 px-1.5 py-0.5 rounded-full">🔥 منتشر</span>
                            )}
                            {(job.viewCount || 0) >= 500 && (job.viewCount || 0) < 1000 && (
                              <span className="text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded-full">إقبال عالٍ</span>
                            )}
                            {(job.viewCount || 0) >= 250 && (job.viewCount || 0) < 500 && (
                              <span className="text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20 px-1.5 py-0.5 rounded-full">رائج</span>
                            )}
                          </div>
                        </div>
                        <div className="md:hidden">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavoriteMutation.mutate(); }}
                            disabled={toggleFavoriteMutation.isPending}
                            className={`p-2 rounded-xl border transition-all duration-300 relative z-50 ${
                              isFavorited
                                ? "bg-red-600 border-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] scale-110"
                                : "bg-muted border-border text-muted-foreground"
                            }`}
                          >
                            {toggleFavoriteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <CardContent className="p-6 md:p-10 space-y-12">


              {/* الموجز */}
              {job.summary && (() => {
                let points: string[] = [];
                try { points = JSON.parse(job.summary); } catch {}
                return points.length > 0 ? (
                  <section className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent overflow-hidden" data-testid="section-summary">
                    {/* subtle glow */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 p-5 md:p-6">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-base text-foreground">الموجز</span>
                        <span className="mr-auto text-[10px] font-medium text-muted-foreground/60 bg-muted/60 border border-border/50 px-2 py-0.5 rounded-full">
                          بالذكاء الاصطناعي
                        </span>
                      </div>
                      {/* Points */}
                      <ul className="space-y-2.5" dir="rtl">
                        {points.map((point, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm md:text-[15px] text-foreground/85 leading-relaxed" data-testid={`summary-point-${i}`}>
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                ) : null;
              })()}

              {job.description && (
                <section className="space-y-6">
                  <h2 className="text-lg md:text-2xl font-bold font-heading text-foreground border-r-4 border-primary pr-4">الوصف الوظيفي</h2>
                  <div
                    className="text-foreground/80 leading-relaxed text-lg space-y-4 pr-1 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                </section>
              )}

              {/* Action Buttons */}
              <div className="pt-8 flex flex-col items-center gap-6 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                  {job.applyUrl && (
                    closed ? (
                      <div
                        className="relative flex items-center justify-between p-1 rounded-2xl bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 opacity-60 cursor-not-allowed"
                        data-testid="link-apply-closed"
                      >
                        <div className="flex items-center justify-between w-full p-2 md:p-3">
                          <span className="text-gray-500 dark:text-gray-400 font-extrabold text-sm md:text-base order-1 pr-3">
                            انتهى التقديم على هذه الوظيفة
                          </span>
                          <div className="w-10 h-10 rounded-xl bg-gray-300 dark:bg-gray-600 flex items-center justify-center order-2">
                            <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          </div>
                        </div>
                      </div>
                    ) : (
                    <a
                      href={
                        job.linkType === "email"
                          ? `mailto:${job.applyUrl}`
                          : job.linkType === "phone"
                          ? `tel:${job.applyUrl}`
                          : job.applyUrl
                      }
                      target={job.linkType === "url" ? "_blank" : undefined}
                      rel={job.linkType === "url" ? "noopener noreferrer" : undefined}
                      className="group relative flex items-center justify-between p-1 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all duration-500 active:scale-95 overflow-hidden"
                      data-testid="link-apply"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 flex items-center justify-between w-full p-2 md:p-3">
                        <span className="text-primary-foreground font-extrabold text-sm md:text-base order-1 pr-3">
                          {job.category === "results" ? "الاستعلام عن النتائج" : "التقديم على الوظيفة"}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:bg-white/30 group-hover:rotate-12 transition-all duration-500 order-2">
                          <Send className="h-5 w-5 text-white rotate-[-45deg]" />
                        </div>
                      </div>
                    </a>
                    )
                  )}

                  {job.sourceUrl && (
                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center justify-between p-1 rounded-2xl bg-muted border border-border hover:border-primary/40 transition-all duration-500 active:scale-95 overflow-hidden shadow-sm"
                      data-testid="link-source"
                    >
                      <div className="relative z-10 flex items-center justify-between w-full p-2 md:p-3">
                        <span className="text-foreground/90 font-extrabold text-sm md:text-base group-hover:text-foreground transition-colors order-1 pr-3">عرض المصدر</span>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 group-hover:rotate-[-12deg] transition-all duration-500 order-2">
                          <ExternalLink className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </a>
                  )}
                </div>

                {/* Apply For Me Button */}
                {false && !closed && (
                  <div className="w-full max-w-2xl">
                    <button
                      onClick={() => {
                        if (!isLoggedIn) { window.location.href = "/login"; return; }
                        setApplyStep((jobCredits?.balance ?? 0) > 0 ? "confirm" : "noCreds");
                        setApplyDialogOpen(true);
                      }}
                      className="group relative w-full flex items-center justify-between p-1 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-500 active:scale-95 overflow-hidden"
                      data-testid="button-apply-for-me"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 flex items-center justify-between w-full p-2 md:p-3">
                        <div className="flex flex-col items-start order-1 pr-3">
                          <span className="text-white font-extrabold text-sm md:text-base">قدّم لي على هذه الوظيفة</span>
                          {isLoggedIn && (
                            <span className="text-white/70 text-[11px]">
                              {(jobCredits?.balance ?? 0) > 0
                                ? `رصيدك: ${jobCredits!.balance} تقديم متبقٍ`
                                : "اشحن رصيداً للتقديم"}
                            </span>
                          )}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:bg-white/30 group-hover:rotate-12 transition-all duration-500 order-2 shrink-0">
                          <Rocket className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Follow Company Card */}
                <OrgActionCard org={job.organization || null} jobCompany={job.company} jobLogo={job.logo || null} />

                {/* WhatsApp Channel */}
                <div className="w-full max-w-2xl">
                  <div className="bg-gradient-to-r from-green-500/15 to-green-500/5 border border-green-500/25 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 group hover:border-green-500/50 transition-all duration-300">
                    <div className="w-12 h-12 shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <img src={whatsappIcon} alt="WhatsApp" className="w-full h-full object-contain drop-shadow-lg" />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-right">
                      <p className="font-black text-foreground text-sm leading-snug">انضم لـ +9,000 مشترك في القناة الرسمية</p>
                      <p className="text-muted-foreground text-xs mt-0.5">تصلك أحدث الوظائف فور صدورها على جوالك</p>
                    </div>
                    <a href="https://whatsapp.com/channel/0029VaDUMpy7j6g6y8FRU11S" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto shrink-0">
                      <Button size="sm" className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md shadow-green-500/20">
                        انضم
                      </Button>
                    </a>
                  </div>
                </div>

                {/* CV Analyzer — inside card, above sharing */}
                {false && !closed && (
                <div className="w-full max-w-2xl pt-8 border-t border-border">
                  <div className="rounded-2xl bg-primary/5 border border-primary/20 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-primary/15">
                      <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-foreground">هل أنت مناسب لهذه الوظيفة؟</p>
                        <p className="text-[11px] text-muted-foreground">ارفع سيرتك الذاتية — يحللها الذكاء الاصطناعي في ثوانٍ</p>
                      </div>
                      {isLoggedIn && analysisUsage && (
                        <div className={`shrink-0 text-center px-2.5 py-1 rounded-lg text-[11px] font-black tabular-nums ${
                          analysisUsage.paidCredits > 0
                            ? "bg-violet-500/10 text-violet-600"
                            : analysisUsage.freeUsed >= analysisUsage.freeLimit
                            ? "bg-destructive/10 text-destructive"
                            : analysisUsage.freeUsed >= analysisUsage.freeLimit - 1
                            ? "bg-yellow-500/10 text-yellow-600"
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
                    <div className="p-5">
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
                            <div className="py-4 text-center pointer-events-none">
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
                          {/* Match % + Recommendation */}
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

                          {/* ATS Badge */}
                          <div className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs ${
                            analysisResult.atsCompatible
                              ? "bg-green-500/5 border-green-500/20"
                              : "bg-orange-500/5 border-orange-500/25"
                          }`}>
                            <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${analysisResult.atsCompatible ? "bg-green-500" : "bg-orange-500"}`}>
                              {analysisResult.atsCompatible
                                ? <CheckCircle2 className="w-3 h-3 text-white" />
                                : <AlertCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <p className={`font-black mb-1 ${analysisResult.atsCompatible ? "text-green-700 dark:text-green-400" : "text-orange-700 dark:text-orange-400"}`}>
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
                              {analysisResult.atsCompatible && (
                                <p className="text-muted-foreground">سيرتك الذاتية تجتاز مرشحات الفرز الآلي بنجاح</p>
                              )}
                            </div>
                          </div>

                          {/* Strengths & Weaknesses */}
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

                          {/* CV Design Service Promo */}
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
                </div>
                )}


                {/* Social Sharing */}
                <div className="w-full max-w-2xl pt-10 border-t border-border">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Share2 className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-foreground font-bold text-lg">نشر هذه الوظيفة</span>
                  </div>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 justify-center">
                    <SocialIcon platform="whatsapp" url={`https://api.whatsapp.com/send?text=${encodeURIComponent(job.title + "\n" + window.location.href)}`} />
                    <SocialIcon platform="telegram" url={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(job.title)}`} />
                    <SocialIcon platform="twitter" url={`https://twitter.com/intent/tweet?text=${encodeURIComponent(job.title)}&url=${encodeURIComponent(window.location.href)}`} />
                    <SocialIcon platform="linkedin" url={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} />
                  </div>
                </div>

                {/* Report Button */}
                <div className="w-full max-w-2xl pt-4 flex justify-center">
                  <button
                    onClick={() => setReportOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                    data-testid="button-report-job"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    الإبلاغ عن هذا الإعلان
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Related Jobs */}
          {relatedJobs.length > 0 && (
            <div className="mb-8" dir="rtl">
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                  <span className="w-1 h-5 bg-primary rounded-full inline-block shrink-0" />
                  <h2 className="text-base font-black text-foreground">وظائف مشابهة</h2>
                </div>
                <div className="divide-y divide-border">
                  {relatedJobs.map((rj) => {
                    const rjLogo = toDisplayUrl((rj as any).organization?.logo || rj.logo);
                    return (
                      <Link key={rj.id} href={`/jobs/post/${rj.id}`}>
                        <div className="group flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors cursor-pointer">
                          <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                            {rjLogo ? (
                              <img src={rjLogo} alt={rj.company} className="w-full h-full object-contain p-1" />
                            ) : (
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{rj.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{rj.company}</p>
                          </div>
                          <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary group-hover:-translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Services Promo Card — hidden */}
          {false && <div dir="rtl" className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card shadow-lg mb-8">
            {/* Background gradient blobs */}
            <div className="absolute inset-0 bg-gradient-to-bl from-primary/8 via-transparent to-blue-500/5 pointer-events-none" />
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-blue-400/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-0">

              {/* Illustration side (right in RTL) */}
              <div className="shrink-0 w-full md:w-[220px] flex items-center justify-center p-6 md:p-8">
                <div className="relative w-40 h-40 md:w-44 md:h-44">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 animate-[spin_18s_linear_infinite]" />
                  {/* Inner circle */}
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/15 to-blue-500/10 border border-primary/20 flex items-center justify-center shadow-inner">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  {/* Floating icons */}
                  <div className="absolute -top-1 right-6 w-9 h-9 rounded-xl bg-card border border-border shadow-md flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 right-4 w-9 h-9 rounded-xl bg-card border border-border shadow-md flex items-center justify-center">
                    <Linkedin className="w-4 h-4 text-[#0077b5]" />
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-9 h-9 rounded-xl bg-card border border-border shadow-md flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Text content */}
              <div className="flex-1 flex flex-col gap-4 p-6 md:py-8 md:px-6 text-right">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 self-start bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold px-3 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  خدماتنا الاحترافية
                </div>

                <div>
                  <h3 className="text-xl md:text-2xl font-black text-foreground mb-2 leading-snug">
                    طوّر مسيرتك المهنية<br className="hidden md:block" />
                    <span className="bg-gradient-to-l from-primary to-blue-400 bg-clip-text text-transparent"> بخطوة واحدة</span>
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                    نقدم لك حلولاً متكاملة تشمل السيرة الذاتية، التسجيل في جدارات وطاقات، وبناء ملفك على LinkedIn — كل ما تحتاجه للفوز بوظيفتك التالية.
                  </p>
                </div>

                {/* Service pills */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "سيرة ذاتية ATS", icon: FileText },
                    { label: "تسجيل جدارات", icon: CheckCircle2 },
                    { label: "ملف LinkedIn", icon: Linkedin },
                  ].map(({ label, icon: Icon }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-foreground/80 bg-muted border border-border px-3 py-1 rounded-full">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      {label}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-3 pt-1">
                  <Link href="/store/services">
                    <Button className="h-11 px-6 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 group">
                      استكشف الخدمات
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                  <span className="text-xs text-muted-foreground font-medium">تبدأ من <span className="text-primary font-black">30 ر.س</span></span>
                </div>
              </div>
            </div>
          </div>}

          {/* Community Section — hidden */}
          {false && <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl p-6 md:p-8 mb-8">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="flex-1 text-center md:text-right space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                  <Users className="h-3.5 w-3.5" />
                  <span>مجتمع إعلانات الوظائف</span>
                </div>

                <h2 className="text-[18px] md:text-3xl font-black text-foreground leading-tight">
                  انضم إلى أكبر تجمع للباحثين عن عمل
                </h2>

                <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                  شارك تجاربك واستفسر عن المقابلات في بيئة داعمة وتفاعلية.
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                  <div className="flex items-center gap-2 bg-muted/50 border border-border px-3 py-1.5 rounded-xl">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-muted-foreground text-xs font-medium">+5,000 متصل</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 border border-border px-3 py-1.5 rounded-xl">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground text-xs font-medium">نقاشات يومية</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/community">
                    <Button className="h-12 px-8 font-black text-lg rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] group">
                      انضم للمجتمع
                      <ArrowRight className="mr-2 h-5 w-5 rotate-180 group-hover:translate-x-[-4px] transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex-1 w-full max-w-xs relative hidden md:block">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-3 pt-8">
                    <div className="bg-muted/50 backdrop-blur-md border border-border p-3 rounded-xl transform rotate-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">A</div>
                        <div className="h-1.5 w-12 bg-muted rounded" />
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded" />
                    </div>
                    <div className="bg-muted/50 backdrop-blur-md border border-border p-3 rounded-xl transform -rotate-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-bold">M</div>
                        <div className="h-1.5 w-16 bg-muted rounded" />
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-muted/50 backdrop-blur-md border border-border p-3 rounded-xl transform -rotate-6">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-[10px] font-bold">S</div>
                        <div className="h-1.5 w-10 bg-muted rounded" />
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded" />
                    </div>
                    <div className="bg-muted/50 backdrop-blur-md border border-border p-3 rounded-xl transform rotate-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-[10px] font-bold">K</div>
                        <div className="h-1.5 w-14 bg-muted rounded" />
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded" />
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary p-4 rounded-2xl shadow-xl shadow-primary/40 text-center animate-bounce">
                  <Users className="h-6 w-6 text-primary-foreground mx-auto mb-1" />
                  <span className="block text-primary-foreground font-black text-xl">+50K</span>
                </div>
              </div>
            </div>
          </div>}

        </div>
      </div>

      {/* Apply For Me Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={(o) => { if (!applyLoading) { setApplyDialogOpen(o); if (!o) setApplyStep((jobCredits?.balance ?? 0) > 0 ? "confirm" : "noCreds"); } }}>
        <DialogContent dir="rtl" className="max-w-sm">
          {applyStep === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-emerald-500" />
                  تأكيد طلب التقديم
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-2">
                  <p className="text-sm text-foreground font-bold">{job?.title}</p>
                  <p className="text-xs text-muted-foreground">{job?.company}</p>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted p-3">
                  <span className="text-sm text-muted-foreground">رصيدك الحالي</span>
                  <span className="font-black text-foreground">{jobCredits?.balance ?? 0} تقديم</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">سيُخصم تقديم واحد من رصيدك وسيقوم فريقنا بالتقديم نيابةً عنك</p>
              </div>
              <DialogFooter className="flex-row-reverse gap-2">
                <Button variant="outline" onClick={() => setApplyDialogOpen(false)} disabled={applyLoading}>إلغاء</Button>
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={applyLoading}
                  data-testid="button-confirm-apply"
                  onClick={async () => {
                    if (!job) return;
                    setApplyLoading(true);
                    try {
                      const token = getCommunityToken();
                      const res = await fetch("/api/community/job-apply", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...(token ? { "X-Community-Token": token } : {}),
                        },
                        credentials: "include",
                        body: JSON.stringify({ jobId: job.id, jobTitle: job.title, jobCompany: job.company, jobApplyUrl: job.applyUrl }),
                      });
                      if (res.status === 402) { setApplyStep("noCreds"); }
                      else if (res.ok) {
                        setApplyStep("success");
                        queryClient.invalidateQueries({ queryKey: ["/api/community/job-credits"] });
                      } else { toast({ title: "حدث خطأ", description: "يرجى المحاولة مجدداً", variant: "destructive" }); }
                    } finally { setApplyLoading(false); }
                  }}
                >
                  {applyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تأكيد التقديم"}
                </Button>
              </DialogFooter>
            </>
          )}

          {applyStep === "noCreds" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  اشحن رصيد التقديمات
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <p className="text-sm text-muted-foreground text-center">رصيدك 0 تقديمات. اختر باقة لتبدأ التقديم على الوظائف بسعر أقل:</p>
                {[
                  { label: "تقديم واحد", credits: 1, price: 15, variant: "1 تقديم", save: null, href: "/store/services/job-application" },
                  { label: "10 تقديمات", credits: 10, price: 140, variant: "10 تقديمات", save: "وفّر 10 ريال", href: null },
                  { label: "20 تقديماً", credits: 20, price: 260, variant: "20 تقديماً", save: "وفّر 40 ريال" },
                  { label: "30 تقديماً", credits: 30, price: 360, variant: "30 تقديماً", save: "وفّر 90 ريال" },
                  { label: "50 تقديماً ⭐", credits: 50, price: 500, variant: "50 تقديماً", save: "وفّر 250 ريال + سيرة ATS" },
                ].map((pkg) => (
                  <Link key={pkg.credits} href={(pkg as any).href ?? `/store/services/job-credits?pkg=${pkg.credits}&v=${encodeURIComponent(pkg.variant)}`} onClick={() => setApplyDialogOpen(false)}>
                    <div className="flex items-center justify-between rounded-xl border border-border hover:border-emerald-500/40 hover:bg-emerald-500/5 p-3 cursor-pointer transition-all">
                      <div>
                        <span className="font-bold text-sm text-foreground">{pkg.label}</span>
                        {pkg.save && <span className="block text-[11px] text-emerald-600">{pkg.save}</span>}
                      </div>
                      <span className="font-black text-foreground">{pkg.price} ريال</span>
                    </div>
                  </Link>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" className="w-full" onClick={() => setApplyDialogOpen(false)}>إغلاق</Button>
              </DialogFooter>
            </>
          )}

          {applyStep === "success" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  تم إرسال طلبك
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                  <Rocket className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-foreground mb-1">تم استلام طلبك بنجاح!</p>
                  <p className="text-sm text-muted-foreground">سيبدأ فريقنا بالتقديم على وظيفة <span className="font-bold text-foreground">"{job?.title}"</span> نيابةً عنك قريباً.</p>
                </div>
                <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                  رصيدك المتبقي: <span className="font-black text-foreground">{jobCredits?.balance ?? 0} تقديم</span>
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setApplyDialogOpen(false)} data-testid="button-close-apply-success">
                  ممتاز
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Job Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              الإبلاغ عن الإعلان الوظيفي
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
                  <SelectItem value="broken_link">رابط التقديم لا يعمل</SelectItem>
                  <SelectItem value="fake_job">وظيفة وهمية</SelectItem>
                  <SelectItem value="expired">الإعلان منتهي الصلاحية</SelectItem>
                  <SelectItem value="duplicate">إعلان مكرر</SelectItem>
                  <SelectItem value="misleading">معلومات مضللة</SelectItem>
                  <SelectItem value="scam">احتيال أو نصب</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">تفاصيل إضافية (اختياري)</label>
              <Textarea
                placeholder="اشرح المشكلة بمزيد من التفاصيل..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="min-h-[90px] resize-none"
                data-testid="textarea-report-details"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setReportOpen(false)}>إلغاء</Button>
            <Button
              onClick={submitReport}
              disabled={!reportReason || reportMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
              data-testid="button-submit-job-report"
            >
              {reportMutation.isPending ? "جارٍ الإرسال..." : "إرسال البلاغ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
