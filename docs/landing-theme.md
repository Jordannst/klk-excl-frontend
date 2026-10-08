# Tema landing page

Tema berlaku pada `/id`, `/en`, dan `/login`. Dashboard/workspace, dokumen invoice, video demo, dan gambar Open Graph tidak diganti temanya.

- Pengunjung baru mengikuti `prefers-color-scheme`, termasuk perubahan sistem saat halaman masih terbuka.
- Tombol matahari/bulan di navbar memilih terang/gelap. Pilihan disimpan dalam localStorage `klk_landing_theme`, terpisah dari cookie bahasa dan autentikasi.
- Tombol "Ikuti tema sistem" di footer menghapus pilihan manual. Perubahan pilihan disinkronkan ke tab landing lain pada origin yang sama.
- Script kecil di head landing menerapkan pilihan sebelum paint/hidrasi; CSS menyediakan fallback sistem jika JavaScript dinonaktifkan. Kegagalan akses storage tidak menghalangi pergantian tema pada halaman aktif, tetapi pilihan tidak dapat dipersistensikan.
- Warna memakai token yang dibatasi ke `html[data-landing]`. Halaman gelap menggunakan navy, teks terang, panel bertingkat, glow biru, serta logo dengan bagian navy yang disesuaikan kontrasnya. Rekaman demo tetap asli.
- Toggle berlabel Indonesia/Inggris, dapat dioperasikan lewat keyboard, memiliki fokus terlihat, dan menghormati reduced motion. Navbar mobile dipadatkan; pada layar paling sempit wordmark menampilkan KLK.
- Login memakai root layout tersendiri di `app/(auth)/login` untuk berbagi bootstrap dan token tema publik tanpa menerapkannya pada dashboard. URL `/login`, provider autentikasi, metadata noindex, dan perilaku login/reset tetap dipertahankan. Toggle dan tombol kembali ke sistem tersedia di atas form; form, ilustrasi, pesan status, dan dialog reset memakai warna tema yang sama.

Jalankan `npm run test:landing-themes` terhadap server lokal dengan `QA_BASE_URL`. Suite mencakup sistem terang/gelap, override/reload/pergantian bahasa, sinkronisasi tab, kembali ke sistem, 6 viewport dalam 2 bahasa, menu mobile, kontras teks utama, reduced motion, kesinambungan tema login dalam 5 viewport, dialog reset, isolasi workspace, storage diblokir, dan tanpa JavaScript. Screenshot dan hasil disimpan dalam `qa/landing/`.

## Animasi landing

Bagian di bawah layar muncul sekali dengan fade dan pergeseran 18 px; kartu fitur dan langkah kerja memiliki jeda bertahap. Navigasi menggunakan garis hover, ikon fitur bergerak ringan, dan preview dashboard terangkat sedikit pada perangkat dengan pointer. Semua menggunakan CSS dan IntersectionObserver bawaan browser tanpa dependensi baru.

Konten default tetap terlihat tanpa JavaScript. Observer hanya menyembunyikan bagian di bawah layar setelah aktif. Fokus keyboard tetap membuka konten; preferensi reduced motion menonaktifkan animasi, termasuk saat diubah ketika halaman terbuka. Jalankan `npm run test:landing-motion` untuk pemeriksaan perilakunya. Screenshot halaman penuh di suite visual menggunakan reduced motion agar seluruh konten tertangkap; perilaku scroll diuji terpisah.

## Verifikasi lokal 8 Oktober 2026

- Production build, TypeScript, lint berkas perubahan, dan seluruh suite browser lulus. Lint keseluruhan: 0 error, 38 warning lama.
- Tema: 6 kelompok pemeriksaan, termasuk override sebelum React dimuat dan sinkronisasi preferensi sistem saat hidrasi.
- Animasi: 3 kelompok; landing: 14 kelompok; regresi produk: 10 kelompok. Bahasa: 13 kasus deteksi dan 4 kelompok browser.
- Chromium lokal, desktop/mobile melalui emulasi viewport. API workspace menggunakan mock; PDF memakai generator backend di dalam proses. Bukan validasi produksi, browser lain, atau perangkat fisik.
