<?php

declare(strict_types=1);

/**
 * One-time, additive production data migration.
 *
 * It only fills an empty logo for an existing organization name. It never
 * inserts, deletes, renames, or changes organization IDs or related jobs.
 */

$token = 'RUN_TOKEN_PLACEHOLDER';
$provided = $_SERVER['HTTP_X_MIGRATION_TOKEN'] ?? ($_GET['token'] ?? '');
if (!is_string($provided) || !hash_equals($token, $provided)) {
    http_response_code(404);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

$logos = [
    'وزارة الصحة' => 'https://www.moh.gov.sa/en/PublishingImages/moh%20logo.png',
    'وزارة التعليم' => 'https://www.moe.gov.sa/Style%20Library/portal/assets/images/favicon/apple-touch-icon.png',
    'وزارة العدل' => 'https://www.moj.gov.sa/SiteAssets/FAVICONV4.png',
    'وزارة التجارة' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Logo_Ministry_of_Commerce.svg/3840px-Logo_Ministry_of_Commerce.svg.png',
    'وزارة المالية' => 'https://www.mof.gov.sa/_layouts/15/MOFInternet/images/ar/heder_logoshare.png',
    'وزارة الاتصالات وتقنية المعلومات' => 'https://mcit.gov.sa/themes/custom/mcit/favicon.ico',
    'وزارة الدفاع' => 'https://rsts.com.sa/logos/mod.png',
    'المديرية العامة للدفاع المدني' => 'https://998.gov.sa/images/logo.webp',
    'المديرية العامة لحرس الحدود' => 'https://moi.gov.sa/assets/media/logos/moi.png',
    'أمانة منطقة الرياض' => 'https://alriyadh.gov.sa/images/new_logo.svg',
    'الخطوط السعودية' => 'https://www.saudia.com/favicon.ico',
    'شركة الاتصالات السعودية' => 'https://www.stc.com.sa/content/dam/stc/favicon/apple-touch-icon.png',
    'شركة سابك' => 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Logo_of_Sabic.svg',
    'شركة أرامكو السعودية' => 'https://www.aramco.com/dist/client/favicon/apple-touch-icon-144x144.png',
    'شركة البواني' => 'https://albawani.com/wp-content/uploads/2023/06/cropped-cropped-Untitled-2-192x192-1-192x192.png',
    'كلية البترجي الطبية' => 'https://bmc.edu.sa/-/media/Project/BMC/MainSite/Home/07_24_001.jpg?rev=7068727a48654370ab4d6b9c8fe7de55',
    'مجلس الضمان الصحي' => 'https://www.chi.gov.sa/_layouts/15/CCHIPortal/ThemeAssets/assets/images/favicon.ico',
    'شركة زهران للصيانة والتشغيل' => 'https://www.zahranholding.com/wp-content/uploads/2026/07/Zahran-holding_logo.svg',
    'شركة أوقاف للاستثمار' => 'https://awqaf.com.sa/themes/custom/awqaf/favicon.ico',
];

try {
    $config = require dirname(__DIR__, 2) . '/private_html/alwdaif-migration-config.php';
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['host'], $config['port'], $config['database']),
        $config['username'],
        $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC],
    );
    $pdo->beginTransaction();
    $find = $pdo->prepare('SELECT id, name, logo FROM `organizations` WHERE `name` = ? LIMIT 1');
    $update = $pdo->prepare('UPDATE `organizations` SET `logo` = ?, `updated_at` = ? WHERE `id` = ? AND (`logo` IS NULL OR TRIM(`logo`) = "")');
    $before = [];
    $updated = [];
    $missing = [];
    $now = (int) round(microtime(true) * 1000);
    foreach ($logos as $name => $logo) {
        $find->execute([$name]);
        $row = $find->fetch();
        if (!$row) {
            $missing[] = $name;
            continue;
        }
        $before[] = ['id' => (int) $row['id'], 'name' => $name, 'logo' => $row['logo']];
        $update->execute([$logo, $now, (int) $row['id']]);
        if ($update->rowCount() > 0) $updated[] = ['id' => (int) $row['id'], 'name' => $name, 'logo' => $logo];
    }
    $pdo->commit();
    echo json_encode(['ok' => true, 'matched' => count($before), 'updated' => $updated, 'missing' => $missing], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Organization logo migration failed.'], JSON_UNESCAPED_UNICODE);
}
