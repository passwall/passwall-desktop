import { reactive } from 'vue'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseRules(rules = '') {
  if (typeof rules !== 'string') {
    return []
  }

  return rules
    .split('|')
    .map(rule => rule.trim())
    .filter(Boolean)
    .map(rule => {
      const [name, value] = rule.split(':')
      return { name, value }
    })
}

function getFieldValue(field) {
  if (!field || !field.el) {
    return ''
  }

  const value = field.el.value
  return typeof value === 'string' ? value : ''
}

function getErrorMessage(field, rule) {
  const label = field.name || 'This field'

  switch (rule.name) {
    case 'required':
      return `${label} is required.`
    case 'email':
      return `${label} must be a valid email.`
    case 'min':
      return `${label} must be at least ${rule.value} characters.`
    case 'max':
      return `${label} must be at most ${rule.value} characters.`
    default:
      return `${label} is invalid.`
  }
}

export function createValidator() {
  const errors = reactive({ items: [] })
  const fields = new Map()

  const setError = (fieldName, message) => {
    const index = errors.items.findIndex(item => item.field === fieldName)
    if (index !== -1) {
      errors.items.splice(index, 1)
    }

    if (message) {
      errors.items.push({ field: fieldName, msg: message })
    }
  }

  const validateField = field => {
    if (!field) {
      return true
    }

    const rules = parseRules(field.rules)
    const value = getFieldValue(field)

    for (const rule of rules) {
      if (rule.name === 'required' && !value.trim()) {
        setError(field.name, getErrorMessage(field, rule))
        return false
      }

      if (rule.name === 'email' && value && !EMAIL_REGEX.test(value)) {
        setError(field.name, getErrorMessage(field, rule))
        return false
      }

      if (rule.name === 'min' && value.length < Number(rule.value || 0)) {
        setError(field.name, getErrorMessage(field, rule))
        return false
      }

      if (rule.name === 'max' && value.length > Number(rule.value || 0)) {
        setError(field.name, getErrorMessage(field, rule))
        return false
      }
    }

    setError(field.name, '')
    return true
  }

  const validateAll = () => {
    const results = []
    fields.forEach(field => results.push(validateField(field)))
    return results.every(Boolean)
  }

  const registerField = (el, name, rules) => {
    if (!el) {
      return
    }

    const field = {
      el,
      name,
      rules
    }

    fields.set(el, field)
    return field
  }

  const unregisterField = el => {
    if (!el) {
      return
    }

    const field = fields.get(el)
    if (field) {
      setError(field.name, '')
    }
    fields.delete(el)
  }

  return {
    errors,
    registerField,
    unregisterField,
    validateField,
    validateAll
  }
}
