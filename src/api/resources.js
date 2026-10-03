import client from './client'

export function createResourceApi(resource) {
  const path = `/admin/${resource}`
  return {
    async list(params = { page: 1, limit: 20 }) {
      return (await client.get(path, { params })).data
    },
    async get(id) {
      return (await client.get(`${path}/${id}`)).data
    },
    async create(payload) {
      return (await client.post(path, payload)).data
    },
    async update(id, payload) {
      return (await client.put(`${path}/${id}`, payload)).data
    },
    async remove(id) {
      return (await client.delete(`${path}/${id}`)).data
    },
  }
}