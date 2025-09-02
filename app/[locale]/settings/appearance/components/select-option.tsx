'use client'

interface SelectOptionProps {
  value: string
  label: string
  options: { value: string, label: string }[]
  onChange: (value: string) => void
}

export default function SelectOption({ 
  value, 
  label, 
  options, 
  onChange 
}: SelectOptionProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}