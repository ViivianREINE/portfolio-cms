import client from './client'

export function galleryApi(resource) {
  const base = `/admin/${resource}`
  return {
    async attach(id, body) {
      return (await client.post(`${base}/${id}/gallery`, body)).data
    },
    async reorder(id, orderedIds) {
      return (await client.put(`${base}/${id}/gallery/order`, { orderedIds })).data
    },
    async remove(id, itemId) {
      return (await client.delete(`${base}/${id}/gallery/${itemId}`)).data
    },
    async setCover(id, itemId) {
      return (await client.patch(`${base}/${id}/gallery/${itemId}/cover`)).data
    },
  }
}
