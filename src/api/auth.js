import client from './client'

export async function login(credentials) {
  return (await client.post('/auth/login', credentials)).data
}

export async function getCurrentUser() {
  return (await client.get('/auth/me')).data
}

export async function refreshSession(refreshToken) {
  return (await client.post('/auth/refresh', { refreshToken })).data
}