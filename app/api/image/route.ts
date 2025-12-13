import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

const Bucket = process.env?.AMPLIFY_BUCKET || 'linklet-image'
const Region = process.env?.AWS_REGION || 'ap-northeast-2'
const s3 = new S3Client({
    region: Region,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    }
})

// File upload validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
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

export async function POST(req: NextRequest) {
    try {
        // Authentication check
        const auth = await requireAuth()
        if (auth.error) return auth.error

        // Rate limiting
        const clientIp = getClientIp(req)
        if (!checkRateLimit(`upload:${clientIp}`, RATE_LIMITS.FILE_UPLOAD)) {
            return new Response(
                JSON.stringify({
                    data: null,
                    message: 'Rate limit exceeded. Please try again later.'
                }),
                { status: 429 }
            )
        }

        const formData = await req.formData()
        const files = formData.getAll('img') as File[]

        if (files.length === 0) {
            return new Response(
                JSON.stringify({ data: null, message: 'No file provided' }),
                { status: 400 }
            )
        }

        if (files.length > 1) {
            return new Response(
                JSON.stringify({ data: null, message: 'Only one image can be uploaded' }),
                { status: 400 }
            )
        }

        const uploadPromises = files.map(async (file) => {
            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
            }

            if (file.size === 0) {
                throw new Error('File is empty')
            }

            // Validate MIME type
            const mimeType = file.type.toLowerCase()
            if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
                throw new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`)
            }

            // Convert to buffer for validation
            const Body = Buffer.from(await file.arrayBuffer())

            // Verify file signature (magic bytes)
            if (!verifyImageSignature(Body, mimeType)) {
                throw new Error('File content does not match the declared MIME type')
            }

            // Sanitize and generate unique filename
            const originalName = file.name || 'upload'
            const sanitizedName = sanitizeFilename(originalName)
            const timestamp = Date.now()
            const randomString = Math.random().toString(36).substring(2, 8)
            const extension = sanitizedName.split('.').pop() || 'jpg'
            const Key = `uploads/${timestamp}-${randomString}.${extension}`

            // Upload to S3
            await s3.send(
                new PutObjectCommand({
                    Bucket,
                    Key,
                    Body,
                    ContentType: mimeType,
                    // Add security headers
                    CacheControl: 'public, max-age=31536000',
                    // Prevent execution of uploaded files
                    ContentDisposition: 'inline'
                })
            )

            return `https://${Bucket}.s3.${Region}.amazonaws.com/${Key}`
        })

        const imageUrls = await Promise.all(uploadPromises)
        return new Response(
            JSON.stringify({ data: imageUrls[0], message: 'OK' }),
            { status: 200 }
        )

    } catch (error) {
        console.error('Error uploading files:', error)
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while uploading the file.'
        return new Response(
            JSON.stringify({ data: null, message: errorMessage }),
            { status: 400 }
        )
    }
}