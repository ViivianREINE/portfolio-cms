import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../components/common/States'
import useAuth from '../hooks/useAuth'

export default function ProtectedRoute() {
  const { ready, isAuthenticated } = useAuth()
  const location = useLocation()
  if (!ready) return <LoadingState label="Restoring your session…" />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}