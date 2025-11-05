/*
AllyBuffSkill.ts の責務:
- 味方（Enemy/Player側の味方）にバフを付与するスキルアクション共通の基底クラスを提供し、対象選定や付与処理の土台を整える。
- 事前に決定した対象IDを受け取り、実行時に該当ユニットへStateを付与する共通フローを実装する。

責務ではないこと:
- 個別スキル固有の付加演出や追加効果。必要に応じて派生クラスが `afterBuffApplied` をオーバーライドする。

主要な通信相手:
- `EnemyTeam.planUpcomingActions`: `setPlannedTarget` を用いて、ターン開始時に対象IDを注入する。
- `Enemy`/`Player`: `applyInflictedStates` を通じてStateを付与する。
*/
import type { ActionContext } from './ActionBase'
import { Skill, type SkillProps } from './Skill'
import type { Enemy } from '../Enemy'
import type { Player } from '../Player'
import type { State } from '../State'

export interface AllyBuffSkillProps extends SkillProps {
  targetTags: string[]
  affinityKey: string
  inflictStates?: Array<() => State>
}

export abstract class AllyBuffSkill extends Skill {
  private readonly requiredTags: string[]
  private readonly affinityKeyValue: string
  private readonly inflictStateFactories: Array<() => State>
  private plannedTargetId?: number

  protected constructor(props: AllyBuffSkillProps) {
    super(props)
    this.requiredTags = [...props.targetTags]
    this.affinityKeyValue = props.affinityKey
    this.inflictStateFactories = props.inflictStates ? [...props.inflictStates] : []
  }

  get requiredAllyTags(): string[] {
    return [...this.requiredTags]
  }

  get affinityKey(): string {
    return this.affinityKeyValue
  }

  setPlannedTarget(enemyId: number | undefined): void {
    this.plannedTargetId = enemyId
  }

  getPlannedTarget(): number | undefined {
    return this.plannedTargetId
  }

  protected clearPlannedTarget(): void {
    this.plannedTargetId = undefined
  }

  override execute(context: ActionContext): void {
    super.execute(context)
    this.clearPlannedTarget()
  }

  override canUse(context: { battle: ActionContext['battle']; source: Player | Enemy }): boolean {
    const team = context.battle.enemyTeam
    return team
      .members.filter((enemy) => enemy.isActive())
      .some((enemy) =>
        this.requiredTags.every((tag) => enemy.hasAllyTag(tag)),
      )
  }

  protected resolveAllyTarget(context: ActionContext): Enemy | undefined {
    const targetId = this.plannedTargetId
    if (targetId === undefined) {
      return undefined
    }
    return context.battle.enemyTeam.findEnemy(targetId)
  }

  protected applyInflictedStates(context: ActionContext, target: Enemy | Player): void {
    if (this.inflictStateFactories.length === 0) {
      return
    }

    for (const factory of this.inflictStateFactories) {
      const state = factory()
      target.addState(state, { battle: context.battle })
    }
  }

  protected afterBuffApplied(_context: ActionContext, _target: Enemy | Player): void {}

  protected override perform(context: ActionContext): void {
    const target = this.resolveAllyTarget(context)
    if (!target || !target.isActive()) {
      return
    }

    this.applyInflictedStates(context, target)
    this.afterBuffApplied(context, target)
  }
}
