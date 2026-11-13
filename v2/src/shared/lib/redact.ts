// 로그 마스킹 — 순수 함수만. server-only 없음. log-format.ts 가 모든 문자열 필드에 적용한다.
// 근거: CLAUDE.md §4-2 로그 규약(개인정보 0), decisions/error-handling.md E5, security-reviewer 요구 2026-11-12
// 불변 규칙: 이 파일의 함수는 **절대 throw 하지 않는다**. 실패하면 고정 문구를 돌려준다.
// 기준은 "원본이 출력에 남지 않음"이고 과잉 마스킹은 허용한다.

export const MESSAGE_MAX_LENGTH = 300
export const REDACTED = '***'
/** 값을 읽을 수 없을 때(getter throw·변환 실패)의 고정 문구 */
export const UNREADABLE = '(unreadable)'

/**
 * 마스킹 규칙 — 순서가 중요하다. 접속 문자열을 먼저 통째로 지워야 이메일 규칙이 `user:pass@host` 를 반만 가리는 일이 없고,
 * `Bearer` 를 `key=` 규칙보다 먼저 처리해야 `Authorization: Bearer x` 의 토큰이 남지 않는다.
 * 32자+ 토큰 규칙은 경로 구분자(`/`·`.`)를 문자 집합에서 빼 파일 경로·스택 프레임을 통째로 지우지 않게 한다 —
 * 대신 `/` 가 섞인 표준 base64 는 32자 이상인 조각 단위로만 가려진다 (token=·Bearer·JWT 규칙이 먼저 잡는다).
 */
const REDACTION_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  // postgres(ql):// 접속 문자열 전체 — userinfo 가 없어도 host·db 이름까지 지운다
  [/\bpostgres(?:ql)?:\/\/[^\s'"`<>]+/gi, 'postgresql://***'],
  // Neon 호스트 — Prisma P1001("Can't reach database server at `ep-….aws.neon.tech:5432`") 류 메시지에 접속 문자열 없이 호스트만 실린다.
  // 프로젝트를 식별할 수 있는 서브도메인과 포트를 지운다 (security-reviewer 2026-11-12 → 결정 2026-11-14)
  [/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.neon\.tech(?::\d{1,5})?\b/gi, '***.neon.tech'],
  // 그 외 스킴의 userinfo (`mysql://u:p@h`, `redis://:p@h`, `https://u:p@h`)
  [/\b([a-z][a-z0-9+.-]*:\/\/)[^\s/@'"`<>]+@/gi, '$1***@'],
  // JWT — base64url 세 조각
  [/\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, REDACTED],
  // Cookie / Set-Cookie 헤더 — 값 전체(줄 끝까지). 키 규칙보다 앞: `a=1; csrf=2` 조각이 아니라 통째로 지운다
  [/(\b(?:set-)?cookie\s*:)[^\r\n]*/gi, '$1 ***'],
  // Bearer · Basic 토큰 (RFC 7235 — 스킴 이름은 대소문자 무관)
  [/\bBearer\s+[^\s'"`,;]+/gi, 'Bearer ***'],
  [/\bBasic\s+[A-Za-z0-9+/=_-]+/gi, 'Basic ***'],
  // `token=…`·`api_key: …`·`"client_secret": "…"` — 키 이름에 민감어가 들어 있으면 값을 지운다.
  // 민감어는 부분 일치(`pass` ⊃ password·passwd, `auth` ⊃ authorization, `sig` ⊃ signature) — 과잉 마스킹 허용
  [
    /([\w-]*(?:token|key|secret|pass|pwd|auth|credential|cookie|session|sig|private|csrf|otp|state)[\w-]*)(["']?\s*[=:]\s*["']?)[^\s&,;"'`]+/gi,
    '$1$2***',
  ],
  // 이메일 — 유니코드 로컬파트·도메인, `@` 가 `%40` 으로 인코딩된 형태(URL 경로·쿼리)도
  [/[\p{L}\p{N}._%+-]+(?:@|%40)[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/gu, '***@***'],
  // URL 쿼리스트링 (서명·토큰이 흔히 실린다)
  [/(\b[a-z][a-z0-9+.-]*:\/\/[^\s?#'"`<>]*)\?[^\s#'"`<>]*/gi, '$1?***'],
  // 32자+ hex (세션 ID·해시·API 키)
  [/\b[A-Fa-f0-9]{32,}\b/g, REDACTED],
  // 32자+ base64/base64url 조각 (UUID 36자도 여기 걸린다 — 메시지 안의 내부 ID 는 잃어도 된다)
  [/(?<![A-Za-z0-9+_=-])[A-Za-z0-9+_-]{32,}={0,2}(?![A-Za-z0-9+_=-])/g, REDACTED],
]

/** 민감 패턴을 가린다. 입력이 문자열이 아니거나 처리 중 실패하면 고정 문구 */
export function redact(text: string): string {
  try {
    let out = String(text)
    for (const [pattern, replacement] of REDACTION_RULES) out = out.replace(pattern, replacement)
    return out
  } catch {
    return UNREADABLE
  }
}

/** redact + 개행(과 주변 공백)을 공백 하나로 + 300자 상한. 마스킹을 먼저 하고 자른다 — 잘린 조각이 패턴을 빠져나가지 않게 */
export function normalizeMessage(message: string): string {
  try {
    const flat = redact(message)
      .replace(/\s*[\r\n]+\s*/g, ' ')
      .trim()
    return flat.length > MESSAGE_MAX_LENGTH ? `${flat.slice(0, MESSAGE_MAX_LENGTH - 1)}…` : flat
  } catch {
    return UNREADABLE
  }
}
