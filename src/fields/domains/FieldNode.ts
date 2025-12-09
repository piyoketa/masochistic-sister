import type { CardBlueprint } from '@/domain/library/Library'

export type FieldNodeType =
  | 'start'
  | 'enemy'
  | 'boss-enemy'
  | 'card-reward'
  | 'relic-reward'
  | 'random-card-reward'
  | 'random-relic-reward'
  | 'fixed-relic-reward'
  | 'devil-statue'

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
  candidateActions: CardBlueprint[]
  drawCount: number
}

export interface RelicRewardNode extends FieldNode {
  type: 'relic-reward'
  candidateRelics: string[]
  drawCount: number
}

export interface RandomCardRewardNode extends FieldNode {
  type: 'random-card-reward'
  candidateActions: CardBlueprint[]
  selectedActions: CardBlueprint[]
  drawCount: number
}

export interface RandomRelicRewardNode extends FieldNode {
  type: 'random-relic-reward'
  candidateRelics: string[]
  offerCount: number
  drawCount: number
}

export interface FixedRelicRewardNode extends FieldNode {
  type: 'fixed-relic-reward'
  candidateRelics: string[]
  selectedRelic: string
}

export interface DevilStatueNode extends FieldNode {
  type: 'devil-statue'
  /** 呪い候補（状態異常カード） */
  curses: CardBlueprint[]
  /** 選択して獲得する枚数 */
  selectionCount: number
}

export interface BossEnemyNode extends FieldNode {
  type: 'boss-enemy'
  enemyTeamId: string
  label: string
}
