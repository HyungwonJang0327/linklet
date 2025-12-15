import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const Bucket = process.env?.AMPLIFY_BUCKET || 'linklet-image'
const Region = process.env?.AWS_REGION || 'ap-northeast-2'

// Singleton S3 client
let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: Region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      }
    })
  }
  return s3Client
}

// File upload validation constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]

// Magic bytes for image file type verification
const IMAGE_SIGNATURES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
  'image/svg+xml': [[0x3C, 0x3F, 0x78, 0x6D], [0x3C, 0x73, 0x76, 0x67]] // <?xml or <svg
}

/**
 * Verify file is actually an image by checking magic bytes
 */
function verifyImageSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures = IMAGE_SIGNATURES[mimeType as keyof typeof IMAGE_SIGNATURES]
  if (!signatures) return false

  return signatures.some(signature => {
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) return false
    }
    return true
  })
}

/**
 * Sanitize filename to prevent path traversal and malicious filenames
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and parent directory references
  let sanitized = filename.replace(/[\/\\]/g, '_')
  sanitized = sanitized.replace(/\.\./g, '_')

  // Remove special characters except dots, dashes, and underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_')

  // Limit filename length
  if (sanitized.length > 100) {
    const ext = sanitized.split('.').pop()
    sanitized = sanitized.substring(0, 96) + (ext ? '.' + ext : '')
  }

  return sanitized
}

export interface UploadOptions {
  /**
   * Original filename (will be sanitized)
   */
  filename?: string
  /**
   * Skip file validation (use with caution)
   */
  skipValidation?: boolean
  /**
   * Custom prefix for S3 key (default: 'uploads')
   */
  keyPrefix?: string
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload an image (File or Blob) to S3
 * Validates file size, MIME type, and magic bytes before uploading
 *
 * @param file - File or Blob to upload
 * @param options - Upload options
 * @returns Upload result with S3 URL or error
 */
export async function uploadImageToS3(
  file: File | Blob,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const {
      filename = 'upload',
      skipValidation = false,
      keyPrefix = 'uploads'
    } = options

    // Validate file size
    if (!skipValidation && file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      }
    }

    if (file.size === 0) {
      return {
        success: false,
        error: 'File is empty'
      }
    }

    // Get MIME type
    const mimeType = file.type.toLowerCase()

    // Validate MIME type
    if (!skipValidation && !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        success: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      }
    }

    // Convert to buffer for validation
    const buffer = Buffer.from(await file.arrayBuffer())

    // Verify file signature (magic bytes)
    if (!skipValidation && !verifyImageSignature(buffer, mimeType)) {
      return {
        success: false,
        error: 'File content does not match the declared MIME type'
      }
    }

    // Generate unique filename
    const sanitizedName = sanitizeFilename(filename)
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = sanitizedName.split('.').pop() || mimeType.split('/')[1] || 'jpg'
    const key = `${keyPrefix}/${timestamp}-${randomString}.${extension}`

    // Upload to S3
    const s3 = getS3Client()
    await s3.send(
      new PutObjectCommand({
        Bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        // Add security headers
        CacheControl: 'public, max-age=31536000',
        // Prevent execution of uploaded files
        ContentDisposition: 'inline'
      })
    )

    const url = `https://${Bucket}.s3.${Region}.amazonaws.com/${key}`

    return {
      success: true,
      url
    }
  } catch (error) {
    console.error('S3 upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image to S3'
    }
  }
}

/**
 * Download an image from a URL and upload to S3
 * Useful for importing images from external sources
 *
 * @param imageUrl - URL of the image to download and upload
 * @param options - Upload options
 * @returns Upload result with S3 URL or error
 */
export async function downloadAndUploadToS3(
  imageUrl: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // Download image from URL
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to download image: HTTP ${response.status}`
      }
    }

    const imageBlob = await response.blob()

    // Check if it's a valid image type
    if (!imageBlob.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Downloaded content is not an image'
      }
    }

    // Generate filename from URL or timestamp
    const urlFilename = imageUrl.split('/').pop()?.split('?')[0] || 'download'
    const filename = options.filename || `metadata-${urlFilename}`

    // Upload to S3
    return await uploadImageToS3(imageBlob, {
      ...options,
      filename,
      keyPrefix: options.keyPrefix || 'metadata'
    })
  } catch (error) {
    console.error('Download and upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download and upload image'
    }
  }
}
