import {NextRequest,NextResponse} from 'next/server';
import {adapt,upstream} from '../../../lib/otakudesu-api';
import {selectPlayback,allowedVideo,type EpisodePlayback} from '../../../lib/playback';
import {verifyDownload} from '../../../lib/downloads';
export async function GET(req:NextRequest){
 const id=req.nextUrl.searchParams.get('episode')||'';
 const index=req.nextUrl.searchParams.get('server')||'-1';
 const quality=req.nextUrl.searchParams.get('quality')||'';
 const skip=req.nextUrl.searchParams.get('exclude')||'';
 if(skip.length>400||(skip&&!/^(?:-2|-1|\d{1,2})(?:,(?:-2|-1|\d{1,2}))*$/.test(skip)))return NextResponse.json({error:'Daftar server tidak valid'},{status:400});
 const excluded=skip?skip.split(',').map(Number):[];
 if(quality&&!/^\d{3,4}p$/.test(quality))return NextResponse.json({error:'Resolusi tidak valid'},{status:400});
 if(!/^[a-zA-Z0-9_-]{1,200}$/.test(id)||!/^(-1|\d{1,2})$/.test(index))return NextResponse.json({error:'Episode atau server tidak valid'},{status:400});
 try{
  const result=await adapt('episode',id,1,'');
  const details=(result.data as {details:EpisodePlayback&{downloads:{format:string;resolution:string;links:{provider:string;url:string}[]}[]}}).details;
  const allowed=(process.env.ALLOWED_STREAM_HOSTS||'').split(',').map(x=>x.trim()).filter(Boolean);
  // Prefer a verified MP4 file when available so the native player can offer real seek controls.
  if(index==='-1'&&!excluded.includes(-2)&&allowed.includes('pixeldrain.com')){
   const groups=(details.downloads||[]).filter(g=>g.format==='MP4'&&(!quality||g.resolution.includes(quality))).sort((a,b)=>(a.resolution.includes('480p')?-1:0)-(b.resolution.includes('480p')?-1:0));
   for(const group of groups.slice(0,1)){
    const candidate=group.links.find(l=>/pdrain|pixeldrain/i.test(l.provider));
    if(candidate){try{const direct=await verifyDownload(candidate.url);if(direct){const url=new URL(direct);url.searchParams.delete('download');const safe=allowedVideo(url.href,allowed);if(safe)return NextResponse.json({url:safe,mode:'video',server:-2,provider:candidate.provider,quality:/\d{3,4}p/.exec(group.resolution)?.[0]||group.resolution},{headers:{'Cache-Control':'no-store'}})}}catch{/* Keep embed alternatives available when the file host is offline. */}}
   }
  }
  const playback=await selectPlayback(details,Number(index),allowed,async content=>await upstream(`mirror?content=${encodeURIComponent(content)}`,300) as {url?:string;embeddable?:boolean}|null,quality,excluded);
  if(!playback)return NextResponse.json({error:Number(index)>=0?'Server ini tidak tersedia atau tidak mengizinkan embed. Pilih Otomatis atau server lain.':'Belum ada server yang dapat ditampilkan di website ini. Coba lagi nanti.'},{status:422});
  return NextResponse.json({...playback,mode:/\.(mp4|webm|ogg)$/i.test(new URL(playback.url).pathname)?'video':'embed'},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Server video sedang tidak tersedia. Coba server lain atau ulangi nanti.'},{status:502});}
}
