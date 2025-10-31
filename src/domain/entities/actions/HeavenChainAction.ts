import { Skill } from '../Action'
import { ExhaustCardTag, SacredCardTag } from '../cardTags'

export class HeavenChainAction extends Skill {
  constructor() {
    super({
      name: '天の鎖',
      description: 'このターン、敵1体の動きを止める',
      cardDefinition: {
        title: '天の鎖',
        type: 'skill',
        cost: 1,
        description: 'このターン、敵1体の動きを止める',
        notes: ['［消費］使用すると、この戦闘中は除去される'],
        cardTags: [new ExhaustCardTag(), new SacredCardTag()],
      },
    })
  }
}
