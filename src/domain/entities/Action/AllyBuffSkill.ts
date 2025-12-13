/*
AllyBuffSkill.ts の責務:
- 味方（Enemy/Player側の味方）にバフを付与するスキルアクション共通の基底クラスを提供し、対象選定や付与処理の土台を整える。
- 事前に決定した対象IDを受け取り、該当ユニットへStateを付与する共通フローを実装する。「計画済みターゲットが不在/戦闘不能なら行動は不発（skipped）として扱う」という仕様をここで保証する。

責務ではないこと:
- 個別スキル固有の付加演出や追加効果。必要に応じて派生クラスが `afterBuffApplied` をオーバーライドする。

主要な通信相手:
- `EnemyTeam.planUpcomingActions`: `setPlannedTarget` を用いて、ターン開始時に対象IDを注入する。
- `Enemy`/`Player`: `applyInflictedStates` を通じてStateを付与する。
*/
import { AllyStateSkill, type AllyStateSkillProps } from './AllyStateSkill'
import type { Enemy } from '../Enemy'
import type { State } from '../State'
import type { ActionContext } from './ActionBase'

export type AllyBuffSkillProps = AllyStateSkillProps & {
  inflictStates?: Array<() => State>
}

export abstract class AllyBuffSkill extends AllyStateSkill {
  protected constructor(props: AllyBuffSkillProps) {
    super(props)
  }

  protected afterBuffApplied(_context: ActionContext, _target: Enemy): void {}

  protected override perform(context: ActionContext): void {
    const target = this.resolveAllyTarget(context)
    if (!target || !target.isActive()) {
      context.metadata = {
        ...(context.metadata ?? {}),
        skipped: true,
        skipReason: 'ally-target-missing',
      }
      return
    }

    this.applyInflictedStates(context, target)
    this.afterBuffApplied(context, target)
  }
}
