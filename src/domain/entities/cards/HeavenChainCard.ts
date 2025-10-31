import { Card } from '../Card'
import { HeavenChainAction } from '../actions/HeavenChainAction'
import { ExhaustCardTag, SacredCardTag } from '../cardTags'

export class HeavenChainCard extends Card {
  constructor(id: string, action: HeavenChainAction = new HeavenChainAction()) {
    super({
      id,
      action,
      cardTags: [new ExhaustCardTag(), new SacredCardTag()],
    })
  }
}
