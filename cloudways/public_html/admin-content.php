<?php

declare(strict_types=1);

/** Authenticated CRUD QA layer for core Cloudways/MariaDB content. */

$contentPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$isQaContent = strpos($contentPath, '/api/_cloudways/admin/') === 0;
$contentPrefix = $isQaContent ? '/api/_cloudways/admin/' : '/api/admin/';
if (strpos($contentPath, $contentPrefix) !== 0) return false;

$resourceMap = [
    'jobs' => 'jobs',
    'organizations' => 'organizations',
    'organization-types' => 'organization_types',
    'admins' => 'admins',
    'categories' => 'categories',
    'blog' => 'blog_posts',
    'blog-categories' => 'blog_categories',
    'services' => 'services',
    'results' => 'results',
    'ads' => 'ads',
    'announcements' => 'announcements',
    'faq' => 'faq_items',
    'pages' => 'pages',
    'permissions' => 'permissions',
    'seo' => 'seo_settings',
    'service-orders' => 'service_orders',
    'employer-jobs' => 'employer_jobs',
    'job-applications' => 'job_application_requests',
    'media' => 'media',
    'faq/categories' => 'faq_categories',
    'community/categories' => 'community_categories',
    'community/posts' => 'community_posts',
    'community/members' => 'community_members',
    'community/ranks' => 'member_ranks',
    'support/tickets' => 'support_tickets',
    'community/moderator-permissions' => 'community_moderator_permissions',
    'community/moderator-requests' => 'community_moderator_requests',
    'community/moderators' => 'community_moderators',
    'community/reports' => 'community_reports',
    'job-reports' => 'job_reports',
    'employer-job-reports' => 'employer_job_reports',
    'member-credits' => 'job_application_credits',
    'job-credits' => 'job_application_credits',
    'credit-adjustments' => 'credit_adjustments',
    'site-settings' => 'site_settings',
    'settings' => 'site_settings',
    'weekly-summary/subscribers' => 'weekly_subscriptions',
];
$relative = substr($contentPath, strlen($contentPrefix));
$parts = array_values(array_filter(explode('/', $relative), static fn(string $part): bool => $part !== ''));
$resource = $parts[0] ?? '';
$idPartIndex = 1;
if (isset($parts[1]) && isset($resourceMap[$resource . '/' . $parts[1]])) {
    $resource .= '/' . $parts[1];
    $idPartIndex = 2;
}
if (!isset($resourceMap[$resource])) return false;
$statusAction = $resource === 'employer-jobs'
    && isset($parts[1], $parts[2])
    && ctype_digit($parts[1])
    && $parts[2] === 'status';
$supportAction = $resource === 'support/tickets'
    && isset($parts[2], $parts[3])
    && ctype_digit($parts[2])
    && in_array($parts[3], ['reply', 'status'], true);
if (count($parts) > $idPartIndex + 1 && !$statusAction && !$supportAction) return false;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$sendContentJson = static function (int $status, $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
};
$base64UrlDecodeContent = static function (string $value): string {
    return (string) base64_decode(strtr($value, '-_', '+/'), true);
};
$snake = static function (string $value): string {
    return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $value) ?? $value);
};
$camel = static function (string $value): string {
    return preg_replace_callback('/_([a-z])/', static fn(array $match): string => strtoupper($match[1]), $value) ?? $value;
};
$normalizeContentRow = static function (array $row) use ($camel): array {
    unset($row['password'], $row['reset_token'], $row['reset_token_expires']);
    $result = [];
    foreach ($row as $key => $value) {
        if (is_string($value) && preg_match('/^-?[0-9]+$/', $value) === 1) $value = (int) $value;
        $result[$camel((string) $key)] = $value;
    }
    return $result;
};
$normalizeDeadlineMillis = static function ($value) {
    if ($value === null || $value === '') return null;
    if (is_int($value) || is_float($value) || (is_string($value) && ctype_digit(trim($value)))) {
        return (int) $value;
    }
    $raw = trim((string) $value);
    if ($raw === '') return null;
    try {
        $timezone = new DateTimeZone('Asia/Riyadh');
        $date = preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw) === 1
            ? DateTimeImmutable::createFromFormat('!Y-m-d', $raw, $timezone)
            : new DateTimeImmutable($raw, $timezone);
        if (!$date) return null;
        // An expiry date remains valid through the selected calendar day.
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw) === 1) $date = $date->setTime(23, 59, 59);
        return $date->getTimestamp() * 1000;
    } catch (Throwable $ignored) {
        return null;
    }
};

try {
    $config = require dirname(__DIR__) . '/private_html/alwdaif-migration-config.php';
    $header = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    $token = preg_replace('/^Bearer\s+/i', '', trim((string) $header));
    if (!$token || strpos($token, '.') === false) {
        $sendContentJson(401, ['message' => 'Unauthorized']); return true;
    }
    [$payloadPart, $signaturePart] = explode('.', $token, 2);
    $expected = hash_hmac('sha256', $payloadPart, $config['token'], true);
    $provided = $base64UrlDecodeContent($signaturePart);
    $payload = json_decode($base64UrlDecodeContent($payloadPart), true);
    if (!hash_equals($expected, $provided) || !is_array($payload) || (int) ($payload['expires'] ?? 0) < time()) {
        $sendContentJson(401, ['message' => 'Unauthorized']); return true;
    }

    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['host'], $config['port'], $config['database']),
        $config['username'], $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    $table = $resourceMap[$resource];
    $columns = [];
    foreach ($pdo->query('SHOW COLUMNS FROM `' . $table . '`')->fetchAll() as $column) $columns[(string) $column['Field']] = true;
    $id = isset($parts[$idPartIndex]) && ctype_digit($parts[$idPartIndex]) ? (int) $parts[$idPartIndex] : null;
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    // Support tickets have a nested conversation API rather than the simple
    // single-row CRUD shape used by other admin resources.
    if ($resource === 'support/tickets' && $id !== null) {
        if ($method === 'GET') {
            $statement = $pdo->prepare('SELECT * FROM `support_tickets` WHERE `id` = ? LIMIT 1');
            $statement->execute([$id]);
            $ticket = $statement->fetch();
            if (!$ticket) { $sendContentJson(404, ['message' => 'التذكرة غير موجودة']); return true; }
            $replyStatement = $pdo->prepare('SELECT * FROM `support_ticket_replies` WHERE `ticket_id` = ? ORDER BY `created_at`, `id`');
            $replyStatement->execute([$id]);
            $sendContentJson(200, [
                'ticket' => $normalizeContentRow($ticket),
                'replies' => array_map($normalizeContentRow, $replyStatement->fetchAll()),
            ]);
            return true;
        }
        if ($method === 'POST' && isset($parts[3]) && $parts[3] === 'reply') {
            $body = json_decode(file_get_contents('php://input') ?: '{}', true);
            $message = is_array($body) ? trim((string) ($body['message'] ?? '')) : '';
            if ($message === '') { $sendContentJson(400, ['message' => 'الرسالة مطلوبة']); return true; }
            $now = (int) floor(microtime(true) * 1000);
            $replyStatement = $pdo->prepare('INSERT INTO `support_ticket_replies` (`ticket_id`, `sender_id`, `sender_type`, `message`, `created_at`) VALUES (?, ?, "admin", ?, ?)');
            $replyStatement->execute([$id, (int) ($payload['adminId'] ?? 0), $message, $now]);
            $replyId = (int) $pdo->lastInsertId();
            $pdo->prepare('UPDATE `support_tickets` SET `status` = "in_progress", `last_admin_reply_at` = ?, `updated_at` = ? WHERE `id` = ?')->execute([$now, $now, $id]);
            $replyStatement = $pdo->prepare('SELECT * FROM `support_ticket_replies` WHERE `id` = ? LIMIT 1');
            $replyStatement->execute([$replyId]);
            $sendContentJson(201, $normalizeContentRow($replyStatement->fetch()));
            return true;
        }
        if ($method === 'PUT' && isset($parts[3]) && $parts[3] === 'status') {
            $body = json_decode(file_get_contents('php://input') ?: '{}', true);
            $status = is_array($body) ? trim((string) ($body['status'] ?? '')) : '';
            if (!in_array($status, ['open', 'in_progress', 'pending', 'closed'], true)) { $sendContentJson(400, ['message' => 'حالة غير صحيحة']); return true; }
            $now = (int) floor(microtime(true) * 1000);
            $statement = $pdo->prepare('UPDATE `support_tickets` SET `status` = ?, `closed_at` = ?, `updated_at` = ? WHERE `id` = ?');
            $statement->execute([$status, $status === 'closed' ? $now : null, $now, $id]);
            if (!$statement->rowCount()) { $sendContentJson(404, ['message' => 'التذكرة غير موجودة']); return true; }
            $statement = $pdo->prepare('SELECT * FROM `support_tickets` WHERE `id` = ? LIMIT 1');
            $statement->execute([$id]);
            $sendContentJson(200, $normalizeContentRow($statement->fetch()));
            return true;
        }
    }

    if ($statusAction && $method === 'PATCH') {
        $body = json_decode(file_get_contents('php://input') ?: '{}', true);
        $requestedStatus = is_array($body) ? trim((string) ($body['status'] ?? '')) : '';
        $status = $requestedStatus === 'trashed' ? 'trash' : $requestedStatus;
        if (!in_array($status, ['pending', 'published', 'draft', 'closed', 'trash'], true) || $id === null) {
            $sendContentJson(400, ['message' => 'حالة الوظيفة غير صالحة']); return true;
        }
        $updates = ['`status` = ?']; $parameters = [$status];
        $now = (int) floor(microtime(true) * 1000);
        if (isset($columns['updated_at'])) { $updates[] = '`updated_at` = ?'; $parameters[] = $now; }
        if (isset($columns['trashed_at'])) {
            $updates[] = '`trashed_at` = ?'; $parameters[] = $status === 'trash' ? $now : null;
        }
        $parameters[] = $id;
        $statement = $pdo->prepare('UPDATE `employer_jobs` SET ' . implode(', ', $updates) . ' WHERE `id` = ?');
        $statement->execute($parameters);
        if (!$statement->rowCount()) { $sendContentJson(404, ['message' => 'الوظيفة غير موجودة']); return true; }
        $statement = $pdo->prepare('SELECT * FROM `employer_jobs` WHERE `id` = ? LIMIT 1');
        $statement->execute([$id]);
        $sendContentJson(200, $normalizeContentRow($statement->fetch()));
        return true;
    }

    if ($method === 'GET') {
        if ($id !== null) {
            $statement = $pdo->prepare('SELECT * FROM `' . $table . '` WHERE `id` = ? LIMIT 1');
            $statement->execute([$id]); $row = $statement->fetch();
            $sendContentJson($row ? 200 : 404, $row ? $normalizeContentRow($row) : ['message' => 'Not found']);
        } else {
            $rows = $pdo->query('SELECT * FROM `' . $table . '` ORDER BY `id` DESC')->fetchAll();
            $sendContentJson(200, array_map($normalizeContentRow, $rows));
        }
        return true;
    }

    if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
        $body = json_decode(file_get_contents('php://input') ?: '{}', true);
        if (!is_array($body)) { $sendContentJson(400, ['message' => 'Invalid JSON']); return true; }
        $values = [];
        foreach ($body as $key => $value) {
            $column = $snake((string) $key);
            if ($column === 'id' || !isset($columns[$column])) continue;
            if ($column === 'deadline_date') $value = $normalizeDeadlineMillis($value);
            if (is_bool($value)) $value = $value ? 1 : 0;
            if (is_array($value) || is_object($value)) $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $values[$column] = $value;
        }
        $now = (int) floor(microtime(true) * 1000);
        if (isset($columns['updated_at'])) $values['updated_at'] = $now;
        if ($method === 'POST' && isset($columns['created_at']) && !isset($values['created_at'])) $values['created_at'] = $now;
        if (!$values) { $sendContentJson(400, ['message' => 'No valid fields']); return true; }

        if ($method === 'POST') {
            $names = array_keys($values);
            $sql = 'INSERT INTO `' . $table . '` (`' . implode('`, `', $names) . '`) VALUES (' . implode(', ', array_fill(0, count($names), '?')) . ')';
            $statement = $pdo->prepare($sql); $statement->execute(array_values($values));
            $id = (int) $pdo->lastInsertId();
        } else {
            if ($id === null) { $sendContentJson(400, ['message' => 'Missing id']); return true; }
            $assignments = implode(', ', array_map(static fn(string $name): string => '`' . $name . '` = ?', array_keys($values)));
            $statement = $pdo->prepare('UPDATE `' . $table . '` SET ' . $assignments . ' WHERE `id` = ?');
            $statement->execute([...array_values($values), $id]);
        }
        $statement = $pdo->prepare('SELECT * FROM `' . $table . '` WHERE `id` = ? LIMIT 1');
        $statement->execute([$id]); $row = $statement->fetch();
        $sendContentJson($method === 'POST' ? 201 : 200, $normalizeContentRow($row));
        return true;
    }

    if ($method === 'DELETE') {
        if ($id === null) { $sendContentJson(400, ['message' => 'Missing id']); return true; }
        if (!$isQaContent && (isset($columns['trashed_at']) || isset($columns['deleted_at']))) {
            $softDeleteColumn = isset($columns['trashed_at']) ? 'trashed_at' : 'deleted_at';
            $assignments = ['`' . $softDeleteColumn . '` = ?'];
            $parameters = [(int) floor(microtime(true) * 1000)];
            if (isset($columns['status'])) { $assignments[] = "`status` = 'trash'"; }
            if (isset($columns['updated_at'])) { $assignments[] = '`updated_at` = ?'; $parameters[] = (int) floor(microtime(true) * 1000); }
            $parameters[] = $id;
            $statement = $pdo->prepare('UPDATE `' . $table . '` SET ' . implode(', ', $assignments) . ' WHERE `id` = ?');
            $statement->execute($parameters);
        } else {
            $statement = $pdo->prepare('DELETE FROM `' . $table . '` WHERE `id` = ?');
            $statement->execute([$id]);
        }
        $sendContentJson(200, ['success' => $statement->rowCount() > 0]);
        return true;
    }

    $sendContentJson(405, ['message' => 'Method not allowed']);
    return true;
} catch (Throwable $error) {
    error_log('Cloudways admin content error: ' . $error->getMessage());
    $sendContentJson(500, ['message' => 'تعذر إكمال العملية']);
    return true;
}
