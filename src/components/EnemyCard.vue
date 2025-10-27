<script setup lang="ts">
import { computed } from 'vue'
import HpGauge from '@/components/HpGauge.vue'
import type { EnemyInfo } from '@/types/battle'

const props = defineProps<{ enemy: EnemyInfo }>()

const nextSkill = computed(() => props.enemy.skills?.[0] ?? null)
</script>

<template>
  <article class="enemy-card" :style="{ backgroundImage: `url(${props.enemy.image})` }">
    <div class="enemy-card__overlay">
      <header class="enemy-card__header">
        <h4>{{ props.enemy.name }}</h4>
        <HpGauge :current="props.enemy.hp.current" :max="props.enemy.hp.max" />
      </header>
      <div v-if="nextSkill" class="enemy-card__skill">
        <span class="enemy-card__skill-name">{{ nextSkill.name }}</span>
        <span class="enemy-card__skill-detail">{{ nextSkill.detail }}</span>
      </div>
      <div v-if="props.enemy.traits?.length" class="enemy-card__traits">
        <span class="enemy-card__traits-label">特性</span>
        <ul>
          <li v-for="trait in props.enemy.traits" :key="trait.name">
            <span class="enemy-card__trait-name">{{ trait.name }}</span>
            <span class="enemy-card__trait-detail">{{ trait.detail }}</span>
          </li>
        </ul>
      </div>
    </div>
  </article>
</template>

<style scoped>
.enemy-card {
  position: relative;
  display: flex;
  align-items: flex-end;
  height: 248px;
  border-radius: 16px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
}

.enemy-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(12, 12, 20, 0.25) 30%, rgba(12, 12, 24, 0.85) 100%);
}

.enemy-card__overlay {
  position: relative;
  width: 100%;
  margin: 0 18px 18px;
  padding: 16px 18px;
  border-radius: 12px;
  background: rgba(10, 12, 26, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 12px 22px rgba(0, 0, 0, 0.32);
}

.enemy-card__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.enemy-card__header h4 {
  margin: 0;
  font-size: 16px;
  letter-spacing: 0.05em;
}

.enemy-card__skill {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: rgba(245, 245, 245, 0.92);
}

.enemy-card__skill-name {
  font-weight: 600;
  letter-spacing: 0.05em;
  font-size: 13px;
}

.enemy-card__skill-detail {
  font-size: 12px;
  color: rgba(245, 245, 245, 0.8);
  line-height: 1.4;
}

.enemy-card__traits {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.enemy-card__traits-label {
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}

.enemy-card__traits ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.enemy-card__traits li {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.enemy-card__trait-name {
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.04em;
}

.enemy-card__trait-detail {
  font-size: 12px;
  color: rgba(245, 245, 245, 0.78);
  line-height: 1.4;
}
</style>
