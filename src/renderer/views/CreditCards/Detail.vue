<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <CompanyLogo :url="form.title" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="form.title" class="url" />
        <span v-text="form.number" class="email" />
      </div>

      <EditButton v-if="!isEditMode" @click="isEditMode = $event" />
      <ClipboardButton :copy="copyContent" />
      <button class="detail-page-header-icon" v-tooltip="$t('Delete')" @click="onClickDelete">
        <VIcon name="trash" size="14px" />
      </button>
    </div>
    <!-- Content -->
    <PerfectScrollbar class="detail-page-content">

      <form class="form" @submit.stop.prevent="onClickUpdate">
        <!-- CardName -->
        <FormRowText v-model="form.title" :title="$t('CARD NAME')" :edit-mode="isEditMode" />

        <!-- CardholderName -->
        <FormRowText
          v-model="form.cardholder_name"
          :title="$t('CARDHOLDER NAME')"
          :edit-mode="isEditMode"
        />

        <!-- Type -->
        <FormRowText v-model="form.type" :title="$t('TYPE')" :edit-mode="isEditMode" />

        <!-- Number -->
        <FormRowText v-model="form.number" :title="$t('NUMBER')" :edit-mode="isEditMode" />

        <!-- ExpiryDate -->
        <FormRowText
          v-model="form.expiry_date"
          :title="$t('EXPIRY DATE')"
          :edit-mode="isEditMode"
        />

        <!-- VerificationNumber -->
        <div class="form-row">
          <label v-text="$t('VERIFICATION NUMBER')" />
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
            <ClipboardButton :copy="form.verification_number" />
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
      showPass: false,
    }
  },

  beforeRouteUpdate(to, from, next) {
    this.isEditMode = false
    this.showPass = false
    next()
  },

  methods: {
    ...mapActions('CreditCards', ['Delete', 'Update']),

    onClickDelete() {
      const onSuccess = async () => {
        await this.Delete(this.form.id)
        const index = this.ItemList.findIndex(item => item.id == this.form.id)
        if (index !== -1) {
          this.ItemList.splice(index, 1)
        }
        this.$router.push({ name: 'CreditCards', params: { openFirst: true } })
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

    copyContent() {
      return [
        `Card Name: ${this.form.title}`,
        `Cardholder Name: ${this.form.cardholder_name}`,
        `Type: ${this.form.type}`,
        `Number: ${this.form.number}`
      ].join('\n')
    }
  }
}
</script>
