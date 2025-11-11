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
import type { CardTag } from '@/domain/entities/CardTag'
import type { CardDefinition } from '@/domain/entities/CardDefinition'
import type { DamagePattern } from '@/domain/entities/Damages'
import type {
  CardInfo,
  CardTagInfo,
  AttackStyle,
  CardType,
  DescriptionSegment,
} from '@/types/battle'
import type { Action } from '@/domain/entities/Action'
import { Attack } from '@/domain/entities/Action'
import { State } from '@/domain/entities/State'
import type { State as StateType } from '@/domain/entities/State'
import * as actionModules from '@/domain/entities/actions'
import * as stateModules from '@/domain/entities/states'

type ActionConstructor = new () => Action
type StateConstructor = new () => StateType

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
    }

    for (const card of cards) {
      const bucket = buckets[card.type]
      if (bucket.length >= limitPerType) {
        continue
      }
      bucket.push(card)
    }

    return [...buckets.skill, ...buckets.attack, ...buckets.status]
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
      const card = new Card({ state })
      const identifier = `library-state-${state.constructor.name}-${index}`
      return this.buildCardInfo(card, identifier)
    } catch {
      return null
    }
  }

  private buildCardInfo(card: Card, identifier: string): CardInfo | null {
    if (!this.isSupportedCardType(card.type)) {
      return null
    }
    const definition = card.definition
    const primaryTags: CardTagInfo[] = []
    const effectTags: CardTagInfo[] = []
    const categoryTags: CardTagInfo[] = []
    const seenTagIds = new Set<string>()

    this.addPrimaryTags(definition, primaryTags, seenTagIds)
    this.addTagEntries(effectTags, card.effectTags)
    this.addTagEntries(categoryTags, card.categoryTags, (tag) => tag.name)

    let description = card.description
    let descriptionSegments: DescriptionSegment[] | undefined
    let attackStyle: AttackStyle | undefined
    let damageAmount: number | undefined
    let damageCount: number | undefined

    const action = card.action
    if (action instanceof Attack) {
      const damages = action.baseDamages
      damageAmount = damages.baseAmount
      damageCount = damages.baseCount
      const formatted = action.describeForPlayerCard({
        baseDamages: damages,
        displayDamages: damages,
      })
      description = formatted.label
      descriptionSegments = formatted.segments
      attackStyle = this.deriveAttackStyle(definition, damages.type)
    }

    return {
      id: identifier,
      title: card.title,
      type: card.type,
      cost: card.cost,
      illustration: definition.image ?? '🂠',
      description,
      descriptionSegments,
      attackStyle,
      primaryTags,
      effectTags,
      categoryTags,
      damageAmount,
      damageCount,
    }
  }

  private addPrimaryTags(
    definition: CardDefinition,
    entries: CardTagInfo[],
    registry: Set<string>,
  ): void {
    this.addTagEntry(definition.type, entries, registry, (tag) => tag.name)
    if (this.hasTarget(definition)) {
      this.addTagEntry(definition.target, entries, registry, (tag) => tag.name)
    }
  }

  private deriveAttackStyle(definition: CardDefinition, pattern?: DamagePattern): AttackStyle {
    const typeId = definition.type.id
    if (typeId === 'tag-type-multi-attack') {
      return 'multi'
    }
    if (typeId === 'tag-type-single-attack') {
      return 'single'
    }
    return pattern === 'multi' ? 'multi' : 'single'
  }

  private addTagEntry(
    tag: CardTag | undefined,
    entries: CardTagInfo[],
    registry: Set<string>,
    formatter: (tag: CardTag) => string = (candidate) => candidate.name,
  ): void {
    if (!tag || registry.has(tag.id)) {
      return
    }
    registry.add(tag.id)
    entries.push({
      id: tag.id,
      label: formatter(tag),
      description: tag.description,
    })
  }

  private addTagEntries(
    entries: CardTagInfo[],
    tags?: readonly CardTag[],
    formatter: (tag: CardTag) => string = (candidate) => candidate.name,
  ): void {
    if (!tags) {
      return
    }
    for (const tag of tags) {
      if (entries.some((entry) => entry.id === tag.id)) {
        continue
      }
      entries.push({
        id: tag.id,
        label: formatter(tag),
        description: tag.description,
      })
    }
  }

  private hasTarget(
    definition: CardDefinition,
  ): definition is CardDefinition & { target: CardDefinition['target'] } {
    return 'target' in definition && definition.target !== undefined
  }

  private isSupportedCardType(type: CardDefinition['cardType']): type is CardType {
    return type === 'attack' || type === 'skill' || type === 'status'
  }
}
