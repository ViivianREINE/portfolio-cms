import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2, UploadCloud } from 'lucide-react'
import { galleryApi } from '../../api/gallery'
import { listAllMedia, uploadMedia } from '../../api/media'
import Button from '../common/Button'
import { getErrorMessage } from '../../utils/errors'
import useToast from '../../hooks/useToast'

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']

function previewUrl(media) {
  if (!media?.publicUrl) return ''
  try {
    const url = new URL(media.publicUrl)
    url.searchParams.set('v', String(media.size || media.id))
    return url.toString()
  } catch {
    return media.publicUrl
  }
}

export default function GalleryManager({ resource, recordId, items = [], hasCover = false, onUpdated }) {
  const api = galleryApi(resource)
  const notify = useToast()
  const queryClient = useQueryClient()
  const inputRef = useRef(null)
  const [libraryId, setLibraryId] = useState('')
  const [status, setStatus] = useState('Ready')
  const mediaQuery = useQuery({ queryKey: ['media', 'all'], queryFn: listAllMedia })
  const attachedIds = new Set(items.map((item) => item.mediaId || item.media?.id))
  const library = (mediaQuery.data?.data || []).filter((media) => !attachedIds.has(media.id))

  const refresh = async (response) => {
    if (response?.data) onUpdated?.(response.data)
    await queryClient.invalidateQueries({ queryKey: ['resource'] })
    await queryClient.invalidateQueries({ queryKey: ['media'] })
  }

  const fail = (error) => {
    setStatus('Upload failed')
    notify(getErrorMessage(error), 'error')
  }

  const attach = useMutation({
    mutationFn: (body) => api.attach(recordId, body),
    onSuccess: async (response) => {
      setLibraryId('')
      setStatus('Attached')
      await refresh(response)
      notify('Image attached.')
    },
    onError: fail,
  })

  const upload = useMutation({
    mutationFn: async (file) => {
      setStatus('Uploading')
      const uploaded = await uploadMedia(file)
      setStatus('Attaching')
      return api.attach(recordId, { mediaId: uploaded.data.id, isCover: items.length === 0 && !hasCover })
    },
    onSuccess: async (response) => {
      if (inputRef.current) inputRef.current.value = ''
      setStatus('Uploaded')
      await refresh(response)
      notify('Image uploaded and attached.')
    },
    onError: fail,
  })

  const reorder = useMutation({
    mutationFn: (orderedIds) => api.reorder(recordId, orderedIds),
    onSuccess: async (response) => {
      await refresh(response)
    },
    onError: (error) => notify(getErrorMessage(error), 'error'),
  })

  const remove = useMutation({
    mutationFn: (itemId) => api.remove(recordId, itemId),
    onSuccess: async (response) => {
      await refresh(response)
      notify('Image removed from this gallery. The media library copy is unchanged.')
    },
    onError: (error) => notify(getErrorMessage(error), 'error'),
  })

  const cover = useMutation({
    mutationFn: (itemId) => api.setCover(recordId, itemId),
    onSuccess: async (response) => {
      await refresh(response)
      notify('Cover image updated.')
    },
    onError: (error) => notify(getErrorMessage(error), 'error'),
  })

  const move = (index, direction) => {
    const next = items.map((item) => item.id)
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const [id] = next.splice(index, 1)
    next.splice(target, 0, id)
    reorder.mutate(next)
  }

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
    upload.mutate(file)
  }

  const busy = upload.isPending || attach.isPending || reorder.isPending || remove.isPending || cover.isPending

  return (
    <section className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-stone-900">Gallery</h3>
          <p className="mt-1 text-xs text-stone-500">Upload a new image or attach one from the media library. The first hackathon image becomes the cover until you choose another.</p>
        </div>
        <p className="text-xs font-semibold text-emerald-800" role="status" aria-live="polite">{status}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="min-w-0 flex-1 text-xs font-semibold text-stone-600">
          Upload
          <input ref={inputRef} type="file" accept={acceptedTypes.join(',')} disabled={busy} className="mt-1.5 block w-full text-sm text-stone-500 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-stone-700" onChange={(event) => chooseFile(event.target.files?.[0])} />
        </label>
        <label className="min-w-0 flex-1 text-xs font-semibold text-stone-600">
          Media library
          <span className="mt-1.5 flex gap-2">
            <select value={libraryId} disabled={busy || mediaQuery.isPending} onChange={(event) => setLibraryId(event.target.value)} className="block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800" aria-label="Choose an existing image">
              <option value="">{mediaQuery.isPending ? 'Loading images…' : 'Choose an existing image'}</option>
              {library.map((media) => <option key={media.id} value={media.id}>{media.originalName}</option>)}
            </select>
            <Button type="button" variant="secondary" icon={ImagePlus} disabled={busy || !libraryId} onClick={() => attach.mutate({ mediaId: libraryId, isCover: items.length === 0 && !hasCover })}>Attach</Button>
          </span>
        </label>
      </div>
      {upload.isPending && <p className="flex items-center gap-2 text-xs text-stone-500"><UploadCloud size={14} /> Uploading to storage…</p>}
      {items.length ? (
        <ol className="space-y-2">
          {items.map((item, index) => {
            const media = item.media
            const src = previewUrl(media)
            return (
              <li key={item.id} className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-2">
                <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-stone-100">
                  {src ? <img src={src} alt={media?.originalName || 'Gallery image'} className="h-full w-full object-cover" /> : <ImagePlus size={16} className="text-stone-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-800">{media?.originalName || 'Image'}</p>
                  <p className="truncate text-[11px] text-stone-400">{media?.filename || item.mediaId}</p>
                  {item.isCover && <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800">Cover</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" aria-label="Move image earlier" disabled={busy || index === 0} onClick={() => move(index, -1)} className="grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-30"><ArrowUp size={15} /></button>
                  <button type="button" aria-label="Move image later" disabled={busy || index === items.length - 1} onClick={() => move(index, 1)} className="grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-30"><ArrowDown size={15} /></button>
                  <button type="button" aria-label="Use as cover image" disabled={busy || item.isCover} onClick={() => cover.mutate(item.id)} className="grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-40"><Star size={15} /></button>
                  <button type="button" aria-label="Remove image from gallery" disabled={busy} onClick={() => remove.mutate(item.id)} className="grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={15} /></button>
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="rounded-lg border border-dashed border-stone-200 bg-white px-3 py-4 text-sm text-stone-500" role="status">No gallery images yet. Upload the files for this record when you have them.</p>
      )}
    </section>
  )
}
