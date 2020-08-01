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
        <!-- <span v-text="form.username" class="email" /> -->
      </div>

      <!-- Copy -->
      <button
        class="detail-page-header-icon"
        v-tooltip="$t('Copy')"
        v-clipboard:copy="noteCopyContent"
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
        <!-- Note -->
        <div class="form-row">
          <div class="d-flex flex-content-between">
            <label v-text="$t('Private Note')" />
            <!-- Copy -->
            <ClipboardButton :copy="form.note" class="mt-2" />
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
          <div class="d-flex">
            <VTextArea v-if="isEditMode" v-model="form.note" :placeholder="$t('ClickToFill')" />
            <VTextArea
              v-else
              :value="showPass ? form.note : ''"
              :placeholder="$t('contentHidden')"
              disabled
            />
          </div>
        </div>

        <!-- Save -->
        <VButton
          v-if="isEditMode"
          type="submit"
          :loading="$wait.is($waiters.Notes.Update)"
          class="mt-4 mb-5 mx-3"
          >{{ $t('Save') }}</VButton
        >
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
    ...mapActions('Notes', ['Get', 'Delete', 'Update']),

    getDetail() {
      const onSuccess = async () => {
        await this.Get(this.$route.params.id)
        this.form = { ...this.Detail }
      }

      const onError = () => {
        this.$router.back()
      }

      this.$request(onSuccess, this.$waiters.Notes.Get, onError)
    },

    onClickDelete() {
      const onSuccess = async () => {
        await this.Delete(this.form.id)
        const index = this.ItemList.findIndex(item => item.id == this.form.id)
        if (index !== -1) {
          this.ItemList.splice(index, 1)
        }
        this.$router.push({ name: 'Notes', params: { refresh: true } })
      }

      this.$request(onSuccess, this.$waiters.Notes.Delete)
    },

    async onClickUpdate() {
      const onSuccess = async () => {
        await this.Update({ ...this.form })
        this.$router.push({ name: 'Notes', params: { refresh: true } })
      }

      await this.$request(onSuccess, this.$waiters.Notes.Update)
      this.isEditMode = false
    }
  },

  computed: {
    ...mapState('Notes', ['Detail', 'ItemList']),

    noteCopyContent() {
      return `Title: ${this.form.title}\nNote: ${this.form.note}`
    }
  }
}
</script>
