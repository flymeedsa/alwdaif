import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Mail, Lock, User, Eye, EyeOff, Phone,
  CheckCircle2, XCircle, Loader2, ArrowRight, ChevronLeft,
  Building2, Sparkles, Users, TrendingUp, Bookmark, Zap,
} from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

type Tab = "login" | "register" | "forgot";

const USERNAME_REGEX = /^[a-zA-Z0-9]{5,12}$/;
const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX    = /^05[0-9]{8}$/;

const BADGES = [
  { icon: Sparkles,   label: "توافق CV بالذكاء الاصطناعي" },
  { icon: Building2,  label: "متابعة الجهات والوظائف"     },
  { icon: Users,      label: "مجتمع الباحثين عن عمل"      },
  { icon: TrendingUp, label: "مؤشرات سوق العمل"           },
  { icon: Bookmark,   label: "حفظ الوظائف في المفضلة"     },
  { icon: Zap,        label: "موجز الذكاء الاصطناعي"      },
];

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function CommunityLogin() {
  usePageTitle("الحساب");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const search = useSearch();
  const [tab, setTab] = useState<Tab>("login");

  useEffect(() => {
    const t = new URLSearchParams(search).get("tab") as Tab;
    if (t === "register" || t === "forgot") setTab(t);
    else setTab("login");
  }, [search]);
  const [error, setError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);

  const [regDisplayName, setRegDisplayName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPassConfirm, setRegPassConfirm] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegPassConfirm, setShowRegPassConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");

  const handleUsernameChange = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
    setRegUsername(cleaned);
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    if (!cleaned) { setUsernameStatus("idle"); return; }
    if (!USERNAME_REGEX.test(cleaned)) { setUsernameStatus("invalid"); return; }
    setUsernameStatus("checking");
    checkTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/community/check-username/${cleaned}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch { setUsernameStatus("idle"); }
    }, 600);
  };

  const handleAuthSuccess = (data: any) => {
    if (data.member) localStorage.setItem("communityMember", JSON.stringify(data.member));
    if (data.token)  localStorage.setItem("communityToken", data.token);
    queryClient.setQueryData(["/api/community/me"], { authenticated: true, member: data.member });
    const returnUrl = localStorage.getItem("returnAfterLogin");
    if (returnUrl) { localStorage.removeItem("returnAfterLogin"); setLocation(returnUrl); }
    else setLocation("/dashboard");
  };

  const loginMutation = useMutation({
    mutationFn: async (d: { emailOrUsername: string; password: string }) => {
      const res = await apiRequest("POST", "/api/community/login", d);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "فشل في تسجيل الدخول");
      return json;
    },
    onSuccess: handleAuthSuccess,
    onError: (err: any) => setError(err.message),
  });

  const registerMutation = useMutation({
    mutationFn: async (d: any) => {
      const res = await apiRequest("POST", "/api/community/register", d);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "فشل في إنشاء الحساب");
      return json;
    },
    onSuccess: handleAuthSuccess,
    onError: (err: any) => setError(err.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!loginId.trim() || !loginPass) { setError("يرجى ملء جميع الحقول"); return; }
    loginMutation.mutate({ emailOrUsername: loginId.trim(), password: loginPass });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (honeypot) return;
    if (!regDisplayName.trim() || !regUsername || !regEmail || !regPass || !regPassConfirm) { setError("يرجى ملء جميع الحقول المطلوبة"); return; }
    if (!USERNAME_REGEX.test(regUsername)) { setError("اسم المستخدم: 5–12 حرفاً إنجليزياً أو رقماً بدون مسافات"); return; }
    if (usernameStatus === "taken") { setError("اسم المستخدم مستخدم بالفعل"); return; }
    if (!EMAIL_REGEX.test(regEmail)) { setError("يرجى إدخال بريد إلكتروني صحيح"); return; }
    if (!PHONE_REGEX.test(regPhone)) { setError("رقم الجوال يجب أن يبدأ بـ 05 ويكون 10 أرقام"); return; }
    if (regPass.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (regPass !== regPassConfirm) { setError("كلمتا المرور غير متطابقتين"); return; }
    if (!acceptTerms) { setError("يجب الموافقة على الشروط والأحكام"); return; }
    registerMutation.mutate({ username: regUsername, displayName: regDisplayName.trim(), email: regEmail.trim().toLowerCase(), phone: regPhone || undefined, password: regPass, provider: "email", website: honeypot });
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!forgotEmail.trim() || !EMAIL_REGEX.test(forgotEmail)) { setError("يرجى إدخال بريد إلكتروني صحيح"); return; }
    setForgotLoading(true);
    try {
      await fetch("/api/community/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }) });
      setForgotSuccess(true);
    } catch { setForgotSuccess(true); }
    finally { setForgotLoading(false); }
  };

  const strength = regPass.length === 0 ? 0 : regPass.length < 6 ? 1 : regPass.length < 10 ? 2 : regPass.length < 14 ? 3 : 4;
  const strengthColors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
  const strengthLabels = ["", "ضعيفة جداً", "ضعيفة", "متوسطة", "قوية"];

  const UsernameHint = () => {
    if (usernameStatus === "checking") return <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />جارٍ التحقق...</span>;
    if (usernameStatus === "available") return <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" />متاح</span>;
    if (usernameStatus === "taken") return <span className="flex items-center gap-1 text-destructive"><XCircle className="h-3 w-3" />مستخدم بالفعل</span>;
    if (usernameStatus === "invalid" && regUsername.length > 0) return <span className="flex items-center gap-1 text-destructive"><XCircle className="h-3 w-3" />5–12 حرفاً إنجليزياً أو رقماً فقط</span>;
    return <span className="text-muted-foreground">{regUsername.length}/12 • حروف إنجليزية وأرقام فقط</span>;
  };

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-64px)]" dir="rtl">

        {/* ══════ RIGHT: Form Side (no card, like Sabq) ══════ */}
        <div className="flex-1 flex flex-col items-center justify-center bg-background px-8 py-8 overflow-y-auto">
          <div className="w-full max-w-[400px]">

            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-6">
              <p className="text-2xl font-black text-foreground">إعلانات الوظائف</p>
              <p className="text-sm text-muted-foreground mt-1">منصة الوظائف الأولى في السعودية</p>
            </div>

            {/* Tabs */}
            {tab !== "forgot" && (
              <div className="flex border-b border-border mb-7 gap-0">
                {(["login", "register"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(""); }}
                    className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 -mb-px ${
                      tab === t
                        ? "text-primary border-primary"
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    }`}
                    data-testid={`tab-${t}`}
                  >
                    {t === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
                  </button>
                ))}
              </div>
            )}

            {/* ── LOGIN ── */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="space-y-5" noValidate>
                <div className="mb-1">
                  <h1 className="text-2xl font-black text-foreground">مرحباً بعودتك</h1>
                  <p className="text-sm text-muted-foreground mt-1">أدخل بريدك الإلكتروني وكلمة المرور لتسجيل الدخول</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">البريد الإلكتروني أو اسم المستخدم</Label>
                  <Input
                    value={loginId} onChange={(e) => setLoginId(e.target.value)}
                    placeholder="example@email.com"
                    className="h-11 rounded-lg bg-muted/30 border-border/70 text-sm"
                    dir="ltr" autoComplete="username" data-testid="input-login-id"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">كلمة المرور</Label>
                    <button type="button" onClick={() => { setTab("forgot"); setError(""); }} className="text-xs text-primary hover:underline font-medium" data-testid="link-forgot-password">
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showLoginPass ? "text" : "password"}
                      value={loginPass} onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 rounded-lg bg-muted/30 border-border/70 text-sm pl-10"
                      dir="ltr" autoComplete="current-password" data-testid="input-login-password"
                    />
                    <button type="button" onClick={() => setShowLoginPass(!showLoginPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showLoginPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/8 border border-destructive/20 rounded-lg text-destructive text-sm">
                    <XCircle className="h-4 w-4 shrink-0" />{error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 rounded-lg font-bold text-sm" disabled={loginMutation.isPending} data-testid="button-login-submit">
                  {loginMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جارٍ تسجيل الدخول...</> : "تسجيل الدخول"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  ليس لديك حساب؟{" "}
                  <button type="button" onClick={() => { setTab("register"); setError(""); }} className="text-primary font-bold hover:underline" data-testid="link-to-register">
                    إنشاء حساب جديد
                  </button>
                </p>
              </form>
            )}

            {/* ── REGISTER ── */}
            {tab === "register" && (
              <form onSubmit={handleRegister} className="space-y-4" noValidate>
                <div className="mb-1">
                  <h1 className="text-2xl font-black text-foreground">إنشاء حساب جديد</h1>
                  <p className="text-sm text-muted-foreground mt-1">انضم مجاناً في أقل من دقيقتين</p>
                </div>

                {/* Honeypot */}
                <div className="hidden" aria-hidden="true">
                  <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">الاسم الظاهر <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                    <Input value={regDisplayName} onChange={(e) => setRegDisplayName(e.target.value)} placeholder="محمد أحمد" className="h-11 pr-9 rounded-lg bg-muted/30 border-border/70 text-sm" data-testid="input-display-name" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">اسم المستخدم <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 text-sm font-mono pointer-events-none">@</span>
                    <Input
                      value={regUsername} onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="ahmad22"
                      className={`h-11 pr-8 pl-9 rounded-lg bg-muted/30 border-border/70 text-sm font-mono ${usernameStatus === "available" ? "border-green-500 focus-visible:ring-green-500/30" : usernameStatus === "taken" || (usernameStatus === "invalid" && regUsername.length > 0) ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                      dir="ltr" maxLength={12} autoComplete="off" data-testid="input-username"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                      {usernameStatus === "available" && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                      {(usernameStatus === "taken" || (usernameStatus === "invalid" && regUsername.length > 0)) && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5"><UsernameHint /></p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">البريد الإلكتروني <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                      <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="email@example.com" className="h-11 pr-9 rounded-lg bg-muted/30 border-border/70 text-xs" dir="ltr" autoComplete="email" data-testid="input-email" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">رقم الجوال <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                      <Input value={regPhone} onChange={(e) => setRegPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))} placeholder="05XXXXXXXX" className="h-11 pr-9 rounded-lg bg-muted/30 border-border/70 text-xs" dir="ltr" maxLength={10} data-testid="input-phone" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">كلمة المرور <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input type={showRegPass ? "text" : "password"} value={regPass} onChange={(e) => setRegPass(e.target.value)} placeholder="••••••••" className="h-11 pl-10 rounded-lg bg-muted/30 border-border/70 text-sm" dir="ltr" autoComplete="new-password" data-testid="input-password" />
                    <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>{showRegPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  {regPass.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-0.5 flex-1">{[1,2,3,4].map((i) => <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : "bg-muted"}`} />)}</div>
                      <span className={`text-xs font-medium shrink-0 ${strength <= 1 ? "text-red-500" : strength === 2 ? "text-orange-500" : strength === 3 ? "text-yellow-600" : "text-green-600"}`}>{strengthLabels[strength]}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">تأكيد كلمة المرور <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showRegPassConfirm ? "text" : "password"}
                      value={regPassConfirm} onChange={(e) => setRegPassConfirm(e.target.value)}
                      placeholder="••••••••"
                      className={`h-11 pl-10 rounded-lg bg-muted/30 border-border/70 text-sm ${regPassConfirm && regPass !== regPassConfirm ? "border-destructive" : regPassConfirm && regPass === regPassConfirm ? "border-green-500" : ""}`}
                      dir="ltr" autoComplete="new-password" data-testid="input-confirm-password"
                    />
                    <button type="button" onClick={() => setShowRegPassConfirm(!showRegPassConfirm)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>{showRegPassConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(!!v)} className="mt-0.5" data-testid="checkbox-terms" />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    أوافق على <a href="/pages/terms" target="_blank" className="text-primary hover:underline font-semibold">الشروط والأحكام</a> و<a href="/pages/privacy" target="_blank" className="text-primary hover:underline font-semibold">سياسة الخصوصية</a>
                  </label>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/8 border border-destructive/20 rounded-lg text-destructive text-sm">
                    <XCircle className="h-4 w-4 shrink-0" />{error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 rounded-lg font-bold text-sm" disabled={registerMutation.isPending || usernameStatus === "taken" || usernameStatus === "checking"} data-testid="button-register-submit">
                  {registerMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جارٍ إنشاء الحساب...</> : "إنشاء الحساب مجاناً"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  لديك حساب؟{" "}
                  <button type="button" onClick={() => { setTab("login"); setError(""); }} className="text-primary font-bold hover:underline">
                    سجّل الدخول
                  </button>
                </p>
              </form>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {tab === "forgot" && (
              <div className="space-y-5">
                {forgotSuccess ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 mx-auto bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-foreground">تم إرسال الرابط!</p>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xs mx-auto">إذا كان البريد مسجلاً لدينا ستصلك رسالة الاستعادة خلال دقائق.</p>
                    </div>
                    <Button variant="outline" className="rounded-lg font-bold" onClick={() => { setTab("login"); setForgotSuccess(false); setForgotEmail(""); }}>
                      العودة لتسجيل الدخول
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgot} className="space-y-5" noValidate>
                    <button type="button" onClick={() => { setTab("login"); setError(""); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowRight className="h-4 w-4" />العودة لتسجيل الدخول
                    </button>
                    <div>
                      <h1 className="text-2xl font-black text-foreground">استعادة كلمة المرور</h1>
                      <p className="text-sm text-muted-foreground mt-1">أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">البريد الإلكتروني</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                        <Input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="example@email.com" className="h-11 pr-9 rounded-lg bg-muted/30 border-border/70 text-sm" dir="ltr" data-testid="input-forgot-email" />
                      </div>
                    </div>
                    {error && <div className="flex items-center gap-2 p-3 bg-destructive/8 border border-destructive/20 rounded-lg text-destructive text-sm"><XCircle className="h-4 w-4 shrink-0" />{error}</div>}
                    <Button type="submit" className="w-full h-11 rounded-lg font-bold text-sm" disabled={forgotLoading} data-testid="button-forgot-submit">
                      {forgotLoading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جارٍ الإرسال...</> : "إرسال رابط الاستعادة"}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* Back link */}
            <div className="mt-6 text-center border-t border-border pt-5">
              <button onClick={() => setLocation("/community")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-community">
                <ChevronLeft className="h-4 w-4" />تصفح المجتمع بدون تسجيل دخول
              </button>
            </div>
          </div>
        </div>

        {/* ══════ LEFT: Brand Side (like Sabq) ══════ */}
        <div
          className="hidden lg:flex w-1/2 shrink-0 relative overflow-hidden flex-col items-center justify-center"
          style={{ background: "linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)" }}
        >
          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 0)", backgroundSize: "28px 28px" }}
          />
          {/* Glow orbs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-300/10 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center text-center px-14 max-w-lg">

            {/* Logo area */}
            <div className="mb-8">
              <div className="w-20 h-20 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
                <span className="text-white text-3xl font-black">وظ</span>
              </div>
              <h2 className="text-white font-black leading-tight text-4xl mb-3">إعلانات الوظائف</h2>
              <p className="text-blue-200 text-lg font-semibold">حيث تلتقي الفرصة بالكفاءة</p>
              <p className="text-white/50 text-sm mt-2 leading-relaxed">منصة متكاملة لأحدث الوظائف الحكومية والعسكرية والقطاع الخاص في المملكة</p>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {BADGES.map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 backdrop-blur-sm hover:bg-white/15 transition-colors">
                  <b.icon className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                  <span className="text-white/85 text-xs font-medium whitespace-nowrap">{b.label}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {[{ v: "+50K", l: "عضو مسجل" }, { v: "+100K", l: "وظيفة منشورة" }, { v: "+200", l: "خدمة متاحة" }].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-white font-black text-2xl">{s.v}</p>
                  <p className="text-white/50 text-xs mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
