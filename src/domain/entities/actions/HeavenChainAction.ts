import { Action } from '../Action'

export class HeavenChainAction extends Action {
  constructor() {
    super({
      id: 'action-heaven-chain',
      name: '天の鎖',
      category: 'skill',
      description: 'このターン、敵1体の動きを止める',
      cardDefinition: {
        title: '天の鎖',
        type: 'skill',
        cost: 1,
        description: 'このターン、敵1体の動きを止める',
        notes: ['［消費］使用すると、この戦闘中は除去される'],
      },
    })
  }
}
