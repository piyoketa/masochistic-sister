import { BadState } from '../State'
import { Attack } from '../Action'
import { Enemy } from '../Enemy'
import { StatusTypeCardTag } from '../cardTags'
import type { Battle } from '../../battle/Battle'
import type { Player } from '../Player'
import type { Action } from '../Action'
import { StateAction } from '../Action/StateAction'
import type { CardTag } from '../CardTag'

class BleedStateAction extends StateAction {
  constructor(state: BleedState, tags?: CardTag[]) {
    super({
      name: state.name,
      cardDefinition: state.createCardDefinition(),
      tags,
      stateId: state.id,
      sourceState: state,
    })
  }
}

interface ActionResolvedContext {
  battle: Battle
  owner: Player | Enemy
  actor: Player | Enemy
  action: Action
}

export class BleedState extends BadState {
  constructor(magnitude = 1) {
    super({
      id: 'state-bleed',
      name: '出血',
      stackable: true,
      magnitude,
      cardDefinition: {
        title: '出血',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        cost: 1,
      },
    })
  }

  override description(): string {
    const mag = this.magnitude ?? 0
    return `攻撃を行う度に自身へ<magnitude>${mag}</magnitude>ダメージ`
  }

  override onActionResolved(context: ActionResolvedContext): void {
    if (context.actor !== context.owner) {
      return
    }

    if (!(context.action instanceof Attack)) {
      return
    }

    const damage = Math.max(0, Math.floor(this.magnitude ?? 0))
    if (damage <= 0) {
      return
    }

    if (context.owner instanceof Enemy) {
      context.battle.damageEnemy(context.owner, {
        actionId: 'bleed',
        attacker: null,
        defender: { type: 'enemy', enemyId: context.owner.id ?? -1 },
        outcomes: [{ damage, effectType: 'bleed' }],
      })
    } else {
      context.battle.damagePlayer({
        actionId: 'bleed',
        attacker: null,
        defender: { type: 'player' },
        outcomes: [{ damage, effectType: 'bleed' }],
      })
    }
  }

  override action(tags?: CardTag[]): StateAction {
    return new BleedStateAction(this, tags)
  }
}
