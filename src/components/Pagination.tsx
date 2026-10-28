'use client';
import {useState} from 'react';
import {ChevronLeft,ChevronRight,ChevronsLeft,ChevronsRight} from 'lucide-react';
type Props={current:number;total:number;disabled?:boolean;onChange:(page:number)=>void};
export default function Pagination({current,total,disabled=false,onChange}:Props){
 const [target,setTarget]=useState('');
 const start=Math.floor((current-1)/5)*5+1;
 const end=Math.min(total,start+4);
 const pages=Array.from({length:end-start+1},(_,i)=>start+i);
 return <nav className="pagination grouped-pagination" aria-label="Navigasi halaman katalog">
  <span className="page-summary" aria-live="polite">Halaman {current} dari {total}</span>
  <div className="pagination-pages">{pages.map(page=><button key={page} type="button" disabled={disabled} className={page===current?'current':''} aria-label={`Halaman ${page}`} aria-current={page===current?'page':undefined} onClick={()=>onChange(page)}>{page}</button>)}</div>
  <div className="pagination-navigation">
   <button type="button" disabled={disabled||start===1} onClick={()=>onChange(Math.max(1,start-5))} aria-label="Kelompok 5 halaman sebelumnya"><ChevronsLeft size={17}/><span>5 halaman</span></button>
   <button type="button" disabled={disabled||current===1} onClick={()=>onChange(current-1)}><ChevronLeft size={17}/><span>Sebelumnya</span></button>
   <button type="button" disabled={disabled||current>=total} onClick={()=>onChange(current+1)}><span>Berikutnya</span><ChevronRight size={17}/></button>
   <button type="button" disabled={disabled||end>=total} onClick={()=>onChange(end+1)} aria-label="Kelompok 5 halaman berikutnya"><span>5 halaman</span><ChevronsRight size={17}/></button>
  </div>
  <form className="pagination-jump" onSubmit={event=>{event.preventDefault();const page=Number(target);if(Number.isInteger(page)&&page>=1&&page<=total){onChange(page);setTarget('')}}}>
   <label htmlFor="pagination-target">Ke halaman</label><input id="pagination-target" type="number" inputMode="numeric" min={1} max={total} step={1} required value={target} disabled={disabled} placeholder={`1–${total}`} onChange={event=>setTarget(event.target.value)}/><button type="submit" disabled={disabled}>Tuju <ChevronRight size={15}/></button>
  </form>
 </nav>;
}
