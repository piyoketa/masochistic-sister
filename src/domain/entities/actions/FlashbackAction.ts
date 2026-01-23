/*
FlashbackAction.ts の責務:
- 捨て札のアタックカード1枚をランダムに手札へ加えるスキルカード「フラッシュバック」を定義する。
- 対象となるアタックカードが捨て札に存在しない場合は発動不可とし、UI では disabled 扱いにできるよう isActive を提供する。

責務ではないこと:
- 手札上限を超える場合の強制移動や山札返却などの複雑なリカバリ。ここでは手札が満杯のケースは発生しない前提とし、もし発生しても何も起きない。
- アニメーションの描画や演出再生の実装。表示側は ActionLog / AnimationInstruction を参照して再生する想定とし、ここではカード移動とログ発行のみを行う。

主な通信相手とインターフェース:
- DiscardPile / Hand: 捨て札からカードを除去し、手札へ追加する。
- CardRepository: 追加先で ID を保持するため、既存カードをそのまま移動するだけで完結する。
- Battle: ActionLog と手札更新を通じて、View にカード移動を伝える。
*/
import { Skill, type ActionContext } from '../Action'
import { SkillTypeCardTag, SelfTargetCardTag } from '../cardTags'
import { Card } from '../Card'
type BattleInstance = import('../../battle/Battle').Battle

export class FlashbackAction extends Skill {
  static readonly cardId = 'flashback'
  constructor() {
    super({
      name: '蘇る記憶',
      cardDefinition: {
        title: '蘇る記憶',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
        subtitle: '',
      },
    })
  }

  protected override description(): string {
    return '捨て札から\n被虐の記憶1枚を\nランダムに手札へ加える'
  }

  override isActive(context?: { battle?: BattleInstance }): boolean {
    const battle = context?.battle
    if (!battle) {
      return true
    }
    const debug =
      (typeof process !== 'undefined' && process.env?.VITE_DEBUG_FLASHBACK_ACTIVE === 'true') ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEBUG_FLASHBACK_ACTIVE === 'true')

    // 手札が満杯なら発動させても効果がないため無効扱いとする
    if (battle.hand.isAtLimit()) {
      if (debug) {
        // eslint-disable-next-line no-console
        console.info('[FlashbackAction][isActive] hand is at limit', {
          handSize: battle.hand.list().length,
          handLimit: battle.hand.maxSize(),
        })
      }
      return false
    }

    const candidate = this.findCandidate(battle)
    if (debug) {
      // eslint-disable-next-line no-console
      console.info('[FlashbackAction][isActive] evaluated', {
        discardSize: battle.discardPile.list().length,
        discardAttacks: battle.discardPile
          .list()
          .filter((card) => card.definition.cardType === 'attack')
          .map((card) => ({ id: card.id, title: card.title })),
        active: Boolean(candidate),
      })
    }
    return candidate !== undefined
  }

  protected override perform(context: ActionContext): void {
    const battle = context.battle
    const candidate = this.findCandidate(battle)
    if (!candidate) {
      return
    }
    const result = battle.drawFromDiscard(candidate)
    // handOverflow 時もここでは特別な処理は行わない（アニメは別途積まれている）
  }

  private findCandidate(battle: BattleInstance): Card | undefined {
    const attacks = battle.discardPile
      .list()
      .filter((card) => card.definition.cardType === 'attack')
    if (attacks.length === 0) {
      return undefined
    }
    const index = Math.floor(Math.random() * attacks.length)
    return attacks[index]
  }
}
