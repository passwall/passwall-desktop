<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <CompanyLogo :url="form.title" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="form.title" class="url" />
        <!-- <span v-text="form.username" class="email" /> -->
      </div>

      <EditButton v-if="!isEditMode" @click="isEditMode = $event" />
      <ClipboardButton :copy="copyContent" />
      <DeleteButton @click="onClickDelete" />
    </div>
    <!-- Content -->
    <PerfectScrollbar class="detail-page-content">

      <form class="form" @submit.stop.prevent="onClickUpdate">
        <!-- Title -->
        <FormRowText v-model="form.title" :title="$t('TITLE')" :edit-mode="isEditMode" />

        <!-- Note -->
        <div class="form-row">
          <div class="d-flex flex-items-end flex-content-between">
            <label v-text="$t('PRIVATE NOTE')" />
            <div class="d-flex flex-items-center">
              <ClipboardButton :copy="form.note" />
              <ShowPassButton @click="showNote = $event" />
            </div>
          </div>
          <div class="d-flex">
            <VTextArea
              v-model="form.note"
              :sensitive="!showNote"
              :placeholder="$t(isEditMode ? 'ClickToFill' : 'ContentHidden')"
              :disabled="!isEditMode || !showNote"
              rows="16"
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
import DetailMixin from '@/mixins/detail'

export default {
  mixins: [DetailMixin],

  data() {
    return {
      isEditMode: false,
      showPass: false,
      showNote: false
    }
  },

  beforeRouteUpdate(to, from, next) {
    this.isEditMode = false
    this.showNote = false
    next()
  },

  methods: {
    ...mapActions('Notes', ['Delete', 'Update']),

    onClickDelete() {
      const onSuccess = async () => {
        await this.Delete(this.form.id)
        const index = this.ItemList.findIndex(item => item.id == this.form.id)
        if (index !== -1) {
          this.ItemList.splice(index, 1)
        }
        this.$router.push({ name: 'Notes', params: { openFirst: true } })
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

    copyContent() {
      return [`Title: ${this.form.title}`, `Note: ${this.form.note}`].join('\n')
    }
  }
}
</script>
