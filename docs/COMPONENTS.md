# Linklet 컴포넌트 문서

## 개요

이 문서는 Linklet 애플리케이션의 주요 React 컴포넌트, Props, 그리고 사용 예제를 설명합니다.

---

## 목차

1. [UI 컴포넌트](#ui-컴포넌트)
2. [폼 컴포넌트](#폼-컴포넌트)
3. [위시리스트 컴포넌트](#위시리스트-컴포넌트)
4. [레이아웃 컴포넌트](#레이아웃-컴포넌트)
5. [프로바이더 컴포넌트](#프로바이더-컴포넌트)

---

## UI 컴포넌트

### Button

로딩 상태와 다양한 변형을 제공하는 다용도 버튼 컴포넌트입니다.

**위치:** `/components/ui/button.tsx`

**Props:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  children: ReactNode
}
```

**사용법:**
```tsx
<Button
  variant="primary"
  size="md"
  loading={isSubmitting}
  onClick={handleClick}
>
  변경사항 저장
</Button>
```

**변형:**
- `primary`: 검정/흰색 (다크 모드 반전)
- `secondary`: 회색 배경
- `outline`: 배경 없이 테두리만
- `ghost`: 배경 없음, 호버 시 표시

---

### Input

에러 상태를 지원하는 제어 컴포넌트 입력 필드입니다.

**위치:** `/components/ui/input.tsx`

**Props:**
```typescript
interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'url'
  disabled?: boolean
  error?: string
  className?: string
  maxLength?: number
}
```

**사용법:**
```tsx
<Input
  value={email}
  onChange={setEmail}
  type="email"
  placeholder="이메일을 입력하세요"
  error={errors.email}
  maxLength={100}
/>
```

---

### Card

일관된 스타일을 제공하는 컨테이너 컴포넌트입니다.

**위치:** `/components/ui/card.tsx`

**Props:**
```typescript
interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}
```

**사용법:**
```tsx
<Card className="p-6">
  <h2>카드 제목</h2>
  <p>카드 내용</p>
</Card>
```

**기본 스타일:**
- 배경: `bg-white dark:bg-gray-900`
- 테두리: `border border-gray-200 dark:border-gray-800`
- 둥근 모서리와 그림자

---

### Loading

텍스트 옵션이 있는 로딩 스피너입니다.

**위치:** `/components/ui/loading.tsx`

**컴포넌트:**
- `Loading`: 텍스트 옵션이 있는 스피너
- `LoadingSpinner`: 스피너만
- `LoadingPage`: 전체 페이지 로딩 상태

**Props:**
```typescript
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}
```

**사용법:**
```tsx
<Loading size="md" text="위시리스트 로딩 중..." />
<LoadingSpinner size="sm" />
<LoadingPage text="잠시만 기다려주세요..." />
```

---

### Dialog

Radix UI를 사용한 모달 다이얼로그입니다.

**위치:** `/components/ui/dialog.tsx`

**사용법:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>삭제 확인</DialogTitle>
      <DialogDescription>
        정말로 이 아이템을 삭제하시겠습니까?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>취소</Button>
      <Button variant="danger" onClick={handleDelete}>삭제</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### ImageUpload

미리보기 및 AWS S3 통합 기능이 있는 이미지 업로드 컴포넌트입니다.

**위치:** `/components/ui/image-upload.tsx`

**Props:**
```typescript
interface ImageUploadProps {
  value?: string | null
  onChange: (url: string) => void
  label?: string
  error?: string
}
```

**사용법:**
```tsx
<ImageUpload
  value={imageUrl}
  onChange={setImageUrl}
  label="상품 이미지"
  error={errors.image}
/>
```

**기능:**
- 드래그 앤 드롭 지원
- 이미지 미리보기
- 자동 S3 업로드
- 로딩 상태
- 에러 처리

---

## 폼 컴포넌트

### BasicInformation

위시리스트 기본 정보 입력 폼 섹션입니다.

**위치:** `/app/[locale]/settings/wishlists/create/components/basic-information.tsx`

**Props:**
```typescript
interface BasicInformationProps {
  formData: {
    title: string
    description: string
    category: string
  }
  setFormData: Dispatch<SetStateAction<FormData>>
  errors: Record<string, string>
  loading: boolean
}
```

**사용법:**
```tsx
<BasicInformation
  formData={formData}
  setFormData={setFormData}
  errors={errors}
  loading={isSubmitting}
/>
```

**기능:**
- 50자 제한 및 카운터가 있는 제목 입력
- 200자 제한 및 카운터가 있는 설명 텍스트 영역
- 카테고리 선택기 (10개 사전 정의 카테고리)
- 실시간 유효성 검사 피드백
- 제한에 근접하면 문자 카운터가 노란색으로 변경

---

### ProductLinks

메타데이터 추출 기능이 있는 상품 URL 입력 컴포넌트입니다.

**위치:** `/app/[locale]/settings/wishlists/create/components/product-links.tsx`

**Props:**
```typescript
interface ProductLinksProps {
  productLinks: string[]
  setProductLinks: Dispatch<SetStateAction<string[]>>
  linkErrors: Record<number, string>
  setLinkErrors: Dispatch<SetStateAction<Record<number, string>>>
  loading: boolean
  isValidUrl: (url: string) => boolean
  onMetadataExtracted: (index: number, metadata: ProductMetadata) => void
  error: string | null
}
```

**사용법:**
```tsx
<RateLimitProvider>
  <ProductLinks
    productLinks={productLinks}
    setProductLinks={setProductLinks}
    linkErrors={linkErrors}
    setLinkErrors={setLinkErrors}
    loading={loading}
    isValidUrl={isValidUrl}
    onMetadataExtracted={handleMetadataExtracted}
    error={error}
  />
</RateLimitProvider>
```

**기능:**
- 동적 URL 입력 필드 (추가/제거)
- blur 이벤트 시 자동 메타데이터 추출
- 일괄 메타데이터 추출 버튼
- URL 유효성 검사 및 중복 감지
- 레이트 리밋 처리 (분당 10회)
- URL별 로딩 상태
- 추출된 메타데이터 미리보기

---

### PrivacySettings

위시리스트 공개 설정 컴포넌트입니다.

**위치:** `/app/[locale]/settings/wishlists/create/components/privacy-settings.tsx`

**Props:**
```typescript
interface PrivacySettingsProps {
  isPublic: boolean
  setIsPublic: (value: boolean) => void
  loading: boolean
}
```

**사용법:**
```tsx
<PrivacySettings
  isPublic={formData.isPublic}
  setIsPublic={(value) => setFormData(prev => ({ ...prev, isPublic: value }))}
  loading={loading}
/>
```

---

### FormActions

메타데이터 추출 피드백이 있는 폼 액션 버튼입니다.

**위치:** `/app/[locale]/settings/wishlists/create/components/form-actions.tsx`

**Props:**
```typescript
interface FormActionsProps {
  onBack: () => void
  loading: boolean
  hasIncompleteMetadata?: boolean
}
```

**사용법:**
```tsx
<FormActions
  onBack={() => router.back()}
  loading={isSubmitting}
  hasIncompleteMetadata={hasIncompleteMetadata}
/>
```

**기능:**
- 취소 및 제출 버튼
- 메타데이터 추출 중일 때 비활성화 상태
- 메타데이터 추출 상태에 대한 시각적 피드백

---

## 위시리스트 컴포넌트

### WishlistCard

관리 화면에서 위시리스트를 표시하는 카드입니다.

**위치:** `/app/[locale]/settings/wishlists/components/wishlist-card.tsx`

**Props:**
```typescript
interface WishlistCardProps {
  wishlist: {
    id: number
    title: string
    description: string
    itemCount: number
    isPublic: boolean
    createdAt: string
  }
}
```

**사용법:**
```tsx
<WishlistCard wishlist={wishlist} />
```

**기능:**
- 부드러운 전환이 있는 호버 효과
- 툴팁이 있는 편집 및 삭제 아이콘 버튼
- 공개/비공개 배지
- 아이템 개수 표시
- 상대 시간 표시 생성 날짜
- 액션 버튼

---

### WishlistItemCard

개별 위시리스트 아이템을 표시하는 카드입니다.

**위치:** `/components/wishlist/wishlist-item-card.tsx`

**Props:**
```typescript
interface WishlistItemCardProps {
  item: {
    id: string
    title: string
    productUrl: string
    imageUrl?: string
    price?: string
    description?: string
    priority: number
    isCompleted: boolean
  }
  onToggleComplete?: (itemId: string) => void
  onDelete?: (itemId: string) => void
  editable?: boolean
}
```

**사용법:**
```tsx
<WishlistItemCard
  item={item}
  onToggleComplete={handleToggle}
  onDelete={handleDelete}
  editable={isOwner}
/>
```

**기능:**
- 최적화된 Next.js Image 컴포넌트
- 완료 체크박스
- 우선순위 표시기
- 가격 표시
- 상품 링크
- 삭제 버튼 (편집 가능할 때)

---

### QuickAddProduct

URL에서 빠른 상품 추가 컴포넌트입니다.

**위치:** `/app/[locale]/settings/wishlists/components/quick-add-product.tsx`

**Props:**
```typescript
interface QuickAddProductProps {
  wishlists: Array<{
    id: number
    title: string
    itemCount: number
  }>
  onAddProduct: (productUrl: string, wishlistId: string) => Promise<void>
}
```

**사용법:**
```tsx
<QuickAddProduct
  wishlists={wishlists}
  onAddProduct={handleAddProductFromUrl}
/>
```

**기능:**
- 위시리스트 선택기
- URL 입력
- 자동 메타데이터 추출
- 로딩 상태가 있는 추가 버튼

---

### CreateWishlistCard

위시리스트 생성을 시작하는 카드입니다.

**위치:** `/app/[locale]/settings/wishlists/components/create-wishlist-card.tsx`

**사용법:**
```tsx
<CreateWishlistCard />
```

클릭 시 `/settings/wishlists/create`로 이동합니다.

---

## 레이아웃 컴포넌트

### Header

네비게이션이 있는 메인 애플리케이션 헤더입니다.

**위치:** `/components/layout/header.tsx`

**사용법:**
```tsx
<Header />
```

**기능:**
- 로고 및 브랜딩
- 네비게이션 링크
- 사용자 메뉴 (인증된 경우)
- 로케일 전환기
- 반응형 모바일 메뉴

---

### ConditionalHeader

라우트에 따라 표시/숨김되는 헤더입니다.

**위치:** `/components/layout/conditional-header.tsx`

**사용법:**
```tsx
<ConditionalHeader />
```

로그인 및 회원가입 페이지에서 헤더를 숨깁니다.

---

### SettingsSidebar

설정 페이지용 사이드바 네비게이션입니다.

**위치:** `/components/settings/settings-sidebar.tsx`

**Props:**
```typescript
interface SettingsSidebarProps {
  className?: string
}
```

**사용법:**
```tsx
<SettingsSidebar />
```

**섹션:**
- 프로필
- 위시리스트
- 모양
- 알림

---

## 프로바이더 컴포넌트

### QueryProvider

서버 상태 관리를 위한 TanStack Query 프로바이더입니다.

**위치:** `/components/providers/query-provider.tsx`

**사용법:**
```tsx
<QueryProvider>
  <App />
</QueryProvider>
```

**설정:**
- Stale time: 5분
- GC time: 30분
- 재시도: 3회 (404 건너뜀)

---

### AuthProvider

NextAuth 인증 프로바이더입니다.

**위치:** `/components/providers/auth-provider.tsx`

**사용법:**
```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

**내보내기:**
```typescript
const { user, isAuthenticated, session, status } = useAuth()
```

---

### DialogProvider

전역 다이얼로그 상태 관리 프로바이더입니다.

**위치:** `/components/providers/dialog-provider.tsx`

**사용법:**
```tsx
<DialogProvider>
  <App />
</DialogProvider>

// 컴포넌트에서:
const { showDialog, hideDialog } = useDialog()

showDialog({
  title: '액션 확인',
  description: '정말 진행하시겠습니까?',
  onConfirm: handleConfirm
})
```

---

### I18nProvider

국제화 프로바이더입니다.

**위치:** `/lib/i18n/context.tsx`

**사용법:**
```tsx
<I18nProvider locale="kr">
  <App />
</I18nProvider>

// 컴포넌트에서:
const { t, locale, setLocale } = useI18n()
const text = t('wishlist.create.title')
```

**지원 로케일:**
- `kr`: 한국어 (기본값)
- `en`: 영어
- `jp`: 일본어

---

### RateLimitProvider

메타데이터 추출을 위한 레이트 리밋 상태 관리 프로바이더입니다.

**위치:** `/contexts/rate-limit-context.tsx`

**사용법:**
```tsx
<RateLimitProvider>
  <ProductLinks />
</RateLimitProvider>

// 컴포넌트에서:
const { isGloballyRateLimited, rateLimitSecondsLeft, handleRateLimitDetected } = useRateLimit()
```

---

## 커스텀 훅

### useWishlists

사용자의 위시리스트를 가져옵니다.

**위치:** `/hooks/use-wishlists.ts`

**사용법:**
```typescript
const { data: wishlists, isLoading, error } = useWishlists(userId)
```

---

### useWishlist

ID로 단일 위시리스트를 가져옵니다.

**사용법:**
```typescript
const { data: wishlist, isLoading } = useWishlist(wishlistId)
```

---

### useCreateWishlist

위시리스트 생성 뮤테이션입니다.

**사용법:**
```typescript
const createMutation = useCreateWishlist()

createMutation.mutate({
  title: '새 위시리스트',
  description: '설명',
  isPublic: true,
  category: 'general',
  userId: 'user_id'
})
```

---

### useUrlMetadata

단일 URL에서 메타데이터를 추출합니다.

**위치:** `/hooks/use-url-metadata.ts`

**사용법:**
```typescript
const { extractMetadata, isLoading } = useUrlMetadata()

const metadata = await extractMetadata('https://example.com/product')
```

---

### useBatchUrlMetadata

여러 URL에서 메타데이터를 추출합니다.

**사용법:**
```typescript
const {
  extractBatchMetadata,
  getMetadataForUrl,
  isUrlLoading
} = useBatchUrlMetadata()

await extractBatchMetadata(['url1', 'url2'])
const metadata = getMetadataForUrl('url1')
```

---

### useProductMetadataManager

상품 메타데이터 추출 로직을 관리합니다.

**위치:** `/hooks/use-product-metadata-manager.ts`

**사용법:**
```typescript
const {
  extractedCount,
  extractionAttempted,
  handleExtractMetadata,
  handleBulkExtract,
  getMetadataForUrl,
  isUrlLoading
} = useProductMetadataManager({
  productLinks,
  isValidUrl,
  onMetadataExtracted
})
```

---

### useDebounce

값 변경을 디바운스합니다.

**위치:** `/hooks/use-debounce.ts`

**사용법:**
```typescript
const debouncedSearchTerm = useDebounce(searchTerm, 500)
```

---

## 스타일링 가이드라인

### 테마 색상

```css
/* 주요 색상 */
bg-blue-600, text-blue-400

/* 배경 */
bg-slate-800/50, bg-slate-900/50

/* 테두리 */
border-slate-700/50, border-slate-600

/* 텍스트 */
text-white, text-slate-300, text-slate-400, text-slate-500

/* 성공 */
bg-green-500/20, text-green-400

/* 에러 */
bg-red-500/20, text-red-400

/* 경고 */
text-yellow-400
```

### 공통 패턴

**호버 효과가 있는 카드:**
```tsx
className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 transition-all"
```

**입력 필드:**
```tsx
className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
```

**문자 카운터:**
```tsx
<p className={`text-xs ${count > 45 ? 'text-yellow-400' : 'text-slate-500'}`}>
  {count}/50
</p>
```

---

## 테스트

컴포넌트 및 유틸리티 테스트는 `/tests` 디렉토리를 참조하세요. 실행 방법:

```bash
npm test
npm test:ui       # 인터랙티브 UI
npm test:coverage # 커버리지 리포트
```

---

## 모범 사례

1. **편집 전 항상 컴포넌트를 읽어보세요**
2. **기존 유틸리티 사용** (`/lib/utils`에서)
3. **확립된 색상 체계 따르기** (slate/blue)
4. **비동기 작업에 로딩 상태 구현**
5. **사용자에게 에러 피드백 표시**
6. **제한이 있는 텍스트 입력에 문자 카운터 추가**
7. **아이콘 전용 버튼에 툴팁 사용**
8. **인터랙티브 요소에 호버 효과 구현**
9. **서버 상태에 TanStack Query 사용**
10. **컴포넌트를 작고 집중적으로 유지**

---

## 기여하기

새 컴포넌트를 추가할 때:
1. 기존 패턴 따르기
2. TypeScript 타입 추가
3. 에러 처리 포함
4. 로딩 상태 추가
5. 이 문서 업데이트
6. 가능하면 테스트 작성
