import Axios from 'axios'

const client = Axios.create({
  baseURL: 'http://89.252.131.83:3625',
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
      requestId: Math.random().toString(32),
      params,
      headers
    })
  }

  static async post(path, data = {}, headers = {}, onUploadProgress, cancelToken) {
    return client.post(path, data, {
      requestId: Math.random().toString(32),
      headers,
      onUploadProgress,
      cancelToken
    })
  }

  static async put(path, data = {}, headers = {}) {
    return client.put(path, data, {
      requestId: Math.random().toString(32),
      headers
    })
  }

  static async delete(path, data = {}, headers = {}) {
    return client.delete(path, {
      requestId: Math.random().toString(32),
      data,
      headers
    })
  }

  static async setHeader(key, value) {
    client.defaults.headers.common[key] = value
  }
}
