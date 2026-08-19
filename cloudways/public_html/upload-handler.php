<?php

declare(strict_types=1);

/** Local, application-scoped upload storage for the Cloudways migration. */

$uploadPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$uploadMethod = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$uploadRoot = __DIR__ . '/uploads';
$maxUploadBytes = 50 * 1024 * 1024;
$allowedUploadTypes = [
    'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif',
    'application/pdf' => 'pdf', 'text/plain' => 'txt', 'text/csv' => 'csv',
    'application/zip' => 'zip',
    'application/msword' => 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
    'application/vnd.ms-excel' => 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
];

$sendUploadJson = static function (int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
};

$validateAdmin = static function (): bool {
    $curl = curl_init(UPSTREAM_ORIGIN . '/api/admin/me');
    if ($curl === false) return false;
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_NOBODY => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Cookie: ' . ($_SERVER['HTTP_COOKIE'] ?? '')],
    ]);
    curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    return $status >= 200 && $status < 300;
};

$storeUpload = static function (string $temporaryFile, int $size) use ($uploadRoot, $maxUploadBytes, $allowedUploadTypes): array {
    if ($size < 1 || $size > $maxUploadBytes || !is_file($temporaryFile)) {
        throw new RuntimeException('حجم الملف غير صالح أو يتجاوز 50 ميجابايت.');
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($temporaryFile) ?: 'application/octet-stream';
    if (!isset($allowedUploadTypes[$mime])) {
        throw new RuntimeException('نوع الملف غير مسموح.');
    }
    $relativeDirectory = gmdate('Y/m');
    $directory = $uploadRoot . '/' . $relativeDirectory;
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        throw new RuntimeException('تعذر إنشاء مجلد التخزين.');
    }
    $filename = bin2hex(random_bytes(20)) . '.' . $allowedUploadTypes[$mime];
    $destination = $directory . '/' . $filename;
    if (!rename($temporaryFile, $destination)) {
        if (!copy($temporaryFile, $destination)) throw new RuntimeException('تعذر حفظ الملف.');
        @unlink($temporaryFile);
    }
    chmod($destination, 0644);
    return ['url' => '/uploads/' . $relativeDirectory . '/' . $filename, 'mime' => $mime, 'size' => $size];
};

if ($uploadMethod === 'POST' && ($uploadPath === '/api/admin/upload' || $uploadPath === '/api/media/upload')) {
    if ($uploadPath === '/api/admin/upload' && !$validateAdmin()) {
        $sendUploadJson(401, ['message' => 'غير مصرح']);
        return true;
    }
    if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
        $sendUploadJson(400, ['message' => 'لم يتم إرفاق ملف صالح']);
        return true;
    }
    try {
        $stored = $storeUpload($_FILES['file']['tmp_name'], (int) $_FILES['file']['size']);
        $sendUploadJson(200, ['url' => $stored['url'], 'path' => $stored['url'], 'mime' => $stored['mime'], 'size' => $stored['size']]);
    } catch (Throwable $error) {
        $sendUploadJson(400, ['message' => $error->getMessage()]);
    }
    return true;
}

if ($uploadMethod === 'POST' && $uploadPath === '/api/uploads/request-url') {
    $body = json_decode(file_get_contents('php://input') ?: '{}', true);
    $name = is_array($body) ? (string) ($body['name'] ?? 'upload') : 'upload';
    $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $token = bin2hex(random_bytes(20)) . ($extension ? '.' . preg_replace('/[^a-z0-9]/', '', $extension) : '');
    $sendUploadJson(200, ['uploadURL' => '/api/uploads/local/' . $token, 'objectPath' => '/objects/uploads/' . $token, 'metadata' => $body]);
    return true;
}

if ($uploadMethod === 'PUT' && (preg_match('#^/api/uploads/(?:local|r2)/[^/]+$#', $uploadPath) === 1)) {
    $temporaryFile = tempnam(sys_get_temp_dir(), 'alwdaif-upload-');
    $input = fopen('php://input', 'rb');
    $output = $temporaryFile === false ? false : fopen($temporaryFile, 'wb');
    if ($input === false || $output === false) {
        $sendUploadJson(500, ['error' => 'تعذر تجهيز الملف']);
        return true;
    }
    $size = stream_copy_to_stream($input, $output, $maxUploadBytes + 1);
    fclose($input); fclose($output);
    try {
        $stored = $storeUpload($temporaryFile, (int) $size);
        $sendUploadJson(200, ['success' => true, 'objectPath' => $stored['url'], 'url' => $stored['url']]);
    } catch (Throwable $error) {
        @unlink($temporaryFile);
        $sendUploadJson(400, ['error' => $error->getMessage()]);
    }
    return true;
}

return false;
