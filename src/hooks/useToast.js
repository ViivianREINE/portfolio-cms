import { useContext } from 'react'
import ToastContext from '../context/toast-context'

export default function useToast() {
  const notify = useContext(ToastContext)
  if (!notify) throw new Error('useToast must be used within ToastProvider.')
  return notify
}