import client from './client'

export async function listMessages(params = { page: 1, limit: 20 }) {
  return (await client.get('/admin/messages', { params })).data
}

export async function getMessage(id) {
  return (await client.get(`/admin/messages/${id}`)).data
}

export async function updateMessageStatus(id, status) {
  return (await client.patch(`/admin/messages/${id}/status`, { status })).data
}

export async function deleteMessage(id) {
  return (await client.delete(`/admin/messages/${id}`)).data
}