import { db } from "./db";
import { categories, blogCategories, ads, faqCategories, faqItems } from "@workspace/db";
import { count, eq, isNull, and } from "drizzle-orm";

export async function seedCategories() {
  const [result] = await db.select({ value: count() }).from(categories);
  if ((result?.value ?? 0) > 0) {
    console.log("Categories already exist, skipping seed.");
    return;
  }

  const defaultCategories = [
    { name: 'وظائف مدنية', slug: 'civil', type: 'job', isActive: true },
    { name: 'وظائف عسكرية', slug: 'military', type: 'job', isActive: true },
    { name: 'وظائف شركات', slug: 'companies', type: 'job', isActive: true },
    { name: 'نتائج التوظيف', slug: 'results', type: 'job', isActive: true },
    { name: 'أخبار', slug: 'news', type: 'blog', isActive: true },
    { name: 'البرامج والدورات', slug: 'programs-courses', type: 'blog', isActive: true },
    { name: 'مواعيد الجامعات', slug: 'university-dates', type: 'blog', isActive: true },
    { name: 'مقالات وارشادات', slug: 'articles-guides', type: 'blog', isActive: true },
  ];

  console.log("Seeding categories...");
  for (const cat of defaultCategories) {
    await db.insert(categories).values(cat);
    console.log(`Created category: ${cat.name}`);
  }
  console.log("Categories seeding completed.");
}

export async function seedBlogCategories() {
  const recommended = [
    { name: "نصائح السيرة الذاتية", slug: "cv-tips", sortOrder: 1 },
    { name: "التحضير للمقابلات", slug: "interview-prep", sortOrder: 2 },
    { name: "سوق العمل السعودي", slug: "saudi-job-market", sortOrder: 3 },
    { name: "التطوير المهني", slug: "professional-development", sortOrder: 4 },
    { name: "حقوق العمال", slug: "labor-rights", sortOrder: 5 },
  ];

  for (const cat of recommended) {
    const [existing] = await db
      .select({ id: blogCategories.id })
      .from(blogCategories)
      .where(eq(blogCategories.slug, cat.slug));
    if (!existing) {
      await db.insert(blogCategories).values({ ...cat, isActive: true });
      console.log(`[seed] blog category added: ${cat.name}`);
    }
  }
}

export async function seedAds() {
  const [result] = await db.select({ value: count() })
    .from(ads)
    .where(eq(ads.position, "header_banner"));
  if ((result?.value ?? 0) > 0) {
    console.log("Ads already exist, skipping seed.");
    return;
  }

  const defaultAds = [
    {
      title: "أرسل برقيتك العاجلة الآن",
      type: "image",
      content: "Zap|إرسال فوري\nHash|رقم تتبع\nShield|منصة معتمدة\nRocket|ضمان توصيل",
      description: "للديوان الملكي وأمراء المناطق والجهات الحكومية",
      ctaText: "أرسل برقيتك الآن",
      titleColor: "#1e3a8a",
      ctaBgColor: "#1d4ed8",
      ctaTextColor: "#ffffff",
      targetInterests: "civil,military,results,companies,برامج",
      imageUrl: "/barqiyat-logo.png",
      linkUrl: "https://barqiyat.com.sa/-/p1687672357",
      position: "header_banner",
      pages: "",
      isActive: true,
      priority: 10,
    },
    {
      title: "صمم سيرتك الذاتية بتقنية ATS بسهولة",
      type: "image",
      content: "FileText|سيرة ذاتية بنظام ATS\nZap|تسليم في نفس اليوم",
      description: "عزز فرصك بالقبول، واحصل على سيرة ذاتية تتوافق مع أنظمة ATS الآن.",
      ctaText: "ابدأ الآن",
      titleColor: "#e22400",
      ctaBgColor: "",
      ctaTextColor: "",
      targetInterests: "civil,companies,community,military,courses",
      imageUrl: "icon:UserCheck",
      linkUrl: "/store/services/cv-atc",
      position: "header_banner",
      pages: "",
      isActive: true,
      priority: 10,
    },
    {
      title: "ارسل برقية طلب وظيفة حكومية بكل سهولة",
      type: "image",
      content: "Rocket|ارسال فوري\nFileText|رقم تتبع",
      description: "استفد من خدمتنا في إرسال برقيات طلب الوظائف الحكومية بسرعة وكفاءة.",
      ctaText: "ابدأ الآن",
      titleColor: "#7a4a00",
      ctaBgColor: "",
      ctaTextColor: "",
      targetInterests: "",
      imageUrl: "icon:ScrollText",
      linkUrl: "#",
      position: "header_banner",
      pages: "",
      isActive: true,
      priority: 10,
    },
  ];

  console.log("Seeding ads...");
  for (const ad of defaultAds) {
    await db.insert(ads).values(ad);
    console.log(`Created ad: ${ad.title}`);
  }
  console.log("Ads seeding completed.");
}

export async function seedFaq() {
  const [result] = await db.select({ value: count() }).from(faqCategories);
  if ((result?.value ?? 0) > 0) {
    console.log("FAQ already seeded, skipping.");
    return;
  }

  console.log("Seeding FAQ categories and questions...");

  const catDefs = [
    { name: "عام",                      slug: "general",       sortOrder: 1 },
    { name: "الوظائف",                  slug: "jobs",          sortOrder: 2 },
    { name: "التنبيهات والمتابعة",      slug: "notifications", sortOrder: 3 },
    { name: "الحساب",                   slug: "account",       sortOrder: 4 },
    { name: "الجهات والشركات",          slug: "organizations", sortOrder: 5 },
    { name: "قانوني",                   slug: "legal",         sortOrder: 6 },
  ];

  for (const c of catDefs) {
    await db.insert(faqCategories).values(c);
  }
  console.log(`Inserted ${catDefs.length} FAQ categories.`);

  const items = [
    // ── عام ──
    { question: "ما هو موقع إعلانات الوظائف؟", answer: "موقع إعلانات الوظائف (alwdaif.com) منصة إعلامية متخصصة في نقل وعرض إعلانات الوظائف الحكومية والعسكرية والشركات في المملكة العربية السعودية من مصادرها الرسمية المعتمدة.", category: "general", sortOrder: 1, isPublished: true },
    { question: "هل الموقع مجاني للباحثين عن عمل؟", answer: "نعم، تصفح الوظائف والاشتراك في التنبيهات مجاني تماماً لجميع الباحثين عن عمل دون أي رسوم.", category: "general", sortOrder: 2, isPublished: true },
    { question: "هل تساعدون في توظيفي مباشرة؟", answer: "لا، نحن منصة إعلانية تنقل الإعلانات من مصادرها الرسمية. عليك التقديم مباشرة على الجهة المعلنة عبر الرابط المرفق مع كل إعلان.", category: "general", sortOrder: 3, isPublished: true },
    { question: "من أين تأتي الوظائف المعروضة؟", answer: "نستقي الإعلانات من المصادر الرسمية مثل مواقع الجهات الحكومية، الشركات، الصحف الرسمية، وأنظمة التوظيف المعتمدة. نحرص على التحقق من المصدر قبل النشر.", category: "general", sortOrder: 4, isPublished: true },
    { question: "كيف يمكنني التواصل مع فريق الموقع؟", answer: "يمكنك التواصل معنا عبر: واتساب 00966533465740، أو عبر نموذج الاتصال في صفحة اتصل بنا، أو من خلال مركز الدعم في حسابك.", category: "general", sortOrder: 5, isPublished: true },
    // ── وظائف ──
    { question: "كيف أتقدم على وظيفة؟", answer: "اضغط على زر 'التقديم' أو 'المصدر الرسمي' في الإعلان، وسيتم تحويلك مباشرة إلى الجهة المعلنة لإكمال التقديم.", category: "jobs", sortOrder: 1, isPublished: true },
    { question: "ما الفرق بين الوظائف المدنية والعسكرية؟", answer: "الوظائف المدنية تتبع الجهات الحكومية المدنية كالوزارات والمستشفيات. الوظائف العسكرية تتبع القوات المسلحة والأمن والحرس الوطني وما في حكمها.", category: "jobs", sortOrder: 2, isPublished: true },
    { question: "هل الوظائف المنشورة متاحة للجنسين؟", answer: "يعكس الإعلان المنشور شروط الجهة المعلنة. بعض الوظائف للجنسين، وبعضها مخصص لجنس بعينه. يُرجى الاطلاع على شروط كل إعلان.", category: "jobs", sortOrder: 3, isPublished: true },
    { question: "كم تبقى الوظيفة منشورة في الموقع؟", answer: "تبقى الوظيفة منشورة حتى يُعلن عن إغلاق التقديم أو حتى تاريخ انتهاء الإعلان المحدد من الجهة. نُزيل الإعلانات المنتهية بشكل منتظم.", category: "jobs", sortOrder: 4, isPublished: true },
    { question: "وجدت إعلان وظيفي مشبوه أو وهمي، ماذا أفعل؟", answer: "راسلنا فوراً عبر واتساب أو صفحة اتصل بنا، وأرسل لنا رابط الإعلان. نأخذ هذا الأمر بجدية ونتحقق من كل بلاغ فور وصوله.", category: "jobs", sortOrder: 5, isPublished: true },
    { question: "هل يمكنني حفظ الوظائف والعودة إليها لاحقاً؟", answer: "نعم، بعد تسجيل الدخول يمكنك الضغط على أيقونة القلب لحفظ أي وظيفة. تجد وظائفك المحفوظة في لوحة تحكم حسابك.", category: "jobs", sortOrder: 6, isPublished: true },
    // ── تنبيهات ──
    { question: "كيف أشترك في تنبيهات الوظائف؟", answer: "سجّل حساباً مجانياً ثم تابع الجهات التي تهمك. ستصلك إشعارات عند نشر وظيفة جديدة من أي جهة تتابعها.", category: "notifications", sortOrder: 1, isPublished: true },
    { question: "كيف أنضم إلى مجموعة واتساب للوظائف؟", answer: "راسلنا على رقم الواتساب 00966533465740 وسنضيفك للمجموعة المناسبة حسب تخصصك أو اهتمامك.", category: "notifications", sortOrder: 2, isPublished: true },
    { question: "لماذا لا تصلني الإشعارات؟", answer: "تأكد من: (١) تسجيل الدخول لحسابك، (٢) متابعة الجهات المطلوبة من صفحة الجهات، (٣) السماح للمتصفح بالإشعارات. يمكنك أيضاً الاطلاع على الوظائف مباشرة من لوحة التحكم.", category: "notifications", sortOrder: 3, isPublished: true },
    { question: "هل يمكنني إلغاء الاشتراك في التنبيهات؟", answer: "نعم، يمكنك إلغاء متابعة أي جهة في أي وقت من صفحة الجهات أو من لوحة تحكم حسابك في قسم التنبيهات.", category: "notifications", sortOrder: 4, isPublished: true },
    // ── الحساب ──
    { question: "كيف أنشئ حساباً؟", answer: "اضغط على 'تسجيل الدخول' في الزاوية العلوية وسجّل عبر حسابك. العملية سريعة ولا تحتاج إلى خطوات معقدة.", category: "account", sortOrder: 1, isPublished: true },
    { question: "كيف أحذف حسابي؟", answer: "تواصل معنا عبر صفحة اتصل بنا أو الواتساب وسنحذف حسابك وبياناتك خلال ٣ أيام عمل.", category: "account", sortOrder: 2, isPublished: true },
    { question: "هل بياناتي محفوظة وآمنة؟", answer: "نعم، نلتزم بأعلى معايير حماية البيانات. تُشفَّر الاتصالات بـ HTTPS وتُحفظ بياناتك في قاعدة بيانات مشفّرة. راجع سياسة الخصوصية لمزيد من التفاصيل.", category: "account", sortOrder: 3, isPublished: true },
    { question: "نسيت كلمة المرور، ماذا أفعل؟", answer: "تسجيل الدخول يتم عبر حسابك المرتبط ولا توجد كلمة مرور مستقلة للموقع. في حال واجهت مشكلة، تواصل معنا عبر الدعم.", category: "account", sortOrder: 4, isPublished: true },
    // ── الجهات والشركات ──
    { question: "كيف تنشر جهتي وظائفها عبر الموقع؟", answer: "تواصل معنا عبر واتساب أو نموذج اتصل بنا لمناقشة خيارات النشر المتاحة للجهات والشركات.", category: "organizations", sortOrder: 1, isPublished: true },
    { question: "هل تنشرون وظائف القطاع الخاص؟", answer: "نعم، نعرض وظائف الشركات والمؤسسات الخاصة إلى جانب الوظائف الحكومية والعسكرية.", category: "organizations", sortOrder: 2, isPublished: true },
    { question: "كيف أتحقق من مصداقية الجهة المعلنة؟", answer: "نربط كل إعلان بالمصدر الرسمي للجهة. إذا شككت في أي إعلان، ابحث عن الجهة مباشرة عبر الموقع الرسمي للحكومة السعودية.", category: "organizations", sortOrder: 3, isPublished: true },
    // ── قانوني ──
    { question: "هل يحق لكم نشر إعلانات الجهات الحكومية؟", answer: "نعم، الإعلانات الحكومية معلومات عامة تُنشر في الجرائد الرسمية والمواقع العامة. نقوم بنقلها للتيسير على الباحثين دون تعديل أو تحريف.", category: "legal", sortOrder: 1, isPublished: true },
    { question: "ما الذي يحكم استخدامي للموقع؟", answer: "يخضع استخدام الموقع لشروط الاستخدام وسياسة الخصوصية المنشورتين في الروابط أسفل الصفحة، وفق أنظمة المملكة العربية السعودية.", category: "legal", sortOrder: 2, isPublished: true },
    { question: "هل تطلبون أموالاً مقابل الحصول على وظيفة؟", answer: "لا بأي شكل من الأشكال. لا نطلب أموالاً مقابل مساعدتك في الحصول على وظيفة. أي شخص يدّعي تمثيلنا ويطلب مالاً يُعدّ محتالاً.", category: "legal", sortOrder: 3, isPublished: true },
    { question: "كيف أُبلّغ عن انتهاك لحقوق الملكية الفكرية؟", answer: "أرسل إشعار DMCA أو بلاغاً مفصلاً عبر صفحة اتصل بنا وسنتعامل معه خلال ٧ أيام عمل.", category: "legal", sortOrder: 4, isPublished: true },
  ];

  for (const item of items) {
    await db.insert(faqItems).values(item);
  }
  console.log(`Inserted ${items.length} FAQ questions.`);
  console.log("FAQ seeding completed.");
}

export async function ensureJobCategoryHierarchy() {
  const existing = await db.select().from(categories).where(eq(categories.type, "job"));

  let parent = existing.find(c => c.slug === "all" && c.parentId === null);

  if (!parent) {
    const [inserted] = await db.insert(categories).values({
      name: "كل الوظائف",
      slug: "all",
      type: "job",
      isActive: true,
      parentId: null,
      sortOrder: 0,
      icon: "briefcase",
    }).returning();
    parent = inserted;
    console.log("Created parent category: كل الوظائف");
  }

  const jobSlugs = ["civil", "military", "companies", "results"];
  for (const slug of jobSlugs) {
    const cat = existing.find(c => c.slug === slug);
    if (cat && cat.parentId !== parent!.id) {
      const sortMap: Record<string, number> = { civil: 1, military: 2, companies: 3, results: 4 };
      await db.update(categories)
        .set({ parentId: parent!.id, sortOrder: sortMap[slug] ?? 99 })
        .where(eq(categories.id, cat.id));
      console.log(`Linked category '${slug}' to parent`);
    }
  }
}
