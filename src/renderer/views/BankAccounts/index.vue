<template>
  <div class="content-container">
    <div class="items-container">
      <!-- Items -->
      <PerfectScrollbar>
        <!-- List -->
        <template v-if="filteredList.length > 0">
          <ListItem
            v-for="item in filteredList"
            :key="item.id"
            :active="$route.params.id == item.id"
            :data="item"
            @click="onClickItem(item)"
            type="BankAccount"
          />
        </template>
        <!-- Empty State -->
        <div v-else class="flex-center flex-column c-gray-700 h-100">
          <VIcon name="logo-outline" size="48" class="mt-n7" />
          <span class="fs-big mt-3" v-text="$t('There is nothing here, yet...')" />
        </div>
      </PerfectScrollbar>

      <!-- Add Item Menu -->
      <AddItemMenu :active="itemMenuActive" @hide="itemMenuActive = false" />

      <!-- Add Btn -->
      <button
        class="add-item-menu-btn"
        :class="{ '--active': itemMenuActive }"
        @click="itemMenuActive = !itemMenuActive"
      >
        <VIcon name="plus" class="c-white" size="18px" />
      </button>
    </div>
    <!-- Detail -->
    <div
      class="w-100 h-100 flex-center c-gray-700"
      v-if="ItemList.length > 0 && $route.name == 'BankAccounts'"
    >
      {{ $t('Select one item to see it’s details...') }}
    </div>
    <RouterView />
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import ListMixin from '@/mixins/list'

export default {
  mixins: [ListMixin],

  methods: {
    ...mapActions('BankAccounts', ['FetchAll']),

    onClickItem(detail) {
      this.$router.push({
        name: 'BankAccountDetail',
        params: { id: detail.id }
      })
    }
  },

  computed: {
    ...mapState('BankAccounts', ['ItemList'])
  }
}
</script>
