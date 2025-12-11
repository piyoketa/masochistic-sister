<script setup lang="ts">
interface LinkEntry {
  label: string
  description: string
  to: string | { name: string }
}

const testcaseLinks: LinkEntry[] = [
  {
    label: 'Testcase 1',
    description: 'シナリオ1 固定ログで盤面を再現',
    to: { name: 'battle-testcase1' },
  },
  {
    label: 'Testcase 2',
    description: 'シナリオ2 鉄花チームの固定ログ',
    to: { name: 'battle-testcase2' },
  },
]

const enemyTeamLinks: LinkEntry[] = [
  {
    label: 'Snail Encounter',
    description: '基本デッキ × かたつむりチーム',
    to: '/battle/snail',
  },
  {
    label: 'Iron Bloom (Random)',
    description: 'シナリオ2と同じ鉄花チーム(ランダム行動)',
    to: '/battle/iron-bloom',
  },
  {
    label: 'Hummingbird Allies',
    description: 'ハチドリ',
    to: '/battle/hummingbird-allies',
  },
  {
    label: 'Orc Hero Elite',
    description: 'オークヒーロー＋取り巻きのエリート戦',
    to: '/battle/orc-hero-elite',
  },
  {
    label: 'Test Slug 5HP',
    description: '検証用: HP5 のなめくじ1体',
    to: '/battle/test-slug-5hp',
  },
  {
    label: 'Orc Wrestler Team',
    description: 'コウモリ＋ゴースト＋かたつむり＋オークレスラーの混成チーム',
    to: '/battle/orc-wrestler-team',
  },
  {
    label: 'Gun Goblin Team',
    description: '銃ゴブリンとお化け目玉の混成チーム',
    to: '/battle/gun-goblin-team',
  },
  {
    label: 'High Orc Band',
    description: 'ランサー×2＋ダンサーのエリート編成',
    to: '/battle/high-orc-band',
  },
  {
    label: 'Beam Cannon Elite',
    description: '大型ビーム砲＋酒飲みオークのエリート編成',
    to: '/battle/beam-cannon-elite',
  },
  {
    label: 'Giant Slug Elite',
    description: '大王なめくじ＋なめくじの召喚エリート',
    to: '/battle/giant-slug-elite',
  },
  {
    label: 'Orc Sumo Squad',
    description: 'オーク相撲チーム（固定構成）',
    to: '/battle/orc-sumo-squad',
  },
]

const demoLinks: LinkEntry[] = [
  {
    label: 'Damage Effects Demo',
    description: '被ダメージ演出 + 効果音のプレビュー',
    to: '/demo/damage-effects',
  },
  {
    label: 'Cut-in Demo',
    description: 'カットイン画像の再生実験ページ',
    to: '/demo/cut-in',
  },
  {
    label: 'Audio Hub Demo',
    description: '音声プリロード/再生の挙動を確認',
    to: '/demo/audio',
  },
  {
    label: 'Overlay Demo',
    description: 'Action/Relicカードのオーバーレイ表示デモ',
    to: '/demo/overlays',
  },
  {
    label: 'HpGauge Demo',
    description: '予測ダメージの黄色点滅を確認',
    to: '/demo/hp-gauge',
  },
  {
    label: 'Reward Demo',
    description: 'デモ用報酬をセットして /reward へ遷移',
    to: '/demo/reward',
  },
  {
    label: 'ActionCard実験場',
    description: 'カード配色の比較実験ページ',
    to: '/lab/action-cards',
  },
  {
    label: 'Card Animation Lab',
    description: 'card-create / eliminate のワイプ演出実験',
    to: '/lab/card-animations',
  },
  {
    label: 'Card Draw Lab',
    description: '山札から手札へカードを引く演出を検証',
    to: '/lab/card-draw',
  },
  {
    label: 'Card Glow Lab',
    description: 'ActionCardの縁を光らせるアニメーション実験',
    to: '/lab/card-glow',
  },
  {
    label: '悪魔の像(報酬ビュー直行)',
    description: 'DevilStatueRewardView へ直接遷移して呪い選択を確認',
    to: { name: 'devil-statue-reward' },
  },
]

const fieldLinks: LinkEntry[] = [
  {
    label: 'フィールドに出る',
    description: 'First Field のスタートマスへ',
    to: { name: 'start-story' },
  },
  // {
  //   label: '悪魔の像イベント',
  //   description: '呪いを選んで受け入れる単一ノードのフィールド',
  //   to: { name: 'field-devil-statue' },
  // },
]

</script>

<template>
  <div class="title-view">
    <header class="title-hero">
      <h1>被虐のシスター</h1>
      <p>テストケース、敵チーム、デッキ確認画面へ移動してください。</p>
    </header>

    <section>
      <h2>フィールド</h2>
      <ul class="link-grid link-grid--field">
        <li v-for="link in fieldLinks" :key="link.label">
          <RouterLink
            class="link-card"
            :class="{ 'link-card--primary': link.to === '/field' }"
            :to="link.to"
          >
            <span class="link-label">{{ link.label }}</span>
            <span class="link-description">{{ link.description }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <section class="deck-row">
      <RouterLink class="link-card deck-card" to="/deck">
        <span class="link-label">デッキ確認</span>
        <span class="link-description">現在の所持デッキとHPを確認できます</span>
      </RouterLink>
      <RouterLink class="link-card deck-card" to="/relic">
        <span class="link-label">レリック編集</span>
        <span class="link-description">所持レリックの追加・削除を行う</span>
      </RouterLink>
    </section>
    
    <section>
      <h2>固定ログ / Testcase</h2>
      <ul class="link-grid">
        <li v-for="link in testcaseLinks" :key="link.label">
          <RouterLink class="link-card" :to="link.to">
            <span class="link-label">{{ link.label }}</span>
            <span class="link-description">{{ link.description }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <section>
      <h2>デモ / Animation Playground</h2>
      <ul class="link-grid">
        <li v-for="link in demoLinks" :key="link.label">
          <RouterLink class="link-card" :to="link.to">
            <span class="link-label">{{ link.label }}</span>
            <span class="link-description">{{ link.description }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <section>
      <h2>敵チーム（/battle/[enemy-team-id]）</h2>
      <ul class="link-grid">
        <li v-for="link in enemyTeamLinks" :key="link.label">
          <RouterLink class="link-card" :to="link.to">
            <span class="link-label">{{ link.label }}</span>
            <span class="link-description">{{ link.description }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.title-view {
  min-height: 100vh;
  padding: 40px clamp(20px, 5vw, 80px);
  background: radial-gradient(circle at top, rgba(34, 28, 63, 0.95), rgba(9, 9, 14, 0.95));
  color: #f5f2ff;
  box-sizing: border-box;
}

.title-hero {
  text-align: center;
  margin-bottom: 32px;
}

.title-hero h1 {
  margin: 0 0 8px;
  font-size: clamp(36px, 6vw, 64px);
  letter-spacing: 0.16em;
}

.title-hero p {
  margin: 0;
  color: rgba(245, 242, 255, 0.8);
}

section {
  margin-top: 32px;
}

section:first-of-type {
  margin-top: 0;
}

h2 {
  margin: 0 0 16px;
  font-size: 20px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.85);
}

.link-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.link-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(16, 18, 34, 0.8);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.link-card:hover,
.link-card:focus-visible {
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  background: rgba(25, 28, 46, 0.85);
}

.link-label {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.link-description {
  font-size: 13px;
  color: rgba(240, 240, 255, 0.8);
  line-height: 1.4;
}

.link-grid--field {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.link-card--primary {
  border: 2px solid rgba(255, 227, 115, 0.9);
  box-shadow: 0 10px 36px rgba(255, 227, 115, 0.25);
  transform: translateY(-2px);
}

.deck-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin: 20px 0 28px;
}

.deck-card {
  border-color: rgba(255, 200, 120, 0.5);
  background: rgba(60, 36, 14, 0.6);
}

.deck-card:hover,
.deck-card:focus-visible {
  border-color: rgba(255, 200, 120, 0.8);
  background: rgba(72, 43, 20, 0.75);
}
</style>
