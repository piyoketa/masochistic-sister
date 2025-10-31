import { Skill } from '../Action'
import { ArcaneCardTag } from '../cardTags'

export class MasochisticAuraAction extends Skill {
  constructor() {
    super({
      id: 'action-masochistic-aura',
      name: '被虐のオーラ',
      description: '選択した敵を即座に行動させる',
      cardDefinition: {
        title: '被虐のオーラ',
        type: 'skill',
        cost: 1,
        description: '選択した敵を即座に行動させる',
        cardTags: [new ArcaneCardTag()],
      },
    })
  }
}
