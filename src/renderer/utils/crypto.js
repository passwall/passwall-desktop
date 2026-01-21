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

export const KdfType = {
  PBKDF2: 0,
  Argon2id: 1
}

export const DEFAULT_KDF_CONFIG = {
  kdf_type: KdfType.PBKDF2,
  kdf_iterations: 600000
}

export const PBKDF2_MIN_ITERATIONS = 600000
export const PBKDF2_MAX_ITERATIONS = 2000000

export class SymmetricKey {
  constructor(encKey, macKey) {
    if (encKey.length !== 32 || macKey.length !== 32) {
      throw new Error('Invalid key size: expected 32 bytes for each key')
    }
    this.encKey = encKey
    this.macKey = macKey
  }

  toBytes() {
    const combined = new Uint8Array(64)
    combined.set(this.encKey, 0)
    combined.set(this.macKey, 32)
    return combined
  }

  static fromBytes(bytes) {
    if (bytes.length !== 64) {
      throw new Error('Invalid key size: expected 64 bytes')
    }
    return new SymmetricKey(bytes.slice(0, 32), bytes.slice(32, 64))
  }
}

export class CryptoService {
  async makeMasterKey(password, kdfSalt, kdfConfig) {
    if (kdfConfig.kdf_type === KdfType.PBKDF2) {
      return await this.pbkdf2(
        password,
        kdfSalt,
        kdfConfig.kdf_iterations || DEFAULT_KDF_CONFIG.kdf_iterations,
        32,
        'SHA-256'
      )
    }

    if (kdfConfig.kdf_type === KdfType.Argon2id) {
      throw new Error('Argon2id not implemented in desktop client')
    }

    throw new Error('Unsupported KDF type')
  }

  async hashMasterKey(masterKey) {
    return await this.hkdfExpand(masterKey, 'auth', 32, 'SHA-256')
  }

  async stretchMasterKey(masterKey) {
    const encKey = await this.hkdfExpand(masterKey, 'enc', 32, 'SHA-256')
    const macKey = await this.hkdfExpand(masterKey, 'mac', 32, 'SHA-256')
    return new SymmetricKey(encKey, macKey)
  }

  async makeUserKey() {
    const randomBytes = crypto.getRandomValues(new Uint8Array(64))
    return new SymmetricKey(randomBytes.slice(0, 32), randomBytes.slice(32, 64))
  }

  async protectUserKey(userKey, stretchedMasterKey) {
    return await this.encryptAesCbcHmac(userKey.toBytes(), stretchedMasterKey)
  }

  async unwrapUserKey(protectedUserKey, stretchedMasterKey) {
    const userKeyBytes = await this.decryptAesCbcHmac(protectedUserKey, stretchedMasterKey)
    return SymmetricKey.fromBytes(userKeyBytes)
  }

  async encryptAesCbcHmac(plaintext, key) {
    const iv = crypto.getRandomValues(new Uint8Array(16))
    const plaintextBytes =
      typeof plaintext === 'string' ? new TextEncoder().encode(plaintext) : plaintext

    const aesKey = await crypto.subtle.importKey(
      'raw',
      key.encKey.buffer,
      { name: 'AES-CBC' },
      false,
      ['encrypt']
    )

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: iv.buffer },
      aesKey,
      plaintextBytes.buffer
    )

    const dataToMac = new Uint8Array(iv.length + ciphertext.byteLength)
    dataToMac.set(iv, 0)
    dataToMac.set(new Uint8Array(ciphertext), iv.length)

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      key.macKey.buffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const mac = await crypto.subtle.sign({ name: 'HMAC' }, hmacKey, dataToMac.buffer)

    return `2.${this.arrayToBase64(iv)}|${this.arrayToBase64(
      new Uint8Array(ciphertext)
    )}|${this.arrayToBase64(new Uint8Array(mac))}`
  }

  async decryptAesCbcHmac(encString, key) {
    const parts = encString.split('.')
    if (parts.length !== 2 || parts[0] !== '2') {
      throw new Error('Invalid EncString format')
    }

    const [ivB64, ctB64, macB64] = parts[1].split('|')
    if (!ivB64 || !ctB64 || !macB64) {
      throw new Error('Invalid EncString: missing parts')
    }

    const iv = this.base64ToArray(ivB64)
    const ciphertext = this.base64ToArray(ctB64)
    const mac = this.base64ToArray(macB64)

    const dataToVerify = new Uint8Array(iv.length + ciphertext.length)
    dataToVerify.set(iv, 0)
    dataToVerify.set(ciphertext, iv.length)

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      key.macKey.buffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const isValid = await crypto.subtle.verify(
      { name: 'HMAC' },
      hmacKey,
      mac.buffer,
      dataToVerify.buffer
    )

    if (!isValid) {
      throw new Error('MAC verification failed - data may be tampered')
    }

    const aesKey = await crypto.subtle.importKey(
      'raw',
      key.encKey.buffer,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    )

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv.buffer },
      aesKey,
      ciphertext.buffer
    )

    return new Uint8Array(plaintext)
  }

  async pbkdf2(password, salt, iterations, keyLength, hash) {
    const passwordBytes =
      typeof password === 'string' ? new TextEncoder().encode(password) : password
    const saltBytes = typeof salt === 'string' ? new TextEncoder().encode(salt) : salt

    const importedKey = await crypto.subtle.importKey(
      'raw',
      passwordBytes.buffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    )

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes.buffer,
        iterations,
        hash
      },
      importedKey,
      keyLength * 8
    )

    return new Uint8Array(derivedBits)
  }

  async hkdfExpand(key, info, outputLength, hash) {
    const hashLen = hash === 'SHA-256' ? 32 : 64
    if (outputLength > 255 * hashLen) {
      throw new Error('Output length too large for HKDF')
    }

    const infoBytes = new TextEncoder().encode(info)
    const output = new Uint8Array(outputLength)
    let previousBlock = new Uint8Array(0)
    let currentLength = 0
    let counter = 1

    while (currentLength < outputLength) {
      const input = new Uint8Array(previousBlock.length + infoBytes.length + 1)
      input.set(previousBlock, 0)
      input.set(infoBytes, previousBlock.length)
      input.set([counter], input.length - 1)

      const hmacKey = await crypto.subtle.importKey(
        'raw',
        key.buffer,
        { name: 'HMAC', hash },
        false,
        ['sign']
      )

      const block = await crypto.subtle.sign({ name: 'HMAC' }, hmacKey, input.buffer)
      const blockArray = new Uint8Array(block)

      const bytesToCopy = Math.min(blockArray.length, outputLength - currentLength)
      output.set(blockArray.slice(0, bytesToCopy), currentLength)

      previousBlock = blockArray
      currentLength += bytesToCopy
      counter += 1
    }

    return output
  }

  arrayToBase64(array) {
    if (array.length > 1000) {
      let binary = ''
      for (let i = 0; i < array.length; i++) {
        binary += String.fromCharCode(array[i])
      }
      return btoa(binary)
    }

    try {
      return btoa(String.fromCharCode(...array))
    } catch (_error) {
      let binary = ''
      for (let i = 0; i < array.length; i++) {
        binary += String.fromCharCode(array[i])
      }
      return btoa(binary)
    }
  }

  base64ToArray(base64) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  arrayToHex(array) {
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  constantTimeEqual(a, b) {
    if (a.length !== b.length) {
      return false
    }
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i]
    }
    return result === 0
  }

  generateRandomHex(bytes) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(bytes))
    return this.arrayToHex(randomBytes)
  }
}

export const cryptoService = new CryptoService()

export const isEncString = (value) => typeof value === 'string' && value.startsWith('2.')

export const decodeBase64Json = (value) => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'object') {
    return value
  }

  if (typeof value !== 'string') {
    return null
  }

  try {
    const decoded = atob(value)
    return JSON.parse(decoded)
  } catch (_error) {
    try {
      return JSON.parse(value)
    } catch (_parseError) {
      return null
    }
  }
}

export const encodeBase64Json = (value) => {
  return btoa(JSON.stringify(value))
}

export const encryptFields = async (data, keyList, userKey) => {
  if (!userKey) {
    throw new Error('User key not available')
  }

  await Promise.all(
    Object.keys(data).map(async (key) => {
      if (!keyList.includes(key)) {
        return
      }
      const value = data[key]
      if (value === null || value === undefined || value === '') {
        return
      }
      if (isEncString(value)) {
        return
      }
      data[key] = await cryptoService.encryptAesCbcHmac(String(value), userKey)
    })
  )
}

export const decryptFields = async (data, keyList, userKey) => {
  if (!userKey) {
    throw new Error('User key not available')
  }

  if (!data || typeof data !== 'object') {
    return
  }

  await Promise.all(
    Object.keys(data).map(async (key) => {
      if (!keyList.includes(key)) {
        return
      }
      const value = data[key]
      if (!value || !isEncString(value)) {
        return
      }
      const decrypted = await cryptoService.decryptAesCbcHmac(value, userKey)
      data[key] = new TextDecoder().decode(decrypted)
    })
  )
}

export const encryptPayload = async (data, keyList, userKey) => {
  const payload = { ...data }
  await encryptFields(payload, keyList, userKey)
  return { data: encodeBase64Json(payload) }
}

export const decryptPayload = async (encoded, keyList, userKey) => {
  const payload = decodeBase64Json(encoded)
  await decryptFields(payload, keyList, userKey)
  return payload
}

export const decryptPayloadList = async (encoded, keyList, userKey) => {
  const payload = decodeBase64Json(encoded)
  if (!Array.isArray(payload)) {
    return []
  }
  await Promise.all(payload.map((item) => decryptFields(item, keyList, userKey)))
  return payload
}

export const generateItemKey = async () => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(64))
  return new SymmetricKey(randomBytes.slice(0, 32), randomBytes.slice(32, 64))
}

export const wrapItemKeyWithUserKey = async (itemKey, userKey) => {
  return await cryptoService.encryptAesCbcHmac(itemKey.toBytes(), userKey)
}

export const unwrapItemKeyWithUserKey = async (encryptedItemKey, userKey) => {
  const itemKeyBytes = await cryptoService.decryptAesCbcHmac(encryptedItemKey, userKey)
  return SymmetricKey.fromBytes(itemKeyBytes)
}

export const encryptWithItemKey = async (data, itemKey) => {
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data)
  return await cryptoService.encryptAesCbcHmac(plaintext, itemKey)
}

export const decryptWithItemKey = async (encString, itemKey) => {
  const decryptedBytes = await cryptoService.decryptAesCbcHmac(encString, itemKey)
  const decryptedText = new TextDecoder().decode(decryptedBytes)
  return JSON.parse(decryptedText)
}

export const sha1 = async (message) => {
  const data = new TextEncoder().encode(String(message ?? ''))
  const hash = await crypto.subtle.digest('SHA-1', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

export default {
  CryptoService,
  SymmetricKey,
  cryptoService,
  KdfType,
  DEFAULT_KDF_CONFIG,
  PBKDF2_MIN_ITERATIONS,
  PBKDF2_MAX_ITERATIONS,
  encryptFields,
  decryptFields,
  encryptPayload,
  decryptPayload,
  decryptPayloadList,
  generateItemKey,
  wrapItemKeyWithUserKey,
  unwrapItemKeyWithUserKey,
  encryptWithItemKey,
  decryptWithItemKey,
  sha1,
  encodeBase64Json,
  decodeBase64Json,
  isEncString
}
