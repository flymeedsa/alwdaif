import OpenAI from "openai";

// Keep the server bootable when AI is intentionally not configured. Every
// exported AI operation below already exits before making a request when the
// environment variable is absent.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "disabled" });

export interface JobMatchResult {
  matchPercentage: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  summary: string;
  atsCompatible: boolean;
  atsIssues: string[];
}

export async function analyzeJobMatchFromText(params: {
  jobTitle: string;
  jobDescription?: string | null;
  jobCategory?: string;
  cvText: string;
}): Promise<JobMatchResult | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const categoryLabel =
    params.jobCategory === "civil" ? "حكومي/مدني"
    : params.jobCategory === "military" ? "عسكري"
    : "شركة خاصة";

  const prompt = `أنت محلل توظيف متخصص للسوق السعودي. مهمتك مقارنة السيرة الذاتية مع متطلبات الوظيفة، وتقييم توافقها مع نظام ATS.

=== قواعد صارمة ===
١. استخرج البيانات الفعلية من نص السيرة فقط — لا تخترع أو تفترض
٢. قارن فقط مع ما هو مذكور صراحةً في وصف الوظيفة
٣. إذا لم تجد مؤهلاً في السيرة، اذكر "غير محدد في السيرة"
٤. النسبة المئوية تعكس التوافق الحقيقي فقط — لا مجاملة
٥. كل نقطة في strengths/weaknesses مبنية على بيانات حقيقية
٦. لا تكتب نصائح عامة لا علاقة لها بالوظيفة تحديداً

=== معايير تقييم ATS ===
السيرة الذاتية متوافقة مع ATS إذا:
- مكتوبة بنص قابل للقراءة (لا صور، لا جداول معقدة، لا رسوم)
- تحتوي على عناوين واضحة للأقسام (الخبرة، التعليم، المهارات...)
- تضم الكلمات المفتاحية الرئيسية من وصف الوظيفة
- التواصل (البريد الإلكتروني، الهاتف) موجود
- التواريخ بتنسيق واضح
- ليس بها أخطاء إملائية واضحة

=== معلومات الوظيفة ===
العنوان: ${params.jobTitle}
القطاع: ${categoryLabel}
الوصف والمتطلبات: ${params.jobDescription?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2500) || "لا يوجد وصف تفصيلي — قارن بناءً على العنوان فقط"}

=== محتوى السيرة الذاتية ===
${params.cvText.trim().slice(0, 3500)}

=== تعليمات الإخراج ===
أخرج JSON صحيح فقط — بدون أي نص قبله أو بعده:
{
  "matchPercentage": <رقم صحيح من 0 إلى 100>,
  "strengths": ["<نقطة قوة حقيقية من السيرة تتوافق مع الوظيفة>"],
  "weaknesses": ["<متطلب من الوظيفة غير موجود في السيرة أو نقطة ضعف واضحة>"],
  "recommendation": "<أحد ثلاثة خيارات: ينصح بالتقديم | التقديم ممكن مع بعض التحضير | يُنصح بتطوير المؤهلات أولاً>",
  "summary": "<جملتان فقط تلخصان التوافق بشكل مباشر وصريح>",
  "atsCompatible": <true إذا متوافقة مع ATS، false إذا غير متوافقة>,
  "atsIssues": ["<مشكلة ATS محددة إذا وجدت — مصاغة بإيجاز>"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as JobMatchResult;
    if (
      typeof parsed.matchPercentage !== "number" ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.weaknesses) ||
      typeof parsed.recommendation !== "string" ||
      typeof parsed.summary !== "string"
    ) return null;

    parsed.matchPercentage = Math.max(0, Math.min(100, Math.round(parsed.matchPercentage)));
    if (typeof parsed.atsCompatible !== "boolean") parsed.atsCompatible = true;
    if (!Array.isArray(parsed.atsIssues)) parsed.atsIssues = [];
    return parsed;
  } catch (err) {
    console.error("[AI] Failed to analyze job match:", err);
    return null;
  }
}

export async function analyzeJobMatchFromImage(params: {
  jobTitle: string;
  jobDescription?: string | null;
  jobCategory?: string;
  imageBase64: string;
  mimeType: string;
}): Promise<JobMatchResult | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const categoryLabel =
    params.jobCategory === "civil" ? "حكومي/مدني"
    : params.jobCategory === "military" ? "عسكري"
    : "شركة خاصة";

  const systemPrompt = `أنت محلل توظيف متخصص للسوق السعودي. مهمتك:
١. قراءة السيرة الذاتية الموجودة في الصورة بدقة تامة
٢. مقارنة ما تجده مع متطلبات الوظيفة
٣. تقييم توافق السيرة مع نظام ATS

قواعد صارمة:
- استخرج فقط ما هو مكتوب فعلاً في الصورة — لا تخترع أو تفترض
- إذا كانت الصورة غير واضحة، اذكر ذلك في الـ summary
- النسبة تعكس التوافق الحقيقي فقط

معايير ATS: الكلمات المفتاحية من الوظيفة، وضوح الأقسام، بيانات التواصل، تنسيق التواريخ`;

  const userPrompt = `=== معلومات الوظيفة ===
العنوان: ${params.jobTitle}
القطاع: ${categoryLabel}
الوصف والمتطلبات: ${params.jobDescription?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000) || "لا يوجد وصف تفصيلي — قارن بناءً على العنوان فقط"}

=== المطلوب ===
اقرأ السيرة الذاتية في الصورة وحلّل مدى توافقها مع الوظيفة، وقيّم توافقها مع ATS.

أخرج JSON صحيح فقط — بدون أي نص قبله أو بعده:
{
  "matchPercentage": <رقم صحيح من 0 إلى 100>,
  "strengths": ["<نقطة قوة حقيقية من السيرة تتوافق مع الوظيفة>"],
  "weaknesses": ["<متطلب من الوظيفة غير موجود في السيرة أو نقطة ضعف واضحة>"],
  "recommendation": "<أحد ثلاثة خيارات: ينصح بالتقديم | التقديم ممكن مع بعض التحضير | يُنصح بتطوير المؤهلات أولاً>",
  "summary": "<جملتان فقط تلخصان التوافق بشكل مباشر وصريح>",
  "atsCompatible": <true إذا متوافقة مع ATS، false إذا غير متوافقة>,
  "atsIssues": ["<مشكلة ATS محددة إذا وجدت>"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: { url: `data:${params.mimeType};base64,${params.imageBase64}`, detail: "high" },
            },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as JobMatchResult;
    if (
      typeof parsed.matchPercentage !== "number" ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.weaknesses) ||
      typeof parsed.recommendation !== "string" ||
      typeof parsed.summary !== "string"
    ) return null;

    parsed.matchPercentage = Math.max(0, Math.min(100, Math.round(parsed.matchPercentage)));
    if (typeof parsed.atsCompatible !== "boolean") parsed.atsCompatible = true;
    if (!Array.isArray(parsed.atsIssues)) parsed.atsIssues = [];
    return parsed;
  } catch (err) {
    console.error("[AI] Failed to analyze job match from image:", err);
    return null;
  }
}

export async function generateMarketForecast(stats: {
  totalJobs: number;
  civilCount: number;
  militaryCount: number;
  companiesCount: number;
  topCategory: string;
  topCompany: string;
  topJobTitle: string;
  topJobCompany: string;
  newestJobTitle: string;
  newestJobCompany: string;
}): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const prompt = `أنت محرر موقع وظائف سعودي. مهمتك كتابة ملخص دقيق وواقعي بناءً على البيانات الحقيقية التالية فقط — لا تضف أي معلومة غير موجودة في البيانات.

البيانات الحقيقية من المنصة:
- إجمالي الوظائف المنشورة حالياً: ${stats.totalJobs} وظيفة
- منها مدنية: ${stats.civilCount} | عسكرية: ${stats.militaryCount} | شركات: ${stats.companiesCount}
- القطاع الأكثر وظائف: ${stats.topCategory}
- الجهة الأكثر توظيفاً: ${stats.topCompany}
- الوظيفة الأكثر مشاهدة: "${stats.topJobTitle}" من ${stats.topJobCompany}
- آخر وظيفة أُضيفت: "${stats.newestJobTitle}" من ${stats.newestJobCompany}

اكتب ثلاث إلى أربع جمل (ما بين 55 و70 كلمة) تصف الوضع الفعلي لسوق العمل بأسلوب صحفي جذاب ومشوّق — بناءً على هذه البيانات فقط.

القواعد:
- استخدم الأرقام والأسماء الواردة بدقة تامة — لا تزد ولا تنقص
- أسلوب جميل وحيوي يشجّع الباحث على متابعة السوق
- يمكنك استخدام صياغة تحليلية مثل "يُهيمن" و"يتصدّر" و"يُسجّل"
- لا تخترع أي معلومة أو جهة أو وظيفة غير موجودة في البيانات
- باللغة العربية فقط

أخرج النص مباشرةً بدون علامات اقتباس.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.85,
    });
    const content = response.choices[0]?.message?.content?.trim();
    return content || null;
  } catch (err) {
    console.error("[AI] Failed to generate market forecast:", err);
    return null;
  }
}

export async function generateJobSummary(job: {
  title: string;
  description?: string | null;
  category?: string;
  location?: string | null;
}): Promise<string[] | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const categoryLabel =
    job.category === "civil" ? "حكومي"
    : job.category === "military" ? "عسكري"
    : "شركات";

  const prompt = `أنت محرر صحفي متخصص في ملخصات الوظائف باللغة العربية.

اكتب ملخصاً للإعلان الوظيفي التالي على شكل قائمة نقطية من 2 إلى 4 نقاط فقط.

قواعد صارمة:
- كل نقطة أقل من 100 حرف
- لا تذكر اسم الجهة المُعلِنة أبداً
- لا تنسخ النص حرفياً
- ابدأ كل نقطة بفعل أو اسم مباشر
- صياغة احترافية ومختصرة
- باللغة العربية فقط

معلومات الوظيفة:
العنوان: ${job.title}
النوع: ${categoryLabel}
${job.location ? `الموقع: ${job.location}` : ""}
${job.description ? `الوصف:\n${job.description.replace(/<[^>]+>/g, " ").slice(0, 1500)}` : ""}

أخرج النتيجة كـ JSON array من النصوص فقط، مثال:
["نقطة أولى", "نقطة ثانية", "نقطة ثالثة"]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 400,
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const points: string[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.points)
      ? parsed.points
      : Array.isArray(parsed.summary)
      ? parsed.summary
      : Object.values(parsed).find((v) => Array.isArray(v)) as string[] ?? null;

    if (!Array.isArray(points) || points.length === 0) return null;

    return points.slice(0, 4).filter((p) => typeof p === "string" && p.trim().length > 0);
  } catch (err) {
    console.error("[AI] Failed to generate job summary:", err);
    return null;
  }
}

export interface WeeklySummaryData {
  weekLabel: string;
  totalJobs: number;
  civilCount: number;
  militaryCount: number;
  companiesCount: number;
  newJobsThisWeek: number;
  topJobsByViews: Array<{ id: number; title: string; company: string; viewCount: number; category: string; location?: string | null }>;
  topEmployerJobs: Array<{ id: number; title: string; company: string; viewCount: number; region?: string | null }>;
  topCommunityPosts: Array<{ id: number; title: string; commentsCount: number; likesCount: number; viewsCount: number }>;
  topBlogPosts: Array<{ id: number; title: string; viewCount: number }>;
  totalMembers: number;
  newMembersThisWeek: number;
  totalPosts: number;
  newPostsThisWeek: number;
}

function extractJson(text: string): any | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

export async function generateWeeklySummary(data: WeeklySummaryData): Promise<{
  narrative: string;
  topJobsSection: string;
  topPostsSection: string;
  statsSnapshot: string;
  aiAdvice: string;
} | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const civilJobs    = data.topJobsByViews.filter(j => j.category === "civil").slice(0, 5);
  const militaryJobs = data.topJobsByViews.filter(j => j.category === "military").slice(0, 5);
  const companyJobs  = data.topJobsByViews.filter(j => j.category === "companies").slice(0, 5);

  const fmtJob  = (j: { title: string; company: string; viewCount: number; location?: string | null }) =>
    `"${j.title}" — ${j.company}${j.location ? ` (${j.location})` : ""} — ${j.viewCount} مشاهدة`;
  const fmtEmp  = (j: { title: string; company: string; viewCount: number; region?: string | null }) =>
    `"${j.title}" — ${j.company}${j.region ? ` (${j.region})` : ""} — ${j.viewCount} مشاهدة`;
  const fmtPost = (p: { title: string; commentsCount: number; likesCount: number }) =>
    `"${p.title}" (${p.commentsCount} تعليق، ${p.likesCount} إعجاب)`;
  const fmtBlog = (b: { title: string; viewCount: number }) =>
    `"${b.title}" — ${b.viewCount} مشاهدة`;

  // ═══════════════════════════════════════════════
  // AGENT 1 — Data Organizer
  // ═══════════════════════════════════════════════
  const agent1Prompt = `أنت مُنظِّم بيانات. استخرج الحقائق الأساسية فقط من البيانات الخام أدناه وأعدها JSON منظماً.
لا تكتب أي نص خارج الـ JSON. لا تخترع أرقاماً.

=== بيانات خام (${data.weekLabel}) ===

[إحصائيات الأسبوع]
وظائف جديدة أُضيفت هذا الأسبوع تحديداً: ${data.newJobsThisWeek}
إجمالي الوظائف المنشورة في الموقع (كلي وليس أسبوعي): ${data.totalJobs} (حكومية: ${data.civilCount} | عسكرية: ${data.militaryCount} | شركات: ${data.companiesCount})
أعضاء مجتمع جدد هذا الأسبوع: ${data.newMembersThisWeek}
مواضيع مجتمع جديدة هذا الأسبوع: ${data.newPostsThisWeek}

[وظائف حكومية/مدنية — الأكثر مشاهدة]
${civilJobs.length ? civilJobs.map(fmtJob).join("\n") : "لا يوجد"}

[وظائف عسكرية — الأكثر مشاهدة]
${militaryJobs.length ? militaryJobs.map(fmtJob).join("\n") : "لا يوجد"}

[وظائف شركات — الأكثر مشاهدة]
${companyJobs.length ? companyJobs.map(fmtJob).join("\n") : "لا يوجد"}

[وظائف أصحاب العمل — الأكثر مشاهدة]
${data.topEmployerJobs.length ? data.topEmployerJobs.slice(0, 5).map(fmtEmp).join("\n") : "لا يوجد"}

[مواضيع المجتمع — الأكثر تفاعلاً]
${data.topCommunityPosts.length ? data.topCommunityPosts.slice(0, 5).map(fmtPost).join("\n") : "لا يوجد"}

[أحدث المقالات]
${data.topBlogPosts.length ? data.topBlogPosts.slice(0, 5).map(fmtBlog).join("\n") : "لا يوجد"}

=== المطلوب ===
أعد JSON فقط بهذه البنية:
{
  "weekPeriod": "${data.weekLabel}",
  "newJobsThisWeek": ${data.newJobsThisWeek},
  "topCivilJobs": [{"title":"...","company":"...","views":N}],
  "topMilitaryJobs": [{"title":"...","company":"...","views":N}],
  "topCompanyJobs": [{"title":"...","company":"...","views":N}],
  "topEmployerJobs": [{"title":"...","company":"...","views":N}],
  "topCommunityPosts": [{"title":"...","comments":N,"likes":N}],
  "topBlogPosts": [{"title":"...","views":N}],
  "newMembers": ${data.newMembersThisWeek},
  "newCommunityPosts": ${data.newPostsThisWeek}
}`;

  let structuredData: any = null;
  try {
    const r1 = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: agent1Prompt }],
      max_tokens: 800,
      temperature: 0.1,
    });
    structuredData = extractJson(r1.choices[0]?.message?.content?.trim() || "");
  } catch (err) {
    console.error("[AI Agent1] Failed:", err);
    return null;
  }
  if (!structuredData) return null;

  // ═══════════════════════════════════════════════
  // AGENT 2 — Report Writer
  // ═══════════════════════════════════════════════
  const hasEmployer   = structuredData.topEmployerJobs?.length > 0;
  const hasCommunity  = structuredData.topCommunityPosts?.length > 0;
  const hasBlog       = structuredData.topBlogPosts?.length > 0;
  const hasMilitary   = structuredData.topMilitaryJobs?.length > 0;

  const agent2Prompt = `أنت كاتب تقارير أسبوعي محترف لموقع "إعلانات الوظائف" السعودي. جمهورك: باحثون عن عمل في المملكة العربية السعودية.

قواعد الكتابة:
- استخدم فقط ما في البيانات المنظمة أدناه — لا تخترع ولا تفترض
- كن مباشراً وواضحاً — لا عبارات مبهمة ولا تكهنات
- اذكر أسماء الوظائف والجهات بالضبط كما وردت
- إذا قسم "لا يوجد" — أشر إلى ذلك بوضوح ولا تملأه بكلام فارغ
- اكتب بلغة عربية فصيحة واضحة مناسبة للباحث عن عمل

=== البيانات المنظمة للأسبوع ===
${JSON.stringify(structuredData, null, 2)}

=== المطلوب ===
اكتب JSON صحيح فقط — لا تضف أي نص خارجه:

⚠️ تنسيق narrative إلزامي: افصل كل سطر بـ \\n
مثال: "السطر الأول.\\nالسطر الثاني.\\nالسطر الثالث."

{
  "narrative": "<تقرير من 4 إلى 6 أسطر منفصلة بـ \\n يغطي: (1) عدد الوظائف الجديدة هذا الأسبوع بالضبط، (2) أبرز وظيفة أو وظيفتين حكوميتين/مدنيتين بأسمائهن وجهاتهن، (3) أبرز وظيفة أو وظيفتين في الشركات بأسمائهن، ${hasEmployer ? "(4) أبرز وظيفة لأصحاب العمل،" : ""} ${hasCommunity || hasBlog ? `(${hasEmployer ? 5 : 4}) نشاط المجتمع${hasBlog ? " والمقالات" : ""} بالأرقام` : ""} — كل سطر جملة مستقلة وليست مرتبطة بما قبلها>",
  "topJobsSection": "<فقرة واحدة من جملتين إلى ثلاث: ابرز أهم الوظائف المتاحة هذا الأسبوع بأسمائها وجهاتها وعدد مشاهداتها — غطِّ الحكومية والشركات ${hasEmployer ? "وأصحاب العمل" : ""} ${hasMilitary ? "والعسكرية" : ""}>",
  "topPostsSection": "${hasCommunity ? "<جملتان عن أبرز مواضيع المجتمع بأسمائها وأعداد التفاعل>" : "لم يُسجَّل نشاط في المجتمع هذا الأسبوع"}${hasBlog ? " — وأذكر أبرز مقال أو مقالين نُشرا هذا الأسبوع بأسمائهما" : ""}",
  "statsSnapshot": "<جملتان تبرزان أبرز رقمين من الأسبوع يهمّان الباحث عن عمل مباشرة>",
  "aiAdvice": "<تحليل ذكاء اصطناعي بأسلوب صحفي انسيابي — فقرة واحدة متدفقة من 3 إلى 4 جمل. القواعد: (1) استخدم أرقاماً حقيقية من البيانات بالضبط، (2) اذكر أسماء وظائف وجهات كما وردت في البيانات، (3) ابدأ الجمل بأفعال مشوّقة مثل 'يتصدّر' و'يُهيمن' و'يستقطب' و'يُسجّل' و'يعكس'، (4) اختم بملاحظة تحليلية تربط الأرقام بتوجه السوق هذا الأسبوع — لا نقاط ولا عناوين ولا نصائح عامة — فقط فقرة صحفية متدفقة تحلل حركة سوق العمل هذا الأسبوع بدقة واحترافية>"
}`;

  try {
    const r2 = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: agent2Prompt }],
      max_tokens: 1200,
      temperature: 0.7,
    });

    const content = r2.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const parsed = extractJson(content);
    if (!parsed?.narrative || !parsed?.aiAdvice) return null;

    return {
      narrative:      parsed.narrative      || "",
      topJobsSection: parsed.topJobsSection || "",
      topPostsSection:parsed.topPostsSection|| "",
      statsSnapshot:  parsed.statsSnapshot  || "",
      aiAdvice:       parsed.aiAdvice       || "",
    };
  } catch (err) {
    console.error("[AI Agent2] Failed to generate weekly summary:", err);
    return null;
  }
}

export async function analyzeWebsiteStats(data: Record<string, any>, focusArea?: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const LABEL_MAP: Record<string, string> = {
      onlineNow: "المتواجدون حالياً (آخر 24 ساعة)",
      jobs24h: "وظائف نُشرت اليوم",
      announcements24h: "إعلانات أُرسلت اليوم",
      newMembers24h: "أعضاء جدد اليوم",
      totalJobs: "إجمالي الوظائف المنشورة",
      totalOrganizations: "إجمالي الجهات",
      jobs24hInJobs: "وظائف نُشرت اليوم",
      categoryBreakdown: "توزيع الوظائف حسب النوع",
      topJobs: "أكثر الوظائف مشاهدة",
      totalBlogs: "إجمالي مقالات المدونة",
      blogs24h: "مقالات نُشرت اليوم",
      totalCvAnalyses: "إجمالي تحليلات السيرة الذاتية (منذ الإنشاء)",
      totalMembers: "إجمالي أعضاء المجتمع",
      communityPosts24h: "مواضيع جديدة في المجتمع (24 ساعة)",
      communityComments24h: "ردود ومشاركات في المجتمع (24 ساعة)",
      communityPosts7d: "مواضيع المجتمع (آخر 7 أيام)",
    };

    const CATEGORY_MAP: Record<string, string> = { civil: "مدني", military: "عسكري", companies: "شركات", results: "نتائج" };

    const lines: string[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (key === "topJobs") {
        const jobs = value as any[];
        if (jobs?.length) {
          lines.push(`${LABEL_MAP.topJobs}:`);
          jobs.forEach((j: any, i: number) => {
            lines.push(`  ${i + 1}. "${j.title}" — ${j.company} (${j.viewCount} مشاهدة، ${CATEGORY_MAP[j.category] || j.category})`);
          });
        }
      } else if (key === "categoryBreakdown" && typeof value === "object") {
        const breakdown = Object.entries(value as Record<string, number>)
          .map(([k, v]) => `${CATEGORY_MAP[k] || k}: ${v}`)
          .join("، ");
        lines.push(`${LABEL_MAP.categoryBreakdown}: ${breakdown}`);
      } else if (LABEL_MAP[key] !== undefined) {
        lines.push(`${LABEL_MAP[key]}: ${value}`);
      }
    }

    const sectionTitle = focusArea || "الموقع";

    const prompt = `أنت محلل بيانات متخصص في مواقع التوظيف السعودية. حلّل البيانات التالية الخاصة بـ "${sectionTitle}" في موقع إعلانات الوظائف، وقدّم تحليلاً مركّزاً ومفيداً باللغة العربية الفصيحة.

=== البيانات ===
${lines.join("\n")}

=== المطلوب ===
قدّم تحليلاً منظماً ومركّزاً على "${sectionTitle}" يشمل:
1. ملخص سريع (جملتان)
2. أبرز نقطتين أو ثلاث إيجابية
3. نقطة واحدة أو نقطتان تحتاجان اهتماماً
4. توصية واحدة عملية وقابلة للتنفيذ فوراً

اجعل الإجابة موجزة ومباشرة وخاصة بهذا القسم فقط، بأسلوب مهني.`;

    const response = await new (await import("openai")).default({ apiKey: process.env.OPENAI_API_KEY }).chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("[AI] Failed to analyze website stats:", err);
    return null;
  }
}
