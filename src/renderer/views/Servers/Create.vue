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
            <GeneratePassword v-model="form.password" />
            <CheckPassword :password="form.password" />
            <ShowPassButton @click="showPass = $event" />
            <ClipboardButton :copy="form.password" />
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
            <GeneratePassword v-model="form.hosting_password" />
            <CheckPassword :password="form.hosting_password" />
            <ShowPassButton @click="showHostingPass = $event" />
            <ClipboardButton :copy="form.hosting_password" />
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
            <GeneratePassword v-model="form.admin_password" />
            <CheckPassword :password="form.admin_password" />
            <ShowPassButton @click="showAdminPass = $event" />
            <ClipboardButton :copy="form.admin_password" />
          </div>
        </div>

        <!-- Extra -->
        <div class="form-row">
          <div class="d-flex flex-items-end flex-content-between">
            <label v-text="$t('EXTRA')" />
            <div class="d-flex flex-items-center">
              <ClipboardButton :copy="form.extra" />
              <ShowPassButton @click="showExtra = $event" />
            </div>
          </div>
          <div class="d-flex">
            <VTextArea 
              v-model="form.extra" 
              :sensitive="!showExtra"
              :placeholder="$t('ClickToFill')" 
              :disabled="!showExtra"
              name="Extra"
            />
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
