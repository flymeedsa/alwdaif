import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Calendar, Eye, Briefcase, Plus, AlertCircle,
  Flag, Building2, Search, X, ChevronDown,
} from "lucide-react";

const PAGE_SIZE = 21;

const SAUDI_REGIONS = [
  "الرياض", "مكة المكرمة", "المدينة المنورة", "القصيم",
  "المنطقة الشرقية", "عسير", "تبوك", "حائل",
  "الحدود الشمالية", "جازان", "نجران", "الباحة", "الجوف",
];

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
    year: "numeric", month: "long", day: "numeric",
  });
}

function isExpired(job: any) {
  if (!job.deadlineDate) return false;
  return new Date(job.deadlineDate) <= new Date();
}

/* ─── Job Card ─────────────────────────────────────────── */
function JobCard({ job, onReport }: { job: any; onReport: (job: any) => void }) {
  const closed = isExpired(job);
  const deadline = job.deadlineDate ? new Date(job.deadlineDate) : null;

  return (
    <div
      dir="rtl"
      className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-200"
      data-testid={`card-employer-job-${job.id}`}
    >
      {/* colour strip */}
      <div className={`h-1.5 ${closed ? "bg-muted" : "bg-gradient-to-r from-primary to-primary/50"}`} />

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* title + badge */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/jobs/employer/${job.id}`}>
              <h3 className="font-bold text-base leading-snug line-clamp-2 hover:text-primary transition-colors cursor-pointer" data-testid={`text-job-title-${job.id}`}>
                {job.title}
              </h3>
            </Link>
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-sm font-medium truncate">{job.company}</span>
            </div>
          </div>
        </div>

        {/* description */}
        {job.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {job.description}
          </p>
        )}

        {/* chips — start = right in RTL */}
        <div className="flex flex-wrap gap-2">
          {job.workSchedule && WORK_SCHEDULE_LABELS[job.workSchedule] && (
            <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
              {WORK_SCHEDULE_LABELS[job.workSchedule]}
            </span>
          )}
          {job.workMode && WORK_MODE_LABELS[job.workMode] && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">
              {WORK_MODE_LABELS[job.workMode]}
            </span>
          )}
          {job.region && job.region !== "كل المدن" && (
            <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {job.region}{job.city && job.city !== job.region ? ` · ${job.city}` : ""}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
            <Eye className="h-3 w-3 flex-shrink-0" />
            {job.viewCount || 0}
          </span>
        </div>

        {/* actions — main button on right (start in RTL), report icon on left (end) */}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
          <Link href={`/jobs/employer/${job.id}`} className="flex-1">
            <Button
              size="sm"
              className="w-full gap-2"
              variant={closed ? "outline" : "default"}
              data-testid={`button-view-job-${job.id}`}
            >
              <Eye className="h-4 w-4" />
              {closed ? "عرض التفاصيل" : "التفاصيل والتقديم"}
            </Button>
          </Link>
          <button
            onClick={() => onReport(job)}
            className="h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex-shrink-0"
            title="إبلاغ عن هذا الإعلان"
            data-testid={`button-report-${job.id}`}
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Report Dialog ─────────────────────────────────────── */
function ReportDialog({ job, open, onClose }: { job: any | null; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function submit() {
    if (!reason.trim() || !job) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/employer-jobs/${job.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, reporterName: name, reporterEmail: email }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "تم الإبلاغ", description: "شكراً، سيتم مراجعة البلاغ." });
      setReason(""); setName(""); setEmail(""); onClose();
    } catch {
      toast({ title: "خطأ", description: "فشل إرسال البلاغ.", variant: "destructive" });
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>الإبلاغ عن إعلان وظيفي</DialogTitle>
        </DialogHeader>
        {job && <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{job.title} — {job.company}</p>}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>سبب البلاغ <span className="text-red-500">*</span></Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="اكتب سبب الإبلاغ..." rows={3} data-testid="input-report-reason" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>الاسم (اختياري)</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="الاسم" />
            </div>
            <div className="space-y-1.5">
              <Label>البريد (اختياري)</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="البريد" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={submit} disabled={!reason.trim() || loading} data-testid="button-submit-report">
            {loading ? "جارٍ الإرسال..." : "إرسال البلاغ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function EmployerJobs() {
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedWorkSchedule, setSelectedWorkSchedule] = useState("");
  const [selectedWorkMode, setSelectedWorkMode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");
  const [reportJob, setReportJob] = useState<any | null>(null);
  const [page, setPage] = useState(1);

  /* fetch ALL published jobs once */
  const { data: allJobs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/employer-jobs-all"],
    queryFn: async () => {
      const res = await fetch("/api/employer-jobs");
      if (!res.ok) throw new Error("fetch failed");
      return res.json();
    },
  });

  /* also fetch closed from API */
  const { data: apiClosed = [], isLoading: loadingClosed } = useQuery<any[]>({
    queryKey: ["/api/employer-jobs/closed"],
    queryFn: async () => {
      const res = await fetch("/api/employer-jobs/closed");
      return res.json();
    },
  });

  /* split by expiry client-side as well */
  const activeFromApi = useMemo(() => allJobs.filter(j => !isExpired(j)), [allJobs]);
  const closedFromApi = useMemo(() => [...allJobs.filter(j => isExpired(j)), ...apiClosed], [allJobs, apiClosed]);

  /* remove duplicates */
  const closedJobs = useMemo(() => {
    const seen = new Set<number>();
    return closedFromApi.filter(j => { if (seen.has(j.id)) return false; seen.add(j.id); return true; });
  }, [closedFromApi]);

  const source = activeTab === "active" ? activeFromApi : closedJobs;

  /* filter by region, workSchedule, workMode, then search */
  const filtered = useMemo(() => {
    let list = source;
    if (selectedRegion) list = list.filter(j => j.region === selectedRegion);
    if (selectedWorkSchedule) list = list.filter(j => j.workSchedule === selectedWorkSchedule);
    if (selectedWorkMode) list = list.filter(j => j.workMode === selectedWorkMode);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.region?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [source, selectedRegion, selectedWorkSchedule, selectedWorkMode, searchQuery]);

  const displayed = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = displayed.length < filtered.length;

  function handleSearch() {
    setSearchQuery(searchInput.trim());
    setPage(1);
  }

  function clearSearch() {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  }

  function handleRegion(r: string) {
    setSelectedRegion(r);
    setPage(1);
  }

  function handleTabChange(tab: "active" | "closed") {
    setActiveTab(tab);
    setPage(1);
  }

  const loading = isLoading || loadingClosed;

  return (
    <Layout>
      {/* ── hero banner ── */}
      <div className="bg-primary/5 border-b border-border py-8" dir="rtl">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold font-heading">وظائف أصحاب العمل</h1>
              </div>
              <p className="text-muted-foreground text-sm">
                إعلانات وظيفية مباشرة من أصحاب العمل في المملكة العربية السعودية
              </p>
            </div>
            <Link href="/jobs/employer/add">
              <Button className="gap-2.5 flex-shrink-0 px-5 h-11 text-base" data-testid="button-add-employer-job">
                <Plus className="h-5 w-5" />
                أضف وظيفة
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">

        {/* ── search bar: two fields + button ── */}
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm p-5">
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* In RTL flex: first child = rightmost */}
          <div className="relative z-10 flex flex-col sm:flex-row gap-2">

            {/* 1) Job title input — rightmost in RTL */}
            <div className="relative flex-1">
              {/* icon on LEFT side (end in RTL) */}
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                dir="rtl"
                placeholder="اسم الوظيفة أو الشركة..."
                className="h-11 pl-9 pr-4 rounded-xl"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                data-testid="input-employer-search"
              />
            </div>

            {/* 2) Region dropdown */}
            <div className="relative sm:w-40 flex-shrink-0">
              <select
                dir="rtl"
                value={selectedRegion}
                onChange={e => { handleRegion(e.target.value); }}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 pl-8 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="select-region"
              >
                <option value="">كل المناطق</option>
                {SAUDI_REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* 3) Work schedule dropdown */}
            <div className="relative sm:w-40 flex-shrink-0">
              <select
                dir="rtl"
                value={selectedWorkSchedule}
                onChange={e => { setSelectedWorkSchedule(e.target.value); setPage(1); }}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 pl-8 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="select-work-schedule"
              >
                <option value="">نوع الدوام</option>
                <option value="full_time">دوام كامل</option>
                <option value="part_time">دوام جزئي</option>
              </select>
              <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* 4) Work mode dropdown */}
            <div className="relative sm:w-40 flex-shrink-0">
              <select
                dir="rtl"
                value={selectedWorkMode}
                onChange={e => { setSelectedWorkMode(e.target.value); setPage(1); }}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 pl-8 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="select-work-mode"
              >
                <option value="">طبيعة العمل</option>
                <option value="on_site">حضوري</option>
                <option value="remote">عن بعد</option>
              </select>
              <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* 4) Search button — leftmost in RTL */}
            <div className="flex gap-2 flex-shrink-0">
              <Button className="h-11 px-6 rounded-xl font-bold flex-1 sm:flex-none" onClick={handleSearch} data-testid="button-search">
                بحث
              </Button>
              {(searchQuery || selectedRegion || selectedWorkSchedule || selectedWorkMode) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl"
                  onClick={() => { clearSearch(); handleRegion(""); setSelectedWorkSchedule(""); setSelectedWorkMode(""); setPage(1); }}
                  title="مسح الفلاتر"
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* active filters summary */}
          {(searchQuery || selectedRegion) && (
            <div className="relative z-10 flex items-center gap-2 mt-3 text-sm text-muted-foreground flex-wrap">
              <span>تصفية:</span>
              {searchQuery && (
                <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-xs font-bold">
                  {searchQuery}
                </span>
              )}
              {selectedRegion && (
                <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedRegion}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── tabs + count ── */}
        {/* RTL: tabs first in JSX → RIGHT side; count → LEFT side */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
            <button
              onClick={() => handleTabChange("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "active"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="tab-active-jobs"
            >
              وظائف مفتوحة
              {activeFromApi.length > 0 && (
                <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[11px] font-bold ${
                  activeTab === "active" ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                }`}>
                  {activeFromApi.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange("closed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "closed"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="tab-closed-jobs"
            >
              وظائف مغلقة
              {closedJobs.length > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[11px] font-bold bg-muted-foreground/20 text-muted-foreground">
                  {closedJobs.length}
                </span>
              )}
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {loading ? "" : `${filtered.length} إعلان`}
          </span>
        </div>

        {/* ── job grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-medium mb-1 text-center">
                {searchQuery
                  ? `لا توجد نتائج لـ "${searchQuery}"`
                  : activeTab === "active"
                  ? `لا توجد وظائف مفتوحة${selectedRegion ? ` في ${selectedRegion}` : ""}`
                  : `لا توجد وظائف مغلقة${selectedRegion ? ` في ${selectedRegion}` : ""}`}
              </p>
              <p className="text-sm text-muted-foreground text-center">جرّب تغيير المنطقة أو مصطلح البحث</p>
            </div>
            {searchQuery && (
              <Button variant="outline" size="sm" onClick={clearSearch}>مسح البحث</Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map(job => (
                <JobCard key={job.id} job={job} onReport={setReportJob} />
              ))}
            </div>

            {/* load more */}
            {hasMore && (
              <div className="flex flex-col items-center gap-2 pt-4">
                <p className="text-sm text-muted-foreground">
                  يُعرض {displayed.length} من أصل {filtered.length} إعلان
                </p>
                <Button
                  variant="outline"
                  className="px-8 rounded-xl"
                  onClick={() => setPage(p => p + 1)}
                  data-testid="button-load-more"
                >
                  عرض المزيد
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── disclaimer ── */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed flex-1">
            <span className="font-semibold">ملاحظة:</span>{" "}
            إعلانات هذه الصفحة يضيفها أصحاب العمل مباشرةً وتُراجَع قبل نشرها.
            إذا وجدت إعلاناً مضللاً، يُرجى الإبلاغ عنه.
          </p>
        </div>
      </div>

      <ReportDialog job={reportJob} open={!!reportJob} onClose={() => setReportJob(null)} />
    </Layout>
  );
}
