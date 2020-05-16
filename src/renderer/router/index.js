import Vue from 'vue'
import Router from 'vue-router'
import CheckAuth from './auth-check'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'Login',
      component: require('@/views/Login').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})

// router.beforeEach(CheckAuth)

export default router
