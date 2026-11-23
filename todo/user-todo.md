# user todo — 사용자가 직접 해야 하는 작업

> 계정·콘솔·운영 설정처럼 에이전트가 하지 않는(또는 할 수 없는) 작업. 끝나면 체크하고 날짜를 적는다.

## 즉시

- [x] **`REVALIDATE_SECRET_TOKEN` 교체** (2026-10-04 확인 — 운영에서 옛 값 401) — 과거 커밋 `2b39a31` 에 토큰 값이 하드코딩되어 공개 이력에 남아 있다 (AUDIT H13). 운영(Vercel Production 환경변수)과 로컬 `.env.*` 모두 새 무작위 값으로 바꾸고 재배포. 교체 후 알려주면 `.gitleaksignore` 에 해당 fingerprint를 추가해 전체 이력 스캔을 통과시킨다
  - 완료 조건: 운영 `/api/revalidate`·`/api/auth/cleanup-sessions` 가 옛 값으로 401/403

## v2 CI 첫 통과 직후

- [x] main 브랜치 보호 켜기 (PR 필수·승인 0명, 필수 체크 `quality`·`gitleaks`, 강제 push·삭제 금지, 관리자 예외 허용) — 사용자 승인 후 `gh api` 로 적용 (2026-10-04, PR #1 병합 `15ef23d`)

## 기능 이식 시점

- [ ] Cloudflare 계정·R2 버킷 생성, 키 발급 (F20 이미지 업로드 이식 전)
- [x] Sentry 프로젝트 생성, DSN 발급 (2026-11-23 — 수동 생성, Error Monitoring 만, 리포 연결 안 함, DSN 은 `v2/.env.local`)
- [ ] Sentry 소스맵 업로드 — org·project 슬러그 확인 + Auth Token 발급(scope: project:releases, org:read) → Vercel 운영 env `SENTRY_AUTH_TOKEN` (첫 배포 때. 로컬 `.env.local` 에는 넣지 않는다 — 빌드마다 업로드된다). 그때 GitHub 리포 연결도 함께(의심 커밋)
- [x] Google OAuth 클라이언트에 v2 로컬·운영 리디렉션 URI 추가 (2026-11-23 — 기존 클라이언트 재사용. Better Auth 콜백 `/api/auth/callback/google` 이 기존 NextAuth 와 같은 경로라 추가 등록 없음. `v2/.env.local` 에 GOOGLE_CLIENT_ID·GOOGLE_CLIENT_SECRET 복사, BETTER_AUTH_SECRET 새로 생성)
- [ ] v2 로컬에서 실제 Google 로그인·로그아웃 확인 (F08 동등성 확인 — `pnpm dev` → /ko/login → Google → 랜딩에 로그아웃 버튼 → 로그아웃). Vercel 프리뷰 도메인은 첫 배포 때 리디렉션 URI 추가

## 첫 배포 시점

- [ ] v2용 Neon DB 준비 (기존 프로젝트의 새 브랜치 또는 새 프로젝트) — 무료 한도 확인
- [ ] Vercel 프리뷰 프로젝트(`v2/` 루트) 여부 결정·생성, Node 24 설정, 환경변수 등록
- [ ] Vercel WAF 레이트 리밋 규칙 1개 (`/api/link-previews`)

## 교체 후

- [ ] 기존 S3 버킷(`linklet-image`) 비우고 삭제, AWS 키 폐기
- [ ] 기존 앱용 환경변수 정리
