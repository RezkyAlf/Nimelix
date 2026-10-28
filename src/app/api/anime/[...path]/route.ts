import {NextRequest,NextResponse} from 'next/server';
import {adapt} from '../../../../lib/otakudesu-api';
const buckets=new Map<string,{count:number;time:number}>();
export async function GET(req:NextRequest,{params}:{params:Promise<{path:string[]}>}){
 const {path}=await params;const [source,route,id]=path;
 if(source!=='otakudesu'||path.length>3||!['ongoing','completed','search','catalog','anime','genre','episode'].includes(route)||(id&&!/^[a-zA-Z0-9_-]{1,200}$/.test(id))||(['anime','episode'].includes(route)&&!id)||(!['anime','episode','genre'].includes(route)&&id))return NextResponse.json({error:'Rute tidak didukung'},{status:400});
 const q=req.nextUrl.searchParams.get('q')||'';const page=req.nextUrl.searchParams.get('page')||'1';
 if(q.length>100||!/^\d{1,4}$/.test(page)||Number(page)<1)return NextResponse.json({error:'Parameter tidak valid'},{status:400});
 const key=req.headers.get('x-forwarded-for')?.split(',')[0]||'local',now=Date.now(),bucket=buckets.get(key);
 if(bucket&&now-bucket.time<60000&&bucket.count>=90)return NextResponse.json({error:'Terlalu banyak permintaan'},{status:429});
 if(!bucket||now-bucket.time>=60000)buckets.set(key,{count:1,time:now});else bucket.count++;
 if(buckets.size>10000)buckets.clear();
 if(!process.env.ANIME_API_BASE_URL)return NextResponse.json({error:'API belum dikonfigurasi',preview:true},{status:503});
 try{return NextResponse.json(await adapt(route,id,Number(page),q));}
 catch(e){console.error('[otakudesu-be]',e instanceof Error?e.message:'unknown error');return NextResponse.json({error:'Sumber API sedang tidak tersedia. Silakan coba lagi.'},{status:502});}
}
