import CryptoJS from 'crypto-js'

const keySize = 256 // 32
const ivSize = 128 // 16
const iterations = 100

export const hmac = (msg, transmissionKey) => {
  const encrypted = CryptoJS.HmacSHA256(msg, transmissionKey)
  return encrypted.toString()
}

export const encrypt = (message, password) => {
  const salt = CryptoJS.lib.WordArray.random(128 / 8)

  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: keySize / 32,
    iterations: iterations
  })

  const iv = CryptoJS.lib.WordArray.random(ivSize / 8)

  const encrypted = CryptoJS.AES.encrypt(message, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
    hasher: CryptoJS.algo.SHA256
  })

  // salt, iv will be hex 32 in length
  // append them to the ciphertext for use  in decryption
  const transitMessage = salt.toString() + iv.toString() + encrypted.toString()
  return transitMessage
}

export const decrypt = (transitMessage, pass) => {
  const salt = CryptoJS.enc.Hex.parse(transitMessage.substr(0, 32))
  const iv = CryptoJS.enc.Hex.parse(transitMessage.substr(32, 32))
  const encrypted = transitMessage.substring(64)

  const key = CryptoJS.PBKDF2(pass, salt, {
    keySize: keySize / 32,
    iterations: iterations
  })

  const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
    hasher: CryptoJS.algo.SHA256
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}

export const pbkdf2Encrypt = (masterPassword, secret) => {
  const cipher = CryptoJS.PBKDF2(masterPassword, secret, {
    keySize: 256 / 32,
    iterations: 100000,
    hasher: CryptoJS.algo.SHA256
  })

  return cipher.toString()
}

export const sha256Encrypt = value => {
  return CryptoJS.SHA256(value).toString()
}

export const aesEncrypt = (value, key) => {
  return CryptoJS.AES.encrypt(value, key).toString()
}

export const aesDecrypt = (value, key) => {
  return CryptoJS.AES.decrypt(value, key).toString(CryptoJS.enc.Utf8)
}

export const encryptFields = (data, password) => {
  Object.keys(data).forEach(key => {
    data[key] = encrypt(data[key], password)
  })
}

export const decryptFields = (data, password) => {
  Object.keys(data).forEach(key => {
    data[key] = decrypt(data[key], password)
  })
}

