import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCheck, Plus, Pencil, Trash2, ArrowLeft, ExternalLink,
  Search, Archive, CheckCircle2, Eye, EyeOff, Calendar, Building2,
} from "lucide-react";
import { Link } from "wouter";
import { adminFetch } from "@/lib/adminAuth";
import type { Result } from "@shared/schema";

const RESULT_TYPES = ["تعيين", "قبول", "تجنيد", "توظيف", "ترشيح", "اختبار", "مقابلة"];

type StatusFilter = "all" | "published" | "draft" | "trash";

function ResultForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<Result>;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    org: initial?.org ?? "",
    type: initial?.type ?? "تعيين",
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    details: initial?.details ?? "",
    inquiryUrl: initial?.inquiryUrl ?? "",
    status: initial?.status ?? "published",
    isActive: initial?.isActive ?? true,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4 mt-2">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label>عنوان الإعلان *</Label>
          <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="مثال: نتائج القبول في وزارة الداخلية" className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>الجهة *</Label>
            <Input value={form.org} onChange={e => set("org", e.target.value)} placeholder="وزارة الداخلية" className="mt-1" />
          </div>
          <div>
            <Label>نوع الإعلان</Label>
            <select
              value={form.type}
              onChange={e => set("type", e.target.value)}
              className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {RESULT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>تاريخ الإعلان</Label>
            <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>الحالة</Label>
            <select
              value={form.status}
              onChange={e => set("status", e.target.value)}
              className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
            </select>
          </div>
        </div>
        <div>
          <Label>تفاصيل الإعلان</Label>
          <textarea
            value={form.details}
            onChange={e => set("details", e.target.value)}
            placeholder="اكتب التفاصيل والتعليمات الكاملة هنا..."
            rows={4}
            className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <div>
          <Label>رابط الاستعلام عن النتائج</Label>
          <Input value={form.inquiryUrl} onChange={e => set("inquiryUrl", e.target.value)} placeholder="https://..." className="mt-1" />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t border-border">
        <Button variant="outline" onClick={onCancel} disabled={saving}>إلغاء</Button>
        <Button
          onClick={() => onSave(form)}
          disabled={saving || !form.title.trim() || !form.org.trim()}
          className="bg-amber-500 hover:bg-amber-600 text-white"
          data-testid="button-save-result"
        >
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminResultsHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Result | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Result | null>(null);

  const { data: results = [], isLoading } = useQuery<Result[]>({
    queryKey: ["/api/admin/results", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" ? "/api/admin/results" : `/api/admin/results?status=${statusFilter}`;
      const res = await adminFetch(url);
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminFetch("/api/admin/results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("فشل الحفظ");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      toast({ title: "تم إضافة النتيجة بنجاح" });
      setDialogMode(null);
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await adminFetch(`/api/admin/results/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("فشل التحديث");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      toast({ title: "تم تحديث النتيجة بنجاح" });
      setDialogMode(null);
      setEditTarget(null);
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/results/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      toast({ title: "تم حذف النتيجة" });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const filtered = results.filter(r =>
    r.title.includes(search) || r.org.includes(search)
  );

  const published = results.filter(r => r.status === "published").length;
  const drafts = results.filter(r => r.status === "draft").length;

  const statusBadge = (status: string) => {
    if (status === "published") return <Badge className="bg-green-500/15 text-green-600 border-0 text-xs">منشور</Badge>;
    if (status === "draft") return <Badge className="bg-muted text-muted-foreground border-0 text-xs">مسودة</Badge>;
    return <Badge className="bg-red-500/15 text-red-500 border-0 text-xs">محذوف</Badge>;
  };

  return (
    <AdminLayout title="نتائج التوظيف">
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/jobs-hub">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">نتائج التوظيف</h1>
              <p className="text-sm text-muted-foreground">إدارة إعلانات نتائج القبول والتعيين</p>
            </div>
          </div>
          <div className="mr-auto">
            <Button
              onClick={() => { setEditTarget(null); setDialogMode("add"); }}
              className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2"
              data-testid="button-add-result"
            >
              <Plus className="h-4 w-4" />
              إضافة نتيجة جديدة
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-amber-500/20">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">الإجمالي</span>
              </div>
              <p className="text-2xl font-bold mt-1">{results.length}</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">منشور</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-green-600">{published}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">مسودة</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-muted-foreground">{drafts}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters + Search */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="بحث بالعنوان أو الجهة..."
                  className="pr-9"
                  data-testid="input-search-results"
                />
              </div>
              <div className="flex gap-2">
                {(["all", "published", "draft"] as StatusFilter[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === s
                        ? "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                    data-testid={`filter-${s}`}
                  >
                    {s === "all" ? "الكل" : s === "published" ? "منشور" : "مسودة"}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base flex items-center gap-2">
              <Archive className="h-4 w-4 text-amber-500" />
              قائمة النتائج
              {filtered.length > 0 && <Badge className="bg-muted text-muted-foreground border-0">{filtered.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-2">
                <ClipboardCheck className="h-10 w-10 opacity-30" />
                <p className="text-sm">لا توجد نتائج</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditTarget(null); setDialogMode("add"); }}
                  className="mt-1"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  أضف أول نتيجة
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(result => (
                  <div
                    key={result.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                    data-testid={`row-result-${result.id}`}
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <ClipboardCheck className="h-4 w-4 text-amber-500" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{result.title}</span>
                        {statusBadge(result.status ?? "draft")}
                        <Badge className="bg-amber-500/10 text-amber-600 border-0 text-xs">{result.type}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {result.org}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {result.date}
                        </span>
                        {result.inquiryUrl && (
                          <a
                            href={result.inquiryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            رابط الاستعلام
                          </a>
                        )}
                      </div>
                      {result.details && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{result.details}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href="/results"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="عرض الصفحة"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => { setEditTarget(result); setDialogMode("edit"); }}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="تعديل"
                        data-testid={`button-edit-result-${result.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(result)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                        title="حذف"
                        data-testid={`button-delete-result-${result.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={v => { if (!v) { setDialogMode(null); setEditTarget(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-amber-500" />
              {dialogMode === "add" ? "إضافة نتيجة جديدة" : "تعديل النتيجة"}
            </DialogTitle>
          </DialogHeader>
          <ResultForm
            initial={editTarget ?? undefined}
            saving={createMutation.isPending || updateMutation.isPending}
            onCancel={() => { setDialogMode(null); setEditTarget(null); }}
            onSave={(data) => {
              if (dialogMode === "add") createMutation.mutate(data);
              else if (editTarget) updateMutation.mutate({ id: editTarget.id, data });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد حذف "<strong>{deleteTarget?.title}</strong>" نهائياً؟ لا يمكن التراجع عن هذه العملية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
