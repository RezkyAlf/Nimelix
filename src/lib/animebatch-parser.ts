import {load} from 'cheerio/slim';

export const ANIMEBATCH_ORIGIN='https://www.animebatch.id';
export type SourcePost={slug:string;title:string;image?:string;banner?:string;genres?:string[];status?:string;episodes?:string;availableEpisodes?:number[];synopsis?:string[];type?:string;year?:number;hasBatch?:boolean;[key:string]:unknown};
export type SourceLink={id:string;kind:string;episodeType?:string;episode?:number;mode:string;provider:string;quality:string;playUrl?:string;url:string;filename?:string;[key:string]:unknown};
export type SourceDetail={post:SourcePost;links:SourceLink[]};
export type DownloadGroup={kind:'episode'|'batch';format:string;resolution:string;links:{provider:string;url:string}[]};
export function safeUrl(value:unknown,relative=false){
 if(typeof value!=='string'||!value)return '';
 try{const url=new URL(value,relative?ANIMEBATCH_ORIGIN:undefined);return url.protocol==='https:'&&!url.username&&!url.password?url.href:''}catch{return ''}
}
export function validSlug(value:unknown):value is string{
 if(typeof value!=='string'||value.length<1||value.length>600||!/^(?:[a-zA-Z0-9_.-]|%[a-f0-9]{2})+$/i.test(value))return false;
 try{const decoded=decodeURIComponent(value);return decoded!=='.'&&decoded!=='..'&&!/[\/\\?#\u0000-\u001f]/.test(decoded)}catch{return false}
}

// Read the public JSON embedded in Next's Flight stream; never evaluate source JavaScript.
export function flightRecords(html:string){
 let stream='';
 // Only JSON inside complete script tags is read; no source JavaScript is evaluated.
 // Avoid building a DOM for every catalog/detail request on the Worker CPU budget.
 for(const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)){const match=/^self\.__next_f\.push\((\[[\s\S]*\])\);?$/.exec(script[1].trim());if(!match)continue;
  try{const frame=JSON.parse(match[1]);if(frame[0]===1&&typeof frame[1]==='string')stream+=frame[1]}catch{}
 }
 const bytes=new TextEncoder().encode(stream),decoder=new TextDecoder(),records=new Map<string,unknown>();let offset=0;
 while(offset<bytes.length){
  let colon=offset;while(colon<bytes.length&&bytes[colon]!==58&&bytes[colon]!==10)colon++;
  const id=decoder.decode(bytes.subarray(offset,colon));
  if(bytes[colon]!==58||!/^[a-f0-9]+$/i.test(id)){while(offset<bytes.length&&bytes[offset++]!==10){}continue}
  offset=colon+1;
  if(bytes[offset]===84){
   let comma=offset+1;while(comma<bytes.length&&bytes[comma]!==44&&bytes[comma]!==10)comma++;
   const size=decoder.decode(bytes.subarray(offset+1,comma));
   if(bytes[comma]===44&&/^[a-f0-9]+$/i.test(size)){const end=comma+1+parseInt(size,16);if(end<=bytes.length){records.set(id,decoder.decode(bytes.subarray(comma+1,end)));offset=end;continue}}
  }
  let end=offset;while(end<bytes.length&&bytes[end]!==10)end++;
  try{records.set(id,JSON.parse(decoder.decode(bytes.subarray(offset,end))))}catch{}
  offset=end+1;
 }
 return records;
}
export function publicProps(html:string){
 const records=flightRecords(html),found:Record<string,unknown>[]=[];
 function resolve(value:unknown,depth=0,seen=new Set<string>()):unknown{
  if(depth>35)return null;
  if(typeof value==='string'&&/^\$[a-f0-9]+$/i.test(value)&&records.has(value.slice(1))){const id=value.slice(1);if(seen.has(id))return null;return resolve(records.get(id),depth+1,new Set([...seen,id]))}
  if(Array.isArray(value))return value.map(v=>resolve(v,depth+1,seen));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,resolve(v,depth+1,seen)]));
  return value;
 }
 function visit(value:unknown,depth=0){
  if(depth>35||!value||typeof value!=='object')return;
  if(!Array.isArray(value)){
   const object=value as Record<string,unknown>;
   if(object.initialData||object.post||object.facets){
    const selected:Record<string,unknown>={};
    for(const key of ['initialData','facets','post','links'])if(key in object)selected[key]=resolve(object[key]);
    found.push(selected);return;
   }
  }
  for(const item of Object.values(value))visit(item,depth+1);
 }
 for(const value of records.values())visit(value);
 return found;
}
export function parseCatalog(html:string){
 const props=publicProps(html);const initial=props.map(p=>p.initialData).find(v=>v&&typeof v==='object'&&Array.isArray((v as {items?:unknown}).items)) as {items:SourcePost[];page:number;pages:number;total:number}|undefined;
 if(!initial||!Number.isFinite(initial.total))throw Error('Format katalog AnimeBatch berubah');
 const facets=props.find(p=>p.facets)?.facets as {genres?:{name:string;slug:string}[];types?:string[];years?:number[]}|undefined;
 return {...initial,items:initial.items.filter(p=>validSlug(p.slug)&&typeof p.title==='string'),facets};
}
export function parseDetail(html:string,slug:string):SourceDetail{
 const props=publicProps(html).find(p=>p.post&&typeof p.post==='object'&&(p.post as SourcePost).slug===slug&&Array.isArray(p.links));
 if(!props)throw Error('Detail AnimeBatch tidak ditemukan atau format sumber berubah');
 const post=props.post as SourcePost;
 const links=(props.links as SourceLink[]).filter(l=>l&&typeof l.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(l.id)&&typeof l.provider==='string'&&typeof l.quality==='string'&&safeUrl(l.url));
 return {post,links};
}
export function parseGenres(html:string){
 const $=load(html);const result=new Map<string,{name:string;slug:string}>();
 $('a[href]').each((_,el)=>{const href=$(el).attr('href')||'',match=/^\/genre\/([^/]+)\/$/.exec(href);if(!match||!validSlug(match[1]))return;const name=$(el).find('h2').text().trim();if(name)result.set(match[1],{name,slug:match[1]})});
 if(!result.size)throw Error('Daftar genre AnimeBatch belum tersedia');return [...result.values()];
}
export function episodeKey(link:SourceLink){return `${link.episodeType|| (link.kind==='movie'?'movie':'episode')}:${link.episode??1}`}
export function episodeId(slug:string,key:string){return `${slug}--${key.replace(':','-').replace('.','_')}`}
export function decodeEpisode(id:string){
 const match=/^(.+)--([a-z]{1,16})-(\d{1,5}(?:_\d{1,3})?)$/.exec(id);
 if(!match||!validSlug(match[1]))throw Error('ID episode AnimeBatch tidak valid');return {slug:match[1],key:match[2]+':'+match[3].replace('_','.')};
}
export function episodeLabel(key:string){const [type,number]=key.split(':');return `${type==='episode'?'Episode':type==='movie'?'Movie':type==='special'?'Special':type.toUpperCase()} ${number}`}
export function episodeKeys(links:SourceLink[]){
 const types=['episode','movie','ona','ova','special'];
 return [...new Set(links.filter(l=>l.kind!=='batch').map(episodeKey))].sort((a,b)=>{const [at,an]=a.split(':'),[bt,bn]=b.split(':');return (types.includes(at)?types.indexOf(at):99)-(types.includes(bt)?types.indexOf(bt):99)||Number(an)-Number(bn)});
}
export function streamingLinks(links:SourceLink[],key:string){return links.filter(l=>l.kind!=='batch'&&episodeKey(l)===key&&['embed','video'].includes(l.mode)&&safeUrl(l.playUrl))}
export function defaultLinkIndex(links:Pick<SourceLink,'provider'|'quality'>[]){
 const score=(l:Pick<SourceLink,'provider'|'quality'>)=>(l.quality==='720p'?10000:0)+(l.provider==='BerkasDrive'?1000:0);
 let best=-1;for(let i=0;i<links.length;i++)if(best<0||score(links[i])>score(links[best]))best=i;return best;
}
export function downloadGroups(links:SourceLink[],key?:string):DownloadGroup[]{
 const groups=new Map<string,DownloadGroup>();
 for(const link of links){
  if(key&&link.kind!=='batch'&&episodeKey(link)!==key)continue;
  if(!key&&link.kind!=='batch')continue;
  const url=safeUrl(link.url);if(!url)continue;
  const kind=link.kind==='batch'?'batch':'episode';const format=/\.(mp4|mkv|zip|rar|7z)(?:$|[?])/i.exec(link.filename||'')?.[1]?.toUpperCase()||'File';
  const id=`${kind}:${format}:${link.quality}`;let group=groups.get(id);
  if(!group){group={kind,format,resolution:link.quality,links:[]};groups.set(id,group)}
  if(!group.links.some(l=>l.url===url))group.links.push({provider:link.provider,url});
 }
 return [...groups.values()];
}
