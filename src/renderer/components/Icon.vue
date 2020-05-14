<template>
  <svg
    :width="width || size"
    :height="height || size"
    :transform="`rotate(${rotation} 0 0)`"
    v-on="$listeners"
    class="icon"
  >
    <use :xlink:href="`#${name}`" />
  </svg>
</template>

<script>
export default {
  name: 'Icon',

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
      default: '24',
    },
  },
};
</script>
