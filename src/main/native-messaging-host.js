/**
 * Native Messaging Host
 *
 * Implements the Chrome/Firefox native messaging protocol (stdin/stdout).
 * Launched by the browser as a subprocess when the extension calls
 * chrome.runtime.connectNative('com.passwall.desktop').
 *
 * Wire format (both directions):
 *   [4-byte LE message length][UTF-8 JSON payload]
 *
 * Max incoming message: 1 MB (Chrome limit)
 * Max outgoing message: 1 MB
 *
 * This module is loaded by the main Electron process when --native-messaging
 * is passed as a command-line flag. It bridges stdin/stdout with the
 * Electron main process via an EventEmitter-style API so the main process
 * can respond to extension requests using the same safe-key-store and
 * pairing infrastructure.
 */

const { app } = require('electron')
const safeKeyStore = require('./safe-key-store.js')
const { IpcCryptoSession } = require('./ipc-crypto.js')
const nodePath = require('path')
const nodeFs = require('fs')

const MAX_MESSAGE_SIZE = 1024 * 1024 // 1 MB

// Allowed extension origins (Chrome format). Updated at build time.
// Firefox uses allowed_extensions in the manifest instead.
const PROD_EXTENSION_ID = 'blaiihhmnjllkfnkmkidahhegbmlghmo'
const KNOWN_DEV_EXTENSION_IDS = ['cnohkljjjnoajldmkfeipegcaogcgknc']

// Must mirror the IDs used in ensureNativeHostRegistration() (index.js)
// so the host never rejects an origin that the manifest allowed Chrome to send.
function getAllowedOrigins() {
  const envIds = String(process.env.PASSWALL_CHROME_EXTENSION_IDS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  const ids = new Set([PROD_EXTENSION_ID, ...KNOWN_DEV_EXTENSION_IDS, ...envIds])
  return Array.from(ids).map((id) => `chrome-extension://${id}/`)
}

class NativeMessagingHost {
  constructor() {
    this.buffer = Buffer.alloc(0)
    this.sessions = new Map() // extensionOrigin -> IpcCryptoSession
    this.callerOrigin = null
    this.originAuthorized = false
    this.desktopLocked = false
    this.isRunning = false
  }

  start() {
    this.callerOrigin = process.argv.find((arg) => arg.startsWith('chrome-extension://')) || null
    this.originAuthorized = !!this.callerOrigin && getAllowedOrigins().includes(this.callerOrigin)

    if (!this.originAuthorized) {
      this._sendError('UNAUTHORIZED_ORIGIN', 'Caller origin is not allowed')
      // Stay alive briefly so Chrome doesn't immediately relaunch us in a
      // tight loop, then exit cleanly.
      setTimeout(() => app.exit(0), 2000)
      return
    }

    // On Windows, set stdin to binary mode
    if (process.platform === 'win32' && process.stdin.setRawMode) {
      try {
        process.stdin.setRawMode(true)
      } catch {
        // ignore
      }
    }

    process.stdin.on('readable', () => this._onReadable())
    process.stdin.on('end', () => this._onEnd('stdin-end'))
    process.stdin.on('error', (err) => this._onEnd(err?.message || 'stdin-error'))

    this.isRunning = true
  }

  _onReadable() {
    let chunk
    while ((chunk = process.stdin.read()) !== null) {
      this.buffer = Buffer.concat([this.buffer, chunk])
      this._processBuffer()
    }
  }

  _processBuffer() {
    while (this.buffer.length >= 4) {
      const messageLength = this.buffer.readUInt32LE(0)

      if (messageLength > MAX_MESSAGE_SIZE) {
        this._sendError('MESSAGE_TOO_LARGE', 'Message exceeds 1 MB limit')
        this._onEnd('message-too-large')
        return
      }

      if (this.buffer.length < 4 + messageLength) {
        break // Wait for more data
      }

      const jsonBytes = this.buffer.subarray(4, 4 + messageLength)
      this.buffer = this.buffer.subarray(4 + messageLength)

      try {
        const message = JSON.parse(jsonBytes.toString('utf8'))
        this._handleMessage(message)
      } catch {
        this._sendError('INVALID_JSON', 'Failed to parse message')
      }
    }
  }

  _sendMessage(message) {
    try {
      const json = JSON.stringify(message)
      const bytes = Buffer.from(json, 'utf8')

      if (bytes.length > MAX_MESSAGE_SIZE) {
        this._sendError('RESPONSE_TOO_LARGE', 'Response exceeds 1 MB limit')
        return
      }

      const header = Buffer.alloc(4)
      header.writeUInt32LE(bytes.length, 0)
      process.stdout.write(header)
      process.stdout.write(bytes)
    } catch {
      // stdout may be closed
    }
  }

  _sendResponse(id, type, payload) {
    this._sendMessage({
      v: 1,
      type: 'response',
      id,
      payload
    })
  }

  _sendError(code, message, id) {
    this._sendMessage({
      v: 1,
      type: 'error',
      id: id || null,
      payload: { code, message }
    })
  }

  _sendEvent(eventType, payload) {
    this._sendMessage({
      v: 1,
      type: 'event',
      payload: { event: eventType, ...payload }
    })
  }

  async _handleMessage(message) {
    const { id, type, payload } = message || {}

    if (!type || !id) {
      this._sendError('INVALID_MESSAGE', 'Missing type or id')
      return
    }

    if (!this.originAuthorized) {
      this._sendError('UNAUTHORIZED_ORIGIN', 'Caller origin is not allowed', id)
      return
    }

    try {
      switch (type) {
        case 'PING':
          this._sendResponse(id, 'PONG', { status: 'ok', version: 1 })
          break

        case 'GET_STATUS':
          await this._handleGetStatus(id)
          break

        case 'GET_USER_KEY':
          await this._handleGetUserKey(id, payload)
          break

        case 'HAS_USER_KEY':
          await this._handleHasUserKey(id, payload)
          break

        case 'HANDSHAKE':
          await this._handleHandshake(id, payload)
          break

        default:
          this._sendError('UNKNOWN_TYPE', `Unknown message type: ${type}`, id)
      }
    } catch (err) {
      this._sendError('INTERNAL_ERROR', err.message || 'Internal error', id)
    }
  }

  async _handleGetStatus(id) {
    const available = safeKeyStore.isAvailable()
    this._sendResponse(id, 'STATUS', {
      available,
      platform: process.platform,
      version: 1
    })
  }

  async _handleGetUserKey(id, payload) {
    const email = payload?.email
    if (!email) {
      this._sendError('MISSING_EMAIL', 'email is required', id)
      return
    }

    if (!safeKeyStore.isAvailable()) {
      this._sendError('KEYSTORE_UNAVAILABLE', 'OS secure storage not available', id)
      return
    }

    if (this.desktopLocked) {
      this._sendError('DESKTOP_LOCKED', 'Desktop is locked', id)
      return
    }

    const userKeyB64 = await safeKeyStore.retrieve(email)
    if (!userKeyB64) {
      this._sendError('KEY_NOT_FOUND', 'No key stored for this account', id)
      return
    }

    // Require a secure channel for key material responses.
    const origin = this.callerOrigin
    const session = origin ? this.sessions.get(origin) : null

    if (!session || !session.hasSession()) {
      this._sendError('HANDSHAKE_REQUIRED', 'Secure session is required before requesting keys', id)
      return
    }

    const encrypted = session.encrypt({ userKey: userKeyB64 })
    this._sendResponse(id, 'USER_KEY_ENCRYPTED', encrypted)
  }

  async _handleHasUserKey(id, payload) {
    const email = payload?.email
    if (!email) {
      this._sendError('MISSING_EMAIL', 'email is required', id)
      return
    }

    const exists = await safeKeyStore.has(email)
    this._sendResponse(id, 'HAS_USER_KEY_RESULT', { exists })
  }

  async _handleHandshake(id, payload) {
    const { extensionPublicKey } = payload || {}
    if (!extensionPublicKey) {
      this._sendError('MISSING_KEY', 'extensionPublicKey is required', id)
      return
    }

    const session = new IpcCryptoSession()
    const desktopPublicKey = session.generateKeyPair()

    try {
      session.deriveSessionKey(extensionPublicKey)
    } catch {
      this._sendError('KEY_AGREEMENT_FAILED', 'ECDH key agreement failed', id)
      return
    }

    const origin = this.callerOrigin
    if (origin) {
      const old = this.sessions.get(origin)
      if (old) old.destroy()
      this.sessions.set(origin, session)
    }

    this._persistConnection(origin)
    this._sendResponse(id, 'HANDSHAKE_OK', { desktopPublicKey })
  }

  getConnectedBrowsers() {
    const browsers = []
    for (const [origin, session] of this.sessions) {
      browsers.push({
        origin,
        connected: this.isRunning && session.hasSession()
      })
    }
    return browsers
  }

  removeSession(origin) {
    const session = this.sessions.get(origin)
    if (session) {
      session.destroy()
      this.sessions.delete(origin)
    }
  }

  _persistConnection(origin) {
    if (!origin) return
    try {
      const filePath = nodePath.join(app.getPath('userData'), 'paired-browsers.json')
      let list = []
      try {
        list = JSON.parse(nodeFs.readFileSync(filePath, 'utf8'))
      } catch {
        /* no file yet */
      }
      list = list.filter((p) => p.origin !== origin)
      list.push({ origin, connectedAt: Date.now() })
      nodeFs.writeFileSync(filePath, JSON.stringify(list, null, 2), { mode: 0o600 })
    } catch {
      /* non-fatal */
    }
  }

  _removeConnection(origin) {
    if (!origin) return
    try {
      const filePath = nodePath.join(app.getPath('userData'), 'paired-browsers.json')
      let list = []
      try {
        list = JSON.parse(nodeFs.readFileSync(filePath, 'utf8'))
      } catch {
        /* no file */
      }
      const filtered = list.filter((p) => p.origin !== origin)
      nodeFs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), { mode: 0o600 })
    } catch {
      /* non-fatal */
    }
  }

  _onEnd(reason = 'unknown') {
    this._removeConnection(this.callerOrigin)
    for (const session of this.sessions.values()) {
      session.destroy()
    }
    this.sessions.clear()
    this.isRunning = false
    this.buffer = Buffer.alloc(0)

    // Native messaging subprocess has no reason to stay alive after stdin closes.
    app.exit(0)
  }

  /**
   * Notify connected extension of desktop lock events
   */
  notifyLocked() {
    this.desktopLocked = true
    if (this.isRunning) {
      this._sendEvent('DESKTOP_LOCKED')
    }
  }

  notifyUnlocked() {
    this.desktopLocked = false
    if (this.isRunning) {
      this._sendEvent('DESKTOP_UNLOCKED')
    }
  }
}

module.exports = { NativeMessagingHost }
