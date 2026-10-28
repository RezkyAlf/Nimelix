'use client';
import {useEffect,useRef,useState} from 'react';
import {Download,Film} from 'lucide-react';
import {MediaPlayer,MediaProvider,Gesture,type MediaPlayerInstance} from '@vidstack/react';
import {DefaultVideoLayout,defaultLayoutIcons} from '@vidstack/react/player/layouts/default';
export type DownloadGroup={format:string;resolution:string;links:{provider:string;url:string}[]};
type Props={episodeId:string;title:string;mirrors:{provider:string;quality:string}[];downloads:DownloadGroup[]};
type Playback={url:string;mode:'video'|'embed';provider:string;quality:string;server:number};
export default function EpisodePlayer({episodeId,title,mirrors,downloads}:Props){
 const video=useRef<MediaPlayerInstance>(null);
 const resume=useRef<{time:number;playing:boolean}|null>(null);
 const [speed,setSpeed]=useState(1);
 const [quality,setQuality]=useState(''),[server,setServer]=useState('-1');
 const [playback,setPlayback]=useState<Playback|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const [downloadOpen,setDownloadOpen]=useState(false),[group,setGroup]=useState('0'),[checking,setChecking]=useState(false),[downloadError,setDownloadError]=useState('');
 const [downloadLinks,setDownloadLinks]=useState<{provider:string;url:string}[]>([]);
 const [failures,setFailures]=useState<{key:string;ids:number[];urls:string[]}>({key:'',ids:[],urls:[]});const [canPlay,setCanPlay]=useState(false);
 const failureKey=`${episodeId}:${server}:${quality}:${retry}`;const failed=failures.key===failureKey?failures:{key:failureKey,ids:[],urls:[]};const exclusions=failed.ids.join(',');
 const qualities=Array.from(new Set(mirrors.map(m=>m.quality).filter(q=>/^\d{3,4}p$/.test(q)))).sort((a,b)=>parseInt(a)-parseInt(b));
 useEffect(()=>{const controller=new AbortController();setLoading(true);setPlayback(null);setError('');setCanPlay(false);
  const params=new URLSearchParams({episode:episodeId,server});if(quality)params.set('quality',quality);if(server==='-1'&&exclusions)params.set('exclude',exclusions);
  fetch('/api/playback?'+params,{signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error||'Pemutar tidak tersedia');if(!controller.signal.aborted){if(server==='-1'&&failed.urls.includes(data.url)){if(failed.ids.length>=8||failed.ids.includes(data.server))throw Error('Semua server alternatif sudah dicoba. Pilih server lain secara manual.');setFailures({key:failureKey,ids:[...failed.ids,data.server],urls:failed.urls});}else setPlayback(data)}}).catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});return()=>controller.abort();
 },[episodeId,server,quality,retry,exclusions]);
 useEffect(()=>{if(video.current)video.current.playbackRate=speed},[speed,playback?.url]);
 useEffect(()=>{if(!downloadOpen||!downloads.length)return;const controller=new AbortController();setChecking(true);setDownloadLinks([]);setDownloadError('');fetch('/api/downloads?'+new URLSearchParams({episode:episodeId,group}),{signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error);if(!controller.signal.aborted)setDownloadLinks(data.links)}).catch(e=>{if(!controller.signal.aborted)setDownloadError(e.message)}).finally(()=>{if(!controller.signal.aborted)setChecking(false)});return()=>controller.abort()},[downloadOpen,episodeId,group,downloads.length]);
 function failPlayback(message:string){
  if(server==='-1'&&playback&&Number.isInteger(playback.server)&&!failed.ids.includes(playback.server)&&failed.ids.length<8){remember();setPlayback(null);setLoading(true);setError('');setFailures({key:failureKey,ids:[...failed.ids,playback.server],urls:[...failed.urls,playback.url]});}
  else setError(message);
 }
 useEffect(()=>{if(!playback||playback.mode!=='video'||canPlay||error)return;const timer=setTimeout(()=>failPlayback('Video terlalu lama dimuat. Coba server lain.'),18000);return()=>clearTimeout(timer)},[playback,canPlay,error]);
 function remember(){if(video.current)resume.current={time:video.current.currentTime,playing:!video.current.paused};}
 const direct=playback?.mode==='video';
 const resolution=<select aria-label="Resolusi video" value={quality} onChange={e=>{remember();setQuality(e.target.value);setServer('-1')}}><option value="">Resolusi otomatis</option>{qualities.map(q=><option key={q} value={q}>{q}</option>)}</select>;
 return <div className="episode-player">
  <div className={`player custom-player ${direct?'direct-player':'embed-player'}`}>
   {playback&&!error?(direct?<MediaPlayer ref={video} className="nimelix-vidstack" title={title} src={{src:playback.url,type:'video/mp4'}} playsInline preload="metadata" loop={false} playbackRate={speed} onRateChange={rate=>setSpeed(rate)} onLoadedMetadata={()=>{setCanPlay(true);if(!video.current)return;const previous=resume.current;if(previous){video.current.currentTime=Math.min(previous.time,Number.isFinite(video.current.duration)?video.current.duration:previous.time);if(previous.playing)void video.current.play().catch(()=>{});resume.current=null}}} onCanPlay={()=>setCanPlay(true)} onError={()=>failPlayback('Video gagal dimuat. Semua cadangan sudah dicoba atau server dipilih manual.')}><MediaProvider/><Gesture className="nimelix-gesture gesture-all" event="pointerup" action="toggle:paused"/><Gesture className="nimelix-gesture gesture-left" event="dblpointerup" action="seek:-5"/><Gesture className="nimelix-gesture gesture-right" event="dblpointerup" action="seek:5"/><DefaultVideoLayout icons={defaultLayoutIcons} seekStep={5} noGestures noAudioGain playbackRates={[0.5,0.75,1,1.25,1.5,1.75,2]} slots={{afterSettingsMenu:resolution,downloadButton:null}}/></MediaPlayer>:<iframe src={playback.url} title={title} allow="fullscreen; autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen onError={()=>failPlayback('Pemutar gagal dimuat. Coba server lain.')} sandbox="allow-scripts allow-same-origin allow-presentation"/>):<div className="player-state" role="status"><Film size={42}/><h2>{loading?'Memuat pemutar...':'Video tidak tersedia dari sumber ini'}</h2><p>{loading?(failed.ids.length?'Server sebelumnya gagal. Mencoba server cadangan...':'Mencari server video yang tersedia.'):error}</p>{!loading&&<button className="button secondary" onClick={()=>setRetry(retry+1)}>Coba Lagi</button>}</div>}
   {!direct&&playback&&!error&&<div className="embed-resolution">{resolution}</div>}
  </div>
  <div className="player-below"><label>Server video<select aria-label="Server video" value={server} onChange={e=>{remember();setServer(e.target.value)}}><option value="-1">Otomatis</option>{mirrors.map((m,i)=>!quality||m.quality===quality?<option key={i} value={i}>{m.provider} {m.quality}</option>:null)}</select></label><button className="button secondary" aria-expanded={downloadOpen} aria-controls="download-anime" onClick={()=>setDownloadOpen(!downloadOpen)}><Download size={17}/> Download Anime</button>{playback&&<span className="active-provider" role="status">{playback.provider} {playback.quality}</span>}</div>
  {playback?.mode==='embed'&&server==='-1'&&<button className="button secondary" onClick={()=>failPlayback('Semua server alternatif sudah dicoba. Pilih server secara manual.')}>Video tidak muncul? Coba server berikutnya</button>}
  {playback&&direct&&<p className="player-note mobile-gesture-hint">Ketuk dua kali sisi kiri untuk mundur 5 detik, sisi kanan untuk maju 5 detik.</p>}
  {playback&&!direct&&<p className="player-note">Server ini memakai pemutar eksternal. Tombol waktu, loop, dan pengaturan warna di dalamnya dikelola penyedia. Untuk kontrol Nimelix lengkap diperlukan sumber video langsung.</p>}
  {downloadOpen&&<section className="download-panel" id="download-anime"><h2><Download size={20}/> Download Anime</h2>{downloads.length?<><label className="download-format">Format dan resolusi<select aria-label="Format unduhan" value={group} onChange={e=>setGroup(e.target.value)}>{downloads.map((g,i)=><option key={i} value={i}>{g.format} {g.resolution}</option>)}</select></label><div aria-live="polite">{checking?<p className="player-note">Memuat server unduhan...</p>:downloadError?<p className="player-note">{downloadError}</p>:downloadLinks.length?<><p className="player-note">Pilih server unduhan. Tautan dibuka di situs penyedia; ketersediaan file mengikuti sumber.</p><div className="verified-downloads">{downloadLinks.map((link,i)=><a key={i} className="button primary" href={link.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"><Download size={16}/>{link.provider}</a>)}</div></>:<p className="player-note">Belum ada server unduhan untuk pilihan ini. Coba format atau resolusi lain.</p>}</div></>:<p className="player-note">Sumber belum menyediakan tautan unduhan.</p>}</section>}
 </div>;
}
