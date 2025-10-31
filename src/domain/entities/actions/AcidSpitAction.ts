import { SingleAttack, type ActionContext } from '../Action'
import { Card } from '../Card'
import { CorrosionState } from '../states/CorrosionState'

export class AcidSpitAction extends SingleAttack {
  constructor() {
    super({
      id: 'action-acid-spit',
      name: '酸を吐く',
      baseDamage: 5,
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
    const [damage] = this.calculateDamage()
    if (typeof damage !== 'number') {
      throw new Error('Failed to calculate damage for Acid Spit')
    }

    battle.damagePlayer(damage)

    const repository = battle.cardRepository

    const acidCard = repository.create(() => new Card({ action: new AcidSpitAction() }))
    const corrosionCard = repository.create(() => new Card({ state: new CorrosionState() }))

    battle.addCardToPlayerHand(acidCard)
    battle.addCardToPlayerHand(corrosionCard)
  }
}
