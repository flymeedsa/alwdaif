import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/adminAuth";
import {
  Shield, ShieldCheck, ShieldX, Save, User,
  LayoutDashboard, Briefcase, ShoppingCart, MessageSquare,
  FileText, Users, Settings, Eye, Plus, Pencil, Trash2,
  SendHorizonal, CheckCheck, X, Zap, Lock, ChevronRight,
  Search, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Admin } from "@shared/schema";
import { Input } from "@/components/ui/input";

// ─── Types ─────────────────────────────────────────────────────────────────
type ActionKey = "view" | "create" | "edit" | "delete" | "publish";
type ModuleKey = "dashboard" | "jobs" | "store" | "community" | "blog" | "members" | "staff" | "settings";
type ModulePerms = Partial<Record<ActionKey, boolean>>;
type PermissionsMap = Partial<Record<ModuleKey, ModulePerms>>;

// ─── Module definitions ─────────────────────────────────────────────────────
const MODULES: {
  key: ModuleKey;
  label: string;
  icon: React.ElementType;
  actions: ActionKey[];
  color: string;
  bg: string;
}[] = [
  { key: "dashboard", label: "نظرة عامة",  icon: LayoutDashboard, actions: ["view"],                              color: "text-sky-500",    bg: "bg-sky-500/10" },
  { key: "jobs",      label: "الوظائف",    icon: Briefcase,       actions: ["view","create","edit","delete"],     color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { key: "store",     label: "المتجر",     icon: ShoppingCart,    actions: ["view","create","edit","delete"],     color: "text-emerald-500",bg: "bg-emerald-500/10" },
  { key: "community", label: "المجتمع",    icon: MessageSquare,   actions: ["view","create","edit","delete"],     color: "text-violet-500", bg: "bg-violet-500/10" },
  { key: "blog",      label: "المدونة",    icon: FileText,        actions: ["view","create","edit","delete","publish"], color: "text-pink-500", bg: "bg-pink-500/10" },
  { key: "members",   label: "الأعضاء",    icon: Users,           actions: ["view","edit","delete"],              color: "text-cyan-500",   bg: "bg-cyan-500/10" },
  { key: "staff",     label: "الموظفين",   icon: Shield,          actions: ["view","create","edit","delete"],     color: "text-orange-500", bg: "bg-orange-500/10" },
  { key: "settings",  label: "الإعدادات",  icon: Settings,        actions: ["view","edit"],                       color: "text-slate-500",  bg: "bg-slate-500/10" },
];

const ACTION_META: Record<ActionKey, { label: string; icon: React.ElementType; color: string }> = {
  view:    { label: "عرض",    icon: Eye,           color: "text-sky-500" },
  create:  { label: "إضافة",  icon: Plus,          color: "text-emerald-500" },
  edit:    { label: "تعديل",  icon: Pencil,        color: "text-amber-500" },
  delete:  { label: "حذف",    icon: Trash2,        color: "text-red-500" },
  publish: { label: "نشر",    icon: SendHorizonal, color: "text-violet-500" },
};

// ─── Permission helpers ─────────────────────────────────────────────────────
const FULL_PERMISSIONS: PermissionsMap = {
  dashboard: { view: true },
  jobs:      { view: true, create: true, edit: true, delete: true },
  store:     { view: true, create: true, edit: true, delete: true },
  community: { view: true, create: true, edit: true, delete: true },
  blog:      { view: true, create: true, edit: true, delete: true, publish: true },
  members:   { view: true, edit: true, delete: true },
  staff:     { view: true, create: true, edit: true, delete: true },
  settings:  { view: true, edit: true },
};

const EMPTY_PERMISSIONS: PermissionsMap = {
  dashboard: { view: false },
  jobs:      { view: false, create: false, edit: false, delete: false },
  store:     { view: false, create: false, edit: false, delete: false },
  community: { view: false, create: false, edit: false, delete: false },
  blog:      { view: false, create: false, edit: false, delete: false, publish: false },
  members:   { view: false, edit: false, delete: false },
  staff:     { view: false, create: false, edit: false, delete: false },
  settings:  { view: false, edit: false },
};

function parsePermissions(raw: string | null | undefined): PermissionsMap {
  if (!raw) return JSON.parse(JSON.stringify(EMPTY_PERMISSIONS));
  try { return JSON.parse(raw); } catch { return JSON.parse(JSON.stringify(EMPTY_PERMISSIONS)); }
}

function roleLabel(role: string) {
  if (role === "super") return "مشرف رئيسي";
  if (role === "admin") return "مشرف";
  return "محرر";
}

function roleBadgeClass(role: string) {
  if (role === "super") return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  if (role === "admin") return "bg-indigo-500/15 text-indigo-600 border-indigo-500/30";
  return "bg-slate-500/15 text-slate-600 border-slate-500/30";
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("");
}

function avatarColor(id: number) {
  const colors = [
    "from-indigo-500 to-violet-500",
    "from-emerald-500 to-teal-500",
    "from-pink-500 to-rose-500",
    "from-amber-500 to-orange-500",
    "from-sky-500 to-cyan-500",
    "from-purple-500 to-indigo-500",
  ];
  return colors[id % colors.length];
}

// ─── Action Toggle Button ───────────────────────────────────────────────────
function ActionToggle({
  action, checked, onChange, disabled
}: { action: ActionKey; checked: boolean; onChange: () => void; disabled?: boolean }) {
  const meta = ACTION_META[action];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      data-testid={`toggle-perm-${action}`}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-all duration-200 text-xs font-medium min-w-[68px]",
        checked
          ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
          : "bg-muted/50 border-border/60 text-muted-foreground hover:bg-muted hover:border-border",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
        checked ? "bg-primary/20" : "bg-muted"
      )}>
        <Icon className={cn("h-3.5 w-3.5", checked ? "text-primary" : "text-muted-foreground/60")} />
      </div>
      {meta.label}
      {checked
        ? <CheckCheck className="h-3 w-3 text-primary" />
        : <X className="h-3 w-3 text-muted-foreground/30" />
      }
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AdminPermissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [isDirty, setIsDirty] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: admins = [], isLoading } = useQuery<Admin[]>({
    queryKey: ["/api/admin/admins"],
    queryFn: () => adminFetch("/api/admin/admins").then(r => r.json()),
  });

  const selectedAdmin = admins.find(a => a.id === selectedAdminId) ?? null;

  // Load permissions when selecting a staff member
  useEffect(() => {
    if (selectedAdmin) {
      setPermissions(parsePermissions(selectedAdmin.permissions));
      setIsDirty(false);
    }
  }, [selectedAdminId, admins]);

  const saveMutation = useMutation({
    mutationFn: ({ id, perms, role }: { id: number; perms: PermissionsMap; role?: string }) =>
      adminFetch(`/api/admin/admins/${id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: perms, role }),
      }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      setIsDirty(false);
      toast({ title: "تم الحفظ", description: "تم تحديث صلاحيات الموظف بنجاح" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في حفظ الصلاحيات", variant: "destructive" }),
  });

  const togglePermission = (module: ModuleKey, action: ActionKey) => {
    setPermissions(prev => {
      const updated = {
        ...prev,
        [module]: { ...prev[module], [action]: !prev[module]?.[action] },
      };
      // If view is turned off, turn off all other actions too
      if (action === "view" && !updated[module]?.view) {
        const mod = MODULES.find(m => m.key === module);
        if (mod) {
          const cleared: ModulePerms = {};
          mod.actions.forEach(a => cleared[a] = false);
          updated[module] = cleared;
        }
      }
      // If any action (non-view) is turned on, make sure view is on too
      if (action !== "view" && updated[module]?.[action]) {
        updated[module] = { ...updated[module], view: true };
      }
      return updated;
    });
    setIsDirty(true);
  };

  const grantModule = (module: ModuleKey) => {
    const mod = MODULES.find(m => m.key === module)!;
    const granted: ModulePerms = {};
    mod.actions.forEach(a => granted[a] = true);
    setPermissions(prev => ({ ...prev, [module]: granted }));
    setIsDirty(true);
  };

  const revokeModule = (module: ModuleKey) => {
    const mod = MODULES.find(m => m.key === module)!;
    const revoked: ModulePerms = {};
    mod.actions.forEach(a => revoked[a] = false);
    setPermissions(prev => ({ ...prev, [module]: revoked }));
    setIsDirty(true);
  };

  const grantAll = () => {
    setPermissions(JSON.parse(JSON.stringify(FULL_PERMISSIONS)));
    setIsDirty(true);
  };

  const revokeAll = () => {
    setPermissions(JSON.parse(JSON.stringify(EMPTY_PERMISSIONS)));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!selectedAdmin) return;
    saveMutation.mutate({ id: selectedAdmin.id, perms: permissions });
  };

  const handleRoleChange = (role: string) => {
    if (!selectedAdmin) return;
    saveMutation.mutate({ id: selectedAdmin.id, perms: permissions, role });
  };

  const isSuper = selectedAdmin?.role === "super";

  const filteredAdmins = admins.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Count granted modules for badge
  const grantedCount = (admin: Admin) => {
    if (admin.role === "super") return MODULES.length;
    const p = parsePermissions(admin.permissions);
    return MODULES.filter(m => p[m.key]?.view === true).length;
  };

  return (
    <AdminLayout title="صلاحيات الموظفين">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <a href="/admin/staff" className="p-2 hover:bg-muted rounded-lg transition-colors inline-flex shrink-0">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </a>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary shrink-0" />
              صلاحيات الموظفين
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              تحديد ما يستطيع كل موظف عرضه أو تعديله في لوحة التحكم
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">لا يوجد موظفون</p>
            <p className="text-muted-foreground/60 text-sm mt-1">أضف موظفين أولاً من صفحة إدارة الموظفين</p>
            <a href="/admin/staff" className="mt-4">
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                إدارة الموظفين
              </Button>
            </a>
          </div>
        ) : (
          <div className="flex gap-5 items-start">
            {/* ── Staff List ─────────────────────────────────── */}
            <div className="w-72 shrink-0 space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  placeholder="بحث عن موظف..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-9 bg-card border-border"
                  data-testid="input-staff-search"
                />
              </div>

              <div className="space-y-2">
                {filteredAdmins.map(admin => {
                  const isSelected = selectedAdminId === admin.id;
                  const count = grantedCount(admin);
                  return (
                    <button
                      key={admin.id}
                      type="button"
                      data-testid={`card-staff-${admin.id}`}
                      onClick={() => setSelectedAdminId(admin.id)}
                      className={cn(
                        "w-full text-right rounded-xl border p-3.5 transition-all duration-200 flex items-center gap-3",
                        isSelected
                          ? "bg-primary/8 border-primary/40 shadow-sm shadow-primary/10"
                          : "bg-card border-border hover:border-primary/30 hover:bg-primary/5"
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 bg-gradient-to-br",
                        avatarColor(admin.id)
                      )}>
                        {initials(admin.name)}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-semibold text-sm truncate", isSelected ? "text-primary" : "text-foreground")}>
                          {admin.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-md border font-medium",
                            roleBadgeClass(admin.role)
                          )}>
                            {roleLabel(admin.role)}
                          </span>
                          <span className="text-xs text-muted-foreground/60">
                            {admin.role === "super" ? "كل الأقسام" : `${count}/${MODULES.length} أقسام`}
                          </span>
                        </div>
                      </div>
                      {/* Status dot */}
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        admin.isActive ? "bg-emerald-500" : "bg-slate-300"
                      )} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Permission Matrix ───────────────────────────── */}
            <div className="flex-1 min-w-0">
              {!selectedAdmin ? (
                <div className="flex flex-col items-center justify-center h-96 rounded-2xl border border-dashed border-border bg-card text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Lock className="h-8 w-8 text-primary/40" />
                  </div>
                  <p className="text-foreground font-medium">اختر موظفاً لضبط صلاحياته</p>
                  <p className="text-muted-foreground/60 text-sm mt-1">اضغط على أي موظف من القائمة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Staff Header Card */}
                  <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 bg-gradient-to-br",
                      avatarColor(selectedAdmin.id)
                    )}>
                      {initials(selectedAdmin.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-lg">{selectedAdmin.name}</h3>
                      <p className="text-muted-foreground text-sm">{selectedAdmin.email || selectedAdmin.username || "—"}</p>
                    </div>
                    {/* Role Switcher */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-muted-foreground">الدور:</span>
                      <div className="flex rounded-xl border border-border bg-muted/50 p-1 gap-1">
                        {[
                          { value: "super", label: "رئيسي", icon: ShieldCheck },
                          { value: "admin", label: "مشرف", icon: Shield },
                          { value: "editor", label: "محرر", icon: User },
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            data-testid={`role-${value}`}
                            onClick={() => handleRoleChange(value)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                              selectedAdmin.role === value
                                ? "bg-card shadow-sm text-foreground border border-border"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Super Admin Notice */}
                  {isSuper ? (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-700 dark:text-amber-400 text-base">مشرف رئيسي — صلاحيات كاملة</h4>
                        <p className="text-amber-600/80 dark:text-amber-400/70 text-sm mt-1 leading-relaxed">
                          هذا الموظف لديه وصول كامل لجميع أقسام لوحة التحكم بدون قيود.
                          لتقييد صلاحياته، غيّر دوره إلى "مشرف" أو "محرر".
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Quick Actions Bar */}
                      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">إجراءات سريعة</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={grantAll}
                            data-testid="button-grant-all"
                            className="gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            منح كل الصلاحيات
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={revokeAll}
                            data-testid="button-revoke-all"
                            className="gap-1.5 text-red-500 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
                          >
                            <ShieldX className="h-3.5 w-3.5" />
                            سحب كل الصلاحيات
                          </Button>
                        </div>
                      </div>

                      {/* Permission Matrix */}
                      <div className="space-y-3">
                        {MODULES.map(mod => {
                          const Icon = mod.icon;
                          const modPerms = permissions[mod.key] ?? {};
                          const isViewOn = modPerms.view === true;
                          const grantedActions = mod.actions.filter(a => modPerms[a] === true).length;
                          const totalActions = mod.actions.length;
                          const isAllGranted = grantedActions === totalActions;
                          const isNoneGranted = grantedActions === 0;

                          return (
                            <div
                              key={mod.key}
                              data-testid={`module-row-${mod.key}`}
                              className={cn(
                                "bg-card border rounded-2xl p-4 transition-all duration-200",
                                isViewOn ? "border-border" : "border-border/50 opacity-75"
                              )}
                            >
                              <div className="flex items-center gap-3 mb-4">
                                {/* Module icon */}
                                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", mod.bg)}>
                                  <Icon className={cn("h-4.5 w-4.5", mod.color)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-foreground text-sm">{mod.label}</p>
                                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                                    {isNoneGranted ? "لا يوجد وصول" : isAllGranted ? "وصول كامل" : `${grantedActions} من ${totalActions} صلاحيات`}
                                  </p>
                                </div>
                                {/* Module quick actions */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => grantModule(mod.key)}
                                    data-testid={`grant-module-${mod.key}`}
                                    title="منح كل صلاحيات القسم"
                                    className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                                  >
                                    <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => revokeModule(mod.key)}
                                    data-testid={`revoke-module-${mod.key}`}
                                    title="سحب كل صلاحيات القسم"
                                    className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                                  >
                                    <X className="h-3.5 w-3.5 text-red-500" />
                                  </button>
                                  {/* Progress pill */}
                                  <div className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-bold border",
                                    isAllGranted
                                      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                                      : isNoneGranted
                                        ? "bg-slate-500/10 text-slate-500 border-slate-500/20"
                                        : "bg-primary/10 text-primary border-primary/30"
                                  )}>
                                    {grantedActions}/{totalActions}
                                  </div>
                                </div>
                              </div>
                              {/* Action toggles */}
                              <div className="flex flex-wrap gap-2">
                                {mod.actions.map(action => (
                                  <ActionToggle
                                    key={action}
                                    action={action}
                                    checked={modPerms[action] === true}
                                    onChange={() => togglePermission(mod.key, action)}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Save Bar */}
                      <div className={cn(
                        "sticky bottom-4 bg-card/95 backdrop-blur border border-border rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-300 shadow-lg",
                        isDirty ? "opacity-100 translate-y-0" : "opacity-60"
                      )}>
                        <div className="flex items-center gap-3">
                          {isDirty ? (
                            <div className="flex items-center gap-2 text-amber-600">
                              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              <span className="text-sm font-medium">يوجد تغييرات غير محفوظة</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-emerald-600">
                              <CheckCheck className="h-4 w-4" />
                              <span className="text-sm font-medium">محفوظ</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isDirty && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPermissions(parsePermissions(selectedAdmin.permissions));
                                setIsDirty(false);
                              }}
                              className="gap-1.5"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              تراجع
                            </Button>
                          )}
                          <Button
                            type="button"
                            onClick={handleSave}
                            disabled={!isDirty || saveMutation.isPending}
                            data-testid="button-save-permissions"
                            className="gap-2 bg-primary hover:bg-primary/90"
                          >
                            {saveMutation.isPending ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            حفظ الصلاحيات
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
