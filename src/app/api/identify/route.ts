import {NextRequest,NextResponse} from 'next/server';
import {MAX_TRACE_IMAGE_BYTES,imageMime,mapSceneMatches} from '../../../lib/trace-moe';
export const runtime='nodejs';
let active=false;
export async function POST(req:NextRequest){
 if(!['image/jpeg','image/png','image/webp'].includes(req.headers.get('content-type')?.split(';')[0]||''))return NextResponse.json({error:'Gunakan gambar JPG, PNG, atau WebP.'},{status:415});
 if(Number(req.headers.get('content-length'))>MAX_TRACE_IMAGE_BYTES)return NextResponse.json({error:'Ukuran gambar maksimal 8 MB.'},{status:413});
 if(!req.body)return NextResponse.json({error:'Pilih gambar terlebih dahulu.'},{status:400});
 if(active)return NextResponse.json({error:'Pencarian lain sedang diproses. Coba lagi setelah beberapa saat.'},{status:429});
 active=true;
 try{
  const reader=req.body.getReader();const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_TRACE_IMAGE_BYTES){await reader.cancel();return NextResponse.json({error:'Ukuran gambar maksimal 8 MB.'},{status:413})}chunks.push(value)}
  const bytes=Buffer.concat(chunks);const mime=imageMime(bytes);
  if(!mime)return NextResponse.json({error:'File bukan gambar JPG, PNG, atau WebP yang valid.'},{status:415});
  const response=await fetch('https://api.trace.moe/search?anilistInfo&cutBorders=1',{method:'POST',headers:{'Content-Type':mime},body:bytes,cache:'no-store',redirect:'manual',signal:AbortSignal.any([req.signal,AbortSignal.timeout(45000)])});
  if(response.status===402||response.status===429)return NextResponse.json({error:'Kuota atau batas pencarian trace.moe tercapai. Coba lagi nanti.'},{status:429});
  if(!response.ok)return NextResponse.json({error:response.status===400?'Gambar tidak dapat dikenali. Coba screenshot adegan anime yang lebih jelas.':'trace.moe sedang tidak tersedia. Coba lagi nanti.'},{status:response.status===400?400:502});
  const data=await response.json();if(data.error)throw Error('upstream');
  return NextResponse.json({matches:mapSceneMatches(data.result)},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Pencarian belum berhasil. Layanan mungkin sibuk atau koneksi terputus. Silakan coba lagi.'},{status:502})}
 finally{active=false}
}
