import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Send, UserCheck, Briefcase, Linkedin, Layers, Upload,
  AlertCircle, Copy, ArrowLeft, CheckCircle2, Phone, Mail, User, Package,
  Loader2, Lock, LogIn, Check, CreditCard, ClipboardList, MessageCircle
} from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { apiRequest } from "@/lib/queryClient";
import { useCommunityAuth } from "@/hooks/use-community-auth";

const getIconComponent = (iconName: string | null) => {
  const iconMap: Record<string, any> = {
    FileText, Send, UserCheck, Briefcase, Linkedin, Layers, Package,
  };
  return iconMap[iconName || "Package"] || Package;
};

interface ServiceVariant { name: string; price: number; }

const BANK_DETAILS = {
  bankName: "مصرف الراجحي",
  accountNumber: "155000010006080646332",
  iban: "SA9480000155608010646332",
  accountHolder: "مؤسسة برقيات الرقمية",
};

const STEPS = [
  { key: "details", label: "الخدمة", icon: Package, num: 1 },
  { key: "payment", label: "الدفع", icon: CreditCard, num: 2 },
  { key: "form",    label: "التأكيد", icon: ClipboardList, num: 3 },
];

export default function ServiceDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: authData } = useCommunityAuth();

  const [step, setStep] = useState<"details" | "payment" | "form">("details");
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (authData?.member) {
      const m = authData.member;
      if (m.displayName && !customerName) setCustomerName(m.displayName);
      if (m.phone && !customerPhone) setCustomerPhone(m.phone);
      if (m.email && !customerEmail) setCustomerEmail(m.email);
    }
  }, [authData?.member]);

  const validateArabicName = (name: string) => name.trim().length >= 2;
  const validateSaudiPhone = (phone: string) => /^05[0-9]{8}$/.test(phone);
  const validateEmail = (email: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) && !/[\u0600-\u06FF]/.test(email);

  const handleNameChange = (value: string) => {
    setCustomerName(value);
    setNameError(value && value.trim().length < 2 ? "الاسم يجب أن يكون حرفين على الأقل" : "");
  };
  const handlePhoneChange = (value: string) => {
    const filtered = value.replace(/[^0-9]/g, "").slice(0, 10);
    setCustomerPhone(filtered);
    if (filtered.length > 0) {
      if (filtered.length < 10) setPhoneError("رقم الجوال يجب أن يكون 10 أرقام");
      else if (!filtered.startsWith("05")) setPhoneError("رقم الجوال يجب أن يبدأ بـ 05");
      else setPhoneError("");
    } else setPhoneError("");
  };
  const handleEmailChange = (value: string) => {
    const filtered = value.replace(/[\u0600-\u06FF]/g, "");
    setCustomerEmail(filtered);
    setEmailError(filtered && !validateEmail(filtered) ? "يرجى إدخال بريد إلكتروني صحيح" : "");
  };

  const { data: service, isLoading } = useQuery({
    queryKey: ["/api/services", slug],
    queryFn: async () => {
      const res = await fetch(`/api/services/${slug}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!slug,
  });

  const parseVariants = (variants: string | null): ServiceVariant[] => {
    if (!variants) return [];
    try { return typeof variants === "string" ? JSON.parse(variants) : variants; }
    catch { return []; }
  };

  const variants = service ? parseVariants(service.variants) : [];
  const Icon = getIconComponent(service?.icon);
  const color = service?.color || "from-blue-500 to-cyan-400";

  usePageTitle(service?.title || "الخدمة");

  const getSelectedPrice = () => {
    if (!service) return 0;
    if (variants.length > 0 && selectedVariant) {
      const variant = variants.find((_: any, idx: number) => `variant-${idx}` === selectedVariant);
      return (variant as ServiceVariant | undefined)?.price || 0;
    }
    return service.price || 0;
  };

  const getSelectedVariantName = () => {
    if (!service || variants.length === 0 || !selectedVariant) return "";
    const variant = variants.find((_: any, idx: number) => `variant-${idx}` === selectedVariant);
    return (variant as ServiceVariant | undefined)?.name || "";
  };

  const handleOrderClick = () => {
    if (variants.length > 0 && !selectedVariant) {
      toast({ title: "تنبيه", description: "يرجى اختيار نوع الخدمة", variant: "destructive" });
      return;
    }
    if (!authData?.authenticated) {
      localStorage.setItem("returnAfterLogin", `/store/services/${slug}`);
      navigate("/login");
      return;
    }
    setStep("payment");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "خطأ", description: "يرجى اختيار صورة فقط", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "خطأ", description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت", variant: "destructive" });
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadReceipt = async (): Promise<string> => {
    if (!receiptFile) throw new Error("لم يتم اختيار ملف");
    const formData = new FormData();
    formData.append("file", receiptFile);
    const response = await fetch("/api/media/upload", { method: "POST", body: formData });
    if (!response.ok) throw new Error("فشل في رفع الإيصال");
    const data = await response.json();
    return data.url || data.path;
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest("POST", "/api/service-orders", orderData);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "فشل في إنشاء الطلب");
      return json;
    },
    onSuccess: (data) => navigate(`/store/orders/${data.orderNumber}`),
    onError: (error: any) => toast({ title: "خطأ", description: error.message || "فشل في إنشاء الطلب", variant: "destructive" }),
  });

  const handleSubmitOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (!validateArabicName(customerName.trim())) {
      toast({ title: "خطأ", description: "الاسم يجب أن يكون حرفين على الأقل", variant: "destructive" }); return;
    }
    if (!validateSaudiPhone(customerPhone.trim())) {
      toast({ title: "خطأ", description: "رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05", variant: "destructive" }); return;
    }
    if (!validateEmail(customerEmail.trim())) {
      toast({ title: "خطأ", description: "يرجى إدخال بريد إلكتروني صحيح", variant: "destructive" }); return;
    }
    if (!receiptFile) {
      toast({ title: "خطأ", description: "يرجى رفع صورة إيصال التحويل", variant: "destructive" }); return;
    }
    try {
      setIsUploading(true);
      const receiptUrl = await uploadReceipt();
      createOrderMutation.mutate({
        serviceSlug: slug,
        serviceName: service.title,
        serviceVariant: getSelectedVariantName() || null,
        amount: getSelectedPrice(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        notes: customerNotes.trim() || null,
        receiptUrl,
      });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في رفع الإيصال", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "تم النسخ!", description: "تم نسخ المعلومات إلى الحافظة" });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!service) {
    return (
      <Layout>
        <div className="text-center py-24">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">الخدمة غير موجودة</h1>
          <Button onClick={() => navigate("/store/services")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للخدمات
          </Button>
        </div>
      </Layout>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <Layout>
      <Helmet>
        <title>{service.title}</title>
      </Helmet>

      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => step === "details" ? navigate("/store/services") : setStep(step === "form" ? "payment" : "details")}
          className="mb-5 text-muted-foreground hover:text-foreground gap-1.5 text-sm"
          data-testid="back-button"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === "details" ? "العودة للخدمات" : "رجوع"}
        </Button>

        {/* Progress Steps */}
        <div className="flex items-start mb-7 px-2" dir="rtl">
          {STEPS.map((s, idx) => {
            const isDone = idx < currentStepIndex;
            const isActive = s.key === step;
            const StepIcon = s.icon;
            return (
              <div key={s.key} className="flex items-start flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isDone
                      ? "bg-emerald-500 text-white shadow-sm"
                      : isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-muted border border-border text-muted-foreground"
                  }`}>
                    {isDone
                      ? <Check className="h-4.5 w-4.5" />
                      : <StepIcon className="h-4 w-4" />
                    }
                  </div>
                  <span className={`text-[10px] font-semibold ${
                    isActive ? "text-primary" : isDone ? "text-emerald-500" : "text-muted-foreground"
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mt-5 mx-2 transition-colors duration-500 ${
                    idx < currentStepIndex ? "bg-emerald-400" : "bg-border"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* ─── Step 1: Service Details ─── */}
        {step === "details" && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {/* Color accent bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${color}`} />

            {/* Header */}
            <div className="p-6 md:p-8 text-center border-b border-border">
              {service.isFeatured && (
                <div className="flex justify-center gap-2 mb-4">
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/20">
                    ⭐ الأكثر طلباً
                  </span>
                  {service.discount && (
                    <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-3 py-1 rounded-full border border-red-500/20">خصم {service.discount}</span>
                  )}
                </div>
              )}

              <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg mb-4`}>
                <Icon className="h-10 w-10" />
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{service.title}</h1>

              {variants.length === 0 && (
                <div className="flex flex-col items-center">
                  {service.oldPrice > 0 && (
                    <span className="text-red-500 font-bold line-through text-sm mb-0.5">{service.oldPrice} ريال</span>
                  )}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-foreground">{service.price}</span>
                    <span className="text-muted-foreground font-medium">ريال</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 md:p-8">
              {service.description && (
                <div className="mb-6 text-sm leading-relaxed text-right">
                  {service.description.split('\n').map((line: string, i: number) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    // Section headers like "مميزات الخدمة:" or "ملاحظات:"
                    if (trimmed.endsWith(':') || trimmed.endsWith('؟') || (trimmed.length < 40 && !trimmed.startsWith('*') && !trimmed.startsWith('-'))) {
                      return (
                        <p key={i} className="font-bold text-foreground mt-4 mb-2 first:mt-0">{trimmed}</p>
                      );
                    }
                    // Bullet items starting with * or -
                    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                      return (
                        <div key={i} className="flex items-start gap-2 mb-1.5 text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{trimmed.slice(2)}</span>
                        </div>
                      );
                    }
                    return <p key={i} className="text-muted-foreground mb-2">{trimmed}</p>;
                  })}
                </div>
              )}

              {variants.length > 0 && (
                <div className="mb-6">
                  <p className="text-foreground font-bold mb-3 text-sm">اختر نوع الخدمة</p>
                  <div className="space-y-2">
                    {variants.map((v: ServiceVariant, idx: number) => {
                      const val = `variant-${idx}`;
                      const isSelected = selectedVariant === val;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedVariant(val)}
                          dir="rtl"
                          className={`w-full flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-muted/20 hover:border-primary/30 hover:bg-accent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                              isSelected ? "border-primary bg-primary" : "border-border"
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className={`font-medium text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>{v.name}</span>
                          </div>
                          <div className={`text-base font-black ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {v.price} <span className="text-xs font-medium text-muted-foreground">ريال</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!authData?.authenticated && (
                <Alert className="bg-blue-500/8 border-blue-500/20 mb-5">
                  <Lock className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                    يجب تسجيل الدخول لإتمام الطلب.{" "}
                    <button onClick={() => navigate("/login")} className="underline font-bold">
                      سجل الدخول الآن
                    </button>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleOrderClick}
                className={`w-full h-12 rounded-xl font-bold text-base shadow-md bg-gradient-to-l ${color} hover:opacity-90 border-0 text-white`}
                data-testid="order-button"
              >
                {!authData?.authenticated ? (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    سجل الدخول لطلب الخدمة
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    اطلب الآن
                    {getSelectedPrice() > 0 && (
                      <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm font-bold">{getSelectedPrice()} ريال</span>
                    )}
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Payment ─── */}
        {step === "payment" && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-6 md:p-8 border-b border-border text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                <CreditCard className="h-7 w-7 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">تحويل بنكي</h2>
              <p className="text-muted-foreground text-sm mt-1">حوّل المبلغ ثم ارفع صورة الإيصال</p>
            </div>

            <div className="p-6 md:p-8">
              <Alert className="bg-amber-500/8 border-amber-500/25 mb-6">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm font-medium">
                  يرجى التحويل على الحساب أدناه ثم رفع صورة الإيصال لإتمام الطلب
                </AlertDescription>
              </Alert>

              {/* Bank Card */}
              <div className="rounded-2xl overflow-hidden mb-6 border border-border">
                {/* Bank header */}
                <div className="bg-gradient-to-l from-[#1a3c5e] to-[#0d2440] p-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-md">
                    <img src="/images/alrajhi-bank-logo.webp" alt="Al Rajhi Bank" className="w-10 h-10 object-contain" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-base">{BANK_DETAILS.bankName}</p>
                    <p className="text-white/60 text-xs">{BANK_DETAILS.accountHolder}</p>
                  </div>
                </div>

                {/* Bank details */}
                <div className="bg-muted/30 divide-y divide-border">
                  {[
                    { label: "رقم الحساب", value: BANK_DETAILS.accountNumber, field: "account" },
                    { label: "IBAN", value: BANK_DETAILS.iban, field: "iban" },
                  ].map((item) => (
                    <div key={item.field} className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-muted-foreground text-xs">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-mono text-xs select-all">{item.value}</span>
                        <button
                          onClick={() => copyToClipboard(item.value, item.field)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            copiedField === item.field
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary"
                          }`}
                        >
                          {copiedField === item.field ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Amount */}
                  <div className="flex items-center justify-between px-5 py-4 bg-primary/5">
                    <span className="text-foreground font-bold text-sm">المبلغ المطلوب</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-primary text-2xl font-black">{getSelectedPrice()}</span>
                      <span className="text-primary/70 text-sm font-medium">ريال</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Receipt Upload */}
              <div className="space-y-2 mb-7">
                <Label className="text-foreground font-bold text-sm">
                  رفع صورة إيصال التحويل <span className="text-red-500">*</span>
                </Label>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

                {receiptPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={receiptPreview} alt="Receipt" className="w-full max-h-56 object-contain bg-muted/20" />
                    <button
                      onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                      className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-lg font-medium transition-colors"
                    >
                      إزالة
                    </button>
                    <div className="absolute bottom-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      تم الرفع
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/3 transition-all group"
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-muted border border-border flex items-center justify-center mb-3 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                      <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-foreground font-medium text-sm group-hover:text-primary transition-colors">
                      اضغط هنا لرفع صورة الإيصال
                    </p>
                    <p className="text-muted-foreground/60 text-xs mt-1">PNG, JPG, JPEG — الحد الأقصى 5MB</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("details")} className="flex-1 h-11 rounded-xl">
                  رجوع
                </Button>
                <Button
                  onClick={() => {
                    if (!receiptFile) {
                      toast({ title: "تنبيه", description: "يرجى رفع صورة الإيصال", variant: "destructive" });
                      return;
                    }
                    setStep("form");
                  }}
                  className="flex-1 h-11 rounded-xl font-bold"
                  disabled={!receiptFile}
                >
                  التالي
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Contact Form ─── */}
        {step === "form" && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-6 md:p-8 border-b border-border text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                <ClipboardList className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">بيانات التواصل</h2>
              <p className="text-muted-foreground text-sm mt-1">أدخل بياناتك لنتواصل معك بعد تأكيد الطلب</p>
            </div>

            <div className="p-6 md:p-8">
              {/* Order summary */}
              <div className="bg-muted/40 rounded-xl p-4 mb-6 border border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">الخدمة</span>
                  <span className="text-foreground font-bold">{service.title}</span>
                </div>
                {getSelectedVariantName() && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">النوع</span>
                    <span className="text-foreground">{getSelectedVariantName()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-foreground font-bold">الإجمالي</span>
                  <span className="text-primary font-black text-lg">{getSelectedPrice()} ريال</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    الاسم الكامل <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={customerName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                    className={`h-11 rounded-xl ${nameError ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                    data-testid="input-name"
                  />
                  {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    رقم الجوال <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="05XXXXXXXX"
                    type="tel"
                    dir="ltr"
                    className={`h-11 rounded-xl text-right ${phoneError ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                    data-testid="input-phone"
                  />
                  {phoneError && <p className="text-red-500 text-xs">{phoneError}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    البريد الإلكتروني <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={customerEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="example@email.com"
                    type="email"
                    dir="ltr"
                    className={`h-11 rounded-xl text-right ${emailError ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                    data-testid="input-email"
                  />
                  {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-foreground">
                    ملاحظات إضافية <span className="text-muted-foreground font-normal">(اختياري)</span>
                  </Label>
                  <Textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="أي تفاصيل إضافية تود إضافتها..."
                    rows={3}
                    className="rounded-xl resize-none"
                    data-testid="input-notes"
                  />
                </div>
              </div>

              {/* WhatsApp Notice */}
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 mt-5">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  بعد التحقق من عملية الدفع، سيتواصل معك أحد ممثلي خدمة العملاء لدينا عبر رقم الواتساب المسجّل في طلبك للمتابعة وبدء تنفيذ الخدمة.
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => setStep("payment")} className="flex-1 h-11 rounded-xl">
                  رجوع
                </Button>
                <Button
                  onClick={handleSubmitOrder}
                  disabled={isUploading || createOrderMutation.isPending}
                  className="flex-1 h-11 rounded-xl font-bold shadow-md shadow-primary/15"
                  data-testid="submit-order-button"
                >
                  {(isUploading || createOrderMutation.isPending) ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      تأكيد الطلب
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
