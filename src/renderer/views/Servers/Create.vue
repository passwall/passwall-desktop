<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="$t('New Server')" class="url" />
        <span v-text="$t('Please fill all the necessary fields')" class="email" />
      </div>
    </div>
    <!-- Content -->
    <div class="detail-page-content">
      <div class="form">
        <!-- Title -->
        <div class="form-row">
          <label v-text="$t('Title')" />
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
          <label v-text="$t('IP Address')" />
          <VFormText
            v-model="form.ip"
            v-validate=""
            name="IP"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>
        <!-- Username -->
        <div class="form-row">
          <label v-text="$t('Username')" />
          <VFormText
            v-model="form.username"
            v-validate=""
            name="Username"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- Password -->
        <div class="form-row">
          <label v-text="$t('Password')" />
          <div class="d-flex">
            <VFormText
              v-model="form.password"
              v-validate=""
              name="Password"
              :type="showPass ? 'text' : 'password'"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            <!-- Generate -->
            <GeneratePassword class="mt-2 mr-3" v-model="form.password" />
            <!-- Show/Hide -->
            <button
              class="detail-page-header-icon mt-2 ml-n1"
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
            v-model="form.url"
            v-validate=""
            name="URL"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- HostingUsername -->
        <div class="form-row">
          <label v-text="$t('Hosting Username')" />
          <VFormText
            v-model="form.hosting_username"
            v-validate=""
            name="HostingUsername"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

        <!-- HostingPassword -->
        <div class="form-row">
          <label v-text="$t('Hosting Password')" />
          <div class="d-flex">
            <VFormText
              v-model="form.hosting_password"
              v-validate=""
              name="HostingPassword"
              :type="showPass ? 'text' : 'password'"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            <!-- Generate -->
            <GeneratePassword class="mt-2 mr-3" v-model="form.hosting_password" />
            <!-- Show/Hide -->
            <button
              class="detail-page-header-icon mt-2 ml-n1"
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
            v-model="form.admin_username"
            v-validate=""
            name="AdminUsername"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>

         <!-- AdminPassword -->
        <div class="form-row">
          <label v-text="$t('Admin Password')" />
          <div class="d-flex">
            <VFormText
              v-model="form.admin_password"
              v-validate=""
              name="AdminPassword"
              :type="showPass ? 'text' : 'password'"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            <!-- Generate -->
            <GeneratePassword class="mt-2 mr-3" v-model="form.admin_password" />
            <!-- Show/Hide -->
            <button
              class="detail-page-header-icon mt-2 ml-n1"
              style="width: 20px; height: 20px;"
              v-tooltip="$t(showPass ? 'HidePassword' : 'ShowPassword')"
            >
              <VIcon name="eye-off" v-if="showPass" size="12" @click="showPass = false" />
              <VIcon name="eye" v-else size="12" @click="showPass = true" />
            </button>
          </div>
        </div>

        <!-- Save -->
        <VButton type="submit" class="mt-3 mb-5 mx-3" @click="onClickSave">
          {{ $t('Save') }}
        </VButton>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'

export default {
  data() {
    return {
      showPass: false,
      form: {
        title: '',
        ip: '',
        username: '',
        password: '',
        url: '',
        hosting_username: '',
        hosting_password: '',
        admin_username: '',
        admin_password: ''
      }
    }
  },

  methods: {
    ...mapActions('Servers', ['Create', 'FetchAll']),

    onClickSave() {
      this.$validator.validate().then(async result => {
        if (!result) return
        try {
          await this.Create({ ...this.form })
          this.FetchAll()
          this.$router.push({ name: 'Servers', params: { refresh: true } })
        } catch (error) {
          console.log(error)
        }
      })
    }
  }
}
</script>

<style lang="scss">
.detail-page {
  width: 100%;
  height: 100vh;
  border-left: 1px solid black;
  background-color: $color-gray-600;

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    border-bottom: 1px solid black;
    padding: 0 $spacer-5;

    &-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background-color: $color-gray-400;
    }

    &-summary {
      color: #fff;
      margin: 0 auto 0 $spacer-3;
      display: flex;
      flex-direction: column;

      .url {
        font-weight: bold;
        font-size: 12px;
        line-height: 16px;
      }

      .email {
        font-weight: normal;
        font-size: 10px;
        line-height: 16px;
      }
    }

    &-icon {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background-color: $color-gray-500;
      margin-left: $spacer-3;
      color: $color-gray-300;
    }
  }
}
</style>
