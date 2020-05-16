export default (to, from, next) => {
    const isAuthPage = to.matched.some(record => record.meta.auth)
  
    const token = localStorage.getItem('token')
    if (token) {
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