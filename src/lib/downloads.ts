import {createDecipheriv} from 'node:crypto';
const hosts=new Set(['link.desustream.com','pixeldrain.com','acefile.co','gofile.io','mega.nz','www.mediafire.com','mediafire.com']);
export function safeDownloadUrl(raw:string):URL|null{try{const url=new URL(raw);return url.protocol==='https:'&&hosts.has(url.hostname)&&!url.username&&!url.password&&(!url.port||url.port==='443')?url:null}catch{return null}}
type Requester=typeof fetch;
const videoName=/\.(mp4|mkv|webm|avi|mov)(?:$|[?";])/i;
export async function verifyDownload(raw:string,request:Requester=fetch):Promise<string|null>{
 let url=safeDownloadUrl(raw);if(!url)return null;
 for(let hop=0;hop<5;hop++){
  // Pixeldrain's public file-info API distinguishes an existing video from a landing page.
  const fileId:string|null=url.hostname==='pixeldrain.com'?/^\/u\/([a-zA-Z0-9]+)\/?$/.exec(url.pathname)?.[1]||null:null;
  if(fileId){
   const result=await request(`https://pixeldrain.com/api/file/${fileId}/info`,{signal:AbortSignal.timeout(8000),redirect:'error',cache:'no-store'});
   if(!result.ok)return null;
   const info=await result.json();
   if(info.success===false||typeof info.name!=='string'||!videoName.test(info.name)||!(Number(info.size)>0))return null;
   url=new URL(`https://pixeldrain.com/api/file/${fileId}?download`);continue;
  }
  const response=await request(url.href,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(8000),cache:'no-store'});
  if([301,302,303,307,308].includes(response.status)){
   const location=response.headers.get('location');if(!location)return null;
   url=safeDownloadUrl(new URL(location,url).href);if(!url)return null;continue;
  }
  if(!response.ok)return null;
  const type=response.headers.get('content-type')?.split(';')[0].toLowerCase()||'';
  const disposition=response.headers.get('content-disposition')||'';
  const isVideo=type.startsWith('video/')||(type==='application/octet-stream'&&videoName.test(disposition));
  return isVideo&&Number(response.headers.get('content-length'))>0?url.href:null;
 }
 return null;
}
export async function verifyMegaDownload(raw:string,request:Requester=fetch):Promise<string|null>{
 let url=safeDownloadUrl(raw);if(!url)return null;
 for(let hop=0;hop<5;hop++){
  if(url.hostname==='mega.nz'){
   const modern=/^\/file\/([a-zA-Z0-9_-]+)$/.exec(url.pathname);
   const legacy=/^#!([a-zA-Z0-9_-]+)!([a-zA-Z0-9_-]+)$/.exec(url.hash);
   const id=modern?.[1]||legacy?.[1],key=modern?url.hash.slice(1):legacy?.[2];
   if(!id||!key||!/^[a-zA-Z0-9_-]{43}$/.test(key))return null;
   const response=await request('https://g.api.mega.co.nz/cs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify([{a:'g',g:1,p:id}]),redirect:'error',signal:AbortSignal.timeout(10000),cache:'no-store'});
   if(!response.ok)return null;
   const results=await response.json();const file=Array.isArray(results)?results[0]:null;
   if(!file||typeof file!=='object'||!(file.s>0)||typeof file.at!=='string'||typeof file.g!=='string'||!file.g.startsWith('https://'))return null;
   try{
    const full=Buffer.from(key,'base64url');if(full.length!==32)return null;
    const aes=Buffer.alloc(16);for(let i=0;i<16;i++)aes[i]=full[i]^full[i+16];
    const decipher=createDecipheriv('aes-128-cbc',aes,Buffer.alloc(16));decipher.setAutoPadding(false);
    const attribute=Buffer.concat([decipher.update(Buffer.from(file.at,'base64url')),decipher.final()]).toString('utf8').replace(/\0+$/,'');
    if(!attribute.startsWith('MEGA'))return null;
    const metadata=JSON.parse(attribute.slice(4));if(typeof metadata.n!=='string'||!videoName.test(metadata.n))return null;
    return `https://mega.nz/file/${id}#${key}`;
   }catch{return null}
  }
  if(url.hostname!=='link.desustream.com')return null;
  const response=await request(url.href,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(8000),cache:'no-store'});
  if(![301,302,303,307,308].includes(response.status))return null;
  const location=response.headers.get('location');if(!location)return null;
  url=safeDownloadUrl(new URL(location,url).href);if(!url)return null;
 }
 return null;
}
