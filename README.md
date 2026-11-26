# KLK Frontend

Antarmuka web untuk aplikasi manajemen invoice dan transaksi ekspedisi.

## Tentang Aplikasi

Aplikasi ini merupakan dashboard untuk mengelola invoice dan transaksi pengiriman barang. Dibangun untuk keperluan operasional internal perusahaan ekspedisi dengan fokus pada kemudahan penggunaan dan efisiensi kerja.

## Fitur Utama

- Dashboard manajemen invoice
- Form input transaksi dengan autocomplete
- Pencarian dan filter data berdasarkan tanggal
- Cetak dan ekspor invoice ke PDF
- Manajemen tanda tangan digital
- Sistem trash dengan soft delete

## Tech Stack

- Next.js 16 dengan App Router
- React 19
- TypeScript
- TailwindCSS
- TanStack Query untuk state management
- Axios untuk HTTP client

## Pemeriksaan lokal

Gunakan Node.js 24. Jalankan `npm ci`, `npm run lint`, `npm test`, dan `npm run build` untuk mengulang pemeriksaan CI.

`eslint-suppressions.json` mencatat 16 temuan lama `react-hooks/set-state-in-effect` pada sembilan file. ESLint memeriksa batas per file dan rule saat CI berjalan. Kurangi daftar ini dengan `npm run lint -- --prune-suppressions` setelah memperbaiki temuan terkait.

Ekspor Excel menggunakan arsip `vendor/xlsx-0.20.3.tgz` dari [distribusi resmi SheetJS](https://docs.sheetjs.com/docs/getting-started/installation/frameworks/). npm memeriksa integritas arsip menggunakan `package-lock.json`.

## Deployment

Aplikasi ini di-deploy menggunakan Vercel.
