'use client'

interface ThemeOptionProps {
  theme: string
  icon: any
  title: string
  description: string
  currentTheme: string
  onThemeChange: (theme: string) => void
}

export default function ThemeOption({ 
  theme, 
  icon: Icon, 
  title, 
  description,
  currentTheme,
  onThemeChange
}: ThemeOptionProps) {
  return (
    <button
      onClick={() => onThemeChange(theme)}
      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
        currentTheme === theme
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
      }`}
    >
      <Icon className={`w-6 h-6 mt-1 ${
        currentTheme === theme ? 'text-blue-400' : 'text-slate-400'
      }`} />
      <div className="text-left">
        <div className={`font-medium ${
          currentTheme === theme ? 'text-blue-300' : 'text-slate-200'
        }`}>
          {title}
        </div>
        <div className="text-sm text-slate-400 mt-1">
          {description}
        </div>
      </div>
    </button>
  )
}