import { EmptyState, LoadingState } from '../common/States'

export default function DataTable({ columns, rows, loading, emptyTitle, emptyDescription, rowKey = 'id' }) {
  if (loading) return <LoadingState />
  if (!rows?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left">
        <thead><tr className="border-b border-stone-100">{columns.map((column) => <th key={column.key} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-stone-500">{column.label}</th>)}</tr></thead>
        <tbody className="divide-y divide-stone-100">{rows.map((row, index) => <tr key={row[rowKey] || index} className="transition hover:bg-stone-50/70">{columns.map((column) => <td key={column.key} className="px-5 py-3.5 align-middle text-sm text-stone-700">{column.render ? column.render(row) : (row[column.key] ?? '—')}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}