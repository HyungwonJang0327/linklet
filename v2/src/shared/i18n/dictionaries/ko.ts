// 한국어 사전 — 원본. 다른 언어는 이 구조에서 파생한 Dictionary 타입을 satisfies 로 맞춘다 (decisions/i18n.md L3)
// 플레이스홀더 문법은 `{name}` 하나 (L4). 값에 `{{`·빈 문자열·이메일·URL 을 넣지 않는다 (dictionaries.test.ts 가 고정)
// 초기 범위는 기반 키만 (L7) — 화면 키는 각 기능 이식 때 세 언어를 동시에 추가한다

export const ko = {
  // errors.{CODE} — ERROR_CODES 10종 + UNKNOWN. 각 문장은 "다음에 할 수 있는 행동"을 알려준다 (error-handling E3)
  errors: {
    VALIDATION_FAILED: '입력한 내용에 문제가 있어요. 표시된 항목을 확인해 주세요',
    UNAUTHENTICATED: '로그인이 필요해요. 로그인한 뒤 다시 시도해 주세요',
    FORBIDDEN: '이 작업을 할 수 있는 권한이 없어요. 내 위시리스트가 맞는지 확인해 주세요',
    NOT_FOUND: '찾는 항목이 없어요. 주소를 확인하거나 목록으로 돌아가 주세요',
    CONFLICT: '다른 곳에서 먼저 바뀌었어요. 새로고침한 뒤 다시 시도해 주세요',
    LIMIT_REACHED: '만들 수 있는 개수를 다 썼어요. 쓰지 않는 항목을 정리한 뒤 다시 시도해 주세요',
    RATE_LIMITED: '요청이 너무 잦아요. 잠시 쉬었다가 다시 시도해 주세요',
    UPSTREAM_FAILED: '링크 정보를 불러오지 못했어요. 주소를 확인하거나 직접 입력해 주세요',
    INTERNAL: '문제가 생겼어요. 잠시 뒤 다시 시도해 주세요',
    UNAVAILABLE: '지금은 잠시 이용할 수 없어요. 조금 뒤 다시 시도해 주세요',
    UNKNOWN: '알 수 없는 문제가 생겼어요. 새로고침하거나 잠시 뒤 다시 시도해 주세요',
  },
  common: {
    appName: 'Linklet',
    retry: '다시 시도',
    close: '닫기',
    cancel: '취소',
    confirm: '확인',
    back: '뒤로',
    loading: '불러오는 중…',
  },
  // F06 404 화면 — [locale]/not-found.tsx·global-not-found.tsx (error-handling E4). 다음 행동은 "홈으로"
  notFound: {
    title: '페이지를 찾을 수 없어요',
    description: '주소가 바뀌었거나 삭제된 페이지예요. 홈으로 돌아가 다시 찾아 주세요',
    home: '홈으로',
  },
  // F06 에러 경계 — [locale]/error.tsx·global-error.tsx. 버튼 문구는 common.retry 를 재사용한다(키 중복 금지)
  errorPage: {
    title: '문제가 생겼어요',
    description: '잠시 뒤 다시 시도해 주세요. 계속되면 알려 주세요',
  },
  // F08 로그인 화면 — [locale]/(public)/login. 시안 design/mockups/landing.html "로그인" (문구로 3분 기대치를 미리 말한다)
  login: {
    title: '반가워요!',
    description: 'Google 계정으로 3초 만에 시작해요. 첫 위시리스트까지 3분이면 충분해요',
    google: 'Google로 계속하기',
    failed: '로그인이 끝나지 않았어요. 다시 시도해 주세요',
  },
  // F08 Topbar 로그인 상태 — features/auth AuthMenu
  auth: {
    signIn: '로그인',
    signOut: '로그아웃',
  },
  // 랜딩 OG 메타 — INTENT.md 한 줄 설명 기반
  // F09 라우트 보호 — [locale]/unauthorized.tsx(401, Google 버튼은 login.google)·forbidden.tsx(403, 홈 링크는 notFound.home 재사용)
  unauthorized: {
    title: '로그인이 필요해요',
    description: 'Google 계정으로 로그인하면 보던 곳으로 바로 돌아와요',
  },
  forbidden: {
    title: '여기는 들어갈 수 없어요',
    description: '관리자만 볼 수 있는 페이지예요. 홈으로 돌아가 주세요',
  },
  metadata: {
    title: 'Linklet — 링크만 붙여 넣으면 모아지는 내 위시리스트',
    description:
      '요즘 갖고 싶은 것들, 링크만 붙여 넣으면 예쁘게 모아지는 내 위시리스트 페이지. 친구에게 링크 하나로 공유해요',
  },
} as const
