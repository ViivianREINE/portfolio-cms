import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, size = 'max-w-2xl' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/35 p-0 sm:items-center sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white px-5 py-4 sm:px-7">
          <h2 id="modal-title" className="text-lg font-bold text-stone-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="grid size-9 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"><X size={18} /></button>
        </header>
        <div className="px-5 py-5 sm:px-7 sm:py-6">{children}</div>
      </section>
    </div>
  )
}