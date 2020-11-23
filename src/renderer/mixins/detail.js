export default {
  data() {
    return {
      form: {}
    }
  },

  beforeRouteUpdate(to, from, next) {
    this.form = to.params.detail
    next()
  },

  beforeRouteEnter(to, from, next) {
    next(vm => {
      vm.form = to.params.detail
    })
  }
}
