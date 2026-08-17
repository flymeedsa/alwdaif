-- Import the first five listings visible on alwdaif.com on 2026-08-18.
-- Every statement is idempotent so redeployments do not duplicate content.

INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'شركة البواني', 'company', 'شركة سعودية تعمل في قطاعات الإنشاءات والهندسة وإدارة المشاريع.', 'https://www.albawani.net', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'شركة البواني');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'كلية البترجي الطبية', 'company', 'كلية أهلية متخصصة في التعليم والتدريب الصحي.', 'https://bmc.edu.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'كلية البترجي الطبية');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'مجلس الضمان الصحي', 'government', 'جهة حكومية تشرف على تنظيم وتطوير قطاع التأمين الصحي.', 'https://www.chi.gov.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'مجلس الضمان الصحي');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'شركة زهران للصيانة والتشغيل', 'company', 'شركة سعودية تقدم خدمات التشغيل والصيانة وإدارة المرافق.', 'https://zahranholding.com', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'شركة زهران للصيانة والتشغيل');
--> statement-breakpoint
INSERT INTO `organizations` (`name`, `type`, `description`, `website`, `is_active`)
SELECT 'شركة أوقاف للاستثمار', 'company', 'الذراع الاستثمارية للهيئة العامة للأوقاف.', 'https://awqaf.com.sa', 1
WHERE NOT EXISTS (SELECT 1 FROM `organizations` WHERE `name` = 'شركة أوقاف للاستثمار');
--> statement-breakpoint

INSERT INTO `jobs` (`title`, `company`, `organization_id`, `category`, `date`, `location`, `description`, `summary`, `apply_url`, `source_url`, `status`, `is_featured`, `is_active`)
SELECT 'شركة البواني توفر وظائف إدارية وهندسية وطبية في الرياض والجوف', 'شركة البواني', (SELECT `id` FROM `organizations` WHERE `name` = 'شركة البواني' LIMIT 1), 'companies', '2026-08-17', 'الرياض، الجوف', 'فرص لحملة الدبلوم والبكالوريوس في مجالات السكرتارية، إدارة الوثائق، التدقيق، الموارد البشرية، السلامة، إدارة المشاريع، الهندسة والقطاع الطبي. تشمل المزايا راتباً تنافسياً وفرصاً للتطوير المهني.', 'وظائف متنوعة لدى شركة البواني في الرياض والجوف لحملة الدبلوم والبكالوريوس.', 'https://www.linkedin.com/company/albawani/life', 'https://www.alwdaif.com/jobs/150112', 'published', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `jobs` WHERE `source_url` = 'https://www.alwdaif.com/jobs/150112');
--> statement-breakpoint
INSERT INTO `jobs` (`title`, `company`, `organization_id`, `category`, `date`, `location`, `description`, `summary`, `apply_url`, `source_url`, `status`, `is_featured`, `is_active`)
SELECT 'كلية البترجي الطبية تعلن وظائف أكاديمية وإدارية وتقنية في جدة والدمام', 'كلية البترجي الطبية', (SELECT `id` FROM `organizations` WHERE `name` = 'كلية البترجي الطبية' LIMIT 1), 'companies', '2026-08-17', 'جدة، الدمام ومواقع أخرى', 'تتوفر 12 فرصة في المجالات الأكاديمية والصحية والإدارية والتقنية والتسويقية، ومنها شؤون الطلاب والقبول والتسجيل وإدارة الأنظمة السحابية والعلاج التنفسي والتسويق والمبيعات.', 'اثنتا عشرة فرصة وظيفية أكاديمية وإدارية وصحية وتقنية لدى كلية البترجي الطبية.', 'https://www.linkedin.com/school/batterjee-medical-college/jobs/', 'https://www.alwdaif.com/jobs/137839', 'published', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM `jobs` WHERE `source_url` = 'https://www.alwdaif.com/jobs/137839');
--> statement-breakpoint
INSERT INTO `jobs` (`title`, `company`, `organization_id`, `category`, `date`, `location`, `description`, `summary`, `apply_url`, `source_url`, `status`, `is_featured`, `is_active`)
SELECT 'مجلس الضمان الصحي يطرح فرصة تدريبية عبر تمهير بمسمى مصمم جرافيك', 'مجلس الضمان الصحي', (SELECT `id` FROM `organizations` WHERE `name` = 'مجلس الضمان الصحي' LIMIT 1), 'civil', '2026-08-17', 'الرياض', 'فرصة تدريب على رأس العمل عبر برنامج تمهير بمسمى مصمم جرافيك لحملة الدبلوم في التصميم الجرافيكي، ولا تشترط خبرة سابقة.', 'فرصة تمهير في الرياض لحملة دبلوم التصميم الجرافيكي دون اشتراط خبرة.', 'https://eservices.taqat.sa/Eservices/Login.aspx', 'https://www.alwdaif.com/jobs/140591', 'published', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM `jobs` WHERE `source_url` = 'https://www.alwdaif.com/jobs/140591');
--> statement-breakpoint
INSERT INTO `jobs` (`title`, `company`, `organization_id`, `category`, `date`, `location`, `description`, `summary`, `apply_url`, `source_url`, `status`, `is_featured`, `is_active`)
SELECT 'شركة زهران للصيانة والتشغيل تطرح وظائف برواتب تصل إلى 15,000 ريال', 'شركة زهران للصيانة والتشغيل', (SELECT `id` FROM `organizations` WHERE `name` = 'شركة زهران للصيانة والتشغيل' LIMIT 1), 'companies', '2026-08-17', 'عدة مدن بالمملكة', 'فرص متعددة لحملة الثانوية فأعلى في التشغيل والصيانة والهندسة والأمن والصحة والخدمات الفنية، موزعة على عدد من مناطق ومدن المملكة، مع رواتب ومزايا تختلف حسب الوظيفة.', 'وظائف تشغيل وصيانة وهندسة وأمن وصحة في عدة مدن بالمملكة.', 'https://jadarat.sa/EntityProfile?EntityId=alBrUlBhTm9WbzVqekZKbU8wRnRIUT09&EntityType=1&JobType=1&Param=1&RouterId=ekg2ekxTVE5NQ2s9', 'https://www.alwdaif.com/jobs/155128', 'published', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM `jobs` WHERE `source_url` = 'https://www.alwdaif.com/jobs/155128');
--> statement-breakpoint
INSERT INTO `jobs` (`title`, `company`, `organization_id`, `category`, `date`, `location`, `description`, `summary`, `apply_url`, `source_url`, `status`, `is_featured`, `is_active`)
SELECT 'شركة أوقاف للاستثمار تطرح وظائف لحملة البكالوريوس فأعلى', 'شركة أوقاف للاستثمار', (SELECT `id` FROM `organizations` WHERE `name` = 'شركة أوقاف للاستثمار' LIMIT 1), 'companies', '2026-08-17', 'الرياض', 'وظيفتان في الشؤون القانونية ومخاطر وأداء الاستثمار لحملة البكالوريوس فأعلى. تتطلب وظيفة نائب الرئيس خبرة قانونية، بينما لا تشترط خبرة سابقة لوظيفة محلل المخاطر.', 'فرص قانونية واستثمارية لدى شركة أوقاف للاستثمار في الرياض.', 'https://www.linkedin.com/jobs/search/?currentJobId=3406529485&f_C=70395204&geoId=92000000&originToLandingJobPostings=3406529485%2C3402025947%2C3368293668', 'https://www.alwdaif.com/jobs/132309', 'published', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM `jobs` WHERE `source_url` = 'https://www.alwdaif.com/jobs/132309');
