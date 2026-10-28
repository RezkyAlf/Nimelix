function responseMessage(status:number){
 if(status===429)return 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.';
 if(status===403)return 'Akses API ditolak oleh server. Muat ulang halaman lalu coba lagi.';
 return 'Data belum dapat dimuat dari server. Silakan coba lagi.';
}

// Hosting/CDN errors can be HTML rather than our JSON error envelope.
// Retry a GET once without browser cache, and never show raw response bodies.
export async function fetchApiJson(url:string,init:RequestInit={},request:typeof fetch=fetch){
 const isGet=!init.method||init.method.toUpperCase()==='GET';
 for(let attempt=0;attempt<2;attempt++){
  init.signal?.throwIfAborted();
  let response:Response;
  try{response=await request(url,attempt?{...init,cache:'no-store'}:init)}
  catch(error){
   if(init.signal?.aborted||(error instanceof Error&&error.name==='AbortError'))throw error;
   if(isGet&&attempt===0)continue;
   throw Error('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.');
  }
  const type=response.headers.get('content-type')||'';
  if(/(?:application\/json|\+json)(?:\s*;|$)/i.test(type)){
   try{
    const data=await response.json();
    if(data&&typeof data==='object'&&!Array.isArray(data))return {response,data};
   }catch(error){if(init.signal?.aborted||(error instanceof Error&&error.name==='AbortError'))throw error}
  }else await response.body?.cancel().catch(()=>{});
  if(!isGet||attempt>0||(!response.ok&&response.status<500))throw Error(responseMessage(response.status));
 }
 throw Error(responseMessage(502));
}
