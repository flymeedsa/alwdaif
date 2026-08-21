import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, HelpCircle, Search, MessageCircle, Headphones, Scale, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import Layout from "@/components/layout/Layout";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { FaqItem, FaqCategory } from "@shared/schema";

// Fallback questions shown when DB is empty
const STATIC_FAQS: { category: string; catLabel: string; items: { q: string; a: string }[] }[] = [
  {
    category: "general",
    catLabel: "عام",
    items: [
      {
        q: "ما هو موقع إعلانات الوظائف؟",
        a: "موقع إعلانات الوظائف (alwdaif.com) منصة إعلامية متخصصة في نقل وعرض إعلانات الوظائف الحكومية والعسكرية والشركات في المملكة العربية السعودية من مصادرها الرسمية المعتمدة.",
      },
      {
        q: "هل الموقع مجاني للباحثين عن عمل؟",
        a: "نعم، تصفح الوظائف والاشتراك في التنبيهات مجاني تماماً لجميع الباحثين عن عمل دون أي رسوم.",
      },
      {
        q: "هل تساعدون في توظيفي مباشرة؟",
        a: "لا، نحن منصة إعلانية تنقل الإعلانات من مصادرها الرسمية. عليك التقديم مباشرة على الجهة المعلنة عبر الرابط المرفق مع كل إعلان.",
      },
      {
        q: "من أين تأتي الوظائف المعروضة؟",
        a: "نستقي الإعلانات من المصادر الرسمية مثل مواقع الجهات الحكومية، الشركات، الصحف الرسمية، وأنظمة التوظيف المعتمدة. نحرص على التحقق من المصدر قبل النشر.",
      },
    ],
  },
  {
    category: "jobs",
    catLabel: "الوظائف",
    items: [
      {
        q: "كيف أتقدم على وظيفة؟",
        a: "اضغط على زر 'التقديم' أو 'المصدر الرسمي' في الإعلان، وسيتم تحويلك مباشرة إلى الجهة المعلنة لإكمال التقديم.",
      },
      {
        q: "ما الفرق بين الوظائف المدنية والعسكرية؟",
        a: "الوظائف المدنية تتبع الجهات الحكومية المدنية كالوزارات والمستشفيات. الوظائف العسكرية تتبع القوات المسلحة والأمن والحرس الوطني وما في حكمها.",
      },
      {
        q: "هل الوظائف المنشورة متاحة للجنسين؟",
        a: "يعكس الإعلان المنشور شروط الجهة المعلنة. بعض الوظائف للجنسين، وبعضها مخصص لجنس بعينه. يُرجى الاطلاع على شروط كل إعلان.",
      },
      {
        q: "كم تبقى الوظيفة منشورة في الموقع؟",
        a: "تبقى الوظيفة منشورة حتى يُعلن عن إغلاق التقديم أو حتى تاريخ انتهاء الإعلان المحدد من الجهة. نُزيل الإعلانات المنتهية بشكل منتظم.",
      },
      {
        q: "وجدت إعلان وظيفي مشبوه أو وهمي، ماذا أفعل؟",
        a: "راسلنا فوراً عبر واتساب أو صفحة اتصل بنا، وأرسل لنا رابط الإعلان. نأخذ هذا الأمر بجدية ونتحقق من كل بلاغ فور وصوله.",
      },
    ],
  },
  {
    category: "notifications",
    catLabel: "التنبيهات والمتابعة",
    items: [
      {
        q: "كيف أشترك في تنبيهات الوظائف؟",
        a: "سجّل حساباً مجانياً ثم تابع الجهات التي تهمك. ستصلك إشعارات عند نشر وظيفة جديدة من أي جهة تتابعها.",
      },
      {
        q: "كيف أنضم إلى مجموعة واتساب للوظائف؟",
        a: "راسلنا على رقم الواتساب 00966533465740 وسنضيفك للمجموعة المناسبة حسب تخصصك أو اهتمامك.",
      },
      {
        q: "لماذا لا تصلني الإشعارات؟",
        a: "تأكد من: (١) تسجيل الدخول لحسابك، (٢) متابعة الجهات المطلوبة من صفحة الجهات، (٣) السماح للمتصفح بالإشعارات. يمكنك أيضاً الاطلاع على الوظائف مباشرة من لوحة التحكم.",
      },
      {
        q: "هل يمكنني إلغاء الاشتراك في التنبيهات؟",
        a: "نعم، يمكنك إلغاء متابعة أي جهة في أي وقت من صفحة الجهات أو من لوحة تحكم حسابك في قسم التنبيهات.",
      },
    ],
  },
  {
    category: "account",
    catLabel: "الحساب",
    items: [
      {
        q: "كيف أنشئ حساباً؟",
        a: "اضغط على 'تسجيل الدخول' في الزاوية العلوية، ثم أدخل بيانات حسابك في الموقع.",
      },
      {
        q: "كيف أحذف حسابي؟",
        a: "تواصل معنا عبر صفحة اتصل بنا أو الواتساب وسنحذف حسابك وبياناتك خلال ٣ أيام عمل.",
      },
      {
        q: "هل بياناتي محفوظة وآمنة؟",
        a: "نعم، نلتزم بأعلى معايير حماية البيانات. تُشفَّر الاتصالات بـ HTTPS وتُحفظ بياناتك في قاعدة بيانات مشفّرة. راجع سياسة الخصوصية لمزيد من التفاصيل.",
      },
    ],
  },
  {
    category: "organizations",
    catLabel: "الجهات والشركات",
    items: [
      {
        q: "كيف تنشر جهتي وظائفها عبر الموقع؟",
        a: "تواصل معنا عبر واتساب أو نموذج اتصل بنا لمناقشة خيارات النشر المتاحة للجهات والشركات.",
      },
      {
        q: "هل تنشرون وظائف القطاع الخاص؟",
        a: "نعم، نعرض وظائف الشركات والمؤسسات الخاصة إلى جانب الوظائف الحكومية والعسكرية.",
      },
      {
        q: "كيف أتحقق من مصداقية الجهة المعلنة؟",
        a: "نربط كل إعلان بالمصدر الرسمي للجهة. إذا شككت في أي إعلان، ابحث عن الجهة مباشرة عبر الموقع الرسمي للحكومة السعودية.",
      },
    ],
  },
  {
    category: "legal",
    catLabel: "قانوني",
    items: [
      {
        q: "هل يحق لكم نشر إعلانات الجهات الحكومية؟",
        a: "نعم، الإعلانات الحكومية معلومات عامة تُنشر في الجرائد الرسمية والمواقع العامة. نقوم بنقلها للتيسير على الباحثين دون تعديل أو تحريف.",
      },
      {
        q: "ما الذي يحكم استخدامي للموقع؟",
        a: "يخضع استخدام الموقع لشروط الاستخدام وسياسة الخصوصية المنشورتين في الروابط أسفل الصفحة، وفق أنظمة المملكة العربية السعودية.",
      },
      {
        q: "هل تطلبون أموالاً مقابل الحصول على وظيفة؟",
        a: "لا بأي شكل من الأشكال. لا نطلب أموالاً مقابل مساعدتك في الحصول على وظيفة. أي شخص يدّعي تمثيلنا ويطلب مالاً يُعدّ محتالاً.",
      },
    ],
  },
];

export default function Faq() {
  usePageTitle("الأسئلة الشائعة");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery<FaqItem[]>({
    queryKey: ["/api/faq"],
    queryFn: async () => {
      const res = await fetch("/api/faq");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<FaqCategory[]>({
    queryKey: ["/api/faq/categories"],
    queryFn: async () => {
      const res = await fetch("/api/faq/categories");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const useStatic = !isLoading && items.length === 0;

  // ── Build unified list ──
  type UItem = { id: string; question: string; answer: string; category: string };
  const allItems: UItem[] = useStatic
    ? STATIC_FAQS.flatMap((g) =>
        g.items.map((it, i) => ({
          id: `${g.category}-${i}`,
          question: it.q,
          answer: it.a,
          category: g.category,
        }))
      )
    : items.map((it) => ({
        id: String(it.id),
        question: it.question,
        answer: it.answer,
        category: it.category || "general",
      }));

  type CatMeta = { slug: string; label: string };
  const catMetas: CatMeta[] = useStatic
    ? STATIC_FAQS.map((g) => ({ slug: g.category, label: g.catLabel }))
    : categories.map((c) => ({ slug: c.slug, label: c.name }));

  const filtered = allItems.filter((f) => {
    const matchSearch =
      !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCat === "all" || f.category === activeCat;
    return matchSearch && matchCat;
  });

  const catsWithItems = catMetas.filter((c) => allItems.some((f) => f.category === c.slug));

  return (
    <Layout>
      <div dir="rtl">
        {/* ── Hero ── */}
        <div className="relative overflow-hidden bg-gradient-to-l from-amber-500 to-orange-500 text-white">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -left-8 w-56 h-56 rounded-full bg-white/5" />
          <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-16">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-4">
              <HelpCircle className="w-3.5 h-3.5" />
              مركز المساعدة
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-faq-title">
              الأسئلة الشائعة
            </h1>
            <p className="text-white/75 max-w-xl text-sm md:text-base">
              إجابات شاملة على أكثر الأسئلة التي يطرحها زوار الموقع والباحثون عن عمل.
            </p>
            <p className="text-white/50 text-xs mt-3">
              {allItems.length} سؤال وجواب في {catsWithItems.length} تصنيف
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

          {/* ── Search ── */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في الأسئلة..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpenId(null); }}
              className="pr-10 h-12 text-base"
              data-testid="input-faq-search"
            />
          </div>

          {/* ── Category pills ── */}
          {catsWithItems.length > 1 && (
            <div className="flex flex-wrap gap-2" data-testid="faq-category-tabs">
              <button
                onClick={() => { setActiveCat("all"); setOpenId(null); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  activeCat === "all"
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
                data-testid="faq-cat-all"
              >
                الكل
                <span className="mr-1.5 text-xs opacity-70">({allItems.length})</span>
              </button>
              {catsWithItems.map((cat) => {
                const count = allItems.filter((f) => f.category === cat.slug).length;
                const isActive = activeCat === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    onClick={() => { setActiveCat(cat.slug); setOpenId(null); }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    }`}
                    data-testid={`faq-cat-${cat.slug}`}
                  >
                    {cat.label}
                    <span className="mr-1.5 text-xs opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Content ── */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد نتائج مطابقة لبحثك</p>
            </div>
          ) : activeCat !== "all" || search ? (
            <AccordionList items={filtered} openId={openId} setOpenId={setOpenId} />
          ) : (
            <div className="space-y-10">
              {catsWithItems.map((cat) => {
                const catItems = filtered.filter((f) => f.category === cat.slug);
                if (!catItems.length) return null;
                return (
                  <div key={cat.slug} className="space-y-3">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
                      {cat.label}
                    </h2>
                    <AccordionList items={catItems} openId={openId} setOpenId={setOpenId} />
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Bottom CTA ── */}
          <div className="bg-muted/50 border border-border rounded-2xl p-6 text-center space-y-3">
            <p className="font-semibold text-foreground">لم تجد إجابة لسؤالك؟</p>
            <p className="text-sm text-muted-foreground">فريقنا جاهز للمساعدة عبر واتساب أو مركز الدعم</p>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <a
                href="https://wa.me/00966533465740"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
                data-testid="button-faq-whatsapp"
              >
                <MessageCircle className="h-4 w-4" />
                واتساب
              </a>
              <Link href="/dashboard/support">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors cursor-pointer" data-testid="button-faq-support">
                  <Headphones className="h-4 w-4" />
                  مركز الدعم
                </span>
              </Link>
            </div>
          </div>

          {/* ── Legal links ── */}
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
            <Link href="/pages/terms">
              <span className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer" data-testid="link-faq-terms">
                <Scale className="h-3 w-3" />
                الشروط والأحكام
              </span>
            </Link>
            <Link href="/pages/privacy">
              <span className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer" data-testid="link-faq-privacy">
                <Shield className="h-3 w-3" />
                سياسة الخصوصية
              </span>
            </Link>
            <Link href="/pages/contact">
              <span className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer" data-testid="link-faq-contact">
                <MessageCircle className="h-3 w-3" />
                اتصل بنا
              </span>
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
}

function AccordionList({
  items,
  openId,
  setOpenId,
}: {
  items: { id: string; question: string; answer: string }[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className={`border rounded-xl overflow-hidden transition-all duration-200 ${
              isOpen ? "border-primary/30 bg-primary/3" : "border-border bg-card"
            }`}
            data-testid={`faq-item-${item.id}`}
          >
            <button
              className="w-full text-right flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              data-testid={`faq-toggle-${item.id}`}
            >
              <span className={`font-medium text-sm leading-relaxed ${isOpen ? "text-primary" : ""}`}>
                {item.question}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-primary" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/50">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
