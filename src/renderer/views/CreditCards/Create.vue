<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <CompanyLogo :url="form.title" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="$t('New Credit Card')" class="url" />
        <span v-text="$t('Please fill all the necessary fields')" class="email" />
      </div>
    </div>
    <!-- Content -->
    <PerfectScrollbar class="detail-page-content">
      <form class="form" @submit.stop.prevent="onClickSave">
        <!-- Title -->
        <div class="form-row">
          <label v-text="$t('CARD NAME')" />
          <VFormText
            v-model="form.title"
            v-validate="'required'"
            name="Title"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- CardholderName -->
        <div class="form-row">
          <label v-text="$t('CARDHOLDER NAME')" />
          <VFormText
            v-model="form.cardholder_name"
            name="CardholderName"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- Type -->
        <div class="form-row">
          <label v-text="$t('TYPE')" />
          <VFormText
            v-model="form.type"
            name="Type"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- Number -->
        <div class="form-row">
          <label v-text="$t('NUMBER')" />
          <VFormText
            v-model="form.number"
            name="Number"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- ExpiryDate -->
        <div class="form-row">
          <label v-text="$t('EXPIRY DATE')" />
          <VFormText
            v-model="form.expiry_date"
            name="ExpiryDate"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- VerificationNumber -->
        <div class="form-row">
          <label v-text="$t('VERIFICATION NUMBER')" />
          <div class="d-flex">
            <VFormText
              v-model="form.verification_number"
              name="VerificationNumber"
              :type="showPass ? 'text' : 'password'"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />

            <!-- Show/Hide -->
            <button
              class="detail-page-header-icon mt-1 ml-n1"
              v-tooltip="$t(showPass ? 'Hide' : 'Show')"
            >
              <VIcon name="eye-off" v-if="showPass" size="12px" @click="showPass = false" />
              <VIcon name="eye" v-else size="12px" @click="showPass = true" />
            </button>
          </div>
        </div>

        <!-- Save & Cancel -->
        <div class="d-flex m-3">
          <VButton class="flex-1" theme="text" :loading="loading" @click="$router.back()">
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
        title: '',
        cardholder_name: '',
        type: '',
        number: '',
        expiry_date: '',
        verification_number: ''
      }
    }
  },

  computed: {
    loading() {
      return this.$wait.is(this.$waiters.CreditCards.Create)
    }
  },

  methods: {
    ...mapActions('CreditCards', ['Create', 'FetchAll']),

    onClickSave() {
      this.$validator.validate().then(async (result) => {
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
