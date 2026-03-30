import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const MOCK_DATA = [
  { bulan: 'Jan', progres: 10, target: 12 },
  { bulan: 'Feb', progres: 22, target: 25 },
  { bulan: 'Mar', progres: 38, target: 37 },
  { bulan: 'Apr', progres: 50, target: 50 },
  { bulan: 'Mei', progres: 60, target: 62 },
  { bulan: 'Jun', progres: 75, target: 75 },
]

export default function TimelineChart({ data = MOCK_DATA }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Progress vs Target Timeline</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit="%" />
          <Tooltip formatter={(v) => `${v}%`} />
          <Legend />
          <Line type="monotone" dataKey="progres" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Progres" />
          <Line type="monotone" dataKey="target" stroke="#e5e7eb" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
