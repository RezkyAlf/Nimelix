export const MAX_TRACE_IMAGE_BYTES=8*1024*1024;
export type SceneMatch={title:string;nativeTitle:string;anilistId:number|null;episode:string|null;from:number;to:number;similarity:number;image:string|null;video:string|null};
export function imageMime(bytes:Uint8Array):string|null{
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'image/png';
 if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
 return null;
}
function object(value:unknown):Record<string,unknown>{return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}}
function text(value:unknown){return typeof value==='string'?value.trim():''}
function media(value:unknown){try{const url=new URL(text(value));return url.protocol==='https:'&&(url.hostname==='trace.moe'||url.hostname.endsWith('.trace.moe'))&&!url.username&&!url.password?url.href:null}catch{return null}}
export function mapSceneMatches(value:unknown):SceneMatch[]{
 if(!Array.isArray(value))throw Error('Format respons trace.moe tidak dikenali');
 return value.flatMap(raw=>{const v=object(raw),a=object(v.anilist),title=object(a.title);
  if(typeof v.similarity!=='number'||!Number.isFinite(v.similarity)||v.similarity<0||v.similarity>1)return [];
  const id=typeof v.anilist==='number'?v.anilist:a.id;
  const episode=Array.isArray(v.episode)?v.episode.filter(n=>typeof n==='number'||typeof n==='string').join(', '):typeof v.episode==='number'||typeof v.episode==='string'?String(v.episode):null;
  const from=typeof v.from==='number'&&Number.isFinite(v.from)?Math.max(0,v.from):0;
  return [{title:text(title.english)||text(title.romaji)||text(title.native)||text(v.filename)||'Judul belum tersedia',nativeTitle:text(title.native),anilistId:typeof id==='number'&&Number.isInteger(id)&&id>0?id:null,episode,from,to:typeof v.to==='number'&&Number.isFinite(v.to)?Math.max(from,v.to):from,similarity:v.similarity,image:media(v.image),video:media(v.video)}];
 }).sort((a,b)=>b.similarity-a.similarity).slice(0,10);
}
