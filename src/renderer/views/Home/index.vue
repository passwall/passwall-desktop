<template>
  <div class="container">
    home
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
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
.login-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: space-between;

  .btn,
  .form-text {
    width: 350px;
  }
}

.master-pass-tooltip {
  color: $color-gray-300;
  float: right;
  margin-top: 4px;

  &:hover {
    color: #fff;
  }
}

.login-background {
  position: absolute;
  top: 0px;
  left: 0px;
}

.login-right-corner {
  position: absolute;
  top: 0px;
  right: 0px;
  z-index: 10;
}

.login-form {
  width: 50%;
  min-width: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 130px;
  background-color: black;
  z-index: 9;
}

.login-form {
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    line-height: 22px;
    color: #fff;
    margin-bottom: 8px;
  }
}
</style>
