<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <CompanyLogo :url="form.title" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="$t('New Address')" class="url" />
        <span v-text="$t('Please fill all the necessary fields')" class="email" />
      </div>
    </div>
    <!-- Content -->
    <PerfectScrollbar class="detail-page-content">
      <form class="form" @submit.stop.prevent="onClickSave">
        <div class="form-row">
          <label v-text="$t('TITLE')" />
          <VFormText
            v-model="form.title"
            v-validate="'required'"
            name="Title"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <div class="form-row">
          <label v-text="$t('FIRST NAME')" />
          <VFormText v-model="form.first_name" :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>

        <div class="form-row">
          <label v-text="$t('MIDDLE NAME')" />
          <VFormText
            v-model="form.middle_name"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <div class="form-row">
          <label v-text="$t('LAST NAME')" />
          <VFormText v-model="form.last_name" :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>

        <div class="form-row">
          <label v-text="$t('COMPANY')" />
          <VFormText v-model="form.company" :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>

        <div class="form-row">
          <label v-text="$t('ADDRESS LINE 1')" />
          <VFormText v-model="form.address1" :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>

        <div class="form-row">
          <label v-text="$t('ADDRESS LINE 2')" />
          <VFormText v-model="form.address2" :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>

        <div class="form-row">
          <label v-text="$t('CITY')" />
          <VFormText v-model="form.city" :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>

        <div class="form-row">
          <label v-text="$t('STATE')" />
          <VFormText v-model="form.state" :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>

        <div class="form-row">
          <label v-text="$t('ZIP')" />
          <VFormText v-model="form.zip" :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>

        <div class="form-row">
          <label v-text="$t('COUNTRY')" />
          <VFormText v-model="form.country" :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>

        <div class="form-row">
          <label v-text="$t('PHONE')" />
          <VFormText v-model="form.phone" :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>

        <div class="form-row">
          <label v-text="$t('EMAIL')" />
          <VFormText v-model="form.email" :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>

        <div class="form-row">
          <div class="d-flex flex-items-end flex-content-between">
            <label v-text="$t('NOTE')" />
            <div class="d-flex flex-items-center">
              <ClipboardButton :copy="form.notes" />
            </div>
          </div>
          <div class="d-flex">
            <VTextArea v-model="form.notes" :placeholder="$t('ClickToFill')" />
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
import { ItemType } from '@/store'

export default {
  data() {
    return {
      form: {
        title: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        company: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: '',
        email: '',
        notes: '',
        attachments: []
      }
    }
  },

  computed: {
    loading() {
      return this.$wait.is(this.$waiters.Addresses.Create)
    }
  },

  methods: {
    onClickSave() {
      this.$validator.validate().then(async (result) => {
        if (!result) return

        const onSuccess = async () => {
          await this.$store.dispatch('CreateItem', {
            type: ItemType.Address,
            form: { ...this.form }
          })
          this.$router.push({ name: 'Addresses', params: { refresh: true } })
        }

        this.$request(onSuccess, this.$waiters.Addresses.Create)
      })
    }
  }
}
</script>
