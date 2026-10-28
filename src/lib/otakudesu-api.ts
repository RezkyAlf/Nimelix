import {createRequestCache} from './request-cache';
const cachedRequest = createRequestCache();
type Row = Record<string, unknown>;
function object(value: unknown): Row {return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};}
function array(value: unknown): Row[] {return Array.isArray(value) ? value.map(object) : [];}
function text(value: unknown): string {return typeof value === 'string' ? value.trim() : '';}
function slug(value: unknown): string {const result=text(value).replace(/\/+$/, '');return /^[a-zA-Z0-9_-]{1,200}$/.test(result)?result:'';}

export async function upstream(path: string, revalidate = 300): Promise<unknown> {
 const base=process.env.ANIME_API_BASE_URL;
 if(!base)throw Error('API belum dikonfigurasi');
 const url=new URL(`${base.replace(/\/$/,'')}/${path}`);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('Konfigurasi API tidak valid');
 return cachedRequest(`${url.href}:${revalidate}`,revalidate*1000,async()=>{
 const response=await fetch(url,{signal:AbortSignal.timeout(12000),redirect:'manual',next:{revalidate}});
 if(!response.ok)throw Error(response.status===429?'Sumber membatasi permintaan. Coba sebentar lagi.':`Sumber API merespons ${response.status}`);
 const json=object(await response.json());
 if(!('data' in json)||json.error)throw Error('Respons API tidak dikenali');
 return json.data;
 });
}
export function card(value: unknown) {
 const v=object(value);
 return {animeId:slug(v.slug),title:text(v.title),poster:text(v.poster),status:text(v.status),episodes:text(v.episode_count),genreList:array(v.genres).map(g=>({title:text(g.name),genreId:slug(g.slug)})),synopsis:text(v.synopsis),latestReleaseDate:text(v.newest_release_date)||text(v.last_release_date),releaseDay:text(v.release_day),currentEpisode:text(v.current_episode)};
}
function episodes(value: unknown){return array(value).map(e=>({title:text(e.episode),episodeId:slug(e.slug)})).filter(e=>e.episodeId);}
function downloadGroups(value:unknown){
 const data=object(value);
 return ['mp4','mkv'].flatMap(format=>array(data[format]).map(group=>({format:format.toUpperCase(),resolution:text(group.resolution),links:array(group.urls).flatMap(link=>{try{const url=new URL(text(link.url));return url.protocol==='https:'&&!url.username&&!url.password?[{provider:text(link.provider)||'Sumber unduhan',url:url.href}]:[]}catch{return []}})}))).filter(group=>group.links.length);
}
export async function adapt(route:string,id:string|undefined,page:number,q:string){
 if(route==='catalog'){
  const groups=await upstream('list',3600);
  if(!Array.isArray(groups))throw Error('Format katalog A–Z tidak dikenali');
  const seen=new Set<string>();
  const all=array(groups).flatMap(g=>array(g.anime_list)).filter(a=>{const key=slug(a.slug);if(!key||seen.has(key))return false;seen.add(key);return true;});
  const size=24;const totalPages=Math.max(1,Math.ceil(all.length/size));const currentPage=Math.min(page,totalPages);
  const entries=all.slice((currentPage-1)*size,currentPage*size);const animeList=entries.map(card);
  let cursor=0;
  // Keep the upstream concurrency bounded; Next's fetch cache reuses detail data.
  await Promise.all(Array.from({length:3},async()=>{while(cursor<entries.length){const index=cursor++;try{animeList[index]=card(await upstream(`detail/${encodeURIComponent(slug(entries[index].slug))}`,3600));if(!animeList[index].animeId)animeList[index].animeId=slug(entries[index].slug);}catch{/* Keep the directory title available if its detail is temporarily offline. */}}}));
  return {data:{animeList,totalCount:all.length},pagination:{currentPage,totalPages,hasNextPage:currentPage<totalPages,hasPrevPage:currentPage>1,nextPage:currentPage<totalPages?currentPage+1:null}};
 }
 if(route==='anime'){
  const v=object(await upstream(`detail/${encodeURIComponent(id!)}`,1800));
  return {data:{details:{...card(v),animeId:slug(v.slug)||id,episodeList:episodes(v.episode_lists)}}};
 }
 if(route==='episode'){
  const v=object(await upstream(`episode/${encodeURIComponent(id!)}`,300));
  const prev=slug(object(v.previous_episode).slug),next=slug(object(v.next_episode).slug);
  return {data:{details:{title:text(v.episode),animeId:slug(object(v.anime).slug),defaultStreamingUrl:text(v.stream_url),prevEpisode:prev?{episodeId:prev}:null,nextEpisode:next?{episodeId:next}:null,mirrors:array(v.mirrors).map(m=>({provider:text(m.provider),quality:text(m.quality),content:text(m.content)})),downloads:downloadGroups(v.download_urls)}}};
 }
 if(route==='mirror'){
  const v=object(await upstream(`mirror?content=${encodeURIComponent(q)}`,300));
  return {data:{details:v}};
 }
 if(route==='search'){
  if(!q)return {data:{animeList:[]}};
  const data=await upstream(`search/${encodeURIComponent(q)}`);
  if(!Array.isArray(data))throw Error('Format pencarian tidak dikenali');
  return {data:{animeList:data.map(card).filter(a=>a.animeId)}};
 }
 if(route==='genre'){
  const data=await upstream(id?`genres/${encodeURIComponent(id)}?page=${page}`:'genres');
  if(!id){if(!Array.isArray(data))throw Error('Format daftar genre tidak dikenali');return {data:{genres:array(data).map(g=>({name:text(g.name),slug:slug(g.slug)})).filter(g=>g.name&&g.slug)}}}
  const v=object(data),p=object(v.pagination);
  if(!Array.isArray(v.anime))throw Error('Format anime genre tidak dikenali');
  return {data:{animeList:v.anime.map(card).filter(a=>a.animeId)},pagination:{currentPage:Number(p.current_page)||page,totalPages:Number(p.last_visible_page)||page,hasNextPage:Boolean(p.has_next_page)}};
 }
 const data=object(await upstream(`${route==='completed'?'complete':'ongoing'}/${page}`));
 const list=data[route==='completed'?'completeAnimeData':'ongoingAnimeData'];
 if(!Array.isArray(list))throw Error('Format daftar anime tidak dikenali');
 const p=object(data.paginationData);
 return {data:{animeList:list.map(card).filter(a=>a.animeId)},pagination:{currentPage:Number(p.current_page)||page,totalPages:Number(p.last_visible_page)||page,hasNextPage:Boolean(p.has_next_page),hasPrevPage:Boolean(p.has_previous_page),nextPage:p.next_page}};
}
