import { describe, it, expect } from 'vitest'
import { Library, createCardFromBlueprint, buildCardInfoFromBlueprint, mapActionToCardId } from '@/domain/library/Library'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'

describe('Library', () => {
  it('blueprintからカードを生成し、オーバーライドを反映する', () => {
    const card = createCardFromBlueprint({ type: 'tackle', overrideAmount: 40, overrideCount: 2 })
    expect(card.title).toBe('殴打')
    const action = card.action
    if (!action || !('baseDamages' in action)) {
      throw new Error('Attack expected')
    }
    expect((action as { baseDamages: { baseAmount: number; baseCount: number } }).baseDamages.baseAmount).toBe(40)
    expect((action as { baseDamages: { baseAmount: number; baseCount: number } }).baseDamages.baseCount).toBe(2)
  })

  it('blueprintからCardInfoを構築できる', () => {
    const info = buildCardInfoFromBlueprint({ type: 'flurry', overrideAmount: 8, overrideCount: 3 }, 'test')
    if (!info || info.type !== 'attack' || info.attackStyle !== 'multi') {
      throw new Error('攻撃カード情報の生成に失敗しました')
    }
    expect(info?.id).toContain('test')
    expect(info?.title).toBe('突き刺す')
    expect(info.damageAmount).toBe(8)
    expect(info.damageCount).toBe(3)
  })

  it('ActionをCardIdにマッピングできる', () => {
    expect(mapActionToCardId(new TackleAction())).toBe('tackle')
    expect(mapActionToCardId(new FlurryAction())).toBe('flurry')
  })

  it('listActionCardsがCardInfoを返す', () => {
    const library = new Library()
    const cards = library.listActionCards(1)
    expect(Array.isArray(cards)).toBe(true)
    expect(cards.length).toBeGreaterThan(0)
  })

  it('スタック型の状態異常カードはタイトルにスタック値を含める', () => {
    const info = buildCardInfoFromBlueprint({ type: 'state-corrosion' }, 'status')
    if (!info || info.type !== 'status') {
      throw new Error('状態異常カードの生成に失敗しました')
    }
    expect(info.title).toBe('腐食(1点)')
  })

  it('Blueprint経由でもスタック型状態異常カードのタイトルに点数が付く', () => {
    const info = buildCardInfoFromBlueprint({ type: 'state-sticky' }, 'status')
    if (!info || info.type !== 'status') {
      throw new Error('状態異常カードの生成に失敗しました')
    }
    expect(info.title).toBe('粘液(1点)')
  })
})
