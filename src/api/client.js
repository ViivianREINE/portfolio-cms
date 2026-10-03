import axios from 'axios'

export const AUTH_STORAGE_KEYS = {
  access: 'portfolio-cms.access-token',
  refresh: 'portfolio-cms.refresh-token',
}

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const client = axios.create({ baseURL, timeout: 20000 })
let refreshRequest

function clearTokens() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.access)
  localStorage.removeItem(AUTH_STORAGE_KEYS.refresh)
  window.dispatchEvent(new CustomEvent('portfolio-auth:expired'))
}

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.access)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config
    const isAuthRequest = /\/auth\/(login|refresh)$/.test(request?.url || '')

    if (error.response?.status !== 401 || !request || request._retry || isAuthRequest) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.refresh)
    if (!refreshToken) {
      clearTokens()
      if (window.location.pathname !== '/login') window.location.assign('/login')
      return Promise.reject(error)
    }

    request._retry = true
    try {
      refreshRequest ||= axios.post(`${baseURL}/auth/refresh`, { refreshToken }, { timeout: 20000 })
      const response = await refreshRequest
      const tokens = response.data?.data
      if (!tokens?.accessToken || !tokens?.refreshToken) throw new Error('Refresh response was incomplete.')
      localStorage.setItem(AUTH_STORAGE_KEYS.access, tokens.accessToken)
      localStorage.setItem(AUTH_STORAGE_KEYS.refresh, tokens.refreshToken)
      request.headers.Authorization = `Bearer ${tokens.accessToken}`
      return client(request)
    } catch (refreshError) {
      clearTokens()
      if (window.location.pathname !== '/login') window.location.assign('/login')
      return Promise.reject(refreshError)
    } finally {
      refreshRequest = undefined
    }
  },
)

export default client