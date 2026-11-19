import type { Glyph } from './codec'
import type { Layout } from './layout'

export interface GlyphBox {
  x: number
  y: number
  size: number
}

export interface GlyphStyle {
  ink: string
  strokeWidth: number
  dotRadius: number
}

/** Draw a normalized glyph inside a square box. */
export function drawGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: Glyph,
  box: GlyphBox,
  style: GlyphStyle,
): void {
  ctx.strokeStyle = style.ink
  ctx.lineWidth = style.strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const segment of glyph.segments) {
    ctx.beginPath()
    ctx.moveTo(box.x + segment.x1 * box.size, box.y + segment.y1 * box.size)
    ctx.lineTo(box.x + segment.x2 * box.size, box.y + segment.y2 * box.size)
    ctx.stroke()
  }

  if (glyph.dot) {
    ctx.fillStyle = style.ink
    ctx.beginPath()
    ctx.arc(
      box.x + glyph.dot.x * box.size,
      box.y + glyph.dot.y * box.size,
      style.dotRadius,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
}

export interface RenderSettings {
  width: number
  height: number
  dpr: number
  paper: string
  ink: string
  glyphSize: number
  fontFamily: string
}

/** Size the bitmap for the current device pixel ratio and paint the sheet. */
export function renderLayout(
  canvas: HTMLCanvasElement,
  layout: Layout,
  settings: RenderSettings,
): void {
  const { width, height, dpr } = settings

  canvas.width = Math.max(1, Math.round(width * dpr))
  canvas.height = Math.max(1, Math.round(height * dpr))
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = settings.paper
  ctx.fillRect(0, 0, width, height)

  const strokeWidth = Math.max(1.5, settings.glyphSize * 0.075)
  const dotRadius = Math.max(1.6, settings.glyphSize * 0.06)

  for (const item of layout.items) {
    if (item.kind === 'glyph') {
      drawGlyph(
        ctx,
        item.glyph,
        { x: item.x, y: item.y, size: item.size },
        { ink: settings.ink, strokeWidth, dotRadius },
      )
    } else {
      ctx.fillStyle = settings.ink
      ctx.font = `${item.size}px ${settings.fontFamily}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(
        item.char,
        item.x + item.cellWidth / 2,
        item.y + settings.glyphSize * 0.78,
      )
    }
  }
}
