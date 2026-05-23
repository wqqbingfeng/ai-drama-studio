import { useState, useEffect } from 'react'

export interface VisualTheme {
  id: string
  name: string
  icon: string
  desc: string
  isDark: boolean
  
  // Style class maps
  bgMain: string          // Main app background
  bgHeader: string        // Header bar background
  bgSidebar: string       // Sidebar background
  bgCard: string          // Grid cards background
  bgPanel: string         // Sidebar/Nested panel background
  bgInput: string         // Text inputs and textareas
  borderColor: string     // Outline and structure borders
  borderColorLight: string // Fine white/black transparency lines
  
  // Text colors
  textMain: string        // Primary readable text color
  textMuted: string       // Secondary helpful text color
  textTitle: string       // Headers and brand text color
  
  // Accent brand colors
  accentHex: string       // Raw hex for some custom borders/ratings
  accentBg: string        // Background color of primary actions
  accentBgHover: string   // Hover action bg
  accentBgMuted: string   // Subdued background for tags
  accentText: string      // Highlight text color
  accentBorder: string    // Accent thin lines
  accentRing: string      // Inputs active borders
  accentBadge: string     // Specialized tag theme
}

export const THEME_PRESETS: VisualTheme[] = [
  {
    id: 'day',
    name: 'Day (Light Mode)',
    icon: '☀️',
    desc: '典雅舒缓的莫兰迪浅色模式',
    isDark: false,
    bgMain: 'bg-[#EAE8E4]',
    bgHeader: 'bg-transparent',
    bgSidebar: 'bg-[#F4F3F0] border-r border-[#D8D4CC]',
    bgCard: 'bg-[#F4F3F0] border border-[#D8D4CC]',
    bgPanel: 'bg-[#EEECDF]',
    bgInput: 'bg-[#EEECDF] border-[#D8D4CC]',
    borderColor: 'border-[#D8D4CC]',
    borderColorLight: 'border-[#EEECDF]',
    textMain: 'text-[#5E5B55]',
    textMuted: 'text-[#9C988D]',
    textTitle: 'text-[#3B3833]',
    accentHex: '#A6927E',
    accentBg: 'bg-[#A6927E]',
    accentBgHover: 'hover:bg-[#8D7D6B]',
    accentBgMuted: 'bg-[#A6927E]/5',
    accentText: 'text-[#A6927E]',
    accentBorder: 'border-[#A6927E]',
    accentRing: 'focus:border-[#A6927E]',
    accentBadge: 'text-[#A6927E] bg-[#A6927E]/10 border-[#A6927E]/20'
  },
  {
    id: 'night',
    name: 'Night (Dark Mode)',
    icon: '🌙',
    desc: '温润舒适的高级莫兰迪深色模式',
    isDark: true,
    bgMain: 'bg-[#1C1B1A]',
    bgHeader: 'bg-transparent',
    bgSidebar: 'bg-[#282624] border border-[#3A3834]',
    bgCard: 'bg-[#242220] border border-[#3A3834]',
    bgPanel: 'bg-[#2D2A28]',
    bgInput: 'bg-[#1E1D1B] border-[#3E3C38]',
    borderColor: 'border-[#3E3C38]',
    borderColorLight: 'border-[#33312D]',
    textMain: 'text-[#B2AEA6]',
    textMuted: 'text-[#827E74]',
    textTitle: 'text-[#DFDAD0]',
    accentHex: '#B69D82',
    accentBg: 'bg-[#B69D82]',
    accentBgHover: 'hover:bg-[#9F876D]',
    accentBgMuted: 'bg-[#B69D82]/10',
    accentText: 'text-[#B69D82]',
    accentBorder: 'border-[#B69D82]',
    accentRing: 'focus:border-[#B69D82]',
    accentBadge: 'text-[#B69D82] bg-[#B69D82]/20 border-[#B69D82]/30'
  }
]

const THEME_STORAGE_KEY = 'filmai-selected-theme-preset'

export function loadSavedTheme(): VisualTheme {
  try {
    const savedId = localStorage.getItem(THEME_STORAGE_KEY)
    if (savedId) {
      const found = THEME_PRESETS.find(p => p.id === savedId)
      if (found) return found
    }
  } catch (err) {
    console.warn('Failed to load theme:', err)
  }
  return THEME_PRESETS.find(p => p.id === 'night') || THEME_PRESETS[1] || THEME_PRESETS[0]
}

export function saveSelectedTheme(id: string) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id)
  } catch (err) {
    console.warn('Failed to save theme:', err)
  }
}

export function useGlobalTheme() {
  const [theme, setThemeState] = useState<VisualTheme>(() => loadSavedTheme())

  const switchTheme = (id: string) => {
    const found = THEME_PRESETS.find(p => p.id === id)
    if (found) {
      setThemeState(found)
      saveSelectedTheme(id)
      
      // Update HTML high-level light/dark flags
      if (found.isDark) {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
        document.documentElement.style.colorScheme = 'dark'
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
        document.documentElement.style.colorScheme = 'light'
      }

      // Dispatch a storage event so other open pages/views can listen and re-render instantly!
      window.dispatchEvent(new Event('theme-changed'))
    }
  }

  // Hook into storage sync to dynamically update if switched elsewhere
  useEffect(() => {
    const handleThemeChange = () => {
      setThemeState(loadSavedTheme())
    }
    window.addEventListener('theme-changed', handleThemeChange)
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange)
    }
  }, [])

  return { theme, switchTheme, presets: THEME_PRESETS }
}
