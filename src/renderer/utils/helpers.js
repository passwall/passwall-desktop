import CryptoJS from 'crypto-js'

const key = '82f2ceed4c503896c8a291e560bd4325' // change to your key
const iv = 'sinasinasisinaaa' // change to your iv
var salt = CryptoJS.lib.WordArray.random(128 / 8);

export default {
  
  pbkdf2Encrypt(value) {
    const cipher = CryptoJS.PBKDF2(value, salt, {
      keySize: 256 / 32,
      iterations: 100000,
      hasher: CryptoJS.algo.SHA256
    })

  return cipher.toString()
  },

  aesEncrypt(value, secure_key) {
    const cipher = CryptoJS.AES.encrypt(value, CryptoJS.enc.Utf8.parse(secure_key), {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC
    })

    return cipher.toString()
  },

  aesDecrypt(value) {
    const cipher = CryptoJS.AES.decrypt(value, CryptoJS.enc.Utf8.parse(key), {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC
    })
    return CryptoJS.enc.Utf8.stringify(cipher).toString()
  },

  sha256Encrypt(value) {  
    return CryptoJS.SHA256(value).toString()
  }

}