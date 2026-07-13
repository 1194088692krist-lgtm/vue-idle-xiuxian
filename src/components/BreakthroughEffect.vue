<template>
  <Transition name="breakthrough">
    <div v-if="visible" class="breakthrough-overlay">
      <div class="breakthrough-container">
        <div class="particles">
          <div v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></div>
        </div>
        <div class="light-rays">
          <div v-for="i in 8" :key="i" class="ray" :style="getRayStyle(i)"></div>
        </div>
        <div class="center-glow"></div>
        <div class="text-container">
          <div class="title">突破成功！</div>
          <div class="realm-name" :style="{ color: realmColor }">{{ realmName }}</div>
          <div class="subtitle">恭喜道友踏入新境界</div>
        </div>
        <div class="aura-rings">
          <div class="ring ring-1"></div>
          <div class="ring ring-2"></div>
          <div class="ring ring-3"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
  import { ref, watch, onUnmounted } from 'vue'

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    realmName: {
      type: String,
      default: ''
    },
    realmColor: {
      type: String,
      default: '#DAA520'
    }
  })

  const emit = defineEmits(['complete'])

  const getParticleStyle = (index) => {
    const angle = (index / 20) * 360
    const delay = (index * 0.1) % 1
    const distance = 150 + Math.random() * 100
    const size = 4 + Math.random() * 8
    return {
      '--angle': `${angle}deg`,
      '--distance': `${distance}px`,
      '--delay': `${delay}s`,
      '--size': `${size}px`,
      '--color': ['#DAA520', '#FFD700', '#FFA500', '#8B4513'][Math.floor(Math.random() * 4)]
    }
  }

  const getRayStyle = (index) => {
    const angle = (index / 8) * 360
    return {
      '--angle': `${angle}deg`,
      '--delay': `${(index * 0.15) % 1}s`
    }
  }

  let completeTimer = null
  watch(() => props.visible, (newVal) => {
    if (newVal) {
      completeTimer = setTimeout(() => {
        completeTimer = null
        emit('complete')
      }, 3000)
    }
  })

  onUnmounted(() => {
    if (completeTimer) {
      clearTimeout(completeTimer)
      completeTimer = null
    }
  })
</script>

<style scoped>
  .breakthrough-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    pointer-events: none;
  }

  .breakthrough-container {
    position: relative;
    width: 400px;
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .center-glow {
    position: absolute;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(218, 165, 32, 0.8) 0%, rgba(139, 69, 19, 0.4) 50%, transparent 70%);
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
  }

  .light-rays {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .ray {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 150px;
    background: linear-gradient(to top, rgba(218, 165, 32, 0), rgba(218, 165, 32, 0.8));
    transform-origin: bottom center;
    transform: translate(-50%, -100%) rotate(var(--angle));
    animation: rayPulse 1.5s ease-in-out infinite;
    animation-delay: var(--delay);
  }

  @keyframes rayPulse {
    0%, 100% {
      opacity: 0;
      height: 100px;
    }
    50% {
      opacity: 1;
      height: 200px;
    }
  }

  .particles {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .particle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--size);
    height: var(--size);
    background: var(--color);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: particleBurst 2s ease-out infinite;
    animation-delay: var(--delay);
  }

  @keyframes particleBurst {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(
        calc(-50% + cos(var(--angle)) * var(--distance)),
        calc(-50% + sin(var(--angle)) * var(--distance))
      ) scale(0);
      opacity: 0;
    }
  }

  .aura-rings {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .ring {
    position: absolute;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    border: 2px solid rgba(218, 165, 32, 0.5);
    transform: translate(-50%, -50%);
    animation: ringExpand 2s ease-out infinite;
  }

  .ring-1 {
    width: 100px;
    height: 100px;
    animation-delay: 0s;
  }

  .ring-2 {
    width: 150px;
    height: 150px;
    animation-delay: 0.5s;
  }

  .ring-3 {
    width: 200px;
    height: 200px;
    animation-delay: 1s;
  }

  @keyframes ringExpand {
    0% {
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.5);
      opacity: 0;
    }
  }

  .text-container {
    position: relative;
    z-index: 10;
    text-align: center;
    animation: textReveal 0.8s ease-out forwards;
    opacity: 0;
  }

  @keyframes textReveal {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .title {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 36px;
    color: #DAA520;
    text-shadow: 0 0 20px rgba(218, 165, 32, 0.8);
    margin-bottom: 12px;
    animation: titleGlow 1.5s ease-in-out infinite;
  }

  @keyframes titleGlow {
    0%, 100% {
      text-shadow: 0 0 20px rgba(218, 165, 32, 0.8);
    }
    50% {
      text-shadow: 0 0 40px rgba(218, 165, 32, 1);
    }
  }

  .realm-name {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 48px;
    font-weight: bold;
    margin-bottom: 8px;
    text-shadow: 0 0 30px currentColor;
    animation: realmGlow 2s ease-in-out infinite;
  }

  @keyframes realmGlow {
    0%, 100% {
      text-shadow: 0 0 30px currentColor;
    }
    50% {
      text-shadow: 0 0 60px currentColor;
    }
  }

  .subtitle {
    font-family: 'Noto Serif SC', serif;
    font-size: 16px;
    color: #8B8B8B;
  }

  .breakthrough-enter-active {
    animation: fadeIn 0.3s ease-out;
  }

  .breakthrough-leave-active {
    animation: fadeOut 0.5s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
</style>
