import HTTPClient from '@/api/HTTPClient'

export default class NotesService {
  static async FetchAll(query) {
    return HTTPClient.get(`/api/notes`, query)
  }

  static async Get(id) {
    return HTTPClient.get(`/api/notes/${id}`)
  }

  static async Create(payload) {
    return HTTPClient.post(`/api/notes`, payload)
  }

  static async Update(id, payload) {
    return HTTPClient.put(`/api/notes/${id}`, payload)
  }

  static async Delete(id) {
    return HTTPClient.delete(`/api/notes/${id}`)
  }
}
