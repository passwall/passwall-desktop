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

// Token refresh interceptor
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return client(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = typeof localStorage !== 'undefined' ? localStorage.refresh_token : null

      if (!refreshToken) {
        isRefreshing = false
        return Promise.reject(error)
      }

      try {
        const { data } = await Axios.post(
          `${client.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        )

        const newAccessToken = data.access_token
        const newRefreshToken = data.refresh_token || refreshToken

        localStorage.access_token = newAccessToken
        localStorage.refresh_token = newRefreshToken

        client.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        processQueue(null, newAccessToken)
        return client(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        // Clear tokens on refresh failure
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

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
