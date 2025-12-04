export interface CustomizationPreset {
  id: string
  theme: string
  layout: string
  colors: {
    primary: string
    background: string
    text: string
    accent: string
  }
}

export const CUSTOMIZATION_PRESETS: CustomizationPreset[] = [
  {
    id: 'modern-blue',
    theme: 'modern',
    layout: 'grid',
    colors: {
      primary: '#3b82f6',
      background: '#0f172a',
      text: '#ffffff',
      accent: '#6366f1'
    }
  },
  {
    id: 'sunset-gradient',
    theme: 'gradient',
    layout: 'grid',
    colors: {
      primary: '#f97316',
      background: '#1e1b4b',
      text: '#fef3c7',
      accent: '#fb923c'
    }
  },
  {
    id: 'minimal-white',
    theme: 'minimal',
    layout: 'list',
    colors: {
      primary: '#1f2937',
      background: '#ffffff',
      text: '#111827',
      accent: '#6b7280'
    }
  },
  {
    id: 'neon-purple',
    theme: 'neon',
    layout: 'grid',
    colors: {
      primary: '#a855f7',
      background: '#18181b',
      text: '#faf5ff',
      accent: '#c084fc'
    }
  },
  {
    id: 'nature-green',
    theme: 'nature',
    layout: 'masonry',
    colors: {
      primary: '#10b981',
      background: '#064e3b',
      text: '#ecfdf5',
      accent: '#34d399'
    }
  },
  {
    id: 'warm-sunset',
    theme: 'sunset',
    layout: 'grid',
    colors: {
      primary: '#f59e0b',
      background: '#7c2d12',
      text: '#fef3c7',
      accent: '#fb923c'
    }
  },
  {
    id: 'elegant-dark',
    theme: 'modern',
    layout: 'grid',
    colors: {
      primary: '#8b5cf6',
      background: '#111827',
      text: '#f3f4f6',
      accent: '#a78bfa'
    }
  },
  {
    id: 'ocean-blue',
    theme: 'gradient',
    layout: 'grid',
    colors: {
      primary: '#0ea5e9',
      background: '#0c4a6e',
      text: '#e0f2fe',
      accent: '#38bdf8'
    }
  },
  {
    id: 'rose-pink',
    theme: 'gradient',
    layout: 'grid',
    colors: {
      primary: '#ec4899',
      background: '#831843',
      text: '#fce7f3',
      accent: '#f472b6'
    }
  }
]
