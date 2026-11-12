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
          patterns: [FEATURE_BOUNDARY_PATTERN],
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
            {
              group: ['@/server', '@/server/*', '**/server/*', '../server', '../../server'],
              message: '클라이언트 코드에서 서버 전용 모듈(server/)을 import하지 않는다.',
            },
          ],
        },
      ],
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
  ]),
])

export default eslintConfig
