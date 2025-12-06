<!--
RelicCard の責務:
- レリックのアイコン・名称・説明文をカード型で表示する。

非責務:
- オーバーレイ位置決定や表示制御（呼び出し元が行う）。
-->
<script setup lang="ts">
defineProps<{
  icon?: string
  name: string
  description: string
}>()
</script>

<template>
  <div class="relic-card">
    <div class="relic-card__title-row">
      <span class="relic-card__icon">{{ icon }}</span>
      <span class="relic-card__title">{{ name }}</span>
    </div>
    <div class="relic-card__body">{{ description }}</div>
  </div>
</template>

<style scoped>
.relic-card {
  background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.16), transparent 40%),
    linear-gradient(180deg, rgba(18, 16, 28, 0.94), rgba(10, 10, 18, 0.94));
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 14px;
  padding: 12px;
  color: #f4f1ff;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
}

.relic-card__title-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.relic-card__icon {
  font-size: 20px; /* RelicListヘッダーのアイコンサイズに合わせる */
  line-height: 1;
}

.relic-card__title {
  font-weight: 800;
  letter-spacing: 0.08em;
}

.relic-card__body {
  font-size: 13px;
  line-height: 1.5;
}
</style>
