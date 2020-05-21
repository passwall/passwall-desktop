<template>
  <div class="content-container">
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
      <PerfectScrollbar class="logins">
        <LoginItem
          v-for="i in 20"
          :key="i"
          :data="{ id: i, url: 'spotify.com', email: 'a.kemalakcay@gmail.com' }"
          @click="onClickItem({ id: i, url: 'spotify.com' + i, email: 'a.kemalakcay@gmail.com', password: '12456' })"
        />
      </PerfectScrollbar>
    </div>
    <!-- Detail -->
    <router-view />
  </div>
</template>

<script>
export default {
  data() {
    return {}
  },

  methods: {
    onClickItem(data) {
      this.$router.push({
        name: 'LoginDetail',
        params: { id: data.id, data }
      })
    }
  }
}
</script>

<style lang="scss">
.content-container {
  width: 100%;
  display: flex;
}

.items-container {
  display: flex;
  flex-direction: column;
  min-width: 295px;
  max-width: 295px;
  height: 100vh;
}

.logins  {
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
