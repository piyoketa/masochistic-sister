import { Attack, type ActionContext } from '../Action'
import { Damages } from '../Damages'
import { Card } from '../Card'
import { CorrosionState } from '../states/CorrosionState'

export class AcidSpitAction extends Attack {
  constructor() {
    super({
      name: '酸を吐く',
      baseDamages: Damages.single(5),
      description: '腐食(1)を付与する',
      cardDefinition: {
        title: '酸を吐く',
        type: 'attack',
        cost: 1,
        description: '腐食(1)を付与する',
      },
    })
  }
  override execute(context: ActionContext): void {
    const battle = context.battle
    const damages = this.calcDamages(context.source, battle.player)
    battle.damagePlayer(damages.amount * damages.count)

    const repository = battle.cardRepository

    repository.memoryEnemyAttack(damages, this, battle)
    const corrosionCard = repository.create(() => new Card({ state: new CorrosionState() }))

    battle.addCardToPlayerHand(corrosionCard)
  }
}
