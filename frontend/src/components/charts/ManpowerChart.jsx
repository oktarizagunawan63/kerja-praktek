import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const MOCK_DATA = [
  { name: 'Dokter', value: 12 },
  { name: 'Perawat', value: 28 },
  { name: 'Teknisi', value: 15 },
  { name: 'Admin', value: 8 },
  { name: 'Supervisor', value: 5 },
]

export default function ManpowerChart({ data = MOCK_DATA }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribusi Manpower</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${v} orang`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
