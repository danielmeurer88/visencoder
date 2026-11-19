import { describe, expect, it } from 'vitest'
import { countGlyphs, encodeText, glyphForLetter } from './codec'

function glyph(letter: string) {
  const result = glyphForLetter(letter)
  if (!result) throw new Error(`No glyph for ${letter}`)
  return result
}

describe('grid glyphs', () => {
  it('draws A with the bottom and right sides', () => {
    const a = glyph('A')
    expect(a.segments).toHaveLength(2)
    expect(a.segments).toContainEqual({ x1: 0, y1: 1, x2: 1, y2: 1 })
    expect(a.segments).toContainEqual({ x1: 1, y1: 0, x2: 1, y2: 1 })
    expect(a.dot).toBeUndefined()
  })

  it('draws E as a closed box with no dot', () => {
    const e = glyph('E')
    expect(e.segments).toHaveLength(4)
    expect(e.dot).toBeUndefined()
  })

  it('draws I with the top and left sides', () => {
    const i = glyph('I')
    expect(i.segments).toHaveLength(2)
    expect(i.segments).toContainEqual({ x1: 0, y1: 0, x2: 1, y2: 0 })
    expect(i.segments).toContainEqual({ x1: 0, y1: 0, x2: 0, y2: 1 })
  })

  it('repeats the grid shapes with a centre dot for J–R', () => {
    const m = glyph('M')
    expect(m.segments).toHaveLength(3)
    expect(m.segments).not.toContainEqual({ x1: 0, y1: 0, x2: 0, y2: 1 })
    expect(m.dot).toEqual({ x: 0.5, y: 0.5 })

    const n = glyph('N')
    expect(n.segments).toHaveLength(4)
    expect(n.dot).toEqual({ x: 0.5, y: 0.5 })
  })
})

describe('X glyphs', () => {
  it('uses the sheet labels: T top, S left, U right, V bottom', () => {
    expect(glyph('T').segments).toEqual([
      { x1: 0, y1: 0, x2: 0.5, y2: 0.5 },
      { x1: 1, y1: 0, x2: 0.5, y2: 0.5 },
    ])
    expect(glyph('S').segments).toEqual([
      { x1: 0, y1: 0, x2: 0.5, y2: 0.5 },
      { x1: 0, y1: 1, x2: 0.5, y2: 0.5 },
    ])
    expect(glyph('U').segments).toEqual([
      { x1: 1, y1: 0, x2: 0.5, y2: 0.5 },
      { x1: 1, y1: 1, x2: 0.5, y2: 0.5 },
    ])
    expect(glyph('V').segments).toEqual([
      { x1: 0, y1: 1, x2: 0.5, y2: 0.5 },
      { x1: 1, y1: 1, x2: 0.5, y2: 0.5 },
    ])
  })

  it('adds a dot in the wedge for W–Z', () => {
    expect(glyph('W').dot).toEqual({ x: 0.22, y: 0.5 })
    expect(glyph('X').dot).toEqual({ x: 0.5, y: 0.22 })
    expect(glyph('Y').dot).toEqual({ x: 0.78, y: 0.5 })
    expect(glyph('Z').dot).toEqual({ x: 0.5, y: 0.78 })
  })
})

describe('encodeText', () => {
  function lettersOf(text: string): string {
    return encodeText(text)
      .flat()
      .map((token) => (token.kind === 'glyph' ? token.glyph.letter : ''))
      .join('')
  }

  it('spells out German umlauts as ae, oe and ue', () => {
    expect(lettersOf('ä ö ü')).toBe('AEOEUE')
    expect(lettersOf('Müller')).toBe('MUELLER')
    expect(lettersOf('ÄÖÜ')).toBe('AEOEUE')
  })

  it('handles decomposed umlauts and the sharp s', () => {
    expect(lettersOf('A\u0308')).toBe('AE')
    expect(lettersOf('Straße')).toBe('STRASSE')
    expect(lettersOf('ẞ')).toBe('SS')
  })

  it('folds case and keeps word gaps', () => {
    const lines = encodeText('My name')
    expect(lines).toHaveLength(1)
    expect(lines[0]!.map((token) => token.kind)).toEqual([
      'glyph',
      'glyph',
      'space',
      'glyph',
      'glyph',
      'glyph',
      'glyph',
    ])
    expect(lines[0]![0]).toMatchObject({ kind: 'glyph', glyph: { letter: 'M' } })
  })

  it('keeps punctuation as text', () => {
    const [line] = encodeText('ALLY.')
    expect(line!.at(-1)).toEqual({ kind: 'text', char: '.' })
  })

  it('splits input into lines', () => {
    const lines = encodeText('AB\n\nCD')
    expect(lines).toHaveLength(3)
    expect(lines[1]).toEqual([])
  })

  it('counts cipher symbols only', () => {
    expect(countGlyphs(encodeText('MY NAME IS ALLY.'))).toBe(12)
  })

  it('returns null for characters outside the alphabet', () => {
    expect(glyphForLetter('1')).toBeNull()
    expect(glyphForLetter('.')).toBeNull()
  })
})
