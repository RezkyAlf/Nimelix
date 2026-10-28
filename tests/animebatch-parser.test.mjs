import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCatalog,parseDetail,flightRecords,validSlug,episodeId,decodeEpisode,episodeKeys,streamingLinks,downloadGroups} from '../src/lib/animebatch-parser.ts';
const html=records=>`<script>self.__next_f.push(${JSON.stringify([1,records])})</script>`;
const link=(extra={})=>({id:'abc',kind:'episode',episode:1,mode:'embed',provider:'BerkasDrive',quality:'720p',url:'https://files.test/download/1',playUrl:'https://files.test/embed/1',filename:'Anime.mp4',...extra});
test('parses public Flight catalog and resolves UTF8 length-prefixed text without evaluating scripts',()=>{
 const text='Cerita 日本\nbaris dua';
 const records='a:T'+Buffer.byteLength(text).toString(16)+','+text+'0:'+JSON.stringify({initialData:{items:[{slug:'anime-1',title:'Judul',synopsis:['$a']}],total:1,page:1,pages:1},facets:{years:[2026]}})+'\n';
 const result=parseCatalog(html(records));assert.equal(result.items[0].synopsis[0],text);assert.equal(result.total,1);
 assert.equal(flightRecords('<script>self.__next_f.push(alert(1))</script>').size,0);
 assert.throws(()=>parseCatalog('<html>Unexpected HTML</html>'));
});
test('encoded Unicode slugs work while traversal and unsafe path delimiters are rejected',()=>{
 assert.equal(validSlug('star%e2%98%86twinkle-precure'),true);
 for(const slug of ['..','%2e%2e','abc%2fdef','abc%5cdef','abc?x=1','%zz'])assert.equal(validSlug(slug),false);
 assert.deepEqual(decodeEpisode(episodeId('test-anime','special:1.5')),{slug:'test-anime',key:'special:1.5'});
});
test('episode grouping preserves types; external downloads never become video mirrors',()=>{
 const links=[link(),link({id:'external',mode:'external'}),link({id:'movie',kind:'movie',episodeType:'movie'}),link({id:'batch',kind:'batch',filename:'Batch.zip'}),link({id:'ova',episodeType:'ova'})];
 const parsed=parseDetail(html('0:'+JSON.stringify({post:{slug:'anime',title:'Anime'},links})+'\n'),'anime');
 assert.deepEqual(episodeKeys(parsed.links),['episode:1','movie:1','ova:1']);
 assert.deepEqual(streamingLinks(parsed.links,'episode:1').map(l=>l.id),['abc']);
 assert.equal(downloadGroups(parsed.links).length,1);assert.equal(downloadGroups(parsed.links)[0].kind,'batch');
 assert.equal(downloadGroups(parsed.links,'episode:1').length,2);
 assert.throws(()=>parseDetail(html('0:{}\n'),'missing'));
});
