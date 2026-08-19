<?php

declare(strict_types=1);

/** Cloudways-native Arabic job search backed by the isolated MariaDB database. */

$searchPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$searchMethod = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$isSuggestionRequest = $searchPath === '/api/jobs/suggestions';
$isSearchRequest = $searchPath === '/api/jobs' && isset($_GET['search']) && trim((string) $_GET['search']) !== '';
if ($searchMethod !== 'GET' || (!$isSuggestionRequest && !$isSearchRequest)) return false;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$camelizeSearchKey = static function (string $value): string {
    return preg_replace_callback('/_([a-z])/', static fn(array $match): string => strtoupper($match[1]), $value) ?? $value;
};
$normalizeSearchRow = static function (array $row) use ($camelizeSearchKey): array {
    $result = [];
    foreach ($row as $key => $value) {
        if (is_string($value) && preg_match('/^-?[0-9]+$/', $value) === 1) $value = (int) $value;
        $result[$camelizeSearchKey((string) $key)] = $value;
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

    $query = trim((string) ($_GET[$isSuggestionRequest ? 'q' : 'search'] ?? ''));
    if (mb_strlen($query, 'UTF-8') < 2) {
        echo '[]';
        return true;
    }
    $term = '%' . $query . '%';

    if ($isSuggestionRequest) {
        $statement = $pdo->prepare("SELECT DISTINCT `title` FROM `jobs` WHERE `status` = 'published' AND `trashed_at` IS NULL AND `title` LIKE ? ORDER BY `created_at` DESC LIMIT 8");
        $statement->execute([$term]);
        echo json_encode($statement->fetchAll(PDO::FETCH_COLUMN), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return true;
    }

    $where = ["j.`status` = 'published'", 'j.`trashed_at` IS NULL', '(j.`title` LIKE ? OR j.`company` LIKE ? OR j.`description` LIKE ? OR j.`summary` LIKE ? OR j.`location` LIKE ?)'];
    $params = [$term, $term, $term, $term, $term];
    $category = trim((string) ($_GET['category'] ?? ''));
    if ($category !== '' && $category !== 'all') {
        $where[] = 'j.`category` = ?';
        $params[] = $category;
    }
    $statement = $pdo->prepare('SELECT j.* FROM `jobs` j WHERE ' . implode(' AND ', $where) . ' ORDER BY j.`created_at` DESC, j.`id` DESC');
    $statement->execute($params);
    $jobs = array_map($normalizeSearchRow, $statement->fetchAll());

    $organizations = [];
    foreach ($pdo->query('SELECT * FROM `organizations`')->fetchAll() as $organization) {
        $normalized = $normalizeSearchRow($organization);
        $organizations[(int) $normalized['id']] = $normalized;
    }
    foreach ($jobs as &$job) {
        $organizationId = isset($job['organizationId']) ? (int) $job['organizationId'] : 0;
        $job['isResult'] = false;
        $job['organization'] = $organizationId && isset($organizations[$organizationId]) ? $organizations[$organizationId] : null;
    }
    unset($job);

    echo json_encode($jobs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return true;
} catch (Throwable $error) {
    error_log('Cloudways search error: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'تعذر تنفيذ البحث'], JSON_UNESCAPED_UNICODE);
    return true;
}
