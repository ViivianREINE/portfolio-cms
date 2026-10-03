import client from './client'

export async function getAbout() {
  return (await client.get('/admin/about')).data
}

export async function createAbout(payload) {
  return (await client.post('/admin/about', payload)).data
}

export async function updateAbout(id, payload) {
  return (await client.put(`/admin/about/${id}`, payload)).data
}