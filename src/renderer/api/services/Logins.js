import HTTPClient from '@/api/HTTPClient'

export default class LoginsService {
  static async FetchAll(query) {
    return HTTPClient.get(`/api/logins`, query)
  }

  static async Get(id) {
    return HTTPClient.get(`/api/login/${id}`)
  }

  static async Create(payload) {
    return HTTPClient.post(`/api/login`, payload)
  }

  static async Update(id, payload) {
    return HTTPClient.put(`/api/login/${id}`, payload)
  }

  static async Delete(id) {
    return HTTPClient.delete(`/api/login/${id}`)
  }
}
