<template>
  <div class="main-container">
    <TheSidebar />
    <router-view />
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import TheSidebar from './TheSidebar'

export default {
  components: {
    TheSidebar
  },

  data() {
    return {
      LoginForm: {
        email: '',
        master_password: ''
      }
    }
  },

  methods: {
    ...mapActions('Auth', ['Login']),

    onLogin() {
      this.$validator.validate().then(async result => {
        if (!result) return

        try {
          await this.Login(this.LoginForm)
        } catch (error) {
          console.log(error)
        }
      })
    }
  }
}
</script>

<style lang="scss">
.main-container {
  display: flex;
}
</style>
