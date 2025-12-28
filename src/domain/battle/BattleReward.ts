/**
 * BattleReward
 * ============
 * 勝利済み Battle から報酬を計算する責務を持つクラス。
 * - 褒賞カード候補（[新規]タグ付き）・HP回復量・所持金を算出し、RewardView へ渡す。
 * - 付与処理は RewardView 側で行うため、ここでは純粋に計算とデータ整形のみを担う。
 */
import type { Battle } from './Battle'
import type { Card } from '../entities/Card'
import { buildBlueprintFromCard, type CardBlueprint } from '@/domain/library/Library'
import { MemorySaintRelic } from '../entities/relics/MemorySaintRelic'

export interface ComputedBattleReward {
  defeatedCount: number
  hpHeal: number
  goldGain: number
  cards: CardBlueprint[]
}

const NEW_TAG_ID = 'tag-newly-created'

export class BattleReward {
  constructor(private readonly battle: Battle) {}

  /** 現時点のバトル状態から報酬内容を算出する。 */
  compute(): ComputedBattleReward {
    const defeatedCount = this.countDefeatedEnemies()
    const newCards = this.collectNewCards()
    const cardBlueprints = newCards
      .map((card) => this.toRewardBlueprint(card))
      .filter((entry): entry is CardBlueprint => Boolean(entry))
    // MemorySaintRelic を所持している場合のみ、最大HPの1/3回復、それ以外は0とする
    const memorySaintId = new MemorySaintRelic().id
    const hpHeal = this.battle.hasRelic(memorySaintId)
      ? Math.max(0, Math.floor(this.battle.player.maxHp / 3))
      : 0
    return {
      defeatedCount,
      hpHeal,
      goldGain: defeatedCount * 10,
      cards: cardBlueprints,
    }
  }

  private countDefeatedEnemies(): number {
    return this.battle.enemyTeam.members.filter((enemy) => enemy.status === 'defeated').length
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
