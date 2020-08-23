<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="form.card_name" class="url" />
        <span v-text="form.number" class="email" />
      </div>

      <!-- Copy -->
      <button
        class="detail-page-header-icon"
        v-tooltip="$t('Copy')"
        v-clipboard:copy="creditCardCopyContent"
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
        <!-- CardName -->
        <FormRowText v-model="form.card_name" :title="$t('Card Name')" :edit-mode="isEditMode" />

        <!-- CardholderName -->
        <FormRowText v-model="form.cardholder_name" :title="$t('Cardholder Name')" :edit-mode="isEditMode" />

        <!-- Type -->
        <FormRowText v-model="form.type" :title="$t('Type')" :edit-mode="isEditMode" />

        <!-- Number -->
        <FormRowText v-model="form.number" :title="$t('Number')" :edit-mode="isEditMode" />

        <!-- ExpiryDate -->
        <FormRowText v-model="form.expiry_date" :title="$t('Expiry Date')" :edit-mode="isEditMode" />

        <!-- VerificationNumber -->
        <div class="form-row">
          <label v-text="$t('Verification Number')" />
          <div class="d-flex">
            <VFormText
              v-if="isEditMode"
              :type="showPass ? 'text' : 'password'"
              v-model="form.verification_number"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            <!-- Text -->
            <div v-else class="d-flex flex-items-center px-3 py-2">
              <span v-text="showPass ? form.verification_number : '●●●●●●'" class="mr-2" />
            </div>
            <!-- Copy -->
            <ClipboardButton :copy="form.verification_number" class="mt-2" />
            <!-- Generate -->
            <GeneratePassword
              v-if="isEditMode"
              class="mt-2 mx-2"
              v-model="form.verification_number"
            />
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
    ...mapActions('CreditCards', ['Get', 'Delete', 'Update']),

    getDetail(id) {
      const onSuccess = async () => {
        await this.Get(id)
        this.form = { ...this.Detail }
      }

      const onError = () => {
        this.$router.back()
      }

      this.$request(onSuccess, this.$waiters.CreditCards.Get, onError)
    },

   onClickDelete() {
      const onSuccess = async () => {
        await this.Delete(this.form.id)
        const index = this.ItemList.findIndex(item => item.id == this.form.id)
        if (index !== -1) {
          this.ItemList.splice(index, 1)
        }
        this.$router.push({ name: 'CreditCards', params: { refresh: true } })
      }

      this.$request(onSuccess, this.$waiters.CreditCards.Delete)
    },

    async onClickUpdate() {
      const onSuccess = async () => {
        await this.Update({ ...this.form })
        this.$router.push({ name: 'CreditCards', params: { refresh: true } })
      }

      await this.$request(onSuccess, this.$waiters.CreditCards.Update)
      this.isEditMode = false
    }
  },

  computed: {
    ...mapState('CreditCards', ['Detail', 'ItemList']),

    loading() {
      return this.$wait.is(this.$waiters.CreditCards.Update)
    },

    creditCardCopyContent() {
      return (
        `Card Name: ${this.form.card_name}\n` +
        `Cardholder Name: ${this.form.cardholder_name}\n` +
        `Type: ${this.form.type}\n` +
        `Number: ${this.form.number}`
      )
    }
  }
}
</script>
