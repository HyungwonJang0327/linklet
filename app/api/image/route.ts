import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'
import { uploadImageToS3 } from '@/lib/services/s3-upload'

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

    const file = files[0]

    // Upload to S3 using shared service
    const result = await uploadImageToS3(file, {
      filename: file.name || 'upload'
    })

    if (!result.success) {
      return new Response(
        JSON.stringify({ data: null, message: result.error }),
        { status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ data: result.url, message: 'OK' }),
      { status: 200 }
    )

  } catch (error) {
    console.error('Error uploading file:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while uploading the file.'
    return new Response(
      JSON.stringify({ data: null, message: errorMessage }),
      { status: 400 }
    )
  }
}
