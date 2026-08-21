import Layout from "@/components/layout/Layout";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Shield,
  Eye,
  Database,
  Lock,
  Share2,
  Cookie,
  UserCheck,
  Baby,
  RefreshCw,
  Mail,
  Info,
  MonitorSmartphone,
  BarChart3,
} from "lucide-react";

const sections = [
  {
    icon: Info,
    title: "أولاً: مقدمة",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          تلتزم منصة <strong className="text-foreground">إعلانات الوظائف</strong> (alwdaif.com) بحماية خصوصية مستخدميها واحترام بياناتهم الشخصية وفق أعلى المعايير العالمية، بما يتوافق مع أنظمة حماية البيانات المعمول بها في المملكة العربية السعودية.
        </p>
        <p>
          توضح هذه السياسة كيفية جمع بياناتك واستخدامها وحمايتها، وما هي حقوقك تجاهها. باستخدامك للموقع فإنك توافق على الممارسات الواردة في هذه الوثيقة.
        </p>
      </div>
    ),
  },
  {
    icon: Database,
    title: "ثانياً: البيانات التي نجمعها",
    content: (
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <div>
          <p className="font-semibold text-foreground mb-2">أ) بيانات تقدمها أنت مباشرة:</p>
          <ul className="space-y-1.5 list-disc list-inside mr-2">
            <li>الاسم الكامل وعنوان البريد الإلكتروني عند إنشاء حساب.</li>
            <li>رقم الهاتف إذا اشتركت في خدمة الواتساب أو قدّمت طلبًا تجاريًا.</li>
            <li>المنطقة الجغرافية والمؤهل والرغبات الوظيفية (لخدمات التنبيهات المخصصة).</li>
            <li>أي معلومات تقدمها عند تواصلك معنا عبر نماذج الدعم.</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-2">ب) بيانات تُجمع تلقائيًا:</p>
          <ul className="space-y-1.5 list-disc list-inside mr-2">
            <li>عنوان IP والموقع الجغرافي التقريبي.</li>
            <li>نوع المتصفح ونظام التشغيل والجهاز المستخدم.</li>
            <li>الصفحات التي تزورها ومدة الزيارة ومسار التصفح.</li>
            <li>مصدر الزيارة (محركات البحث، وسائل التواصل، إلخ).</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    icon: MonitorSmartphone,
    title: "ثالثاً: كيف نجمع البيانات",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <ul className="space-y-2 list-disc list-inside mr-2">
          <li><strong className="text-foreground">نماذج التسجيل والتواصل:</strong> عند إنشاء حساب أو ملء نموذج اتصل بنا.</li>
          <li><strong className="text-foreground">ملفات تعريف الارتباط (Cookies):</strong> لتحسين تجربة التصفح وتتبع الاستخدام.</li>
          <li><strong className="text-foreground">أدوات التحليل:</strong> مثل Google Analytics لفهم سلوك المستخدمين.</li>
          <li><strong className="text-foreground">إعلانات جوجل (Google AdSense):</strong> لتقديم إعلانات مناسبة لاهتماماتك.</li>
          <li><strong className="text-foreground">تسجيل الدخول إلى المنصة:</strong> للمستخدمين الذين ينشئون حساباً أو يسجلون دخولهم.</li>
        </ul>
      </div>
    ),
  },
  {
    icon: Eye,
    title: "رابعاً: كيف نستخدم بياناتك",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>نستخدم البيانات التي نجمعها للأغراض التالية حصرًا:</p>
        <ul className="space-y-2 list-disc list-inside mr-2">
          <li>تشغيل الموقع وتحسين أداؤه وتجربة المستخدم.</li>
          <li>إرسال تنبيهات الوظائف المناسبة لاهتماماتك (إذا اشتركت بهذه الخدمة).</li>
          <li>الرد على استفساراتك وطلبات الدعم.</li>
          <li>تحليل سلوك الاستخدام لتطوير الخدمات.</li>
          <li>عرض الإعلانات المناسبة (عبر Google AdSense).</li>
          <li>الوفاء بالمتطلبات القانونية والتنظيمية.</li>
          <li>الحماية من الاحتيال والاستخدام غير المصرح به.</li>
        </ul>
        <p className="text-sm font-medium text-foreground">
          لن نستخدم بياناتك لأي غرض خارج ما ذُكر أعلاه دون الحصول على موافقتك المسبقة.
        </p>
      </div>
    ),
  },
  {
    icon: Share2,
    title: "خامساً: مشاركة البيانات مع أطراف ثالثة",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">نحن لا نبيع بياناتك الشخصية لأي طرف ثالث.</strong> قد نشارك بيانات محدودة في الحالات التالية فقط:
        </p>
        <ul className="space-y-2 list-disc list-inside mr-2">
          <li><strong className="text-foreground">مزودو الخدمات التقنية:</strong> مثل خدمات الاستضافة وقواعد البيانات اللازمة لتشغيل الموقع (تخضع لاتفاقيات سرية صارمة).</li>
          <li><strong className="text-foreground">Google AdSense وAnalytics:</strong> لأغراض الإعلانات والتحليل وفق سياسة خصوصية جوجل.</li>
          <li><strong className="text-foreground">الجهات القانونية:</strong> إذا طلبت الجهات القضائية أو التنظيمية ذلك وفق الأنظمة السارية.</li>
          <li><strong className="text-foreground">حالات الضرورة القصوى:</strong> لحماية حقوق الموقع أو سلامة المستخدمين.</li>
        </ul>
      </div>
    ),
  },
  {
    icon: Cookie,
    title: "سادساً: ملفات تعريف الارتباط (Cookies)",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتشمل:</p>
        <ul className="space-y-2 list-disc list-inside mr-2">
          <li><strong className="text-foreground">الكوكيز الأساسية:</strong> ضرورية لعمل الموقع (تسجيل الدخول، إعدادات المظهر).</li>
          <li><strong className="text-foreground">كوكيز الأداء:</strong> لقياس سرعة الموقع وأداؤه.</li>
          <li><strong className="text-foreground">كوكيز التحليل:</strong> لفهم كيفية استخدامك للموقع (Google Analytics).</li>
          <li><strong className="text-foreground">كوكيز الإعلانات:</strong> لتقديم إعلانات مناسبة لاهتماماتك (Google AdSense).</li>
        </ul>
        <p className="text-sm">
          يمكنك التحكم في ملفات الكوكيز من إعدادات متصفحك، مع العلم أن تعطيل بعضها قد يؤثر على تجربة استخدام الموقع.
        </p>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: "سابعاً: إعلانات جوجل (Google AdSense)",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          نستخدم خدمة <strong className="text-foreground">Google AdSense</strong> لعرض إعلانات على الموقع. تستخدم جوجل ملفات الكوكيز لتقديم إعلانات بناءً على زياراتك السابقة لهذا الموقع وغيره.
        </p>
        <ul className="space-y-2 list-disc list-inside mr-2">
          <li>يمكنك إلغاء الاشتراك في الإعلانات المخصصة من خلال <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">إعدادات إعلانات جوجل</a>.</li>
          <li>تخضع إعلانات جوجل لـ <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">سياسة خصوصية جوجل</a>.</li>
          <li>نحن غير مسؤولين عن محتوى الإعلانات الخارجية المعروضة عبر AdSense.</li>
        </ul>
      </div>
    ),
  },
  {
    icon: Lock,
    title: "ثامناً: أمان البيانات",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>نتخذ إجراءات أمنية متعددة لحماية بياناتك، تشمل:</p>
        <ul className="space-y-2 list-disc list-inside mr-2">
          <li>تشفير الاتصالات باستخدام بروتوكول <strong className="text-foreground">HTTPS/SSL</strong>.</li>
          <li>تشفير كلمات المرور وعدم تخزينها بصيغة قابلة للقراءة.</li>
          <li>تقييد الوصول إلى البيانات الشخصية على الموظفين المخولين فقط.</li>
          <li>مراجعات أمنية دورية للبنية التحتية.</li>
          <li>قواعد بيانات محمية بجدران حماية ومراقبة مستمرة.</li>
        </ul>
        <p className="text-sm">
          رغم جهودنا، لا يوجد نظام آمن بالكامل. ننصحك بعدم مشاركة بيانات حسابك مع أحد.
        </p>
      </div>
    ),
  },
  {
    icon: UserCheck,
    title: "تاسعاً: حقوقك تجاه بياناتك",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>وفق أفضل الممارسات الدولية لحماية البيانات، تتمتع بالحقوق التالية:</p>
        <ul className="space-y-2 list-disc list-inside mr-2">
          <li><strong className="text-foreground">حق الاطلاع:</strong> معرفة ما نجمعه من بياناتك.</li>
          <li><strong className="text-foreground">حق التصحيح:</strong> تعديل أي بيانات غير دقيقة.</li>
          <li><strong className="text-foreground">حق الحذف:</strong> طلب حذف بياناتك الشخصية من أنظمتنا.</li>
          <li><strong className="text-foreground">حق الاعتراض:</strong> الاعتراض على معالجة بياناتك لأغراض معينة.</li>
          <li><strong className="text-foreground">حق النقل:</strong> الحصول على نسخة من بياناتك بصيغة قابلة للنقل.</li>
          <li><strong className="text-foreground">حق إلغاء الاشتراك:</strong> إلغاء الاشتراك في النشرات البريدية والتنبيهات في أي وقت.</li>
        </ul>
        <p className="text-sm">
          لممارسة أي من هذه الحقوق، تواصل معنا عبر معلومات الاتصال أدناه.
        </p>
      </div>
    ),
  },
  {
    icon: Baby,
    title: "عاشراً: خصوصية الأطفال",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          موقعنا غير موجه للأفراد دون سن <strong className="text-foreground">18 عامًا</strong>، ولا نجمع بياناتهم بصورة متعمدة. إذا اكتشفت أننا جمعنا بيانات طفل دون إذن والديه، يرجى إخطارنا فورًا لحذفها.
        </p>
      </div>
    ),
  },
  {
    icon: RefreshCw,
    title: "حادي عشر: التحديثات على هذه السياسة",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          قد نُحدّث سياسة الخصوصية هذه بصفة دورية لمواكبة التغييرات التشغيلية أو القانونية أو التقنية. عند إجراء تغييرات جوهرية، سنُعلمك عبر الموقع أو البريد الإلكتروني.
        </p>
        <p>
          تاريخ "آخر تحديث" في أعلى الصفحة يُشير دومًا إلى النسخة الحالية السارية.
        </p>
      </div>
    ),
  },
  {
    icon: Mail,
    title: "ثاني عشر: التواصل بشأن الخصوصية",
    content: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>لأي استفسار أو طلب يتعلق بخصوصية بياناتك، تواصل معنا عبر:</p>
        <ul className="space-y-2 list-none">
          {[
            "صفحة اتصل بنا: alwdaif.com/contact",
            "جوال / واتس: 00966533465740",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span dir="ltr" className="text-right">{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm">
          نلتزم بالرد على جميع طلبات الخصوصية خلال <strong className="text-foreground">٣ أيام عمل</strong>.
        </p>
      </div>
    ),
  },
];

export default function Privacy() {
  usePageTitle("سياسة الخصوصية");

  return (
    <Layout>
      <div dir="rtl">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-l from-blue-600 to-indigo-600 text-white">
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
                <Shield className="w-3.5 h-3.5" />
                وثيقة قانونية
              </span>
            </div>
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
              data-testid="text-privacy-title"
            >
              سياسة الخصوصية
            </h1>
            <p className="text-white/75 text-sm md:text-base max-w-2xl">
              نلتزم بحماية بياناتك الشخصية واحترام خصوصيتك. توضح هذه السياسة كيفية جمع بياناتك واستخدامها وحمايتها وحقوقك كاملةً تجاهها.
            </p>
            <p className="mt-4 text-white/60 text-xs">آخر تحديث: مايو 2026</p>
          </div>
        </div>

        {/* Notice */}
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-muted-foreground flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <span>
              خصوصيتك تهمنا. هذه السياسة مكتوبة بلغة واضحة وشفافة وفق أفضل الممارسات الدولية لحماية البيانات.
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
          <div className="bg-gradient-to-l from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-6 text-center">
            <Shield className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              نلتزم بحماية بياناتك الشخصية ونعمل على تطوير معايير الأمان باستمرار.
              <br />
              جميع الحقوق محفوظة لـ <strong className="text-foreground">إعلانات الوظائف</strong> {new Date().getFullYear()} ©
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
