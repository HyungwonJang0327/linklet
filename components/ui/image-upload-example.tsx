// Example usage of ImageUpload component
import { useState } from 'react'
import ImageUpload from './image-upload'

export default function ImageUploadExample() {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  return (
    <div className="max-w-md mx-auto space-y-6 p-6">
      <h2 className="text-xl font-semibold">Image Upload Examples</h2>
      
      {/* Basic Usage */}
      <div>
        <h3 className="text-lg font-medium mb-2">Basic Usage</h3>
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          onFileChange={setUploadedFile}
        />
      </div>

      {/* Compact Size */}
      <div>
        <h3 className="text-lg font-medium mb-2">Compact Size</h3>
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          width={80}
          height={80}
          placeholder="Upload avatar"
          maxSizeKB={512} // 512KB limit
        />
      </div>

      {/* No Preview Mode */}
      <div>
        <h3 className="text-lg font-medium mb-2">No Preview Mode</h3>
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          preview={false}
          placeholder="Upload without preview"
        />
      </div>

      {/* Custom File Types */}
      <div>
        <h3 className="text-lg font-medium mb-2">PNG Only</h3>
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          acceptedTypes={['image/png']}
          placeholder="PNG files only"
        />
      </div>

      {/* Display Current Values */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-medium mb-2">Current Values:</h3>
        <p className="text-sm"><strong>Image URL:</strong> {imageUrl || 'None'}</p>
        <p className="text-sm"><strong>File Name:</strong> {uploadedFile?.name || 'None'}</p>
        <p className="text-sm"><strong>File Size:</strong> {uploadedFile ? `${Math.round(uploadedFile.size / 1024)}KB` : 'None'}</p>
      </div>
    </div>
  )
}