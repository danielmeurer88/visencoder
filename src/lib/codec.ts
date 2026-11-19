/**
 * The codec in vis_codec.jpg.
 *
 * Grid A–R
 * --------
 * A–I live in a plain 3×3 tic-tac-toe grid, J–R in the same grid with a dot.
 * Each glyph is made of the cell sides that face the centre of the grid, so
 * the shape "opens" away from the centre:
 *
 *   A = bottom + right      D = top + bottom + right      G = top + right
 *   B = bottom + left/right E = all four sides            H = top + left/right
 *   C = bottom + left       F = top + bottom + left       I = top + left
 *
 * The dotted grid uses the same nine shapes with a dot in the middle.
 *
 * X grids
 * -------
 * The two arms of each wedge of an X: T/U/V/S are the plain wedges and
 * X/Y/Z/W the dotted ones. The sheet labels them:
 *
 *   T = top, S = left, U = right, V = bottom
 *   X = top, W = left, Y = right, Z = bottom
 *
 * That is the variant drawn in the notebook: S is the left wedge and Y the
 * right wedge (the sample "MY NAME IS ALLY." relies on it). Some published
 * pigpen keys swap S/T and W/X; this implementation follows the sheet.
 */

export type Wedge = 'top' | 'left' | 'right' | 'bottom'

export interface Point {
  x: number
  y: number
}

export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** A glyph in normalized coordinates: a unit square, 0…1 on both axes. */
export interface Glyph {
  letter: string
  segments: Segment[]
  dot?: Point
}

export type Token =
  | { kind: 'glyph'; glyph: Glyph }
  | { kind: 'space' }
  | { kind: 'text'; char: string }

export type EncodedLine = Token[]

function segment(x1: number, y1: number, x2: number, y2: number): Segment {
  return { x1, y1, x2, y2 }
}

const TOP = segment(0, 0, 1, 0)
const BOTTOM = segment(0, 1, 1, 1)
const LEFT = segment(0, 0, 0, 1)
const RIGHT = segment(1, 0, 1, 1)
const CENTER: Point = { x: 0.5, y: 0.5 }

function gridGlyph(letter: string, index: number, dotted: boolean): Glyph {
  const row = Math.floor(index / 3)
  const col = index % 3
  const segments: Segment[] = []

  // Keep the sides that face the middle of the 3×3 grid.
  if (row > 0) segments.push({ ...TOP })
  if (row < 2) segments.push({ ...BOTTOM })
  if (col > 0) segments.push({ ...LEFT })
  if (col < 2) segments.push({ ...RIGHT })

  return {
    letter,
    segments,
    dot: dotted ? { ...CENTER } : undefined,
  }
}

const X_ARMS: Record<Wedge, [Segment, Segment]> = {
  top: [segment(0, 0, 0.5, 0.5), segment(1, 0, 0.5, 0.5)],
  left: [segment(0, 0, 0.5, 0.5), segment(0, 1, 0.5, 0.5)],
  right: [segment(1, 0, 0.5, 0.5), segment(1, 1, 0.5, 0.5)],
  bottom: [segment(0, 1, 0.5, 0.5), segment(1, 1, 0.5, 0.5)],
}

const X_DOT: Record<Wedge, Point> = {
  top: { x: 0.5, y: 0.22 },
  left: { x: 0.22, y: 0.5 },
  right: { x: 0.78, y: 0.5 },
  bottom: { x: 0.5, y: 0.78 },
}

const X_LETTERS: Record<string, { wedge: Wedge; dotted: boolean }> = {
  T: { wedge: 'top', dotted: false },
  S: { wedge: 'left', dotted: false },
  U: { wedge: 'right', dotted: false },
  V: { wedge: 'bottom', dotted: false },
  X: { wedge: 'top', dotted: true },
  W: { wedge: 'left', dotted: true },
  Y: { wedge: 'right', dotted: true },
  Z: { wedge: 'bottom', dotted: true },
}

/** Return the glyph for A–Z, or null for anything outside the codec. */
export function glyphForLetter(letter: string): Glyph | null {
  const char = letter.toUpperCase()
  if (char.length !== 1) return null

  const code = char.charCodeAt(0)
  if (code >= 65 && code <= 73) return gridGlyph(char, code - 65, false)
  if (code >= 74 && code <= 82) return gridGlyph(char, code - 74, true)

  const xLetter = X_LETTERS[char]
  if (xLetter) {
    return {
      letter: char,
      segments: X_ARMS[xLetter.wedge].map((arm) => ({ ...arm })),
      dot: xLetter.dotted ? { ...X_DOT[xLetter.wedge] } : undefined,
    }
  }

  return null
}

/**
 * German umlauts have no symbol of their own, so they are spelled out the
 * German way before encoding: ä → ae, ö → oe, ü → ue. A capital ẞ becomes SS;
 * the lowercase ß is already uppercased to SS by String.prototype.toUpperCase.
 */
const TRANSLITERATIONS: Record<string, string> = {
  Ä: 'AE',
  Ö: 'OE',
  Ü: 'UE',
  ẞ: 'SS',
}

function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    .toUpperCase()
    .replace(/[ÄÖÜẞ]/g, (char) => TRANSLITERATIONS[char] ?? char)
}

/**
 * Turn text into lines of glyphs, gaps and loose characters.
 * Letters are case-folded; every other printable character is kept as text.
 */
export function encodeText(text: string): EncodedLine[] {
  const normalized = normalizeText(text)
  return normalized.split(/\r\n|\r|\n/).map((rawLine) => {
    const line: EncodedLine = []
    for (const char of rawLine) {
      if (/\s/u.test(char)) {
        line.push({ kind: 'space' })
        continue
      }
      const glyph = glyphForLetter(char)
      line.push(glyph ? { kind: 'glyph', glyph } : { kind: 'text', char })
    }
    return line
  })
}

/** Number of cipher symbols in encoded text (spaces and punctuation excluded). */
export function countGlyphs(lines: EncodedLine[]): number {
  let total = 0
  for (const line of lines) {
    for (const token of line) {
      if (token.kind === 'glyph') total += 1
    }
  }
  return total
}
