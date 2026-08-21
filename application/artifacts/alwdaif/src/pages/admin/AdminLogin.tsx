import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lock, Mail, Eye, EyeOff, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { setAdminToken } from "@/lib/adminAuth";

type View = "login" | "forgot" | "sent";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ── Login ──────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.token) setAdminToken(data.token);
        toast({ title: "تم تسجيل الدخول بنجاح", description: "مرحباً بك في لوحة التحكم" });
        queryClient.setQueryData(["/api/admin/check-auth"], { isAdmin: true });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/profile"] });
        queryClient.removeQueries({ queryKey: ["/api/admin/profile"] });
        setLocation("/admin");
      } else {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: data.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء تسجيل الدخول", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Forgot Password ────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (res.ok) {
        setView("sent");
      } else {
        const data = await res.json();
        toast({ title: "خطأ", description: data.message || "حدث خطأ", variant: "destructive" });
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

        {/* ── Login View ─────────────────────────────── */}
        {view === "login" && (
          <>
            <CardHeader className="text-center space-y-4 pb-2">
              <div className="mx-auto h-16 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">لوحة تحكم المشرف</h1>
                <p className="text-sm text-muted-foreground mt-1">أدخل بيانات الدخول للمتابعة</p>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">البريد الإلكتروني أو اسم المستخدم</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com أو username"
                      className="pr-10 text-left"
                      dir="ltr"
                      required
                      autoComplete="username"
                      data-testid="input-admin-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">كلمة المرور</Label>
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(email.includes("@") ? email : ""); setView("forgot"); }}
                      className="text-xs text-primary hover:text-primary/80 transition-colors underline-offset-2 hover:underline"
                      data-testid="link-forgot-password"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="pr-10 pl-10 text-left"
                      dir="ltr"
                      required
                      autoComplete="current-password"
                      data-testid="input-admin-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold py-3 shadow-lg shadow-primary/20"
                  disabled={isLoading}
                  data-testid="button-admin-login"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>جاري تسجيل الدخول...</span>
                    </div>
                  ) : "تسجيل الدخول"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-muted-foreground text-sm">هذه الصفحة مخصصة للمشرفين فقط</p>
              </div>
            </CardContent>
          </>
        )}

        {/* ── Forgot Password View ───────────────────── */}
        {view === "forgot" && (
          <>
            <CardHeader className="text-center space-y-4 pb-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">استعادة كلمة المرور</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleForgot} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-foreground">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="pr-10 text-left"
                      dir="ltr"
                      required
                      autoFocus
                      data-testid="input-forgot-email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full font-bold py-3"
                  disabled={isLoading}
                  data-testid="button-send-reset"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الإرسال...</span>
                    </div>
                  ) : "إرسال رابط الاستعادة"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto"
                  data-testid="link-back-to-login"
                >
                  <ArrowRight className="h-4 w-4" />
                  العودة لتسجيل الدخول
                </button>
              </div>
            </CardContent>
          </>
        )}

        {/* ── Email Sent View ────────────────────────── */}
        {view === "sent" && (
          <>
            <CardHeader className="text-center space-y-4 pb-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">تم الإرسال</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  إذا كان البريد مسجلاً، ستصلك رسالة الاستعادة خلال دقائق
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-8">
              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground text-center leading-relaxed">
                تحقق من بريدك <span className="text-foreground font-medium" dir="ltr">{forgotEmail}</span>
                <br />
                الرابط صالح لمدة ساعة واحدة فقط
              </div>
              <button
                type="button"
                onClick={() => setView("login")}
                className="mt-6 w-full text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1"
                data-testid="link-back-to-login-sent"
              >
                <ArrowRight className="h-4 w-4" />
                العودة لتسجيل الدخول
              </button>
            </CardContent>
          </>
        )}

      </Card>
    </div>
  );
}
