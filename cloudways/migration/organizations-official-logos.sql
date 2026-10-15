-- Safe, idempotent enrichment for the original organization directory.
-- This only fills an empty logo field for an existing name. It never inserts,
-- deletes, renames, or changes organization ids or any related job records.
SET NAMES utf8mb4;

UPDATE `organizations`
SET `logo` = CASE `name`
  WHEN 'وزارة الصحة' THEN 'https://www.moh.gov.sa/en/PublishingImages/moh%20logo.png'
  WHEN 'وزارة التعليم' THEN 'https://www.moe.gov.sa/Style%20Library/portal/assets/images/favicon/apple-touch-icon.png'
  WHEN 'وزارة العدل' THEN 'https://www.moj.gov.sa/SiteAssets/FAVICONV4.png'
  WHEN 'وزارة التجارة' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Logo_Ministry_of_Commerce.svg/3840px-Logo_Ministry_of_Commerce.svg.png'
  WHEN 'وزارة المالية' THEN 'https://www.mof.gov.sa/_layouts/15/MOFInternet/images/ar/heder_logoshare.png'
  WHEN 'وزارة الاتصالات وتقنية المعلومات' THEN 'https://mcit.gov.sa/themes/custom/mcit/favicon.ico'
  WHEN 'وزارة الدفاع' THEN 'https://rsts.com.sa/logos/mod.png'
  WHEN 'المديرية العامة للدفاع المدني' THEN 'https://998.gov.sa/images/logo.webp'
  WHEN 'المديرية العامة لحرس الحدود' THEN 'https://moi.gov.sa/assets/media/logos/moi.png'
  WHEN 'أمانة منطقة الرياض' THEN 'https://alriyadh.gov.sa/images/new_logo.svg'
  WHEN 'الخطوط السعودية' THEN 'https://www.saudia.com/favicon.ico'
  WHEN 'شركة الاتصالات السعودية' THEN 'https://www.stc.com.sa/content/dam/stc/favicon/apple-touch-icon.png'
  WHEN 'شركة سابك' THEN 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Logo_of_Sabic.svg'
  WHEN 'شركة أرامكو السعودية' THEN 'https://www.aramco.com/dist/client/favicon/apple-touch-icon-144x144.png'
  WHEN 'شركة البواني' THEN 'https://albawani.com/wp-content/uploads/2023/06/cropped-cropped-Untitled-2-192x192-1-192x192.png'
  WHEN 'كلية البترجي الطبية' THEN 'https://bmc.edu.sa/-/media/Project/BMC/MainSite/Home/07_24_001.jpg?rev=7068727a48654370ab4d6b9c8fe7de55'
  WHEN 'مجلس الضمان الصحي' THEN 'https://www.chi.gov.sa/_layouts/15/CCHIPortal/ThemeAssets/assets/images/favicon.ico'
  WHEN 'شركة زهران للصيانة والتشغيل' THEN 'https://www.zahranholding.com/wp-content/uploads/2026/07/Zahran-holding_logo.svg'
  WHEN 'شركة أوقاف للاستثمار' THEN 'https://awqaf.com.sa/themes/custom/awqaf/favicon.ico'
  ELSE `logo`
END
WHERE `name` IN (
  'وزارة الصحة', 'وزارة التعليم', 'وزارة العدل', 'وزارة التجارة',
  'وزارة المالية', 'وزارة الاتصالات وتقنية المعلومات', 'وزارة الدفاع',
  'المديرية العامة للدفاع المدني', 'المديرية العامة لحرس الحدود',
  'أمانة منطقة الرياض', 'الخطوط السعودية', 'شركة الاتصالات السعودية',
  'شركة سابك', 'شركة أرامكو السعودية', 'شركة البواني', 'كلية البترجي الطبية',
  'مجلس الضمان الصحي', 'شركة زهران للصيانة والتشغيل', 'شركة أوقاف للاستثمار'
)
AND (`logo` IS NULL OR TRIM(`logo`) = '');
