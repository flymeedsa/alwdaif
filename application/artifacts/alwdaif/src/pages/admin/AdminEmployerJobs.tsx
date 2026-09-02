import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminFetch } from "@/lib/adminAuth";
import { Link } from "wouter";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  XCircle,
  Trash2,
  RotateCcw,
  Eye,
  MapPin,
  Calendar,
  ExternalLink,
  AlertCircle,
  Pencil,
  User,
  Mail,
  Phone,
  Link2,
  Clock,
  Laptop,
  Users,
  Globe,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isJobClosed } from "@/lib/jobUtils";
import { Lock, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const REGIONS = [
  "كل المدن","الرياض","مكة المكرمة","المدينة المنورة","جدة","الدمام","الأحساء",
  "القصيم","المنطقة الشرقية","عسير","تبوك","حائل","الحدود الشمالية","جازان","نجران","الباحة","الجوف",
];

const STATUS_TABS = [
  { value: "pending", label: "قيد المراجعة" },
  { value: "published", label: "منشورة" },
  { value: "open", label: "مفتوحة" },
  { value: "closed", label: "مغلقة" },
  { value: "trashed", label: "محذوفة" },
];

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA");
}

// The PHP API may serialize deadlineDate as either an ISO string or a
// millisecond timestamp. Keep the edit form resilient to both formats.
function dateInputValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const WORK_SCHEDULE_LABELS: Record<string, string> = { full_time: "دوام كامل", part_time: "دوام جزئي" };
const WORK_MODE_LABELS: Record<string, string> = { on_site: "حضوري", remote: "عن بعد" };
const GENDER_LABELS: Record<string, string> = { all: "الجنسين", male: "ذكور فقط", female: "إناث فقط" };
const NATIONALITY_LABELS: Record<string, string> = { all: "الجميع", saudi: "سعودي فقط", non_saudi: "غير سعودي فقط" };
const CONTACT_METHOD_LABELS: Record<string, string> = { email: "بريد إلكتروني", phone: "هاتف", url: "رابط تقديم" };

function ViewJobDialog({ job, open, onClose, onPublish, onTrash, onEdit }: {
  job: any;
  open: boolean;
  onClose: () => void;
  onPublish?: () => void;
  onTrash?: () => void;
  onEdit?: () => void;
}) {
  if (!job) return null;
  const deadline = job.deadlineDate ? new Date(job.deadlineDate) : null;
  const isClosed = deadline && deadline <= new Date();
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full" dir="rtl">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-xl leading-snug">{job.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-muted-foreground text-sm font-medium">{job.company}</span>
                {isClosed && <Badge variant="secondary" className="text-xs">منتهية</Badge>}
                {job.status === "pending" && <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-0">قيد المراجعة</Badge>}
                {job.status === "published" && <Badge className="text-xs bg-green-100 text-green-700 border-0">منشورة</Badge>}
              </div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 mt-1"># {job.id}</span>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pl-1">
          <div className="space-y-5 py-2 pr-1">

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              {job.region && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div><p className="text-xs text-muted-foreground">المنطقة</p><p className="font-medium">{job.region}{job.city ? ` - ${job.city}` : ""}</p></div>
                </div>
              )}
              {job.workSchedule && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div><p className="text-xs text-muted-foreground">نوع الدوام</p><p className="font-medium">{WORK_SCHEDULE_LABELS[job.workSchedule] || job.workSchedule}</p></div>
                </div>
              )}
              {job.workMode && (
                <div className="flex items-center gap-2 text-sm">
                  <Laptop className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div><p className="text-xs text-muted-foreground">طبيعة العمل</p><p className="font-medium">{WORK_MODE_LABELS[job.workMode] || job.workMode}</p></div>
                </div>
              )}
              {job.deadlineDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div><p className="text-xs text-muted-foreground">آخر موعد للتقديم</p><p className={`font-medium ${isClosed ? "text-red-500" : ""}`}>{formatDate(job.deadlineDate)}</p></div>
                </div>
              )}
              {job.targetGender && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div><p className="text-xs text-muted-foreground">الجنس المستهدف</p><p className="font-medium">{GENDER_LABELS[job.targetGender] || job.targetGender}</p></div>
                </div>
              )}
              {job.targetNationality && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div><p className="text-xs text-muted-foreground">الجنسية المستهدفة</p><p className="font-medium">{NATIONALITY_LABELS[job.targetNationality] || job.targetNationality}</p></div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                <div><p className="text-xs text-muted-foreground">المشاهدات</p><p className="font-medium">{job.viewCount || 0}</p></div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">وصف الوظيفة</p>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </div>

            {job.requirements && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-2">المتطلبات</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Contact & Submitter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">طريقة التقديم</p>
                <div className="flex items-center gap-2 text-sm">
                  {job.contactMethod === "email" ? <Mail className="h-4 w-4 text-primary shrink-0" /> : job.contactMethod === "phone" ? <Phone className="h-4 w-4 text-primary shrink-0" /> : <Link2 className="h-4 w-4 text-primary shrink-0" />}
                  <div>
                    <p className="text-xs text-muted-foreground">{CONTACT_METHOD_LABELS[job.contactMethod] || job.contactMethod}</p>
                    {job.contactMethod === "url" ? (
                      <a href={job.contactValue} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline break-all text-xs" dir="ltr">{job.contactValue}</a>
                    ) : (
                      <p className="font-medium break-all" dir="ltr">{job.contactValue}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">مسؤول التوظيف</p>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="font-medium">{job.submitterName}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-xs break-all" dir="ltr">{job.submitterEmail}</p>
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-border pt-4 flex-wrap gap-2">
          <Button variant="outline" onClick={onClose} className="ml-auto">إغلاق</Button>
          {onEdit && (
            <Button variant="outline" onClick={() => { onClose(); onEdit(); }} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />تعديل
            </Button>
          )}
          {onTrash && (
            <Button variant="outline" onClick={() => { onClose(); onTrash(); }} className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/30 gap-1.5">
              <XCircle className="h-3.5 w-3.5" />رفض
            </Button>
          )}
          {onPublish && (
            <Button onClick={() => { onClose(); onPublish(); }} className="bg-green-600 hover:bg-green-700 text-white gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />نشر الإعلان
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function JobRow({ job, onPublish, onTrash, onRestore, onDelete, onEdit, onView }: {
  job: any;
  onPublish?: () => void;
  onTrash?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onView?: () => void;
}) {
  const deadline = job.deadlineDate ? new Date(job.deadlineDate) : null;
  const isClosed = deadline && deadline <= new Date();

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
      data-testid={`row-employer-job-${job.id}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-medium text-sm truncate">{job.title}</span>
          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">#{job.id}</span>
          {isClosed && <Badge variant="secondary" className="text-xs">منتهية</Badge>}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">{job.company || job.companyName}</span>
          {job.workSchedule && ({full_time:"دوام كامل",part_time:"دوام جزئي"} as Record<string,string>)[job.workSchedule] && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {({full_time:"دوام كامل",part_time:"دوام جزئي"} as Record<string,string>)[job.workSchedule]}
            </span>
          )}
          {job.workMode && ({on_site:"حضوري",remote:"عن بعد"} as Record<string,string>)[job.workMode] && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
              {({on_site:"حضوري",remote:"عن بعد"} as Record<string,string>)[job.workMode]}
            </span>
          )}
          {job.region && job.region !== "كل المدن" && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.region}
            </span>
          )}
          {job.deadlineDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(job.deadlineDate)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {job.viewCount || 0} مشاهدة
          </span>
          {job.applyUrl && (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              رابط التقديم
            </a>
          )}
          {job.applyEmail && (
            <span className="text-primary/80">{job.applyEmail}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {onView && (
          <Button size="sm" variant="outline" onClick={onView} className="text-muted-foreground border-border hover:bg-muted h-8 gap-1.5" data-testid={`button-view-${job.id}`}>
            <Eye className="h-3.5 w-3.5" />
            عرض
          </Button>
        )}
        {onEdit && (
          <Button size="sm" variant="outline" onClick={onEdit} className="text-muted-foreground border-border hover:bg-muted h-8 gap-1.5" data-testid={`button-edit-${job.id}`}>
            <Pencil className="h-3.5 w-3.5" />
            تعديل
          </Button>
        )}
        {onPublish && (
          <Button size="sm" variant="outline" onClick={onPublish} className="text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30 h-8 gap-1.5" data-testid={`button-publish-${job.id}`}>
            <CheckCircle className="h-3.5 w-3.5" />
            نشر
          </Button>
        )}
        {onRestore && (
          <Button size="sm" variant="outline" onClick={onRestore} className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/30 h-8 gap-1.5" data-testid={`button-restore-${job.id}`}>
            <RotateCcw className="h-3.5 w-3.5" />
            استعادة
          </Button>
        )}
        {onTrash && (
          <Button size="sm" variant="outline" onClick={onTrash} className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/30 h-8 gap-1.5" data-testid={`button-trash-${job.id}`}>
            <XCircle className="h-3.5 w-3.5" />
            رفض
          </Button>
        )}
        {onDelete && (
          <Button size="sm" variant="outline" onClick={onDelete} className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30 h-8 gap-1" data-testid={`button-delete-${job.id}`}>
            <Trash2 className="h-3.5 w-3.5" />
            حذف
          </Button>
        )}
      </div>
    </div>
  );
}

function EditJobDialog({ job, open, onClose, onSaved }: { job: any; open: boolean; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ workSchedule: "", workMode: "", region: "", deadlineDate: "" });

  useEffect(() => {
    if (open && job) {
      setForm({
        workSchedule: job.workSchedule ?? "",
        workMode: job.workMode ?? "",
        region: job.region ?? "كل المدن",
        deadlineDate: dateInputValue(job.deadlineDate),
      });
    }
  }, [open, job?.id]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch(`/api/admin/employer-jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workSchedule: form.workSchedule || null,
          workMode: form.workMode || null,
          region: form.region || null,
          deadlineDate: form.deadlineDate || null,
        }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
    },
    onSuccess: () => { toast({ title: "تم الحفظ بنجاح" }); onSaved(); onClose(); },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل الوظيفة</DialogTitle>
          <p className="text-sm text-muted-foreground">{job?.title}</p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>نوع الدوام</Label>
            <select value={form.workSchedule} onChange={set("workSchedule")} dir="rtl"
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">غير محدد</option>
              <option value="full_time">دوام كامل</option>
              <option value="part_time">دوام جزئي</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>طبيعة العمل</Label>
            <select value={form.workMode} onChange={set("workMode")} dir="rtl"
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">غير محدد</option>
              <option value="on_site">حضوري</option>
              <option value="remote">عن بعد</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>المنطقة</Label>
            <select value={form.region} onChange={set("region")} dir="rtl"
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring">
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>آخر موعد للتقديم</Label>
            <Input type="date" value={form.deadlineDate} onChange={set("deadlineDate")} className="h-10" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminEmployerJobs() {
  const [activeTab, setActiveTab] = useState("pending");
  const [deleteJobId, setDeleteJobId] = useState<number | null>(null);
  const [editJob, setEditJob] = useState<any | null>(null);
  const [viewJob, setViewJob] = useState<any | null>(null);
  const [searchId, setSearchId] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const apiStatus = (activeTab === "open" || activeTab === "closed") ? "published" : activeTab;

  const { data: jobs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/employer-jobs", apiStatus],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/employer-jobs?status=${apiStatus}`);
      return res.json();
    },
  });

  const allJobs = Array.isArray(jobs) ? jobs : [];
  const tabFilteredJobs = activeTab === "open"
    ? allJobs.filter((j: any) => !isJobClosed(j))
    : activeTab === "closed"
    ? allJobs.filter((j: any) => isJobClosed(j))
    : allJobs;

  const filteredJobs = searchId.trim()
    ? tabFilteredJobs.filter((j: any) => String(j.id) === searchId.trim())
    : tabFilteredJobs;

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await adminFetch(`/api/admin/employer-jobs/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("فشل التحديث");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/employer-jobs"] });
      toast({ title: "تم التحديث بنجاح" });
    },
    onError: () => toast({ title: "خطأ", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/employer-jobs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/employer-jobs"] });
      setDeleteJobId(null);
      toast({ title: "تم الحذف نهائياً" });
    },
    onError: () => toast({ title: "خطأ في الحذف", variant: "destructive" }),
  });

  return (
    <AdminLayout title="وظائف أصحاب العمل">
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Link href="/admin/jobs-hub">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              وظائف أصحاب العمل
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              إدارة الإعلانات الوظيفية المُضافة من أصحاب العمل
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchId(""); }} dir="rtl">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="pending" data-testid="tab-pending">
              قيد المراجعة
            </TabsTrigger>
            <TabsTrigger value="published" data-testid="tab-published">
              منشورة
            </TabsTrigger>
            <TabsTrigger value="open" data-testid="tab-open" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              مفتوحة
              {activeTab !== "open" && (
                <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full px-1.5 py-0.5 font-medium">
                  {allJobs.filter((j: any) => !isJobClosed(j)).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="closed" data-testid="tab-closed" className="gap-1.5">
              <Lock className="h-3.5 w-3.5 text-gray-400" />
              مغلقة
              {activeTab !== "closed" && (
                <span className="text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 rounded-full px-1.5 py-0.5 font-medium">
                  {allJobs.filter((j: any) => isJobClosed(j)).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="trashed" data-testid="tab-trashed">
              محذوفة
            </TabsTrigger>
          </TabsList>

          {["pending", "published", "open", "closed", "trashed"].map((tabVal) => (
            <TabsContent key={tabVal} value={tabVal}>
              {/* Search by ad number */}
              <div className="mb-3 flex items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                  <FileText className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="ابحث برقم الإعلان..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="pr-9 h-9 text-sm"
                    data-testid="input-search-job-id"
                  />
                </div>
                {searchId && (
                  <Button size="sm" variant="ghost" onClick={() => setSearchId("")} className="h-9 text-muted-foreground">
                    مسح
                  </Button>
                )}
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {isLoading ? (
                  <div className="py-16 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 opacity-30" />
                    <p className="text-sm">{searchId ? `لا يوجد إعلان برقم #${searchId}` : "لا توجد وظائف في هذه القائمة"}</p>
                  </div>
                ) : (
                  <div>
                    {filteredJobs.map((job: any) => (
                      <JobRow
                        key={job.id}
                        job={job}
                        onView={() => setViewJob(job)}
                        onEdit={() => setEditJob(job)}
                        onPublish={tabVal === "pending" ? () => statusMutation.mutate({ id: job.id, status: "published" }) : undefined}
                        onTrash={tabVal !== "trashed" ? () => statusMutation.mutate({ id: job.id, status: "trashed" }) : undefined}
                        onRestore={tabVal === "trashed" ? () => statusMutation.mutate({ id: job.id, status: "pending" }) : undefined}
                        onDelete={tabVal === "trashed" ? () => setDeleteJobId(job.id) : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}

        </Tabs>
      </div>

      {/* View dialog */}
      {viewJob && (
        <ViewJobDialog
          job={viewJob}
          open={!!viewJob}
          onClose={() => setViewJob(null)}
          onPublish={viewJob.status !== "published" ? () => { statusMutation.mutate({ id: viewJob.id, status: "published" }); setViewJob(null); } : undefined}
          onTrash={viewJob.status !== "trashed" ? () => { statusMutation.mutate({ id: viewJob.id, status: "trashed" }); setViewJob(null); } : undefined}
          onEdit={() => { setViewJob(null); setEditJob(viewJob); }}
        />
      )}

      {/* Edit dialog */}
      {editJob && (
        <EditJobDialog
          job={editJob}
          open={!!editJob}
          onClose={() => setEditJob(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["/api/admin/employer-jobs"] })}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteJobId} onOpenChange={() => setDeleteJobId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف النهائي</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            هل أنت متأكد من حذف هذا الإعلان نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteJobId(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => deleteJobId && deleteMutation.mutate(deleteJobId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "جارٍ الحذف..." : "حذف نهائياً"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
