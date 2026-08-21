import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  FileText, Send, UserCheck, Briefcase, Linkedin, ArrowLeft, Star,
  Sparkles, Zap, ShieldCheck, Clock, Layers, Package, Loader2, CheckCircle2,
  LayoutGrid, User, CreditCard, MessageCircle
} from "lucide-react";

import { usePageTitle } from "@/hooks/usePageTitle";

const WHATSAPP_NUMBER = "966533705008";
const whatsappUrl = (msg: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

const getIconComponent = (iconName: string | null) => {
  const iconMap: Record<string, any> = {
    FileText, Send, UserCheck, Briefcase, Linkedin, Layers, Package,
  };
  return iconMap[iconName || "Package"] || Package;
};

interface ServiceVariant {
  name: string;
  price: number;
}


type CategoryFilter = "all" | "individual" | "packages";

export default function Services() {
  usePageTitle("خدماتنا الاحترافية");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const parseVariants = (variants: string | null): ServiceVariant[] => {
    if (!variants) return [];
    try {
      return typeof variants === "string" ? JSON.parse(variants) : variants;
    } catch {
      return [];
    }
  };

  const WHY_US = [
    { title: "خبرة واسعة", desc: "فريقنا ملم بجميع اشتراطات سوق العمل السعودي", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
    { title: "سرعة الإنجاز", desc: "نلتزم بتسليم طلباتك في وقت قياسي", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { title: "دعم مستمر", desc: "نحن معك خطوة بخطوة للإجابة على استفساراتك", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
    { title: "جودة عالمية", desc: "معايير احترافية تضاهي أفضل الممارسات الدولية", icon: Star, color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20" },
  ];

  return (
    <Layout>
      <Helmet>
        <title>خدمات كتابة السيرة الذاتية وتسجيل جدارات | إعلانات الوظائف</title>
        <meta name="description" content="خدمات احترافية لكتابة السيرة الذاتية ATS، التسجيل في جدارات وطاقات، وبناء ملف LinkedIn بأيدي خبراء سوق العمل السعودي." />
        <link rel="canonical" href="https://www.alwdaif.com/store/services" />
      </Helmet>

      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] -right-[10%] w-[500px] h-[500px] bg-primary/6 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[10%] -left-[10%] w-[500px] h-[500px] bg-blue-500/6 rounded-full blur-[120px] opacity-40"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Banner */}
        <div className="relative mb-10 overflow-hidden rounded-2xl bg-card border border-border shadow-sm p-8 md:p-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.06)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>خيارك الأمثل للتميز المهني</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-heading mb-4 text-foreground leading-tight">
              خدماتنا{" "}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                الاحترافية
              </span>
            </h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
              حلول متكاملة بأسعار تنافسية لمساعدتك في الحصول على الفرص الوظيفية التي تستحقها.
            </p>
            <a
              href={whatsappUrl("مرحباً، أريد الاستفسار عن خدماتكم")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm shadow-md shadow-[#25D366]/30 transition-all duration-200 hover:-translate-y-0.5"
            >
              <MessageCircle className="h-4 w-4" />
              تواصل معنا على واتساب
            </a>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-muted/50 rounded-xl border border-border w-fit mx-auto" data-testid="services-category-tabs">
          {[
            { key: "all" as CategoryFilter, label: "الكل", icon: LayoutGrid },
            { key: "individual" as CategoryFilter, label: "خدمات فردية", icon: User },
            { key: "packages" as CategoryFilter, label: "باقات ورصيد", icon: CreditCard },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              data-testid={`tab-category-${key}`}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                categoryFilter === key
                  ? "bg-background text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-24">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">لا توجد خدمات حالياً</h3>
            <p className="text-muted-foreground">نعمل على إضافة خدمات جديدة قريباً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {services.filter((s: any) => {
              if (categoryFilter === "all") return true;
              return (s.category || "individual") === categoryFilter;
            }).map((service: any) => {
              const Icon = getIconComponent(service.icon);
              const variants = parseVariants(service.variants);
              const color = service.color || "from-blue-500 to-cyan-400";
              const isFeatured = service.isFeatured;

              return (
                <div
                  key={service.id}
                  className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 ${
                    isFeatured
                      ? "border-primary/40 ring-2 ring-primary/20 shadow-lg shadow-primary/10 bg-card"
                      : "border-border hover:border-primary/25 hover:shadow-md bg-card"
                  }`}
                  data-testid={`service-card-${service.slug}`}
                >
                  {/* Color accent top bar */}
                  <div className={`h-1 w-full bg-gradient-to-r ${color}`} />

                  {/* Featured badge */}
                  {isFeatured && (
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
                      <span className="bg-primary text-primary-foreground text-[9px] font-bold px-2.5 py-1 rounded-full tracking-wide shadow-sm">
                        الأكثر طلباً
                      </span>
                      {service.discount && (
                        <span className="bg-red-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          خصم {service.discount}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Subtle bg glow */}
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.06] blur-[50px] transition-opacity duration-500 pointer-events-none`} />

                  <div className="p-6">
                    {/* Icon + title */}
                    <div className="flex flex-col items-center text-center mb-5">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-md mb-4 transition-transform duration-300 group-hover:scale-105`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {service.title}
                      </h2>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-5">
                      {variants.length > 0 ? (
                        <div className="space-y-1">
                          {variants.map((v: ServiceVariant, idx: number) => (
                            <div key={idx} className="text-[13px] text-foreground/70">
                              {v.name}:{" "}
                              <span className="text-primary font-bold">{v.price} ريال</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          {service.oldPrice > 0 && (
                            <span className="text-xs text-red-500 font-bold line-through opacity-80 mb-0.5">
                              {service.oldPrice} ريال
                            </span>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-foreground">{service.price}</span>
                            <span className="text-sm text-muted-foreground font-medium">ريال</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {service.description && (
                      <p className="text-muted-foreground text-center text-sm leading-relaxed mb-5 line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    {/* Features list (if any) */}
                    {service.features && Array.isArray(service.features) && service.features.length > 0 && (
                      <ul className="space-y-1.5 mb-5 text-right">
                        {service.features.slice(0, 3).map((f: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* CTA Button */}
                    <Link href={`/store/services/${service.slug}`}>
                      <Button
                        className={`w-full h-11 rounded-xl font-bold text-sm transition-all duration-300 ${
                          isFeatured
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                            : "bg-muted hover:bg-primary hover:text-primary-foreground text-foreground border border-border hover:border-primary"
                        }`}
                        data-testid={`service-button-${service.slug}`}
                      >
                        <span className="flex items-center gap-2">
                          اطلب الآن
                          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* WhatsApp CTA Banner */}
        <div className="rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 p-6 md:p-8 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-right">
            <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center shrink-0 shadow-md">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">هل تحتاج مساعدة في اختيار الخدمة؟</h3>
              <p className="text-muted-foreground text-sm">تحدث مع فريق الدعم مباشرة عبر واتساب</p>
            </div>
          </div>
          <a
            href={whatsappUrl("مرحباً، أحتاج مساعدة في اختيار الخدمة المناسبة")}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
          >
            <MessageCircle className="h-4 w-4" />
            ابدأ المحادثة
          </a>
        </div>

        {/* Why Choose Us */}
        <div className="rounded-2xl bg-card border border-border p-6 md:p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2 font-heading">
              لماذا يثق بنا{" "}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                آلاف الباحثين عن عمل؟
              </span>
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              نجاحك هو أولويتنا — نقدم خدمات احترافية موثوقة بنتائج ملموسة
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {WHY_US.map((item, i) => (
              <div
                key={i}
                className={`flex flex-col items-center gap-3 p-5 rounded-xl border ${item.bg} transition-all duration-200 hover:-translate-y-0.5`}
              >
                <div className={`w-12 h-12 rounded-xl ${item.bg} border flex items-center justify-center`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div className="text-center">
                  <h3 className="text-foreground font-bold text-sm mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Floating WhatsApp Button */}
      <a
        href={whatsappUrl("مرحباً، أريد الاستفسار عن خدماتكم")}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm shadow-xl shadow-[#25D366]/40 transition-all duration-200 hover:scale-105"
        aria-label="تواصل عبر واتساب"
      >
        <MessageCircle className="h-5 w-5" />
        <span>واتساب</span>
      </a>
    </Layout>
  );
}
