import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Folder } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { BlogCategory } from "@shared/schema";

const defaultForm = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
};

type FormData = typeof defaultForm;

export default function AdminBlogCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [], isLoading } = useQuery<BlogCategory[]>({
    queryKey: ["/api/admin/blog-categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/blog-categories");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/admin/blog-categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-categories"] });
      toast({ title: "تم إضافة التصنيف" });
      handleClose();
    },
    onError: () => toast({ title: "فشل الحفظ", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        isActive: data.isActive,
      };
      const res = await apiRequest("PUT", `/api/admin/blog-categories/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-categories"] });
      toast({ title: "تم تحديث التصنيف" });
      handleClose();
    },
    onError: () => toast({ title: "فشل التحديث", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/blog-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-categories"] });
      toast({ title: "تم حذف التصنيف" });
    },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData(defaultForm);
  };

  const handleEdit = (cat: BlogCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      isActive: cat.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const autoSlug = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\u0621-\u064Aa-z0-9-]/g, "");

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout title="تصنيفات المدونة">
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <a href="/admin/blog" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </a>
          <div>
            <h2 className="text-xl font-bold text-foreground">تصنيفات المدونة</h2>
            <p className="text-muted-foreground text-sm mt-0.5">إدارة تصنيفات وأقسام المدونة</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="h-11 px-6 gap-2"
            data-testid="button-add-blog-category"
          >
            <Plus className="h-4 w-4" />
            إضافة تصنيف
          </Button>
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              placeholder="بحث في التصنيفات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50 border-border pr-10"
              data-testid="input-search-blog-categories"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="text-center py-16">
              <Folder className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">لا توجد تصنيفات</h3>
              <p className="text-muted-foreground mb-6">أضف أول تصنيف للمدونة</p>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة تصنيف
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cat) => (
              <Card key={cat.id} className="bg-card border-border" data-testid={`card-blog-category-${cat.id}`}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Folder className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{cat.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{cat.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cat.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
                      {cat.isActive ? "مفعّل" : "معطّل"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-muted"
                      onClick={() => handleEdit(cat)}
                      data-testid={`button-edit-blog-category-${cat.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => {
                        if (confirm("هل أنت متأكد من حذف هذا التصنيف؟")) {
                          deleteMutation.mutate(cat.id);
                        }
                      }}
                      data-testid={`button-delete-blog-category-${cat.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsDialogOpen(true); }}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "تعديل التصنيف" : "إضافة تصنيف جديد"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>اسم التصنيف</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((p) => ({
                      ...p,
                      name,
                      slug: editingCategory ? p.slug : autoSlug(name),
                    }));
                  }}
                  placeholder="مثل: تقنية"
                  required
                  data-testid="input-blog-category-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>المعرف (Slug)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="مثل: technology"
                  required
                  dir="ltr"
                  data-testid="input-blog-category-slug"
                />
              </div>
              <div className="space-y-1.5">
                <Label>الوصف (اختياري)</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="وصف مختصر للتصنيف"
                  data-testid="input-blog-category-description"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>مفعّل</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) => setFormData((p) => ({ ...p, isActive: v }))}
                  data-testid="switch-blog-category-active"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "جارٍ الحفظ..." : editingCategory ? "تحديث" : "إضافة"}
                </Button>
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
