export type PlaybackMirror={id:string;url:string;mode:'video'|'embed';provider:string;quality:string};
export function allowedVideo(raw:string,hosts:string[]){
 try{const url=new URL(raw);if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443')||!hosts.includes(url.hostname))return null;return url.href}catch{return null}
}
// AnimeBatch chooses 720p first, then BerkasDrive, retaining source order for ties.
export function defaultServerIndex(mirrors:PlaybackMirror[]){
 const score=(m:PlaybackMirror)=>(m.quality==='720p'?10000:0)+(m.provider==='BerkasDrive'?1000:0);
 let best=-1;for(let i=0;i<mirrors.length;i++)if(best<0||score(mirrors[i])>score(mirrors[best]))best=i;return best;
}
