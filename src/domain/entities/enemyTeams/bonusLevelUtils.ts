import type { Enemy } from '../Enemy'

export type EnemyFactoryWithLevel = (level: number) => Enemy

/**
 * ボーナスレベルをメンバー数に応じてランダム配分し、各メンバーのレベル値を返す。
 * - 基本レベルはすべて1とし、bonusLevels 回だけランダムに+1する。
 * - 同じ個体に複数回加算されることもある。
 */
export function buildMemberLevels(count: number, bonusLevels: number, rng: () => number = Math.random): number[] {
  const safeCount = Math.max(0, count)
  const safeBonus = Math.max(0, bonusLevels)
  const levels = Array.from({ length: safeCount }, () => 1)

  if (safeCount === 0) {
    return levels
  }

  for (let i = 0; i < safeBonus; i += 1) {
    const idx = Math.min(safeCount - 1, Math.max(0, Math.floor(rng() * safeCount)))
    levels[idx] = (levels[idx] ?? 1) + 1
  }

  return levels
}

/**
 * メンバーごとのレベルを算出し、対応するファクトリで Enemy を生成する。
 */
export function createMembersWithLevels(
  factories: EnemyFactoryWithLevel[],
  bonusLevels = 0,
  rng: () => number = Math.random,
): Enemy[] {
  const levels = buildMemberLevels(factories.length, bonusLevels, rng)
  return factories.map((factory, idx) => factory(levels[idx] ?? 1))
}
