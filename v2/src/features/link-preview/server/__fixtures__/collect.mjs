/**
 * 기존 앱 파서(`lib/services/url-metadata.ts`)를 네트워크 없이 fixture HTML 에 적용해
 * `*.expected.json` 을 생성한다. 실행 방법·fixture 표는 같은 폴더 README.md.
 *
 *   node v2/src/features/link-preview/server/__fixtures__/collect.mjs           # 생성
 *   node v2/src/features/link-preview/server/__fixtures__/collect.mjs --check   # 기존 JSON 과 비교만
 *
 * - 루트 리포 디렉터리에서 실행한다. 파서가 쓰는 cheerio 는 루트 node_modules 에서 해석된다
 * - Node 24 의 내장 타입 제거로 루트 `.ts` 를 그대로 import 한다 (tsx·ts-node 불필요)
 * - `.mjs` 인 이유: v2 tsconfig(`**\/*.ts`, `**\/*.mts`) 밖에 두어 루트 모듈 import 가
 *   v2 typecheck 를 깨지 않게 한다
 *
 * 가짜로 바꾼 것:
 * - `globalThis.fetch` — 파서가 유일하게 쓰는 네트워크 경로. fixture 첫 줄의
 *   `<!-- fixture-url: ... -->` 와 정확히 같은 URL 만 `200 text/html` 로 응답하고,
 *   그 외 URL 은 기록 후 throw 한다. 파서가 예외를 삼켜 `success:false` 로 바꾸므로
 *   기록된 미등록 요청이 하나라도 있으면 스크립트가 종료 코드 1 로 실패한다
 * - og:image 다운로드·S3 업로드(`downloadAndUploadToS3`)는 `app/api/metadata/route.ts` 에서
 *   호출되며 파서 모듈 밖이라 import 하지 않는다 (대체 불필요)
 *
 * 환경 의존 값: 파서 출력에 타임스탬프·랜덤 값이 없다. 재시도 대기(1s·2s)는 결과에 남지 않는다.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const parserPath = join(
  here,
  '..',
  '..',
  '..',
  '..',
  '..',
  '..',
  'lib',
  'services',
  'url-metadata.ts',
)
const checkOnly = process.argv.includes('--check')

/** @type {Map<string, string>} fixture URL → HTML */
const htmlByUrl = new Map()
/** @type {string[]} 가짜 fetch 가 응답한 URL 순서 (재시도 횟수 확인용) */
const servedLog = []
/** @type {string[]} 미등록 URL 요청 — 하나라도 있으면 실패 */
const unknownRequests = []

globalThis.fetch = async (input) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const html = htmlByUrl.get(url)
  if (html === undefined) {
    unknownRequests.push(url)
    throw new Error(`[collect] network blocked: ${url}`)
  }
  servedLog.push(url)
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

// 가드 자가 확인 — 미등록 URL 이 실제로 차단되는지 매 실행마다 검사한다
const probe = 'https://unregistered.example-shop.test/probe'
let probeBlocked = false
try {
  await fetch(probe)
} catch {
  probeBlocked = true
}
if (!probeBlocked || unknownRequests.pop() !== probe) {
  console.error('[collect] fetch guard self-test failed')
  process.exit(1)
}

const { extractUrlMetadata } = await import(pathToFileURL(parserPath).href)

const htmlFiles = (await readdir(here)).filter((f) => f.endsWith('.html')).sort()
if (htmlFiles.length === 0) {
  console.error('[collect] no *.html fixtures found')
  process.exit(1)
}

const fixtures = []
for (const file of htmlFiles) {
  const html = await readFile(join(here, file), 'utf8')
  const match = html.match(/^<!--\s*fixture-url:\s*(\S+)\s*-->/)
  if (!match) {
    console.error(`[collect] ${file}: first line must be <!-- fixture-url: https://... -->`)
    process.exit(1)
  }
  const url = match[1]
  if (htmlByUrl.has(url)) {
    console.error(`[collect] ${file}: duplicate fixture-url ${url}`)
    process.exit(1)
  }
  htmlByUrl.set(url, html)
  fixtures.push({ name: basename(file, '.html'), url })
}

let mismatches = 0
for (const { name, url } of fixtures) {
  const servedBefore = servedLog.length
  const result = await extractUrlMetadata(url)
  const fetchCount = servedLog.length - servedBefore
  // JSON.stringify 는 undefined 필드를 생략한다 — 기존 API 응답(NextResponse.json)과 같은 형태
  const json = JSON.stringify(result, null, 2) + '\n'
  const outPath = join(here, `${name}.expected.json`)

  if (checkOnly) {
    const current = await readFile(outPath, 'utf8').catch(() => null)
    const same = current === json
    if (!same) mismatches += 1
    console.log(`${same ? 'same' : 'DIFF'}  ${name} (fetch ${fetchCount}회)`)
  } else {
    await writeFile(outPath, json)
    console.log(`wrote ${name}.expected.json (fetch ${fetchCount}회)`)
  }
}

if (unknownRequests.length > 0) {
  console.error('[collect] unexpected network requests:', unknownRequests)
  process.exit(1)
}
if (mismatches > 0) {
  console.error(`[collect] ${mismatches} fixture(s) differ from expected JSON`)
  process.exit(1)
}
