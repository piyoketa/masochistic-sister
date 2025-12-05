import { describe, it, expect } from 'vitest'
import { Library, createCardFromBlueprint, buildCardInfoFromBlueprint, mapActionToDeckCardType } from '@/domain/library/Library'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'

describe('Library', () => {
  it('blueprintからカードを生成し、オーバーライドを反映する', () => {
    const card = createCardFromBlueprint({ type: 'tackle', overrideAmount: 40, overrideCount: 2 })
    expect(card.title).toBe('たいあたり')
    const action = card.action
    if (!('baseDamages' in action)) {
      throw new Error('Attack expected')
    }
    expect((action as { baseDamages: { baseAmount: number; baseCount: number } }).baseDamages.baseAmount).toBe(40)
    expect((action as { baseDamages: { baseAmount: number; baseCount: number } }).baseDamages.baseCount).toBe(2)
  })

  it('blueprintからCardInfoを構築できる', () => {
    const info = buildCardInfoFromBlueprint({ type: 'flurry', overrideAmount: 8, overrideCount: 3 }, 'test')
    expect(info?.id).toContain('test')
    expect(info?.title).toBe('乱れ突き')
    expect(info?.damageAmount).toBe(8)
    expect(info?.damageCount).toBe(3)
  })

  it('ActionをDeckCardTypeにマッピングできる', () => {
    expect(mapActionToDeckCardType(new TackleAction())).toBe('tackle')
    expect(mapActionToDeckCardType(new FlurryAction())).toBe('flurry')
  })

  it('listActionCardsがCardInfoを返す', () => {
    const library = new Library()
    const cards = library.listActionCards(1)
    expect(Array.isArray(cards)).toBe(true)
    expect(cards.length).toBeGreaterThan(0)
  })
})
