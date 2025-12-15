'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/components/providers/auth-provider'
import { useUpdateUser } from '@/hooks/use-user'
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

interface ProfileFormProps {
  userData: UserData | null | undefined
  onUserUpdate: () => void
}

export default function ProfileForm({ userData, onUserUpdate }: ProfileFormProps) {
  const { t } = useI18n()
  const { user } = useAuth()
  const updateUserMutation = useUpdateUser()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    bio: ''
  })

  // Update form data when userData changes
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        bio: userData.bio || ''
      })
    }
  }, [userData])

  // Removed importedData functionality as it's currently not used

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setErrors({})
    setSuccess(null)

    // Validate form data
    const validation = validateUserProfileForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    // Sanitize data
    const sanitizedData = sanitizeUserProfileData(formData)

    try {
      await updateUserMutation.mutateAsync(sanitizedData)
      setSuccess(t('settings.profile.updateSuccess'))
      onUserUpdate()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Profile update error:', err)
      setErrors({ submit: err instanceof Error ? err.message : t('settings.profile.updateFailed') })
    }
  }

  if (!userData) {
    return (
      <div className="space-y-6">
        <div className="text-center text-slate-400 py-8">
          {t('settings.profile.noUserData')}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-900/50 border border-green-700/50 rounded-lg text-green-200 text-sm">
          {success}
        </div>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-3 bg-red-900/50 border border-red-700/50 rounded-lg text-red-200 text-sm">
          {errors.submit}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Display Name */}
        <div>
          <Input
            label={t('settings.profile.displayName')}
            value={formData.name}
            onChange={(value: string) => setFormData(prev => ({ ...prev, name: value }))}
            placeholder={t('settings.profile.displayNamePlaceholder')}
            disabled={updateUserMutation.isPending}
            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
          />
          {errors.name && (
            <div className="text-red-400 text-sm mt-1">{errors.name}</div>
          )}
        </div>

        {/* Email (readonly) */}
        <div>
          <Input
            label={t('settings.profile.email')}
            type="email"
            value={userData.email || ''}
            onChange={() => {}} // Email is readonly
            placeholder="example@email.com"
            disabled={true}
            className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 opacity-60"
          />
          <div className="text-slate-500 text-xs mt-1">{t('settings.profile.emailCannotChange')}</div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {t('settings.profile.bio')}
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          placeholder={t('settings.profile.bioPlaceholder')}
          disabled={updateUserMutation.isPending}
          rows={4}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        {errors.bio && (
          <div className="text-red-400 text-sm mt-1">{errors.bio}</div>
        )}
        <div className="text-slate-500 text-xs mt-1">
          {formData.bio.length}/500 {t('settings.profile.characters')}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={updateUserMutation.isPending}
          disabled={!user?.id || updateUserMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateUserMutation.isPending ? t('settings.profile.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  )
}