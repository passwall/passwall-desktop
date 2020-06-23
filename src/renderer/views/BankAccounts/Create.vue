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
    <div class="detail-page-content">
      <div class="form">

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
            v-validate=""
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
            v-validate=""
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
            v-validate=""
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
            v-validate=""
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
            v-validate=""
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
              v-validate=""
              name="Password"
              :type="showPass ? 'text' : 'password'"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            
            <!-- Show/Hide -->
            <button
              class="detail-page-header-icon mt-2 ml-n1"
              style="width: 20px; height: 20px;"
              v-tooltip="$t(showPass ? 'HidePassword' : 'ShowPassword')"
            >
              <EyeOffIcon v-if="showPass" size="12" @click="showPass = false" />
              <EyeIcon v-else size="12" @click="showPass = true" />
            </button>
          </div>
        </div>
      
        <!-- Save -->
        <VButton type="submit" class="mt-auto mb-5 mx-3" @click="onClickSave">
          {{ $t('Save') }}
        </VButton>
      </div>
    </div>
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
    // ...mapState(['']), // bu şekilde root state değerlein alabilirsin this.transmission_key olarak kullanaiblirsin
    // ...mapState('CreditCards', ['Detail']) // bu şekilde de sadece logins için alırsın abi bu iki satır kullanılmıyor burda kaldırabilirsin
  },

  methods: {
    ...mapActions('BankAccounts', ['Create', 'FetchAll']),

    onClickSave() {
      this.$validator.validate().then(async result => {
        if (!result) return
        try {
          await this.Create({ ...this.form })
          this.FetchAll()
          this.$router.push({ name: 'BankAccounts', params: { refresh: true } })
        } catch (error) {
          console.log(error)
        }
      })
    }
  }
}
</script>

<style lang="scss">
.detail-page {
  width: 100%;
  height: 100vh;
  border-left: 1px solid black;
  background-color: $color-gray-600;

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    border-bottom: 1px solid black;
    padding: 0 $spacer-5;

    &-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background-color: $color-gray-400;
    }

    &-summary {
      color: #fff;
      margin: 0 auto 0 $spacer-3;
      display: flex;
      flex-direction: column;

      .url {
        font-weight: bold;
        font-size: 12px;
        line-height: 16px;
      }

      .email {
        font-weight: normal;
        font-size: 10px;
        line-height: 16px;
      }
    }

    &-icon {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background-color: $color-gray-500;
      margin-left: $spacer-3;
      color: $color-gray-300;
    }
  }
}
</style>
