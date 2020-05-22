import HTTPClient from '@/api/HTTPClient'

export default class SystemService {
  static async GeneratePassword() {
    return HTTPClient.post(`/api/logins/generate-password`)
  }
}
