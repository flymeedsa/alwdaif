import Layout from "@/components/layout/Layout";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Scale,
  FileText,
  Users,
  ShieldAlert,
  Link2,
  CreditCard,
  RefreshCw,
  Gavel,
  Mail,
  CheckCircle,
  Ban,
  Info,
} from "lucide-react";

const sections = [
  {
    icon: FileText,
    title: "أولاً: مقدمة وقبول الشروط",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          مرحباً بك في موقع <strong className="text-foreground">إعلانات الوظائف</strong> (alwdaif.com)، المنصة الإلكترونية المتخصصة في نقل وعرض إعلانات الوظائف الحكومية والعسكرية والشركات في المملكة العربية السعودية.
        </p>
        <p>
          باستخدامك لهذا الموقع أو أي من خدماته أو قنواته عبر وسائل التواصل الاجتماعي (واتساب، تلقرام، تويتر، سناب شات، وغيرها)، فإنك تُقرّ بأنك قرأت هذه الشروط وفهمتها ووافقت على الالتزام بها. إذا كنت لا توافق على هذه الشروط، يرجى التوقف عن استخدام الموقع وخدماته.
        </p>
        <p>
          تسري هذه الشروط على جميع المستخدمين، سواء كانوا زوارًا أو أعضاء مسجلين أو معلنين أو شركاء.
        </p>
      </div>
    ),
  },
  {
    icon: Info,
    title: "ثانياً: طبيعة الخدمة",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          موقع إعلانات الوظائف هو <strong className="text-foreground">منصة إعلامية</strong> تعمل على نقل وعرض إعلانات الوظائف من مصادرها الرسمية المعتمدة (مواقع الجهات الحكومية، شركات القطاع الخاص، الصحف الرسمية). ونوضح ما يلي:
        </p>
        <ul className="space-y-2 list-none">
          {[
            "نحن لسنا جهة توظيف مباشرة، ولا نتوسط في عمليات التوظيف لصالح أي جهة.",
            "لا نضمن دقة أو صحة الإعلانات المنشورة؛ وتقع مسؤولية التحقق منها على عاتق المستخدم.",
            "جميع روابط التقديم تُحوّل المستخدم إلى الجهة المعلنة مباشرةً.",
            "لا نتقاضى أي مبالغ مقابل مساعدة الأفراد في الحصول على وظيفة.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    icon: Users,
    title: "ثالثاً: حسابات المستخدمين",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>عند إنشاء حساب على الموقع، تلتزم بما يلي:</p>
        <ul className="space-y-2 list-none">
          {[
            "تقديم معلومات صحيحة ودقيقة وحديثة.",
            "الحفاظ على سرية كلمة المرور وبيانات تسجيل الدخول.",
            "إخطارنا فور اكتشاف أي استخدام غير مصرح به لحسابك.",
            "أنت وحدك المسؤول عن جميع الأنشطة التي تتم عبر حسابك.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p>
          نحتفظ بحق تعليق أو حذف أي حساب يخالف هذه الشروط دون إشعار مسبق.
        </p>
      </div>
    ),
  },
  {
    icon: CheckCircle,
    title: "رابعاً: الاستخدام المقبول",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>يُسمح لك باستخدام الموقع للأغراض التالية:</p>
        <ul className="space-y-2 list-none">
          {[
            "تصفح إعلانات الوظائف والاطلاع عليها.",
            "إنشاء حساب للاستفادة من خدمات التنبيهات الوظيفية.",
            "التفاعل مع المحتوى المنشور وفق الضوابط المحددة.",
            "التواصل مع فريق الدعم لأغراض مشروعة.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    icon: Ban,
    title: "خامساً: الاستخدام المحظور",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>يُحظر عليك تمامًا القيام بأيٍّ مما يلي:</p>
        <ul className="space-y-2 list-none">
          {[
            "نشر محتوى مسيء أو مخالف للأخلاق أو الأنظمة السعودية.",
            "انتحال شخصية الآخرين أو تمثيل جهات رسمية دون تفويض.",
            "محاولة اختراق الموقع أو التلاعب ببياناته أو أنظمته.",
            "استخدام الموقع لنشر إعلانات وظيفية وهمية أو احتيالية.",
            "جمع بيانات المستخدمين بأي وسيلة غير مصرح بها.",
            "إرسال رسائل مزعجة (Spam) أو إزعاج المستخدمين الآخرين.",
            "إعادة نشر أو بيع أو توزيع محتوى الموقع بأي شكل تجاري دون إذن مكتوب.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Ban className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm font-medium text-foreground">
          أي مخالفة لهذه البنود قد تستوجب الإجراءات القانونية وفق أنظمة المملكة العربية السعودية.
        </p>
      </div>
    ),
  },
  {
    icon: Link2,
    title: "سادساً: الروابط الخارجية وشعارات الجهات",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          يحتوي الموقع على روابط تُحوّلك إلى مواقع خارجية (صفحات التقديم، البريد الإلكتروني للجهات المعلنة، مواقع الشركات). نؤكد ما يلي:
        </p>
        <ul className="space-y-2 list-none">
          {[
            "لا نتحكم في المواقع الخارجية ولسنا مسؤولين عن محتواها أو ممارساتها.",
            "زيارتك للمواقع الخارجية تخضع لشروط تلك المواقع.",
            "شعارات الجهات المنشورة هي ملكية أصحابها الأصليين.",
            "إذا كنت تمثل جهة وتريد إزالة شعارها أو إعلانها، تواصل معنا عبر صفحة اتصل بنا.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    icon: CreditCard,
    title: "سابعاً: الخدمات المدفوعة والإعلانات التجارية",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>نقدم خدمات إعلانية مدفوعة للجهات والشركات الراغبة في الإعلان عبر منصاتنا. تخضع هذه الخدمات للشروط التالية:</p>
        <ul className="space-y-2 list-none">
          {[
            "يتم الدفع مقدمًا عبر القنوات الرسمية المعتمدة فقط.",
            "تبدأ الخدمة بعد تأكيد استلام المبلغ المتفق عليه.",
            "لا تُستردّ المبالغ المدفوعة بعد بدء تنفيذ الخدمة.",
            "جميع الاتفاقيات التجارية تتم عبر القنوات الرسمية المعلنة فقط.",
            "لا نمتلك وكلاء لبيع خدماتنا — أي عروض من خارج قنواتنا الرسمية تُعدّ احتيالاً.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm">
          للتواصل بشأن الخدمات التجارية: جوال / واتس <strong className="text-foreground" dir="ltr">00966533465740</strong>
        </p>
      </div>
    ),
  },
  {
    icon: ShieldAlert,
    title: "ثامناً: إخلاء المسؤولية",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>في أقصى حدود ما يسمح به النظام، نخلي مسؤوليتنا عن:</p>
        <ul className="space-y-2 list-none">
          {[
            "دقة أو اكتمال أو حداثة إعلانات الوظائف المنشورة.",
            "أي خسارة أو ضرر ناتج عن الاعتماد على المحتوى المنشور.",
            "أي ضرر ناتج عن الروابط الخارجية أو المعلنين الخارجيين.",
            "انقطاع الخدمة أو الأخطاء التقنية المؤقتة.",
            "أي تعامل مالي يتم خارج قنواتنا الرسمية المعلنة.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p>
          يتحمل المستخدم مسؤولية التحقق من أي إعلان وظيفي أو جهة معلنة قبل الإقدام على أي خطوة.
        </p>
      </div>
    ),
  },
  {
    icon: Scale,
    title: "تاسعاً: الملكية الفكرية",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          جميع حقوق الملكية الفكرية للموقع — بما في ذلك التصميم، الشعار، الكود البرمجي، المحتوى الأصلي — محفوظة لـ <strong className="text-foreground">إعلانات الوظائف</strong>. يُحظر:
        </p>
        <ul className="space-y-2 list-none">
          {[
            "نسخ أو إعادة نشر أي محتوى دون إذن كتابي مسبق.",
            "استخدام شعار الموقع أو علامته التجارية بأي شكل.",
            "إنشاء أعمال مشتقة من محتوى الموقع لأغراض تجارية.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Ban className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    icon: RefreshCw,
    title: "عاشراً: التعديلات على الشروط",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          نحتفظ بحق تعديل هذه الشروط في أي وقت دون إشعار مسبق. تُنشر التعديلات على هذه الصفحة مع تحديث تاريخ آخر مراجعة. استمرارك في استخدام الموقع بعد نشر التعديلات يُعدّ قبولاً ضمنيًا لها.
        </p>
        <p>
          ننصح بمراجعة هذه الصفحة بصفة دورية للاطلاع على أي تغييرات.
        </p>
      </div>
    ),
  },
  {
    icon: Gavel,
    title: "حادي عشر: القانون الحاكم وتسوية النزاعات",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          تخضع هذه الشروط للأنظمة واللوائح المعمول بها في <strong className="text-foreground">المملكة العربية السعودية</strong>. في حالة نشوء أي نزاع، تكون المحاكم السعودية المختصة هي الجهة القضائية الأولى للفصل فيه، مع التشجيع على حل النزاعات بالطرق الودية أولاً.
        </p>
      </div>
    ),
  },
  {
    icon: Mail,
    title: "ثاني عشر: التواصل معنا",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>إذا كان لديك استفسار حول هذه الشروط أو أي طلب قانوني، يمكنك التواصل معنا عبر:</p>
        <ul className="space-y-2 list-none">
          {[
            "صفحة اتصل بنا على الموقع: alwdaif.com/contact",
            "جوال / واتس: 00966533465740",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span dir="ltr" className="text-right">{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm">
          نسعى للرد على جميع الاستفسارات خلال <strong className="text-foreground">٣ أيام عمل</strong>.
        </p>
      </div>
    ),
  },
];

export default function Terms() {
  usePageTitle("الشروط والأحكام");

  return (
    <Layout>
      <div dir="rtl">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-l from-emerald-600 to-teal-600 text-white">
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
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <Scale className="w-3.5 h-3.5" />
                وثيقة قانونية
              </span>
            </div>
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
              data-testid="text-terms-title"
            >
              الشروط والأحكام
            </h1>
            <p className="text-white/75 text-sm md:text-base max-w-2xl">
              يرجى قراءة هذه الشروط بعناية قبل استخدام الموقع أو أي من خدماته. تُشكّل هذه الوثيقة الاتفاقية القانونية بينك وبين منصة إعلانات الوظائف.
            </p>
            <p className="mt-4 text-white/60 text-xs">آخر تحديث: مايو 2026</p>
          </div>
        </div>

        {/* Table of contents notice */}
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <span>
              تتضمن هذه الصفحة شروط استخدام موقع إعلانات الوظائف وجميع خدماته الإلكترونية. باستخدامك للموقع فإنك توافق على جميع البنود الواردة أدناه.
            </span>
          </div>
        </div>

        {/* Sections */}
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border/60 bg-muted/30">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-bold text-foreground text-base md:text-lg">
                    {section.title}
                  </h2>
                </div>
                <div className="px-6 py-5">{section.content}</div>
              </div>
            );
          })}

          {/* Footer card */}
          <div className="bg-gradient-to-l from-emerald-600/10 to-teal-600/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
            <Scale className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              هذه الشروط سارية المفعول اعتبارًا من تاريخ آخر تحديث.
              <br />
              جميع الحقوق محفوظة لـ <strong className="text-foreground">إعلانات الوظائف</strong> {new Date().getFullYear()} ©
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
