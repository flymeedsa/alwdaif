import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users, Shield, UserCheck, UserX, Eye, EyeOff, KeyRound, AtSign } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Admin } from "@shared/schema";

export default function AdminAdmins() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    name: "",
    username: "",
    email: "",
    password: "",
    role: "editor",
    isActive: true,
  });

  const { data: admins = [], isLoading } = useQuery<Admin[]>({
    queryKey: ["/api/admin/admins"],
    queryFn: async () => {
      const r = await fetch("/api/admin/admins", { credentials: "include" });
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const handleResponse = async (r: Response) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || "حدث خطأ");
    return data;
  };

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      }).then(handleResponse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "تمت الإضافة", description: "تم إضافة المشرف بنجاح ويمكنه الآن تسجيل الدخول" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      fetch(`/api/admin/admins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      }).then(handleResponse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      setIsDialogOpen(false);
      setEditingAdmin(null);
      resetForm();
      toast({ title: "تم التحديث", description: "تم تحديث بيانات المشرف بنجاح" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/admins/${id}`, { method: "DELETE", credentials: "include" })
        .then(r => { if (!r.ok) throw new Error("فشل في الحذف"); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: "تم الحذف", description: "تم حذف المشرف بنجاح" });
    },
    onError: (e: Error) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({ userId: "", name: "", username: "", email: "", password: "", role: "editor", isActive: true });
    setShowPassword(false);
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      userId: admin.userId,
      name: admin.name,
      username: (admin as any).username || "",
      email: admin.email || "",
      password: "",
      role: admin.role,
      isActive: admin.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...formData };
    if (!payload.password) delete payload.password;
    if (editingAdmin) updateMutation.mutate({ id: editingAdmin.id, data: payload });
    else createMutation.mutate(payload);
  };

  const roles = [
    { value: "super_admin", label: "مشرف عام", color: "text-red-500" },
    { value: "admin",       label: "مشرف",     color: "text-orange-500" },
    { value: "editor",      label: "محرر",      color: "text-blue-500" },
    { value: "moderator",   label: "مراقب",     color: "text-green-500" },
  ];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout title="الموظفين">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <a href="/admin/staff" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </a>
          <div>
            <h2 className="text-xl font-bold text-foreground">إدارة الموظفين</h2>
            <p className="text-muted-foreground text-sm mt-0.5">أضف موظفين جدد وامنحهم صلاحيات تسجيل الدخول</p>
          </div>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) { setEditingAdmin(null); resetForm(); }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 font-bold" data-testid="button-add-admin">
                <Plus className="h-4 w-4" />
                إضافة مشرف
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  {editingAdmin ? "تعديل بيانات المشرف" : "إضافة مشرف جديد"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label>الاسم الكامل *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="محمد العمري"
                    required
                    data-testid="input-admin-name"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <Label>اسم المستخدم *</Label>
                  <div className="relative">
                    <AtSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/\s/g, "") })}
                      placeholder="mohammed123"
                      className="pr-9"
                      dir="ltr"
                      required
                      data-testid="input-admin-username"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">يُستخدم لتسجيل الدخول (بدون مسافات)</p>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@example.com"
                    dir="ltr"
                    data-testid="input-admin-email"
                  />
                  <p className="text-xs text-muted-foreground">يمكن أيضاً تسجيل الدخول بالبريد الإلكتروني</p>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label>
                    كلمة المرور {editingAdmin ? "(اتركها فارغة للإبقاء على القديمة)" : "*"}
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingAdmin ? "••••••••" : "أدخل كلمة مرور قوية"}
                      className="pr-9 pl-10"
                      dir="ltr"
                      required={!editingAdmin}
                      minLength={editingAdmin && !formData.password ? undefined : 6}
                      data-testid="input-admin-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {!editingAdmin && <p className="text-xs text-muted-foreground">6 أحرف على الأقل</p>}
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <Label>الدور الوظيفي</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                    <SelectTrigger data-testid="select-admin-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* User ID (hidden for normal use, shown for power users) */}
                <div className="space-y-1.5">
                  <Label>معرّف المستخدم (اختياري)</Label>
                  <Input
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    placeholder="يُولَّد تلقائياً إذا تُرك فارغاً"
                    dir="ltr"
                    data-testid="input-admin-userid"
                  />
                  <p className="text-xs text-muted-foreground">اتركه فارغاً وسيُولَّد رقم تلقائياً</p>
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
                  <div>
                    <Label className="text-base">الحساب مفعّل</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">يستطيع المشرف تسجيل الدخول عند التفعيل</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                    data-testid="switch-admin-active"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="h-11 px-6"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="h-11 px-8 font-bold"
                    data-testid="button-submit-admin"
                  >
                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        جاري الحفظ...
                      </div>
                    ) : editingAdmin ? "تحديث البيانات" : "إضافة المشرف"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-24">
            <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-xl">لا يوجد مشرفون بعد</p>
            <p className="text-muted-foreground/60 text-sm mt-1">أضف أول مشرف باستخدام الزر أعلاه</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {admins.map((admin) => {
              const role = roles.find((r) => r.value === admin.role);
              const hasLogin = !!(admin as any).password;
              return (
                <Card key={admin.id} className="bg-card border-border hover:border-primary/30 transition-all">
                  <CardContent className="p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          admin.isActive ? "bg-primary/15" : "bg-muted/50"
                        )}>
                          {admin.isActive
                            ? <UserCheck className="h-6 w-6 text-primary" />
                            : <UserX className="h-6 w-6 text-muted-foreground/50" />}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-foreground">{admin.name}</h3>
                          {(admin as any).username && (
                            <p className="text-sm text-muted-foreground">@{(admin as any).username}</p>
                          )}
                          {admin.email && (
                            <p className="text-xs text-muted-foreground/70">{admin.email}</p>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        "flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-muted/50 font-medium",
                        role?.color
                      )}>
                        <Shield className="h-3.5 w-3.5" />
                        {role?.label}
                      </span>
                    </div>

                    {/* Info row */}
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          hasLogin
                            ? "bg-green-500/10 text-green-600"
                            : "bg-orange-500/10 text-orange-600"
                        )}>
                          <KeyRound className="h-3 w-3" />
                          {hasLogin ? "يملك كلمة مرور" : "بدون كلمة مرور"}
                        </span>
                      </div>
                      <span className={cn(
                        "font-medium text-xs",
                        admin.isActive ? "text-green-600" : "text-red-500"
                      )}>
                        {admin.isActive ? "● مفعّل" : "● معطّل"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-border"
                        onClick={() => handleEdit(admin)}
                        data-testid={`button-edit-admin-${admin.id}`}
                      >
                        <Pencil className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                        onClick={() => { if (confirm(`حذف المشرف "${admin.name}"؟`)) deleteMutation.mutate(admin.id); }}
                        data-testid={`button-delete-admin-${admin.id}`}
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
    </AdminLayout>
  );
}
