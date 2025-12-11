<!--
RewardDemoView の責務:
- デモ用の報酬データを rewardStore にセットし、/reward へ遷移できる導線を提供する。
- 本番の勝利計算は行わず、固定の報酬内容をセットする。
-->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import GameLayout from '@/components/GameLayout.vue'
import { useRewardStore, type PendingReward } from '@/stores/rewardStore'
import { listStandardSampleCardBlueprints } from '@/domain/library/Library'

const router = useRouter()
const rewardStore = useRewardStore()

const demoCards = listStandardSampleCardBlueprints()

const demoReward: PendingReward = {
  battleId: 'demo-battle',
  hpHeal: 50,
  goldGain: 30,
  defeatedCount: 1,
  cards: demoCards,
}

function setRewardAndGo(): void {
  rewardStore.setReward(demoReward)
  router.push('/reward')
}
</script>

<template>
  <GameLayout>
    <template #window>
      <div class="reward-demo">
        <h1>Reward Demo</h1>
        <p>デモ用の報酬データをセットし、報酬画面へ遷移します。</p>
        <button type="button" class="reward-button" @click="setRewardAndGo">報酬画面へ</button>
      </div>
    </template>
  </GameLayout>
</template>

<style scoped>
.reward-demo {
  padding: 32px clamp(20px, 5vw, 64px);
  color: #f5f2ff;
  min-height: 100vh;
}

.reward-button {
  background: rgba(255, 227, 115, 0.95);
  color: #2d1a0f;
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-weight: 800;
  cursor: pointer;
}
</style>
