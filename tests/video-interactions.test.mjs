import test from 'node:test';
import assert from 'node:assert/strict';
import {createVideoTaps,seekTime,createLandscapeLock} from '../src/lib/video-interactions.ts';

test('double tap kanan/kiri seek tepat 5 detik tanpa single-tap atau fullscreen',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const actions=[];const taps=createVideoTaps(()=>actions.push('single'),delta=>actions.push(delta));
 taps.tap('right',0,'touch');taps.tap('right',180,'touch');t.mock.timers.tick(400);
 taps.tap('left',700,'touch');taps.tap('left',850,'touch');t.mock.timers.tick(400);
 assert.deepEqual(actions,[5,-5]);
});
test('single tap tertunda, sisi berbeda bukan double tap, reset membatalkan tap',t=>{
 t.mock.timers.enable({apis:['setTimeout']});const actions=[];
 const taps=createVideoTaps(pointer=>actions.push(pointer),delta=>actions.push(delta));
 taps.tap('left',0,'touch');t.mock.timers.tick(300);assert.deepEqual(actions,['touch']);
 taps.tap('left',500,'touch');taps.tap('right',600,'touch');t.mock.timers.tick(300);assert.deepEqual(actions,['touch','touch','touch']);
 taps.tap('right',1000,'touch');taps.reset();t.mock.timers.tick(500);assert.equal(actions.length,3);
});
test('seek dibatasi awal dan akhir video',()=>{
 assert.equal(seekTime(2,100,-5),0);assert.equal(seekTime(98,100,5),100);assert.equal(seekTime(10,Infinity,5),15);
});
test('fullscreen mengunci landscape lalu melepas orientasi saat keluar',async()=>{
 const calls=[];const lock=createLandscapeLock({lock:async value=>calls.push(value),unlock:()=>calls.push('unlock')});
 await lock.update(true);await lock.update(false);lock.dispose();assert.deepEqual(calls,['landscape','unlock']);
});
test('keluar fullscreen sebelum lock selesai tidak meninggalkan orientasi terkunci',async()=>{
 let resolve;const calls=[];const lock=createLandscapeLock({lock:()=>new Promise(r=>{resolve=r}),unlock:()=>calls.push('unlock')});
 const pending=lock.update(true);await lock.update(false);resolve();await pending;assert.deepEqual(calls,['unlock']);
});
test('browser yang menolak atau tidak mendukung orientation lock tetap aman',async()=>{
 const lock=createLandscapeLock({lock:async()=>{throw Error('NotSupportedError')},unlock:()=>assert.fail('Tidak memiliki lock')});
 await lock.update(true);lock.dispose();await createLandscapeLock(undefined).update(true);
});
