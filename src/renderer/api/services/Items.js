import HTTPClient from '@/api/HTTPClient'

export default class ItemsService {
  static async FetchAll(filter = {}) {
    return HTTPClient.get('/api/items', {
      page: 1,
      per_page: 5000,
      ...filter
    })
  }

  static async Get(id) {
    return HTTPClient.get(`/api/items/${id}`)
  }

  static async Create(payload) {
    return HTTPClient.post('/api/items', payload)
  }

  static async Update(id, payload) {
    return HTTPClient.put(`/api/items/${id}`, payload)
  }

  static async Delete(id) {
    return HTTPClient.delete(`/api/items/${id}`)
  }
}
