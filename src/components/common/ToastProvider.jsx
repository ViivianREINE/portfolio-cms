import { useCallback, useState } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'
import ToastContext from '../../context/toast-context'

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const dismiss = useCallback((id) => setItems((current) => current.filter((item) => item.id !== id)), [])
  const notify = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`
    setItems((current) => [...current, { id, message, type }])
    window.setTimeout(() => dismiss(id), 4500)
  }, [dismiss])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="fixed right-4 top-4 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {items.map((item) => <div key={item.id} className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-lg"><span className={item.type === 'error' ? 'text-rose-600' : 'text-emerald-700'}>{item.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}</span><p className="flex-1 text-sm leading-5 text-stone-700">{item.message}</p><button type="button" aria-label="Dismiss notification" onClick={() => dismiss(item.id)} className="text-stone-400 hover:text-stone-700"><X size={16} /></button></div>)}
      </div>
    </ToastContext.Provider>
  )
}