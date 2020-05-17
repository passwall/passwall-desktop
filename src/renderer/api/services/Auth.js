import HTTPClient from '@/api/HTTPClient'

export default class AuthService {
  static async Login(payload) {
    return HTTPClient.post(`/auth/signin`, payload)
  }

  static async Check(payload) {
    return HTTPClient.post('/auth/check', payload)
  }

  static async Refresh(payload) {
    return HTTPClient.post(`/auth/refresh`, payload)
  }
}
