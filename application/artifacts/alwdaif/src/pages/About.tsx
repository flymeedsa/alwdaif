import Layout from "@/components/layout/Layout";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import {
  Target,
  Eye,
  Heart,
  Users,
  Briefcase,
  Star,
  Shield,
  Zap,
  Globe,
  Award,
  CheckCircle2,
  TrendingUp,
  Building2,
  Bell,
  MessageSquare,
  Bookmark,
  LayoutDashboard,
  Newspaper,
  Send,
  ChevronLeft,
  UserCheck,
  BarChart2,
  Megaphone,
  CalendarCheck,
} from "lucide-react";
import { FEATURE_FLAGS } from "@/config/featureFlags";

const stats = [
  { value: "+5000", label: "وظيفة منشورة", icon: Briefcase },
  { value: "+200", label: "جهة حكومية وعسكرية وشركة", icon: Building2 },
  { value: "+50K", label: "باحث عن عمل", icon: Users },
  { value: "100%", label: "مجاني للباحثين", icon: Star },
];

const features = [
  {
    icon: Briefcase,
    title: "وظائف مدنية",
    desc: "جميع الوظائف الحكومية المدنية من الوزارات والهيئات والجهات الحكومية في المملكة، مُصنَّفة وسهلة التصفية.",
    href: "/jobs/civil",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    icon: Shield,
    title: "وظائف عسكرية",
    desc: "إعلانات التجنيد والتوظيف العسكري في القوات المسلحة والحرس الوطني والأمن والشرطة.",
    href: "/jobs/military",
    color: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  },
  {
    icon: Building2,
    title: "وظائف الشركات",
    desc: "فرص العمل في القطاع الخاص من كبرى الشركات السعودية والمتعددة الجنسيات.",
    href: "/jobs/companies",
    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  },
  {
    icon: TrendingUp,
    title: "نتائج التوظيف",
    desc: "متابعة آنية لنتائج المسابقات الوظيفية والقبول في الجهات الحكومية والشركات الكبرى.",
    href: "/results",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  {
    icon: UserCheck,
    title: "وظائف أصحاب العمل",
    desc: "أضف إعلان وظيفتك كصاحب عمل أو شركة ووصل لآلاف الباحثين عن عمل في المملكة مباشرةً.",
    href: "/jobs/employer",
    color: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  },
  {
    icon: Bell,
    title: "تنبيهات الوظائف",
    desc: "فعّل تنبيهات مخصصة بحسب التخصص أو الكلمة المفتاحية واستقبل إشعاراً فورياً عند نشر وظائف جديدة تناسبك.",
    href: "/dashboard/job-alerts",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  {
    icon: Globe,
    title: "دليل الجهات والتنبيهات",
    desc: "تصفح دليلاً شاملاً بجميع الجهات المُعلنة وتابع المفضلة منها — ستصلك إشعارات فورية عند نشر أي وظيفة جديدة.",
    href: "/jobs/organizations",
    color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  },
  {
    icon: MessageSquare,
    title: "مجتمع إعلانات الوظائف",
    desc: "تجمّع حصري للباحثين عن عمل — شارك تجربتك، اطرح أسئلتك، واستفد من خبرات الآخرين في بيئة داعمة.",
    href: "/community",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  {
    icon: BarChart2,
    title: "الملخص الأسبوعي",
    desc: "ملخص ذكي أسبوعي يرصد أبرز الوظائف والفرص وتوجهات سوق العمل السعودي — كل ما يهمك في تقرير واحد.",
    href: "/weekly-summary",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    icon: CalendarCheck,
    title: "الاشتراك الأسبوعي",
    desc: "اشترك واستقبل الملخص الأسبوعي لأبرز وظائف الأسبوع مباشرةً في بريدك — لا تفوّت أي فرصة.",
    href: "/dashboard/weekly-subscription",
    color: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  },
  {
    icon: Megaphone,
    title: "الإعلانات الرسمية",
    desc: "رسائل وإعلانات رسمية ترسلها المنصة مباشرةً لأعضائها المسجلين — ابقَ على اطلاع بكل جديد وأي تحديثات مهمة.",
    href: "/dashboard/announcements",
    color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
  {
    icon: Newspaper,
    title: "مدونة وظيفية",
    desc: "مقالات وتقارير متخصصة عن سوق العمل السعودي، نصائح المقابلات، وأسرار كتابة السيرة الذاتية.",
    href: "/blog",
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  {
    icon: Bookmark,
    title: "حفظ الوظائف المفضلة",
    desc: "احفظ الوظائف التي تهمك في قائمة مفضلتك وعُد إليها في أي وقت دون الحاجة للبحث مجدداً.",
    href: "/dashboard/favorites",
    color: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  },
  {
    icon: Send,
    title: "قناة واتساب",
    desc: "انضم لقناتنا على واتساب واستقبل أحدث الإعلانات الوظيفية مباشرةً على هاتفك فور نشرها.",
    href: "https://whatsapp.com/channel/0029VaDUMpy7j6g6y8FRU11S",
    external: true,
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    icon: Award,
    title: "خدمات احترافية",
    desc: "إعداد السيرة الذاتية الاحترافية، والاستشارات المهنية، وتحضير المقابلات بأيدي خبراء معتمدين.",
    href: "/store/services",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  {
    icon: LayoutDashboard,
    title: "لوحة التحكم الشخصية",
    desc: "مركز التحكم الخاص بك — تابع تنبيهاتك، وظائفك المفضلة، وإعدادات حسابك من مكان واحد.",
    href: "/dashboard",
    color: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  },
];

const values = [
  {
    icon: Shield,
    title: "الموثوقية",
    desc: "نلتزم بنشر الإعلانات الرسمية من مصادرها الأصلية فقط.",
  },
  {
    icon: Zap,
    title: "السرعة",
    desc: "نحرص على نشر الإعلانات فور صدورها لضمان وصولها إليك أولاً.",
  },
  {
    icon: Heart,
    title: "الشفافية",
    desc: "لا رسوم خفية ولا إعلانات مضللة — ما تراه هو ما تحصل عليه.",
  },
  {
    icon: Users,
    title: "المجتمع",
    desc: "نؤمن بأن التواصل بين الباحثين عن عمل يُنتج فرصاً حقيقية.",
  },
];

export default function About() {
  const visibleFeatures = features.filter((feature) => {
    if (!FEATURE_FLAGS.community && feature.href.startsWith("/community")) return false;
    if (!FEATURE_FLAGS.services && feature.href.startsWith("/store/services")) return false;
    return true;
  });
  const visibleValues = values.filter((value) => FEATURE_FLAGS.community || value.title !== "المجتمع");

  return (
    <Layout>
      <Helmet>
        <title>من نحن | منصة إعلانات الوظائف السعودية</title>
        <meta name="description" content="تعرّف على منصة إعلانات الوظائف، منصتك الأولى للبحث عن الوظائف الحكومية والعسكرية ووظائف الشركات في المملكة العربية السعودية." />
        <link rel="canonical" href="https://www.alwdaif.com/about" />
      </Helmet>

      <div dir="rtl" className="min-h-screen">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-background to-primary/4 border-b border-border/60">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 py-10 md:py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <Star className="h-4 w-4" />
              تعرّف علينا
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-6 leading-tight" style={{ fontFamily: "Cairo, sans-serif" }}>
              منصة <span className="text-primary">إعلانات الوظائف</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              وجهتك الأولى والموثوقة للبحث عن الوظائف في المملكة العربية السعودية — حكومية وعسكرية وخاصة — كل ذلك في مكان واحد، مجاناً وبلا تعقيد.
            </p>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="border-b border-border/60 bg-card/40">
          <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center text-center gap-2" data-testid={`stat-${label}`}>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-1">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-2xl md:text-3xl font-black text-foreground" style={{ fontFamily: "Cairo, sans-serif" }}>{value}</span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Who We Are ── */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
                <Users className="h-3.5 w-3.5" />
                من نحن
              </div>
              <h2 className="text-3xl font-black text-foreground mb-4" style={{ fontFamily: "Cairo, sans-serif" }}>
                منصة سعودية لكل باحث عن عمل
              </h2>
              <p className="text-muted-foreground leading-loose mb-4">
                <strong className="text-foreground">إعلانات الوظائف</strong> منصة إلكترونية سعودية متخصصة في تجميع ونشر إعلانات الوظائف من مختلف الجهات الحكومية والعسكرية والشركات الخاصة في المملكة العربية السعودية.
              </p>
              <p className="text-muted-foreground leading-loose mb-4">
                انطلقنا من رؤية واضحة: توفير مرجع موحّد يُسهّل على الباحثين عن عمل متابعة الفرص الوظيفية المتاحة دون الحاجة لتصفح عشرات المواقع والحسابات يومياً.
              </p>
              <p className="text-muted-foreground leading-loose">
                نحن فريق متحمس يعمل على مدار الساعة لضمان أن تصلك كل وظيفة جديدة بأسرع وقت ممكن وبمعلومات دقيقة وموثوقة مباشرةً من المصدر الرسمي.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: CheckCircle2, text: "وظائف موثّقة من المصدر الرسمي" },
                { icon: CheckCircle2, text: "تحديث يومي مستمر" },
                { icon: CheckCircle2, text: "تصفية حسب التخصص والمنطقة" },
                { icon: CheckCircle2, text: "مجاني بالكامل للباحثين" },
                { icon: CheckCircle2, text: "إشعارات فورية بالوظائف" },
                { icon: CheckCircle2, text: "مجتمع داعم من الباحثين" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 bg-card border border-border rounded-2xl p-4">
                  <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground font-medium leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Vision & Mission ── */}
        <section className="bg-muted/30 border-y border-border/60">
          <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-8">
            {/* Vision */}
            <div className="relative bg-card border border-border rounded-3xl p-8 overflow-hidden" data-testid="card-vision">
              <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                  <Eye className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-3" style={{ fontFamily: "Cairo, sans-serif" }}>رؤيتنا</h3>
                <p className="text-muted-foreground leading-loose">
                  أن نكون المنصة الأولى والأشمل في المملكة العربية السعودية التي تربط كل باحث عن عمل بالفرصة المناسبة له، وأن نُسهم في تحقيق أهداف رؤية 2030 في رفع نسبة التوظيف وتمكين الكوادر الوطنية.
                </p>
              </div>
            </div>
            {/* Mission */}
            <div className="relative bg-card border border-border rounded-3xl p-8 overflow-hidden" data-testid="card-mission">
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary/5 rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                  <Target className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-3" style={{ fontFamily: "Cairo, sans-serif" }}>رسالتنا</h3>
                <p className="text-muted-foreground leading-loose">
                  تقديم منصة موثوقة وسهلة الاستخدام تجمع إعلانات الوظائف من مختلف القطاعات في مكان واحد، مع توفير أدوات ذكية تُمكّن الباحثين من الوصول إلى وظائفهم المثالية بأقل جهد وأقصر وقت.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── All Features ── */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
              <Zap className="h-3.5 w-3.5" />
              كل ما تحتاجه
            </div>
            <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: "Cairo, sans-serif" }}>مميزات وخدمات المنصة</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">منصة متكاملة تضم كل الأدوات التي يحتاجها الباحث عن عمل في مسيرته المهنية</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visibleFeatures.map(({ icon: Icon, title, desc, href, color, external }) => {
              const content = (
                <div
                  className="group bg-card border border-border rounded-3xl p-5 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-200 h-full flex flex-col"
                  data-testid={`card-feature-${title}`}
                >
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-3 shrink-0 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-foreground font-bold text-base mb-1.5 group-hover:text-primary transition-colors" style={{ fontFamily: "Cairo, sans-serif" }}>
                    {title}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">{desc}</p>
                  {href && (
                    <div className="flex items-center gap-1 text-primary text-xs font-semibold mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>استكشف</span>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );

              if (!href) return <div key={title}>{content}</div>;
              if (external) return (
                <a key={title} href={href} target="_blank" rel="noopener noreferrer">{content}</a>
              );
              return <Link key={title} href={href}>{content}</Link>;
            })}
          </div>
        </section>

        {/* ── Values ── */}
        <section className="bg-muted/30 border-t border-border/60">
          <div className="max-w-5xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
                <Heart className="h-3.5 w-3.5" />
                ما يميّزنا
              </div>
              <h2 className="text-3xl font-black text-foreground" style={{ fontFamily: "Cairo, sans-serif" }}>قيمنا الأساسية</h2>
              <p className="text-muted-foreground mt-2">المبادئ التي تحكم كل قرار نتخذه</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleValues.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="text-center bg-card border border-border rounded-3xl p-6" data-testid={`card-value-${title}`}>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-foreground font-bold text-lg mb-2" style={{ fontFamily: "Cairo, sans-serif" }}>{title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3" style={{ fontFamily: "Cairo, sans-serif" }}>
              ابدأ رحلتك الوظيفية اليوم
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
              انضم إلى آلاف الباحثين عن عمل الذين يعتمدون على منصتنا يومياً للعثور على فرصتهم المناسبة.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {FEATURE_FLAGS.community && <Link
                href="/jobs"
                className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-primary/90 transition-colors"
                data-testid="btn-browse-jobs"
              >
                <Briefcase className="h-4 w-4" />
                تصفح الوظائف
              </Link>}
              <Link
                href="/community"
                className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-bold px-6 py-3 rounded-2xl hover:bg-muted transition-colors"
                data-testid="btn-join-community"
              >
                <MessageSquare className="h-4 w-4" />
                انضم للمجتمع
              </Link>
              <a
                href="https://whatsapp.com/channel/0029VaDUMpy7j6g6y8FRU11S"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-bold px-6 py-3 rounded-2xl hover:bg-muted transition-colors"
                data-testid="btn-join-whatsapp"
              >
                <Send className="h-4 w-4" />
                قناة واتساب
              </a>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
