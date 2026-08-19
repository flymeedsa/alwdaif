<?php

declare(strict_types=1);

/** Cloudways-native community authentication, kept under QA until verified. */

$communityPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$communityPrefix = strpos($communityPath, '/api/_cloudways/community') === 0
    ? '/api/_cloudways/community'
    : '/api/community';
if (strpos($communityPath, $communityPrefix) !== 0) return false;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$communityJson = static function (int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
};
$communityMember = static function (array $member): array {
    unset($member['password']);
    $result = [];
    foreach ($member as $key => $value) {
        if (is_string($value) && preg_match('/^-?[0-9]+$/', $value) === 1) $value = (int) $value;
        $camel = preg_replace_callback('/_([a-z])/', static fn(array $match): string => strtoupper($match[1]), (string) $key) ?? $key;
        $result[$camel] = $value;
    }
    return $result;
};

try {
    $config = require dirname(__DIR__) . '/private_html/alwdaif-migration-config.php';
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['host'], $config['port'], $config['database']),
        $config['username'], $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    $pdo->exec('CREATE TABLE IF NOT EXISTS `community_auth_tokens` (`id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, `token_hash` CHAR(64) NOT NULL UNIQUE, `member_id` BIGINT NOT NULL, `expires_at` BIGINT NOT NULL, `created_at` BIGINT NOT NULL, INDEX `community_auth_member_idx` (`member_id`), INDEX `community_auth_expires_idx` (`expires_at`)) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $route = substr($communityPath, strlen($communityPrefix)) ?: '/';
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $body = in_array($method, ['POST', 'PUT', 'PATCH'], true) ? json_decode(file_get_contents('php://input') ?: '{}', true) : [];

    $getToken = static function (): string {
        return trim((string) ($_SERVER['HTTP_X_COMMUNITY_TOKEN'] ?? ''));
    };
    $issueToken = static function (PDO $pdo, int $memberId): string {
        $token = bin2hex(random_bytes(32));
        $statement = $pdo->prepare('INSERT INTO `community_auth_tokens` (`token_hash`, `member_id`, `expires_at`, `created_at`) VALUES (?, ?, ?, ?)');
        $now = (int) floor(microtime(true) * 1000);
        $statement->execute([hash('sha256', $token), $memberId, $now + 2592000000, $now]);
        return $token;
    };

    if (preg_match('#^/check-username/([A-Za-z0-9]{1,40})$#', $route, $match) === 1 && $method === 'GET') {
        $username = $match[1];
        if (preg_match('/^[A-Za-z0-9]{5,12}$/', $username) !== 1) {
            $communityJson(200, ['available' => false, 'reason' => 'invalid']); return true;
        }
        $statement = $pdo->prepare('SELECT 1 FROM `community_members` WHERE `username` = ? LIMIT 1'); $statement->execute([$username]);
        $communityJson(200, ['available' => !$statement->fetchColumn()]); return true;
    }

    if ($route === '/register' && $method === 'POST') {
        if (!empty($body['website'])) { $communityJson(400, ['message' => 'فشل في إنشاء الحساب']); return true; }
        $username = trim((string) ($body['username'] ?? ''));
        $displayName = trim((string) ($body['displayName'] ?? ''));
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $phone = trim((string) ($body['phone'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        if (preg_match('/^[A-Za-z0-9]{5,12}$/', $username) !== 1 || !filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/^05[0-9]{8}$/', $phone) !== 1 || mb_strlen($displayName, 'UTF-8') < 2 || strlen($password) < 6) {
            $communityJson(400, ['message' => 'بيانات التسجيل غير صالحة']); return true;
        }
        $statement = $pdo->prepare('SELECT 1 FROM `community_members` WHERE `username` = ? OR `email` = ? LIMIT 1'); $statement->execute([$username, $email]);
        if ($statement->fetchColumn()) { $communityJson(400, ['message' => 'اسم المستخدم أو البريد مستخدم بالفعل']); return true; }
        $now = (int) floor(microtime(true) * 1000);
        $statement = $pdo->prepare("INSERT INTO `community_members` (`user_id`,`username`,`display_name`,`email`,`phone`,`password`,`provider`,`role`,`is_banned`,`is_verified`,`last_active`,`created_at`) VALUES (?,?,?,?,?,?, 'email','new_member',0,0,?,?)");
        $statement->execute(['email_' . $now . '_' . bin2hex(random_bytes(5)), $username, $displayName, $email, $phone, password_hash($password, PASSWORD_BCRYPT), $now, $now]);
        $memberId = (int) $pdo->lastInsertId();
        $statement = $pdo->prepare('SELECT * FROM `community_members` WHERE `id` = ?'); $statement->execute([$memberId]); $member = $statement->fetch();
        $communityJson(201, ['success' => true, 'member' => $communityMember($member), 'token' => $issueToken($pdo, $memberId)]); return true;
    }

    if ($route === '/login' && $method === 'POST') {
        $identity = trim((string) ($body['emailOrUsername'] ?? '')); $password = (string) ($body['password'] ?? '');
        $statement = $pdo->prepare('SELECT * FROM `community_members` WHERE `email` = ? OR `username` = ? LIMIT 1'); $statement->execute([strtolower($identity), $identity]); $member = $statement->fetch();
        $valid = $member && !empty($member['password']) && (strpos((string) $member['password'], '$2') === 0 ? password_verify($password, (string) $member['password']) : hash_equals((string) $member['password'], $password));
        if (!$valid) { $communityJson(401, ['message' => 'البيانات غير صحيحة']); return true; }
        if ((int) $member['is_banned'] === 1) { $communityJson(403, ['message' => 'هذا الحساب محظور']); return true; }
        $communityJson(200, ['success' => true, 'member' => $communityMember($member), 'token' => $issueToken($pdo, (int) $member['id'])]); return true;
    }

    if ($route === '/me' && $method === 'GET') {
        $token = $getToken();
        if ($token === '') { $communityJson(200, ['authenticated' => false]); return true; }
        $statement = $pdo->prepare('SELECT m.* FROM `community_auth_tokens` t JOIN `community_members` m ON m.`id` = t.`member_id` WHERE t.`token_hash` = ? AND t.`expires_at` > ? AND m.`is_banned` = 0 LIMIT 1');
        $statement->execute([hash('sha256', $token), (int) floor(microtime(true) * 1000)]); $member = $statement->fetch();
        $communityJson(200, $member ? ['authenticated' => true, 'member' => $communityMember($member)] : ['authenticated' => false]); return true;
    }

    if ($route === '/logout' && $method === 'POST') {
        $token = $getToken();
        if ($token !== '') { $statement = $pdo->prepare('DELETE FROM `community_auth_tokens` WHERE `token_hash` = ?'); $statement->execute([hash('sha256', $token)]); }
        $communityJson(200, ['success' => true]); return true;
    }

    return false;
} catch (Throwable $error) {
    error_log('Cloudways community auth error: ' . $error->getMessage());
    $communityJson(500, ['message' => 'تعذر إكمال العملية']);
    return true;
}
