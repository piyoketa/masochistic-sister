export type FieldNodeType = 'start' | 'enemy' | 'card-reward' | 'relic-reward'

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
