/*
RedrawRelicAction.ts の責務:
- 起動レリック「リドロー」の効果として、手札の状態異常以外を全て捨ててから固定枚数ドローする処理を実行する。
- 捨て札演出用のログを積み、ドローは Battle.drawForPlayer に委譲して他システムと挙動を揃える。

非責務:
- レリックの使用回数や起動可否の判定（ActiveRelic が担当）。
- ドロー枚数の可変管理（本アクションでは常に4枚で固定とし、外部パラメータは受け取らない）。

主な通信相手:
- `Battle.hand` / `Battle.discardPile`: 状態異常以外のカード移動を行う。
- `Battle.recordCardTrashAnimation`: 捨て札アニメーションの発火。
- `Battle.drawForPlayer`: 4枚ドローの本処理を委譲。
*/
import { Skill, type ActionContext } from '../Action'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'

// ターン終了時と同じ4枚ドローを明示的に定数化しておき、将来のルール変更時に一元管理しやすくする
const REDRAW_RELIC_DRAW_COUNT = 4

export class RedrawRelicAction extends Skill {
  constructor() {
    super({
      name: 'リドロー',
      cardDefinition: {
        title: 'リドロー',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 0,
        subtitle: '起動効果',
      },
      audioCue: {
        soundId: 'skills/Onoma-Flash02.mp3',
        waitMs: 500,
        durationMs: 500,
      },
      cutInCue: {
        src: 'assets/cut_ins/pray2.png',
        waitMs: 800,
        durationMs: 800,
      },
    })
  }

  protected override description(): string {
    return '手札の状態異常以外を全て捨て、カードを4枚引く'
  }

  protected override perform(context: ActionContext): void {
    const hand = context.battle.hand
    // ターン終了時と同じルールを再現するため、状態異常以外のカードのみを一括で対象とする
    const discardTargets = hand.list().filter((card) => card.definition.cardType !== 'status')

    if (discardTargets.length > 0) {
      discardTargets.forEach((card) => {
        hand.remove(card)
      })
      context.battle.discardPile.addMany(discardTargets)

      const trashedIds = discardTargets
        .map((card) => card.id)
        .filter((id): id is number => typeof id === 'number')
      const trashedTitles = discardTargets.map((card) => card.title).filter(Boolean)
      if (trashedIds.length > 0) {
        context.battle.recordCardTrashAnimation({ cardIds: trashedIds, cardTitles: trashedTitles })
      }
    }

    // 捨て札が無くても「ターン終了時と同じ効果」として4枚引く仕様のため、常にドローを実行する
    context.battle.drawForPlayer(REDRAW_RELIC_DRAW_COUNT)
  }
}
