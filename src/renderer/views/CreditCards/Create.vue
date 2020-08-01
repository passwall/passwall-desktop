<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="$t('New Credit Card')" class="url" />
        <span v-text="$t('Please fill all the necessary fields')" class="email" />
      </div>
    </div>
    <!-- Content -->
    <div class="detail-page-content">
      <form class="form" @submit.stop.prevent="onClickSave">
        <!-- CardName -->
        <div class="form-row">
          <label v-text="$t('Card Name')" />
          <VFormText
            v-model="form.card_name"
            v-validate="'required'"
            name="CardName"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- CardholderName -->
        <div class="form-row">
          <label v-text="$t('Cardholder Name')" />
          <VFormText
            v-model="form.cardholder_name"
            v-validate=""
            name="CardholderName"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- Type -->
        <div class="form-row">
          <label v-text="$t('Type')" />
          <VFormText
            v-model="form.type"
            v-validate=""
            name="Type"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- Number -->
        <div class="form-row">
          <label v-text="$t('Number')" />
          <VFormText
            v-model="form.number"
            v-validate=""
            name="Number"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- ExpiryDate -->
        <div class="form-row">
          <label v-text="$t('Expiry Date')" />
          <VFormText
            v-model="form.expiry_date"
            v-validate=""
            name="ExpiryDate"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- VerificationNumber -->
        <div class="form-row">
          <label v-text="$t('Verification Number')" />
          <div class="d-flex">
            <VFormText
              v-model="form.verification_number"
              v-validate=""
              name="VerificationNumber"
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
              <VIcon name="eye-off" v-if="showPass" size="12" @click="showPass = false" />
              <VIcon name="eye" v-else size="12" @click="showPass = true" />
            </button>
          </div>
        </div>

        <!-- Save -->
        <VButton
          type="submit"
          class="mt-3 mb-5 mx-3"
          :loading="$wait.is($waiters.CreditCards.Create)"
        >
          {{ $t('Save') }}
        </VButton>
      </form>
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
        card_name: '',
        cardholder_name: '',
        type: '',
        number: '',
        expiry_date: '',
        verification_number: ''
      }
    }
  },

  methods: {
    ...mapActions('CreditCards', ['Create', 'FetchAll']),

    onClickSave() {
      this.$validator.validate().then(async result => {
        if (!result) return

        const onSuccess = async () => {
          await this.Create({ ...this.form })
          this.FetchAll()
          this.$router.push({ name: 'CreditCards', params: { refresh: true } })
        }

        this.$request(onSuccess, this.$waiters.CreditCards.Create)
      })
    }
  }
}
</script>
