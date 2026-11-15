import 'server-only'

import type { PrismaClient } from '@/generated/prisma/client'
import { env } from '@/shared/config/env'

import { isLocalDatabaseUrl } from '../../prisma/lib/local-db.mts'

// ===== 테스트 전용 모듈 — 앱 코드(route·service·repository)에서 import 하지 않는다 =====
// 통합 테스트가 beforeEach 에서 테스트 DB 의 모든 테이블을 비운다 ("테스트마다 깨끗한 DB", decisions/testing.md T5. 적용은 vitest.global-setup.mts).
// 이 모듈은 로드되는 순간 NODE_ENV 가 'test' 가 아니면 throw 한다 — 운영·개발 코드에 실수로 import 되어 TRUNCATE 가 돌 수 있는 길을 막는다.
// 운영 DB 보호의 1차 방어는 vitest.setup.ts 의 로컬 가드이고, 이 파일은 그 뒤의 두 번째 벽이다.

if (env.NODE_ENV !== 'test') {
  throw new Error(
    'server/test-db is test-only and must not be imported outside Vitest (NODE_ENV=test)',
  )
}

/**
 * public 스키마의 모든 테이블(`_prisma_migrations` 제외)을 한 문장으로 TRUNCATE … RESTART IDENTITY CASCADE.
 * - 테이블 목록은 하드코딩하지 않고 pg_tables 에서 읽는다 → 새 마이그레이션마다 이 파일을 고칠 필요가 없다
 * - 식별자 인용은 Postgres `format('%I')` 가 DB 안에서 한다. JS 쪽 SQL 은 상수 하나라 태그드 `$executeRaw` 로 보낸다($executeRawUnsafe 아님)
 * - DB 가 비어 있으면(테이블 없음) 아무 일도 하지 않는다
 */
export async function resetTestDatabase(db: PrismaClient): Promise<void> {
  if (!isLocalDatabaseUrl(env.DATABASE_URL)) {
    throw new Error('resetTestDatabase refuses to run: DATABASE_URL is not a local database host')
  }
  await db.$executeRaw`
    DO $$
    DECLARE
      targets text;
    BEGIN
      SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
        INTO targets
        FROM pg_tables
       WHERE schemaname = 'public'
         AND tablename <> '_prisma_migrations';
      IF targets IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || targets || ' RESTART IDENTITY CASCADE';
      END IF;
    END
    $$;
  `
}
