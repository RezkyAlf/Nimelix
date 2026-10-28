# Nimelix

Website anime berbahasa Indonesia dengan Next.js App Router dan TypeScript. Katalog, pencarian, detail, episode, carousel, pagination bernomor, serta Daftar Saya di localStorage.

## Menjalankan

```sh
npm install
npm run dev
```

Buka http://localhost:3000. Pada PowerShell yang membatasi skrip, gunakan `npm.cmd`. Produksi: `npm run build`, kemudian `npm start`.

## API aktif

Menggunakan **rizkyhaksono/otakudesu-be**, menggantikan wajik-anime-api. Source: https://github.com/rizkyhaksono/otakudesu-be.

`.env.local` sudah dikonfigurasi:

```dotenv
ANIME_API_BASE_URL=https://api.otakudesu.natee.my.id/api/v1/anime
ALLOWED_STREAM_HOSTS=www.blogger.com,odvidhide.com,mega.nz,pixeldrain.com
```

`ANIME_API_BASE_URL` harus menunjuk ke prefix `/api/v1/anime`, termasuk bila memakai deployment sendiri. `npm run api:setup` mengatur deployment publik tersebut pada Windows, tanpa menjalankan server API lama. `npm run api:check` memeriksa koneksi. Website tidak lagi membutuhkan API lokal port 3001. Folder `.local` hanya menyimpan arsip/source audit lama, bukan runtime aktif.

Restart website setelah mengubah environment. Deployment publik dapat membatasi permintaan atau mengalami gangguan; UI menampilkan pesan dan tombol coba lagi. Tanpa base URL, katalog pratinjau 32 judul tetap tersedia.

## Adapter

`src/lib/otakudesu-api.ts` memetakan respons API baru ke model UI. Prefix BFF `/api/anime/otakudesu` dipertahankan agar tautan detail dan watchlist yang sudah tersimpan tetap berlaku.

| Fitur | Endpoint upstream |
| --- | --- |
| Katalog A–Z | `/list` |
| Sedang tayang | `/ongoing/:page` |
| Selesai | `/complete/:page` |
| Pencarian | `/search/:keyword` |
| Detail | `/detail/:slug` |
| Episode | `/episode/:slug` |
| Resolusi server | `/mirror?content=...` |

Halaman Anime menggunakan seluruh direktori A–Z, bukan ongoing. Pagination lokal 24 judul per halaman; poster/metadata diambil dari detail dengan maksimal tiga request bersamaan dan cache. Jika detail salah satu judul gagal, judul dari direktori tetap tersedia dengan fallback poster. Filter genre berlaku pada halaman yang sudah dimuat; pencarian menggunakan endpoint pencarian sumber. Terbaru mengikuti urutan ongoing, tanpa tanggal rekaan.

## Pemutar

Frontend mengirim ID episode dan indeks server ke `/api/playback`; URL video diambil kembali di server dari API tepercaya. Pilihan Otomatis memakai server utama jika didukung, kemudian mencoba maksimal empat penyedia mirror berbeda bila domain utama tidak didukung. Server yang terpilih ditampilkan di UI. URL HTTPS hanya ditampilkan jika hostname persis cocok dengan `ALLOWED_STREAM_HOSTS`. Blogger dibatasi ke `/video.g` dengan token; Mega ke `/embed/`. Domain Vidhide yang telah diperiksa adalah `odvidhide.com`. Desustream melarang embed pada origin Nimelix dan tidak ditambahkan ke daftar domain. Mirror yang melaporkan `embeddable: false` tidak dimuat; pembatasan embed penyedia tetap dihormati. Pilihan server tersedia sesuai metadata episode, namun domain yang belum diizinkan tetap ditolak. Pastikan izin penggunaan konten sebelum mengaktifkan domain tambahan atau meluncurkan layanan publik.

Resolusi video dipilih dari metadata aktual API. Pilihan server Otomatis memprioritaskan file MP4 Pdrain yang lolos verifikasi pada kualitas terpilih; bila file langsung tidak tersedia, pilihan embed tetap dicoba. Request byte-range file uji menghasilkan HTTP 206 dengan MIME video/mp4. Pemutaran interaktif browser tetap belum diverifikasi.

Pemutar sumber video langsung kini memakai `@vidstack/react` (Vidstack) dengan DefaultVideoLayout, seekStep 5 detik, gesture kiri/kanan seek 5 detik, serta pilihan resolusi API pada slot kontrol. Vidstack memiliki kontrol di dalam video: putar/jeda, maju/mundur 5 detik, timeline, suara, resolusi, kecepatan 0.5x sampai 2x, dan layar penuh. Ketuk dua kali pada sisi kiri/kanan video native untuk mundur/maju 5 detik; gerakan geser diabaikan. Ketukan tunggal memakai jeda pendek agar double-tap tidak ikut mengubah play/pause. Kecepatan dipertahankan saat mengganti resolusi. Tidak ada loop, reset, kecerahan, kontras, atau saturasi. Posisi native dipertahankan saat mengganti resolusi bila memungkinkan. Server dan tombol Download berada di bawah video. Kontrol internal iframe pihak ketiga tidak bisa dihapus atau diubah oleh Nimelix; resolusi Nimelix ditampilkan sebagai overlay untuk mode embed.

Panel unduhan menampilkan semua server yang disediakan API untuk format/resolusi terpilih, termasuk Mega dan penyedia lain bila tersedia. Link HTTPS dideduplikasi dan dibuka di situs penyedia; ketersediaan file mengikuti sumber.

HLS, progress tontonan persisten, dan subtitle eksternal belum diimplementasikan.

## Validasi

```sh
npm run typecheck
npm run build
npm run api:check
node --test tests/playback.test.mjs tests/downloads.test.mjs
```

Migrasi diverifikasi melalui endpoint live untuk katalog, ongoing, completed, pencarian, detail, dan episode pada 28 Oktober 2026. Jumlah judul dan halaman mengikuti sumber dan dapat berubah. Pemutaran interaktif browser belum diverifikasi.

Poster pratinjau berasal dari MyAnimeList; hero menggunakan poster dari katalog API. Daftar sumber poster tersimpan di `public/images/posters/SOURCES.md` dan `src/lib/preview-extra.json`. Hak cipta tetap milik pemegang hak masing-masing.

Mode Otomatis juga menangani error pemuatan video native di browser. Kandidat yang gagal dikirim sebagai daftar pengecualian; API tidak mengulang kandidat tersebut. Pemutar mencoba maksimal delapan kandidat per konfigurasi episode/server/resolusi dan melewati URL yang sama. Timeout 18 detik berlaku saat metadata native belum dimuat. Metadata yang berhasil dimuat menghentikan timeout agar video yang belum ditekan Play tidak dianggap gagal. Mega diprioritaskan di antara mirror setelah Blogger. Pergantian resolusi/server atau Coba Lagi memulai percobaan baru. Error video internal iframe tidak dapat dibaca lintas origin; tombol coba server berikutnya disediakan untuk kondisi tersebut.

Vidstack hanya dipakai untuk media langsung yang didukung library. Embed Mega/Blogger/Vidhide tetap diputar dalam iframe penyedia karena bukan URL MP4/HLS langsung; mode fallback dan pengecualian server gagal tetap aktif. Paket Vidstack 1.15.7 dipasang sesuai permintaan; upstream menandainya deprecated dan menyarankan Video.js 10 untuk migrasi mendatang.

Hero beranda memakai hingga lima anime pertama dari katalog. Poster, judul, dan tautan berganti setiap lima detik; tersedia tombol sebelumnya/berikutnya, indikator slide, dan jeda. Rotasi berhenti saat hover/fokus, tab tersembunyi, atau preferensi reduced motion aktif. Poster berikutnya dipramuat, dan gambar gagal menggunakan fallback lokal.

## Cari anime dari gambar

Halaman `/cari-gambar` tersedia di navbar sebagai Cari Anime dari Gambar. Unggah, drag-and-drop, atau tempel screenshot JPG/PNG/WebP maksimal 8 MB, lalu tekan Cari Anime. Gambar diteruskan sebagai POST binary ke `https://api.trace.moe/search?anilistInfo&cutBorders=1` dan tidak ditulis ke disk oleh Nimelix. Validasi signature file, pembatasan ukuran stream, satu request aktif, timeout, dan error kuota ditangani di BFF `/api/identify`. Tidak membutuhkan API key.

Hasil memuat judul, kemiripan, episode bila tersedia, timestamp, preview gambar/cuplikannya, tautan AniList, dan pencarian judul di katalog Nimelix. Skor di bawah 90% diberi catatan kemungkinan tidak cocok; hasil bukan jaminan identifikasi. Dokumentasi: https://soruly.github.io/trace.moe-api/ ; source: https://github.com/soruly/trace.moe . Perhatikan ketentuan trace.moe jika akan dipakai secara komersial.

Pengujian live menggunakan gambar contoh resmi dokumentasi menghasilkan 10 hasil dan kecocokan teratas 99,2%. Jalankan `node --test tests/trace-moe.test.mjs` untuk validasi normalisasi dan jenis gambar. Interaksi upload/drag/paste di browser belum diuji langsung.

## Halaman Genre

Menu navbar: Beranda, Anime, Terbaru, Genre, Cari Anime dari Gambar. `/genre` adalah halaman khusus, terpisah dari filter katalog Anime. Genre diambil dari endpoint `/genres`; setiap genre mempunyai tombol navigasi sendiri serta baris rekomendasi hingga enam judul dari urutan katalog genre. Bagian rekomendasi dimuat ketika mendekati viewport, dengan maksimal tiga request aktif.

Tombol Lihat Semua dan tombol genre membuka `/genre/[slug]`, menggunakan endpoint `/genres/:slug?page=...`, dengan pagination kelompok lima halaman dan input lompat halaman. State page tersimpan pada URL. Hasil bukan rekomendasi personal. Kegagalan satu baris dapat dicoba ulang tanpa mematikan baris lain. Pengujian live Action/Comedy/Fantasy berhasil, masing-masing mengembalikan 15 judul pada halaman pertama; jumlah genre saat pemeriksaan 36.
