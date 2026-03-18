// API requests go through Electron main process via IPC (no CORS).
// Falls back to fetch() for non-Electron environments (dev without Electron).

const DEFAULT_BASE_URL = import.meta.env.DEV ? 'http://localhost:3625' : 'https://api.passwall.io'
let baseURL = DEFAULT_BASE_URL

function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json, text/plain, */*'
  }
  const token = typeof localStorage !== 'undefined' ? localStorage.access_token : ''
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function request(
  method,
  path,
  { data, params, headers: extraHeaders, onUploadProgress } = {}
) {
  let url = `${baseURL}${path}`

  if (params && Object.keys(params).length) {
    const qs = new URLSearchParams(params).toString()
    url += `?${qs}`
  }

  const headers = { ...getAuthHeaders(), ...extraHeaders }

  let response

  if (window.electronAPI?.api) {
    // Main-process proxy — no CORS
    response = await window.electronAPI.api.request({ method, url, data, headers })
  } else {
    // Fallback for pure-browser dev (vite dev server proxy handles CORS)
    const fetchOpts = { method, headers }
    if (data !== undefined && data !== null) {
      fetchOpts.body = typeof data === 'string' ? data : JSON.stringify(data)
    }
    const res = await fetch(url, fetchOpts)
    let parsed
    try {
      parsed = await res.json()
    } catch {
      parsed = null
    }
    response = {
      status: res.status,
      data: parsed,
      headers: Object.fromEntries(res.headers.entries())
    }
  }

  // Simulate axios-style error for non-2xx
  if (response.status < 200 || response.status >= 300) {
    const err = new Error(`Request failed with status ${response.status}`)
    err.response = response
    throw err
  }

  return response
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

async function requestWithRefresh(method, path, opts = {}) {
  try {
    return await request(method, path, opts)
  } catch (error) {
    if (error.response?.status !== 401 || opts._retry || path.includes('/auth/refresh')) {
      throw error
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        opts.headers = { ...opts.headers, Authorization: `Bearer ${token}` }
        opts._retry = true
        return request(method, path, opts)
      })
    }

    isRefreshing = true

    const refreshToken = typeof localStorage !== 'undefined' ? localStorage.refresh_token : null
    if (!refreshToken) {
      isRefreshing = false
      throw error
    }

    try {
      const refreshResponse = await request('POST', '/auth/refresh', {
        data: { refresh_token: refreshToken }
      })

      const newAccessToken = refreshResponse.data.access_token
      const newRefreshToken = refreshResponse.data.refresh_token || refreshToken

      localStorage.access_token = newAccessToken
      localStorage.refresh_token = newRefreshToken

      processQueue(null, newAccessToken)

      opts.headers = { ...opts.headers, Authorization: `Bearer ${newAccessToken}` }
      opts._retry = true
      return await request(method, path, opts)
    } catch (refreshError) {
      processQueue(refreshError, null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      throw refreshError
    } finally {
      isRefreshing = false
    }
  }
}

export default class HTTPClient {
  static normalizeBaseURL(url) {
    return url
  }

  static async head(path) {
    return requestWithRefresh('HEAD', path)
  }

  static async get(path, params = {}, headers = {}) {
    return requestWithRefresh('GET', path, { params, headers })
  }

  static async post(path, data = {}, headers = {}, onUploadProgress) {
    return requestWithRefresh('POST', path, { data, headers, onUploadProgress })
  }

  static async put(path, data = {}, headers = {}) {
    return requestWithRefresh('PUT', path, { data, headers })
  }

  static async delete(path, data = {}, headers = {}) {
    return requestWithRefresh('DELETE', path, { data, headers })
  }

  static setHeader(key, value) {
    // No-op: headers are built per-request from localStorage
  }

  static setBaseURL(url) {
    baseURL = HTTPClient.normalizeBaseURL(url)
  }
}
