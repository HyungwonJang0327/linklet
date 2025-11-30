'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ImageUpload from '@/components/ui/image-upload'
import { PhotoIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { ProductMetadata } from '@/lib/services/url-metadata'

interface MetadataEditFormProps {
  metadata: Partial<ProductMetadata>
  onChange: (metadata: Partial<ProductMetadata>) => void
  onSave: () => void
  onCancel: () => void
  isEditing?: boolean
  isGloballyRateLimited?: boolean
  currentUrlFailed?: boolean
}

export default function MetadataEditForm({
  metadata,
  onChange,
  onSave,
  onCancel,
  isEditing = false,
  isGloballyRateLimited = false,
  currentUrlFailed = false
}: MetadataEditFormProps) {
  return (
    <div className="border-t border-slate-600/30 pt-3 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <PhotoIcon className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-300 font-medium">Product Information</span>
        {!isEditing && (
          <span className="text-xs text-slate-500 ml-auto">
            {isGloballyRateLimited
              ? 'Rate limited - please wait and try again later'
              : currentUrlFailed
                ? 'Auto-extraction failed for this URL - please enter manually'
                : 'Auto-extraction failed - please enter manually'
            }
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="md:col-span-2 col-span-6 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Product Image (Optional)</label>
            <ImageUpload
              value={metadata.imageUrl || ''}
              onChange={(imageUrl) => onChange({ ...metadata, imageUrl: imageUrl || '' })}
              placeholder="Upload image"
              width={120}
              height={120}
              maxSizeKB={1024}
              className="w-full"
            />
          </div>
        </div>

        <div className="md:col-span-4 col-span-6 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Product Name</label>
            <Input
              value={metadata.title || ''}
              onChange={(value) => onChange({ ...metadata, title: value })}
              placeholder="Enter product name"
              className="bg-slate-800/50 border-slate-600 text-white text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Price (Optional)</label>
            <Input
              value={metadata.price || ''}
              onChange={(value) => onChange({ ...metadata, price: value })}
              placeholder="$0.00"
              className="bg-slate-800/50 border-slate-600 text-white text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Description (Optional)</label>
        <Input
          value={metadata.description || ''}
          onChange={(value) => onChange({ ...metadata, description: value })}
          placeholder="Product description"
          className="bg-slate-800/50 border-slate-600 text-white text-sm"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-3"
          disabled={!metadata.title?.trim()}
        >
          <CheckIcon className="w-3 h-3 mr-1" />
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-300 text-sm px-3"
        >
          <XMarkIcon className="w-3 h-3 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
