const defaultTheme = {
  name: '默认主题',
  version: '1.0.0',
  colors: {
    primary: '#DAA520',
    primaryLight: '#FFD700',
    primaryDark: '#8B4513',
    bgMain: '#0D0D12',
    bgCard: 'rgba(20, 25, 30, 0.8)',
    textMain: '#F5DEB3',
    textSecondary: '#8B8B8B',
    accentGold: '#FFD700',
    accentPurple: '#9932CC',
    accentBlue: '#1E90FF',
    accentGreen: '#32CD32',
    accentRed: '#FF6347'
  },
  fonts: {
    heading: "'Ma Shan Zheng', cursive",
    body: "'Noto Sans SC', sans-serif"
  },
  startScreen: {
    background: {
      type: 'gradient',
      gradient: ['#0D0D12', '#1A1A2E', '#2D1B4E'],
      image: '',
      particleEffect: 'stars'
    },
    logo: {
      image: '',
      title: '修仙问道',
      subtitle: 'Idle Cultivation',
      version: 'v1.0.5'
    },
    buttons: {
      newGame: {
        icon: '🌱',
        text: '新的开始',
        style: 'primary'
      },
      loadGame: {
        icon: '📂',
        text: '读取存档',
        style: 'secondary'
      }
    },
    footerText: '心诚则灵 · 大道可期'
  },
  cultivationScreen: {
    background: {
      type: 'gradient',
      gradient: ['#0D0D12', '#1A1A2E'],
      image: '',
      particleEffect: 'qi'
    },
    character: {
      image: '',
      position: 'center',
      animation: 'meditate'
    },
    progressBar: {
      style: 'jade',
      glowColor: '#FFD700'
    },
    buttons: {
      cultivate: {
        icon: 'ArrowUpOutlined',
        text: '打坐修炼',
        style: 'primary'
      },
      autoCultivate: {
        iconPlay: 'PlayCircleOutlined',
        iconPause: 'PauseCircleOutlined',
        textStart: '开始自动修炼',
        textStop: '停止自动修炼',
        style: 'success'
      },
      breakthrough: {
        icon: 'AimOutlined',
        text: '一键突破',
        style: 'info'
      }
    },
    stats: {
      showDetails: true,
      showLog: true
    }
  },
  audio: {
    bgm: {
      startScreen: '',
      cultivation: '',
      exploration: '',
      battle: ''
    },
    sfx: {
      click: '',
      cultivate: '',
      breakthrough: '',
      levelUp: '',
      gacha: '',
      error: ''
    },
    volume: {
      bgm: 0.5,
      sfx: 0.7
    }
  },
  effects: {
    breakthrough: {
      type: 'lightning',
      duration: 3000,
      color: '#FFD700'
    },
    cultivation: {
      particleCount: 20,
      particleColor: '#FFD700',
      speed: 2
    }
  }
}

let currentTheme = { ...defaultTheme }

const loadTheme = () => {
  try {
    const saved = localStorage.getItem('game_theme')
    if (saved) {
      currentTheme = JSON.parse(saved)
    }
  } catch (e) {
    console.error('加载主题失败:', e)
  }
  applyTheme(currentTheme)
  return currentTheme
}

const saveTheme = (theme) => {
  currentTheme = { ...theme }
  localStorage.setItem('game_theme', JSON.stringify(currentTheme))
  applyTheme(currentTheme)
}

const applyTheme = (theme) => {
  const root = document.documentElement
  const { colors } = theme
  root.style.setProperty('--color-primary', colors.primary)
  root.style.setProperty('--color-primary-light', colors.primaryLight)
  root.style.setProperty('--color-primary-dark', colors.primaryDark)
  root.style.setProperty('--color-bg-main', colors.bgMain)
  root.style.setProperty('--color-bg-card', colors.bgCard)
  root.style.setProperty('--color-text-main', colors.textMain)
  root.style.setProperty('--color-text-secondary', colors.textSecondary)
  root.style.setProperty('--color-accent-gold', colors.accentGold)
  root.style.setProperty('--color-accent-purple', colors.accentPurple)
  root.style.setProperty('--color-accent-blue', colors.accentBlue)
  root.style.setProperty('--color-accent-green', colors.accentGreen)
  root.style.setProperty('--color-accent-red', colors.accentRed)
}

const importTheme = (themeData) => {
  try {
    const parsed = typeof themeData === 'string' ? JSON.parse(themeData) : themeData
    const merged = deepMerge(defaultTheme, parsed)
    saveTheme(merged)
    return { success: true, theme: merged }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

const deepMerge = (target, source) => {
  const result = { ...target }
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

const getAssetUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('data:') || path.startsWith('http') || path.startsWith('/')) {
    return path
  }
  const savedAssets = localStorage.getItem('gm_assets')
  if (savedAssets) {
    try {
      const assets = JSON.parse(savedAssets)
      const asset = assets.find(a => a.name === path || a.name.endsWith(path))
      if (asset) return asset.url
    } catch (e) {}
  }
  return path
}

const exportTheme = () => {
  return JSON.stringify(currentTheme, null, 2)
}

const resetTheme = () => {
  saveTheme({ ...defaultTheme })
  return { ...defaultTheme }
}

const getCurrentTheme = () => ({ ...currentTheme })

export {
  defaultTheme,
  loadTheme,
  saveTheme,
  applyTheme,
  importTheme,
  exportTheme,
  resetTheme,
  getCurrentTheme,
  getAssetUrl
}
