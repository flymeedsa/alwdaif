import React, { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageSquare, Send, CheckCircle2, MessageCircle,
  Phone, Clock, HelpCircle, Headphones, Info, ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "00966533465740";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

const contactChannels = [
  {
    icon: MessageCircle,
    label: "واتساب",
    value: WHATSAPP_NUMBER,
    description: "دردشة مباشرة مع الفريق",
    action: () => window.open(WHATSAPP_URL, "_blank"),
    color: "bg-green-500/10 border-green-500/30 hover:border-green-500",
    iconColor: "text-green-600 dark:text-green-400",
    badge: "الأسرع",
    badgeColor: "bg-green-500 text-white",
  },
  {
    icon: Phone,
    label: "الجوال",
    value: WHATSAPP_NUMBER,
    description: "للاتصال المباشر",
    action: () => window.open(`tel:${WHATSAPP_NUMBER}`, "_self"),
    color: "bg-blue-500/10 border-blue-500/30 hover:border-blue-500",
    iconColor: "text-blue-600 dark:text-blue-400",
    badge: null,
    badgeColor: "",
  },
];


export default function Contact() {
  usePageTitle("اتصل بنا");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.subject || !formData.message) {
      toast({ title: "تنبيه", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed");
      setIsSuccess(true);
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الإرسال، حاول مرة أخرى", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center px-4" dir="rtl">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-3">تم إرسال رسالتك!</h1>
            <p className="text-muted-foreground mb-6">
              شكراً للتواصل معنا. سنراجع رسالتك ونرد عليك خلال يوم عمل.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => window.location.href = "/"} className="px-8">
                العودة للرئيسية
              </Button>
              <Button variant="outline" onClick={() => { setIsSuccess(false); setFormData({ firstName: "", lastName: "", email: "", subject: "", message: "" }); }}>
                إرسال رسالة أخرى
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div dir="rtl">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-l from-violet-600 to-primary text-white">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -left-8 w-56 h-56 rounded-full bg-white/5" />
          <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-16">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              تواصل معنا
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-contact-title">
              كيف يمكننا مساعدتك؟
            </h1>
            <p className="text-white/75 max-w-xl text-sm md:text-base">
              فريقنا جاهز للإجابة على استفساراتك، استقبال بلاغاتك، وخدمة طلباتك التجارية.
            </p>
            <div className="flex items-center gap-2 mt-4 text-white/60 text-xs">
              <Clock className="h-3.5 w-3.5" />
              <span>نرد خلال يوم عمل • واتساب أسرع</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">

          {/* ── قنوات التواصل الفورية ──────────────────────────── */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-5 rounded bg-primary inline-block" />
              تواصل فوري
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactChannels.map((ch, i) => {
                const Icon = ch.icon;
                return (
                  <button
                    key={i}
                    onClick={ch.action}
                    data-testid={`button-contact-${ch.label}`}
                    className={cn(
                      "relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 text-right cursor-pointer w-full",
                      ch.color
                    )}
                  >
                    {ch.badge && (
                      <span className={cn("absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full", ch.badgeColor)}>
                        {ch.badge}
                      </span>
                    )}
                    <div className={cn("w-12 h-12 rounded-xl bg-white/80 dark:bg-white/10 flex items-center justify-center shrink-0", ch.iconColor)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{ch.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ch.description}</p>
                      <p className="text-sm font-mono mt-1 text-foreground" dir="ltr">{ch.value}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── بطاقتا الدعم والأسئلة ──────────────────────────── */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-5 rounded bg-primary inline-block" />
              هل تحتاج مساعدة؟
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* بطاقة الدعم الفني */}
              <Link href="/dashboard/support">
                <div
                  className="group flex items-center gap-4 p-5 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-200 cursor-pointer"
                  data-testid="card-link-support"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
                    <Headphones className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm">الدعم الفني</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      افتح تذكرة دعم وتابع حالتها مباشرة
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>
              </Link>

              {/* بطاقة الأسئلة الشائعة */}
              <Link href="/faq">
                <div
                  className="group flex items-center gap-4 p-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all duration-200 cursor-pointer"
                  data-testid="card-link-faq"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    <HelpCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm">الأسئلة الشائعة</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      إجابات على أكثر الأسئلة تكراراً
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 transition-colors shrink-0" />
                </div>
              </Link>

            </div>
          </section>

          {/* ── نموذج التواصل ──────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-5 rounded bg-primary inline-block" />
              نموذج التواصل
            </h2>
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-muted/40 border-b border-border px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">أرسل لنا رسالة</p>
                  <p className="text-xs text-muted-foreground">سنرد عليك عبر البريد الإلكتروني خلال يوم عمل</p>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="first-name" className="text-sm font-medium">الاسم الأول <span className="text-destructive">*</span></Label>
                      <Input
                        id="first-name"
                        placeholder="مثال: محمد"
                        className="h-11"
                        data-testid="input-first-name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="last-name" className="text-sm font-medium">اسم العائلة <span className="text-destructive">*</span></Label>
                      <Input
                        id="last-name"
                        placeholder="مثال: العمري"
                        className="h-11"
                        data-testid="input-last-name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="h-11"
                      dir="ltr"
                      data-testid="input-email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="text-sm font-medium">موضوع الرسالة <span className="text-destructive">*</span></Label>
                    <Select onValueChange={(v) => setFormData({ ...formData, subject: v })} value={formData.subject}>
                      <SelectTrigger id="subject" className="h-11" data-testid="select-subject">
                        <SelectValue placeholder="اختر موضوع الرسالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inquiry">استفسار عام</SelectItem>
                        <SelectItem value="ad">إعلان تجاري</SelectItem>
                        <SelectItem value="job_posting">نشر وظائف جهتي</SelectItem>
                        <SelectItem value="tech_support">دعم فني</SelectItem>
                        <SelectItem value="report">إبلاغ عن محتوى</SelectItem>
                        <SelectItem value="whatsapp">الانضمام لمجموعة واتساب</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-sm font-medium">تفاصيل رسالتك <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="message"
                      placeholder="اكتب تفاصيل رسالتك هنا..."
                      className="min-h-[130px] resize-none"
                      data-testid="textarea-message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-12 text-base font-bold gap-2"
                      data-testid="button-submit"
                    >
                      {isSubmitting ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><Send className="h-4 w-4" />إرسال الرسالة</>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="sm:w-auto h-12 gap-2 text-green-600 border-green-500/30 hover:bg-green-500/10"
                      onClick={() => window.open(WHATSAPP_URL, "_blank")}
                      data-testid="button-whatsapp-alt"
                    >
                      <MessageCircle className="h-4 w-4" />
                      واتساب
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* ── Notice ─────────────────────────────────────────── */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 text-sm text-muted-foreground">
            <Info className="h-4.5 w-4.5 text-amber-600 mt-0.5 shrink-0" />
            <span>
              <strong className="text-foreground">تنبيه مهم:</strong> لا نطلب أموالاً مقابل مساعدتك في الحصول على وظيفة، ولا نمتلك وكلاء. أي طلب مالي من أشخاص يدّعون تمثيلنا يُعدّ احتيالاً.
            </span>
          </div>

        </div>
      </div>
    </Layout>
  );
}
