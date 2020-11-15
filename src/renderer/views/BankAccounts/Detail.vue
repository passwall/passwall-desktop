<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <CompanyLogo :url="form.title" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="getTitle" class="url" />
        <span v-text="form.account_name" class="email" />
      </div>

      <!-- Copy -->
      <button
        v-tooltip="$t('Copy')"
        class="detail-page-header-icon"
        v-clipboard:copy="bankAccountCopyContent"
      >
        <VIcon name="duplicate" size="14px" />
      </button>
      <!-- Delete -->
      <button class="detail-page-header-icon" v-tooltip="$t('Delete')" @click="onClickDelete">
        <VIcon name="trash" size="14px" />
      </button>
    </div>
    <!-- Content -->
    <PerfectScrollbar class="detail-page-content">
      <!-- Edit Btn -->
      <button
        v-if="!isEditMode"
        class="detail-page-header-icon edit-btn"
        v-tooltip="$t('Edit')"
        @click="isEditMode = true"
      >
        <VIcon name="pencil" size="14px" />
      </button>

      <form class="form" @submit.stop.prevent="onClickUpdate">
        <!-- BankName -->
        <FormRowText v-model="form.title" :title="$t('BANK NAME')" :edit-mode="isEditMode" />

        <!-- BankCode -->
        <FormRowText v-model="form.bank_code" :title="$t('BANK CODE')" :edit-mode="isEditMode" />

        <!-- AccountName -->
        <FormRowText
          v-model="form.account_name"
          :title="$t('ACCOUNT NAME')"
          :edit-mode="isEditMode"
        />

        <!-- AccountNumber -->
        <FormRowText
          v-model="form.account_number"
          :title="$t('ACCOUNT NUMBER')"
          :edit-mode="isEditMode"
        />

        <!-- IBAN -->
        <FormRowText v-model="form.iban" :title="$t('IBAN')" :edit-mode="isEditMode" />

        <!-- Currency -->
        <FormRowText v-model="form.currency" :title="$t('CURRENCY')" :edit-mode="isEditMode" />

        <!-- Password -->
        <div class="form-row">
          <label v-text="$t('PASSWORD')" />
          <div class="d-flex">
            <VFormText
              v-if="isEditMode"
              :type="showPass ? 'text' : 'password'"
              v-model="form.password"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            <!-- Text -->
            <div v-else class="d-flex flex-items-center px-3 py-2">
              <span v-text="showPass ? form.password : '●●●●●●'" class="mr-2" />
            </div>
            <!-- Copy -->
            <ClipboardButton :copy="form.password" />
            <!-- Show/Hide -->
            <button
              type="button"
              @click="showPass = !showPass"
              class="detail-page-header-icon ml-2"
              v-tooltip="$t(showPass ? 'Hide' : 'Show')"
            >
              <VIcon :name="showPass ? 'eye-off' : 'eye'" size="12px" />
            </button>
          </div>
        </div>

        <!-- Save & Cancel -->
        <div class="d-flex m-3" v-if="isEditMode">
          <VButton class="flex-1" theme="text" :disabled="loading" @click="isEditMode = false">
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
import { mapState, mapActions } from 'vuex'
import DetailMixin from '@/mixins/detail'

export default {
  mixins: [DetailMixin],

  data() {
    return {
      isEditMode: false,
      showPass: false
    }
  },

  beforeRouteUpdate(to, from, next) {
    this.isEditMode = false
    this.showPass = false
    next()
  },

  methods: {
    ...mapActions('BankAccounts', ['Delete', 'Update']),

    onClickDelete() {
      const onSuccess = async () => {
        await this.Delete(this.form.id)
        const index = this.ItemList.findIndex(item => item.id == this.form.id)
        if (index !== -1) {
          this.ItemList.splice(index, 1)
        }
        this.$router.push({ name: 'BankAccounts', params: { openFirst: true } })
      }

      this.$request(onSuccess, this.$waiters.BankAccounts.Delete)
    },

    async onClickUpdate() {
      const onSuccess = async () => {
        await this.Update({ ...this.form })
        this.$router.push({ name: 'BankAccounts', params: { refresh: true } })
      }

      await this.$request(onSuccess, this.$waiters.BankAccounts.Update)
      this.isEditMode = false
    }
  },

  computed: {
    ...mapState('BankAccounts', ['Detail', 'ItemList']),

    loading() {
      return this.$wait.is(this.$waiters.BankAccounts.Update)
    },

    bankAccountCopyContent() {
      return [
        `Bank Name: ${this.form.title}`,
        `Bank Code: ${this.form.bank_code}`,
        `Account Name: ${this.form.account_name}`,
        `Account Number: ${this.form.account_number}`,
        `IBAN: ${this.form.iban}\nCurrency: ${this.form.currency}`
      ].join('\n')
    },

    getTitle() {
      return this.form.title
    }
  }
}
</script>
