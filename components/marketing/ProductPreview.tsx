import type { LandingLocale } from "@/lib/landing-locale"
import { landingTranslator } from "./landing-copy"
import { ArrowDownToLine, ChevronDown, FileText, LayoutGrid, Plus, Search, PenTool, Database, Trash2, Check } from "lucide-react"
import { ProductBrand } from "@/components/ProductBrand"
import styles from "./marketing.module.css"

const rows = [
  ["DEMO-001", "CV Ruang Niaga", "Toko Sinar Pagi", "12", "Rp 240.000"],
  ["DEMO-002", "CV Ruang Niaga", "Studio Selatan", "8", "Rp 160.000"],
  ["DEMO-003", "CV Ruang Niaga", "Toko Langkah", "15", "Rp 300.000"],
]

export function ProductPreview({ locale }: { locale: LandingLocale }) {
  const t = landingTranslator(locale)
  return (
    <figure className={styles.previewFigure}>
      <div className={styles.preview} role="img" aria-label={t("Ilustrasi dashboard dengan data contoh: riwayat invoice, tiga transaksi pengiriman, total Rp 700.000, dan ekspor PDF.")}>
        <div className={styles.browserBar} aria-hidden="true"><span><i /><i /><i /></span><span>klkinvoice.my.id/dashboard</span><span className={styles.browserSecure}><Check size={11} /> Ruang kerja</span></div>
        <div className={styles.appNav} aria-hidden="true">
          <ProductBrand />
          <div><span className={styles.appActive}><LayoutGrid /> Dashboard</span><span><PenTool /> Tanda tangan</span><span><Database /> Penyimpanan</span><span><Trash2 /> Sampah</span></div>
          <span className={styles.avatar}>D</span>
        </div>
        <div className={styles.appBody} aria-hidden="true">
          <aside className={styles.appSidebar}>
            <div className={styles.mockSearch}><Search /> Cari invoice atau No. STT</div>
            <div className={styles.sidebarLabel}>RIWAYAT INVOICE <Plus size={13} /></div>
            <div className={styles.mockFilters}><b>Semua</b><span>Hari ini</span><span>Bulan</span></div>
            <div className={styles.historySelected}><FileText /><div><strong>Pengiriman Oktober</strong><small>3 transaksi · Rp 700.000</small></div></div>
            <div className={styles.historyRow}><FileText /><div><strong>Pengiriman September</strong><small>6 transaksi · Rp 920.000</small></div></div>
            <div className={styles.historyRow}><FileText /><div><strong>Pengiriman Agustus</strong><small>4 transaksi · Rp 540.000</small></div></div>
            <div className={styles.sidebarFoot}>Dokumen tertata.<br />Mudah ditemukan kembali.</div>
          </aside>
          <div className={styles.workspace}>
            <div className={styles.workspaceHeading}><div><small>RUANG KERJA / INVOICE</small><h3>Pengiriman Oktober</h3><p>Semua detail transaksi, dalam satu dokumen.</p></div><span className={styles.mockButton}><Plus size={14} /> Invoice baru</span></div>
            <div className={styles.summaryRow}><div><small>Total transaksi</small><strong>03 <span>transaksi</span></strong></div><div><small>Total berat</small><strong>35 <span>kg</span></strong></div><div><small>Total tagihan</small><strong className={styles.blue}>Rp 700.000</strong></div></div>
            <div className={styles.tableHeading}><strong>Daftar transaksi</strong><span><ArrowDownToLine size={13} /> Ekspor PDF <ChevronDown size={12} /></span></div>
            <table className={styles.mockTable}><thead><tr><th>No. STT</th><th>Pengirim</th><th>Penerima</th><th>Berat (kg)</th><th>Total</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((value, i) => <td key={i}>{value}</td>)}</tr>)}</tbody></table>
            <div className={styles.tableFoot}><span>Menampilkan 3 transaksi</span><strong>Total <b>Rp 700.000</b></strong></div>
          </div>
        </div>
      </div>
      <figcaption>{t("Ilustrasi produk dengan data contoh, berdasarkan fitur KLK Invoice.")}</figcaption>
    </figure>
  )
}
