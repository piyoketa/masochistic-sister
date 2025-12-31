<!--
DebuffText の責務:
- デバフ名称とスタック点数を安全に分離表示し、点数部分のフォントを小さめに整えることで改行を防ぐ。
- ActionCard から渡されるテキストを受け取り、視覚的にまとまったデバフラベルを返す。

責務ではないこと:
- デバフアイコンの描画やツールチップ表示の制御。これらは ActionCard 側が担当する。

主な通信相手とインターフェース:
- ActionCard.vue: `text`(string) プロップでデバフ名+点数を受け取り、`renderRichText` を用いた装飾済みテキストを提供する。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { renderRichText } from '@/utils/richText'

const props = defineProps<{
  text: string
}>()

const parsed = computed(() => {
  const trimmed = props.text.trim()
  // 末尾の「数字(+/-含む) + 点」を点数として扱う。点が無い場合はそのまま表示する。
  const match = trimmed.match(/^(.*?)([+-]?\d+(?:\.\d+)?)(点)?$/)
  if (!match) {
    return { label: trimmed, amount: null, unit: '' }
  }
  const [, labelPart, amountPart, unitPart] = match
  const label = labelPart.trim()
  return {
    label: label.length > 0 ? label : trimmed,
    amount: amountPart ?? null,
    unit: unitPart ?? '',
  }
})
</script>

<template>
  <span class="debuff-text">
    <template v-if="parsed.amount">
      <span v-if="parsed.label" class="debuff-text__label" v-html="renderRichText(parsed.label)" />
      <span class="debuff-text__amount">
        <span class="debuff-text__amount-value">{{ parsed.amount }}</span>
        <span v-if="parsed.unit" class="debuff-text__amount-unit">{{ parsed.unit }}</span>
      </span>
    </template>
    <span v-else class="debuff-text__label" v-html="renderRichText(parsed.label)" />
  </span>
</template>

<style scoped>
.debuff-text {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  white-space: nowrap;
  line-height: 1.2;
}

.debuff-text__label {
  line-height: 1.2;
}

.debuff-text__amount {
  display: inline-flex;
  align-items: baseline;
  gap: 1px;
  font-size: 0.85em;
  line-height: 1;
}

.debuff-text__amount-value {
  font-weight: 700;
}

.debuff-text__amount-unit {
  opacity: 0.9;
}
</style>
