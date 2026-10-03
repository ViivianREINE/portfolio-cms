import client from './client'

export async function listMedia(params = { page: 1, limit: 20 }) {
  return (await client.get('/admin/media', { params })).data
}

export async function listAllMedia() {
  const first = await listMedia({ page: 1, limit: 20 })
  const rows = [...(first.data || [])]
  const pages = first.meta?.totalPages || 1
  for (let page = 2; page <= pages; page += 1) {
    const next = await listMedia({ page, limit: 20 })
    rows.push(...(next.data || []))
  }
  return { ...first, data: rows }
}

export async function uploadMedia(file) {
  const form = new FormData()
  form.append('file', file)
  return (await client.post('/admin/media/upload', form)).data
}

export async function deleteMedia(id) {
  return (await client.delete(`/admin/media/${id}`)).data
}