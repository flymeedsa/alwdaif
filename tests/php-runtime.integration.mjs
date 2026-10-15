import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://127.0.0.1:22861'; // Deliberately not configurable: never production.
const results=[];
async function request(method,path,body,token,member=false){
  const headers={};
  if(body!==undefined) headers['Content-Type']='application/json';
  if(token) headers[member?'X-Community-Token':'X-Admin-Token']=token;
  const start=Date.now();
  const response=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  const text=await response.text();
  let data;try{data=JSON.parse(text)}catch{data={notJson:true}}
  return {status:response.status,data,ms:Date.now()-start};
}
async function check(name,fn){try{await fn();results.push({name,status:'PASS'});console.log('PASS',name)}catch(error){results.push({name,status:'FAIL',error:error.message});console.log('FAIL',name,error.message)}}
const suffix=Date.now().toString().slice(-8);
const health=await request('GET','/api/_cloudways/health');
assert.equal(health.data.database,'mariadb');
const login=await request('POST','/api/admin/login',{email:'super@qa.invalid',password:'Readiness-test-2026!'});
assert.equal(login.status,200); assert.ok(login.data.token);
const admin=login.data.token;
const editorLogin=await request('POST','/api/admin/login',{email:'editor@qa.invalid',password:'Readiness-test-2026!'});
assert.equal(editorLogin.status,200); const editor=editorLogin.data.token;
await check('admin and editor login',async()=>assert.ok(editor));
await check('anonymous admin list rejected',async()=>assert.equal((await request('GET','/api/admin/jobs')).status,401));
await check('tampered admin token rejected',async()=>assert.equal((await request('GET','/api/admin/jobs',undefined,admin+'x')).status,401));
await check('editor can read jobs',async()=>assert.equal((await request('GET','/api/admin/jobs',undefined,editor)).status,200));
await check('editor cannot read credential settings',async()=>assert.equal((await request('GET','/api/admin/site-settings',undefined,editor)).status,403));
await check('editor cannot elevate role',async()=>assert.equal((await request('PATCH','/api/admin/admins/2',{role:'super'},editor)).status,403));
await check('editor cannot delete job',async()=>assert.equal((await request('DELETE','/api/admin/jobs/999999',undefined,editor)).status,403));
await check('editor cannot publish blog',async()=>assert.equal((await request('POST','/api/admin/blog',{status:'published'},editor)).status,403));
let blogId;
await check('admin creates draft blog',async()=>{
 const r=await request('POST','/api/admin/blog',{title:'QA draft '+suffix,slug:'qa-'+suffix,date:'2026-09-06',category:'qa',author:'QA',content:'<p>اختبار آمن</p>',status:'draft'},admin);
 assert.equal(r.status,201);blogId=r.data.id;
});
if(blogId){
 await check('public cannot read draft blog by id',async()=>assert.equal((await request('GET',`/api/blog/${blogId}`)).status,404));
 await check('admin publishes blog',async()=>assert.equal((await request('PATCH',`/api/admin/blog/${blogId}`,{status:'published'},admin)).status,200));
  await check('public reads published blog',async()=>assert.equal((await request('GET',`/api/blog/${blogId}`)).status,200));
  await check('editor cannot silently edit published content',async()=>assert.equal((await request('PATCH',`/api/admin/blog/${blogId}`,{title:'must reject'},editor)).status,403));
 await check('QA alias delete remains recoverable',async()=>{assert.equal((await request('DELETE',`/api/_cloudways/admin/blog/${blogId}`,undefined,admin)).status,200);const r=await request('GET',`/api/admin/blog/${blogId}`,undefined,admin);assert.equal(r.status,200);assert.ok(r.data.trashedAt)});
}
await check('update absent job returns 404, not 500',async()=>assert.equal((await request('PATCH','/api/admin/jobs/999999',{title:'QA absent'},admin)).status,404));
await check('invalid calendar expiry is rejected',async()=>assert.equal((await request('POST','/api/admin/jobs',{title:'QA invalid date',company:'QA',date:'2026-09-06',category:'civil',applyUrl:'https://example.invalid',sourceUrl:'https://example.invalid',deadlineDate:'2026-02-31'},admin)).status,400));
let member;
await check('register synthetic member',async()=>{const r=await request('POST','/api/community/register',{username:'qa'+suffix,email:'qa'+suffix+'@example.invalid',displayName:'عضو اختبار',phone:'0500000000',password:'Readiness-test-2026!'});assert.equal(r.status,201);member=r.data.token;assert.ok(member)});
if(member){
 await check('order price and product name are authoritative server data',async()=>{
  const slug='qa-service-'+suffix;
  const service=await request('POST','/api/admin/services',{slug,title:'QA canonical service',price:150,isActive:true},admin);assert.equal(service.status,201);
  const order=await request('POST','/api/service-orders',{serviceSlug:slug,serviceName:'forged',amount:-999,customerName:'QA',customerPhone:'0500000000'},member,true);
  assert.equal(order.status,201);assert.equal(order.data.amount,150);assert.equal(order.data.serviceName,'QA canonical service');
 });
 await check('unknown service cannot create an order',async()=>assert.equal((await request('POST','/api/service-orders',{serviceSlug:'qa-missing-'+suffix,customerName:'QA',customerPhone:'0500000000'},member,true)).status,404));
 await check('unknown service variant cannot create an order',async()=>assert.equal((await request('POST','/api/service-orders',{serviceSlug:'qa-service-'+suffix,serviceVariant:'forged',customerName:'QA',customerPhone:'0500000000'},member,true)).status,400));
 await check('member cannot access admin API',async()=>assert.equal((await request('GET','/api/admin/jobs',undefined,member,true)).status,401));
 let ticket;
 await check('member creates support ticket',async()=>{const r=await request('POST','/api/support/tickets',{subject:'QA '+suffix,type:'inquiry',message:'رسالة اختبار محلية'},member,true);assert.equal(r.status,201);ticket=r.data.id;assert.ok(ticket)});
 if(ticket){
  await check('admin sees ticket conversation contract',async()=>{const r=await request('GET',`/api/admin/support/tickets/${ticket}`,undefined,admin);assert.equal(r.status,200);assert.ok(r.data.ticket);assert.ok(Array.isArray(r.data.replies))});
  await check('editor with support permission replies',async()=>assert.equal((await request('POST',`/api/admin/support/tickets/${ticket}/reply`,{message:'رد اختبار محلي'},editor)).status,201));
  await check('member reads admin reply',async()=>{const r=await request('GET',`/api/support/tickets/${ticket}`,undefined,member,true);assert.equal(r.status,200);assert.ok(r.data.replies.some(x=>x.senderType==='admin'))});
  await check('different member cannot read another ticket (IDOR)',async()=>{const other=await request('POST','/api/community/register',{username:'qb'+suffix,email:'qb'+suffix+'@example.invalid',displayName:'عضو ثان',phone:'0500000000',password:'Readiness-test-2026!'});assert.equal(other.status,201);assert.equal(other.data.member.phone,'0500000000');assert.equal((await request('GET',`/api/support/tickets/${ticket}`,undefined,other.data.token,true)).status,404)});
  await check('close ticket then reject member reply',async()=>{assert.equal((await request('PUT',`/api/admin/support/tickets/${ticket}/status`,{status:'closed'},admin)).status,200);assert.equal((await request('POST',`/api/support/tickets/${ticket}/reply`,{message:'must reject'},member,true)).status,400)});
 }
 await check('banned member loses access across token consumers',async()=>{const me=await request('GET','/api/community/me',undefined,member,true);assert.equal(me.data.member.phone,'0500000000');assert.equal((await request('PATCH',`/api/admin/community/members/${me.data.member.id}`,{isBanned:true},admin)).status,200);for(const path of ['/api/support/tickets','/api/community/favorites','/api/community/my-orders','/api/cv-analysis/history'])assert.equal((await request('GET',path,undefined,member,true)).status,401,path)});
 await check('member logout invalidates token',async()=>{assert.equal((await request('POST','/api/community/logout',{},member,true)).status,200);assert.equal((await request('GET','/api/support/tickets',undefined,member,true)).status,401)});
}
await check('reply to nonexistent ticket returns 404',async()=>assert.equal((await request('POST','/api/admin/support/tickets/999999/reply',{message:'QA must reject'},admin)).status,404));
await check('public employer submission persists pending job',async()=>{const r=await request('POST','/api/employer-jobs',{title:'QA employer '+suffix,company:'QA',description:'Local fixture',contactValue:'qa@example.invalid',submitterName:'QA',submitterEmail:'qa@example.invalid'});assert.equal(r.status,201);assert.ok(r.data.id);const saved=await request('GET',`/api/admin/employer-jobs/${r.data.id}`,undefined,admin);assert.equal(saved.data.status,'pending');const publicRows=await request('GET','/api/employer-jobs');assert.ok(!publicRows.data.some(j=>j.id===r.data.id));});
await check('unauthenticated upload request rejected',async()=>assert.equal((await request('POST','/api/uploads/request-url',{name:'qa.txt'})).status,401));
await check('authorized upload bytes can be downloaded from returned path',async()=>{
 const allocated=await request('POST','/api/uploads/request-url',{name:'qa.txt',size:17,contentType:'text/plain'},admin);assert.equal(allocated.status,200);
 const put=await fetch(base+allocated.data.uploadURL,{method:'PUT',headers:{'X-Admin-Token':admin,'Content-Type':'text/plain'},body:'QA local fixture\n'});assert.equal(put.status,200);const stored=await put.json();assert.match(stored.url,/^\/uploads\//);const download=await fetch(base+stored.url);assert.equal(download.status,200);assert.equal(await download.text(),'QA local fixture\n');
});
await check('disguised executable upload is rejected',async()=>{
 const file=new FormData();file.set('file',new Blob(['<?php echo "unsafe"; ?>'],{type:'image/png'}),'fake.png');const response=await fetch(base+'/api/media/upload',{method:'POST',headers:{'X-Admin-Token':admin},body:file});assert.equal(response.status,400);
});
await check('admin logout invalidates token',async()=>{assert.equal((await request('POST','/api/admin/logout',{},admin)).status,200);assert.equal((await request('GET','/api/admin/jobs',undefined,admin)).status,401)});
fs.mkdirSync('docs/readiness',{recursive:true});
fs.writeFileSync('docs/readiness/php-runtime-results.json',JSON.stringify({at:new Date().toISOString(),base,results},null,2));
console.log({passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length});
process.exitCode=results.some(x=>x.status==='FAIL')?1:0;
