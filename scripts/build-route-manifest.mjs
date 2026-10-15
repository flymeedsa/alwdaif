import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'..');
const require=createRequire(path.join(root,'application/package.json'));
const ts=require('typescript');
const source=ts.createSourceFile('App.tsx',fs.readFileSync(path.join(root,'application/artifacts/alwdaif/src/App.tsx'),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const routes=new Set();
function visit(node){
 if ((ts.isJsxSelfClosingElement(node)||ts.isJsxOpeningElement(node))&&node.tagName.getText(source)==='Route'){
  const attr=node.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.getText(source)==='path');
  if(attr?.initializer&&ts.isStringLiteral(attr.initializer)) routes.add(attr.initializer.text);
 }
 ts.forEachChild(node,visit);
}
visit(source);
const output=JSON.stringify([...routes].sort(),null,2)+'\n';
const file=path.join(root,'cloudways/public_html/frontend-routes.json');
if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==output)throw new Error('Frontend route manifest stale; run node scripts/build-route-manifest.mjs');}
else fs.writeFileSync(file,output);
console.log(`${routes.size} route patterns synchronized (not functional coverage).`);
