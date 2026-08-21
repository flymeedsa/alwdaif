<?php

declare(strict_types=1);

/**
 * Cloudways-native routes that do not fit the small CRUD handlers.
 *
 * This file deliberately returns false for routes owned by the earlier
 * handlers. index.php invokes it immediately before the final local 404.
 */

$runtimePath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (strpos($runtimePath, '/api/') !== 0) return false;
$runtimeMethod = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

$runtimeJson = static function (int $status, $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
};
$runtimeCamel = static function (array $row): array {
    $out = [];
    foreach ($row as $key => $value) {
        $name = preg_replace_callback('/_([a-z])/', static fn(array $match): string => strtoupper($match[1]), (string) $key) ?? $key;
        if (is_string($value) && preg_match('/^-?[0-9]+$/', $value) === 1) $value = (int) $value;
        $out[$name] = $value;
    }
    return $out;
};
$runtimeDecode = static function ($value) {
    if (!is_string($value) || $value === '') return $value;
    $decoded = json_decode($value, true);
    return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
};

try {
    $runtimeConfig = require dirname(__DIR__) . '/private_html/alwdaif-migration-config.php';
    $runtimePdo = new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $runtimeConfig['host'], $runtimeConfig['port'], $runtimeConfig['database']),
        $runtimeConfig['username'],
        $runtimeConfig['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    $now = (int) floor(microtime(true) * 1000);
    $body = in_array($runtimeMethod, ['POST', 'PUT', 'PATCH'], true)
        ? json_decode(file_get_contents('php://input') ?: '{}', true)
        : [];
    if (!is_array($body)) $body = [];

    $memberId = null;
    $communityToken = trim((string) ($_SERVER['HTTP_X_COMMUNITY_TOKEN'] ?? ''));
    if ($communityToken !== '') {
        $statement = $runtimePdo->prepare('SELECT `member_id` FROM `community_auth_tokens` WHERE `token_hash`=? AND `expires_at`>? LIMIT 1');
        $statement->execute([hash('sha256', $communityToken), $now]);
        $value = $statement->fetchColumn();
        if ($value !== false) $memberId = (int) $value;
    }
    $requireMember = static function () use (&$memberId, $runtimeJson): int {
        if (!$memberId) {
            $runtimeJson(401, ['message' => 'يجب تسجيل الدخول أولاً']);
            exit;
        }
        return $memberId;
    };

    if ($runtimePath === '/api/pages' && $runtimeMethod === 'GET') {
        $rows = $runtimePdo->query("SELECT * FROM `pages` WHERE `status`='published' AND `trashed_at` IS NULL ORDER BY `id`")->fetchAll();
        $runtimeJson(200, array_map($runtimeCamel, $rows)); return true;
    }
    if (preg_match('#^/api/services/([^/]+)$#', $runtimePath, $match) === 1 && $runtimeMethod === 'GET') {
        $statement = $runtimePdo->prepare('SELECT * FROM `services` WHERE `slug`=? AND `is_active`=1 LIMIT 1');
        $statement->execute([urldecode($match[1])]); $row = $statement->fetch();
        if ($row && isset($row['variants'])) $row['variants'] = $runtimeDecode($row['variants']);
        $runtimeJson($row ? 200 : 404, $row ? $runtimeCamel($row) : ['message' => 'الخدمة غير موجودة']); return true;
    }
    if (preg_match('#^/api/organizations/(\d+)/jobs$#', $runtimePath, $match) === 1 && $runtimeMethod === 'GET') {
        $statement = $runtimePdo->prepare("SELECT * FROM `jobs` WHERE `organization_id`=? AND `status`='published' AND `trashed_at` IS NULL ORDER BY `created_at` DESC");
        $statement->execute([(int) $match[1]]); $runtimeJson(200, array_map($runtimeCamel, $statement->fetchAll())); return true;
    }
    if (($runtimePath === '/api/jobs/related' || preg_match('#^/api/jobs/(\d+)/related$#', $runtimePath) === 1) && $runtimeMethod === 'GET') {
        $id = (int) ($_GET['id'] ?? ($_GET['excludeId'] ?? 0));
        if (!$id && preg_match('#^/api/jobs/(\d+)/related$#', $runtimePath, $match)) $id = (int) $match[1];
        $statement = $runtimePdo->prepare("SELECT j2.* FROM `jobs` j1 JOIN `jobs` j2 ON j2.`category`=j1.`category` WHERE j1.`id`=? AND j2.`id`<>j1.`id` AND j2.`status`='published' AND j2.`trashed_at` IS NULL ORDER BY j2.`created_at` DESC LIMIT 6");
        $statement->execute([$id]); $runtimeJson(200, array_map($runtimeCamel, $statement->fetchAll())); return true;
    }
    if ($runtimePath === '/api/blog/related' && $runtimeMethod === 'GET') {
        $id = (int) ($_GET['id'] ?? 0);
        $statement = $runtimePdo->prepare("SELECT b2.* FROM `blog_posts` b1 JOIN `blog_posts` b2 ON b2.`category`=b1.`category` WHERE b1.`id`=? AND b2.`id`<>b1.`id` AND b2.`status`='published' AND b2.`trashed_at` IS NULL ORDER BY b2.`created_at` DESC LIMIT 4");
        $statement->execute([$id]); $runtimeJson(200, array_map($runtimeCamel, $statement->fetchAll())); return true;
    }
    if ($runtimePath === '/api/employer-jobs-all' && $runtimeMethod === 'GET') {
        $rows = $runtimePdo->query('SELECT * FROM `employer_jobs` WHERE `trashed_at` IS NULL ORDER BY `created_at` DESC')->fetchAll();
        $runtimeJson(200, array_map($runtimeCamel, $rows)); return true;
    }
    if ($runtimePath === '/api/employer-jobs/closed' && $runtimeMethod === 'GET') {
        $statement = $runtimePdo->prepare("SELECT * FROM `employer_jobs` WHERE `trashed_at` IS NULL AND (`status`='closed' OR (`deadline_date` IS NOT NULL AND `deadline_date`<=?)) ORDER BY `created_at` DESC");
        $statement->execute([$now]); $runtimeJson(200, array_map($runtimeCamel, $statement->fetchAll())); return true;
    }
    if (preg_match('#^/api/employer-jobs/(\d+)$#', $runtimePath, $match) === 1 && $runtimeMethod === 'GET') {
        $statement = $runtimePdo->prepare('SELECT * FROM `employer_jobs` WHERE `id`=? AND `trashed_at` IS NULL LIMIT 1');
        $statement->execute([(int) $match[1]]); $row = $statement->fetch();
        if ($row) $runtimePdo->prepare('UPDATE `employer_jobs` SET `view_count`=`view_count`+1 WHERE `id`=?')->execute([(int) $match[1]]);
        $runtimeJson($row ? 200 : 404, $row ? $runtimeCamel($row) : ['message' => 'الوظيفة غير موجودة']); return true;
    }
    if (preg_match('#^/api/employer-jobs/(\d+)/similar$#', $runtimePath, $match) === 1 && $runtimeMethod === 'GET') {
        $statement = $runtimePdo->prepare("SELECT e2.* FROM `employer_jobs` e1 JOIN `employer_jobs` e2 ON e2.`region`=e1.`region` WHERE e1.`id`=? AND e2.`id`<>e1.`id` AND e2.`status`='published' AND e2.`trashed_at` IS NULL ORDER BY e2.`created_at` DESC LIMIT 6");
        $statement->execute([(int) $match[1]]); $runtimeJson(200, array_map($runtimeCamel, $statement->fetchAll())); return true;
    }
    if ($runtimePath === '/api/employer-jobs' && $runtimeMethod === 'POST') {
        foreach (['title', 'company', 'description', 'contactValue', 'submitterName', 'submitterEmail'] as $required) {
            if (trim((string) ($body[$required] ?? '')) === '') { $runtimeJson(400, ['message' => 'بيانات الوظيفة ناقصة']); return true; }
        }
        $statement = $runtimePdo->prepare('INSERT INTO `employer_jobs` (`title`,`company`,`region`,`city`,`work_schedule`,`work_mode`,`description`,`requirements`,`target_gender`,`target_nationality`,`contact_method`,`contact_value`,`submitter_name`,`submitter_email`,`status`,`deadline_date`,`view_count`,`created_at`,`updated_at`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'pending\',?,0,?,?)');
        $statement->execute([
            $body['title'], $body['company'], $body['region'] ?? null, $body['city'] ?? null,
            $body['workSchedule'] ?? null, $body['workMode'] ?? null, $body['description'], $body['requirements'] ?? null,
            $body['targetGender'] ?? 'all', $body['targetNationality'] ?? 'all', $body['contactMethod'] ?? 'email',
            $body['contactValue'], $body['submitterName'], $body['submitterEmail'], $body['deadlineDate'] ?? null, $now, $now,
        ]);
        $runtimeJson(201, ['success' => true, 'id' => (int) $runtimePdo->lastInsertId()]); return true;
    }
    if (preg_match('#^/api/(?:employer-jobs/(\d+)/report|job-reports)$#', $runtimePath, $match) === 1 && $runtimeMethod === 'POST') {
        $jobId = isset($match[1]) ? (int) $match[1] : (int) ($body['jobId'] ?? 0);
        $table = strpos($runtimePath, 'employer-jobs') !== false ? 'employer_job_reports' : 'job_reports';
        $column = $table === 'employer_job_reports' ? 'employer_job_id' : 'job_id';
        if ($jobId < 1 || trim((string) ($body['reason'] ?? '')) === '') { $runtimeJson(400, ['message' => 'بيانات البلاغ ناقصة']); return true; }
        $statement = $runtimePdo->prepare("INSERT INTO `$table` (`$column`,`reporter_name`,`reporter_email`,`reason`,`details`,`status`,`created_at`) VALUES (?,?,?,?,?,'pending',?)");
        $statement->execute([$jobId, $body['reporterName'] ?? null, $body['reporterEmail'] ?? null, $body['reason'], $body['details'] ?? null, $now]);
        $runtimeJson(201, ['success' => true]); return true;
    }
    if ($runtimePath === '/api/market-indicators' && $runtimeMethod === 'GET') {
        $row = $runtimePdo->query('SELECT `snapshot_data`,`generated_at` FROM `daily_market_snapshots` ORDER BY `generated_at` DESC LIMIT 1')->fetch();
        $payload = $row ? $runtimeDecode($row['snapshot_data']) : [];
        if (!is_array($payload)) $payload = [];
        $payload['generatedAt'] = $row ? (int) $row['generated_at'] : null;
        $runtimeJson(200, $payload); return true;
    }
    if ($runtimePath === '/api/seo/page' && $runtimeMethod === 'GET') {
        $page = (string) ($_GET['path'] ?? '/');
        $statement = $runtimePdo->prepare('SELECT * FROM `seo_settings` WHERE `page_path`=? LIMIT 1');
        $statement->execute([$page]); $row = $statement->fetch();
        $runtimeJson(200, $row ? $runtimeCamel($row) : []); return true;
    }
    if (strpos($runtimePath, '/api/seo-settings') === 0 && $runtimeMethod === 'GET') {
        $rows = $runtimePdo->query('SELECT * FROM `seo_settings` ORDER BY `id`')->fetchAll();
        $runtimeJson(200, array_map($runtimeCamel, $rows)); return true;
    }
    if ($runtimePath === '/api/ads/smart' && $runtimeMethod === 'GET') {
        $rows = $runtimePdo->query('SELECT * FROM `ads` WHERE `is_active`=1 AND `deleted_at` IS NULL ORDER BY `priority` DESC, RAND() LIMIT 3')->fetchAll();
        $runtimeJson(200, array_map($runtimeCamel, $rows)); return true;
    }
    if (preg_match('#^/api/announcements/(\d+)$#', $runtimePath, $match) === 1 && $runtimeMethod === 'GET') {
        $statement = $runtimePdo->prepare("SELECT * FROM `announcements` WHERE `id`=? AND `status`='published' LIMIT 1");
        $statement->execute([(int) $match[1]]); $row = $statement->fetch();
        $runtimeJson($row ? 200 : 404, $row ? $runtimeCamel($row) : ['message' => 'الإعلان غير موجود']); return true;
    }
    if ($runtimePath === '/api/weekly-summary/latest' && $runtimeMethod === 'GET') {
        $row = $runtimePdo->query('SELECT * FROM `weekly_summaries` ORDER BY `generated_at` DESC LIMIT 1')->fetch();
        $runtimeJson(200, $row ? $runtimeCamel($row) : null); return true;
    }
    if ($runtimePath === '/api/weekly-summary/all' && $runtimeMethod === 'GET') {
        $rows = $runtimePdo->query('SELECT * FROM `weekly_summaries` ORDER BY `generated_at` DESC')->fetchAll();
        $runtimeJson(200, array_map($runtimeCamel, $rows)); return true;
    }
    if ($runtimePath === '/api/weekly-summary/subscribers-count' && $runtimeMethod === 'GET') {
        $count = (int) $runtimePdo->query('SELECT COUNT(*) FROM `weekly_subscriptions` WHERE `is_active`=1')->fetchColumn();
        $runtimeJson(200, ['count' => $count]); return true;
    }
    if ($runtimePath === '/api/weekly-summary/subscription-status' && $runtimeMethod === 'GET') {
        $mid = $requireMember();
        $statement = $runtimePdo->prepare('SELECT * FROM `weekly_subscriptions` WHERE `user_id`=? LIMIT 1');
        $statement->execute([(string) $mid]); $row = $statement->fetch();
        $runtimeJson(200, ['subscribed' => $row && (int) $row['is_active'] === 1, 'subscription' => $row ? $runtimeCamel($row) : null]); return true;
    }
    if (in_array($runtimePath, ['/api/weekly-summary/subscribe', '/api/weekly-summary/unsubscribe'], true) && $runtimeMethod === 'POST') {
        $mid = $requireMember();
        $active = $runtimePath === '/api/weekly-summary/subscribe' ? 1 : 0;
        $email = trim((string) ($body['email'] ?? ''));
        if ($active && !filter_var($email, FILTER_VALIDATE_EMAIL)) { $runtimeJson(400, ['message' => 'البريد غير صالح']); return true; }
        $statement = $runtimePdo->prepare('INSERT INTO `weekly_subscriptions` (`user_id`,`email`,`display_name`,`subscribed_at`,`is_active`) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE `email`=VALUES(`email`),`display_name`=VALUES(`display_name`),`is_active`=VALUES(`is_active`)');
        $statement->execute([(string) $mid, $email, $body['displayName'] ?? null, $now, $active]);
        $runtimeJson(200, ['success' => true, 'subscribed' => (bool) $active]); return true;
    }
    if ($runtimePath === '/api/weekly-summary/top-employer-jobs' && $runtimeMethod === 'GET') {
        $rows = $runtimePdo->query("SELECT * FROM `employer_jobs` WHERE `status`='published' AND `trashed_at` IS NULL ORDER BY `view_count` DESC LIMIT 10")->fetchAll();
        $runtimeJson(200, array_map($runtimeCamel, $rows)); return true;
    }
    if ($runtimePath === '/api/weekly-summary/top-blog-posts' && $runtimeMethod === 'GET') {
        $rows = $runtimePdo->query("SELECT * FROM `blog_posts` WHERE `status`='published' AND `trashed_at` IS NULL ORDER BY `view_count` DESC LIMIT 10")->fetchAll();
        $runtimeJson(200, array_map($runtimeCamel, $rows)); return true;
    }
    if ($runtimePath === '/api/weekly-summary/weekly-market-indicators' && $runtimeMethod === 'GET') {
        $rows = $runtimePdo->query('SELECT * FROM `daily_market_snapshots` ORDER BY `generated_at` DESC LIMIT 7')->fetchAll();
        $runtimeJson(200, array_map($runtimeCamel, $rows)); return true;
    }
    if ($runtimePath === '/api/contact' && $runtimeMethod === 'POST') {
        $name = trim((string) ($body['name'] ?? '')); $email = trim((string) ($body['email'] ?? '')); $message = trim((string) ($body['message'] ?? ''));
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $message === '') { $runtimeJson(400, ['message' => 'بيانات التواصل غير مكتملة']); return true; }
        $runtimePdo->exec('CREATE TABLE IF NOT EXISTS `contact_messages` (`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, `name` TEXT NOT NULL, `email` TEXT NOT NULL, `subject` TEXT NULL, `message` LONGTEXT NOT NULL, `status` VARCHAR(32) NOT NULL DEFAULT \'new\', `created_at` BIGINT NOT NULL) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        $statement = $runtimePdo->prepare('INSERT INTO `contact_messages` (`name`,`email`,`subject`,`message`,`created_at`) VALUES (?,?,?,?,?)');
        $statement->execute([$name, $email, $body['subject'] ?? null, $message, $now]);
        $runtimeJson(201, ['success' => true]); return true;
    }
    if ($runtimePath === '/api/online/heartbeat' && $runtimeMethod === 'POST') {
        $runtimePdo->exec('CREATE TABLE IF NOT EXISTS `online_visitors` (`visitor_id` VARCHAR(128) PRIMARY KEY, `last_seen` BIGINT NOT NULL, INDEX `online_last_seen_idx` (`last_seen`)) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        $visitor = substr(hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . (string) ($_SERVER['HTTP_USER_AGENT'] ?? '')), 0, 64);
        $statement = $runtimePdo->prepare('INSERT INTO `online_visitors` (`visitor_id`,`last_seen`) VALUES (?,?) ON DUPLICATE KEY UPDATE `last_seen`=VALUES(`last_seen`)');
        $statement->execute([$visitor, $now]); $runtimeJson(200, ['success' => true]); return true;
    }
    if ($runtimePath === '/api/online/count' && $runtimeMethod === 'GET') {
        $runtimePdo->exec('CREATE TABLE IF NOT EXISTS `online_visitors` (`visitor_id` VARCHAR(128) PRIMARY KEY, `last_seen` BIGINT NOT NULL, INDEX `online_last_seen_idx` (`last_seen`)) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        $statement = $runtimePdo->prepare('SELECT COUNT(*) FROM `online_visitors` WHERE `last_seen`>?'); $statement->execute([$now - 300000]);
        $runtimeJson(200, ['count' => (int) $statement->fetchColumn()]); return true;
    }
    if ($runtimePath === '/api/community/job-alerts' && in_array($runtimeMethod, ['GET', 'PUT', 'POST'], true)) {
        $mid = $requireMember();
        if ($runtimeMethod === 'GET') {
            $statement = $runtimePdo->prepare('SELECT * FROM `job_alert_preferences` WHERE `member_id`=? LIMIT 1'); $statement->execute([$mid]); $row = $statement->fetch();
            $runtimeJson(200, $row ? $runtimeCamel($row) : ['memberId' => $mid, 'categories' => [], 'isEnabled' => false]); return true;
        }
        $categories = json_encode($body['categories'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $enabled = !empty($body['isEnabled']) ? 1 : 0;
        $statement = $runtimePdo->prepare('INSERT INTO `job_alert_preferences` (`member_id`,`categories`,`is_enabled`,`created_at`,`updated_at`) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE `categories`=VALUES(`categories`),`is_enabled`=VALUES(`is_enabled`),`updated_at`=VALUES(`updated_at`)');
        $statement->execute([$mid, $categories, $enabled, $now, $now]); $runtimeJson(200, ['success' => true]); return true;
    }
    if ($runtimePath === '/api/community/job-credits' && $runtimeMethod === 'GET') {
        $mid = $requireMember(); $statement = $runtimePdo->prepare('SELECT `balance`,`expires_at` FROM `job_application_credits` WHERE `member_id`=? LIMIT 1'); $statement->execute([$mid]); $row = $statement->fetch();
        $runtimeJson(200, $row ? $runtimeCamel($row) : ['balance' => 0, 'expiresAt' => null]); return true;
    }
    if ($runtimePath === '/api/community/my-job-applications' && $runtimeMethod === 'GET') {
        $mid = $requireMember(); $statement = $runtimePdo->prepare('SELECT * FROM `job_application_requests` WHERE `member_id`=? ORDER BY `created_at` DESC'); $statement->execute([$mid]);
        $runtimeJson(200, array_map($runtimeCamel, $statement->fetchAll())); return true;
    }
    if ($runtimePath === '/api/cv-analysis/history' && $runtimeMethod === 'GET') {
        $mid = $requireMember(); $statement = $runtimePdo->prepare('SELECT * FROM `cv_analysis_history` WHERE `member_id`=? ORDER BY `created_at` DESC'); $statement->execute([$mid]);
        $runtimeJson(200, array_map($runtimeCamel, $statement->fetchAll())); return true;
    }
    if ($runtimePath === '/api/cv-analysis/usage' && $runtimeMethod === 'GET') {
        $mid = $requireMember(); $statement = $runtimePdo->prepare('SELECT COUNT(*) FROM `cv_analysis_history` WHERE `member_id`=?'); $statement->execute([$mid]);
        $runtimeJson(200, ['used' => (int) $statement->fetchColumn(), 'limit' => 0]); return true;
    }

    return false;
} catch (Throwable $error) {
    error_log('Cloudways runtime API error: ' . $error->getMessage());
    $runtimeJson(500, ['message' => 'تعذر إكمال الطلب']);
    return true;
}

