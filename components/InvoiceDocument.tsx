import React from "react";
import type { Transaksi, Signature } from "@/lib/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface InvoiceDocumentProps {
  data: Transaksi[];
  formData: {
    tanggalSurat: string;
    nomorInvoice: string;
    namaPenerima: string;
    lokasiPenerima: string;
    biayaKirimDoc: number;
    penandatanganKiri: string;
    penandatanganKanan: string;
  };
  selectedSignatureKiri: Signature | null;
  selectedSignatureKanan: Signature | null;
  logoBase64: string;
  showDateColumn: boolean;
  currentShowKeteranganColumn: boolean;
  paginated: boolean;
  rowChunks?: Transaksi[][];
}

export function InvoiceDocument({
  data,
  formData,
  selectedSignatureKiri,
  selectedSignatureKanan,
  logoBase64,
  showDateColumn,
  currentShowKeteranganColumn,
  paginated,
  rowChunks,
}: InvoiceDocumentProps) {
  const formatRupiah = (num: number): string => {
    return num.toLocaleString("id-ID");
  };

  const formatTransactionDate = (tanggal: string | null | undefined) => {
    if (!showDateColumn) {
      return "";
    }
    return tanggal ? format(new Date(tanggal), "dd MMM yyyy", { locale: id }) : "-";
  };

  const biayaHandling = data.reduce((sum, item) => sum + item.total, 0);
  const totalTagihan = biayaHandling + (formData.biayaKirimDoc || 0);

  const chunks = paginated && rowChunks ? rowChunks : [data];

  const getTableTotalColSpan = () => (showDateColumn ? 9 : 8);

  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      lineHeight: 1.4,
      color: "#000",
      maxWidth: "21cm",
      margin: "0 auto",
      padding: "20px",
      wordSpacing: "normal",
      whiteSpace: "normal",
      letterSpacing: "normal",
      boxSizing: "border-box",
      background: "#fff"
    }}>
      {/* Header */}
      <div className="pdf-keep-together" style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "15px",
        paddingBottom: "10px",
        borderBottom: "2px solid #000",
        breakInside: "avoid",
        pageBreakInside: "avoid"
      }}>
        {logoBase64 ? (
          <img src={logoBase64} alt="Logo KLK" style={{ width: "140px", height: "auto", marginRight: "15px" }} />
        ) : null}
        <div style={{ textAlign: "center", flex: 1, paddingRight: "100px" }}>
          <p style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "3px" }}>
            Branch Manado: Permata Klabat Blok E1 No 17 Manado
          </p>
          <p style={{ fontSize: "10px", fontWeight: "bold" }}>No. Tlp. : (0431) 7242432 HP : 085395549100</p>
          <p style={{ fontSize: "10px", fontWeight: "bold" }}>Email : klk.express.mdc@gmail.com</p>
        </div>
      </div>

      {/* Letter Info */}
      <div className="pdf-keep-together" style={{ marginBottom: "15px", breakInside: "avoid", pageBreakInside: "avoid" }}>
        <p style={{ marginBottom: "3px" }}>{formData.tanggalSurat}</p>
        <p style={{ marginBottom: "3px" }}>No. {formData.nomorInvoice}</p>
      </div>

      {/* Recipient */}
      <div className="pdf-keep-together" style={{ marginBottom: "15px", breakInside: "avoid", pageBreakInside: "avoid" }}>
        <p style={{ marginBottom: "2px" }}>Kepada Yth :</p>
        <p style={{ marginBottom: "2px", fontWeight: "bold" }}>{formData.namaPenerima}</p>
        <p style={{ marginBottom: "2px" }}>Di. {formData.lokasiPenerima}</p>
      </div>

      {/* Intro */}
      <div className="pdf-keep-together" style={{ marginBottom: "15px", breakInside: "avoid", pageBreakInside: "avoid" }}>
        <p style={{ marginBottom: "5px" }}>Dengan Hormat,</p>
        <p style={{ marginBottom: "5px" }}>
          Terlampir Jasa Handling dari PT. Kemilau Lintas Khatulistiwa Manado Dikirim sesuai perhitungan Jasa handling di bawah ini :
        </p>
      </div>

      {/* Tables (paginated or single chunk) */}
      {chunks.map((chunk, chunkIndex) => {
        const firstRowNumber = chunks
          .slice(0, chunkIndex)
          .reduce((sum, pageRows) => sum + pageRows.length, 0);
        const isLastChunk = chunkIndex === chunks.length - 1;
        // Every non-final chunk hard-breaks to the next page, so a chunk's
        // repeated header can never render mid-page after the previous rows.
        const wrapperStyle: React.CSSProperties = {
          ...(chunkIndex > 0 && paginated ? { paddingTop: "12px" } : {}),
          ...(paginated && !isLastChunk
            ? { breakAfter: "page" as const, pageBreakAfter: "always" as const }
            : {}),
        };

        return (
          <React.Fragment key={chunkIndex}>
            <div data-pdf-chunk-index={chunkIndex} style={wrapperStyle}>
              <table
                data-pdf-table="true"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: isLastChunk ? "15px" : "0px",
                  fontSize: "10px"
                }}
              >
                <thead style={{ display: "table-header-group" }}>
                  <tr>
                    <th style={{ border: "1px solid #000", padding: "8px 6px", backgroundColor: "#f0f0f0", fontWeight: "bold", textAlign: "center", lineHeight: "20px" }}>No</th>
                    {showDateColumn ? (
                      <th style={{ border: "1px solid #000", padding: "8px 6px", backgroundColor: "#f0f0f0", fontWeight: "bold", textAlign: "center", lineHeight: "20px" }}>Hari/Tgl</th>
                    ) : null}
                    <th style={{ border: "1px solid #000", padding: "8px 6px", backgroundColor: "#f0f0f0", fontWeight: "bold", textAlign: "center", lineHeight: "20px" }}>No Stt</th>
                    <th style={{ border: "1px solid #000", padding: "8px 6px", backgroundColor: "#f0f0f0", fontWeight: "bold", textAlign: "center", lineHeight: "20px" }}>Pengirim</th>
                    <th style={{ border: "1px solid #000", padding: "8px 6px", backgroundColor: "#f0f0f0", fontWeight: "bold", textAlign: "center", lineHeight: "20px" }}>Penerima</th>
                    <th style={{ border: "1px solid #000", padding: "8px 6px", backgroundColor: "#f0f0f0", fontWeight: "bold", textAlign: "center", lineHeight: "20px" }}>Coly</th>
                    <th style={{ border: "1px solid #000", padding: "8px 6px", backgroundColor: "#f0f0f0", fontWeight: "bold", textAlign: "center", lineHeight: "20px" }}>Kg</th>
                    <th style={{ border: "1px solid #000", padding: "8px 6px", backgroundColor: "#f0f0f0", fontWeight: "bold", textAlign: "center", lineHeight: "20px" }}>Min</th>
                    <th style={{ border: "1px solid #000", padding: "8px 6px", backgroundColor: "#f0f0f0", fontWeight: "bold", textAlign: "center", lineHeight: "20px" }}>Tarif</th>
                    <th style={{ border: "1px solid #000", padding: "8px 6px", backgroundColor: "#f0f0f0", fontWeight: "bold", textAlign: "center", lineHeight: "20px" }}>Jumlah</th>
                    {currentShowKeteranganColumn ? (
                      <th style={{ border: "1px solid #000", padding: "8px 6px", backgroundColor: "#f0f0f0", fontWeight: "bold", textAlign: "center", lineHeight: "20px" }}>Ket</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((item, index) => {
                    const rowNumber = firstRowNumber + index + 1;
                    return (
                      <tr key={item.id || index} style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
                        <td style={{ border: "1px solid #000", padding: "8px 6px", textAlign: "center", lineHeight: "20px" }}>{rowNumber}</td>
                        {showDateColumn ? (
                          <td style={{ border: "1px solid #000", padding: "8px 6px", lineHeight: "20px" }}>{formatTransactionDate(item.tanggal)}</td>
                        ) : null}
                        <td style={{ border: "1px solid #000", padding: "8px 6px", lineHeight: "20px" }}>{item.noResi}</td>
                        <td style={{ border: "1px solid #000", padding: "8px 6px", lineHeight: "20px" }}>{item.pengirim}</td>
                        <td style={{ border: "1px solid #000", padding: "8px 6px", lineHeight: "20px" }}>{item.penerima}</td>
                        <td style={{ border: "1px solid #000", padding: "8px 6px", textAlign: "center", lineHeight: "20px" }}>{item.coly}</td>
                        <td style={{ border: "1px solid #000", padding: "8px 6px", textAlign: "center", lineHeight: "20px" }}>{item.berat}</td>
                        <td style={{ border: "1px solid #000", padding: "8px 6px", textAlign: "center", lineHeight: "20px" }}>{item.min}</td>
                        <td style={{ border: "1px solid #000", padding: "8px 6px", textAlign: "right", lineHeight: "20px" }}>{formatRupiah(item.tarif || 0)}</td>
                        <td style={{ border: "1px solid #000", padding: "8px 6px", textAlign: "right", lineHeight: "20px" }}>{formatRupiah(item.total)}</td>
                        {currentShowKeteranganColumn ? (
                          <td style={{ border: "1px solid #000", padding: "8px 6px", lineHeight: "20px" }}>{item.keterangan || ""}</td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
                {isLastChunk ? (
                  <tfoot style={{ display: "table-row-group" }}>
                    <tr style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
                      <td colSpan={getTableTotalColSpan()} style={{ border: "1px solid #000", padding: "8px 6px", textAlign: "right", fontWeight: "bold", lineHeight: "20px" }}>TOTAL</td>
                      <td style={{ border: "1px solid #000", padding: "8px 6px", textAlign: "right", fontWeight: "bold", lineHeight: "20px" }}>Rp {formatRupiah(biayaHandling)}</td>
                      {currentShowKeteranganColumn ? (
                        <td style={{ border: "1px solid #000", padding: "8px 6px", lineHeight: "20px" }}></td>
                      ) : null}
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </React.Fragment>
        );
      })}

      <div data-pdf-after-table="true" style={{ display: "flow-root" }}>
        {/* Calculations */}
        <div className="pdf-keep-together" style={{ marginBottom: "15px", breakInside: "avoid", pageBreakInside: "avoid" }}>
          <div style={{ display: "flex", maxWidth: "350px", marginBottom: "3px" }}>
            <span style={{ flex: 1 }}>1. Biaya handling</span>
            <span style={{ textAlign: "right", minWidth: "120px" }}>Rp {formatRupiah(biayaHandling)}</span>
          </div>
          <div style={{ display: "flex", maxWidth: "350px", marginBottom: "3px" }}>
            <span style={{ flex: 1 }}>2. Biaya Kirim Doc</span>
            <span style={{ textAlign: "right", minWidth: "120px" }}>Rp {formatRupiah(formData.biayaKirimDoc)}</span>
          </div>
          <div style={{ display: "flex", maxWidth: "350px", fontWeight: "bold", borderTop: "1px solid #000", paddingTop: "3px", marginTop: "5px" }}>
            <span style={{ flex: 1 }}>TOTAL TAGIHAN</span>
            <span style={{ textAlign: "right", minWidth: "120px" }}>Rp {formatRupiah(totalTagihan)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="pdf-keep-together" style={{ marginBottom: "15px", fontSize: "10px", breakInside: "avoid", pageBreakInside: "avoid" }}>
          <p>Jumlah tagihan bisa ditransfer melalui :</p>
          <p><strong>Rek mandiri, 1500010112710 a/n. Janti Feine Rundengan</strong></p>
        </div>

        {/* Closing */}
        <div className="pdf-keep-together" style={{ marginBottom: "15px", breakInside: "avoid", pageBreakInside: "avoid" }}>
          <p>Demikian di sampaikan, Atas perhatian dan kerjasama yang baik, Kami ucapkan Terima Kasih</p>
          <p>Hormat Kami,</p>
        </div>

        {/* Signatures */}
        <div className="pdf-keep-together" style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginTop: "60px", breakInside: "avoid", pageBreakInside: "avoid" }}>
          <div style={{ width: "45%", textAlign: "center" }}>
            {selectedSignatureKiri ? (
              <div style={{ height: "70px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <img src={selectedSignatureKiri.imageData} alt="Signature" style={{ maxHeight: "60px", maxWidth: "150px" }} />
              </div>
            ) : (
              <div style={{ borderBottom: "1px solid #000", width: "60%", margin: "0 auto 5px", marginTop: "70px" }}></div>
            )}
            <p>PT. KLK Mdc</p>
            <p style={{ fontWeight: "bold" }}>{formData.penandatanganKiri}</p>
          </div>
          <div style={{ width: "45%", textAlign: "center" }}>
            {selectedSignatureKanan ? (
              <div style={{ height: "70px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <img src={selectedSignatureKanan.imageData} alt="Signature" style={{ maxHeight: "60px", maxWidth: "150px" }} />
              </div>
            ) : (
              <div style={{ borderBottom: "1px solid #000", width: "60%", margin: "0 auto 5px", marginTop: "70px" }}></div>
            )}
            <p>Diketahui,</p>
            <p style={{ fontWeight: "bold" }}>{formData.penandatanganKanan}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="pdf-keep-together" style={{ marginTop: "80px", fontSize: "10px", breakInside: "avoid", pageBreakInside: "avoid" }}>
          <p>Cc. Klk mdc</p>
        </div>
      </div>
    </div>
  );
}
