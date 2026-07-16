<template>
  <div class="home-page fade-in-up">
    <div class="welcome-card glass-card">
      <div class="card-header">
        <div class="header-icon">
          <HomeOutlined />
        </div>
        <div class="header-info">
          <h2 class="card-title gold-gradient-text">凡人修仙</h2>
          <p class="card-subtitle">踏上修仙之路，成就无上仙途</p>
          <p class="version-tag">v{{ GAME_VERSION }} · {{ GAME_VERSION_NAME }}（{{ GAME_VERSION_DATE }}）</p>
        </div>
      </div>
      <div class="card-body">
        <div class="welcome-content">
          <p class="welcome-text">欢迎来到修仙世界，道友！</p>
          <p class="welcome-subtext">在这里，你将踏上一段传奇的修仙之旅。</p>
          <p class="welcome-subtext">修炼功法、炼制丹药、探索秘境、收服灵宠...</p>
          <p class="welcome-subtext">一切皆有可能，只待你亲手开创！</p>
        </div>
        <div class="action-area" v-if="playerStore.isNewPlayer">
          <button class="btn btn-primary" @click="receiveNewPlayerGift">
            <span class="btn-icon"><GiftOutlined /></span>
            <span>领取新手礼包</span>
          </button>
        </div>
        <div class="quick-stats" v-else>
          <div class="stat-row">
            <div class="stat-item">
              <div class="stat-icon-wrapper gold">
                <StarOutlined />
              </div>
              <div class="stat-info">
                <span class="stat-label">当前境界</span>
                <span class="stat-value" :style="{ color: getRealmColor(playerStore.level) }">
                  {{ getRealmName(playerStore.level).name }}
                </span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon-wrapper">
                <DollarOutlined />
              </div>
              <div class="stat-info">
                <span class="stat-label">灵石数量</span>
                <span class="stat-value">{{ formatNumber(playerStore.spiritStones) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon-wrapper">
                <ArrowUpOutlined />
              </div>
              <div class="stat-info">
                <span class="stat-label">灵力值</span>
                <span class="stat-value">{{ formatNumber(playerStore.spirit) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="tips-card glass-card">
      <div class="card-header">
        <div class="header-icon">
          <InfoCircleOutlined />
        </div>
        <div class="header-info">
          <h3 class="card-title gold-gradient-text">修仙提示</h3>
        </div>
      </div>
      <div class="card-body">
        <ul class="tips-list">
          <li><span class="tip-icon">*</span> 点击修炼开始打坐，积累修为</li>
          <li><span class="tip-icon">*</span> 探索秘境获取珍贵资源</li>
          <li><span class="tip-icon">*</span> 炼制丹药提升修炼速度</li>
          <li><span class="tip-icon">*</span> 收服灵宠助你战斗</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { usePlayerStore } from '../stores/player'
  import { GAME_VERSION, GAME_VERSION_NAME, GAME_VERSION_DATE } from '../plugins/version'
  import { useMessage } from 'naive-ui'
  import { useRouter } from 'vue-router'
  import { getRealmName } from '../plugins/realm'
  import { getRealmColor } from '../plugins/realm'
  import {
    HomeOutlined,
    GiftOutlined,
    StarOutlined,
    DollarOutlined,
    ArrowUpOutlined,
    InfoCircleOutlined
  } from '@ant-design/icons-vue'
  import { formatNumber } from '../utils/formatNumber.js'

  const router = useRouter()
  const playerStore = usePlayerStore()
  const message = useMessage()

  const receiveNewPlayerGift = () => {
    playerStore.spiritStones += 20000
    playerStore.isNewPlayer = false
    router.push('/cultivation')
    message.success('获得20000灵石')
    message.success('新手礼包领取成功')
  }
</script>

<style scoped>
  .home-page {
    gap: 12px;
  }

  .welcome-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(139, 69, 19, 0.2);
    margin-bottom: 12px;
  }

  .header-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(139, 69, 19, 0.3), rgba(218, 165, 32, 0.2));
    border-radius: 12px;
    font-size: 22px;
    color: var(--color-accent-gold);
  }

  .header-info {
    flex: 1;
  }

  .card-title {
    margin: 0;
    font-size: 22px;
    font-family: var(--font-family-heading);
  }

  .card-subtitle {
    margin: 4px 0 0;
    color: #888;
    font-size: 13px;
  }

  .card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .welcome-content {
    text-align: center;
  }

  .welcome-text {
    font-size: 18px;
    color: var(--color-accent-gold);
    margin: 0 0 10px;
    font-family: var(--font-family-heading);
  }

  .welcome-subtext {
    font-size: 13px;
    color: #aaa;
    margin: 4px 0;
  }

  .action-area {
    display: flex;
    justify-content: center;
    padding: 10px 0;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 24px;
    border-radius: 10px;
    font-size: 15px;
    font-family: var(--font-family-body);
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    min-height: 48px;
  }

  .btn-primary {
    background: linear-gradient(135deg, #8B4513, #DAA520);
    color: #fff;
    box-shadow: 0 4px 15px rgba(139, 69, 19, 0.4);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(218, 165, 32, 0.5);
  }

  .btn-icon {
    font-size: 18px;
  }

  .quick-stats {
    margin-top: auto;
  }

  .stat-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .stat-icon-wrapper {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(139, 69, 19, 0.3), rgba(139, 69, 19, 0.1));
    border-radius: 8px;
    color: #ccc;
    font-size: 16px;
  }

  .stat-icon-wrapper.gold {
    background: linear-gradient(135deg, rgba(218, 165, 32, 0.3), rgba(218, 165, 32, 0.1));
    color: var(--color-accent-gold);
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-label {
    font-size: 11px;
    color: #888;
  }

  .stat-value {
    font-size: 15px;
    font-weight: bold;
    color: #fff;
  }

  .tips-card {
    margin-top: auto;
    padding: 16px;
  }

  .tips-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tips-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #aaa;
  }

  .tip-icon {
    color: var(--color-accent-gold);
    font-size: 12px;
  }

  @media (min-width: 400px) {
    .stat-row {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }
  }
</style>
