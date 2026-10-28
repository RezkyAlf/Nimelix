import {NextRequest,NextResponse} from 'next/server';
import {getEpisode,getDetail} from '../../../lib/animebatch';
import {downloadGroups,validSlug} from '../../../lib/animebatch-parser';
export async function GET(req:NextRequest){
 const episode=req.nextUrl.searchParams.get('episode')||'',anime=req.nextUrl.searchParams.get('anime')||'',group=req.nextUrl.searchParams.get('group')||'0';
 if(!/^\d{1,4}$/.test(group)||(!episode&&!validSlug(anime)))return NextResponse.json({error:'Parameter unduhan tidak valid'},{status:400});
 try{
  const groups=episode?(await getEpisode(episode)).downloads:downloadGroups((await getDetail(anime)).links);const selected=groups[Number(group)];
  if(!selected)return NextResponse.json({error:'Pilihan unduhan tidak ditemukan'},{status:404});
  return NextResponse.json({links:selected.links},{headers:{'Cache-Control':'public, max-age=60'}});
 }catch{return NextResponse.json({error:'Unduhan AnimeBatch belum dapat dimuat.'},{status:502})}
}
