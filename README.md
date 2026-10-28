# Nimelix

Website anime berbahasa Indonesia dengan Next.js/TypeScript dan tampilan gelap merah. Katalog, pencarian, filter, genre, batch, episode, carousel, serta Daftar Saya di localStorage.

## Menjalankan

```sh
npm install
npm run api:setup
npm run dev
```

Pada PowerShell gunakan `npm.cmd` bila skrip npm dibatasi. Build Next.js: `npm run build`, kemudian `npm start`.

## Sumber data

Scraper Cheerio membaca HTML publik **https://www.animebatch.id/** beserta JSON yang disertakan pada halaman. Tidak menggunakan API anime pihak ketiga atau endpoint API internal situs sumber. Implementasi ada di `src/lib/animebatch-parser.ts` dan `src/lib/animebatch.ts`.

API internal Nimelix menggunakan prefix `/api/anime/animebatch/`: `catalog`, `search?q=...`, `ongoing`, `completed`, `batch`, `genre`, `genre/:slug`, `anime/:slug`, dan `episode/:id`. Pagination dan filter genre/status/format/tahun/sortir diteruskan ke halaman sumber. Satu halaman katalog tidak mengambil detail setiap judul satu per satu.

Scraper membatasi tiga pengambilan bersamaan, timeout 15 detik, dan HTML maksimal 6 MB. Cache proses dibatasi 96 entri; TTL katalog dua menit, detail lima menit, genre satu jam. Request identik digabung; kegagalan tidak disimpan. Cache tidak dibagi antar-instance. Batas katalog tetap 1.000 request/menit/IP per instance.

Daftar Saya tetap di localStorage browser. Favorit dari sumber lama membuka pencarian judul agar tidak menggunakan slug lama di sumber baru.

## Pemutar dan unduhan

Episode, OVA, movie, dan special berasal dari kelompok link pada halaman detail. Pilihan awal mengikuti AnimeBatch: kualitas **720p**, kemudian preferensi **BerkasDrive**, dengan urutan asli untuk nilai yang sama. Kualitas lain dan server hanya berasal dari link streaming sumber. Mengganti kualitas memilih link pertama pada kualitas tersebut. Tidak ada prioritas Mega atau perpindahan otomatis buatan Nimelix.

Pemutar dimulai dari poster dan tombol putar. Muat ulang kembali ke poster dengan pilihan server tetap. Video langsung memakai Vidstack; embed memakai iframe penyedia. Kontrol di dalam iframe mengikuti penyedia. Unduhan menampilkan tab per episode dan batch, format/kualitas, serta semua penyedia yang dicantumkan sumber. Link mode external hanya dipakai untuk unduhan.

URL pemutar dibatasi HTTPS dan allowlist berikut di `.env.local`, `cloudflare.config.ts`, serta `wrangler.jsonc`:

```dotenv
ALLOWED_STREAM_HOSTS=vsys-srv.berkasdrive.com,vsys-meledak.dlgan.my.id,www.blogger.com,filedon.co,odvidhide.com,video.sumantritelnologi.workers.dev
```

Wrapper player internal AnimeBatch membatasi iframe ke domain sendiri. Nimelix memakai URL embed penyedia yang memang tercantum dalam data publik sumber, tanpa memproksi atau menghapus pembatasan. Kebijakan frame diperiksa dan error ditampilkan jika penyedia menolak. Respons API sukses tidak menjamin file penyedia masih dapat diputar. Domain penyedia baru perlu ditinjau sebelum ditambahkan ke allowlist.

## Fitur lain

Navbar menyediakan Beranda, Anime, Batch, Genre, dan Cari Anime dari Gambar. Halaman genre memiliki tombol per genre, rekomendasi yang dimuat saat mendekati viewport, dan Lihat Semua. Pagination memakai kelompok lima halaman dan input nomor halaman. Hero berganti tiap lima detik, berhenti ketika kontrol mendapat fokus, tombol jeda aktif, tab tersembunyi, atau reduced motion aktif.

Pencarian gambar `/cari-gambar` menggunakan trace.moe melalui `/api/identify`. Mendukung JPG/PNG/WebP maksimal 8 MB; gambar tidak disimpan ke disk. Hasil mencakup kecocokan, judul, cuplikan, episode, dan pencarian katalog. Dokumentasi: https://soruly.github.io/trace.moe-api/ .

## Validasi

```sh
npm run typecheck
node --test tests/*.test.mjs
npm run api:check
npm run build
npm run build:pages
```

Setelah build vinext, jika tipe route Next.js perlu dibuat ulang, jalankan `npx next typegen` sebelum typecheck.

## Cloudflare Pages

Paket advanced mode menggabungkan SSR dan API dalam Worker; aset statis dikecualikan dari Functions. Pemutar, penjelajah genre, dan pencarian gambar dimuat dalam chunk terpisah. Build dan preview:

```sh
npm run build:pages
npm run preview:pages
```

Preview berada di http://localhost:8788. Deploy manual setelah memeriksa preview:

```sh
npx wrangler login
npm run deploy:pages
```

Konfigurasi proyek Pages bernama nimelix tersedia di `wrangler.jsonc`. Direct Upload tidak otomatis deploy dari GitHub. Jangan mengunggah `.env.local`, `.local`, atau seluruh folder proyek. Perubahan lokal belum dipublikasikan sampai perintah deploy dijalankan.

Validasi migrasi pada 29 Oktober 2026: typecheck, 27 tes, build Next.js, dan build Pages berhasil. Scraper live membaca 4.288 judul (24 per halaman), pencarian Kimetsu, genre Action halaman 2, serta 2.849 judul batch. Preview Cloudflare diuji di Chrome; Kimetsu episode 1 melalui BerkasDrive 720p berhasil memutar video dengan timeline maju. Pilihan kualitas, muat ulang, unduhan episode/batch, serta layout genre mobile diperiksa tanpa error JavaScript. Hasil satu episode tidak menjamin seluruh file penyedia tersedia. Belum diuji pada perangkat Android fisik dan belum deploy.

Perbaikan stabilitas hosting: request API browser dibatasi 20 detik per percobaan dan GET diulang sekali untuk kegagalan jaringan/500/502/503/504. Respons 429 tidak diulang. Bagian populer/batch memiliki loading dan error tersendiri; banner hanya menggunakan data populer dan tidak mengganti dengan katalog terbaru jika gagal. Beranda tidak lagi mengambil katalog terbaru yang tidak dipakai. Parser Flight membaca script JSON langsung tanpa membangun DOM untuk katalog/detail. Allowlist bawaan penyedia AnimeBatch tetap berlaku ketika environment hosting kosong atau masih berisi domain sumber lama; environment dapat menambahkan host lain.
