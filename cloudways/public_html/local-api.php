<?php

declare(strict_types=1);

require_once __DIR__ . '/public-content-queries.php';

/** Read-only MariaDB API used to validate parity before switching production routes. */

$localPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$isQaRoute = strpos($localPath, '/api/_cloudways/') === 0;
$publicLocalRoutes = [
    '/api/categories', '/api/organizations', '/api/organization-types', '/api/blog-categories',
    '/api/faq/categories', '/api/faq', '/api/jobs', '/api/jobs/featured', '/api/blog',
    '/api/employer-jobs', '/api/results', '/api/ads', '/api/announcements',
];
$isPublicLocalRoute = in_array($localPath, $publicLocalRoutes, true)
    || preg_match('#^/api/(jobs|blog)/\d+$#', $localPath) === 1
    || preg_match('#^/api/pages/[^/]+$#', $localPath) === 1;
if (!$isQaRoute && !$isPublicLocalRoute) return false;
if (!in_array(strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'), ['GET', 'HEAD'], true)) return false;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$camelize = static function (string $value): string {
    return preg_replace_callback('/_([a-z])/', static fn(array $match): string => strtoupper($match[1]), $value) ?? $value;
};
$normalize = static function (array $row) use ($camelize): array {
    $result = [];
    foreach ($row as $key => $value) {
        $result[$camelize((string) $key)] = $value;
    }
    return $result;
};
$respond = static function (int $status, $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
};

try {
    $config = require dirname(__DIR__) . '/private_html/alwdaif-migration-config.php';
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['host'], $config['port'], $config['database']),
        $config['username'], $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    $route = $isQaRoute ? (substr($localPath, strlen('/api/_cloudways')) ?: '/') : (substr($localPath, strlen('/api')) ?: '/');
    if ($route === '/health') {
        $counts = [];
        foreach (['jobs', 'organizations', 'blog_posts', 'employer_jobs', 'faq_items', 'services'] as $table) {
            $counts[$table] = (int) $pdo->query('SELECT COUNT(*) FROM `' . $table . '`')->fetchColumn();
        }
        $respond(200, ['status' => 'ok', 'database' => 'mariadb', 'counts' => $counts]);
        return true;
    }

    $simpleRoutes = [
        '/categories' => ['categories', '`sort_order` ASC, `id` ASC'],
        '/organization-types' => ['organization_types', '`id` ASC'],
        '/blog-categories' => ['blog_categories', '`sort_order` ASC, `id` ASC'],
        '/services' => ['services', '`sort_order` ASC, `id` ASC'],
        '/faq/categories' => ['faq_categories', '`sort_order` ASC, `id` ASC'],
        '/faq' => ['faq_items', '`sort_order` ASC, `id` ASC'],
        '/community/ranks' => ['member_ranks', '`sort_order` ASC, `id` ASC'],
    ];
    if ($route === '/organizations') {
        $rows = $pdo->query(
            'SELECT o.*,
                    (SELECT COUNT(*) FROM `organization_follows` f WHERE f.`organization_id` = o.`id`) AS `follower_count`
             FROM `organizations` o
             ORDER BY o.`id` ASC'
        )->fetchAll();
        $mapped = array_map($normalize, $rows);
        $totalFollowers = array_sum(array_map(static fn(array $row): int => (int) ($row['followerCount'] ?? 0), $mapped));
        $respond(200, ['orgs' => $mapped, 'totalFollowers' => $totalFollowers]);
        return true;
    }
    if (isset($simpleRoutes[$route])) {
        [$table, $order] = $simpleRoutes[$route];
        $rows = $pdo->query('SELECT * FROM `' . $table . '` ORDER BY ' . $order)->fetchAll();
        $respond(200, array_map($normalize, $rows));
        return true;
    }

    if ($route === '/jobs' || $route === '/jobs/featured') {
        $where = ['j.`trashed_at` IS NULL', "j.`status` = 'published'"];
        $params = [];
        if ($route === '/jobs/featured') $where[] = 'j.`is_featured` = 1';
        if (isset($_GET['category']) && $_GET['category'] !== '' && $_GET['category'] !== 'all') {
            $where[] = 'j.`category` = ?'; $params[] = $_GET['category'];
        }
        if (isset($_GET['search']) && trim((string) $_GET['search']) !== '') {
            $where[] = '(j.`title` LIKE ? OR j.`company` LIKE ? OR j.`description` LIKE ?)';
            $term = '%' . trim((string) $_GET['search']) . '%'; array_push($params, $term, $term, $term);
        }
        $statement = $pdo->prepare('SELECT j.* FROM `jobs` j WHERE ' . implode(' AND ', $where) . ' ORDER BY j.`is_featured` DESC, j.`created_at` DESC, j.`id` DESC');
        $statement->execute($params);
        $respond(200, array_map($normalize, $statement->fetchAll()));
        return true;
    }
    if (preg_match('#^/jobs/(\d+)$#', $route, $match) === 1) {
        if (($_GET['isResult'] ?? '') === 'true') {
            $statement = $pdo->prepare("SELECT * FROM `results` WHERE `id`=? AND `trashed_at` IS NULL AND `status`='published' LIMIT 1");
            $statement->execute([(int)$match[1]]); $row = $statement->fetch();
            if (!$row) { $respond(404, ['message'=>'Result not found']); return true; }
            $result = $normalize($row);
            $result = array_merge($result, ['company'=>$row['org'], 'description'=>$row['details'], 'applyUrl'=>$row['inquiry_url'], 'sourceUrl'=>$row['inquiry_url'], 'category'=>'results', 'isResult'=>true, 'isFeatured'=>false, 'organization'=>null]);
            if ($row['organization_id']) {
                $organization = $pdo->prepare('SELECT * FROM `organizations` WHERE `id`=?');
                $organization->execute([$row['organization_id']]); $org = $organization->fetch();
                if ($org) $result['organization'] = $normalize($org);
            }
            $respond(200, $result); return true;
        }
        $statement = $pdo->prepare("SELECT * FROM `jobs` WHERE `id` = ? AND `trashed_at` IS NULL AND `status`='published' LIMIT 1");
        $statement->execute([(int) $match[1]]); $row = $statement->fetch();
        $respond($row ? 200 : 404, $row ? $normalize($row) : ['message' => 'Job not found']);
        return true;
    }
    if ($route === '/blog') {
        $statement = $pdo->query("SELECT * FROM `blog_posts` WHERE `trashed_at` IS NULL AND `status` = 'published' ORDER BY `created_at` DESC, `id` DESC");
        $respond(200, array_map($normalize, $statement->fetchAll()));
        return true;
    }
    if (preg_match('#^/blog/(\d+)$#', $route, $match) === 1) {
        $row = alwdaifPublicBlogPost($pdo, (int) $match[1]);
        $respond($row ? 200 : 404, $row ? $normalize($row) : ['message' => 'Post not found']);
        return true;
    }
    if ($route === '/employer-jobs') {
        $rows = alwdaifPublicEmployerJobs($pdo);
        $respond(200, array_map($normalize, $rows));
        return true;
    }
    if ($route === '/results') {
        $rows = $pdo->query("SELECT * FROM `results` WHERE `trashed_at` IS NULL AND `status`='published' ORDER BY `created_at` DESC, `id` DESC")->fetchAll();
        $respond(200, array_map($normalize, $rows));
        return true;
    }
    if ($route === '/ads') {
        $rows = $pdo->query('SELECT * FROM `ads` WHERE `is_active`=1 AND `deleted_at` IS NULL ORDER BY `priority` DESC, `id` DESC')->fetchAll();
        $respond(200, array_map($normalize, $rows));
        return true;
    }
    if ($route === '/announcements') {
        $rows = $pdo->query("SELECT * FROM `announcements` WHERE `status` = 'published' ORDER BY `created_at` DESC")->fetchAll();
        $respond(200, array_map($normalize, $rows));
        return true;
    }
    if (preg_match('#^/pages/([^/]+)$#', $route, $match) === 1) {
        $statement = $pdo->prepare("SELECT * FROM `pages` WHERE `slug`=? AND `status`='published' AND `trashed_at` IS NULL LIMIT 1");
        $statement->execute([urldecode($match[1])]); $row = $statement->fetch();
        $respond($row ? 200 : 404, $row ? $normalize($row) : ['message' => 'Page not found']);
        return true;
    }

    $respond(404, ['message' => 'Local API route not implemented']);
    return true;
} catch (Throwable $error) {
    error_log('Cloudways local API error: ' . $error->getMessage());
    $respond(500, ['message' => 'Local database request failed']);
    return true;
}
