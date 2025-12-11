import type { EnemyActionHint } from '@/types/battle'
import type { Battle } from './Battle'
import type { Enemy } from '../entities/Enemy'
import { Attack, Action as BattleAction, AllyBuffSkill } from '../entities/Action'
import { Damages } from '../entities/Damages'
import { SkipTurnAction } from '../entities/actions/SkipTurnAction'
import { Card } from '../entities/Card'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'
import { buildCardInfoFromBlueprint, mapActionToCardId } from '../library/Library'

export function buildEnemyActionHints(battle: Battle, enemy: Enemy): EnemyActionHint[] {
  const planned = enemy.plannedActionsForDisplay
  if (!planned || planned.length === 0) {
    return []
  }

  const [nextAction] = planned
  if (!nextAction) {
    return []
  }

  const hint = summarizeEnemyAction(battle, enemy, nextAction)
  return [
    {
      ...hint,
      acted: enemy.hasActedThisTurn,
    },
  ]
}

function summarizeEnemyAction(battle: Battle, enemy: Enemy, action: BattleAction): EnemyActionHint {
  if (action instanceof SkipTurnAction) {
    return {
      title: action.name,
      type: 'skip',
      icon: '',
      description: action.describe(),
    }
  }

  if (action instanceof Attack) {
    return buildAttackActionHint(battle, enemy, action)
  }

  return buildSkillActionHint(battle, action)
}

function buildAttackActionHint(battle: Battle, enemy: Enemy, action: Attack): EnemyActionHint {
  const damages = action.baseDamages
  const states = action.inflictStatePreviews
  const primaryState = states[0]
  const cardId = mapActionToCardId(action)

  const calculatedDamages = new Damages({
    baseAmount: damages.baseAmount,
    baseCount: damages.baseCount,
    type: damages.type,
    cardId: cardId ?? action.getCardId(),
    attackerStates: enemy.getStates(),
    defenderStates: battle.player.getStates(battle),
  })

  const calculatedPattern = {
    amount: calculatedDamages.amount,
    count: calculatedDamages.count,
    type: calculatedDamages.type,
  }

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
          magnitude: primaryState.magnitude ?? 1,
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
          magnitude: gainState.magnitude ?? 1,
          description: gainState.description(),
          iconPath: gainState.iconPath,
        }
      : undefined,
    status: inflictState
      ? {
          name: inflictState.name,
          magnitude: inflictState.magnitude ?? 1,
          description: inflictState.description(),
          iconPath: inflictState.iconPath,
        }
      : undefined,
  }
}
