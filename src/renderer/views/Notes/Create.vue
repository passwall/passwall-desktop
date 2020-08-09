<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="$t('New Private Note')" class="url" />
        <span v-text="$t('Please fill all the necessary fields')" class="email" />
      </div>
    </div>
    <!-- Content -->
    <div class="detail-page-content">
      <form class="form" @submit.stop.prevent="onClickSave">
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
        <!-- Note -->
        <div class="form-row">
          <div class="d-flex flex-content-between">
            <label v-text="$t('Private Note')" />
            <!-- Show/Hide -->
            <button
              class="detail-page-header-icon mt-1 ml-n1"
              v-tooltip="$t(showPass ? 'Hide' : 'Show')"
            >
              <VIcon name="eye-off" v-if="showPass" size="12" @click="showPass = false" />
              <VIcon name="eye" v-else size="12" @click="showPass = true" />
            </button>
          </div>
          <VTextArea
            :placeholder="$t('ClickToFill')"
            v-model="form.note"
            v-validate="'required'"
            name="Note"
          />
        </div>

        <!-- Save -->
        <VButton type="submit" class="mt-3 mb-5 mx-3" :loading="$wait.is($waiters.Notes.Create)">{{
          $t('Save')
        }}</VButton>
      </form>
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
        note: ''
      }
    }
  },

  methods: {
    ...mapActions('Notes', ['Create', 'FetchAll']),

    onClickSave() {
      this.$validator.validate().then(async result => {
        if (!result) return

        const onSuccess = async () => {
          await this.Create({ ...this.form })
          this.FetchAll()
          this.$router.push({ name: 'Notes', params: { refresh: true } })
        }

        this.$request(onSuccess, this.$waiters.Notes.Create)
      })
    }
  }
}
</script>
