import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://127.0.0.1:22861';
const results=[];
const login=await fetch(base+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'super@qa.invalid',password:'Readiness-test-2026!'})});
assert.equal(login.status,200);
const {token}=await login.json();
async function api(path,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-Admin-Token':token},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
async function check(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.message});}}
let jobId,resultId;
await check('create draft job fixture',async()=>{const r=await api('/api/admin/jobs',{title:'QA hidden draft',company:'QA',category:'qa',date:'2026-09-06',applyUrl:'https://example.invalid',sourceUrl:'https://example.invalid',status:'draft'});assert.equal(r.status,201);jobId=r.data.id;});
await check('draft job excluded from public list and detail',async()=>{assert.ok(jobId);assert.equal((await api('/api/jobs/'+jobId)).status,404);assert.ok(!(await api('/api/jobs')).data.some(r=>r.id===jobId));});
await check('create published result fixture',async()=>{const r=await api('/api/admin/results',{title:'QA distinct result',org:'QA result organization',type:'qa',date:'2026-09-06',details:'QA result details',inquiryUrl:'https://example.invalid',status:'published'});assert.equal(r.status,201);resultId=r.data.id;});
await check('result detail uses results contract not jobs ID',async()=>{assert.ok(resultId);const r=await api('/api/jobs/'+resultId+'?isResult=true');assert.equal(r.status,200);assert.equal(r.data.isResult,true);assert.equal(r.data.company,'QA result organization');assert.equal(r.data.description,'QA result details');});
await check('missing result returns 404',async()=>assert.equal((await api('/api/jobs/999999999?isResult=true')).status,404));
await check('sitemap is XML and excludes private/draft content',async()=>{const r=await fetch(base+'/sitemap.xml');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/application\/xml/);const xml=await r.text();assert.match(xml,/<urlset xmlns="http:\/\/www.sitemaps.org/);assert.ok(xml.includes(`${base}/jobs/post/${resultId}?isResult=true`));assert.ok(!xml.includes(`<loc>${base}/jobs/post/${jobId}</loc>`));assert.ok(!xml.includes('/admin'));});
await check('robots uses configured canonical sitemap',async()=>{const r=await fetch(base+'/robots.txt');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/plain/);assert.ok((await r.text()).includes(`Sitemap: ${base}/sitemap.xml`));});
await check('sitemap HEAD returns headers without body',async()=>{const r=await fetch(base+'/sitemap.xml',{method:'HEAD'});assert.equal(r.status,200);assert.equal(await r.text(),'');});
await check('sitemap rejects writes',async()=>assert.equal((await fetch(base+'/sitemap.xml',{method:'POST'})).status,405));
await check('unknown page returns real 404 with noindex',async()=>{const r=await fetch(base+'/qa-missing-page-20260906');assert.equal(r.status,404);assert.match(r.headers.get('x-robots-tag'),/noindex/);});
await check('known admin page is routable but noindex',async()=>{const r=await fetch(base+'/admin/support/999999');assert.equal(r.status,200);assert.match(r.headers.get('x-robots-tag'),/noindex/);});
await check('PHP frontend advertises polling, not unsupported sockets',async()=>{const r=await fetch(base+'/');assert.equal(r.status,200);assert.ok((await r.text()).includes('name="alwdaif-realtime" content="poll"'));});
await fetch(base+'/api/admin/logout',{method:'POST',headers:{'X-Admin-Token':token}});
fs.writeFileSync('docs/readiness/php-content-seo-results.json',JSON.stringify({at:new Date().toISOString(),base,results},null,2));
console.log(results);process.exitCode=results.some(r=>r.status==='FAIL')?1:0;
