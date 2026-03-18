<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <CompanyLogo :url="form.url" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="getTitle" class="url" v-tooltip="getTitle" />
        <span v-text="form.username" class="email" />
      </div>

      <EditButton v-if="!isEditMode" @click="isEditMode = $event" />
      <DeleteButton @click="onClickDelete" />
    </div>
    <!-- Content -->
    <PerfectScrollbar class="detail-page-content" @scroll="onDetailScroll">
      <form class="form" @submit.stop.prevent="onClickUpdate">
        <!-- Title -->
        <FormRowText v-model="form.name" :title="$t('NAME')" :edit-mode="isEditMode" />

        <!-- URL -->
        <FormRowText v-model="form.url" :title="$t('URL')" :edit-mode="isEditMode" />

        <!-- Username -->
        <FormRowText v-model="form.username" :title="$t('USERNAME')" :edit-mode="isEditMode" />

        <!-- Password -->
        <div class="form-row">
          <label v-text="$t('PASSWORD')" />
          <div class="d-flex flex-items-center">
            <VFormText
              v-if="isEditMode"
              :type="showPass ? 'text' : 'password'"
              :placeholder="$t('ClickToFill')"
              v-model="form.password"
              theme="no-border"
            />
            <!-- Text -->
            <div v-else class="d-flex px-3 py-2">
              <span v-text="showPass ? form.password : '●●●●●●'" class="mr-2" />
            </div>

            <GeneratePassword v-if="isEditMode" v-model="form.password" />
            <CheckPassword :password="form.password" />
            <ShowPassButton @click="showPass = $event" />
            <ClipboardButton :copy="form.password" />
          </div>
        </div>

        <!-- Note -->
        <div class="form-row password-note-row">
          <div class="d-flex flex-items-end flex-content-between">
            <label v-text="$t('NOTE')" />
            <div class="d-flex flex-items-center">
              <ClipboardButton :copy="form.notes" />
            </div>
          </div>
          <div class="d-flex">
            <VTextArea
              v-model="form.notes"
              :placeholder="$t('ClickToFill')"
              :disabled="!isEditMode"
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
    onDetailScroll(event) {
      const el = event?.target
    },

    parent() {
      alert('Create')
    },

    onClickDelete() {
      const onSuccess = async () => {
        await this.$store.dispatch('DeleteItem', this.form.id)
        this.$router.push({ name: 'Passwords', params: { openFirst: true } })
      }

      this.$request(onSuccess, this.$waiters.Passwords.Delete)
    },

    async onClickUpdate() {
      const onSuccess = async () => {
        await this.$store.dispatch('UpdateItem', {
          id: this.form.id,
          form: { ...this.form },
          type: ItemType.Password
        })
        this.$router.push({ name: 'Passwords', params: { refresh: true } })
      }

      await this.$request(onSuccess, this.$waiters.Passwords.Update)
      this.isEditMode = false
    }
  },

  computed: {
    ItemList() {
      return this.$store.getters.getItemsByType(ItemType.Password) || []
    },

    loading() {
      return this.$wait.is(this.$waiters.Passwords.Update)
    },

    copyContent() {
      return [
        `Name: ${this.form.name}`,
        `URL: ${this.form.url}`,
        `Username: ${this.form.username}`,
        `Password: ${this.form.password}`,
        `Notes: ${this.form.notes}`
      ].join('\n')
    },

    getTitle() {
      return this.form.name || this.form.url
    }
  }
}
</script>

<style lang="scss">
.password-note-row {
  .text-area-wrapper {
    padding-top: 4px;
    padding-bottom: 8px;
  }

  .text-area-wrapper textarea {
    min-height: 72px;
    max-height: 88px;
    resize: none;
  }
}
</style>
