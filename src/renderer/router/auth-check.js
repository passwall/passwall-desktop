import store from '@/store'

export default (to) => {
  const isAuthPage = to.matched.some((record) => record.meta.auth)
  const isAuthenticated = store.getters['isAuthenticated']

  if (isAuthenticated && isAuthPage) {
    return { name: 'Home' }
  }

  if (!isAuthenticated && !isAuthPage) {
    return { name: 'Login' }
  }

  return true
}
