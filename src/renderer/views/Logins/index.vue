<template>
  <div class="content-container">
    <div class="items-container">
      <!-- Search -->
      <div class="search-wrapper">
        <VFormText
          :placeholder="$t('Search passwords, websites, notes')"
          theme="black"
          v-model="searchQuery"
          v-debounce:300="fetchAll"
          class="w-100"
        />
      </div>
      <!-- Items -->
      <PerfectScrollbar class="logins">
        <LoginItem
          v-for="item in ItemList"
          :key="item.id"
          :active="$route.params.id == item.id"
          :data="item"
          @click="onClickItem(item.id)"
        />
      </PerfectScrollbar>
    </div>
    <!-- Detail -->
    <router-view />
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'

export default {
  data() {
    return {
      searchQuery: ''
    }
  },

  // beforeRouteUpdate(to, from, next) {
  //   next()
  // },

  async created() {
    await this.fetchAll()
  },

  methods: {
    ...mapActions('Logins', ['FetchAll']),

    async fetchAll() {
      try {
        await this.FetchAll({ Search: this.searchQuery })

        if (this.ItemList.length > 0) {
          this.onClickItem(this.ItemList[0].id)
        }
      } catch (error) {
        console.log(error)
      }
    },

    onClickItem(id) {
      this.$router.push({
        name: 'LoginDetail',
        params: { id }
      })
    }
  },

  computed: {
    ...mapState('Logins', ['ItemList'])
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
