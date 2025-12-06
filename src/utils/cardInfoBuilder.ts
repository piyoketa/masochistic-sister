import type { Card } from '@/domain/entities/Card'
import { Attack } from '@/domain/entities/Action'
import type { CardDefinition } from '@/domain/entities/CardDefinition'
import type { CardTag } from '@/domain/entities/CardTag'
import type { DamagePattern } from '@/domain/entities/Damages'
import type {
  AttackStyle,
  CardInfo,
  CardTagInfo,
  DescriptionSegment,
  SkillCardInfo,
  StatusCardInfo,
} from '@/types/battle'

/**
 * Card から UI 表示用の CardInfo を構築する共通ヘルパー。
 * - 攻撃カードは damageAmount/Count と descriptionSegments を必須で埋める。
 * - スキル/状態異常は description を必須で埋める。
 * - skip は最小情報のみ。
 */
export function buildCardInfoFromCard(
  card: Card,
  options?: {
    id?: string
    affordable?: boolean
    disabled?: boolean
    costContext?: import('@/domain/entities/Action/ActionBase').ActionCostContext
  },
): CardInfo | null {
  if (!isSupportedCardType(card.type)) {
    return null
  }

  const definition = card.definition
  const primaryTags: CardTagInfo[] = []
  const effectTags = toTagInfos(card.effectTags)
  const categoryTags = toTagInfos(card.categoryTags, (tag) => tag.name ?? tag.id ?? '')
  const seenTagIds = new Set<string>()

  // 状態異常カードは「種別/ターゲット」をヘッダに表示しない方針のため primaryTags を空にする
  if (card.type !== 'status') {
    addPrimaryTags(definition, primaryTags, seenTagIds)
  }

  const cost =
    options?.costContext !== undefined ? card.calculateCost(options.costContext) : card.cost
  const subtitle = resolveSubtitle(card)

  const baseInfo = {
    id: options?.id ?? `card-${card.id ?? 'unknown'}`,
    title: card.title,
    cost,
    subtitle,
    primaryTags,
    categoryTags,
    affordable: options?.affordable,
    disabled: options?.disabled,
  }

  const action = card.action
  if (action instanceof Attack) {
    const damages = action.baseDamages
    const style = deriveAttackStyle(definition, damages.type)
    const segments =
      action.describeForPlayerCard({
        baseDamages: damages,
        displayDamages: damages,
      }).segments ?? []

    return style === 'multi'
      ? {
          ...baseInfo,
          type: 'attack',
          attackStyle: 'multi',
          damageAmount: damages.baseAmount,
          damageCount: damages.baseCount ?? 1,
          effectTags,
          descriptionSegments: segments,
        }
      : {
          ...baseInfo,
          type: 'attack',
          attackStyle: 'single',
          damageAmount: damages.baseAmount,
          effectTags,
          descriptionSegments: segments,
        }
  }

  if (card.type === 'skill') {
    const skill: SkillCardInfo = {
      ...baseInfo,
      type: 'skill',
      description: card.description,
      effectTags: effectTags.length ? effectTags : undefined,
    }
    return skill
  }

  if (card.type === 'status') {
    const status: StatusCardInfo = {
      ...baseInfo,
      type: 'status',
      description: card.description,
      effectTags: effectTags.length ? effectTags : undefined,
    }
    return status
  }

  return {
    ...baseInfo,
    type: 'skip',
  }
}

function addPrimaryTags(
  definition: CardDefinition,
  entries: CardTagInfo[],
  registry: Set<string>,
): void {
  addTagEntry(definition.type, entries, registry, (tag) => tag.name ?? tag.id)
  if ('target' in definition) {
    addTagEntry(definition.target, entries, registry, (tag) => tag.name ?? tag.id)
  }
}

function addTagEntry(
  tag: CardTag | undefined,
  entries: CardTagInfo[],
  registry: Set<string>,
  formatter: (tag: CardTag) => string,
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

function toTagInfos(
  tags?: readonly { id?: string; name?: string; description?: string }[],
  formatter: (tag: { id?: string; name?: string; description?: string }) => string = (tag) =>
    tag.name ?? tag.id ?? '',
): CardTagInfo[] {
  if (!tags) return []
  return tags
    .filter((tag): tag is { id: string; name?: string; description?: string } => Boolean(tag.id))
    .map((tag) => ({ id: tag.id, label: formatter(tag), description: tag.description }))
}

function deriveAttackStyle(definition: CardDefinition, pattern?: DamagePattern): AttackStyle {
  const typeId = definition.type.id
  if (typeId === 'tag-type-multi-attack') {
    return 'multi'
  }
  if (typeId === 'tag-type-single-attack') {
    return 'single'
  }
  return pattern === 'multi' ? 'multi' : 'single'
}

function isSupportedCardType(type: CardInfo['type'] | string | undefined): type is CardInfo['type'] {
  return type === 'attack' || type === 'skill' || type === 'status' || type === 'skip'
}

function resolveSubtitle(card: Card): string | undefined {
  if (card.type === 'attack') {
    return '被虐の記憶'
  }
  if (card.type === 'status') {
    return '状態異常'
  }
  if (card.type === 'skill') {
    return normalizeSubtitle((card.definition as CardDefinition | undefined)?.subtitle)
  }
  return normalizeSubtitle((card.definition as CardDefinition | undefined)?.subtitle)
}

function normalizeSubtitle(value?: string): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}
