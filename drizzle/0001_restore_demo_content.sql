-- Restore the organization directory from names represented in the original
-- job dataset, then add clearly labelled demo content requested by the owner.

INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'وزارة الصحة', 'government', 'جهة حكومية مسؤولة عن القطاع الصحي في المملكة العربية السعودية.', 'https://www.moh.gov.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'وزارة الصحة');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'وزارة التعليم', 'government', 'جهة حكومية مسؤولة عن التعليم العام والجامعي في المملكة.', 'https://www.moe.gov.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'وزارة التعليم');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'وزارة العدل', 'government', 'جهة حكومية تقدم الخدمات العدلية والقضائية.', 'https://www.moj.gov.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'وزارة العدل');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'وزارة التجارة', 'government', 'جهة حكومية تُعنى بتنظيم وتنمية النشاط التجاري.', 'https://mc.gov.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'وزارة التجارة');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'وزارة المالية', 'government', 'جهة حكومية مسؤولة عن السياسات المالية والميزانية العامة.', 'https://www.mof.gov.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'وزارة المالية');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'وزارة الاتصالات وتقنية المعلومات', 'government', 'جهة حكومية مسؤولة عن تنمية قطاع الاتصالات والتقنية.', 'https://www.mcit.gov.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'وزارة الاتصالات وتقنية المعلومات');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'وزارة الدفاع', 'military', 'جهة حكومية تُعنى بالدفاع عن المملكة وقواتها المسلحة.', 'https://www.mod.gov.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'وزارة الدفاع');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'المديرية العامة للدفاع المدني', 'military', 'جهة مختصة بالحماية المدنية والسلامة والاستجابة للحوادث.', 'https://www.998.gov.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'المديرية العامة للدفاع المدني');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'المديرية العامة لحرس الحدود', 'military', 'جهة أمنية مسؤولة عن حماية حدود المملكة.', 'https://www.moi.gov.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'المديرية العامة لحرس الحدود');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'أمانة منطقة الرياض', 'government', 'جهة بلدية مسؤولة عن تنمية وخدمات مدينة الرياض.', 'https://www.alriyadh.gov.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'أمانة منطقة الرياض');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'الخطوط السعودية', 'company', 'شركة طيران وطنية تقدم خدمات النقل الجوي.', 'https://www.saudia.com', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'الخطوط السعودية');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'شركة الاتصالات السعودية', 'company', 'شركة وطنية تعمل في خدمات الاتصالات والحلول الرقمية.', 'https://www.stc.com.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'شركة الاتصالات السعودية');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'شركة سابك', 'company', 'شركة صناعية وطنية تعمل في الصناعات الكيميائية.', 'https://www.sabic.com', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'شركة سابك');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'شركة أرامكو السعودية', 'company', 'شركة وطنية متكاملة تعمل في قطاع الطاقة.', 'https://www.aramco.com', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'شركة أرامكو السعودية');
--> statement-breakpoint

INSERT INTO `jobs` (`title`, `company`, `organization_id`, `category`, `date`, `location`, `description`, `summary`, `apply_url`, `source_url`, `status`, `is_featured`, `is_active`, `deadline_date`)
SELECT '[تجريبي] أخصائي موارد بشرية', 'وزارة الصحة', (SELECT `id` FROM `organizations` WHERE `name` = 'وزارة الصحة' LIMIT 1), 'civil', '2026-08-18', 'الرياض', 'إعلان تجريبي لاختبار عرض الوظائف المدنية. تشمل المهام دعم عمليات الموارد البشرية وإعداد التقارير.', 'فرصة تجريبية في الموارد البشرية ضمن قسم الوظائف المدنية.', '/contact', '/contact', 'published', 1, 1, unixepoch('2026-12-31') * 1000
WHERE NOT EXISTS (SELECT 1 FROM `jobs` WHERE `title` = '[تجريبي] أخصائي موارد بشرية' AND `company` = 'وزارة الصحة');
--> statement-breakpoint
INSERT INTO `jobs` (`title`, `company`, `organization_id`, `category`, `date`, `location`, `description`, `summary`, `apply_url`, `source_url`, `status`, `is_featured`, `is_active`, `deadline_date`)
SELECT '[تجريبي] محلل بيانات', 'وزارة التعليم', (SELECT `id` FROM `organizations` WHERE `name` = 'وزارة التعليم' LIMIT 1), 'civil', '2026-08-18', 'جدة', 'إعلان تجريبي لاختبار عرض الوظائف المدنية. المطلوب تحليل البيانات وإعداد لوحات المؤشرات.', 'فرصة تجريبية لمحلل بيانات في جهة حكومية.', '/contact', '/contact', 'published', 0, 1, unixepoch('2026-12-31') * 1000
WHERE NOT EXISTS (SELECT 1 FROM `jobs` WHERE `title` = '[تجريبي] محلل بيانات' AND `company` = 'وزارة التعليم');
--> statement-breakpoint
INSERT INTO `jobs` (`title`, `company`, `organization_id`, `category`, `date`, `location`, `description`, `summary`, `apply_url`, `source_url`, `status`, `is_featured`, `is_active`, `deadline_date`)
SELECT '[تجريبي] فني اتصالات عسكرية', 'وزارة الدفاع', (SELECT `id` FROM `organizations` WHERE `name` = 'وزارة الدفاع' LIMIT 1), 'military', '2026-08-18', 'مختلف المناطق', 'إعلان تجريبي لاختبار قسم الوظائف العسكرية. يتضمن العمل دعم أنظمة الاتصالات والمساندة الفنية.', 'فرصة تجريبية في مجال الاتصالات العسكرية.', '/contact', '/contact', 'published', 1, 1, unixepoch('2026-12-31') * 1000
WHERE NOT EXISTS (SELECT 1 FROM `jobs` WHERE `title` = '[تجريبي] فني اتصالات عسكرية' AND `company` = 'وزارة الدفاع');
--> statement-breakpoint
INSERT INTO `jobs` (`title`, `company`, `organization_id`, `category`, `date`, `location`, `description`, `summary`, `apply_url`, `source_url`, `status`, `is_featured`, `is_active`, `deadline_date`)
SELECT '[تجريبي] أخصائي سلامة وإنقاذ', 'المديرية العامة للدفاع المدني', (SELECT `id` FROM `organizations` WHERE `name` = 'المديرية العامة للدفاع المدني' LIMIT 1), 'military', '2026-08-18', 'الدمام', 'إعلان تجريبي لاختبار قسم الوظائف العسكرية. تشمل المهام تطبيق إجراءات السلامة والاستجابة للطوارئ.', 'فرصة تجريبية في السلامة والإنقاذ.', '/contact', '/contact', 'published', 0, 1, unixepoch('2026-12-31') * 1000
WHERE NOT EXISTS (SELECT 1 FROM `jobs` WHERE `title` = '[تجريبي] أخصائي سلامة وإنقاذ' AND `company` = 'المديرية العامة للدفاع المدني');
--> statement-breakpoint
INSERT INTO `jobs` (`title`, `company`, `organization_id`, `category`, `date`, `location`, `description`, `summary`, `apply_url`, `source_url`, `status`, `is_featured`, `is_active`, `deadline_date`)
SELECT '[تجريبي] مهندس أنظمة رقمية', 'شركة الاتصالات السعودية', (SELECT `id` FROM `organizations` WHERE `name` = 'شركة الاتصالات السعودية' LIMIT 1), 'companies', '2026-08-18', 'الرياض', 'إعلان تجريبي لاختبار قسم وظائف الشركات. يشمل الدور تطوير الأنظمة الرقمية وتحسين موثوقيتها.', 'فرصة تجريبية في هندسة الأنظمة الرقمية.', '/contact', '/contact', 'published', 1, 1, unixepoch('2026-12-31') * 1000
WHERE NOT EXISTS (SELECT 1 FROM `jobs` WHERE `title` = '[تجريبي] مهندس أنظمة رقمية' AND `company` = 'شركة الاتصالات السعودية');
--> statement-breakpoint
INSERT INTO `jobs` (`title`, `company`, `organization_id`, `category`, `date`, `location`, `description`, `summary`, `apply_url`, `source_url`, `status`, `is_featured`, `is_active`, `deadline_date`)
SELECT '[تجريبي] محلل سلاسل الإمداد', 'شركة سابك', (SELECT `id` FROM `organizations` WHERE `name` = 'شركة سابك' LIMIT 1), 'companies', '2026-08-18', 'الجبيل', 'إعلان تجريبي لاختبار قسم وظائف الشركات. تشمل المهام تحليل الإمداد والمخزون وإعداد التوصيات.', 'فرصة تجريبية في سلاسل الإمداد.', '/contact', '/contact', 'published', 0, 1, unixepoch('2026-12-31') * 1000
WHERE NOT EXISTS (SELECT 1 FROM `jobs` WHERE `title` = '[تجريبي] محلل سلاسل الإمداد' AND `company` = 'شركة سابك');
--> statement-breakpoint

INSERT INTO `employer_jobs` (`title`, `company`, `region`, `city`, `work_schedule`, `work_mode`, `description`, `requirements`, `target_gender`, `target_nationality`, `contact_method`, `contact_value`, `submitter_name`, `submitter_email`, `status`, `deadline_date`)
SELECT '[تجريبي] منسق عمليات', 'شركة آفاق الأعمال', 'الرياض', 'الرياض', 'full_time', 'on_site', 'إعلان تجريبي لاختبار صفحة وظائف أصحاب العمل.', 'إجادة الحاسب والتنظيم والتواصل.', 'all', 'saudi', 'url', '/contact', 'فريق الموقع', 'demo@example.test', 'published', unixepoch('2026-12-31') * 1000
WHERE NOT EXISTS (SELECT 1 FROM `employer_jobs` WHERE `title` = '[تجريبي] منسق عمليات' AND `company` = 'شركة آفاق الأعمال');
--> statement-breakpoint
INSERT INTO `employer_jobs` (`title`, `company`, `region`, `city`, `work_schedule`, `work_mode`, `description`, `requirements`, `target_gender`, `target_nationality`, `contact_method`, `contact_value`, `submitter_name`, `submitter_email`, `status`, `deadline_date`)
SELECT '[تجريبي] مصمم محتوى رقمي', 'استوديو نمو', 'كل المناطق', 'عن بعد', 'part_time', 'remote', 'إعلان تجريبي لاختبار وظائف أصحاب العمل والعمل عن بعد.', 'مهارات في التصميم وكتابة المحتوى.', 'all', 'all', 'url', '/contact', 'فريق الموقع', 'demo@example.test', 'published', unixepoch('2026-12-31') * 1000
WHERE NOT EXISTS (SELECT 1 FROM `employer_jobs` WHERE `title` = '[تجريبي] مصمم محتوى رقمي' AND `company` = 'استوديو نمو');
--> statement-breakpoint

INSERT INTO `results` (`title`, `org`, `organization_id`, `type`, `date`, `details`, `inquiry_url`, `status`, `is_active`)
SELECT '[تجريبي] نتائج القبول الأولي للوظائف المدنية', 'وزارة الصحة', (SELECT `id` FROM `organizations` WHERE `name` = 'وزارة الصحة' LIMIT 1), 'قبول', '2026-08-18', 'نتيجة تجريبية لاختبار قسم نتائج التوظيف ولا تمثل إعلان قبول حقيقي.', '/contact', 'published', 1
WHERE NOT EXISTS (SELECT 1 FROM `results` WHERE `title` = '[تجريبي] نتائج القبول الأولي للوظائف المدنية');
--> statement-breakpoint
INSERT INTO `results` (`title`, `org`, `organization_id`, `type`, `date`, `details`, `inquiry_url`, `status`, `is_active`)
SELECT '[تجريبي] نتائج الترشيح للمقابلات', 'شركة الاتصالات السعودية', (SELECT `id` FROM `organizations` WHERE `name` = 'شركة الاتصالات السعودية' LIMIT 1), 'ترشيح', '2026-08-18', 'نتيجة تجريبية لاختبار واجهة النتائج ولا تمثل ترشيحًا حقيقيًا.', '/contact', 'published', 1
WHERE NOT EXISTS (SELECT 1 FROM `results` WHERE `title` = '[تجريبي] نتائج الترشيح للمقابلات');
--> statement-breakpoint

INSERT OR IGNORE INTO `blog_categories` (`name`, `slug`, `description`, `sort_order`, `is_active`)
VALUES ('سوق العمل السعودي', 'saudi-job-market', 'مقالات وأدلة تجريبية حول سوق العمل والتطوير المهني.', 1, 1);
--> statement-breakpoint
INSERT INTO `blog_posts` (`title`, `slug`, `excerpt`, `content`, `image`, `source`, `category`, `author`, `date`, `status`, `is_published`)
SELECT '[تجريبي] كيف تستعد لفرص التوظيف في السوق السعودي؟', 'demo-prepare-for-saudi-job-market', 'دليل تجريبي مختصر يساعد الباحث عن عمل على تنظيم خطوات البحث والتقديم والمتابعة.', '<h2>ابدأ بهدف واضح</h2><p>حدّد المجال الذي يناسب خبرتك، ثم جهّز قائمة بالجهات والوظائف التي تريد متابعتها.</p><h2>حدّث سيرتك الذاتية</h2><p>اجعل السيرة مختصرة وواضحة، وخصّص المهارات والخبرات بما يتوافق مع كل إعلان.</p><h2>تابع طلباتك</h2><p>سجّل مواعيد التقديم والردود والمقابلات لتتمكن من المتابعة باحترافية.</p><p><strong>تنبيه:</strong> هذا محتوى تجريبي مخصص لاختبار تصميم المدونة.</p>', '/article-images/saudi-workplace-recruitment.png', 'محتوى تجريبي', 'saudi-job-market', 'فريق التحرير', '2026-08-18', 'published', 1
WHERE NOT EXISTS (SELECT 1 FROM `blog_posts` WHERE `slug` = 'demo-prepare-for-saudi-job-market');
--> statement-breakpoint
INSERT INTO `blog_posts` (`title`, `slug`, `excerpt`, `content`, `image`, `source`, `category`, `author`, `date`, `status`, `is_published`)
SELECT '[تجريبي] مهارات الذكاء الاصطناعي التي تدعم مسارك المهني', 'demo-ai-skills-for-career', 'مقال تجريبي عن الاستفادة العملية من أدوات الذكاء الاصطناعي في التعلم والعمل.', '<h2>استخدم الأدوات بوعي</h2><p>يمكن للذكاء الاصطناعي مساعدتك في تلخيص المعلومات، وتنظيم خطة تعلم، والتدرّب على أسئلة المقابلات.</p><h2>طوّر مهارة التحقق</h2><p>راجع دائمًا النتائج والمعلومات قبل استخدامها، ولا تشارك بيانات شخصية أو حساسة.</p><h2>اربط التقنية بتخصصك</h2><p>القيمة الحقيقية تأتي من توظيف الأدوات لحل مشكلات مرتبطة بمجالك وخبرتك.</p><p><strong>تنبيه:</strong> هذا محتوى تجريبي مخصص لاختبار تصميم المدونة.</p>', '/article-images/ai-career-skills.png', 'محتوى تجريبي', 'saudi-job-market', 'فريق التحرير', '2026-08-18', 'published', 1
WHERE NOT EXISTS (SELECT 1 FROM `blog_posts` WHERE `slug` = 'demo-ai-skills-for-career');
--> statement-breakpoint
INSERT INTO `blog_posts` (`title`, `slug`, `excerpt`, `content`, `image`, `source`, `category`, `author`, `date`, `status`, `is_published`)
SELECT '[تجريبي] دليل مبسط لأقسام الوظائف في المنصة', 'demo-guide-to-job-sections', 'تعرف على الفرق بين الوظائف المدنية والعسكرية ووظائف الشركات ووظائف أصحاب العمل.', '<h2>الوظائف المدنية</h2><p>تضم الإعلانات التابعة للجهات الحكومية المدنية والهيئات والمؤسسات العامة.</p><h2>الوظائف العسكرية</h2><p>تضم إعلانات القبول والتوظيف في القطاعات العسكرية والأمنية.</p><h2>وظائف الشركات</h2><p>تضم الفرص المنشورة لدى الشركات الكبرى والقطاع الخاص.</p><h2>وظائف أصحاب العمل</h2><p>تضم الإعلانات المقدمة مباشرة من أصحاب العمل بعد مراجعتها.</p><p><strong>تنبيه:</strong> هذا محتوى تجريبي مخصص لاختبار تصميم المدونة.</p>', '/article-images/saudi-career-opportunities.png', 'محتوى تجريبي', 'saudi-job-market', 'فريق التحرير', '2026-08-18', 'published', 1
WHERE NOT EXISTS (SELECT 1 FROM `blog_posts` WHERE `slug` = 'demo-guide-to-job-sections');
