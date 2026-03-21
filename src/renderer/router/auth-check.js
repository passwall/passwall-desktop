import store from '@/store'

let _keychainRestoreAttempted = false

export default async (to) => {
  const isAuthPage = to.matched.some((record) => record.meta.auth)
  let isAuthenticated = store.getters['isAuthenticated']

  // On first navigation, try to restore userKey from OS keychain if session is stale
  if (!isAuthenticated && !_keychainRestoreAttempted && store.state.access_token) {
    _keychainRestoreAttempted = true
    const restored = await store.dispatch('restoreUserKeyFromKeychain')
    if (restored) {
      isAuthenticated = store.getters['isAuthenticated']
    }
  }
  if (!_keychainRestoreAttempted) {
    _keychainRestoreAttempted = true
  }

  if (isAuthenticated && isAuthPage) {
    return { name: 'Home' }
  }

  if (!isAuthenticated && !isAuthPage) {
    return { name: 'Login' }
  }

  return true
}
