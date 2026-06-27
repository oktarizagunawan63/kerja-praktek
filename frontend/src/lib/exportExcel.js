/**
 * Export data as CSV with UTF-8 BOM so Excel opens it correctly.
 *
 * @param {object[]} data - Array of row objects
 * @param {Array<{key: string, label: string, value?: (row) => string}>} columns
 *   - key: object property to read (fallback)
 *   - label: column header
 *   - value: optional custom formatter (row) => string
 * @param {string} filename - Base filename without extension or date suffix
 */
export const exportToCSV = (data, columns, filename) => {
  const BOM = '﻿'
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

  const header = columns.map((c) => escape(c.label)).join(',')
  const rows = data.map((row) =>
    columns
      .map((c) => escape(c.value ? c.value(row) : (row[c.key] ?? '')))
      .join(',')
  )

  const csv = BOM + [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
