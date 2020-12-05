import { mapState } from 'vuex'

export default {
  data() {
    return {
      itemMenuActive: false,
      emptyCenterStateActive: false
    }
  },

  beforeRouteUpdate(to, from, next) {
    if (to.params.openFirst) {
      this.openFirstItem()
    } else if (to.params.refresh) {
      this.fetchAll()
    }
    next()
  },

  created() {
    this.fetchAll()
  },

  methods: {
    async fetchAll() {
      try {
        await this.$request(this.FetchAll)
        this.openFirstItem()
      } catch (error) {
        console.log(error)
      }
    },

    openFirstItem() {
      if (this.ItemList.length > 0) {
        this.onClickItem(this.ItemList[0])
      }
    }
  },

  computed: {
    ...mapState(['searchQuery']),

    filteredList() {
      return this.ItemList.filter(item =>
        Object.values(item).some(value =>
          (value || '')
            .toString()
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase())
        )
      )
    }
  }
}
