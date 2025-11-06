<script setup lang="ts">
import { useRouter } from 'vue-router'
import GameLayout from '@/components/GameLayout.vue'

const router = useRouter()

type PresetRoute = {
  label: string
  description: string
  route: { name: string }
}

const presets: PresetRoute[] = [
  {
    label: 'Stage 1 (固定ログ再生)',
    description: 'シナリオ1と同じ初期デッキと敵編成。ActionLogで再現。',
    route: { name: 'battle-stage1' },
  },
  {
    label: 'Testcase 1 (固定ログ再生)',
    description: 'シナリオ1のテストケース。途中まで操作済みの盤面を再現。',
    route: { name: 'battle-testcase1' },
  },
  {
    label: 'Testcase 2 (固定ログ再生)',
    description: 'シナリオ2のテストケース。鉄花チームとの交戦を同条件で再生。',
    route: { name: 'battle-testcase2' },
  },
  {
    label: 'Stage 2 (ランダム挙動)',
    description: 'シナリオ2と同じデッキ／敵チームで、初期順序と行動をランダムに体験。',
    route: { name: 'battle-stage2' },
  },
  {
    label: 'Stage 3 (ハチドリ＆サソリ)',
    description: 'DefaultDeckでハチドリ／サソリ編成と交戦。追い風支援の挙動を確認。',
    route: { name: 'battle-stage3' },
  },
  {
    label: 'Stage 4 (オークヒーロー戦)',
    description: 'DefaultDeckでエリート戦。大型・吸血・加速の組み合わせを検証。',
    route: { name: 'battle-stage4' },
  },
]

const navigateTo = (route: PresetRoute['route']) => {
  router.push(route)
}
</script>

<template>
  <GameLayout>
    <template #window>
      <div class="title-block">
        <h1 class="title">被虐のシスター</h1>
        <p class="subtitle">テストプレセットを選択してください</p>

        <div class="preset-grid">
          <button
            v-for="preset in presets"
            :key="preset.label"
            type="button"
            class="preset-button"
            @click="navigateTo(preset.route)"
          >
            <span class="preset-label">{{ preset.label }}</span>
            <span class="preset-description">{{ preset.description }}</span>
          </button>
        </div>
      </div>
    </template>
    <template #instructions>
      <h2>操作メモ</h2>
      <p>
        各プリセットからバトルビューを開き、ログ再現やインタラクティブな操作確認ができます。バトル画面の左下メニューから「Retry」や「一手戻す」を使うことで、プレイ内容の検証をスムーズに行えます。
      </p>
      <ul>
        <li>TestcaseはActionLogを基に盤面を再構築します（プレイヤー操作不可の局面あり）</li>
        <li>Stage系プリセットはデッキと敵構成を共有しながら挙動だけ変化させられます</li>
        <li>検証内容をメモするときは、再現性の高いTestcaseから着手するのがおすすめです</li>
      </ul>
    </template>
  </GameLayout>
</template>

<style scoped>
.title-block {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: auto;
  max-width: min(720px, 90vw);
}

.title {
  font-size: clamp(36px, 6vw, 72px);
  letter-spacing: 0.12em;
  margin: 0;
  text-align: center;
}

.subtitle {
  margin: 0;
  font-size: clamp(16px, 2.2vw, 20px);
  letter-spacing: 0.08em;
  text-align: center;
  color: #d5d5d5;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.preset-button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(10, 10, 20, 0.6);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.preset-button:hover,
.preset-button:focus-visible {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(20, 20, 40, 0.7);
  transform: translateY(-2px);
}

.preset-label {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.preset-description {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(230, 230, 240, 0.9);
}

@media (max-width: 640px) {
  .preset-grid {
    grid-template-columns: 1fr;
  }
}
</style>
