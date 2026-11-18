// 시스템 모드 인라인 스크립트 — decisions/design-tokens.md "Phase 1 적용 결정 — 모드 스크립트·CSP (F03)"
// [locale]/layout.tsx 의 <head> 에 <script dangerouslySetInnerHTML> 로 들어가 첫 페인트 전에 `data-mode` 를 채운다.
// - 서버가 `data-mode` 를 light|dark 로 렌더했으면(F29 저장값) 아무것도 하지 않는다
// - 없거나 `system` 이면 matchMedia('(prefers-color-scheme: dark)') 로 dark|light 를 정한다. matchMedia 가 없으면 light
// - try/catch 로 감싸 어떤 환경(document 없음 등)에서도 throw 하지 않는다 — 첫 스크립트가 던지면 이후 하이드레이션 경고가 섞인다
//
// 지금은 대기 상태다: layout 이 `data-mode="light"` 를 항상 렌더하므로 이 스크립트는 즉시 return 한다.
// F29(화면 설정)가 저장값 없을 때 속성을 비우거나 `system` 으로 렌더하는 순간부터 작동한다.
// CSP 는 아직 없다 — 도입 때 proxy 가 만든 nonce 를 <script nonce> 로 붙인다(design-tokens.md). 그때까지 이 문자열은 그대로.
//
// 문자열 규칙(mode-script.test.ts 가 고정): `<` 를 쓰지 않는다 — `</script>` 로 태그가 닫히는 사고를 원천 차단.
// 하나의 IIFE 라 전역을 남기지 않는다. 테스트는 new Function(MODE_SCRIPT) 로 실행한다(ES5 문법 유지).

export const MODE_SCRIPT: string = [
  '(function(){try{',
  'var root=document.documentElement;',
  'var mode=root.getAttribute("data-mode");',
  'if(mode==="light"||mode==="dark")return;',
  'var dark=typeof matchMedia==="function"&&matchMedia("(prefers-color-scheme: dark)").matches;',
  'root.setAttribute("data-mode",dark?"dark":"light");',
  '}catch(e){}})();',
].join('')
