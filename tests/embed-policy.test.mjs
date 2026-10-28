import test from 'node:test';
import assert from 'node:assert/strict';
import {permitsFrame,inspectFrame} from '../src/lib/embed-policy.ts';
const source='https://desustream.net/dstream/player';
const csp="frame-ancestors 'self' https://otakudesu.blog https://*.otakudesu.blog https://desustream.net;";
test('source policy permits Otakudesu but explicitly rejects Nimelix',()=>{
 const headers=new Headers({'Content-Security-Policy':csp});
 assert.equal(permitsFrame(headers,source,'https://otakudesu.blog'),true);
 assert.equal(permitsFrame(headers,source,'https://nimelix.pages.dev'),false);
 assert.equal(permitsFrame(headers,source,'https://otakudesu.blog.evil.test'),false);
});
test('wildcards require the actual subdomain and scheme',()=>{
 const headers=new Headers({'Content-Security-Policy':'frame-ancestors https://*.example.com'});
 assert.equal(permitsFrame(headers,source,'https://a.example.com'),true);
 assert.equal(permitsFrame(headers,source,'http://a.example.com'),false);
 assert.equal(permitsFrame(headers,source,'https://example.com'),false);
});
test('X-Frame-Options and multiple CSP policies are respected',()=>{
 assert.equal(permitsFrame(new Headers({'X-Frame-Options':'DENY'}),source,'https://nimelix.pages.dev'),false);
 assert.equal(permitsFrame(new Headers({'X-Frame-Options':'SAMEORIGIN'}),source,'https://desustream.net'),true);
 assert.equal(permitsFrame(new Headers({'Content-Security-Policy':"frame-ancestors *, frame-ancestors 'self'"}),source,'https://nimelix.pages.dev'),false);
 assert.equal(permitsFrame(new Headers({'Content-Security-Policy':"frame-ancestors 'none'"}),source,'https://desustream.net'),false);
});
test('an HTTP 200 with a restrictive frame policy is blocked rather than playable',async()=>{
 assert.equal(await inspectFrame(source,'https://nimelix.pages.dev',async()=>new Response('',{headers:{'Content-Security-Policy':csp}})),'blocked');
 assert.equal(await inspectFrame(source,'https://otakudesu.blog',async()=>new Response('',{headers:{'Content-Security-Policy':csp}})),'allowed');
});
test('missing pages, redirects, and network errors have separate outcomes',async()=>{
 assert.equal(await inspectFrame(source,'https://nimelix.pages.dev',async()=>new Response('',{status:404})),'missing');
 assert.equal(await inspectFrame(source,'https://nimelix.pages.dev',async(_,init)=>{assert.equal(init.redirect,'manual');return new Response('',{status:302,headers:{Location:'https://unknown.test'}})}),'unknown');
 assert.equal(await inspectFrame(source,'https://nimelix.pages.dev',async()=>{throw Error('offline')}),'unknown');
});
