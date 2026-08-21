import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, RefreshCw, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  const token = new URLSearchParams(search).get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    if (!token) setIsInvalid(true);
  }, [token]);

  const passwordsMatch = newPassword === confirmPassword;
  const isStrong = newPassword.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      toast({ title: "خطأ", description: "كلمتا المرور غير متطابقتين", variant: "destructive" });
      return;
    }
    if (!isStrong) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 8 أحرف على الأقل", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsDone(true);
      } else {
        if (data.message?.includes("غير صالح") || data.message?.includes("منتهي")) {
          setIsInvalid(true);
        }
        toast({ title: "خطأ", description: data.message || "فشل تعيين كلمة المرور", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ، حاول مجدداً", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center py-12 px-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl">

        {/* Invalid / Expired Token */}
        {isInvalid && (
          <>
            <CardHeader className="text-center space-y-4 pb-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">رابط غير صالح</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  هذا الرابط منتهي الصلاحية أو غير صحيح
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-2 pb-8 text-center">
              <p className="text-muted-foreground text-sm mb-6">
                روابط الاستعادة صالحة لساعة واحدة فقط. يمكنك طلب رابط جديد.
              </p>
              <Button onClick={() => setLocation("/admin/login")} className="gap-2">
                <ArrowRight className="h-4 w-4" />
                طلب رابط جديد
              </Button>
            </CardContent>
          </>
        )}

        {/* Success */}
        {!isInvalid && isDone && (
          <>
            <CardHeader className="text-center space-y-4 pb-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">تم بنجاح!</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  تم تعيين كلمة المرور الجديدة بنجاح
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-2 pb-8 text-center">
              <Button
                onClick={() => setLocation("/admin/login")}
                className="mt-2 gap-2"
                data-testid="button-go-to-login"
              >
                <ArrowRight className="h-4 w-4" />
                تسجيل الدخول الآن
              </Button>
            </CardContent>
          </>
        )}

        {/* Reset Form */}
        {!isInvalid && !isDone && (
          <>
            <CardHeader className="text-center space-y-4 pb-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">تعيين كلمة مرور جديدة</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  اختر كلمة مرور قوية لحسابك
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-foreground">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10 pl-10 text-left"
                      dir="ltr"
                      required
                      autoFocus
                      autoComplete="new-password"
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <p className={`text-xs ${isStrong ? "text-emerald-600" : "text-amber-600"}`}>
                      {isStrong ? "✓ كلمة مرور قوية" : "يجب أن تكون 8 أحرف على الأقل"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-foreground">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10 pl-10 text-left"
                      dir="ltr"
                      required
                      autoComplete="new-password"
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`text-xs ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}>
                      {passwordsMatch ? "✓ كلمتا المرور متطابقتان" : "كلمتا المرور غير متطابقتين"}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold py-3"
                  disabled={isLoading || !isStrong || !passwordsMatch || !confirmPassword}
                  data-testid="button-reset-password"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </div>
                  ) : "تعيين كلمة المرور"}
                </Button>
              </form>
            </CardContent>
          </>
        )}

      </Card>
    </div>
  );
}
