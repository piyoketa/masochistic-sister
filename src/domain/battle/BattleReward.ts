/**
 * BattleReward
 * ============
 * 勝利済み Battle から報酬を計算する責務を持つクラス。
 * - HP 回復量、所持金、褒賞カード候補（[新規]タグ付き）を算出する。
 * - 付与処理は RewardView 側で行うため、ここでは純粋に計算とデータ整形のみを担う。
 */
import type { Battle } from './Battle'
import { Attack } from '../entities/Action'
import type { Card } from '../entities/Card'
import type { CardInfo, CardTagInfo, DescriptionSegment } from '@/types/battle'
import type { DeckCardType } from '@/stores/playerStore'
import { mapActionToDeckCardType } from '@/stores/playerStore'
import { Damages } from '../entities/Damages'
import type { State } from '../entities/State'

export interface RewardCardCandidate {
  id: string
  info: CardInfo
  deckType: DeckCardType | null
}

export interface ComputedBattleReward {
  hpHeal: number
  gold: number
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
    const gold = defeatedCount * 10 + newCards.length
    // HP 回復量は暫定定数。将来的にスコア式へ差し替える余地を残す。
    const hpHeal = 50
    return {
      hpHeal,
      gold,
      defeatedCount,
      cards: cardEntries.filter((entry): entry is RewardCardCandidate => Boolean(entry)),
    }
  }

  /** 手札・山札・捨て札・除外から [新規] タグ付きカードを抽出する。 */
  private collectNewCards(): Card[] {
    const piles = [
      ...this.battle.hand.list(),
      ...this.battle.deck.list(),
      ...this.battle.discardPile.list(),
      ...this.battle.exilePile.list(),
    ]
    return piles.filter((card) => card.hasTag(NEW_TAG_ID))
  }

  private toRewardCard(card: Card, index: number): RewardCardCandidate | null {
    const definition = card.definition
    const type = card.type
    if (!this.isSupportedCardType(type)) {
      return null
    }

    let description = card.description
    let descriptionSegments: DescriptionSegment[] | undefined
    let damageAmount: number | undefined
    let damageCount: number | undefined
    let attackStyle: CardInfo['attackStyle']

    const action = card.action
    if (action instanceof Attack) {
      const damages = action.baseDamages
      damageAmount = damages.baseAmount
      damageCount = damages.baseCount
      const formatted = action.describeForPlayerCard({
        baseDamages: damages,
        displayDamages: damages,
      })
      description = formatted.label
      descriptionSegments = formatted.segments
      attackStyle = damages.type === 'multi' ? 'multi' : 'single'
    }

    const cardInfo: CardInfo = {
      id: `reward-card-${card.id ?? index}`,
      title: card.title,
      type,
      cost: card.cost,
      illustration: definition.image ?? '🂠',
      description,
      descriptionSegments,
      attackStyle,
      damageAmount,
      damageCount,
      primaryTags: [],
      effectTags: this.toTagInfos(card.effectTags),
      categoryTags: this.toTagInfos(card.categoryTags),
      affordable: true,
      disabled: false,
    }

    const deckType = action ? mapActionToDeckCardType(action) : null

    return {
      id: cardInfo.id,
      info: cardInfo,
      deckType,
    }
  }

  private toTagInfos(tags?: { id?: string; name?: string; description?: string }[]): CardTagInfo[] {
    if (!tags) return []
    return tags
      .filter(
        (tag): tag is { id: string; name: string; description?: string } =>
          Boolean(tag.id) && Boolean(tag.name),
      )
      .map((tag) => ({ id: tag.id, label: tag.name, description: tag.description }))
  }

  private isSupportedCardType(type: CardInfo['type'] | string | undefined): type is CardInfo['type'] {
    return type === 'attack' || type === 'skill' || type === 'status' || type === 'skip'
  }
}
