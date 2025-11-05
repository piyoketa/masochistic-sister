import type { CardType } from './CardDefinition'

export interface CardTagProps {
  id: string
  name: string
  description?: string
}

export class CardTag {
  private readonly props: CardTagProps

  constructor(props: CardTagProps) {
    this.props = props
  }

  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | undefined {
    return this.props.description
  }
}

export type CardTarget = 'enemy-single' | 'self'

export abstract class CardTypeTag<TCardType extends CardType = CardType> extends CardTag {
  abstract readonly cardType: TCardType
}

export abstract class CardTargetTag<TTarget extends CardTarget = CardTarget> extends CardTag {
  abstract readonly target: TTarget
}

export abstract class CardDestinationTag extends CardTag {}

export abstract class CardCategoryTag extends CardTag {}

export type AttackTypeTag = CardTypeTag<'attack'>
export type SkillTypeTag = CardTypeTag<'skill'>
export type StatusTypeTag = CardTypeTag<'status'>
