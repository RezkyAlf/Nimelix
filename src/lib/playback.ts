export type Mirror={content:string;provider?:string;quality?:string};
export type EpisodePlayback={defaultStreamingUrl:string;mirrors:Mirror[]};
type Resolved={url?:string;embeddable?:boolean}|null;
export function allowedVideo(raw:string,hosts:string[]):string|null{
 try{
  const url=new URL(raw);
  if(url.protocol!=='https:'||!hosts.includes(url.hostname)||url.username||url.password||(url.port&&url.port!=='443'))return null;
  if(url.hostname==='www.blogger.com'&&(url.pathname!=='/video.g'||!url.searchParams.get('token')))return null;
  if(url.hostname==='mega.nz'&&!/^\/embed\//.test(url.pathname))return null;
  if(url.hostname==='pixeldrain.com'&&!/^\/api\/file\/[a-zA-Z0-9]+$/.test(url.pathname))return null;
  return url.href;
 }catch{return null}
}
export async function selectPlayback(details:EpisodePlayback,index:number,hosts:string[],resolve:(content:string)=>Promise<Resolved>,quality='',excluded:number[]=[]){
 async function mirrorAt(i:number){
  const mirror=details.mirrors[i];
  if(excluded.includes(i))return null;
  if(quality&&mirror?.quality!==quality)return null;
  if(!mirror||!/^[A-Za-z0-9+/=]{8,512}$/.test(mirror.content))return null;
  const result=await resolve(mirror.content);
  if(!result||result.embeddable===false)return null;
  const url=allowedVideo(result.url||'',hosts);
  return url?{url,server:i,provider:mirror.provider||'Server alternatif',quality:mirror.quality||''}:null;
 }
 if(index>=0){return await mirrorAt(index)}
 const primary=allowedVideo(details.defaultStreamingUrl,hosts);
 if(primary&&!quality&&!excluded.includes(-1))return {url:primary,server:-1,provider:'Server utama',quality:''};
 // Resolve at most four different providers; avoid repeatedly trying one host at each quality.
 const seen=new Set<string>();const candidates:number[]=[];
 const priority=(m:Mirror)=>/blogs/i.test(m.provider||'')?0:/mega/i.test(m.provider||'')?1:/vidhide/i.test(m.provider||'')?2:3;
 for(const {m,i} of details.mirrors.map((m,i)=>({m,i})).sort((a,b)=>priority(a.m)-priority(b.m))){
  if(quality&&m.quality!==quality)continue;
  if(excluded.includes(i))continue;
  const provider=m.provider||m.content;
  if(!seen.has(provider)){seen.add(provider);candidates.push(i)}
  if(candidates.length===4)break;
 }
 for(const i of candidates){try{const result=await mirrorAt(i);if(result)return result}catch{/* Try the next provider if one is offline. */}}
 return null;
}
