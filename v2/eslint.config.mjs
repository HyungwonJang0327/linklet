import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

// decisions/dependencies.md — zod 는 `zod/mini` 만. classic 진입점(zod·zod/v4·zod/v4/classic·zod/v3)은 금지.
// `zod/mini`·`zod/v4/core` 는 허용. no-restricted-imports 는 블록마다 통째로 덮어쓰이므로 두 블록에 같은 목록을 넣는다.
const ZOD_CLASSIC_MESSAGE = 'zod/mini 만 사용 (decisions/dependencies.md)'
const RESTRICTED_PATHS = [
  { name: 'zod', message: ZOD_CLASSIC_MESSAGE },
  { name: 'zod/v4', message: ZOD_CLASSIC_MESSAGE },
  { name: 'zod/v4/classic', message: ZOD_CLASSIC_MESSAGE },
  { name: 'zod/v3', message: ZOD_CLASSIC_MESSAGE },
  { name: 'zod/v4-mini', message: "'zod/mini' 경로 하나로 통일 (별칭 금지)" },
]

// decisions/architecture.md A4 — 기능끼리는 index.ts 공개 API로만
const FEATURE_BOUNDARY_PATTERN = {
  group: ['@/features/*/*'],
  message:
    "다른 기능은 '@/features/{이름}' (index.ts)로만 import한다. 같은 기능 안에서는 상대 경로를 쓴다.",
}

// CLAUDE.md 함정 6 예외의 울타리 — 시드(prisma/seed.mts, top-level 에서 실행·자체 PrismaClient)와 테스트 전용 TRUNCATE 헬퍼(server/test-db)는
// 앱 코드가 import 하지 않는다. 시드는 어디서도, test-db 는 *.test.ts 에서만 (security-reviewer 2026-11-15 L-3).
const SEED_IMPORT_PATTERN = {
  group: ['**/prisma/seed', '**/prisma/seed.*'],
  message:
    'prisma/seed.mts 는 pnpm db:seed 가 실행하는 1회 스크립트다. 앱 코드에서 import 하지 않는다.',
}
const TEST_DB_IMPORT_PATTERN = {
  group: [
    '@/server/test-db',
    '**/server/test-db',
    '**/server/test-db.*',
    './test-db',
    './test-db.*',
  ],
  message: 'server/test-db 는 테스트 전용(TRUNCATE)이다. *.test.ts 에서만 import 한다.',
}

// CLAUDE.md §4-2 입력 검증 — 환경변수는 shared/config/env.ts(.client.ts) 가 부팅 시 검증한 객체로만 읽는다.
// `process.env.X`·`process.env['X']`·`const e = process.env`·`globalThis.process.env`·`const { env } = process`·`const p = process` 금지.
// 예외는 스키마 파일·부팅 진입점·설정·테스트 스크립트.
// 린트는 보조 가드다 — `globalThis['pro'+'cess']` 같은 우회는 못 잡는다. 1차 방어는 리뷰(security-reviewer)와 env 모듈 단일 진입점.
const PROCESS_ENV_MESSAGE =
  '환경변수는 @/shared/config/env(.client) 로만 읽는다 — process.env 직접 참조 금지 (CLAUDE.md §4-2)'
const PROCESS_ENV_SELECTORS = [
  {
    selector: "MemberExpression[object.name='process'][property.name='env']",
    message: PROCESS_ENV_MESSAGE,
  },
  {
    selector: "MemberExpression[object.name='process'][property.value='env']",
    message: PROCESS_ENV_MESSAGE,
  },
  {
    // globalThis.process.env
    selector:
      "MemberExpression[object.object.name='globalThis'][object.property.name='process'][property.name='env']",
    message: PROCESS_ENV_MESSAGE,
  },
  {
    // const { env } = process
    selector: "VariableDeclarator[init.name='process'][id.type='ObjectPattern']",
    message: PROCESS_ENV_MESSAGE,
  },
  {
    // const p = process (별칭 뒤에 p.env)
    selector: "VariableDeclarator[init.name='process'][id.type='Identifier']",
    message: PROCESS_ENV_MESSAGE,
  },
]

// decisions/design-tokens.md "Tailwind 4 연결" — `dark:` 변형 금지. 모드는 토큰(data-mode)이 처리하므로 컴포넌트가 dark: 를 쓰면 어긋난다.
// globals.css 의 @custom-variant dark 는 안전망으로만 둔다. 문자열·템플릿 리터럴에서 클래스 토큰 시작 위치(또는 `hover:dark:` 처럼
// 다른 변형 뒤)의 `dark:` 를 잡는다. `darkroom:` 같은 다른 단어는 잡지 않는다.
const DARK_VARIANT_MESSAGE =
  '`dark:` 변형 금지 — 모드는 토큰(data-mode)이 처리한다 (decisions/design-tokens.md)'
const DARK_VARIANT_SELECTORS = [
  { selector: 'Literal[value=/(^|[\\s\'"`:])dark:/]', message: DARK_VARIANT_MESSAGE },
  { selector: 'TemplateElement[value.raw=/(^|[\\s\'"`:])dark:/]', message: DARK_VARIANT_MESSAGE },
]

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // CLAUDE.md 금지: any
      '@typescript-eslint/no-explicit-any': 'error',

      // CLAUDE.md 4-3 접근성 기준선 — 클릭 가능한 div·라벨 없는 폼 요소 금지 (AUDIT H9)
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/anchor-is-valid': 'error',

      'no-restricted-imports': [
        'error',
        {
          paths: RESTRICTED_PATHS,
          patterns: [FEATURE_BOUNDARY_PATTERN, SEED_IMPORT_PATTERN, TEST_DB_IMPORT_PATTERN],
        },
      ],
    },
  },
  {
    // decisions/architecture.md A4 — 클라이언트 쪽 코드에서 서버 전용 모듈 import 금지
    files: ['src/features/*/components/**', 'src/features/*/hooks/**', 'src/shared/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: RESTRICTED_PATHS,
          patterns: [
            FEATURE_BOUNDARY_PATTERN,
            SEED_IMPORT_PATTERN,
            TEST_DB_IMPORT_PATTERN,
            {
              group: ['@/server', '@/server/*', '**/server/*', '../server', '../../server'],
              message: '클라이언트 코드에서 서버 전용 모듈(server/)을 import하지 않는다.',
            },
          ],
        },
      ],
    },
  },
  {
    // 테스트 파일만 server/test-db 를 쓸 수 있다. 시드 import 금지는 유지 (no-restricted-imports 는 블록마다 통째로 덮어쓰인다)
    files: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: RESTRICTED_PATHS,
          patterns: [FEATURE_BOUNDARY_PATTERN, SEED_IMPORT_PATTERN],
        },
      ],
    },
  },
  {
    // dark: 변형 금지 — src 전부(테스트 포함). no-restricted-syntax 는 블록마다 통째로 덮어쓰이므로
    // 아래 process.env 블록이 적용되는 파일은 그 블록이 두 목록을 합쳐 다시 설정한다. 이 블록은 그 블록의 예외 파일(config·테스트 등)을 덮는다
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...DARK_VARIANT_SELECTORS],
    },
  },
  {
    // process.env 직접 참조 금지 — ignores 만 있는 블록은 "이 파일들을 뺀 나머지 전부"에 적용된다
    ignores: [
      'src/shared/config/**',
      'src/instrumentation.ts',
      'src/instrumentation-client.ts', // 브라우저 부팅 진입점 — NODE_ENV 는 빌드 시 인라인되는 값이라 직접 참조(DSN 은 clientEnv)
      'src/sentry.edge.config.ts', // edge 부팅 진입점 — 서버 env 모듈(Node 전용)을 못 쓴다
      '**/*.test.ts',
      'next.config.*',
      'eslint.config.*', // 이 파일 — dark: 금지 메시지 문자열이 자기 규칙에 걸린다
      'playwright.config.*',
      'vitest.config.*',
      'vitest.setup.*',
      'vitest.global-setup.*', // 테스트 DB 마이그레이션 적용(메인 프로세스) — setup 과 같은 키를 읽는다
      'prisma.config.*',
      'prisma/seed.mts', // 개발 시드 — CLI 와 같은 방식으로 .env 를 읽고 로컬 가드를 거친다
      'scripts/**', // DB 스크립트(pnpm db:migrate) — CLI 와 같은 방식으로 env 를 읽는다
      'e2e/**',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...PROCESS_ENV_SELECTORS, ...DARK_VARIANT_SELECTORS],
    },
  },
  // Prettier와 충돌하는 스타일 규칙 끄기 (마지막에 둔다)
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // 기준선 실행 상태(.run/) — baseline:up 이 루트 .next 를 .run/next-backup 으로 옮겨 두는 동안 lint 대상이 되지 않게
    'e2e/baseline/.run/**',
    // Prisma 생성물 (prisma/schema.prisma generator output) — 커밋하지 않고 lint 대상도 아님
    'src/generated/**',
  ]),
])

export default eslintConfig
