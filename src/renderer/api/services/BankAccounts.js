import HTTPClient from '@/api/HTTPClient'

export default class BankAccountsService {
  static async FetchAll(query) {
    return HTTPClient.get(`/api/bank-accounts`, query)
  }

  static async Get(id) {
    return HTTPClient.get(`/api/bank-accounts/${id}`)
  }

  static async Create(payload) {
    return HTTPClient.post(`/api/bank-accounts`, payload)
  }

  static async Update(id, payload) {
    return HTTPClient.put(`/api/bank-accounts/${id}`, payload)
  }

  static async Delete(id) {
    return HTTPClient.delete(`/api/bank-accounts/${id}`)
  }
}
