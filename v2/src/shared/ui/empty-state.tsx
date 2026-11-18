import type { ReactNode } from 'react'

// 빈·에러 상태 공통 틀 — FEATURES F06, error-handling E4, CLAUDE.md §4-4 화면 4상태.
// 404(not-found)·에러 경계(error)·(나중에) 목록 비어 있음이 같은 틀을 쓴다 — 같은 역할의 컴포넌트를 두 벌 만들지 않는다(§4).
// 토큰 클래스만(원색·dark: 금지). 제목 text-display, 설명 text-body text-muted, 위아래 py-10, 좌우 px-page-x, 가운데 정렬.
// action 은 호출자가 <a>/<button> 으로 넘긴다(§4-3 — 클릭 가능한 div 금지). 서버·클라이언트 양쪽에서 쓸 수 있게 훅·상태 없음.
// 제목·설명은 보통 t() 문자열이고, Provider 가 없는 global-error·global-not-found 는 <MultilingualLines> 로 세 언어 줄을 넘긴다.

type EmptyStateProps = {
  title: ReactNode
  description: ReactNode
  /** 다음에 할 수 있는 행동 — <a href> 또는 <button type="button">. 클래스는 EMPTY_STATE_ACTION_CLASS */
  action?: ReactNode
}

/**
 * action 에 넣는 <a>·<button> 의 주 버튼 클래스. 높이 h-control(48px)·accent 면·focus-visible 링(Topbar 와 같은 방식).
 * 공통 Button 컴포넌트가 생기면(F13 이후) 그쪽으로 옮긴다
 */
export const EMPTY_STATE_ACTION_CLASS =
  'inline-flex h-control items-center rounded-btn bg-accent px-6 text-button text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center gap-3 px-page-x py-10 text-center">
      <h1 className="text-display">{title}</h1>
      <p className="max-w-prose text-body text-muted">{description}</p>
      {action === undefined ? null : <div className="mt-3">{action}</div>}
    </section>
  )
}
