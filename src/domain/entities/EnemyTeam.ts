import type { Enemy } from './Enemy'
import { EnemyRepository } from '../repository/EnemyRepository'
import type { Battle } from '../battle/Battle'
import type { PlanAllyTargetSkill } from './Action/AllyStateSkill'
import type { Player } from './Player'
import type { Action } from './Action'

export interface EnemyTeamProps {
  id: string
  name?: string
  members: Enemy[]
  turnOrder?: number[]
  enemyRepository?: EnemyRepository
}

export class EnemyTeam {
  private readonly idValue: string
  private readonly nameValue: string
  private readonly membersValue: Enemy[]
  private readonly turnOrderValue: number[]
  private readonly repositoryValue: EnemyRepository

  constructor(props: EnemyTeamProps) {
    this.idValue = props.id
    this.nameValue = props.name ?? props.id
    this.repositoryValue = props.enemyRepository ?? new EnemyRepository()
    this.membersValue = props.members.map((enemy) => this.repositoryValue.register(enemy))
    this.turnOrderValue =
      props.turnOrder ??
      this.membersValue.map((enemy) => {
        const id = enemy.id
        if (id === undefined) {
          throw new Error('Enemy missing repository id')
        }

        return id
      })
  }

  get id(): string {
    return this.idValue
  }

  get name(): string {
    return this.nameValue
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

  /**
   * 敵を動的に追加する。ID採番・行動キュー初期化・ターン順への登録を行う。
   * 追加は末尾に挿入し、ビュー差分は Snapshot 側で反映される想定。
   */
  addEnemy(enemy: Enemy): Enemy {
    const registered = this.repositoryValue.register(enemy)
    if (registered.id === undefined) {
      throw new Error('Enemy registration failed')
    }
    this.membersValue.push(registered)
    this.turnOrderValue.push(registered.id)
    registered.resetTurn()
    return registered
  }

  findEnemy(id: number): Enemy | undefined {
    return this.repositoryValue.findById(id)
  }

  reorder(order: number[]): void {}

  startTurn(battle: Battle): void {
    this.membersValue.forEach((enemy) => enemy.handleTurnStart(battle))
  }

  handlePlayerTurnStart(battle: Battle): void {
    this.membersValue.forEach((enemy) => {
      enemy.handlePlayerTurnStart(battle)
      enemy.clearPlannedActionsForDisplay()
    })
  }

  endTurn(): void {
    this.membersValue.forEach((enemy) => enemy.resetTurn())
  }

  areAllDefeated(): boolean {
    return this.membersValue.every((enemy) => !enemy.isActive())
  }

  planUpcomingActions(battle: Battle): void {
    for (const enemy of this.membersValue) {
      if (!enemy.isActive()) {
        enemy.clearPlannedActionsForDisplay()
        continue
      }
      enemy.setQueueContext({ battle, enemy, team: this })
      this.planAllySupportActionIfNeeded(battle, enemy)
      enemy.refreshPlannedActionsForDisplay()
    }
  }
  /**
   * 味方支援系スキル（PlanAllyTargetSkill 実装）に対する事前ターゲット確定処理。
   * Action 側が planTarget を持つ場合のみ介入し、対象が見つからなければそのアクションを破棄する。
   */
  private planAllySupportActionIfNeeded(battle: Battle, enemy: Enemy): void {
    for (;;) {
      const upcoming = enemy.queuedActions[0]
      if (!this.isPlanAllyTargetSkill(upcoming)) {
        return
      }

      const planned = upcoming.planTarget({ battle, source: enemy, team: this })
      if (planned) {
        return
      }
      enemy.discardNextScheduledAction()
    }
  }

  private isPlanAllyTargetSkill(
    action: Action | undefined,
  ): action is Action & PlanAllyTargetSkill {
    return Boolean(action) && typeof (action as any).planTarget === 'function'
  }

  handleActionResolved(battle: Battle, actor: Player | Enemy, action: Action): void {
    this.membersValue.forEach((enemy) => enemy.handleActionResolved(battle, actor, action))
  }
}
