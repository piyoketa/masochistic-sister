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
// デッキに入るカード ID と Blueprint
export type ActionCardId = string
export type StateCardId = `state-${string}`
export type CardId = ActionCardId | StateCardId

export interface CardBlueprint {
  type: CardId
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
import { PeelingScabAction } from '@/domain/entities/actions/PeelingScabAction'
import { SoloBodyAction } from '@/domain/entities/actions/SoloBodyAction'
import { DeepBreathAction } from '@/domain/entities/actions/DeepBreathAction'
import { OpenWoundAction } from '@/domain/entities/actions/OpenWoundAction'
import { JointLockAction } from '@/domain/entities/actions/JointLockAction'
import { CorrosionState } from '@/domain/entities/states/CorrosionState'
import { EvilThoughtState } from '@/domain/entities/states/EvilThoughtState'
import { StackedStressAction } from '@/domain/entities/actions/StackedStressAction'
import { DeathMatchRelic, RepulsionRelic, LightweightCombatRelic, AdversityExcitementRelic } from '@/domain/entities/relics'

type ActionConstructor = new () => Action
type StateConstructor = new () => StateType
type CardRepositoryLike = { create: (factory: () => Card) => Card }

// デッキに入る Action クラスの一覧。ID はクラス名から kebab-case 化して決定する。
const DECK_ACTION_CLASSES: ActionConstructor[] = [
  HeavenChainAction,
  BattlePrepAction,
  MasochisticAuraAction,
  ReloadAction,
  NonViolencePrayerAction,
  LifeDrainSkillAction,
  DailyRoutineAction,
  PredicamentAction,
  TackleAction,
  FlurryAction,
  MucusShotAction,
  AcidSpitAction,
  PoisonStingAction,
  BloodSuckAction,
  FlashbackAction,
  PeelingScabAction,
  SoloBodyAction,
  DeepBreathAction,
  OpenWoundAction,
  JointLockAction,
  StackedStressAction,
]

const actionCardFactories: Record<ActionCardId, () => Card> = buildActionCardFactories(DECK_ACTION_CLASSES)
const stateCardFactories: Record<StateCardId, () => Card> = buildStateCardFactories()

const cardFactories: Record<CardId, () => Card> = {
  ...actionCardFactories,
  ...stateCardFactories,
}

// ショップで取り扱う標準ラインナップ（旧 CARD_CANDIDATES 相当）
const STANDARD_SHOP_ACTION_CLASSES: ActionConstructor[] = [
  BattlePrepAction,
  DailyRoutineAction,
  PredicamentAction,
  NonViolencePrayerAction,
  ReloadAction,
  LifeDrainSkillAction,
  FlashbackAction,
  SoloBodyAction,
  DeepBreathAction,
  OpenWoundAction,
  JointLockAction,
  StackedStressAction,
  PeelingScabAction,
]

// アタック支援カード（指定IDでピックする用途向け）
const ATTACK_SUPPORT_ACTION_CLASSES: ActionConstructor[] = [
  SoloBodyAction,
  OpenWoundAction,
  PeelingScabAction,
  LifeDrainSkillAction,
  JointLockAction,
]

// フィールド報酬スキルの候補（旧 SKILL_CARD_CANDIDATES 相当）
const STANDARD_SKILL_REWARD_CLASSES: ActionConstructor[] = [
  HeavenChainAction,
  BattlePrepAction,
  MasochisticAuraAction,
  ReloadAction,
  NonViolencePrayerAction,
  LifeDrainSkillAction,
  DailyRoutineAction,
  PredicamentAction,
  SoloBodyAction,
  DeepBreathAction,
  OpenWoundAction,
  StackedStressAction,
  PeelingScabAction,
]

// ラボやデモで見せるサンプルカードセット
const STANDARD_SAMPLE_ACTION_CLASSES: ActionConstructor[] = [
  HeavenChainAction,
  BattlePrepAction,
  MasochisticAuraAction,
  AcidSpitAction,
  BloodSuckAction,
  FlurryAction,
  TackleAction,
]

// 攻撃力支援レリック一覧
const ATTACK_SUPPORT_RELICS = [
  DeathMatchRelic,
  RepulsionRelic,
  LightweightCombatRelic,
  AdversityExcitementRelic,
]
const STANDARD_SAMPLE_STATE_CLASSES: StateConstructor[] = [CorrosionState, EvilThoughtState]

/**
 * CardId ごとのカードファクトリと Action 名をまとめた一覧を返す。
 * デッキ編集などで全カードを追加候補に出す際に利用する。
 */
export function listCardIdOptions(): Array<{ type: CardId; label: string }> {
  return Object.entries(cardFactories).map(([type, factory]) => {
    const card = factory()
    const label = card.action?.name ?? type
    return { type: type as CardId, label }
  })
}

export function createCardFromBlueprint(blueprint: CardBlueprint, repository?: CardRepositoryLike): Card {
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
        new Damages({ baseAmount: amount, baseCount: count, type: base.type, cardId: blueprint.type }),
      )
      return repository ? repository.create(() => new Card({ action: clonedAction })) : new Card({ action: clonedAction })
    }
  }
  return repository ? repository.create(() => baseCard) : baseCard
}

export function buildCardInfoFromBlueprint(blueprint: CardBlueprint, idPrefix = 'deck'): CardInfo | null {
  const card = createCardFromBlueprint(blueprint)
  return buildCardInfoFromCard(card, {
    id: `${idPrefix}-${card.id ?? blueprint.type}`,
    affordable: true,
    disabled: false,
  })
}

export function mapActionToCardId(action: Action): CardId | null {
  if (action instanceof StateAction) {
    const stateCardId = toStateCardIdFromId(action.state?.id)
    if (stateCardId) {
      return stateCardId
    }
  }
  const actionId = toActionCardId(action.constructor as ActionConstructor)
  return actionId && actionId in actionCardFactories ? actionId : null
}

export function buildBlueprintFromCard(card: Card): CardBlueprint {
  const action = card.action
  if (!action) {
    throw new Error('デッキのカードにアクションが設定されていません')
  }
  const blueprint = buildBlueprintFromAction(action)
  if (!blueprint) {
    throw new Error(`未対応のカードアクション "${action.constructor.name}" です`)
  }
  return blueprint
}

export function listStandardShopCardBlueprints(): CardBlueprint[] {
  return STANDARD_SHOP_ACTION_CLASSES.map(buildActionBlueprintFromCtor)
}

export function listStandardSkillRewardBlueprints(): CardBlueprint[] {
  return STANDARD_SKILL_REWARD_CLASSES.map(buildActionBlueprintFromCtor)
}

export function listAttackSupportRewardBlueprints(): CardBlueprint[] {
  return ATTACK_SUPPORT_ACTION_CLASSES.map(buildActionBlueprintFromCtor)
}

export function listStandardSampleCardBlueprints(): CardBlueprint[] {
  const actionBlueprints = STANDARD_SAMPLE_ACTION_CLASSES.map(buildActionBlueprintFromCtor)
  const stateBlueprints = STANDARD_SAMPLE_STATE_CLASSES.map(buildStateBlueprintFromCtor).filter(
    (entry): entry is CardBlueprint => entry !== null,
  )
  return [...actionBlueprints, ...stateBlueprints]
}

export function listAttackSupportRelicClassNames(): string[] {
  return ATTACK_SUPPORT_RELICS.map((ctor) => ctor.name)
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

export function buildCardInfosFromBlueprints(blueprints: CardBlueprint[], idPrefix = 'deck'): CardInfo[] {
  return blueprints
    .map((blueprint, index) => buildCardInfoFromBlueprint(blueprint, `${idPrefix}-${index}`))
    .filter((info): info is CardInfo => info !== null)
}

function buildActionBlueprintFromCtor(ctor: ActionConstructor): CardBlueprint {
  return { type: toActionCardId(ctor) }
}

function buildStateBlueprintFromCtor(ctor: StateConstructor): CardBlueprint | null {
  const state = instantiateStateForFactory(ctor)
  if (!state) {
    return null
  }
  const id = toStateCardId(state)
  return id ? { type: id } : null
}

function buildActionCardFactories(constructors: ActionConstructor[]): Record<ActionCardId, () => Card> {
  const entries: Array<[ActionCardId, () => Card]> = []
  for (const ctor of constructors) {
    const cardId = toActionCardId(ctor)
    entries.push([cardId, () => new Card({ action: new ctor() })])
  }
  return Object.fromEntries(entries)
}

function buildStateCardFactories(): Record<StateCardId, () => Card> {
  const factories: Record<StateCardId, () => Card> = {}
  for (const candidate of Object.values(stateModules)) {
    const state = instantiateStateForFactory(candidate)
    if (!state) {
      continue
    }
    const deckType = toStateCardId(state)
    if (!deckType) {
      continue
    }
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

function buildBlueprintFromAction(action: Action): CardBlueprint | null {
  const cardId = mapActionToCardId(action)
  if (!cardId) {
    return null
  }
  const blueprint: CardBlueprint = { type: cardId }
  if (action instanceof Attack) {
    const base = action.baseDamages
    const defaultAction = instantiateActionForComparison(action.constructor as ActionConstructor)
    const defaultProfile = defaultAction instanceof Attack ? defaultAction.baseDamages : undefined
    const defaultAmount = defaultProfile?.baseAmount
    const defaultCount = defaultProfile?.baseCount
    if (defaultAmount === undefined || base.baseAmount !== defaultAmount) {
      blueprint.overrideAmount = base.baseAmount
    }
    if (defaultCount === undefined || base.baseCount !== defaultCount) {
      blueprint.overrideCount = base.baseCount
    }
  }
  return blueprint
}

function instantiateActionForComparison(candidate: ActionConstructor): Action | null {
  try {
    // eslint-disable-next-line new-cap
    return new candidate()
  } catch {
    return null
  }
}

function toActionCardId(constructor: ActionConstructor): ActionCardId {
  const className = constructor.name ?? ''
  const trimmed = className.endsWith('Action') ? className.slice(0, -6) : className
  const kebab = trimmed
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
  return kebab as ActionCardId
}

function toStateCardId(state: StateType): StateCardId | null {
  const id = state.id
  if (typeof id !== 'string') {
    return null
  }
  if (!id.startsWith('state-')) {
    return null
  }
  return id as StateCardId
}

function toStateCardIdFromId(id: string | undefined): StateCardId | null {
  if (!id || !id.startsWith('state-')) {
    return null
  }
  return id as StateCardId
}
