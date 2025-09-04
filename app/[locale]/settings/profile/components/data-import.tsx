'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'
import { validateUserProfileForm, sanitizeUserProfileData } from '@/lib/validations/user'

interface UserData {
  id: string
  name?: string
  email?: string
  bio?: string
  image?: string
  locale?: string
  createdAt: string
  _count?: {
    wishlists: number
  }
}

interface DataImportProps {
  userData: UserData | null | undefined
  importedData?: any
  onDataImport: (data: Partial<UserData>) => void
}

interface ImportData {
  name?: string
  bio?: string
  locale?: string
}

export default function DataImport({ userData, importedData, onDataImport }: DataImportProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const text = await file.text()
      let importData: ImportData

      // Try to parse as JSON
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        try {
          importData = JSON.parse(text)
        } catch {
          throw new Error(t('settings.profile.dataImport.invalidJson'))
        }
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // Parse CSV (simple implementation)
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const values = lines[1]?.split(',').map(v => v.trim())
        
        if (!values || values.length !== headers.length) {
          throw new Error(t('settings.profile.dataImport.invalidCsv'))
        }

        importData = {}
        headers.forEach((header, index) => {
          const value = values[index]
          if (header === 'name' && value) importData.name = value
          if (header === 'bio' && value) importData.bio = value
          if (header === 'locale' && value) importData.locale = value
        })
      } else {
        throw new Error(t('settings.profile.dataImport.unsupportedFormat'))
      }

      // Validate imported data
      const validation = validateUserProfileForm(importData)
      if (!validation.isValid) {
        throw new Error(`${t('settings.profile.dataImport.invalidData')}: ${Object.values(validation.errors).join(', ')}`)
      }

      // Sanitize data
      const sanitizedData = sanitizeUserProfileData(importData)
      
      // Apply imported data
      onDataImport(sanitizedData)
      setSuccess(t('settings.profile.dataImport.importSuccess'))
      
    } catch (err) {
      console.error('Import error:', err)
      setError(err instanceof Error ? err.message : t('settings.profile.dataImport.importFailed'))
    } finally {
      setLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleExportData = async () => {
    if (!userData) return

    setLoading(true)
    try {
      const exportData = {
        name: userData.name || '',
        bio: userData.bio || '',
        locale: userData.locale || 'kr',
        email: userData.email || '',
        joinDate: userData.createdAt,
        wishlistCount: userData._count?.wishlists || 0
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `linklet-profile-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setSuccess(t('settings.profile.dataImport.exportSuccess'))
    } catch (err) {
      console.error('Export error:', err)
      setError(t('settings.profile.dataImport.exportFailed'))
    } finally {
      setLoading(false)
    }
  }

  const generateSampleData = () => {
    const sampleData = {
      name: 'John Doe',
      bio: 'Sample user profile',
      locale: 'en'
    }

    const dataStr = JSON.stringify(sampleData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'linklet-sample-data.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Clear messages after a few seconds
  useState(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  })

  return (
    <>
      <h2 className="text-xl font-semibold text-white mb-4">{t('settings.profile.dataImport.title')}</h2>
      <div className="space-y-4">
        <p className="text-slate-300 text-sm">
          {t('settings.profile.dataImport.description')}
        </p>

        {/* Import Section */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileImport}
              disabled={loading}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? t('settings.profile.dataImport.importing') : t('settings.profile.dataImport.import')}
            </Button>
          </div>
          
          <Button
            onClick={handleExportData}
            disabled={loading || !userData}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? t('settings.profile.dataImport.exporting') : t('settings.profile.dataImport.export')}
          </Button>

          <Button
            onClick={generateSampleData}
            className="bg-slate-600 hover:bg-slate-700 text-white"
          >
            {t('settings.profile.dataImport.sampleFile')}
          </Button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-900/50 border border-green-700/50 rounded-lg text-green-200 text-sm">
            {success}
          </div>
        )}

        {/* Help Text */}
        {/* Show imported data preview */}
        {importedData && (
          <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-blue-200 text-sm">
            <strong>{t('settings.profile.dataImport.preview')}:</strong>
            <ul className="mt-1 space-y-1">
              {importedData.name && <li>• {t('settings.profile.displayName')}: {importedData.name}</li>}
              {importedData.bio && <li>• {t('settings.profile.bio')}: {importedData.bio}</li>}
              {importedData.locale && <li>• {t('settings.profile.language')}: {importedData.locale}</li>}
            </ul>
          </div>
        )}

        <div className="text-slate-400 text-xs space-y-1">
          <p>• {t('settings.profile.dataImport.jsonFormat')}: {`{"name": "John Doe", "bio": "About me", "locale": "en"}`}</p>
          <p>• {t('settings.profile.dataImport.csvFormat')}</p>
          <p>• {t('settings.profile.dataImport.supportedFields')}</p>
        </div>
      </div>
    </>
  )
}