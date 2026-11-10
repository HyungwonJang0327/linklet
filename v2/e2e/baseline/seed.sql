-- 기존 앱 기준선 E2E 시드 (decisions/testing.md T9)
-- - 대상: 기준선 전용 컨테이너(linklet-baseline-db)의 기존 앱 스키마(prisma/schema.prisma, db push 결과)
-- - 실행: seed-baseline.sh (= pnpm baseline:seed). baseline:up 이 db push 직후에 한 번 실행한다
-- - 멱등: 한 트랜잭션에서 TRUNCATE … CASCADE 후 INSERT. 몇 번 흘려도 같은 상태가 된다
-- - 값은 전부 더미·고정값. 실제 개인정보·시크릿 없음. 테스트(public.spec.ts 등)가 이 값을 그대로 단언한다
-- - 기존 앱의 H1 버그(shareUrl 에 'w/' 접두사 저장)는 재현하지 않는다 — getWishlistByShareUrl 은 경로 파라미터를
--   그대로 findUnique 하므로 접두사 없는 값이 /w/{shareUrl} 로 열린다 (README "시드 데이터" 참고)
-- - 컬럼명은 Prisma camelCase 그대로라 큰따옴표가 필요하다. "updatedAt" 은 @updatedAt(DB 기본값 없음)이라 명시한다

-- TRUNCATE 가 qnas·user_inquiries 로 연쇄된다는 NOTICE 를 숨긴다 (연쇄 자체는 의도한 동작)
SET client_min_messages = warning;

BEGIN;

TRUNCATE TABLE "users", "wishlists", "wishlist_items", "sessions", "accounts" RESTART IDENTITY CASCADE;

INSERT INTO "users" ("id", "email", "name", "locale", "isAdmin", "createdAt", "updatedAt")
VALUES ('baseline-user', 'baseline@example.com', 'Baseline Tester', 'kr', false, now(), now());

-- 위시리스트: 공개 1 + 비공개 1. customization NULL → 공유 페이지가 기본값(제목을 h1 로 표시)을 쓴다
INSERT INTO "wishlists" ("id", "title", "description", "shareUrl", "isPublic", "userId", "createdAt", "updatedAt")
VALUES
  ('baseline-wishlist-public',  'Baseline Public Wishlist',  '기준선 공개 위시리스트', 'baseline-public',  true,  'baseline-user', now(), now()),
  ('baseline-wishlist-private', 'Baseline Private Wishlist', NULL,                     'baseline-private', false, 'baseline-user', now(), now());

-- 아이템 3개 (priority 오름차순이 표시 순서). 3번은 받음(isCompleted=true). imageUrl 은 기존 앱 public/ 의 정적 파일
INSERT INTO "wishlist_items" ("id", "title", "productUrl", "imageUrl", "price", "siteName", "priority", "isCompleted", "wishlistId", "createdAt", "updatedAt")
VALUES
  ('baseline-item-1', 'Baseline Item 1 - Headphones', 'https://example.com/products/headphones', '/globe.svg', '₩129,000', 'example.com', 0, false, 'baseline-wishlist-public', now(), now()),
  ('baseline-item-2', 'Baseline Item 2 - Keyboard',   'https://example.com/products/keyboard',   NULL,         '$89.00',   'example.com', 1, false, 'baseline-wishlist-public', now(), now()),
  ('baseline-item-3', 'Baseline Item 3 - Mug',        'https://example.com/products/mug',        '/file.svg',  '¥1,500',   'example.com', 2, true,  'baseline-wishlist-public', now(), now());

-- 세션: 로그인 흐름 E2E 가 next-auth.session-token 쿠키로 주입한다 (T8). 만료는 먼 미래
INSERT INTO "sessions" ("id", "sessionToken", "userId", "expires")
VALUES ('baseline-session', 'baseline-session-token', 'baseline-user', '2099-01-01T00:00:00Z');

COMMIT;
