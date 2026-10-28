import {NextRequest,NextResponse} from 'next/server';
import {adapt} from '../../../../lib/animebatch';
import {validSlug} from '../../../../lib/animebatch-parser';
const buckets=new Map<string,{count:number;time:number}>();
export async function GET(req:NextRequest,{params}:{params:Promise<{path:string[]}>}){
 const {path}=await params;const [source,route,id]=path;
 if(source!=='animebatch'||path.length>3||!['ongoing','completed','search','catalog','batch','anime','genre','episode'].includes(route)||(id&&!(route==='episode'?id.length<=640:validSlug(id)))||(['anime','episode'].includes(route)&&!id)||(!['anime','episode','genre'].includes(route)&&id))return NextResponse.json({error:'Rute tidak didukung'},{status:400});
 const q=req.nextUrl.searchParams.get('q')||'';const page=req.nextUrl.searchParams.get('page')||'1';
 if(q.length>100||!/^\d{1,4}$/.test(page)||Number(page)<1)return NextResponse.json({error:'Parameter tidak valid'},{status:400});
 const key=req.headers.get('x-forwarded-for')?.split(',')[0]||'local',now=Date.now(),bucket=buckets.get(key);
 if(bucket&&now-bucket.time<60000&&bucket.count>=1000)return NextResponse.json({error:'Terlalu banyak permintaan'},{status:429});
 if(!bucket||now-bucket.time>=60000)buckets.set(key,{count:1,time:now});else bucket.count++;
 if(buckets.size>10000)buckets.clear();
 try{return NextResponse.json(await adapt(route,id,Number(page),q,{genre:req.nextUrl.searchParams.get('genre')?.slice(0,100),status:req.nextUrl.searchParams.get('status')?.slice(0,30),type:req.nextUrl.searchParams.get('type')?.slice(0,30),year:req.nextUrl.searchParams.get('year')?.slice(0,4),sort:['newest','rating','popular','az'].includes(req.nextUrl.searchParams.get('sort')||'')?req.nextUrl.searchParams.get('sort')!:undefined}),{headers:{'Cache-Control':'public, max-age=60, s-maxage=120, stale-while-revalidate=300'}});}
 catch(e){console.error('[animebatch-scraper]',e instanceof Error?e.message:'unknown error');return NextResponse.json({error:'Situs sumber sedang tidak tersedia. Silakan coba lagi.'},{status:502});}
}
