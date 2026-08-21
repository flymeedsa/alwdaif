import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getCommunityToken } from "@/lib/queryClient";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Rocket, CreditCard, ClipboardList, Copy, Check, Upload, Loader2, CheckCircle2, Coins, AlertCircle, Star, LogIn } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCommunityAuth } from "@/hooks/use-community-auth";

const BANK_DETAILS = {
  bankName: "مصرف الراجحي",
  accountNumber: "155000010006080646332",
  iban: "SA9480000155608010646332",
  accountHolder: "مؤسسة برقيات الرقمية",
};

const PACKAGES = [
  { credits: 10, price: 140, label: "10 تقديمات",  variant: "10 تقديمات",  badge: null,         perUnit: 14 },
  { credits: 20, price: 260, label: "20 تقديماً",  variant: "20 تقديماً",  badge: null,         perUnit: 13 },
  { credits: 30, price: 360, label: "30 تقديماً",  variant: "30 تقديماً",  badge: null,         perUnit: 12 },
  { credits: 40, price: 440, label: "40 تقديماً",  variant: "40 تقديماً",  badge: null,         perUnit: 11 },
  { credits: 50, price: 500, label: "50 تقديماً",  variant: "50 تقديماً",  badge: "الأوفر ⭐",  perUnit: 10 },
];

type Step = "select" | "payment" | "confirm" | "done";

export default function JobCredits() {
  usePageTitle("باقات التقديم على الوظائف");
  const searchStr = useSearch();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: authData } = useCommunityAuth();
  const member = authData?.member;

  const pkgParam = parseInt(new URLSearchParams(searchStr).get("pkg") || "0");
  const initialPkg = PACKAGES.find((p) => p.credits === pkgParam) || null;

  const [step, setStep] = useState<Step>(initialPkg ? "payment" : "select");
  const [selectedPkg, setSelectedPkg] = useState(initialPkg);
  const [copied, setCopied] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState(member?.displayName || "");
  const [customerPhone, setCustomerPhone] = useState(member?.phone || "");
  const [customerEmail, setCustomerEmail] = useState(member?.email || "");
  const [isUploading, setIsUploading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    if (member) {
      setCustomerName(member.displayName || "");
      setCustomerPhone(member.phone || "");
      setCustomerEmail(member.email || "");
    }
  }, [member]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validateAndSubmit = async () => {
    let valid = true;
    setNameError(""); setPhoneError(""); setEmailError("");
    if (!customerName.trim() || customerName.trim().length < 3) { setNameError("الاسم يجب أن يكون 3 أحرف على الأقل"); valid = false; }
    if (!/^05[0-9]{8}$/.test(customerPhone)) { setPhoneError("رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام"); valid = false; }
    if (!customerEmail.includes("@")) { setEmailError("البريد الإلكتروني غير صحيح"); valid = false; }
    if (!receiptFile) { toast({ title: "يرجى رفع صورة الإيصال", variant: "destructive" }); valid = false; }
    if (!valid) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", receiptFile!);
      const uploadRes = await fetch("/api/media/upload", { method: "POST", body: formData, credentials: "include" });
      if (!uploadRes.ok) throw new Error("فشل رفع الإيصال");
      const { url: receiptUrl } = await uploadRes.json();

      const communityToken = getCommunityToken();
      const orderRes = await fetch("/api/service-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(communityToken ? { "X-Community-Token": communityToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          serviceSlug: "job-credits",
          serviceName: `باقة التقديم — ${selectedPkg!.label}`,
          serviceVariant: selectedPkg!.variant,
          amount: selectedPkg!.price,
          customerName: customerName.trim(),
          customerPhone,
          customerEmail,
          receiptUrl,
          memberId: member?.id || null,
        }),
      });
      if (!orderRes.ok) throw new Error("فشل إنشاء الطلب");
      const order = await orderRes.json();
      setOrderNumber(order.orderNumber);
      setStep("done");
    } catch (err: any) {
      toast({ title: "حدث خطأ", description: err.message || "يرجى المحاولة مجدداً", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const STEPS = [
    { key: "select", label: "الباقة", icon: Rocket, num: 1 },
    { key: "payment", label: "الدفع", icon: CreditCard, num: 2 },
    { key: "confirm", label: "التأكيد", icon: ClipboardList, num: 3 },
  ];
  const stepIndex = step === "done" ? 3 : STEPS.findIndex((s) => s.key === step);

  return (
    <Layout>
      <Helmet>
        <title>باقات التقديم على الوظائف</title>
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[11px] font-bold mb-2">
            <Rocket className="h-3.5 w-3.5" />
            <span>خدمة التقديم بالنيابة</span>
          </div>
          <h1 className="text-2xl font-black text-foreground">باقات التقديم على الوظائف</h1>
          <p className="text-muted-foreground text-sm">فريقنا يقدّم نيابةً عنك على الوظائف المناسبة — وفّر وقتك واحصل على فرصتك</p>
        </div>

        {/* Login Required Banner */}
        {authData && !authData.authenticated && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto">
              <LogIn className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <h3 className="font-black text-foreground text-lg mb-1">يجب تسجيل الدخول أولاً</h3>
              <p className="text-muted-foreground text-sm">لشراء باقات التقديم يجب أن يكون لديك حساب في المجتمع</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href={`/community/login?redirect=/store/services/job-credits`}>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 w-full sm:w-auto">
                  <LogIn className="h-4 w-4" />
                  تسجيل الدخول
                </Button>
              </Link>
              <Link href="/community/login?tab=register">
                <Button variant="outline" className="w-full sm:w-auto">إنشاء حساب جديد</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Stepper */}
        {step !== "done" && authData?.authenticated && (
          <div className="flex items-center justify-center gap-0">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === stepIndex;
              const done = i < stepIndex;
              return (
                <div key={s.key} className="flex items-center">
                  <div className={`flex flex-col items-center gap-1 ${active ? "opacity-100" : done ? "opacity-70" : "opacity-35"}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${active ? "bg-emerald-500 border-emerald-500 text-white" : done ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-600" : "bg-muted border-border text-muted-foreground"}`}>
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`w-12 h-0.5 mx-1 mb-4 ${i < stepIndex ? "bg-emerald-500/40" : "bg-border"}`} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Step: Select Package */}
        {step === "select" && authData?.authenticated && (
          <div className="space-y-3">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.credits}
                onClick={() => { setSelectedPkg(pkg); setStep("payment"); }}
                className={`relative flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${pkg.badge ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20" : "border-border hover:border-emerald-500/30"}`}
                data-testid={`pkg-${pkg.credits}`}
              >
                {pkg.badge && (
                  <span className="absolute -top-2.5 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">{pkg.badge}</span>
                )}
                <div>
                  <p className="font-bold text-foreground">{pkg.label}</p>
                  <p className="text-xs text-muted-foreground">{pkg.perUnit} ريال للتقديم الواحد{pkg.credits > 1 ? ` — وفّر ${(15 - pkg.perUnit) * pkg.credits} ريال` : ""}</p>
                  {pkg.credits === 50 && <p className="text-xs text-emerald-600 font-bold mt-0.5">+ سيرة ذاتية ATS مجانية</p>}
                </div>
                <div className="text-left">
                  <p className="text-xl font-black text-foreground">{pkg.price} <span className="text-sm font-medium text-muted-foreground">ريال</span></p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step: Payment */}
        {step === "payment" && selectedPkg && authData?.authenticated && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">{selectedPkg.label}</p>
                <p className="text-xs text-muted-foreground">{selectedPkg.credits} تقديم لمدة سنة</p>
              </div>
              <p className="text-2xl font-black text-foreground">{selectedPkg.price} <span className="text-sm text-muted-foreground">ريال</span></p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h3 className="font-bold text-foreground text-center">بيانات التحويل البنكي</h3>
              {[
                { label: "البنك", value: BANK_DETAILS.bankName, key: "bank" },
                { label: "رقم الحساب", value: BANK_DETAILS.accountNumber, key: "acc" },
                { label: "رقم الآيبان", value: BANK_DETAILS.iban, key: "iban" },
                { label: "اسم المستفيد", value: BANK_DETAILS.accountHolder, key: "holder" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-mono font-bold text-sm text-foreground">{item.value}</p>
                  </div>
                  <button onClick={() => copyToClipboard(item.value, item.key)} className="p-2 rounded-lg hover:bg-background transition-colors">
                    {copied === item.key ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              ))}
            </div>

            <Alert className="border-amber-500/20 bg-amber-500/5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs">
                حوّل المبلغ بالضبط (<strong>{selectedPkg.price} ريال</strong>) ثم انتقل لتأكيد الطلب ورفع الإيصال.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("select")}>تغيير الباقة</Button>
              <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setStep("confirm")}>
                حوّلت المبلغ — التالي
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && selectedPkg && authData?.authenticated && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">{selectedPkg.label}</p>
                <p className="text-xs text-muted-foreground">{selectedPkg.credits} تقديم لمدة سنة</p>
              </div>
              <p className="text-2xl font-black text-foreground">{selectedPkg.price} <span className="text-sm text-muted-foreground">ريال</span></p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="أدخل اسمك الكامل" className="mt-1" data-testid="input-customer-name" />
                {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
              </div>
              <div>
                <Label htmlFor="phone">رقم الجوال</Label>
                <Input id="phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="05xxxxxxxx" className="mt-1" dir="ltr" data-testid="input-customer-phone" />
                {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
              </div>
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="example@email.com" className="mt-1" dir="ltr" data-testid="input-customer-email" />
                {emailError && <p className="text-xs text-destructive mt-1">{emailError}</p>}
              </div>
              <div>
                <Label>صورة إيصال التحويل</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-1 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${receiptPreview ? "border-emerald-500/40 bg-emerald-500/5" : "border-border hover:border-emerald-500/30 hover:bg-emerald-500/5"}`}
                  data-testid="upload-receipt"
                >
                  {receiptPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={receiptPreview} alt="receipt" className="max-h-32 rounded-lg object-contain" />
                      <p className="text-xs text-emerald-600 font-bold">تم رفع الإيصال ✓</p>
                      <p className="text-xs text-muted-foreground">اضغط لتغيير الصورة</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-bold text-foreground">اضغط لرفع الإيصال</p>
                      <p className="text-xs text-muted-foreground">JPG أو PNG أو PDF</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("payment")} disabled={isUploading}>السابق</Button>
              <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={validateAndSubmit} disabled={isUploading} data-testid="button-submit-order">
                {isUploading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جارٍ الإرسال...</> : "تأكيد الطلب"}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground mb-2">تم إرسال طلبك بنجاح!</h2>
              <p className="text-muted-foreground text-sm">رقم الطلب: <span className="font-mono font-black text-foreground">{orderNumber}</span></p>
            </div>
            <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground space-y-1">
              <p>سيتم مراجعة الإيصال وإضافة الرصيد إلى حسابك خلال ساعات</p>
              <p>ستصلك إشعار فور تفعيل الرصيد</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => navigate("/dashboard/orders")} data-testid="button-view-orders">
                متابعة طلباتي
              </Button>
              <Button variant="outline" onClick={() => navigate("/jobs")}>
                تصفح الوظائف
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
