import Link from "next/link"
import type { LandingLocale } from "@/lib/landing-locale"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { ThemeControl } from "./ThemeControl"
import { LandingMotion } from "./LandingMotion"
import { landingTranslator } from "./landing-copy"
import { ArrowRight, ArrowUpRight, Check, FileText, ListFilter, PenTool, Search, Download, History, Play, Sparkles, ChevronRight, Layers } from "lucide-react"
import { ProductBrand } from "@/components/ProductBrand"
import { ProductPreview } from "@/components/marketing/ProductPreview"
import styles from "@/components/marketing/marketing.module.css"

export function LandingPage({ locale }: { locale: LandingLocale }) {
  const t = landingTranslator(locale)
  const features = [
    { icon: FileText, title: t("Satu invoice, semua transaksi."), text: t("Susun transaksi dalam satu invoice. Simpan, buka kembali, lalu lanjutkan saat pekerjaan bertambah.") },
    { icon: ListFilter, title: t("Detail yang tetap terkendali."), text: t("Catat pengirim, penerima, berat, dan tarif. Periksa rincian transaksi sebelum dokumen dibagikan.") },
    { icon: Search, title: t("Cari tanpa membuka satu per satu."), text: t("Temukan nomor STT, cari invoice, atau saring riwayat berdasarkan tanggal yang Anda perlukan.") },
    { icon: Download, title: t("Dari data menjadi dokumen."), text: t("Pratinjau invoice dan ekspor ke PDF. Siapkan dokumen yang rapi untuk kebutuhan administrasi.") },
    { icon: PenTool, title: t("Tanda tangan siap digunakan."), text: t("Simpan gambar tanda tangan dan gunakan saat menyiapkan invoice. Tidak perlu mengunggah ulang.") },
    { icon: History, title: t("Riwayat kerja tetap tertata."), text: t("Akses kembali invoice tersimpan dan pulihkan invoice dari sampah bila masih dibutuhkan.") },
  ]
  const steps = [
    [t("Catat transaksi"), t("Masukkan rincian pengiriman, berat, dan tarif.")],
    [t("Susun invoice"), t("Kumpulkan transaksi dan simpan dalam satu invoice.")],
    [t("Periksa & ekspor"), t("Tinjau dokumen, tambahkan tanda tangan, lalu ekspor PDF.")],
    [t("Temukan kembali"), t("Buka riwayat kapan pun administrasi membutuhkannya.")],
  ]

  return (
    <div className={styles.root} data-landing-content>
      <LandingMotion />
      <a className={styles.skipLink} href="#konten">{t("Langsung ke konten")}</a>
      <header className={styles.header}>
        <div className={styles.navInner}>
          <Link href={`/${locale}`} aria-label={t("KLK Invoice — Beranda")}><ProductBrand /></Link>
          <nav className={styles.desktopNav} aria-label={t("Navigasi utama")}><a href="#fitur">{t("Fitur")}</a><a href="#cara-kerja">{t("Cara kerja")}</a><a href="#roadmap">{t("Roadmap AI")}</a><a href="#tentang">{t("Tentang")}</a></nav>
          <div className={styles.navActions}><LanguageSwitcher locale={locale} /><ThemeControl locale={locale} /><Link href="/login" prefetch={false} className={styles.navLogin}>{t("Masuk")} <ArrowUpRight size={15} /></Link><details className={styles.mobileMenu}><summary aria-label={t("Buka navigasi")}><span /><span /></summary><nav aria-label={t("Navigasi seluler")}><a href="#fitur">{t("Fitur")}</a><a href="#cara-kerja">{t("Cara kerja")}</a><a href="#roadmap">{t("Roadmap AI")}</a><a href="#tentang">{t("Tentang")}</a></nav></details></div>
        </div>
      </header>

      <main id="konten">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <h1 id="hero-title">{t("Invoice yang mengikuti")}<br className={styles.desktopBreak} /> <span>{t("cara kerja bisnis Anda.")}</span></h1>
            <p className={styles.heroDescription}>{t("Kelola transaksi, susun invoice profesional, dan sederhanakan administrasi bisnis. Semua dalam satu alur kerja yang tertata.")}</p>
            <div className={styles.heroActions}><Link href="/login" prefetch={false} className={styles.primary}>{t("Masuk ke Aplikasi")} <ArrowRight size={17} /></Link><a href="#fitur" className={styles.secondary}>{t("Jelajahi fitur")} <ChevronRight size={16} /></a></div>
            <div className={styles.heroNotes}><span><Check /> {t("Transaksi terorganisir")}</span><span><Check /> {t("Invoice siap dibagikan")}</span></div>
          </div>
          <div className={styles.heroStage}><ProductPreview locale={locale} /></div>
        </section>

        <section id="fitur" className={`${styles.section} ${styles.features}`} aria-labelledby="features-title">
          <div className={styles.sectionIntro} data-reveal=""><div><p className={styles.eyebrow}>{t("DIBUAT UNTUK PEKERJAAN NYATA")}</p><h2 id="features-title">{t("Administrasi lebih sederhana.")}<br /><span>{t("Pekerjaan terus berjalan.")}</span></h2></div><p>{t("Dari transaksi pertama hingga dokumen terakhir, setiap langkah punya tempatnya.")}</p></div>
          <div className={styles.featureGrid}>{features.map(({ icon: Icon, title, text }, i) => <article data-reveal="" data-reveal-order={i % 3} className={styles.feature} key={title}><Icon strokeWidth={1.6} /><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section id="demo" className={styles.demoSection} aria-labelledby="demo-title">
          <div className={styles.section}>
            <div className={styles.demoHeading} data-reveal=""><div><p className={styles.eyebrow}><Play size={12} fill="currentColor" /> {t("LIHAT KLK INVOICE BEKERJA")}</p><h2 id="demo-title">{t("Dari transaksi ke invoice.")}<br /><span>{t("Tanpa alur yang berbelit.")}</span></h2></div><p>{t("Ikuti proses pencatatan, penyimpanan, dan pratinjau invoice dalam demo singkat ini.")}</p></div>
            <figure className={styles.videoFrame} data-reveal="">
              <video controls playsInline preload="none" poster="/media/klk-demo-poster.jpg" width="1280" height="720" aria-label={t("Demo KLK Invoice: input transaksi, simpan invoice, dan ekspor PDF")} aria-describedby="demo-caption"><source src="/media/klk-demo.mp4" type="video/mp4" /><a href="/media/klk-demo.mp4">{t("Unduh video demo KLK Invoice")}</a></video>
              <figcaption id="demo-caption"><span><span className={styles.statusDot} /> {t("Demo produk · 20 detik · Tanpa audio")}</span><span>{t("Data contoh. Rekaman menggunakan identitas visual sebelumnya.")}</span></figcaption>
            </figure>
            <div id="cara-kerja" className={styles.workflow}><div className={styles.workflowTitle} data-reveal=""><h3>{t("Empat langkah. Satu alur yang jelas.")}</h3><Link href="/login" prefetch={false}>{t("Mulai dari ruang kerja Anda")} <ArrowUpRight size={16} /></Link></div><ol className={styles.steps}>{steps.map(([title, text], i) => <li key={title} data-reveal="" data-reveal-order={i}><span className={styles.stepNumber}>0{i + 1}</span><h4>{title}</h4><p>{text}</p></li>)}</ol></div>
          </div>
        </section>

        <section id="roadmap" className={`${styles.section} ${styles.roadmap}`} aria-labelledby="roadmap-title">
          <div className={styles.roadmapCopy} data-reveal=""><p className={styles.eyebrow}><Sparkles size={15} /> {t("ARAH PENGEMBANGAN")}</p><h2 id="roadmap-title">{t("Anda beri instruksi.")}<br /><span>{t("AI membantu menyusun.")}</span></h2><p>{t("Kami merencanakan integrasi Claude API untuk membantu menyusun draf invoice melalui bahasa sehari-hari dan menyiapkan informasi dokumen.")}</p><p>{t("Penyesuaian template, branding perusahaan, dan dukungan banyak perusahaan juga menjadi bagian dari roadmap KLK Invoice.")}</p><div className={styles.roadmapNotice}><span /> {t("Dalam perencanaan · Belum tersedia di aplikasi")}</div></div>
          <div className={styles.concept} data-reveal=""><div className={styles.conceptHeader}><span><Sparkles size={16} /> {t("Asisten KLK")}</span><small>{t("PRATINJAU KONSEP")}</small></div><div className={styles.prompt}>{t("Bantu susun draf invoice dari transaksi pengiriman minggu ini.")}</div><div className={styles.aiResponse}><span className={styles.aiIcon}><Sparkles size={16} /></span><p>{t("Berikut gambaran drafnya. Periksa rincian transaksi sebelum invoice disimpan.")}</p></div><div className={styles.draft}><div><FileText size={24} /><div><strong>{t("Draf invoice pengiriman")}</strong><small>{t("Contoh hasil yang direncanakan")}</small></div></div><span>{t("Menunggu tinjauan")} <ChevronRight size={14} /></span></div><p className={styles.conceptNote}>{t("Ilustrasi interaksi. Bukan fitur aktif atau hasil AI.")}</p></div>
        </section>

        <section id="tentang" className={styles.about} aria-labelledby="about-title"><div className={styles.section} data-reveal=""><div className={styles.aboutMark}><Layers strokeWidth={1.1} /></div><p className={styles.eyebrow}>{t("BERAWAL DARI KEBUTUHAN NYATA")}</p><h2 id="about-title">{t("Dibangun dari operasional.")}<br /><span>{t("Dirancang untuk berkembang.")}</span></h2><p>{t("KLK Invoice berawal dari kebutuhan administrasi ekspedisi: mencatat transaksi dengan rapi dan menyiapkan invoice tanpa proses yang berulang. Fondasi itu kami kembangkan menuju platform yang dapat mendukung berbagai perusahaan dan industri.")}</p><div className={styles.aboutFoot}><span>{t("Fokus hari ini: alur invoice yang tertata.")}</span><span>{t("Arah berikutnya: kebutuhan bisnis yang lebih luas.")}</span></div></div></section>

        <section className={`${styles.section} ${styles.closing}`} aria-labelledby="closing-title"><div data-reveal=""><p className={styles.eyebrow}>{t("RUANG UNTUK BEKERJA LEBIH RAPI")}</p><h2 id="closing-title">{t("Invoice beres.")}<br /><span>{t("Lanjutkan langkah bisnis Anda.")}</span></h2></div><Link href="/login" prefetch={false} className={styles.primary}>{t("Masuk ke Aplikasi")} <ArrowRight size={18} /></Link></section>
      </main>

      <footer className={styles.footer}><div className={styles.footerInner}><Link href={`/${locale}`} aria-label={t("KLK Invoice — Beranda")}><ProductBrand /></Link><p>{t("Administrasi rapi. Bisnis terus bergerak.")}</p><nav aria-label={t("Navigasi footer")}><a href="#fitur">{t("Fitur")}</a><a href="#demo">Demo</a><a href="#roadmap">Roadmap</a><Link href="/login" prefetch={false}>{t("Masuk")} <ArrowUpRight size={13} /></Link></nav></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} KLK Invoice.</span><ThemeControl locale={locale} system /><a href="mailto:hello@klkinvoice.my.id">hello@klkinvoice.my.id</a></div></footer>
    </div>
  )
}
