import type { Action } from './Action'
import type { CardTag } from './CardTag'
import type { State } from './State'
import type { Battle } from '../battle/Battle'
import type { CardDefinition } from './CardDefinition'

export type CardOperation = Record<string, unknown>

export interface CardProps {
  id: string
  action?: Action
  state?: State
  cardTags?: CardTag[]
  offensiveStates?: State[]
  defensiveStates?: State[]
  definitionOverrides?: Partial<CardDefinition>
}

export class Card {
  private readonly idValue: string
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

    this.idValue = props.id
    this.actionRef = props.action
    this.stateRef = props.state
    this.cardTagsValue = props.cardTags
    this.offensiveStatesValue = props.offensiveStates
    this.defensiveStatesValue = props.defensiveStates
    this.definitionOverridesValue = props.definitionOverrides
    this.definitionValue = this.composeDefinition()
  }

  get id(): string {
    return this.idValue
  }

  get action(): Action | undefined {
    return this.actionRef
  }

  get state(): State | undefined {
    return this.stateRef
  }

  get cardTags(): CardTag[] | undefined {
    return this.cardTagsValue
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
    return this.definition.description
  }

  get image(): string | undefined {
    return this.definition.image
  }

  play(battle: Battle, operation?: CardOperation): void {}

  copyWith(overrides: Partial<CardProps>): Card {
    return new Card({
      id: overrides.id ?? this.idValue,
      action: overrides.action ?? this.actionRef,
      state: overrides.state ?? this.stateRef,
      cardTags: overrides.cardTags ?? this.cardTagsValue,
      offensiveStates: overrides.offensiveStates ?? this.offensiveStatesValue,
      defensiveStates: overrides.defensiveStates ?? this.defensiveStatesValue,
      definitionOverrides: overrides.definitionOverrides ?? this.definitionOverridesValue,
    })
  }

  private composeDefinition(): CardDefinition {
    const baseDefinition = this.actionRef
      ? this.actionRef.createCardDefinition()
      : this.stateRef!.createCardDefinition()

    return {
      ...baseDefinition,
      ...this.definitionOverridesValue,
      notes: this.definitionOverridesValue?.notes ?? baseDefinition.notes,
    }
  }
}
  get definitionOverrides(): Partial<CardDefinition> | undefined {
    return this.definitionOverridesValue
  }
