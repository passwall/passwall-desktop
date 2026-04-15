/**
 * Cryptography Service
 * Zero-Knowledge Architecture for Passwall Desktop
 *
 * Standards:
 * - NIST SP 800-132: Password-Based Key Derivation
 * - RFC 5869: HKDF (Key Derivation Function)
 * - RFC 2898: PBKDF2 Specification
 * - OWASP 2023: Password Storage Guidelines
 */

import type { EncString } from "@/types/crypto";

export const KdfType = {
  PBKDF2: 0,
  Argon2id: 1,
} as const;

export const DEFAULT_KDF_CONFIG = {
  kdf_type: KdfType.PBKDF2,
  kdf_iterations: 600000,
};

export const PBKDF2_MIN_ITERATIONS = 600000;
export const PBKDF2_MAX_ITERATIONS = 2000000;

export class SymmetricKey {
  readonly encKey: Uint8Array;
  readonly macKey: Uint8Array;

  constructor(encKey: Uint8Array, macKey: Uint8Array) {
    if (encKey.length !== 32 || macKey.length !== 32) {
      throw new Error("Invalid key size: expected 32 bytes for each key");
    }
    this.encKey = encKey;
    this.macKey = macKey;
  }

  toBytes(): Uint8Array {
    const combined = new Uint8Array(64);
    combined.set(this.encKey, 0);
    combined.set(this.macKey, 32);
    return combined;
  }

  static fromBytes(bytes: Uint8Array): SymmetricKey {
    if (bytes.length !== 64) {
      throw new Error("Invalid key size: expected 64 bytes");
    }
    return new SymmetricKey(bytes.slice(0, 32), bytes.slice(32, 64));
  }
}

export class CryptoService {
  private toArrayBuffer(arr: Uint8Array): ArrayBuffer {
    return arr.buffer.byteLength === arr.byteLength
      ? arr.buffer
      : arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
  }

  async makeMasterKey(
    password: string,
    kdfSalt: string,
    kdfConfig: { kdf_type: number; kdf_iterations?: number }
  ): Promise<Uint8Array> {
    if (kdfConfig.kdf_type === KdfType.PBKDF2) {
      const iterations = Math.min(
        kdfConfig.kdf_iterations || DEFAULT_KDF_CONFIG.kdf_iterations,
        PBKDF2_MAX_ITERATIONS
      );
      return await this.pbkdf2(password, kdfSalt, iterations, 32, "SHA-256");
    }

    if (kdfConfig.kdf_type === KdfType.Argon2id) {
      throw new Error("Argon2id not implemented in desktop client");
    }

    throw new Error("Unsupported KDF type");
  }

  async hashMasterKey(masterKey: Uint8Array): Promise<Uint8Array> {
    return await this.hkdfExpand(masterKey, "auth", 32, "SHA-256");
  }

  async stretchMasterKey(masterKey: Uint8Array): Promise<SymmetricKey> {
    const encKey = await this.hkdfExpand(masterKey, "enc", 32, "SHA-256");
    const macKey = await this.hkdfExpand(masterKey, "mac", 32, "SHA-256");
    return new SymmetricKey(encKey, macKey);
  }

  async unwrapUserKey(
    protectedUserKey: EncString,
    stretchedMasterKey: SymmetricKey
  ): Promise<SymmetricKey> {
    const userKeyBytes = await this.decryptAesCbcHmac(
      protectedUserKey,
      stretchedMasterKey
    );
    return SymmetricKey.fromBytes(userKeyBytes);
  }

  async encryptAesCbcHmac(
    plaintext: string | Uint8Array,
    key: SymmetricKey
  ): Promise<EncString> {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const plaintextBytes =
      typeof plaintext === "string"
        ? new TextEncoder().encode(plaintext)
        : plaintext;

    const aesKey = await crypto.subtle.importKey(
      "raw",
      this.toArrayBuffer(key.encKey),
      { name: "AES-CBC" },
      false,
      ["encrypt"]
    );

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: this.toArrayBuffer(iv) },
      aesKey,
      this.toArrayBuffer(plaintextBytes)
    );

    const dataToMac = new Uint8Array(iv.length + ciphertext.byteLength);
    dataToMac.set(iv, 0);
    dataToMac.set(new Uint8Array(ciphertext), iv.length);

    const hmacKey = await crypto.subtle.importKey(
      "raw",
      this.toArrayBuffer(key.macKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const mac = await crypto.subtle.sign(
      { name: "HMAC" },
      hmacKey,
      this.toArrayBuffer(dataToMac)
    );

    return `2.${this.arrayToBase64(iv)}|${this.arrayToBase64(new Uint8Array(ciphertext))}|${this.arrayToBase64(new Uint8Array(mac))}`;
  }

  async decryptAesCbcHmac(
    encString: EncString,
    key: SymmetricKey
  ): Promise<Uint8Array> {
    const parts = encString.split(".");
    if (parts.length !== 2 || parts[0] !== "2") {
      throw new Error("Invalid EncString format");
    }

    const [ivB64, ctB64, macB64] = parts[1].split("|");
    if (!ivB64 || !ctB64 || !macB64) {
      throw new Error("Invalid EncString: missing parts");
    }

    const iv = this.base64ToArray(ivB64);
    const ciphertext = this.base64ToArray(ctB64);
    const mac = this.base64ToArray(macB64);

    const dataToVerify = new Uint8Array(iv.length + ciphertext.length);
    dataToVerify.set(iv, 0);
    dataToVerify.set(ciphertext, iv.length);

    const hmacKey = await crypto.subtle.importKey(
      "raw",
      this.toArrayBuffer(key.macKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const isValid = await crypto.subtle.verify(
      { name: "HMAC" },
      hmacKey,
      this.toArrayBuffer(mac),
      this.toArrayBuffer(dataToVerify)
    );

    if (!isValid) {
      throw new Error("MAC verification failed - data may be tampered");
    }

    const aesKey = await crypto.subtle.importKey(
      "raw",
      this.toArrayBuffer(key.encKey),
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );

    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: this.toArrayBuffer(iv) },
      aesKey,
      this.toArrayBuffer(ciphertext)
    );

    return new Uint8Array(plaintext);
  }

  async pbkdf2(
    password: string | Uint8Array,
    salt: string | Uint8Array,
    iterations: number,
    keyLength: number,
    hash: string
  ): Promise<Uint8Array> {
    const passwordBytes =
      typeof password === "string"
        ? new TextEncoder().encode(password)
        : password;
    const saltBytes =
      typeof salt === "string" ? new TextEncoder().encode(salt) : salt;

    const importedKey = await crypto.subtle.importKey(
      "raw",
      this.toArrayBuffer(passwordBytes),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: this.toArrayBuffer(saltBytes),
        iterations,
        hash,
      },
      importedKey,
      keyLength * 8
    );

    return new Uint8Array(derivedBits);
  }

  async hkdfExpand(
    key: Uint8Array,
    info: string,
    outputLength: number,
    hash: string
  ): Promise<Uint8Array> {
    const hashLen = hash === "SHA-256" ? 32 : 64;
    if (outputLength > 255 * hashLen) {
      throw new Error("Output length too large for HKDF");
    }

    const infoBytes = new TextEncoder().encode(info);
    const output = new Uint8Array(outputLength);
    let previousBlock = new Uint8Array(0);
    let currentLength = 0;
    let counter = 1;

    while (currentLength < outputLength) {
      const input = new Uint8Array(
        previousBlock.length + infoBytes.length + 1
      );
      input.set(previousBlock, 0);
      input.set(infoBytes, previousBlock.length);
      input.set([counter], input.length - 1);

      const hmacKey = await crypto.subtle.importKey(
        "raw",
        this.toArrayBuffer(key),
        { name: "HMAC", hash },
        false,
        ["sign"]
      );

      const block = await crypto.subtle.sign(
        { name: "HMAC" },
        hmacKey,
        this.toArrayBuffer(input)
      );
      const blockArray = new Uint8Array(block);

      const bytesToCopy = Math.min(
        blockArray.length,
        outputLength - currentLength
      );
      output.set(blockArray.slice(0, bytesToCopy), currentLength);

      previousBlock = blockArray;
      currentLength += bytesToCopy;
      counter += 1;
    }

    return output;
  }

  arrayToBase64(array: Uint8Array): string {
    if (array.length > 1000) {
      let binary = "";
      for (let i = 0; i < array.length; i++) {
        binary += String.fromCharCode(array[i]);
      }
      return btoa(binary);
    }

    try {
      return btoa(String.fromCharCode(...array));
    } catch {
      let binary = "";
      for (let i = 0; i < array.length; i++) {
        binary += String.fromCharCode(array[i]);
      }
      return btoa(binary);
    }
  }

  base64ToArray(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

export const cryptoService = new CryptoService();

export const isEncString = (value: unknown): value is EncString =>
  typeof value === "string" && value.startsWith("2.");

export const decodeBase64Json = (value: unknown): unknown => {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  try {
    const decoded = atob(value);
    return JSON.parse(decoded);
  } catch {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
};

export const encodeBase64Json = (value: unknown): string => {
  return btoa(JSON.stringify(value));
};

export async function encryptWithOrgKey(
  plaintext: string,
  orgKey: SymmetricKey
): Promise<EncString> {
  return await cryptoService.encryptAesCbcHmac(plaintext, orgKey);
}

export async function decryptWithOrgKey(
  encString: EncString,
  orgKey: SymmetricKey
): Promise<unknown> {
  const decryptedBytes = await cryptoService.decryptAesCbcHmac(
    encString,
    orgKey
  );
  const decryptedStr = new TextDecoder().decode(decryptedBytes);
  return JSON.parse(decryptedStr);
}

export async function unwrapOrgKeyWithUserKey(
  encryptedOrgKey: EncString,
  userKey: SymmetricKey
): Promise<SymmetricKey> {
  const orgKeyBytes = await cryptoService.decryptAesCbcHmac(
    encryptedOrgKey,
    userKey
  );
  return SymmetricKey.fromBytes(orgKeyBytes);
}

export async function sha1(message: string): Promise<string> {
  const data = new TextEncoder().encode(String(message ?? ""));
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}
