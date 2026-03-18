<template>
  <div class="login-container">
    <!-- Left Background -->
    <div>
      <VIcon name="passwall-back" class="login-background" width="450px" height="504px" />
      <VIcon name="right-corner" class="login-right-corner" size="82px" />
    </div>
    <!-- 2FA Form -->
    <form class="login-form" @submit.stop.prevent="onVerify">
      <div class="two-factor-header">
        <h2>{{ $t('TwoFactorAuth') || 'Two-Factor Authentication' }}</h2>
        <p class="two-factor-subtitle">
          {{
            recoveryMode
              ? $t('TwoFactorRecoverySubtitle') ||
                'Enter one of the recovery codes you saved when setting up 2FA.'
              : $t('TwoFactorSubtitle') || 'Enter the 6-digit code from your authenticator app'
          }}
        </p>
      </div>
      <!-- TOTP Code / Recovery Code -->
      <div class="mt-4">
        <label>{{
          recoveryMode
            ? $t('RecoveryCode') || 'Recovery Code'
            : $t('VerificationCode') || 'Verification Code'
        }}</label>
        <VFormText
          v-model="totpCode"
          size="medium"
          :name="recoveryMode ? 'Recovery Code' : 'TOTP Code'"
          :placeholder="recoveryMode ? 'Enter your recovery code' : '000 000'"
          :maxlength="recoveryMode ? 20 : 6"
          v-validate="recoveryMode ? 'required|min:1' : 'required|min:6|max:6'"
        />
      </div>
      <!-- Error Message -->
      <p v-if="errorMessage" class="two-factor-error">{{ errorMessage }}</p>
      <!-- Verify Btn -->
      <div class="mt-5">
        <VButton type="submit" :loading="loading" size="medium">
          {{ $t('Verify') || 'Verify' }}
        </VButton>
      </div>
      <!-- Recovery toggle -->
      <button type="button" class="two-factor-toggle-link" @click="toggleRecoveryMode">
        {{
          recoveryMode
            ? $t('UseAuthenticatorCode') || 'Use authenticator code'
            : $t('UseRecoveryCode') || 'Use a recovery code'
        }}
      </button>
      <!-- Back to Login -->
      <button type="button" class="two-factor-back-link" @click="goBack">
        &larr; {{ $t('BackToLogin') || 'Back to Login' }}
      </button>
    </form>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  data() {
    return {
      totpCode: '',
      loading: false,
      errorMessage: '',
      recoveryMode: false
    }
  },

  beforeMount() {
    if (!this.$store.state.two_factor_required) {
      this.$router.replace({ name: 'Login' })
    }
  },

  methods: {
    ...mapActions(['VerifyTwoFactor']),

    toggleRecoveryMode() {
      this.recoveryMode = !this.recoveryMode
      this.totpCode = ''
      this.errorMessage = ''
    },

    async onVerify() {
      const trimmed = this.totpCode.trim()

      if (this.recoveryMode) {
        if (!trimmed) {
          this.errorMessage = 'Please enter your recovery code'
          return
        }
      } else {
        const valid = await this.$validator.validate()
        if (!valid) return
      }

      this.loading = true
      this.errorMessage = ''

      try {
        await this.VerifyTwoFactor(trimmed)
        this.$router.replace({ name: 'Home' })
      } catch (error) {
        if (error?.type === 'REQUIRE_2FA_SETUP') {
          this.errorMessage = error.message
        } else if (error?.response && error.response.status === 401) {
          this.errorMessage =
            this.$t('InvalidVerificationCode') || 'Invalid verification code. Please try again.'
        } else {
          this.errorMessage = this.$t('Ooops! Something went wrong!')
        }
      } finally {
        this.loading = false
      }
    },

    goBack() {
      this.$store.state.two_factor_required = false
      this.$store.state.two_factor_token = null
      this.$router.replace({ name: 'Login' })
    }
  }
}
</script>

<style lang="scss">
.two-factor-header {
  text-align: center;
  max-width: 350px;

  h2 {
    color: #fff;
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: -0.02em;
  }
}

.two-factor-subtitle {
  color: $color-gray-300;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 8px;
}

.two-factor-error {
  color: $color-danger;
  font-size: 13px;
  margin-top: 12px;
  text-align: center;
  padding: 8px 16px;
  background-color: rgba($color-danger, 0.08);
  border-radius: 6px;
  max-width: 350px;
}

.two-factor-toggle-link {
  margin-top: 16px;
  background: none;
  border: none;
  color: $color-gray-300;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 150ms ease;

  &:hover {
    color: #fff;
  }
}

.two-factor-back-link {
  margin-top: 12px;
  background: none;
  border: none;
  color: $color-gray-300;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  transition: color 150ms ease;

  &:hover {
    color: #fff;
  }
}
</style>
