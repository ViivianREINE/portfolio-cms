import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { listAllMedia } from '../../api/media'
import Button from '../common/Button'
import { Checkbox, Input, Select, Textarea } from '../common/FormFields'
import Modal from '../common/Modal'
import { toDateTimeLocal } from '../../utils/format'
import GalleryManager from './GalleryManager'

function defaultValues(fields, item) {
  return Object.fromEntries(fields.map((field) => {
    let value = item?.[field.name]
    if (field.type === 'datetime') value = toDateTimeLocal(value)
    if ((field.name === 'stack' || field.list) && Array.isArray(value)) value = value.join(', ')
    if (field.type === 'checkbox') value = item ? Boolean(value) : Boolean(field.defaultValue)
    if (value === null || value === undefined) value = field.defaultValue ?? ''
    return [field.name, value]
  }))
}

function payloadValue(field, value) {
  if (field.name === 'stack' || field.list) return String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
  if (field.type === 'number') return value === '' || Number.isNaN(value) ? (field.nullable ? null : undefined) : Number(value)
  if (field.type === 'datetime') return value ? new Date(value).toISOString() : null
  if (field.name.endsWith('ImageId') && value === '') return null
  return value
}

function mediaPreview(url, alt) {
  if (!url) return null
  return <img src={url} alt={alt} className="mt-2 h-36 w-full rounded-lg bg-stone-100 object-contain" />
}

function MediaField({ field, error, media, registration, control }) {
  const selected = useWatch({ control, name: field.name })
  const current = (media || []).find((item) => item.id === selected)
  return (
    <div className="sm:col-span-2">
      <Select id={field.name} label={field.label} error={error} hint={field.hint} options={[{ value: '', label: 'No image selected' }, ...(media || []).map((item) => ({ value: item.id, label: item.originalName }))]} {...registration} />
      {current?.publicUrl ? mediaPreview(current.publicUrl, current.originalName || field.label) : <p className="mt-2 text-xs text-stone-500">No image attached yet. Upload it in the media library, then choose it here.</p>}
    </div>
  )
}

export default function ResourceEditor({ config, item, busy, onClose, onSave, onRecordChange }) {
  const editing = Boolean(item?.id)
  const mediaQuery = useQuery({
    queryKey: ['media', 'all'],
    queryFn: listAllMedia,
    enabled: config.fields.some((field) => field.type === 'media'),
  })
  const { register, reset, control, handleSubmit, formState: { errors, dirtyFields } } = useForm({
    resolver: zodResolver(editing ? config.schema.partial() : config.schema),
    defaultValues: defaultValues(config.fields, item),
  })

  useEffect(() => reset(defaultValues(config.fields, item)), [config, item, reset])

  const submit = async (values) => {
    const names = editing ? Object.keys(dirtyFields) : config.fields.map((field) => field.name)
    const payload = Object.fromEntries(names.map((name) => {
      const field = config.fields.find((entry) => entry.name === name)
      return [name, payloadValue(field, values[name])]
    }).filter(([, value]) => value !== undefined))
    await onSave(payload, { editing })
  }

  return (
    <Modal open onClose={onClose} title={`${editing ? 'Edit' : 'New'} ${config.singular}`}>
      <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {config.fields.map((field) => {
            const error = errors[field.name]?.message
            const registration = register(field.name, field.type === 'number' ? { valueAsNumber: true } : undefined)
            if (field.type === 'checkbox') return <Checkbox key={field.name} id={field.name} label={field.label} className="sm:col-span-2" {...registration} />
            if (field.type === 'textarea') return <Textarea key={field.name} id={field.name} label={field.label} rows={field.rows || 3} error={error} hint={field.hint} className="sm:col-span-2" {...registration} />
            if (field.type === 'media') return <MediaField key={field.name} field={field} error={error} media={mediaQuery.data?.data || []} registration={registration} control={control} />
            if (field.type === 'select') return <Select key={field.name} id={field.name} label={field.label} error={error} className="sm:col-span-1" options={field.options.map(([value, label]) => ({ value, label }))} {...registration} />
            return <Input key={field.name} id={field.name} type={field.type === 'datetime' ? 'datetime-local' : field.type || 'text'} label={field.label} required={field.required} min={field.min} max={field.max} error={error} hint={field.hint} className={field.type === 'url' || field.type === 'datetime' ? 'sm:col-span-2' : ''} {...registration} />
          })}
        </div>
        {config.galleryResource && editing && <GalleryManager resource={config.galleryResource} recordId={item.id} items={item.gallery || []} hasCover={Boolean(item.coverImageId)} onUpdated={onRecordChange} />}
        {config.galleryResource && !editing && <p className="text-xs text-stone-500">Save this record first. Gallery images can be uploaded and ordered after it exists.</p>}
        <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create record'}</Button>
        </div>
      </form>
    </Modal>
  )
}