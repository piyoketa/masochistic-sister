<!--
StartStoryView の責務:
- スタートマスで表示される導入ストーリーを1ページ構成で描画し、進むボタンでフィールドに戻す。
- 共通レイアウト MainGameLayout と StoryPagesComponent を利用して、今後ページを増やしても拡張しやすくする。
-->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import MainGameLayout from '@/components/battle/MainGameLayout.vue'
import StoryPagesComponent from '@/components/StoryPagesComponent.vue'
import type { StoryPage } from '@/components/StoryPagesComponent.vue'
import { useFieldStore } from '@/stores/fieldStore'
import { usePlayerStore } from '@/stores/playerStore'

const router = useRouter()
const fieldStore = useFieldStore()
const playerStore = usePlayerStore()
playerStore.ensureInitialized()

const pages: StoryPage[] = [
  {
    lines: [
      '「ついに、この日が来てしまったのですね……」',
      '“記憶の聖女に選ばれた者は、成人の日を迎えたら、',
      '魔窟の最深部へと向かい、洗礼の儀を受けよ”',
      '教会に伝わる、古来からの伝統。',
      'あなたは、瘴気の漂う穴の中へと一歩踏み出した……！',
    ],
    actionLabel: '魔窟に入る',
  },
]

async function handleFinish(): Promise<void> {
  // ストーリー終了後はフィールドに戻す。フィールドは既定の状態を保持する。
  await router.push('/field')
}
</script>

<template>
  <MainGameLayout>
    <div class="start-story">
      <StoryPagesComponent :pages="pages" @finish="handleFinish" />
    </div>
  </MainGameLayout>
</template>

<style scoped>
.start-story {
  padding: 24px clamp(20px, 5vw, 48px);
  color: #f5f2ff;
}
</style>
