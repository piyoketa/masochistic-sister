import type { Enemy } from './Enemy'
import { EnemyRepository } from '../repository/EnemyRepository'
import type { Battle } from '../battle/Battle'
import { AllyBuffSkill } from './Action'
import type { Player } from './Player'
import type { Action } from './Action'

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
      // 複数回の破棄に耐えられるよう、先頭がAllyBuffSkillである限りループする
      for (;;) {
        const upcoming = enemy.queuedActions[0]
        if (!(upcoming instanceof AllyBuffSkill)) {
          break
        }

        if (!upcoming.canUse({ battle, source: enemy })) {
          enemy.discardNextScheduledAction()
          continue
        }

        const targetId = this.selectAllyTargetId(upcoming, enemy)
        if (targetId === undefined) {
          enemy.discardNextScheduledAction()
          continue
        }

        upcoming.setPlannedTarget(targetId)
        const targetEnemy = this.findEnemy(targetId)
        if (targetEnemy) {
          battle.addLogEntry({
            message: `${enemy.name}は追い風で${targetEnemy.name}を支援しようとしている。`,
            metadata: { enemyId: enemy.id, targetId },
          })
        }
        break
      }
      enemy.refreshPlannedActionsForDisplay()
    }
  }

  private selectAllyTargetId(skill: AllyBuffSkill, source: Enemy): number | undefined {
    const candidates = this.membersValue.filter((ally) => ally.isActive())
    const filtered = candidates.filter(
      (ally) => ally !== source && skill.requiredAllyTags.every((tag) => ally.hasAllyTag(tag)),
    )

    if (filtered.length === 0) {
      return undefined
    }

    const weighted = filtered
      .map((ally) => ({ ally, weight: ally.getAllyBuffWeight(skill.affinityKey) }))
      .filter(({ weight }) => weight > 0)

    if (weighted.length === 0) {
      return undefined
    }

    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0)
    const roll = source.sampleRng()
    let threshold = roll * total
    for (const entry of weighted) {
      threshold -= entry.weight
      if (threshold <= 0) {
        return entry.ally.id
      }
    }

    return weighted[weighted.length - 1]?.ally.id
  }

  handleActionResolved(battle: Battle, actor: Player | Enemy, action: Action): void {
    this.membersValue.forEach((enemy) => enemy.handleActionResolved(battle, actor, action))
  }
}
