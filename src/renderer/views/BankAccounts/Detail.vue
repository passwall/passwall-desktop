<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="form.bank_name" class="url" />
        <span v-text="form.account_name" class="email" />
      </div>

      <!-- Copy -->
      <button
        v-tooltip="$t('Copy')"
        class="detail-page-header-icon"
        v-clipboard:copy="bankAccountCopyContent"
      >
        <VIcon name="duplicate" size="14" />
      </button>
      <!-- Delete -->
      <button class="detail-page-header-icon" v-tooltip="$t('Delete')" @click="onClickDelete">
        <VIcon name="trash" size="14" />
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
        <VIcon name="pencil" size="14" />
      </button>

      <form class="form" @submit.stop.prevent="onClickUpdate">
        <!-- BankName -->
        <FormRowText v-model="form.bank_name" :title="$t('Bank Name')" :edit-mode="isEditMode" />

        <!-- BankCode -->
        <FormRowText v-model="form.bank_code" :title="$t('Bank Code')" :edit-mode="isEditMode" />

        <!-- AccountName -->
        <FormRowText v-model="form.account_name" :title="$t('Account Name')" :edit-mode="isEditMode" />

        <!-- AccountNumber -->
        <FormRowText v-model="form.account_number" :title="$t('Account Number')" :edit-mode="isEditMode" />

        <!-- IBAN -->
        <FormRowText v-model="form.iban" :title="$t('IBAN')" :edit-mode="isEditMode" />

        <!-- Currency -->
        <FormRowText v-model="form.currency" :title="$t('Currency')" :edit-mode="isEditMode" />

        <!-- Password -->
        <div class="form-row">
          <label v-text="$t('Password')" />
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
            <ClipboardButton :copy="form.password" class="mt-2" />
            <!-- Generate -->
            <GeneratePassword v-if="isEditMode" class="mt-2 mx-2" v-model="form.password" />
            <!-- Show/Hide Pass -->
            <button
              type="button"
              class="detail-page-header-icon mt-1 ml-2"
              v-tooltip="$t(showPass ? 'Hide' : 'Show')"
            >
              <VIcon name="eye-off" v-if="showPass" size="12" @click="showPass = false" />
              <VIcon name="eye" v-else size="12" @click="showPass = true" />
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

export default {
  data() {
    return {
      isEditMode: false,
      showPass: false,
      form: {}
    }
  },

  beforeRouteUpdate(to, from, next) {
    this.isEditMode = false
    this.showPass = false
    this.getDetail(to.params.id)
    next()
  },

  created() {
    this.getDetail(this.$route.params.id)
  },

  methods: {
    ...mapActions('BankAccounts', ['Get', 'Delete', 'Update']),

    getDetail(id) {
      const onSuccess = async () => {
        await this.Get(id)
        this.form = { ...this.Detail }
      }

      const onError = () => {
        this.$router.back()
      }

      this.$request(onSuccess, this.$waiters.BankAccounts.Get, onError)
    },

    onClickDelete() {
      const onSuccess = async () => {
        await this.Delete(this.form.id)
        const index = this.ItemList.findIndex(item => item.id == this.form.id)
        if (index !== -1) {
          this.ItemList.splice(index, 1)
        }
        this.$router.push({ name: 'BankAccounts', params: { refresh: true } })
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
      return (
        `Bank Name: ${this.form.bank_name}\n` +
        `Bank Code: ${this.form.bank_code}\n` +
        `Account Name: ${this.form.account_name}\n` +
        `Account Number: ${this.form.account_number}\n` +
        `IBAN: ${this.form.iban}\nCurrency: ${this.form.currency}\n`
      )
    }
  }
}
</script>
