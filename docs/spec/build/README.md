# docs/spec 생성 스크립트

`docs/spec/` 의 Word 3종·Excel 1종은 여기 스크립트가 같은 데이터(`data.py` → `data.json`, `detail.js`)에서 만든다. 손으로 고치지 않고 데이터·스크립트를 고친 뒤 다시 생성한다.

| 파일 | 역할 |
|---|---|
| `data.py` | 공통 데이터 — 요구사항(FEATURES 1:1)·비기능·화면·API·테이블·enum·에러 코드·환경변수·권한표·용어·로드맵·테스트 전략. `data.json` 을 덤프한다 |
| `detail.js` | 기능(FEATURES 행)별 상세 — 처리 흐름·입출력·규칙·예외·테스트·이식 시 확정 |
| `build_xlsx.py` | `Linklet_v2_설계명세.xlsx` (openpyxl, 표지 집계는 수식) |
| `lib.js` | docx 공통 스타일·표·목차 |
| `doc1_requirements.js` · `doc2_basic_design.js` · `doc3_detail_design.js` | 요건정의서 · 기본설계서 · 상세설계서 |

## 재생성

```bash
cd docs/spec/build
npm install                       # docx (node_modules 는 커밋하지 않는다)
python3 -m pip install --user openpyxl   # 없을 때 한 번
python3 -X utf8 data.py data.json
python3 -X utf8 build_xlsx.py ../Linklet_v2_설계명세.xlsx
node doc1_requirements.js ../Linklet_v2_01_요건정의서.docx
node doc2_basic_design.js  ../Linklet_v2_02_기본설계서.docx
node doc3_detail_design.js ../Linklet_v2_03_상세설계서.docx
```

- 출처는 `INTENT.md`·`planning.md`·`audit/FEATURES.md`·`decisions/*.md`·`v2/prisma/schema.prisma`. 결정이 바뀌면 `data.py`·`detail.js` 를 먼저 맞춘다
- 시크릿·개인정보 값은 데이터에 넣지 않는다 (키 이름만)
- Excel 집계 수식은 파일을 열 때 계산된다(`fullCalcOnLoad`)
