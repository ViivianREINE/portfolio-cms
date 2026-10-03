import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, ImagePlus, Trash2, UploadCloud } from 'lucide-react'
import { deleteMedia, listMedia, uploadMedia } from '../api/media'
import Button from '../components/common/Button'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '../components/common/States'
import useToast from '../hooks/useToast'
import { formatDate } from '../utils/format'
import { getErrorMessage } from '../utils/errors'

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']

function getMediaUrl(item) {
  const url = new URL(item.publicUrl)
  url.searchParams.set('v', String(item.size))
  return url.toString()
}

export default function Media() {
  const [page, setPage] = useState(1)
  const [selectedFile, setSelectedFile] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [copiedId, setCopiedId] = useState('')
  const inputRef = useRef(null)
  const queryClient = useQueryClient()
  const notify = useToast()
  const mediaQuery = useQuery({ queryKey: ['media', page], queryFn: () => listMedia({ page, limit: 20 }) })
  const uploadMutation = useMutation({
    mutationFn: uploadMedia,
    onSuccess: async () => {
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
      await queryClient.invalidateQueries({ queryKey: ['media'] })
      notify('Media uploaded.')
    },
    onError: (error) => notify(getErrorMessage(error), 'error'),
  })
  const removeMutation = useMutation({
    mutationFn: deleteMedia,
    onSuccess: async () => {
      setToDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['media'] })
      notify('Media deleted.')
    },
    onError: (error) => notify(getErrorMessage(error), 'error'),
  })

  const chooseFile = (file) => {
    if (!file) return
    if (!acceptedTypes.includes(file.type)) {
      notify('Choose a JPEG, PNG, WebP, GIF, or SVG image.', 'error')
      return
    }
    if (file.size > 30 * 1024 * 1024) {
      notify('The maximum file size is 30 MB.', 'error')
      return
    }
    setSelectedFile(file)
  }

  const copyUrl = async (item) => {
    if (!item.publicUrl) return
    await navigator.clipboard.writeText(getMediaUrl(item))
    setCopiedId(item.id)
    window.setTimeout(() => setCopiedId(''), 1600)
    notify('Public URL copied.')
  }

  if (mediaQuery.isPending) return <LoadingState label="Loading the media library…" />
  if (mediaQuery.isError) return <ErrorState message={getErrorMessage(mediaQuery.error)} onRetry={() => mediaQuery.refetch()} />
  const items = mediaQuery.data.data || []
  const meta = mediaQuery.data.meta

  return (
    <div className="space-y-5">
      <section><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Assets</p><h2 className="mt-1 text-2xl font-bold tracking-normal text-stone-900">Media library</h2><p className="mt-1.5 text-sm text-stone-500">Images are stored through the portfolio API.</p></section>
      <section className="rounded-xl border border-stone-200/80 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><UploadCloud size={20} /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-bold text-stone-900">Upload an image</h3><p className="mt-1 text-xs text-stone-500">JPEG, PNG, WebP, GIF, or SVG · up to 30 MB</p></div><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" className="block w-full text-sm text-stone-500 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-stone-700 hover:file:bg-stone-200 sm:max-w-xs" onChange={(event) => chooseFile(event.target.files?.[0])} /></div>
        {selectedFile && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-stone-50 px-4 py-3"><span className="flex min-w-0 items-center gap-2 text-sm text-stone-700"><ImagePlus size={16} className="shrink-0 text-emerald-700" /><span className="truncate">{selectedFile.name}</span><span className="shrink-0 text-xs text-stone-400">({(selectedFile.size / 1024).toFixed(0)} KB)</span></span><div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => { setSelectedFile(null); if (inputRef.current) inputRef.current.value = '' }}>Cancel</Button><Button type="button" icon={UploadCloud} disabled={uploadMutation.isPending} onClick={() => uploadMutation.mutate(selectedFile)}>{uploadMutation.isPending ? 'Uploading…' : 'Upload'}</Button></div></div>}
      </section>
      {items.length ? <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-stone-200/80 bg-white"><div className="grid aspect-[16/10] place-items-center bg-stone-100">{item.publicUrl ? <img src={getMediaUrl(item)} alt={item.originalName} className="h-full w-full object-contain" /> : <ImagePlus size={28} className="text-stone-300" />}</div><div className="p-4"><p className="truncate text-sm font-bold text-stone-800" title={item.originalName}>{item.originalName}</p><p className="mt-1 truncate text-xs text-stone-400">{item.mimeType} · {(item.size / 1024).toFixed(0)} KB · {formatDate(item.createdAt)}</p><div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3"><span className="select-all truncate pr-3 font-mono text-[10px] text-stone-400" title={item.id}>{item.id}</span><div className="flex shrink-0 gap-1">{item.publicUrl && <><button type="button" title="Open public URL" aria-label="Open public URL" onClick={() => window.open(getMediaUrl(item), '_blank', 'noopener,noreferrer')} className="grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"><ExternalLink size={15} /></button><button type="button" title="Copy public URL" aria-label="Copy public URL" onClick={() => copyUrl(item)} className="grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-emerald-50 hover:text-emerald-800">{copiedId === item.id ? <Check size={15} /> : <Copy size={15} />}</button></>}<button type="button" title="Delete media" aria-label="Delete media" onClick={() => setToDelete(item)} className="grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={15} /></button></div></div></div></article>)}</section> : <section className="rounded-xl border border-stone-200/80 bg-white"><EmptyState title="No media uploaded" description="Upload a portfolio image to make it available to your content." /></section>}
      {meta?.totalPages > 1 && <div className="flex items-center justify-between rounded-xl border border-stone-200/80 bg-white px-4 py-3"><span className="text-xs text-stone-500">Page {meta.page} of {meta.totalPages}</span><div className="flex gap-1"><button type="button" aria-label="Previous media page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="grid size-9 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30"><ChevronLeft size={17} /></button><button type="button" aria-label="Next media page" disabled={page >= meta.totalPages} onClick={() => setPage((current) => current + 1)} className="grid size-9 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30"><ChevronRight size={17} /></button></div></div>}
      <ConfirmDialog open={Boolean(toDelete)} title="Delete this image?" description="The asset will be removed from storage and the media library." busy={removeMutation.isPending} onCancel={() => setToDelete(null)} onConfirm={() => toDelete && removeMutation.mutate(toDelete.id)} />
    </div>
  )
}