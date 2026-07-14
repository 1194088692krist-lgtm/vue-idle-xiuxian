<template>
  <div class="guide-page fade-in-up">
    <div class="guide-shell glass-card">
      <aside class="guide-toc" v-if="toc.length">
        <div class="toc-title">攻略目录</div>
        <a
          v-for="(t, i) in toc"
          :key="i"
          class="toc-link"
          :class="'lvl-' + t.level"
          @click="scrollTo(t.id)"
        >{{ t.text }}</a>
      </aside>
      <article class="guide-body" ref="bodyRef" v-html="guideHtml"></article>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
  import { guideHtml } from '../plugins/guideContent'

  const bodyRef = ref(null)
  const toc = ref([])

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

  .guide-shell {
    display: flex;
    gap: 18px;
    padding: 0;
    overflow: hidden;
    border-radius: 16px;
    background: linear-gradient(160deg, rgba(20, 16, 38, 0.92), rgba(10, 12, 28, 0.92));
    border: 1px solid rgba(140, 120, 255, 0.18);
  }

  /* 侧边目录 */
  .guide-toc {
    flex: 0 0 220px;
    max-height: calc(100vh - 140px);
    overflow-y: auto;
    padding: 18px 14px;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 0, 0, 0.18);
  }
  .toc-title {
    font-size: 13px;
    font-weight: bold;
    letter-spacing: 2px;
    color: #c9b8ff;
    margin-bottom: 12px;
    padding-left: 6px;
  }
  .toc-link {
    display: block;
    padding: 5px 8px;
    margin-bottom: 2px;
    font-size: 12px;
    line-height: 1.4;
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
  .toc-link.lvl-1 { font-weight: bold; color: #e8e0ff; }
  .toc-link.lvl-3 { font-size: 11px; padding-left: 18px; color: #8b93a8; }

  /* 正文 */
  .guide-body {
    flex: 1 1 auto;
    max-height: calc(100vh - 140px);
    overflow-y: auto;
    padding: 26px 32px 48px;
    color: #d7dcea;
    font-size: 14px;
    line-height: 1.85;
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
    .guide-shell { flex-direction: column; }
    .guide-toc { flex-basis: auto; max-height: 160px; border-right: none; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
    .guide-body { max-height: calc(100vh - 320px); padding: 18px; }
  }
</style>
