import { LOCALES, type Locale } from '@/shared/i18n'

// 세 언어 고정 문구를 한 줄씩 — FEATURES F06, error-handling E4 "F06 구현 결정".
// I18nProvider·root layout 이 없는 global-error·global-not-found 는 요청 언어를 알 수 없어 ko·en·ja 를 모두 보여준다.
// 각 줄에 lang 을 붙여 스크린리더가 언어별 음성으로 읽게 한다. 문구는 호출자가 각 언어 사전의 같은 키에서 가져온다(문자열 이중화 금지).

type MultilingualLinesProps = { texts: Readonly<Record<Locale, string>> }

export function MultilingualLines({ texts }: MultilingualLinesProps) {
  return (
    <>
      {LOCALES.map((locale) => (
        <span key={locale} lang={locale} className="block">
          {texts[locale]}
        </span>
      ))}
    </>
  )
}
