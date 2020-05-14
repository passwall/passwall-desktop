import Vue from 'vue';

// Auto register all components
const requireComponent = require.context('./components', true, /\.(vue)$/);
requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName);
  Vue.component(componentConfig.default.name, () =>
    import(`@/components/${fileName.replace('./', '')}`),
  );
});
