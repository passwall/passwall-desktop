<template>
  <div id="app">
    <router-view></router-view>
    <Icons />
  </div>
</template>

<script>
import Icons from './Icons'

export default {
  components: {
    Icons
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  outline: 0;
}

body {
  font-family: 'Source Sans Pro', sans-serif;
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
  background-color: black;
}
</style>
