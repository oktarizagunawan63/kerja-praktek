import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const MOCK_DATA = [
  { proyek: 'RS Sentral', anggaran: 850, realisasi: 720 },
  { proyek: 'Klinik Utama', anggaran: 400, realisasi: 410 },
  { proyek: 'Lab Medis', anggaran: 300, realisasi: 280 },
  { proyek: 'Apotek', anggaran: 200, realisasi: 195 },
]

const formatRupiah = (v) => `${v}jt`

export default function BudgetChart({ data = MOCK_DATA }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Budget Realisasi vs Anggaran (Juta Rp)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="proyek" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={formatRupiah} />
          <Tooltip formatter={(v) => `Rp ${v.toLocaleString('id-ID')} jt`} />
          <Legend />
          <Bar dataKey="anggaran" fill="#e2e8f0" name="Anggaran" radius={[4, 4, 0, 0]} />
          <Bar dataKey="realisasi" fill="#3b82f6" name="Realisasi" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
