import React from "react";
import type { Transaksi } from "@/lib/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TransactionDocumentProps {
  data: Transaksi[];
  title: string;
  showDateColumn: boolean;
  currentShowKeteranganColumn: boolean;
  paginated: boolean;
  rowChunks?: Transaksi[][];
}

export function TransactionDocument({
  data,
  title,
  showDateColumn,
  currentShowKeteranganColumn,
  paginated,
  rowChunks,
}: TransactionDocumentProps) {
  const totalRevenue = data.reduce((sum, item) => sum + item.total, 0);

  const formatNumber = (num: number): string => {
    return num.toLocaleString("id-ID");
  };

  const formatVisibleDate = (tanggal: string | null | undefined, emptyText = "-"): string => {
    if (!showDateColumn) {
      return "";
    }
    return tanggal ? format(new Date(tanggal), "dd MMM yyyy", { locale: id }) : emptyText;
  };

  const chunks = paginated && rowChunks ? rowChunks : [data];
  const pdfSummaryLabelColSpan = showDateColumn ? 9 : 8;

  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      padding: "20px",
      boxSizing: "border-box",
      background: "#fff"
    }}>
      <h2 className="pdf-keep-together" style={{ textAlign: "center", marginBottom: "20px", breakInside: "avoid", pageBreakInside: "avoid" }}>
        {title || "Perhitungan Pengiriman Barang"}
      </h2>
      <p className="pdf-keep-together" style={{ marginBottom: "10px", breakInside: "avoid", pageBreakInside: "avoid" }}>
        Tanggal: {format(new Date(), "dd MMMM yyyy", { locale: id })}
      </p>

      {chunks.map((chunk, chunkIndex) => {
        const firstRowNumber = chunks
          .slice(0, chunkIndex)
          .reduce((sum, pageRows) => sum + pageRows.length, 0);
        const isLastChunk = chunkIndex === chunks.length - 1;
        const wrapperStyle = chunkIndex > 0
          ? { breakBefore: "page" as const, pageBreakBefore: "always" as const, paddingTop: "12px" }
          : {};

        return (
          <div key={chunkIndex} style={wrapperStyle}>
            <table
              data-pdf-table="true"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: isLastChunk ? "20px" : "0px",
                fontSize: "10px"
              }}
            >
              <thead style={{ display: "table-header-group" }}>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>No</th>
                  {showDateColumn ? (
                    <th style={{ border: "1px solid #000", padding: "6px" }}>Hari/Tgl</th>
                  ) : null}
                  <th style={{ border: "1px solid #000", padding: "6px" }}>No Stt</th>
                  <th style={{ border: "1px solid #000", padding: "6px" }}>Pengirim</th>
                  <th style={{ border: "1px solid #000", padding: "6px" }}>Penerima</th>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>C</th>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>Kg</th>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>Min</th>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>Tarif</th>
                  <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>Jumlah</th>
                  {currentShowKeteranganColumn ? (
                    <th style={{ border: "1px solid #000", padding: "6px" }}>Ket</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {chunk.map((item, index) => {
                  const rowNumber = firstRowNumber + index + 1;
                  const outputDate = formatVisibleDate(item.tanggal, "");

                  return (
                    <tr key={item.id || index} style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
                      <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{rowNumber}</td>
                      {showDateColumn ? (
                        <td style={{ border: "1px solid #000", padding: "4px" }}>{outputDate}</td>
                      ) : null}
                      <td style={{ border: "1px solid #000", padding: "4px" }}>{item.noResi}</td>
                      <td style={{ border: "1px solid #000", padding: "4px" }}>{item.pengirim}</td>
                      <td style={{ border: "1px solid #000", padding: "4px" }}>{item.penerima}</td>
                      <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{item.coly}</td>
                      <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{item.berat}</td>
                      <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{item.min || ""}</td>
                      <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>{formatNumber(item.tarif || 0)}</td>
                      <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>{formatNumber(item.total)}</td>
                      {currentShowKeteranganColumn ? (
                        <td style={{ border: "1px solid #000", padding: "4px" }}>{item.keterangan || ""}</td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
              {isLastChunk ? (
                <tfoot style={{ display: "table-row-group" }}>
                  <tr style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
                    <td colSpan={pdfSummaryLabelColSpan} style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>TOTAL</td>
                    <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>{formatNumber(totalRevenue)}</td>
                    {currentShowKeteranganColumn ? (
                      <td style={{ border: "1px solid #000", padding: "6px" }}></td>
                    ) : null}
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        );
      })}
    </div>
  );
}
