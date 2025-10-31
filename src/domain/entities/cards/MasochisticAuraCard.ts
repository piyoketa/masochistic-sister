import { Card } from '../Card'
import { MasochisticAuraAction } from '../actions/MasochisticAuraAction'
import { ArcaneCardTag } from '../cardTags'

export class MasochisticAuraCard extends Card {
  constructor(id: string, action: MasochisticAuraAction = new MasochisticAuraAction()) {
    super({
      id,
      action,
      cardTags: [new ArcaneCardTag()],
    })
  }
}
