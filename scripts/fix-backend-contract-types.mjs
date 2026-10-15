import fs from 'node:fs';
import path from 'node:path';
const file=path.resolve(import.meta.dirname,'../application/artifacts/api-server/src/routes/routes.ts');
let source=fs.readFileSync(file,'utf8');
// Zod 4 exposes validation details as issues, not the removed errors alias.
source=source.replaceAll('parsed.error.errors','parsed.error.issues');
// These static Express routes contain named scalar segments, never wildcards.
// Express 5's broad ParamsDictionary also includes wildcard string arrays.
source=source.replace(/app\.(get|post|put|patch|delete)\("([^"\n]*:[^"\n]*)",/g,(whole,method,route)=>{
  if(route.includes('*')||route.includes('?')||route.includes('{')) return whole;
  const names=[...route.matchAll(/:([A-Za-z_][A-Za-z_0-9]*)/g)].map(m=>m[1]);
  return `app.${method}<{ ${names.map(name=>`${name}: string`).join('; ')} }>("${route}",`;
});
fs.writeFileSync(file,source);
