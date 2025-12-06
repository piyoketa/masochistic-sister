import type {
  AttackTypeTag,
  CardCategoryTag,
  CardTag,
  CardTargetTag,
  CardTypeTag,
  SkillTypeTag,
  SkipTypeTag,
  StatusTypeTag,
} from './CardTag'

export type CardType = 'attack' | 'skill' | 'status' | 'skip'

interface BaseCardDefinition<
  TCardType extends CardType,
  TTypeTag extends CardTypeTag<TCardType>,
> {
  title: string
  cardType: TCardType
  type: TTypeTag
  cost: number
  subtitle?: string
  image?: string
  effectTags?: CardTag[]
  categoryTags?: CardCategoryTag[]
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

export interface SkipCardDefinition extends BaseCardDefinition<'skip', SkipTypeTag> {
  target?: undefined
}

export type CardDefinition =
  | AttackCardDefinition
  | SkillCardDefinition
  | StatusCardDefinition
  | SkipCardDefinition
