import { State } from '../State'

export class StickyState extends State {
  constructor(magnitude = 1) {
    super({
      id: 'state-sticky',
      name: 'ねばねば',
      magnitude,
      description: '連続攻撃を受けるとき、回数+1',
      cardDefinition: {
        title: 'ねばねば',
        type: 'status',
        cost: 1,
        description: '連続攻撃を受けるとき、回数+1',
      },
    })
  }
}
