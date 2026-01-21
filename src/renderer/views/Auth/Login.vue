<template>
  <div class="login-container">
    <!-- Left Background -->
    <div>
      <VIcon name="passwall-back" class="login-background" width="450px" height="504px" />
      <VIcon name="right-corner" class="login-right-corner" size="82px" />
    </div>
    <!-- Login Form -->
    <form class="login-form" @submit.stop.prevent="onLogin">
      <!-- Server -->
      <div>
        <label v-text="$t('ServerURL')" />
        <VFormText
          v-model="LoginForm.server"
          size="medium"
          name="Server"
          v-validate="'required'"
          placeholder="Server URL"
        />
      </div>
      <!-- E-Mail Address -->
      <div class="mt-4">
        <label v-text="$t('EMailAddress')" />
        <VFormText
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
        </label>
        <VFormText
          v-model="LoginForm.master_password"
          size="medium"
          type="password"
          name="Master Password"
          placeholder="Master Password"
          v-validate="'required|min:6|max:100'"
        />
      </div>
      <!-- Login Btn -->
      <VButton type="submit" :loading="$wait.is($waiters.Auth.Login)" size="medium">
        {{ $t('Login') }}
      </VButton>
      <!-- Sign Up -->
      <VButton
        type="button"
        size="medium"
        class="login-signup-btn"
        @click="onClickSignUp"
      >
        Sign Up
      </VButton>
    </form>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import HTTPClient from '@/api/HTTPClient'

export default {
  data() {
    return {
      LoginForm: {
        server: localStorage.server || 'https://api.passwall.io',
        email: localStorage.email || '',
        master_password: ''
      }
    }
  },

  methods: {
    ...mapActions(['Login']),

    onClickSignUp() {
      if (window.electronAPI) {
        window.electronAPI.shell.openExternal('https://signup.passwall.io')
      }
    },

    onLogin() {
      this.$validator.validate().then(async (result) => {
        if (!result) return

        HTTPClient.setBaseURL(this.LoginForm.server)

        const onError = (error) => {
          let text = this.$t('Ooops! Something went wrong!')
          if (error.response.status == 401) {
            text = this.$t(error.response.data.message)
          }
          this.$notifyError(text)
        }

        const onSuccess = async () => {
          await this.Login({ ...this.LoginForm })
          this.$router.replace({ name: 'Home' })
        }

        this.$request(onSuccess, this.$waiters.Auth.Login, onError)
      })
    }
  }
}
</script>

<style lang="scss">
.login-container {
  width: 100%;
  height: calc(100% - 56px);
  position: relative;
  display: flex;
  justify-content: space-between;

  .btn,
  .form-text-wrapper {
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
  color: $color-primary;
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
  padding-top: 60px;
  background-color: black;
  z-index: 9;
}

.login-signup-btn {
  margin-top: 12px;
  background-color: $color-gray-400;
  color: #fff;
}

.login-signup-btn:hover {
  background-color: rgba($color-gray-400, 0.85);
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
