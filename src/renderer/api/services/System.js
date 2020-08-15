import HTTPClient from '@/api/HTTPClient'

export default class SystemService {
  static async GeneratePassword() {
    return HTTPClient.post(`/api/system/generate-password`)
  }

  static async Import(data) {
    return HTTPClient.post(`/api/system/import`, data)
  }

  static async Export() {
    return HTTPClient.post(`/api/system/export`)
  }
}
