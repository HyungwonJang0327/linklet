'use client'

import { useState, useRef, useCallback } from 'react'
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string // Current image URL or data URL
  onChange?: (imageUrl: string | null) => void
  onFileChange?: (file: File | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxSizeKB?: number // Maximum file size in KB (default: 2MB)
  acceptedTypes?: string[] // Accepted file types (default: ['image/jpeg', 'image/png', 'image/webp'])
  preview?: boolean // Whether to show image preview (default: true)
  width?: number // Preview width in pixels
  height?: number // Preview height in pixels
}

export default function ImageUpload({
  value,
  onChange,
  onFileChange,
  placeholder = 'Upload an image',
  className = '',
  disabled = false,
  maxSizeKB = 2048, // 2MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  preview = true,
  width = 200,
  height = 200
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Please upload: ${acceptedTypes.join(', ')}`
    }

    // Check file size
    if (file.size > maxSizeKB * 1024) {
      return `File size too large. Maximum size: ${maxSizeKB}KB`
    }

    return null
  }, [acceptedTypes, maxSizeKB])

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Upload to S3 via /api/image
      const formData = new FormData()
      formData.append('img', file)

      const response = await fetch('/api/image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed')
      }

      // Get the S3 URL from the response
      const s3Url = result.data?.[0]
      if (!s3Url) {
        throw new Error('No URL returned from server')
      }

      // Call the callbacks with S3 URL
      onChange?.(s3Url)
      onFileChange?.(file)
    } catch (error) {
      console.error('Error uploading file:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }, [validateFile, onChange, onFileChange])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    processFile(file)
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    if (disabled) return

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [disabled, handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }, [handleFileSelect])

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  const handleRemove = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    onChange?.(null)
    onFileChange?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setError(null)
  }, [onChange, onFileChange])

  const hasImage = value && value.trim() !== ''

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
          ${dragOver
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-slate-600 hover:border-slate-500'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-800/30'}
          ${hasImage && preview ? 'p-2' : 'p-6'}
        `}
        style={hasImage && preview ? { width: '100%', objectFit: 'cover', aspectRatio: '1/1' } : undefined}
      >
        {hasImage && preview ? (
          // Image preview mode
          <div className="relative w-full h-full">
            <Image
              src={value}
              alt="Uploaded image"
              className="w-full h-full object-cover rounded-lg"
              onError={() => {
                setError('Failed to load image')
              }}
              width={width}
              height={height}
            />

            {/* Remove button */}
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-600 hover:bg-red-700 text-white rounded-full border-2 border-white"
              >
                <XMarkIcon className="w-3 h-3" />
              </Button>
            )}

            {/* Upload overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <ArrowUpTrayIcon className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Change Image</p>
              </div>
            </div>
          </div>
        ) : (
          // Upload area mode
          <div className="text-center">
            <PhotoIcon className={`w-12 h-12 mx-auto mb-4 ${dragOver ? 'text-blue-400' : 'text-slate-400'}`} />
            <div className={`text-sm ${dragOver ? 'text-blue-400' : 'text-slate-300'}`}>
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  <p className="font-medium mb-1">{placeholder}</p>
                  <p className="text-xs text-slate-500">
                    Drag and drop or click to browse
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Max {Math.round(maxSizeKB / 1024)}MB • {acceptedTypes.map(type => type.split('/')[1]).join(', ')}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-xs mt-2">{error}</p>
      )}

      {/* File info */}
      {hasImage && !preview && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Image uploaded</span>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-red-400 hover:text-red-300 h-6 px-2"
            >
              Remove
            </Button>
          )}
        </div>
      )}
    </div>
  )
}