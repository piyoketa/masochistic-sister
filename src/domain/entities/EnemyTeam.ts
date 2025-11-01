import type { Enemy } from './Enemy'
import { EnemyRepository } from '../repository/EnemyRepository'

export interface EnemyTeamProps {
  id: string
  members: Enemy[]
  turnOrder?: number[]
  enemyRepository?: EnemyRepository
}

export class EnemyTeam {
  private readonly idValue: string
  private readonly membersValue: Enemy[]
  private readonly turnOrderValue: number[]
  private readonly repositoryValue: EnemyRepository

  constructor(props: EnemyTeamProps) {
    this.idValue = props.id
    this.repositoryValue = props.enemyRepository ?? new EnemyRepository()
    this.membersValue = props.members.map((enemy) => this.repositoryValue.register(enemy))
    this.turnOrderValue =
      props.turnOrder ??
      this.membersValue.map((enemy) => {
        const numericId = enemy.numericId
        if (numericId === undefined) {
          throw new Error('Enemy missing repository id')
        }

        return numericId
      })
  }

  get id(): string {
    return this.idValue
  }

  get members(): Enemy[] {
    return this.membersValue
  }

  get turnOrder(): number[] {
    return this.turnOrderValue
  }

  get repository(): EnemyRepository {
    return this.repositoryValue
  }

  findEnemy(enemyId: number): Enemy | undefined {
    return this.repositoryValue.findById(enemyId)
  }

  findEnemyByNumericId(id: number): Enemy | undefined {
    return this.repositoryValue.findById(id)
  }

  reorder(order: number[]): void {}

  startTurn(): void {
    this.membersValue.forEach((enemy) => enemy.resetTurn())
  }

  endTurn(): void {}
}
