import { Battle } from '@/domain/battle/Battle'
import type { Actor, DamageEvent } from '@/domain/battle/Battle'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { Deck } from '@/domain/battle/Deck'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { Hand } from '@/domain/battle/Hand'
import { TurnManager } from '@/domain/battle/TurnManager'
import type { Enemy } from '@/domain/entities/Enemy'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { ProtagonistPlayer } from '@/domain/entities/players'
import type { State } from '@/domain/entities/State'
import type { DamageEffectType, DamageOutcome } from '@/domain/entities/Damages'
import type { CardId } from '@/domain/library/Library'
import { CardRepository } from '@/domain/repository/CardRepository'

export interface TestBattleOptions {
  enemies: Enemy[]
  playerHp?: { current: number; max?: number }
}

export function createTestBattle(options: TestBattleOptions): Battle {
  const player = new ProtagonistPlayer({
    currentHp: options.playerHp?.current ?? 150,
    maxHp: options.playerHp?.max ?? 150,
  })

  const enemyTeam = new EnemyTeam({
    id: 'test-team',
    members: options.enemies,
  })

  return new Battle({
    id: 'test-battle',
    player,
    enemyTeam,
    deck: new Deck(),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
    cardRepository: new CardRepository(),
  })
}

export function buildDamageEvent(params: {
  actionId?: CardId
  attacker: Actor | null
  defender: Actor
  damagePerHit: number
  hits?: number
  effectType?: DamageEffectType
}): DamageEvent {
  const hits = Math.max(1, params.hits ?? 1)
  const outcomes: DamageOutcome[] = Array.from({ length: hits }, () => ({
    damage: params.damagePerHit,
    effectType: params.effectType ?? 'test-damage',
  }))

  return {
    actionId: params.actionId ?? ('flurry' as CardId),
    attacker: params.attacker,
    defender: params.defender,
    outcomes,
    effectType: params.effectType,
  }
}

export function addStateToEnemy(battle: Battle, enemyId: number, state: State): void {
  const enemy = battle.enemyTeam.findEnemy(enemyId)
  if (!enemy) {
    throw new Error(`Enemy not found: ${enemyId}`)
  }
  enemy.addState(state, { battle })
}

export function addStateToPlayer(battle: Battle, state: State): void {
  battle.player.addState(state, { battle })
}
