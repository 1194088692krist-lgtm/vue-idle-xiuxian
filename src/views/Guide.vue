<template>
  <div class="guide-page fade-in-up">
    <!-- 顶部可折叠目录：默认仅一条窄条，展开为浮层，不占用正文空间 -->
    <div class="guide-topbar">
      <button class="toc-toggle" :class="{ active: tocOpen }" @click="tocOpen = !tocOpen">
        <span class="toc-toggle-icon">📖</span>
        <span>攻略目录</span>
        <span class="toc-caret" :class="{ open: tocOpen }">▾</span>
      </button>
      <transition name="toc-fade">
        <div v-if="tocOpen" class="toc-dropdown glass-card">
          <a
            v-for="(t, i) in toc"
            :key="i"
            class="toc-link"
            :class="'lvl-' + t.level"
            @click="scrollTo(t.id); tocOpen = false"
          >{{ t.text }}</a>
        </div>
      </transition>
    </div>
    <article class="guide-body" ref="bodyRef" v-html="guideHtml"></article>
  </div>
</template>

<script setup>
  import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
  import { guideHtml } from '../plugins/guideContent'

  const bodyRef = ref(null)
  const toc = ref([])
  const tocOpen = ref(false)

  function buildToc() {
    const el = bodyRef.value
    if (!el) return
    const heads = el.querySelectorAll('h1, h2, h3')
    const list = []
    heads.forEach((h, i) => {
      if (!h.id) h.id = 'sec-' + i
      list.push({ id: h.id, text: h.textContent.trim(), level: Number(h.tagName[1]) })
    })
    toc.value = list
  }

  function scrollTo(id) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  onMounted(async () => {
    await nextTick()
    buildToc()
  })

  onBeforeUnmount(() => {
    toc.value = []
  })
</script>

<style scoped>
  .guide-page {
    padding: 12px;
    min-height: 100%;
    box-sizing: border-box;
  }

  /* 顶部目录条 */
  .guide-topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    margin-bottom: 10px;
  }
  .toc-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 10px;
    cursor: pointer;
    background: linear-gradient(135deg, rgba(140, 120, 255, 0.25), rgba(20, 16, 38, 0.7));
    border: 1px solid rgba(140, 120, 255, 0.35);
    color: #e8e0ff;
    font-size: 14px;
    font-weight: bold;
    transition: all 0.25s ease;
  }
  .toc-toggle:hover { border-color: #8c78ff; }
  .toc-toggle.active { box-shadow: 0 0 18px rgba(140, 120, 255, 0.5); }
  .toc-toggle-icon { font-size: 16px; }
  .toc-caret { transition: transform 0.25s ease; font-size: 12px; }
  .toc-caret.open { transform: rotate(180deg); }

  /* 展开浮层（覆盖式，不挤压正文） */
  .toc-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 280px;
    max-height: 62vh;
    overflow-y: auto;
    padding: 10px;
    border-radius: 12px;
    background: linear-gradient(160deg, rgba(20, 16, 38, 0.96), rgba(10, 12, 28, 0.96));
    border: 1px solid rgba(140, 120, 255, 0.3);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  }
  .toc-link {
    display: block;
    padding: 6px 8px;
    font-size: 12.5px;
    color: #aab2c8;
    border-radius: 6px;
    cursor: pointer;
    border-left: 2px solid transparent;
    transition: all 0.2s ease;
    word-break: break-all;
  }
  .toc-link:hover {
    color: #fff;
    background: rgba(140, 120, 255, 0.14);
    border-left-color: #8c78ff;
  }
  .toc-link.lvl-1 { font-weight: bold; color: #e8e0ff; font-size: 13px; }
  .toc-link.lvl-3 { font-size: 11px; padding-left: 18px; color: #8b93a8; }
  .toc-fade-enter-active, .toc-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
  .toc-fade-enter-from, .toc-fade-leave-to { opacity: 0; transform: translateY(-6px); }

  /* 正文 */
  .guide-body {
    max-height: calc(100vh - 130px);
    overflow-y: auto;
    padding: 22px 26px 48px;
    color: #d7dcea;
    font-size: 14px;
    line-height: 1.85;
    border-radius: 12px;
    background: linear-gradient(160deg, rgba(20, 16, 38, 0.92), rgba(10, 12, 28, 0.92));
    border: 1px solid rgba(140, 120, 255, 0.18);
    font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
    scroll-behavior: smooth;
  }
  .guide-body :deep(h1) {
    font-size: 26px;
    text-align: center;
    margin: 4px 0 18px;
    padding-bottom: 14px;
    color: #FFD700;
    text-shadow: 0 0 18px rgba(255, 215, 0, 0.35);
    border-bottom: 1px solid rgba(255, 215, 0, 0.25);
  }
  .guide-body :deep(h2) {
    font-size: 20px;
    margin: 30px 0 12px;
    padding-left: 12px;
    color: #9fe0ff;
    border-left: 4px solid #4488ff;
    scroll-margin-top: 16px;
  }
  .guide-body :deep(h3) {
    font-size: 16px;
    margin: 20px 0 8px;
    color: #c9b8ff;
    scroll-margin-top: 16px;
  }
  .guide-body :deep(h4) {
    font-size: 14px;
    margin: 14px 0 6px;
    color: #ffd1f0;
  }
  .guide-body :deep(p) { margin: 8px 0; }
  .guide-body :deep(a) { color: #7db4ff; text-decoration: none; border-bottom: 1px dashed rgba(125, 180, 255, 0.5); }
  .guide-body :deep(a):hover { color: #fff; }
  .guide-body :deep(strong) { color: #FFD700; font-weight: bold; }
  .guide-body :deep(blockquote) {
    margin: 12px 0;
    padding: 10px 16px;
    color: #b9c4d6;
    background: rgba(140, 120, 255, 0.08);
    border-left: 3px solid #8c78ff;
    border-radius: 0 8px 8px 0;
    font-style: italic;
  }
  .guide-body :deep(ul),
  .guide-body :deep(ol) { padding-left: 24px; margin: 8px 0; }
  .guide-body :deep(li) { margin: 4px 0; }
  .guide-body :deep(hr) { border: none; border-top: 1px solid rgba(255, 255, 255, 0.12); margin: 22px 0; }
  .guide-body :deep(code) {
    font-family: Consolas, Menlo, monospace;
    font-size: 12.5px;
    padding: 2px 6px;
    color: #ffd9a0;
    background: rgba(255, 176, 64, 0.12);
    border-radius: 4px;
  }
  .guide-body :deep(pre) {
    margin: 12px 0;
    padding: 14px 16px;
    overflow-x: auto;
    background: rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
  .guide-body :deep(pre code) {
    padding: 0;
    background: none;
    color: #c8e6c9;
    font-size: 12.5px;
    line-height: 1.6;
  }
  .guide-body :deep(table) {
    width: 100%;
    margin: 14px 0;
    border-collapse: collapse;
    font-size: 12.5px;
    overflow: hidden;
    border-radius: 8px;
  }
  .guide-body :deep(th),
  .guide-body :deep(td) {
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    text-align: left;
  }
  .guide-body :deep(th) {
    background: rgba(140, 120, 255, 0.22);
    color: #fff;
    font-weight: bold;
  }
  .guide-body :deep(tr:nth-child(even) td) { background: rgba(255, 255, 255, 0.04); }

  @media (max-width: 720px) {
    .toc-dropdown { width: 240px; }
    .guide-body { max-height: calc(100vh - 120px); padding: 16px; }
  }
</style>
