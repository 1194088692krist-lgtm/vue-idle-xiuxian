<template>
  <div class="exploration-page fade-in-up">
    <ZoneSelector />
  </div>
</template>

<script setup>
// 显式组件名，供 App.vue 的 keep-alive include 精确匹配
defineOptions({ name: 'Exploration' })
import ZoneSelector from '../components/ZoneSelector.vue'
</script>

<style scoped>
.exploration-page {
  padding: 0;
  min-height: 100%;
}
</style>
