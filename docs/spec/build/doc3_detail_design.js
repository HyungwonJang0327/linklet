const L = require('./lib'); const { DATA, run, p, h1, h2, h3, bullet, numbered, note, code, table, kv, pageBreak } = L
const DET = require('./detail.js')
const S = []
const FR = Object.fromEntries(DATA.FR.map(r => [r[0], r]))
const apisFor = id => DATA.APIS.filter(a => a[8].split(' ').includes(id))
const screensFor = id => DATA.SCREENS.filter(s => s[8].split(' ').includes(id))

S.push(h1('1. 문서 목적과 읽는 법'))
S.push(p('이 문서는 기본설계서의 구조를 기능(FEATURES 행) 단위로 구현 가능한 수준까지 구체화한다. 2장은 모든 기능이 공유하는 규약·공통 모듈이고, 3~10장은 영역별로 기능 하나가 한 절이다. 각 절은 같은 틀을 따른다.'))
S.push(table(['항목', '내용'], [
  ['개요', '처분·Phase·상태, 요구사항 요약, 수용 기준(동등성 확인), 근거, 관련 화면·API·테이블'],
  ['처리 흐름', '사용자 동작 → 클라이언트 → API → 서비스 → DB 순서의 단계'],
  ['입출력', '요청·응답 형태, 스키마, DTO'],
  ['규칙', '검증·권한·상한·상태 전이·UX 규칙'],
  ['예외', '발생하는 에러 코드와 처리'],
  ['테스트', '동등성 확인에 쓰는 테스트(존재하면 파일명)'],
  ['이식 시 확정', '아직 결정되지 않아 이식 작업 시작 때 정할 항목. 비어 있으면 결정 완료'],
], [1, 4.5]))
S.push(note('기준: 2026-11-22 v2 코드 + decisions/. Phase 1(기반)은 구현 기준으로 완전하고, Phase 2 이후는 결정된 범위까지 적고 나머지는 "이식 시 확정"에 모았다. 부속 Excel(Linklet_v2_설계명세.xlsx)과 ID(F·S·A)가 같다.'))

S.push(h1('2. 공통 상세'))
S.push(h2('2.1 데이터 규약'))
S.push(table(['항목', '규약'], [
  ['PK', 'id String @id @default(uuid(7)) @db.Uuid — 시간순 정렬, 16바이트. Better Auth 는 generateId:false'],
  ['FK', '@db.Uuid, onDelete: Cascade'],
  ['시간', 'DateTime @db.Timestamptz(3) UTC. createdAt now(), updatedAt @updatedAt. 직렬화 ISO 8601, 표시 변환은 프론트'],
  ['이름', '테이블 snake_case 복수형(@@map), 컬럼 camelCase, 상태·구분은 소문자 영어 enum'],
  ['문자열·길이', 'text. 길이·형식 제한은 Zod(features/*/schema.ts) 한 곳'],
  ['금액', 'price Decimal(14,2) + currency Char(3) ISO 4217 쌍. 미확정이면 둘 다 null'],
  ['생성기', 'prisma-client, output src/generated/prisma(미커밋, postinstall generate), nodejs, ESM'],
], [1, 4]))
S.push(h3('Enum'))
S.push(table(['Enum', '값', '용도'], DATA.ENUMS, [1.3, 2.4, 2]))
S.push(h2('2.2 API 공통 처리'))
S.push(numbered('Route Handler 는 createHandler(fn) 로 감싼다. requestId 는 서버가 생성(클라이언트 헤더 신뢰 안 함)'))
S.push(numbered('body·query·params 를 Zod(zod/mini) 로 파싱 → 실패 400 VALIDATION_FAILED + details[{ path, code }]'))
S.push(numbered('세션에서 요청자 { userId, role } | null 을 뽑아 서비스에 넘긴다. 판정은 서비스가 한다'))
S.push(numbered('성공: ok(data) 200/201, list(data, nextCursor) 200, noContent() 204. { data } / { data, nextCursor } 외 형태 없음'))
S.push(numbered('AppError(code, details?) → 코드 표 status + 고정 message. 로그 없음'))
S.push(numbered('그 외 예외 → 500 INTERNAL + logger.error(허용 목록 키, redact) + Sentry(연결 후)'))
S.push(h3('DTO 원칙'))
S.push(bullet('요청 타입은 z.infer(…Input), 응답은 …Dto. DB 타입 손 복제 금지. 목록은 항상 배열, 값 없는 필드는 null, 날짜 ISO, Decimal 은 문자열'))
S.push(bullet('공개 DTO(공유 페이지)는 select 를 명시하고 email·userId·내부 플래그를 넣지 않는다'))
S.push(h3('에러 코드'))
S.push(table(['code', 'HTTP', '의미', '재시도', '사용자 문구(ko) errors.{CODE}'], DATA.ERRORS.map(e => [e[0], String(e[1]), e[2], e[3], e[4]]), [1.3, 0.5, 2, 0.5, 3.2], { fontSize: 15 }))
S.push(h2('2.3 화면 공통'))
S.push(table(['항목', '상세'], [
  ['접근성 기준선', '키보드 전 동작, 클릭 요소는 button·a, focus-visible 링, 대비 4.5:1(공유 페이지 포함), 폼 라벨, aria-invalid+describedby, 모달 role=dialog·aria-modal·포커스 가두기·Esc·복귀(Radix Dialog 만), 이미지 alt, 아이콘 버튼 aria-label, <html lang>'],
  ['4상태', '목록·상세는 로딩(스켈레톤)·비어 있음(다음 행동 + 예시)·에러(errors.{CODE} + 다시 시도)·정상 을 같은 작업에서. 이탈 시 요청 취소(signal), 제출 중 중복 방지'],
  ['Topbar', '56px. 워드마크 <a>. 로그인 시 데스크톱 "위시리스트·설정" 링크 + 아바타 버튼(44px, aria-label → /settings). 모바일은 워드마크 + 아바타'],
  ['하단 고정 버튼', '모바일 주된 행동 1개. --control-h 48px, safe-area, 콘텐츠 하단 패딩'],
  ['카드(위시리스트)', '전체 <a>. 제목(text-title), 아이템 수, 카테고리 칩(미선택 시 칩·구분점 없음), 비공개만 자물쇠'],
  ['카드(아이템)', '이미지(alt=제목, 없으면 자리표시자), 제목, 가격(Intl 포맷, 프론트), 받음 배지(밝은 테두리, aria-label 포함), 더보기 메뉴'],
  ['시트·Dialog', '모바일 하단 시트, 데스크톱 중앙 Dialog. 열릴 때 첫 입력 포커스, 닫힌 뒤 트리거 복귀'],
  ['폼 오류', 'details[].path 로 필드 옆, 해결 방법 포함 문구'],
  ['토스트', '3초, role=status, 삭제 직후 "실행 취소"'],
  ['문구', '사전 키로만(세 언어 동시 추가). enum 표시는 i18n-keys 매핑'],
  ['스타일', '토큰 유틸리티만(bg-page·text-fg·border-line·rounded-btn·shadow-card·text-* 13종). 원색·dark: 금지(빌드·린트로 차단)'],
], [1.2, 4.3]))
S.push(h2('2.4 공통 모듈'))
S.push(table(['모듈', '파일', '동작', '상태'], [
  ['환경변수', 'shared/config/env.ts · env.client.ts · env-failure.ts · instrumentation.ts', 'Zod 부팅 검증, 실패 시 키 이름만 출력 후 종료. production 교차 검증(https·sslmode·origin)', '구현'],
  ['DB', 'server/db.ts · db-config.ts', 'PrismaClient 1개(globalThis 캐시) + adapter-pg(pooled). production sslmode 없으면 throw. server-only', '구현'],
  ['API 공통', 'shared/lib/api-error.ts · api-response.ts · server/api-handler.ts', 'ERROR_CODE_TABLE 10종, AppError, isRetryable, ok/list/noContent, createHandler', '구현'],
  ['검증 조각', 'shared/lib/validation.ts', 'http(s) URL 등 공통 Zod 조각(zod/mini)', '구현(일부)'],
  ['로그', 'server/logger.ts · shared/lib/log-format.ts · redact.ts', 'JSON 한 줄, 허용 목록 키, 전 문자열 redact(접속 문자열·userinfo·JWT·Bearer/Basic·Cookie·민감어·이메일·URL 쿼리·32자+ 토큰). 절대 throw 안 함', '구현'],
  ['i18n', 'shared/i18n/* · dictionaries/{ko,en,ja}.ts', 'LOCALES·isLocale, Dictionary/DictionaryKey, createT·t, errorMessageKey, negotiateLocale, getDictionary, I18nProvider·useT·useLocale', '구현(기반 키)'],
  ['루트 리다이렉트', 'proxy.ts', '/ → 307 /{locale}, Vary. F09 에서 보호 구간 추가', '구현(F05)'],
  ['root layout', 'app/[locale]/layout.tsx', 'generateStaticParams 3, dynamicParams=false, metadata, <html lang data-skin data-mode>, MODE_SCRIPT, I18nProvider, Topbar', '구현'],
  ['모드 스크립트', 'shared/ui/mode-script.ts', '첫 페인트 전 data-mode(저장값 없으면 matchMedia)', '구현(기반)'],
  ['토큰·Tailwind', 'app/tokens.css · globals.css', '@theme initial 비움, inline reference 매핑, @utility text-* 13, dark 변형, color-scheme. 동일성·컴파일 테스트', '구현'],
  ['에러 경계', 'app/global-error · global-not-found · [locale]/{error,not-found} · shared/ui/{empty-state,multilingual-lines}', 'E4 구현 결정. E2E 전용 [locale]/e2e/{throw,not-found}', '구현'],
  ['테스트 DB', 'server/test-db.ts · prisma/lib/* · vitest.setup.ts · vitest.global-setup.mts', 'resetTestDatabase 3중 가드 TRUNCATE, DATABASE_URL 덮기, migrate deploy 자동, LINKLET_REQUIRE_TEST_DB', '구현'],
  ['마이그레이션 래퍼', 'scripts/db-migrate.mts · prisma.config.ts', '4단계(diff→dev→down.sql→generate), 임시 섀도 DB, 로컬 가드(M6, ?host= 거부)', '구현'],
  ['safe-fetch', 'shared/lib/safe-fetch.ts', 'F11 참조', '예정'],
  ['레이트 리밋', 'shared/lib/rate-limit.ts', 'F12 참조', '예정'],
  ['인증', 'server/auth.ts', 'F08 참조', '예정'],
  ['저장소', 'server/storage.ts', 'F20 참조', '예정'],
  ['fetch 클라이언트', 'shared/lib/api-client.ts', '{ data }/{ error } 파싱 → ApiError(code, details), signal 전달. F13 에서', '예정'],
  ['상한 상수', 'shared/lib/limits.ts', 'WISHLIST_LIMIT 20 · ITEM_LIMIT 100. F39', '예정'],
], [1, 1.8, 3.2, 0.7], { fontSize: 15 }))
S.push(h2('2.5 권한 판정표 (F10 요약)'))
S.push(table(['동작', '비로그인', '본인', '타인·관리자', 'FEATURES'], DATA.PERMS, [1.8, 1, 2, 1.4, 0.8], { fontSize: 15 }))
S.push(h2('2.6 환경변수'))
S.push(table(['키', '노출', '필수', '설명', '상태'], DATA.ENVS, [2.2, 0.7, 0.9, 3, 0.9], { fontSize: 15 }))

// ------------------------------------------------------------- 기능별 장
const CHAPTERS = [
  ['기반', ['F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'I01', 'I02', 'I03'], '모든 기능이 기대는 공통 뼈대. Phase 1. 대부분 구현 완료'],
  ['인증', ['F08', 'F09', 'F10'], 'Better Auth 로그인, 라우트 보호, 서비스 계층 권한 판정. Phase 2. 사용자 선행: Google OAuth 리디렉션 URI'],
  ['링크 미리보기', ['F11', 'F12', 'F18'], '외부 URL 안전 fetch, 레이트 리밋, 메타데이터 파서. Phase 3. security-reviewer 검토 필수'],
  ['위시리스트', ['F13', 'F14', 'F15', 'F16', 'F17', 'F39'], '목록·생성 3분 흐름·공개·카테고리·편집·상한. Phase 4'],
  ['아이템', ['F19', 'F20', 'F21', 'F22'], '추가·업로드·수정·순서. Phase 4. 사용자 선행: Cloudflare R2'],
  ['공유', ['F23', 'F24', 'F25', 'F26'], '공유 URL·서버 렌더 공유 페이지·복사·GA. Phase 5 + 첫 배포'],
  ['꾸미기·설정', ['F27', 'F28', 'F29', 'F30', 'F31', 'F32'], '프리셋, 프로필, 화면 설정, 문의, 공지, 세션. Phase 6'],
  ['관리자', ['F33', 'F34', 'F35', 'F36', 'F37'], '접근 제어, 공지·문의 관리, 사용자 목록, 숫자 3개. Phase 7'],
]
const TABLE_OWNER = { F02: ['users', 'wishlists', 'wishlist_items', 'notices', 'inquiries'], F08: ['sessions', 'accounts', 'verifications'] }
let ch = 3
for (const [name, ids, intro] of CHAPTERS) {
  S.push(pageBreak())
  S.push(h1(`${ch}. ${name}`))
  S.push(p(intro))
  S.push(table(['ID', '기능', '처분', 'Phase', '상태'], ids.map(id => [id, FR[id][2], FR[id][3], String(FR[id][6]), FR[id][8]]), [0.6, 2.4, 0.8, 0.6, 1.6]))
  ids.forEach((id, i) => {
    const r = FR[id], d = DET[id]
    S.push(h2(`${ch}.${i + 1} ${id} ${r[2]}`))
    S.push(kv([
      ['처분 · Phase · 상태', `${r[3]} · Phase ${r[6]} (이식 순서 ${r[7]}) · ${r[8]}`],
      ['요구사항', r[4]], ['수용 기준', r[5]], ['근거', r[12]],
      ['관련 화면 / API / 테이블', `${r[9]} / ${r[10]} / ${r[11]}`],
    ], [1.2, 4.3]))
    S.push(h3('처리 흐름')); d.flow.forEach(t => S.push(numbered(t, 'numbers')))
    S.push(h3('입출력')); d.io.forEach(t => S.push(bullet(t)))
    const apis = apisFor(id)
    if (apis.length) S.push(table(['API', '메서드', '경로', '요청', '성공 응답', '에러'], apis.map(a => [a[0], a[1], a[2], a[5], a[6], a[7]]), [0.5, 0.9, 1.6, 2, 1.8, 1.4], { fontSize: 15 }))
    const scr = screensFor(id)
    if (scr.length) S.push(table(['화면', '경로', '주요 구성', '4상태·진행 중', 'CTA'], scr.map(s => [`${s[0]} ${s[1]}`, s[2], s[4], s[5], s[6]]), [1.1, 1.3, 3, 1.6, 1.2], { fontSize: 15 }))
    if (TABLE_OWNER[id]) {
      S.push(h3('테이블 정의'))
      for (const tn of TABLE_OWNER[id]) {
        const t = DATA.TABLES.find(x => x.name === tn)
        S.push(p([run(`${t.name} (${t.model}) — ${t.desc} — ${t.status}`, { bold: true })]))
        S.push(table(['컬럼', '타입', 'NULL', '기본값', '설명'], t.cols, [1.6, 1.3, 0.5, 1, 3], { fontSize: 15 }))
        S.push(p([run('키·인덱스: ', { bold: true }), run(t.idx.join(', ')), run('    관계: ', { bold: true }), run(t.rel.join(', ') || '—')]))
      }
    }
    S.push(h3('규칙')); d.rules.forEach(t => S.push(bullet(t)))
    S.push(h3('예외')); d.errors.forEach(t => S.push(bullet(t)))
    S.push(h3('테스트')); d.tests.forEach(t => S.push(bullet(t)))
    S.push(h3('이식 시 확정'))
    if (d.open.length) d.open.forEach(t => S.push(bullet(t))); else S.push(p('없음 — 결정 완료', { run: { italics: true, color: '595959' } }))
  })
  ch++
}

S.push(pageBreak())
S.push(h1(`${ch}. 주요 시퀀스`))
S.push(h2(`${ch}.1 로그인 (F08·F09)`))
S.push(...code(`S02 로그인 버튼 → /api/auth/sign-in/social (Better Auth) → Google 동의 → /api/auth/callback/google
→ users upsert(UUID v7, generateId:false) · accounts · sessions insert · 쿠키(https 면 Secure) → 302 /{locale}/wishlists (S03)
proxy.ts: (app)·admin 요청에 세션 쿠키 없으면 302 /{locale}/login. 페이지·API 는 서버에서 세션 재확인`))
S.push(h2(`${ch}.2 위시리스트 생성 3분 흐름 (F14·F19·F39·F25)`))
S.push(...code(`S04 ① 제목 → ② 링크 붙여 넣기
   클라이언트: URL 즉시 검사(http/https) → POST /api/link-previews { url }
   서버: 세션 → Zod → safe-fetch(DNS·IP·리다이렉트·크기·시간) → 파서 → { title, imageUrl, price, currency, siteName }
   실패(502 UPSTREAM_FAILED): 미리보기 카드에 "직접 입력" 안내, 흐름은 계속
   → 반복 가능 → ③ 만들기: POST /api/wishlists { title, items[] }
   서버: service — 위시리스트 수 < 20 (아니면 422), items ≤ 100, 트랜잭션으로 wishlist + items, shareId 자동
   → 201 → 완료 화면: {APP_URL}/w/{shareId} + "링크 복사하기"(clipboard) + 토스트 → S05`))
S.push(h2(`${ch}.3 공유 페이지 렌더 (F23·F24)`))
S.push(...code(`GET /w/{shareId} (비로그인, 크롤러 포함)
app/w/[id]/page.tsx (Server Component): service.getPublic(shareId)
  → repository findUnique({ where:{ shareId }, select: 공개용 }) → 없음·isPublic=false → notFound()
  → generateMetadata: title·description·og:title·og:image·og:url, <html lang>=Accept-Language
  → .share[data-preset=소유자 프리셋] (보는 사람 스킨·모드 미적용) → GA page_view(측정 ID 있을 때)`))
S.push(h2(`${ch}.4 아이템 변경과 공유 페이지 갱신 (F21)`))
S.push(...code(`S05 받음 토글 → 낙관적 업데이트 → PATCH /api/items/{id} { isReceived }
서버: service — item.wishlist.userId == 요청자 (아니면 404) → update → revalidatePath('/w/{shareId}')
실패 → 캐시 롤백 + 토스트(errors.{CODE}). 진행 중 같은 버튼 비활성`))
S.push(h2(`${ch}.5 요청 실패 처리`))
S.push(...code(`fetch 클라이언트: 응답 { error } → ApiError(code, details) throw
TanStack Query: retry = isRetryable(code) (RATE_LIMITED·UPSTREAM_FAILED·INTERNAL·UNAVAILABLE 만)
컴포넌트: 4상태 에러 → t(errorMessageKey(code)) + 다시 시도. 검증 실패는 details.path 로 필드 옆`))
ch++

S.push(h1(`${ch}. 테스트·운영`))
S.push(h2(`${ch}.1 현재 테스트 자산 (2026-11-22)`))
S.push(table(['종류', '파일·범위', '건수'], [
  ['단위·통합(Vitest)', 'src/**/*.test.ts, prisma/lib/**/*.test.ts — env·db-config·api-handler·api-error·api-response·validation·redact·log-format·logger·i18n(8)·tokens·globals·mode-script·empty-state·multilingual-lines·test-db·health(단위+통합)·db(통합)', '31 파일 463건, 커버리지 98.8%(T4 대상)'],
  ['E2E(Playwright 3002)', 'e2e/layout(5) · locale-redirect(9) · error-boundaries(11)', '25건'],
  ['기준선 E2E(기존 앱, 로컬만)', 'e2e/baseline — 비로그인 12 + 로그인 16', '31건'],
  ['파서 정답 fixture', 'features/link-preview/server/__fixtures__ 12쌍', 'F18 기준'],
], [1.3, 3.5, 1.2]))
S.push(h2(`${ch}.2 테스트 규칙`))
S.push(bullet('T4 커버리지 80%: shared/lib/**, features/*/schema.ts, features/*/server/service.ts. CI 미달 시 실패'))
S.push(bullet('통합은 실제 로컬 Postgres. beforeEach resetTestDatabase. 시드 의존 없음'))
S.push(bullet('통합 파일 간 격리: 테이블을 읽고 쓰는 첫 통합 파일(F08·F10) 전에 직렬 실행 방식 결정'))
S.push(bullet('E2E 인증은 세션 주입. DB 가 필요한 E2E(F13 이후)의 시드 DB 연결 방식은 F13 전 결정'))
S.push(bullet('공개 응답 테스트는 이메일 부재를, 로그 테스트는 개인정보 패턴 부재를 명시적으로 확인'))
S.push(h2(`${ch}.3 로컬 개발`))
S.push(...code(`git config core.hooksPath .githooks && brew install gitleaks
cd v2 && pnpm install --frozen-lockfile
pnpm db:up              # Docker Postgres dev 5433 · test 5434
pnpm db:migrate {name}  # 스키마 변경 시: 마이그레이션 + down.sql + generate
pnpm db:seed            # 개발 시드 (로컬 가드)
pnpm dev                # http://localhost:3000 → /ko
pnpm lint · format:check · typecheck · test · test:coverage · test:e2e`))
S.push(h2(`${ch}.4 마이그레이션 적용·롤백`))
S.push(numbered('로컬 Docker → CI(빈 DB 전체 적용) → dev → 운영 순. 운영은 사용자가 LINKLET_ALLOW_REMOTE_DB=1 을 셸에 붙여 prisma migrate deploy 직접 실행'))
S.push(numbered('롤백: prisma db execute --file down.sql → _prisma_migrations 해당 행 삭제(migrate resolve --rolled-back 은 실패 상태 전용)'))
S.push(h2(`${ch}.5 첫 배포(Phase 5)·교체(Phase 8)`))
S.push(numbered('사용자: Neon v2 DB, Vercel 프로젝트(v2/ 루트, Node 24), 환경변수, WAF 규칙(/api/link-previews), R2, Sentry DSN, OAuth URI'))
S.push(numbered('운영 migrate deploy → Vercel 빌드(postinstall generate, DB 미접속) → /api/health 200 → 공유 링크 카카오톡·슬랙 미리보기 → Lighthouse'))
S.push(numbered('교체 조건: FEATURES 유지·개선 전부 동등성 확인, AUDIT high 12 해결/기록, audit 0, README 전후 비교 → v2/ 를 루트로, 기존 코드·기준선 E2E 일괄 제거, S3 버킷·AWS 키 폐기(사용자)'))
S.push(h2(`${ch}.6 구현 현황 (2026-11-22)`))
S.push(table(['구분', '내용'], [
  ['머지된 PR', '#10 첫 마이그레이션 · #11 시드+테스트 setup · #12 db:migrate generate · #13 헬스 체크+UNAVAILABLE+CI 더미 env · #14 디자인 토큰 · #15 i18n · #16 [locale] root layout · #17 proxy+redact 수정 · #18 에러 경계·404 · #19 CI 테스트용 Postgres'],
  ['FEATURES 상태', '동등성 확인: F02 F04 F05 F06 I01 / 이식 완료: F03 / 구현(상태 열 미갱신): F01 F07 I02 I03 / 미착수: F08~F39'],
  ['Phase 1 잔여', 'Sentry 연결(사용자 DSN), CI E2E 단계, 통합 테스트 직렬 실행 결정, designer 404 UX·i18n 문구 검토'],
  ['사용자 선행 작업', 'Google OAuth 리디렉션 URI(F08), Sentry DSN(F06), Cloudflare R2(F20), Neon v2 DB·Vercel·WAF(Phase 5)'],
], [1, 4.5]))

L.save(L.buildDoc({ title: '상세설계서', subtitle: 'Detailed Design — 공통 규약 + 기능(FEATURES 행)별 처리 흐름·입출력·규칙·예외·테스트·이식 시 확정 항목', sections: S }), process.argv[2])
