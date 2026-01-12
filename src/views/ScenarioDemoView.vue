<!--
ScenarioDemoView の責務:
- ScenarioStore にデモ用シナリオを登録し、テキストウィンドウの動作を確認できるページを提供する。
- シナリオの開始/停止 UI を用意し、オーバーレイの挙動を検証できるようにする。

責務ではないこと:
- シナリオ演出そのものの実装（表示やクリック進行は TextWindowOverlayLayer が担当）。
- 本番シナリオのデータ管理。ここではデモ用の固定データのみ扱う。

主な通信相手とインターフェース:
- ScenarioStore の setScenario / clearScenario / hasRemaining を利用し、再生状態を制御する。
- ScenarioNode 型でテキストノードを渡す。テキストは renderRichText で変換されるため、
  <magnitude> / <variable> などの HTML 風タグを含められる。
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import GameLayout from '@/components/GameLayout.vue'
import { useScenarioStore, type ScenarioNode } from '@/stores/scenarioStore'

const scenarioStore = useScenarioStore()

const demoScenario: ScenarioNode[] = [
  {
    type: 'text',
    kind: 'narration',
    text: '薄い霧が床を這い、礼拝堂に残る鈍い匂いが肌にまとわりつく。',
  },
  {
    type: 'text',
    kind: 'speech',
    speaker: '記憶の聖女',
    text: 'ここまで来たのね。あなたの傷が、私の盾になる。',
  },
  {
    type: 'text',
    kind: 'narration',
    text: '胸に残る<variable>傷</variable>が熱を帯び、次の記憶を呼び起こす。',
  },
  {
    type: 'text',
    kind: 'speech',
    speaker: '記憶の聖女',
    text: '痛みは祈り。受けた分だけ、<magnitude>10</magnitude>点の力に変わる。',
  },
  {
    type: 'text',
    kind: 'speech',
    speaker: '敵影',
    text: 'その祈り、奪わせてもらおう。',
  },
  {
    type: 'text',
    kind: 'narration',
    text: '刃が振り下ろされる直前、時間だけがゆっくりと伸びた。',
  },
  {
    type: 'text',
    kind: 'speech',
    speaker: '記憶の聖女',
    text: 'ならば、私は受けた痛みで反撃する。',
  },
  {
    type: 'text',
    kind: 'narration',
    text: '<variable>記憶</variable>がカードとなり、掌の上に浮かび上がる。',
  },
  {
    type: 'text',
    kind: 'speech',
    speaker: '記憶の聖女',
    text: 'これが私の戦い方。あなたの攻撃は、私の武器になる。',
  },
  {
    type: 'text',
    kind: 'narration',
    text: '最後まで読み進めると、ウィンドウは静かに消える。',
  },
]

const isRunning = computed(() => scenarioStore.hasRemaining)

function startScenario(): void {
  // 配列参照を更新して、Pinia の変更検知が確実に走るようにする。
  scenarioStore.setScenario([...demoScenario])
}

function stopScenario(): void {
  // デモページを離れる時にも確実にオーバーレイを消すための明示的クリア。
  scenarioStore.clearScenario()
}

onMounted(() => {
  startScenario()
})

onBeforeUnmount(() => {
  stopScenario()
})
</script>

<template>
  <GameLayout>
    <template #window>
      <div class="scenario-demo-stage">
        <div class="scenario-demo-stage__glow"></div>
        <div class="scenario-demo-stage__content">
          <div class="scenario-demo-stage__title">Scenario Text Demo</div>
          <div class="scenario-demo-stage__subtitle">クリックで進むテキストウィンドウの検証</div>
          <div class="scenario-demo-stage__actions">
            <button type="button" class="scenario-demo-button" @click="startScenario">再生する</button>
            <button type="button" class="scenario-demo-button scenario-demo-button--ghost" @click="stopScenario">
              停止する
            </button>
          </div>
          <div class="scenario-demo-stage__status">
            状態: <span>{{ isRunning ? '再生中' : '待機中' }}</span>
          </div>
        </div>
      </div>
    </template>
    <template #instructions>
      <h1>シナリオテキストのデモ</h1>
      <p>画面上のオーバーレイが表示されたら、ウィンドウ外をクリックしてテキストを進めます。</p>
      <p>デモは自動で開始されます。再生をやり直したい場合は「再生する」をクリックしてください。</p>
      <p>タグ例: <code>&lt;variable&gt;</code> と <code>&lt;magnitude&gt;</code> を強調表示として使えます。</p>
    </template>
  </GameLayout>
</template>

<style scoped>
.scenario-demo-stage {
  position: relative;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at top, rgba(40, 32, 72, 0.9), rgba(10, 8, 14, 0.95));
  color: #f5f2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.scenario-demo-stage__glow {
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(circle at 20% 30%, rgba(120, 90, 180, 0.35), transparent 45%),
    radial-gradient(circle at 80% 65%, rgba(180, 120, 90, 0.25), transparent 40%);
  filter: blur(10px);
  pointer-events: none;
}

.scenario-demo-stage__content {
  position: relative;
  z-index: 1;
  padding: 24px 28px;
  border-radius: 18px;
  background: rgba(16, 14, 24, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.scenario-demo-stage__title {
  font-size: 20px;
  letter-spacing: 0.12em;
  font-weight: 700;
}

.scenario-demo-stage__subtitle {
  font-size: 13px;
  letter-spacing: 0.08em;
  color: rgba(240, 236, 255, 0.7);
}

.scenario-demo-stage__actions {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.scenario-demo-button {
  border: none;
  border-radius: 12px;
  padding: 8px 16px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  background: linear-gradient(90deg, rgba(255, 214, 128, 0.95), rgba(255, 176, 96, 0.95));
  color: #2d1a0f;
  transition: transform 120ms ease, box-shadow 120ms ease;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.35);
}

.scenario-demo-button:hover,
.scenario-demo-button:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.45);
}

.scenario-demo-button--ghost {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(245, 242, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.scenario-demo-stage__status {
  font-size: 12px;
  letter-spacing: 0.12em;
  color: rgba(225, 218, 255, 0.7);
}

.scenario-demo-stage__status span {
  color: rgba(255, 227, 155, 0.95);
  font-weight: 700;
}

@media (max-width: 720px) {
  .scenario-demo-stage__content {
    margin: 0 16px;
  }
}
</style>
