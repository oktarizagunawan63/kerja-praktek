import { useEffect, useMemo, useState } from 'react'

const DEFAULT_PAGE_SIZE = 10

/**
 * DataTable - generic reusable table
 * @param {Array} columns - [{ key, label, render? }]
 * @param {Array} data
 * @param {boolean} loading
 */
export default function DataTable({
  columns,
  data = [],
  loading = false,
  emptyMessage = 'Tidak ada data',
  pageSize = DEFAULT_PAGE_SIZE,
  paginate = true,
  tableClassName = 'w-full text-sm',
  wrapperClassName = '',
}) {
  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : []
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(safeData.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleData = useMemo(() => {
    if (!paginate) return safeData

    const start = (currentPage - 1) * pageSize
    return safeData.slice(start, start + pageSize)
  }, [currentPage, pageSize, paginate, safeData])

  useEffect(() => {
    setPage(1)
  }, [safeData.length, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])
  
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-100 ${wrapperClassName}`}>
      <div className="overflow-x-auto">
        <table className={tableClassName}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.headerClassName || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-gray-400">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : safeData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-gray-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleData.map((row, i) => (
                <tr key={(currentPage - 1) * pageSize + i} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-gray-700 whitespace-nowrap ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row) : row[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginate && !loading && safeData.length > pageSize && (
        <Pagination
          page={currentPage}
          pageSize={pageSize}
          total={safeData.length}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-gray-500">
        Menampilkan {start}-{end} dari {total} data
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>
        <span className="min-w-20 text-center text-xs font-semibold text-gray-700">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}
