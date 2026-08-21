import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  FileText, 
  Send, 
  UserCheck, 
  Briefcase, 
  Linkedin, 
  Layers,
  Eye,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Star,
  GripVertical
} from "lucide-react";
import { Link } from "wouter";

const ICON_OPTIONS = [
  { value: "FileText", label: "مستند", icon: FileText },
  { value: "Send", label: "إرسال", icon: Send },
  { value: "UserCheck", label: "مستخدم", icon: UserCheck },
  { value: "Briefcase", label: "حقيبة", icon: Briefcase },
  { value: "Linkedin", label: "لينكد إن", icon: Linkedin },
  { value: "Layers", label: "طبقات", icon: Layers },
  { value: "Package", label: "باقة", icon: Package },
];

const COLOR_OPTIONS = [
  { value: "from-blue-500 to-cyan-400", label: "أزرق سماوي" },
  { value: "from-green-500 to-emerald-400", label: "أخضر" },
  { value: "from-purple-500 to-indigo-400", label: "بنفسجي" },
  { value: "from-orange-500 to-yellow-400", label: "برتقالي" },
  { value: "from-blue-600 to-blue-400", label: "أزرق" },
  { value: "from-red-500 to-rose-400", label: "أحمر" },
  { value: "from-pink-500 to-rose-400", label: "وردي" },
  { value: "from-teal-500 to-cyan-400", label: "تركوازي" },
];

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    FileText, Send, UserCheck, Briefcase, Linkedin, Layers, Package
  };
  return iconMap[iconName] || Package;
};

interface ServiceVariant {
  name: string;
  price: number;
}

export default function AdminServices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<any>(null);

  const [categoryTab, setCategoryTab] = useState<"all" | "individual" | "packages">("all");

  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    description: "",
    icon: "Package",
    color: "from-blue-500 to-cyan-400",
    price: 0,
    oldPrice: 0,
    discount: "",
    variants: [] as ServiceVariant[],
    category: "individual",
    isFeatured: false,
    isActive: true,
    sortOrder: 0,
  });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["/api/admin/services"],
    queryFn: async () => {
      const res = await fetch("/api/admin/services", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          variants: data.variants.length > 0 ? JSON.stringify(data.variants) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create service");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تمت الإضافة", description: "تمت إضافة الخدمة بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في إضافة الخدمة", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          variants: data.variants.length > 0 ? JSON.stringify(data.variants) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update service");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم التحديث", description: "تم تحديث الخدمة بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تحديث الخدمة", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete service");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم الحذف", description: "تم حذف الخدمة بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حذف الخدمة", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      slug: "",
      title: "",
      description: "",
      icon: "Package",
      color: "from-blue-500 to-cyan-400",
      price: 0,
      oldPrice: 0,
      discount: "",
      variants: [],
      category: "individual",
      isFeatured: false,
      isActive: true,
      sortOrder: 0,
    });
    setEditingService(null);
  };

  const handleAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (service: any) => {
    let variants: ServiceVariant[] = [];
    try {
      if (service.variants) {
        variants = typeof service.variants === "string" ? JSON.parse(service.variants) : service.variants;
      }
    } catch (e) {
      variants = [];
    }

    setFormData({
      slug: service.slug || "",
      title: service.title || "",
      description: service.description || "",
      icon: service.icon || "Package",
      color: service.color || "from-blue-500 to-cyan-400",
      price: service.price || 0,
      oldPrice: service.oldPrice || 0,
      discount: service.discount || "",
      variants,
      category: service.category || "individual",
      isFeatured: service.isFeatured || false,
      isActive: service.isActive ?? true,
      sortOrder: service.sortOrder || 0,
    });
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleDelete = (service: any) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.slug) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: "", price: 0 }],
    });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  return (
    <AdminLayout title="الخدمات">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/store">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </button>
          </Link>
          <div>
            <h2 className="text-xl font-bold text-foreground">إدارة الخدمات</h2>
            <p className="text-muted-foreground text-sm mt-1">إضافة وتعديل وحذف خدمات الموقع</p>
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Category tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border">
            {([
              { key: "all", label: "الكل" },
              { key: "individual", label: "خدمات فردية" },
              { key: "packages", label: "باقات ورصيد" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCategoryTab(key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  categoryTab === key
                    ? "bg-background text-primary shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                <span className="mr-1.5 text-xs opacity-60">
                  ({services.filter((s: any) => key === "all" || (s.category || "individual") === key).length})
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/store/services" target="_blank">
              <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                <ExternalLink className="h-4 w-4 ml-2" />
                عرض الصفحة
              </Button>
            </Link>
            <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 ml-2" />
              إضافة خدمة
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : services.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="text-center py-16">
              <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">لا توجد خدمات</h3>
              <p className="text-muted-foreground mb-6">أضف خدماتك الأولى للعملاء</p>
              <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 ml-2" />
                إضافة خدمة
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.filter((s: any) => categoryTab === "all" || (s.category || "individual") === categoryTab).map((service: any) => {
              const Icon = getIconComponent(service.icon);
              let variants: ServiceVariant[] = [];
              try {
                if (service.variants) {
                  variants = typeof service.variants === "string" ? JSON.parse(service.variants) : service.variants;
                }
              } catch (e) {
                variants = [];
              }

              return (
                <Card 
                  key={service.id} 
                  className={`bg-card border-border overflow-hidden relative ${service.isFeatured ? 'ring-2 ring-primary/50' : ''}`}
                >
                  {service.isFeatured && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-primary text-foreground text-[10px]">
                        <Star className="h-3 w-3 ml-1" />
                        الأكثر طلباً
                      </Badge>
                    </div>
                  )}
                  
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${service.color || 'from-blue-500 to-cyan-400'} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}></div>
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color || 'from-blue-500 to-cyan-400'} flex items-center justify-center text-foreground shadow-lg`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-foreground">{service.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant={service.isActive ? "default" : "secondary"} className={service.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                            {service.isActive ? "مفعّل" : "معطّل"}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            {(service.category || "individual") === "packages" ? "باقات ورصيد" : "خدمة فردية"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                      <div className="text-muted-foreground text-sm font-medium mb-2">الأسعار:</div>
                      {variants.length > 0 ? (
                        variants.map((v, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{v.name}</span>
                            <span className="text-primary font-bold">{v.price} ريال</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">السعر</span>
                          <div className="flex items-center gap-2">
                            {service.oldPrice && service.oldPrice > 0 && (
                              <span className="text-red-400 line-through text-xs">{service.oldPrice} ريال</span>
                            )}
                            <span className="text-primary font-bold">{service.price} ريال</span>
                            {service.discount && (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">خصم {service.discount}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <Link href={`/store/services/${service.slug}`} target="_blank" className="flex-1">
                        <Button variant="outline" className="w-full border-border text-foreground hover:bg-muted" size="sm">
                          <Eye className="h-4 w-4 ml-2" />
                          معاينة
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleEdit(service)}
                        className="border-border text-foreground hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleDelete(service)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">العنوان *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="تصميم سيرة ذاتية"
                  className="bg-muted/50 border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">الرابط (slug) *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="cv"
                  className="bg-muted/50 border-border text-foreground"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مختصر للخدمة..."
                className="bg-muted/50 border-border text-foreground min-h-[80px]"
              />
            </div>

            {/* Category selector */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">قسم الخدمة *</Label>
              <div className="flex gap-3">
                {[
                  { value: "individual", label: "خدمة فردية", desc: "تظهر في تبويب الخدمات الفردية" },
                  { value: "packages", label: "باقات ورصيد", desc: "تظهر في تبويب الباقات والرصيد" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: opt.value })}
                    className={`flex-1 text-right p-3 rounded-xl border-2 transition-all ${
                      formData.category === opt.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <p className="font-bold text-sm">{opt.label}</p>
                    <p className="text-xs mt-0.5 opacity-70">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">الأيقونة</Label>
                <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                  <SelectTrigger className="bg-muted/50 border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {ICON_OPTIONS.map((opt) => {
                      const IconComp = opt.icon;
                      return (
                        <SelectItem key={opt.value} value={opt.value} className="text-foreground hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <IconComp className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">اللون</Label>
                <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                  <SelectTrigger className="bg-muted/50 border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {COLOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-foreground hover:bg-muted">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded bg-gradient-to-r ${opt.value}`}></div>
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-bold">خيارات الأسعار</Label>
                <Button type="button" variant="outline" size="sm" onClick={addVariant} className="border-border text-foreground hover:bg-muted">
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة خيار
                </Button>
              </div>

              {formData.variants.length === 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">السعر</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      className="bg-muted/50 border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">السعر القديم</Label>
                    <Input
                      type="number"
                      value={formData.oldPrice}
                      onChange={(e) => setFormData({ ...formData, oldPrice: parseInt(e.target.value) || 0 })}
                      className="bg-muted/50 border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">نسبة الخصم</Label>
                    <Input
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      placeholder="15%"
                      className="bg-muted/50 border-border text-foreground"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.variants.map((variant, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                      <Input
                        value={variant.name}
                        onChange={(e) => updateVariant(idx, "name", e.target.value)}
                        placeholder="اسم الخيار"
                        className="flex-1 bg-muted/50 border-border text-foreground"
                      />
                      <Input
                        type="number"
                        value={variant.price}
                        onChange={(e) => updateVariant(idx, "price", parseInt(e.target.value) || 0)}
                        placeholder="السعر"
                        className="w-24 bg-muted/50 border-border text-foreground"
                      />
                      <span className="text-muted-foreground text-sm">ريال</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariant(idx)}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-muted-foreground/70 text-xs">عند استخدام خيارات متعددة، يتم تجاهل السعر الأساسي</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <Label className="text-foreground">خدمة مميزة (الأكثر طلباً)</Label>
                <Switch
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <Label className="text-foreground">مفعّل</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">ترتيب العرض</Label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="bg-muted/50 border-border text-foreground w-32"
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {(createMutation.isPending || updateMutation.isPending) ? "جاري الحفظ..." : (editingService ? "تحديث الخدمة" : "إضافة الخدمة")}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border text-foreground hover:bg-muted">
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              هل أنت متأكد من حذف خدمة "{serviceToDelete?.title}"؟
            </p>
            <p className="text-red-400 text-sm mt-2">هذا الإجراء لا يمكن التراجع عنه.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => serviceToDelete && deleteMutation.mutate(serviceToDelete.id)}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف الخدمة"}
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-border text-foreground hover:bg-muted">
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
