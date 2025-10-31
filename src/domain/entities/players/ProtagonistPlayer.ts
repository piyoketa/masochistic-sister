import { Player, type PlayerProps } from '../Player'

export class ProtagonistPlayer extends Player {
  constructor(overrides?: Partial<PlayerProps>) {
    super({
      id: 'player-1',
      name: '聖女',
      maxHp: 100,
      currentHp: 100,
      maxMana: 3,
      currentMana: 3,
      ...overrides,
    })
  }
}
