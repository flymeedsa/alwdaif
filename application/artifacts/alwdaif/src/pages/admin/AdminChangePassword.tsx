import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Key, Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminChangePassword() {
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = passwordStrength(passwords.new);
  const strengthLabels = ["ضعيفة جداً", "ضعيفة", "متوسطة", "قوية", "قوية جداً"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-400", "bg-green-500"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "خطأ",
        description: "كلمتا المرور غير متطابقتين",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new.length < 8) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "تم بنجاح",
          description: "تم تغيير كلمة المرور بنجاح",
        });
        setPasswords({ current: "", new: "", confirm: "" });
      } else {
        toast({
          title: "خطأ",
          description: data.message || "فشل تغيير كلمة المرور",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تغيير كلمة المرور",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout title="تغيير كلمة المرور">
      <div className="max-w-xl mx-auto">
        <Card className="bg-card border-border">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mb-4">
              <Key className="h-8 w-8 text-foreground" />
            </div>
            <CardTitle className="text-foreground text-xl">تغيير كلمة المرور</CardTitle>
            <CardDescription className="text-muted-foreground">
              أدخل كلمة المرور الحالية وكلمة المرور الجديدة
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-muted-foreground">كلمة المرور الحالية</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="bg-muted/50 border-border text-foreground pr-10 pl-10 text-left"
                    dir="ltr"
                    required
                    data-testid="input-current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="bg-muted/50 border-border text-foreground pr-10 pl-10 text-left"
                    dir="ltr"
                    required
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwords.new && (
                  <div className="space-y-2 mt-3">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${
                            i < strength ? strengthColors[strength - 1] : "bg-muted"
                          }`}
                        ></div>
                      ))}
                    </div>
                    <p className={`text-sm ${strength >= 4 ? "text-green-400" : strength >= 2 ? "text-yellow-400" : "text-red-400"}`}>
                      قوة كلمة المرور: {strengthLabels[strength - 1] || "ضعيفة جداً"}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">تأكيد كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="bg-muted/50 border-border text-foreground pr-10 pl-10 text-left"
                    dir="ltr"
                    required
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwords.confirm && (
                  <div className="flex items-center gap-2 mt-2">
                    {passwords.new === passwords.confirm ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-green-400 text-sm">كلمتا المرور متطابقتان</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <span className="text-red-400 text-sm">كلمتا المرور غير متطابقتين</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <p className="text-muted-foreground text-sm font-medium">متطلبات كلمة المرور:</p>
                <ul className="space-y-1 text-sm">
                  <li className={`flex items-center gap-2 ${passwords.new.length >= 8 ? "text-green-400" : "text-muted-foreground/70"}`}>
                    <CheckCircle className="h-3.5 w-3.5" />
                    8 أحرف على الأقل
                  </li>
                  <li className={`flex items-center gap-2 ${/[A-Z]/.test(passwords.new) ? "text-green-400" : "text-muted-foreground/70"}`}>
                    <CheckCircle className="h-3.5 w-3.5" />
                    حرف كبير واحد على الأقل
                  </li>
                  <li className={`flex items-center gap-2 ${/[0-9]/.test(passwords.new) ? "text-green-400" : "text-muted-foreground/70"}`}>
                    <CheckCircle className="h-3.5 w-3.5" />
                    رقم واحد على الأقل
                  </li>
                  <li className={`flex items-center gap-2 ${/[^a-zA-Z0-9]/.test(passwords.new) ? "text-green-400" : "text-muted-foreground/70"}`}>
                    <CheckCircle className="h-3.5 w-3.5" />
                    رمز خاص واحد على الأقل
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || passwords.new !== passwords.confirm || passwords.new.length < 8}
                data-testid="button-change-password"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>جاري التغيير...</span>
                  </div>
                ) : (
                  "تغيير كلمة المرور"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
