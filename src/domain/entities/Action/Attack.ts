/*
Attack.ts の責務:
- 攻撃アクション共通のロジック（ダメージ計算、追加状態付与、ターゲット操作の強制など）を実装し、個別の攻撃アクションへ継承させる。
- 攻撃カードの複製（記憶カード化）や、演出に必要なダメージプロファイル情報を統一的に扱う。

責務ではないこと:
- 与ダメージ後のログ出力や敵行動の予約管理など、バトル全体のフロー制御。
- ダメージ計算アルゴリズムそのもの（各種 `State` が拡張する）や、ビュー向けの表示整形。

主要な通信相手とインターフェース:
- `ActionBase.ts` の `Action`: 基底クラスとしてカード定義やコンテキスト準備を提供し、攻撃固有処理をオーバーライドする。
- `Damages`: 攻撃プロファイルを表現する値オブジェクト。`calcDamages` で攻撃側・防御側の `State` を参照して最終値を算出する。
- `TargetEnemyOperation`: 攻撃対象の選択を要求する `Operation`。敵行動（プレイヤーが対象）時には省略できるよう `shouldRequireOperation` を調整する。
- `Player.rememberEnemyAttack`: プレイヤーが被弾した攻撃を「記憶カード」として生成する。状態付与の記録は `Player.addState` 経由で行う。
*/
import type { Battle } from '../../battle/Battle'
import type { Enemy } from '../Enemy'
import type { Player } from '../Player'
import type { State } from '../State'
import { Damages } from '../Damages'
import {
  TargetEnemyOperation,
  type CardOperation,
  type Operation,
} from '../operations'
import type { ActionContext, ActionType, BaseActionProps } from './ActionBase'
import { Action } from './ActionBase'
import { isPlayerEntity } from '../typeGuards'

export interface AttackProps extends BaseActionProps {
  baseDamage: Damages
  inflictStates?: Array<() => State>
}

export abstract class Attack extends Action {
  protected readonly baseProfile: Damages
  private readonly inflictStateFactories: Array<() => State>

  protected constructor(props: AttackProps) {
    super(props)
    this.baseProfile = props.baseDamage
    this.inflictStateFactories = props.inflictStates ? [...props.inflictStates] : []
  }

  get type(): ActionType {
    return 'attack'
  }

  get baseDamages(): Damages {
    return this.baseProfile
  }

  cloneWithDamages(damages: Damages, overrides?: Partial<BaseActionProps>): Attack {
    const clone = Object.create(Object.getPrototypeOf(this)) as Attack
    const currentProps = (this as unknown as { props: BaseActionProps }).props
    const mergedProps: BaseActionProps = {
      ...currentProps,
      ...(overrides ?? {}),
      cardDefinition: {
        ...currentProps.cardDefinition,
        ...(overrides?.cardDefinition ?? {}),
      },
    }

    Object.assign(clone, this)
    ;(clone as unknown as { baseProfile: Damages }).baseProfile = new Damages({
      baseAmount: damages.amount,
      baseCount: damages.count,
      type: damages.type,
    })
    ;(clone as unknown as { props: BaseActionProps }).props = mergedProps

    return clone
  }

  protected override perform(context: ActionContext): void {
    const isPlayerSource = isPlayerEntity(context.source)
    const target = context.target ?? this.resolveTarget(context)
    const defender = target ?? (isPlayerSource ? undefined : context.battle.player)
    if (!defender) {
      throw new Error('Attack target is not resolved')
    }

    this.beforeAttack(context, defender)

    const damages = this.calcDamages(context.source, defender)
    const totalDamage = Math.max(0, damages.amount * damages.count)

    if (this.isPlayer(defender)) {
      context.battle.damagePlayer(totalDamage)
    } else {
      defender.takeDamage(totalDamage)
    }

    this.applyInflictedStates(context, defender)
    this.onAfterDamage(context, damages, defender)

    if (this.isPlayer(defender)) {
      defender.rememberEnemyAttack(damages, this, context.battle)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected beforeAttack(_context: ActionContext, _defender: Player | Enemy): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onAfterDamage(_context: ActionContext, _damages: Damages, _defender: Player | Enemy): void {}

  calcDamages(attacker: Player | Enemy, defender: Player | Enemy): Damages {
    return new Damages({
      baseAmount: this.baseProfile.baseAmount,
      baseCount: this.baseProfile.baseCount,
      type: this.baseProfile.type,
      attackerStates: this.collectStates(attacker),
      defenderStates: this.collectStates(defender),
    })
  }

  protected override buildOperations(): Operation[] {
    return [new TargetEnemyOperation()]
  }

  protected override shouldRequireOperation(
    operation: Operation,
    context: { battle: Battle; source: Player | Enemy; operations: CardOperation[] },
  ): boolean {
    const isPlayerSource = isPlayerEntity(context.source)
    if (!isPlayerSource && operation.type === TargetEnemyOperation.TYPE) {
      return false
    }

    return true
  }

  private isPlayer(entity: Player | Enemy): entity is Player {
    return isPlayerEntity(entity)
  }

  private collectStates(entity: Player | Enemy): State[] {
    if ('getStates' in entity && typeof entity.getStates === 'function') {
      return [...entity.getStates()]
    }

    return []
  }

  get inflictStatePreviews(): State[] {
    return this.inflictStateFactories.map((factory) => factory())
  }

  private applyInflictedStates(context: ActionContext, defender: Player | Enemy): void {
    if (this.inflictStateFactories.length === 0) {
      return
    }

    for (const factory of this.inflictStateFactories) {
      const state = factory()
      if (!this.canInflictState(context, defender, state)) {
        continue
      }

      defender.addState(state, { battle: context.battle })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected canInflictState(_context: ActionContext, _defender: Player | Enemy, _state: State): boolean {
    return true
  }
}
