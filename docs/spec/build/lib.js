// 공통 docx 헬퍼 — 3개 설계 문서가 같은 스타일을 쓴다
const fs = require('fs')
const D = require('docx')
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  HeadingLevel, LevelFormat, PageBreak, TableOfContents, Header, Footer, PageNumber, BorderStyle, VerticalAlign } = D

const DATA = JSON.parse(fs.readFileSync(__dirname + '/data.json', 'utf8'))
const FONT = { ascii: 'Arial', hAnsi: 'Arial', eastAsia: 'Malgun Gothic', cs: 'Arial' }
const PAGE_W = 9638 // A4 11906 - 1134*2
const NAVY = '1F3864'

function run(text, opts = {}) { return new TextRun({ text, font: FONT, size: 20, ...opts }) }
function p(text, opts = {}) {
  const runs = Array.isArray(text) ? text : [run(text, opts.run || {})]
  return new Paragraph({ children: runs, spacing: { after: 100, line: 300 }, ...opts.para })
}
function h1(t) { return new Paragraph({ text: t, heading: HeadingLevel.HEADING_1 }) }
function h2(t) { return new Paragraph({ text: t, heading: HeadingLevel.HEADING_2 }) }
function h3(t) { return new Paragraph({ text: t, heading: HeadingLevel.HEADING_3 }) }
function bullet(text, level = 0) {
  const runs = Array.isArray(text) ? text : [run(text)]
  return new Paragraph({ children: runs, numbering: { reference: 'bullets', level }, spacing: { after: 60, line: 290 } })
}
function numbered(text, ref = 'numbers') {
  const runs = Array.isArray(text) ? text : [run(text)]
  return new Paragraph({ children: runs, numbering: { reference: ref, level: 0 }, spacing: { after: 60, line: 290 } })
}
function note(text) {
  return new Paragraph({ children: [run(text, { italics: true, color: '595959', size: 18 })], spacing: { after: 120 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: '8EAADB', space: 8 } }, indent: { left: 200 } })
}
function code(text) {
  const lines = String(text).split('\n')
  return lines.map(l => new Paragraph({ children: [new TextRun({ text: l || ' ', font: { ascii: 'Consolas', hAnsi: 'Consolas', eastAsia: 'Malgun Gothic' }, size: 17 })],
    shading: { type: ShadingType.CLEAR, fill: 'F2F2F2' }, spacing: { after: 0, line: 260 }, indent: { left: 200 } }))
}
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }) }

// 표: headers[], rows[][] (문자열), widths[] (비율 → DXA)
function table(headers, rows, ratios, opts = {}) {
  const total = ratios.reduce((a, b) => a + b, 0)
  const widths = ratios.map(r => Math.round(PAGE_W * r / total))
  const diff = PAGE_W - widths.reduce((a, b) => a + b, 0); widths[widths.length - 1] += diff
  const fs = opts.fontSize || 17
  const cell = (text, w, isHead) => new TableCell({
    width: { size: w, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
    shading: isHead ? { type: ShadingType.CLEAR, fill: NAVY } : undefined,
    margins: { top: 50, bottom: 50, left: 80, right: 80 },
    children: String(text ?? '').split('\n').map(line => new Paragraph({ spacing: { after: 0, line: 250 },
      children: [new TextRun({ text: line, font: FONT, size: fs, bold: !!isHead, color: isHead ? 'FFFFFF' : '000000' })] })),
  })
  const headRow = new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], true)) })
  const bodyRows = rows.map(r => new TableRow({ cantSplit: true, children: r.map((v, i) => cell(v, widths[i], false)) }))
  return new Table({ width: { size: PAGE_W, type: WidthType.DXA }, columnWidths: widths, rows: [headRow, ...bodyRows] })
}
// 2열 키-값 표
function kv(pairs, ratios = [1, 3]) { return table(['항목', '내용'], pairs, ratios) }

function buildDoc({ title, subtitle, sections }) {
  const cover = [
    new Paragraph({ spacing: { before: 2800 } }),
    new Paragraph({ children: [run('Linklet v2 리뉴얼', { size: 28, color: '595959' })], alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [run(title, { size: 56, bold: true, color: NAVY })], alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 } }),
    new Paragraph({ children: [run(subtitle, { size: 24, color: '595959' })], alignment: AlignmentType.CENTER }),
    new Paragraph({ spacing: { before: 3600 } }),
    table(['항목', '내용'], [
      ['문서 버전', DATA.VERSION], ['기준일', DATA.DOC_DATE], ['작성', '메인 에이전트(Claude Code) — 리포 문서(INTENT·planning·decisions·audit)에서 정리'],
      ['검토·승인', '사용자(프로젝트 오너)'], ['출처 우선순위', '코드·decisions/ 가 이 문서보다 우선한다. 어긋나면 이 문서를 다시 생성한다'],
      ['보안', '시크릿·개인정보 값은 어디에도 기재하지 않는다'],
    ], [1, 3]),
    pageBreak(),
    new Paragraph({ children: [run('목차', { size: 28, bold: true, color: NAVY })], spacing: { after: 200 } }),
    new TableOfContents('목차', { hyperlink: true, headingStyleRange: '1-2' }),
    pageBreak(),
  ]
  const doc = new Document({
    creator: 'Linklet v2', title, description: subtitle,
    features: { updateFields: true },
    styles: {
      default: { document: { run: { font: FONT, size: 20 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: 32, bold: true, color: NAVY }, paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: 26, bold: true, color: '2F5496' }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: 22, bold: true, color: '404040' }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 260 } } } } ] },
      { reference: 'numbers', levels: [ { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 300 } } } } ] },
    ] },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [run(`Linklet v2 · ${title} · v${DATA.VERSION}`, { size: 16, color: '7F7F7F' })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: '7F7F7F' })] })] }) },
      children: [...cover, ...sections],
    }],
  })
  return doc
}

async function save(doc, path) {
  const buf = await Packer.toBuffer(doc)
  fs.writeFileSync(path, buf)
  console.log('saved', path, (buf.length / 1024).toFixed(0) + 'KB')
}

module.exports = { DATA, run, p, h1, h2, h3, bullet, numbered, note, code, pageBreak, table, kv, buildDoc, save }
