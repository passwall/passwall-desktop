<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="$t('NewLogin')" class="url" />
        <span v-text="$t('Please fill all the necessary fields')" class="email" />
      </div>
    </div>
    <!-- Content -->
    <div class="detail-page-content">
      <div class="form">
        <!-- URL -->
        <div class="form-row">
          <label v-text="$t('URL')" />
          <VFormText v-model="form.url" :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>
        <!-- Username -->
        <div class="form-row">
          <label v-text="$t('Username')" />
          <VFormText v-model="form.username" :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>
        <!-- Password -->
        <div class="form-row">
          <label v-text="$t('Password')" />
          <!-- <VFormPassword :placeholder="$t('ClickToFill')" theme="no-border" /> -->
          <GeneratePassword v-model="form.password" />
        </div>

        <!-- Save -->
        <VButton type="submit" class="mt-auto mb-5 mx-3" @click="onClickSave">
          {{ $t('Save') }}
        </VButton>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        url: '',
        username: '',
        password: ''
      }
    }
  },

  methods: {
    onClickSave() {
      console.log(this.form)
    }
  },

  computed: {
    data() {
      return this.$route.params.data
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
