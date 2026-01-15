import { defineStore } from 'pinia'
import { CardRepository } from '@/domain/repository/CardRepository'
import { buildDefaultDeck, buildMagicDeck } from '@/domain/entities/decks'
import { listRelicClassNames } from '@/domain/entities/relics/relicLibrary'
import { MemorySaintRelic } from '@/domain/entities/relics/MemorySaintRelic'
import { DevilsKissRelic } from '@/domain/entities/relics/DevilsKissRelic'
import { HolyProtectionRelic } from '@/domain/entities/relics/HolyProtectionRelic'
import { useAchievementProgressStore } from '@/stores/achievementProgressStore'
import { createCardFromBlueprint, buildBlueprintFromCard, type CardBlueprint } from '@/domain/library/Library'
import { Card } from '@/domain/entities/Card'
import { deleteSlot, listSlots, loadSlot, saveSlot, type PlayerSaveData, type SaveSlotSummary } from '@/utils/saveStorage'

// store外からデッキ型を参照できるように明示的に再エクスポートする
export type { CardId, CardBlueprint } from '@/domain/library/Library'
export type DeckPreset = 'holy' | 'magic'

// デッキプリセットごとの初期所持レリックを明示しておく。プリセット切替時に不要なレリックが残らないようにする。
const INITIAL_RELICS_BY_PRESET: Record<DeckPreset, string[]> = {
  holy: [MemorySaintRelic.name, HolyProtectionRelic.name],
  magic: [DevilsKissRelic.name],
}
const DEFAULT_RELIC_LIMIT = 3

export const usePlayerStore = defineStore('player', {
  state: () => ({
    hp: 150,
    maxHp: 150,
    gold: 0,
    deck: [] as CardBlueprint[],
    relics: [] as string[],
    relicLimit: DEFAULT_RELIC_LIMIT,
    initialized: false,
    initialDeckPreset: 'holy' as DeckPreset,
  }),
  getters: {
    relicCount: (state) => state.relics.length,
    relicLimitReached: (state) => state.relics.length >= state.relicLimit,
    relicSlotsRemaining: (state) => Math.max(0, state.relicLimit - state.relics.length),
  },
  actions: {
    ensureInitialized(): void {
      if (!this.initialized) {
        this.resetDeckToPreset(this.initialDeckPreset)
      }
    },
    resetDeckToDefault(): void {
      this.resetDeckToPreset('holy')
    },
    resetDeckToPreset(preset: DeckPreset): void {
      const repository = new CardRepository()
      const { deck } =
        preset === 'magic' ? buildMagicDeck(repository) : buildDefaultDeck(repository)
      this.deck = deck.map((card) => cardToBlueprint(card))
      this.gold = 0
      // 設計上の決定: デッキ初期化時はレリック上限も初期値へ戻す。
      this.relicLimit = DEFAULT_RELIC_LIMIT
      // プリセットに応じて初期レリックを切り替える。プリセットごとの特徴を維持するためここで毎回初期化する。
      this.relics = [...INITIAL_RELICS_BY_PRESET[preset]]
      // レリック数達成系の進行度を更新する。
      useAchievementProgressStore().recordRelicOwnedCount(this.relics.length)
      this.initialDeckPreset = preset
      this.initialized = true
    },
    setDeckPreset(preset: DeckPreset): void {
      this.resetDeckToPreset(preset)
    },
    setDeck(blueprints: CardBlueprint[]): void {
      this.deck = [...blueprints]
      this.initialized = true
    },
    buildDeck(cardRepository: CardRepository): Card[] {
      this.ensureInitialized()
      const cards = this.deck.map((blueprint) => createCardFromBlueprint(blueprint, cardRepository))
      // 状態異常カードは山札の先頭に集め、各グループ内でシャッフルする
      // const statusCards = cards.filter((card) => card.type === 'status')
      // const otherCards = cards.filter((card) => card.type !== 'status')
      // const ordered = [...shuffle(statusCards), ...shuffle(otherCards)]
      return shuffle(cards)
    },
    addCard(blueprint: CardBlueprint): void {
      this.ensureInitialized()
      this.deck = [...this.deck, { ...blueprint }]
      this.initialized = true
    },
    removeCardAt(index: number): void {
      this.ensureInitialized()
      if (index < 0 || index >= this.deck.length) {
        return
      }
      this.deck = this.deck.filter((_, i) => i !== index)
    },
    duplicateCardAt(index: number): void {
      this.ensureInitialized()
      const target = this.deck[index]
      if (!target) {
        return
      }
      const cloned = { ...target }
      const next = [...this.deck]
      next.splice(index + 1, 0, cloned)
      this.deck = next
    },
    updateAttackOverride(index: number, overrides: { amount?: number; count?: number }): void {
      this.ensureInitialized()
      const target = this.deck[index]
      if (!target) {
        return
      }
      const next = [...this.deck]
      next[index] = {
        ...target,
        overrideAmount: overrides.amount ?? target.overrideAmount,
        overrideCount: overrides.count ?? target.overrideCount,
      }
      this.deck = next
    },
    addGold(amount: number): void {
      const gain = Math.max(0, Math.floor(amount))
      if (gain <= 0) {
        return
      }
      this.gold += gain
    },
    spendGold(amount: number): void {
      const cost = Math.max(0, Math.floor(amount))
      if (cost <= 0) {
        return
      }
      this.gold = Math.max(0, this.gold - cost)
    },
    setGold(amount: number): void {
      this.gold = Math.max(0, Math.floor(amount))
    },
    setHp(amount: number): void {
      this.ensureInitialized()
      const next = Math.floor(amount)
      const clamped = Math.min(this.maxHp, Math.max(0, next))
      this.hp = clamped
    },
    setMaxHp(amount: number): void {
      this.ensureInitialized()
      const next = Math.max(1, Math.floor(amount))
      this.maxHp = next
      // 最大HPを下げた場合でも、現在HPが超過しないように丸める
      if (this.hp > next) {
        this.hp = next
      }
    },
    healHp(amount: number): void {
      const heal = Math.max(0, Math.floor(amount))
      if (heal <= 0) {
        return
      }
      this.hp = Math.min(this.maxHp, this.hp + heal)
    },
    setRelics(classNames: string[]): void {
      this.relics = [...classNames]
      // レリック数達成系の進行度を更新する。
      useAchievementProgressStore().recordRelicOwnedCount(this.relics.length)
      this.initialized = true
    },
    setRelicLimit(limit: number): void {
      // レリック上限は最低1に丸め、0以下で無効化しないようにする。
      this.relicLimit = Math.max(1, Math.floor(limit))
    },
    addRelic(className: string): { success: boolean; message: string } {
      const known = listRelicClassNames()
      if (known.length > 0 && !known.includes(className)) {
        return { success: false, message: '不明なレリックです' }
      }
      if (this.relics.includes(className)) {
        return { success: false, message: 'このレリックはすでに所持しています' }
      }
      // 設計上の決定: 所持上限に到達している場合は獲得処理を行わない。
      if (this.relics.length >= this.relicLimit) {
        return { success: false, message: 'レリック上限に達しています' }
      }
      this.relics = [...this.relics, className]
      useAchievementProgressStore().recordRelicOwnedCount(this.relics.length)
      return { success: true, message: 'レリックを獲得しました' }
    },
    removeRelic(className: string): void {
      this.relics = this.relics.filter((name) => name !== className)
    },
    saveCurrentToSlot(slotId: string): { success: boolean; message: string } {
      this.ensureInitialized()
      const payload: PlayerSaveData = {
        version: 'v1',
        savedAt: Date.now(),
        hp: this.hp,
        maxHp: this.maxHp,
        gold: this.gold,
        deck: this.deck.map((b) => ({ ...b })),
        relics: [...this.relics],
        relicLimit: this.relicLimit,
      }
      return saveSlot(slotId, payload)
    },
    loadFromSlot(slotId: string): { success: boolean; message: string } {
      const data = loadSlot(slotId)
      if (!data) {
        return { success: false, message: 'セーブデータの読み込みに失敗しました' }
      }
      // 保存されている値で上書きする
      this.hp = data.hp
      this.maxHp = data.maxHp
      // HPが最大値を超えないように念のため丸める
      if (this.hp > this.maxHp) {
        this.hp = this.maxHp
      }
      this.gold = data.gold
      this.deck = data.deck.map((b) => ({ ...b }))
      this.relics = [...data.relics]
      this.relicLimit = data.relicLimit
      useAchievementProgressStore().recordRelicOwnedCount(this.relics.length)
      this.initialized = true
      return { success: true, message: 'セーブデータを読み込みました' }
    },
    listSaveSlots(): SaveSlotSummary[] {
      return listSlots()
    },
    deleteSaveSlot(slotId: string): void {
      deleteSlot(slotId)
    },
  },
})

function cardToBlueprint(card: Card): CardBlueprint {
  return buildBlueprintFromCard(card)
}

function shuffle<T>(items: T[]): T[] {
  const copied = [...items]
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copied[i], copied[j]] = [copied[j]!, copied[i]!]
  }
  return copied
}
