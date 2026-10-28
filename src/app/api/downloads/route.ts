import {NextRequest,NextResponse} from 'next/server';
import {adapt} from '../../../lib/otakudesu-api';
type Group={format:string;resolution:string;links:{provider:string;url:string}[]};
export async function GET(req:NextRequest){
 const id=req.nextUrl.searchParams.get('episode')||'',index=req.nextUrl.searchParams.get('group')||'0';
 if(!/^[a-zA-Z0-9_-]{1,200}$/.test(id)||!/^\d{1,2}$/.test(index))return NextResponse.json({error:'Episode atau format unduhan tidak valid'},{status:400});
 try{
  const result=await adapt('episode',id,1,'');const groups=(result.data as {details:{downloads:Group[]}}).details.downloads;
  const group=groups[Number(index)];if(!group)return NextResponse.json({error:'Format unduhan tidak ditemukan'},{status:404});
  const links=Array.from(new Map(group.links.flatMap(link=>{try{const url=new URL(link.url);return url.protocol==='https:'&&!url.username&&!url.password?[[url.href,{provider:link.provider,url:url.href}] as const]:[]}catch{return []}})).values());
  return NextResponse.json({links});
 }catch{return NextResponse.json({error:'Tautan unduhan belum dapat dimuat. Coba lagi nanti.'},{status:502});}
}
