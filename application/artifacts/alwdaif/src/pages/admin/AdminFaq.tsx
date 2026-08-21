import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Plus, Pencil, Trash2, HelpCircle, Eye, EyeOff,
  GripVertical, Tag, List,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { FaqItem, FaqCategory } from "@shared/schema";

const emptyForm = {
  question: "",
  answer: "",
  category: "",
  sortOrder: 0,
  isPublished: true,
};

const emptyCatForm = { name: "", slug: "", sortOrder: 0 };

export default function AdminFaq() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"questions" | "categories">("questions");

  // Questions state
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Categories state
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<FaqCategory | null>(null);
  const [catForm, setCatForm] = useState(emptyCatForm);

  const { data: items = [], isLoading } = useQuery<FaqItem[]>({
    queryKey: ["/api/admin/faq"],
    queryFn: async () => {
      const res = await fetch("/api/admin/faq", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<FaqCategory[]>({
    queryKey: ["/api/admin/faq/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/faq/categories", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // ── Question mutations ──
  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const url = editing ? `/api/admin/faq/${editing.id}` : "/api/admin/faq";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || "خطأ");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/faq"] });
      qc.invalidateQueries({ queryKey: ["/api/faq"] });
      setShowDialog(false);
      toast({ title: editing ? "تم التحديث" : "تمت الإضافة" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "خطأ", description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/faq/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("فشل الحذف");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/faq"] });
      qc.invalidateQueries({ queryKey: ["/api/faq"] });
      toast({ title: "تم الحذف" });
    },
    onError: () => toast({ variant: "destructive", title: "فشل الحذف" }),
  });

  const togglePublish = useMutation({
    mutationFn: async (item: FaqItem) => {
      const res = await fetch(`/api/admin/faq/${item.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });
      if (!res.ok) throw new Error("فشل");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/faq"] });
      qc.invalidateQueries({ queryKey: ["/api/faq"] });
    },
  });

  // ── Category mutations ──
  const saveCatMutation = useMutation({
    mutationFn: async (data: typeof catForm) => {
      const url = editingCat ? `/api/admin/faq/categories/${editingCat.id}` : "/api/admin/faq/categories";
      const method = editingCat ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || "خطأ");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/faq/categories"] });
      qc.invalidateQueries({ queryKey: ["/api/faq/categories"] });
      setShowCatDialog(false);
      toast({ title: editingCat ? "تم تحديث التصنيف" : "تمت إضافة التصنيف" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "خطأ", description: e.message }),
  });

  const deleteCatMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/faq/categories/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("فشل");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/faq/categories"] });
      qc.invalidateQueries({ queryKey: ["/api/faq/categories"] });
      toast({ title: "تم حذف التصنيف" });
    },
    onError: () => toast({ variant: "destructive", title: "فشل حذف التصنيف" }),
  });

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, category: categories[0]?.slug || "" });
    setShowDialog(true);
  }

  function openEdit(item: FaqItem) {
    setEditing(item);
    setForm({
      question: item.question,
      answer: item.answer,
      category: item.category || "",
      sortOrder: item.sortOrder,
      isPublished: item.isPublished,
    });
    setShowDialog(true);
  }

  function openNewCat() {
    setEditingCat(null);
    setCatForm(emptyCatForm);
    setShowCatDialog(true);
  }

  function openEditCat(cat: FaqCategory) {
    setEditingCat(cat);
    setCatForm({ name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder });
    setShowCatDialog(true);
  }

  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u0600-\u06FF-]/g, "")
      .replace(/--+/g, "-");
  }

  const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

  return (
    <AdminLayout title="الأسئلة الشائعة">
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">الأسئلة الشائعة</h1>
            <p className="text-gray-500 dark:text-gray-400">إدارة الأسئلة والتصنيفات</p>
          </div>
          {activeTab === "questions" ? (
            <Button onClick={openNew} className="gap-2" data-testid="button-add-faq">
              <Plus className="h-4 w-4" />
              إضافة سؤال
            </Button>
          ) : (
            <Button onClick={openNewCat} className="gap-2" data-testid="button-add-category">
              <Plus className="h-4 w-4" />
              إضافة تصنيف
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("questions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "questions"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-questions"
          >
            <List className="h-4 w-4" />
            الأسئلة
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{items.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "categories"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="tab-categories"
          >
            <Tag className="h-4 w-4" />
            التصنيفات
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{categories.length}</span>
          </button>
        </div>

        {/* ── Questions Tab ── */}
        {activeTab === "questions" && (
          <>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>المجموع: <strong className="text-foreground">{items.length}</strong></span>
              <span>•</span>
              <span>منشور: <strong className="text-green-600">{items.filter(i => i.isPublished).length}</strong></span>
              <span>•</span>
              <span>مخفي: <strong className="text-gray-500">{items.filter(i => !i.isPublished).length}</strong></span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">لا توجد أسئلة بعد</p>
                {categories.length === 0 && (
                  <p className="text-sm mt-1 text-amber-600">أضف تصنيفاً أولاً من تبويب التصنيفات</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group"
                    data-testid={`faq-row-${item.id}`}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm">{item.question}</span>
                        {item.category && categoryMap[item.category] && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {categoryMap[item.category]}
                          </Badge>
                        )}
                        {!item.isPublished && (
                          <Badge variant="secondary" className="text-xs shrink-0">مخفي</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.answer}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => togglePublish.mutate(item)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        title={item.isPublished ? "إخفاء" : "نشر"}
                        data-testid={`faq-toggle-publish-${item.id}`}
                      >
                        {item.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        data-testid={`faq-edit-${item.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm("هل أنت متأكد من الحذف؟")) deleteMutation.mutate(item.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500"
                        data-testid={`faq-delete-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Categories Tab ── */}
        {activeTab === "categories" && (
          <>
            {categories.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">لا توجد تصنيفات بعد</p>
                <p className="text-sm mt-1">أضف تصنيفاً لتنظيم الأسئلة الشائعة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => {
                  const count = items.filter(i => i.category === cat.slug).length;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group"
                      data-testid={`cat-row-${cat.id}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                        <Tag className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{cat.name}</span>
                          <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{cat.slug}</code>
                          <span className="text-xs text-muted-foreground">{count} سؤال</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditCat(cat)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                          data-testid={`cat-edit-${cat.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm("سيتم حذف هذا التصنيف. هل أنت متأكد؟")) deleteCatMutation.mutate(cat.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500"
                          data-testid={`cat-delete-${cat.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Question Dialog ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل السؤال" : "إضافة سؤال جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>السؤال</Label>
              <Input
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="اكتب السؤال..."
                data-testid="input-faq-question"
              />
            </div>
            <div className="space-y-1.5">
              <Label>الجواب</Label>
              <Textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                placeholder="اكتب الجواب..."
                rows={4}
                data-testid="input-faq-answer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>التصنيف</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="select-faq-category">
                    <SelectValue placeholder="اختر تصنيفاً" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  data-testid="input-faq-order"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="faq-published"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="rounded"
                data-testid="checkbox-faq-published"
              />
              <Label htmlFor="faq-published">منشور (ظاهر للأعضاء)</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending || !form.question.trim() || !form.answer.trim()}
                data-testid="button-faq-save"
              >
                {saveMutation.isPending ? "جاري الحفظ..." : editing ? "تحديث" : "إضافة"}
              </Button>
              <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Category Dialog ── */}
      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingCat ? "تعديل التصنيف" : "إضافة تصنيف جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>اسم التصنيف</Label>
              <Input
                value={catForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setCatForm({
                    ...catForm,
                    name,
                    slug: editingCat ? catForm.slug : slugify(name),
                  });
                }}
                placeholder="مثال: الحساب"
                data-testid="input-cat-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>المعرّف (Slug)</Label>
              <Input
                value={catForm.slug}
                onChange={(e) => setCatForm({ ...catForm, slug: slugify(e.target.value) })}
                placeholder="مثال: account"
                dir="ltr"
                data-testid="input-cat-slug"
              />
              <p className="text-xs text-muted-foreground">يُستخدم داخلياً لتصنيف الأسئلة</p>
            </div>
            <div className="space-y-1.5">
              <Label>الترتيب</Label>
              <Input
                type="number"
                value={catForm.sortOrder}
                onChange={(e) => setCatForm({ ...catForm, sortOrder: parseInt(e.target.value) || 0 })}
                data-testid="input-cat-order"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() => saveCatMutation.mutate(catForm)}
                disabled={saveCatMutation.isPending || !catForm.name.trim() || !catForm.slug.trim()}
                data-testid="button-cat-save"
              >
                {saveCatMutation.isPending ? "جاري الحفظ..." : editingCat ? "تحديث" : "إضافة"}
              </Button>
              <Button variant="outline" onClick={() => setShowCatDialog(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
