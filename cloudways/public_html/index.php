<?php

declare(strict_types=1);

/** Cloudways-native front controller. No production request leaves Cloudways. */

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$adminAuth = __DIR__ . '/admin-auth.php';
if (is_file($adminAuth) && (require $adminAuth) === true) {
    exit;
}
$adminContent = __DIR__ . '/admin-content.php';
if (is_file($adminContent) && (require $adminContent) === true) {
    exit;
}
$communityAuth = __DIR__ . '/community-auth.php';
if (is_file($communityAuth) && (require $communityAuth) === true) {
    exit;
}
$communityApi = __DIR__ . '/community-api.php';
if (is_file($communityApi) && (require $communityApi) === true) {
    exit;
}
$supportApi = __DIR__ . '/support-api.php';
if (is_file($supportApi) && (require $supportApi) === true) {
    exit;
}
$ordersApi = __DIR__ . '/orders-api.php';
if (is_file($ordersApi) && (require $ordersApi) === true) {
    exit;
}
$searchApi = __DIR__ . '/search-api.php';
if (is_file($searchApi) && (require $searchApi) === true) {
    exit;
}
$localApi = __DIR__ . '/local-api.php';
if (is_file($localApi) && (require $localApi) === true) {
    exit;
}
$uploadHandler = __DIR__ . '/upload-handler.php';
if (is_file($uploadHandler) && (require $uploadHandler) === true) {
    exit;
}
$runtimeApi = __DIR__ . '/runtime-api.php';
if (is_file($runtimeApi) && (require $runtimeApi) === true) {
    exit;
}
if (($method ?? strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'GET' && (parse_url($requestUri, PHP_URL_PATH) ?: '/') === '/api/homepage-settings') {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode([
        'sections' => [
            'hero' => ['enabled' => true, 'order' => 1],
            'featured' => ['enabled' => true, 'order' => 2],
            'latest_jobs' => ['enabled' => true, 'order' => 3],
            'community' => ['enabled' => false, 'order' => 4],
        ],
        'hero' => [
            'title' => 'ابحث عن وظيفتك اليوم',
            'subtitle' => 'خيارك الأول للبحث عن الوظائف المدنية والعسكرية والشركات',
            'showSearch' => true,
        ],
        'latest_jobs' => ['count' => 12],
        'featured' => ['count' => 4],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$path = parse_url($requestUri, PHP_URL_PATH) ?: '/';
if (strpos($path, '/api/') === 0 || $path === '/ws') {
    http_response_code($path === '/ws' ? 426 : 404);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    if ($method !== 'HEAD') echo json_encode(['message' => $path === '/ws' ? 'WebSocket is not required by this deployment' : 'API route not found'], JSON_UNESCAPED_UNICODE);
    exit;
}

$spaIndex = __DIR__ . '/spa-index.html';
if (!is_file($spaIndex)) {
    http_response_code(503);
    exit('Application release is not installed.');
}
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
if ($method !== 'HEAD') readfile($spaIndex);
