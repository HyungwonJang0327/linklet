import { resolve } from 'node:path'

// Prisma CLI(prisma.config.ts)·DB 스크립트(scripts/)가 같은 순서로 .env 를 읽는다 — Prisma 7 은 .env 를 자동 로드하지 않는다.
// 새 의존성(dotenv) 없이 Node 24 내장 process.loadEnvFile 사용. 이미 process.env 에 있는 값은 덮지 않는다(셸 값 우선, Node 동작 확인 2026-11-14).
// 읽는 순서는 Next 와 같은 우선순위(.env.local > .env). 파일이 없으면 무시 — CI·Vercel 은 env 로 들어온다.
// 이 모듈은 값을 읽기만 하고 출력하지 않는다.

export const ENV_FILES: readonly string[] = ['.env.local', '.env']

/** `baseDir` 기준으로 .env.local → .env 를 로드한다. 실제로 읽은 파일 이름 목록을 돌려준다(값 아님) */
export function loadEnvFiles(baseDir: string): string[] {
  const loaded: string[] = []
  for (const file of ENV_FILES) {
    try {
      process.loadEnvFile(resolve(baseDir, file))
      loaded.push(file)
    } catch {
      // 파일 없음(ENOENT) — 무시
    }
  }
  return loaded
}
