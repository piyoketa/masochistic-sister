import { describe, it, expect } from 'vitest'
import { Damages } from '@/domain/entities/Damages'
import { JointDamageState } from '@/domain/entities/states/JointDamageState'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'
import { JointLockAction } from '@/domain/entities/actions/JointLockAction'

describe('関節損傷', () => {
  it('打撃カテゴリの殴打で被ダメージがスタックごとに+1される（20点で+20）', () => {
    const tackle = new TackleAction()
    const state = new JointDamageState(20) // 20スタック=+20
    const damages = new Damages({
      baseAmount: 20,
      baseCount: 1,
      type: 'single',
      cardId: tackle.getCardId(),
      defenderStates: [state],
      context: {
        attack: tackle,
      },
    })

    expect(damages.amount).toBe(40) // 20 + 20
  })

  it('叩き潰すなど他の打撃カテゴリ攻撃でも加算される', () => {
    const jointLock = new JointLockAction()
    const state = new JointDamageState(5)
    const damages = new Damages({
      baseAmount: 10,
      baseCount: 1,
      type: 'single',
      cardId: jointLock.getCardId(),
      defenderStates: [state],
      context: {
        attack: jointLock,
      },
    })

    expect(damages.amount).toBe(15)
  })

  it('打撃カテゴリを持たない攻撃では効果がない', () => {
    const state = new JointDamageState(3)
    const flurry = new FlurryAction()
    const damages = new Damages({
      baseAmount: 12,
      baseCount: 2,
      type: 'multi',
      cardId: flurry.getCardId(),
      defenderStates: [state],
      context: {
        attack: flurry,
      },
    })

    expect(damages.amount).toBe(12)
    expect(damages.count).toBe(2)
  })
})
