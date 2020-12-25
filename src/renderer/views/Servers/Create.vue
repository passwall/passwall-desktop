<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <CompanyLogo :url="form.title" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="$t('New Server')" class="url" />
        <span v-text="$t('Please fill all the necessary fields')" class="email" />
      </div>
    </div>
    <!-- Content -->
    <PerfectScrollbar class="detail-page-content">
      <form class="form" @submit.stop.prevent="onClickSave">
        <!-- Title -->
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
        <!-- IP -->
        <div class="form-row">
          <label v-text="$t('IP ADDRESS')" />
          <VFormText
            v-model="form.ip"
            name="IP"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>
        <!-- Username -->
        <div class="form-row">
          <label v-text="$t('USERNAME')" />
          <VFormText
            v-model="form.username"
            name="Username"
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
            <!-- Copy -->
            <ClipboardButton :copy="form.password" />
            <!-- Generate -->
            <GeneratePassword class="mx-1" v-model="form.password" />
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
            v-model="form.url"
            name="URL"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- HostingUsername -->
        <div class="form-row">
          <label v-text="$t('HOSTING USERNAME')" />
          <VFormText
            v-model="form.hosting_username"
            name="HostingUsername"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- HostingPassword -->
        <div class="form-row">
          <label v-text="$t('HOSTING PASSWORD')" />
          <div class="d-flex">
            <VFormText
              v-model="form.hosting_password"
              name="HostingPassword"
              :type="showHostingPass ? 'text' : 'password'"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            <!-- Generate -->
            <GeneratePassword class="mx-1" v-model="form.hosting_password" />
            <!-- Show/Hide -->
            <button
              type="button"
              @click="showHostingPass = !showHostingPass"
              class="detail-page-header-icon ml-2"
              v-tooltip="$t(showHostingPass ? 'Hide' : 'Show')"
            >
              <VIcon :name="showHostingPass ? 'eye-off' : 'eye'" size="12px" />
            </button>
          </div>
        </div>

        <!-- AdminUsername -->
        <div class="form-row">
          <label v-text="$t('ADMIN USERNAME')" />
          <VFormText
            v-model="form.admin_username"
            name="AdminUsername"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- AdminPassword -->
        <div class="form-row">
          <label v-text="$t('ADMIN PASSWORD')" />
          <div class="d-flex">
            <VFormText
              v-model="form.admin_password"
              name="AdminPassword"
              :type="showAdminPass ? 'text' : 'password'"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            <!-- Copy -->
            <ClipboardButton :copy="form.admin_password" />
            <!-- Generate -->
            <GeneratePassword class="mx-1" v-model="form.admin_password" />
            <!-- Show/Hide -->
            <button
              type="button"
              @click="showAdminPass = !showAdminPass"
              class="detail-page-header-icon ml-2"
              v-tooltip="$t(showAdminPass ? 'Hide' : 'Show')"
            >
              <VIcon :name="showAdminPass ? 'eye-off' : 'eye'" size="12px" />
            </button>
          </div>
        </div>

        <!-- Extra -->
        <div class="form-row">
          <div class="d-flex flex-content-between">
            <label v-text="$t('EXTRA')" />
            <!-- Show/Hide -->
            <button
              class="detail-page-header-icon mt-2 ml-n1"
              v-tooltip="$t(showExtra ? 'Hide' : 'Show')"
            >
              <VIcon name="eye-off" v-if="showExtra" size="12px" @click="showExtra = false" />
              <VIcon name="eye" v-else size="12px" @click="showExtra = true" />
            </button>
          </div>
          <VTextArea :placeholder="$t('ClickToFill')" v-model="form.extra" name="Extra" />
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
      showAdminPass: false,
      showHostingPass: false,
      showExtra: false,
      form: {
        title: '',
        ip: '',
        username: '',
        password: '',
        url: '',
        hosting_username: '',
        hosting_password: '',
        admin_username: '',
        admin_password: '',
        extra: ''
      }
    }
  },

  computed: {
    loading() {
      return this.$wait.is(this.$waiters.Servers.Create)
    },
  },

  methods: {
    ...mapActions('Servers', ['Create', 'FetchAll']),

    onClickSave() {
      this.$validator.validate().then(async result => {
        if (!result) return

        const onSuccess = async () => {
          await this.Create({ ...this.form })
          this.FetchAll()
          this.$router.push({ name: 'Servers', params: { refresh: true } })
        }

        this.$request(onSuccess, this.$waiters.Servers.Create)
      })
    }
  }
}
</script>
