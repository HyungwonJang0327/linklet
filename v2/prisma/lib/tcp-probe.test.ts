import { createServer, type AddressInfo, type Server } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'

import { canConnect } from './tcp-probe.mts'

// TCP 프로브 — 열린 포트는 true, 닫힌 포트는 false, 어느 쪽도 throw 하지 않는다.
// 임시 서버를 127.0.0.1 의 임의 포트(0)에 띄워 실제 소켓으로 확인한다. DB 는 쓰지 않는다

function listen(): Promise<Server> {
  return new Promise((resolve) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function close(server: Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()))
}

describe('canConnect', () => {
  let server: Server | undefined

  afterEach(async () => {
    if (server) await close(server)
    server = undefined
  })

  it('열려 있는 포트 → true', async () => {
    server = await listen()
    const { port } = server.address() as AddressInfo
    await expect(canConnect({ host: '127.0.0.1', port })).resolves.toBe(true)
  })

  it('닫힌 포트 → false (throw 하지 않는다)', async () => {
    server = await listen()
    const { port } = server.address() as AddressInfo
    await close(server)
    server = undefined
    await expect(canConnect({ host: '127.0.0.1', port })).resolves.toBe(false)
  })

  it('해석 불가 호스트 → false', async () => {
    await expect(canConnect({ host: 'nonexistent.invalid', port: 5434 })).resolves.toBe(false)
  })
})
