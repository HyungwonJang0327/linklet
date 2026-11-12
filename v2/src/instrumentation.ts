// Next 16 instrumentation — register() 는 서버 인스턴스가 시작될 때 1회 호출되고, 요청을 받기 전에 끝나야 한다.
// 근거: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md,
//       01-app/02-guides/instrumentation.md ("부수 효과용 모듈은 register 안에서 동적 import", NEXT_RUNTIME 분기)
// 여기서 서버 환경변수 모듈을 로드해 스키마 검증에 실패하면 부팅이 실패한다 (FEATURES F01 — 기존 앱은 predeploy 스크립트만).
// 모듈 상단 import 가 아니라 register 안의 동적 import 인 이유: 문서 권장 + 빌드·edge 번들에서 평가되지 않게.

// 실패 시 process.exit(1): `next start` 는 register 가 throw 해도 프로세스가 살아 모든 요청에 500 을 내는 좀비가 된다
// (2026-11-12 실측). register 는 `next build`·Vitest 에서 호출되지 않으므로 빌드·테스트 프로세스를 죽일 일은 없다.
// 실패 내용(키 이름·code)은 env 모듈이 이미 한 줄 JSON 으로 기록했다 — 여기서는 값을 다시 출력하지 않는다.

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  try {
    await import('@/shared/config/env')
  } catch {
    console.error('{"level":"fatal","event":"env.boot_failed","note":"server will not start"}')
    process.exit(1)
  }
}
