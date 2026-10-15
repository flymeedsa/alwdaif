<?php
declare(strict_types=1);
require __DIR__ . '/../cloudways/public_html/public-content-queries.php';
// In-memory SQL fixtures only. No application config or real DB connection.
$pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec('CREATE TABLE blog_posts (id INTEGER PRIMARY KEY, status TEXT, trashed_at INTEGER)');
$pdo->exec("INSERT INTO blog_posts VALUES (1,'published',NULL),(2,'draft',NULL),(3,'published',123)");
$pdo->exec('CREATE TABLE employer_jobs (id INTEGER PRIMARY KEY, status TEXT, created_at INTEGER, trashed_at INTEGER)');
$pdo->exec("INSERT INTO employer_jobs VALUES (1,'published',1,NULL),(2,'pending',2,NULL),(3,'draft',3,NULL),(4,'trash',4,NULL),(5,'rejected',5,NULL),(6,'published',6,NULL),(7,'published',7,123)");
$cases = [
    'published blog visible' => alwdaifPublicBlogPost($pdo, 1)['id'] === 1,
    'draft blog hidden' => alwdaifPublicBlogPost($pdo, 2) === false,
    'trashed blog hidden' => alwdaifPublicBlogPost($pdo, 3) === false,
    'missing blog not found' => alwdaifPublicBlogPost($pdo, 9999) === false,
    'only published employer jobs, newest first' => array_column(alwdaifPublicEmployerJobs($pdo), 'id') === [6, 1],
];
foreach ($cases as $name => $passed) echo ($passed ? 'PASS ' : 'FAIL ') . $name . PHP_EOL;
exit(in_array(false, $cases, true) ? 1 : 0);
