import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatRupiah } from './formatRupiah'

// ── Export semua proyek (untuk direktur) ──────────────────────────────────────
export const exportLaporanPDF = (projects) => {
  _generatePDF(projects, 'Laporan Monitoring Proyek — Semua')
}

// ── Export satu proyek (untuk site manager / direktur) ───────────────────────
export const exportProyekPDF = (project, materials = [], docs = []) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  // Header
  doc.setFillColor(15, 76, 129)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('PT AMSAR — LAPORAN PROYEK', 14, 10)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Medical Services  |  Dicetak: ${now}`, 14, 17)

  // Info Proyek
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(project.name, 14, 32)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`${project.location}  |  PM: ${project.pm}  |  Deadline: ${new Date(project.deadline).toLocaleDateString('id-ID')}`, 14, 38)

  // KPI boxes
  const kpis = [
    ['Progress', `${project.progress || 0}%`],
    ['RAB', formatRupiah(project.rab)],
    ['RAB Terealisasi', formatRupiah(project.realisasi || 0)],
    ['Status', project.status === 'on_track' ? 'On Track' : project.status === 'at_risk' ? 'At Risk' : project.status === 'delayed' ? 'Delayed' : 'Selesai'],
  ]
  const boxW = 43
  kpis.forEach((kpi, i) => {
    const x = 14 + i * (boxW + 2)
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(x, 43, boxW, 16, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text(kpi[0], x + 2, 48)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 76, 129)
    doc.text(String(kpi[1]), x + 2, 55)
    doc.setFont('helvetica', 'normal')
  })

  // Material Terpasang
  if (materials.length > 0) {
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Material Terpasang', 14, 68)

    autoTable(doc, {
      startY: 71,
      head: [['Material', 'Satuan', 'Qty Rencana', 'Qty Terpasang', 'Progress']],
      body: materials.map(m => [
        m.name,
        m.unit,
        m.qty_plan,
        m.qty_terpasang,
        `${Math.round((m.qty_terpasang / m.qty_plan) * 100)}%`,
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [15, 76, 129], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 4: { halign: 'center' } },
    })
  }

  // Dokumen
  if (docs.length > 0) {
    const startY = (doc.lastAutoTable?.finalY || 68) + 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Dokumen Proyek', 14, startY)

    autoTable(doc, {
      startY: startY + 3,
      head: [['Nama File', 'Tipe', 'Diupload Oleh', 'Tanggal']],
      body: docs.map(d => [d.name, d.type, d.uploader, d.date]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [15, 76, 129], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`PT Amsar Medical Services  |  Halaman ${i} dari ${pageCount}  |  ${now}`, 14, doc.internal.pageSize.height - 5)
  }

  const safeName = project.name.replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`Laporan_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ── Internal helper untuk export semua proyek ─────────────────────────────────
function _generatePDF(projects, title) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  doc.setFillColor(15, 76, 129)
  doc.rect(0, 0, 297, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`PT AMSAR — ${title.toUpperCase()}`, 14, 10)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Medical Services  |  Dicetak: ${now}`, 14, 17)

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
    const x = 14 + i * colW
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

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Detail Proyek Aktif', 14, 58)

  const statusLabel = { on_track: 'On Track', at_risk: 'At Risk', delayed: 'Delayed', completed: 'Selesai' }

  autoTable(doc, {
    startY: 61,
    head: [['No', 'Nama Proyek', 'Lokasi', 'PM', 'Status', 'Progress', 'RAB', 'Realisasi', 'Serapan', 'Deadline']],
    body: active.map((p, i) => [
      i + 1, p.name, p.location, p.pm,
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
    columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 8: { halign: 'center' } },
  })

  if (completed.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Proyek Selesai', 14, finalY)
    autoTable(doc, {
      startY: finalY + 3,
      head: [['No', 'Nama Proyek', 'Lokasi', 'PM', 'RAB', 'Realisasi', 'Tanggal Selesai']],
      body: completed.map((p, i) => [i + 1, p.name, p.location, p.pm, formatRupiah(p.rab), formatRupiah(p.realisasi || 0), p.completedAt ? new Date(p.completedAt).toLocaleDateString('id-ID') : '-']),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
    })
  }

  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`PT Amsar Medical Services  |  Halaman ${i} dari ${pageCount}  |  ${now}`, 14, doc.internal.pageSize.height - 5)
  }

  doc.save(`Laporan_PT_Amsar_${new Date().toISOString().split('T')[0]}.pdf`)
}
