import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "./DashboardLayout";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  User, Camera, Save, Lock, Shield, LogOut, Eye, EyeOff, Phone, Mail, AtSign, Award
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function DashboardAccount() {
  usePageTitle("حسابي");
  const { data: authData } = useCommunityAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const member = authData?.member;

  const [profileData, setProfileData] = useState({
    displayName: "",
    bio: "",
    avatar: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Sync once member data loads
  useEffect(() => {
    if (member) {
      setProfileData({
        displayName: member.displayName || "",
        bio: member.bio || "",
        avatar: member.avatar || "",
        phone: member.phone || "",
      });
    }
  }, [member?.id]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const res = await apiRequest("PUT", "/api/community/profile", data);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "فشل في تحديث البيانات");
      return json;
    },
    onSuccess: (data) => {
      if (data.success && data.member) {
        localStorage.setItem("communityMember", JSON.stringify(data.member));
        queryClient.invalidateQueries({ queryKey: ["/api/community/me"] });
        toast({ title: "تم الحفظ ✓", description: "تم تحديث بياناتك بنجاح" });
      }
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message || "فشل في تحديث البيانات", variant: "destructive" }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("PUT", "/api/community/change-password", data);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "فشل في تغيير كلمة المرور");
      return json;
    },
    onSuccess: () => {
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "تم التغيير ✓", description: "تم تغيير كلمة المرور بنجاح" });
    },
    onError: (err: any) => toast({ title: "خطأ", description: err.message || "فشل في تغيير كلمة المرور", variant: "destructive" }),
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "خطأ", description: "يجب اختيار ملف صورة", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "خطأ", description: "حجم الصورة يجب أن يكون أقل من 2 ميجابايت", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setProfileData(prev => ({ ...prev, avatar: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!profileData.displayName.trim()) {
      toast({ title: "خطأ", description: "الاسم الظاهر مطلوب", variant: "destructive" });
      return;
    }
    if (!profileData.phone.trim()) {
      toast({ title: "خطأ", description: "رقم الجوال مطلوب", variant: "destructive" });
      return;
    }
    if (!/^05[0-9]{8}$/.test(profileData.phone.trim())) {
      toast({ title: "خطأ", description: "رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05", variant: "destructive" });
      return;
    }
    updateProfileMutation.mutate(profileData);
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast({ title: "خطأ", description: "جميع الحقول مطلوبة", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "خطأ", description: "كلمة المرور الجديدة غير متطابقة", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleLogout = async () => {
    await apiRequest("POST", "/api/community/logout", {});
    localStorage.removeItem("communityMember");
    window.location.href = "/";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto" dir="rtl">
        <div>
          <h2 className="text-2xl font-bold text-foreground">حسابي</h2>
          <p className="text-muted-foreground text-sm mt-1">إدارة بياناتك الشخصية وإعدادات الحساب</p>
        </div>

        {/* ─── Profile Info ─── */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <User className="h-4 w-4 text-primary" />
              الملف الشخصي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative">
                {profileData.avatar ? (
                  <img
                    src={profileData.avatar}
                    alt={profileData.displayName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center text-primary text-3xl font-bold">
                    {profileData.displayName?.charAt(0) || member?.displayName?.charAt(0) || "؟"}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 left-0 p-1.5 rounded-full bg-primary text-white shadow-md hover:bg-primary/90 transition-colors"
                  title="تغيير الصورة الشخصية"
                  data-testid="change-avatar"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <p className="font-bold text-foreground">{member?.displayName}</p>
                <p className="text-sm text-muted-foreground">@{member?.username}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{member?.email}</p>
                {member?.role === "moderator" ? (
                  <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    <Shield className="h-3 w-3" />
                    مشرف
                  </span>
                ) : member?.role === "admin" ? (
                  <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-primary">
                    <Award className="h-3 w-3" />
                    مدير
                  </span>
                ) : null}
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                الاسم الظاهر <span className="text-red-500">*</span>
              </Label>
              <Input
                value={profileData.displayName}
                onChange={e => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="اسمك كما يظهر للآخرين"
                className="h-11"
                data-testid="input-display-name"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                رقم الجوال <span className="text-red-500">*</span>
              </Label>
              <Input
                value={profileData.phone}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                  setProfileData(prev => ({ ...prev, phone: val }));
                }}
                placeholder="05XXXXXXXX"
                className="h-11"
                dir="ltr"
                maxLength={10}
                data-testid="input-phone"
              />
              <p className="text-muted-foreground text-xs">* رقم الجوال السعودي مطلوب (يبدأ بـ 05 ويتكون من 10 أرقام)</p>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium">نبذة عنك</Label>
              <Textarea
                value={profileData.bio}
                onChange={e => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="أخبر الآخرين عن نفسك..."
                rows={3}
                className="resize-none"
                data-testid="input-bio"
              />
            </div>

            {/* Read-only fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-sm flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  البريد الإلكتروني
                </Label>
                <Input value={member?.email || ""} disabled className="bg-muted/40 text-muted-foreground h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-sm flex items-center gap-1.5">
                  <AtSign className="h-3.5 w-3.5" />
                  اسم المستخدم
                </Label>
                <Input value={`@${member?.username || ""}`} disabled className="bg-muted/40 text-muted-foreground h-11" dir="ltr" />
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
              className="gap-2 h-11"
              data-testid="save-profile"
            >
              <Save className="h-4 w-4" />
              {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </CardContent>
        </Card>

        {/* ─── Change Password ─── */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <Lock className="h-4 w-4 text-amber-500" />
              تغيير كلمة المرور
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium">كلمة المرور الحالية</Label>
              <div className="relative">
                <Input
                  type={showCurrentPass ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="أدخل كلمة المرور الحالية"
                  className="h-11 pl-10"
                  data-testid="input-current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  type={showNewPass ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="كلمة مرور جديدة (6 أحرف على الأقل)"
                  className="h-11 pl-10"
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength */}
              {passwordData.newPassword && (
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordData.newPassword.length >= i * 3
                        ? i <= 1 ? "bg-red-400"
                          : i <= 2 ? "bg-amber-400"
                          : i <= 3 ? "bg-blue-400"
                          : "bg-green-400"
                        : "bg-muted"
                    }`} />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium">تأكيد كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  type={showConfirmPass ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="أعد كتابة كلمة المرور الجديدة"
                  className={`h-11 pl-10 ${
                    passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                      ? "border-red-500 focus-visible:ring-red-500" : ""
                  }`}
                  data-testid="input-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-red-500 text-xs">كلمة المرور غير متطابقة</p>
              )}
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              variant="outline"
              className="gap-2 h-11"
              data-testid="change-password"
            >
              <Lock className="h-4 w-4" />
              {changePasswordMutation.isPending ? "جاري التغيير..." : "تغيير كلمة المرور"}
            </Button>
          </CardContent>
        </Card>

        {/* ─── Notifications & Privacy ─── */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <Shield className="h-4 w-4 text-green-500" />
              الخصوصية والتنبيهات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "تنبيهات الإعجابات", desc: "استلم إشعاراً عند إعجاب أحد بمنشوراتك" },
              { label: "تنبيهات التعليقات", desc: "استلم إشعاراً عند التعليق على منشوراتك" },
              { label: "التنبيهات العامة", desc: "استلم إشعارات المنصة والوظائف الجديدة" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ─── Logout ─── */}
        <Card className="bg-card border-red-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-500">تسجيل الخروج</p>
                <p className="text-xs text-muted-foreground mt-0.5">تسجيل الخروج من حسابك في المنصة</p>
              </div>
              <Button
                variant="ghost"
                className="text-red-500 hover:text-red-500 hover:bg-red-500/10 gap-2"
                onClick={handleLogout}
                data-testid="logout-button"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
