import 'server-only'

import * as Sentry from '@sentry/nextjs'

import { env } from '@/shared/config/env'
import { isAppError } from '@/shared/lib/api-error'
import {
  formatLogLine,
  LOG_FORMAT_FAILED_LINE,
  summarizeError,
  type LogFields,
  type LogLevel,
} from '@/shared/lib/log-format'

// 서버 구조화 로거 — decisions/error-handling.md E5, CLAUDE.md §4-1·§4-2 로그 규약
// 출력은 한 줄 JSON(console). 포맷·마스킹·허용 목록은 전부 shared/lib/log-format 이 맡고, 이 파일은 환경 분기와 출력만 한다.
//   - test: 출력 억제 (createLogger({ silent: false }) 로 켤 수 있다)
//   - production: stack 을 콘솔에 넣지 않는다 — 스택은 Sentry 로만 (F06 연결 지점은 unexpected() 안 한 곳)
//   - development: 프레임 ≤10 개의 `file:line:col` 만
// 로거는 **절대 throw 하지 않는다**. 출력 수단이 깨져도 삼킨다 — 로그 때문에 응답이 깨지면 안 된다.
// 로그 지점: Route Handler 래퍼(server/api-handler) · Server Component 데이터 로드 · 외부 fetch 실패 (E5)
// Sentry(F06): unexpected() 가 콘솔 한 줄과 함께 **원본 error** 를 captureException 으로 보낸다 — 스택은 여기서만 Sentry 로 간다.
//   같은 요청 컨텍스트(requestId·route·method·status·durationMs)는 tags 로. 메시지·breadcrumb·request 의 개인정보 제거는
//   SDK 초기화의 beforeSend(shared/lib/sentry-scrub)가 맡는다. DSN 이 없으면 SDK 가 조용히 버린다. test 환경은 보내지 않는다(옵션으로 주입)

type NodeEnv = 'development' | 'test' | 'production'

/** 이벤트 로그에 붙일 수 있는 필드 — level·event 는 메서드·인자로 정해진다 */
export type EventFields = Omit<LogFields, 'level' | 'event'>

/** 예상 못한 실패에 붙일 요청 컨텍스트 — 에러에서 나오는 필드(errorName·message·code·stack·meta)는 받지 않는다 */
export type UnexpectedFields = Pick<
  LogFields,
  'requestId' | 'route' | 'method' | 'status' | 'durationMs'
>

export type LogSink = {
  log: (line: string) => void
  warn: (line: string) => void
  error: (line: string) => void
}

/** 예상 못한 실패를 모니터링으로 보내는 함수 — 기본값은 Sentry.captureException(test 환경은 보내지 않음) */
export type ErrorCapture = (error: unknown, tags: UnexpectedFields) => void

export type LoggerOptions = {
  nodeEnv: NodeEnv
  /** 기본값: `nodeEnv === 'test'`. 테스트에서 출력을 확인하려면 false */
  silent?: boolean
  /** 기본값: console */
  sink?: LogSink
  /** 기본값: test 면 아무것도 안 함, 그 외 Sentry. 테스트에서 호출을 확인하려면 spy 주입 */
  capture?: ErrorCapture
}

function captureWithSentry(error: unknown, tags: UnexpectedFields): void {
  // undefined 값은 빼고 넘긴다 — Sentry 는 tag 값으로 primitive 만 받는다(숫자 status·durationMs 는 그대로)
  const defined = Object.fromEntries(
    Object.entries(tags).filter(([, value]) => value !== undefined),
  )
  Sentry.captureException(error, { tags: defined })
}

const captureNothing: ErrorCapture = () => {}

export type Logger = {
  info: (event: string, fields?: EventFields) => void
  warn: (event: string, fields?: EventFields) => void
  error: (event: string, fields?: EventFields) => void
  /**
   * 예상 못한 실패 (E5). AppError 는 예상된 실패라 기록하지 않는다.
   * 그 외 값은 summarizeError 로 한 줄 — 원본 message 는 마스킹·300자, stack 은 운영이면 제외.
   */
  unexpected: (error: unknown, fields?: UnexpectedFields) => void
}

export function createLogger(options: LoggerOptions): Logger {
  const silent = options.silent ?? options.nodeEnv === 'test'
  const includeStack = options.nodeEnv !== 'production'
  const sink: LogSink = options.sink ?? console
  const capture: ErrorCapture =
    options.capture ?? (options.nodeEnv === 'test' ? captureNothing : captureWithSentry)

  /** 포맷 단계(fields 의 getter throw 등)가 실패했을 때의 마지막 시도 — 이것도 실패하면 조용히 끝낸다 */
  function writeFallback(): void {
    try {
      if (!silent) sink.error(LOG_FORMAT_FAILED_LINE)
    } catch {
      // 출력 수단 자체가 깨짐 — 할 수 있는 일이 없다
    }
  }

  function write(level: LogLevel, event: string, fields: EventFields | undefined): void {
    if (silent) return
    let line: string
    try {
      line = formatLogLine({ ...fields, level, event })
    } catch {
      writeFallback()
      return
    }
    try {
      if (level === 'error') sink.error(line)
      else if (level === 'warn') sink.warn(line)
      else sink.log(line)
    } catch {
      // 출력 수단 실패 — 로거는 throw 하지 않는다
    }
  }

  return {
    info: (event, fields) => write('info', event, fields),
    warn: (event, fields) => write('warn', event, fields),
    error: (event, fields) => write('error', event, fields),
    unexpected(error, fields) {
      try {
        if (isAppError(error)) return
        const summary = summarizeError(error)
        write('error', 'unexpected_error', {
          ...fields,
          errorName: summary.name,
          message: summary.message,
          code: summary.code,
          meta: summary.meta,
          stack: includeStack ? summary.stack : undefined,
        })
        // Sentry 연결 지점(F06) — 원본 error 는 SDK 로만 가고(beforeSend 가 마스킹), 콘솔 줄과 같은 요청 컨텍스트를 tags 로.
        // 콘솔 출력 뒤에 둔다 — capture 가 실패해도 로그 줄은 이미 남았다
        try {
          capture(error, { ...fields })
        } catch {
          // 모니터링 전송 실패는 삼킨다 — 로거는 throw 하지 않는다
        }
      } catch {
        // summarizeError·write 는 throw 하지 않게 만들었지만(fields 전개의 getter 는 예외), 어떤 경우에도 호출자에게 전파하지 않는다
        writeFallback()
      }
    },
  }
}

/** 앱 전체가 쓰는 로거 하나. 환경은 검증된 env 에서만 읽는다 (process.env 직접 참조 금지 — ESLint) */
export const logger: Logger = createLogger({ nodeEnv: env.NODE_ENV })
