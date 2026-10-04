import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import Button from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import DataTable from '../components/tables/DataTable'
import { EmptyState, ErrorState } from '../components/common/States'
import ResourceEditor from '../components/forms/ResourceEditor'
import useToast from '../hooks/useToast'
import { formatDate } from '../utils/format'
import { getErrorMessage } from '../utils/errors'

function renderValue(row, column) {
  const value = row[column.key]
  if (column.type === 'boolean') {
    const enabled = Boolean(value)
    return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}><span className={`size-1.5 rounded-full ${enabled ? 'bg-emerald-600' : 'bg-stone-400'}`} />{enabled ? 'Yes' : 'No'}</span>
  }
  if (column.type === 'count') return Array.isArray(value) && value.length ? String(value.length) : '—'
  if (column.type === 'date') return formatDate(value)
  if (column.suffix) return value == null ? '—' : `${value}${column.suffix}`
  const display = value == null || value === '' ? '—' : String(value)
  return <span className={column.strong ? 'font-semibold text-stone-900' : ''}>{display.length > 72 ? `${display.slice(0, 72)}…` : display}</span>
}

export default function ResourcePage({ config }) {
  const [page, setPage] = useState(1)
  const [editor, setEditor] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const queryClient = useQueryClient()
  const notify = useToast()
  const queryKey = ['resource', config.key, page]
  const records = useQuery({ queryKey, queryFn: () => config.api.list({ page, limit: 20 }) })

  const save = useMutation({
    mutationFn: ({ payload, editing }) => editing ? config.api.update(editor.id, payload) : config.api.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resource', config.key] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setEditor(null)
      notify(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} saved.`)
    },
    onError: (error) => notify(getErrorMessage(error), 'error'),
  })

  const remove = useMutation({
    mutationFn: (id) => config.api.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resource', config.key] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setDeleteItem(null)
      notify(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} deleted.`)
    },
    onError: (error) => notify(getErrorMessage(error), 'error'),
  })

  const rows = records.data?.data || []
  const meta = records.data?.meta
  const columns = [
    ...config.columns.map((column) => ({ ...column, render: (row) => renderValue(row, column) })),
    { key: 'actions', label: 'Actions', render: (row) => <div className="flex items-center justify-end gap-1"><button type="button" title={`Edit ${config.singular}`} aria-label={`Edit ${config.singular}`} onClick={() => setEditor(row)} className="grid size-9 place-items-center rounded-lg text-stone-500 hover:bg-emerald-50 hover:text-emerald-800"><Pencil size={15} /></button><button type="button" title={`Delete ${config.singular}`} aria-label={`Delete ${config.singular}`} onClick={() => setDeleteItem(row)} className="grid size-9 place-items-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={15} /></button></div> },
  ]

  const submit = (payload, options) => save.mutate({ payload, ...options })

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Content</p><h2 className="mt-1 text-2xl font-bold tracking-normal text-stone-900">{config.title}</h2><p className="mt-1.5 text-sm text-stone-500">{config.description}</p></div><Button icon={Plus} onClick={() => setEditor({})}>New {config.singular}</Button></section>
      <section className="overflow-hidden rounded-xl border border-stone-200/80 bg-white">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-600" /><span className="text-xs font-semibold text-stone-500">{meta?.total ?? rows.length} records</span></div><span className="text-xs text-stone-400">Updated from the portfolio API</span></div>
        {records.isPending ? <DataTable columns={columns} rows={[]} loading /> : records.isError ? <ErrorState message={getErrorMessage(records.error)} onRetry={() => records.refetch()} /> : rows.length ? <DataTable columns={columns} rows={rows} /> : <EmptyState title={`No ${config.title.toLowerCase()} yet`} description="Create the first record to add it to your portfolio." action={<Button icon={Plus} onClick={() => setEditor({})}>Create {config.singular}</Button>} />}
        {meta?.totalPages > 1 && <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3"><span className="text-xs text-stone-500">Page {meta.page} of {meta.totalPages}</span><div className="flex gap-1"><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="grid size-8 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30"><ChevronLeft size={17} /></button><button type="button" aria-label="Next page" disabled={page >= meta.totalPages} onClick={() => setPage((current) => current + 1)} className="grid size-8 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30"><ChevronRight size={17} /></button></div></div>}
      </section>

      {editor && <ResourceEditor config={config} item={editor.id ? editor : null} busy={save.isPending} onClose={() => setEditor(null)} onSave={submit} onRecordChange={(record) => { setEditor(record); queryClient.invalidateQueries({ queryKey: ['resource', config.key] }) }} />}
      <ConfirmDialog open={Boolean(deleteItem)} title={`Delete ${config.singular}?`} description={`“${deleteItem?.title || deleteItem?.name || deleteItem?.company || 'This record'}” will be removed permanently.`} busy={remove.isPending} onCancel={() => setDeleteItem(null)} onConfirm={() => deleteItem && remove.mutate(deleteItem.id)} />
    </div>
  )
}