/**
 * Safe Key Store
 *
 * Persists encrypted key material using Electron's safeStorage API,
 * backed by OS-level encryption:
 *   - macOS: Keychain
 *   - Windows: DPAPI
 *   - Linux: libsecret / KWallet (if available)
 *
 * Keys are stored as safeStorage-encrypted blobs in the user data directory.
 * safeStorage encryption is tied to the OS user account; the raw key never
 * touches disk in plaintext.
 */

const { safeStorage } = require('electron')
const { app } = require('electron')
const fs = require('fs/promises')
const path = require('path')
const crypto = require('crypto')

const STORE_DIR_NAME = 'secure-keys'
const MAX_KEY_B64_LENGTH = 4096

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
}

function validateEmail(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) {
    throw new Error('email is required')
  }
  // Pragmatic validation for account key lookup
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('invalid email format')
  }
  if (normalized.length > 320) {
    throw new Error('email is too long')
  }
  return normalized
}

function validateUserKeyBase64(value) {
  const raw = String(value || '').trim()
  if (!raw) {
    throw new Error('userKeyBase64 is required')
  }
  if (raw.length > MAX_KEY_B64_LENGTH) {
    throw new Error('userKeyBase64 is too long')
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(raw)) {
    throw new Error('userKeyBase64 must be base64')
  }
  return raw
}

function getStoreDir() {
  return path.join(app.getPath('userData'), STORE_DIR_NAME)
}

function accountHash(email) {
  return crypto.createHash('sha256').update(email).digest('hex')
}

function keyFilePath(email) {
  return path.join(getStoreDir(), `${accountHash(email)}.enc`)
}

async function ensureStoreDir() {
  const dir = getStoreDir()
  await fs.mkdir(dir, { recursive: true, mode: 0o700 })
}

function isAvailable() {
  if (typeof safeStorage.isEncryptionAvailable !== 'function') return false
  return safeStorage.isEncryptionAvailable()
}

async function store(email, userKeyBase64) {
  if (!isAvailable()) {
    throw new Error('OS secure storage is not available')
  }
  const normalizedEmail = validateEmail(email)
  const normalizedUserKey = validateUserKeyBase64(userKeyBase64)

  await ensureStoreDir()
  const encrypted = safeStorage.encryptString(normalizedUserKey)
  await fs.writeFile(keyFilePath(normalizedEmail), encrypted, { mode: 0o600 })
}

async function retrieve(email) {
  if (!isAvailable()) return null
  if (!email) return null
  const normalizedEmail = validateEmail(email)

  const filePath = keyFilePath(normalizedEmail)
  try {
    const encrypted = await fs.readFile(filePath)
    return safeStorage.decryptString(encrypted)
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

async function remove(email) {
  if (!email) return
  const normalizedEmail = validateEmail(email)
  const filePath = keyFilePath(normalizedEmail)
  try {
    await fs.unlink(filePath)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}

async function has(email) {
  if (!email) return false
  const normalizedEmail = validateEmail(email)
  try {
    await fs.access(keyFilePath(normalizedEmail))
    return true
  } catch {
    return false
  }
}

module.exports = { isAvailable, store, retrieve, remove, has }
