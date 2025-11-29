import { Field, type FieldLevel } from './Field'
import type { CardRewardNode, EnemyNode, FieldNode, StartNode } from './FieldNode'

/**
 * SampleField: 一直線に敵が並ぶシンプルなフィールド。
 * Level1: StartNode
 * Level2: カード獲得マス（候補: 戦いの準備/日課/窮地/不殺の祈り/リロード/傷の癒やし）を3枚抽選
 * Level3: snail
 * Level4: iron-bloom
 * Level5: hummingbird-scorpion
 * Level6: orc-hero-elite
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
    ],
    drawCount: 3,
    nextNodeIndices: [0],
  }
  const level2: EnemyNode = {
    id: 'enemy-snail',
    type: 'enemy',
    level: 3,
    label: '敵「かたつむり」',
    enemyTeamId: 'snail',
    nextNodeIndices: [0],
  }
  const level3: EnemyNode = {
    id: 'enemy-iron-bloom',
    type: 'enemy',
    level: 4,
    label: '敵「鉄花」',
    enemyTeamId: 'iron-bloom',
    nextNodeIndices: [0],
  }
  const level4: EnemyNode = {
    id: 'enemy-hummingbird-scorpion',
    type: 'enemy',
    level: 5,
    label: '敵「ハチドリ」',
    enemyTeamId: 'hummingbird-scorpion',
    nextNodeIndices: [0],
  }
  const level5: EnemyNode = {
    id: 'enemy-orc-hero-elite',
    type: 'enemy',
    level: 6,
    label: 'エリート「オークヒーロー」',
    enemyTeamId: 'orc-hero-elite',
    nextNodeIndices: [],
  }

  const nodesByLevel: FieldNode[][] = [
    [level1],
    [cardReward],
    [level2],
    [level3],
    [level4],
    [level5],
  ]

  nodesByLevel.forEach((nodes, idx) => {
    levels.push({ level: idx + 1, nodes })
  })

  return levels
}
