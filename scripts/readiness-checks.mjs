import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'docs/readiness');
fs.mkdirSync(output,{recursive:true});
const results=[];
function run(name,command,args,cwd=root,env={}) {
  const r=spawnSync(command,args,{cwd,encoding:'utf8',env:{...process.env,...env},timeout:180000,shell:process.platform==='win32'&&command==='pnpm'});
  fs.writeFileSync(path.join(output,`${name}.log`),(r.stdout??'')+(r.stderr??'')+(r.error?.message??''));
  const row={name,exitCode:r.status,pass:r.status===0};
  results.push(row); console.log(row);
}
run('admin-auth-regression',process.execPath,['--test','tests/admin-auth.test.mjs']);
run('job-sorting-regression',process.execPath,['--test','tests/job-sorting.test.mjs']);
run('frontend-route-manifest',process.execPath,['scripts/build-route-manifest.mjs','--check']);
run('frontend-typecheck','pnpm',['--filter','@workspace/alwdaif','run','typecheck'],path.join(root,'application'));
run('backend-typecheck','pnpm',['--filter','@workspace/api-server','run','typecheck'],path.join(root,'application'));
run('frontend-build','pnpm',['--filter','@workspace/alwdaif','run','build'],path.join(root,'application'),{PORT:'22860',BASE_PATH:'/'});
for(const file of fs.readdirSync(path.join(root,'cloudways/public_html')).filter(f=>f.endsWith('.php'))) run(`php-${file}`,'php',['-l',`cloudways/public_html/${file}`]);
fs.writeFileSync(path.join(output,'gates.json'),JSON.stringify({at:new Date().toISOString(),results},null,2)+'\n');
