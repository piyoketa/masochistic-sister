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
  // 追い風などの実行結果を調査するためのデバッグフラグ。env.VITE_DEBUG_ALLY_BUFF_APPLY=true で有効化。
  private static readonly DEBUG_ALLY_BUFF_APPLY =
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_DEBUG_ALLY_BUFF_APPLY === 'true') ||
    (typeof process !== 'undefined' && process.env?.VITE_DEBUG_ALLY_BUFF_APPLY === 'true')

  protected constructor(props: AllyBuffSkillProps) {
    super(props)
  }

  protected afterBuffApplied(_context: ActionContext, _target: Enemy): void {}

  protected override perform(context: ActionContext): void {
    const target = this.resolveAllyTarget(context)
    if (!target || !target.isActive()) {
      if (AllyBuffSkill.DEBUG_ALLY_BUFF_APPLY) {
        // eslint-disable-next-line no-console
        console.info('[AllyBuffSkill.perform] skipped (ally-target-missing)', {
          action: this.name,
          source: { id: (context.source as Enemy).id, name: (context.source as Enemy).name },
          turn: context.battle.turnPosition?.turn,
          side: context.battle.turnPosition?.activeSide,
          plannedTargetId: this.getPlannedTarget(),
          targetFound: Boolean(target),
          targetActive: target?.isActive?.(),
        })
      }
      context.metadata = {
        ...(context.metadata ?? {}),
        skipped: true,
        skipReason: 'ally-target-missing',
      }
      return
    }

    if (AllyBuffSkill.DEBUG_ALLY_BUFF_APPLY) {
      // 実際に付与する直前のログ。重複付与やスタック挙動を確認しやすくする。
      // eslint-disable-next-line no-console
      console.info('[AllyBuffSkill.perform] apply buff', {
        action: this.name,
        source: { id: (context.source as Enemy).id, name: (context.source as Enemy).name },
        target: { id: target.id, name: target.name },
        turn: context.battle.turnPosition?.turn,
        side: context.battle.turnPosition?.activeSide,
        inflictStates: this.inflictStateFactories.map((factory) => factory()?.id),
        beforeStates: target.getStates?.().map((state) => ({
          id: state.id,
          name: state.name,
          magnitude: state.magnitude,
        })),
      })
    }
    const statesBefore = target.getStates ? target.getStates() : []
    this.applyInflictedStates(context, target)
    this.afterBuffApplied(context, target)
    if (AllyBuffSkill.DEBUG_ALLY_BUFF_APPLY) {
      // 付与後の状態一覧を出力し、加速が増えているかの一次確認に使う。
      // eslint-disable-next-line no-console
      console.info('[AllyBuffSkill.perform] applied states', {
        target: { id: target.id, name: target.name },
        turn: context.battle.turnPosition?.turn,
        side: context.battle.turnPosition?.activeSide,
        states: target.getStates?.().map((state) => ({
          id: state.id,
          name: state.name,
          magnitude: state.magnitude,
        })),
        diff: target.getStates
          ? target
              .getStates()
              .filter((after) => !statesBefore.some((before) => before.id === after.id && before.magnitude === after.magnitude))
              .map((state) => ({ id: state.id, name: state.name, magnitude: state.magnitude }))
          : [],
      })
    }
  }
}
