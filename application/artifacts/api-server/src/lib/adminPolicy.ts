type AdminIdentity = {role: string; permissions?: unknown};
const modules: Record<string,string> = {
 jobs:'jobs','employer-jobs':'jobs',organizations:'jobs','organization-types':'jobs',categories:'jobs',results:'jobs','job-reports':'jobs','employer-job-reports':'jobs',
 blog:'blog','blog-categories':'blog',community:'community',support:'support',
 'service-orders':'store',services:'store','job-applications':'store','job-credits':'store','member-credits':'store','credit-adjustments':'store',
 media:'settings',ads:'settings',announcements:'settings',faq:'settings',pages:'settings',seo:'settings','homepage-settings':'settings','weekly-summary':'settings',notifications:'dashboard',stats:'dashboard',analytics:'dashboard',
};
export function adminAllowed(admin: AdminIdentity, route: string, method: string, body?: unknown): boolean {
 if(admin.role==='super') return true;
 if(['me','check-auth','logout','profile','change-password'].includes(route)) return true;
 const resource=route.split('/')[0];
 if(['admins','permissions','settings','site-settings'].includes(resource)) return false;
 let permissions=admin.permissions;
 if(typeof permissions==='string'){try{permissions=JSON.parse(permissions);}catch{return false;}}
 if(!permissions||typeof permissions!=='object'||Array.isArray(permissions)) return false;
 const permissionMap=permissions as Record<string,unknown>;
 const has=(module:string,action:string)=>{
  const value=permissionMap[module];
  return !!value&&typeof value==='object'&&!Array.isArray(value)&&(value as Record<string,unknown>)[action]===true;
 };
 if(route==='upload'&&method==='POST') return ['jobs','blog','settings','store','support','community'].some(m=>has(m,'create')||has(m,'edit'));
 const module=route.startsWith('community/members')?'members':modules[resource];
 const action=({GET:'view',HEAD:'view',POST:module==='support'?'edit':'create',PUT:'edit',PATCH:'edit',DELETE:'delete'} as Record<string,string>)[method];
 if(!module||!action||!has(module,action))return false;
 if(module==='blog'&&action!=='view'&&body&&typeof body==='object'&&(body as Record<string,unknown>).status==='published'&&!has('blog','publish'))return false;
 return true;
}
