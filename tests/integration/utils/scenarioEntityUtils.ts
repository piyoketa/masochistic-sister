import type { Battle } from '@/domain/battle/Battle'
import type { Card } from '@/domain/entities/Card'

type BattleSnapshot = Awaited<ReturnType<Battle['getSnapshot']>>

export function requireCardId(
  card: (Card | undefined) & { idValue?: number },
  context?: string,
): number {
  const id = card?.id ?? card?.idValue
  if (id === undefined) {
    throw new Error(context ? `${context} のカードIDが取得できません` : 'Card missing repository id')
  }
  return id
}

export function requireEnemyId(enemies: BattleSnapshot['enemies'], name: string): number {
  const enemy = enemies.find((candidate) => candidate.name === name)
  if (!enemy) {
    throw new Error(`Enemy ${name} not found in snapshot`)
  }
  return enemy.id
}

export function collectCardIdsByTitle(
  deck: BattleSnapshot['deck'],
  title: string,
): number[] {
  return deck.filter((card) => card.title === title).map((card) => requireCardId(card, title))
}

export function findMemoryCardId(battle: Battle, title: string): number {
  const inHand = battle.hand
    .list()
    .find(
      (card) =>
        card.title === title &&
        (card.cardTags ?? []).some((tag) => tag.id === 'tag-memory'),
    )
  if (inHand) {
    return requireCardId(inHand, `${title} memory hand`)
  }
  const fallback = battle.cardRepository.find(
    (card) =>
      card.title === title && (card.cardTags ?? []).some((tag) => tag.id === 'tag-memory'),
  )
  if (!fallback) {
    throw new Error(`${title} の記憶カードが見つかりません`)
  }
  return requireCardId(fallback, `${title} memory repo`)
}

export function findStatusCardId(battle: Battle, title: string): number {
  const card = battle.hand
    .list()
    .find(
      (candidate) =>
        candidate.title === title &&
        (candidate.definition.cardType === 'status' || candidate.state !== undefined),
    )
  if (card) {
    return requireCardId(card, `${title} status hand`)
  }
  const fallback = battle.cardRepository.find(
    (candidate) =>
      candidate.title === title &&
      (candidate.definition.cardType === 'status' || candidate.state !== undefined),
  )
  if (!fallback) {
    throw new Error(`${title} の状態カードが見つかりません`)
  }
  return requireCardId(fallback, `${title} status repo`)
}
