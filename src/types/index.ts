export enum ItemType {
  Password = 1,
  Note = 2,
  Card = 3,
  Bank = 4,
  Email = 5,
  Server = 6,
  Identity = 7,
  SSHKey = 8,
  Address = 9,
  Custom = 99,
}

export const PREMIUM_ITEM_TYPES: ItemType[] = [
  ItemType.Note,
  ItemType.Address,
  ItemType.Card,
  ItemType.Bank,
];

export interface PasswordItemUri {
  uri: string;
  match: number | null;
}

export interface PasswordItemField {
  type: number;
  name: string;
  value: string;
}

export interface PasswordItemData {
  name: string;
  username: string;
  password: string;
  totp_secret?: string;
  notes?: string;
  uris?: PasswordItemUri[];
  fields?: PasswordItemField[];
}

export interface CardData {
  name: string;
  name_on_card: string;
  card_type: string;
  card_number: string;
  security_code: string;
  exp_month: string;
  exp_year: string;
  notes?: string;
}

export interface BankAccountData {
  name: string;
  first_name: string;
  last_name: string;
  bank_name: string;
  account_type: string;
  routing_number: string;
  account_number: string;
  swift_code?: string;
  iban_number?: string;
  pin?: string;
  branch_address?: string;
  branch_phone?: string;
  notes?: string;
}

export interface AddressAttachment {
  name: string;
  size: number;
  type: string;
  data: string;
}

export interface AddressData {
  title: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  notes: string;
  attachments: AddressAttachment[];
}

export interface SecureNoteData {
  name: string;
  notes: string;
  attachments: AddressAttachment[];
}

export interface ItemMetadata {
  name: string;
  uri_hint?: string;
  brand?: string;
}

export interface VaultItem {
  id: string;
  item_type: ItemType;
  data: string;
  metadata: ItemMetadata;
  folder_id?: string;
  is_favorite: boolean;
  auto_fill: boolean;
  auto_login: boolean;
  reprompt: boolean;
  created_at?: string;
  updated_at?: string;
  organization_id?: number;
  _orgId?: number;
  _orgName?: string;
  title?: string;
  url?: string;
  // Decrypted fields merged at runtime
  [key: string]: unknown;
}

export interface Organization {
  id: number;
  public_id: string;
  name: string;
  is_personal: boolean;
  plan: string;
  plan_features: Record<string, boolean>;
  subscription_status: string;
  encrypted_org_key: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  plan: string;
  [key: string]: unknown;
}

export interface LoginPayload {
  email: string;
  master_password: string;
  server: string;
}

export interface KdfConfig {
  kdf_type: number;
  kdf_iterations: number;
  kdf_salt: string;
}

export interface SignInResponse {
  access_token: string;
  refresh_token: string;
  protected_user_key: string;
  user: User;
  two_factor_required?: boolean;
  two_factor_token?: string;
  require_two_factor_setup?: {
    is_mandatory: boolean;
  };
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}
