import HTTPClient from '@/api/HTTPClient'

export default {
  FetchAll() {
    return HTTPClient.get('/api/folders')
  }
}
