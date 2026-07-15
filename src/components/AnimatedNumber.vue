<template>
  <span class="animated-number" :class="{ 'highlight': highlight }">
    {{ displayValue }}
  </span>
</template>

<script setup>
  import { ref, watch, onMounted, onUnmounted } from 'vue'

  const props = defineProps({
    value: {
      type: Number,
      required: true
    },
    duration: {
      type: Number,
      default: 500
    },
    highlight: {
      type: Boolean,
      default: false
    },
    format: {
      type: Function,
      default: (num) => {
        const n = Number(num) || 0
        if (n >= 100000000) {
          return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
        }
        return Math.floor(n).toLocaleString()
      }
    }
  })

  const displayValue = ref(0)
  let rafId = null

  const animateValue = (start, end, duration) => {
    if (rafId) cancelAnimationFrame(rafId)
    const startTime = performance.now()
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      displayValue.value = props.format(Math.floor(start + (end - start) * easeOutQuart))
      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      } else {
        rafId = null
      }
    }
    rafId = requestAnimationFrame(animate)
  }

  watch(() => props.value, (newVal, oldVal) => {
    animateValue(oldVal || 0, newVal, props.duration)
  })

  onMounted(() => {
    animateValue(0, props.value, props.duration)
  })

  onUnmounted(() => {
    if (rafId) cancelAnimationFrame(rafId)
  })
</script>

<style scoped>
  .animated-number {
    font-family: 'Noto Serif SC', serif;
    font-weight: bold;
    transition: color 0.3s ease;
  }

  .animated-number.highlight {
    color: #DAA520;
    text-shadow: 0 0 10px rgba(218, 165, 32, 0.5);
  }
</style>
