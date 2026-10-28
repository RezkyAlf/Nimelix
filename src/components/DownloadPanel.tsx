'use client';
import {useState} from 'react';
import {Download} from 'lucide-react';
import type {DownloadGroup} from '../lib/animebatch-parser';
export default function DownloadPanel({groups}:{groups:DownloadGroup[]}){
 const [open,setOpen]=useState(false),[kind,setKind]=useState<'episode'|'batch'>(groups.some(g=>g.kind==='episode')?'episode':'batch');
 const [selected,setSelected]=useState(0);const visible=groups.filter(g=>g.kind===kind);const current=visible[Math.min(selected,Math.max(0,visible.length-1))];
 return <section className="download-panel" id="downloads"><button className="button secondary" aria-expanded={open} onClick={()=>setOpen(!open)}><Download size={18}/> Pilihan unduhan</button>{open&&<>
  <div className="download-tabs" role="tablist" aria-label="Jenis unduhan">{(['episode','batch'] as const).map(value=><button key={value} role="tab" aria-selected={kind===value} className={kind===value?'selected':''} onClick={()=>{setKind(value);setSelected(0)}}>{value==='batch'?'Batch':'Per episode'} <small>{groups.filter(g=>g.kind===value).length}</small></button>)}</div>
  {visible.length?<><label className="download-format">Format dan kualitas<select value={Math.min(selected,visible.length-1)} onChange={e=>setSelected(Number(e.target.value))}>{visible.map((g,i)=><option key={i} value={i}>{g.format} {g.resolution}</option>)}</select></label><p className="player-note">Tautan dibuka di situs penyedia sesuai pilihan sumber.</p><div className="verified-downloads">{current?.links.map((link,i)=><a key={link.url+i} className="button secondary" href={link.url} target="_blank" rel="noopener noreferrer"><Download size={15}/>{link.provider}</a>)}</div></>:<p className="player-note">Belum ada unduhan {kind==='batch'?'batch':'per episode'} untuk pilihan ini.</p>}
 </>}</section>;
}
