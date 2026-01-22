import Axios from 'axios'

const storedServer = typeof localStorage !== 'undefined' ? localStorage.server : ''
let baseURL = storedServer || 'https://api.passwall.io'

const client = Axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json, text/plain, */*'
  },
  withCredentials: false
})

const storedAccessToken = typeof localStorage !== 'undefined' ? localStorage.access_token : ''

if (storedAccessToken) {
  client.defaults.headers.common.Authorization = `Bearer ${storedAccessToken}`
}

export default class HTTPClient {
  static normalizeBaseURL(url) {
    return url
  }
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

  static setBaseURL(url) {
    client.defaults.baseURL = HTTPClient.normalizeBaseURL(url)
  }
}
