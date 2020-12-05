<template>
  <div class="main-container">
    <Sidebar />
    <!-- Content -->
    <RouterView />
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import Sidebar from './Sidebar/index'

export default {
  components: {
    Sidebar
  }
}
</script>

<style lang="scss">
.main-container {
  display: flex;
  height: calc(100vh - 56px);
}
</style>
