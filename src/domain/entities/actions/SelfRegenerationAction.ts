/*
自己再生 (SelfRegenerationAction) の責務:
- 自身のHPが減っている場合にのみ使用可能で、HPを40回復する。
- 対象選択や状態付与は行わず、シンプルな自己回復のみを提供する。

責務ではないこと:
- 他ユニットの回復や追加バフ付与。対象は常に自分自身。
- HPが満タンのときの代替効果（満タンなら canUse で弾く）。

主な通信相手:
- Enemy/Player: currentHp/maxHp の参照と heal() 実行。
- Battle: 特に通知は行わず、回復演出やログは上位が必要に応じて付加する。
*/
import { Skill, type ActionContext } from '../Action'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'
import type { Battle } from '@/domain/battle/Battle'
import type { Enemy } from '../Enemy'
import type { Player } from '../Player'

const HEAL_AMOUNT = 40

export class SelfRegenerationAction extends Skill {
  constructor() {
    super({
      name: '自己再生',
      cardDefinition: {
        title: '自己再生',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 0,
        subtitle: '',
      },
    })
  }

  protected override description(): string {
    return `自身のHPを${HEAL_AMOUNT}回復する`
  }

  override canUse(context: { battle: Battle; source: Enemy | Player }): boolean {
    const source = context.source as Enemy | Player
    // HPが減っているときのみ使用可
    return source.currentHp < source.maxHp
  }

  protected override perform(context: ActionContext): void {
    const source = context.source as Enemy | Player
    if (source.currentHp >= source.maxHp) {
      context.metadata = { ...(context.metadata ?? {}), skipped: true, skipReason: 'hp-full' }
      return
    }
    // Player/Enemy ともに heal を持つが、状態進行通知はプレイヤーのみ行う。
    if (context.battle && context.battle.player === source) {
      ;(source as Player).heal(HEAL_AMOUNT, { battle: context.battle })
      return
    }
    ;(source as Enemy | Player).heal(HEAL_AMOUNT)
  }
}
