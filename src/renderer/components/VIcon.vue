<template>
  <svg
    :width="width || size"
    :height="height || size"
    :transform="`rotate(${rotation} 0 0)`"
    v-bind="$attrs"
    class="v-icon"
  >
    <use :href="`#${name}`" />
  </svg>
</template>

<script>
export default {
  name: 'VIcon',
  inheritAttrs: false,

  props: {
    name: String,
    width: [String, Number],
    height: [String, Number],
    rotation: {
      type: [String, Number],
      default: '0',
    },
    size: {
      type: [String, Number],
      default: '24px',
    },
  },
};
</script>
