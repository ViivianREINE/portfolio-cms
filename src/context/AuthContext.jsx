import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getCurrentUser, login as loginRequest, refreshSession } from '../api/auth'
import { AUTH_STORAGE_KEYS } from '../api/client'
import AuthContext from './auth-context'

function clearStoredTokens() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.access)
  localStorage.removeItem(AUTH_STORAGE_KEYS.refresh)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true
    const restore = async () => {
      const accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.access)
      const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.refresh)
      if (!accessToken && !refreshToken) {
        if (active) setReady(true)
        return
      }

      try {
        if (!accessToken && refreshToken) {
          const refreshed = await refreshSession(refreshToken)
          localStorage.setItem(AUTH_STORAGE_KEYS.access, refreshed.data.accessToken)
          localStorage.setItem(AUTH_STORAGE_KEYS.refresh, refreshed.data.refreshToken)
        }
        const response = await getCurrentUser()
        if (active) setUser(response.data)
      } catch {
        clearStoredTokens()
        if (active) setUser(null)
      } finally {
        if (active) setReady(true)
      }
    }

    restore()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      setReady(true)
      queryClient.clear()
    }
    window.addEventListener('portfolio-auth:expired', onExpired)
    return () => window.removeEventListener('portfolio-auth:expired', onExpired)
  }, [queryClient])

  const value = useMemo(() => ({
    user,
    ready,
    isAuthenticated: Boolean(user),
    async signIn(credentials) {
      const response = await loginRequest(credentials)
      localStorage.setItem(AUTH_STORAGE_KEYS.access, response.data.accessToken)
      localStorage.setItem(AUTH_STORAGE_KEYS.refresh, response.data.refreshToken)
      queryClient.clear()
      setUser(response.data.user)
      return response.data.user
    },
    signOut() {
      clearStoredTokens()
      queryClient.clear()
      setUser(null)
    },
  }), [user, ready, queryClient])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}