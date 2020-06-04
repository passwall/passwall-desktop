<template>
  <div id="app">
    <router-view />
    <TheIcons />
    <notifications width=345 position="top center" />
  </div>
</template>

<style lang="scss">
.vue-notification {
  
  padding: 10px 10px 10px 35px;
  margin-top: 10px;

  font-weight: 600;
  font-size: 14px;
  line-height: 22px;

  color: #ffffff;
  background: #151C27;

  border-radius: 8px;

  &.warn {
    background: #151C27;
    border-left-color: #151C27;
  }

  &.error {
    background: #151C27;
    border-left-color: #151C27;
    background-image:url(../../static/img/error-notify.png);
    background-repeat: no-repeat; 
    background-position: 5px center;
  }

  &.success {
    background: #151C27;
    border-left-color: #151C27;
  }
}
</style>