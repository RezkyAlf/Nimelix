import test from 'node:test';
import assert from 'node:assert/strict';
import {imageMime,mapSceneMatches} from '../src/lib/trace-moe.ts';
test('format gambar ditentukan dari isi file, bukan nama atau header saja',()=>{
 assert.equal(imageMime(Uint8Array.from([255,216,255])),'image/jpeg');
 assert.equal(imageMime(Uint8Array.from([137,80,78,71,13,10,26,10])),'image/png');
 assert.equal(imageMime(new TextEncoder().encode('RIFFxxxxWEBP')),'image/webp');
 assert.equal(imageMime(new TextEncoder().encode('<script>')) ,null);
});
test('hasil diurutkan, field opsional ditangani, dan URL eksternal tidak ditampilkan',()=>{
 const result=mapSceneMatches([{anilist:123,filename:'Episode.mp4',episode:null,similarity:.5,image:'https://evil.test/image',from:10,to:5},{anilist:{id:456,title:{romaji:'Judul Romaji',english:null}},similarity:.95,episode:[1,2],from:20,to:25,image:'https://api.trace.moe/image/test'}]);
 assert.equal(result[0].title,'Judul Romaji');assert.equal(result[0].episode,'1, 2');assert.equal(result[0].anilistId,456);assert.equal(result[1].image,null);assert.equal(result[1].episode,null);assert.equal(result[1].to,10);
});
test('skor di luar rentang dan struktur respons salah tidak diterima',()=>{
 assert.deepEqual(mapSceneMatches([{similarity:2},{similarity:NaN},{title:'missing'}]),[]);
 assert.throws(()=>mapSceneMatches({}));
});
