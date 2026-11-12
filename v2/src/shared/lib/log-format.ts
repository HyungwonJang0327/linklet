import type { FieldError } from './api-error'
import { MESSAGE_MAX_LENGTH, normalizeMessage, redact, UNREADABLE } from './redact'

// 마스킹 함수는 ./redact 에 있다. 기존 import 경로 호환을 위해 다시 export 한다 (공개 API 불변)
export { MESSAGE_MAX_LENGTH, normalizeMessage, redact, REDACTED } from './redact'

// 로그 포맷·마스킹 — 순수 함수만. server-only 를 붙이지 않는 이유: 부팅 전(shared/config/env-failure.ts)에도 쓰고,
// 클라이언트 번들(env.client.ts)에 섞여도 서버 의존이 없어야 하기 때문. 출력 수단(console·Sentry)은 server/logger.ts 가 맡는다.
// 근거: decisions/error-handling.md E5, CLAUDE.md §4-2 로그 규약(개인정보 0), security-reviewer 요구 2026-11-12(todo/migrator-todo.md)
//
// 불변 규칙
//   1. 이 파일의 함수는 **절대 throw 하지 않는다**. 실패하면 고정 문구를 돌려준다 (로그 때문에 응답이 깨지지 않게).
//   2. 출력에 들어가는 키는 LOG_ALLOWED_KEYS 만. 그 밖의 키(password·cookie·body·user·headers …)는 이름이 무엇이든 버린다.
//   3. 문자열 값은 전부 redact()(./redact.ts) 를 거친다. 마스킹은 "원본이 출력에 남지 않음"이 기준이고 과잉 마스킹은 허용한다.

export const LOG_LEVELS = ['info', 'warn', 'error'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

/** Prisma 에러 meta 중 남겨도 되는 것 — 필드 이름(target)·모델 이름만. 레코드 값·cause 는 받지 않는다 */
export type LogMeta = { target?: string[]; modelName?: string }

/** 로그 한 줄에 들어갈 수 있는 필드 전부 (허용 목록). 새 필드는 여기 + LOG_ALLOWED_KEYS 에 같이 추가한다 */
export type LogFields = {
  level?: LogLevel
  event?: string
  requestId?: string
  /** pathname 만 — 쿼리스트링은 들어 있어도 잘라낸다 */
  route?: string
  method?: string
  status?: number
  /** 에러 코드 문자열 (Prisma `P2002`, pg `23505`, Node `ECONNREFUSED`) */
  code?: string
  errorName?: string
  message?: string
  durationMs?: number
  /** `file:line:col` 프레임 목록 (≤ STACK_MAX_FRAMES). 운영 콘솔에는 넣지 않는다 (server/logger) */
  stack?: string
  /** 검증 실패 `{ path, code }[]` — API `details` 와 같은 값 없는 형태 (env 부팅 실패가 쓴다) */
  details?: FieldError[]
  meta?: LogMeta
}

export const LOG_ALLOWED_KEYS = [
  'level',
  'event',
  'requestId',
  'route',
  'method',
  'status',
  'code',
  'errorName',
  'message',
  'durationMs',
  'stack',
  'details',
  'meta',
] as const satisfies readonly (keyof LogFields)[]

export const STACK_MAX_FRAMES = 10
/** 포맷 자체가 실패했을 때 내보내는 고정 한 줄 — 어떤 입력 값도 섞이지 않는다 */
export const LOG_FORMAT_FAILED_LINE = '{"level":"error","event":"log.format_failed"}'

const SHORT_MAX = 100
const ROUTE_MAX = 200
const CODE_MAX = 50
const DETAILS_MAX = 50
const META_TARGET_MAX = 20

export type ErrorSummary = {
  name: string
  message: string
  code?: string
  stack?: string
  meta?: LogMeta
}

/**
 * catch 한 값 → 로그에 넣을 요약. `Error` 가 아니면 typeof 만 남긴다 (문자열 throw 의 내용은 기록하지 않는다).
 * getter 가 throw 하는 Error 서브클래스를 견디도록 속성 접근을 하나씩 보호한다.
 * PrismaClientValidationError 는 메시지에 쿼리 인자(레코드 값)가 통째로 들어 있어 첫 줄(비어 있지 않은)만 남긴다.
 */
export function summarizeError(error: unknown): ErrorSummary {
  try {
    if (!(error instanceof Error)) return { name: 'NonError', message: typeof error }

    const name = readString(() => error.name) ?? 'Error'
    const rawMessage = readString(() => error.message) ?? UNREADABLE
    const summary: ErrorSummary = {
      name: redact(name).slice(0, SHORT_MAX),
      message: normalizeMessage(
        name === 'PrismaClientValidationError' ? firstNonEmptyLine(rawMessage) : rawMessage,
      ),
    }

    const code = readString(() => (error as { code?: unknown }).code)
    if (code !== undefined) summary.code = redact(code).slice(0, CODE_MAX)

    const stack = readString(() => error.stack)
    const frames = stack === undefined ? undefined : summarizeStack(stack)
    if (frames !== undefined) summary.stack = frames

    const meta = pickMeta(readUnknown(() => (error as { meta?: unknown }).meta))
    if (meta !== undefined) summary.meta = meta

    return summary
  } catch {
    return { name: 'Error', message: UNREADABLE }
  }
}

/**
 * 허용 목록 키만 골라 한 줄 JSON 으로. 타입이 맞지 않는 값·허용 목록 밖의 키는 버린다(줄은 그대로 나간다).
 * 직렬화 자체가 실패하면(getter throw 등) LOG_FORMAT_FAILED_LINE.
 */
export function formatLogLine(fields: LogFields): string {
  try {
    const source: Record<string, unknown> =
      typeof fields === 'object' && fields !== null ? (fields as Record<string, unknown>) : {}
    const out: Record<string, unknown> = {}

    for (const key of LOG_ALLOWED_KEYS) {
      const value = source[key]
      if (value === undefined || value === null) continue
      switch (key) {
        case 'level':
          if (isLogLevel(value)) out.level = value
          break
        case 'status':
        case 'durationMs':
          if (typeof value === 'number' && Number.isFinite(value)) out[key] = value
          break
        case 'route':
          if (typeof value === 'string') out.route = redact(stripQuery(value)).slice(0, ROUTE_MAX)
          break
        case 'message':
          if (typeof value === 'string') out.message = normalizeMessage(value)
          break
        case 'stack':
          if (typeof value === 'string') out.stack = summarizeStack(value) ?? redactLines(value)
          break
        case 'details':
          if (Array.isArray(value)) out.details = pickDetails(value)
          break
        case 'meta': {
          const meta = pickMeta(value)
          if (meta !== undefined) out.meta = meta
          break
        }
        default:
          // event · requestId · method · code · errorName — 짧은 문자열
          if (typeof value === 'string') out[key] = redact(value).slice(0, SHORT_MAX)
      }
    }
    if (out.level === undefined) out.level = 'info'
    return JSON.stringify(out)
  } catch {
    return LOG_FORMAT_FAILED_LINE
  }
}

// ---- 내부 ----

function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'string' && (LOG_LEVELS as readonly string[]).includes(value)
}

function readUnknown(get: () => unknown): unknown {
  try {
    return get()
  } catch {
    return undefined
  }
}

function readString(get: () => unknown): string | undefined {
  const value = readUnknown(get)
  return typeof value === 'string' ? value : undefined
}

function firstNonEmptyLine(text: string): string {
  return text.split(/\r?\n/).find((line) => line.trim() !== '') ?? ''
}

function stripQuery(route: string): string {
  const cut = route.search(/[?#]/)
  return cut === -1 ? route : route.slice(0, cut)
}

function redactLines(text: string): string {
  return text
    .split(/\r?\n/)
    .slice(0, STACK_MAX_FRAMES)
    .map((line) => redact(line).slice(0, ROUTE_MAX))
    .join('\n')
}

/** V8 스택에서 `at …` 프레임만 ≤ STACK_MAX_FRAMES 개, 각 프레임은 `file:line:col` 위치만(함수 이름·인자 없음). 프레임이 없으면 undefined */
function summarizeStack(stack: string): string | undefined {
  const frames = stack.split(/\r?\n/).filter((line) => /^\s*at\s/.test(line))
  if (frames.length === 0) return undefined
  return frames
    .slice(0, STACK_MAX_FRAMES)
    .map((frame) => {
      const location = /((?:[A-Za-z]:)?[^\s()]+:\d+:\d+)\)?\s*$/.exec(frame)?.[1]
      return location === undefined ? '<anonymous>' : redact(location).slice(0, ROUTE_MAX)
    })
    .join('\n')
}

function pickDetails(value: readonly unknown[]): FieldError[] {
  const out: FieldError[] = []
  for (const entry of value) {
    if (out.length >= DETAILS_MAX) break
    if (typeof entry !== 'object' || entry === null) continue
    const path = readString(() => (entry as { path?: unknown }).path)
    const code = readString(() => (entry as { code?: unknown }).code)
    if (path === undefined || code === undefined) continue
    out.push({ path: redact(path).slice(0, SHORT_MAX), code: redact(code).slice(0, SHORT_MAX) })
  }
  return out
}

function pickMeta(value: unknown): LogMeta | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const out: LogMeta = {}
  const target = readUnknown(() => (value as { target?: unknown }).target)
  if (Array.isArray(target)) {
    const names = target
      .filter((item): item is string => typeof item === 'string')
      .slice(0, META_TARGET_MAX)
      .map((item) => redact(item).slice(0, SHORT_MAX))
    if (names.length > 0) out.target = names
  } else if (typeof target === 'string') {
    out.target = [redact(target).slice(0, SHORT_MAX)]
  }
  const modelName = readString(() => (value as { modelName?: unknown }).modelName)
  if (modelName !== undefined) out.modelName = redact(modelName).slice(0, SHORT_MAX)
  return out.target === undefined && out.modelName === undefined ? undefined : out
}
