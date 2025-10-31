import type { Enemy } from './Enemy'
import { EnemyRepository } from '../repository/EnemyRepository'

export interface EnemyTeamProps {
  id: string
  members: Enemy[]
  turnOrder?: Array<string | number>
  enemyRepository?: EnemyRepository
}

export class EnemyTeam {
  private readonly idValue: string
  private readonly membersValue: Enemy[]
  private readonly turnOrderValue: Array<string | number>
  private readonly repositoryValue: EnemyRepository

  constructor(props: EnemyTeamProps) {
    this.idValue = props.id
    this.repositoryValue = props.enemyRepository ?? new EnemyRepository()
    this.membersValue = props.members.map((enemy) => this.repositoryValue.register(enemy))
    this.turnOrderValue = props.turnOrder ?? this.membersValue.map((enemy) => enemy.numericId ?? enemy.id)
  }

  get id(): string {
    return this.idValue
  }

  get members(): Enemy[] {
    return this.membersValue
  }

  get turnOrder(): Array<string | number> {
    return this.turnOrderValue
  }

  get repository(): EnemyRepository {
    return this.repositoryValue
  }

  findEnemy(enemyId: string | number): Enemy | undefined {
    if (typeof enemyId === 'number') {
      return this.repositoryValue.findById(enemyId)
    }

    return this.membersValue.find((enemy) => enemy.id === enemyId)
  }

  findEnemyByNumericId(id: number): Enemy | undefined {
    return this.repositoryValue.findById(id)
  }

  reorder(order: string[]): void {}

  startTurn(): void {}

  endTurn(): void {}
}
