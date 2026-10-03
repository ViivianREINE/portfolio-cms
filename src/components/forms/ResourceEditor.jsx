import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { listAllMedia } from '../../api/media'
import Button from '../common/Button'
import { Checkbox, Input, Select, Textarea } from '../common/FormFields'
import Modal from '../common/Modal'
import { toDateTimeLocal } from '../../utils/format'

function defaultValues(fields, item) {
  return Object.fromEntries(fields.map((field) => {
    let value = item?.[field.name]
    if (field.type === 'datetime') value = toDateTimeLocal(value)
    if (field.name === 'stack' && Array.isArray(value)) value = value.join(', ')
    if (field.type === 'checkbox') value = item ? Boolean(value) : Boolean(field.defaultValue)
    if (value === null || value === undefined) value = field.defaultValue ?? ''
    return [field.name, value]
  }))
}

function payloadValue(field, value) {
  if (field.name === 'stack') return value.split(',').map((item) => item.trim()).filter(Boolean)
  if (field.type === 'number') return value === '' || Number.isNaN(value) ? (field.nullable ? null : undefined) : Number(value)
  if (field.type === 'datetime') return value ? new Date(value).toISOString() : null
  if (field.name.endsWith('ImageId') && value === '') return null
  return value
}

export default function ResourceEditor({ config, item, busy, onClose, onSave }) {
  const editing = Boolean(item?.id)
  const mediaQuery = useQuery({
    queryKey: ['media', 'all'],
    queryFn: listAllMedia,
    enabled: config.fields.some((field) => field.type === 'media'),
  })
  const { register, reset, handleSubmit, formState: { errors, dirtyFields } } = useForm({
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
            if (field.type === 'media') return <Select key={field.name} id={field.name} label={field.label} error={error} className="sm:col-span-2" options={[{ value: '', label: 'No image selected' }, ...(mediaQuery.data?.data || []).map((media) => ({ value: media.id, label: media.originalName }))]} {...registration} />
            if (field.type === 'select') return <Select key={field.name} id={field.name} label={field.label} error={error} className="sm:col-span-1" options={field.options.map(([value, label]) => ({ value, label }))} {...registration} />
            return <Input key={field.name} id={field.name} type={field.type === 'datetime' ? 'datetime-local' : field.type || 'text'} label={field.label} required={field.required} min={field.min} max={field.max} error={error} hint={field.hint} className={field.type === 'url' || field.type === 'datetime' ? 'sm:col-span-2' : ''} {...registration} />
          })}
        </div>
        <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create record'}</Button>
        </div>
      </form>
    </Modal>
  )
}