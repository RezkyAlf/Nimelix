import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequestCache} from '../src/lib/request-cache.ts';

test('concurrent requests share one upstream request and reuse its result', async()=>{
 const cached=createRequestCache();let calls=0;
 const load=async()=>{calls++;return {title:'Anime'}};
 const [a,b]=await Promise.all([cached('same',1000,load),cached('same',1000,load)]);
 assert.equal(calls,1);assert.equal(a,b);
 await cached('same',1000,load);assert.equal(calls,1);
});
test('failed requests can be retried immediately', async()=>{
 const cached=createRequestCache();
 await assert.rejects(cached('retry',1000,async()=>{throw Error('offline')}));
 assert.equal(await cached('retry',1000,async()=> 'online'),'online');
});
test('expired results and least recently used entries are refreshed', async()=>{
 const cached=createRequestCache(2);let calls=0;
 const load=async()=>++calls;
 await cached('expired',0,load);await cached('expired',0,load);assert.equal(calls,2);
 await cached('a',1000,load);await cached('b',1000,load);
 await cached('a',1000,load);await cached('c',1000,load);
 assert.equal(await cached('b',1000,load),6);
});
