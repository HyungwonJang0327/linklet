import { connect } from 'node:net'

// TCP 접속 가능 여부 프로브 — 테스트 DB 가 떠 있는지 확인하는 용도.
// vitest.global-setup.mts(마이그레이션 적용 전)와 src/server/db.integration.test.ts(skip 판정)가 공유한다.
// 접속만 열어 보고 바로 닫는다. 인증·쿼리 없음. 어떤 경우에도 throw 하지 않고 true/false 만 돌려준다.
// 근거: decisions/testing.md T5 — 로컬에서 DB 가 꺼져 있거나 CI 에 service container 가 없으면 통합 테스트만 건너뛴다.

export type TcpTarget = { host: string; port: number }

export const DEFAULT_PROBE_TIMEOUT_MS = 500

/** `host:port` 에 TCP 연결이 열리면 true. 거부·타임아웃·오류는 모두 false */
export function canConnect(
  { host, port }: TcpTarget,
  timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host, port })
    const done = (ok: boolean) => {
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(timeoutMs, () => done(false))
    socket.once('connect', () => done(true))
    socket.once('error', () => done(false))
  })
}
