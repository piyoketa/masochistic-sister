import { State } from '../State'

export class AccelerationState extends State {
  constructor(magnitude = 1) {
    super({
      id: 'state-acceleration',
      name: '加速',
      magnitude,
      description: '攻撃回数を+1する',
    })
  }
}
