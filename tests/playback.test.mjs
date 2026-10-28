import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedVideo,selectPlayback} from '../src/lib/playback.ts';
const hosts=['www.blogger.com','odvidhide.com','mega.nz'];
const mirror=(provider,content)=>({provider,content,quality:'480p'});

test('URL pemutar menolak domain tiruan, protokol, port, dan jalur yang salah',()=>{
 for(const url of ['https://www.blogger.com.evil.test/video.g?token=test','http://odvidhide.com/embed/test','https://user:pass@odvidhide.com/embed/test','https://odvidhide.com:8443/embed/test','https://www.blogger.com/','https://mega.nz/file/test'])assert.equal(allowedVideo(url,hosts),null);
 assert.equal(allowedVideo('https://www.blogger.com/video.g?token=test',hosts),'https://www.blogger.com/video.g?token=test');
});
test('server utama yang didukung tidak melakukan request mirror',async()=>{
 const result=await selectPlayback({defaultStreamingUrl:'https://www.blogger.com/video.g?token=test',mirrors:[]},-1,hosts,async()=>{assert.fail('Mirror tidak diperlukan')});
 assert.equal(result.server,-1);
});
test('otomatis beralih dari server terlarang dan mirror offline ke mirror yang didukung',async()=>{
 const calls=[];
 const result=await selectPlayback({defaultStreamingUrl:'https://desustream.net/dstream/test',mirrors:[mirror('blogs','aaaaaaaa'),mirror('mega','bbbbbbbb')]},-1,hosts,async token=>{calls.push(token);if(token==='aaaaaaaa')throw Error('offline');return {url:'https://mega.nz/embed/test',embeddable:true}});
 assert.deepEqual(calls,['aaaaaaaa','bbbbbbbb']);assert.equal(result.provider,'mega');assert.equal(result.server,1);
});
test('larangan embed dari sumber tetap dihormati',async()=>{
 const result=await selectPlayback({defaultStreamingUrl:'',mirrors:[mirror('vidhide','aaaaaaaa')]},-1,hosts,async()=>({url:'https://odvidhide.com/embed/test',embeddable:false}));
 assert.equal(result,null);
});
test('pilihan manual tidak diam-diam diganti dengan server lain',async()=>{
 const result=await selectPlayback({defaultStreamingUrl:'',mirrors:[mirror('vidhide','aaaaaaaa')]},0,hosts,async()=>({url:'https://unknown.test/embed/test',embeddable:true}));
 assert.equal(result,null);
});
test('pilihan resolusi memakai mirror yang sesuai walaupun server utama tersedia',async()=>{
 const calls=[];
 const details={defaultStreamingUrl:'https://www.blogger.com/video.g?token=test',mirrors:[{...mirror('vidhide','aaaaaaaa'),quality:'360p'},mirror('vidhide','bbbbbbbb')]};
 const result=await selectPlayback(details,-1,hosts,async token=>{calls.push(token);return {url:'https://odvidhide.com/embed/test',embeddable:true}},'480p');
 assert.deepEqual(calls,['bbbbbbbb']);assert.equal(result.quality,'480p');assert.equal(result.server,1);
});
test('resolusi yang tidak disediakan tidak diganti dengan resolusi lain',async()=>{
 const result=await selectPlayback({defaultStreamingUrl:'https://www.blogger.com/video.g?token=test',mirrors:[mirror('vidhide','aaaaaaaa')]},-1,hosts,async()=>assert.fail('Mirror tidak sesuai kualitas'),'1080p');
 assert.equal(result,null);
});
test('sumber Pixeldrain dibatasi ke endpoint file langsung',()=>{
 const allowed=[...hosts,'pixeldrain.com'];
 assert.equal(allowedVideo('https://pixeldrain.com/u/test',allowed),null);
 assert.equal(allowedVideo('https://pixeldrain.com/api/file/test/info',allowed),null);
 assert.equal(allowedVideo('https://pixeldrain.com/api/file/test',allowed),'https://pixeldrain.com/api/file/test');
});
test('server yang gagal di browser dilewati dan Mega diprioritaskan',async()=>{
 const details={defaultStreamingUrl:'https://www.blogger.com/video.g?token=test',mirrors:[mirror('vidhide','aaaaaaaa'),mirror('mega','bbbbbbbb')]};
 const calls=[];const result=await selectPlayback(details,-1,hosts,async token=>{calls.push(token);return {url:token==='bbbbbbbb'?'https://mega.nz/embed/test':'https://odvidhide.com/embed/test',embeddable:true}},'',[-2,-1]);
 assert.deepEqual(calls,['bbbbbbbb']);assert.equal(result.server,1);
 const next=await selectPlayback(details,-1,hosts,async token=>{assert.equal(token,'aaaaaaaa');return {url:'https://odvidhide.com/embed/test',embeddable:true}},'',[-2,-1,1]);
 assert.equal(next.server,0);
});
test('cadangan habis tidak mengulang server yang gagal',async()=>{
 const result=await selectPlayback({defaultStreamingUrl:'https://www.blogger.com/video.g?token=test',mirrors:[mirror('mega','aaaaaaaa')]},-1,hosts,async()=>assert.fail('Tidak boleh mencoba server yang sama'),'',[-2,-1,0]);
 assert.equal(result,null);
});
