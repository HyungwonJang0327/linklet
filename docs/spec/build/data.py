# -*- coding: utf-8 -*-
"""Linklet v2 설계 문서 공통 데이터 — 출처: INTENT.md, planning.md, audit/FEATURES.md, decisions/*.md, v2/prisma/schema.prisma (2026-11-22 기준)"""
import json, sys

DOC_DATE = "2026-11-22"
VERSION = "1.0"

# ---------------------------------------------------------------- 기능 요구사항 (FEATURES 행 기준)
# (ID, 영역, 기능명, 처분, 요구사항 설명, 수용 기준(동등성 확인 방법), Phase, 이식 순서, 상태(코드 기준), 관련 화면, 관련 API, 관련 테이블, 근거)
FR = [
 ("F01","기반","환경변수 스키마 검증","재설계","모든 환경변수를 Zod 스키마로 부팅 시 검증한다. 필수 키가 없으면 기동을 중단하고, 출력에 값은 포함하지 않는다. 클라이언트 노출 변수만 NEXT_PUBLIC_ 접두사를 쓴다","단위: 필수 키 누락 시 부팅 실패, 출력에 값 없음",1,1,"구현 완료","—","—","—","AUDIT 규약 위반(비밀값 앞 10자 출력)"),
 ("F02","기반","DB 스키마·마이그레이션·시드","재설계","Prisma 7.10.0 + @prisma/adapter-pg. 첫 마이그레이션(users·wishlists·wishlist_items·notices·inquiries), 마이그레이션마다 down.sql, 로컬 DB 가드가 있는 멱등 시드","수동: 빈 DB 마이그레이션 up→down→up, 시드 후 기동",1,1,"동등성 확인","—","—","users, wishlists, wishlist_items, notices, inquiries","AUDIT H5 드리프트, H6 PrismaClient 2개"),
 ("F03","기반","공통 레이아웃·root layout","재설계","app/[locale]/layout.tsx 가 root. <html lang data-skin data-mode>, Topbar, I18nProvider, 모드 스크립트. 지원하지 않는 locale 은 404","E2E: 주요 경로에 <html lang>, 헤더·본문 렌더",1,2,"이식 완료","S01","—","—","root layout <html> 없음(H7)"),
 ("F04","기반","i18n (ko·en·ja)","개선","라이브러리 없이 TS 사전 3개 + 타입 안전 t(). 키·플레이스홀더 집합을 타입과 테스트로 강제. 초기 키는 errors·common·metadata·notFound·errorPage","단위: 3개 사전 키 집합 동일, 플레이스홀더 집합 동일, errors 키 ↔ 에러 코드 1:1",1,2,"동등성 확인","전체","—","—","키 누락 노출(GENERAL), 죽은 fallback 40곳"),
 ("F05","기반","언어 경로·루트 리다이렉트","개선","/ 는 Accept-Language 협상으로 /{locale} 307. 코드 kr/jp → ko/ja. Vary: Accept-Language","E2E: 브라우저 언어별 이동, 미지원 언어는 ko",1,2,"동등성 확인","S01","—","—","U3"),
 ("F06","기반","404·500·에러 경계","신규","global-not-found·global-error·[locale]/not-found·[locale]/error. 앱 테마·i18n 적용, 내부 메시지 미노출, 다시 시도 버튼","E2E: 없는 경로 → 앱 테마 404, 렌더 에러 → 경계 화면",1,3,"동등성 확인","S18, S19","—","—","H7"),
 ("F07","기반","API 응답·에러 스키마 + 헬퍼","재설계","{ data } / { data, nextCursor } / { error:{code,message,details?} } 세 형태만. AppError(code, details?), createHandler 가 예상 못한 예외를 500 INTERNAL 로 변환하고 로그","단위: 헬퍼가 스키마대로만 응답, 예상 못한 에러는 일반 문구",1,3,"구현 완료","—","전체","—","H8"),
 ("F08","인증","Google 로그인·로그아웃","개선","Better Auth + Prisma 어댑터, Google 소셜 로그인, DB 세션, admin 플러그인. generateId:false 로 UUID v7 통일. 운영은 https 강제","수동: 실제 Google 로그인·로그아웃. E2E: 세션 주입 후 로그인 상태 화면",2,4,"미착수","S02","A02","sessions, accounts, verifications, users.role","NextAuth v4 critical, /login 404"),
 ("F09","인증","라우트 보호","개선","proxy.ts + 서버 세션 확인. 비로그인은 (app) 구간 접근 시 로그인으로, 일반 사용자는 admin 차단(서버 판정)","E2E: 비로그인 설정 접근 → 로그인, 일반 사용자 admin → 차단",2,4,"미착수","S03~S16","—","sessions","쿠키 존재만 확인, 관리자 클라이언트 체크"),
 ("F10","인증","인증·권한 계층","개선","권한 판정은 features/*/server/service 한 곳. Route Handler 는 요청자(세션)만 전달. 본인·타인·관리자·비로그인 판정표","단위: 판정표 전 조합 결과 일치",2,4,"미착수","—","전체","—","M1 IDOR, M5 이원화"),
 ("F11","링크 미리보기","외부 URL 안전 fetch (SSRF 방어)","재설계","shared/lib/safe-fetch: DNS→IP 검사(사설·링크로컬·IPv6 차단), 리다이렉트마다 재검사, 크기·시간 제한, og:image 도 동일 검사","단위: 사설 IP·IPv6·리다이렉트 우회·크기 초과 차단, 공개 URL 허용",3,5,"미착수","S05","A11","—","H2"),
 ("F12","링크 미리보기","요청 빈도 제한","개선","Vercel WAF 규칙 1개(/api/link-previews) + Better Auth 내장 제한. 초과 시 429 RATE_LIMITED","단위: 한도 초과 시 429 + 에러 스키마",3,5,"미착수","—","A11","—","M4 인메모리 무효"),
 ("F18","링크 미리보기","URL 메타데이터 파서","유지","OG·Twitter·JSON-LD·쇼핑몰 셀렉터로 제목·이미지·가격·사이트명 추출. Phase 0 정답 fixture 12쌍과 동일 결과","단위: fixture 세트에 대해 기존 구현과 같은 결과",3,5,"미착수","S05","A11","—","노하우 보존"),
 ("F13","위시리스트","내 위시리스트 목록","개선","TanStack Query 도입. 로딩·비어 있음·에러·정상 4상태 본보기. 본인 것만. 상한 20이라 한 번에 반환(nextCursor null)","E2E: 4상태, 본인 것만 보임",4,6,"미착수","S03","A03","wishlists","M6"),
 ("F14","위시리스트","위시리스트 생성 (3분 흐름)","재설계","제목 → 링크 붙여 넣기 → 생성 → 공유 링크 복사까지 단계형. 카테고리는 묻지 않음. 트랜잭션·상한 검사","E2E: 로그인 → 생성 → 공유 링크 복사 3분 이내",4,7,"미착수","S04","A04","wishlists, wishlist_items","완료 기준 10, M2"),
 ("F15","위시리스트","공개 설정·기본값","개선","기본 공개(링크 아는 사람만, 목록·검색 노출 없음). 비공개 전환 시 공유 페이지 404","E2E: 새 위시리스트 공유 링크 열림, 비공개 → 404",4,7,"미착수","S05, S17","A05","wishlists.isPublic","Q2"),
 ("F16","위시리스트","카테고리","재설계","계기 3종 birthday·occasion·someday 선택 입력. 미선택 null·칩 없음. 생성 흐름에서 묻지 않음. enum→키 매핑 한 곳","E2E: 미선택 생성 가능, 선택 시 3개 언어 표시",4,7,"미착수","S05","A05","wishlists.category","category.md"),
 ("F17","위시리스트","위시리스트 편집·삭제","개선","제목·설명·카테고리·공개 수정. 삭제는 shared/ui Dialog(Radix) 확인 모달(키보드 조작)","E2E: 수정 반영, 삭제 확인 모달 후 목록에서 사라짐",4,8,"미착수","S05","A05","wishlists","H9, 710줄 페이지"),
 ("F19","아이템","아이템 추가 (링크 자동 채움)","개선","링크 입력 → 미리보기(A11) → 추가. http(s) 외 scheme 거부, 상한 100 검사(트랜잭션)","E2E: 링크 → 미리보기 → 추가 → 목록 반영. 단위: scheme 거부",4,9,"미착수","S05","A06, A11","wishlist_items","로직 중복, 비로그인 metadata"),
 ("F20","아이템","이미지 업로드 (R2)","개선","Cloudflare R2(S3 호환). 허용 MIME·매직바이트·크기 검사, SVG 금지, 환경별 폴더","단위: MIME·매직바이트·크기, 환경별 폴더. 수동: 아바타 업로드",4,9,"미착수","S05, S08","A12","—","M20"),
 ("F21","아이템","아이템 수정·삭제·받음·일괄 삭제","개선","낙관적 업데이트, 진행 중 중복 실행 방지, 공유 페이지 재검증","E2E: 각 동작 후 상세·공유 반영, 연타 1회 처리",4,10,"미착수","S05, S17","A08","wishlist_items","M7, M13"),
 ("F22","아이템","아이템 순서 변경 (드래그·키보드)","개선","PUT .../items/order { itemIds }. 타인·다른 위시리스트 아이템 ID 포함 요청 거부","E2E: 재정렬 후 새로고침 유지. 단위: 타인 ID 거부",4,11,"미착수","S05","A07","wishlist_items.position","M1, L4"),
 ("F39","위시리스트","남용 방지 고정 상한","개선","위시리스트 20개/사용자, 아이템 100개/위시리스트. 상수 한 곳. 초과 시 422 LIMIT_REACHED. 생성 시 대량 입력으로 우회 불가","단위·E2E: 초과 시 LIMIT_REACHED, 우회 불가",4,7,"미착수","S04, S05","A04, A06","—","Q7, Neon 0.5GB 보호"),
 ("F23","공유","공유 URL 구조","개선","/w/{shareId}. shareId 는 PK 와 별도 nanoid(12), 재발급 가능, 저장값에 경로 접두사 없음","E2E: 새 위시리스트 공유 링크 열림",5,12,"미착수","S17","A09","wishlists.shareId","H1 /w/w/"),
 ("F24","공유","공개 위시리스트 페이지 (서버 렌더)","재설계","Server Component 렌더 + generateMetadata(OG·title·lang). 공개용 select 명시(이메일 없음). 비공개·없음은 404. 미리보기 크롤러 허용","E2E: HTML 에 OG·title·lang, 이메일 없음, 비공개 404. 수동: 카카오톡·슬랙",5,12,"미착수","S17","—","wishlists, wishlist_items, users(공개 필드)","H3, M8"),
 ("F25","공유","공유 링크 복사","개선","복사된 링크 = 실제 열리는 URL. 복사 후 토스트","E2E: 복사 링크 = 열리는 URL",5,12,"미착수","S04, S05","—","—","이중 prefix"),
 ("F26","공유","공유 페이지 GA","유지","공유 페이지에만 GA page_view. NEXT_PUBLIC_GA_MEASUREMENT_ID 선택","수동: GA 실시간 page_view",5,12,"미착수","S17","—","—","무료"),
 ("F27","꾸미기","공유 페이지 꾸미기","재설계","테마 프리셋 6종 + 레이아웃 grid/list + 강조색 1 + 소셜 링크. Zod 검증 저장. 진입점은 상세 화면 버튼","E2E: 프리셋 선택 → 공유 페이지 반영. 단위: 스키마 검증",6,13,"미착수","S06, S17","A10","wishlists(themePreset·layout·accentColor·socialLinks — 예정)","Q4"),
 ("F28","설정","프로필 (이름·소개·아바타)","개선","이름·bio·이미지 수정. 요청 취소·에러 상태","E2E: 수정 후 공유 페이지 프로필 반영",6,14,"미착수","S08","A13, A12","users","요청 취소 없음"),
 ("F29","설정","화면 설정 (스킨·모드·언어)","재설계","스킨 canvas·paper·pop + 모드 light·dark·system + 언어. 서버 저장, <html data-skin data-mode> 반영. 공유 페이지 영향 없음","E2E: 변경 후 새로고침 유지, 공유 페이지 무영향",6,15,"미착수","S09","A13","users.skin·mode·locale","app-skin.md, Q5"),
 ("F30","설정","사용자 문의","개선","type·subject·content 등록, 내 문의 목록·상태·답변 표시. priority·category 제거","E2E: 등록 → 목록 → 관리자 답변 후 상태 변경",6,16,"미착수","S11","A15","inquiries","D7"),
 ("F31","설정","공지 열람","유지","게시된 공지만, 고정 공지 상단","E2E: 게시 공지만, 고정 상단",6,17,"미착수","S12","A16","notices","—"),
 ("F32","설정","세션 관리","재설계","내 로그인 기기 목록, 다른 기기 모두 로그아웃 (Better Auth 내장)","E2E: 기기 목록, 다른 기기 로그아웃 후 무효",6,18,"미착수","S10","A14","sessions","토큰 쿼리스트링 노출"),
 ("F33","관리자","관리자 접근 제어","개선","서버에서 role=admin 확인. 일반 사용자 /admin 차단","E2E: 일반 사용자 /admin → 차단",7,19,"미착수","S13~S16","A17~A20","users.role","클라이언트 체크"),
 ("F34","관리자","공지 관리","유지","작성·수정·게시·고정·삭제","E2E: 변경이 사용자 공지 화면에 반영",7,20,"미착수","S14","A17","notices","—"),
 ("F35","관리자","문의 관리","유지","목록·답변·상태 변경","E2E: 답변 → 사용자 화면 표시",7,20,"미착수","S15","A18","inquiries","—"),
 ("F36","관리자","사용자 목록 (읽기)","개선","커서 페이지네이션, limit 상한, 날짜 ISO","E2E: 페이지네이션, ISO 날짜",7,21,"미착수","S16","A19","users","limit 상한 없음"),
 ("F37","관리자","대시보드 숫자 3개","재설계","사용자 수·위시리스트 수·미답변 문의 수","E2E: 시드 기준 세 숫자 일치",7,21,"미착수","S13","A20","users, wishlists, inquiries","Q6"),
 ("I01","인프라","헬스 체크","개선","GET /api/health: DB SELECT 1 성공 200 {data:{status:'ok'}}, 실패 503 UNAVAILABLE (DB 메시지 미노출)","단위: 실패 시 일반 문구. 통합: 200",1,3,"동등성 확인","—","A01","—","DB 메시지 노출"),
 ("I02","인프라","시크릿 스캔","신규","gitleaks pre-commit + CI(gitleaks-action). 리포 PUBLIC","수동: 테스트 시크릿 커밋 차단, CI 실패",0,0,"구현 완료","—","—","—","사용자 원칙, H13"),
 ("I03","인프라","CI","신규","PR 마다 lint·format·typecheck·test:coverage(Postgres service container)·build. E2E 단계는 예정","수동: PR 에서 모든 체크 실행",0,0,"구현 완료 (E2E 단계 예정)","—","—","—","완료 기준 5"),
]

# 삭제 항목
DELETED = [
 ("D01","개발용 페이지","삭제","URL 9개, 데이터 없음","필요 시 개발 환경 전용"),
 ("D02","관리자 목업 화면","삭제","URL 12개, 하드코딩 데이터","없음"),
 ("D03","QnA","삭제","QnA 테이블(폐기 가능)","F30·F35 문의로 통일"),
 ("D04","데이터 가져오기","삭제","없음(주석 처리 상태)","없음"),
 ("D05","조회·클릭 통계","삭제(언젠가)","분석 메뉴, 카운트 컬럼","todo/someday"),
 ("D06","요금제 제한·요금제 페이지","삭제(언젠가)","요금제 구분·페이지","F39 고정 상한만 유지"),
 ("D07","알림 설정","삭제(언젠가)","설정 메뉴","알림 기능과 함께"),
 ("D08","비로그인 공개 위시리스트 전체 목록","삭제","데모 모드 의도, 실사용자 노출","없음 (Q8)"),
 ("D09","무인증 아이템 조회 API","삭제","IDOR","상세 API 포함"),
 ("D10","무인증 사용자 생성 API","삭제","H4","인증 라이브러리가 생성"),
 ("D11","공지 생성 중복 API","삭제","호출처 없음","F34"),
 ("D12","자기 호출 재검증 API","삭제","no-op","F24 서버 렌더 + 재검증 직접 호출"),
 ("D13","국가 헤더 주입","삭제","읽는 곳 없음","없음"),
 ("D14","1회성 데이터 스크립트","삭제(교체 시)","운영 DB 가드 없음","F02 시드"),
 ("D15","죽은 코드 약 85 export","삭제(교체 시)","없음","없음"),
 ("D16","에러 로그(F38)","삭제","ErrorLog 모델·관리자 화면","Sentry + 구조화 로그"),
]

# ---------------------------------------------------------------- 비기능 요구사항
# (ID, 분류, 요구사항, 측정·검증 방법, 근거)
NFR = [
 ("N01","보안","시크릿(키·토큰·접속 문자열)을 git 에 올리지 않는다. pre-commit + CI gitleaks 스캔","커밋·PR 마다 gitleaks 통과","리포 PUBLIC, H13"),
 ("N02","보안","외부 URL 요청은 safe-fetch 로만. DNS→IP 검사, 리다이렉트 재검사, 크기·시간 제한","F11 단위 테스트","H2 SSRF"),
 ("N03","보안","공개 응답은 공개용 select 를 명시하고 이메일 등 개인정보를 포함하지 않는다","F24 E2E: 응답·HTML 에 이메일 없음","H3"),
 ("N04","보안","권한 판정은 서비스 계층 한 곳. 쓰기 API 는 전부 인증 필요","F10 판정표 단위 테스트","H4, M1"),
 ("N05","보안","운영 DB 에 붙을 수 있는 CLI·스크립트는 로컬 호스트 가드(fail-closed). 우회는 셸 값 LINKLET_ALLOW_REMOTE_DB=1 만","prisma.config.ts·시드·테스트 setup 가드 테스트","H12, M6"),
 ("N06","보안","운영(NODE_ENV=production)은 DB 접속에 sslmode 필수, 공개 URL 은 https 강제","env·db-config 단위 테스트","tech-stack"),
 ("N07","개인정보·로그","로그·Sentry 에 이메일·이름·토큰·세션 ID·요청 본문을 남기지 않는다. 사용자 식별은 내부 ID 만. 로그 줄은 허용 목록 키만, 문자열은 redact 통과","logger·redact 단위 테스트, security-reviewer 검토","CLAUDE.md 4-2, E5"),
 ("N08","에러 처리","API 에러 응답은 { error:{code,message,details?} } 하나. 내부 메시지·스택 미노출. 404·500·경계 화면은 앱 테마","F07 단위, F06 E2E","완료 기준 7"),
 ("N09","접근성","키보드만으로 모든 동작. 클릭 요소는 button·a. focus-visible 항상 표시. 본문 대비 4.5:1(공유 페이지 포함). 폼 라벨 연결, 모달 role=dialog·포커스 가두기·Esc","ESLint jsx-a11y 에러, 토큰 대비 검증표, E2E 키보드 시나리오","완료 기준 8, H9"),
 ("N10","i18n","ko·en·ja 3개 언어. 키·플레이스홀더 집합을 타입·테스트로 강제. 화면 문구는 프론트에서 변환, DB 값은 영어 코드","F04 단위 테스트","M14"),
 ("N11","데이터 규약","DB 는 UTC(Timestamptz), 직렬화 ISO 8601, 표시 변환은 프론트. 상태 값은 소문자 영어 enum","코드 리뷰, 스키마","CLAUDE.md 4-2"),
 ("N12","성능","공유 페이지 Lighthouse 모바일 하한 83/88/82(성능/접근성/SEO), 목표 90/95/95. 웹폰트 없음, 클라이언트 번들에 한 언어 사전만, zod/mini(5.5KB gzip)","/baseline 전후 비교(audit/BASELINE-after.md)","INTENT 성공 지표"),
 ("N13","성능·사용성","새 사용자가 Google 로그인 후 첫 공유 링크 복사까지 3분 이내","Phase 6 수동 측정","완료 기준 10"),
 ("N14","테스트","순수 로직(검증·파싱·권한·shared/lib·service)의 커버리지 80% 이상. CI 에서 실패 시 머지 불가","pnpm test:coverage thresholds","완료 기준 6"),
 ("N15","테스트","핵심 흐름(로그인→생성→아이템 추가→공유 열람) E2E 가 CI 에서 통과","Playwright CI 단계(예정)","완료 기준 5"),
 ("N16","품질","TypeScript strict + noUncheckedIndexedAccess, any 금지(ESLint 에러), 파일 250줄 초과 시 분리 검토, 린트·포맷 CI","CI quality 잡","M11, M12"),
 ("N17","운영·예산","무료 티어만: Vercel Hobby, Neon Free(0.5GB), Cloudflare R2, Sentry Developer, Vercel WAF 규칙 1개. 남용 방지 상한으로 용량 보호","tech-stack 무료 한도 표","INTENT 제약"),
 ("N18","운영","마이그레이션은 migrate dev + down.sql, db push 금지. 운영 적용은 사용자가 직접","db:migrate 래퍼, settings.json 확인 규칙","H5"),
 ("N19","가용성","의존 서비스 실패 시 일반 문구로 안내(503 UNAVAILABLE / 502 UPSTREAM_FAILED), 재시도 가능 여부는 code 로 판단","I01·F11 테스트","E1·E2"),
 ("N20","호환","기존 URL(/kr, /jp, /settings/wishlists) 하위 호환·리다이렉트 없음","—","실사용자 0, U-H1"),
]

# ---------------------------------------------------------------- 화면 목록
# (ID, 화면명, 경로, 구간/권한, 주요 구성, 4상태 적용, 주된 행동(CTA), 이동(→), FEATURES, 시안)
SCREENS = [
 ("S01","랜딩","/{locale}","(public) 비로그인","워드마크 Topbar, 히어로 문구, 로그인 CTA, 샘플 설명","—","Google 로 시작하기 → S02","S02",'F03 F05',"landing.html"),
 ("S02","로그인","/{locale}/login","(public)","Google 로그인 버튼 1개, 안내 문구","—","Google 로 계속하기 → S03 (목록 0개면 S04 직행 여부 미결)","S03/S04","F08","landing.html"),
 ("S03","내 위시리스트 목록","/{locale}/wishlists","(app) 로그인","Topbar, 카드 그리드 2열(모바일)/3열(데스크톱), 카드: 제목·아이템 수·카테고리 칩·공개 자물쇠, 하단 고정 '새 위시리스트 만들기'","로딩(스켈레톤)·비어 있음(첫 링크 안내)·에러(문구+다시 시도)·정상","새 위시리스트 만들기 → S04","S04, S05, S07","F13 F15 F16","wishlists-states.html"),
 ("S04","위시리스트 생성 (3분 흐름)","/{locale}/wishlists/new","(app)","단계형: ① 제목 ② 링크 붙여 넣기(미리보기 카드, 여러 개) ③ 완료 — 공유 링크 복사. 진행 표시, 건너뛰기, 카테고리 묻지 않음","제출 중 중복 방지, 미리보기 로딩·실패(직접 입력)","만들기 / 링크 복사하기 → S05","S05","F14 F15 F39 F19 F25","create-flow.html"),
 ("S05","위시리스트 상세","/{locale}/wishlists/{id}","(app) 본인만","헤더(제목·설명·카테고리·공개 토글·꾸미기·공유 링크 복사·편집·삭제), 아이템 그리드(드래그·키보드 순서), 아이템 카드(이미지·제목·가격·받음·메뉴), 하단 고정 '링크 추가', 추가 시트(링크 → 미리보기 → 추가), 편집·삭제 Dialog","로딩·비어 있음(첫 링크 추가 안내)·에러·정상","링크 추가","S06, S17(새 탭), S03","F17 F19 F20 F21 F22 F16 F25","wishlist-detail.html"),
 ("S06","꾸미기","/{locale}/wishlists/{id}/customize","(app) 본인만","프리셋 6종 선택, 레이아웃 grid/list, 강조색 1, 소셜 링크, 실시간 미리보기, 저장","저장 중 중복 방지, 에러","저장 / 링크 복사하기(미결)","S05, S17","F27","share-presets.html"),
 ("S07","설정 허브","/{locale}/settings","(app)","그룹별 행: 계정(프로필·로그인 기기) / 화면(화면 설정 — 현재 값 표시) / 도움말(공지·문의) / 로그아웃. 데스크톱은 같은 목록이 사이드바","—","—","S08 S09 S10 S11 S12","F28 F29 F30 F31 F32 F08","settings.html"),
 ("S08","프로필","/{locale}/settings/profile","(app)","이름·소개·아바타(업로드) 폼, 저장","로딩·에러·저장 중","저장","S07","F28 F20","settings.html"),
 ("S09","화면 설정","/{locale}/settings/appearance","(app)","스킨 3종 선택(canvas·paper·pop), 모드(라이트·다크·시스템), 언어(ko·en·ja). 즉시 반영 + 서버 저장","에러","—(즉시 저장)","S07","F29","settings.html"),
 ("S10","로그인 기기","/{locale}/settings/sessions","(app)","현재 세션 표시, 기기 목록(생성·만료·UA 요약), '다른 기기 모두 로그아웃' Dialog","로딩·비어 있음·에러·정상","다른 기기 모두 로그아웃","S07","F32","—"),
 ("S11","문의","/{locale}/help","(app)","문의 폼(type·subject·content), 내 문의 목록(상태·답변)","로딩·비어 있음·에러·정상, 제출 중 중복 방지","보내기","S07","F30","—"),
 ("S12","공지","/{locale}/notices","(public)","게시 공지 목록(고정 상단), 상세 펼침","로딩·비어 있음·에러·정상","—","S07","F31","—"),
 ("S13","관리자 대시보드","/{locale}/admin","admin","숫자 3개: 사용자·위시리스트·미답변 문의. 하위 메뉴 링크","로딩·에러·정상","—","S14 S15 S16","F33 F37","—"),
 ("S14","관리자 공지 관리","/{locale}/admin/notices","admin","공지 목록, 작성·수정 폼, 게시·고정 토글, 삭제 Dialog","4상태","작성","S13","F34","—"),
 ("S15","관리자 문의 관리","/{locale}/admin/inquiries","admin","문의 목록(상태 필터 ?status=), 답변 입력, 상태 변경","4상태","답변 등록","S13","F35","—"),
 ("S16","관리자 사용자 목록","/{locale}/admin/users","admin","읽기 전용 목록(이름·가입일 ISO→표시), 커서 '더 보기'","4상태","—","S13","F36","—"),
 ("S17","공유 페이지","/w/{shareId}","공개(비로그인), 서버 렌더","소유자(아바타 40px·이름), 제목·설명, 아이템 그리드 2열 또는 리스트(프리셋·레이아웃), 아이템 카드 전체 <a> → 상품, 받음 배지, 하단 작은 유입 동선 '나도 만들어 보기'. OG 메타. 보는 사람의 스킨·모드 미적용","로딩·비어 있음·에러는 프리셋 변수만 사용. 비공개·없음은 404","상품 보러 가기","외부 상품, S01","F23 F24 F25 F26 F27","direction-b.html, share-presets.html"),
 ("S18","404","매치 안 되는 URL 전부 / notFound() 호출","공개","global-not-found: 세 언어 고정 문구, '홈으로'. [locale]/not-found: 해당 언어","—","홈으로 → S01","S01","F06","—"),
 ("S19","에러 경계","렌더 에러 시","공개","[locale]/error: 문구 + 다시 시도(retry). global-error: 세 언어 고정, 자체 <html>","—","다시 시도","—","F06","—"),
]

# ---------------------------------------------------------------- API 목록
# (ID, 메서드, 경로, 용도, 인증, 요청(요약), 성공 응답, 에러 코드, FEATURES, 상태)
APIS = [
 ("A01","GET","/api/health","헬스 체크 (DB SELECT 1)","없음","—","200 { data: { status: 'ok' } }","503 UNAVAILABLE","I01","구현"),
 ("A02","ANY","/api/auth/[...all]","Better Auth 핸들러 (Google 로그인·콜백·세션·로그아웃·세션 목록)","라이브러리","Better Auth 규격","Better Auth 규격","Better Auth 내장 429 포함","F08 F32","예정(F08)"),
 ("A03","GET","/api/wishlists","내 위시리스트 목록 (본인, 상한 20 → 한 번에)","로그인","—","200 { data: WishlistDto[], nextCursor: null }","401","F13","확정"),
 ("A04","POST","/api/wishlists","위시리스트 생성 (초기 링크 목록 포함 가능, 트랜잭션, 상한 검사)","로그인","{ title, description?, items?: [{ productUrl, title?, imageUrl?, price?, currency?, siteName? }] } (미리보기 결과를 클라이언트가 채워 보냄, ≤100)","201 { data: WishlistDto }","400 VALIDATION_FAILED, 401, 422 LIMIT_REACHED","F14 F39","확정"),
 ("A05","GET / PATCH / DELETE","/api/wishlists/{id}","상세(아이템 포함) / 부분 수정(title·description·category·isPublic) / 삭제","로그인·본인","PATCH { title?, description?, category?: 'birthday'|'occasion'|'someday'|null, isPublic? }","200 { data } / 200 { data } / 204","400, 401, 404 NOT_FOUND(타인 포함)","F17 F15 F16","확정"),
 ("A06","POST","/api/wishlists/{id}/items","아이템 추가 (링크 메타데이터 채움, 상한 100 검사)","로그인·본인","{ productUrl, title?, imageUrl?, price?, currency?, description? }","201 { data: ItemDto }","400(scheme), 401, 404, 422 LIMIT_REACHED, 502 UPSTREAM_FAILED","F19 F39","확정"),
 ("A07","PUT","/api/wishlists/{id}/items/order","아이템 순서 집합 교체","로그인·본인","{ itemIds: string[] } (전부 해당 위시리스트 소속이어야 함)","200 { data: ItemDto[] }","400, 401, 404","F22","확정"),
 ("A08","PATCH / DELETE","/api/items/{id}","아이템 수정(isReceived 포함) / 삭제","로그인·본인","PATCH { title?, description?, imageUrl?, price?, currency?, isReceived? }","200 { data } / 204","400, 401, 404","F21","확정"),
 ("A09","POST","/api/wishlists/{id}/share-id","공유 ID 재발급 (옛 링크 무효화)","로그인·본인","—","200 { data: { shareId } }","401, 404","F23","확정"),
 ("A10","PUT","/api/wishlists/{id}/customization","꾸미기 설정 집합 교체 (프리셋·레이아웃·강조색·소셜 링크)","로그인·본인","{ themePreset, layout: 'grid'|'list', accentColor?, socialLinks? } (Zod)","200 { data }","400, 401, 404","F27","예정(이식 시 확정)"),
 ("A11","POST","/api/link-previews","URL 메타데이터 추출 (safe-fetch + 파서). WAF 레이트 리밋 대상","로그인","{ url } (http/https 만)","200 { data: { title, imageUrl, price, currency, siteName } | null 필드 }","400, 401, 429 RATE_LIMITED, 502 UPSTREAM_FAILED","F11 F12 F18","확정"),
 ("A12","POST","/api/uploads","이미지 업로드 (R2). MIME·매직바이트·크기 검사, SVG 금지","로그인","multipart (image)","201 { data: { url } }","400, 401, 413→VALIDATION_FAILED, 502","F20","확정"),
 ("A13","GET / PATCH","/api/users/me","내 프로필·화면 설정 조회 / 수정 (name·bio·image·locale·skin·mode)","로그인","PATCH { name?, bio?, image?, locale?, skin?, mode? }","200 { data: UserDto }","400, 401","F28 F29","예정(이식 시 확정)"),
 ("A14","GET / DELETE","/api/sessions (또는 Better Auth listSessions·revokeOtherSessions)","내 세션 목록 / 다른 기기 모두 로그아웃","로그인","—","200 { data: SessionDto[], nextCursor: null } / 204","401","F32","예정(F32 때 Better Auth 내장 여부 확정)"),
 ("A15","GET / POST","/api/inquiries","내 문의 목록 / 문의 등록","로그인","POST { type, subject, content }","200 { data[], nextCursor } / 201 { data }","400, 401","F30","확정"),
 ("A16","GET","/api/notices","게시된 공지 목록 (고정 상단, 최신순)","없음","?cursor=","200 { data[], nextCursor }","—","F31","확정"),
 ("A17","GET / POST / PATCH / DELETE","/api/admin/notices, /api/admin/notices/{id}","공지 관리","admin","{ title, content, isPublished, isPinned }","200/201/204","400, 401, 403 FORBIDDEN, 404","F34","확정"),
 ("A18","GET / PATCH","/api/admin/inquiries, /api/admin/inquiries/{id}","문의 목록(?status=) / 답변·상태 변경","admin","PATCH { response?, status? }","200","400, 401, 403, 404","F35","확정"),
 ("A19","GET","/api/admin/users","사용자 목록 (커서, limit 상한)","admin","?cursor=&limit=","200 { data: AdminUserDto[], nextCursor }","401, 403","F36","확정"),
 ("A20","GET","/api/admin/stats","대시보드 숫자 3개","admin","—","200 { data: { users, wishlists, pendingInquiries } }","401, 403","F37","확정"),
]

# ---------------------------------------------------------------- 테이블 정의 (schema.prisma 2026-11-22 + 예정)
# 공통: PK uuid(7) @db.Uuid, DateTime Timestamptz(3), snake_case 복수형 테이블, camelCase 컬럼
TABLES = [
 {"name":"users","model":"User","desc":"사용자 — Better Auth 핵심 필드 + 앱 설정 필드","status":"구현(init)",
  "cols":[("id","uuid","N","uuid(7)","PK"),("name","text","N","","표시 이름"),("email","text","N","","UNIQUE. 공개 응답에 절대 포함하지 않음"),("emailVerified","boolean","N","false",""),("image","text","Y","","아바타 URL"),("bio","text","Y","","소개"),("locale","enum Locale","N","ko","ko·en·ja"),("skin","enum AppSkin","N","canvas","canvas·paper·pop"),("mode","enum AppMode","N","system","light·dark·system"),("role","text","N","user","[예정 F08] admin 플러그인 (user·admin)"),("banned 등","—","Y","","[예정 F08] admin 플러그인 필드"),("createdAt","timestamptz(3)","N","now()",""),("updatedAt","timestamptz(3)","N","@updatedAt","")],
  "idx":["PK(id)","UNIQUE(email)"],"rel":["wishlists 1:N (Cascade)","inquiries 1:N (Cascade)","sessions·accounts 1:N [예정 F08]"]},
 {"name":"wishlists","model":"Wishlist","desc":"위시리스트 — 소유자 필수, 공유 전용 ID","status":"구현(init) + 예정(F27 컬럼)",
  "cols":[("id","uuid","N","uuid(7)","PK"),("userId","uuid","N","","FK users.id, Cascade"),("title","text","N","","길이 제한은 Zod"),("description","text","Y","",""),("shareId","text","N","nanoid(12)","UNIQUE. 경로 접두사 없음. 재발급 가능"),("isPublic","boolean","N","true","기본 공개(Q2)"),("category","enum WishlistCategory","Y","","birthday·occasion·someday, null=미선택"),("themePreset","text/enum","N","canvas","[예정 F27] 프리셋 6종"),("layout","enum","N","grid","[예정 F27] grid·list"),("accentColor","text","Y","","[예정 F27] #RRGGBB"),("socialLinks","jsonb","Y","","[예정 F27] Zod 검증 저장"),("createdAt","timestamptz(3)","N","now()",""),("updatedAt","timestamptz(3)","N","@updatedAt","")],
  "idx":["PK(id)","UNIQUE(shareId)","INDEX(userId)"],"rel":["user N:1","items 1:N (Cascade)"]},
 {"name":"wishlist_items","model":"WishlistItem","desc":"아이템 — 상품 링크 한 개","status":"구현(init)",
  "cols":[("id","uuid","N","uuid(7)","PK"),("wishlistId","uuid","N","","FK wishlists.id, Cascade"),("title","text","N","",""),("description","text","Y","",""),("productUrl","text","N","","http/https 만 (Zod)"),("imageUrl","text","Y","",""),("siteName","text","Y","",""),("price","decimal(14,2)","Y","","숫자형. 통화와 쌍"),("currency","char(3)","Y","","ISO 4217. 파서 미확정 시 둘 다 null"),("position","int","N","0","순서(F22)"),("isReceived","boolean","N","false","받음 표시"),("createdAt","timestamptz(3)","N","now()",""),("updatedAt","timestamptz(3)","N","@updatedAt","")],
  "idx":["PK(id)","INDEX(wishlistId, position)"],"rel":["wishlist N:1"]},
 {"name":"notices","model":"Notice","desc":"공지","status":"구현(init)",
  "cols":[("id","uuid","N","uuid(7)","PK"),("title","text","N","",""),("content","text","N","",""),("isPublished","boolean","N","false",""),("isPinned","boolean","N","false",""),("createdAt","timestamptz(3)","N","now()",""),("updatedAt","timestamptz(3)","N","@updatedAt","")],
  "idx":["PK(id)","INDEX(isPublished, isPinned, createdAt)"],"rel":[]},
 {"name":"inquiries","model":"Inquiry","desc":"사용자 문의 (QnA 통합, priority·category 제거)","status":"구현(init)",
  "cols":[("id","uuid","N","uuid(7)","PK"),("userId","uuid","N","","FK users.id, Cascade"),("type","enum InquiryType","N","","question·feedback·bug_report·feature_request"),("subject","text","N","",""),("content","text","N","",""),("response","text","Y","","관리자 답변"),("status","enum InquiryStatus","N","pending","pending·in_progress·answered·closed"),("respondedAt","timestamptz(3)","Y","",""),("createdAt","timestamptz(3)","N","now()",""),("updatedAt","timestamptz(3)","N","@updatedAt","")],
  "idx":["PK(id)","INDEX(userId)","INDEX(status)"],"rel":["user N:1"]},
 {"name":"sessions","model":"Session","desc":"[예정 F08] Better Auth DB 세션","status":"예정(F08)",
  "cols":[("id","uuid","N","uuid(7)","PK"),("userId","uuid","N","","FK users.id"),("token","text","N","","UNIQUE. 로그·응답에 노출 금지"),("expiresAt","timestamptz(3)","N","",""),("ipAddress","text","Y","","Better Auth 기본 — 수집 여부 F08 결정"),("userAgent","text","Y","","기기 목록 표시용"),("impersonatedBy","uuid","Y","","admin 플러그인"),("createdAt","timestamptz(3)","N","now()",""),("updatedAt","timestamptz(3)","N","@updatedAt","")],
  "idx":["PK(id)","UNIQUE(token)","INDEX(userId)"],"rel":["user N:1"]},
 {"name":"accounts","model":"Account","desc":"[예정 F08] 소셜 계정 연결 (Google)","status":"예정(F08)",
  "cols":[("id","uuid","N","uuid(7)","PK"),("userId","uuid","N","","FK users.id"),("providerId","text","N","","google"),("accountId","text","N","",""),("accessToken / refreshToken / idToken","text","Y","","시크릿 — 로그 금지"),("accessTokenExpiresAt 등","timestamptz(3)","Y","",""),("createdAt / updatedAt","timestamptz(3)","N","","")],
  "idx":["PK(id)","INDEX(userId)"],"rel":["user N:1"]},
 {"name":"verifications","model":"Verification","desc":"[예정 F08] Better Auth 검증 토큰","status":"예정(F08)",
  "cols":[("id","uuid","N","uuid(7)","PK"),("identifier","text","N","",""),("value","text","N","",""),("expiresAt","timestamptz(3)","N","",""),("createdAt / updatedAt","timestamptz(3)","N","","")],
  "idx":["PK(id)"],"rel":[]},
]

ENUMS = [
 ("Locale","ko, en, ja","언어 (U3)"),
 ("AppSkin","canvas, paper, pop","앱 스킨"),
 ("AppMode","light, dark, system","앱 모드"),
 ("WishlistCategory","birthday, occasion, someday","계기 카테고리 (null=미선택)"),
 ("InquiryType","question, feedback, bug_report, feature_request","문의 구분"),
 ("InquiryStatus","pending, in_progress, answered, closed","문의 상태"),
]

# ---------------------------------------------------------------- 에러 코드
ERRORS = [
 ("VALIDATION_FAILED",400,"입력 검증 실패 (details[{path,code}])","N","입력한 내용에 문제가 있어요. 표시된 항목을 확인해 주세요"),
 ("UNAUTHENTICATED",401,"로그인 필요","N","로그인이 필요해요. 로그인한 뒤 다시 시도해 주세요"),
 ("FORBIDDEN",403,"권한 없음","N","이 작업을 할 수 있는 권한이 없어요. 내 위시리스트가 맞는지 확인해 주세요"),
 ("NOT_FOUND",404,"없음 (타인 비공개도 404 로 존재 숨김)","N","찾는 항목이 없어요. 주소를 확인하거나 목록으로 돌아가 주세요"),
 ("CONFLICT",409,"상태 충돌","N","다른 곳에서 먼저 바뀌었어요. 새로고침한 뒤 다시 시도해 주세요"),
 ("LIMIT_REACHED",422,"남용 방지 상한 도달 (F39)","N","만들 수 있는 개수를 다 썼어요. 쓰지 않는 항목을 정리한 뒤 다시 시도해 주세요"),
 ("RATE_LIMITED",429,"요청 빈도 초과","Y","요청이 너무 잦아요. 잠시 쉬었다가 다시 시도해 주세요"),
 ("UPSTREAM_FAILED",502,"외부 서비스 실패 (링크 대상 사이트·저장소)","Y","링크 정보를 불러오지 못했어요. 주소를 확인하거나 직접 입력해 주세요"),
 ("INTERNAL",500,"예상 못한 실패 (로그·Sentry 기록)","Y","문제가 생겼어요. 잠시 뒤 다시 시도해 주세요"),
 ("UNAVAILABLE",503,"서비스 일시 불가 (헬스 체크 전용)","Y","지금은 잠시 이용할 수 없어요. 조금 뒤 다시 시도해 주세요"),
 ("UNKNOWN","—","프론트 폴백 (알 수 없는 코드)","—","알 수 없는 문제가 생겼어요. 새로고침하거나 잠시 뒤 다시 시도해 주세요"),
]

# ---------------------------------------------------------------- 환경변수
ENVS = [
 ("NODE_ENV","서버","필수","development | test | production","구현"),
 ("NEXT_PUBLIC_APP_URL","공개","필수","앱 공개 URL (http/https). production 은 https","구현"),
 ("DATABASE_URL","서버","필수","pooled Postgres 접속 문자열 (런타임, adapter-pg). production 은 sslmode 필수","구현"),
 ("DATABASE_URL_UNPOOLED","서버","필수","direct Postgres (Prisma CLI·migrate). 로컬 가드 대상","구현"),
 ("BETTER_AUTH_SECRET","서버","F08 필수","32자 이상","스키마 선택(예정 필수)"),
 ("BETTER_AUTH_URL","서버","F08 필수","origin 이 NEXT_PUBLIC_APP_URL 과 일치","스키마 선택(예정 필수)"),
 ("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET","서버","F08 필수","Google OAuth","스키마 선택(예정 필수)"),
 ("R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_BASE_URL","서버","F20 필수","Cloudflare R2 (S3 호환). PUBLIC_BASE_URL 은 production https","예정(F20)"),
 ("NEXT_PUBLIC_SENTRY_DSN","공개","선택","Sentry DSN (없으면 전송 안 함)","구현(스키마)"),
 ("SENTRY_AUTH_TOKEN","서버","선택","소스맵 업로드(빌드)","구현(스키마)"),
 ("NEXT_PUBLIC_GA_MEASUREMENT_ID","공개","선택","GA (공유 페이지만)","구현(스키마)"),
 ("LINKLET_E2E","서버","테스트 전용","'1' 이면 e2e/throw 라우트가 throw. Playwright webServer 만","구현"),
 ("LINKLET_TEST_DB_PORT","CLI","테스트 전용","테스트 DB 포트 (기본 5434)","구현"),
 ("LINKLET_REQUIRE_TEST_DB","CLI","CI 전용","'1' 이면 테스트 DB 미기동 시 실패","구현"),
 ("LINKLET_ALLOW_REMOTE_DB","CLI(셸 값만)","운영 적용 시","'1' 이면 Prisma CLI 로컬 가드 우회 — 사용자가 직접 실행할 때만","구현"),
]

# ---------------------------------------------------------------- 권한 판정표 (F10)
PERMS = [
 ("내 위시리스트 목록 조회","✗ 401","본인만","본인만(관리자도 타인 목록 X)","F13"),
 ("위시리스트 상세(앱)","✗ 401","✓","✗ 404","F17"),
 ("위시리스트 생성·수정·삭제","✗ 401","✓ (상한 검사)","✗ 404","F14 F17"),
 ("아이템 추가·수정·삭제·순서","✗ 401","✓ (위시리스트 소유 확인, 아이템 ID 전부 소속 검사)","✗ 404","F19 F21 F22"),
 ("공유 ID 재발급","✗ 401","✓","✗ 404","F23"),
 ("공유 페이지 /w/{shareId}","공개 ✓ (isPublic) / 비공개 ✗ 404","✓ (비공개여도 본인은 — F24 때 결정)","공개 ✓ / 비공개 ✗ 404","F24"),
 ("링크 미리보기·업로드","✗ 401","✓ (레이트 리밋)","—","F11 F20"),
 ("프로필·화면 설정·세션","✗ 401","본인만","✗","F28 F29 F32"),
 ("문의 등록·내 문의","✗ 401","본인만","✗","F30"),
 ("공지 열람","✓","✓","✓","F31"),
 ("관리자 화면·API","✗ 401","✗ 403 (role≠admin)","admin ✓","F33~F37"),
]

GLOSSARY = [
 ("위시리스트","wishlist","상품 링크를 모은 목록 한 개"),
 ("아이템","item / WishlistItem","위시리스트 안의 상품 한 개"),
 ("상품 링크","productUrl","아이템의 원 상품 URL"),
 ("링크 미리보기","linkPreview","URL 메타데이터(제목·이미지·가격·사이트명)"),
 ("받음 표시","isReceived","리뉴얼 전 isCompleted"),
 ("공유 ID / 공유 링크","shareId / share link","PK 와 별도의 추측 불가 ID, /w/{shareId}"),
 ("공유 페이지","share page","로그인 없이 보는 공개 페이지"),
 ("공개 여부","isPublic","기본 공개 = 링크 아는 사람만"),
 ("꾸미기","customization","공유 페이지 모양(프리셋·레이아웃·강조색·소셜 링크)"),
 ("테마 프리셋","themePreset","공유 페이지 프리셋 6종"),
 ("스킨","skin","앱 화면 팔레트(canvas·paper·pop). 색·반경·그림자만"),
 ("모드","mode","light·dark·system"),
 ("카테고리","category","계기 3종 birthday·occasion·someday"),
 ("남용 방지 상한","usageLimit","위시리스트 20, 아이템 100"),
 ("문의","inquiry","리뉴얼 전 QnA 폐기"),
 ("공지","notice",""),
 ("관리자","admin","Better Auth role='admin'"),
 ("세션","session","DB 세션(Better Auth)"),
 ("동등성 확인","parity","FEATURES 행의 확인 방법(E2E·단위·수동)을 통과한 상태"),
 ("4상태","four states","로딩·비어 있음·에러·정상"),
]

# ---------------------------------------------------------------- 로드맵
PHASES = [
 (0,"준비","기준선 E2E, 파서 fixture, 리디자인 방향·시안·토큰, 카테고리·설정 메뉴 결정","—","완료"),
 (1,"기반","F01–F07, I01 + 토큰 적용, CI Postgres","F01 F02 F03 F04 F05 F06 F07 I01","진행 중 (Sentry 연결·CI E2E 단계 남음)"),
 (2,"인증","Better Auth, 권한 계층, 라우트 보호","F08 F09 F10","미착수 (사용자: OAuth 리디렉션 URI)"),
 (3,"링크 미리보기","safe-fetch, 파서, 레이트 리밋","F11 F12 F18","미착수"),
 (4,"핵심 흐름","목록·생성·상세·아이템·업로드·상한","F13–F17 F19–F22 F39","미착수 (사용자: R2)"),
 (5,"공유 + 첫 배포","공유 URL·서버 렌더·복사·GA, Vercel·Neon·WAF","F23–F26","미착수"),
 (6,"꾸미기·설정","프리셋, 프로필, 화면 설정, 문의, 공지, 세션","F27–F32","미착수"),
 (7,"관리자","접근 제어, 공지·문의 관리, 사용자 목록, 대시보드","F33–F37","미착수"),
 (8,"교체","완료 기준 1·3·4·9 확인 후 루트 교체, 기존 코드 일괄 제거","—","미착수"),
]

# 테스트 전략
TESTS = [
 ("T1","테스트 대상","순수 로직(검증·파싱·권한)·서비스(실 DB)·API 계약·핵심 흐름 E2E. UI 렌더 단위 테스트는 하지 않음"),
 ("T3","'테스트 없는 기능' 정의","FEATURES 행의 동등성 확인 방법에 적힌 테스트가 없으면 미완"),
 ("T4","커버리지","src/shared/lib/**, features/*/schema.ts, features/*/server/service.ts 에 한정 80% (lines·functions·branches·statements)"),
 ("T5","통합 테스트 DB","Docker Postgres(로컬 5434) / CI service container. globalSetup 이 migrate deploy, beforeEach 가 TRUNCATE(3중 가드). CI 는 LINKLET_REQUIRE_TEST_DB=1"),
 ("T6","파일 위치","단위·통합 *.test.ts 소스 옆, E2E e2e/*.spec.ts"),
 ("T7·T8·T9","기존 앱 기준선 E2E","v2/e2e/baseline, 기존 앱 next start -p 3001, 전용 컨테이너 db push(예외), psql 고정 SQL 시드. 로컬만"),
 ("T10","테스트 DB 접속","별도 키 없음. setup 이 DATABASE_URL 을 로컬 테스트 DB 로 덮음. 비로컬이면 즉시 실패"),
 ("E2E 인증","세션 주입","Google OAuth 자동화 없음. 시드 사용자·세션 주입. 실제 로그인은 수동"),
]

def dump(path):
    data = dict(DOC_DATE=DOC_DATE, VERSION=VERSION, FR=FR, DELETED=DELETED, NFR=NFR, SCREENS=SCREENS, APIS=APIS, TABLES=TABLES, ENUMS=ENUMS, ERRORS=ERRORS, ENVS=ENVS, PERMS=PERMS, GLOSSARY=GLOSSARY, PHASES=PHASES, TESTS=TESTS)
    with open(path,'w',encoding='utf-8') as f: json.dump(data,f,ensure_ascii=False,indent=1)

if __name__=='__main__':
    dump(sys.argv[1])
    print("FR",len(FR),"NFR",len(NFR),"SCREENS",len(SCREENS),"APIS",len(APIS),"TABLES",len(TABLES))
