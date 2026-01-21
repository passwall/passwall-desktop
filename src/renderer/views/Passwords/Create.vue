<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <CompanyLogo :url="form.url" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="$t('New Password')" class="url" />
        <span v-text="$t('Please fill all the necessary fields')" class="email" />
      </div>
    </div>
    <!-- Content -->
    <PerfectScrollbar class="detail-page-content">
      <form class="form" @submit.stop.prevent="onClickSave">
        <!-- Title -->
        <div class="form-row">
          <label v-text="$t('NAME')" />
          <VFormText
            name="Name"
            theme="no-border"
            v-model="form.name"
            v-validate="'required'"
            :placeholder="$t('ClickToFill')"
          />
        </div>
        <!-- URL -->
        <div class="form-row">
          <label v-text="$t('URL')" />
          <VFormText
            v-model="form.url"
            name="URL"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>
        <!-- Folder -->
        <div class="form-row">
          <label v-text="$t('Folder')" />
          <select v-model="form.folder_id" class="pw-select" :disabled="foldersLoading">
            <option value=""> {{ $t('No folder') }} </option>
            <option v-for="folder in folders" :key="folder.id" :value="String(folder.id)">
              {{ folder.name }}
            </option>
          </select>
        </div>
        <!-- Username -->
        <div class="form-row">
          <label v-text="$t('USERNAME')" />
          <VFormText
            name="Username"
            v-model="form.username"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>
        <!-- Password -->
        <div class="form-row">
          <label v-text="$t('PASSWORD')" />
          <div class="d-flex">
            <VFormText
              name="Password"
              v-model="form.password"
              v-validate="'required'"
              :type="showPass ? 'text' : 'password'"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />

            <GeneratePassword v-model="form.password" />
            <CheckPassword :password="form.password" />
            <ShowPassButton @click="showPass = $event" />
            <ClipboardButton :copy="form.password" />
          </div>
        </div>

        <!-- Authenticator Key (TOTP) -->
        <div class="form-row">
          <label v-text="$t('TOTP Secret')" />
          <VFormText
            v-model="form.totp_secret"
            name="TOTP Secret"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
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
              name="Notes"
            />
          </div>
        </div>

        <!-- Password Settings -->
        <div class="form-row">
          <label v-text="$t('Password Settings')" />
          <div class="password-settings">
            <label class="password-setting">
              <input type="checkbox" v-model="form.auto_fill" />
              <span>{{ $t('Auto Fill') }}</span>
            </label>
            <label class="password-setting">
              <input type="checkbox" v-model="form.auto_login" />
              <span>{{ $t('Auto Login') }}</span>
            </label>
            <label class="password-setting">
              <input type="checkbox" v-model="form.reprompt" />
              <span>{{ $t('Require Master Password') }}</span>
            </label>
            <label class="password-setting">
              <input type="checkbox" v-model="form.is_favorite" />
              <span>{{ $t('Favorite') }}</span>
            </label>
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
import { mapActions, mapState } from 'vuex'

export default {
  data() {
    return {
      showPass: false,
      form: {
        name: '',
        url: '',
        folder_id: '',
        username: '',
        password: '',
        notes: '',
        totp_secret: '',
        auto_fill: true,
        auto_login: false,
        reprompt: false,
        is_favorite: false
      },
      folders: [],
      foldersLoading: false
    }
  },

  created() {
    this.fetchFolders()
  },

  computed: {
    loading() {
      return this.$wait.is(this.$waiters.Passwords.Create)
    }
  },

  methods: {
    ...mapActions('Passwords', ['Create', 'FetchAll']),

    async fetchFolders() {
      if (this.foldersLoading) return
      this.foldersLoading = true
      try {
        const { data } = await (await import('@/api/services/Folders')).default.FetchAll()
        this.folders = data?.folders || []
      } catch (_error) {
        this.folders = []
      } finally {
        this.foldersLoading = false
      }
    },

    onClickSave() {
      this.$validator.validate().then(async result => {
        if (!result) return

        const onSuccess = async () => {
          const folderId = this.form.folder_id ? Number(this.form.folder_id) : null
          const { data } = await this.Create({ ...this.form, folder_id: folderId })
          this.FetchAll()
          const createdId = data?.item?.id || data?.id || data?.item_id
          if (createdId) {
            this.$router.push({ name: 'PasswordDetail', params: { id: createdId } })
            return
          }
          this.$router.push({ name: 'Passwords', params: { refresh: true } })
        }

        this.$request(onSuccess, this.$waiters.Passwords.Create)
      })
    }
  }
}
</script>
