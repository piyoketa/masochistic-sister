/**
 * DeathMatchRelic の責務:
 * - プレイヤーHPが50以下のときに打点上昇(5)を付与する。
 * - レリック情報（名称・説明・アイコン）を提供し、表示に用いる。
 *
 * 非責務:
 * - 戦闘外での効果発動。バトルコンテキストがない場合は非アクティブ。
 * - HPチェック以外の条件判定（他レリックや状態の管理）。
 *
 * 主な通信相手とインターフェース:
 * - Battle/Player: `isActive` で HP を参照し、`getAdditionalStates` で StrengthState(5) を付与。
 * - StrengthState: 実際の打点上昇を表現する State。
 */
import { Relic } from './Relic'
import { StrengthState } from '../states/StrengthState'

export class DeathMatchRelic extends Relic {
  readonly id = 'death-match'
  readonly name = '死闘'
  readonly usageType = 'passive' as const
  readonly icon = '☠️'

  description(): string {
    return 'HPが50以下の時、打点上昇(5)'
  }

  override isActive(context?: { battle?: import('@/domain/battle/Battle').Battle; player?: import('../Player').Player }): boolean {
    if (!context?.battle || !context.player) return false
    return context.player.currentHp <= 50
  }

  override getAdditionalStates(context?: { battle?: import('@/domain/battle/Battle').Battle; player?: import('../Player').Player }): import('../State').State[] {
    if (!this.isActive(context)) {
      return []
    }
    return [new StrengthState(5)]
  }
}
