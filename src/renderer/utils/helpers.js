import CryptoJS from 'crypto-js'

var keySize = 256; // 32
var ivSize = 128; // 16
var iterations = 100;

export default {

  hmac (msg, transmission_key) {
    var encrypted = CryptoJS.HmacSHA256(msg, transmission_key);
    return encrypted.toString();
  },
  

  encrypt (msg, pass) {
    var salt = CryptoJS.lib.WordArray.random(128/8);
    
    var key = CryptoJS.PBKDF2(pass, salt, {
        keySize: keySize/32,
        iterations: iterations
      });
  
    var iv = CryptoJS.lib.WordArray.random(ivSize/8);
    
    var encrypted = CryptoJS.AES.encrypt(msg, key, { 
      iv: iv, 
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
      hasher: CryptoJS.algo.SHA256
    });
    
    // salt, iv will be hex 32 in length
    // append them to the ciphertext for use  in decryption
    var transitmessage = salt.toString()+ iv.toString() + encrypted.toString();
    return transitmessage;
  },

  decrypt (transitmessage, pass) {
    var salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32));
    var iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32))
    var encrypted = transitmessage.substring(64);
    
    var key = CryptoJS.PBKDF2(pass, salt, {
        keySize: keySize/32,
        iterations: iterations
      });
  
    var decrypted = CryptoJS.AES.decrypt(encrypted, key, { 
      iv: iv, 
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
      hasher: CryptoJS.algo.SHA256
    })
    return decrypted.toString(CryptoJS.enc.Utf8);
  },
  
  pbkdf2Encrypt(master_password, secret) {
    const cipher = CryptoJS.PBKDF2(master_password, secret, {
      keySize: 256 / 32,
      iterations: 100000,
      hasher: CryptoJS.algo.SHA256
    })

  return cipher.toString()
  },

  sha256Encrypt(value) {  
    return CryptoJS.SHA256(value).toString()
  },

  aesEncrypt(value, key) {  
    return CryptoJS.AES.encrypt(value, key).toString()
  },

  aesDecrypt(value, key) {  
    return CryptoJS.AES.decrypt(value, key).toString(CryptoJS.enc.Utf8)
  }

}