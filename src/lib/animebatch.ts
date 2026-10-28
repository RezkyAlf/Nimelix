import {createRequestCache} from './request-cache';
import {ANIMEBATCH_ORIGIN,parseCatalog,parseDetail,parseGenres,safeUrl,validSlug,decodeEpisode,episodeKeys,episodeId,episodeLabel,streamingLinks,defaultLinkIndex,downloadGroups,type SourcePost,type SourceDetail} from './animebatch-parser';
const cached=createRequestCache(96);
let active=0;const waiting:(()=>void)[]=[];
async function document(path:string,ttl=120){
 const url=new URL(path,ANIMEBATCH_ORIGIN);if(url.origin!==ANIMEBATCH_ORIGIN||url.pathname.startsWith('/api/')||url.pathname.startsWith('/admin/'))throw Error('Halaman sumber tidak diizinkan');
 return cached('html:'+url.href,ttl*1000,async()=>{
  await new Promise<void>(resolve=>{const start=()=>{active++;resolve()};if(active<3)start();else waiting.push(start)});
  try{
   const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{Accept:'text/html'}});
   if(!response.ok)throw Error(`AnimeBatch merespons ${response.status}`);
   const reader=response.body?.getReader();if(!reader)throw Error('Halaman sumber kosong');
   const decoder=new TextDecoder();let html='',bytes=0;
   try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>6_000_000)throw Error('Halaman sumber terlalu besar');html+=decoder.decode(value,{stream:true})}return html+decoder.decode()}
   finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
  }finally{active--;waiting.shift()?.()}
 });
}
export function card(post:SourcePost){
 return {animeId:post.slug,title:post.title,poster:safeUrl(post.image,true),banner:safeUrl(post.banner,true),status:post.status||'',episodes:post.episodes||'',genreList:(post.genres||[]).map(title=>({title})),synopsis:(post.synopsis||[]).join('\n\n'),hasBatch:!!post.hasBatch,type:post.type||'',year:post.year||null};
}
export async function getDetail(slug:string):Promise<SourceDetail>{
 if(!validSlug(slug))throw Error('Slug anime tidak valid');
 return cached('detail:'+slug,300000,async()=>parseDetail(await document('/'+slug+'/',300),slug));
}
export async function getGenres(){return cached('genres',3600000,async()=>parseGenres(await document('/genres/',3600)))}
export type CatalogOptions={genre?:string;status?:string;type?:string;year?:string;sort?:string};
async function catalog(page:number,q:string,view:string,options:CatalogOptions={}){
 const query=new URLSearchParams();if(q)query.set('q',q);if(view!=='all')query.set('view',view);
 for(const [key,value] of Object.entries(options))if(value&&value!=='newest')query.set(key,value);
 const path=(page>1?`/page/${page}/`:'/')+(query.size?'?'+query:'');
 const result=await cached('catalog:'+path,120000,async()=>parseCatalog(await document(path)));
 return {data:{animeList:result.items.map(card),totalCount:result.total,facets:result.facets},pagination:{currentPage:result.page,totalPages:result.pages,hasNextPage:result.page<result.pages}};
}
export async function getEpisode(id:string){
 const {slug,key}=decodeEpisode(id);const detail=await getDetail(slug);const keys=episodeKeys(detail.links);
 if(!keys.includes(key))throw Error('Episode tidak ditemukan pada sumber');
 const mirrors=streamingLinks(detail.links,key).map(l=>({id:l.id,provider:l.provider,quality:l.quality,url:safeUrl(l.playUrl),mode:l.mode as 'video'|'embed'}));
 const siblings=keys.filter(k=>k.split(':')[0]===key.split(':')[0]);const current=siblings.indexOf(key),defaultServer=defaultLinkIndex(mirrors);
 return {title:`${detail.post.title} - ${episodeLabel(key)}`,animeId:slug,poster:safeUrl(detail.post.banner||detail.post.image,true),sourceUrl:`${ANIMEBATCH_ORIGIN}/${slug}/?episode=${encodeURIComponent(key)}#watch`,episodeKey:key,defaultServer,mirrors,downloads:downloadGroups(detail.links,key),episodeList:keys.map(k=>({title:episodeLabel(k),episodeId:episodeId(slug,k)})),prevEpisode:current>0?{episodeId:episodeId(slug,siblings[current-1])}:null,nextEpisode:current<siblings.length-1?{episodeId:episodeId(slug,siblings[current+1])}:null};
}
export async function adapt(route:string,id:string|undefined,page:number,q:string,options:CatalogOptions={}){
 if(route==='anime'){
  const detail=await getDetail(id!);return {data:{details:{...card(detail.post),episodeList:episodeKeys(detail.links).map(key=>({title:episodeLabel(key),episodeId:episodeId(detail.post.slug,key)})),downloads:downloadGroups(detail.links)}}};
 }
 if(route==='episode')return {data:{details:await getEpisode(id!)}};
 if(route==='genre'){
  const genres=await getGenres();if(!id)return {data:{genres}};
  const genre=genres.find(g=>g.slug===id);if(!genre)throw Error('Genre tidak ditemukan');return catalog(page,q,'all',{...options,genre:genre.name});
 }
 const view=route==='ongoing'?'ongoing':route==='completed'?'completed':route==='batch'?'batch':'all';
 return catalog(page,q,view,options);
}
