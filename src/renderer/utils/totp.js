import { authenticator } from '@otplib/preset-browser'

class TotpService {
  constructor() {
    authenticator.options = {
      digits: 6,
      step: 30,
      window: 1
    }
  }

  generateCode(secret) {
    try {
      if (!secret) return null
      const actualSecret = this.extractSecretFromUrl(secret)
      const cleanSecret = actualSecret.replace(/[\s-]/g, '').toUpperCase()
      return authenticator.generate(cleanSecret)
    } catch (_error) {
      return null
    }
  }

  formatCode(code) {
    if (!code || code.length !== 6) return code
    return `${code.substring(0, 3)} ${code.substring(3, 6)}`
  }

  verify(token, secret) {
    try {
      const actualSecret = this.extractSecretFromUrl(secret)
      const cleanSecret = actualSecret.replace(/[\s-]/g, '').toUpperCase()
      return authenticator.verify({ token, secret: cleanSecret })
    } catch (_error) {
      return false
    }
  }

  getRemainingSeconds() {
    const epoch = Math.floor(Date.now() / 1000)
    const step = 30
    return step - (epoch % step)
  }

  getProgress() {
    const remaining = this.getRemainingSeconds()
    return Math.floor((remaining / 30) * 100)
  }

  isExpiringSoon() {
    return this.getRemainingSeconds() <= 5
  }

  extractSecretFromUrl(input) {
    try {
      if (input.startsWith('otpauth://')) {
        const url = new URL(input)
        return url.searchParams.get('secret') || input
      }
      return input
    } catch (_error) {
      return input
    }
  }

  isValidSecret(secret) {
    try {
      if (!secret) return false
      const actualSecret = this.extractSecretFromUrl(secret)
      const cleanSecret = actualSecret.replace(/[\s-]/g, '').toUpperCase()
      const base32Regex = /^[A-Z2-7]+=*$/
      return base32Regex.test(cleanSecret) && cleanSecret.length >= 16
    } catch (_error) {
      return false
    }
  }

  getTotpInfo(secret) {
    const code = this.generateCode(secret)
    const remaining = this.getRemainingSeconds()
    const progress = this.getProgress()
    const expiring = this.isExpiringSoon()

    return {
      code,
      formattedCode: this.formatCode(code),
      remaining,
      progress,
      expiring,
      isValid: this.isValidSecret(secret)
    }
  }
}

const totpService = new TotpService()

export default totpService
