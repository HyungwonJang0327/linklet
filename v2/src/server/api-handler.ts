import 'server-only'

import type { NextRequest } from 'next/server'
import type * as z from 'zod/mini'

import { AppError } from '@/shared/lib/api-error'
import { toErrorResponse } from '@/shared/lib/api-response'
import { parseOrThrow } from '@/shared/lib/validation'

import { logger } from './logger'

// Route Handler 래퍼 — decisions/api-response.md V2, error-handling.md E2·E5, architecture.md A4
// app/api/* 는 이 래퍼로 감싼 함수만 export 한다. 입력은 parseBody·parseQuery·parseParams 로 Zod 파싱한 뒤 서비스 호출.
//
// 사용 예 (app/api/wishlists/[id]/items/route.ts):
//   const paramsSchema = z.object({ id: z.string() })
//   export const POST = createHandler(async ({ request, params }) => {
//     const { id } = await parseParams(params, paramsSchema)
//     const input = await parseBody(request, createItemSchema)
//     return ok(await itemService.create(id, input), { status: 201 })
//   })
//
// 위치가 server/ 인 이유: 로거(server/logger)를 직접 import 하기 위해. shared/lib → server 역방향은 금지.
// 예상 못한 실패의 기록은 아래 handleError 한 곳에서만 한다.

/** Next 16 동적 세그먼트 값 — `[id]` 는 string, `[...slug]` 는 string[] */
export type RouteParams = Record<string, string | string[] | undefined>

/**
 * 래퍼가 핸들러에 넘기는 컨텍스트. `params` 는 Next 16 규약대로 **Promise 그대로**다 (await 하지 않는다).
 * 이유: 래퍼가 핸들러 전에 하는 일을 0 으로 두고, Next 가 주는 모양을 그대로 보존해 `RouteContext<...>` 타입과 어긋나지 않게.
 * 핸들러는 `parseParams(params, schema)` 가 await 를 대신하므로 직접 await 할 일이 거의 없다.
 */
export type HandlerContext<P extends RouteParams = RouteParams> = {
  request: NextRequest
  params: Promise<P>
}

/** Next 가 호출하는 Route Handler 시그니처 (`(request, { params })`) */
export type RouteHandler<P extends RouteParams = RouteParams> = (
  request: NextRequest,
  context: { params: Promise<P> },
) => Promise<Response>

/**
 * Route Handler 를 감싼다. 핸들러가 throw 한 값은 전부 응답으로 바뀐다 —
 * AppError 는 해당 상태·코드, 그 외는 500 INTERNAL 고정 문구(원본 message·stack 은 본문에 없다).
 */
export function createHandler<P extends RouteParams = RouteParams>(
  fn: (ctx: HandlerContext<P>) => Promise<Response> | Response,
): RouteHandler<P> {
  return async (request, context) => {
    try {
      return await fn({ request, params: context.params })
    } catch (error) {
      return handleError(request, error)
    }
  }
}

/**
 * 예상 못한 실패의 기록 지점 (E5) — 호출 지점은 이 함수 하나. AppError 는 로거가 걸러 기록하지 않는다.
 * route 는 pathname 만 — 쿼리스트링(토큰·검색어)은 로그에 넣지 않는다.
 * pathname 은 percent-decoding 을 시도한 뒤 넘긴다 — `%40` 같은 인코딩이 마스킹 규칙을 우회하지 않게 (실패하면 원문).
 */
function handleError(request: NextRequest, error: unknown): Response {
  return toErrorResponse(error, (unexpected) =>
    logger.unexpected(unexpected, {
      route: decodePathname(request.nextUrl.pathname),
      method: request.method,
    }),
  )
}

function decodePathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}

type Schema = z.core.$ZodType

/** body 가 JSON 이 아닐 때 details 에 쓰는 코드 — Zod issue code 와 구분되는 이 파일 고유 값. path 는 루트(`''`) */
export const BODY_ISSUE_CODE = {
  /** Content-Type 이 JSON 계열(`application/json`, `application/…+json`)이 아님 */
  invalidContentType: 'invalid_content_type',
  /** 본문이 JSON 으로 파싱되지 않음 (빈 본문 포함) */
  invalidJson: 'invalid_json',
} as const

/**
 * JSON body → 스키마. Content-Type 이 JSON 이 아니거나 JSON 파싱이 실패해도 **400 VALIDATION_FAILED** 다
 * (클라이언트 입력 문제이므로 415·500 이 아닌 검증 실패로 한 종류에 모은다. 프론트는 details.code 로 구분).
 * body 크기 상한은 두지 않는다 — Next·Vercel 기본(서버리스 요청 본문 4.5MB)을 따른다. 큰 업로드는 F20 에서 R2 presigned URL 로.
 */
export async function parseBody<T extends Schema>(
  request: NextRequest,
  schema: T,
): Promise<z.output<T>> {
  if (!isJsonContentType(request.headers.get('content-type'))) {
    throw new AppError('VALIDATION_FAILED', [
      { path: '', code: BODY_ISSUE_CODE.invalidContentType },
    ])
  }
  let json: unknown
  try {
    json = await request.json()
  } catch {
    throw new AppError('VALIDATION_FAILED', [{ path: '', code: BODY_ISSUE_CODE.invalidJson }])
  }
  return parseOrThrow(schema, json)
}

/**
 * 쿼리스트링 → 객체 → 스키마. 값은 항상 string, **같은 키가 반복되면 마지막 값**만 쓴다.
 * 이유: URL 쿼리는 필터·정렬·탭 같은 단일 값(url-design U4)이라 스키마를 `z.string()` 으로 단순하게 유지한다.
 * 목록 값이 필요하면 `?a=x,y` 를 스키마 쪽에서 split 한다. 숫자·불리언은 `z.coerce.*` 또는 `z.pipe` 로 변환.
 */
export function parseQuery<T extends Schema>(request: NextRequest, schema: T): z.output<T> {
  return parseOrThrow(schema, Object.fromEntries(request.nextUrl.searchParams))
}

/** 동적 세그먼트(`ctx.params`) → 스키마. 형식이 틀리면 400 — 존재하지 않는 리소스의 404 는 서비스가 판단한다 */
export async function parseParams<T extends Schema>(
  params: Promise<RouteParams>,
  schema: T,
): Promise<z.output<T>> {
  return parseOrThrow(schema, await params)
}

/** `application/json`, `application/json; charset=utf-8`, `application/*+json` 만 JSON 으로 본다 */
function isJsonContentType(header: string | null): boolean {
  if (header === null) return false
  const semicolon = header.indexOf(';')
  const mediaType = (semicolon === -1 ? header : header.slice(0, semicolon)).trim().toLowerCase()
  return mediaType === 'application/json' || mediaType.endsWith('+json')
}
