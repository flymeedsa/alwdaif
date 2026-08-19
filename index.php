<?php

declare(strict_types=1);

/**
 * Temporary Cloudways migration bridge.
 *
 * Static assets are served by Apache from this directory. Dynamic requests are
 * forwarded to the existing production origin until the D1/R2 data layer has
 * been replaced with MariaDB/local object storage.
 */

const UPSTREAM_ORIGIN = 'https://alwdaif.barqiyat.chatgpt.site';

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
            'subtitle' => 'خيارك الأول للبحث عن الوظائف المدنية والعسكرية والشركات الكبرى',
            'showSearch' => true,
        ],
        'latest_jobs' => ['count' => 12],
        'featured' => ['count' => 4],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
$targetUrl = UPSTREAM_ORIGIN . $requestUri;
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

$requestHeaders = [];
foreach (getallheaders() ?: [] as $name => $value) {
    $lower = strtolower($name);
    if (in_array($lower, ['host', 'content-length', 'connection', 'accept-encoding'], true)) {
        continue;
    }
    $requestHeaders[] = $name . ': ' . $value;
}
$requestHeaders[] = 'X-Forwarded-Host: ' . ($_SERVER['HTTP_HOST'] ?? '');
$requestHeaders[] = 'X-Forwarded-Proto: https';

$curl = curl_init($targetUrl);
if ($curl === false) {
    http_response_code(502);
    exit('Unable to initialize the migration bridge.');
}

curl_setopt_array($curl, [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => $requestHeaders,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 60,
]);

if (!in_array($method, ['GET', 'HEAD'], true)) {
    curl_setopt($curl, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$response = curl_exec($curl);
if ($response === false) {
    error_log('Cloudways bridge error: ' . curl_error($curl));
    curl_close($curl);
    http_response_code(502);
    exit('The upstream application is temporarily unavailable.');
}

$status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$headerSize = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
$rawHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);
curl_close($curl);
$body = str_replace('</head>', '<script src="/search-fetch-r2.js"></script></head>', $body);

http_response_code($status > 0 ? $status : 502);

foreach (preg_split('/\r\n|\r|\n/', trim($rawHeaders)) ?: [] as $headerLine) {
    if ($headerLine === '' || strpos($headerLine, 'HTTP/') === 0) {
        continue;
    }
    $separator = strpos($headerLine, ':');
    if ($separator === false) {
        continue;
    }
    $name = trim(substr($headerLine, 0, $separator));
    $lower = strtolower($name);
    if (in_array($lower, ['content-length', 'transfer-encoding', 'connection', 'content-encoding'], true)) {
        continue;
    }
    header($headerLine, false);
}

if ($method !== 'HEAD') {
    echo $body;
}
