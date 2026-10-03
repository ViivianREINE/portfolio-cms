import { AlertTriangle } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'

export default function ConfirmDialog({ open, title = 'Delete this item?', description = 'This action cannot be undone.', busy = false, onCancel, onConfirm }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="max-w-md">
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-700"><AlertTriangle size={19} /></span>
        <p className="pt-1 text-sm leading-6 text-stone-600">{description}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? 'Deleting…' : 'Delete'}</Button>
      </div>
    </Modal>
  )
}