import { Card } from '../Card'
import { BattlePrepAction } from '../actions/BattlePrepAction'

export class BattlePrepCard extends Card {
  constructor(id: string, action: BattlePrepAction = new BattlePrepAction()) {
    super({
      id,
      action,
    })
  }
}
