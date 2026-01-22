export default {
  data() {
    return {
      form: {}
    }
  },

  methods: {
    setFormFromRoute(route) {
      const detail = route?.params?.detail
      if (detail) {
        this.form = detail
        return
      }

      const id = route?.params?.id
      if (!id || !Array.isArray(this.ItemList)) {
        this.form = {}
        return
      }

      const match = this.ItemList.find((item) => item.id == id)
      this.form = match || {}
    }
  },

  beforeRouteUpdate(to, from, next) {
    this.setFormFromRoute(to)
    next()
  },

  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.setFormFromRoute(to)
    })
  },

  watch: {
    ItemList: {
      handler() {
        this.setFormFromRoute(this.$route)
      },
      immediate: true
    },
    '$route.params.id'() {
      this.setFormFromRoute(this.$route)
    }
  }
}
