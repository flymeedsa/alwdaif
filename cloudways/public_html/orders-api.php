<?php
declare(strict_types=1);
$oPath=parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH)?:'/';
if(!(($oPath==='/api/services')||strpos($oPath,'/api/service-orders')===0||$oPath==='/api/community/my-orders'))return false;
$oMethod=strtoupper($_SERVER['REQUEST_METHOD']??'GET');$oJson=static function(int $s,$v):void{http_response_code($s);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');echo json_encode($v,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);};
$oCamel=static function(array $r):array{$out=[];foreach($r as $k=>$v){$k=preg_replace_callback('/_([a-z])/',static fn($m)=>strtoupper($m[1]),$k)??$k;$out[$k]=$v;}return$out;};
try{$c=require dirname(__DIR__).'/private_html/alwdaif-migration-config.php';$pdo=new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',$c['host'],$c['port'],$c['database']),$c['username'],$c['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
 if($oPath==='/api/services'&&$oMethod==='GET'){$rows=$pdo->query('SELECT * FROM `services` WHERE `is_active`=1 ORDER BY `sort_order`,`id`')->fetchAll();$oJson(200,array_map($oCamel,$rows));return true;}
 $token=trim((string)($_SERVER['HTTP_X_COMMUNITY_TOKEN']??''));$mid=null;if($token!==''){$s=$pdo->prepare('SELECT t.`member_id` FROM `community_auth_tokens` t JOIN `community_members` m ON m.`id`=t.`member_id` WHERE m.`is_banned`=0 AND `token_hash`=? AND `expires_at`>? LIMIT 1');$s->execute([hash('sha256',$token),(int)floor(microtime(true)*1000)]);$v=$s->fetchColumn();if($v!==false)$mid=(int)$v;}
 if(!$mid){$oJson(401,['message'=>'يجب تسجيل الدخول أولاً']);return true;}
 if($oPath==='/api/community/my-orders'&&$oMethod==='GET'){$s=$pdo->prepare('SELECT * FROM `service_orders` WHERE `member_id`=? ORDER BY `created_at` DESC');$s->execute([$mid]);$oJson(200,array_map($oCamel,$s->fetchAll()));return true;}
 if($oPath==='/api/service-orders'&&$oMethod==='POST'){
  $b=json_decode(file_get_contents('php://input')?:'{}',true);
  if(!is_array($b)){$oJson(400,['message'=>'Invalid JSON']);return true;}
  foreach(['serviceSlug','serviceVariant','customerName','customerPhone','customerEmail','receiptUrl','notes'] as $field){
   if(isset($b[$field])&&!is_string($b[$field])){$oJson(400,['message'=>'Invalid field']);return true;}
  }
  $slug=trim($b['serviceSlug']??'');$variantName=trim($b['serviceVariant']??'');$customer=trim($b['customerName']??'');$phone=trim($b['customerPhone']??'');$email=trim($b['customerEmail']??'');
  if($slug===''||$customer===''||!preg_match('/^\+?[0-9 ()-]{7,20}$/',$phone)||($email!==''&&!filter_var($email,FILTER_VALIDATE_EMAIL))){$oJson(400,['message'=>'بيانات الطلب غير صالحة']);return true;}
  $s=$pdo->prepare('SELECT `title`,`price`,`variants` FROM `services` WHERE `slug`=? AND `is_active`=1 LIMIT 1');$s->execute([$slug]);$service=$s->fetch();
  if(!$service){$oJson(404,['message'=>'الخدمة غير متاحة']);return true;}
  $amount=$service['price'];$variants=json_decode($service['variants']??'[]',true);
  if(!empty($service['variants'])&&!is_array($variants)){$oJson(409,['message'=>'إعداد الباقات غير صالح']);return true;}
  if($variants){
   $matches=array_values(array_filter($variants,static fn($v)=>is_array($v)&&($v['name']??null)===$variantName));
   if(count($matches)!==1){$oJson(400,['message'=>'اختر باقة صالحة']);return true;}
   $amount=$matches[0]['price']??null;
  }elseif($variantName!==''){$oJson(400,['message'=>'الباقة غير متاحة']);return true;}
  if(filter_var($amount,FILTER_VALIDATE_INT)===false||(int)$amount<0){$oJson(409,['message'=>'سعر الخدمة غير متاح']);return true;}
  // Amount and product name are resolved server-side; a client cannot set the price.
  $now=(int)floor(microtime(true)*1000);$num='ORD-'.strtoupper(bin2hex(random_bytes(12)));
  $s=$pdo->prepare('INSERT INTO `service_orders` (`member_id`,`order_number`,`service_slug`,`service_name`,`service_variant`,`amount`,`customer_name`,`customer_phone`,`customer_email`,`receipt_url`,`payment_method`,`status`,`notes`,`created_at`,`updated_at`) VALUES (?,?,?,?,?,?,?,?,?,?,"bank_transfer","pending",?,?,?)');
  $s->execute([$mid,$num,$slug,$service['title'],$variantName,(int)$amount,$customer,$phone,$email,trim($b['receiptUrl']??''),trim($b['notes']??''),$now,$now]);
  $id=(int)$pdo->lastInsertId();$s=$pdo->prepare('SELECT * FROM `service_orders` WHERE `id`=?');$s->execute([$id]);$oJson(201,$oCamel($s->fetch()));return true;
 }
 if(preg_match('#^/api/service-orders/([^/]+)$#',$oPath,$m)&&$oMethod==='GET'){$s=$pdo->prepare('SELECT * FROM `service_orders` WHERE `order_number`=? AND `member_id`=?');$s->execute([$m[1],$mid]);$row=$s->fetch();if(!$row){$oJson(404,['message'=>'الطلب غير موجود']);return true;}$oJson(200,$oCamel($row));return true;}
 return false;
}catch(Throwable $e){error_log('Cloudways orders API error: '.$e->getMessage());$oJson(500,['message'=>'تعذر إكمال العملية']);return true;}
