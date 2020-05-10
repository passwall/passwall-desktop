import Vue from 'vue';
import axios from 'axios';

import App from './App';
import router from './router';
import store from './store';

Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>',
}).$mount('#app');
