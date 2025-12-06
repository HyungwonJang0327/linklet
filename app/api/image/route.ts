import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'

const Bucket = process.env?.AMPLIFY_BUCKET || 'linklet-image'
const Region = process.env?.AWS_REGION || 'ap-northeast-2'
const s3 = new S3Client({
    region: Region,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    }
})

export async function POST(req: NextRequest) {
    try {
        // Authentication check
        const auth = await requireAuth()
        if (auth.error) return auth.error

        const formData = await req.formData()
        const files = formData.getAll('img') as File[]

        if (files.length > 1) {
            return new Response(JSON.stringify({ data: null, message: 'Only one image can be uploaded' }), { status: 400 })
        }

        const uploadPromises = files.map(async (file) => {
            const Body = Buffer.from(await file.arrayBuffer())
            const Key = file?.name || ''
            const ContentType = file?.type || 'image/jpg'

            await s3.send(
                new PutObjectCommand({
                    Bucket, Key, Body, ContentType
                })
            )

            return [
                `https://${Bucket}.s3.${Region}.amazonaws.com/${Key}`
            ]
        })

        const imageUrls = await Promise.all(uploadPromises)
        return new Response(JSON.stringify({ data: imageUrls[0], message: 'OK' }), { status: 200 })

    } catch (error) {
        console.error('Error uploading files:', error);
        return new Response(
            JSON.stringify({ message: '파일 업로드 중 오류가 발생했습니다.' }),
            { status: 500 },
        );
    }
}