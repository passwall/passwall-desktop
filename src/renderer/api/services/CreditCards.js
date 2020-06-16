import HTTPClient from '@/api/HTTPClient'

export default class LoginsService {
  static async FetchAll(query) {
    return HTTPClient.get(`/api/credit-cards`, query)
  }

  static async Get(id) {
    return HTTPClient.get(`/api/credit-cards/${id}`)
  }

  static async Create(payload) {
    return HTTPClient.post(`/api/credit-cards`, payload)
  }

  static async Update(id, payload) {
    return HTTPClient.put(`/api/credit-cards/${id}`, payload)
  }

  static async Delete(id) {
    return HTTPClient.delete(`/api/credit-cards/${id}`)
  }
}
