<?php
$root = $_SERVER['DOCUMENT_ROOT'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
register_shutdown_function(static function() use ($path, $requestMethod): void {
    error_log('QA HTTP ' . $requestMethod . ' ' . $path . ' ' . http_response_code());
});
if ($requestMethod === 'PATCH' && preg_match('#^/api/admin/employer-jobs/\d+$#', $path)) {
    $fixtureBody = json_decode(file_get_contents('php://input'), true);
    error_log('QA employer deadline: ' . json_encode($fixtureBody['deadlineDate'] ?? null));
}
$candidate = realpath($root . $path);
if (!in_array($path, ['/robots.txt', '/sitemap.xml'], true) && $candidate !== false && str_starts_with($candidate, realpath($root) . DIRECTORY_SEPARATOR) && is_file($candidate) && pathinfo($candidate, PATHINFO_EXTENSION) !== 'php') return false;
require $root . '/index.php';
