import type { Metadata } from 'next';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import './globals.css';
export const metadata: Metadata = {title:'Nimelix - Dunia Anime, Satu Tempat',description:'Jelajahi anime pilihan dan simpan favoritmu di Nimelix.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
