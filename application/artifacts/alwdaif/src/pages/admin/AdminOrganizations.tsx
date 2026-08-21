import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Building2, Briefcase, ExternalLink, Search, Tag } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MediaPicker from "@/components/admin/MediaPicker";
import type { Organization, OrganizationType } from "@shared/schema";

const colorOptions = [
  { value: "blue",   label: "أزرق",   bg: "bg-blue-500/20",   text: "text-blue-400" },
  { value: "red",    label: "أحمر",   bg: "bg-red-500/20",    text: "text-red-400" },
  { value: "green",  label: "أخضر",   bg: "bg-green-500/20",  text: "text-green-400" },
  { value: "yellow", label: "أصفر",   bg: "bg-yellow-500/20", text: "text-yellow-400" },
  { value: "purple", label: "بنفسجي", bg: "bg-purple-500/20", text: "text-purple-400" },
  { value: "orange", label: "برتقالي",bg: "bg-orange-500/20", text: "text-orange-400" },
];

function getColorClasses(color: string | null | undefined) {
  const c = colorOptions.find(o => o.value === color);
  return c ? { bg: c.bg, text: c.text } : { bg: "bg-muted", text: "text-muted-foreground" };
}

export default function AdminOrganizations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ─── Organization state ───────────────────────────────────────
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(21);
  const [orgForm, setOrgForm] = useState({ name: "", logo: "", type: "", description: "", website: "" });

  // ─── Org-type state ────────────────────────────────────────────
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<OrganizationType | null>(null);
  const [typeForm, setTypeForm] = useState({ label: "", value: "", color: "blue", sortOrder: 0 });

  // ─── Queries ───────────────────────────────────────────────────
  const { data: organizations = [], isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
    queryFn: () => fetch("/api/admin/organizations", { credentials: "include" }).then(r => r.json()),
  });

  const { data: orgTypes = [] } = useQuery<OrganizationType[]>({
    queryKey: ["/api/admin/organization-types"],
    queryFn: () => fetch("/api/admin/organization-types", { credentials: "include" }).then(r => r.json()),
  });

  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/jobs"],
    queryFn: () => fetch("/api/admin/jobs", { credentials: "include" }).then(r => r.json()),
  });

  // ─── Helpers ───────────────────────────────────────────────────
  const getJobCount = (orgName: string) =>
    (jobs as any[]).filter((j: any) => j.company === orgName || j.organization?.name === orgName).length;

  const getTypeLabel = (value: string) => {
    const found = orgTypes.find(t => t.value === value);
    if (found) return found.label;
    if (value === "government") return "حكومية";
    if (value === "military") return "عسكرية";
    if (value === "company") return "شركة";
    return value;
  };

  const getTypeColor = (value: string) => {
    const found = orgTypes.find(t => t.value === value);
    if (found) return getColorClasses(found.color);
    if (value === "government") return { bg: "bg-blue-500/20", text: "text-blue-400" };
    if (value === "military")   return { bg: "bg-red-500/20",  text: "text-red-400" };
    if (value === "company")    return { bg: "bg-green-500/20",text: "text-green-400" };
    return { bg: "bg-muted", text: "text-muted-foreground" };
  };

  const defaultOrgType = orgTypes.length > 0 ? orgTypes[0].value : "government";

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const visibleOrganizations = filteredOrganizations.slice(0, visibleCount);
  const hasMore = visibleCount < filteredOrganizations.length;

  // ─── Organization mutations ────────────────────────────────────
  const createOrgMutation = useMutation({
    mutationFn: async (data: typeof orgForm) => {
      const r = await fetch("/api/admin/organizations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), credentials: "include",
      });
      if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b.message || "فشل"); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setIsDialogOpen(false); resetOrgForm();
      toast({ title: "تمت الإضافة", description: "تم إضافة الجهة بنجاح" });
    },
    onError: (err: any) => toast({ title: "الجهة موجودة", description: err?.message || "فشل", variant: "destructive" }),
  });

  const updateOrgMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof orgForm }) => {
      const r = await fetch(`/api/admin/organizations/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), credentials: "include",
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setIsDialogOpen(false); setEditingOrg(null); resetOrgForm();
      toast({ title: "تم التحديث", description: "تم تحديث الجهة بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في تحديث الجهة", variant: "destructive" }),
  });

  const deleteOrgMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/organizations/${id}`, { method: "DELETE", credentials: "include" })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({ title: "تم الحذف", description: "تم حذف الجهة بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في حذف الجهة", variant: "destructive" }),
  });

  const resetOrgForm = () => setOrgForm({ name: "", logo: "", type: defaultOrgType, description: "", website: "" });

  const handleEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setOrgForm({ name: org.name, logo: org.logo || "", type: org.type, description: org.description || "", website: org.website || "" });
    setIsDialogOpen(true);
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...orgForm, type: orgForm.type || defaultOrgType };
    if (editingOrg) updateOrgMutation.mutate({ id: editingOrg.id, data });
    else createOrgMutation.mutate(data);
  };

  // ─── Org-type mutations ────────────────────────────────────────
  const createTypeMutation = useMutation({
    mutationFn: async (data: typeof typeForm) => {
      const r = await fetch("/api/admin/organization-types", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), credentials: "include",
      });
      if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b.message || "فشل"); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organization-types"] });
      setIsTypeDialogOpen(false); resetTypeForm();
      toast({ title: "تمت الإضافة", description: "تم إضافة التصنيف بنجاح" });
    },
    onError: (err: any) => toast({ title: "التصنيف موجود", description: err?.message || "فشل", variant: "destructive" }),
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof typeForm }) => {
      const r = await fetch(`/api/admin/organization-types/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), credentials: "include",
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organization-types"] });
      setIsTypeDialogOpen(false); setEditingType(null); resetTypeForm();
      toast({ title: "تم التحديث", description: "تم تحديث التصنيف بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في تحديث التصنيف", variant: "destructive" }),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/organization-types/${id}`, { method: "DELETE", credentials: "include" })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organization-types"] });
      toast({ title: "تم الحذف", description: "تم حذف التصنيف بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في حذف التصنيف", variant: "destructive" }),
  });

  const resetTypeForm = () => setTypeForm({ label: "", value: "", color: "blue", sortOrder: 0 });

  const handleEditType = (t: OrganizationType) => {
    setEditingType(t);
    setTypeForm({ label: t.label, value: t.value, color: t.color || "blue", sortOrder: t.sortOrder || 0 });
    setIsTypeDialogOpen(true);
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingType) updateTypeMutation.mutate({ id: editingType.id, data: typeForm });
    else createTypeMutation.mutate(typeForm);
  };

  // ─── Org type select options (merge DB types with legacy fallback) ─
  const typeSelectOptions = orgTypes.length > 0 ? orgTypes : [
    { id: 0, value: "government", label: "حكومية", color: "blue", sortOrder: 0, createdAt: new Date() },
    { id: 0, value: "military",   label: "عسكرية",  color: "red",  sortOrder: 1, createdAt: new Date() },
    { id: 0, value: "company",    label: "شركة",    color: "green",sortOrder: 2, createdAt: new Date() },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6" dir="rtl">
        <Tabs defaultValue="organizations">
          <div className="flex flex-col sm:flex-row gap-4 justify-end items-start sm:items-center mb-2">
            <TabsList className="rounded-xl">
              <TabsTrigger value="organizations" className="rounded-lg gap-2" data-testid="tab-organizations">
                <Building2 className="h-4 w-4" />
                الجهات
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-md">{organizations.length}</span>
              </TabsTrigger>
              <TabsTrigger value="types" className="rounded-lg gap-2" data-testid="tab-org-types">
                <Tag className="h-4 w-4" />
                التصنيفات
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-md">{orgTypes.length}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ─── Organizations Tab ─────────────────────────────── */}
          <TabsContent value="organizations" className="space-y-6 mt-4">
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-center">
              <div className="flex items-center gap-4 shrink-0">
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) { setEditingOrg(null); resetOrgForm(); }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      className="h-12 px-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold shadow-xl shadow-primary/20 gap-2 transition-all hover:shadow-primary/30 active:scale-[0.98] text-base rounded-xl border-t-[#fafafa] border-r-[#fafafa] border-b-[#fafafa] border-l-[#fafafa]"
                      data-testid="button-add-organization"
                    >
                      <Plus className="h-5 w-5" />
                      إضافة جهة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg rounded-2xl" dir="rtl" aria-describedby={undefined}>
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">{editingOrg ? "تعديل الجهة" : "إضافة جهة جديدة"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleOrgSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base">اسم الجهة *</Label>
                        <Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} required className="h-11 text-base rounded-xl" data-testid="input-org-name" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base">التصنيف *</Label>
                        <Select value={orgForm.type || defaultOrgType} onValueChange={(v) => setOrgForm({ ...orgForm, type: v })}>
                          <SelectTrigger className="h-11 text-base rounded-xl" data-testid="select-org-type">
                            <SelectValue placeholder="اختر التصنيف" />
                          </SelectTrigger>
                          <SelectContent>
                            {typeSelectOptions.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base">شعار الجهة</Label>
                        <MediaPicker value={orgForm.logo} onChange={(url) => setOrgForm({ ...orgForm, logo: url })} placeholder="اختر شعار الجهة" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base">الموقع الإلكتروني</Label>
                        <Input value={orgForm.website} onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })} placeholder="https://..." className="h-11 text-base rounded-xl" data-testid="input-org-website" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base">الوصف</Label>
                        <Textarea value={orgForm.description} onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })} rows={3} className="text-base rounded-xl" data-testid="input-org-description" />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11 px-6 text-base rounded-xl">إلغاء</Button>
                        <Button type="submit" disabled={createOrgMutation.isPending || updateOrgMutation.isPending} className="h-11 px-8 bg-primary hover:bg-primary/90 font-bold text-base rounded-xl text-[#ffffff]" data-testid="button-submit-org">
                          {editingOrg ? "تحديث" : "إضافة"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="relative flex-1 max-w-md w-full mx-auto">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                <Input
                  placeholder="بحث في الجهات..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(21); }}
                  className="h-12 bg-muted/50 border-border text-foreground pr-11 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-base rounded-xl"
                  data-testid="input-search-organizations"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredOrganizations.length === 0 ? (
              <div className="text-center py-20">
                <Building2 className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground/70 text-xl">لا توجد جهات مطابقة للبحث</p>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
                {visibleOrganizations.map((org) => {
                  const { bg, text } = getTypeColor(org.type);
                  return (
                    <Card key={org.id} className="bg-card border-border hover:border-primary/30 transition-all" data-testid={`card-org-${org.id}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-muted/50 border border-border flex items-center justify-center overflow-hidden">
                              {org.logo ? (
                                <img src={org.logo} alt="" className="w-full h-full object-contain p-2" />
                              ) : (
                                <Building2 className="h-7 w-7 text-primary" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-foreground">{org.name}</h3>
                              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${bg} ${text}`}>
                                {getTypeLabel(org.type)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-base text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-5 w-5" />
                            <span>{getJobCount(org.name)} وظيفة</span>
                          </div>
                          {org.website && (
                            <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                              <ExternalLink className="h-4 w-4" />
                              <span>الموقع</span>
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="flex-1 border-border" onClick={() => handleEditOrg(org)} data-testid={`button-edit-org-${org.id}`}>
                            <Pencil className="h-4 w-4 ml-1" />
                            تعديل
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => { if (confirm("هل أنت متأكد من حذف هذه الجهة؟")) deleteOrgMutation.mutate(org.id); }}
                            data-testid={`button-delete-org-${org.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {hasMore && (
                <div className="flex items-center justify-center gap-3 mt-6" dir="rtl">
                  <span className="text-sm text-muted-foreground">
                    يُعرض {visibleOrganizations.length} من {filteredOrganizations.length} جهة
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(v => v + 21)}
                    className="h-10 px-6 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
                    data-testid="button-load-more-orgs"
                  >
                    عرض المزيد
                  </Button>
                </div>
              )}
              </>
            )}
          </TabsContent>

          {/* ─── Types Tab ─────────────────────────────────────── */}
          <TabsContent value="types" className="space-y-6 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                التصنيفات تُستخدم لتصنيف الجهات عند الإضافة والبحث. يمكن إضافة تصنيفات مخصصة بأي اسم ولون.
              </p>
              <Dialog open={isTypeDialogOpen} onOpenChange={(open) => {
                setIsTypeDialogOpen(open);
                if (!open) { setEditingType(null); resetTypeForm(); }
              }}>
                <DialogTrigger asChild>
                  <Button
                    className="h-10 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold shadow-lg shadow-primary/20 gap-2 transition-all rounded-xl shrink-0"
                    data-testid="button-add-org-type"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة تصنيف
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl" dir="rtl" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{editingType ? "تعديل التصنيف" : "إضافة تصنيف جديد"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleTypeSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base">الاسم بالعربية *</Label>
                      <Input
                        value={typeForm.label}
                        onChange={(e) => setTypeForm({ ...typeForm, label: e.target.value })}
                        required placeholder="مثال: حكومية"
                        className="h-11 text-base rounded-xl"
                        data-testid="input-type-label"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base">المعرّف (بالإنجليزية) *</Label>
                      <Input
                        value={typeForm.value}
                        onChange={(e) => setTypeForm({ ...typeForm, value: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                        required placeholder="مثال: government"
                        className="h-11 text-base rounded-xl ltr"
                        dir="ltr"
                        disabled={!!editingType}
                        data-testid="input-type-value"
                      />
                      {!editingType && <p className="text-xs text-muted-foreground">يُستخدم داخلياً ولا يمكن تغييره لاحقاً</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base">اللون</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {colorOptions.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setTypeForm({ ...typeForm, color: c.value })}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm font-medium ${typeForm.color === c.value ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/30"} ${c.bg} ${c.text}`}
                            data-testid={`color-option-${c.value}`}
                          >
                            <span className={`w-3 h-3 rounded-full ${c.bg.replace("/20", "")} border ${c.text.replace("text-", "border-")}`} />
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base">ترتيب العرض</Label>
                      <Input
                        type="number" min={0}
                        value={typeForm.sortOrder}
                        onChange={(e) => setTypeForm({ ...typeForm, sortOrder: parseInt(e.target.value) || 0 })}
                        className="h-11 text-base rounded-xl w-28"
                        data-testid="input-type-sort-order"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setIsTypeDialogOpen(false)} className="h-11 px-6 text-base rounded-xl">إلغاء</Button>
                      <Button type="submit" disabled={createTypeMutation.isPending || updateTypeMutation.isPending} className="h-11 px-8 bg-primary hover:bg-primary/90 font-bold text-base rounded-xl text-white" data-testid="button-submit-type">
                        {editingType ? "تحديث" : "إضافة"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {orgTypes.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
                <Tag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-lg mb-1">لا توجد تصنيفات بعد</p>
                <p className="text-muted-foreground/60 text-sm">أضف تصنيفاً جديداً لتصنيف الجهات</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {orgTypes.map((t) => {
                  const { bg, text } = getColorClasses(t.color);
                  const orgCount = organizations.filter(o => o.type === t.value).length;
                  return (
                    <Card key={t.id} className="bg-card border-border hover:border-primary/30 transition-all" data-testid={`card-org-type-${t.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${bg} ${text}`}>
                              {t.label}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded-lg" dir="ltr">{t.value}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground ml-2">{orgCount} جهة</span>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" onClick={() => handleEditType(t)} data-testid={`button-edit-type-${t.id}`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-500/10 text-red-400"
                              onClick={() => { if (confirm(`حذف تصنيف "${t.label}"؟`)) deleteTypeMutation.mutate(t.id); }}
                              data-testid={`button-delete-type-${t.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
