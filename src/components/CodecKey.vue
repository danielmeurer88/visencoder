<script setup lang="ts">
import GlyphMark from './GlyphMark.vue'

withDefaults(defineProps<{ ink?: string }>(), {
  ink: '#221f1a',
})

const sections = [
  { title: 'Grid', note: 'A–I · no dot', letters: [...'ABCDEFGHI'], columns: 3 },
  { title: 'Grid + dot', note: 'J–R · dotted', letters: [...'JKLMNOPQR'], columns: 3 },
  { title: 'X arms', note: 'S–V · no dot', letters: [...'STUV'], columns: 4 },
  { title: 'X arms + dot', note: 'W–Z · dotted', letters: [...'WXYZ'], columns: 4 },
] as const
</script>

<template>
  <section class="key-panel panel" aria-labelledby="key-title">
    <details open>
      <summary>
        <div class="key-summary-copy">
          <p class="eyebrow">Reference</p>
          <h2 id="key-title">The codec key</h2>
        </div>
        <span class="chevron" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6.5 8 10l4-3.5"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </summary>

      <div class="key-grid">
        <article v-for="section in sections" :key="section.title" class="key-card">
          <header>
            <h3>{{ section.title }}</h3>
            <span>{{ section.note }}</span>
          </header>
          <div
            class="tiles"
            :style="{ gridTemplateColumns: `repeat(${section.columns}, minmax(0, 1fr))` }"
          >
            <div v-for="letter in section.letters" :key="letter" class="tile">
              <GlyphMark :letter="letter" :size="42" :ink="ink" />
              <span class="tile-letter">{{ letter }}</span>
            </div>
          </div>
        </article>
      </div>

      <p class="key-footnote">
        Follows the notebook: T is the top wedge and S the left; X is the dotted
        top and W the dotted left. A dot is part of the code, not decoration.
      </p>
    </details>
  </section>
</template>
