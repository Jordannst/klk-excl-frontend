# Halaman masuk langsung

Landing page dihapus pada 9 Oktober 2026. `/` mengirim redirect 307 ke `/login`, termasuk parameter query. Bookmark `/id` dan `/en` juga diarahkan ke login; pilihan bahasa lama tidak memengaruhi tujuan. Halaman marketing, gambar Open Graph per bahasa, dan sitemap landing tidak lagi disajikan.

Login mempertahankan branding, panel, tema sistem/manual, dan reset dengan private key. Tombol kembali ke landing dihapus. Key penyimpanan tema `klk_landing_theme` dan atribut tema lama dipertahankan agar preferensi pengunjung tidak hilang. Dashboard dan route aplikasi tetap memiliki autentikasi yang sama; tidak ada perubahan backend atau data.

Pemeriksaan: `npm run build`, `npm run lint`, `npm run test:auth`, `npm run test:themes`, dan `npm run test:product`. Set `QA_BASE_URL=http://127.0.0.1:3101` untuk browser checks. API dalam tes dimock; tes tidak melakukan login/reset atau mutasi data produksi.

Dokumen `landing-*.md` adalah catatan implementasi terdahulu, bukan perilaku aplikasi saat ini.
