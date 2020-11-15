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
        <FormRowText v-model="form.title" :title="$t('TITLE')" :edit-mode="isEditMode" />

        <!-- Note -->
        <div class="form-row">
          <div class="d-flex flex-items-end flex-content-between">
            <label v-text="$t('PRIVATE NOTE')" />
            <div class="d-flex flex-items-center">
              <!-- Copy -->
              <ClipboardButton :copy="form.note" />
              <!-- Show/Hide -->
              <button
                type="button"
                @click="showNote = !showNote"
                class="detail-page-header-icon ml-2"
                v-tooltip="$t(showNote ? 'Hide' : 'Show')"
              >
                <VIcon :name="showNote ? 'eye-off' : 'eye'" size="12px" />
              </button>
            </div>
          </div>
          <div class="d-flex">
            <VTextArea
              v-model="form.note"
              :sensitive="!isEditMode && !showNote"
              :placeholder="$t(isEditMode ? 'ClickToFill' : 'ContentHidden')"
              :disabled="!isEditMode"
              rows="17"
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
      showNote: false,
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
    ...mapActions('Notes', ['Get', 'Delete', 'Update']),

    getDetail(id) {
      const onSuccess = async () => {
        await this.Get(id)
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

    loading() {
      return this.$wait.is(this.$waiters.Notes.Update)
    },

    noteCopyContent() {
      return [`Title: ${this.form.title}`, `Note: ${this.form.note}`].join('\n')
    }
  }
}
</script>
