import {NextRequest,NextResponse} from 'next/server';
import {getEpisode} from '../../../lib/animebatch';
import {allowedVideo,defaultServerIndex,streamHosts} from '../../../lib/playback';
import {inspectFrame} from '../../../lib/embed-policy';
import {createRequestCache} from '../../../lib/request-cache';
const checked=createRequestCache(96);
export async function GET(req:NextRequest){
 const episode=req.nextUrl.searchParams.get('episode')||'',server=req.nextUrl.searchParams.get('server')||'-1';
 if(episode.length>640||!/^(-1|\d{1,3})$/.test(server))return NextResponse.json({error:'Episode atau server tidak valid'},{status:400});
 try{
  const detail=await getEpisode(episode);const index=Number(server)<0?defaultServerIndex(detail.mirrors):Number(server);const selected=detail.mirrors[index];
  if(!selected)return NextResponse.json({error:'Streaming belum tersedia untuk pilihan ini. Periksa unduhan atau pilih server lain.',sourceUrl:detail.sourceUrl},{status:422});
  const hosts=streamHosts(process.env.ALLOWED_STREAM_HOSTS);
  const url=allowedVideo(selected.url,hosts);if(!url)return NextResponse.json({error:'Domain server ini belum didukung. Pilih server lain atau buka sumber.',sourceUrl:detail.sourceUrl},{status:422});
  if(selected.mode==='embed'){
   const policy=await checked(url+':'+req.nextUrl.origin,30000,()=>inspectFrame(url,req.nextUrl.origin));
   if(policy==='blocked')return NextResponse.json({error:'Penyedia membatasi embed dari domain Nimelix. Pilih server lain atau buka AnimeBatch.',sourceUrl:detail.sourceUrl},{status:409});
   if(policy==='missing')return NextResponse.json({error:'Halaman server tidak tersedia. Pilih server lain.',sourceUrl:detail.sourceUrl},{status:410});
  }
  return NextResponse.json({url,mode:selected.mode,server:index,provider:selected.provider,quality:selected.quality,sourceUrl:detail.sourceUrl},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Sumber video AnimeBatch belum dapat dimuat. Silakan coba lagi.'},{status:502})}
}
