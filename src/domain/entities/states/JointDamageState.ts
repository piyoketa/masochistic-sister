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

// 関節損傷: 一回攻撃の被ダメージを割合増加
export class JointDamageState extends BadState {
  constructor(magnitude = 1) {
    super({
      id: 'state-joint-damage',
      name: '関節損傷',
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
    return 25
  }

  override description(): string {
    const percent = Math.floor((this.magnitude ?? 0) * 100)
    return `一回攻撃の被ダメージ+${percent}%`
  }

  override affectsDefender(): boolean {
    return true
  }

  override isPreHitModifier(): boolean {
    return true
  }

  override modifyPreHit(params: DamageCalculationParams): DamageCalculationParams {
    if (params.role !== 'defender') return params
    if (params.type !== 'single') return params
    const rate = 1 + (this.magnitude ?? 0)
    return {
      ...params,
      amount: Math.max(0, Math.floor(params.amount * rate)),
    }
  }

  override action(tags?: CardTag[]): StateAction {
    return new JointDamageStateAction(this, tags)
  }
}
