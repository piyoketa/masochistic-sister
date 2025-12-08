import { describe, it, expect } from 'vitest'
import { Damages } from '@/domain/entities/Damages'
import { JointDamageState } from '@/domain/entities/states/JointDamageState'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'

describe('関節損傷', () => {
  it('殴打で被ダメージがスタックごとに+20される', () => {
    const state = new JointDamageState(2) // 2スタック=+40
    const damages = new Damages({
      baseAmount: 20,
      baseCount: 1,
      type: 'single',
      defenderStates: [state],
      context: {
        attack: new TackleAction(),
      },
    })

    expect(damages.amount).toBe(60) // 20 + 40
  })

  it('殴打以外では効果がない', () => {
    const state = new JointDamageState(3)
    const damages = new Damages({
      baseAmount: 12,
      baseCount: 2,
      type: 'multi',
      defenderStates: [state],
      context: {
        attack: new FlurryAction(),
      },
    })

    expect(damages.amount).toBe(12)
    expect(damages.count).toBe(2)
  })
})
