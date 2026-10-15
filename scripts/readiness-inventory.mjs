import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(path.join(root, 'application/package.json'));
const ts = require('typescript');
const relative = file => path.relative(root, file).replaceAll('\\', '/');
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', 'dist', '.git', '.runtime'].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
const routes = [], apis = [], controls = [], phpCandidates = [];
const sourceFiles = [
  ...files(path.join(root, 'application/artifacts/alwdaif/src')),
  ...files(path.join(root, 'application/artifacts/api-server/src')),
];
for (const file of sourceFiles.filter(file => /\.[cm]?[jt]sx?$/.test(file))) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const location = node => ({file:relative(file), line:source.getLineAndCharacterOfPosition(node.getStart()).line + 1});
  const visit = node => {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tag = node.tagName.getText(source);
      const attributes = Object.fromEntries(node.attributes.properties.filter(ts.isJsxAttribute).map(a => [a.name.getText(source), a.initializer?.getText(source) ?? 'true']));
      if (tag === 'Route') routes.push({...location(node), path:attributes.path?.replace(/^"|"$/g, '') ?? '*', component:attributes.component ?? 'inline', declaration:node.getText(source), status:'NOT_TESTED'});
      if (/^(form|input|textarea|select|button|a|Button|Input|Textarea|Select|Link|Switch|Checkbox|Dialog|AlertDialog|DropdownMenuItem)$/.test(tag)) controls.push({...location(node), tag, attributes, status:'NOT_TESTED'});
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text;
      if (['get','post','put','patch','delete','use','all'].includes(method) && /^(app|router)$/.test(node.expression.expression.getText(source))) {
        apis.push({...location(node), method:method.toUpperCase(), path:node.arguments[0]?.getText(source), status:'NOT_TESTED'});
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}
for (const file of files(path.join(root, 'cloudways/public_html')).filter(file => file.endsWith('.php'))) {
  fs.readFileSync(file,'utf8').split(/\r?\n/).forEach((line,index) => {
    if (/\/api\/|\$route\s*===|\$resource\s*===|preg_match\(/.test(line)) phpCandidates.push({file:relative(file), line:index+1, declaration:line.trim(), status:'NEEDS_ROUTE_EXPANSION'});
  });
}
const schema = fs.readFileSync(path.join(root,'cloudways/migration/mariadb-schema.sql'),'utf8');
const tables = [...schema.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+`([^`]+)`/gi)].map(m => m[1]);
const inventory = {generatedAt:new Date().toISOString(), caveat:'Static inventory, not functional test results. Conditional routes, PHP resource expansion, dynamic actions and router prefixes require manual reconciliation.', counts:{routeDeclarations:routes.length, uniqueRoutePatterns:new Set(routes.map(r=>r.path)).size, controls:controls.length, nodeApiDeclarations:apis.length, phpCandidateLines:phpCandidates.length, tables:tables.length}, routes, apis, controls, phpCandidates, tables};
const out = path.join(root,'docs/readiness');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify(inventory,null,2)+'\n');
console.log(JSON.stringify(inventory.counts,null,2));
