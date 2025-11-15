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

export interface HandEntry {
  key: string
  info: CardInfo
  card: Card
  id?: number
  operations: string[]
  affordable: boolean
}

export interface UseHandPresentationOptions {
  props: {
    snapshot: BattleSnapshot | undefined
    hoveredEnemyId: number | null
    viewManager: ViewManager
  }
  interactionState: { selectedCardKey: string | null }
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

  const {
    description,
    descriptionSegments,
    attackStyle,
    primaryTags,
    effectTags,
    categoryTags,
    damageAmount,
    damageCount,
    damageAmountBoosted,
    damageCountBoosted,
  } = buildCardPresentation(options, card, index)

  return {
    key: identifier,
    info: {
      id: identifier,
      title: card.title,
      type: card.type,
      cost: card.cost,
      illustration: definition.image ?? '🂠',
      description,
      descriptionSegments,
      attackStyle,
      primaryTags,
      effectTags,
      categoryTags,
      damageAmount,
      damageCount,
      damageAmountBoosted,
      damageCountBoosted,
    },
    card,
    id: card.id,
    operations,
    affordable,
  }
}

function buildCardPresentation(options: UseHandPresentationOptions, card: Card, index: number): {
  description: string
  descriptionSegments?: DescriptionSegment[]
  attackStyle?: AttackStyle
  primaryTags: CardTagInfo[]
  effectTags: CardTagInfo[]
  categoryTags: CardTagInfo[]
  damageAmount?: number
  damageCount?: number
  damageAmountBoosted?: boolean
  damageCountBoosted?: boolean
} {
  const definition = card.definition
  const primaryTags: CardTagInfo[] = []
  const effectTags: CardTagInfo[] = []
  const categoryTags: CardTagInfo[] = []
  const seenTagIds = new Set<string>()

  let description = card.description
  let descriptionSegments: DescriptionSegment[] | undefined
  let attackStyle: AttackStyle | undefined
  let damageAmount: number | undefined
  let damageCount: number | undefined
  let damageAmountBoosted = false
  let damageCountBoosted = false

  addTagEntry(definition.type, primaryTags, seenTagIds, (tag) => tag.name)
  if ('target' in definition) {
    addTagEntry(definition.target, primaryTags, seenTagIds, (tag) => tag.name)
  }
  addTagEntries(effectTags, card.effectTags)
  addTagEntries(categoryTags, card.categoryTags, (tag) => tag.name)

  const action = card.action
  const battle = options.props.viewManager.battle

  if (action instanceof Attack) {
    const damages = action.baseDamages
    const baseDamageAmount = Math.max(0, Math.floor(damages.baseAmount))
    const baseDamageCount = Math.max(1, Math.floor(damages.baseCount ?? 1))
    damageAmount = baseDamageAmount
    damageCount = baseDamageCount
    const formatted = action.describeForPlayerCard({
      baseDamages: damages,
      displayDamages: damages,
      inflictedStates: action.inflictStatePreviews,
    })
    ;({ label: description, segments: descriptionSegments } = stripDamageInfoFromDescription(formatted))
    const applyDamageDisplay = (displayDamages: Damages): void => {
      const nextAmount = Math.max(0, Math.floor(displayDamages.amount))
      const nextCount = Math.max(1, Math.floor(displayDamages.count ?? 1))
      damageAmount = nextAmount
      damageCount = nextCount
      damageAmountBoosted = nextAmount !== baseDamageAmount
      damageCountBoosted = nextCount !== baseDamageCount
    }
    applyDamageDisplay(damages)

    const targetEnemyId = options.props.hoveredEnemyId
    if (battle && options.interactionState.selectedCardKey === `card-${card.id ?? index}` && targetEnemyId !== null) {
      const enemy = battle.enemyTeam.findEnemy(targetEnemyId) as Enemy | undefined
      if (enemy) {
        const calculatedDamages = new Damages({
          baseAmount: damages.baseAmount,
          baseCount: damages.baseCount,
          type: damages.type,
          attackerStates: battle.player.getStates(),
          defenderStates: enemy.getStates(),
        })
        const recalculated = action.describeForPlayerCard({
          baseDamages: damages,
          displayDamages: calculatedDamages,
          inflictedStates: action.inflictStatePreviews,
        })
        ;({ label: description, segments: descriptionSegments } = stripDamageInfoFromDescription(recalculated))
        applyDamageDisplay(calculatedDamages)
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
  }

  return {
    description,
    descriptionSegments,
    attackStyle,
    primaryTags,
    effectTags,
    categoryTags,
    damageAmount,
    damageCount,
    damageAmountBoosted,
    damageCountBoosted,
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
