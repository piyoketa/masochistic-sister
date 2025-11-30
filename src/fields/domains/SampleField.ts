import { Field, type FieldLevel } from './Field'
import type { CardRewardNode, EnemyNode, FieldNode, RelicRewardNode, StartNode } from './FieldNode'

/**
 * SampleField: 一直線に敵が並ぶシンプルなフィールド。
 * Level1: StartNode
 * Level2: カード獲得マス
 * Level3-8: 通常敵とレリック獲得を交互に配置（3回ずつ）
 * Level9: orc-hero-elite
 */
export class SampleField extends Field {
  readonly id = 'sample-field'
  readonly name = 'Sample Field'
  readonly levels: FieldLevel[]

  constructor() {
    super()
    this.levels = buildLevels()
  }
}

function buildLevels(): FieldLevel[] {
  const levels: FieldLevel[] = []

  const level1: StartNode = {
    id: 'start-1',
    type: 'start',
    level: 1,
    label: 'スタートマス',
    nextNodeIndices: [0],
  }
  const cardReward: CardRewardNode = {
    id: 'card-reward-1',
    type: 'card-reward',
    level: 2,
    label: 'カード獲得マス',
    candidateActions: [
      'battle-prep',
      'daily-routine',
      'predicament',
      'non-violence-prayer',
      'reload',
      'scar-regeneration',
      'life-drain-skill',
    ],
    drawCount: 3,
    nextNodeIndices: [0],
  }
  const relicReward: RelicRewardNode = {
    id: 'relic-reward-1',
    type: 'relic-reward',
    level: 0, // 後で実レベルに上書き
    label: 'レリック獲得マス',
    candidateRelics: [
      // 'MemorySaintRelic',
      // 'SacrificialAwarenessRelic',
      // 'AdversityExcitementRelic',
      'LightweightCombatRelic',
      // 'ActionForceRelic',
      'PureBodyRelic',
      'NoViolenceRelic',
      // 'SlipperyTouchRelic',
      // 'DevoutBelieverRelic',
      'ArcaneAdaptationRelic',
      'ThoroughPreparationRelic',
    ],
    drawCount: 1,
    nextNodeIndices: [0],
  }
  const enemyPool: EnemyNode[] = [
    {
      id: 'enemy-snail',
      type: 'enemy',
      level: 0,
      label: '敵「かたつむり」',
      enemyTeamId: 'snail',
      nextNodeIndices: [0],
    },
    {
      id: 'enemy-iron-bloom',
      type: 'enemy',
      level: 0,
      label: '敵「鉄花」',
      enemyTeamId: 'iron-bloom',
      nextNodeIndices: [0],
    },
    {
      id: 'enemy-hummingbird-allies',
      type: 'enemy',
      level: 0,
      label: '敵「ハチドリ」',
      enemyTeamId: 'hummingbird-allies',
      nextNodeIndices: [0],
    },
    {
      id: 'enemy-orc-wrestler',
      type: 'enemy',
      level: 0,
      label: '敵「オークレスラー」',
      enemyTeamId: 'orc-wrestler-team',
      nextNodeIndices: [0],
    },
    {
      id: 'enemy-gun-goblin-team',
      type: 'enemy',
      level: 0,
      label: '敵「銃ゴブリンチーム」',
      enemyTeamId: 'gun-goblin-team',
      nextNodeIndices: [0],
    },
  ]
  // プールからランダムに3体を選択し、順序もシャッフル
  const midEnemies = [...enemyPool].sort(() => Math.random() - 0.5).slice(0, 3)

  const eliteCandidates: EnemyNode[] = [
    {
      id: 'enemy-orc-hero-elite',
      type: 'enemy',
      level: 0,
      label: 'エリート「オークヒーロー」',
      enemyTeamId: 'orc-hero-elite',
      nextNodeIndices: [],
    },
    {
      id: 'enemy-high-orc-band',
      type: 'enemy',
      level: 0,
      label: 'エリート「ハイオーク一味」',
      enemyTeamId: 'high-orc-band',
      nextNodeIndices: [],
    },
    {
      id: 'enemy-beam-cannon-elite',
      type: 'enemy',
      level: 0,
      label: 'エリート「ビーム砲チーム」',
      enemyTeamId: 'beam-cannon-elite',
      nextNodeIndices: [],
    },
  ]
  const level7 = eliteCandidates[Math.floor(Math.random() * eliteCandidates.length)]

  // 敵とレリックを交互に挿入: enemy, relic, enemy, relic, enemy, relic
  const interleaved: FieldNode[][] = []
  for (let i = 0; i < midEnemies.length; i += 1) {
    interleaved.push([midEnemies[i]!])
    const clone: RelicRewardNode = {
      ...relicReward,
      id: `relic-reward-${i + 1}`,
      level: 0, // 後で上書き
    }
    interleaved.push([clone])
  }

  const nodesByLevel: FieldNode[][] = [[level1], [cardReward], ...interleaved, [level7]]

  nodesByLevel.forEach((nodes, idx) => {
    nodes.forEach((node) => {
      node.level = idx + 1
    })
    levels.push({ level: idx + 1, nodes })
  })

  return levels
}
