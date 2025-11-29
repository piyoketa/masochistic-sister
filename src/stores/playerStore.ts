import { defineStore } from 'pinia'
import { Card } from '@/domain/entities/Card'
import { CardRepository } from '@/domain/repository/CardRepository'
import { buildDefaultDeck } from '@/domain/entities/decks'
import { HeavenChainAction } from '@/domain/entities/actions/HeavenChainAction'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { MasochisticAuraAction } from '@/domain/entities/actions/MasochisticAuraAction'
import { ScarRegenerationAction } from '@/domain/entities/actions/ScarRegenerationAction'
import { ReloadAction } from '@/domain/entities/actions/ReloadAction'
import { NonViolencePrayerAction } from '@/domain/entities/actions/NonViolencePrayerAction'
import { LifeDrainSkillAction } from '@/domain/entities/actions/LifeDrainSkillAction'
import { DailyRoutineAction } from '@/domain/entities/actions/DailyRoutineAction'
import { PredicamentAction } from '@/domain/entities/actions/PredicamentAction'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'
import { MucusShotAction } from '@/domain/entities/actions/MucusShotAction'
import { AcidSpitAction } from '@/domain/entities/actions/AcidSpitAction'
import { PoisonStingAction } from '@/domain/entities/actions/PoisonStingAction'
import { BloodSuckAction } from '@/domain/entities/actions/BloodSuckAction'
import { Damages } from '@/domain/entities/Damages'
import { Attack, type Action } from '@/domain/entities/Action'
import { listRelicClassNames } from '@/domain/entities/relics/relicLibrary'

export type DeckCardType =
  | 'heaven-chain'
  | 'battle-prep'
  | 'masochistic-aura'
  | 'scar-regeneration'
  | 'reload'
  | 'non-violence-prayer'
  | 'life-drain-skill'
  | 'daily-routine'
  | 'predicament'
  | 'tackle'
  | 'flurry'
  | 'mucus-shot'
  | 'acid-spit'
  | 'poison-sting'
  | 'blood-suck'

export interface DeckCardBlueprint {
  type: DeckCardType
  overrideAmount?: number
  overrideCount?: number
}

interface DeckPreviewEntry {
  id: number
  title: string
  description: string
  type: DeckCardType
}

const DEFAULT_RELICS: string[] = ['MemorySaintRelic']

const cardFactories: Record<DeckCardType, () => Card> = {
  'heaven-chain': () => new Card({ action: new HeavenChainAction() }),
  'battle-prep': () => new Card({ action: new BattlePrepAction() }),
  'masochistic-aura': () => new Card({ action: new MasochisticAuraAction() }),
  'scar-regeneration': () => new Card({ action: new ScarRegenerationAction() }),
  reload: () => new Card({ action: new ReloadAction() }),
  'non-violence-prayer': () => new Card({ action: new NonViolencePrayerAction() }),
  'life-drain-skill': () => new Card({ action: new LifeDrainSkillAction() }),
  'daily-routine': () => new Card({ action: new DailyRoutineAction() }),
  predicament: () => new Card({ action: new PredicamentAction() }),
  tackle: () => new Card({ action: new TackleAction() }),
  flurry: () => new Card({ action: new FlurryAction() }),
  'mucus-shot': () => new Card({ action: new MucusShotAction() }),
  'acid-spit': () => new Card({ action: new AcidSpitAction() }),
  'poison-sting': () => new Card({ action: new PoisonStingAction() }),
  'blood-suck': () => new Card({ action: new BloodSuckAction() }),
}

const actionConstructorMap = new Map<Function, DeckCardType>([
  [HeavenChainAction, 'heaven-chain'],
  [BattlePrepAction, 'battle-prep'],
  [MasochisticAuraAction, 'masochistic-aura'],
  [ScarRegenerationAction, 'scar-regeneration'],
  [ReloadAction, 'reload'],
  [NonViolencePrayerAction, 'non-violence-prayer'],
  [LifeDrainSkillAction, 'life-drain-skill'],
  [DailyRoutineAction, 'daily-routine'],
  [PredicamentAction, 'predicament'],
  [TackleAction, 'tackle'],
  [FlurryAction, 'flurry'],
  [MucusShotAction, 'mucus-shot'],
  [AcidSpitAction, 'acid-spit'],
  [PoisonStingAction, 'poison-sting'],
  [BloodSuckAction, 'blood-suck'],
])

export function mapActionToDeckCardType(action: Action): DeckCardType | null {
  const key = actionConstructorMap.get(action.constructor as Function)
  return key ?? null
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    hp: 150,
    maxHp: 150,
    gold: 0,
    deck: [] as DeckCardBlueprint[],
    relics: [] as string[],
    initialized: false,
  }),
  actions: {
    ensureInitialized(): void {
      if (!this.initialized) {
        this.resetDeckToDefault()
      }
    },
    resetDeckToDefault(): void {
      const repository = new CardRepository()
      const { deck } = buildDefaultDeck(repository)
      this.deck = deck.map((card) => cardToBlueprint(card))
      this.gold = 0
      this.relics = [...DEFAULT_RELICS]
      this.initialized = true
    },
    setDeck(blueprints: DeckCardBlueprint[]): void {
      this.deck = [...blueprints]
      this.initialized = true
    },
    buildDeck(cardRepository: CardRepository): Card[] {
      this.ensureInitialized()
      const cards = this.deck.map((blueprint) => createCardFromBlueprint(cardRepository, blueprint))
      return shuffle(cards)
    },
    getDeckPreview(): DeckPreviewEntry[] {
      this.ensureInitialized()
      return this.deck.map((blueprint, index) => {
        const card = createStandaloneCard(blueprint)
        return {
          id: index,
          title: card.title,
          description: card.description,
          type: blueprint.type,
        }
      })
    },
    addCard(type: DeckCardType): void {
      this.ensureInitialized()
      this.deck = [...this.deck, { type }]
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
    healHp(amount: number): void {
      const heal = Math.max(0, Math.floor(amount))
      if (heal <= 0) {
        return
      }
      this.hp = Math.min(this.maxHp, this.hp + heal)
    },
    setRelics(classNames: string[]): void {
      this.relics = [...classNames]
      this.initialized = true
    },
    addRelic(className: string): void {
      const known = listRelicClassNames()
      if (known.length > 0 && !known.includes(className)) {
        return
      }
      if (this.relics.includes(className)) {
        return
      }
      this.relics = [...this.relics, className]
    },
    removeRelic(className: string): void {
      this.relics = this.relics.filter((name) => name !== className)
    },
  },
})

function cardToBlueprint(card: Card): DeckCardBlueprint {
  const action = card.action
  if (!action) {
    throw new Error('デッキのカードにアクションが設定されていません')
  }
  const key = mapActionToDeckCardType(action)
  if (!key) {
    throw new Error(`未対応のカードアクション "${action.constructor.name}" です`)
  }
  return { type: key }
}

function createCardFromBlueprint(
  repository: CardRepository,
  blueprint: DeckCardBlueprint,
): Card {
  const factory = cardFactories[blueprint.type]
  if (!factory) {
    throw new Error(`未対応のカード種別 "${blueprint.type}" です`)
  }
  const baseCard = factory()
  const action = baseCard.action
  if (action instanceof Attack) {
    const base = action.baseDamages
    const overrideAmount = blueprint.overrideAmount ?? base.baseAmount
    const overrideCount = blueprint.overrideCount ?? base.baseCount
    if (overrideAmount !== base.baseAmount || overrideCount !== base.baseCount) {
      const clonedAction = action.cloneWithDamages(
        new Damages({ baseAmount: overrideAmount, baseCount: overrideCount, type: base.type }),
      )
      return repository.create(() => new Card({ action: clonedAction }))
    }
  }
  return repository.create(() => baseCard)
}

function createStandaloneCard(blueprint: DeckCardBlueprint): Card {
  const factory = cardFactories[blueprint.type]
  if (!factory) {
    throw new Error(`未対応のカード種別 "${blueprint.type}" です`)
  }
  const baseCard = factory()
  const action = baseCard.action
  if (action instanceof Attack) {
    const base = action.baseDamages
    const amount = blueprint.overrideAmount ?? base.baseAmount
    const count = blueprint.overrideCount ?? base.baseCount
    if (amount !== base.baseAmount || count !== base.baseCount) {
      const clonedAction = action.cloneWithDamages(
        new Damages({ baseAmount: amount, baseCount: count, type: base.type }),
      )
      return new Card({ action: clonedAction })
    }
  }
  return baseCard
}

function shuffle<T>(items: T[]): T[] {
  const copied = [...items]
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copied[i], copied[j]] = [copied[j]!, copied[i]!]
  }
  return copied
}
