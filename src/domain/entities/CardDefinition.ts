import type {
  AttackTypeTag,
  CardTag,
  CardTargetTag,
  CardTypeTag,
  SkillTypeTag,
  StatusTypeTag,
} from './CardTag'

export type CardType = 'attack' | 'skill' | 'status'

interface BaseCardDefinition<
  TCardType extends CardType,
  TTypeTag extends CardTypeTag<TCardType>,
> {
  title: string
  cardType: TCardType
  type: TTypeTag
  cost: number
  image?: string
  cardTags?: CardTag[]
  operations?: string[]
}

export interface AttackCardDefinition
  extends BaseCardDefinition<'attack', AttackTypeTag> {
  target: CardTargetTag
}

export interface SkillCardDefinition
  extends BaseCardDefinition<'skill', SkillTypeTag> {
  target: CardTargetTag
}

export interface StatusCardDefinition
  extends BaseCardDefinition<'status', StatusTypeTag> {
  target?: undefined
}

export type CardDefinition = AttackCardDefinition | SkillCardDefinition | StatusCardDefinition
