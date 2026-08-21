export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  date: string;
  type: "civil" | "military" | "company";
  badges: string[];
  logo?: string;
  description?: string;
}

export interface Course {
  id: number;
  title: string;
  provider: string;
  date: string;
  image?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  image?: string;
  content?: string;
}

export const jobs: Job[] = [
  // وظائف مدنية (Civil Jobs) - 10 jobs
  { id: 10, title: "باحث اجتماعي", company: "وزارة الموارد البشرية", location: "الرياض", date: "منذ ساعة", type: "civil", badges: ["حكومي"] },
  { id: 11, title: "أخصائي تقنية معلومات", company: "وزارة الاتصالات", location: "الرياض", date: "منذ ساعتين", type: "civil", badges: ["حكومي", "جديد"] },
  { id: 12, title: "محاسب مالي", company: "وزارة المالية", location: "جدة", date: "منذ 5 ساعات", type: "civil", badges: ["حكومي"] },
  { id: 13, title: "مهندس مدني", company: "أمانة منطقة الرياض", location: "الرياض", date: "منذ 8 ساعات", type: "civil", badges: ["حكومي"] },
  { id: 14, title: "مدير مشاريع", company: "وزارة الإسكان", location: "مكة المكرمة", date: "أمس", type: "civil", badges: ["حكومي"] },
  { id: 15, title: "أخصائي موارد بشرية", company: "وزارة الصحة", location: "المدينة المنورة", date: "قبل يومين", type: "civil", badges: ["حكومي"] },
  { id: 16, title: "سكرتير تنفيذي", company: "وزارة التعليم", location: "الدمام", date: "قبل 3 أيام", type: "civil", badges: ["حكومي"] },
  { id: 17, title: "باحث قانوني", company: "وزارة العدل", location: "الخبر", date: "قبل 4 أيام", type: "civil", badges: ["حكومي"] },
  { id: 18, title: "أخصائي عقود", company: "وزارة التجارة", location: "تبوك", date: "قبل 5 أيام", type: "civil", badges: ["حكومي"] },
  { id: 19, title: "مترجم لغة إنجليزية", company: "وزارة الخارجية", location: "الرياض", date: "قبل أسبوع", type: "civil", badges: ["حكومي"] },

  // وظائف عسكرية (Military Jobs) - 10 jobs
  { id: 20, title: "قبول وتجنيد", company: "وزارة الدفاع", location: "الرياض", date: "منذ 3 ساعات", type: "military", badges: ["عسكري", "تجنيد"] },
  { id: 21, title: "دورة تأهيل الضباط الجامعيين", company: "كلية الملك فيصل الجوية", location: "مختلف المناطق", date: "منذ 6 ساعات", type: "military", badges: ["عسكري", "جامعيين"] },
  { id: 22, title: "وظائف فنية", company: "القوات البحرية الملكية", location: "الجبيل", date: "أمس", type: "military", badges: ["عسكري", "فني"] },
  { id: 23, title: "حرس الحدود", company: "المديرية العامة لحرس الحدود", location: "الحدود الشمالية", date: "أمس", type: "military", badges: ["عسكري", "عاجل"] },
  { id: 24, title: "طيران القوات البرية", company: "وزارة الدفاع", location: "القصيم", date: "قبل يومين", type: "military", badges: ["عسكري"] },
  { id: 25, title: "أمن المنشآت", company: "قوات أمن المنشآت", location: "الشرقية", date: "قبل 3 أيام", type: "military", badges: ["عسكري"] },
  { id: 26, title: "الدفاع المدني", company: "المديرية العامة للدفاع المدني", location: "جازان", date: "قبل 4 أيام", type: "military", badges: ["عسكري", "تجنيد"] },
  { id: 27, title: "الحرس الوطني", company: "وزارة الحرس الوطني", location: "الرياض", date: "قبل 5 أيام", type: "military", badges: ["عسكري"] },
  { id: 28, title: "مكافحة المخدرات", company: "المديرية العامة لمكافحة المخدرات", location: "نجران", date: "قبل أسبوع", type: "military", badges: ["عسكري"] },
  { id: 29, title: "القوات الخاصة لأمن الطرق", company: "الأمن العام", location: "مختلف المناطق", date: "قبل 10 أيام", type: "military", badges: ["عسكري"] },

  // وظائف شركات (Company Jobs) - 10 jobs
  { id: 30, title: "مطور برمجيات", company: "شركة STC", location: "الرياض", date: "منذ 4 ساعات", type: "company", badges: ["شركات", "جديد"] },
  { id: 31, title: "أخصائي تسويق", company: "شركة مراعي", location: "جدة", date: "منذ 7 ساعات", type: "company", badges: ["شركات"] },
  { id: 32, title: "محلل بيانات", company: "شركة علم", location: "الرياض", date: "أمس", type: "company", badges: ["شركات", "تقني"] },
  { id: 33, title: "محاسب", company: "مجموعة صافولا", location: "مكة المكرمة", date: "قبل يومين", type: "company", badges: ["شركات"] },
  { id: 34, title: "مدير مبيعات", company: "شركة نادك", location: "الدمام", date: "قبل 3 أيام", type: "company", badges: ["شركات"] },
  { id: 35, title: "خدمة عملاء", company: "بنك الراجحي", location: "القصيم", date: "قبل 4 أيام", type: "company", badges: ["شركات"] },
  { id: 36, title: "مهندس شبكات", company: "شركة موبايلي", location: "الخبر", date: "قبل 5 أيام", type: "company", badges: ["شركات"] },
  { id: 37, title: "أخصائي لوجستيك", company: "شركة سابك", location: "الجبيل", date: "قبل أسبوع", type: "company", badges: ["شركات"] },
  { id: 38, title: "مصمم جرافيك", company: "وكالة إبداع", location: "جدة", date: "قبل 10 أيام", type: "company", badges: ["شركات", "عن بعد"] },
  { id: 39, title: "مدير عمليات", company: "شركة جرير", location: "الرياض", date: "قبل أسبوعين", type: "company", badges: ["شركات"] },
];

export const pinnedJobs: Job[] = [
  {
    id: 101,
    title: "برنامج تدريب منتهي بالتوظيف",
    company: "أرامكو السعودية",
    location: "الظهران",
    date: "منذ يوم",
    type: "company",
    badges: ["تدريب", "مميز"],
  },
  {
    id: 102,
    title: "وظائف تعليمية وإدارية",
    company: "جامعة الملك سعود",
    location: "الرياض",
    date: "منذ يومين",
    type: "civil",
    badges: ["أكاديمي"],
  },
];

export const courses: Course[] = [
  {
    id: 1,
    title: "مقدمة في الأمن السيبراني",
    provider: "منصة دروب",
    date: "متاح الآن",
  },
  {
    id: 2,
    title: "أساسيات إدارة المشاريع PMP",
    provider: "هدف",
    date: "يبدأ قريباً",
  },
  {
    id: 3,
    title: "تعلم اللغة الإنجليزية للأعمال",
    provider: "رواق",
    date: "مستمر",
  },
];

export const blogPosts: BlogPost[] = [
  // أخبار (5 posts)
  {
    id: 1,
    title: "فتح باب التقديم في الكلية التقنية لعام 2026",
    excerpt: "بدء استقبال طلبات القبول في البرامج التدريبية لمختلف التخصصات التقنية والمهنية.",
    date: "2024-05-22",
    author: "إعلانات الوظائف",
    category: "أخبار",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800&auto=format&fit=crop",
    content: "هذا نص تجريبي لمحتوى المقال الكامل. يمكن إضافة تفاصيل شروط التقديم والمواعيد هنا..."
  },
  {
    id: 11,
    title: "إطلاق منصة توظيف جديدة للقطاع الخاص",
    excerpt: "وزارة الموارد البشرية تطلق منصة متطورة لتسهيل وصول الباحثين عن عمل لفرص القطاع الخاص.",
    date: "2024-05-21",
    author: "إعلانات الوظائف",
    category: "أخبار",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=800&auto=format&fit=crop",
    content: "المحتوى الكامل للمقال يتناول مميزات المنصة الجديدة وكيفية التسجيل فيها..."
  },
  {
    id: 12,
    title: "تمديد فترة التقديم على وظائف وزارة الدفاع",
    excerpt: "أعلنت وزارة الدفاع عن تمديد فترة استقبال الطلبات لعدد من الوظائف العسكرية.",
    date: "2024-05-20",
    author: "إعلانات الوظائف",
    category: "أخبار",
    image: "https://images.unsplash.com/photo-1508107222753-0c2f660f6088?q=80&w=800&auto=format&fit=crop",
    content: "تفاصيل التمديد والمراكز المتاحة..."
  },
  {
    id: 13,
    title: "اعتماد ميزانية برامج التدريب الصيفي",
    excerpt: "الموافقة على ميزانية ضخمة لدعم برامج التدريب التعاوني والصيفي للطلاب.",
    date: "2024-05-19",
    author: "إعلانات الوظائف",
    category: "أخبار",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop",
    content: "خطة التدريب الصيفي لهذا العام..."
  },
  {
    id: 14,
    title: "توطين وظائف الاتصالات وتقنية المعلومات",
    excerpt: "قرار جديد يهدف لزيادة نسبة السعوديين العاملين في قطاع التكنولوجيا.",
    date: "2024-05-18",
    author: "إعلانات الوظائف",
    category: "أخبار",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop",
    content: "تفاصيل قرار التوطين والمهن المستهدفة..."
  },

  // البرامج والدورات (5 posts)
  {
    id: 2,
    title: "دورة مجانية: فن اجتياز المقابلات الشخصية",
    excerpt: "سجل الآن في الدورة التدريبية المكثفة لتطوير مهاراتك في المقابلات الوظيفية.",
    date: "2024-05-21",
    author: "مركز التدريب",
    category: "البرامج والدورات",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=800&auto=format&fit=crop",
    content: "محاور الدورة وطريقة التسجيل..."
  },
  {
    id: 21,
    title: "برنامج تأهيل الخريجين الجدد لسوق العمل",
    excerpt: "برنامج تدريبي متكامل يركز على المهارات الناعمة والتقنية المطلوبة.",
    date: "2024-05-20",
    author: "مركز التدريب",
    category: "البرامج والدورات",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop",
    content: "تفاصيل البرنامج التدريبي..."
  },
  {
    id: 22,
    title: "دورة أساسيات الحوسبة السحابية",
    excerpt: "تعلم أساسيات السحابة وأهم الخدمات المقدمة من أمازون ومايكروسوفت.",
    date: "2024-05-19",
    author: "مركز التدريب",
    category: "البرامج والدورات",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
    content: "منهج الدورة والشهادات المتاحة..."
  },
  {
    id: 23,
    title: "برنامج تدريب القادة الصاعدين",
    excerpt: "تطوير المهارات القيادية والإدارية للموظفين المتميزين.",
    date: "2024-05-18",
    author: "مركز التدريب",
    category: "البرامج والدورات",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop",
    content: "شروط الانضمام لبرنامج القيادة..."
  },
  {
    id: 24,
    title: "دورة التصميم الجرافيكي للمبتدئين",
    excerpt: "ابدأ رحلتك في عالم التصميم وتعلم أساسيات فوتوشوب وإليستريتور.",
    date: "2024-05-17",
    author: "مركز التدريب",
    category: "البرامج والدورات",
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=800&auto=format&fit=crop",
    content: "مشاريع الدورة والأدوات المستخدمة..."
  },

  // مواعيد الجامعات (5 posts)
  {
    id: 3,
    title: "مواعيد القبول في الجامعات السعودية للعام الدراسي القادم",
    excerpt: "دليل شامل يوضح مواعيد بدء ونهاية التقديم في الجامعات الحكومية والخاصة.",
    date: "2024-05-20",
    author: "بوابة الجامعات",
    category: "مواعيد الجامعات",
    image: "https://images.unsplash.com/photo-1523050335392-9beffa5d2205?q=80&w=800&auto=format&fit=crop",
    content: "الجدول الزمني للقبول في كافة الجامعات..."
  },
  {
    id: 31,
    title: "فتح باب التحويل الخارجي بين الجامعات",
    excerpt: "تعرف على شروط ومواعيد التحويل لجامعة الملك فهد وجامعة الملك سعود.",
    date: "2024-05-19",
    author: "بوابة الجامعات",
    category: "مواعيد الجامعات",
    image: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=800&auto=format&fit=crop",
    content: "متطلبات التحويل والإجراءات المتبعة..."
  },
  {
    id: 32,
    title: "برامج الدراسات العليا في جامعة نورا",
    excerpt: "إعلان مواعيد التقديم على برامج الماجستير والدكتوراه للطالبات.",
    date: "2024-05-18",
    author: "بوابة الجامعات",
    category: "مواعيد الجامعات",
    image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800&auto=format&fit=crop",
    content: "التخصصات المتاحة وشروط القبول..."
  },
  {
    id: 33,
    title: "مواعيد اختبارات القدرات والتحصيلي",
    excerpt: "مركز قياس يعلن المواعيد الجديدة لاختبارات القبول الجامعي.",
    date: "2024-05-17",
    author: "بوابة الجامعات",
    category: "مواعيد الجامعات",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
    content: "طريقة التسجيل وتوزيع الدرجات..."
  },
  {
    id: 34,
    title: "إطلاق منح دراسية للطلاب المتميزين",
    excerpt: "برنامج منح جديد يغطي تكاليف الدراسة في أفضل الجامعات الأهلية.",
    date: "2024-05-16",
    author: "بوابة الجامعات",
    category: "مواعيد الجامعات",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop",
    content: "معايير اختيار الطلاب الممنوحين..."
  },

  // مقالات وارشادات (5 posts)
  {
    id: 4,
    title: "كيف تكتب سيرة ذاتية احترافية؟",
    excerpt: "نصائح هامة لضمان قبولك في الوظيفة من خلال سيرة ذاتية مميزة تجذب أصحاب العمل.",
    date: "2024-05-15",
    author: "أحمد محمد",
    category: "مقالات وارشادات",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=800&auto=format&fit=crop",
    content: "خطوات كتابة السيرة الذاتية بالتفصيل..."
  },
  {
    id: 41,
    title: "أهمية بناء شبكة علاقات مهنية (LinkedIn)",
    excerpt: "كيف تستخدم لينكد إن للحصول على فرص وظيفية مخفية وغير معلنة.",
    date: "2024-05-14",
    author: "أحمد محمد",
    category: "مقالات وارشادات",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop",
    content: "استراتيجيات التواصل المهني الفعال..."
  },
  {
    id: 42,
    title: "تنظيم الوقت والإنتاجية أثناء البحث عن عمل",
    excerpt: "خطة يومية تساعدك على البقاء متحمساً ومنظماً خلال رحلة البحث.",
    date: "2024-05-13",
    author: "أحمد محمد",
    category: "مقالات وارشادات",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=800&auto=format&fit=crop",
    content: "أدوات وتطبيقات لإدارة المهام..."
  },
  {
    id: 43,
    title: "العمل الحر: بوابة جديدة لمضاعفة الدخل",
    excerpt: "استكشف منصات العمل الحر وكيف تبدأ مشروعك الخاص بجانب وظيفتك.",
    date: "2024-05-12",
    author: "أحمد محمد",
    category: "مقالات وارشادات",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop",
    content: "نصائح للنجاح في مواقع الفريلانس..."
  },
  {
    id: 44,
    title: "الذكاء الاصطناعي ومستقبل الوظائف",
    excerpt: "هل ستحل الروبوتات مكاننا؟ قراءة في تقرير مستقبل العمل العالمي.",
    date: "2024-05-11",
    author: "أحمد محمد",
    category: "مقالات وارشادات",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop",
    content: "التخصصات التي سيخلقها الذكاء الاصطناعي..."
  },
];
