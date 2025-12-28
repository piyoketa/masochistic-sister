import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '@/stores/playerStore'
import { CardRepository } from '@/domain/repository/CardRepository'
import { MemorySaintRelic } from '@/domain/entities/relics/MemorySaintRelic'
import { DevilsKissRelic } from '@/domain/entities/relics/DevilsKissRelic'

describe('playerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('初期化時にデフォルトデッキを構築する', () => {
    const store = usePlayerStore()
    store.ensureInitialized()
    expect(store.deck.length).toBeGreaterThan(0)
  })

  it('所持デッキのコピーを生成し、プレイヤーHP情報を保持する', () => {
    const store = usePlayerStore()
    store.ensureInitialized()
    const repository = new CardRepository()
    const cards = store.buildDeck(repository)
    expect(cards).toHaveLength(store.deck.length)
    expect(store.hp).toBe(150)
  })

  it('セーブデータにHP/最大HP/所持金/レリック/デッキを含めて保存・ロードできる', () => {
    const store = usePlayerStore()
    store.ensureInitialized()
    // 保存対象の状態を明示的に作る。最大HP→現在HPの順で設定し、丸めロジックの影響を避ける。
    store.setMaxHp(180)
    store.setHp(120)
    store.setGold(345)
    const customizedDeck = store.deck.slice(0, 2).map((blueprint, index) => ({
      ...blueprint,
      overrideAmount: (blueprint.overrideAmount ?? 5) + index,
      overrideCount: (blueprint.overrideCount ?? 1) + index,
    }))
    store.setDeck(customizedDeck)
    store.setRelics([MemorySaintRelic.name, DevilsKissRelic.name])

    const saveResult = store.saveCurrentToSlot('slot-1')
    expect(saveResult.success).toBe(true)

    // 異なる値に書き換えた後、ロードで上書きされることを確認する
    store.setMaxHp(50)
    store.setHp(10)
    store.setGold(1)
    store.setDeck(store.deck.slice(0, 1))
    store.setRelics([])

    const loadResult = store.loadFromSlot('slot-1')
    expect(loadResult.success).toBe(true)
    expect(store.maxHp).toBe(180)
    expect(store.hp).toBe(120)
    expect(store.gold).toBe(345)
    expect(store.deck).toEqual(customizedDeck)
    expect(store.relics).toEqual([MemorySaintRelic.name, DevilsKissRelic.name])
  })
})
