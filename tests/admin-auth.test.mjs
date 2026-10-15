import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../application/package.json', import.meta.url));
const ts = require('typescript');
const source = process.env.READINESS_BASELINE === '1'
  ? execFileSync('git',['show','HEAD:application/artifacts/alwdaif/src/lib/adminAuth.ts'],{encoding:'utf8'})
  : fs.readFileSync(new URL('../application/artifacts/alwdaif/src/lib/adminAuth.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const auth = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const calls = [];
globalThis.localStorage = {getItem:()=> 'synthetic-test-token'};
globalThis.window = {location:{href:'https://app.example/admin',origin:'https://app.example'},fetch:async (input, init)=>{calls.push({input,init}); return new Response('{}');}};
globalThis.fetch = window.fetch;
auth.setupAdminFetchInterceptor();

for (const [url, allowed] of [
  ['/api/admin/jobs',true],
  ['https://app.example/api/admin/jobs',true],
  ['https://untrusted.example/api/admin/jobs',false],
  ['//untrusted.example/api/admin/jobs',false],
  ['/public?next=/api/admin/jobs',false],
  ['/api/adminish/jobs',false],
]) test(`interceptor token boundary: ${url}`,async()=>{
  await window.fetch(url);
  assert.equal(new Headers(calls.at(-1).init?.headers).has('x-admin-token'),allowed);
});
test('interceptor preserves Request headers',async()=>{
  await window.fetch(new Request('https://app.example/api/admin/jobs',{headers:{'Content-Type':'application/json','X-Trace':'fixture'}}));
  assert.equal(new Headers(calls.at(-1).init.headers).get('X-Trace'),'fixture');
});
test('adminFetch preserves Headers instance and adds local token',async()=>{
  await auth.adminFetch('/api/admin/jobs',{headers:new Headers({'Content-Type':'application/json'})});
  const headers=new Headers(calls.at(-1).init.headers);
  assert.equal(headers.get('Content-Type'),'application/json');
  assert.equal(headers.get('x-admin-token'),'synthetic-test-token');
});
test('adminFetch never attaches stored token to another origin',async()=>{
  await auth.adminFetch('https://untrusted.example/api/admin/jobs');
  assert.equal(new Headers(calls.at(-1).init.headers).has('x-admin-token'),false);
});
