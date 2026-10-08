import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Check, FileText, ListFilter, PenTool, Search, Download, History, Play, Sparkles, ChevronRight, Layers } from "lucide-react"
import { ProductBrand } from "@/components/ProductBrand"
import { ProductPreview } from "@/components/marketing/ProductPreview"
import styles from "@/components/marketing/marketing.module.css"

export const metadata: Metadata = { alternates: { canonical: "/" } }

const features = [
  { icon: FileText, title: "Satu invoice, semua transaksi.", text: "Susun transaksi dalam satu invoice. Simpan, buka kembali, lalu lanjutkan saat pekerjaan bertambah." },
  { icon: ListFilter, title: "Detail yang tetap terkendali.", text: "Catat pengirim, penerima, berat, dan tarif. Periksa rincian transaksi sebelum dokumen dibagikan." },
  { icon: Search, title: "Cari tanpa membuka satu per satu.", text: "Temukan nomor STT, cari invoice, atau saring riwayat berdasarkan tanggal yang Anda perlukan." },
  { icon: Download, title: "Dari data menjadi dokumen.", text: "Pratinjau invoice dan ekspor ke PDF. Siapkan dokumen yang rapi untuk kebutuhan administrasi." },
  { icon: PenTool, title: "Tanda tangan siap digunakan.", text: "Simpan gambar tanda tangan dan gunakan saat menyiapkan invoice. Tidak perlu mengunggah ulang." },
  { icon: History, title: "Riwayat kerja tetap tertata.", text: "Akses kembali invoice tersimpan dan pulihkan invoice dari sampah bila masih dibutuhkan." },
]
const steps = [
  ["Catat transaksi", "Masukkan rincian pengiriman, berat, dan tarif."],
  ["Susun invoice", "Kumpulkan transaksi dan simpan dalam satu invoice."],
  ["Periksa & ekspor", "Tinjau dokumen, tambahkan tanda tangan, lalu ekspor PDF."],
  ["Temukan kembali", "Buka riwayat kapan pun administrasi membutuhkannya."],
]

export default function LandingPage() {
  return (
    <div className={styles.root}>
      <a className={styles.skipLink} href="#konten">Langsung ke konten</a>
      <header className={styles.header}>
        <div className={styles.navInner}>
          <Link href="/" aria-label="KLK Invoice — Beranda"><ProductBrand /></Link>
          <nav className={styles.desktopNav} aria-label="Navigasi utama"><a href="#fitur">Fitur</a><a href="#cara-kerja">Cara kerja</a><a href="#roadmap">Roadmap AI</a><a href="#tentang">Tentang</a></nav>
          <div className={styles.navActions}><Link href="/login" prefetch={false} className={styles.navLogin}>Masuk <ArrowUpRight size={15} /></Link><details className={styles.mobileMenu}><summary aria-label="Buka navigasi"><span /><span /></summary><nav aria-label="Navigasi seluler"><a href="#fitur">Fitur</a><a href="#cara-kerja">Cara kerja</a><a href="#roadmap">Roadmap AI</a><a href="#tentang">Tentang</a></nav></details></div>
        </div>
      </header>

      <main id="konten">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <h1 id="hero-title">Invoice yang mengikuti<br className={styles.desktopBreak} /> <span>cara kerja bisnis Anda.</span></h1>
            <p className={styles.heroDescription}>Kelola transaksi, susun invoice profesional, dan sederhanakan administrasi bisnis. Semua dalam satu alur kerja yang tertata.</p>
            <div className={styles.heroActions}><Link href="/login" prefetch={false} className={styles.primary}>Masuk ke Aplikasi <ArrowRight size={17} /></Link><a href="#fitur" className={styles.secondary}>Jelajahi fitur <ChevronRight size={16} /></a></div>
            <div className={styles.heroNotes}><span><Check /> Transaksi terorganisir</span><span><Check /> Invoice siap dibagikan</span></div>
          </div>
          <div className={styles.heroStage}><ProductPreview /></div>
        </section>

        <section id="fitur" className={`${styles.section} ${styles.features}`} aria-labelledby="features-title">
          <div className={styles.sectionIntro}><div><p className={styles.eyebrow}>DIBUAT UNTUK PEKERJAAN NYATA</p><h2 id="features-title">Administrasi lebih sederhana.<br /><span>Pekerjaan terus berjalan.</span></h2></div><p>Dari transaksi pertama hingga dokumen terakhir, setiap langkah punya tempatnya.</p></div>
          <div className={styles.featureGrid}>{features.map(({ icon: Icon, title, text }) => <article className={styles.feature} key={title}><Icon strokeWidth={1.6} /><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section id="demo" className={styles.demoSection} aria-labelledby="demo-title">
          <div className={styles.section}>
            <div className={styles.demoHeading}><div><p className={styles.eyebrow}><Play size={12} fill="currentColor" /> LIHAT KLK INVOICE BEKERJA</p><h2 id="demo-title">Dari transaksi ke invoice.<br /><span>Tanpa alur yang berbelit.</span></h2></div><p>Ikuti proses pencatatan, penyimpanan, dan pratinjau invoice dalam demo singkat ini.</p></div>
            <figure className={styles.videoFrame}>
              <video controls playsInline preload="none" poster="/media/klk-demo-poster.jpg" width="1280" height="720" aria-label="Demo KLK Invoice: input transaksi, simpan invoice, dan ekspor PDF" aria-describedby="demo-caption"><source src="/media/klk-demo.mp4" type="video/mp4" /><a href="/media/klk-demo.mp4">Unduh video demo KLK Invoice</a></video>
              <figcaption id="demo-caption"><span><span className={styles.statusDot} /> Demo produk · 20 detik · Tanpa audio</span><span>Data contoh. Rekaman menggunakan identitas visual sebelumnya.</span></figcaption>
            </figure>
            <div id="cara-kerja" className={styles.workflow}><div className={styles.workflowTitle}><h3>Empat langkah. Satu alur yang jelas.</h3><a href="/login">Mulai dari ruang kerja Anda <ArrowUpRight size={16} /></a></div><ol className={styles.steps}>{steps.map(([title, text], i) => <li key={title}><span className={styles.stepNumber}>0{i + 1}</span><h4>{title}</h4><p>{text}</p></li>)}</ol></div>
          </div>
        </section>

        <section id="roadmap" className={`${styles.section} ${styles.roadmap}`} aria-labelledby="roadmap-title">
          <div className={styles.roadmapCopy}><p className={styles.eyebrow}><Sparkles size={15} /> ARAH PENGEMBANGAN</p><h2 id="roadmap-title">Anda beri instruksi.<br /><span>AI membantu menyusun.</span></h2><p>Kami merencanakan integrasi Claude API untuk membantu menyusun draf invoice melalui bahasa sehari-hari dan menyiapkan informasi dokumen.</p><p>Penyesuaian template, branding perusahaan, dan dukungan banyak perusahaan juga menjadi bagian dari roadmap KLK Invoice.</p><div className={styles.roadmapNotice}><span /> Dalam perencanaan · Belum tersedia di aplikasi</div></div>
          <div className={styles.concept}><div className={styles.conceptHeader}><span><Sparkles size={16} /> Asisten KLK</span><small>PRATINJAU KONSEP</small></div><div className={styles.prompt}>Bantu susun draf invoice dari transaksi pengiriman minggu ini.</div><div className={styles.aiResponse}><span className={styles.aiIcon}><Sparkles size={16} /></span><p>Berikut gambaran drafnya. Periksa rincian transaksi sebelum invoice disimpan.</p></div><div className={styles.draft}><div><FileText size={24} /><div><strong>Draf invoice pengiriman</strong><small>Contoh hasil yang direncanakan</small></div></div><span>Menunggu tinjauan <ChevronRight size={14} /></span></div><p className={styles.conceptNote}>Ilustrasi interaksi. Bukan fitur aktif atau hasil AI.</p></div>
        </section>

        <section id="tentang" className={styles.about} aria-labelledby="about-title"><div className={styles.section}><div className={styles.aboutMark}><Layers strokeWidth={1.1} /></div><p className={styles.eyebrow}>BERAWAL DARI KEBUTUHAN NYATA</p><h2 id="about-title">Dibangun dari operasional.<br /><span>Dirancang untuk berkembang.</span></h2><p>KLK Invoice berawal dari kebutuhan administrasi ekspedisi: mencatat transaksi dengan rapi dan menyiapkan invoice tanpa proses yang berulang. Fondasi itu kami kembangkan menuju platform yang dapat mendukung berbagai perusahaan dan industri.</p><div className={styles.aboutFoot}><span>Fokus hari ini: alur invoice yang tertata.</span><span>Arah berikutnya: kebutuhan bisnis yang lebih luas.</span></div></div></section>

        <section className={`${styles.section} ${styles.closing}`} aria-labelledby="closing-title"><div><p className={styles.eyebrow}>RUANG UNTUK BEKERJA LEBIH RAPI</p><h2 id="closing-title">Invoice beres.<br /><span>Lanjutkan langkah bisnis Anda.</span></h2></div><Link href="/login" prefetch={false} className={styles.primary}>Masuk ke Aplikasi <ArrowRight size={18} /></Link></section>
      </main>

      <footer className={styles.footer}><div className={styles.footerInner}><Link href="/" aria-label="KLK Invoice — Beranda"><ProductBrand /></Link><p>Administrasi rapi. Bisnis terus bergerak.</p><nav aria-label="Navigasi footer"><a href="#fitur">Fitur</a><a href="#demo">Demo</a><a href="#roadmap">Roadmap</a><Link href="/login" prefetch={false}>Masuk <ArrowUpRight size={13} /></Link></nav></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} KLK Invoice.</span><a href="mailto:hello@klkinvoice.my.id">hello@klkinvoice.my.id</a></div></footer>
    </div>
  )
}
