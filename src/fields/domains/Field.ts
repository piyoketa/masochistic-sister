import type {
  CardRewardNode,
  EnemyNode,
  FieldNode,
  StartNode,
  RelicRewardNode,
  RandomCardRewardNode,
  RandomRelicRewardNode,
  FixedRelicRewardNode,
  BossEnemyNode,
} from './FieldNode'

export type FieldLevel = {
  level: number
  nodes: FieldNode[]
}

export abstract class Field {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly levels: FieldLevel[]

  getLevel(levelIndex: number): FieldLevel | undefined {
    return this.levels[levelIndex]
  }

  getNode(levelIndex: number, nodeIndex: number): FieldNode | undefined {
    return this.levels[levelIndex]?.nodes[nodeIndex]
  }

  isStartNode(node: FieldNode): node is StartNode {
    return node.type === 'start'
  }

  isEnemyNode(node: FieldNode): node is EnemyNode {
    return node.type === 'enemy' || node.type === 'boss-enemy'
  }

  isCardRewardNode(node: FieldNode): node is CardRewardNode {
    return node.type === 'card-reward'
  }

  isRelicRewardNode(node: FieldNode): node is RelicRewardNode {
    return node.type === 'relic-reward'
  }

  isRandomCardRewardNode(node: FieldNode): node is RandomCardRewardNode {
    return node.type === 'random-card-reward'
  }

  isRandomRelicRewardNode(node: FieldNode): node is RandomRelicRewardNode {
    return node.type === 'random-relic-reward'
  }

  isFixedRelicRewardNode(node: FieldNode): node is FixedRelicRewardNode {
    return node.type === 'fixed-relic-reward'
  }

  isBossEnemyNode(node: FieldNode): node is BossEnemyNode {
    return node.type === 'boss-enemy'
  }
}
