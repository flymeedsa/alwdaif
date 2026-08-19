<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configPath = dirname(__DIR__) . '/private_html/alwdaif-migration-config.php';
if (!is_file($configPath)) {
    http_response_code(503);
    exit(json_encode(['ok' => false, 'error' => 'Migration configuration is unavailable.']));
}
$config = require $configPath;
$providedToken = $_SERVER['HTTP_X_MIGRATION_TOKEN'] ?? ($_GET['token'] ?? '');
if (!is_string($providedToken) || !hash_equals($config['token'], $providedToken)) {
    http_response_code(404);
    exit(json_encode(['ok' => false, 'error' => 'Not found.']));
}

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['host'], $config['port'], $config['database']),
        $config['username'],
        $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
    );
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    $action = $_GET['action'] ?? 'inspect';
    if ($action === 'inspect') {
        exit(json_encode(['ok' => true, 'database' => $config['database'], 'tableCount' => count($tables), 'managed' => in_array('alwdaif_migration_meta', $tables, true)]));
    }
    if ($action === 'reset-partial') {
        if (in_array('alwdaif_migration_meta', $tables, true)) {
            http_response_code(409);
            exit(json_encode(['ok' => false, 'error' => 'Refusing to reset a completed migration.']));
        }
        $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
        foreach ($tables as $table) {
            $pdo->exec('DROP TABLE `' . str_replace('`', '``', (string) $table) . '`');
        }
        $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
        exit(json_encode(['ok' => true, 'droppedPartialTables' => count($tables)]));
    }
    if ($action !== 'install') {
        http_response_code(400);
        exit(json_encode(['ok' => false, 'error' => 'Unsupported action.']));
    }
    if ($tables && !in_array('alwdaif_migration_meta', $tables, true)) {
        http_response_code(409);
        exit(json_encode(['ok' => false, 'error' => 'Database is not empty and was not initialized by this migration.']));
    }

    $schema = file_get_contents(dirname(__DIR__) . '/private_html/mariadb-schema.sql');
    if ($schema === false) {
        throw new RuntimeException('Schema file is unavailable.');
    }
    if (!$tables) {
        foreach (array_filter(array_map('trim', explode(';', $schema))) as $statement) {
            $pdo->exec($statement);
        }
        $pdo->exec('CREATE TABLE `alwdaif_migration_meta` (`key` VARCHAR(191) PRIMARY KEY, `value` LONGTEXT NOT NULL) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    }

    $exportText = file_get_contents(dirname(__DIR__) . '/private_html/d1-export.production.json');
    $export = $exportText === false ? null : json_decode($exportText, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($export) || !isset($export['tables'])) {
        throw new RuntimeException('Production export is invalid.');
    }

    $pdo->beginTransaction();
    $counts = [];
    foreach ($export['tables'] as $table) {
        $name = $table['table'];
        $columns = $table['columns'];
        $rows = $table['rows'];
        if (!$rows) {
            $counts[$name] = 0;
            continue;
        }
        $quotedColumns = implode(', ', array_map(static fn(string $column): string => '`' . str_replace('`', '``', $column) . '`', $columns));
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));
        $updates = implode(', ', array_map(static fn(string $column): string => '`' . str_replace('`', '``', $column) . '`=VALUES(`' . str_replace('`', '``', $column) . '`)', $columns));
        $sql = sprintf('INSERT INTO `%s` (%s) VALUES (%s) ON DUPLICATE KEY UPDATE %s', str_replace('`', '``', $name), $quotedColumns, $placeholders, $updates);
        $statement = $pdo->prepare($sql);
        foreach ($rows as $row) {
            $isList = array_keys($row) === range(0, count($row) - 1);
            $values = $isList ? $row : array_map(static fn(string $column) => $row[$column] ?? null, $columns);
            $statement->execute($values);
        }
        $counts[$name] = (int) $pdo->query('SELECT COUNT(*) FROM `' . str_replace('`', '``', $name) . '`')->fetchColumn();
    }
    $meta = $pdo->prepare('INSERT INTO `alwdaif_migration_meta` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)');
    $meta->execute(['last_import_at', gmdate('c')]);
    $meta->execute(['source_format', (string) ($export['format'] ?? 'unknown')]);
    $pdo->commit();

    exit(json_encode(['ok' => true, 'tablesImported' => count($counts), 'rowCounts' => $counts], JSON_UNESCAPED_UNICODE));
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    exit(json_encode(['ok' => false, 'error' => $error->getMessage()], JSON_UNESCAPED_UNICODE));
}
