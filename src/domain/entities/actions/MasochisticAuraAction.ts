import { Action } from '../Action'

export class MasochisticAuraAction extends Action {
  constructor() {
    super({
      id: 'action-masochistic-aura',
      name: '被虐のオーラ',
      category: 'skill',
      description: '選択した敵を即座に行動させる',
      cardDefinition: {
        title: '被虐のオーラ',
        type: 'skill',
        cost: 1,
        description: '選択した敵を即座に行動させる',
      },
    })
  }
}
