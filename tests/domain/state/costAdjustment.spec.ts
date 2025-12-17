import { describe, it, expect } from 'vitest'
import { Card } from '@/domain/entities/Card'
import { HeavenChainAction } from '@/domain/entities/actions/HeavenChainAction'
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'
import { EvilThoughtState } from '@/domain/entities/states/EvilThoughtState'
import { IntoxicationState } from '@/domain/entities/states/IntoxicationState'
import type { Player } from '@/domain/entities/Player'

/**
 * 状態異常によるコスト補正の単体テスト。
 * - 邪念: 神聖タグのカードコスト+1
 * - 酩酊: アタックカードコスト+N
 */
describe('状態異常によるコスト補正', () => {
  it('邪念を持っていると神聖カードのコストが+1される', () => {
    const card = new Card({ action: new HeavenChainAction() })
    const playerMock = {
      getStates: () => [new EvilThoughtState(1)],
    } as unknown as Player

    const cost = card.calculateCost({
      source: playerMock,
      cardTags: card.cardTags,
    })

    expect(cost).toBe(2)
  })

  it('酩酊を持っているとアタックカードのコストが加算される', () => {
    const card = new Card({ action: new FlurryAction() })
    const playerMock = {
      getStates: () => [new IntoxicationState(1)],
    } as unknown as Player

    const cost = card.calculateCost({
      source: playerMock,
      cardTags: card.cardTags,
    })

    expect(cost).toBe(2) // 基本1 + 酩酊(2)
  })
})
