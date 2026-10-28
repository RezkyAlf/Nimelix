# Design Specification — Nimelix

> Versi 1.0 · Bahasa Indonesia · Website katalog dan pemutar anime bergaya Netflix

## 1. Tujuan
Membangun website anime yang responsif, cepat, dan nyaman digunakan, dengan pengalaman visual *dark cinematic* terinspirasi Netflix (tanpa menyalin logo, aset, atau identitas mereknya). Konten dan metadata anime diperoleh melalui [wajik-anime-api](https://github.com/wajik45/wajik-anime-api). Fitur utama: pencarian, kategori, filter, rekomendasi, ongoing, completed, terbaru, detail anime, dan pemutaran episode apabila sumber menyediakan URL streaming yang sah dan dapat diputar.

## 2. Catatan penting mengenai API
- Repositori menjelaskan API sebagai **unofficial** dan menyebut sumber Otakudesu, Kuramanime, dan Oploverz. Domain sumber dapat berubah. Periksa izin penggunaan, hak cipta, serta legalitas distribusi/pemutaran sebelum meluncurkan layanan publik.
- Dokumentasi README memastikan pola `/{sumber}` dan contoh `GET /otakudesu/ongoing?page=1`, dengan respons `data.animeList` dan `pagination`. Endpoint lainnya **jangan diasumsikan**; inspeksi respons indeks masing-masing sumber dan kode rute API sebelum mengimplementasikan pencarian, completed, detail, episode, genre, dan streaming.
- API bisa dijalankan lokal menggunakan Node.js 20 atau >=22, `npm install`, `npm run dev`; README menyebut `http://localhost:3001`.
- Rekomendasi awal bisa berupa pilihan editorial dari katalog yang tersedia, bukan mengklaim endpoint rekomendasi bawaan.

## 3. Pengguna dan alur utama
1. Pengunjung membuka beranda dan melihat anime unggulan serta baris rekomendasi, ongoing, completed, dan terbaru.
2. Pengunjung mencari judul melalui search dengan debounce; membuka hasil dan memfilter genre/status bila metadata tersedia.
3. Pengunjung memilih poster → halaman detail → daftar episode → pemutar video.
4. Pengunjung melanjutkan tontonan terakhir dari penyimpanan lokal (opsional untuk MVP).

## 4. Identitas visual
**Nama resmi website:** **Nimelix**. Gunakan nama ini secara konsisten pada logo, navbar, judul tab browser, metadata SEO, dan footer.

- **Wordmark:** `NIMELIX` dengan tipografi bold modern, warna putih dan aksen merah pada elemen pilihan; buat identitas orisinal, bukan meniru logo Netflix.
- **Tagline opsional:** *Dunia Anime, Satu Tempat.*

| Token | Nilai | Pemakaian |
|---|---|---|
| Background utama | `#0B0B0F` | Latar halaman |
| Surface | `#17171D` | Card, dropdown |
| Surface hover | `#24242D` | Card aktif |
| Primary | `#E50914` | Tombol Play, fokus, CTA |
| Text utama | `#F5F5F7` | Judul |
| Text sekunder | `#A5A5B0` | Metadata |
| Border | `#303039` | Pemisah |
| Success | `#22C55E` | Status selesai (bila perlu) |

- Tipografi: **Inter** atau **Plus Jakarta Sans**; judul hero tebal, body mudah dibaca.
- Radius: 12 px card, 8 px tombol; bayangan lembut; gradient hitam pada banner.
- Spasi: skala 4/8/12/16/24/32/48/64 px.
- Gunakan poster dari API dengan `object-fit: cover`, lazy loading, skeleton, dan fallback.
- Animasi hover 150–220 ms, dengan `prefers-reduced-motion` dihormati.

## 5. Layout global
### Desktop (>=1024 px)
- Navbar fixed/transparan di atas hero, berubah menjadi surface gelap saat scroll.
- Kiri: logo; tengah: Beranda, Anime, Ongoing, Completed, Terbaru, Genre; kanan: Search dan Daftar Saya (opsional).
- Hero lebar layar, tinggi sekitar 65–75vh, dengan overlay gelap dan tombol **Tonton Sekarang** / **Lihat Detail**.
- Baris poster horizontal dengan tombol panah, 5–7 card terlihat tergantung lebar.
- Footer: informasi sumber, kebijakan konten, dan disclaimer.

### Tablet (768–1023 px)
- Navbar lebih ringkas; 3–4 card per baris; filter dalam popover.

### Mobile (<768 px)
- Hero tinggi sekitar 50–60vh, teks ringkas, CTA mudah ditekan.
- 2–2,5 card terlihat pada carousel horizontal; dukung swipe.
- Navigasi menu hamburger atau bottom navigation; search mudah diakses.
- Filter menjadi bottom sheet; area sentuh minimal 44×44 px.

## 6. Halaman dan komponen

### 6.1 Beranda `/`
Urutan konten:
1. **Hero featured anime:** 1–5 judul unggulan; gambar latar, judul, sinopsis pendek jika tersedia, label status, CTA.
2. **Rekomendasi Untukmu:** kurasi editorial/deterministik dari katalog yang berhasil diambil; tidak mengklaim personalisasi bila belum ada data pengguna.
3. **Sedang Tayang / Ongoing:** episode terbaru, hari rilis jika tersedia.
4. **Anime Completed:** serial yang sudah selesai.
5. **Anime Terbaru:** urut tanggal rilis/update yang benar-benar disediakan sumber; jika tidak ada tanggal yang dapat dibandingkan, gunakan urutan API dan label 'Update terbaru'.
6. **Jelajahi Genre:** chip genre yang dapat diklik, hanya jika metadata genre tersedia.

### 6.2 Jelajahi Anime `/anime`
- Grid poster dengan pagination atau Load More.
- Filter: genre, status (ongoing/completed), tahun, urutan; **tampilkan hanya filter yang datanya tersedia dan dapat diproses dengan benar**.
- URL menyimpan state: `?q=...&genre=...&status=...&page=...`.
- Tombol Reset Filter; empty state dengan saran pencarian lain.

### 6.3 Pencarian `/search?q=...`
- Input dengan debounce 300–400 ms, tombol hapus, Enter untuk submit.
- Hasil berupa grid dengan poster, judul, status, jumlah episode bila ada.
- Jika API mendukung search, gunakan endpoint tersebut; jika tidak, jelaskan keterbatasan dan gunakan pencarian pada katalog yang telah dimuat, **jangan mengklaim mencakup semua judul**.
- Tangani salah ketik ringan di frontend hanya jika data mencukupi.

### 6.4 Detail anime `/anime/[source]/[animeId]`
- Banner/poster, judul, sinopsis, genre, status, jumlah episode, tahun, studio/rating **jika tersedia**.
- CTA Tonton Episode 1 / Lanjutkan.
- Daftar episode dengan nomor, judul dan tanggal jika tersedia; urutan jelas; pagination untuk serial panjang.
- Anime terkait berdasarkan genre atau fallback editorial.
- `source` dan `animeId` dikodekan aman dalam URL; jangan mengandalkan slug sebagai ID universal.

### 6.5 Pemutar `/watch/[source]/[episodeId]`
- Pemutar responsif rasio 16:9, fullscreen, kontrol play/pause, volume, seek, subtitle bila tersedia, kualitas dan pilihan server bila disediakan API.
- Episode sebelumnya/berikutnya, kembali ke detail, indikator loading, dan pesan error jika sumber tidak tersedia.
- Jika URL berupa embed, gunakan iframe hanya untuk domain yang diizinkan; jika HLS legal tersedia, gunakan player HLS; jika tidak ada sumber yang valid, tampilkan pesan jelas, **jangan membuat URL video fiktif**.
- Simpan progress lokal jika teknis dan izin pemutar memungkinkan.

## 7. Komponen UI reusable
`Navbar`, `MobileNavigation`, `HeroBanner`, `AnimeCard`, `AnimeCarousel`, `SectionHeading`, `GenreChips`, `SearchBox`, `FilterPanel`, `Pagination`, `AnimeMetadata`, `EpisodeList`, `VideoPlayer`, `SkeletonCard`, `EmptyState`, `ErrorState`, `Footer`.

**AnimeCard:** poster 2:3, judul maksimal 2 baris, badge status/episode bila tersedia; hover desktop memperbesar sedikit dan menampilkan CTA; mobile memakai tap untuk membuka detail.

## 8. Tech stack yang disarankan
- **Next.js (App Router) + TypeScript** untuk routing, SEO, server rendering dan BFF/proxy.
- **Tailwind CSS** untuk styling dan token tema.
- **TanStack Query** untuk cache/fetch interaktif pada sisi klien bila diperlukan.
- **Zod** untuk validasi respons API yang dapat berubah.
- **Lucide React** untuk ikon.
- **HLS.js** hanya jika sumber video menyediakan HLS yang dapat digunakan secara sah.
- Tidak perlu database untuk MVP; gunakan `localStorage` untuk watchlist/progress lokal bila fitur diaktifkan. Database dan autentikasi bisa ditambahkan nanti.

## 9. Arsitektur integrasi
```text
Browser (Next.js UI)
   │
   └── Next.js Route Handlers / Server Components (BFF)
          ├── validasi parameter & normalisasi respons
          ├── timeout, retry terbatas, cache
          └── Wajik Anime API (self-hosted / URL terkonfigurasi)
                 └── sumber anime eksternal
```

- Simpan `ANIME_API_BASE_URL` di environment server; jangan hardcode alamat lokal untuk deployment.
- Proxy/BFF mengurangi masalah CORS dan memusatkan transformasi data, tetapi **bukan** cara menghindari kontrol akses atau pembatasan sumber.
- Konfigurasi sumber: `otakudesu`, `kuramanime`, `oploverz` hanya jika rute dan hasilnya terbukti berfungsi.
- Gunakan timeout 8–12 detik, cache singkat 5–15 menit untuk daftar, dan fallback per-section agar satu sumber gagal tidak menjatuhkan seluruh beranda.
- Lindungi endpoint dari SSRF: hanya base URL API yang dikonfigurasi; validasi source/ID, batasi panjang query dan laju permintaan.

### Contoh endpoint yang terverifikasi di README
```http
GET http://localhost:3001/otakudesu/ongoing?page=1
```
Contoh bentuk data:
```json
{
  "statusCode": 200,
  "data": {
    "animeList": [
      {
        "title": "Judul anime",
        "poster": "https://example.com/poster.jpg",
        "episodes": "11",
        "animeId": "anime-slug",
        "latestReleaseDate": "05 Jan",
        "releaseDay": "Jum'at"
      }
    ]
  },
  "pagination": {
    "currentPage": 1,
    "hasNextPage": true,
    "nextPage": 2
  }
}
```
`example.com` di atas hanya ilustrasi struktur respons, bukan URL aset nyata.

### Model internal yang dinormalisasi
```ts
type Anime = {
  id: string;
  source: string;
  title: string;
  posterUrl: string | null;
  synopsis?: string;
  status?: 'ongoing' | 'completed' | 'unknown';
  genres?: string[];
  episodesCount?: number;
  latestReleaseDate?: string;
  releaseDay?: string;
};
```
Field opsional tidak boleh diisi dengan data rekaan. Gabungkan identitas dengan `source:id` agar judul sama dari sumber berbeda tidak bertabrakan.

## 10. Struktur folder
```text
src/
  app/
    page.tsx
    anime/page.tsx
    anime/[source]/[animeId]/page.tsx
    search/page.tsx
    ongoing/page.tsx
    completed/page.tsx
    latest/page.tsx
    watch/[source]/[episodeId]/page.tsx
    api/anime/[...path]/route.ts
    layout.tsx
    globals.css
  components/
    layout/
    anime/
    search/
    player/
    ui/
  lib/
    anime-api.ts
    adapters/
    schemas/
    utils.ts
  hooks/
  types/
public/
  images/
```

## 11. Aksesibilitas dan performa
- Kontras teks minimal WCAG AA; keyboard navigation, fokus terlihat, label input, alt text poster.
- Jangan mengandalkan warna saja untuk status; tampilkan teks Ongoing/Completed.
- Gunakan image optimization hanya untuk host gambar yang dikonfigurasi; fallback bila host tidak kompatibel.
- Lazy-load baris di bawah fold, batasi request paralel, cache katalog, dan hindari autoplay video bersuara.
- Metadata SEO dinamis per anime; sitemap hanya untuk konten yang benar-benar terindeks.

## 12. State dan error
- Loading: skeleton hero dan card.
- Empty: pesan 'Anime tidak ditemukan' + reset filter.
- API timeout/offline: tombol Coba Lagi; baris beranda lain tetap muncul.
- Poster rusak: placeholder dengan ikon dan judul.
- Stream tidak tersedia: pesan 'Video tidak tersedia dari sumber ini' + navigasi kembali.
- API mengubah skema: log kesalahan adapter dan jangan membuat UI crash.

## 13. Tahapan implementasi
**Fase 0 — Audit API:** jalankan API, inspeksi indeks sumber dan route aktual, dokumentasikan endpoint serta respons search, completed, detail, episode, genre, stream. Periksa hak penggunaan konten.

**Fase 1 — MVP:** setup Next.js, tema, navbar, beranda, daftar ongoing, katalog, detail anime, pencarian yang benar-benar didukung, loading/error states, mobile responsive.

**Fase 2 — Katalog lengkap:** completed, terbaru, genre/filter, rekomendasi editorial, pagination, sumber alternatif.

**Fase 3 — Playback:** player hanya setelah endpoint dan hak pemutaran diverifikasi, episode navigation, pilihan server/kualitas bila tersedia.

**Fase 4 — Personal:** watchlist, lanjutkan menonton, histori lokal, optimasi SEO/performa, pengujian lintas perangkat.

## 14. Kriteria penerimaan
- Beranda memuat hero dan section Rekomendasi, Ongoing, Completed, Terbaru jika datanya tersedia; kegagalan section tidak merusak halaman lain.
- Search dan filter menampilkan hasil yang konsisten, bisa di-reset, dan state tersimpan di URL.
- Detail anime menggunakan data aktual API, bukan placeholder permanen.
- Semua poster memiliki fallback; halaman berfungsi pada lebar 360 px, tablet, dan desktop.
- Player hanya memuat sumber yang valid/diizinkan; error tidak menyebabkan blank screen.
- Tidak ada endpoint, rating, tanggal, genre, atau rekomendasi personal yang diklaim tersedia tanpa verifikasi.
- Semua kontrol utama bisa digunakan dengan keyboard dan layar sentuh.

## 15. Referensi
- Repositori dan dokumentasi: https://github.com/wajik45/wajik-anime-api
- Catatan desain: 'terinspirasi Netflix' berarti pola pengalaman UI, bukan penggunaan logo, identitas merek, atau aset milik Netflix.
