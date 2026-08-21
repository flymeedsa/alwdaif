import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2, Briefcase, AlertTriangle } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ResetPassword() {
  usePageTitle("تعيين كلمة مرور جديدة");
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
  }, []);

  const passStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4;
  const passStrengthColor = ["bg-muted", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-green-500"];
  const passStrengthLabel = ["", "ضعيفة جداً", "ضعيفة", "متوسطة", "قوية"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || password.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (password !== confirm) { setError("كلمتا المرور غير متطابقتين"); return; }
    if (!token) { setError("رابط الاستعادة غير صحيح"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/community/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "حدث خطأ، حاول مرة أخرى"); return; }
      setSuccess(true);
    } catch {
      setError("فشل الاتصال بالخادم، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-10 px-4" dir="rtl">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-black text-foreground text-lg">إعلانات الوظائف</span>
          </div>

          <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 md:p-8">

              {!token ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 mx-auto bg-destructive/10 border-2 border-destructive/20 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="h-7 w-7 text-destructive" />
                  </div>
                  <h3 className="text-foreground font-black text-xl mb-2">رابط غير صحيح</h3>
                  <p className="text-muted-foreground text-sm mb-5">رابط الاستعادة غير صحيح أو منتهي الصلاحية. يرجى طلب رابط جديد من صفحة تسجيل الدخول.</p>
                  <Button onClick={() => setLocation("/login")} className="rounded-xl font-bold">
                    العودة لتسجيل الدخول
                  </Button>
                </div>
              ) : success ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 mx-auto bg-green-500/10 border-2 border-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-7 w-7 text-green-500" />
                  </div>
                  <h3 className="text-foreground font-black text-xl mb-2">تم تحديث كلمة المرور!</h3>
                  <p className="text-muted-foreground text-sm mb-5">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
                  <Button onClick={() => setLocation("/login")} className="rounded-xl font-bold">
                    تسجيل الدخول الآن
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-foreground font-black text-xl mb-1">تعيين كلمة مرور جديدة</h3>
                    <p className="text-muted-foreground text-sm">اختر كلمة مرور قوية لحماية حسابك</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-foreground font-semibold text-sm">كلمة المرور الجديدة</Label>
                    <div className="relative">
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 pr-10 pl-10 rounded-xl bg-muted/40 border-border/60 focus:bg-background"
                        dir="ltr"
                        autoComplete="new-password"
                        data-testid="input-new-password"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1,2,3,4].map((i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passStrength ? passStrengthColor[passStrength] : "bg-muted"}`} />
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${passStrength <= 1 ? "text-red-500" : passStrength === 2 ? "text-amber-500" : passStrength === 3 ? "text-blue-500" : "text-green-500"}`}>
                          {passStrengthLabel[passStrength]}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-foreground font-semibold text-sm">تأكيد كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        className={`h-11 pr-10 pl-10 rounded-xl bg-muted/40 border-border/60 focus:bg-background ${confirm && password !== confirm ? "border-destructive" : confirm && password === confirm ? "border-green-500" : ""}`}
                        dir="ltr"
                        autoComplete="new-password"
                        data-testid="input-confirm-new-password"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirm && password !== confirm && <p className="text-destructive text-xs">كلمتا المرور غير متطابقتين</p>}
                    {confirm && password === confirm && <p className="text-green-600 text-xs font-medium">✓ كلمتا المرور متطابقتان</p>}
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/8 border border-destructive/20 rounded-xl text-destructive text-sm">
                      <XCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-11 rounded-xl font-bold text-sm" disabled={loading} data-testid="button-reset-submit">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جارٍ التحديث...</> : "تعيين كلمة المرور الجديدة"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
