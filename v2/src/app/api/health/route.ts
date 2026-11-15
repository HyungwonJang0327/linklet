import { createHandler } from '@/server/api-handler'
import { db } from '@/server/db'
import { logger } from '@/server/logger'
import { AppError } from '@/shared/lib/api-error'
import { ok } from '@/shared/lib/api-response'
import { summarizeError } from '@/shared/lib/log-format'

// 헬스 체크 — FEATURES I01 (처분: 개선). 모니터(외부 업타임 체커)가 주기적으로 호출한다.
// 기존 앱과 달라진 점: 실패 시 DB 에러 메시지(접속 정보가 섞일 수 있음)를 본문에 넣지 않고 고정 문구만 돌려준다 (AUDIT H8).
// 응답 형태(api-response R3): 성공 `200 { data: { status: 'ok' } }` / 실패 `503 { error: { code: 'UNAVAILABLE', message } }`.
// timestamp·responseTime 은 넣지 않는다 — 모니터가 직접 잰다.

// DB 상태를 매 요청마다 새로 봐야 하므로 캐시를 명시적으로 끈다.
// Next 15+ 는 GET Route Handler 가 기본 동적이지만(route.md Version History), 이 응답이 캐시되면 헬스 체크가 무의미해지므로 의도를 코드에 남긴다.
export const dynamic = 'force-dynamic'

export const GET = createHandler(async () => {
  try {
    // 타임아웃을 따로 두지 않는다 — pg 의 connectionTimeoutMillis 기본값과 Vercel 함수 실행 제한에 맡긴다.
    // 여기서 레이스를 걸면 끝난 쿼리의 커넥션 반환 시점이 꼬이고, 모니터 쪽이 이미 자체 타임아웃을 가진다.
    await db.$queryRaw`SELECT 1`
  } catch (error) {
    // AppError 는 래퍼가 기록하지 않으므로(E5) throw 전에 한 줄 남긴다. 마스킹·길이 제한은 summarizeError·logger 가 책임진다.
    const summary = summarizeError(error)
    logger.error('health.db_unavailable', {
      errorName: summary.name,
      message: summary.message,
      code: summary.code,
    })
    throw new AppError('UNAVAILABLE')
  }
  return ok({ status: 'ok' })
})
