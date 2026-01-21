<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <CompanyLogo :url="form.url" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="getTitle" class="url" />
        <span v-text="form.username" class="email" />
      </div>

      <EditButton v-if="!isEditMode" @click="isEditMode = $event" />
      <ClipboardButton :copy="copyContent" />
      <DeleteButton @click="onClickDelete" />
    </div>
    <!-- Content -->
    <PerfectScrollbar class="detail-page-content" @scroll="onDetailScroll">

      <form class="form" @submit.stop.prevent="onClickUpdate">
        <!-- Title -->
        <FormRowText v-model="form.name" :title="$t('NAME')" :edit-mode="isEditMode" />

        <!-- URL -->
        <FormRowText v-model="form.url" :title="$t('URL')" :edit-mode="isEditMode" />

        <!-- Folder -->
        <div class="form-row">
          <label v-text="$t('Folder')" />
          <select :value="folderIdValue" class="pw-select" disabled>
            <option value=""> {{ $t('No folder') }} </option>
            <option v-for="folder in folders" :key="folder.id" :value="String(folder.id)">
              {{ folder.name }}
            </option>
          </select>
        </div>

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

        <!-- Authenticator Key (TOTP) -->
        <div class="form-row">
          <label v-text="$t('TOTP Secret')" />
          <div class="d-flex flex-items-center">
            <VFormText
              v-if="isEditMode"
              v-model="form.totp_secret"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            <div v-else class="d-flex px-3 py-2">
              <span v-text="totpInfo.formattedCode || '-'" class="mr-2" />
            </div>
            <ClipboardButton v-if="totpInfo.code" :copy="totpInfo.code" />
            <span class="ml-2 c-gray-300" v-if="totpInfo.code">
              {{ totpInfo.remaining }}s
            </span>
          </div>
        </div>

        <!-- Note -->
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
              :placeholder="$t('ClickToFill')"
              :disabled="!isEditMode"
            />
          </div>
        </div>

        <!-- Password Settings -->
        <div class="form-row">
          <label v-text="$t('Password Settings')" />
          <div class="password-settings">
            <label class="password-setting">
              <input type="checkbox" v-model="form.auto_fill" :disabled="!isEditMode" />
              <span>{{ $t('Auto Fill') }}</span>
            </label>
            <label class="password-setting">
              <input type="checkbox" v-model="form.auto_login" :disabled="!isEditMode" />
              <span>{{ $t('Auto Login') }}</span>
            </label>
            <label class="password-setting">
              <input type="checkbox" v-model="form.reprompt" :disabled="!isEditMode" />
              <span>{{ $t('Require Master Password') }}</span>
            </label>
            <label class="password-setting">
              <input type="checkbox" v-model="form.is_favorite" :disabled="!isEditMode" />
              <span>{{ $t('Favorite') }}</span>
            </label>
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

        <!-- Item ID -->
        <div class="form-row">
          <label v-text="$t('Item ID')" />
          <div class="d-flex px-3 py-2">
            <span v-text="form.id || '-'" class="mr-2" />
          </div>
        </div>
      </form>
    </PerfectScrollbar>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import totpService from '@/utils/totp'
import DetailMixin from '@/mixins/detail'
import FoldersService from '@/api/services/Folders'

export default {
  mixins: [DetailMixin],

  data() {
    return {
      isEditMode: false,
      showPass: false,
      folders: [],
      foldersLoading: false,
      totpInfo: {
        code: '',
        formattedCode: '',
        remaining: 0,
        progress: 0,
        expiring: false,
        isValid: false
      },
      totpInterval: null
    }
  },

  mounted() {
    this.fetchFolders()
    this.refreshTotp()
    this.totpInterval = setInterval(this.refreshTotp, 1000)
  },

  beforeUnmount() {
    if (this.totpInterval) {
      clearInterval(this.totpInterval)
    }
  },

  beforeRouteUpdate(to, from, next) {
    this.isEditMode = false
    this.showPass = false
    next()
  },

  methods: {
    ...mapActions('Passwords', ['Delete', 'Update']),

    async fetchFolders() {
      if (this.foldersLoading) return
      this.foldersLoading = true
      try {
        const { data } = await FoldersService.FetchAll()
        this.folders = data?.folders || []
      } catch (_error) {
        this.folders = []
      } finally {
        this.foldersLoading = false
      }
    },

    refreshTotp() {
      this.totpInfo = totpService.getTotpInfo(this.form?.totp_secret || '')
    },

    onDetailScroll(event) {
      const el = event?.target
    },

    parent() {
      alert('Create')
    },

    onClickDelete() {
      const onSuccess = async () => {
        await this.Delete(this.form.id)
        const index = this.ItemList.findIndex(item => item.id == this.form.id)
        if (index !== -1) {
          this.ItemList.splice(index, 1)
        }
        this.$router.push({ name: 'Passwords', params: { openFirst: true } })
      }

      this.$request(onSuccess, this.$waiters.Passwords.Delete)
    },

    async onClickUpdate() {
      const onSuccess = async () => {
        await this.Update({ ...this.form })
        this.$router.push({ name: 'Passwords', params: { refresh: true } })
      }

      await this.$request(onSuccess, this.$waiters.Passwords.Update)
      this.isEditMode = false
    }
  },

  computed: {
    ...mapState('Passwords', ['Detail', 'ItemList']),

    loading() {
      return this.$wait.is(this.$waiters.Passwords.Update)
    },

    folderIdValue() {
      return this.form?.folder_id !== undefined && this.form?.folder_id !== null
        ? String(this.form.folder_id)
        : ''
    },

    copyContent() {
      return [
        `Name: ${this.form.name}`,
        `Folder ID: ${this.form.folder_id || ''}`,
        `URL: ${this.form.url}`,
        `Username: ${this.form.username}`,
        `Password: ${this.form.password}`,
        `Notes: ${this.form.notes}`,
        `TOTP: ${this.form.totp_secret}`
      ].join('\n')
    },

    getTitle() {
      return this.form.name || this.form.url
    }
  }
}
</script>
