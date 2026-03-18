<template>
  <div class="main-container">
    <Sidebar />
    <!-- Content -->
    <RouterView />
  </div>
</template>

<script>
import Sidebar from './Sidebar/index.vue'

export default {
  components: {
    Sidebar
  }
}
</script>

<style lang="scss">
.main-container {
  display: flex;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}
</style>
