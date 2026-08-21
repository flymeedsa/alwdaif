import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, ArrowRight, ArrowLeft, CheckCircle2, Info, Building2, FileText, Phone, MapPin, Clock, Laptop, Calendar as CalendarIcon, Users, Globe, Pencil, X as XIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const SAUDI_REGIONS = [
  "كل المناطق",
  "الرياض",
  "مكة المكرمة",
  "المدينة المنورة",
  "القصيم",
  "المنطقة الشرقية",
  "عسير",
  "تبوك",
  "حائل",
  "الحدود الشمالية",
  "جازان",
  "نجران",
  "الباحة",
  "الجوف",
];

const WORK_SCHEDULE_LABELS: Record<string, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
};

const WORK_MODE_LABELS: Record<string, string> = {
  on_site: "حضوري",
  remote: "عن بعد",
};

const STEPS = [
  { id: 1, label: "معلومات الشركة" },
  { id: 2, label: "تفاصيل الوظيفة" },
  { id: 3, label: "التواصل والنشر" },
];

interface FormData {
  company: string;
  title: string;
  description: string;
  requirements: string;
  region: string;
  city: string;
  workSchedule: string;
  workMode: string;
  targetGender: string;
  targetNationality: string;
  deadlineDate: string;
  contactMethod: string;
  contactValue: string;
  submitterName: string;
  submitterEmail: string;
}

const initialForm: FormData = {
  company: "",
  title: "",
  description: "",
  requirements: "",
  region: "كل المناطق",
  city: "",
  workSchedule: "",
  workMode: "",
  targetGender: "all",
  targetNationality: "all",
  deadlineDate: "",
  contactMethod: "email",
  contactValue: "",
  submitterName: "",
  submitterEmail: "",
};

function StepIndicator({ step, current }: { step: (typeof STEPS)[0]; current: number }) {
  const done = step.id < current;
  const active = step.id === current;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
        done ? "bg-primary border-primary text-primary-foreground"
          : active ? "border-primary text-primary bg-primary/10"
          : "border-border text-muted-foreground bg-background"
      )}>
        {done ? <CheckCircle2 className="h-5 w-5" /> : step.id}
      </div>
      <span className={cn("text-xs font-medium hidden sm:block", active ? "text-primary" : "text-muted-foreground")}>
        {step.label}
      </span>
    </div>
  );
}

const CONTACT_METHOD_PLACEHOLDER: Record<string, string> = {
  email: "hr@company.com",
  phone: "05xxxxxxxx",
  url: "https://company.com/apply",
};

export default function EmployerJobAdd() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const setSelect = (field: keyof FormData) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const canNext = () => {
    if (step === 1) return form.company.trim().length > 0 && form.submitterName.trim().length > 0 && form.submitterEmail.trim().length > 0;
    if (step === 2) return (
      form.title.trim().length > 0 &&
      form.description.trim().length > 0 &&
      form.deadlineDate.trim().length > 0 &&
      form.workSchedule.trim().length > 0 &&
      form.workMode.trim().length > 0 &&
      form.targetGender.trim().length > 0 &&
      form.targetNationality.trim().length > 0
    );
    return form.contactValue.trim().length > 0;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        company: form.company,
        title: form.title,
        description: form.description,
        requirements: form.requirements || null,
        region: form.region || null,
        city: form.city || null,
        workSchedule: form.workSchedule || null,
        workMode: form.workMode || null,
        targetGender: form.targetGender,
        targetNationality: form.targetNationality,
        deadlineDate: form.deadlineDate || null,
        contactMethod: form.contactMethod,
        contactValue: form.contactValue,
        submitterName: form.submitterName,
        submitterEmail: form.submitterEmail,
        status: "pending",
      };
      const res = await fetch("/api/employer-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "فشل الإرسال");
      }
      navigate("/jobs/employer/submitted");
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
        <Link href="/jobs/employer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowRight className="h-4 w-4" />
          العودة إلى وظائف أصحاب العمل
        </Link>

        <div className="flex items-center gap-2 mb-8">
          <Briefcase className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">أضف إعلان وظيفي</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-4">
              <StepIndicator step={s} current={step} />
              {i < STEPS.length - 1 && (
                <div className={cn("h-px w-12 sm:w-20 transition-colors", step > s.id ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Company & Submitter Info */}
        {step === 1 && (
          <div className="space-y-5" data-testid="step-1">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex gap-2 text-sm text-blue-700 dark:text-blue-300">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              سيُراجَع إعلانك قبل نشره. يُمنع نشر إعلانات وهمية أو مضللة.
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">اسم الشركة / الجهة <span className="text-red-500">*</span></Label>
              <Input id="company" value={form.company} onChange={set("company")} placeholder="مثال: شركة الأفق للتقنية" data-testid="input-company-name" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="submitterName">اسمك (مسؤول التوظيف) <span className="text-red-500">*</span></Label>
                <Input id="submitterName" value={form.submitterName} onChange={set("submitterName")} placeholder="الاسم الكامل" data-testid="input-submitter-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="submitterEmail">بريدك الإلكتروني <span className="text-red-500">*</span></Label>
                <Input id="submitterEmail" value={form.submitterEmail} onChange={set("submitterEmail")} placeholder="you@company.com" type="email" dir="ltr" data-testid="input-submitter-email" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Job Details */}
        {step === 2 && (
          <div className="space-y-5" data-testid="step-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">المسمى الوظيفي <span className="text-red-500">*</span></Label>
              <Input id="title" value={form.title} onChange={set("title")} placeholder="مثال: مهندس برمجيات" data-testid="input-job-title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">وصف الوظيفة <span className="text-red-500">*</span></Label>
              <Textarea id="description" value={form.description} onChange={set("description")} placeholder="اكتب وصفاً مفصلاً للوظيفة ومهامها..." rows={4} data-testid="input-job-description" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requirements">المتطلبات (اختياري)</Label>
              <Textarea id="requirements" value={form.requirements} onChange={set("requirements")} placeholder="المؤهلات والخبرات المطلوبة..." rows={3} data-testid="input-job-requirements" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>المنطقة</Label>
                <Select value={form.region} onValueChange={setSelect("region")}>
                  <SelectTrigger data-testid="select-region">
                    <SelectValue placeholder="كل المدن" />
                  </SelectTrigger>
                  <SelectContent>
                    {SAUDI_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">المدينة (اختياري)</Label>
                <Input id="city" value={form.city} onChange={set("city")} placeholder="مثال: الرياض، جدة..." data-testid="input-city" />
              </div>
              <div className="space-y-1.5">
                <Label>نوع الدوام <span className="text-red-500">*</span></Label>
                <Select value={form.workSchedule} onValueChange={setSelect("workSchedule")}>
                  <SelectTrigger data-testid="select-work-schedule">
                    <SelectValue placeholder="اختر نوع الدوام" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">دوام كامل</SelectItem>
                    <SelectItem value="part_time">دوام جزئي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>طبيعة العمل <span className="text-red-500">*</span></Label>
                <Select value={form.workMode} onValueChange={setSelect("workMode")}>
                  <SelectTrigger data-testid="select-work-mode">
                    <SelectValue placeholder="اختر طبيعة العمل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_site">حضوري</SelectItem>
                    <SelectItem value="remote">عن بعد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الجنس المستهدف <span className="text-red-500">*</span></Label>
                <Select value={form.targetGender} onValueChange={setSelect("targetGender")}>
                  <SelectTrigger data-testid="select-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الجنسين</SelectItem>
                    <SelectItem value="male">ذكور فقط</SelectItem>
                    <SelectItem value="female">إناث فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الجنسية المستهدفة <span className="text-red-500">*</span></Label>
                <Select value={form.targetNationality} onValueChange={setSelect("targetNationality")}>
                  <SelectTrigger data-testid="select-nationality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الجميع</SelectItem>
                    <SelectItem value="saudi">سعودي فقط</SelectItem>
                    <SelectItem value="non_saudi">غير سعودي فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>آخر موعد للتقديم <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-2">
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        data-testid="input-deadline"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-muted/50 text-foreground text-sm hover:bg-muted transition-colors flex-1 text-right"
                      >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                        {form.deadlineDate
                          ? (() => {
                              const [y, m, d] = form.deadlineDate.split("-");
                              const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
                              return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
                            })()
                          : <span className="text-muted-foreground">اختر آخر موعد للتقديم</span>
                        }
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.deadlineDate ? new Date(form.deadlineDate + "T00:00:00") : undefined}
                        defaultMonth={new Date()}
                        disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                        className="p-4"
                        onSelect={(date) => {
                          if (date) {
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, "0");
                            const d = String(date.getDate()).padStart(2, "0");
                            setForm(f => ({ ...f, deadlineDate: `${y}-${m}-${d}` }));
                          }
                          setCalendarOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {form.deadlineDate && (
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, deadlineDate: "" }))}
                      className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      title="مسح التاريخ"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contact */}
        {step === 3 && (
          <div className="space-y-5" data-testid="step-3">
            <p className="text-sm text-muted-foreground">اختر طريقة التقديم التي سيستخدمها المتقدمون للوصول إليك.</p>
            <div className="space-y-1.5">
              <Label>طريقة التقديم <span className="text-red-500">*</span></Label>
              <Select value={form.contactMethod} onValueChange={(v) => { setSelect("contactMethod")(v); setForm(f => ({ ...f, contactValue: "" })); }}>
                <SelectTrigger data-testid="select-contact-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">بريد إلكتروني</SelectItem>
                  <SelectItem value="phone">رقم هاتف</SelectItem>
                  <SelectItem value="url">رابط تقديم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                {form.contactMethod === "email" ? "البريد الإلكتروني" : form.contactMethod === "phone" ? "رقم الهاتف" : "رابط التقديم"}
                <span className="text-red-500"> *</span>
              </Label>
              <Input
                value={form.contactValue}
                onChange={set("contactValue")}
                placeholder={CONTACT_METHOD_PLACEHOLDER[form.contactMethod]}
                type={form.contactMethod === "email" ? "email" : form.contactMethod === "url" ? "url" : "tel"}
                dir={form.contactMethod !== "phone" ? "ltr" : "rtl"}
                data-testid="input-contact-value"
              />
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-border overflow-hidden mt-2">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/60 border-b border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <p className="font-semibold text-sm">مراجعة الإعلان قبل الإرسال</p>
                </div>
              </div>

              {/* Section 1: Company */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Building2 className="h-3.5 w-3.5" />
                    معلومات الشركة
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Pencil className="h-3 w-3" />
                    تعديل
                  </button>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الشركة</span>
                    <span className="font-medium">{form.company || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">مقدّم الطلب</span>
                    <span className="font-medium">{form.submitterName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">البريد الإلكتروني</span>
                    <span className="font-medium text-xs" dir="ltr">{form.submitterEmail || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Job Details */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <FileText className="h-3.5 w-3.5" />
                    تفاصيل الوظيفة
                  </div>
                  <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Pencil className="h-3 w-3" />
                    تعديل
                  </button>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المسمى الوظيفي</span>
                    <span className="font-medium">{form.title || "—"}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground shrink-0 flex items-center gap-1"><MapPin className="h-3 w-3" /> المنطقة</span>
                    <span className="font-medium text-left">{form.region}{form.city ? ` - ${form.city}` : ""}</span>
                  </div>
                  {form.workSchedule && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> نوع الدوام</span>
                      <span className="font-medium">{WORK_SCHEDULE_LABELS[form.workSchedule]}</span>
                    </div>
                  )}
                  {form.workMode && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1"><Laptop className="h-3 w-3" /> طبيعة العمل</span>
                      <span className="font-medium">{WORK_MODE_LABELS[form.workMode]}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> الجنس المستهدف</span>
                    <span className="font-medium">
                      {form.targetGender === "all" ? "الجميع" : form.targetGender === "male" ? "ذكور" : "إناث"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> الجنسية المستهدفة</span>
                    <span className="font-medium">
                      {form.targetNationality === "all" ? "الجميع" : form.targetNationality === "saudi" ? "سعوديون" : "غير سعوديين"}
                    </span>
                  </div>
                  {form.deadlineDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> آخر موعد</span>
                      <span className="font-medium">{new Date(form.deadlineDate).toLocaleDateString("ar-SA")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Contact */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  <Phone className="h-3.5 w-3.5" />
                  طريقة التقديم
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {form.contactMethod === "email" ? "بريد إلكتروني" : form.contactMethod === "phone" ? "هاتف" : "رابط تقديم"}
                  </span>
                  <span className="font-medium text-xs" dir="ltr">{form.contactValue || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1} className="flex items-center gap-2" data-testid="button-prev-step">
            <ArrowRight className="h-4 w-4" />
            السابق
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="flex items-center gap-2" data-testid="button-next-step">
              التالي
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !canNext()} className="flex items-center gap-2" data-testid="button-submit-job">
              {loading ? "جارٍ الإرسال..." : "إرسال الإعلان"}
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
