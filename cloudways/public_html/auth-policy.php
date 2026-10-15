<?php
declare(strict_types=1);

function alwdaifAdminRevocationPath(array $config, string $token): string
{
    $directory = $config['auth_state_dir'] ?? dirname(__DIR__) . '/private_html/auth-state';
    return $directory . '/' . hash_hmac('sha256', $token, $config['token']) . '.revoked';
}

function alwdaifRevokeAdminToken(array $config, string $header): void
{
    $token = preg_replace('/^Bearer\s+/i', '', trim($header));
    if (!$token) return;
    $file = alwdaifAdminRevocationPath($config, $token);
    $directory = dirname($file);
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Cannot create auth state directory');
    if (file_put_contents($file, (string) time(), LOCK_EX) === false) throw new RuntimeException('Cannot revoke session');
    chmod($file, 0600);
}

function alwdaifAdminIdentity(PDO $pdo, array $config, string $header): ?array
{
    $token = preg_replace('/^Bearer\s+/i', '', trim($header));
    if (!$token || substr_count($token, '.') !== 1) return null;
    if (is_file(alwdaifAdminRevocationPath($config, $token))) return null;
    [$encoded, $signature] = explode('.', $token, 2);
    $decode = static fn(string $s) => base64_decode(strtr($s, '-_', '+/'), true);
    $provided = $decode($signature);
    if ($provided === false || !hash_equals(hash_hmac('sha256', $encoded, $config['token'], true), $provided)) return null;
    $payload = json_decode($decode($encoded) ?: '', true);
    if (!is_array($payload) || !array_key_exists('adminId', $payload) || !isset($payload['expires']) || !is_numeric($payload['expires']) || (int) $payload['expires'] <= time()) return null;
    // Existing bootstrap-super tokens use an explicit null ID.
    if ($payload['adminId'] === null) return ['id' => null, 'role' => 'super', 'permissions' => null];
    if (!is_int($payload['adminId']) || $payload['adminId'] < 1) return null;
    $statement = $pdo->prepare('SELECT `id`, `role`, `permissions` FROM `admins` WHERE `id` = ? AND `is_active` = 1 LIMIT 1');
    $statement->execute([$payload['adminId']]);
    return $statement->fetch(PDO::FETCH_ASSOC) ?: null;
}

function alwdaifMemberIdentity(PDO $pdo, string $token): ?int
{
    if ($token === '') return null;
    $statement = $pdo->prepare('SELECT m.`id` FROM `community_auth_tokens` t JOIN `community_members` m ON m.`id` = t.`member_id` WHERE t.`token_hash` = ? AND t.`expires_at` > ? AND m.`is_banned` = 0 LIMIT 1');
    $statement->execute([hash('sha256', $token), (int) floor(microtime(true) * 1000)]);
    $id = $statement->fetchColumn();
    return $id === false ? null : (int) $id;
}

function alwdaifAdminMayUpload(array $admin): bool
{
    if (($admin['role'] ?? '') === 'super') return true;
    $permissions = $admin['permissions'] ?? null;
    if (is_string($permissions)) $permissions = json_decode($permissions, true);
    if (!is_array($permissions)) return false;
    foreach (['jobs','blog','settings','store','support','community'] as $module) {
        if (($permissions[$module]['create'] ?? false) === true || ($permissions[$module]['edit'] ?? false) === true) return true;
    }
    return false;
}

function alwdaifAdminAllowed(array $admin, string $route, string $method, array $body = []): bool
{
    if (($admin['role'] ?? '') === 'super') return true;
    if ($route === 'upload' && $method === 'POST') return alwdaifAdminMayUpload($admin);
    if (in_array($route, ['me', 'check-auth', 'logout', 'profile', 'change-password'], true)) return true;
    $resource = explode('/', trim($route, '/'))[0];
    // Staff cannot grant themselves privileges or read/edit credential settings.
    if (in_array($resource, ['admins', 'permissions', 'settings', 'site-settings'], true)) return false;
    $modules = [
        'jobs'=>'jobs','employer-jobs'=>'jobs','organizations'=>'jobs','organization-types'=>'jobs',
        'categories'=>'jobs','results'=>'jobs','job-reports'=>'jobs','employer-job-reports'=>'jobs',
        'blog'=>'blog','blog-categories'=>'blog','community'=>'community','support'=>'support',
        'service-orders'=>'store','services'=>'store','job-applications'=>'store',
        'job-credits'=>'store','member-credits'=>'store','credit-adjustments'=>'store',
        'media'=>'settings','upload'=>'settings','ads'=>'settings','announcements'=>'settings',
        'faq'=>'settings','pages'=>'settings','seo'=>'settings','homepage-settings'=>'settings',
        'weekly-summary'=>'settings','notifications'=>'dashboard','stats'=>'dashboard','analytics'=>'dashboard',
    ];
    $module = $modules[$resource] ?? null;
    if (str_starts_with($route, 'community/members')) $module = 'members';
    if (!$module) return false;
    $permissions = $admin['permissions'] ?? null;
    if (is_string($permissions)) $permissions = json_decode($permissions, true);
    if (!is_array($permissions)) return false;
    $action = match ($method) {'GET','HEAD'=>'view','POST'=>'create','PUT','PATCH'=>'edit','DELETE'=>'delete',default=>null};
    if ($module === 'support' && $method === 'POST') $action = 'edit';
    if (!$action || ($permissions[$module][$action] ?? false) !== true) return false;
    if ($module === 'blog' && !in_array($method, ['GET','HEAD'], true) && (($body['status'] ?? '') === 'published') && ($permissions['blog']['publish'] ?? false) !== true) return false;
    return true;
}
