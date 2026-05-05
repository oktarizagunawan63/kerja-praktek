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


// ── Export Visit Reports ──────────────────────────────────────────────────────
export const exportVisitReportsPDF = (visits, filters = {}, stats = {}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  // Header
  doc.setFillColor(15, 76, 129)
  doc.rect(0, 0, 297, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PT AMSAR PRIMA MANDIRI', 14, 10)
  doc.setFontSize(12)
  doc.text('LAPORAN KUNJUNGAN SALES', 14, 17)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Dicetak: ${now}`, 14, 22)

  // Filter Info
  let yPos = 32
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Filter Laporan:', 14, yPos)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  yPos += 5
  
  if (filters.period) {
    const periodLabel = filters.period === 'daily' ? 'Harian' : 
                       filters.period === 'weekly' ? 'Mingguan' : 
                       filters.period === 'monthly' ? 'Bulanan' : filters.period
    doc.text(`Periode: ${periodLabel}`, 14, yPos)
    yPos += 4
  }
  if (filters.start_date && filters.end_date) {
    doc.text(`Tanggal: ${new Date(filters.start_date).toLocaleDateString('id-ID')} - ${new Date(filters.end_date).toLocaleDateString('id-ID')}`, 14, yPos)
    yPos += 4
  }
  if (filters.sales_name) {
    doc.text(`Sales: ${filters.sales_name}`, 14, yPos)
    yPos += 4
  }

  yPos += 3

  // Statistics Summary
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Ringkasan Statistik', 14, yPos)
  yPos += 5

  const statsData = [
    ['Total Kunjungan', stats.totalVisits || visits.length],
    ['Completed', stats.completed || visits.filter(v => v.status === 'done').length],
    ['Missed', stats.missed || visits.filter(v => v.status === 'missed').length],
    ['Performance Rate', `${stats.performanceRate || 0}%`],
  ]

  const boxW = 65
  statsData.forEach((stat, i) => {
    const x = 14 + i * (boxW + 3)
    doc.setFillColor(240, 245, 250)
    doc.roundedRect(x, yPos, boxW, 14, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(String(stat[0]), x + 2, yPos + 4)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 76, 129)
    doc.text(String(stat[1]), x + 2, yPos + 11)
  })

  yPos += 20

  // Detail Kunjungan Table
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Detail Kunjungan', 14, yPos)
  yPos += 3

  const tableData = visits.map((visit, index) => {
    const visitDate = visit.visit_date ? new Date(visit.visit_date).toLocaleDateString('id-ID') : '-'
    
    // Handle customer data from different sources
    const customer = visit.plan_visit?.customer || visit.direct_customer || {}
    const customerName = customer.name || visit.customer_name || '-'
    const customerCompany = customer.company || visit.customer_company || '-'
    
    // Handle sales/visitor data
    const salesName = visit.visitor?.name || '-'
    
    const status = visit.status === 'done' ? 'Completed' : 
                   visit.status === 'missed' ? 'Missed' : 
                   visit.status === 'pending' ? 'Pending' : visit.status
    const outcome = visit.visit_outcome === 'closed' ? 'Closed' :
                    visit.visit_outcome === 'follow_up' ? 'Follow-up' :
                    visit.visit_outcome === 'not_interested' ? 'Not Interested' :
                    visit.visit_outcome === 'rescheduled' ? 'Rescheduled' : '-'
    const dealAmount = visit.deal_amount ? formatRupiah(visit.deal_amount) : '-'
    const gps = visit.latitude && visit.longitude ? 
                `${parseFloat(visit.latitude).toFixed(4)}, ${parseFloat(visit.longitude).toFixed(4)}` : '-'

    return [
      index + 1,
      visitDate,
      customerName,
      customerCompany,
      salesName,
      status,
      outcome,
      dealAmount,
      gps
    ]
  })

  autoTable(doc, {
    startY: yPos,
    head: [['No', 'Tanggal', 'Customer', 'Perusahaan', 'Sales', 'Status', 'Outcome', 'Deal Amount', 'GPS']],
    body: tableData,
    styles: { 
      fontSize: 7, 
      cellPadding: 2,
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    headStyles: { 
      fillColor: [15, 76, 129], 
      textColor: 255, 
      fontStyle: 'bold', 
      fontSize: 7,
      halign: 'center'
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 30 },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 25, halign: 'center' },
      7: { cellWidth: 30, halign: 'right' },
      8: { cellWidth: 40, fontSize: 6 }
    },
    margin: { left: 14, right: 14 },
  })

  // Summary by Sales (if multiple sales)
  const salesSummary = {}
  visits.forEach(visit => {
    const salesName = visit.visitor?.name || 'Unknown'
    if (!salesSummary[salesName]) {
      salesSummary[salesName] = {
        total: 0,
        completed: 0,
        missed: 0,
        dealAmount: 0
      }
    }
    salesSummary[salesName].total++
    if (visit.status === 'done') salesSummary[salesName].completed++
    if (visit.status === 'missed') salesSummary[salesName].missed++
    if (visit.deal_amount) salesSummary[salesName].dealAmount += parseFloat(visit.deal_amount)
  })

  if (Object.keys(salesSummary).length > 1) {
    const summaryY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Ringkasan Per Sales', 14, summaryY)

    const salesTableData = Object.entries(salesSummary).map(([name, data]) => [
      name,
      data.total,
      data.completed,
      data.missed,
      `${data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0}%`,
      formatRupiah(data.dealAmount)
    ])

    autoTable(doc, {
      startY: summaryY + 3,
      head: [['Sales', 'Total Visit', 'Completed', 'Missed', 'Success Rate', 'Total Deal']],
      body: salesTableData,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'right' }
      }
    })
  }

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `PT Amsar Prima Mandiri  |  Laporan Kunjungan Sales  |  Halaman ${i} dari ${pageCount}  |  ${now}`, 
      14, 
      doc.internal.pageSize.height - 5
    )
  }

  const filename = `Laporan_Kunjungan_Sales_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}
