/**
 * BattleReward
 * ============
 * 勝利済み Battle から報酬を計算する責務を持つクラス。
 * - 現仕様では褒賞カード候補（[新規]タグ付き）のみを算出し、HP/所持金は扱わない。
 * - 付与処理は RewardView 側で行うため、ここでは純粋に計算とデータ整形のみを担う。
 */
import type { Battle } from './Battle'
import type { Card } from '../entities/Card'
import { buildBlueprintFromCard, type CardBlueprint } from '@/domain/library/Library'

export interface ComputedBattleReward {
  defeatedCount: number
  hpHeal: number
  cards: CardBlueprint[]
}

const NEW_TAG_ID = 'tag-newly-created'

export class BattleReward {
  constructor(private readonly battle: Battle) {}

  /** 現時点のバトル状態から報酬内容を算出する。 */
  compute(): ComputedBattleReward {
    const defeatedCount = this.battle.enemyTeam.members.length
    const newCards = this.collectNewCards()
    const cardBlueprints = newCards
      .map((card) => this.toRewardBlueprint(card))
      .filter((entry): entry is CardBlueprint => Boolean(entry))
    // HP回復は固定値 75 とする
    return {
      defeatedCount,
      hpHeal: 75,
      cards: cardBlueprints,
    }
  }

  /** 手札・山札・捨て札から [新規] タグ付きカードを抽出する。 */
  private collectNewCards(): Card[] {
    const piles = [
      ...this.battle.hand.list(),
      ...this.battle.deck.list(),
      ...this.battle.discardPile.list(),
      // ...this.battle.exilePile.list(),
    ]
    return piles.filter((card) => card.hasTag(NEW_TAG_ID))
  }

  private toRewardBlueprint(card: Card): CardBlueprint | null {
    try {
      return buildBlueprintFromCard(card)
    } catch {
      return null
    }
  }
}
