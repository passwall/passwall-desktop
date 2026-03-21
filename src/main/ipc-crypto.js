/**
 * IPC Crypto — ECDH key agreement + AES-256-GCM session encryption
 *
 * Used by both the native messaging host (Node.js / Electron main process)
 * and the browser extension (Web Crypto API) to establish an encrypted
 * channel over the native messaging pipe.
 *
 * Protocol:
 *   1. Both sides generate ephemeral ECDH P-256 key pairs
 *   2. Exchange public keys
 *   3. Derive shared secret via ECDH
 *   4. Derive session key via HKDF(shared_secret, "passwall-ipc-v1", 32)
 *   5. Encrypt/decrypt messages with AES-256-GCM + monotonic nonce
 *
 * This file is the Node.js (Electron main process) implementation.
 * The extension has a mirror implementation using Web Crypto API.
 */

const crypto = require('crypto')

const HKDF_INFO = 'passwall-ipc-v1'
const HKDF_HASH = 'sha256'
const AES_KEY_BYTES = 32
const NONCE_BYTES = 12

class IpcCryptoSession {
  constructor() {
    this.ecdh = null
    this.localPublicKey = null
    this.sessionKey = null
    this.sendNonce = 0
    this.recvNonce = 0
  }

  /**
   * Generate an ephemeral ECDH key pair and return the public key (base64).
   */
  generateKeyPair() {
    this.ecdh = crypto.createECDH('prime256v1')
    this.ecdh.generateKeys()
    this.localPublicKey = this.ecdh.getPublicKey('base64')
    return this.localPublicKey
  }

  /**
   * Derive the session key from the remote party's public key.
   * @param {string} remotePublicKeyB64 — base64-encoded ECDH public key
   */
  deriveSessionKey(remotePublicKeyB64) {
    if (!this.ecdh) throw new Error('Key pair not generated')

    const remotePublicKey = Buffer.from(remotePublicKeyB64, 'base64')
    const sharedSecret = this.ecdh.computeSecret(remotePublicKey)

    // HKDF: extract + expand
    this.sessionKey = crypto.hkdfSync(
      HKDF_HASH,
      sharedSecret,
      Buffer.alloc(0), // no salt (ephemeral keys provide randomness)
      Buffer.from(HKDF_INFO, 'utf8'),
      AES_KEY_BYTES
    )

    // Reset nonce counters
    this.sendNonce = 0
    this.recvNonce = 0

    // Clear ECDH private key material
    this.ecdh = null
  }

  /**
   * Encrypt a message payload (JSON-serializable object).
   * @returns {{ ciphertext: string, nonce: number }}
   */
  encrypt(payload) {
    if (!this.sessionKey) throw new Error('Session not established')

    const plaintext = Buffer.from(JSON.stringify(payload), 'utf8')

    const nonce = this.sendNonce++
    const iv = this._nonceToIV(nonce)

    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.sessionKey), iv)
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
    const tag = cipher.getAuthTag()

    // ciphertext = encrypted || tag (16 bytes)
    const ciphertext = Buffer.concat([encrypted, tag])

    return {
      ciphertext: ciphertext.toString('base64'),
      nonce
    }
  }

  /**
   * Decrypt a message received from the remote party.
   * @param {string} ciphertextB64 — base64-encoded (ciphertext || auth_tag)
   * @param {number} nonce — monotonic nonce from sender
   * @returns {object} — parsed JSON payload
   */
  decrypt(ciphertextB64, nonce) {
    if (!this.sessionKey) throw new Error('Session not established')

    // Anti-replay: on this ordered channel, require exact next nonce.
    if (typeof nonce !== 'number' || nonce !== this.recvNonce) {
      throw new Error('Replay detected: nonce mismatch')
    }
    this.recvNonce = nonce + 1

    const data = Buffer.from(ciphertextB64, 'base64')
    if (data.length < 16) throw new Error('Ciphertext too short')

    const encrypted = data.subarray(0, data.length - 16)
    const tag = data.subarray(data.length - 16)
    const iv = this._nonceToIV(nonce)

    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(this.sessionKey), iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return JSON.parse(decrypted.toString('utf8'))
  }

  /**
   * Convert a monotonic nonce counter to a 12-byte IV.
   * @private
   */
  _nonceToIV(nonce) {
    const iv = Buffer.alloc(NONCE_BYTES)
    iv.writeBigUInt64BE(BigInt(nonce), 4) // right-aligned in 12 bytes
    return iv
  }

  hasSession() {
    return this.sessionKey !== null
  }

  destroy() {
    if (this.sessionKey) {
      // Best-effort zeroing
      Buffer.from(this.sessionKey).fill(0)
    }
    this.sessionKey = null
    this.ecdh = null
    this.sendNonce = 0
    this.recvNonce = 0
  }
}

module.exports = { IpcCryptoSession }
