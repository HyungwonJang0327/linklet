#!/usr/bin/env node
/**
 * 기존 앱(루트) 기준선 실행용 env 래퍼 (decisions/testing.md T8, audit/BASELINE.md §6)
 *
 * 사용: (루트 cwd에서) node v2/e2e/baseline/with-baseline-env.mjs <명령> [인자...]
 *      node v2/e2e/baseline/with-baseline-env.mjs --check   # 명령 없이 검사만
 *
 * 하는 일
 *  1. 기존 앱이 쓰는 env 키 전부(check-env.js 필수 13개 + 코드 참조 키 + 루트 .env* 파일의 키 이름)를
 *     로컬·더미 값으로 덮어쓴다. 값은 읽지 않고 키 이름만 수집한다.
 *  2. `next build/start` 가 .env.production/.env.development 를 자동 로드하므로, Next 자체 로더(@next/env)로
 *     두 모드를 모두 로드해 "파일에서 적용된 키"가 하나라도 있으면 중단한다 (운영·dev 값 혼입 방지).
 *  3. 최종 env 에서 DATABASE_URL 이 로컬 기준선 컨테이너(localhost:54329)이고, 어떤 값에도 원격 DB 호스트
 *     문자열이 없음을 확인한다. 값은 절대 출력하지 않는다 (키 이름만).
 *  4. 통과하면 명령을 그 env 로 실행하고, 종료 신호를 자식에게 전달한다.
 *
 * 루트 Node 만 사용(ESM), 의존성 추가 없음. 접속 정보 기본값은 docker-compose.baseline.yml · lib.sh 와 같다.
 */
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..', '..')
// 루트(기존 앱)의 node_modules 에서 패키지를 해석한다 — v2 가 아니라 기존 앱의 @next/env 를 써야 한다
const rootRequire = createRequire(path.join(ROOT_DIR, 'package.json'))

// --- 기준선 DB 접속 정보 (로컬 더미 고정값) ---------------------------------------------------
const DB_HOST = process.env.BASELINE_DB_HOST || 'localhost'
const DB_PORT = process.env.BASELINE_DB_PORT || '54329'
const DB_USER = process.env.BASELINE_DB_USER || 'baseline'
const DB_PASSWORD = process.env.BASELINE_DB_PASSWORD || 'baseline'
const DB_NAME = process.env.BASELINE_DB_NAME || 'linklet_baseline'
const APP_PORT = process.env.BASELINE_APP_PORT || '3001'
const APP_URL = `http://localhost:${APP_PORT}`

// 가드가 허용하는 유일한 DB 위치. 이 값과 다르면 어떤 명령도 실행하지 않는다
const ALLOWED_DB_HOSTS = ['localhost', '127.0.0.1']
const ALLOWED_DB_PORT = '54329'

const localDbUrl = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`

// --- 덮어쓸 키 ------------------------------------------------------------------------------
// scripts/check-env.js 의 필수 13개 — 전부 포함돼야 한다
const REQUIRED_KEYS = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AMPLIFY_BUCKET',
  'REVALIDATE_SECRET_TOKEN',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_APP_NAME',
]

// 코드(app/lib/components)에서 process.env.* 로 참조하지만 .env 파일에 없을 수 있는 키
const CODE_REFERENCED_KEYS = ['NEXT_PUBLIC_KAKAO_CLIENT_ID', 'NEXT_PUBLIC_KAKAO_REDIRECT_URI']

// 부모 셸에서 넘어오면 기존 앱 동작을 바꾸는 키 — 자식 env 에서 제거한다
const STRIP_KEYS = ['VERCEL_URL', 'VERCEL_ENV', 'VERCEL', '__NEXT_PROCESSED_ENV']

const DUMMY = 'baseline-dummy'
// NextAuth 시크릿은 32자 이상 요구 — 반복 문자열이라 엔트로피가 낮고 실제 시크릿과 혼동되지 않는다
const DUMMY_SECRET = `${DUMMY}-`.repeat(3)

/** 키 이름별 고정 더미 값. 여기 없는 키는 DUMMY 로 채운다 */
const FIXED_VALUES = {
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
  CHECKPOINT_DISABLE: '1', // Prisma CLI 업데이트 확인 끔
  DATABASE_URL: localDbUrl,
  DATABASE_URL_UNPOOLED: localDbUrl,
  POSTGRES_URL: localDbUrl,
  POSTGRES_PRISMA_URL: localDbUrl,
  POSTGRES_URL_NON_POOLING: localDbUrl,
  POSTGRES_URL_NO_SSL: localDbUrl,
  POSTGRES_HOST: DB_HOST,
  POSTGRES_USER: DB_USER,
  POSTGRES_PASSWORD: DB_PASSWORD,
  POSTGRES_DATABASE: DB_NAME,
  PGHOST: DB_HOST,
  PGHOST_UNPOOLED: DB_HOST,
  PGUSER: DB_USER,
  PGPASSWORD: DB_PASSWORD,
  PGDATABASE: DB_NAME,
  NEXTAUTH_URL: APP_URL,
  NEXT_PUBLIC_APP_URL: APP_URL,
  NEXT_PUBLIC_APP_NAME: 'Linklet (baseline)',
  NEXTAUTH_SECRET: DUMMY_SECRET,
  REVALIDATE_SECRET_TOKEN: DUMMY_SECRET,
  AWS_REGION: 'ap-northeast-2',
  NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-BASELINE0',
}

// 최종 env 어느 값에도 있으면 안 되는 원격 호스트 문자열 (운영·dev DB·스토리지)
const REMOTE_HOST_PATTERNS = [
  /neon\.tech/i,
  /amazonaws\.com/i,
  /vercel-storage\.com/i,
  /supabase\.co/i,
]
const DB_URL_PATTERN = /^postgres(?:ql)?:\/\/(?:[^@/]*@)?([^:/?#]+)(?::(\d+))?\//i

// --- 도우미 -----------------------------------------------------------------------------------
function fail(message, exitCode = 2) {
  process.stderr.write(`[baseline-env] 중단: ${message}\n`)
  process.exit(exitCode)
}

/** 루트의 .env* 파일에서 키 이름만 수집한다. 값은 읽지 않는다 */
function collectEnvFileKeys(rootDir) {
  const keys = new Set()
  const files = fs.readdirSync(rootDir).filter((f) => f.startsWith('.env'))
  const keyLine = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/
  for (const file of files) {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const match = keyLine.exec(line)
      if (match) keys.add(match[1])
    }
  }
  return { files, keys }
}

/** 접속 문자열이 로컬 기준선 컨테이너를 가리키는지 (값은 반환하지 않는다) */
function isLocalBaselineDbUrl(value) {
  const match = DB_URL_PATTERN.exec(value)
  if (!match) return false
  const host = match[1]
  const port = match[2] || '5432'
  return ALLOWED_DB_HOSTS.includes(host) && port === ALLOWED_DB_PORT
}

// --- 1. 덮어쓰기 ------------------------------------------------------------------------------
const { files: envFiles, keys: envFileKeys } = collectEnvFileKeys(ROOT_DIR)
const keysToOverride = new Set([
  ...REQUIRED_KEYS,
  ...CODE_REFERENCED_KEYS,
  ...envFileKeys,
  ...Object.keys(FIXED_VALUES),
])

const overrides = {}
for (const key of keysToOverride) {
  overrides[key] = Object.prototype.hasOwnProperty.call(FIXED_VALUES, key)
    ? FIXED_VALUES[key]
    : DUMMY
}

for (const key of STRIP_KEYS) delete process.env[key]
Object.assign(process.env, overrides)

// --- 2. Next 로더로 혼입 검사 ----------------------------------------------------------------
// @next/env 는 이미 process.env 에 있는 키를 덮지 않고, 파일에서 실제로 적용한 키만 parsedEnv 로 돌려준다.
// production·development 두 모드 모두 로드해 parsedEnv 가 비어 있어야 한다.
let loadEnvConfig
try {
  ;({ loadEnvConfig } = rootRequire('@next/env'))
} catch {
  fail('루트 node_modules 에 @next/env 가 없습니다. 루트에서 `npm ci` 를 먼저 실행하세요.')
}

const silent = { info() {}, error() {} }
const leaked = new Set()
const fileKeysByNextLoader = new Set()
for (const dev of [false, true]) {
  const { parsedEnv, loadedEnvFiles } = loadEnvConfig(ROOT_DIR, dev, silent, true)
  for (const key of Object.keys(parsedEnv || {})) leaked.add(key)
  for (const loaded of loadedEnvFiles)
    for (const key of Object.keys(loaded.env || {})) fileKeysByNextLoader.add(key)
}
delete process.env.__NEXT_PROCESSED_ENV

const notOverridden = [...fileKeysByNextLoader].filter((k) => !(k in overrides))
if (notOverridden.length > 0) {
  fail(`.env 파일의 키 중 래퍼가 덮지 못한 키가 있습니다: ${notOverridden.join(', ')}`)
}
if (leaked.size > 0) {
  fail(`.env 파일 값이 프로세스 env 에 적용됐습니다 (운영·dev 값 혼입): ${[...leaked].join(', ')}`)
}

// --- 3. 최종 env 검사 (값 출력 없음) ----------------------------------------------------------
if (!isLocalBaselineDbUrl(process.env.DATABASE_URL || '')) {
  fail(
    `DATABASE_URL 이 기준선 컨테이너(${ALLOWED_DB_HOSTS.join('|')}:${ALLOWED_DB_PORT})를 가리키지 않습니다. ` +
      'db push 등 어떤 명령도 실행하지 않습니다.',
  )
}
for (const [key, value] of Object.entries(process.env)) {
  if (typeof value !== 'string') continue
  if (REMOTE_HOST_PATTERNS.some((re) => re.test(value))) {
    fail(`env 값에 원격 호스트 문자열이 있습니다: ${key}`)
  }
  if (DB_URL_PATTERN.test(value) && !isLocalBaselineDbUrl(value)) {
    fail(`env 값에 기준선 컨테이너가 아닌 DB 접속 문자열이 있습니다: ${key}`)
  }
}

// --- 4. 실행 ----------------------------------------------------------------------------------
const argv = process.argv.slice(2)
if (argv.length === 0 || argv[0] === '--check') {
  process.stdout.write(
    `[baseline-env] 검사 통과 — .env 파일 ${envFiles.length}개, 덮어쓴 키 ${Object.keys(overrides).length}개, ` +
      `DATABASE_URL → ${DB_HOST}:${DB_PORT}/${DB_NAME}\n`,
  )
  process.exit(0)
}

const [command, ...args] = argv
const child = spawn(command, args, { cwd: ROOT_DIR, stdio: 'inherit', env: process.env })

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal)
  })
}
child.on('error', (error) => fail(`명령 실행 실패 (${command}): ${error.message}`, 1))
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})
