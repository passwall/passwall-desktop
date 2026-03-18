<template>
  <div class="login-container">
    <!-- Left Background -->
    <div>
      <VIcon name="passwall-back" class="login-background" width="450px" height="504px" />
      <VIcon name="right-corner" class="login-right-corner" size="82px" />
    </div>
    <!-- Login Form -->
    <form class="login-form" @submit.stop.prevent="onLogin">
      <!-- E-Mail Address -->
      <div>
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
        <div class="login-password-input">
          <VFormText
            v-model="LoginForm.master_password"
            size="medium"
            :type="showMasterPassword ? 'text' : 'password'"
            name="Master Password"
            placeholder="Master Password"
            v-validate="'required|min:6|max:100'"
          />
          <button
            type="button"
            class="login-password-toggle"
            :title="$t(showMasterPassword ? 'Hide' : 'Show')"
            @click="showMasterPassword = !showMasterPassword"
          >
            <VIcon :name="showMasterPassword ? 'eye-off' : 'eye'" size="16px" />
          </button>
        </div>
      </div>
      <p v-if="loginError" class="login-error" v-text="loginError" />
      <!-- Login Btn -->
      <VButton type="submit" :loading="$wait.is($waiters.Auth.Login)" size="medium">
        {{ $t('Login') }}
      </VButton>
      <!-- Sign Up -->
      <VButton
        type="button"
        size="medium"
        theme="text"
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

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3625' : 'https://api.passwall.io'

export default {
  data() {
    return {
      LoginForm: {
        email: localStorage.email || '',
        master_password: ''
      },
      loginError: '',
      showMasterPassword: false
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
      this.loginError = ''
      this.showMasterPassword = false
      const email = String(this.LoginForm.email || '').trim()
      const masterPassword = String(this.LoginForm.master_password || '')
      const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

      if (!email || !masterPassword || !isEmailValid || masterPassword.length < 6) {
        const text = this.$t('Please fill all the necessary fields')
        this.loginError = text
        this.$notifyError(text)
        return
      }

      this.$validator.validate().then(async (result) => {
        if (!result) {
          const text = this.$t('Please fill all the necessary fields')
          this.loginError = text
          this.$notifyError(text)
          return
        }

        HTTPClient.setBaseURL(API_BASE_URL)

        const onError = (error) => {
          let text = this.$t('Ooops! Something went wrong!')
          if (error?.type === 'REQUIRE_2FA_SETUP') {
            text = error.message
          } else if (error?.response?.status == 401) {
            text = this.$t('InvalidLoginCredentials')
          }
          this.loginError = text
          this.$notifyError(text)
        }

        const onSuccess = async () => {
          const result = await this.Login({
            ...this.LoginForm,
            server: API_BASE_URL,
            email,
            master_password: masterPassword
          })
          if (result && result.two_factor_required) {
            this.$router.replace({ name: 'TwoFactor' })
            return
          }
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
  height: 100%;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;

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
  justify-content: center;
  padding: 0;
  background-color: black;
  z-index: 9;
}

.login-signup-btn {
  margin-top: 12px;
  background-color: transparent;
  border: 1px solid rgba(#fff, 0.12);
  color: rgba(#fff, 0.8);
  transition: all 200ms ease;
}

.login-signup-btn:hover {
  border-color: rgba(#fff, 0.25);
  color: #fff;
  background-color: rgba(#fff, 0.04);
}

.login-error {
  width: 350px;
  margin: -8px 0 12px;
  padding: 8px 10px;
  border: 1px solid rgba($color-danger, 0.35);
  background-color: rgba($color-danger, 0.08);
  color: #ffb4b4;
  border-radius: 8px;
  font-size: 12px;
  line-height: 16px;
}

.login-password-input {
  position: relative;

  .form-text {
    padding-right: 52px;
  }
}

.login-password-toggle {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  color: $color-gray-300;
  background-color: rgba(#fff, 0.02);
  transition: all 150ms ease;

  &:hover {
    color: $color-secondary;
    background-color: rgba($color-secondary, 0.1);
  }
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
