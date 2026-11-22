# -*- coding: utf-8 -*-
import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo
import data as D

OUT = sys.argv[1]
FONT = "Arial"
HDR_FILL = PatternFill("solid", fgColor="1F3864")
SUB_FILL = PatternFill("solid", fgColor="D9E1F2")
NOTE_FILL = PatternFill("solid", fgColor="FFF2CC")
thin = Side(style="thin", color="BFBFBF")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

wb = Workbook()

def sheet(title, headers, rows, widths, note=None, freeze="A2", wrap=True):
    ws = wb.create_sheet(title)
    r0 = 1
    if note:
        ws.cell(row=1, column=1, value=note).font = Font(name=FONT, size=9, italic=True, color="7F6000")
        ws.cell(row=1, column=1).fill = NOTE_FILL
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(headers))
        r0 = 2
        freeze = f"A{r0+1}"
    for c, h in enumerate(headers, 1):
        cell = ws.cell(row=r0, column=c, value=h)
        cell.font = Font(name=FONT, bold=True, color="FFFFFF", size=10)
        cell.fill = HDR_FILL
        cell.alignment = Alignment(vertical="center", horizontal="center", wrap_text=True)
        cell.border = BORDER
    for i, row in enumerate(rows, r0 + 1):
        for c, v in enumerate(row, 1):
            cell = ws.cell(row=i, column=c, value=v)
            cell.font = Font(name=FONT, size=10)
            cell.alignment = Alignment(vertical="top", wrap_text=wrap)
            cell.border = BORDER
    for c, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(c)].width = w
    ws.freeze_panes = freeze
    ws.auto_filter.ref = f"A{r0}:{get_column_letter(len(headers))}{r0+len(rows)}"
    ws.sheet_view.zoomScale = 90
    return ws, r0

# ---------------- 1. 요구사항 정의
fr_headers = ["ID","영역","기능","처분","요구사항","수용 기준(동등성 확인)","Phase","이식 순서","상태(2026-11-22)","관련 화면","관련 API","관련 테이블","근거(감사·결정)"]
ws_fr, _ = sheet("요구사항정의", fr_headers, [list(r) for r in D.FR], [6,9,22,8,60,40,6,7,16,12,12,24,24],
    note="출처: audit/FEATURES.md(처분·순서·확인 방법) + decisions/*. 상태는 v2 코드 기준(F01·F07·I02·I03 은 FEATURES 상태 열 미갱신 — /parity 로 확정 예정). 처분: 유지=같은 결과 / 개선=결함 수정 / 재설계=동작 변경 / 신규")

# ---------------- 2. 삭제 항목
sheet("삭제항목", ["ID","기능","처분","영향 범위","대체"], [list(r) for r in D.DELETED], [6,28,12,40,36],
      note="v2 로 옮기지 않는 기능. '언젠가' 는 todo/someday.md 에 보관")

# ---------------- 3. 비기능 요구사항
sheet("비기능요구사항", ["ID","분류","요구사항","측정·검증 방법","근거"], [list(r) for r in D.NFR], [6,12,70,40,22])

# ---------------- 4. 화면 목록
sheet("화면목록", ["ID","화면","경로","구간·권한","주요 구성","4상태·진행 중 처리","주된 행동(CTA)","이동 대상","FEATURES","시안(design/mockups)"],
      [list(r) for r in D.SCREENS], [6,20,30,16,60,34,30,14,16,20],
      note="경로 규칙: decisions/url-design.md. 구조·CTA: decisions/settings-navigation.md, design/mockups. 한 화면에 주된 행동 버튼 하나(UX 원칙)")

# ---------------- 5. API 목록
sheet("API목록", ["ID","메서드","경로","용도","인증","요청(요약)","성공 응답","에러 코드","FEATURES","상태"],
      [list(r) for r in D.APIS], [6,18,34,40,12,40,36,30,12,16],
      note="규칙: 복수형·케밥·동사 금지(U1), 부분 수정 PATCH·집합 교체 PUT. 응답은 { data } / { data, nextCursor } / { error } 만. '예정' 은 이식 시 url-design 표에 확정")

# ---------------- 6. 테이블 정의
rows = []
for t in D.TABLES:
    for (col, typ, nul, dft, desc) in t["cols"]:
        rows.append([t["name"], t["model"], t["status"], col, typ, nul, dft, desc])
ws_tb, r0 = sheet("테이블정의", ["테이블","Prisma 모델","상태","컬럼","타입","NULL","기본값","설명"], rows, [16,14,18,22,20,6,12,60],
      note="출처: v2/prisma/schema.prisma(init 마이그레이션) + decisions/data-model.md 확장 지점([예정] 표시). 공통: PK uuid(7), DateTime 은 timestamptz(3) UTC, 테이블 snake_case 복수형, 컬럼 camelCase, 길이 제한은 Zod")
# 인덱스·관계 요약
irows = []
for t in D.TABLES:
    irows.append([t["name"], t["desc"], "; ".join(t["idx"]), "; ".join(t["rel"]) or "—"])
sheet("테이블요약", ["테이블","설명","키·인덱스","관계"], irows, [16,44,44,44])

# ---------------- 7. 코드값
sheet("코드값(enum)", ["Enum","값","용도"], [list(r) for r in D.ENUMS], [20,48,36],
      note="DB 저장값은 소문자 영어. 화면 문구는 enum→i18n 키 매핑 한 곳(features/{x}/i18n-keys.ts)에서 변환 (함정 10·11)")

# ---------------- 8. 에러 코드
sheet("에러코드", ["code","HTTP","의미","재시도","사용자 문구(ko, errors.{CODE})"], [list(r) for r in D.ERRORS], [20,8,44,8,70],
      note="decisions/error-handling.md E1·E3. message 는 개발자용 고정 영어 문구(화면 미표시). 재시도 여부는 code 로 판단. 문구는 '다음에 할 수 있는 행동'을 알려준다")

# ---------------- 9. 환경변수
sheet("환경변수", ["키","노출","필수 여부","설명","상태"], [list(r) for r in D.ENVS], [52,12,14,60,18],
      note="shared/config/env.ts(서버)·env.client.ts(클라이언트) Zod 스키마가 부팅 시 검증. 값은 어떤 문서·로그에도 쓰지 않는다")

# ---------------- 10. 권한 판정표
sheet("권한판정표", ["동작","비로그인","본인(일반 사용자)","타인·관리자","FEATURES"], [list(r) for r in D.PERMS], [34,22,40,30,14],
      note="F10 서비스 계층 판정표. 타인 리소스는 존재를 숨기기 위해 403 이 아닌 404. 관리자도 타인 위시리스트를 편집하지 않는다(관리자 범위 Q6)")

# ---------------- 11. 추적 매트릭스
trows = [[r[0], r[2], r[9], r[10], r[11], r[5]] for r in D.FR]
sheet("추적매트릭스", ["요구사항 ID","기능","화면","API","테이블","검증(테스트)"], trows, [10,26,14,16,34,46],
      note="요구사항 → 화면 → API → 테이블 → 검증 방법 추적. 화면·API ID 는 각 시트 참조")

# ---------------- 12. 로드맵
sheet("로드맵", ["Phase","이름","내용","FEATURES","상태(2026-11-22)"], [list(r) for r in D.PHASES], [7,14,60,30,36],
      note="decisions/roadmap.md. 기간 산정 없음 — 순서만 지킨다")

# ---------------- 13. 테스트 전략
sheet("테스트전략", ["ID","항목","결정"], [list(r) for r in D.TESTS], [10,22,100])

# ---------------- 14. 용어집
sheet("용어집", ["한국어","영어(식별자)","비고"], [list(r) for r in D.GLOSSARY], [20,26,60])

# ---------------- 0. 표지·요약 (맨 앞) — 수식으로 집계
ws = wb.active
ws.title = "표지·요약"
ws.sheet_view.showGridLines = False
ws.column_dimensions["A"].width = 3
ws.column_dimensions["B"].width = 26
for col in "CDEFG": ws.column_dimensions[col].width = 16
ws["B2"] = "Linklet v2 리뉴얼 — 설계 명세 (요건정의·기본설계·상세설계 부속)"
ws["B2"].font = Font(name=FONT, size=16, bold=True, color="1F3864")
ws["B3"] = f"버전 {D.VERSION} · 기준일 {D.DOC_DATE} · 작성: 메인 에이전트(Claude Code), 검토: 사용자"
ws["B3"].font = Font(name=FONT, size=10, italic=True, color="595959")
ws["B5"] = "문서 구성"; ws["B5"].font = Font(name=FONT, bold=True, size=11)
items = [("요구사항정의","기능 요구사항 41건 — FEATURES 행 1:1, 처분·수용 기준·추적"),
         ("삭제항목","v2 로 옮기지 않는 16건"),("비기능요구사항","보안·접근성·성능·테스트·운영 20건"),
         ("화면목록","화면 19개 — 경로·구성·4상태·CTA·이동"),("API목록","엔드포인트 20개 — 인증·요청·응답·에러 코드"),
         ("테이블정의 / 테이블요약","테이블 8개 컬럼 정의(init 5 + 예정 3), 인덱스·관계"),
         ("코드값(enum) / 에러코드 / 환경변수","값 사전"),("권한판정표","F10 서비스 계층 판정표"),
         ("추적매트릭스","요구사항 → 화면 → API → 테이블 → 검증"),("로드맵 / 테스트전략 / 용어집","Phase 0~8, T1~T10, 도메인 용어")]
r = 6
for name, desc in items:
    ws.cell(row=r, column=2, value=name).font = Font(name=FONT, size=10, bold=True)
    ws.cell(row=r, column=3, value=desc).font = Font(name=FONT, size=10)
    r += 1
r += 1
ws.cell(row=r, column=2, value="요구사항 집계 (수식 — 요구사항정의 시트 기준)").font = Font(name=FONT, bold=True, size=11); r += 1
n = len(D.FR); last = 2 + n  # 요구사항정의: note row1, header row2, data row3..
hdr = ["구분","값","건수","비율"]
for c, h in enumerate(hdr, 2):
    cell = ws.cell(row=r, column=c, value=h); cell.font = Font(name=FONT, bold=True, color="FFFFFF"); cell.fill = HDR_FILL; cell.border = BORDER
r += 1
total_row = None
for kind, col, vals in [("처분","D",["유지","개선","재설계","신규"]), ("상태","I",["동등성 확인","이식 완료","구현 완료","미착수"]), ("Phase","G",[0,1,2,3,4,5,6,7])]:
    for v in vals:
        ws.cell(row=r, column=2, value=kind).font = Font(name=FONT, size=10)
        ws.cell(row=r, column=3, value=v).font = Font(name=FONT, size=10)
        rng = f"요구사항정의!${col}$3:${col}${last}"
        if kind == "상태" and v == "구현 완료":
            f = f'=COUNTIF({rng},"구현 완료*")'  # "구현 완료 (E2E 단계 예정)" 포함
        else:
            f = f'=COUNTIF({rng},{repr(v) if isinstance(v,str) else v})'.replace("'", '"')
        ws.cell(row=r, column=4, value=f).font = Font(name=FONT, size=10)
        ws.cell(row=r, column=5, value=f"=D{r}/COUNTA(요구사항정의!$A$3:$A${last})").number_format = "0.0%"
        ws.cell(row=r, column=5).font = Font(name=FONT, size=10)
        for c in range(2,6): ws.cell(row=r, column=c).border = BORDER
        r += 1
    r += 1
ws.cell(row=r, column=2, value="요구사항 합계").font = Font(name=FONT, bold=True, size=10)
ws.cell(row=r, column=4, value=f"=COUNTA(요구사항정의!$A$3:$A${last})").font = Font(name=FONT, bold=True, size=10)
r += 2
ws.cell(row=r, column=2, value="주의").font = Font(name=FONT, bold=True, size=10, color="C00000")
ws.cell(row=r, column=3, value="이 문서는 리포의 decisions/·audit/·planning.md 를 2026-11-22 시점에 정리한 것이다. 코드·결정 문서가 바뀌면 이 문서를 다시 생성한다(출처가 우선). 시크릿·개인정보 값은 어디에도 넣지 않았다.").font = Font(name=FONT, size=10)
ws.merge_cells(start_row=r, start_column=3, end_row=r+1, end_column=7)
ws.cell(row=r, column=3).alignment = Alignment(wrap_text=True, vertical="top")

wb.calculation.fullCalcOnLoad = True
wb.save(OUT)
print("saved", OUT)
