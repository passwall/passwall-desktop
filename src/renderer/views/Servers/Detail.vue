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

      <!-- Copy -->
      <button
        class="detail-page-header-icon"
        v-tooltip="$t('Copy')"
        v-clipboard:copy="serverCopyContent"
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
        <!-- Title -->
        <FormRowText v-model="form.title" :title="$t('Title')" :edit-mode="isEditMode" />

        <!-- IP -->
        <FormRowText v-model="form.ip" :title="$t('IP Address')" :edit-mode="isEditMode" />

        <!-- Username -->
        <FormRowText v-model="form.username" :title="$t('Username')" :edit-mode="isEditMode" />

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
            <ClipboardButton :copy="form.password" />
            <!-- Generate -->
            <GeneratePassword v-if="isEditMode" class="mx-1" v-model="form.password" />
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

        <!-- Extra -->
        <div class="form-row">
          <div class="d-flex flex-items-end flex-content-between">
            <label v-text="$t('Extra')" />
            <div class="d-flex flex-items-center">
              <!-- Copy -->
              <ClipboardButton :copy="form.extra" />
              <!-- Show/Hide -->
              <button
                type="button"
                @click="showExtra = !showExtra"
                class="detail-page-header-icon ml-2"
                v-tooltip="$t(showExtra ? 'Hide' : 'Show')"
              >
                <VIcon :name="showExtra ? 'eye-off' : 'eye'" size="12px" />
              </button>
            </div>
          </div>
          <div class="d-flex">
            <VTextArea
              v-model="form.extra"
              :sensitive="!isEditMode && !showExtra"
              :placeholder="$t(isEditMode ? 'ClickToFill' : 'ContentHidden')"
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
import { mapState, mapActions } from 'vuex'

export default {
  data() {
    return {
      isEditMode: false,
      showPass: false,
      showExtra: false,
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
    ...mapActions('Servers', ['Get', 'Delete', 'Update']),

    getDetail(id) {
      const onSuccess = async () => {
        await this.Get(id)
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

    loading() {
      return this.$wait.is(this.$waiters.Servers.Update)
    },

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
    },
    
    getTitle(){
      return this.form.title ? this.form.title : this.form.url
    }
  }
}
</script>
