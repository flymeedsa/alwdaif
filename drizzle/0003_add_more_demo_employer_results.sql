-- Additional clearly labelled demo content for employer jobs and hiring results.

INSERT INTO `employer_jobs` (`title`, `company`, `region`, `city`, `work_schedule`, `work_mode`, `description`, `requirements`, `target_gender`, `target_nationality`, `contact_method`, `contact_value`, `submitter_name`, `submitter_email`, `status`, `deadline_date`)
SELECT '[تجريبي] محاسب تكاليف', 'شركة نماء التجارية', 'الرياض', 'الرياض', 'full_time', 'on_site', 'إعلان تجريبي لاختبار عرض وظائف أصحاب العمل في المجال المالي.', 'بكالوريوس محاسبة، وإجادة برامج الجداول المحاسبية، ومهارات إعداد التقارير.', 'all', 'saudi', 'url', '/contact', 'فريق الموقع', 'demo@example.test', 'published', unixepoch('2026-12-31') * 1000
WHERE NOT EXISTS (SELECT 1 FROM `employer_jobs` WHERE `title` = '[تجريبي] محاسب تكاليف' AND `company` = 'شركة نماء التجارية');
--> statement-breakpoint
INSERT INTO `employer_jobs` (`title`, `company`, `region`, `city`, `work_schedule`, `work_mode`, `description`, `requirements`, `target_gender`, `target_nationality`, `contact_method`, `contact_value`, `submitter_name`, `submitter_email`, `status`, `deadline_date`)
SELECT '[تجريبي] ممثل خدمة عملاء', 'مؤسسة تواصل للخدمات', 'مكة المكرمة', 'جدة', 'full_time', 'on_site', 'إعلان تجريبي لاختبار وظائف خدمة العملاء المقدمة مباشرة من أصحاب العمل.', 'ثانوية فأعلى، ولباقة في التواصل، والقدرة على العمل بنظام المناوبات.', 'all', 'saudi', 'url', '/contact', 'فريق الموقع', 'demo@example.test', 'published', unixepoch('2026-12-31') * 1000
WHERE NOT EXISTS (SELECT 1 FROM `employer_jobs` WHERE `title` = '[تجريبي] ممثل خدمة عملاء' AND `company` = 'مؤسسة تواصل للخدمات');
--> statement-breakpoint
INSERT INTO `employer_jobs` (`title`, `company`, `region`, `city`, `work_schedule`, `work_mode`, `description`, `requirements`, `target_gender`, `target_nationality`, `contact_method`, `contact_value`, `submitter_name`, `submitter_email`, `status`, `deadline_date`)
SELECT '[تجريبي] أخصائي تسويق إلكتروني', 'متجر رؤية', 'كل المناطق', 'عن بعد', 'part_time', 'remote', 'إعلان تجريبي لوظيفة مرنة عن بعد ضمن قسم وظائف أصحاب العمل.', 'خبرة في إدارة الحملات الرقمية وكتابة المحتوى وتحليل النتائج.', 'all', 'all', 'url', '/contact', 'فريق الموقع', 'demo@example.test', 'published', unixepoch('2026-12-31') * 1000
WHERE NOT EXISTS (SELECT 1 FROM `employer_jobs` WHERE `title` = '[تجريبي] أخصائي تسويق إلكتروني' AND `company` = 'متجر رؤية');
--> statement-breakpoint
INSERT INTO `employer_jobs` (`title`, `company`, `region`, `city`, `work_schedule`, `work_mode`, `description`, `requirements`, `target_gender`, `target_nationality`, `contact_method`, `contact_value`, `submitter_name`, `submitter_email`, `status`, `deadline_date`)
SELECT '[تجريبي] فني صيانة أجهزة', 'حلول التقنية المتقدمة', 'المنطقة الشرقية', 'الدمام', 'full_time', 'on_site', 'إعلان تجريبي لوظيفة فنية في صيانة وتجهيز أجهزة الحاسب.', 'دبلوم تقني، ومعرفة بأساسيات الشبكات والصيانة والدعم الفني.', 'all', 'saudi', 'url', '/contact', 'فريق الموقع', 'demo@example.test', 'published', unixepoch('2026-12-31') * 1000
WHERE NOT EXISTS (SELECT 1 FROM `employer_jobs` WHERE `title` = '[تجريبي] فني صيانة أجهزة' AND `company` = 'حلول التقنية المتقدمة');
--> statement-breakpoint

INSERT INTO `results` (`title`, `org`, `organization_id`, `type`, `date`, `details`, `inquiry_url`, `status`, `is_active`)
SELECT '[تجريبي] نتائج القبول النهائي للوظائف التعليمية', 'وزارة التعليم', (SELECT `id` FROM `organizations` WHERE `name` = 'وزارة التعليم' LIMIT 1), 'قبول نهائي', '2026-08-18', 'نتيجة تجريبية لاختبار عرض إشعارات القبول النهائي، ولا تمثل إعلاناً حقيقياً.', '/contact', 'published', 1
WHERE NOT EXISTS (SELECT 1 FROM `results` WHERE `title` = '[تجريبي] نتائج القبول النهائي للوظائف التعليمية');
--> statement-breakpoint
INSERT INTO `results` (`title`, `org`, `organization_id`, `type`, `date`, `details`, `inquiry_url`, `status`, `is_active`)
SELECT '[تجريبي] دعوة المرشحين للمقابلات الشخصية', 'شركة سابك', (SELECT `id` FROM `organizations` WHERE `name` = 'شركة سابك' LIMIT 1), 'مقابلة', '2026-08-18', 'إعلان تجريبي لاختبار ظهور دعوات المقابلات الشخصية في قسم نتائج التوظيف.', '/contact', 'published', 1
WHERE NOT EXISTS (SELECT 1 FROM `results` WHERE `title` = '[تجريبي] دعوة المرشحين للمقابلات الشخصية');
--> statement-breakpoint
INSERT INTO `results` (`title`, `org`, `organization_id`, `type`, `date`, `details`, `inquiry_url`, `status`, `is_active`)
SELECT '[تجريبي] نتائج الترشيح الأولي لبرنامج الخريجين', 'الخطوط السعودية', (SELECT `id` FROM `organizations` WHERE `name` = 'الخطوط السعودية' LIMIT 1), 'ترشيح أولي', '2026-08-18', 'نتيجة تجريبية مخصصة لاختبار عرض نتائج برامج الخريجين ولا تمثل ترشيحاً حقيقياً.', '/contact', 'published', 1
WHERE NOT EXISTS (SELECT 1 FROM `results` WHERE `title` = '[تجريبي] نتائج الترشيح الأولي لبرنامج الخريجين');
--> statement-breakpoint
INSERT INTO `results` (`title`, `org`, `organization_id`, `type`, `date`, `details`, `inquiry_url`, `status`, `is_active`)
SELECT '[تجريبي] نتائج اختبار القبول المبدئي', 'وزارة الدفاع', (SELECT `id` FROM `organizations` WHERE `name` = 'وزارة الدفاع' LIMIT 1), 'اختبار قبول', '2026-08-18', 'نتيجة تجريبية لاختبار قسم نتائج التوظيف العسكري ولا تمثل نتيجة قبول فعلية.', '/contact', 'published', 1
WHERE NOT EXISTS (SELECT 1 FROM `results` WHERE `title` = '[تجريبي] نتائج اختبار القبول المبدئي');
