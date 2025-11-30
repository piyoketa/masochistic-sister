export type FieldNodeType =
  | 'start'
  | 'enemy'
  | 'boss-enemy'
  | 'card-reward'
  | 'relic-reward'
  | 'random-card-reward'
  | 'fixed-relic-reward'

export interface FieldNode {
  id: string
  type: FieldNodeType
  level: number
  label?: string
  /** 次のレベルで到達可能なノードのインデックス */
  nextNodeIndices: number[]
}

export interface StartNode extends FieldNode {
  type: 'start'
}

export interface EnemyNode extends FieldNode {
  type: 'enemy'
  enemyTeamId: string
  label?: string
}

export interface CardRewardNode extends FieldNode {
  type: 'card-reward'
  candidateActions: string[]
  drawCount: number
}

export interface RelicRewardNode extends FieldNode {
  type: 'relic-reward'
  candidateRelics: string[]
  drawCount: number
}

export interface RandomCardRewardNode extends FieldNode {
  type: 'random-card-reward'
  candidateActions: string[]
  selectedActions: string[]
  drawCount: number
}

export interface FixedRelicRewardNode extends FieldNode {
  type: 'fixed-relic-reward'
  candidateRelics: string[]
  selectedRelic: string
}

export interface BossEnemyNode extends FieldNode {
  type: 'boss-enemy'
  enemyTeamId: string
  label: string
}
