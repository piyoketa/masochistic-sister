import type { Card } from '@/domain/entities/Card'
import { Attack } from '@/domain/entities/Action'
import type { CardDefinition } from '@/domain/entities/CardDefinition'
import { CardDestinationTag, type CardTag } from '@/domain/entities/CardTag'
import type { DamagePattern } from '@/domain/entities/Damages'
import type { Battle } from '@/domain/battle/Battle'
import type { Player } from '@/domain/entities/Player'
import type { Enemy } from '@/domain/entities/Enemy'
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
    activeContext?: CardActiveContext
  },
): CardInfo | null {
  if (!isSupportedCardType(card.type)) {
    return null
  }

  const definition = card.definition
  const primaryTags: CardTagInfo[] = []
  const destinationTags = toTagInfos(
    (card.effectTags ?? []).filter((tag): tag is CardTag & CardDestinationTag => tag instanceof CardDestinationTag),
  )
  const effectTags = toTagInfos(
    (card.effectTags ?? []).filter((tag): tag is CardTag => !(tag instanceof CardDestinationTag)),
  )
  const categoryTags = toTagInfos(card.categoryTags, (tag) => tag.name ?? tag.id ?? '')
  const seenTagIds = new Set<string>()
  const subtitle = resolveSubtitle(card)
  const active = resolveIsActive(
    card,
    options?.activeContext ?? toActiveContextFromCost(options?.costContext),
  )

  // 状態異常カードは「種別/ターゲット」をヘッダに表示しない方針のため primaryTags を空にする
  if (card.type !== 'status') {
    addPrimaryTags(definition, primaryTags, seenTagIds)
  }

  const cost =
    options?.costContext !== undefined ? card.calculateCost(options.costContext) : (card as any).runtimeCost ?? card.cost
  const baseInfo = {
    id: options?.id ?? `card-${card.id ?? 'unknown'}`,
    title: card.title,
    cost,
    subtitle,
    primaryTags,
    categoryTags,
    affordable: options?.affordable,
    disabled: options?.disabled ?? !active,
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
          destinationTags: destinationTags.length ? destinationTags : undefined,
          descriptionSegments: segments,
        }
      : {
          ...baseInfo,
          type: 'attack',
          attackStyle: 'single',
          damageAmount: damages.baseAmount,
          effectTags,
          destinationTags: destinationTags.length ? destinationTags : undefined,
          descriptionSegments: segments,
        }
  }

  if (card.type === 'skill') {
    const skill: SkillCardInfo = {
      ...baseInfo,
      type: 'skill',
      description: card.description,
      effectTags: effectTags.length ? effectTags : undefined,
      destinationTags: destinationTags.length ? destinationTags : undefined,
    }
    return skill
  }

  if (card.type === 'status') {
    const status: StatusCardInfo = {
      ...baseInfo,
      type: 'status',
      description: card.description,
      effectTags: effectTags.length ? effectTags : undefined,
      destinationTags: destinationTags.length ? destinationTags : undefined,
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
    // CardEffectTag などで指定されたアイコンを UI 側へ渡す
    iconPath: (tag as any).iconPath,
  })
}

function toTagInfos(
  tags?: readonly { id?: string; name?: string; description?: string }[],
  formatter: (tag: { id?: string; name?: string; description?: string; iconPath?: string }) => string = (tag) =>
    tag.name ?? tag.id ?? '',
): CardTagInfo[] {
  if (!tags) return []
  return tags
    .filter((tag): tag is { id: string; name?: string; description?: string; iconPath?: string } => Boolean(tag.id))
    .map((tag) => ({
      id: tag.id,
      label: formatter(tag),
      description: tag.description,
      iconPath: (tag as any).iconPath,
    }))
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

export type CardActiveContext = {
  battle?: Battle
  source?: Player | Enemy
  cardTags?: CardTag[]
}

/**
 * Action.isActive を呼び出して発動可否を判定する共通ヘルパー。
 * battle が無い場合は常に true を返し、UI 側のプレイ不可判定に利用する。
 */
export function resolveIsActive(card: Card, context?: CardActiveContext): boolean {
  const action = card.action
  if (!action || typeof (action as any).isActive !== 'function') {
    return true
  }
  const runtimeProp = (card as any).runtimeActive
  if (runtimeProp !== undefined) {
    return Boolean(runtimeProp)
  }
  const runtime = card.getRuntimeActive?.()
  if (runtime !== undefined) {
    return runtime
  }
  if (!context?.battle) {
    return true
  }
  return (action as any).isActive({
    battle: context.battle,
    source: context.source,
    cardTags: context.cardTags ?? card.cardTags ?? [],
  })
}

function toActiveContextFromCost(
  context?: import('@/domain/entities/Action/ActionBase').ActionCostContext,
): CardActiveContext | undefined {
  if (!context) {
    return undefined
  }
  return {
    battle: context.battle,
    source: context.source,
    cardTags: context.cardTags,
  }
}
