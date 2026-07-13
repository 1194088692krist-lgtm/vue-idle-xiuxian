<template>
  <div class="exploration-page fade-in-up">
    <ZoneSelector />
    <div class="log-section">
      <div class="log-header">
        <h3 class="section-title gold-gradient-text">探索日志</h3>
        <button class="btn btn-small btn-danger" @click="clearLogPanel">清空日志</button>
      </div>
      <log-panel ref="logRef" />
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import ZoneSelector from '../components/ZoneSelector.vue'
  import LogPanel from '../components/LogPanel.vue'

  const logRef = ref(null)

  const clearLogPanel = () => {
    logRef.value?.clearLogs()
  }

  onMounted(() => {})

  onUnmounted(() => {})
</script>

<style scoped>
  .exploration-page {
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 100%;
  }

  .log-section {
    margin-top: auto;
  }

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 0 16px;
  }

  .section-title {
    margin: 0;
    font-size: 18px;
    color: #fff;
    font-family: 'Ma Shan Zheng', cursive;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 10px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
  }

  .btn-danger {
    background: rgba(220, 53, 69, 0.3);
    color: #DC3545;
    border: 1px solid rgba(220, 53, 69, 0.3);
  }

  .btn-small {
    padding: 6px 12px;
    font-size: 12px;
  }
</style>
