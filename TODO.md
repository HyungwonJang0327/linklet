# Linklet 개선 TODO

## 🔗 공유 기능 강화

### 현재 상태
- 링크 복사 기능만 제공

### 개선 사항

#### 1. QR 코드 생성
- 공유 링크를 QR 코드로 변환
- 다운로드 가능
- 모바일 기기로 쉽게 스캔하여 접근

**구현 방안:**
- `qrcode.react` 또는 `qrcode` 라이브러리 사용
- 위시리스트 상세 페이지 헤더에 QR 버튼 추가
- 다이얼로그로 QR 코드 표시
- PNG 다운로드 기능

#### 2. 소셜 미디어 공유
- 카카오톡 공유하기
- 트위터 공유
- 페이스북 공유
- 링크 복사 (기존)

**구현 방안:**
- Kakao JavaScript SDK 연동
- Open Graph 메타 태그 최적화
- 각 플랫폼별 공유 URL 스키마 활용

#### 3. 임베드 코드 제공
- 위시리스트를 다른 웹사이트에 임베드할 수 있는 코드
- iframe 또는 위젯 형태
- 커스터마이징 옵션 (테마, 크기 등)

**구현 방안:**
- 별도의 임베드 페이지 생성
- iframe 코드 생성기
- 스타일 옵션 제공

---

## 🎯 아이템 일괄 작업 기능

### 현재 상태
- 일괄 선택 및 삭제만 가능

### 개선 사항

#### 1. 다른 위시리스트로 이동
- 선택한 아이템들을 다른 위시리스트로 이동
- 원본 위시리스트에서는 제거됨

**구현 방안:**
- 선택 모드에서 "이동" 버튼 추가
- 위시리스트 선택 드롭다운 표시
- 벌크 이동 API 엔드포인트 생성: `POST /api/items/bulk-move`
- 트랜잭션으로 처리하여 일관성 보장

**API 설계:**
```typescript
POST /api/items/bulk-move
{
  itemIds: string[],
  targetWishlistId: string
}
```

#### 2. 다른 위시리스트로 복사
- 선택한 아이템들을 다른 위시리스트로 복사
- 원본은 그대로 유지

**구현 방안:**
- 선택 모드에서 "복사" 버튼 추가
- 위시리스트 선택 드롭다운 표시
- 벌크 복사 API 엔드포인트 생성: `POST /api/items/bulk-copy`
- 새로운 ID로 아이템 복제

**API 설계:**
```typescript
POST /api/items/bulk-copy
{
  itemIds: string[],
  targetWishlistId: string
}
```

#### 3. 일괄 완료/미완료 처리
- 선택한 모든 아이템을 한번에 완료 처리
- 선택한 모든 아이템을 한번에 미완료 처리

**구현 방안:**
- 선택 모드에서 "모두 받음 처리" / "모두 받음 취소" 버튼 추가
- 벌크 토글 API 엔드포인트 생성: `POST /api/items/bulk-toggle-complete`
- 현재 상태에 관계없이 특정 상태로 설정

**API 설계:**
```typescript
POST /api/items/bulk-toggle-complete
{
  itemIds: string[],
  isCompleted: boolean
}
```

#### 4. UI 개선
- 선택 모드 진입 시 더 많은 액션 버튼 표시
- 액션 바를 화면 하단에 고정 (모바일 친화적)
- 선택된 아이템 수 실시간 표시
- 취소 버튼 명확하게 표시

**UI 구조:**
```
[선택됨: 3개] [이동] [복사] [받음 처리] [받음 취소] [삭제] [취소]
```

---

## 우선순위

### 높음
- [ ] 아이템 다른 위시리스트로 이동
- [ ] 아이템 일괄 완료/미완료 처리

### 중간
- [ ] QR 코드 생성
- [ ] 아이템 다른 위시리스트로 복사

### 낮음
- [ ] 소셜 미디어 공유
- [ ] 임베드 코드 제공

---

## 기술 스택

### 라이브러리
- QR 코드: `qrcode` 또는 `qrcode.react`
- 카카오 SDK: Kakao JavaScript SDK
- 클립보드: 기존 Clipboard API 활용

### API 엔드포인트
- `POST /api/items/bulk-move`
- `POST /api/items/bulk-copy`
- `POST /api/items/bulk-toggle-complete`

---

## 참고 사항

- 모든 벌크 작업은 트랜잭션으로 처리하여 일관성 보장
- 에러 처리: 일부 아이템 실패 시에도 성공한 아이템은 처리되도록
- 성공/실패 건수를 토스트 메시지로 표시
- 롤백 기능 고려 (실행 취소)
