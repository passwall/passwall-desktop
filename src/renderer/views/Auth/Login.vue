<template>
  <div class="login-container">
    <!-- Left Background -->
    <div>
      <Icon name="passwall-back" class="login-background" width="450px" height="540px" />
      <Icon name="right-corner" class="login-right-corner" size="82" />
    </div>
    <!-- Login Form -->
    <form class="login-form" @submit.stop.prevent="onLogin">
      <!-- E-Mail Address -->
      <div>
        <label v-text="$t('EMailAddress')" />
        <FormText
          v-model="LoginForm.email"
          size="medium"
          v-validate="'required|email'"
          name="E-Mail"
          placeholder="E-Mail"
        />
      </div>
      <!-- Master Password -->
      <div class="mt-4 mb-5">
        <label class="w-100">
          {{ $t('MasterPassword') }}
          <Icon
            size="14"
            name="question-mark"
            class="master-pass-tooltip"
            v-tooltip.bottom="$t('MasterPasswordRecoveryMessage')"
          />
        </label>
        <FormText
          v-model="LoginForm.master_password"
          size="medium"
          type="password"
          v-validate="'required|min:6|max:100'"
          name="Master Password"
          placeholder="Master Password"
        />
      </div>
      <!-- Login Btn -->
      <Btn type="submit" size="medium">Login</Btn>
    </form>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  data() {
    return {
      LoginForm: {
        email: 'hello@passwall.io',
        master_password: 'password'
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
          this.$router.push({ name: 'Home' })
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
