<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <CompanyLogo :url="form.title" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="form.title" class="url" v-tooltip="form.title" />
      </div>

      <EditButton v-if="!isEditMode" @click="isEditMode = $event" />
      <DeleteButton @click="onClickDelete" />
    </div>
    <!-- Content -->
    <PerfectScrollbar class="detail-page-content">
      <form class="form" @submit.stop.prevent="onClickUpdate">
        <FormRowText v-model="form.title" :title="$t('TITLE')" :edit-mode="isEditMode" />
        <FormRowText v-model="form.first_name" :title="$t('FIRST NAME')" :edit-mode="isEditMode" />
        <FormRowText
          v-model="form.middle_name"
          :title="$t('MIDDLE NAME')"
          :edit-mode="isEditMode"
        />
        <FormRowText v-model="form.last_name" :title="$t('LAST NAME')" :edit-mode="isEditMode" />
        <FormRowText v-model="form.company" :title="$t('COMPANY')" :edit-mode="isEditMode" />
        <FormRowText
          v-model="form.address1"
          :title="$t('ADDRESS LINE 1')"
          :edit-mode="isEditMode"
        />
        <FormRowText
          v-model="form.address2"
          :title="$t('ADDRESS LINE 2')"
          :edit-mode="isEditMode"
        />
        <FormRowText v-model="form.city" :title="$t('CITY')" :edit-mode="isEditMode" />
        <FormRowText v-model="form.state" :title="$t('STATE')" :edit-mode="isEditMode" />
        <FormRowText v-model="form.zip" :title="$t('ZIP')" :edit-mode="isEditMode" />
        <FormRowText v-model="form.country" :title="$t('COUNTRY')" :edit-mode="isEditMode" />
        <FormRowText v-model="form.phone" :title="$t('PHONE')" :edit-mode="isEditMode" />
        <FormRowText v-model="form.email" :title="$t('EMAIL')" :edit-mode="isEditMode" />

        <div class="form-row">
          <div class="d-flex flex-items-end flex-content-between">
            <label v-text="$t('NOTE')" />
            <div class="d-flex flex-items-center">
              <ClipboardButton :copy="form.notes" />
            </div>
          </div>
          <div class="d-flex">
            <VTextArea
              v-model="form.notes"
              :placeholder="$t(isEditMode ? 'ClickToFill' : 'ContentHidden')"
              :disabled="!isEditMode"
              rows="8"
            />
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
import DetailMixin from '@/mixins/detail'
import { ItemType } from '@/store'

export default {
  mixins: [DetailMixin],

  data() {
    return {
      isEditMode: false
    }
  },

  beforeRouteUpdate(to, from, next) {
    this.isEditMode = false
    next()
  },

  methods: {
    onClickDelete() {
      const onSuccess = async () => {
        await this.$store.dispatch('DeleteItem', this.form.id)
        this.$router.push({ name: 'Addresses', params: { openFirst: true } })
      }

      this.$request(onSuccess, this.$waiters.Addresses.Delete)
    },

    async onClickUpdate() {
      const onSuccess = async () => {
        await this.$store.dispatch('UpdateItem', {
          id: this.form.id,
          form: { ...this.form },
          type: ItemType.Address
        })
        this.$router.push({ name: 'Addresses', params: { refresh: true } })
      }

      await this.$request(onSuccess, this.$waiters.Addresses.Update)
      this.isEditMode = false
    }
  },

  computed: {
    ItemList() {
      return this.$store.getters.getItemsByType(ItemType.Address) || []
    },

    loading() {
      return this.$wait.is(this.$waiters.Addresses.Update)
    },

    copyContent() {
      return [
        `Title: ${this.form.title || ''}`,
        `First Name: ${this.form.first_name || ''}`,
        `Middle Name: ${this.form.middle_name || ''}`,
        `Last Name: ${this.form.last_name || ''}`,
        `Company: ${this.form.company || ''}`,
        `Address Line 1: ${this.form.address1 || ''}`,
        `Address Line 2: ${this.form.address2 || ''}`,
        `City: ${this.form.city || ''}`,
        `State: ${this.form.state || ''}`,
        `ZIP: ${this.form.zip || ''}`,
        `Country: ${this.form.country || ''}`,
        `Phone: ${this.form.phone || ''}`,
        `Email: ${this.form.email || ''}`,
        `Notes: ${this.form.notes || ''}`
      ].join('\n')
    }
  }
}
</script>
