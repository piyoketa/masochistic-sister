import type { EnemyActionHint } from '@/types/battle'
import type { EnemyActionChipViewModel, EnemyActionEffectSegment } from '@/types/enemyActionChip'
import type { CardTagInfo } from '@/types/battle'
import type { EssentialEnemyActionHint } from './enemyActionHintsForView'
import { buildEnemyActionDamageView } from './enemyActionDamageFormatter'

type FormatOptions = { includeTitle?: boolean }

/**
 * EssentialEnemyActionHint から EnemyActionChipViewModel へ変換する。
 * カードオーバーレイ用のCardInfoは含めず、必要な場合はEnemyActionChip.vue側でcardIdから組み立てる。
 */
export function formatEnemyActionChipsForView(
  enemyId: number,
  essentials: EssentialEnemyActionHint[],
  options: FormatOptions = {},
): EnemyActionChipViewModel[] {
  const includeTitle = options.includeTitle ?? false

  return essentials.map((essential, index) => {
    const hint = essential.hint
    const key = essential.key ?? `enemy-${enemyId}-action-${index}`
    const targetName = essential.targetName ?? hint.targetName

    if (hint.type === 'skip') {
      return {
        key,
        category: 'skip',
        title: hint.title,
        acted: essential.acted,
        skipReason: 'cannot-act',
        effects: [],
        targetName,
      }
    }

    const damage = buildEnemyActionDamageView(hint)
    const effects = buildEffectSegments(hint, targetName)
    const showOverlay = includeTitle || Boolean(hint.cardId)

    return {
      key,
      category: hint.type,
      title: hint.title,
      acted: essential.acted,
      targetName,
      hoverCardSource: hint.cardId ? { cardId: hint.cardId, show: showOverlay } : undefined,
      damage,
      effects,
    }
  })
}

function buildEffectSegments(hint: EnemyActionHint, targetName?: string): EnemyActionEffectSegment[] {
  const segments: EnemyActionEffectSegment[] = []

  segments.push(...buildEffectSegmentsFromTags(hint.cardInfo?.effectTags))

  if (hint.status) {
    segments.push(
      toStateEffectSegment({
        name: hint.status.name,
        iconPath: hint.status.iconPath,
        tooltip: hint.status.description ?? '',
        stackable: hint.status.stackable,
        magnitude: hint.status.stackable ? hint.status.magnitude : undefined,
        target: resolveStatusTarget(hint, targetName),
        targetName: resolveStatusTarget(hint, targetName) === 'ally' ? targetName : undefined,
      }),
    )
  }

  if (hint.selfState) {
    segments.push(
      toStateEffectSegment({
        name: hint.selfState.name,
        iconPath: hint.selfState.iconPath,
        tooltip: hint.selfState.description ?? '',
        stackable: hint.selfState.stackable,
        magnitude: hint.selfState.stackable ? hint.selfState.magnitude : undefined,
        target: 'self',
      }),
    )
  }

  return segments
}

function buildEffectSegmentsFromTags(tags?: CardTagInfo[]): EnemyActionEffectSegment[] {
  if (!tags || tags.length === 0) {
    return []
  }
  return tags.map<EnemyActionEffectSegment>((tag) => ({
    kind: 'card-effect-tag',
    label: tag.label,
    iconPath: tag.iconPath,
    tooltip: tag.description ?? '',
  }))
}

function toStateEffectSegment(entry: {
  name: string
  iconPath?: string
  tooltip: string
  stackable: boolean
  magnitude?: number
  target: 'self' | 'player' | 'ally'
  targetName?: string
}): EnemyActionEffectSegment {
  return {
    kind: 'state',
    label: entry.name,
    iconPath: entry.iconPath,
    tooltip: entry.tooltip,
    stackable: entry.stackable,
    magnitude: entry.magnitude,
    target: entry.target,
    targetName: entry.targetName,
  }
}

function resolveStatusTarget(hint: EnemyActionHint, targetName?: string): 'self' | 'player' | 'ally' {
  if (hint.type === 'attack') {
    return 'player'
  }
  if (hint.type === 'skill' && targetName) {
    return 'ally'
  }
  return 'player'
}
