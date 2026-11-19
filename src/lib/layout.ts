import type { EncodedLine, Glyph, Token } from './codec'

export interface LayoutOptions {
  /** Side of a glyph box, in CSS pixels. */
  glyphSize: number
  /** Horizontal gap after every glyph or loose character. */
  glyphGap: number
  /** Advance used for one space. */
  spaceWidth: number
  /** Font size used for punctuation and characters outside the codec. */
  textSize: number
  /** Extra vertical space between rows. */
  lineGap: number
  /** Outer margin of the sheet. */
  padding: number
  /** Maximum width available to the content (excluding padding). */
  maxWidth: number
  measureText: (text: string, fontSize: number) => number
}

export interface GlyphItem {
  kind: 'glyph'
  glyph: Glyph
  x: number
  y: number
  size: number
}

export interface TextItem {
  kind: 'text'
  char: string
  x: number
  y: number
  cellWidth: number
  size: number
}

export type LayoutItem = GlyphItem | TextItem

export interface Layout {
  items: LayoutItem[]
  /** Full sheet height, including padding. */
  height: number
  /** Width used by the widest row, excluding padding. */
  usedWidth: number
  rows: number
}

interface Cell {
  token: Token
  /** Horizontal distance this cell consumes, including the trailing gap. */
  advance: number
  /** Visible width of the cell (used when drawing loose characters). */
  cellWidth: number
}

function makeCell(token: Token, options: LayoutOptions): Cell {
  if (token.kind === 'glyph') {
    return {
      token,
      advance: options.glyphSize + options.glyphGap,
      cellWidth: options.glyphSize,
    }
  }

  if (token.kind === 'space') {
    return {
      token,
      advance: options.spaceWidth,
      cellWidth: options.spaceWidth,
    }
  }

  const width = options.measureText(token.char, options.textSize) + options.textSize * 0.25
  return {
    token,
    advance: width + options.glyphGap,
    cellWidth: width,
  }
}

/**
 * Greedy word wrap. Lines break after spaces; a word longer than the row is
 * split character by character. Leading and trailing spaces are dropped.
 */
function wrapLine(tokens: EncodedLine, options: LayoutOptions): Cell[][] {
  const maxWidth = Math.max(options.glyphSize, options.maxWidth)
  const rows: Cell[][] = []
  let row: Cell[] = []
  let width = 0

  const pushRow = (): void => {
    while (row.length > 0 && row[row.length - 1]!.token.kind === 'space') row.pop()
    if (row.length > 0) rows.push(row)
    row = []
    width = 0
  }

  for (const token of tokens) {
    const cell = makeCell(token, options)

    if (token.kind === 'space' && row.length === 0) continue

    if (row.length === 0) {
      row.push(cell)
      width = cell.advance
      continue
    }

    if (width + cell.advance <= maxWidth) {
      row.push(cell)
      width += cell.advance
      continue
    }

    if (token.kind === 'space') {
      // The space itself becomes the break; do not carry it onto the next row.
      pushRow()
      continue
    }

    let lastSpace = -1
    for (let i = row.length - 1; i >= 0; i -= 1) {
      if (row[i]!.token.kind === 'space') {
        lastSpace = i
        break
      }
    }

    if (lastSpace < 0) {
      // An unbreakable word: continue on a fresh row.
      rows.push(row)
      row = [cell]
      width = cell.advance
      continue
    }

    const carry = row.slice(lastSpace + 1)
    row = row.slice(0, lastSpace)
    if (row.length > 0) rows.push(row)
    row = carry
    width = row.reduce((total, item) => total + item.advance, 0)

    if (row.length === 0) {
      row.push(cell)
      width = cell.advance
    } else if (width + cell.advance <= maxWidth) {
      row.push(cell)
      width += cell.advance
    } else {
      rows.push(row)
      row = [cell]
      width = cell.advance
    }
  }

  pushRow()
  if (rows.length === 0) rows.push([])
  return rows
}

export function layoutEncoded(lines: EncodedLine[], options: LayoutOptions): Layout {
  const rows: Cell[][] = []
  for (const line of lines) rows.push(...wrapLine(line, options))
  if (rows.length === 0) rows.push([])

  const rowHeight = options.glyphSize + options.lineGap
  const items: LayoutItem[] = []
  let usedWidth = 0

  rows.forEach((cells, rowIndex) => {
    const y = options.padding + rowIndex * rowHeight
    let x = options.padding

    for (const cell of cells) {
      if (cell.token.kind === 'glyph') {
        items.push({
          kind: 'glyph',
          glyph: cell.token.glyph,
          x,
          y,
          size: options.glyphSize,
        })
      } else if (cell.token.kind === 'text') {
        items.push({
          kind: 'text',
          char: cell.token.char,
          x,
          y,
          cellWidth: cell.cellWidth,
          size: options.textSize,
        })
      }
      x += cell.advance
    }

    if (cells.length > 0) {
      // The last cell carries a trailing gap which is not part of the row.
      usedWidth = Math.max(usedWidth, x - options.glyphGap - options.padding)
    }
  })

  const height =
    options.padding * 2 +
    rows.length * options.glyphSize +
    Math.max(0, rows.length - 1) * options.lineGap

  return { items, height, usedWidth, rows: rows.length }
}
