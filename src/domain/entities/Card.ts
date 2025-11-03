import type { Action, ActionContext } from './Action'
import type { CardTag } from './CardTag'
import type { State } from './State'
import type { CardDefinition } from './CardDefinition'
import type { Battle } from '../battle/Battle'
import type { CardOperation } from './operations'

export interface CardProps {
  action?: Action
  state?: State
  cardTags?: CardTag[]
  offensiveStates?: State[]
  defensiveStates?: State[]
  definitionOverrides?: Partial<CardDefinition>
}

export class Card {
  private idValue?: number
  private readonly actionRef?: Action
  private readonly stateRef?: State
  private readonly cardTagsValue?: CardTag[]
  private readonly offensiveStatesValue?: State[]
  private readonly defensiveStatesValue?: State[]
  private readonly definitionOverridesValue?: Partial<CardDefinition>
  private readonly definitionValue: CardDefinition

  constructor(props: CardProps) {
    if (!props.action && !props.state) {
      throw new Error('Card requires an action or a state reference')
    }

    this.actionRef = props.action
    this.stateRef = props.state
    this.cardTagsValue = props.cardTags
    this.offensiveStatesValue = props.offensiveStates
    this.defensiveStatesValue = props.defensiveStates
    this.definitionOverridesValue = props.definitionOverrides
    this.definitionValue = this.composeDefinition()
  }

  get id(): number | undefined {
    return this.idValue
  }

  assignId(id: number): void {
    if (this.idValue !== undefined && this.idValue !== id) {
      throw new Error(`Card already assigned to repository id ${this.idValue}`)
    }

    this.idValue = id
  }

  hasId(): boolean {
    return this.idValue !== undefined
  }

  get action(): Action | undefined {
    return this.actionRef
  }

  get state(): State | undefined {
    return this.stateRef
  }

  get cardTags(): CardTag[] | undefined {
    return this.cardTagsValue ?? this.definition.cardTags
  }

  get offensiveStates(): State[] | undefined {
    return this.offensiveStatesValue
  }

  get defensiveStates(): State[] | undefined {
    return this.defensiveStatesValue
  }

  get definition(): CardDefinition {
    return this.definitionValue
  }

  get definitionOverrides(): Partial<CardDefinition> | undefined {
    return this.definitionOverridesValue
  }

  get title(): string {
    return this.definition.title
  }

  get type(): CardDefinition['type'] {
    return this.definition.type
  }

  get cost(): number {
    return this.definition.cost
  }

  get description(): string {
    // 描画時には定義ではなく参照しているAction/Stateから説明文を動的に生成する
    if (this.actionRef) {
      return this.actionRef.describe()
    }

    if (this.stateRef) {
      return this.stateRef.description()
    }

    return ''
  }

  get image(): string | undefined {
    return this.definition.image
  }

  play(battle: Battle, operations: CardOperation[] = []): void {
    const action = this.actionRef
    if (!action) {
      const state = this.stateRef
      if (!state) {
        throw new Error('Card cannot be played without an action')
      }

      battle.player.spendMana(this.cost)
      battle.player.removeState(state.id)
      battle.exilePile.add(this)
      return
    }

    const context: ActionContext = action.prepareContext({
      battle,
      source: battle.player,
      operations,
    })

    battle.player.spendMana(this.cost)
    battle.hand.remove(this)

    action.execute(context)

    this.moveToNextZone(battle)
  }

  copyWith(overrides: Partial<CardProps>): Card {
    return new Card({
      action: overrides.action ?? this.actionRef,
      state: overrides.state ?? this.stateRef,
      cardTags: overrides.cardTags ?? this.cardTagsValue,
      offensiveStates: overrides.offensiveStates ?? this.offensiveStatesValue,
      defensiveStates: overrides.defensiveStates ?? this.defensiveStatesValue,
      definitionOverrides: overrides.definitionOverrides ?? this.definitionOverridesValue,
    })
  }

  private moveToNextZone(battle: Battle): void {
    const cardTags = this.cardTags ?? []
    const isExhaust = cardTags.some((tag) => tag.id === 'tag-exhaust')

    if (isExhaust) {
      battle.exilePile.add(this)
    } else {
      battle.discardPile.add(this)
    }
  }

  private composeDefinition(): CardDefinition {
    const baseDefinition = this.actionRef
      ? this.actionRef.createCardDefinition()
      : this.stateRef!.createCardDefinition()

    return {
      ...baseDefinition,
      ...this.definitionOverridesValue,
    }
  }
}
