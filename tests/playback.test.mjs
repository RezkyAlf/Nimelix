import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedVideo,defaultServerIndex} from '../src/lib/playback.ts';
const mirror=(provider,quality)=>({id:'id',url:'https://filedon.co/embed/1',mode:'embed',provider,quality});
test('default matches source: 720p before provider preference and stable source order',()=>{
 assert.equal(defaultServerIndex([mirror('BerkasDrive','480p'),mirror('Other','720p'),mirror('BerkasDrive','720p'),mirror('BerkasDrive','720p')]),2);
 assert.equal(defaultServerIndex([mirror('Other','720p'),mirror('BerkasDrive','1080p')]),0);
 assert.equal(defaultServerIndex([mirror('Other','480p'),mirror('BerkasDrive','1080p')]),1);
 assert.equal(defaultServerIndex([]),-1);
});
test('video URL requires an exact allowed HTTPS host without credentials or custom ports',()=>{
 const hosts=['filedon.co'];
 for(const url of ['http://filedon.co/x','https://filedon.co.evil.test/x','https://u:p@filedon.co/x','https://filedon.co:8443/x'])assert.equal(allowedVideo(url,hosts),null);
 assert.equal(allowedVideo('https://filedon.co/embed/x',hosts),'https://filedon.co/embed/x');
});
