import { describe, expect, it } from 'vitest'
import { encodeText } from './codec'
import { layoutEncoded, type LayoutOptions } from './layout'

const options: LayoutOptions = {
  glyphSize: 50,
  glyphGap: 10,
  spaceWidth: 40,
  textSize: 40,
  lineGap: 20,
  padding: 20,
  maxWidth: 230,
  measureText: (text, fontSize) => text.length * fontSize * 0.5,
}

describe('layoutEncoded', () => {
  it('fits three glyphs per row at this width', () => {
    const layout = layoutEncoded(encodeText('AAAAAA'), options)
    expect(layout.rows).toBe(2)
    expect(layout.items).toHaveLength(6)

    const glyphs = layout.items.map((item) => ('glyph' in item ? item.x : -1))
    expect(glyphs).toEqual([20, 80, 140, 20, 80, 140])

    const firstRow = layout.items.slice(0, 3) as Array<{ y: number }>
    const secondRow = layout.items.slice(3) as Array<{ y: number }>
    expect(firstRow[0]!.y).toBe(20)
    expect(secondRow[0]!.y).toBe(90)
  })

  it('breaks at spaces instead of mid-word', () => {
    const layout = layoutEncoded(encodeText('AA AA'), { ...options, maxWidth: 150 })
    expect(layout.rows).toBe(2)
    expect(layout.items).toHaveLength(4)

    const xs = layout.items.map((item) => ('glyph' in item ? item.x : -1))
    expect(xs).toEqual([20, 80, 20, 80])
  })

  it('splits a word that is wider than the row', () => {
    const layout = layoutEncoded(encodeText('AAAAAAAAAA'), { ...options, maxWidth: 150 })
    expect(layout.rows).toBe(5)
  })

  it('drops leading and trailing spaces but keeps blank lines', () => {
    const trimmed = layoutEncoded(encodeText('  AA  '), options)
    expect(trimmed.rows).toBe(1)
    expect(trimmed.items).toHaveLength(2)

    const blank = layoutEncoded(encodeText('A\n\nA'), options)
    expect(blank.rows).toBe(3)
  })

  it('reports the used width and full height', () => {
    const layout = layoutEncoded(encodeText('AAA'), options)
    expect(layout.usedWidth).toBe(50 * 3 + 10 * 2)
    expect(layout.height).toBe(20 * 2 + 50)
  })

  it('keeps punctuation in the row width', () => {
    const layout = layoutEncoded(encodeText('A.'), options)
    expect(layout.items).toHaveLength(2)
    const text = layout.items[1]!
    expect(text.kind).toBe('text')
    if (text.kind === 'text') {
      expect(text.cellWidth).toBeCloseTo(40 * 0.5 + 40 * 0.25)
    }
  })
})
