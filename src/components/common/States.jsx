import { AlertCircle, LoaderCircle, PackageOpen, RefreshCw } from 'lucide-react'
import Button from './Button'

export function LoadingState({ label = 'Loading records…' }) {
  return <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-sm text-stone-500" role="status" aria-live="polite"><LoaderCircle className="animate-spin text-emerald-700" size={22} /><span>{label}</span></div>
}

export function EmptyState({ title = 'Nothing here yet', description = 'Records will appear here when they are available.', action }) {
  return <div className="flex min-h-60 flex-col items-center justify-center px-5 text-center" role="status"><span className="grid size-12 place-items-center rounded-xl bg-stone-100 text-stone-500"><PackageOpen size={21} /></span><h3 className="mt-4 text-base font-bold text-stone-800">{title}</h3><p className="mt-1 max-w-sm text-sm leading-6 text-stone-500">{description}</p>{action && <div className="mt-5">{action}</div>}</div>
}

export function ErrorState({ message = 'The request failed.', onRetry }) {
  return <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center" role="alert"><AlertCircle size={24} className="text-rose-600" /><p className="mt-3 max-w-lg text-sm text-stone-600">{message}</p>{onRetry && <Button className="mt-4" variant="secondary" icon={RefreshCw} onClick={onRetry}>Try again</Button>}</div>
}