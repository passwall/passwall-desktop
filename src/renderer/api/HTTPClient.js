import Axios from 'axios'
import CryptoUtils from '@/utils/crypto'

const client = Axios.create({
  baseURL: 'https://vault.passwall.io',
  // baseURL: 'http://localhost:3625',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json, text/plain, */*'
  }
})

export default class HTTPClient {
  static async head(path) {
    return client.head(path)
  }

  static async get(path, params = {}, headers = {}) {
    return client.get(path, {
      params,
      headers
    })
  }

  static async post(path, data = {}, headers = {}, onUploadProgress) {
    return client.post(path, data, {
      headers,
      onUploadProgress
    })
  }

  static async put(path, data = {}, headers = {}) {
    return client.put(path, data, {
      headers
    })
  }

  static async delete(path, data = {}, headers = {}) {
    return client.delete(path, {
      data,
      headers
    })
  }

  static setHeader(key, value) {
    client.defaults.headers.common[key] = value
  }
}
