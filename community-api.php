<?php
declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$prefix = strpos($path, '/api/_cloudways/community') === 0 ? '/api/_cloudways/community' : '/api/community';
if (strpos($path, $prefix) !== 0) return false;
$route = substr($path, strlen($prefix)) ?: '/';
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$json = static function (int $status, $payload): void {
    http_response_code($status); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
};
$camel = static function (array $row): array {
    unset($row['password'], $row['email'], $row['phone']); $out = [];
    foreach ($row as $key => $value) {
        $name = preg_replace_callback('/_([a-z])/', static fn(array $m): string => strtoupper($m[1]), (string) $key) ?? $key;
        if (is_string($value) && preg_match('/^-?[0-9]+$/', $value)) $value = (int) $value;
        $out[$name] = $value;
    }
    return $out;
};
try {
    $config = require dirname(__DIR__) . '/private_html/alwdaif-migration-config.php';
    $pdo = new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['host'], $config['port'], $config['database']), $config['username'], $config['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $memberId = null; $token = trim((string) ($_SERVER['HTTP_X_COMMUNITY_TOKEN'] ?? ''));
    if ($token !== '') { $s=$pdo->prepare('SELECT `member_id` FROM `community_auth_tokens` WHERE `token_hash`=? AND `expires_at`>? LIMIT 1'); $s->execute([hash('sha256',$token),(int)floor(microtime(true)*1000)]); $v=$s->fetchColumn(); if($v!==false)$memberId=(int)$v; }
    $auth = static function () use (&$memberId,$json): int { if(!$memberId){$json(401,['message'=>'يجب تسجيل الدخول أولاً']);exit;} return $memberId; };

    if ($route==='/categories' && $method==='GET') { $rows=$pdo->query('SELECT * FROM `community_categories` WHERE `is_active`=1 ORDER BY `sort_order`,`id`')->fetchAll(); $json(200,array_map($camel,$rows)); return true; }
    if ($route==='/ranks' && $method==='GET') { $rows=$pdo->query('SELECT * FROM `member_ranks` WHERE `is_active`=1 ORDER BY `sort_order`,`id`')->fetchAll(); $json(200,array_map($camel,$rows)); return true; }
    if ($route==='/posts' && $method==='GET') {
        $cid=isset($_GET['categoryId'])?(int)$_GET['categoryId']:0; $sql='SELECT p.*,m.`username`,m.`display_name`,m.`avatar`,m.`role`,c.`name` category_name,c.`slug` category_slug FROM `community_posts` p JOIN `community_members` m ON m.`id`=p.`member_id` LEFT JOIN `community_categories` c ON c.`id`=p.`category_id` WHERE p.`status`="published"'; $args=[];
        if($cid>0){$sql.=' AND p.`category_id`=?';$args[]=$cid;} $sql.=' ORDER BY p.`is_pinned` DESC,p.`created_at` DESC LIMIT 200'; $s=$pdo->prepare($sql);$s->execute($args);$json(200,array_map($camel,$s->fetchAll()));return true;
    }
    if (preg_match('#^/posts/(\d+)$#',$route,$m) && $method==='GET') { $s=$pdo->prepare('SELECT p.*,m.`username`,m.`display_name`,m.`avatar`,m.`role`,c.`name` category_name,c.`slug` category_slug FROM `community_posts` p JOIN `community_members` m ON m.`id`=p.`member_id` LEFT JOIN `community_categories` c ON c.`id`=p.`category_id` WHERE p.`id`=? AND p.`status`="published" LIMIT 1');$s->execute([(int)$m[1]]);$row=$s->fetch();if(!$row){$json(404,['message'=>'الموضوع غير موجود']);return true;}$pdo->prepare('UPDATE `community_posts` SET `views_count`=`views_count`+1 WHERE `id`=?')->execute([(int)$m[1]]);$row['views_count']=(int)$row['views_count']+1;$json(200,$camel($row));return true; }
    if (preg_match('#^/posts/(\d+)/comments$#',$route,$m) && $method==='GET') { $s=$pdo->prepare('SELECT c.*,m.`username`,m.`display_name`,m.`avatar`,m.`role` FROM `community_comments` c JOIN `community_members` m ON m.`id`=c.`member_id` WHERE c.`post_id`=? AND c.`status`="published" ORDER BY c.`created_at`,c.`id`');$s->execute([(int)$m[1]]);$json(200,array_map($camel,$s->fetchAll()));return true; }
    if ($route==='/stats' && $method==='GET') { $out=[];foreach(['posts'=>'community_posts WHERE `status`="published"','comments'=>'community_comments WHERE `status`="published"','members'=>'community_members','categories'=>'community_categories WHERE `is_active`=1'] as $k=>$t)$out[$k.'Count']=(int)$pdo->query('SELECT COUNT(*) FROM '.$t)->fetchColumn();$json(200,$out);return true; }
    if (preg_match('#^/member/(\d+)$#',$route,$m) && $method==='GET') { $s=$pdo->prepare('SELECT * FROM `community_members` WHERE `id`=? LIMIT 1');$s->execute([(int)$m[1]]);$row=$s->fetch();if(!$row){$json(404,['message'=>'العضو غير موجود']);return true;}$json(200,$camel($row));return true; }
    if ($route==='/posts' && $method==='POST') {
        $mid=$auth();$body=json_decode(file_get_contents('php://input')?:'{}',true);$title=trim((string)($body['title']??''));$content=trim((string)($body['content']??''));$cid=(int)($body['categoryId']??0);
        if(mb_strlen($title,'UTF-8')<3||mb_strlen($content,'UTF-8')<3||$cid<1){$json(400,['message'=>'بيانات الموضوع غير صالحة']);return true;}
        $s=$pdo->prepare('SELECT 1 FROM `community_categories` WHERE `id`=? AND `is_active`=1');$s->execute([$cid]);if(!$s->fetchColumn()){$json(400,['message'=>'التصنيف غير صالح']);return true;}
        $now=(int)floor(microtime(true)*1000);$pdo->beginTransaction();
        try{$s=$pdo->prepare('INSERT INTO `community_posts` (`title`,`content`,`member_id`,`category_id`,`likes_count`,`comments_count`,`views_count`,`is_pinned`,`is_featured`,`is_locked`,`status`,`created_at`,`updated_at`) VALUES (?,?,?,?,0,0,0,0,0,0,"published",?,?)');$s->execute([$title,$content,$mid,$cid,$now,$now]);$id=(int)$pdo->lastInsertId();$pdo->prepare('UPDATE `community_categories` SET `posts_count`=`posts_count`+1 WHERE `id`=?')->execute([$cid]);$pdo->prepare('UPDATE `community_members` SET `posts_count`=`posts_count`+1 WHERE `id`=?')->execute([$mid]);$pdo->commit();}catch(Throwable $e){$pdo->rollBack();throw $e;}
        $s=$pdo->prepare('SELECT * FROM `community_posts` WHERE `id`=?');$s->execute([$id]);$json(201,$camel($s->fetch()));return true;
    }
    if (preg_match('#^/posts/(\d+)$#',$route,$m) && $method==='PUT') {
        $mid=$auth();$id=(int)$m[1];$body=json_decode(file_get_contents('php://input')?:'{}',true);$title=trim((string)($body['title']??''));$content=trim((string)($body['content']??''));
        if(mb_strlen($title,'UTF-8')<3||mb_strlen($content,'UTF-8')<3){$json(400,['message'=>'بيانات الموضوع غير صالحة']);return true;}
        $s=$pdo->prepare('UPDATE `community_posts` SET `title`=?,`content`=?,`updated_at`=? WHERE `id`=? AND `member_id`=? AND `status`="published"');$s->execute([$title,$content,(int)floor(microtime(true)*1000),$id,$mid]);if(!$s->rowCount()){$json(404,['message'=>'الموضوع غير موجود أو لا تملك صلاحيته']);return true;}$json(200,['success'=>true]);return true;
    }
    if (preg_match('#^/posts/(\d+)$#',$route,$m) && $method==='DELETE') {
        $mid=$auth();$id=(int)$m[1];$s=$pdo->prepare('SELECT `category_id` FROM `community_posts` WHERE `id`=? AND `member_id`=?');$s->execute([$id,$mid]);$cid=$s->fetchColumn();if($cid===false){$json(404,['message'=>'الموضوع غير موجود أو لا تملك صلاحيته']);return true;}
        $pdo->beginTransaction();try{$pdo->prepare('DELETE FROM `community_likes` WHERE `post_id`=? OR `comment_id` IN (SELECT `id` FROM `community_comments` WHERE `post_id`=?)')->execute([$id,$id]);$pdo->prepare('DELETE FROM `community_comments` WHERE `post_id`=?')->execute([$id]);$pdo->prepare('DELETE FROM `community_posts` WHERE `id`=?')->execute([$id]);$pdo->prepare('UPDATE `community_categories` SET `posts_count`=GREATEST(`posts_count`-1,0) WHERE `id`=?')->execute([(int)$cid]);$pdo->prepare('UPDATE `community_members` SET `posts_count`=GREATEST(`posts_count`-1,0) WHERE `id`=?')->execute([$mid]);$pdo->commit();}catch(Throwable $e){$pdo->rollBack();throw $e;}$json(200,['success'=>true]);return true;
    }
    if (preg_match('#^/posts/(\d+)/comments$#',$route,$m) && $method==='POST') {
        $mid=$auth();$pid=(int)$m[1];$body=json_decode(file_get_contents('php://input')?:'{}',true);$content=trim((string)($body['content']??''));$parent=isset($body['parentId'])?(int)$body['parentId']:null;if(mb_strlen($content,'UTF-8')<2){$json(400,['message'=>'التعليق قصير جداً']);return true;}
        $s=$pdo->prepare('SELECT `is_locked` FROM `community_posts` WHERE `id`=? AND `status`="published"');$s->execute([$pid]);$locked=$s->fetchColumn();if($locked===false||$locked===1||$locked==='1'){$json(400,['message'=>'الموضوع غير متاح للتعليق']);return true;}
        $now=(int)floor(microtime(true)*1000);$pdo->beginTransaction();try{$s=$pdo->prepare('INSERT INTO `community_comments` (`content`,`post_id`,`member_id`,`parent_id`,`likes_count`,`status`,`created_at`,`updated_at`) VALUES (?,?,?,?,0,"published",?,?)');$s->execute([$content,$pid,$mid,$parent,$now,$now]);$id=(int)$pdo->lastInsertId();$pdo->prepare('UPDATE `community_posts` SET `comments_count`=`comments_count`+1 WHERE `id`=?')->execute([$pid]);$pdo->prepare('UPDATE `community_members` SET `comments_count`=`comments_count`+1 WHERE `id`=?')->execute([$mid]);$pdo->commit();}catch(Throwable $e){$pdo->rollBack();throw $e;}$s=$pdo->prepare('SELECT * FROM `community_comments` WHERE `id`=?');$s->execute([$id]);$json(201,$camel($s->fetch()));return true;
    }
    if (preg_match('#^/posts/(\d+)/like$#',$route,$m) && $method==='POST') {
        $mid=$auth();$pid=(int)$m[1];$s=$pdo->prepare('SELECT `id` FROM `community_likes` WHERE `member_id`=? AND `post_id`=? LIMIT 1');$s->execute([$mid,$pid]);$lid=$s->fetchColumn();if($lid!==false){$pdo->prepare('DELETE FROM `community_likes` WHERE `id`=?')->execute([(int)$lid]);$pdo->prepare('UPDATE `community_posts` SET `likes_count`=GREATEST(`likes_count`-1,0) WHERE `id`=?')->execute([$pid]);$liked=false;}else{$pdo->prepare('INSERT INTO `community_likes` (`member_id`,`post_id`,`comment_id`,`created_at`) VALUES (?,?,NULL,?)')->execute([$mid,$pid,(int)floor(microtime(true)*1000)]);$pdo->prepare('UPDATE `community_posts` SET `likes_count`=`likes_count`+1 WHERE `id`=?')->execute([$pid]);$liked=true;}$json(200,['liked'=>$liked]);return true;
    }
    if (preg_match('#^/comments/(\d+)/like$#',$route,$m) && $method==='POST') {
        $mid=$auth();$cid=(int)$m[1];$s=$pdo->prepare('SELECT `id` FROM `community_likes` WHERE `member_id`=? AND `comment_id`=? LIMIT 1');$s->execute([$mid,$cid]);$lid=$s->fetchColumn();if($lid!==false){$pdo->prepare('DELETE FROM `community_likes` WHERE `id`=?')->execute([(int)$lid]);$pdo->prepare('UPDATE `community_comments` SET `likes_count`=GREATEST(`likes_count`-1,0) WHERE `id`=?')->execute([$cid]);$liked=false;}else{$pdo->prepare('INSERT INTO `community_likes` (`member_id`,`post_id`,`comment_id`,`created_at`) VALUES (?,NULL,?,?)')->execute([$mid,$cid,(int)floor(microtime(true)*1000)]);$pdo->prepare('UPDATE `community_comments` SET `likes_count`=`likes_count`+1 WHERE `id`=?')->execute([$cid]);$liked=true;}$json(200,['liked'=>$liked]);return true;
    }
    if ($route==='/favorites/ids' && $method==='GET') { $mid=$auth();$s=$pdo->prepare('SELECT `job_id` FROM `job_favorites` WHERE `member_id`=? ORDER BY `created_at` DESC');$s->execute([$mid]);$json(200,array_map('intval',$s->fetchAll(PDO::FETCH_COLUMN)));return true; }
    if ($route==='/favorites' && $method==='GET') { $mid=$auth();$s=$pdo->prepare('SELECT j.*,f.`created_at` favorite_created_at FROM `job_favorites` f JOIN `jobs` j ON j.`id`=f.`job_id` WHERE f.`member_id`=? ORDER BY f.`created_at` DESC');$s->execute([$mid]);$json(200,array_map($camel,$s->fetchAll()));return true; }
    if (preg_match('#^/favorites/(\d+)$#',$route,$m) && in_array($method,['POST','DELETE'],true)) { $mid=$auth();$jid=(int)$m[1];if($method==='POST'){$s=$pdo->prepare('INSERT IGNORE INTO `job_favorites` (`member_id`,`job_id`,`created_at`) VALUES (?,?,?)');$s->execute([$mid,$jid,(int)floor(microtime(true)*1000)]);}else{$s=$pdo->prepare('DELETE FROM `job_favorites` WHERE `member_id`=? AND `job_id`=?');$s->execute([$mid,$jid]);}$json(200,['success'=>true]);return true; }
    if ($route==='/notifications' && $method==='GET') { $mid=$auth();$s=$pdo->prepare('SELECT * FROM `community_notifications` WHERE `member_id`=? ORDER BY `created_at` DESC LIMIT 200');$s->execute([$mid]);$json(200,array_map($camel,$s->fetchAll()));return true; }
    if ($route==='/notifications/unread-count' && $method==='GET') { $mid=$auth();$s=$pdo->prepare('SELECT COUNT(*) FROM `community_notifications` WHERE `member_id`=? AND `is_read`=0');$s->execute([$mid]);$json(200,['count'=>(int)$s->fetchColumn()]);return true; }
    if ($route==='/notifications/read-all' && $method==='PUT') { $mid=$auth();$s=$pdo->prepare('UPDATE `community_notifications` SET `is_read`=1 WHERE `member_id`=?');$s->execute([$mid]);$json(200,['success'=>true]);return true; }
    if (preg_match('#^/notifications/(\d+)/read$#',$route,$m) && $method==='PUT') { $mid=$auth();$s=$pdo->prepare('UPDATE `community_notifications` SET `is_read`=1 WHERE `id`=? AND `member_id`=?');$s->execute([(int)$m[1],$mid]);$json(200,['success'=>true]);return true; }
    if ($route==='/notifications' && $method==='DELETE') { $mid=$auth();$s=$pdo->prepare('DELETE FROM `community_notifications` WHERE `member_id`=?');$s->execute([$mid]);$json(200,['success'=>true]);return true; }
    return false;
} catch (Throwable $error) { error_log('Cloudways community API error: '.$error->getMessage());$json(500,['message'=>'تعذر إكمال العملية']);return true; }
