import type { Enemy } from './Enemy'

export interface EnemyTeamProps {
  id: string
  members: Enemy[]
  turnOrder?: string[]
}

export class EnemyTeam {
  private readonly idValue: string
  private readonly membersValue: Enemy[]
  private readonly turnOrderValue: string[]

  constructor(props: EnemyTeamProps) {
    this.idValue = props.id
    this.membersValue = props.members
    this.turnOrderValue = props.turnOrder ?? props.members.map((enemy) => enemy.id)
  }

  get id(): string {
    return this.idValue
  }

  get members(): Enemy[] {
    return this.membersValue
  }

  get turnOrder(): string[] {
    return this.turnOrderValue
  }

  findEnemy(enemyId: string): Enemy | undefined {
    return this.membersValue.find((enemy) => enemy.id === enemyId)
  }

  reorder(order: string[]): void {}

  startTurn(): void {}

  endTurn(): void {}
}
