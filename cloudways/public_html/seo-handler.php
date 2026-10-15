<?php
declare(strict_types=1);

$seoPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (!in_array($seoPath, ['/sitemap.xml', '/robots.txt'], true)) return false;
$seoMethod = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if (!in_array($seoMethod, ['GET', 'HEAD'], true)) {
    http_response_code(405); header('Allow: GET, HEAD'); return true;
}
try {
    $seoConfig = require dirname(__DIR__) . '/private_html/alwdaif-migration-config.php';
    // Never derive canonical URLs from the untrusted request Host header.
    $seoBase = rtrim($seoConfig['site_url'] ?? 'https://phpstack-564460-6624296.cloudwaysapps.com', '/');
    if (!filter_var($seoBase, FILTER_VALIDATE_URL) || !in_array(parse_url($seoBase, PHP_URL_SCHEME), ['https', 'http'], true)) throw new RuntimeException('Invalid canonical URL configuration');
    header('X-Content-Type-Options: nosniff');
    if ($seoPath === '/robots.txt') {
        header('Content-Type: text/plain; charset=utf-8');
        if ($seoMethod !== 'HEAD') echo "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /api/\nDisallow: /login\n\nSitemap: {$seoBase}/sitemap.xml\n";
        return true;
    }
    $seoPdo = new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $seoConfig['host'], $seoConfig['port'], $seoConfig['database']), $seoConfig['username'], $seoConfig['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $seoPaths = ['/', '/jobs', '/jobs/organizations', '/jobs/results', '/jobs/employer', '/blog', '/faq', '/pages/about', '/pages/contact', '/pages/terms', '/pages/privacy'];
    foreach ([
        ["SELECT id FROM jobs WHERE status='published' AND trashed_at IS NULL ORDER BY id LIMIT 50001", '/jobs/post/'],
        ["SELECT id FROM results WHERE status='published' AND trashed_at IS NULL ORDER BY id LIMIT 50001", '/jobs/post/', '?isResult=true'],
        ["SELECT id FROM blog_posts WHERE status='published' AND trashed_at IS NULL ORDER BY id LIMIT 50001", '/blog/'],
        ["SELECT id FROM employer_jobs WHERE status='published' AND trashed_at IS NULL ORDER BY id LIMIT 50001", '/jobs/employer/'],
        ["SELECT slug FROM pages WHERE status='published' AND trashed_at IS NULL ORDER BY id LIMIT 50001", '/page/'],
    ] as $source) {
        foreach ($seoPdo->query($source[0])->fetchAll(PDO::FETCH_COLUMN) as $identifier) {
            $seoPaths[] = $source[1] . rawurlencode((string)$identifier) . ($source[2] ?? '');
            if (count($seoPaths) > 50000) throw new RuntimeException('Sitemap index required above 50000 URLs');
        }
    }
    header('Content-Type: application/xml; charset=utf-8');
    header('Cache-Control: public, max-age=300');
    if ($seoMethod !== 'HEAD') {
        echo '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        foreach (array_unique($seoPaths) as $seoUrl) echo '<url><loc>' . htmlspecialchars($seoBase . $seoUrl, ENT_XML1 | ENT_QUOTES, 'UTF-8') . '</loc></url>';
        echo '</urlset>';
    }
} catch (Throwable $error) {
    error_log('SEO endpoint unavailable: ' . $error->getMessage());
    http_response_code(503); header('Content-Type: text/plain; charset=utf-8'); header('Cache-Control: no-store');
    if ($seoMethod !== 'HEAD') echo 'Search index temporarily unavailable.';
}
return true;
