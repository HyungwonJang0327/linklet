'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { PhotoIcon, PencilIcon } from '@heroicons/react/24/outline'
import type { ProductMetadata } from '@/lib/services/url-metadata'

interface MetadataDisplayProps {
  metadata: ProductMetadata
  onEdit: () => void
}

export default function MetadataDisplay({ metadata, onEdit }: MetadataDisplayProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="border-t border-slate-600/30 pt-3">
      <div className="flex items-start gap-3">
        {/* Product Thumbnail */}
        <div className="flex-shrink-0">
          {metadata?.imageUrl?.trim() && !imageError ? (
            <Image
              src={metadata.imageUrl.trim()}
              alt={metadata.title?.trim() || 'Product'}
              className="w-20 h-20 object-cover rounded-lg bg-slate-800 border border-slate-600/30"
              onError={() => setImageError(true)}
              width={80}
              height={80}
            />
          ) : (
            <div className="w-20 h-20 bg-slate-800 rounded-lg border border-slate-600/30 flex items-center justify-center">
              <PhotoIcon className="w-8 h-8 text-slate-500" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white text-base line-clamp-2 mb-2">
            {metadata?.title?.trim() || 'Untitled Product'}
          </h4>
          {metadata?.price?.trim() && (
            <p className="text-green-400 font-semibold text-sm mb-2">
              {metadata.price.trim()}
            </p>
          )}
          {metadata?.description?.trim() && (
            <p className="text-slate-400 text-sm line-clamp-2 mb-2">
              {metadata.description.trim()}
            </p>
          )}
          {metadata?.siteName?.trim() && (
            <p className="text-slate-500 text-xs">
              from {metadata.siteName.trim()}
            </p>
          )}
        </div>

        {/* Edit Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 p-2"
          title="Edit product information"
        >
          <PencilIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
