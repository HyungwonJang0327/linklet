# Linklet API 문서

## 개요

Linklet API는 위시리스트, 위시리스트 아이템, 사용자 데이터 및 메타데이터 추출을 관리하기 위한 RESTful 엔드포인트를 제공합니다.

## 베이스 URL

```
http://localhost:3000/api (개발 환경)
```

## 인증

대부분의 엔드포인트는 NextAuth.js 세션 쿠키를 통한 인증이 필요합니다. 인증되지 않은 요청은 `401 Unauthorized` 응답을 반환합니다.

---

## 위시리스트

### 사용자 위시리스트 목록 조회

```http
GET /api/wishlists?userId={userId}
```

**쿼리 파라미터:**
- `userId` (필수): 위시리스트를 조회할 사용자 ID

**응답:** `200 OK`
```json
[
  {
    "id": "cuid_...",
    "title": "2024년 생일 선물",
    "description": "생일에 받고 싶은 선물",
    "isPublic": true,
    "category": "birthday",
    "shareUrl": "abc123",
    "userId": "user_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "items": [...],
    "_count": { "items": 5 }
  }
]
```

### 공개 위시리스트 목록 조회

```http
GET /api/wishlists
```

둘러보기용 공개 위시리스트 최대 20개를 반환합니다.

**응답:** `200 OK`
```json
[
  {
    "id": "cuid_...",
    "title": "크리스마스 위시리스트",
    "isPublic": true,
    "user": {
      "id": "user_id",
      "name": "홍길동"
    },
    "_count": { "items": 3 }
  }
]
```

### 위시리스트 생성

```http
POST /api/wishlists
```

**요청 본문:**
```json
{
  "title": "내 위시리스트",
  "description": "설명",
  "isPublic": true,
  "category": "general",
  "userId": "user_id",
  "productLinks": [
    {
      "url": "https://example.com/product",
      "title": "상품명",
      "imageUrl": "https://example.com/image.jpg",
      "price": "29,900원"
    }
  ]
}
```

**응답:** `201 Created`
```json
{
  "id": "cuid_...",
  "title": "내 위시리스트",
  "shareUrl": "xyz789",
  ...
}
```

### 위시리스트 ID로 조회

```http
GET /api/wishlists/{id}
```

**응답:** `200 OK`
```json
{
  "id": "cuid_...",
  "title": "내 위시리스트",
  "items": [
    {
      "id": "item_id",
      "title": "상품명",
      "productUrl": "https://...",
      "imageUrl": "https://...",
      "price": "29,900원",
      "priority": 1,
      "isCompleted": false
    }
  ]
}
```

**에러 응답:**
- `404 Not Found`: 위시리스트를 찾을 수 없음
- `403 Forbidden`: 비공개 위시리스트, 접근 거부됨

### 위시리스트 수정

```http
PUT /api/wishlists/{id}
```

**요청 본문:**
```json
{
  "title": "수정된 제목",
  "description": "수정된 설명",
  "isPublic": false
}
```

**응답:** `200 OK`

### 위시리스트 삭제

```http
DELETE /api/wishlists/{id}
```

**응답:** `200 OK`

### 공유 위시리스트 조회

```http
GET /api/wishlists/share/{shareUrl}
```

공유 URL을 통한 위시리스트 접근을 위한 공개 엔드포인트입니다. ISR 재검증을 사용합니다.

**응답:** `200 OK` (위시리스트 ID로 조회와 동일)

---

## 위시리스트 아이템

### 위시리스트에 아이템 추가

```http
POST /api/wishlists/{wishlistId}/items
```

**요청 본문:**
```json
{
  "title": "상품명",
  "productUrl": "https://example.com/product",
  "imageUrl": "https://example.com/image.jpg",
  "description": "상품 설명",
  "price": "29,900원",
  "priority": 1
}
```

**응답:** `201 Created`

### 아이템 순서 변경

```http
POST /api/wishlists/{wishlistId}/items/reorder
```

**요청 본문:**
```json
{
  "itemIds": ["item1_id", "item2_id", "item3_id"]
}
```

제공된 배열 순서에 따라 아이템을 재정렬합니다.

**응답:** `200 OK`

### 아이템 조회

```http
GET /api/items/{id}
```

**응답:** `200 OK`

### 아이템 수정

```http
PUT /api/items/{id}
```

**요청 본문:**
```json
{
  "title": "수정된 제목",
  "price": "39,900원",
  "priority": 2
}
```

공유 위시리스트 페이지를 자동으로 재검증합니다 (ISR).

**응답:** `200 OK`

### 아이템 삭제

```http
DELETE /api/items/{id}
```

공유 위시리스트 페이지를 자동으로 재검증합니다 (ISR).

**응답:** `200 OK`

### 아이템 완료 상태 토글

```http
POST /api/items/{id}/toggle-complete
```

아이템의 `isCompleted` 상태를 토글합니다.

**응답:** `200 OK`

---

## 사용자

### 사용자 프로필 조회

```http
GET /api/users?id={userId}
```

**응답:** `200 OK`
```json
{
  "id": "user_id",
  "name": "홍길동",
  "email": "hong@example.com",
  "image": "https://...",
  "bio": "사용자 소개",
  "locale": "kr"
}
```

### 사용자 생성

```http
POST /api/users
```

**요청 본문:**
```json
{
  "email": "hong@example.com",
  "name": "홍길동"
}
```

**응답:** `201 Created`

### 사용자 프로필 수정

```http
PUT /api/users
```

**요청 본문:**
```json
{
  "id": "user_id",
  "name": "수정된 이름",
  "bio": "새로운 소개",
  "locale": "en"
}
```

TanStack Query를 통한 낙관적 업데이트를 사용합니다.

**응답:** `200 OK`

### 사용자 위시리스트 조회

```http
GET /api/users/{userId}/wishlists
```

**응답:** `200 OK` (위시리스트 배열)

### 사용자 통계 조회

```http
GET /api/users/{userId}/stats
```

**응답:** `200 OK`
```json
{
  "totalWishlists": 5,
  "totalItems": 23,
  "completedItems": 8
}
```

---

## 메타데이터 & 미디어

### URL 메타데이터 추출

```http
POST /api/metadata
```

Cheerio를 사용하여 URL에서 상품 메타데이터를 추출합니다. 재시도 로직 및 레이트 리미팅(IP당 분당 10회)이 포함되어 있습니다.

**요청 본문:**
```json
{
  "url": "https://example.com/product"
}
```

**응답:** `200 OK`
```json
{
  "title": "상품명",
  "description": "상품 설명",
  "images": ["https://example.com/image.jpg"],
  "price": "29,900원",
  "siteName": "예제 스토어"
}
```

**기능:**
- Open Graph, Twitter Cards, JSON-LD 지원
- 한국 이커머스 사이트 지원 (쿠팡, 11번가, G마켓, 네이버쇼핑)
- srcset에서 고해상도 이미지 추출
- 5xx 에러 및 타임아웃 시 자동 재시도
- 지수 백오프를 사용한 15초 타임아웃

**에러 응답:**
- `400 Bad Request`: 유효하지 않은 URL
- `429 Too Many Requests`: 레이트 리밋 초과
- `500 Internal Server Error`: 추출 실패

### 이미지 업로드

```http
POST /api/image
```

AWS S3에 이미지를 업로드합니다.

**요청:** `multipart/form-data`에 `file` 필드 포함

**응답:** `200 OK`
```json
{
  "url": "https://s3.amazonaws.com/bucket/image.jpg"
}
```

---

## 재검증 (ISR)

### 단일 경로 재검증

```http
POST /api/revalidate
```

**요청 본문:**
```json
{
  "path": "/w/shareUrl123",
  "secret": "your_secret_token"
}
```

**응답:** `200 OK`

### 배치 재검증

```http
POST /api/revalidate-batch
```

**요청 본문:**
```json
{
  "paths": ["/w/share1", "/w/share2"],
  "secret": "your_secret_token"
}
```

**응답:** `200 OK`

---

## 에러 처리

모든 엔드포인트는 일관된 에러 응답 형식을 따릅니다:

```json
{
  "error": "무엇이 잘못되었는지 설명하는 에러 메시지"
}
```

### 주요 상태 코드

- `200 OK`: 성공적인 GET/PUT/DELETE
- `201 Created`: 성공적인 POST
- `400 Bad Request`: 유효하지 않은 입력
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 접근 거부
- `404 Not Found`: 리소스를 찾을 수 없음
- `429 Too Many Requests`: 레이트 리밋 초과
- `500 Internal Server Error`: 서버 에러

---

## 레이트 리미팅

`/api/metadata` 엔드포인트는 **IP당 분당 10회**로 제한됩니다.

---

## 캐싱 & ISR

- **공유 위시리스트** (`/w/[shareUrl]`)는 Incremental Static Regeneration 사용
- 아이템 수정/삭제 시 자동 재검증
- `/api/revalidate` 엔드포인트를 통한 수동 재검증

---

## 사용 예제

### 아이템과 함께 위시리스트 생성

```javascript
const response = await fetch('/api/wishlists', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '생일 위시리스트',
    description: '생일에 받고 싶은 것들',
    isPublic: true,
    category: 'birthday',
    userId: 'user_123',
    productLinks: [
      {
        url: 'https://example.com/product1',
        title: '멋진 가젯',
        price: '49,900원'
      }
    ]
  })
})

const wishlist = await response.json()
console.log('공유 URL:', `${window.location.origin}/w/${wishlist.shareUrl}`)
```

### 메타데이터 추출

```javascript
const response = await fetch('/api/metadata', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://coupang.com/product/123'
  })
})

const metadata = await response.json()
console.log('상품:', metadata.title, metadata.price)
```

### TanStack Query 훅 사용

```typescript
import { useWishlists, useCreateWishlist } from '@/hooks/use-wishlists'

function MyComponent() {
  const { data: wishlists, isLoading } = useWishlists('user_123')
  const createMutation = useCreateWishlist()

  const handleCreate = () => {
    createMutation.mutate({
      title: '새 위시리스트',
      // ...
    })
  }

  // ...
}
```
