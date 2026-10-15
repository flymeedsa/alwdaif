<?php
declare(strict_types=1);
require_once __DIR__ . '/auth-policy.php';
$guardPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (!preg_match('#^/api/(?:_cloudways/)?admin/(.*)$#', $guardPath, $guardMatch)) return false;
$guardRoute = $guardMatch[1];
$guardMethod = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if (($guardRoute === 'login' && $guardMethod === 'POST') || ($guardRoute === 'check-auth' && $guardMethod === 'GET')) return false;
$guardJson = static function(int $code): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['message' => $code === 401 ? 'Unauthorized' : ($code === 403 ? 'Forbidden' : 'Authentication unavailable')]);
};
$guardHeader = (string) ($_SERVER['HTTP_X_ADMIN_TOKEN'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '');
if (trim($guardHeader) === '') { $guardJson(401); return true; }
try {
    $guardConfig = require dirname(__DIR__) . '/private_html/alwdaif-migration-config.php';
    $guardPdo = new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $guardConfig['host'], $guardConfig['port'], $guardConfig['database']), $guardConfig['username'], $guardConfig['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $guardAdmin = alwdaifAdminIdentity($guardPdo, $guardConfig, $guardHeader);
    if (!$guardAdmin) { $guardJson(401); return true; }
    $guardBody = json_decode(file_get_contents('php://input') ?: '{}', true);
    if (in_array($guardMethod, ['PATCH','PUT','DELETE'], true) && preg_match('#^blog/(\d+)$#', $guardRoute, $blogMatch)) {
        $existingBlog = $guardPdo->prepare('SELECT `status` FROM `blog_posts` WHERE `id`=?');
        $existingBlog->execute([(int)$blogMatch[1]]);
        if ($existingBlog->fetchColumn() === 'published') {
            if (!is_array($guardBody)) $guardBody = [];
            $guardBody['status'] = 'published';
        }
    }
    if (!alwdaifAdminAllowed($guardAdmin, $guardRoute, $guardMethod, is_array($guardBody) ? $guardBody : [])) { $guardJson(403); return true; }
    return false;
} catch (Throwable $error) {
    error_log('Admin authorization failed: ' . $error->getMessage());
    $guardJson(503); return true;
}
