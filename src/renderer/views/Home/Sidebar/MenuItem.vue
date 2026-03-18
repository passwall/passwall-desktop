<template>
  <RouterLink class="sidebar-menu-item" :to="{ name: route || service }">
    <VIcon :name="icon" size="14px" />
    {{ name }}
  </RouterLink>
</template>

<script>
export default {
  name: 'MenuItem',

  props: {
    service: String,
    name: String,
    route: String,
    icon: String
  }
}
</script>
