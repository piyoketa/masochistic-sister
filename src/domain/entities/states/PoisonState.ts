/*
PoisonState.ts の責務:
- 所持者のターン開始時に毒ダメージを与える継続ダメージ効果を管理する。
- 毎ターン一定量のHPを減少させ、バトル側の勝敗判定を促す。

責務ではないこと:
- ダメージ軽減や他ステートとの相殺。これらは別Stateが処理する。
- ターン終了時の解除や蓄積の制御。蓄積量の更新はカードや敵スキルが担当する。

主要な通信相手:
- `Battle`: `damageEnemy` / `damagePlayer` を呼び出し、HP減少を適用する。
- `Enemy` / `Player`: 所持者の判定に利用するのみで、直接状態リストの編集は行わない。
*/
import { BadState } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import type { Battle } from '../../battle/Battle'
import type { Player } from '../Player'
import { Enemy } from '../Enemy'
import { StateAction } from '../Action/StateAction'
import type { CardTag } from '../CardTag'

class PoisonStateAction extends StateAction {
  constructor(state: PoisonState, tags?: CardTag[]) {
    super({
      name: state.name,
      cardDefinition: state.createCardDefinition(),
      tags,
      stateId: state.id,
      sourceState: state,
    })
  }
}

export class PoisonState extends BadState {
  constructor(magnitude = 1) {
    super({
      id: 'state-poison',
      name: '毒',
      magnitude,
      cardDefinition: {
        title: '毒',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    const dmg = this.magnitude ?? 0
    return `ターン開始時に自身へ${dmg}ダメージ`
  }

  override onTurnStart(context: { battle: Battle; owner: Player | Enemy }): void {
    const damage = Math.max(0, Math.floor(this.magnitude ?? 0))
    if (damage <= 0) {
      return
    }

    if (context.owner instanceof Enemy) {
      context.battle.damageEnemy(context.owner, {
        actionId: 'poison',
        attacker: null,
        defender: { type: 'enemy', enemyId: context.owner.id ?? -1 },
        outcomes: [{ damage, effectType: 'poison' }],
      })
      return
    }

    context.battle.damagePlayer({
      actionId: 'poison',
      attacker: null,
      defender: { type: 'player' },
      outcomes: [{ damage, effectType: 'poison' }],
    })
  }

  override action(tags?: CardTag[]): StateAction {
    return new PoisonStateAction(this, tags)
  }
}
