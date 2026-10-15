<?php

declare(strict_types=1);

/** Public queries must never expose unpublished content, even by known ID. */
function alwdaifPublicBlogPost(PDO $pdo, int $id): array|false
{
    $statement = $pdo->prepare("SELECT * FROM `blog_posts` WHERE `id` = ? AND `trashed_at` IS NULL AND `status` = 'published' LIMIT 1");
    $statement->execute([$id]);
    return $statement->fetch(PDO::FETCH_ASSOC);
}

function alwdaifPublicEmployerJobs(PDO $pdo): array
{
    return $pdo->query("SELECT * FROM `employer_jobs` WHERE `status` = 'published' AND `trashed_at` IS NULL ORDER BY `created_at` DESC, `id` DESC")->fetchAll(PDO::FETCH_ASSOC);
}
