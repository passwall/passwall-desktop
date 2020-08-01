<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="form.title" class="url" />
        <span v-text="form.username" class="email" />
      </div>

      <!-- Copy -->
      <button
        class="detail-page-header-icon"
        v-tooltip="$t('Copy')"
        v-clipboard:copy="serverCopyContent"
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
        <!-- Title -->
        <div class="form-row">
          <label v-text="$t('Title')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.title"
            theme="no-border"
            :placeholder="$t('ClickToFill')"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.title" class="mr-2" />
            <ClipboardButton :copy="form.title" />
          </div>
        </div>
        <!-- IP -->
        <div class="form-row">
          <label v-text="$t('IP Address')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.ip"
            theme="no-border"
            :placeholder="$t('ClickToFill')"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.ip" class="mr-2" />
            <ClipboardButton :copy="form.ip" />
          </div>
        </div>
        <!-- Username -->
        <div class="form-row">
          <label v-text="$t('Username')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.username"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.username" class="mr-2" />
            <ClipboardButton :copy="form.username" />
          </div>
        </div>
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
              class="detail-page-header-icon mt-2 ml-2"
              style="width: 20px; height: 20px;"
              v-tooltip="$t(showPass ? 'HidePassword' : 'ShowPassword')"
            >
              <VIcon name="eye-off" v-if="showPass" size="12" @click="showPass = false" />
              <VIcon name="eye" v-else size="12" @click="showPass = true" />
            </button>
          </div>
        </div>
        <!-- URL -->
        <div class="form-row">
          <label v-text="$t('URL')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.url"
            theme="no-border"
            :placeholder="$t('ClickToFill')"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.url" class="mr-2" />
            <ClipboardButton :copy="form.url" />
          </div>
        </div>
        <!-- HostingUsername -->
        <div class="form-row">
          <label v-text="$t('Hosting Username')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.hosting_username"
            theme="no-border"
            :placeholder="$t('ClickToFill')"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.hosting_username" class="mr-2" />
            <ClipboardButton :copy="form.hosting_username" />
          </div>
        </div>
        <!-- HostingPassword -->
        <div class="form-row">
          <label v-text="$t('Hosting Password')" />
          <div class="d-flex">
            <VFormText
              v-if="isEditMode"
              :type="showPass ? 'text' : 'password'"
              v-model="form.hosting_password"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            <!-- Text -->
            <div v-else class="d-flex flex-items-center px-3 py-2">
              <span v-text="showPass ? form.hosting_password : '●●●●●●'" class="mr-2" />
            </div>
            <!-- Copy -->
            <ClipboardButton :copy="form.hosting_password" class="mt-2" />
            <!-- Generate -->
            <GeneratePassword v-if="isEditMode" class="mt-2 mx-2" v-model="form.hosting_password" />
            <!-- Show/Hide Pass -->
            <button
              class="detail-page-header-icon mt-2 ml-2"
              style="width: 20px; height: 20px;"
              v-tooltip="$t(showPass ? 'HidePassword' : 'ShowPassword')"
            >
              <VIcon name="eye-off" v-if="showPass" size="12" @click="showPass = false" />
              <VIcon name="eye" v-else size="12" @click="showPass = true" />
            </button>
          </div>
        </div>
        <!-- AdminUsername -->
        <div class="form-row">
          <label v-text="$t('Admin Username')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.admin_username"
            theme="no-border"
            :placeholder="$t('ClickToFill')"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.admin_username" class="mr-2" />
            <ClipboardButton :copy="form.admin_username" />
          </div>
        </div>
        <!-- AdminPassword -->
        <div class="form-row">
          <label v-text="$t('Admin Password')" />
          <div class="d-flex">
            <VFormText
              v-if="isEditMode"
              :type="showPass ? 'text' : 'password'"
              v-model="form.admin_password"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            <!-- Text -->
            <div v-else class="d-flex flex-items-center px-3 py-2">
              <span v-text="showPass ? form.admin_password : '●●●●●●'" class="mr-2" />
            </div>
            <!-- Copy -->
            <ClipboardButton :copy="form.admin_password" class="mt-2" />
            <!-- Generate -->
            <GeneratePassword v-if="isEditMode" class="mt-2 mx-2" v-model="form.admin_password" />
            <!-- Show/Hide Pass -->
            <button
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
          :loading="$wait.is($waiters.Servers.Update)"
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
    this.getDetail()
    next()
  },

  created() {
    this.getDetail()
  },

  methods: {
    ...mapActions('Servers', ['Get', 'Delete', 'Update']),

    getDetail() {
      const onSuccess = async () => {
        await this.Get(this.$route.params.id)
        this.form = { ...this.Detail }
      }

      const onError = () => {
        this.$router.back()
      }

      this.$request(onSuccess, this.$waiters.Servers.Get, onError)
    },

    onClickDelete() {
      const onSuccess = async () => {
        await this.Delete(this.form.id)
        const index = this.ItemList.findIndex(item => item.id == this.form.id)
        if (index !== -1) {
          this.ItemList.splice(index, 1)
        }
        this.$router.push({ name: 'Servers', params: { refresh: true } })
      }

      this.$request(onSuccess, this.$waiters.Servers.Delete)
    },

    async onClickUpdate() {
      const onSuccess = async () => {
        await this.Update({ ...this.form })
        this.$router.push({ name: 'Servers', params: { refresh: true } })
      }

      await this.$request(onSuccess, this.$waiters.Servers.Update)
      this.isEditMode = false
    }
  },

  computed: {
    ...mapState('Servers', ['Detail', 'ItemList']),

    serverCopyContent() {
      return (
        `Title: ${this.form.title}\n` +
        `IP: ${this.form.ip}\n` +
        `Username: ${this.form.username}\n` +
        `Password: ${this.form.password}\n` +
        `URL: ${this.form.url}\n` +
        `Hosting Username: ${this.form.hosting_username}\n` +
        `Hosting Password: ${this.form.hosting_password}\n` +
        `Admin Username: ${this.form.admin_username}\n` +
        `Admin Password: ${this.form.admin_password}`
      )
    }
  }
}
</script>
