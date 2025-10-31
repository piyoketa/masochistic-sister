import { Skill } from '../Action'

export class BuildUpAction extends Skill {
  constructor() {
    super({
      id: 'action-build-up',
      name: 'ビルドアップ',
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
