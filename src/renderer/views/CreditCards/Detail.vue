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
        <VIcon name="duplicate" size="14" />
      </button>
      <!-- Delete -->
      <button class="detail-page-header-icon" v-tooltip="$t('Delete')" @click="onClickDelete">
        <VIcon name="trash" size="14" />
      </button>
    </div>
    <!-- Content -->
    <div class="detail-page-content">
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
        <!-- CardName -->
        <div class="form-row">
          <label v-text="$t('Card Name')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.card_name"
            theme="no-border"
            :placeholder="$t('ClickToFill')"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.card_name" class="mr-2" />
            <ClipboardButton :copy="form.card_name" />
          </div>
        </div>

        <!-- CardholderName -->
        <div class="form-row">
          <label v-text="$t('Cardholder Name')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.cardholder_name"
            theme="no-border"
            :placeholder="$t('ClickToFill')"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.cardholder_name" class="mr-2" />
            <ClipboardButton :copy="form.cardholder_name" />
          </div>
        </div>

        <!-- Type -->
        <div class="form-row">
          <label v-text="$t('Type')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.type"
            theme="no-border"
            :placeholder="$t('ClickToFill')"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.type" class="mr-2" />
            <ClipboardButton :copy="form.type" />
          </div>
        </div>

        <!-- Number -->
        <div class="form-row">
          <label v-text="$t('Number')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.number"
            theme="no-border"
            :placeholder="$t('ClickToFill')"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.number" class="mr-2" />
            <ClipboardButton :copy="form.number" />
          </div>
        </div>

        <!-- ExpiryDate -->
        <div class="form-row">
          <label v-text="$t('Expiry Date')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.expiry_date"
            theme="no-border"
            :placeholder="$t('ClickToFill')"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.expiry_date" class="mr-2" />
            <ClipboardButton :copy="form.expiry_date" />
          </div>
        </div>

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
            <!-- Show/Hide Pass -->
            <button
              type="button"
              class="detail-page-header-icon mt-2 ml-2"
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
          v-if="isEditMode"
          type="submit"
          :loading="$wait.is($waiters.CreditCards.Update)"
          class="mt-4 mb-5 mx-3"
        >
          {{ $t('Save') }}
        </VButton>
      </form>
    </div>
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
