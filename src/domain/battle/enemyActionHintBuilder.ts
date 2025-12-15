import type { EnemyActionHint, StateSnapshot } from '@/types/battle'
import type { Battle, BattleTurn } from './Battle'
import type { Enemy } from '../entities/Enemy'
import { Attack, Action as BattleAction, AllyBuffSkill } from '../entities/Action'
import { Damages } from '../entities/Damages'
import { SkipTurnAction } from '../entities/actions/SkipTurnAction'
import { Card } from '../entities/Card'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'
import { buildCardInfoFromBlueprint, mapActionToCardId } from '../library/Library'
import type { State } from '../entities/State'
import { instantiateStateFromSnapshot } from '../entities/states'

const DEBUG_ENEMY_ACTED =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEBUG_ENEMY_ACTED === 'true') ||
  (typeof process !== 'undefined' && process.env?.VITE_DEBUG_ENEMY_ACTED === 'true')

type EnemyActionHintParams = {
  battle: Battle
  enemy: Enemy
  turnPosition: BattleTurn
  enemyStateSnapshots?: StateSnapshot[]
  playerStateSnapshots?: StateSnapshot[]
}

export function buildEnemyActionHints(params: EnemyActionHintParams): EnemyActionHint[] {
  const { battle, enemy, turnPosition, enemyStateSnapshots, playerStateSnapshots } = params
  const nextAction = enemy.confirmActionForTurn(turnPosition.turn)
  if (!nextAction) {
    return []
  }
  const hint = summarizeEnemyAction({
    battle,
    enemy,
    action: nextAction,
    enemyStates: reviveStates(enemyStateSnapshots, `enemy:${enemy.id ?? enemy.name}`),
    playerStates: reviveStates(playerStateSnapshots, 'player'),
  })
  const acted = enemy.hasActedThisTurn
  if (DEBUG_ENEMY_ACTED) {
    // eslint-disable-next-line no-console
    console.log('[Hint] acted flag', {
      enemy: enemy.name,
      id: enemy.id,
      acted,
      turn: turnPosition.turn,
      side: turnPosition.activeSide,
    })
  }
  return [
    {
      ...hint,
      acted,
    },
  ]
}

function summarizeEnemyAction({
  battle,
  enemy,
  action,
  enemyStates,
  playerStates,
}: {
  battle: Battle
  enemy: Enemy
  action: BattleAction
  enemyStates: State[]
  playerStates: State[]
}): EnemyActionHint {
  if (action instanceof SkipTurnAction) {
    return {
      title: action.name,
      type: 'skip',
      icon: '',
      description: action.describe(),
    }
  }

  if (action instanceof Attack) {
    return buildAttackActionHint({ battle, enemy, action, enemyStates, playerStates })
  }

  return buildSkillActionHint(battle, action)
}

function buildAttackActionHint({
  battle,
  enemy,
  action,
  enemyStates,
  playerStates,
}: {
  battle: Battle
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
    cardInfo:
      (blueprint ? buildCardInfoFromBlueprint(blueprint, `enemy-action-${enemy.id}`) : null) ??
      (buildCardInfoFromCard(new Card({ action }), {
        id: `enemy-action-${enemy.id}-${action.name}`,
        affordable: true,
        disabled: false,
      }) ?? undefined),
  }
}

function buildSkillActionHint(battle: Battle, action: BattleAction): EnemyActionHint {
  const gainState = action.gainStatePreviews[0]
  const inflictState = 'inflictStatePreviews' in action ? (action as any).inflictStatePreviews?.[0] as import('../entities/State').State | undefined : undefined
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

function reviveStates(snapshots: StateSnapshot[] | undefined, contextLabel: string): State[] {
  if (!snapshots) {
    throw new Error(`[EnemyActionHint] State snapshots missing for ${contextLabel}`)
  }
  const revived = snapshots
    .map((snapshot) => instantiateStateFromSnapshot(snapshot))
    .filter((state): state is State => Boolean(state))
  if (snapshots.length > 0 && revived.length === 0) {
    const snapshotIds = snapshots.map((s) => s.id ?? 'undefined').join(', ')
    // デバッグ用: どのスナップショットが復元できなかったかを明示しておく
    // eslint-disable-next-line no-console
    console.error('[EnemyActionHint] reviveStates failed', { contextLabel, snapshots })
    throw new Error(
      `[EnemyActionHint] No states could be revived from snapshots for ${contextLabel}. ids=[${snapshotIds}]`,
    )
  }
  return revived
}
