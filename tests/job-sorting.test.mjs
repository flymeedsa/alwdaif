import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../application/package.json',import.meta.url));
const ts=require('typescript');
const source=fs.readFileSync(new URL('../application/artifacts/alwdaif/src/lib/jobSorting.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {sortJobs}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
test('newest sorts ISO, epoch and numeric-string dates without mutating cache',()=>{
  const rows=[{id:1,createdAt:'2026-01-01'},{id:2,createdAt:Date.parse('2026-01-03')},{id:3,createdAt:String(Date.parse('2026-01-02'))}];
  assert.deepEqual(sortJobs(rows,'newest').map(r=>r.id),[2,3,1]);
  assert.deepEqual(rows.map(r=>r.id),[1,2,3]);
});
test('popular sorts views and breaks ties by date',()=>{
  const rows=[{id:1,viewCount:1},{id:2,viewCount:4,createdAt:'2026-01-01'},{id:3,viewCount:4,createdAt:'2026-01-02'}];
  assert.deepEqual(sortJobs(rows,'popular').map(r=>r.id),[3,2,1]);
});
test('empty and invalid dates are safe',()=>{
  assert.deepEqual(sortJobs([],'newest'),[]);
  assert.deepEqual(sortJobs([{id:1,createdAt:'bad'},{id:2,createdAt:null}],'newest').map(r=>r.id),[1,2]);
});
