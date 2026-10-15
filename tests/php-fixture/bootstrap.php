<?php
declare(strict_types=1);
$config = require __DIR__ . '/config.php';
if ($config['host'] !== '127.0.0.1' || $config['port'] !== 33317 || $config['database'] !== 'alwdaif_readiness') throw new RuntimeException('Unsafe fixture target');
$pdo = new PDO('mysql:host=127.0.0.1;port=33317;charset=utf8mb4',$config['username'],$config['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$exists = $pdo->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='alwdaif_readiness'")->fetchColumn();
if ($exists) { echo "Fixture database already exists; preserving all records.\n"; exit; }
$pdo->exec('CREATE DATABASE alwdaif_readiness CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
$pdo->exec('USE alwdaif_readiness');
$schema=file_get_contents(__DIR__.'/../../cloudways/migration/mariadb-schema.sql');
$pdo->exec($schema);
$pdo->exec('CREATE TABLE community_auth_tokens (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,token_hash CHAR(64) NOT NULL UNIQUE,member_id BIGINT NOT NULL,expires_at BIGINT NOT NULL,created_at BIGINT NOT NULL)');
$now=(int)(microtime(true)*1000);
$pdo->prepare('INSERT INTO admins (user_id,name,email,username,password,role,permissions,is_active,created_at) VALUES (?,?,?,?,?,?,?,?,?)')->execute(['qa-super','QA Super','super@qa.invalid','qa-super',password_hash('Readiness-test-2026!',PASSWORD_BCRYPT),'super',null,1,$now]);
$pdo->prepare('INSERT INTO admins (user_id,name,email,username,password,role,permissions,is_active,created_at) VALUES (?,?,?,?,?,?,?,?,?)')->execute(['qa-editor','QA Editor','editor@qa.invalid','qa-editor',password_hash('Readiness-test-2026!',PASSWORD_BCRYPT),'editor',json_encode(['jobs'=>['view'=>true,'create'=>true,'edit'=>true,'delete'=>false],'blog'=>['view'=>true,'create'=>true,'edit'=>true,'delete'=>false,'publish'=>false],'support'=>['view'=>true,'edit'=>true]]),1,$now]);
echo "Isolated MariaDB schema and synthetic admin fixtures created.\n";
