import HTTPClient from '@/api/HTTPClient'

export default class EmailsService {
  static async FetchAll(query) {
    return HTTPClient.get(`/api/emails`, query)
  }

  static async Get(id) {
    return HTTPClient.get(`/api/emails/${id}`)
  }

  static async Create(payload) {
    return HTTPClient.post(`/api/emails`, payload)
  }

  static async Update(id, payload) {
    return HTTPClient.put(`/api/emails/${id}`, payload)
  }

  static async Delete(id) {
    return HTTPClient.delete(`/api/emails/${id}`)
  }
}
