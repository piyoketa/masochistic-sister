/*
Library.ts の責務:
- `Action` / `State` 定義群からビューで使いやすい `CardInfo` を生成し、実験ページやカード図鑑 UI が直接利用できるデータを提供する。
- Model 層の制約に縛られず、軽量にカード候補を列挙・整形する Stateless なアクセスレイヤーとして振る舞う。

責務ではないこと:
- Battle や OperationRunner など状態を持つ Model の生成・保持。戦闘進行やログ管理に干渉しない。
- カード報酬の選定やゲームバランス調整などドメインロジックの決定。あくまで既存定義の読み出しに限定する。

主な通信相手とインターフェース:
- `entities/actions` / `entities/states` モジュール: 既存クラスを列挙し、無引数コンストラクタとしてインスタンス化する。
- `Card` クラス: Action/State からカード定義・タグ・説明文を解決し、`CardInfo` へ写像する。
- `ActionCardLabView` など View: `listActionCards(limitPerType)` を呼び出し、UI 向けの `CardInfo[]` を受け取る。View モデルを経由せずに直接呼べる唯一の例外オブジェクト。
*/
import { Card } from '@/domain/entities/Card'
import type { CardInfo, CardType } from '@/types/battle'
import type { Action } from '@/domain/entities/Action'
import { Attack } from '@/domain/entities/Action'
import { State } from '@/domain/entities/State'
import type { State as StateType } from '@/domain/entities/State'
import * as actionModules from '@/domain/entities/actions'
import * as stateModules from '@/domain/entities/states'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'
import { createStateActionFromState } from '@/domain/entities/Card'
import { Damages } from '@/domain/entities/Damages'
import { getRelicInfo, type RelicInfo } from '@/domain/entities/relics/relicLibrary'
import { StateAction } from '../entities/Action/StateAction'
// storeから切り出したデッキカード識別子
export type BaseDeckCardType =
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
  | 'flashback'

export type StateDeckCardType = `state-${string}`

export type DeckCardType = BaseDeckCardType | StateDeckCardType

export interface DeckCardBlueprint {
  type: DeckCardType
  overrideAmount?: number
  overrideCount?: number
}
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
import { FlashbackAction } from '@/domain/entities/actions/FlashbackAction'

type ActionConstructor = new () => Action
type StateConstructor = new () => StateType

// デッキカードの一覧定義をLibraryへ集約し、storeやオーバーレイ等が参照できるようにする。
const baseCardFactories: Record<BaseDeckCardType, () => Card> = {
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
  flashback: () => new Card({ action: new FlashbackAction() }),
}

const stateCardFactories: Record<StateDeckCardType, () => Card> = buildStateCardFactories()

const cardFactories: Record<DeckCardType, () => Card> = {
  ...baseCardFactories,
  ...stateCardFactories,
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
  [FlashbackAction, 'flashback'],
])

export function createCardFromBlueprint(blueprint: DeckCardBlueprint, repository?: { create: (factory: () => Card) => Card }): Card {
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
      // ここでダメージオーバーライドを複製して適用する
      const clonedAction = action.cloneWithDamages(
        new Damages({ baseAmount: amount, baseCount: count, type: base.type }),
      )
      return repository ? repository.create(() => new Card({ action: clonedAction })) : new Card({ action: clonedAction })
    }
  }
  return repository ? repository.create(() => baseCard) : baseCard
}

export function buildCardInfoFromBlueprint(blueprint: DeckCardBlueprint, idPrefix = 'deck'): CardInfo | null {
  const card = createCardFromBlueprint(blueprint)
  return buildCardInfoFromCard(card, {
    id: `${idPrefix}-${card.id ?? blueprint.type}`,
    affordable: true,
    disabled: false,
  })
}

export function mapActionToDeckCardType(action: Action): DeckCardType | null {
  if (action instanceof StateAction) {
    const stateId = action.state?.id
    if (stateId) {
      return `state-${stateId}` as StateDeckCardType
    }
  }
  const key = actionConstructorMap.get(action.constructor as Function)
  return key ?? null
}

export function getRelicInfoByClassName(className: string): RelicInfo | null {
  return getRelicInfo(className)
}

export class Library {
  private cachedCards: CardInfo[] | null = null

  /**
   * Action / State 一覧を表示用カードデータへ整形して返す。
   * `limitPerType` を指定するとカードタイプごとに最大表示数を制御できる。
   */
  listActionCards(limitPerType = 3): CardInfo[] {
    if (this.cachedCards) {
      return this.sliceByType(this.cachedCards, limitPerType)
    }

    const actions = this.instantiateActions()
    const states = this.instantiateStates()
    const actionCards = actions
      .map((action, index) => this.buildActionCardInfo(action, index))
      .filter((info): info is CardInfo => info !== null)
    const stateCards = states
      .map((state, index) => this.buildStateCardInfo(state, index))
      .filter((info): info is CardInfo => info !== null)
    const cardInfos = [...actionCards, ...stateCards]
    this.cachedCards = cardInfos
    return this.sliceByType(cardInfos, limitPerType)
  }

  private sliceByType(cards: CardInfo[], limitPerType: number): CardInfo[] {
    if (limitPerType <= 0) {
      return []
    }
    const buckets: Record<CardType, CardInfo[]> = {
      attack: [],
      skill: [],
      status: [],
      skip: [],
    }

    for (const card of cards) {
      const bucket = buckets[card.type]
      if (bucket.length >= limitPerType) {
        continue
      }
      bucket.push(card)
    }

    return [...buckets.skill, ...buckets.attack, ...buckets.status, ...buckets.skip]
  }

  private instantiateActions(): Action[] {
    const actions: Action[] = []
    for (const candidate of Object.values(actionModules)) {
      const action = this.instantiateAction(candidate)
      if (action) {
        actions.push(action)
      }
    }
    return actions
  }

  private instantiateStates(): StateType[] {
    const states: StateType[] = []
    for (const candidate of Object.values(stateModules)) {
      const state = this.instantiateState(candidate)
      if (state) {
        states.push(state)
      }
    }
    return states
  }

  private instantiateAction(candidate: unknown): Action | null {
    if (typeof candidate !== 'function') {
      return null
    }
    try {
      // eslint-disable-next-line new-cap
      const action = new (candidate as ActionConstructor)()
      if (action instanceof Attack || this.isActionInstance(action)) {
        return action
      }
    } catch {
      // 実験用 Library なので、失敗したコンストラクタは無視して続行する。
    }
    return null
  }

  private instantiateState(candidate: unknown): StateType | null {
    if (typeof candidate !== 'function') {
      return null
    }
    try {
      // eslint-disable-next-line new-cap
      const state = new (candidate as StateConstructor)()
      if (state instanceof State && state.cardDefinitionBase) {
        return state
      }
    } catch {
      // 実験用 Library のため、失敗した State もスキップして続行する。
    }
    return null
  }

  private isActionInstance(candidate: unknown): candidate is Action {
    if (!candidate || typeof candidate !== 'object') {
      return false
    }
    return 'describe' in candidate && 'createCardDefinition' in candidate
  }

  private buildActionCardInfo(action: Action, index: number): CardInfo | null {
    const card = new Card({ action })
    const identifier = `library-action-${action.constructor.name}-${index}`
    return this.buildCardInfo(card, identifier)
  }

  private buildStateCardInfo(state: StateType, index: number): CardInfo | null {
    try {
      const stateAction = createStateActionFromState(state)
      const card = new Card({ action: stateAction })
      const identifier = `library-state-${state.constructor.name}-${index}`
      return this.buildCardInfo(card, identifier)
    } catch {
      return null
    }
  }

  private buildCardInfo(card: Card, identifier: string): CardInfo | null {
    return buildCardInfoFromCard(card, { id: identifier })
  }
}

function buildStateCardFactories(): Record<StateDeckCardType, () => Card> {
  const factories: Record<StateDeckCardType, () => Card> = {}
  for (const candidate of Object.values(stateModules)) {
    const state = instantiateStateForFactory(candidate)
    if (!state) {
      continue
    }
    const deckType = `state-${state.id}` as StateDeckCardType
    factories[deckType] = () => {
      const instance = instantiateStateForFactory(candidate)
      if (!instance) {
        throw new Error(`Stateカード生成に失敗しました: ${deckType}`)
      }
      const action = createStateActionFromState(instance)
      return new Card({ action })
    }
  }
  return factories
}

function instantiateStateForFactory(candidate: unknown): StateType | null {
  if (typeof candidate !== 'function') {
    return null
  }
  try {
    // eslint-disable-next-line new-cap
    const state = new (candidate as StateConstructor)()
    if (state instanceof State && state.cardDefinitionBase) {
      return state
    }
  } catch {
    // 無引数で生成できない状態はスキップ
  }
  return null
}
