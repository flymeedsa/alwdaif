import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Folder, 
  Search,
  Building2,
  Shield,
  Briefcase,
  ClipboardCheck,
  GraduationCap,
  FileText,
  Users,
  Star,
  Award,
  Target,
  Zap,
  Heart,
  Globe,
  Landmark,
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Category } from "@shared/schema";
import { cn } from "@/lib/utils";

const iconOptions = [
  { value: "briefcase", label: "حقيبة عمل", Icon: Briefcase },
  { value: "shield", label: "درع عسكري", Icon: Shield },
  { value: "building", label: "مبنى شركة", Icon: Building2 },
  { value: "clipboard", label: "نتائج", Icon: ClipboardCheck },
  { value: "graduation", label: "تعليم", Icon: GraduationCap },
  { value: "file", label: "ملف", Icon: FileText },
  { value: "users", label: "مستخدمين", Icon: Users },
  { value: "star", label: "نجمة", Icon: Star },
  { value: "award", label: "جائزة", Icon: Award },
  { value: "target", label: "هدف", Icon: Target },
  { value: "zap", label: "برق", Icon: Zap },
  { value: "heart", label: "قلب", Icon: Heart },
  { value: "globe", label: "عالم", Icon: Globe },
  { value: "landmark", label: "حكومي", Icon: Landmark },
];

const colorOptions = [
  { value: "blue", label: "أزرق", class: "bg-blue-500" },
  { value: "green", label: "أخضر", class: "bg-green-500" },
  { value: "red", label: "أحمر", class: "bg-red-500" },
  { value: "purple", label: "بنفسجي", class: "bg-purple-500" },
  { value: "orange", label: "برتقالي", class: "bg-orange-500" },
  { value: "yellow", label: "أصفر", class: "bg-yellow-500" },
  { value: "pink", label: "وردي", class: "bg-pink-500" },
  { value: "teal", label: "أزرق مخضر", class: "bg-teal-500" },
];

const getIconComponent = (iconName: string | null) => {
  const found = iconOptions.find(i => i.value === iconName);
  return found ? found.Icon : Folder;
};

const getColorClass = (color: string | null) => {
  const found = colorOptions.find(c => c.value === color);
  return found ? found.class : "bg-primary";
};

const getCategoryUrl = (categoryName: string) => {
  const urlMap: Record<string, string> = {
    "وظائف مدنية": "/jobs/civil",
    "وظائف عسكرية": "/jobs/military",
    "وظائف شركات": "/jobs/companies",
    "نتائج التوظيف": "/jobs?category=results"
  };
  return urlMap[categoryName] || "/jobs";
};

export default function AdminCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    type: "job",
    icon: "briefcase",
    color: "blue",
    isActive: true,
    parentId: null as number | null,
    sortOrder: 0,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/admin/jobs"],
    queryFn: () => fetch("/api/admin/jobs", { credentials: "include" }).then(r => r.json()),
  });

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/admin/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "تم الإضافة", description: "تم إضافة التصنيف بنجاح" });
      resetForm();
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل إضافة التصنيف", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return apiRequest("PUT", `/api/admin/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "تم التحديث", description: "تم تحديث التصنيف بنجاح" });
      resetForm();
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل تحديث التصنيف", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "تم الحذف", description: "تم حذف التصنيف بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل حذف التصنيف", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", slug: "", description: "", type: "job", icon: "briefcase", color: "blue", isActive: true, parentId: null, sortOrder: 0 });
    setEditingCategory(null);
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      type: category.type,
      icon: category.icon || "briefcase",
      color: category.color || "blue",
      isActive: category.isActive ?? true,
      parentId: category.parentId ?? null,
      sortOrder: category.sortOrder ?? 0,
    });
    setIsOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsOpen(true);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const parentCategories = filteredCategories.filter(c => !c.parentId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const childCategories = filteredCategories.filter(c => c.parentId);

  return (
    <AdminLayout title="التصنيفات">
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-4">
          <Link href="/admin/jobs-hub">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">التصنيفات</h1>
            <p className="text-gray-500 dark:text-gray-400">إدارة تصنيفات وأقسام الوظائف</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Button onClick={handleAddNew} className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-foreground font-bold shadow-xl shadow-primary/20 gap-2 transition-all hover:shadow-primary/30 active:scale-[0.98] text-base rounded-xl" data-testid="button-add-category">
            <Plus className="h-5 w-5" />
            إضافة تصنيف
          </Button>
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              placeholder="بحث في التصنيفات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 bg-muted/50 border-border text-foreground pr-11 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-base rounded-xl"
              data-testid="input-search-categories"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-card border-border shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border/50 py-5 flex flex-row justify-between items-center">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                  <Briefcase className="h-6 w-6 text-primary" />
                  التصنيفات ({categories.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {parentCategories.length === 0 ? (
                  <p className="text-muted-foreground/70 text-center py-12 text-lg">لا توجد تصنيفات حالياً</p>
                ) : (
                  <div className="space-y-8">
                    {parentCategories.map((parent) => {
                      const parentChildren = childCategories.filter(c => c.parentId === parent.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
                      const hasChildren = parentChildren.length > 0;

                      return (
                        <div key={parent.id} className="space-y-4">
                          {/* Parent Category */}
                          <div className={cn(
                            "p-5 rounded-2xl border transition-all",
                            parent.isActive ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/50 opacity-60"
                          )}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-md", getColorClass(parent.color))}>
                                  {(() => {
                                    const IconComp = getIconComponent(parent.icon);
                                    return <IconComp className="h-6 w-6 text-foreground" />;
                                  })()}
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-foreground">{parent.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", parent.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                      {parent.isActive ? "رئيسي نشط" : "رئيسي معطل"}
                                    </span>
                                    {hasChildren && (
                                      <span className="text-xs text-muted-foreground">{parentChildren.length} فرعي</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <a href={getCategoryUrl(parent.name)} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 hover:bg-primary/10 h-9 w-9 rounded-xl flex items-center justify-center transition-colors" title="عرض في الموقع">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(parent)} className="text-muted-foreground/70 hover:text-foreground hover:bg-muted h-9 w-9 rounded-xl">
                                  <Pencil className="h-4.5 w-4.5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { if(confirm("هل أنت متأكد من حذف هذا التصنيف؟ سيتم حذف جميع الفروع أيضاً!")) deleteMutation.mutate(parent.id); }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 w-9 rounded-xl">
                                  <Trash2 className="h-4.5 w-4.5" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Child Categories */}
                          {hasChildren && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mr-6">
                              {parentChildren.map((child) => {
                                const ChildIcon = getIconComponent(child.icon);
                                return (
                                  <div
                                    key={child.id}
                                    className={cn(
                                      "group p-4 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-0.5",
                                      child.isActive ? "bg-muted/50 border-border hover:border-primary/30" : "bg-muted/30 border-border/50 opacity-50"
                                    )}
                                    data-testid={`category-${child.id}`}
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", getColorClass(child.color))}>
                                          <ChildIcon className="h-5 w-5 text-foreground" />
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-foreground text-base">{child.name}</h4>
                                          <span className="text-xs text-muted-foreground">فرعي</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-0.5">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(child)} className="text-muted-foreground/70 hover:text-foreground hover:bg-muted h-8 w-8 rounded-lg">
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => { if(confirm("هل أنت متأكد من حذف هذا التصنيف الفرعي؟")) deleteMutation.mutate(child.id); }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 rounded-lg">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", child.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                      {child.isActive ? "نشط" : "معطل"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Orphan children (no parent found) */}
                    {childCategories.filter(c => !parentCategories.find(p => p.id === c.parentId)).length > 0 && (
                      <div className="border-t border-border/50 pt-6">
                        <h3 className="text-lg font-bold text-foreground mb-4">تصنيفات غير مرتبطة</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {childCategories.filter(c => !parentCategories.find(p => p.id === c.parentId)).map((child) => {
                            const ChildIcon = getIconComponent(child.icon);
                            return (
                              <div key={child.id} className="p-4 rounded-xl border bg-muted/30 border-border/50 opacity-60">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", getColorClass(child.color))}>
                                      <ChildIcon className="h-5 w-5 text-foreground" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-foreground text-base">{child.name}</h4>
                                      <span className="text-xs text-muted-foreground">فرعي (بدون رئيسي)</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(child)} className="text-muted-foreground/70 hover:text-foreground hover:bg-muted h-8 w-8 rounded-lg">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => { if(confirm("هل أنت متأكد من حذف هذا التصنيف؟")) deleteMutation.mutate(child.id); }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 rounded-lg">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-card border-border text-foreground max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editingCategory ? "تعديل التصنيف" : "إضافة تصنيف جديد"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-base">اسم التصنيف</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11 bg-muted/50 border-border text-foreground rounded-xl"
                    placeholder="مثال: وظائف مدنية"
                    required
                    data-testid="input-category-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-base">الرابط (Slug)</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="h-11 bg-muted/50 border-border text-foreground text-left rounded-xl"
                    dir="ltr"
                    placeholder="civil-jobs"
                    required
                    data-testid="input-category-slug"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-base">النوع</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-11 bg-card border border-border text-foreground rounded-xl px-3 outline-none focus:border-primary/50 transition-colors"
                    data-testid="select-category-type"
                  >
                    <option value="job">وظائف</option>
                    <option value="result">نتائج توظيف</option>
                    <option value="blog">مقالات</option>
                    <option value="course">دورات</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-base">الحالة</Label>
                  <div className="flex items-center gap-3 h-11 bg-muted/50 border border-border/50 rounded-xl px-4">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      data-testid="switch-category-active"
                    />
                    <span className="text-muted-foreground font-medium">{formData.isActive ? "نشط" : "معطل"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-base">التصنيف</Label>
                  <select
                    value={formData.parentId === null ? "root" : String(formData.parentId)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, parentId: val === "root" ? null : parseInt(val) });
                    }}
                    className="w-full h-11 bg-card border border-border text-foreground rounded-xl px-3 outline-none focus:border-primary/50 transition-colors"
                    data-testid="select-category-parent"
                  >
                    <option value="root">رئيسي</option>
                    {categories.filter(c => !c.parentId).map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-base">الترتيب</Label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="h-11 bg-muted/50 border-border text-foreground rounded-xl"
                    min={0}
                    data-testid="input-category-sort"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground text-base">الأيقونة</Label>
                <div className="grid grid-cols-7 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: icon.value })}
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                        formData.icon === icon.value 
                          ? "bg-primary text-foreground shadow-lg shadow-primary/20" 
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      title={icon.label}
                    >
                      <icon.Icon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground text-base">اللون</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={cn(
                        "w-9 h-9 rounded-full transition-all border-2",
                        color.class,
                        formData.color === color.value 
                          ? "border-white scale-110 shadow-lg" 
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="outline" onClick={resetForm} className="h-12 px-6 border-border text-foreground hover:bg-muted rounded-xl">
                  إلغاء
                </Button>
                <Button type="submit" className="h-12 px-8 bg-primary hover:bg-primary/90 text-foreground font-bold rounded-xl shadow-lg shadow-primary/20" data-testid="button-submit-category">
                  {editingCategory ? "تحديث التصنيف" : "حفظ التصنيف"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
