import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Login',
      component: require('@/views/Login').default,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
