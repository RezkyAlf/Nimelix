import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyDownload,verifyMegaDownload,safeDownloadUrl} from '../src/lib/downloads.ts';
import {createCipheriv} from 'node:crypto';
test('halaman HTML berstatus 200 bukan file video',async()=>{
 assert.equal(await verifyDownload('https://gofile.io/d/test',async()=>new Response(null,{headers:{'content-type':'text/html','content-length':'500'}})),null);
});
test('redirect ke host yang tidak dikenal tidak diikuti',async()=>{
 let calls=0;const value=await verifyDownload('https://link.desustream.com/?id=test',async()=>{calls++;return new Response(null,{status:302,headers:{location:'http://127.0.0.1/private'}})});
 assert.equal(value,null);assert.equal(calls,1);assert.equal(safeDownloadUrl('https://user:pass@pixeldrain.com/u/test'),null);
});
test('video langsung harus memiliki ukuran file positif',async()=>{
 const request=async()=>new Response(null,{headers:{'content-type':'video/mp4','content-length':'100000'}});
 assert.equal(await verifyDownload('https://pixeldrain.com/api/file/test?download',request),'https://pixeldrain.com/api/file/test?download');
 assert.equal(await verifyDownload('https://pixeldrain.com/api/file/test?download',async()=>new Response(null,{headers:{'content-type':'video/mp4'}})),null);
});
test('file Pixeldrain yang hilang tidak ditawarkan',async()=>{
 assert.equal(await verifyDownload('https://pixeldrain.com/u/test',async()=>Response.json({success:false})),null);
});
test('Pixeldrain diperiksa melalui metadata dan endpoint file',async()=>{
 const calls=[];const result=await verifyDownload('https://link.desustream.com/?id=test',async url=>{
  calls.push(String(url));if(calls.length===1)return new Response(null,{status:302,headers:{location:'https://pixeldrain.com/u/test'}});
  if(String(url).endsWith('/info'))return Response.json({name:'episode.mp4',size:100000});
  return new Response(null,{headers:{'content-type':'video/mp4','content-length':'100000'}});
 });
 assert.equal(result,'https://pixeldrain.com/api/file/test?download');assert.equal(calls.length,3);
});
test('Mega hanya ditampilkan bila metadata file dan nama video valid',async()=>{
 const full=Buffer.from(Array.from({length:32},(_,i)=>i));const key=full.toString('base64url');
 const aes=Buffer.alloc(16);for(let i=0;i<16;i++)aes[i]=full[i]^full[i+16];
 const plain=Buffer.from('MEGA'+JSON.stringify({n:'Episode 1.mp4'}));const padded=Buffer.alloc(Math.ceil(plain.length/16)*16);plain.copy(padded);
 const cipher=createCipheriv('aes-128-cbc',aes,Buffer.alloc(16));cipher.setAutoPadding(false);
 const at=Buffer.concat([cipher.update(padded),cipher.final()]).toString('base64url');
 const result=await verifyMegaDownload(`https://mega.nz/file/test#${key}`,async(url,init)=>{assert.equal(url,'https://g.api.mega.co.nz/cs');assert(!init.body.includes(key));return Response.json([{s:12345,at,g:'https://download.mega.co.nz/file'}])});
 assert.equal(result,`https://mega.nz/file/test#${key}`);
});
test('Mega hilang atau gagal diperiksa tidak dianggap file tersedia',async()=>{
 const url='https://mega.nz/file/test#'+Buffer.alloc(32).toString('base64url');
 assert.equal(await verifyMegaDownload(url,async()=>Response.json([-9])),null);
 assert.equal(await verifyMegaDownload(url,async()=>Response.json([-6])),null);
 assert.equal(await verifyMegaDownload('https://pixeldrain.com/u/test',async()=>assert.fail('Tidak boleh memeriksa provider selain Mega')),null);
});
