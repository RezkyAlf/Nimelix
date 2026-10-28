export function seekTime(current:number,duration:number,delta:number){
 const end=Number.isFinite(duration)&&duration>=0?duration:Infinity;
 return Math.max(0,Math.min(end,(Number.isFinite(current)?current:0)+delta));
}

export function createVideoTaps(single:(pointer:string)=>void,seek:(delta:number)=>void){
 let pending:{side:'left'|'right';at:number;pointer:string}|null=null;
 let timer:ReturnType<typeof setTimeout>|undefined;
 function reset(){clearTimeout(timer);timer=undefined;pending=null}
 return {
  tap(side:'left'|'right',at:number,pointer:string){
   if(pending&&pending.side===side&&pending.pointer===pointer&&at-pending.at>=0&&at-pending.at<=300){reset();seek(side==='right'?5:-5);return}
   if(pending)single(pending.pointer);
   reset();pending={side,at,pointer};timer=setTimeout(()=>{const tap=pending;reset();if(tap)single(tap.pointer)},300);
  },
  reset,
 };
}

type Orientation={lock?:(orientation:'landscape')=>Promise<void>;unlock?:()=>void};
export function createLandscapeLock(orientation:Orientation|undefined){
 let active=false,owned=false;
 function unlock(){if(owned){owned=false;try{orientation?.unlock?.()}catch{}}}
 return {
  async update(fullscreen:boolean){
   active=fullscreen;
   if(!active){unlock();return}
   if(!orientation?.lock||owned)return;
   try{await orientation.lock('landscape');owned=true;if(!active)unlock()}catch{/* Unsupported browsers retain their normal orientation. */}
  },
  dispose(){active=false;unlock()},
 };
}
