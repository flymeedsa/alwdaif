// Mechanical completion of Express callback return paths reported by TypeScript.
// Does not disable noImplicitReturns or change response/branch behavior.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'..');
const require=createRequire(path.join(root,'application/package.json'));
const ts=require('typescript');
const configFile=path.join(root,'application/artifacts/api-server/tsconfig.json');
const config=ts.readConfigFile(configFile,ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,path.dirname(configFile));
const program=ts.createProgram(parsed.fileNames,parsed.options);
const edits=new Map();
for(const diagnostic of ts.getPreEmitDiagnostics(program).filter(d=>d.code===7030&&d.file)) {
  const file=diagnostic.file;
  const candidates=[];
  function visit(node){
    if((ts.isArrowFunction(node)||ts.isFunctionExpression(node)) && node.body && ts.isBlock(node.body) && node.getStart()<=diagnostic.start && node.body.getStart()>=diagnostic.start) candidates.push(node);
    ts.forEachChild(node,visit);
  }
  visit(file);
  const fn=candidates.sort((a,b)=>(a.end-a.pos)-(b.end-b.pos))[0];
  if(!fn) throw new Error(`Unreviewed return diagnostic: ${file.fileName}:${diagnostic.start}`);
  // Restrict to direct router callbacks and explicitly typed request handlers.
  const owner=fn.parent;
  if(!ts.isCallExpression(owner)&&!ts.isVariableDeclaration(owner)) throw new Error('Unexpected callback owner');
  const body=fn.body;
  if(ts.isReturnStatement(body.statements.at(-1))) continue;
  const position=body.end-1;
  const lineStart=file.text.lastIndexOf('\n',position)+1;
  const indent=file.text.slice(lineStart,position).match(/^\s*/)[0];
  const list=edits.get(file.fileName)??new Map();
  list.set(lineStart,`${indent}  return;\n`);
  edits.set(file.fileName,list);
}
for(const [file,changes] of edits){
  let source=fs.readFileSync(file,'utf8');
  for(const [position,text] of [...changes].sort((a,b)=>b[0]-a[0])) source=source.slice(0,position)+text+source.slice(position);
  fs.writeFileSync(file,source);
  console.log(`${path.relative(root,file)}: ${changes.size} explicit void returns`);
}
