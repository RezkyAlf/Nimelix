function matchesAncestor(rule:string,resource:URL,page:URL){
 if(rule==="'self'")return page.origin===resource.origin;
 if(rule==='*')return true;
 if(/^[a-z]+:$/.test(rule))return rule===page.protocol;
 if(rule.startsWith("'"))return false;
 try{
  const allowed=new URL(rule.includes('://')?rule:`${resource.protocol}//${rule}`);
  const host=allowed.hostname.startsWith('*.')?page.hostname.endsWith(allowed.hostname.slice(1)):allowed.hostname===page.hostname;
  return host&&allowed.protocol===page.protocol&&allowed.port===page.port;
 }catch{return false}
}
export function permitsFrame(headers:Headers,resourceUrl:string,pageOrigin:string){
 const resource=new URL(resourceUrl),page=new URL(pageOrigin);
 const policies=(headers.get('content-security-policy')||'').split(',');
 let hasAncestors=false;
 for(const policy of policies){
  const directive=policy.split(';').map(s=>s.trim()).find(s=>/^frame-ancestors(?:\s|$)/i.test(s));
  if(!directive)continue;
  hasAncestors=true;
  if(!directive.split(/\s+/).slice(1).some(rule=>matchesAncestor(rule,resource,page)))return false;
 }
 if(hasAncestors)return true;
 const xfo=(headers.get('x-frame-options')||'').toLowerCase().trim();
 if(xfo==='deny')return false;
 if(xfo==='sameorigin')return resource.origin===page.origin;
 return true;
}
export async function inspectFrame(url:string,pageOrigin:string,request:typeof fetch=fetch){
 try{
  // Only called with URLs validated against the stream allowlist. Never follow arbitrary redirects.
  const response=await request(url,{redirect:'manual',signal:AbortSignal.timeout(7000),cache:'no-store'});
  await response.body?.cancel().catch(()=>{});
  if([404,410].includes(response.status))return 'missing' as const;
  if(!response.ok)return 'unknown' as const;
  return permitsFrame(response.headers,url,pageOrigin)?'allowed' as const:'blocked' as const;
 }catch{return 'unknown' as const}
}
