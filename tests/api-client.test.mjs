import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchApiJson} from '../src/lib/api-client.ts';

test('HTML hosting failure is retried once without cache and valid JSON is returned',async()=>{
 let calls=0;
 const result=await fetchApiJson('/api/catalog',{},async(_,init)=>{
  calls++;if(calls===1)return new Response('<!DOCTYPE html>Error 1102',{status:500,headers:{'Content-Type':'text/html'}});
  assert.equal(init.cache,'no-store');return Response.json({data:{animeList:[]}});
 });
 assert.equal(calls,2);assert.deepEqual(result.data,{data:{animeList:[]}});
});
test('persistent HTML and malformed JSON show a friendly message without raw parse errors',async()=>{
 for(const response of [()=>new Response('<!DOCTYPE html>gateway error',{headers:{'Content-Type':'text/html'}}),()=>new Response('{invalid',{headers:{'Content-Type':'application/json'}})]){
  let calls=0;await assert.rejects(fetchApiJson('/api/catalog',{},async()=>{calls++;return response()}),{message:'Data belum dapat dimuat dari server. Silakan coba lagi.'});assert.equal(calls,2);
 }
});
test('JSON API errors keep their status and error message for existing UI handling',async()=>{
 let calls=0;const result=await fetchApiJson('/api/catalog',{},async()=>{calls++;return Response.json({error:'Situs sumber sedang tidak tersedia.'},{status:502})});
 assert.equal(result.response.status,502);assert.equal(result.data.error,'Situs sumber sedang tidak tersedia.');assert.equal(calls,1);
});
test('forbidden responses and POST requests are not automatically repeated',async()=>{
 for(const [init,status] of [[{},403],[{method:'POST'},503]]){
  let calls=0;await assert.rejects(fetchApiJson('/api/catalog',init,async()=>{calls++;return new Response('HTML error',{status})}));assert.equal(calls,1);
 }
});
test('aborted requests are never retried',async()=>{
 const controller=new AbortController();let calls=0;
 await assert.rejects(fetchApiJson('/api/catalog',{signal:controller.signal},async()=>{calls++;controller.abort();throw new DOMException('Aborted','AbortError')}),{name:'AbortError'});assert.equal(calls,1);
});
