import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatRupiah } from './formatRupiah'

export const exportLaporanPDF = (projects) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  // ── Header ──
  doc.setFillColor(15, 76, 129)
  doc.rect(0, 0, 297, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PT AMSAR - LAPORAN MONITORING PROYEK', 14, 10)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Medical Services  |  Dicetak: ${now}`, 14, 17)

  // ── Summary KPI ──
  const active    = projects.filter(p => p.status !== 'completed')
  const completed = projects.filter(p => p.status === 'completed')
  const totalRab  = projects.reduce((s, p) => s + (p.rab || 0), 0)
  const totalReal = projects.reduce((s, p) => s + (p.realisasi || 0), 0)
  const avgProg   = active.length ? Math.round(active.reduce((s, p) => s + (p.progress || 0), 0) / active.length) : 0

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Ringkasan Eksekutif', 14, 30)

  const kpis = [
    ['Total Proyek', projects.length],
    ['Proyek Aktif', active.length],
    ['Proyek Selesai', completed.length],
    ['Avg Progress', `${avgProg}%`],
    ['Total RAB', formatRupiah(totalRab)],
    ['Total Realisasi', formatRupiah(totalReal)],
    ['Serapan', totalRab ? `${Math.round((totalReal / totalRab) * 100)}%` : '0%'],
  ]

  const colW = 38
  kpis.forEach((kpi, i) => {
    const x = 14 + (i * colW)
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(x, 33, colW - 2, 16, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(String(kpi[0]), x + 2, 38)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 76, 129)
    doc.text(String(kpi[1]), x + 2, 45)
  })

  // ── Tabel Proyek Aktif ──
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Detail Proyek Aktif', 14, 58)

  const statusLabel = { on_track: 'On Track', at_risk: 'At Risk', delayed: 'Delayed', completed: 'Selesai' }

  autoTable(doc, {
    startY: 61,
    head: [['No', 'Nama Proyek', 'Lokasi', 'PM', 'Status', 'Progress', 'RAB', 'Realisasi', 'Serapan', 'Deadline']],
    body: active.map((p, i) => [
      i + 1,
      p.name,
      p.location,
      p.pm,
      statusLabel[p.status] || p.status,
      `${p.progress || 0}%`,
      formatRupiah(p.rab),
      formatRupiah(p.realisasi || 0),
      p.rab ? `${Math.round(((p.realisasi || 0) / p.rab) * 100)}%` : '0%',
      new Date(p.deadline).toLocaleDateString('id-ID'),
    ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [15, 76, 129], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      8: { halign: 'center' },
    },
    didDrawCell: (data) => {
      // Warna status
      if (data.section === 'body' && data.column.index === 4) {
        const val = data.cell.raw
        const colors = { 'On Track': [220, 252, 231], 'At Risk': [254, 249, 195], 'Delayed': [254, 226, 226] }
        const textColors = { 'On Track': [22, 101, 52], 'At Risk': [113, 63, 18], 'Delayed': [153, 27, 27] }
        if (colors[val]) {
          doc.setFillColor(...colors[val])
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F')
          doc.setTextColor(...textColors[val])
          doc.setFontSize(7.5)
          doc.text(val, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' })
        }
      }
      // Warna realisasi over budget
      if (data.section === 'body' && data.column.index === 7) {
        const proj = active[data.row.index]
        if (proj && (proj.realisasi || 0) > proj.rab) {
          doc.setTextColor(220, 38, 38)
          doc.setFontSize(8)
          doc.text(data.cell.raw, data.cell.x + 2, data.cell.y + data.cell.height / 2 + 1)
        }
      }
    },
  })

  // ── Proyek Selesai ──
  if (completed.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Proyek Selesai', 14, finalY)

    autoTable(doc, {
      startY: finalY + 3,
      head: [['No', 'Nama Proyek', 'Lokasi', 'PM', 'RAB', 'Realisasi', 'Tanggal Selesai']],
      body: completed.map((p, i) => [
        i + 1,
        p.name,
        p.location,
        p.pm,
        formatRupiah(p.rab),
        formatRupiah(p.realisasi || 0),
        p.completedAt ? new Date(p.completedAt).toLocaleDateString('id-ID') : '-',
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
    })
  }

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`PT Amsar Medical Services  |  Halaman ${i} dari ${pageCount}  |  ${now}`, 14, doc.internal.pageSize.height - 5)
  }

  doc.save(`Laporan_PT_Amsar_${new Date().toISOString().split('T')[0]}.pdf`)
}
