/*
Skill.ts の責務:
- 行動種別「スキル」の共通クラスを提供し、`Action` 基底クラスに対して種別識別を追加する。
- スキル固有の追加ロジックは派生クラスに委ねつつ、最低限の構築手順だけを保証する。

責務ではないこと:
- コスト計算や効果適用など、個々のスキルごとのビジネスロジック。
- ビュー表示向けのタグ付けやアニメーション制御。

主要な通信相手とインターフェース:
- `ActionBase.ts` の `Action` クラス: 継承して `type` を `'skill'` に固定し、その他の機能はすべて親へ委譲する。
- `BaseActionProps`: 親クラスへ渡す初期化引数を流用し、スキル固有の追加プロパティは持たない（`SkillProps` は現在のところ `BaseActionProps` そのもの）。
*/
import type { ActionCutInCue, BaseActionProps } from './ActionBase'
import { Action } from './ActionBase'
import type { State } from '../State'
import { Player } from '../Player'
import type { Enemy } from '../Enemy'

// cutInCue は BaseActionProps に含まれるが、スキル文脈で明示しておく
export interface SkillProps extends BaseActionProps {
  cutInCue?: ActionCutInCue
  inflictStates?: Array<() => State>
}

export abstract class Skill extends Action {
  // 非列挙プロパティとして保持し、ActionLog などのシリアライズに混ざらないようにする
  protected readonly inflictStateFactories: Array<() => State>

  protected constructor(props: SkillProps) {
    super(props)
    const inflictFactories = props.inflictStates ? [...props.inflictStates] : []
    this.inflictStateFactories = inflictFactories
    Object.defineProperty(this, 'inflictStateFactories', {
      value: inflictFactories,
      enumerable: false,
      writable: false,
    })
  }

  get type(): 'skill' {
    return 'skill'
  }

  protected applyInflictedStates(context: { battle: import('../..//battle/Battle').Battle }, target: Enemy | Player): void {
    if (this.inflictStateFactories.length === 0) return
    for (const factory of this.inflictStateFactories) {
      const state = factory()
      target.addState(state, { battle: context.battle })
    }
  }

  get inflictStatePreviews(): State[] {
    return this.inflictStateFactories.map((factory) => factory())
  }

  protected override perform(context: import('./ActionBase').ActionContext): void {
    const target =
      context.target ??
      (context.source instanceof Player ? undefined : (context.battle.player as Player))
    if (!target) {
      context.metadata = { ...(context.metadata ?? {}), skipped: true, skipReason: 'no-target' }
      return
    }
    this.applyInflictedStates(context, target)
  }
}
