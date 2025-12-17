/*
actionHintBuilders.ts の責務:
- Enemy の確定行動(Action)を EnemyActionHint へ要約する。攻撃/スキル/スキップごとに専用ビルダーで計算し、DamagePattern や付与ステータスを表示用フォーマットへ変換する。
- CardInfo の構築もここで集約し、View 側がカード定義を意識しなくて済むようにする。

責務ではないこと:
- Snapshot からの EssentialEnemyActionHint 構築や、チップViewModel化（それらは別モジュールが担当）。
*/
import type { Battle } from '@/domain/battle/Battle'
import type { Enemy } from '@/domain/entities/Enemy'
import { Attack, Action as BattleAction, AllyBuffSkill } from '@/domain/entities/Action'
import { Damages } from '@/domain/entities/Damages'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'
import { Card } from '@/domain/entities/Card'
import type { CardId } from '@/domain/library/Library'
import { buildCardInfoFromBlueprint, mapActionToCardId } from '@/domain/library/Library'
import type { State } from '@/domain/entities/State'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'
import type { EnemyActionHint } from '@/types/battle'

type SummarizeParams = {
  battle: Battle
  enemy: Enemy
  action: BattleAction
  enemyStates: State[]
  playerStates: State[]
}

export function summarizeEnemyAction(params: SummarizeParams): EnemyActionHint {
  const kind = classifyAction(params.action)
  switch (kind) {
    case 'skip':
      return buildSkipActionHint(params.action as SkipTurnAction)
    case 'attack':
      return buildAttackActionHint({
        enemy: params.enemy,
        action: params.action as Attack,
        enemyStates: params.enemyStates,
        playerStates: params.playerStates,
      })
    default:
      return buildSkillActionHint(params.battle, params.action)
  }
}

function classifyAction(action: BattleAction): 'skip' | 'attack' | 'skill' {
  if (action instanceof SkipTurnAction) return 'skip'
  if (action instanceof Attack) return 'attack'
  return 'skill'
}

function buildSkipActionHint(action: SkipTurnAction): EnemyActionHint {
  return {
    title: action.name,
    type: 'skip',
    icon: '',
    description: action.describe(),
  }
}

function buildAttackActionHint({
  enemy,
  action,
  enemyStates,
  playerStates,
}: {
  enemy: Enemy
  action: Attack
  enemyStates: State[]
  playerStates: State[]
}): EnemyActionHint {
  const damages = action.baseDamages
  const states = action.inflictStatePreviews
  const primaryState = states[0]
  const cardId = mapActionToCardId(action)

  const calculatedDamages = new Damages({
    baseAmount: damages.baseAmount,
    baseCount: damages.baseCount,
    type: damages.type,
    cardId: cardId ?? action.getCardId(),
    attackerStates: enemyStates,
    defenderStates: playerStates,
  })

  const calculatedPattern = {
    amount: calculatedDamages.amount,
    count: calculatedDamages.count,
    type: calculatedDamages.type,
  }
  const primaryStateStackable =
    primaryState && typeof primaryState.isStackable === 'function' ? primaryState.isStackable() : false

  const blueprint =
    cardId !== null
      ? {
          type: cardId,
          overrideAmount: calculatedPattern.amount,
          overrideCount: calculatedPattern.count,
        }
      : null

  return {
    title: action.name,
    type: 'attack',
    cardId: cardId ?? undefined,
    icon: '',
    pattern: {
      amount: damages.baseAmount,
      count: damages.baseCount,
      type: damages.type,
    },
    calculatedPattern,
    status: primaryState
      ? {
          name: primaryState.name,
          stackable: primaryStateStackable,
          magnitude: primaryStateStackable ? primaryState.magnitude ?? 0 : undefined,
          description: primaryState.description(),
          iconPath: primaryState.iconPath,
        }
      : undefined,
    description: action.describe(),
    cardInfo: resolveCardInfoForAction({
      enemy,
      action,
      cardId: cardId ?? undefined,
      blueprint,
    }),
  }
}

function buildSkillActionHint(battle: Battle, action: BattleAction): EnemyActionHint {
  const gainState = action.gainStatePreviews[0]
  const inflictState =
    'inflictStatePreviews' in action
      ? ((action as any).inflictStatePreviews?.[0] as import('@/domain/entities/State').State | undefined)
      : undefined
  let targetName: string | undefined
  if (action instanceof AllyBuffSkill) {
    const plannedTargetId = action.getPlannedTarget?.()
    if (plannedTargetId !== undefined) {
      const target = battle.enemyTeam.findEnemy(plannedTargetId)
      targetName = target?.name
    }
  }

  return {
    title: action.name,
    type: action.type,
    icon: '',
    description: action.describe(),
    targetName,
    selfState: gainState
      ? {
          name: gainState.name,
          stackable: typeof gainState.isStackable === 'function' ? gainState.isStackable() : false,
          magnitude:
            typeof gainState.isStackable === 'function' && gainState.isStackable()
              ? gainState.magnitude ?? 0
              : undefined,
          description: gainState.description(),
          iconPath: gainState.iconPath,
        }
      : undefined,
    status: inflictState
      ? {
          name: inflictState.name,
          stackable: typeof inflictState.isStackable === 'function' ? inflictState.isStackable() : false,
          magnitude:
            typeof inflictState.isStackable === 'function' && inflictState.isStackable()
              ? inflictState.magnitude ?? 0
              : undefined,
          description: inflictState.description(),
          iconPath: inflictState.iconPath,
        }
      : undefined,
  }
}

function resolveCardInfoForAction({
  enemy,
  action,
  cardId,
  blueprint,
}: {
  enemy: Enemy
  action: Attack
  cardId?: CardId
  blueprint: { type: CardId; overrideAmount: number; overrideCount: number } | null
}): EnemyActionHint['cardInfo'] {
  // 計算済みダメージをカードプレビューに反映し、エフェクトタグ表示と整合させる
  const cardInfo =
    (blueprint ? buildCardInfoFromBlueprint(blueprint, `enemy-action-${enemy.id}`) : null) ??
    buildCardInfoFromCard(new Card({ action }), {
      id: `enemy-action-${enemy.id}-${action.name}`,
      affordable: true,
      disabled: false,
    })

  return cardInfo ?? undefined
}
