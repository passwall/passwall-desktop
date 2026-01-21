import HTTPClient from '@/api/HTTPClient'

export default class AuthService {
  static async PreLogin(email) {
    return HTTPClient.get(`/auth/prelogin?email=${encodeURIComponent(email)}`)
  }

  static async SignIn(payload) {
    return HTTPClient.post(`/auth/signin`, payload)
  }

  static async SignUp(payload) {
    return HTTPClient.post(`/auth/signup`, payload)
  }

  static async Login(payload) {
    return this.SignIn(payload)
  }

  static async Logout(payload) {
    return HTTPClient.post(`/api/signout`, payload)
  }

  static async Check(payload) {
    return HTTPClient.post('/auth/check', payload)
  }

  static async Refresh(payload) {
    return HTTPClient.post(`/auth/refresh`, payload)
  }

  static async ChangeMasterPassword(payload) {
    return HTTPClient.post(`/api/users/change-master-password`, payload)
  }
}
