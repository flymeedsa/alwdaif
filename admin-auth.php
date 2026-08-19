<?php

declare(strict_types=1);

/** Stateless Cloudways admin authentication, initially exposed under a QA prefix. */

$adminPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$adminPrefix = strpos($adminPath, '/api/_cloudways/admin') === 0 ? '/api/_cloudways/admin' : '/api/admin';
if (strpos($adminPath, $adminPrefix) !== 0) return false;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$adminJson = static function (int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
};
$base64UrlEncode = static function (string $value): string {
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
};
$base64UrlDecode = static function (string $value): string {
    return (string) base64_decode(strtr($value, '-_', '+/'), true);
};

try {
    $config = require dirname(__DIR__) . '/private_html/alwdaif-migration-config.php';
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['host'], $config['port'], $config['database']),
        $config['username'], $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    $signToken = static function (array $payload) use ($config, $base64UrlEncode): string {
        $encoded = $base64UrlEncode(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        return $encoded . '.' . $base64UrlEncode(hash_hmac('sha256', $encoded, $config['token'], true));
    };
    $readToken = static function () use ($config, $base64UrlDecode): ?array {
        $header = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
        $token = preg_replace('/^Bearer\s+/i', '', trim((string) $header));
        if (!$token || strpos($token, '.') === false) return null;
        [$payloadPart, $signaturePart] = explode('.', $token, 2);
        $expected = hash_hmac('sha256', $payloadPart, $config['token'], true);
        $provided = $base64UrlDecode($signaturePart);
        if (!hash_equals($expected, $provided)) return null;
        $payload = json_decode($base64UrlDecode($payloadPart), true);
        if (!is_array($payload) || (int) ($payload['expires'] ?? 0) < time()) return null;
        return $payload;
    };

    $route = substr($adminPath, strlen($adminPrefix)) ?: '/';
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    if ($route === '/login' && $method === 'POST') {
        $ipHash = hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
        $rateFile = sys_get_temp_dir() . '/alwdaif-login-' . $ipHash . '.json';
        $attempts = is_file($rateFile) ? json_decode((string) file_get_contents($rateFile), true) : [];
        $attempts = is_array($attempts) ? array_values(array_filter($attempts, static fn($stamp): bool => (int) $stamp > time() - 900)) : [];
        if (count($attempts) >= 5) {
            $adminJson(429, ['message' => 'محاولات كثيرة، حاول بعد 15 دقيقة']);
            return true;
        }
        $body = json_decode(file_get_contents('php://input') ?: '{}', true);
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        if ($email === '' || $password === '') {
            $adminJson(400, ['message' => 'البريد الإلكتروني وكلمة المرور مطلوبان']);
            return true;
        }

        $statement = $pdo->prepare('SELECT * FROM `admins` WHERE (`email` = ? OR `username` = ?) AND `is_active` = 1 LIMIT 1');
        $statement->execute([$email, $email]);
        $admin = $statement->fetch();
        $adminId = null; $adminName = 'المشرف الرئيسي'; $valid = false;
        if ($admin && !empty($admin['password'])) {
            $valid = password_verify($password, (string) $admin['password']);
            $adminId = (int) $admin['id']; $adminName = (string) $admin['name'];
        } else {
            $settingsStatement = $pdo->prepare("SELECT `key`, `value` FROM `site_settings` WHERE `key` IN ('ADMIN_EMAIL', 'ADMIN_PASSWORD')");
            $settingsStatement->execute();
            $settings = [];
            foreach ($settingsStatement->fetchAll() as $setting) $settings[$setting['key']] = (string) $setting['value'];
            $valid = isset($settings['ADMIN_EMAIL'], $settings['ADMIN_PASSWORD'])
                && hash_equals(strtolower($settings['ADMIN_EMAIL']), strtolower($email))
                && hash_equals($settings['ADMIN_PASSWORD'], $password);
        }
        if (!$valid) {
            $attempts[] = time();
            file_put_contents($rateFile, json_encode($attempts), LOCK_EX);
            $adminJson(401, ['message' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة']);
            return true;
        }
        @unlink($rateFile);
        $token = $signToken(['adminId' => $adminId, 'adminName' => $adminName, 'expires' => time() + 604800]);
        $adminJson(200, ['success' => true, 'message' => 'Login successful', 'token' => $token]);
        return true;
    }

    if ($route === '/check-auth' && $method === 'GET') {
        $adminJson(200, ['isAdmin' => $readToken() !== null]);
        return true;
    }
    if ($route === '/me' && $method === 'GET') {
        $payload = $readToken();
        if (!$payload) {
            $adminJson(401, ['message' => 'Unauthorized']);
            return true;
        }
        if (empty($payload['adminId'])) {
            $adminJson(200, ['role' => 'super', 'permissions' => null, 'isSuperAdmin' => true, 'name' => $payload['adminName']]);
            return true;
        }
        $statement = $pdo->prepare('SELECT `name`, `role`, `permissions` FROM `admins` WHERE `id` = ? AND `is_active` = 1 LIMIT 1');
        $statement->execute([(int) $payload['adminId']]); $admin = $statement->fetch();
        if (!$admin) {
            $adminJson(401, ['message' => 'Unauthorized']);
            return true;
        }
        $adminJson(200, ['role' => $admin['role'], 'permissions' => $admin['permissions'], 'isSuperAdmin' => false, 'name' => $admin['name']]);
        return true;
    }
    if ($route === '/logout' && $method === 'POST') {
        $adminJson(200, ['success' => true, 'message' => 'Logged out']);
        return true;
    }

    return false;
} catch (Throwable $error) {
    error_log('Cloudways admin auth error: ' . $error->getMessage());
    $adminJson(500, ['message' => 'تعذر إكمال المصادقة']);
    return true;
}
