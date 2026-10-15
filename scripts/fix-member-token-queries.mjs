import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
// Mechanical SQL strengthening in all four existing token consumers.
for(const name of ['community-api.php','support-api.php','orders-api.php','runtime-api.php']) {
 const file=path.join(root,'cloudways/public_html',name);
 const source=fs.readFileSync(file,'utf8');
 const old='SELECT `member_id` FROM `community_auth_tokens` WHERE';
 const replacement='SELECT t.`member_id` FROM `community_auth_tokens` t JOIN `community_members` m ON m.`id`=t.`member_id` WHERE m.`is_banned`=0 AND';
 if(!source.includes(old)) throw new Error(`Expected token query not found: ${name}`);
 fs.writeFileSync(file,source.replaceAll(old,replacement));
 console.log(name);
}
