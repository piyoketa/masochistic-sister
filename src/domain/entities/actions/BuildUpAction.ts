import { Action } from '../Action'

export class BuildUpAction extends Action {
  constructor() {
    super({
      id: 'action-build-up',
      name: 'ビルドアップ',
      category: 'skill',
      description: '自身の状態に筋力上昇を追加する',
      cardDefinition: {
        title: 'ビルドアップ',
        type: 'skill',
        cost: 1,
        description: '自身の状態に筋力上昇を追加する',
      },
    })
  }
}
