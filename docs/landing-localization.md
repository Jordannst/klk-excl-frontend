# Bahasa landing page

Lingkup: halaman pemasaran KLK Invoice dalam Bahasa Indonesia dan Inggris. Login, dashboard, tanda tangan, storage, trash, API, dokumen invoice, dan video tidak diterjemahkan.

## Routing dan preferensi

- `/id` dan `/en` adalah HTML statis dengan atribut `html lang`, canonical, hreflang, metadata sosial, dan gambar Open Graph masing-masing. Satu komponen landing dan kamus terjemahan menjaga struktur visual tetap sama.
- `/` mengirim redirect sementara 307. Prioritas: cookie pilihan manual `klk_landing_locale`, negara dari header platform `x-vercel-ip-country`, kemudian preferensi browser `Accept-Language` berdasarkan bobot. Negara ID memilih Indonesia; negara lain memilih Inggris. Negara tidak tersedia/XX tidak dianggap sebagai lokasi luar Indonesia. Jika bahasa yang didukung tidak ditemukan, gunakan Inggris.
- URL bahasa eksplisit selalu dihormati. Parameter query pada `/` diteruskan ke tujuan. Tidak ada pengalihan bahasa pada route aplikasi atau API.
- ID/EN di navbar menyimpan pilihan selama 365 hari pada cookie first-party dengan SameSite=Lax, Path=/, dan Secure pada HTTPS. Pilihan disimpan hanya saat tombol bahasa digunakan. Tanpa JavaScript, tautan bahasa tetap berfungsi, tetapi preferensi tidak disimpan.
- Redirect otomatis menggunakan `Cache-Control: private, no-store` dan Vary agar keputusan satu pengunjung tidak tersimpan untuk pengunjung lain. Halaman statis tidak membaca cookie atau lokasi.
- Deteksi negara membutuhkan header yang disediakan hosting (Vercel). Tidak ada layanan pencarian IP eksternal atau permintaan izin GPS. Saat lokal/tanpa header, gunakan bahasa browser.

## Batas visual dan produk

Copy pemasaran Inggris ditulis manual, termasuk label aksesibilitas. Ilustrasi dashboard tetap menunjukkan UI produk Indonesia dengan penjelasan dalam bahasa halaman. Video tetap asli; caption Inggris menjelaskan bahasa rekaman dan branding lama. Roadmap AI tetap diberi label rencana, bukan fitur tersedia.

Root layout dipisahkan antara landing berparameter bahasa dan workspace Indonesia. Font, CSS global, dan metadata dasar dibagikan melalui `app/shared-document.tsx`. Providers autentikasi dipasang pada workspace dan root login terpisah; landing tetap tanpa provider autentikasi.

## Pemeriksaan

```powershell
$env:QA_BASE_URL='http://127.0.0.1:3101'
npm run build
npm run lint
npm run test:landing-locales
npm run test:landing
npm run test:product
```

Suite locale memeriksa prioritas deteksi, q-value, input tidak valid, cache, metadata/OG, pilihan manual dan reload, tautan aplikasi Indonesia, 404, navigasi tanpa JavaScript, serta viewport 320–1920px. Header negara disimulasikan secara lokal; ini tidak membuktikan geolokasi dari deployment hosting. API login dalam tes browser dimock; tidak melakukan reset atau mutasi akun nyata.

Hasil lokal 8 Oktober 2026: build PASS (kedua landing diprerender), typecheck PASS, lint penuh 0 error/38 warning lama, lint berkas perubahan 0 error/0 warning. Suite locale PASS (13 skenario deteksi dan pemeriksaan kedua bahasa), landing/routing 14 kelompok PASS, produk 10 kelompok PASS. Screenshot desktop/mobile dan gambar sosial Inggris diperiksa. Bukti: `qa/landing/locale-results.json`, `locale-en-390.png`, `locale-en-1440.png`, serta laporan regresi yang sudah ada. Header publik domain menunjukkan server Vercel; geolokasi setelah deployment belum diuji.
