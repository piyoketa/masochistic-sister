<!--
  Component: CutInDemoView
  責務: カットイン演出コンポーネントの表示・再生を確認するための実験ページを提供し、指定された画像を用いた再生ボタンを配置する。UI 説明や操作手順をまとめ、テストしやすいステージを用意する。
  非責務: ゲームロジックの進行管理や画像切り替えの判断は行わない。どのタイミングで再生するか、どの画像を選ぶかといったアプリケーション側の意思決定は親ルーターや別の管理層に委ねる。
  主な通信相手とインターフェース:
    - CutInOverlay コンポーネント: ref で取得し、公開メソッド play(): void を呼び出すことで演出を開始する。props.src には public 配下の画像パス（例: /assets/cut_ins/MasochisticAuraAction.png）を渡す。CutInOverlay は演出の可視性とアニメーションを内部で完結させ、ここでは開始指示のみを送る。
    - ユーザー入力: ボタンクリックをトリガーとして play を呼ぶ。クリック以外の入力制御やキーバインドは扱わない。
-->
<script setup lang="ts">
import { ref } from 'vue'
import CutInOverlay from '@/components/CutInOverlay.vue'

const cutInRef = ref<InstanceType<typeof CutInOverlay> | null>(null)
const cutInSrc = '/assets/cut_ins/MasochisticAuraAction.png'

function handlePlay(): void {
  // play メソッドのみで演出を完結できるように隠蔽している
  cutInRef.value?.play()
}
</script>

<template>
  <div class="cut-in-demo">
    <header class="demo-header">
      <h1>Cut-in Demo</h1>
      <p>カットイン画像を 0.7 秒表示する実験ページ。enter 0.1s → 表示 0.5s → leave 0.1s で再生します。</p>
    </header>

    <div class="demo-body">
      <section class="demo-panel">
        <h2>再生パラメータ</h2>
        <p class="panel-description">
          画像ファイル: <code>public/assets/cut_ins/MasochisticAuraAction.png</code>
        </p>
        <p class="panel-description">ボタンを押すとカットイン演出が再生されます。</p>
        <button type="button" class="play-button" @click="handlePlay">
          カットインを再生
        </button>
      </section>

      <section class="demo-stage">
        <div class="stage-frame">
          <p class="stage-note">ここにカットインが重なります</p>
          <CutInOverlay ref="cutInRef" :src="cutInSrc" alt="Masochistic Aura Cut-in" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.cut-in-demo {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 32px;
  color: #f8f7ff;
  background: radial-gradient(circle at 20% 20%, rgba(70, 42, 68, 0.35), rgba(6, 8, 20, 0.85));
  min-height: 100vh;
  box-sizing: border-box;
}

.demo-header h1 {
  margin: 0;
  font-size: 28px;
  letter-spacing: 0.1em;
}

.demo-header p {
  margin: 8px 0 0;
  color: rgba(248, 247, 255, 0.85);
  line-height: 1.6;
}

.demo-body {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  align-items: start;
}

.demo-panel {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(18, 17, 27, 0.85);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
}

.demo-panel h2 {
  margin: 0 0 12px;
  font-size: 18px;
}

.panel-description {
  margin: 4px 0;
  color: rgba(248, 247, 255, 0.82);
  line-height: 1.5;
}

.play-button {
  margin-top: 14px;
  padding: 10px 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255, 120, 180, 0.8), rgba(255, 180, 120, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #1a0d1a;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.play-button:hover,
.play-button:focus-visible {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 8px 16px rgba(255, 160, 180, 0.3);
}

.demo-stage {
  position: relative;
  width: 100%;
}

.stage-frame {
  position: relative;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.06), rgba(5, 8, 18, 0.9));
  min-height: 320px;
  overflow: hidden;
  display: grid;
  place-items: center;
}

.stage-note {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.05em;
}

@media (max-width: 900px) {
  .demo-body {
    grid-template-columns: 1fr;
  }
}
</style>
