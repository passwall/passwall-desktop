export default (to, from, next) => {
    const isAuthPage = to.matched.some(record => record.meta.auth)
  
    const access_token = localStorage.getItem('access_token')
    if (access_token) {
      if (isAuthPage) {
        return next({ name: 'Home' })
      }
    } else {
      if (!isAuthPage) {
        return next({ name: 'Login' })
      }
    }
    next()
  }