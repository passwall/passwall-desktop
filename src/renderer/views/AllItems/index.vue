<template>
  <div class="items-container">
    <!-- Search -->
    <div class="search-wrapper">
      <VFormText
        :placeholder="$t('Search passwords, websites, notes')"
        theme="black"
        class="w-100"
      />
    </div>
    <!-- Items -->
    <perfect-scrollbar class="all-items">
      <LoginItem
        v-for="i in 20"
        :key="i"
        :data="{ website: 'spotify.com', email: 'a.kemalakcay@gmail.com' }"
      />
    </perfect-scrollbar>
  </div>
</template>

<script>
export default {
  data() {
    return {}
  }
}
</script>

<style lang="scss">
.items-container {
  display: flex;
  flex-direction: column;
  min-width: 295px;
  height: 100vh;
}

.all-items  {
  height: 100%;
}

.search-wrapper {
  display: flex;
  align-items: center;
  background-color: $color-gray-600;
  padding: 0 $spacer-3;
  min-height: 64px;
  height: 64px;
  border-bottom: 1px solid black;
}
</style>
