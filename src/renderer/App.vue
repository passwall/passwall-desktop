<template>
  <div id="app">
    <router-view />
    <TheIcons />
    <notifications width="345" position="top center" />
  </div>
</template>

<script>
import fs from 'fs'
import { ipcRenderer } from 'electron'
const { dialog } = require('electron').remote

export default {
  created() {
    ipcRenderer.on('export', this.onExport)
    ipcRenderer.on('import', this.onImport)
  },

  methods: {
    onExport() {
      const filePath = dialog.showSaveDialogSync(null)
      if (!filePath) return

      try {
        fs.writeFileSync(filePath, 'filecontent')
      } catch (error) {
        console.log(error)
      }
    },

    onImport() {
      dialog.showOpenDialog({ properties: ['openFile'] }, files => {
        if (files.length === 0) return

        try {
          const fileContent = fs.readFileSync(files[0]).toString()
          // TODO: Parse fileContent (CSV data) to array
          console.log(fileContent)
        } catch (error) {
          console.log(error)
        }
      })
    }
  }
}
</script>

<style lang="scss">
.vue-notification {
  padding: 10px 10px 10px 35px;
  margin-top: 10px;

  font-weight: 600;
  font-size: 14px;
  line-height: 22px;

  color: #ffffff;
  background: #151c27;

  border-radius: 8px;

  &.warn {
    background: #151c27;
    border-left-color: #151c27;
  }

  &.error {
    background: #151c27;
    border-left-color: #151c27;
    background-image: url(../../static/img/error-notify.png);
    background-repeat: no-repeat;
    background-position: 5px center;
  }

  &.success {
    background: #151c27;
    border-left-color: #151c27;
  }
}
</style>
