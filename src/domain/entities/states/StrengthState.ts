import { State } from '../State'

export class StrengthState extends State {
  constructor(magnitude = 0) {
    super({
      id: 'state-strength',
      name: '筋力上昇',
      magnitude,
      description: '与えるダメージが増加する',
    })
  }
}
