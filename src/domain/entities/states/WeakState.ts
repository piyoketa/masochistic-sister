import { BadState } from '../State'
import { StateAction } from '../Action/StateAction'
import type { CardTag } from '../CardTag'
import type { DamageCalculationParams } from '../Damages'
import { StatusTypeCardTag } from '../cardTags'

class WeakStateAction extends StateAction {
  constructor(state: WeakState, tags?: CardTag[]) {
    super({
      name: state.name,
      cardDefinition: state.createCardDefinition(),
      tags,
      stateId: state.id,
      sourceState: state,
    })
  }
}

// 弱気: 攻撃側にかかる乗算デバフ（ダメージを割合減少）
export class WeakState extends BadState {
  constructor() {
    super({
      id: 'state-weak',
      name: '弱気',
      cardDefinition: {
        title: '弱気',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override get priority(): number {
    return 15
  }

  override description(): string {
    return `与ダメージが2/3になる\n（累積しない）`
  }

  override affectsAttacker(): boolean {
    return true
  }

  override isPreHitModifier(): boolean {
    return true
  }

  override modifyPreHit(params: DamageCalculationParams): DamageCalculationParams {
    if (params.role !== 'attacker') return params
    const rate = 2 / 3
    return {
      ...params,
      amount: Math.max(0, Math.floor(params.amount * rate)),
    }
  }

  override action(tags?: CardTag[]): StateAction {
    return new WeakStateAction(this, tags)
  }
}
