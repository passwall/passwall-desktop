import { createRouter, createWebHashHistory } from 'vue-router'
import CheckAuth from './auth-check'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Auth/Login.vue'),
      meta: {
        auth: true
      }
    },
    {
      path: '/',
      name: 'Home',
      redirect: '/passwords',
      component: () => import('@/views/Home/index.vue'),
      children: [
        {
          path: '/passwords',
          name: 'Passwords',
          component: () => import('@/views/Passwords/index.vue'),
          children: [
            {
              path: 'create',
              name: 'PasswordCreate',
              component: () => import('@/views/Passwords/Create.vue')
            },
            {
              path: ':id',
              name: 'PasswordDetail',
              component: () => import('@/views/Passwords/Detail.vue')
            }
          ]
        },
        {
          path: '/credit-cards',
          name: 'CreditCards',
          component: () => import('@/views/CreditCards/index.vue'),
          children: [
            {
              path: 'create',
              name: 'CreditCardCreate',
              component: () => import('@/views/CreditCards/Create.vue')
            },
            {
              path: ':id',
              name: 'CreditCardDetail',
              component: () => import('@/views/CreditCards/Detail.vue')
            }
          ]
        },
        {
          path: '/bank-accounts',
          name: 'BankAccounts',
          component: () => import('@/views/BankAccounts/index.vue'),
          children: [
            {
              path: 'create',
              name: 'BankAccountCreate',
              component: () => import('@/views/BankAccounts/Create.vue')
            },
            {
              path: ':id',
              name: 'BankAccountDetail',
              component: () => import('@/views/BankAccounts/Detail.vue')
            }
          ]
        },
        {
          path: '/emails',
          name: 'Emails',
          component: () => import('@/views/Emails/index.vue'),
          children: [
            {
              path: 'create',
              name: 'EmailCreate',
              component: () => import('@/views/Emails/Create.vue')
            },
            {
              path: ':id',
              name: 'EmailDetail',
              component: () => import('@/views/Emails/Detail.vue')
            }
          ]
        },
        {
          path: '/notes',
          name: 'Notes',
          component: () => import('@/views/Notes/index.vue'),
          children: [
            {
              path: 'create',
              name: 'NoteCreate',
              component: () => import('@/views/Notes/Create.vue')
            },
            {
              path: ':id',
              name: 'NoteDetail',
              component: () => import('@/views/Notes/Detail.vue')
            }
          ]
        },
        {
          path: '/servers',
          name: 'Servers',
          component: () => import('@/views/Servers/index.vue'),
          children: [
            {
              path: 'create',
              name: 'ServerCreate',
              component: () => import('@/views/Servers/Create.vue')
            },
            {
              path: ':id',
              name: 'ServerDetail',
              component: () => import('@/views/Servers/Detail.vue')
            }
          ]
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach((to, from) => {
  return CheckAuth(to)
})

export default router
