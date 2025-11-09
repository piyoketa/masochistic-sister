import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '@/stores/playerStore'
import { CardRepository } from '@/domain/repository/CardRepository'

describe('playerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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
})
