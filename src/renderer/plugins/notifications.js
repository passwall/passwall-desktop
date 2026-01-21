import { reactive } from 'vue'

const notificationState = reactive({
  items: []
})

let notificationId = 0

function removeNotification(id) {
  const index = notificationState.items.findIndex(item => item.id === id)
  if (index !== -1) {
    notificationState.items.splice(index, 1)
  }
}

function notify({ type = 'info', text = '' } = {}) {
  if (!text) {
    return
  }

  const id = (notificationId += 1)
  notificationState.items.push({ id, type, text })

  setTimeout(() => removeNotification(id), 2500)
}

export { notificationState, notify, removeNotification }
