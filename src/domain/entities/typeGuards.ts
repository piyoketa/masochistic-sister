import { Player } from './Player'
import { Enemy } from './Enemy'

export type CombatEntity = Player | Enemy

export function isPlayerEntity(entity: CombatEntity): entity is Player {
  return entity instanceof Player
}

export function isEnemyEntity(entity: CombatEntity): entity is Enemy {
  return entity instanceof Enemy
}
