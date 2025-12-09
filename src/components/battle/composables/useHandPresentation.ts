import { computed } from 'vue'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { Card } from '@/domain/entities/Card'
import { Attack } from '@/domain/entities/Action'
import { Damages } from '@/domain/entities/Damages'
import type { Enemy } from '@/domain/entities/Enemy'
import type { ViewManager } from '@/view/ViewManager'
import type { CardTag } from '@/domain/entities/CardTag'
import type { CardInfo, CardTagInfo, AttackStyle, DescriptionSegment } from '@/types/battle'
import type { OperationContext } from '@/domain/entities/operations'
import { resolveIsActive } from '@/utils/cardInfoBuilder'

export interface HandEntry {
  key: string
  info: CardInfo
  card: Card
  id?: number
  operations: string[]
  affordable: boolean
  disabled: boolean
}

export interface UseHandPresentationOptions {
  props: {
    snapshot: BattleSnapshot | undefined
    hoveredEnemyId: number | null
    viewManager: ViewManager
  }
  interactionState: { selectedCardKey: string | null; isAwaitingEnemy: boolean }
}

export function useHandPresentation(options: UseHandPresentationOptions) {
  const handEntries = computed<HandEntry[]>(() => {
    const current = options.props.snapshot
    if (!current) {
      return []
    }

    const currentMana = current.player.currentMana
    const entries = current.hand.map((card, index) => buildHandEntry(options, card, index, currentMana))
    const regularCards = entries.filter((entry) => entry.card.type !== 'status')
    const statusCards = entries.filter((entry) => entry.card.type === 'status')
    return [...regularCards, ...statusCards]
  })

  const cardTitleMap = computed(() => {
    const map = new Map<number, string>()
    handEntries.value.forEach((entry) => {
      if (entry.id !== undefined) {
        map.set(entry.id, entry.info.title)
      }
    })
    return map
  })

  function buildOperationContext(): OperationContext | null {
    const battle = options.props.viewManager.battle
    if (!battle) {
      return null
    }
    return {
      battle,
      player: battle.player,
    }
  }

  function findHandEntryByCardId(cardId: number | undefined): HandEntry | undefined {
    if (cardId === undefined) {
      return undefined
    }
    return handEntries.value.find((entry) => entry.id === cardId)
  }

  return {
    handEntries,
    cardTitleMap,
    buildOperationContext,
    findHandEntryByCardId,
  }
}

function buildHandEntry(
  options: UseHandPresentationOptions,
  card: Card,
  index: number,
  currentMana: number,
): HandEntry {
  const definition = card.definition
  const identifier = card.id !== undefined ? `card-${card.id}` : `card-${index}`
  const operations = definition.operations ?? []
  const affordable = card.cost <= currentMana

  const presentation = buildCardPresentation(options, card, index)

  return {
    key: identifier,
    info: presentation,
    card,
    id: card.id,
    operations,
    affordable,
    disabled: presentation.disabled ?? false,
  }
}

function buildCardPresentation(options: UseHandPresentationOptions, card: Card, index: number): CardInfo {
  const definition = card.definition
  const primaryTags: CardTagInfo[] = []
  const effectTags: CardTagInfo[] = []
  const categoryTags: CardTagInfo[] = []
  const seenTagIds = new Set<string>()
  const subtitle = resolveSubtitle(card)
  const active = resolveIsActive(card, {
    battle: options.props.viewManager.battle ?? undefined,
    source: options.props.viewManager.battle?.player,
    cardTags: card.cardTags ?? [],
  })

  let description = card.description
  let descriptionSegments: DescriptionSegment[] = []
  let attackStyle: AttackStyle | undefined
  let damageAmount: number | undefined
  let damageCount: number | undefined
  let damageAmountBoosted = false
  let damageCountBoosted = false
  let damageAmountReduced = false
  let damageCountReduced = false

  if (card.type !== 'status') {
    addTagEntry(definition.type, primaryTags, seenTagIds, (tag) => tag.name)
    if ('target' in definition) {
      addTagEntry(definition.target, primaryTags, seenTagIds, (tag) => tag.name)
    }
  }
  addTagEntries(effectTags, card.effectTags)
  addTagEntries(categoryTags, card.categoryTags, (tag) => tag.name)

  const action = card.action
  const battle = options.props.viewManager.battle

  if (action instanceof Attack) {
    const damages = action.baseDamages
    const baseDamageAmount = Math.max(0, Math.floor(damages.baseAmount))
    const baseDamageCount = Math.max(1, Math.floor(damages.baseCount ?? 1))
    // 表示用ダメージを段階的に計算する: 通常は素の値、敵選択待ちでプレイヤーState、敵ホバーで敵Stateも反映
    const identifier = card.id !== undefined ? `card-${card.id}` : `card-${index}`
    const isSelectedCard = options.interactionState.selectedCardKey === identifier
    const shouldApplyPlayerStates = isSelectedCard && options.interactionState.isAwaitingEnemy
    const shouldApplyEnemyStates =
      shouldApplyPlayerStates && options.props.hoveredEnemyId !== null && battle !== undefined
    const applyDamageDisplay = (displayDamages: Damages): void => {
      const nextAmount = Math.max(0, Math.floor(displayDamages.amount))
      const nextCount = Math.max(0, Math.floor(displayDamages.count ?? 0))
      damageAmount = nextAmount
      damageCount = nextCount
      damageAmountBoosted = nextAmount > baseDamageAmount
      damageCountBoosted = nextCount > baseDamageCount
      damageAmountReduced = nextAmount < baseDamageAmount
      damageCountReduced = nextCount < baseDamageCount
    }

    // 1. 基本表示（補正なし）
    const cardId = action.getCardId()
    const baseDisplay = new Damages({
      baseAmount: damages.baseAmount,
      baseCount: damages.baseCount,
      type: damages.type,
      cardId,
    })
    let formatted = action.describeForPlayerCard({
      baseDamages: damages,
      displayDamages: baseDisplay,
      inflictedStates: action.inflictStatePreviews,
    })
    ;({ label: description, segments: descriptionSegments } = stripDamageInfoFromDescription(formatted))
    applyDamageDisplay(baseDisplay)

    // 2. 敵選択待ちに入ったらプレイヤーStateを適用
    if (battle && shouldApplyPlayerStates) {
      const playerStates = battle.player.getStates(battle)
      const playerAdjusted = new Damages({
        baseAmount: damages.baseAmount,
        baseCount: damages.baseCount,
        type: damages.type,
        cardId,
        attackerStates: playerStates,
        defenderStates: [],
      })
      formatted = action.describeForPlayerCard({
        baseDamages: damages,
        displayDamages: playerAdjusted,
        inflictedStates: action.inflictStatePreviews,
      })
      ;({ label: description, segments: descriptionSegments } = stripDamageInfoFromDescription(formatted))
      applyDamageDisplay(playerAdjusted)

      // 3. 敵ホバー時は敵Stateも加算
      if (shouldApplyEnemyStates) {
        const targetEnemyId = options.props.hoveredEnemyId
        const enemy =
          typeof targetEnemyId === 'number' ? (battle.enemyTeam.findEnemy(targetEnemyId) as Enemy | undefined) : undefined
        if (enemy) {
          const enemyAdjusted = new Damages({
            baseAmount: damages.baseAmount,
            baseCount: damages.baseCount,
            type: damages.type,
            cardId,
            attackerStates: playerStates,
            defenderStates: enemy.getStates(),
          })
          formatted = action.describeForPlayerCard({
            baseDamages: damages,
            displayDamages: enemyAdjusted,
            inflictedStates: action.inflictStatePreviews,
          })
          ;({ label: description, segments: descriptionSegments } = stripDamageInfoFromDescription(formatted))
          applyDamageDisplay(enemyAdjusted)
        }
      }
    }

    const typeTagId = definition.type.id
    if (typeTagId === 'tag-type-multi-attack') {
      attackStyle = 'multi'
    } else if (typeTagId === 'tag-type-single-attack') {
      attackStyle = 'single'
    } else {
      attackStyle = damages.type === 'multi' ? 'multi' : 'single'
    }
    if (!attackStyle) {
      attackStyle = 'single'
    }
  }

  const baseInfo = {
    id: card.id !== undefined ? `card-${card.id}` : `card-${index}`,
    title: card.title,
    subtitle,
    cost: card.cost,
    primaryTags,
    categoryTags,
    descriptionSegments,
    damageAmountReduced,
    damageCountReduced,
    damageAmountBoosted,
    damageCountBoosted,
    disabled: !active,
    affordable: card.cost <= (options.props.snapshot?.player.currentMana ?? card.cost),
  }

  if (card.type === 'attack') {
    const style: AttackStyle = attackStyle ?? 'single'
    const safeDamageAmount = damageAmount ?? 0
    const safeDamageCount = Math.max(0, damageCount ?? 0)
    if (style === 'multi') {
      return {
        ...baseInfo,
        type: 'attack',
        attackStyle: 'multi',
        damageAmount: safeDamageAmount,
        damageCount: safeDamageCount,
        damageAmountReduced,
        damageCountReduced,
        effectTags,
        descriptionSegments,
        damageAmountBoosted,
        damageCountBoosted,
      }
    }
    return {
      ...baseInfo,
      type: 'attack',
      attackStyle: 'single',
      damageAmount: safeDamageAmount,
      damageAmountReduced,
      effectTags,
      descriptionSegments,
      damageAmountBoosted,
    }
  }

  if (card.type === 'skill') {
    return {
      ...baseInfo,
      type: 'skill',
      description,
      effectTags: effectTags.length ? effectTags : undefined,
    }
  }

  if (card.type === 'status') {
    return {
      ...baseInfo,
      type: 'status',
      description,
      effectTags: effectTags.length ? effectTags : undefined,
    }
  }

  return {
    ...baseInfo,
    type: 'skip',
  }
}

function addTagEntry(
  tag: CardTag | undefined,
  entries: CardTagInfo[],
  registry: Set<string>,
  formatter: (tag: CardTag) => string = (candidate) => candidate.name,
): void {
  if (!tag || registry.has(tag.id)) {
    return
  }
  registry.add(tag.id)
  entries.push({
    id: tag.id,
    label: formatter(tag),
    description: tag.description,
  })
}

function addTagEntries(
  entries: CardTagInfo[],
  tags?: readonly CardTag[],
  formatter: (tag: CardTag) => string = (candidate) => candidate.name,
): void {
  if (!tags) {
    return
  }
  for (const tag of tags) {
    if (entries.some((existing) => existing.id === tag.id)) {
      continue
    }
    entries.push({
      id: tag.id,
      label: formatter(tag),
      description: tag.description,
    })
  }
}

function stripDamageInfoFromDescription(formatted: {
  label: string
  segments: DescriptionSegment[]
}): { label: string; segments: DescriptionSegment[] } {
  const trimmed = trimDamageSegments(formatted.segments)
  return {
    label: trimmed.map((segment) => segment.text).join(''),
    segments: trimmed,
  }
}

function trimDamageSegments(segments: DescriptionSegment[]): DescriptionSegment[] {
  const damageLabelIndex = segments.findIndex((segment) => segment.text === 'ダメージ')
  if (damageLabelIndex === -1) {
    return [...segments]
  }
  let trimmed = segments.slice(damageLabelIndex + 1)
  while (trimmed.length > 0 && trimmed[0]?.text === '\n') {
    trimmed = trimmed.slice(1)
  }
  return trimmed
}

function resolveSubtitle(card: Card): string | undefined {
  if (card.type === 'attack') {
    return '被虐の記憶'
  }
  if (card.type === 'status') {
    return '状態異常'
  }
  if (card.type === 'skill') {
    return normalizeSubtitle((card.definition as any)?.subtitle)
  }
  return normalizeSubtitle((card.definition as any)?.subtitle)
}

function normalizeSubtitle(value?: string): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}
