import { create } from "zustand";
import { ItemType } from "@/types";
import type { VaultItem, Organization } from "@/types";
import { encryptWithOrgKey, decryptWithOrgKey } from "@/lib/crypto";
import type { SymmetricKey } from "@/lib/crypto";
import OrganizationsService from "@/api/organizations";
import {
  normalizePasswordItemData,
  buildPasswordItemDataFromForm,
  normalizeCardData,
  normalizeBankAccountData,
  normalizeSecureNoteData,
  normalizeAddressData,
} from "@/lib/schemas";

function safeHostName(url: string): string {
  if (!url) return "";
  try {
    const parsed = url.includes("://") ? new URL(url) : new URL(`https://${url}`);
    return parsed.hostname || "";
  } catch {
    return "";
  }
}

function formatExpiryDate(month: string, year: string): string {
  if (!month || !year) return "";
  const yearSuffix = year.length === 4 ? year.slice(2) : year;
  return `${month}/${yearSuffix}`;
}

function mergeDecryptedItem(
  item: VaultItem,
  decryptedData: Record<string, unknown>
): VaultItem {
  switch (item.item_type) {
    case ItemType.Password: {
      const normalizedData = normalizePasswordItemData(decryptedData || {});
      const noteFallback =
        typeof decryptedData?.note === "string" ? decryptedData.note : "";
      return {
        ...item,
        ...normalizedData,
        title:
          (item.metadata?.name as string) || normalizedData?.name || "",
        url:
          (item.metadata?.uri_hint as string) ||
          normalizedData?.uris?.[0]?.uri ||
          "",
        note: normalizedData.notes || (noteFallback as string) || "",
        notes: normalizedData.notes || (noteFallback as string) || "",
      };
    }
    case ItemType.Card: {
      const normalizedData = normalizeCardData(
        decryptedData || {},
        (item.metadata?.name as string) || ""
      );
      return {
        ...item,
        title: (item.metadata?.name as string) || normalizedData?.name || "",
        cardholder_name:
          normalizedData.name_on_card ||
          (decryptedData?.cardholder_name as string) ||
          "",
        type:
          normalizedData.card_type || (decryptedData?.type as string) || "",
        number:
          normalizedData.card_number ||
          (decryptedData?.number as string) ||
          "",
        verification_number:
          normalizedData.security_code ||
          (decryptedData?.verification_number as string) ||
          "",
        expiry_date:
          formatExpiryDate(normalizedData.exp_month, normalizedData.exp_year) ||
          (decryptedData?.expiry_date as string) ||
          "",
      };
    }
    case ItemType.Bank: {
      const normalizedData = normalizeBankAccountData(
        decryptedData || {},
        (item.metadata?.name as string) || ""
      );
      return {
        ...item,
        title:
          normalizedData.bank_name || (item.metadata?.name as string) || "",
        bank_code:
          normalizedData.routing_number ||
          (decryptedData?.bank_code as string) ||
          "",
        account_name:
          normalizedData.name ||
          (decryptedData?.account_name as string) ||
          "",
        account_number: normalizedData.account_number || "",
        iban:
          normalizedData.iban_number || (decryptedData?.iban as string) || "",
        currency:
          normalizedData.account_type ||
          (decryptedData?.currency as string) ||
          "",
        password:
          normalizedData.pin || (decryptedData?.password as string) || "",
      };
    }
    case ItemType.Note: {
      const normalizedData = normalizeSecureNoteData(
        decryptedData || {},
        (item.metadata?.name as string) || ""
      );
      const noteFallback =
        typeof decryptedData?.note === "string" ? decryptedData.note : "";
      return {
        ...item,
        title:
          normalizedData.name || (item.metadata?.name as string) || "",
        note: normalizedData.notes || (noteFallback as string) || "",
        notes: normalizedData.notes || (noteFallback as string) || "",
      };
    }
    case ItemType.Address: {
      const normalizedData = normalizeAddressData(
        decryptedData || {},
        (item.metadata?.name as string) || ""
      );
      const addressParts = [
        normalizedData.address1,
        normalizedData.address2,
        normalizedData.city,
        normalizedData.state,
        normalizedData.zip,
        normalizedData.country,
      ].filter(Boolean);
      return {
        ...item,
        title:
          normalizedData.title || (item.metadata?.name as string) || "",
        first_name: normalizedData.first_name || "",
        middle_name: normalizedData.middle_name || "",
        last_name: normalizedData.last_name || "",
        company: normalizedData.company || "",
        address1: normalizedData.address1 || "",
        address2: normalizedData.address2 || "",
        city: normalizedData.city || "",
        state: normalizedData.state || "",
        zip: normalizedData.zip || "",
        country: normalizedData.country || "",
        phone: normalizedData.phone || "",
        email: normalizedData.email || "",
        notes: normalizedData.notes || "",
        attachments: normalizedData.attachments || [],
        address: addressParts.join(", "),
      };
    }
    default:
      return {
        ...item,
        ...decryptedData,
        title:
          (item.metadata?.name as string) ||
          (decryptedData?.name as string) ||
          "",
        url: (item.metadata?.uri_hint as string) || "",
      };
  }
}

function buildItemData(
  type: ItemType,
  form: Record<string, unknown>
): object {
  switch (type) {
    case ItemType.Password:
      return buildPasswordItemDataFromForm(form, (form.url as string) || "");
    case ItemType.Note:
      return normalizeSecureNoteData({
        name: (form.title as string) || "",
        notes: (form.note as string) || (form.notes as string) || "",
      });
    case ItemType.Card: {
      const raw = String(form.expiry_date || "").trim();
      let exp_month = "";
      let exp_year = "";
      if (raw) {
        const match = raw.match(/(\d{1,2})\D?(\d{2,4})/);
        if (match) {
          exp_month = match[1].padStart(2, "0");
          exp_year = match[2].length === 2 ? `20${match[2]}` : match[2];
        }
      }
      return normalizeCardData(
        {
          name: (form.title as string) || "",
          name_on_card: (form.cardholder_name as string) || "",
          card_type: (form.type as string) || "",
          card_number: (form.number as string) || "",
          security_code: (form.verification_number as string) || "",
          exp_month,
          exp_year,
        },
        (form.title as string) || ""
      );
    }
    case ItemType.Bank:
      return normalizeBankAccountData(
        {
          name: (form.account_name as string) || "",
          bank_name: (form.title as string) || "",
          account_type: (form.currency as string) || "",
          routing_number: (form.bank_code as string) || "",
          account_number: (form.account_number as string) || "",
          iban_number: (form.iban as string) || "",
          pin: (form.password as string) || "",
        },
        (form.account_name as string) || (form.title as string) || ""
      );
    case ItemType.Address:
      return normalizeAddressData(
        {
          title: (form.title as string) || "",
          first_name: (form.first_name as string) || "",
          middle_name: (form.middle_name as string) || "",
          last_name: (form.last_name as string) || "",
          company: (form.company as string) || "",
          address1: (form.address1 as string) || "",
          address2: (form.address2 as string) || "",
          city: (form.city as string) || "",
          state: (form.state as string) || "",
          zip: (form.zip as string) || "",
          country: (form.country as string) || "",
          phone: (form.phone as string) || "",
          email: (form.email as string) || "",
          notes: (form.notes as string) || "",
          attachments: Array.isArray(form.attachments) ? form.attachments : [],
        },
        (form.title as string) || ""
      );
    default:
      return { ...form };
  }
}

function buildMetadata(
  type: ItemType,
  form: Record<string, unknown>
): Record<string, string> {
  const name =
    (form.name as string) || (form.title as string) || "Untitled";
  switch (type) {
    case ItemType.Password:
      return { name, uri_hint: safeHostName((form.url as string) || "") };
    case ItemType.Card:
      return { name, brand: (form.type as string) || "" };
    default:
      return { name };
  }
}

function getOrgPublicId(
  numericOrgId: number,
  organizations: Organization[]
): string {
  const org = organizations.find((o) => o.id === numericOrgId);
  if (!org?.public_id) throw new Error(`No public_id for org ${numericOrgId}`);
  return org.public_id;
}

interface VaultState {
  items: VaultItem[];
  itemsLoading: boolean;

  fetchItems: (filter?: {
    type?: number;
    search?: string;
    is_favorite?: boolean;
    folder_id?: string;
    per_page?: number;
  }) => Promise<void>;
  createItem: (params: {
    type: ItemType;
    form: Record<string, unknown>;
    orgId?: number;
  }) => Promise<VaultItem | null>;
  updateItem: (params: {
    id: string;
    form: Record<string, unknown>;
    type?: ItemType;
  }) => Promise<VaultItem | null>;
  deleteItem: (id: string) => Promise<void>;
  getItemsByType: (type: ItemType) => VaultItem[];
  getItemById: (id: string) => VaultItem | undefined;
  clearItems: () => void;
  exportItems: () => Record<string, VaultItem[]>;
}

function getAuthState() {
  return useAuthStore.getState();
}

// Re-import at top to avoid circular — Zustand handles this fine
import { useAuthStore } from "./auth-store";

export const useVaultStore = create<VaultState>((set, get) => ({
  items: [],
  itemsLoading: false,

  async fetchItems(filter = {}) {
    set({ itemsLoading: true });
    try {
      const authState = getAuthState();
      const organizations: Organization[] = authState.organizations;
      if (!organizations || organizations.length === 0) {
        set({ items: [], itemsLoading: false });
        return;
      }

      const params: Record<string, unknown> = {};
      if (filter.type) params.type = filter.type;
      if (filter.search) params.search = filter.search;
      if (filter.is_favorite !== undefined)
        params.is_favorite = filter.is_favorite;
      if (filter.folder_id) params.folder_id = filter.folder_id;
      params.per_page = filter.per_page || 5000;

      const orgErrors: Error[] = [];
      const orgFetchPromises = organizations.map(async (org) => {
        try {
          const { data } = await OrganizationsService.listItems(
            org.public_id,
            params as Record<string, string>
          );
          const items = (data as unknown as { items?: VaultItem[] }).items || (data as unknown as VaultItem[]) || [];

          let orgKey: SymmetricKey | undefined = authState.orgKeys[org.id];
          if (!orgKey && org.encrypted_org_key && authState.userKey) {
            try {
              const { unwrapOrgKeyWithUserKey } = await import(
                "@/lib/crypto"
              );
              orgKey = await unwrapOrgKeyWithUserKey(
                org.encrypted_org_key,
                authState.userKey
              );
              useAuthStore.setState({
                orgKeys: { ...authState.orgKeys, [org.id]: orgKey! },
              });
            } catch {
              // Key unwrap failed
            }
          }

          if (!orgKey) {
            return (items as VaultItem[]).map((item) => ({
              ...item,
              _orgId: org.id,
              _orgName: org.name,
              title: item.metadata?.name || "[Encrypted]",
              url: item.metadata?.uri_hint || "",
            }));
          }

          return await Promise.all(
            (items as VaultItem[]).map(async (item) => {
              try {
                const decryptedData = (await decryptWithOrgKey(
                  item.data,
                  orgKey!
                )) as Record<string, unknown>;
                const normalized = mergeDecryptedItem(item, decryptedData);
                return { ...normalized, _orgId: org.id, _orgName: org.name };
              } catch {
                return {
                  ...item,
                  _orgId: org.id,
                  _orgName: org.name,
                  title: item.metadata?.name || "[Decryption Failed]",
                  url: item.metadata?.uri_hint || "",
                };
              }
            })
          );
        } catch (error) {
          orgErrors.push(error as Error);
          return [];
        }
      });

      const allResults = await Promise.all(orgFetchPromises);

      if (orgErrors.length === organizations.length) {
        set({ itemsLoading: false });
        throw orgErrors[0];
      }

      const decryptedItems = allResults.flat();

      if (filter.type) {
        const otherTypeItems = get().items.filter(
          (item) => item.item_type !== filter.type
        );
        set({ items: [...otherTypeItems, ...decryptedItems], itemsLoading: false });
      } else {
        set({ items: decryptedItems, itemsLoading: false });
      }
    } catch (error) {
      set({ itemsLoading: false });
      throw error;
    }
  },

  async createItem({ type, form, orgId }) {
    const authState = getAuthState();
    const targetOrgId =
      orgId || authState.defaultOrgId || authState.organizations[0]?.id;
    if (!targetOrgId) throw new Error("No organization available");

    const orgKey = authState.orgKeys[targetOrgId];
    if (!orgKey) throw new Error("Organization key not available");

    const metadata = buildMetadata(type, form);
    const data = buildItemData(type, form);
    const encryptedData = await encryptWithOrgKey(JSON.stringify(data), orgKey);

    const targetOrgPublicId = getOrgPublicId(
      targetOrgId,
      authState.organizations
    );
    const { data: createdResponse } = await OrganizationsService.createItem(
      targetOrgPublicId,
      {
        item_type: type,
        data: encryptedData,
        metadata,
        folder_id: form.folder_id || undefined,
        is_favorite: form.is_favorite || false,
        auto_fill: form.auto_fill ?? false,
        auto_login: form.auto_login ?? false,
        reprompt: form.reprompt ?? false,
      }
    );

    const createdItem =
      (createdResponse as { item?: VaultItem }).item || (createdResponse as unknown as VaultItem);
    if (!createdItem || !createdItem.id) {
      await get().fetchItems({ type });
      return null;
    }

    let normalized: VaultItem;
    try {
      const decryptedData = (await decryptWithOrgKey(
        createdItem.data,
        orgKey
      )) as Record<string, unknown>;
      normalized = mergeDecryptedItem(createdItem, decryptedData);
      normalized._orgId = targetOrgId;
    } catch {
      normalized = {
        ...createdItem,
        _orgId: targetOrgId,
        title: createdItem.metadata?.name || "[Encrypted]",
        url: createdItem.metadata?.uri_hint || "",
      };
    }

    set({ items: [normalized, ...get().items] });
    return normalized;
  },

  async updateItem({ id, form, type }) {
    const existingItem = get().items.find((item) => String(item.id) === String(id));
    if (!existingItem) throw new Error("Item not found");

    const authState = getAuthState();
    const itemOrgId = existingItem._orgId || existingItem.organization_id;
    const orgKey = authState.orgKeys[itemOrgId as number];
    if (!orgKey) throw new Error("Organization key not available");

    const itemType = type || existingItem.item_type;
    const metadata = buildMetadata(itemType, form);
    const data = buildItemData(itemType, form);
    const encryptedData = await encryptWithOrgKey(JSON.stringify(data), orgKey);

    const { data: updatedResponse } = await OrganizationsService.updateItem(
      id,
      {
        data: encryptedData,
        metadata,
        folder_id: form.folder_id,
        is_favorite: form.is_favorite,
        auto_fill: form.auto_fill,
        auto_login: form.auto_login,
        reprompt: form.reprompt,
      }
    );

    const updatedItem =
      (updatedResponse as { item?: VaultItem }).item || (updatedResponse as unknown as VaultItem);
    if (!updatedItem || !updatedItem.id) {
      await get().fetchItems({ type: itemType });
      return get().items.find((item) => String(item.id) === String(id)) || null;
    }

    let normalized: VaultItem;
    try {
      const decryptedData = (await decryptWithOrgKey(
        updatedItem.data,
        orgKey
      )) as Record<string, unknown>;
      normalized = mergeDecryptedItem(updatedItem, decryptedData);
      normalized._orgId = itemOrgId as number;
    } catch {
      normalized = {
        ...updatedItem,
        _orgId: itemOrgId as number,
        title: updatedItem.metadata?.name || "[Encrypted]",
        url: updatedItem.metadata?.uri_hint || "",
      };
    }

    set({
      items: get().items.map((item) => (String(item.id) === String(id) ? normalized : item)),
    });
    return normalized;
  },

  async deleteItem(id: string) {
    await OrganizationsService.deleteItem(id);
    set({ items: get().items.filter((item) => item.id !== id) });
  },

  getItemsByType(type: ItemType) {
    return get().items.filter((item) => item.item_type === type);
  },

  getItemById(id: string) {
    return get().items.find((item) => item.id === id);
  },

  clearItems() {
    set({ items: [], itemsLoading: false });
  },

  exportItems() {
    const typeNameMap: Record<number, string> = {
      [ItemType.Password]: "Passwords",
      [ItemType.Note]: "Notes",
      [ItemType.Address]: "Addresses",
      [ItemType.Card]: "CreditCards",
      [ItemType.Bank]: "BankAccounts",
    };
    const result: Record<string, VaultItem[]> = {};
    for (const item of get().items) {
      const typeName = typeNameMap[item.item_type] || "Other";
      if (!result[typeName]) result[typeName] = [];
      const { _orgId: _, _orgName: __, data: ___, ...cleaned } = item;
      result[typeName].push(cleaned as VaultItem);
    }
    return result;
  },
}));
