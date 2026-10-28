'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Play,Pause,Info,Plus,Check,ChevronLeft,ChevronRight} from 'lucide-react';
import type {Anime} from '../lib/catalog';
type Props={anime:Anime[];saved:Anime[];onSave:(anime:Anime)=>void;preview:boolean;loading:boolean};
export default function HeroBanner({anime,saved,onSave,preview,loading}:Props){
 const slides=anime.slice(0,5);
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[interacting,setInteracting]=useState(false),[reduced,setReduced]=useState(false),[visible,setVisible]=useState(true);
 const active=index%Math.max(1,slides.length),featured=slides[active];
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const motion=()=>setReduced(media.matches),visibility=()=>setVisible(!document.hidden);motion();visibility();media.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);return()=>{media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility)}},[]);
 useEffect(()=>{if(paused||interacting||reduced||!visible||slides.length<2)return;const timer=setTimeout(()=>setIndex(i=>(i+1)%slides.length),5000);return()=>clearTimeout(timer)},[active,paused,interacting,reduced,visible,slides.length]);
 const nextPoster=slides[(active+1)%Math.max(1,slides.length)]?.poster;
 useEffect(()=>{if(!nextPoster)return;const image=new Image();image.src=nextPoster;return()=>{image.onload=null;image.onerror=null}},[nextPoster]);
 function move(offset:number){setIndex((active+offset+slides.length)%slides.length)}
 function fallback(event:React.SyntheticEvent<HTMLImageElement>){if(!event.currentTarget.src.endsWith('/poster.svg'))event.currentTarget.src='/poster.svg'}
 if(!featured)return <section className="hero hero-carousel hero-loading" aria-busy={loading}><div className="skeleton hero-loading-poster"/><p>{loading?'Memuat anime unggulan...':'Anime unggulan belum tersedia.'}</p></section>;
 const href=`/anime/${featured.source}/${encodeURIComponent(featured.id)}`;
 const isSaved=saved.some(a=>a.source===featured.source&&a.id===featured.id);
 return <section className="hero hero-carousel" role="region" aria-roledescription="carousel" aria-label="Anime unggulan" onMouseEnter={()=>setInteracting(true)} onMouseLeave={()=>setInteracting(false)} onFocusCapture={()=>setInteracting(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setInteracting(false)}}>
  <img key={`back-${featured.source}:${featured.id}`} className="hero-backdrop" src={featured.poster||'/poster.svg'} alt="" aria-hidden="true" onError={fallback}/><div className="hero-vignette"/>
  <div className="hero-content" key={`text-${featured.source}:${featured.id}`}><div className="featured-label"><span/> {preview?'KATALOG PRATINJAU':'PILIHAN NIMELIX'} <span className="label-line"/> CERITA YANG BERKESAN</div><span className="hero-overline">DUNIA ANIME, SATU TEMPAT</span><h1>{featured.title}</h1><div className="hero-meta"><span className="outline-tag">ANIME</span>{featured.status&&<span>{featured.status}</span>}{featured.genres.slice(0,2).map(genre=><span key={genre}>{genre}</span>)}<span>Subtitle Indonesia</span></div><p>{featured.synopsis||'Temukan cerita baru, dunia yang menakjubkan, dan petualangan yang layak kamu ikuti.'}</p><div className="hero-buttons"><Link className="button primary" href={href}><Play size={19} fill="currentColor"/> Jelajahi Anime</Link><Link className="button secondary" href={href}><Info size={19}/> Lihat Detail</Link><button className="round-button" onClick={()=>onSave(featured)} aria-label={isSaved?'Hapus anime unggulan dari daftar':'Simpan anime unggulan'}>{isSaved?<Check/>:<Plus/>}</button></div></div>
  <Link className="hero-poster-link" href={href} aria-label={`Lihat detail ${featured.title}`}><img key={`poster-${featured.source}:${featured.id}`} className="hero-featured-poster" src={featured.poster||'/poster.svg'} alt={featured.title} fetchPriority={active===0?'high':'auto'} onError={fallback}/><span>Lihat cerita selengkapnya <ChevronRight size={15}/></span></Link>
  <div className="hero-bottom"><span><b>{String(active+1).padStart(2,'0')}</b> / {String(slides.length).padStart(2,'0')}</span><div className="hero-slide-dots" aria-label="Pilih anime unggulan">{slides.map((a,i)=><button key={a.source+a.id} aria-label={`Tampilkan ${a.title}`} aria-current={i===active?'true':undefined} className={i===active?'active':''} onClick={()=>setIndex(i)}><span/></button>)}</div><div className="hero-slide-controls"><button aria-label="Anime sebelumnya" onClick={()=>move(-1)} disabled={slides.length<2}><ChevronLeft size={19}/></button><button aria-label={paused?'Lanjutkan pergantian poster':'Jeda pergantian poster'} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={17}/>:<Pause size={17}/>}</button><button aria-label="Anime berikutnya" onClick={()=>move(1)} disabled={slides.length<2}><ChevronRight size={19}/></button></div></div>
 </section>;
}
