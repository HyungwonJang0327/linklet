import type { Dictionary } from '../types'

// 일본어 사전 — ko 와 같은 키 집합을 satisfies 가 강제한다 (누락·초과 모두 컴파일 에러). 문장은 직역이 아니라 같은 행동 안내
export const ja = {
  errors: {
    VALIDATION_FAILED: '入力内容に問題があります。印のついた項目を確認してください',
    UNAUTHENTICATED: 'ログインが必要です。ログインしてからもう一度お試しください',
    FORBIDDEN: 'この操作をする権限がありません。自分のウィッシュリストか確認してください',
    NOT_FOUND: 'お探しの項目が見つかりません。アドレスを確認するか、一覧に戻ってください',
    CONFLICT: '別の場所で先に変更されています。再読み込みしてからもう一度お試しください',
    LIMIT_REACHED:
      '作成できる上限に達しました。使っていない項目を整理してからもう一度お試しください',
    RATE_LIMITED: 'リクエストが多すぎます。少し待ってからもう一度お試しください',
    UPSTREAM_FAILED:
      'リンクの情報を取得できませんでした。アドレスを確認するか、直接入力してください',
    INTERNAL: '問題が発生しました。しばらくしてからもう一度お試しください',
    UNAVAILABLE: 'ただいま一時的にご利用いただけません。しばらくしてからもう一度お試しください',
    UNKNOWN:
      '予期しない問題が発生しました。再読み込みするか、しばらくしてからもう一度お試しください',
  },
  common: {
    appName: 'Linklet',
    retry: 'もう一度試す',
    close: '閉じる',
    cancel: 'キャンセル',
    confirm: 'OK',
    back: '戻る',
    loading: '読み込み中…',
  },
  notFound: {
    title: 'ページが見つかりません',
    description: 'アドレスが変わったか、削除されたページです。ホームに戻ってもう一度探してください',
    home: 'ホームへ',
  },
  errorPage: {
    title: '問題が発生しました',
    description: 'しばらくしてからもう一度お試しください。続く場合はお知らせください',
  },
  login: {
    title: 'ようこそ!',
    description:
      'Googleアカウントで3秒ではじめられます。最初のウィッシュリストまで3分あれば十分です',
    google: 'Googleで続ける',
    failed: 'ログインが完了しませんでした。もう一度お試しください',
  },
  auth: {
    signIn: 'ログイン',
    signOut: 'ログアウト',
  },
  metadata: {
    title: 'Linklet — リンクを貼るだけでできる、わたしのウィッシュリスト',
    description:
      '最近ほしいものを、リンクを貼るだけできれいにまとめられるウィッシュリストページ。友だちにはリンクひとつでシェア',
  },
} satisfies Dictionary
