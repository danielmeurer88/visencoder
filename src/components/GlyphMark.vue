<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { glyphForLetter } from '../lib/codec'
import { drawGlyph } from '../lib/render'

const props = withDefaults(
  defineProps<{
    letter: string
    size?: number
    ink?: string
  }>(),
  {
    size: 42,
    ink: '#221f1a',
  },
)

const canvasRef = ref<HTMLCanvasElement | null>(null)

function paint(): void {
  const canvas = canvasRef.value
  if (!canvas) return

  const glyph = glyphForLetter(props.letter)
  if (!glyph) return

  const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1))
  const size = props.size

  canvas.width = Math.max(1, Math.round(size * dpr))
  canvas.height = Math.max(1, Math.round(size * dpr))
  canvas.style.width = `${size}px`
  canvas.style.height = `${size}px`

  const context = canvas.getContext('2d')
  if (!context) return

  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, size, size)

  const inset = Math.max(2, size * 0.09)
  drawGlyph(
    context,
    glyph,
    { x: inset, y: inset, size: size - inset * 2 },
    {
      ink: props.ink,
      strokeWidth: Math.max(1.5, size * 0.075),
      dotRadius: Math.max(1.5, size * 0.06),
    },
  )
}

onMounted(() => {
  paint()
  window.addEventListener('resize', paint)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', paint)
})

watch(
  () => [props.letter, props.size, props.ink],
  () => paint(),
)
</script>

<template>
  <canvas ref="canvasRef" class="glyph-mark" aria-hidden="true" />
</template>

<style scoped>
.glyph-mark {
  display: block;
}
</style>
