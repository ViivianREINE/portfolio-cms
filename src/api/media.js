import client from './client'

export async function listMedia(params = { page: 1, limit: 20 }) {
  return (await client.get('/admin/media', { params })).data
}

export async function uploadMedia(file) {
  const form = new FormData()
  form.append('file', file)
  return (await client.post('/admin/media/upload', form)).data
}

export async function deleteMedia(id) {
  return (await client.delete(`/admin/media/${id}`)).data
}