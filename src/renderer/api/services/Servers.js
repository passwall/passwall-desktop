import HTTPClient from '@/api/HTTPClient'

export default class ServersService {
  static async FetchAll(query) {
    return HTTPClient.get(`/api/servers`, query)
  }

  static async Get(id) {
    return HTTPClient.get(`/api/servers/${id}`)
  }

  static async Create(payload) {
    return HTTPClient.post(`/api/servers`, payload)
  }

  static async Update(id, payload) {
    return HTTPClient.put(`/api/servers/${id}`, payload)
  }

  static async Delete(id) {
    return HTTPClient.delete(`/api/servers/${id}`)
  }
}
