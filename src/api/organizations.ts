import HTTPClient from "@/lib/http-client";
import type { Organization, VaultItem } from "@/types";

interface ListItemsParams {
  type?: number;
  per_page?: number;
  page?: number;
  search?: string;
  is_favorite?: boolean;
  folder_id?: string;
  auto_fill?: boolean;
  auto_login?: boolean;
  collection_id?: string;
  uri_hints?: string[];
  uri_hint?: string;
}

interface ListItemsResponse {
  items: VaultItem[];
}

export default class OrganizationsService {
  static async getAll() {
    return HTTPClient.get<Organization[]>("/api/organizations");
  }

  static async getById(id: string) {
    return HTTPClient.get<Organization>(`/api/organizations/${id}`);
  }

  static async listItems(orgId: string, params: ListItemsParams = {}) {
    const query = new URLSearchParams();
    if (params.type) query.append("type", params.type.toString());
    if (params.per_page) query.append("per_page", params.per_page.toString());
    if (params.page) query.append("page", params.page.toString());
    if (params.search) query.append("search", params.search);
    if (params.is_favorite !== undefined)
      query.append("is_favorite", params.is_favorite.toString());
    if (params.folder_id) query.append("folder_id", params.folder_id);
    if (params.auto_fill !== undefined)
      query.append("auto_fill", params.auto_fill.toString());
    if (params.auto_login !== undefined)
      query.append("auto_login", params.auto_login.toString());
    if (params.collection_id) query.append("collection_id", params.collection_id);
    if (Array.isArray(params.uri_hints)) {
      params.uri_hints.forEach((hint) => query.append("uri_hint", hint));
    } else if (params.uri_hint) {
      query.append("uri_hint", params.uri_hint);
    }
    const qs = query.toString();
    return HTTPClient.get<ListItemsResponse>(
      `/api/organizations/${orgId}/items${qs ? "?" + qs : ""}`
    );
  }

  static async createItem(orgId: string, payload: Record<string, unknown>) {
    return HTTPClient.post<{ item: VaultItem }>(
      `/api/organizations/${orgId}/items`,
      payload
    );
  }

  static async getItem(itemId: string) {
    return HTTPClient.get<VaultItem>(`/api/org-items/${itemId}`);
  }

  static async updateItem(itemId: string, payload: Record<string, unknown>) {
    return HTTPClient.put<{ item: VaultItem }>(
      `/api/org-items/${itemId}`,
      payload
    );
  }

  static async deleteItem(itemId: string) {
    return HTTPClient.delete(`/api/org-items/${itemId}`);
  }

  static async listFolders(orgId: string) {
    return HTTPClient.get(`/api/organizations/${orgId}/folders`);
  }

  static async createFolder(orgId: string, payload: Record<string, unknown>) {
    return HTTPClient.post(`/api/organizations/${orgId}/folders`, payload);
  }
}
