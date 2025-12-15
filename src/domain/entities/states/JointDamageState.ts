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

// 関節損傷: 「殴打（TackleAction）」の被ダメージをスタックごとに+20する
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
    // 「殴打」への固定加算を他の加減算系と同タイミングで扱うため、20に調整
    return 20
  }

  override description(): string {
    const bonus = 20 * (this.magnitude ?? 0)
    return `殴打による被ダメージ+${bonus}\n（累積可）`
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
    const bonus = 20 * (this.magnitude ?? 0)
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
