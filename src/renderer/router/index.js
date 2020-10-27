import Vue from 'vue'
import Router from 'vue-router'
import CheckAuth from './auth-check'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: require('@/views/Auth/Login').default,
      meta: {
        auth: true
      }
    },
    {
      path: '/',
      name: 'Home',
      redirect: '/logins',
      component: require('@/views/Home/index').default,
      children: [
        {
          path: '/logins',
          name: 'Logins',
          component: require('@/views/Logins/index').default,
          children: [
            {
              path: 'create',
              name: 'LoginCreate',
              component: require('@/views/Logins/Create').default
            },
            {
              path: ':id',
              name: 'LoginDetail',
              component: require('@/views/Logins/Detail').default
            }
          ]
        },
        {
          path: '/credit-cards',
          name: 'CreditCards',
          component: require('@/views/CreditCards/index').default,
          children: [
            {
              path: 'create',
              name: 'CreditCardCreate',
              component: require('@/views/CreditCards/Create').default
            },
            {
              path: ':id',
              name: 'CreditCardDetail',
              component: require('@/views/CreditCards/Detail').default
            }
          ]
        },
        {
          path: '/bank-accounts',
          name: 'BankAccounts',
          component: require('@/views/BankAccounts/index').default,
          children: [
            {
              path: 'create',
              name: 'BankAccountCreate',
              component: require('@/views/BankAccounts/Create').default
            },
            {
              path: ':id',
              name: 'BankAccountDetail',
              component: require('@/views/BankAccounts/Detail').default
            }
          ]
        },
        {
          path: '/emails',
          name: 'Emails',
          component: require('@/views/Emails/index').default,
          children: [
            {
              path: 'create',
              name: 'EmailCreate',
              component: require('@/views/Emails/Create').default
            },
            {
              path: ':id',
              name: 'EmailDetail',
              component: require('@/views/Emails/Detail').default
            }
          ]
        },
        {
          path: '/notes',
          name: 'Notes',
          component: require('@/views/Notes/index').default,
          children: [
            {
              path: 'create',
              name: 'NoteCreate',
              component: require('@/views/Notes/Create').default
            },
            {
              path: ':id',
              name: 'NoteDetail',
              component: require('@/views/Notes/Detail').default
            }
          ]
        },
        {
          path: '/servers',
          name: 'Servers',
          component: require('@/views/Servers/index').default,
          children: [
            {
              path: 'create',
              name: 'ServerCreate',
              component: require('@/views/Servers/Create').default
            },
            {
              path: ':id',
              name: 'ServerDetail',
              component: require('@/views/Servers/Detail').default
            }
          ]
        }
      ]
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})

router.beforeEach(CheckAuth)

export default router
