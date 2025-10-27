<script setup lang="ts">
const props = defineProps<{
  windowClickable?: boolean
}>()

const emit = defineEmits<{
  (event: 'window-click'): void
}>()

const handleWindowClick = () => {
  if (props.windowClickable) {
    emit('window-click')
  }
}
</script>

<template>
  <div class="page">
    <div class="game-screen">
      <div class="game-window" :class="{ clickable: props.windowClickable }" @click="handleWindowClick">
        <div class="window-body">
          <slot name="window" />
        </div>
      </div>
    </div>
    <section class="instructions">
      <slot name="instructions" />
    </section>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #ffffff;
  min-height: 100vh;
  color: #1f1f1f;
}

.game-screen {
  flex: 1 0 auto;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  box-sizing: border-box;
}

.game-window {
  width: 1280px;
  aspect-ratio: 16 / 9;
  background-color: #000000;
  color: #f5f5f5;
  display: flex;
  align-items: stretch;
  justify-content: center;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.window-body {
  display: flex;
  align-items: stretch;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.game-window.clickable {
  cursor: pointer;
}

.game-window.clickable:hover {
  transform: translateY(-6px);
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.5);
}

.instructions {
  width: 100%;
  max-width: 1280px;
  padding: 32px 24px 64px;
  box-sizing: border-box;
  line-height: 1.8;
}

@media (max-width: 1320px) {
  .game-window {
    width: 100%;
    max-width: 100%;
  }
}
</style>
