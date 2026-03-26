import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const STORAGE_KEY = 'projects_data'
const INIT_PROJECTS = [
  { id: 1, name: 'RS Sentral Amsar', location: 'Jakarta Selatan', status: 'on_track', progress: 72, rab: 850, realisasi: 720, pm: 'Budi Santoso', deadline: '2026-09-30' },
  { id: 2, name: 'Klinik Utama Barat', location: 'Tangerang', status: 'at_risk', progress: 45, rab: 400, realisasi: 410, pm: 'Siti Rahayu', deadline: '2026-07-15' },
  { id: 3, name: 'Lab Medis Timur', location: 'Bekasi', status: 'on_track', progress: 88, rab: 300, realisasi: 280, pm: 'Ahmad Fauzi', deadline: '2026-06-10' },
  { id: 4, name: 'Apotek Cabang 3', location: 'Depok', status: 'delayed', progress: 30, rab: 200, realisasi: 195, pm: 'Dewi Lestari', deadline: '2026-05-01' },
]

const statusLabel = { on_track: 'On Track', at_risk: 'At Risk', delayed: 'Delayed', completed: 'Selesai' }

const loadProjects = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : INIT_PROJECTS
  } catch { return INIT_PROJECTS }
}

export async function exportLaporanPDF(chartElementId = null) {
  const projects = loadProjects()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  const contentW = pageW - margin * 2
  let y = 0

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(15, 76, 129)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PT Amsar Medical Services', margin, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Laporan Rekap Proyek', margin, 19)
  doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW - margin, 19, { align: 'right' })
  y = 36

  // ── Summary KPI ─────────────────────────────────────────
  const active = projects.filter(p => p.status !== 'completed')
  const completed = projects.filter(p => p.status === 'completed')
  const totalRab = projects.reduce((s, p) => s + p.rab, 0)
  const totalReal = projects.reduce((s, p) => s + p.realisasi, 0)
  const avgProgress = active.length ? Math.round(active.reduce((s, p) => s + p.progress, 0) / active.length) : 0

  const kpis = [
    { label: 'Total Proyek', value: String(projects.length) },
    { label: 'Proyek Aktif', value: String(active.length) },
    { label: 'Selesai', value: String(completed.length) },
    { label: 'Avg Progress', value: `${avgProgress}%` },
    { label: 'Total RAB', value: `Rp ${totalRab}jt` },
    { label: 'Realisasi', value: `Rp ${totalReal}jt` },
  ]

  const kpiW = contentW / 3
  const kpiH = 18
  kpis.forEach((k, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = margin + col * kpiW
    const ky = y + row * (kpiH + 3)
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(x, ky, kpiW - 2, kpiH, 2, 2, 'F')
    doc.setTextColor(120, 130, 145)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(k.label, x + 4, ky + 6)
    doc.setTextColor(20, 30, 50)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(k.value, x + 4, ky + 14)
  })
  y += (kpiH + 3) * 2 + 8

  // ── Chart screenshot (optional) ──────────────────────────
  if (chartElementId) {
    const el = document.getElementById(chartElementId)
    if (el) {
      const canvas = await html2canvas(el, { scale: 1.5, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const imgH = (canvas.height / canvas.width) * contentW
      doc.addImage(imgData, 'PNG', margin, y, contentW, Math.min(imgH, 70))
      y += Math.min(imgH, 70) + 8
    }
  }

  // ── Table Header ─────────────────────────────────────────
  doc.setFillColor(15, 76, 129)
  doc.rect(margin, y, contentW, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  const cols = [
    { label: 'Nama Proyek', x: margin + 2, w: 52 },
    { label: 'Lokasi', x: margin + 54, w: 28 },
    { label: 'PM', x: margin + 83, w: 30 },
    { label: 'Status', x: margin + 114, w: 22 },
    { label: 'Progress', x: margin + 137, w: 18 },
    { label: 'RAB (jt)', x: margin + 156, w: 18 },
    { label: 'Real (jt)', x: margin + 175, w: 17 },
  ]
  cols.forEach(c => doc.text(c.label, c.x, y + 5.5))
  y += 8

  // ── Table Rows ───────────────────────────────────────────
  const statusColors = {
    on_track: [34, 197, 94],
    at_risk: [234, 179, 8],
    delayed: [239, 68, 68],
    completed: [59, 130, 246],
  }

  projects.forEach((p, i) => {
    if (y > 265) { doc.addPage(); y = 20 }
    const rowH = 9
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 249, i % 2 === 0 ? 255 : 252)
    doc.rect(margin, y, contentW, rowH, 'F')

    doc.setTextColor(30, 40, 55)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text(p.name.length > 28 ? p.name.slice(0, 26) + '…' : p.name, cols[0].x, y + 6)
    doc.text(p.location, cols[1].x, y + 6)
    doc.text(p.pm.split(' ')[0], cols[2].x, y + 6)

    // Status badge
    const [r, g, b] = statusColors[p.status] || [100, 100, 100]
    doc.setFillColor(r, g, b)
    doc.roundedRect(cols[3].x - 1, y + 1.5, 20, 5.5, 1, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6.5)
    doc.text(statusLabel[p.status] || p.status, cols[3].x + 1, y + 5.5)

    doc.setTextColor(30, 40, 55)
    doc.setFontSize(7.5)
    doc.text(`${p.progress}%`, cols[4].x, y + 6)
    doc.text(String(p.rab), cols[5].x, y + 6)

    const overBudget = p.realisasi > p.rab
    doc.setTextColor(overBudget ? 220 : 30, overBudget ? 50 : 40, overBudget ? 50 : 55)
    doc.text(String(p.realisasi), cols[6].x, y + 6)

    // Progress bar
    doc.setFillColor(220, 225, 235)
    doc.rect(cols[4].x - 1, y + 6.5, 16, 1.5, 'F')
    doc.setFillColor(r, g, b)
    doc.rect(cols[4].x - 1, y + 6.5, 16 * (p.progress / 100), 1.5, 'F')

    y += rowH
  })

  // ── Footer ───────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(245, 247, 250)
    doc.rect(0, 285, pageW, 12, 'F')
    doc.setTextColor(150, 160, 175)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('PT Amsar Medical Services — Dokumen ini digenerate otomatis oleh sistem', margin, 291)
    doc.text(`Halaman ${i} / ${pageCount}`, pageW - margin, 291, { align: 'right' })
  }

  doc.save(`Laporan_Proyek_Amsar_${new Date().toISOString().split('T')[0]}.pdf`)
}
