import { State } from '../State'

export class HardShellState extends State {
  constructor(magnitude = 20) {
    super({
      id: 'state-hard-shell',
      name: '硬い殻',
      magnitude,
      description: 'ダメージを-20する',
    })
  }
}
