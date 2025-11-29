import type { CardRewardNode, EnemyNode, FieldNode, StartNode } from './FieldNode'
import type { RelicRewardNode } from './FieldNode'

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
    return node.type === 'enemy'
  }

  isCardRewardNode(node: FieldNode): node is CardRewardNode {
    return node.type === 'card-reward'
  }

  isRelicRewardNode(node: FieldNode): node is RelicRewardNode {
    return node.type === 'relic-reward'
  }
}
