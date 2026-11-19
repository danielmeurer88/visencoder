<script setup lang="ts">
import { computed, ref } from 'vue'
import CipherCanvas from './components/CipherCanvas.vue'
import CodecKey from './components/CodecKey.vue'
import { countGlyphs, encodeText } from './lib/codec'

const SAMPLE = 'MY NAME IS ALLY.'

const text = ref(SAMPLE)
const glyphSize = ref(54)
const ink = ref('#221f1a')
const paper = ref('#fbf7ec')

const canvasRef = ref<InstanceType<typeof CipherCanvas> | null>(null)

const symbolCount = computed(() => countGlyphs(encodeText(text.value)))
const hasContent = computed(() => text.value.trim().length > 0)

function loadSample(): void {
  text.value = SAMPLE
}

function clearText(): void {
  text.value = ''
}

function download(): void {
  canvasRef.value?.downloadPNG()
}
</script>

<template>
  <div class="page">
    <header class="masthead">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">#</span>
        <div class="brand-copy">
          <p class="eyebrow">Geometric substitution cipher</p>
          <h1>VisEncoder</h1>
        </div>
      </div>
      <p class="lede">
        Type a message and watch it become the tic-tac-toe code from
        <span class="source">vis_codec.jpg</span>, drawn live on an HTML canvas.
      </p>
    </header>

    <main class="workspace">
      <section class="panel composer" aria-labelledby="message-title">
        <div class="panel-head">
          <h2 id="message-title">Message</h2>
          <span class="badge">
            {{ symbolCount }} {{ symbolCount === 1 ? 'symbol' : 'symbols' }}
          </span>
        </div>

        <textarea
          v-model="text"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="characters"
          aria-label="Message to encode"
          placeholder="MY NAME IS ALLY."
        ></textarea>

        <div class="quick-actions">
          <button type="button" class="ghost" @click="loadSample">Use sample</button>
          <button type="button" class="ghost" @click="clearText">Clear</button>
        </div>

        <div class="control-group">
          <label class="control">
            <span class="control-label">
              Glyph size
              <b>{{ glyphSize }}px</b>
            </span>
            <input v-model.number="glyphSize" type="range" min="32" max="88" step="2" />
          </label>

          <div class="colors">
            <label class="color-control">
              <span>Ink</span>
              <input v-model="ink" type="color" />
            </label>
            <label class="color-control">
              <span>Paper</span>
              <input v-model="paper" type="color" />
            </label>
          </div>
        </div>

        <button type="button" class="primary" :disabled="!hasContent" @click="download">
          Download PNG
        </button>

        <p class="hint">
          Letters A–Z become symbols; umlauts are spelled out (ä → ae, ö → oe,
          ü → ue). Spaces, punctuation and line breaks are preserved.
        </p>
      </section>

      <section class="preview" aria-labelledby="canvas-title">
        <div class="preview-head">
          <div class="panel-head">
            <h2 id="canvas-title">Canvas</h2>
            <span class="badge badge--muted">Live</span>
          </div>
          <p class="preview-note">
            {{ hasContent ? 'Rendered with the key below.' : 'The sheet is waiting for a message.' }}
          </p>
        </div>

        <div class="stage">
          <CipherCanvas
            ref="canvasRef"
            :text="text"
            :glyph-size="glyphSize"
            :ink="ink"
            :paper="paper"
          />
          <p v-if="!hasContent" class="stage-empty">Type something to fill the page.</p>
        </div>
      </section>
    </main>

    <CodecKey :ink="ink" />

    <footer class="footer">
      <span>Built with Vue 3, TypeScript and Canvas 2D.</span>
      <span>A substitution cipher — not encryption. Keep real secrets elsewhere.</span>
    </footer>
  </div>
</template>
