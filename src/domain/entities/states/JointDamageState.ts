import { BadState } from '../State'
import { StateAction } from '../Action/StateAction'
import type { CardTag } from '../CardTag'
import type { DamageCalculationParams } from '../Damages'
import { StatusTypeCardTag } from '../cardTags'

class JointDamageStateAction extends StateAction {
  constructor(state: JointDamageState, tags?: CardTag[]) {
    super({
      name: state.name,
      cardDefinition: state.createCardDefinition(),
      tags,
      stateId: state.id,
      sourceState: state,
    })
  }
}

// 関節損傷: 「殴打（TackleAction）」の被ダメージをスタックごとに+1する
export class JointDamageState extends BadState {
  constructor(magnitude = 1) {
    super({
      id: 'state-joint-damage',
      name: '関節損傷',
      stackable: true,
      magnitude,
      cardDefinition: {
        title: '関節損傷',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override get priority(): number {
    // 「殴打」への固定加算を加算系（優先度10）と同タイミングで扱う
    return 10
  }

  override description(): string {
    const bonus = this.magnitude ?? 0
    return `殴打による被ダメージ+<magnitude>${bonus}</magnitude>\n（累積可）`
  }

  override affectsDefender(): boolean {
    return true
  }

  override isPreHitModifier(): boolean {
    return true
  }

  override modifyPreHit(params: DamageCalculationParams): DamageCalculationParams {
    if (params.role !== 'defender') return params
    if (params.cardId !== 'tackle') {
      return params
    }
    const bonus = this.magnitude ?? 0
    return {
      ...params,
      // 1ヒットあたりに固定値を加算する（countが変動しても1回ごとに加算）
      amount: Math.max(0, params.amount + bonus),
    }
  }

  override action(tags?: CardTag[]): StateAction {
    return new JointDamageStateAction(this, tags)
  }
}
