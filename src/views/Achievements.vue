<template>
  <div class="achievements-page">
    <h2>成就页面</h2>
    <p>已完成成就数：{{ completedCount }}</p>
  </div>
</template>

<script setup>
  import { usePlayerStore } from '../stores/player'
  import { computed } from 'vue'

  const playerStore = usePlayerStore()
  const completedCount = computed(() => playerStore.completedAchievements?.length || 0)
</script>

<style scoped>
  .achievements-page {
    padding: 16px;
    color: #fff;
  }
</style>
