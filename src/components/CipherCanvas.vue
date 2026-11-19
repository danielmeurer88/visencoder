<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { encodeText } from '../lib/codec'
import { layoutEncoded } from '../lib/layout'
import { renderLayout } from '../lib/render'

const props = withDefaults(
  defineProps<{
    text: string
    glyphSize?: number
    ink?: string
    paper?: string
  }>(),
  {
    glyphSize: 54,
    ink: '#221f1a',
    paper: '#fbf7ec',
  },
)

const FONT_FAMILY = 'ui-serif, Georgia, "Times New Roman", serif'

const wrapperRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const stageWidth = ref(720)

let observer: ResizeObserver | null = null
let frame = 0

function devicePixelRatio(): number {
  return Math.min(3, Math.max(1, window.devicePixelRatio || 1))
}

function scheduleRender(): void {
  if (frame) cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    frame = 0
    draw()
  })
}

function draw(): void {
  const canvas = canvasRef.value
  if (!canvas) return

  const width = Math.max(240, Math.round(stageWidth.value))
  const glyphSize = props.glyphSize
  const padding = Math.round(glyphSize * 0.9)
  const glyphGap = Math.round(glyphSize * 0.32)
  const spaceWidth = Math.round(glyphSize * 0.95)
  const lineGap = Math.round(glyphSize * 0.8)
  const textSize = Math.round(glyphSize * 0.8)
  const contentWidth = Math.max(glyphSize + glyphGap, width - padding * 2)

  const context = canvas.getContext('2d')
  if (!context) return

  const layout = layoutEncoded(encodeText(props.text), {
    glyphSize,
    glyphGap,
    spaceWidth,
    textSize,
    lineGap,
    padding,
    maxWidth: contentWidth,
    measureText: (text, fontSize) => {
      context.font = `${fontSize}px ${FONT_FAMILY}`
      return context.measureText(text).width
    },
  })

  const height = Math.max(Math.round(glyphSize * 5), layout.height)
  renderLayout(canvas, layout, {
    width,
    height,
    dpr: devicePixelRatio(),
    paper: props.paper,
    ink: props.ink,
    glyphSize,
    fontFamily: FONT_FAMILY,
  })
}

function downloadPNG(filename = 'visencoder.png'): void {
  const canvas = canvasRef.value
  if (!canvas) return

  const trigger = (href: string): void => {
    const link = document.createElement('a')
    link.href = href
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  if (typeof canvas.toBlob === 'function') {
    canvas.toBlob((blob) => {
      if (!blob) {
        trigger(canvas.toDataURL('image/png'))
        return
      }
      const url = URL.createObjectURL(blob)
      trigger(url)
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  } else {
    trigger(canvas.toDataURL('image/png'))
  }
}

onMounted(() => {
  const wrapper = wrapperRef.value
  if (!wrapper) return

  stageWidth.value = Math.round(wrapper.clientWidth) || 720

  observer = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const next = Math.round(entry.contentRect.width)
    if (next > 0 && Math.abs(next - stageWidth.value) > 0.5) {
      stageWidth.value = next
      scheduleRender()
    }
  })
  observer.observe(wrapper)

  window.addEventListener('resize', scheduleRender)
  scheduleRender()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  window.removeEventListener('resize', scheduleRender)
  if (frame) cancelAnimationFrame(frame)
})

watch(
  () => [props.text, props.glyphSize, props.ink, props.paper],
  () => scheduleRender(),
)

defineExpose({ downloadPNG })
</script>

<template>
  <div ref="wrapperRef" class="cipher-canvas">
    <canvas ref="canvasRef" role="img" :aria-label="`Cipher rendering of: ${text}`" />
  </div>
</template>

<style scoped>
.cipher-canvas {
  width: 100%;
}

canvas {
  display: block;
  margin: 0 auto;
  border-radius: 10px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.7) inset,
    0 18px 36px -24px rgba(50, 38, 20, 0.55);
}
</style>
