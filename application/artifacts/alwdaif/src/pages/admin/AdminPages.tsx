import { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { Link } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, FileText, Search, RotateCcw, Clock, ExternalLink, Lock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Page } from "@shared/schema";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/admin/RichTextEditor";

export default function AdminPages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({ title: "", slug: "", content: "", status: "published" });

  const { data: pages = [], isLoading } = useQuery<Page[]>({
    queryKey: ["/api/admin/pages"],
    queryFn: () => fetch("/api/admin/pages", { credentials: "include" }).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, content: sanitizeHtml(data.content) }),
        credentials: "include",
      }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({ title: "تمت الإضافة", description: "تمت إضافة الصفحة بنجاح" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast({ title: "خطأ", description: "فشل في إضافة الصفحة", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      fetch(`/api/admin/pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, content: sanitizeHtml(data.content) }),
        credentials: "include",
      }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({ title: "تم التحديث", description: "تم تحديث الصفحة بنجاح" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast({ title: "خطأ", description: "فشل في تحديث الصفحة", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/pages/${id}`, { method: "DELETE", credentials: "include" })
        .then(r => { if (!r.ok) throw new Error(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({ title: "تم الحذف", description: "تم حذف الصفحة نهائياً" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في حذف الصفحة", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({ title: "", slug: "", content: "", status: "published" });
    setEditingPage(null);
  };

  const openEditDialog = (page: Page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content || "",
      status: page.status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingPage) {
      updateMutation.mutate({ id: editingPage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleMoveToTrash = (page: Page) => {
    updateMutation.mutate({ 
      id: page.id, 
      data: { status: "trash", trashedAt: new Date().toISOString() } 
    });
  };

  const handlePermanentDelete = (page: Page) => {
    if (window.confirm(`هل أنت متأكد من الحذف النهائي لصفحة "${page.title}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      deleteMutation.mutate(page.id);
    }
  };

  const handleRestore = (page: Page) => {
    updateMutation.mutate({ id: page.id, data: { status: "draft", trashedAt: null } });
  };

  const statusLabels: Record<string, { label: string; class: string }> = {
    published: { label: "منشور", class: "bg-green-500/20 text-green-400" },
    draft: { label: "مسودة", class: "bg-yellow-500/20 text-yellow-400" },
    trash: { label: "محذوف", class: "bg-red-500/20 text-red-400" },
  };

  const filteredPages = pages.filter((page) => {
    const matchesTab = activeTab === "all" || page.status === activeTab;
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          page.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    all: pages.length,
    published: pages.filter(p => p.status === "published").length,
    draft: pages.filter(p => p.status === "draft").length,
    trash: pages.filter(p => p.status === "trash").length
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0621-\u064A-]/g, '')
      .substring(0, 100);
  };

  // Static pages that are React components — not DB-driven
  const staticPages = [
    { title: "الشروط والأحكام",   href: "/pages/terms",   slug: "terms"   },
    { title: "سياسة الخصوصية",    href: "/pages/privacy", slug: "privacy" },
    { title: "اتصل بنا",          href: "/pages/contact", slug: "contact" },
    { title: "من نحن",             href: "/pages/about",   slug: "about"   },
    { title: "الأسئلة الشائعة",    href: "/faq",           slug: "faq"     },
  ];

  return (
    <AdminLayout title="الصفحات">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <a href="/admin/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </a>
          <div>
            <h2 className="text-xl font-bold text-foreground">الصفحات</h2>
            <p className="text-muted-foreground text-sm mt-0.5">إدارة صفحات الموقع وتعديل محتواها</p>
          </div>
        </div>
        {/* ── Static Pages Info Banner ── */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <Lock className="h-4 w-4 shrink-0" />
            صفحات ثابتة — مدارة بالكود (لا تُعدَّل من هنا)
          </div>
          <p className="text-xs text-muted-foreground">
            الصفحات التالية مبنية مباشرة في كود الموقع وتظهر في الفوتر تلقائياً. إذا وجدت نسخة قديمة منها في القائمة أدناه، احذفها نهائياً.
          </p>
          <div className="flex flex-wrap gap-2">
            {staticPages.map(sp => (
              <a
                key={sp.slug}
                href={sp.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                data-testid={`link-static-page-${sp.slug}`}
              >
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                {sp.title}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
              <Input
                placeholder="بحث في الصفحات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-muted/50 border-border text-foreground pr-10"
                data-testid="input-search-pages"
              />
            </div>
          </div>
          <Button
            onClick={() => { resetForm(); setIsDialogOpen(true); }}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-add-page"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة صفحة
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 border border-border">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary">الكل ({counts.all})</TabsTrigger>
            <TabsTrigger value="published" className="data-[state=active]:bg-primary">منشور ({counts.published})</TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:bg-primary">مسودة ({counts.draft})</TabsTrigger>
            <TabsTrigger value="trash" className="data-[state=active]:bg-primary">سلة المهملات ({counts.trash})</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredPages.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد صفحات</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-right">العنوان</TableHead>
                    <TableHead className="text-muted-foreground text-right">الرابط</TableHead>
                    <TableHead className="text-muted-foreground text-right">الحالة</TableHead>
                    <TableHead className="text-muted-foreground text-right">التاريخ</TableHead>
                    <TableHead className="text-muted-foreground text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map((page) => (
                    <TableRow key={page.id} className="border-border/50 hover:bg-muted">
                      <TableCell className="text-foreground font-medium">{page.title}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">/{page.slug}</TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusLabels[page.status]?.class)}>
                          {statusLabels[page.status]?.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {page.createdAt ? new Date(page.createdAt).toLocaleDateString('ar-SA') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {page.status === "trash" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRestore(page)}
                                className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                title="استعادة"
                                data-testid={`button-restore-page-${page.id}`}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePermanentDelete(page)}
                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                title="حذف نهائي"
                                data-testid={`button-delete-page-${page.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(page)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="تعديل"
                                data-testid={`button-edit-page-${page.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMoveToTrash(page)}
                                className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
                                title="نقل للمهملات"
                                data-testid={`button-trash-page-${page.id}`}
                              >
                                <RotateCcw className="h-4 w-4 rotate-[135deg]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePermanentDelete(page)}
                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                title="حذف نهائي"
                                data-testid={`button-delete-page-${page.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {activeTab === "trash" && counts.trash > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            <span>سيتم حذف العناصر في سلة المهملات تلقائياً بعد 30 يوماً</span>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? "تعديل الصفحة" : "إضافة صفحة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>عنوان الصفحة</Label>
              <Input
                value={formData.title}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    title: e.target.value,
                    slug: editingPage ? formData.slug : generateSlug(e.target.value)
                  });
                }}
                placeholder="أدخل عنوان الصفحة"
                className="bg-muted/50 border-border"
                data-testid="input-page-title"
              />
            </div>
            <div className="space-y-2">
              <Label>الرابط (Slug)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="page-slug"
                className="bg-muted/50 border-border font-mono text-left"
                dir="ltr"
                data-testid="input-page-slug"
              />
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المحتوى</Label>
              <RichTextEditor
                content={formData.content}
                onChange={(v: string) => setFormData({ ...formData, content: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingPage ? "حفظ التغييرات" : "إضافة الصفحة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
