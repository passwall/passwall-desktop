<template>
  <div class="notifications" :style="wrapperStyle">
    <div
      v-for="item in notificationState.items"
      :key="item.id"
      class="vue-notification"
      :class="item.type"
    >
      {{ item.text }}
    </div>
  </div>
</template>

<script>
import { notificationState } from '@/plugins/notifications'

export default {
  name: 'notifications',
  props: {
    width: {
      type: Number,
      default: 345
    },
    position: {
      type: String,
      default: 'top center'
    }
  },
  computed: {
    notificationState() {
      return notificationState
    },
    wrapperStyle() {
      const style = { width: `${this.width}px` }
      const [vertical = 'top', horizontal = 'center'] = this.position.split(' ')

      if (vertical === 'bottom') {
        style.bottom = '16px'
        style.top = 'auto'
      }

      if (horizontal === 'left') {
        style.left = '16px'
        style.transform = 'none'
      } else if (horizontal === 'right') {
        style.right = '16px'
        style.left = 'auto'
        style.transform = 'none'
      }

      return style
    }
  }
}
</script>

<style lang="scss">
.notifications {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: $spacer-2;
}
</style>
