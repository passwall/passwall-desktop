<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="$t('New Bank Account')" class="url" />
        <span v-text="$t('Please fill all the necessary fields')" class="email" />
      </div>
    </div>
    <!-- Content -->
    <PerfectScrollbar class="detail-page-content">
      <form class="form" @submit.stop.prevent="onClickSave">
        <!-- BankName -->
        <div class="form-row">
          <label v-text="$t('Bank Name')" />
          <VFormText
            v-model="form.bank_name"
            v-validate="'required'"
            name="BankName"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- BankCode -->
        <div class="form-row">
          <label v-text="$t('Bank Code')" />
          <VFormText
            v-model="form.bank_code"
            name="BankCode"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- AccountName -->
        <div class="form-row">
          <label v-text="$t('Account Name')" />
          <VFormText
            v-model="form.account_name"
            name="AccountName"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- AccountNumber -->
        <div class="form-row">
          <label v-text="$t('Account Number')" />
          <VFormText
            v-model="form.account_number"
            name="AccountNumber"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- IBAN -->
        <div class="form-row">
          <label v-text="$t('IBAN')" />
          <VFormText
            v-model="form.iban"
            name="IBAN"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- Currency -->
        <div class="form-row">
          <label v-text="$t('Currency')" />
          <VFormText
            v-model="form.currency"
            name="Currency"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- Password -->
        <div class="form-row">
          <label v-text="$t('Password')" />
          <div class="d-flex">
            <VFormText
              v-model="form.password"
              name="Password"
              :type="showPass ? 'text' : 'password'"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />

            <!-- Show/Hide -->
            <button
              class="detail-page-header-icon mt-1 ml-n1"
              v-tooltip="$t(showPass ? 'Hide' : 'Show')"
            >
              <VIcon name="eye-off" v-if="showPass" size="12" @click="showPass = false" />
              <VIcon name="eye" v-else size="12" @click="showPass = true" />
            </button>
          </div>
        </div>

        <!-- Save & Cancel -->
        <div class="d-flex m-3">
          <VButton class="flex-1" theme="text" :disabled="loading" @click="$router.back()">
            {{ $t('Cancel') }}
          </VButton>
          <VButton class="flex-1" type="submit" :loading="loading">
            {{ $t('Save') }}
          </VButton>
        </div>
      </form>
    </PerfectScrollbar>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'

export default {
  data() {
    return {
      showPass: false,
      form: {
        bank_name: '',
        bank_code: '',
        account_name: '',
        account_number: '',
        iban: '',
        currency: '',
        password: ''
      }
    }
  },

  computed: {
    loading() {
      return this.$wait.is(this.$waiters.BankAccounts.Create)
    },
  },

  methods: {
    ...mapActions('BankAccounts', ['Create', 'FetchAll']),

    onClickSave() {
      this.$validator.validate().then(async result => {
        if (!result) return

        const onSuccess = async () => {
          await this.Create({ ...this.form })
          this.FetchAll()
          this.$router.push({ name: 'BankAccounts', params: { refresh: true } })
        }

        this.$request(onSuccess, this.$waiters.BankAccounts.Create)
      })
    }
  }
}
</script>
