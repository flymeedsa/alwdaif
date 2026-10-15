<?php
declare(strict_types=1);
require __DIR__ . '/../cloudways/public_html/auth-policy.php';
$pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$pdo->exec('CREATE TABLE admins (id INTEGER PRIMARY KEY, role TEXT, permissions TEXT, is_active INTEGER)');
$pdo->exec("INSERT INTO admins VALUES (1,'editor',NULL,1),(2,'super',NULL,0)");
$pdo->exec('CREATE TABLE community_members (id INTEGER PRIMARY KEY, is_banned INTEGER)');
$pdo->exec('CREATE TABLE community_auth_tokens (token_hash TEXT, member_id INTEGER, expires_at INTEGER)');
$pdo->exec('INSERT INTO community_members VALUES (1,0),(2,1)');
$s=$pdo->prepare('INSERT INTO community_auth_tokens VALUES (?,?,?)');
foreach([['active',1,3600000],['banned',2,3600000],['expired',1,-3600000]] as [$token,$id,$offset]) $s->execute([hash('sha256',$token),$id,(int)(microtime(true)*1000)+$offset]);
$config=['token'=>'local-fixture-key-not-a-real-secret'];
$encode=static fn($s)=>rtrim(strtr(base64_encode($s),'+/','-_'),'=');
$sign=static function($payload)use($encode,$config){$p=$encode(json_encode($payload));return $p.'.'.$encode(hash_hmac('sha256',$p,$config['token'],true));};
$editor=['role'=>'editor','permissions'=>json_encode(['jobs'=>['view'=>true,'edit'=>false], 'blog'=>['create'=>true,'edit'=>true,'publish'=>false], 'support'=>['view'=>true,'edit'=>true]])];
$cases=[
 'valid admin'=>alwdaifAdminIdentity($pdo,$config,$sign(['adminId'=>1,'expires'=>time()+60]))['id']===1,
 'inactive super denied'=>alwdaifAdminIdentity($pdo,$config,$sign(['adminId'=>2,'expires'=>time()+60]))===null,
 'missing admin denied'=>alwdaifAdminIdentity($pdo,$config,$sign(['adminId'=>999,'expires'=>time()+60]))===null,
 'expired admin denied'=>alwdaifAdminIdentity($pdo,$config,$sign(['adminId'=>1,'expires'=>time()-1]))===null,
 'missing subject denied'=>alwdaifAdminIdentity($pdo,$config,$sign(['expires'=>time()+60]))===null,
 'tampered signature denied'=>alwdaifAdminIdentity($pdo,$config,$sign(['adminId'=>1,'expires'=>time()+60]).'x')===null,
 'empty token denied'=>alwdaifAdminIdentity($pdo,$config,'')===null,
 'job view allowed'=>alwdaifAdminAllowed($editor,'jobs','GET'),
 'job edit denied'=>!alwdaifAdminAllowed($editor,'jobs/1','PATCH'),
 'job delete denied'=>!alwdaifAdminAllowed($editor,'jobs/1','DELETE'),
 'blog draft create allowed'=>alwdaifAdminAllowed($editor,'blog','POST',['status'=>'draft']),
 'blog publish denied'=>!alwdaifAdminAllowed($editor,'blog','POST',['status'=>'published']),
 'staff escalation denied'=>!alwdaifAdminAllowed($editor,'admins/1','PATCH',['role'=>'super']),
 'credential read denied'=>!alwdaifAdminAllowed($editor,'site-settings','GET'),
 'unknown resource denied'=>!alwdaifAdminAllowed($editor,'unmapped-sensitive-operation','POST'),
 'no permissions denied'=>!alwdaifAdminAllowed(['role'=>'editor'],'jobs','GET'),
 'support reply allowed'=>alwdaifAdminAllowed($editor,'support/tickets/1/reply','POST'),
 'super allowed'=>alwdaifAdminAllowed(['role'=>'super'],'admins','POST'),
 'active member allowed'=>alwdaifMemberIdentity($pdo,'active')===1,
 'banned member denied'=>alwdaifMemberIdentity($pdo,'banned')===null,
 'expired member denied'=>alwdaifMemberIdentity($pdo,'expired')===null,
 'unknown member token denied'=>alwdaifMemberIdentity($pdo,'unknown')===null,
];
foreach($cases as $name=>$pass) echo ($pass?'PASS ':'FAIL ').$name.PHP_EOL;
exit(in_array(false,$cases,true)?1:0);
