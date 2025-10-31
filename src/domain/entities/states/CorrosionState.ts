import { State } from '../State'

export class CorrosionState extends State {
  constructor(magnitude = 1) {
    super({
      id: 'state-corrosion',
      name: '腐食',
      magnitude,
      description: 'ダメージを+10する',
      cardDefinition: {
        title: '腐食',
        type: 'status',
        cost: 1,
        description: 'ダメージを受けるとき、+10',
      },
    })
  }
}
