import type { Metadata } from 'next';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import './globals.css';
export const metadata: Metadata = {
 metadataBase:new URL('https://nimelix.pages.dev'),
 title:'Nimelix - Dunia Anime, Satu Tempat',
 description:'Jelajahi anime pilihan dan simpan favoritmu di Nimelix.',
 openGraph:{type:'website',locale:'id_ID',siteName:'Nimelix',title:'Nimelix - Dunia Anime, Satu Tempat',description:'Jelajahi anime pilihan dan simpan favoritmu di Nimelix.',images:[{url:'/images/share-preview-v3.png',width:1200,height:1200,alt:'Logo Nimelix'}]},
 twitter:{card:'summary',title:'Nimelix - Dunia Anime, Satu Tempat',description:'Jelajahi anime pilihan dan simpan favoritmu di Nimelix.',images:['/images/share-preview-v3.png']},
};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
