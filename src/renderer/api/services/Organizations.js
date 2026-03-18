import HTTPClient from '@/api/HTTPClient'

export default class OrganizationsService {
  static HasFeature(organization, feature) {
    const features = organization?.plan_features
    if (!features || typeof features !== 'object') return false
    return features[feature] === true
  }

  // ============================================================
  // Organizations
  // ============================================================

  static async GetAll() {
    return HTTPClient.get('/api/organizations')
  }

  /**
   * @param {string} id - Organization public_id
   */
  static async GetById(id) {
    return HTTPClient.get(`/api/organizations/${id}`)
  }

  /**
   * @param {string} id - Organization public_id
   */
  static async GetActivePolicies(id) {
    return HTTPClient.get(`/api/organizations/${id}/policies/active`)
  }

  static async Create(payload) {
    return HTTPClient.post('/api/organizations', payload)
  }

  // ============================================================
  // Organization Items
  // ============================================================

  /**
   * @param {string} orgId - Organization public_id
   */
  static async ListItems(orgId, params = {}) {
    const query = new URLSearchParams()
    if (params.type) query.append('type', params.type.toString())
    if (params.per_page) query.append('per_page', params.per_page.toString())
    if (params.page) query.append('page', params.page.toString())
    if (params.search) query.append('search', params.search)
    if (params.is_favorite !== undefined) query.append('is_favorite', params.is_favorite.toString())
    if (params.folder_id) query.append('folder_id', params.folder_id.toString())
    if (params.auto_fill !== undefined) query.append('auto_fill', params.auto_fill.toString())
    if (params.auto_login !== undefined) query.append('auto_login', params.auto_login.toString())
    if (params.collection_id) query.append('collection_id', params.collection_id.toString())
    if (Array.isArray(params.uri_hints)) {
      params.uri_hints.forEach((hint) => query.append('uri_hint', hint))
    } else if (params.uri_hint) {
      query.append('uri_hint', params.uri_hint)
    }
    const qs = query.toString()
    return HTTPClient.get(`/api/organizations/${orgId}/items${qs ? '?' + qs : ''}`)
  }

  /**
   * @param {string} orgId - Organization public_id
   */
  static async CreateItem(orgId, payload) {
    return HTTPClient.post(`/api/organizations/${orgId}/items`, payload)
  }

  static async GetItem(itemId) {
    return HTTPClient.get(`/api/org-items/${itemId}`)
  }

  static async UpdateItem(itemId, payload) {
    return HTTPClient.put(`/api/org-items/${itemId}`, payload)
  }

  static async DeleteItem(itemId) {
    return HTTPClient.delete(`/api/org-items/${itemId}`)
  }

  // ============================================================
  // Organization Folders
  // ============================================================

  /**
   * @param {string} orgId - Organization public_id
   */
  static async ListFolders(orgId) {
    return HTTPClient.get(`/api/organizations/${orgId}/folders`)
  }

  /**
   * @param {string} orgId - Organization public_id
   */
  static async CreateFolder(orgId, payload) {
    return HTTPClient.post(`/api/organizations/${orgId}/folders`, payload)
  }

  // ============================================================
  // Collections
  // ============================================================

  /**
   * @param {string} orgId - Organization public_id
   */
  static async ListCollections(orgId) {
    return HTTPClient.get(`/api/organizations/${orgId}/collections`)
  }
}
