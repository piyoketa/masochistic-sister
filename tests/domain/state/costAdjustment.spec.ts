import { describe, it, expect } from 'vitest'
import { Card } from '@/domain/entities/Card'
import { HeavenChainAction } from '@/domain/entities/actions/HeavenChainAction'
import { EvilThoughtState } from '@/domain/entities/states/EvilThoughtState'
import { IntoxicationState } from '@/domain/entities/states/IntoxicationState'
import { SacredCardTag, MemoryCardTag } from '@/domain/entities/cardTags'
import type { Player } from '@/domain/entities/Player'

/**
 * 状態異常によるコスト補正の単体テスト。
 * - 邪念: 神聖タグのカードコスト+1
 * - 酩酊: 記憶タグのカードコスト+N
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

  it('酩酊を持っていると記憶タグ付きカードのコストが加算される', () => {
    const card = new Card({ action: new HeavenChainAction() })
    const playerMock = {
      getStates: () => [new IntoxicationState(2)],
    } as unknown as Player

    const cost = card.calculateCost({
      source: playerMock,
      cardTags: [new MemoryCardTag(), new SacredCardTag()],
    })

    expect(cost).toBe(3) // 基本1 + 酩酊(2)
  })

  it('邪念と酩酊の両方を持つ場合は加算が積み上がる', () => {
    const card = new Card({ action: new HeavenChainAction() })
    const playerMock = {
      getStates: () => [new EvilThoughtState(1), new IntoxicationState(3)],
    } as unknown as Player

    const cost = card.calculateCost({
      source: playerMock,
      cardTags: [new MemoryCardTag(), new SacredCardTag()],
    })

    expect(cost).toBe(5) // 基本1 + 邪念1 + 酩酊3
  })
})
