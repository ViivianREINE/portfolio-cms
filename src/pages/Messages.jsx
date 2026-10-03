import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Mail, Trash2 } from 'lucide-react'
import { deleteMessage, listMessages, updateMessageStatus } from '../api/messages'
import Button from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import DataTable from '../components/tables/DataTable'
import Modal from '../components/common/Modal'
import { EmptyState, ErrorState, LoadingState } from '../components/common/States'
import { Select } from '../components/common/FormFields'
import useToast from '../hooks/useToast'
import { formatDate } from '../utils/format'
import { getErrorMessage } from '../utils/errors'

const statuses = ['NEW', 'READ', 'REPLIED', 'ARCHIVED']

function StatusPill({ status }) {
  const styles = { NEW: 'bg-amber-50 text-amber-800', READ: 'bg-sky-50 text-sky-800', REPLIED: 'bg-emerald-50 text-emerald-800', ARCHIVED: 'bg-stone-100 text-stone-600' }
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status] || styles.ARCHIVED}`}>{status}</span>
}

export default function Messages() {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const queryClient = useQueryClient()
  const notify = useToast()
  const queryKey = ['messages', page]
  const messages = useQuery({ queryKey, queryFn: () => listMessages({ page, limit: 20 }) })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['messages'] })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateMessageStatus(id, status),
    onSuccess: async (response) => {
      if (selected?.id === response.data.id) setSelected(response.data)
      await refresh()
      await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      notify('Message status updated.')
    },
    onError: (error) => notify(getErrorMessage(error), 'error'),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteMessage,
    onSuccess: async () => {
      setSelected(null)
      setToDelete(null)
      await refresh()
      await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      notify('Message deleted.')
    },
    onError: (error) => notify(getErrorMessage(error), 'error'),
  })

  if (messages.isPending) return <LoadingState label="Loading the inbox…" />
  if (messages.isError) return <ErrorState message={getErrorMessage(messages.error)} onRetry={() => messages.refetch()} />

  const rows = messages.data.data || []
  const meta = messages.data.meta
  const columns = [
    { key: 'sender', label: 'Sender', render: (row) => <div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-900">{row.name?.slice(0, 1)?.toUpperCase() || 'M'}</span><span className="min-w-0"><span className="block max-w-44 truncate font-semibold text-stone-900">{row.name}</span><span className="block max-w-44 truncate text-xs text-stone-500">{row.email}</span></span></div> },
    { key: 'subject', label: 'Subject', render: (row) => <span className="block max-w-52 truncate">{row.subject || 'General inquiry'}</span> },
    { key: 'message', label: 'Message', render: (row) => <span className="block max-w-64 truncate text-stone-500">{row.message}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} /> },
    { key: 'createdAt', label: 'Received', render: (row) => formatDate(row.createdAt) },
    { key: 'actions', label: '', render: (row) => <div className="flex justify-end gap-1"><button type="button" title="View message" aria-label="View message" onClick={() => setSelected(row)} className="grid size-9 place-items-center rounded-lg text-stone-500 hover:bg-sky-50 hover:text-sky-800"><Eye size={16} /></button><button type="button" title="Delete message" aria-label="Delete message" onClick={() => setToDelete(row)} className="grid size-9 place-items-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={15} /></button></div> },
  ]

  return (
    <div className="space-y-5">
      <section className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Inbox</p><h2 className="mt-1 text-2xl font-bold tracking-normal text-stone-900">Messages</h2><p className="mt-1.5 text-sm text-stone-500">Contact submissions from your portfolio.</p></div><div className="hidden items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-500 sm:flex"><Mail size={15} /> {meta?.total || 0} total</div></section>
      <section className="overflow-hidden rounded-xl border border-stone-200/80 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-3.5"><span className="text-xs font-semibold text-stone-500">Page {meta?.page || 1} · {meta?.total || rows.length} messages</span><span className="flex items-center gap-2 text-[11px] text-stone-400">{statuses.map((status) => <StatusPill key={status} status={status} />)}</span></div>
        {rows.length ? <DataTable columns={columns} rows={rows} /> : <EmptyState title="Your inbox is clear" description="New contact form submissions will appear here." />}
        {meta?.totalPages > 1 && <div className="flex justify-end gap-2 border-t border-stone-100 px-5 py-3"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button variant="secondary" disabled={page >= meta.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button></div>}
      </section>
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Message details" size="max-w-xl">
        {selected && <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-wider text-stone-400">From</p><p className="mt-1 font-semibold text-stone-900">{selected.name}</p><a className="text-sm text-emerald-800 hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a></div><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wider text-stone-400">Subject</p><p className="mt-1 text-sm text-stone-800">{selected.subject || 'General inquiry'}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-stone-400">Received</p><p className="mt-1 text-sm text-stone-800">{formatDate(selected.createdAt)}</p></div></div><div><p className="text-xs font-bold uppercase tracking-wider text-stone-400">Message</p><p className="mt-2 whitespace-pre-wrap rounded-lg bg-stone-50 p-4 text-sm leading-6 text-stone-700">{selected.message}</p></div><div className="flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-end sm:justify-between"><StatusPill status={selected.status} /><div className="flex items-end gap-2"><Select id="message-status" label="Update status" options={statuses.map((status) => ({ value: status, label: status }))} value={selected.status} onChange={(event) => statusMutation.mutate({ id: selected.id, status: event.target.value })} /><Button type="button" variant="secondary" onClick={() => setSelected(null)}>Close</Button></div></div></div>}
      </Modal>
      <ConfirmDialog open={Boolean(toDelete)} title="Delete this message?" description="This message will be permanently removed from the inbox." busy={deleteMutation.isPending} onCancel={() => setToDelete(null)} onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)} />
    </div>
  )
}