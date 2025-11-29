import type { EnemyActionHint } from '@/types/battle'
import type { Battle } from './Battle'
import type { Enemy } from '../entities/Enemy'
import { Attack, Action as BattleAction, AllyBuffSkill } from '../entities/Action'
import { Damages } from '../entities/Damages'
import { SkipTurnAction } from '../entities/actions/SkipTurnAction'

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

  const calculatedDamages = new Damages({
    baseAmount: damages.baseAmount,
    baseCount: damages.baseCount,
    type: damages.type,
    attackerStates: enemy.getStates(),
    defenderStates: battle.player.getStates(battle),
  })

  return {
    title: action.name,
    type: 'attack',
    icon: '',
    pattern: {
      amount: damages.baseAmount,
      count: damages.baseCount,
      type: damages.type,
    },
    calculatedPattern: {
      amount: calculatedDamages.amount,
      count: calculatedDamages.count,
    },
    status: primaryState
      ? {
          name: primaryState.name,
          magnitude: primaryState.magnitude ?? 1,
          description: primaryState.description(),
        }
      : undefined,
    description: action.describe(),
  }
}

function buildSkillActionHint(battle: Battle, action: BattleAction): EnemyActionHint {
  const gainState = action.gainStatePreviews[0]
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
        }
      : undefined,
  }
}
