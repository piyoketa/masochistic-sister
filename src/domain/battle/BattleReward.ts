/**
 * BattleReward
 * ============
 * 勝利済み Battle から報酬を計算する責務を持つクラス。
 * - 現仕様では褒賞カード候補（[新規]タグ付き）のみを算出し、HP/所持金は扱わない。
 * - 付与処理は RewardView 側で行うため、ここでは純粋に計算とデータ整形のみを担う。
 */
import type { Battle } from './Battle'
import type { Card } from '../entities/Card'
import type { CardInfo } from '@/types/battle'
import { mapActionToDeckCardType, type DeckCardType } from '@/domain/library/Library'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'

export interface RewardCardCandidate {
  id: string
  info: CardInfo
  deckType: DeckCardType | null
}

export interface ComputedBattleReward {
  defeatedCount: number
  cards: RewardCardCandidate[]
}

const NEW_TAG_ID = 'tag-newly-created'

export class BattleReward {
  constructor(private readonly battle: Battle) {}

  /** 現時点のバトル状態から報酬内容を算出する。 */
  compute(): ComputedBattleReward {
    const defeatedCount = this.battle.enemyTeam.members.length
    const newCards = this.collectNewCards()
    const cardEntries = newCards.map((card, index) => this.toRewardCard(card, index))
    return {
      defeatedCount,
      cards: cardEntries.filter((entry): entry is RewardCardCandidate => Boolean(entry)),
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

  private toRewardCard(card: Card, index: number): RewardCardCandidate | null {
    const cardInfo = buildCardInfoFromCard(card, {
      id: `reward-card-${card.id ?? index}`,
      affordable: true,
      disabled: false,
    })
    if (!cardInfo || !this.isSupportedCardType(cardInfo.type)) {
      return null
    }

    const deckType = card.action ? mapActionToDeckCardType(card.action) : null

    return {
      id: cardInfo.id,
      info: cardInfo,
      deckType,
    }
  }

  private isSupportedCardType(type: CardInfo['type'] | string | undefined): type is CardInfo['type'] {
    return type === 'attack' || type === 'skill' || type === 'status' || type === 'skip'
  }
}
