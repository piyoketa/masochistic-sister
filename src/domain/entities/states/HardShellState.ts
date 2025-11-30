import { TraitState } from '../State'
import type { DamageCalculationParams } from '../Damages'

export class HardShellState extends TraitState {
  constructor(magnitude = 20) {
    super({
      id: 'state-hard-shell',
      name: '硬い殻',
      magnitude,
    })
  }

  override description(): string {
    const reduction = this.magnitude ?? 0
    return `被ダメージ-${reduction}`
  }

  override get priority(): number {
    return 20
  }

  override affectsDefender(): boolean {
    return true
  }

  override isPreHitModifier(): boolean {
    return true
  }

  override modifyPreHit(params: DamageCalculationParams): DamageCalculationParams {
    if (params.role !== 'defender') {
      return params
    }

    const reduction = this.magnitude ?? 0
    return {
      ...params,
      amount: params.amount - reduction,
    }
  }
}
