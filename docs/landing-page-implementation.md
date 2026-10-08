# KLK Invoice — Landing page & product identity

Tanggal: 8 Oktober 2026. Repo frontend: `C:\projects\klk\frontend`.
Baseline: `ef12067b657894249cacbd28944c5bca36dec645`. Perubahan lokal, belum commit/push/PR/deploy.

## Hasil

Landing publik menggunakan arah Clean Enterprise SaaS: kanvas putih, electric blue, Instrument Sans yang sudah tersedia, grid/ruang kosong yang konsisten, ilustrasi dashboard berdata contoh, dan video demo di bawah fitur. Seluruh copy pemasaran berbahasa Indonesia. Login memakai identitas KLK Invoice yang sama. Logo/favikon dan gambar social sharing baru disertakan.

Konten statis memakai Server Components. Animasi hanya CSS untuk kemunculan hero dan hover; header sticky, reduced motion, skip link, navigasi mobile native, dan video controls tersedia. Video tidak autoplay dan menggunakan `preload="none"` serta poster. Tidak ada dependency produk baru.

Fitur yang ditampilkan ditelusuri ke ExpeditionForm, InvoiceHistory, TransaksiSearch, TransactionTable, PrintInvoiceModal, signature hooks/API, dan trash hooks/API. Tidak ada metrik pelanggan, testimonial, status pembayaran, signup, trial, kontak, atau dokumen legal fiktif. Claude API, penyesuaian template/branding lanjutan, dan dukungan banyak perusahaan diberi label roadmap, belum tersedia.

## Routing dan batas perubahan

| Route | Perilaku |
|---|---|
| `/` | Landing publik statis; nol request API dalam browser check |
| `/login` | Login publik; sesi aktif diarahkan ke `/dashboard` |
| `/dashboard` | Dashboard lama, tetap dibungkus ProtectedRoute |
| `/signatures`, `/storage`, `/trash` | URL dan proteksi sebelumnya dipertahankan |

`app/(workspace)/layout.tsx` menampung Providers, Toaster, dan NavigationProgress. Root layout tidak lagi memuat AuthProvider. Route group tidak mengubah URL. Root hanya memiliki canonical homepage; halaman aplikasi diberi noindex/nofollow. Sitemap hanya memuat homepage. Robots tidak menghalangi crawler membaca noindex halaman aplikasi; `/api/` dilarang di-crawl. Robots bukan kontrol akses.

Logika dashboard/signatures/storage/trash tetap sama dengan baseline; hanya berpindah lokasi dan menghapus whitespace di akhir dua baris dashboard. Redirect login dan link dashboard/Navbar diperbarui. Navbar menggunakan identitas produk dan menu tablet hingga 1280px; menu mobile juga menyediakan Invoice Baru. Customer-specific branding pada dokumen invoice tetap utuh. Tidak mengubah API proxy, konfigurasi cookies/session, endpoint backend, database, environment, atau deployment.

Dialog lupa password memakai native dialog untuk semantik modal, navigasi keyboard, dan Escape. Autentikasi login tetap; perbaikan lanjutan reset menggabungkan private key, password baru, dan konfirmasi dalam satu formulir. Request reset hanya dikirim saat konfirmasi final, tanpa password sementara.

## Aset video

Disalin dari `C:\projects\aboutme-2026\dev-folio\public\videos\klk-showcase-720p60.mp4` dengan poster di folder images yang sama.

- Video: 3.674.107 byte, 1280×720, 60fps, 20 detik tanpa audio; playback terverifikasi.
- SHA-256: `CB88B9DA1F3143D4A1A283719D9F763E1D3176F705E52BAF315A37AFA7321A33`.
- Hash sama dengan output showcase lokal, yang source fixture/capture dan laporannya tersedia di `videos/klk-hover-showcase`: nama/transaksi fiktif, API mock, informasi perusahaan sensitif diburamkan. Poster diperiksa visual. Ini bukan audit manual ulang seluruh frame video.
- Caption halaman menyebut data contoh dan identitas visual sebelumnya; rekaman hijau/branding lama dipertahankan sesuai video yang diberikan pengguna.

## File dibuat/diubah

- `app/page.tsx`: landing publik, section fitur/demo/workflow/roadmap/tentang/CTA/footer.
- `components/marketing/ProductPreview.tsx`, `marketing.module.css`: ilustrasi produk dan style terisolasi.
- `components/ProductBrand.tsx`, `ProductBrand.module.css`: identitas produk bersama.
- `app/layout.tsx`: metadata global, OG/Twitter, font dan root layout publik.
- `app/(workspace)/layout.tsx`: provider khusus aplikasi, noindex.
- `app/(workspace)/dashboard/page.tsx`: dashboard dipindahkan dari root; `layout.tsx` memberi judul halaman.
- `app/(workspace)/login/page.tsx`, `login.module.css`: login dipindahkan dan direbrand; `layout.tsx` memberi judul halaman.
- `app/(workspace)/signatures/page.tsx`, `storage/page.tsx`, `trash/page.tsx`: perpindahan tanpa perubahan source.
- `components/Navbar.tsx`, `ProtectedRoute.tsx`: link/redirect dashboard, branding dan menu responsif.
- `app/robots.ts`, `app/sitemap.ts`: indexing dan sitemap publik.
- `app/favicon.ico`, `public/icon.svg`, `public/social-preview.png`: aset identitas/SEO.
- `public/media/klk-demo.mp4`, `klk-demo-poster.jpg`: video yang diberikan pengguna.
- `scripts/landing.check.cjs`, `scripts/product-regression.check.cjs`: regresi browser terisolasi.
- `qa/landing/`: screenshot, log build/lint/typecheck, hasil JSON browser.
- Dokumen ini: hasil dan batas verifikasi.

## Verifikasi final

Browser dijalankan terhadap **production build lokal di `http://127.0.0.1:3101`**, bukan deployment. Fixture/mock tidak membuktikan database, autentikasi backend nyata, atau persistensi cookies nyata.

| Pemeriksaan | Hasil |
|---|---|
| `npm run build` | PASS; seluruh route berhasil diprerender |
| `npx tsc --noEmit` | PASS; cache route lama diregenerasi |
| ESLint file implementasi dan harness baru | PASS, tanpa warning |
| `npm run lint` penuh | PASS: 0 error, 38 warning lama termasuk salinan worktree lokal |
| Browser landing/routing | 14 kelompok PASS, `qa/landing/browser-results.json` |
| Browser fitur produk | 10 kelompok PASS, `qa/landing/product-results.json` |
| `tests/security.test.tsx` | 2 tes PASS: escaping/XSS pada InvoiceDocument dan TransactionDocument |
| Backend `pdf-service.check.ts` | PASS |
| Backend `pdf-route.check.ts` | PASS, server lokal temporer tanpa database |
| Review independen | Perpindahan halaman identik; temuan overflow dan hilangnya aksi Invoice Baru pada tablet diperbaiki dan diuji |

Browser smoke mencakup nol request API di landing, anchors/CTA, metadata/asset HTTP 200, lebar 320/390/768/1024/1440/1920 tanpa overflow, reduced motion, skip link, navigasi seluler, proteksi empat route sebelum business fetch, error dan sukses login, redirect sesi aktif, recheck saat reload, navbar tablet, logout, serta tanpa runtime pageerror. Dialog diuji open/Escape dan keyboard tidak berpindah ke kontrol aplikasi di belakang dialog; native browser dapat memindahkan fokus ke browser chrome.

Browser produk mencakup entry dan perhitungan minimum berat, tiga transaksi/total payload, simpan invoice, pratinjau PDF, request filter tanggal, pencarian STT dan pemilihan invoice, Invoice Baru melalui menu tablet, menggambar/menyimpan tanda tangan, restore sampah, dan playback video. API dimock; PDF benar-benar dihasilkan oleh service backend in-process. Assertions PDF mencakup signature `%PDF`, ukuran, payload dan iframe, bukan audit layout seluruh halaman PDF. Filter dicek request bertanggalnya, bukan kebenaran query database.

Playwright terdaftar sebagai devDependency frontend; fixture dan mock berada di `scripts/fixtures/`. Tes landing berjalan dari checkout frontend. Tes produk juga membutuhkan checkout backend dengan dependensi terpasang di `../backend` (atau path absolut melalui `BACKEND_DIR`) untuk generator PDF in-process. Tidak membutuhkan proyek video, server backend, atau database untuk dua suite mock ini. Belum menjadi job CI.

Contoh menjalankan ulang dari folder frontend (server harus sudah aktif):

```powershell
npm ci
npx playwright install chromium
$env:QA_BASE_URL='http://127.0.0.1:3101'
npm run test:landing
npm run test:product
```

Backend `test:local` penuh kini PASS, termasuk pencarian transaksi pada PostgreSQL disposable. Integrasi nyata (8 kelompok PASS, `qa/landing/integration-results.json`) memakai Next production build port 3102, Express mode production port 4311, dan PostgreSQL 17 port 55439, database `klk_release_qa`, role `klk_qa`. Identitas database, port, role, dan data directory diverifikasi sebelum mutasi. Akun sementara qa-release; tanpa akun admin atau private key asli. Browser memverifikasi login gagal/sukses, cookie HttpOnly/Secure melalui proxy, refresh, reload, redirect, simpan invoice, PDF, search, undo/hapus/unmount, signature, restore, storage, dan logout. Tidak ada API mock pada suite ini. Backend/cluster QA sudah dihentikan; preview 3101 dipulihkan. Reset nyata diuji sendiri oleh pengguna; pada 8 Oktober 2026 pengguna mengonfirmasi "reset password pass". Hasil manual ini merupakan laporan pengguna, bukan pengujian agent.

## Batasan dan keputusan rilis

**Pemeriksaan otomatis lokal PASS; pengguna mengonfirmasi reset manual PASS pada 8 Oktober 2026 dan syarat untuk push ke main telah terpenuhi.**

1. Bug reset password diperbaiki: private key tetap digunakan, tetapi hanya dikirim bersama password baru saat pengguna menekan Simpan Password Baru. Input kosong/pendek/tidak cocok dicegah; pembatalan tidak mengirim request; respons key salah dan gangguan jaringan ditampilkan; pengiriman ulang dan penutupan dialog dicegah saat request berlangsung. Regresi browser menggunakan API mock.
2. Error lint TransactionTable diperbaiki dengan memperbarui ref callback di layout effect, bukan saat render. Browser memverifikasi undo, delayed delete, kegagalan API yang mengembalikan baris, dan commit tepat sekali saat unmount. Lint penuh kini lolos dengan 38 warning lama.
3. Auth/cookies, refresh, search DB dan persistensi telah diverifikasi pada backend lokal dengan database terisolasi. Reset memakai key pengguna dinyatakan PASS oleh pengguna. CI/deployment, browser Safari, dan infrastruktur produksi belum diuji.
4. Tidak menjalankan audit WCAG otomatis lengkap, Lighthouse/performance benchmark, Safari/iOS, atau perangkat fisik. Pemeriksaan visual menggunakan Chromium desktop dan emulasi viewport.
5. Kontak `hello@klkinvoice.my.id` ditambahkan ke footer sesuai instruksi pengguna, dengan tautan mailto. Penerimaan email tidak diuji. Dokumen privasi publik belum tersedia sehingga tautannya tidak dibuat.
6. Preview memakai identitas biru baru; antarmuka aplikasi utama tetap memakai tema operasional sebelumnya selain Navbar. Video lama diberi caption eksplisit.

Screenshot final: `qa/landing/desktop.png`, `mobile.png`, `login-desktop.png`, `login-mobile.png`.

## Logo yang dipilih

Pengguna memilih opsi 03, Lembar Berlapis. Simbol lembar biru/navy dan celah putih digambar ulang sebagai SVG pada ProductBrand dan public/icon.svg. Favicon ICO dan social-preview.png diekspor dari simbol yang sama. Wordmark tetap memakai font website. Referensi pilihan disimpan di docs/brand/logo-option-03-reference.png. Komponen bersama memperbarui landing, login, Navbar aplikasi, footer, serta ilustrasi dashboard. Rekaman video lama dan branding pada dokumen pelanggan tetap dipertahankan.
