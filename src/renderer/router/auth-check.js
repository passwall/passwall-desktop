import store from '@/store';

export default (to, from, next) => {
    
    const isAuthPage = to.matched.some(record => record.meta.auth)

    const isAuthenticated = store.getters['isAuthenticated']
    if (isAuthenticated) {
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