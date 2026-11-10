# 기존 파서 정답 fixture (F18)

기존 앱 파서 `lib/services/url-metadata.ts` 의 **현재 출력을 그대로** 고정한 정답지다.
v2 에서 F18(URL 메타데이터 파서)을 이식할 때 "같은 HTML → 같은 결과" 로 동등성을 판정한다.

> **주의 — 알려진 결함도 그대로 들어 있다.** 아래 "관찰한 결함" 은 기존 파서의 실제 동작이며, 정답 JSON 은 그 결함을 포함한 값이다.
> v2 에서 고치기로 결정한 항목은 그 결정(FEATURES F18 판정 · `decisions/`)을 근거로 정답을 갱신한다. 결정 없이 JSON 을 손으로 고치지 않는다.

## 구성

- `{name}.html` — 파서가 읽는 요소만 담은 **합성 HTML**. 실제 사이트를 크롤링하지 않았다(봇 차단·저작권·개인정보·용량). 구조·클래스명만 파서 코드가 기대하는 실제 사이트 패턴을 따른다. 도메인은 전부 `*.example-shop.test`
- 첫 줄 `<!-- fixture-url: https://... -->` — 파서에 넘기는 URL. `siteName` 호스트명 fallback·상대 경로 해석 기준이므로 바꾸면 정답이 바뀐다
- `{name}.expected.json` — `extractUrlMetadata(url)` 반환값 `{ success, data }` 을 `JSON.stringify(..., null, 2)` 한 것. `undefined` 필드는 **키가 생략**된다(기존 `/api/metadata` 응답과 같음). v2 비교 시 `JSON.parse(JSON.stringify(result))` 로 맞춘다
- `collect.mjs` — 수집 스크립트. `*.html` 전부에 대해 `*.expected.json` 을 생성·비교

## 재생성

```bash
# 리포 루트에서 (루트 node_modules 의 cheerio 를 쓴다. Node 24 내장 타입 제거로 루트 .ts 를 직접 import)
node v2/src/features/link-preview/server/__fixtures__/collect.mjs           # 생성
node v2/src/features/link-preview/server/__fixtures__/collect.mjs --check   # 현재 JSON 과 비교만 (결정성·회귀 확인)
```

- 네트워크를 쓰지 않는다. `globalThis.fetch` 를 fixture URL → 로컬 HTML(`200 text/html`) 로 바꾸고, 미등록 URL 은 기록 후 throw. 매 실행 시작 때 가드 자가 확인을 하며, 미등록 요청이 하나라도 기록되면 종료 코드 1
- Node 가 루트 `package.json` 에 `type` 이 없다는 경고(`MODULE_TYPELESS_PACKAGE_JSON`)를 출력한다. 루트는 동결이라 고치지 않는다
- `collect.mjs` 가 `.mjs` 인 이유: v2 `tsconfig` include(`**/*.ts`, `**/*.mts`) 밖에 두어 루트 모듈 import 가 v2 typecheck 에 걸리지 않게. ESLint·Prettier 는 적용된다
- `*.html` 은 `v2/.prettierignore` 로 제외 — 저장본의 공백이 바뀌면 파서 출력(가격 fallback·텍스트)이 달라질 수 있다
- 환경 의존 값 없음: 파서 출력에 타임스탬프·랜덤이 없고, 재시도 대기(1s·2s)는 결과에 남지 않는다. 2회 실행 바이트 일치 확인(2026-11-10)
- `/api/metadata` 라우트는 파서 결과의 `imageUrl` 을 S3 업로드 URL 로 바꿔 내려준다. 이 fixture 는 **업로드 전 파서 출력** 기준이다

## fixture 표

| 이름                    | 고정하는 코드 경로                                                                                                                                                                                                                                          | 기대 출력 요약                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `og-generic`            | OG 태그 우선순위(`og:title` > `twitter:title`, `og:image`, `og:site_name`), `product:price:amount`+`currency` 메타 가격, 깨진 JSON-LD 무시, 셀렉터·본문 h1 무시                                                                                             | title `무선 키보드 K1 (화이트)`, price `KRW 59000`, siteName `Example Shop`                  |
| `json-ld-product`       | JSON-LD 루트 배열 순회, `Product.offers` 배열의 첫 Offer, 숫자 가격 → `"{currency} {price}"`, `.price` 셀렉터보다 우선. siteName `application-name` fallback                                                                                                | price `KRW 129000`, siteName `Example Shop App`                                              |
| `json-ld-graph`         | JSON-LD `@graph` **미지원** → 셀렉터 `.price` 로 fallback, 유로 소수점 콤마, 공백 뒤 기호                                                                                                                                                                   | price `€19,99` (JSON-LD 는 24.99)                                                            |
| `coupang-like`          | OG 없음: title `h1[class*="title"]`, image `img[alt][src*="product"]`(경로 `products/` 우연 매칭) + 프로토콜 상대 → `https:`, price `.total_price` (쿠팡 셀렉터) + `원` 소실, siteName 호스트명                                                             | price `29,900`, imageUrl `https://thumbnail…/main.jpg`                                       |
| `naver-like`            | price `.sale_price` (네이버 셀렉터) 가 `[class*="price"]`(origin_price) 보다 우선, siteName `twitter:site` 의 `@` 제거                                                                                                                                      | price `39,000`, siteName `naverlikestore`                                                    |
| `11st-like`             | title `twitter:title`, image `twitter:image` 프로토콜 상대, price `.price_num` (11번가 셀렉터)                                                                                                                                                              | price `18,900`                                                                               |
| `gmarket-like`          | title `meta[name="title"]`, image `link[rel="image_src"]`, price `.price-value` (G마켓 셀렉터)                                                                                                                                                              | price `27,500`                                                                               |
| `title-only`            | `<title>` 만 — 공백·줄바꿈 정리, 나머지 키 생략, siteName 호스트명                                                                                                                                                                                          | title `제목만 있는 페이지 — Example Shop`                                                    |
| `no-metadata`           | 제목·설명·이미지 전부 없음 → **재시도 2회(fetch 3회, 대기 1s+2s)** 후에도 `success: true` 로 빈 결과                                                                                                                                                        | data 에 `url`·`siteName` 만                                                                  |
| `relative-image-srcset` | `img[class*="product"][class*="main"]` 의 `srcset` 에서 최대 `w` 선택, 경로 상대 URL 을 페이지 경로 기준으로 해석, `.product-price` 가격 범위에서 첫 값만                                                                                                   | imageUrl `…/catalog/chairs/images/stool-900.jpg`, price `₩45,000`                            |
| `price-data-attribute`  | title `[itemprop="name"]`, `<meta itemprop="price" content>` 는 텍스트가 없어 **무시**, `[data-price]` 도 텍스트 없어 스킵 → 루프 뒤 `data-price` 속성값, image `[itemprop="image"]` content, description `[itemprop]` 텍스트 없음 → `.product-description` | price `12000`, imageUrl `…/mat/large.jpg`                                                    |
| `entities-whitespace`   | 속성값 **이중 디코드**(`&amp;amp;` → `&`), 설명의 줄바꿈·`&nbsp;`·연속 공백 정리, siteName 은 정리 안 함(연속 공백·NBSP 유지), `.money` 가격 `$ 1,299.50` → 기호 붙임, 이미지 URL 의 `%20` 유지                                                             | title `Salt & Pepper Mill Set "Classic" '24`, price `$1,299.50`, siteName `Example  Shop US` |

사이트 종류별: OG(`og-generic`) · JSON-LD(`json-ld-product`, `json-ld-graph`) · 쇼핑몰 셀렉터 4종(`coupang-like`·`naver-like`·`11st-like`·`gmarket-like`) · 최소 메타(`title-only`·`no-metadata`) · 경계(`relative-image-srcset`·`price-data-attribute`·`entities-whitespace`).

## 기존 파서에서 관찰한 결함 (v2 F18 이식 때 결정할 것)

fixture 로 고정된 것은 이름을 적었다. 나머지는 코드 관찰.

1. **가격 형식이 경로마다 다르다** — JSON-LD·메타는 `KRW 59000`(통화 코드 앞, 공백), 셀렉터는 `29,900`·`₩45,000`·`€19,99`·`$1,299.50`(기호 붙임, 천 단위 콤마 유지), data 속성은 `12000`. 숫자·통화를 분리해 저장하지 않아 정렬·합계·표시 변환이 불가 (`og-generic`·`json-ld-product`·`coupang-like`·`relative-image-srcset`·`entities-whitespace`)
2. **통화 단위 `원` 소실** — `cleanPriceText` 정규식이 `₩$€£¥¢` 만 인식해 `29,900원` → `29,900` (`coupang-like`·`naver-like`·`11st-like`·`gmarket-like`)
3. **가격 범위는 첫 값만** — `₩45,000 ~ ₩52,000` → `₩45,000` (`relative-image-srcset`)
4. **유럽식 소수점 콤마** `19,99` 를 그대로 둠 — 숫자화하면 1999 로 오해 (`json-ld-graph`)
5. **JSON-LD `@graph` 미지원** — `@graph` 안의 `Product` 를 못 찾고 셀렉터 가격(다른 값)으로 떨어짐 (`json-ld-graph`)
6. **microdata `content` 속성 무시** — `<meta itemprop="price" content="12000">`·`<meta itemprop="description" content>` 는 `.text()` 가 비어 스킵. `[itemprop="image"]` 만 `content` 를 읽는다 (`price-data-attribute`)
7. **엔티티 이중 디코드** — cheerio 가 이미 디코드한 속성값에 `cleanText` 가 `&amp;`→`&` 등을 한 번 더 적용. `&amp;amp;` → `&` (`entities-whitespace`)
8. **siteName 미정리** — 연속 공백·NBSP 유지, `twitter:site` 계정 핸들(`naverlikestore`)을 사이트명으로 사용 (`entities-whitespace`·`naver-like`)
9. **빈 결과도 `success: true`** — 제목·설명·이미지가 전부 없으면 1s·2s 대기하며 같은 URL 을 3회 fetch 한 뒤 `url`·`siteName` 만 든 결과를 성공으로 반환. 호출자가 "추출 실패" 를 구분할 수 없고, 응답 지연 3s (`no-metadata`)
10. **이미지 선택이 우연에 의존** — `img[alt][src*="product"]` 가 URL 경로 `products/` 에 매칭. OG 가 없는 사이트는 어떤 이미지가 뽑힐지 클래스명·경로 우연에 달림 (`coupang-like`)
11. **프로토콜 상대 경로는 무조건 `https:`** — 페이지가 `http` 여도 `https` 로 고정 (`coupang-like`·`11st-like`, 코드)
12. `srcset` 의 `w` 와 `x` 디스크립터를 같은 수로 비교 (`300w` > `2x`). 상대 `srcset` 후보는 최고 해상도 하나만 (`relative-image-srcset`, 코드)
13. `Content-Type` 이 `text/html` 을 포함하지 않으면 실패 — `application/xhtml+xml` 미지원 (코드)
14. 네트워크 오류(`TypeError`)·타임아웃이면 최대 3회 fetch, 5xx·429 도 재시도 — 외부 사이트에 짧은 시간 반복 요청 (코드)
15. 호스트 차단 목록·사설 IP 정규식이 라우트(`app/api/metadata/route.ts`)와 파서에 중복. DNS 해석·리다이렉트 재검사 없음 — F11 재설계 범위 (코드, `audit/AUDIT.md` H2)
16. `/api/metadata` 는 성공 시 `{ success: true, data }`, 실패 시 `{ success: false, error }` 또는 `{ error }` 400 — v2 응답 규약(`{ data }`/`{ error: { code } }`)과 다름 (라우트, F19·`decisions/api-response.md`)
